import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  event: string;
  room_id: string;
  temperature?: number;
  humidity?: number;
  occupancy?: boolean;
  light_state?: boolean;
  timestamp?: string;
  device_status?: 'CONNECTED' | 'OFFLINE';
  is_simulated?: boolean;
  mode?: string;
  command_status?: string;
  [key: string]: any;
}

export function useRoomWebSocket(roomId: string, onMessage?: (data: WebSocketMessage) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<any>(null);

  const connect = useCallback(() => {
    if (!roomId) return;

    // Use current host and protocol for WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/rooms/${roomId}`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (e) {
          // ignore non-json
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnection after 3 seconds
        reconnectTimerRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      reconnectTimerRef.current = setTimeout(() => {
        connect();
      }, 3000);
    }
  }, [roomId, onMessage]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendPing = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }
  }, []);

  return { isConnected, lastMessage, sendPing };
}
