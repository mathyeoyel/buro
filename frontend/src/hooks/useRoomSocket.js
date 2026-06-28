import { useCallback, useEffect, useRef } from "react";
import { getStoredToken } from "../services/auth";

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || "ws://localhost:8000";
const RECONNECT_MS = 3000;

/**
 * Connect to a room WebSocket. Authenticates via ?token= query param.
 */
export function useRoomSocket(roomId, { enabled = true, onEvent } = {}) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const disconnect = useCallback(() => {
    clearTimeout(reconnectRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    const token = getStoredToken();
    if (!enabled || !roomId || !token) return;

    disconnect();

    const url = `${WS_BASE}/ws/rooms/${roomId}/?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onEventRef.current?.(data);
      } catch {
        // Ignore malformed messages.
      }
    };

    ws.onclose = () => {
      if (enabled && getStoredToken()) {
        reconnectRef.current = setTimeout(connect, RECONNECT_MS);
      }
    };

    ws.onerror = () => ws.close();
  }, [roomId, enabled, disconnect]);

  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }
    return disconnect;
  }, [enabled, connect, disconnect]);
}
