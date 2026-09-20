import {
  Room,
  SensorReading,
  Device,
  LightStateResponse,
  RoomSetting,
  AnalyticsSummary,
  AIInsightsReport,
  SimulationStatus,
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

export const api = {
  // Rooms
  async getRooms(): Promise<Room[]> {
    const res = await fetch(`${API_BASE}/rooms`);
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
  },

  async getRoom(roomId: string): Promise<Room> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}`);
    if (!res.ok) throw new Error(`Failed to fetch room ${roomId}`);
    return res.json();
  },

  async createRoom(roomId: string, name: string): Promise<Room> {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ room_id: roomId, name }),
    });
    if (!res.ok) throw new Error('Failed to create room');
    return res.json();
  },

  // Sensors
  async getLatestSensor(roomId: string): Promise<SensorReading | null> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/sensors/latest`);
    if (!res.ok) throw new Error('Failed to fetch latest sensors');
    return res.json();
  },

  async getSensorHistory(roomId: string, limit = 100): Promise<SensorReading[]> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/sensors/history?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch sensor history');
    return res.json();
  },

  // Devices
  async getDevices(): Promise<Device[]> {
    const res = await fetch(`${API_BASE}/devices`);
    if (!res.ok) throw new Error('Failed to fetch devices');
    return res.json();
  },

  async getDevice(deviceId: string): Promise<Device> {
    const res = await fetch(`${API_BASE}/devices/${deviceId}`);
    if (!res.ok) throw new Error(`Failed to fetch device ${deviceId}`);
    return res.json();
  },

  async getNetworkInfo(): Promise<{
    primary_ip: string;
    detected_ips: string[];
    port: number;
    api_base_url: string;
    ws_base_url: string;
    endpoints: Record<string, string>;
  }> {
    const res = await fetch(`${API_BASE}/devices/network-info`);
    if (!res.ok) throw new Error('Failed to fetch network info');
    return res.json();
  },

  // Light Control
  async getLightState(roomId: string): Promise<LightStateResponse> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/light`);
    if (!res.ok) throw new Error('Failed to fetch light state');
    return res.json();
  },

  async sendLightCommand(
    roomId: string,
    mode?: 'AUTO' | 'MANUAL',
    state?: boolean
  ): Promise<LightStateResponse> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/light`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, state }),
    });
    if (!res.ok) throw new Error('Failed to dispatch light command');
    return res.json();
  },

  async updateRoomSettings(
    roomId: string,
    settings: Partial<RoomSetting>
  ): Promise<RoomSetting> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (!res.ok) throw new Error('Failed to update room settings');
    return res.json();
  },

  // Analytics & AI
  async getAnalytics(roomId: string, timeframe = 'today'): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/analytics?timeframe=${timeframe}`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  async getAIInsights(roomId: string): Promise<AIInsightsReport> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/ai-insights`);
    if (!res.ok) throw new Error('Failed to fetch AI insights');
    return res.json();
  },

  // Simulation
  async getSimulationStatus(): Promise<SimulationStatus> {
    const res = await fetch(`${API_BASE}/simulation/status`);
    if (!res.ok) throw new Error('Failed to fetch simulation status');
    return res.json();
  },

  async toggleSimulation(
    enabled: boolean,
    roomId = 'ROOM_01',
    seedHistory = false
  ): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, room_id: roomId, seed_history: seedHistory }),
    });
    if (!res.ok) throw new Error('Failed to toggle simulation');
    return res.json();
  },

  async triggerMotion(): Promise<any> {
    const res = await fetch(`${API_BASE}/simulation/trigger-motion`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to trigger simulated motion');
    return res.json();
  },

  // NVIDIA Nemotron AI Copilot
  async getAIModels(): Promise<any> {
    const res = await fetch(`${API_BASE}/ai/models`);
    if (!res.ok) throw new Error('Failed to fetch AI models');
    return res.json();
  },

  async streamAIChat(
    messages: { role: string; content: string }[],
    roomId: string,
    onReasoning: (chunk: string) => void,
    onContent: (chunk: string) => void,
    onDone: () => void,
    onError: (err: string) => void,
    imageUrl?: string
  ): Promise<void> {
    try {
      const res = await fetch(`${API_BASE}/ai/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, room_id: roomId, image_url: imageUrl }),
      });

      if (!res.ok) {
        throw new Error(`AI Streaming failed with status ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Response body is not readable');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            if (!dataStr) continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'reasoning') {
                onReasoning(parsed.text);
              } else if (parsed.type === 'content') {
                onContent(parsed.text);
              } else if (parsed.type === 'done') {
                onDone();
                return;
              } else if (parsed.type === 'error') {
                onError(parsed.error);
                return;
              }
            } catch (e) {
              console.warn('Failed to parse SSE payload:', dataStr);
            }
          }
        }
      }
      onDone();
    } catch (err: any) {
      onError(err.message || 'Stream connection failed');
    }
  },
};
