export interface SensorReading {
  id?: number;
  room_id: string;
  device_id: string;
  temperature: number;
  humidity: number;
  occupancy: boolean;
  light_state: boolean;
  timestamp: string;
  is_simulated?: boolean;
}

export interface RoomSetting {
  room_id: string;
  light_mode: 'AUTO' | 'MANUAL';
  inactivity_timeout_sec: number;
  target_light_state: boolean;
  temperature_interval_sec: number;
  humidity_interval_sec: number;
  heartbeat_interval_sec: number;
  updated_at?: string;
}

export interface Room {
  id: number;
  room_id: string;
  name: string;
  created_at: string;
  device_status: 'CONNECTED' | 'OFFLINE';
  latest_reading?: SensorReading | null;
  settings?: RoomSetting | null;
}

export interface Device {
  id: number;
  device_id: string;
  room_id: string;
  ip_address: string;
  firmware_version: string;
  last_seen: string;
  status: 'CONNECTED' | 'OFFLINE';
  seconds_since_seen?: number;
}

export interface LightStateResponse {
  room_id: string;
  mode: 'AUTO' | 'MANUAL';
  light_state: boolean;
  inactivity_timeout_sec: number;
  command_status: 'ACKNOWLEDGED' | 'WAITING_FOR_ESP32' | 'PENDING_HARDWARE' | 'ESP32_OFFLINE';
  message: string;
  last_updated: string;
}

export interface AnalyticsSummary {
  room_id: string;
  timeframe: string;
  total_light_on_seconds: number;
  total_light_on_formatted: string;
  total_occupancy_seconds: number;
  total_occupancy_formatted: string;
  automatic_activations_count: number;
  manual_activations_count: number;
  avg_session_duration_seconds: number;
  avg_session_duration_formatted: string;
  readings_count: number;
  disclaimer: string;
}

export interface AIInsight {
  id: number;
  room_id: string;
  type: string;
  title: string;
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  created_at: string;
}

export interface HourlyProbability {
  hour: number;
  label: string;
  probability: number;
}

export interface ModelMetadata {
  engine: string;
  sample_count: number;
  confidence_pct: number;
  last_calibrated: string;
}

export interface AIInsightsReport {
  room_id: string;
  status: 'ready' | 'collecting_data';
  message: string;
  typical_occupancy_window: string | null;
  energy_efficiency_score?: number;
  energy_rating_grade?: string;
  estimated_energy_saved_pct?: number;
  thermal_comfort_status?: string;
  thermal_comfort_index?: number;
  dew_point_c?: number;
  recommended_timeout_sec?: number;
  recommended_timeout_reason?: string;
  hourly_occupancy_probabilities?: HourlyProbability[];
  model_metadata?: ModelMetadata | null;
  insights: AIInsight[];
  recommendations: string[];
}

export interface SimulationStatus {
  enabled: boolean;
  forced_motion: boolean | null;
  simulated_room_id: string;
  current_temperature: number;
  current_humidity: number;
  current_occupancy: boolean;
  current_light_state: boolean;
  source: string;
}
