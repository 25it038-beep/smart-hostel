/*
 * =========================================================================================
 * SMART HOSTEL ROOM MONITORING & AUTOMATIC LIGHT CONTROL SYSTEM
 * Production ESP32 Firmware
 * 
 * Hardware Prototype:
 * - ESP32 Dev Module
 * - DHT22 / DHT11 Temperature & Humidity Sensor
 * - HC-SR501 PIR Motion Sensor
 * - Single-channel 5V/3.3V Relay Module (Controlling low-voltage LED)
 * - Optional Onboard Status LED
 * 
 * Safety & Offline Resilience:
 * - Automatic PIR motion & relay timeout runs completely INDEPENDENT of Wi-Fi or backend.
 * - Non-blocking timing using millis() throughout. No long blocking delays.
 * - Auto-reconnect for Wi-Fi and graceful HTTP failover.
 * =========================================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ========================== PIN CONFIGURATION ==========================
#define DHT_PIN          4        // GPIO4 connected to DHT22 DATA pin
#define PIR_PIN          13       // GPIO13 connected to HC-SR501 OUT pin
#define RELAY_PIN        14       // GPIO14 connected to Relay Module IN pin
#define STATUS_LED_PIN   2        // Built-in blue LED for connectivity status

// DHT Type: Change to DHT11 if using DHT11 instead of DHT22
#define DHT_TYPE         DHT22

// Relay logic: Most relay modules are Active LOW (LOW turns relay ON, HIGH turns it OFF)
// Set to HIGH if your relay module is Active HIGH.
#define RELAY_ON_LEVEL   LOW
#define RELAY_OFF_LEVEL  HIGH

// ========================== DEVICE CONFIGURATION =======================
const char* DEVICE_ID       = "ESP32_ROOM_01";
const char* ROOM_ID         = "ROOM_01";
const char* FIRMWARE_VER    = "v1.0.0";

// Wi-Fi Configuration (Replace with your hostel/local Wi-Fi credentials)
const char* WIFI_SSID       = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD   = "YOUR_WIFI_PASSWORD";

// Backend API URL:
// Cloud Deployed Render Backend: "https://smart-hostel-et9z.onrender.com"
// Local Dev Alternative:         "http://192.168.0.102:8000"
const char* BACKEND_BASE_URL = "https://smart-hostel-et9z.onrender.com";

// ========================== TIMING INTERVALS (ms) ======================
const unsigned long SENSOR_INTERVAL_MS    = 5000;    // Post telemetry every 5 seconds
const unsigned long HEARTBEAT_INTERVAL_MS = 10000;   // Post heartbeat every 10 seconds
const unsigned long COMMAND_POLL_MS       = 3000;    // Check for manual commands every 3s
const unsigned long WIFI_RETRY_MS         = 10000;   // Retry connecting if disconnected

// ========================== GLOBAL STATE ===============================
DHT dht(DHT_PIN, DHT_TYPE);

// Operating Mode: "AUTO" (PIR occupancy controlled) or "MANUAL" (dashboard override)
String operatingMode = "AUTO";

// Inactivity timeout: time to wait after motion ceases before switching light OFF (in ms)
unsigned long inactivityTimeoutMs = 60000; // Default 60 seconds (Configurable: 30s, 60s, 90s, 120s)

// Tracking variables
bool currentOccupancy  = false;
bool currentLightState = false; // Relay command state: true = ON, false = OFF
float currentTemp      = 0.0;
float currentHumidity  = 0.0;

unsigned long lastMotionTime     = 0;
unsigned long lastSensorPostTime = 0;
unsigned long lastHeartbeatTime  = 0;
unsigned long lastCommandPoll    = 0;
unsigned long lastWiFiRetry      = 0;

// Debounce for PIR
int lastPirRead = LOW;

// ========================== RELAY CONTROL ==============================
void setRelayState(bool turnOn, const char* reason) {
  if (currentLightState != turnOn) {
    currentLightState = turnOn;
    digitalWrite(RELAY_PIN, turnOn ? RELAY_ON_LEVEL : RELAY_OFF_LEVEL);
    Serial.printf("[RELAY] State changed to %s | Reason: %s\n", turnOn ? "ON" : "OFF", reason);
  }
}

// ========================== OFFLINE AUTOMATION =========================
void handleOccupancyAndLight() {
  int pirState = digitalRead(PIR_PIN);
  unsigned long now = millis();

  // Motion detected
  if (pirState == HIGH) {
    lastMotionTime = now;
    if (!currentOccupancy) {
      currentOccupancy = true;
      Serial.println("[PIR] Motion detected! Room OCCUPIED.");
    }
    
    // In AUTO mode, turn light ON immediately upon motion
    if (operatingMode == "AUTO") {
      setRelayState(true, "MOTION_DETECTED");
    }
  } else {
    // No motion currently being sensed on PIR pin
    // Check if inactivity timeout has elapsed
    if (currentOccupancy && (now - lastMotionTime >= inactivityTimeoutMs)) {
      currentOccupancy = false;
      Serial.println("[PIR] Inactivity timeout elapsed. Room EMPTY.");

      // In AUTO mode, turn light OFF when timeout expires
      if (operatingMode == "AUTO") {
        setRelayState(false, "INACTIVITY_TIMEOUT");
      }
    }
  }
}

// ========================== SENSOR READING =============================
void readDHTSensor() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();

  if (!isnan(t) && !isnan(h)) {
    currentTemp = t;
    currentHumidity = h;
  } else {
    Serial.println("[DHT] Warning: Failed to read from DHT sensor! Retaining previous reading.");
  }
}

// ========================== NETWORK & HTTP =============================
bool beginHttp(HTTPClient& http, WiFiClientSecure& secureClient, const String& url) {
  if (url.startsWith("https://")) {
    secureClient.setInsecure();
    return http.begin(secureClient, url);
  } else {
    return http.begin(url);
  }
}

void postSensorData() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  WiFiClientSecure secureClient;
  String url = String(BACKEND_BASE_URL) + "/api/sensors/data";
  beginHttp(http, secureClient, url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["device_id"]   = DEVICE_ID;
  doc["room_id"]     = ROOM_ID;
  doc["temperature"] = round(currentTemp * 10) / 10.0;
  doc["humidity"]    = round(currentHumidity * 10) / 10.0;
  doc["occupancy"]   = currentOccupancy;
  doc["light_state"] = currentLightState;

  String jsonBody;
  serializeJson(doc, jsonBody);

  int httpCode = http.POST(jsonBody);
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
      // Data posted successfully
    } else {
      Serial.printf("[HTTP] POST sensor data response code: %d\n", httpCode);
    }
  } else {
    Serial.printf("[HTTP] Sensor POST failed, error: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void postHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  WiFiClientSecure secureClient;
  String url = String(BACKEND_BASE_URL) + "/api/devices/heartbeat";
  beginHttp(http, secureClient, url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["device_id"]        = DEVICE_ID;
  doc["room_id"]          = ROOM_ID;
  doc["ip_address"]       = WiFi.localIP().toString();
  doc["firmware_version"] = FIRMWARE_VER;
  doc["rssi"]             = WiFi.RSSI();
  doc["free_heap"]        = ESP.getFreeHeap();

  String jsonBody;
  serializeJson(doc, jsonBody);

  int httpCode = http.POST(jsonBody);
  if (httpCode > 0) {
    // Heartbeat received
  } else {
    Serial.printf("[HTTP] Heartbeat failed, error: %s\n", http.errorToString(httpCode).c_str());
  }
  http.end();
}

void pollCommands() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  WiFiClientSecure secureClient;
  String url = String(BACKEND_BASE_URL) + "/api/rooms/" + String(ROOM_ID) + "/command";
  beginHttp(http, secureClient, url);

  int httpCode = http.GET();
  if (httpCode == HTTP_CODE_OK) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (!error) {
      // Update operating mode
      if (doc.containsKey("mode")) {
        String newMode = doc["mode"].as<String>();
        if (newMode != operatingMode) {
          operatingMode = newMode;
          Serial.printf("[MODE] Switched to %s mode\n", operatingMode.c_str());
        }
      }

      // Update inactivity timeout if configured from dashboard
      if (doc.containsKey("inactivity_timeout_sec")) {
        unsigned long newTimeoutSec = doc["inactivity_timeout_sec"].as<unsigned long>();
        if (newTimeoutSec >= 10 && newTimeoutSec <= 600) {
          inactivityTimeoutMs = newTimeoutSec * 1000UL;
        }
      }

      // Handle manual light commands if in MANUAL mode
      if (operatingMode == "MANUAL" && doc.containsKey("target_light_state")) {
        bool targetState = doc["target_light_state"].as<bool>();
        setRelayState(targetState, "MANUAL_COMMAND");
      }
    }
  }
  http.end();
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(STATUS_LED_PIN, LOW); // LED OFF when disconnected
    unsigned long now = millis();
    if (now - lastWiFiRetry >= WIFI_RETRY_MS) {
      lastWiFiRetry = now;
      Serial.println("[WIFI] Attempting Wi-Fi reconnection...");
      WiFi.disconnect();
      WiFi.reconnect();
    }
  } else {
    digitalWrite(STATUS_LED_PIN, HIGH); // LED ON when connected
  }
}

// ========================== SERIAL JSON & COMMAND INTERFACE =============
void handleSerialCommands() {
  if (Serial.available() > 0) {
    String input = Serial.readStringUntil('\n');
    input.trim();
    if (input.length() == 0) return;

    StaticJsonDocument<256> doc;
    DeserializationError err = deserializeJson(doc, input);

    if (!err) {
      if (doc.containsKey("cmd")) {
        String cmd = doc["cmd"].as<String>();
        if (cmd == "LIGHT_ON") {
          operatingMode = "MANUAL";
          setRelayState(true, "SERIAL_COMMAND");
          Serial.println("{\"status\":\"ok\",\"relay\":true,\"mode\":\"MANUAL\"}");
        } else if (cmd == "LIGHT_OFF") {
          operatingMode = "MANUAL";
          setRelayState(false, "SERIAL_COMMAND");
          Serial.println("{\"status\":\"ok\",\"relay\":false,\"mode\":\"MANUAL\"}");
        } else if (cmd == "SET_MODE") {
          operatingMode = doc["mode"].as<String>();
          Serial.printf("{\"status\":\"ok\",\"mode\":\"%s\"}\n", operatingMode.c_str());
        } else if (cmd == "SET_TIMEOUT") {
          inactivityTimeoutMs = doc["timeout_sec"].as<unsigned long>() * 1000UL;
          Serial.printf("{\"status\":\"ok\",\"timeout_ms\":%lu}\n", inactivityTimeoutMs);
        } else if (cmd == "PING") {
          Serial.println("{\"status\":\"pong\",\"device\":\"ESP32_ROOM_01\",\"wifi\":true}");
        }
      }
    }
  }
}

void printSerialTelemetry() {
  StaticJsonDocument<192> doc;
  doc["type"]        = "telemetry";
  doc["device_id"]   = DEVICE_ID;
  doc["temperature"] = round(currentTemp * 10) / 10.0;
  doc["humidity"]    = round(currentHumidity * 10) / 10.0;
  doc["occupancy"]   = currentOccupancy;
  doc["light_state"] = currentLightState;
  doc["mode"]        = operatingMode;

  String out;
  serializeJson(doc, out);
  Serial.println(out);
}

// ========================== ARDUINO SETUP ==============================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n=======================================================");
  Serial.println("  SMART HOSTEL ROOM MONITOR & LIGHT CONTROL SYSTEM");
  Serial.println("  Firmware Version: " + String(FIRMWARE_VER));
  Serial.println("=======================================================");

  // Pin modes
  pinMode(PIR_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);

  // Initialize relay to OFF
  digitalWrite(RELAY_PIN, RELAY_OFF_LEVEL);
  digitalWrite(STATUS_LED_PIN, LOW);

  // Initialize DHT sensor
  dht.begin();
  Serial.println("[DHT] Sensor initialized.");

  // Wi-Fi Connection
  Serial.printf("[WIFI] Connecting to %s...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  // Quick initial non-blocking attempt (5 seconds max so startup is not halted)
  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 5000) {
    delay(250);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected successfully!");
    Serial.print("[WIFI] IP Address: ");
    Serial.println(WiFi.localIP());
    digitalWrite(STATUS_LED_PIN, HIGH);
  } else {
    Serial.println("\n[WIFI] Initial Wi-Fi connection timed out. System will continue offline safely.");
  }
}

// ========================== MAIN LOOP ==================================
void loop() {
  unsigned long now = millis();

  // 1. Check Wi-Fi state without halting loop
  checkWiFiConnection();

  // 2. Process any incoming WebSerial commands from USB connection
  handleSerialCommands();

  // 3. CRITICAL: Handle occupancy detection & local relay timer independently
  //    This logic runs even if Wi-Fi is disconnected or backend is down!
  handleOccupancyAndLight();

  // 4. Periodic DHT reading
  static unsigned long lastDhtRead = 0;
  if (now - lastDhtRead >= 2000) {
    lastDhtRead = now;
    readDHTSensor();
  }

  // 5. Periodic Telemetry POST to FastAPI
  if (now - lastSensorPostTime >= SENSOR_INTERVAL_MS) {
    lastSensorPostTime = now;
    postSensorData();
    printSerialTelemetry(); // Also echo over Serial for browser WebSerial monitor
  }

  // 6. Periodic Heartbeat POST
  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = now;
    postHeartbeat();
  }

  // 7. Periodic Command Polling from backend
  if (now - lastCommandPoll >= COMMAND_POLL_MS) {
    lastCommandPoll = now;
    pollCommands();
  }

  // Small 20ms yield for watchdog and power stability
  delay(20);
}
