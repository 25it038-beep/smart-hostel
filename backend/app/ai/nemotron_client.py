import os
import json
from typing import List, Dict, Any, Generator
from openai import OpenAI

NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "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")
NEMOTRON_MODEL = "nvidia/nemotron-3.5-lightning-30b-a3b"

client = OpenAI(
    base_url=NVIDIA_BASE_URL,
    api_key=NVIDIA_API_KEY
)

SYSTEM_PROMPT_TEMPLATE = """You are the autonomous engineering AI copilot for the Smart Hostel Room Monitoring & Automatic Light Control System, powered by NVIDIA Nemotron 3.5 Lightning (30B) with deep reasoning.

Current Live Room Telemetry & Context:
- Room ID: {room_id}
- Temperature: {temperature}°C
- Humidity: {humidity}%
- Occupancy: {occupancy}
- Light Relay State: {light_state}
- Inactivity Timeout: {timeout_seconds}s
- Light Mode: {light_mode}

Hardware Architecture & Critical Safety Rules:
1. Microcontroller: ESP32 (WROOM-32)
2. Sensors: DHT22 (Pin 4) for Temperature/Humidity, HC-SR501 PIR (Pin 13) for Motion/Occupancy.
3. Actuator: 5V Relay Module (Pin 14, Active-High) controlling the room light.
4. ABSOLUTE CONSTRAINT: DO NOT use an LDR (light-dependent resistor). The light status is derived strictly from the relay pin state.
5. Autonomous Hardware Safety: If Wi-Fi or the server goes offline, the ESP32 firmware autonomously turns off the room light when the PIR sensor detects vacancy beyond the timeout duration.

Tone & Style:
- Highly intelligent, precise, engineering-focused, and concise.
- Format responses cleanly with GitHub-style markdown, structured bullet points, and code blocks when appropriate.
- When answering questions about telemetry, evaluate thermal comfort (e.g., dew point, mold risk) and energy efficiency.
"""

def generate_nemotron_stream(
    messages: List[Dict[str, str]], 
    room_context: Dict[str, Any]
) -> Generator[Dict[str, Any], None, None]:
    """Generator streaming chunks directly from NVIDIA Nemotron."""
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        room_id=room_context.get("room_id", "ROOM_01"),
        temperature=room_context.get("temperature", 24.5),
        humidity=room_context.get("humidity", 55.0),
        occupancy="OCCUPIED (Motion Detected)" if room_context.get("occupancy") else "VACANT",
        light_state="ON (Relay Closed)" if room_context.get("light_state") else "OFF (Relay Open)",
        timeout_seconds=room_context.get("timeout_seconds", 60),
        light_mode=room_context.get("light_mode", "AUTO"),
    )

    api_messages = [{"role": "system", "content": system_prompt}] + messages

    try:
        completion = client.chat.completions.create(
            model=NEMOTRON_MODEL,
            messages=api_messages,
            temperature=0.8,
            top_p=0.95,
            max_tokens=4096,
            extra_body={
                "chat_template_kwargs": {"enable_thinking": True},
                "reasoning_budget": 2048
            },
            stream=True
        )

        for chunk in completion:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            reasoning = getattr(delta, "reasoning_content", None)
            if reasoning:
                yield {"type": "reasoning", "text": reasoning}
            if delta.content is not None:
                yield {"type": "content", "text": delta.content}

        yield {"type": "done"}
    except Exception as e:
        yield {"type": "error", "error": str(e)}
