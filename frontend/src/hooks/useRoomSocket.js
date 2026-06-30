import { useCallback, useEffect, useRef } from "react";
import { getStoredToken } from "../services/auth";
import { WS_BASE_URL } from "../config/env";

const RECONNECT_MS = 3000;

/**
 * Connect to a room WebSocket. Authenticates via ?token= query param.
 *
 * Pass `enabled: false` (e.g. when the room has ended or the current user was
 * removed/blocked) to close the socket intentionally and stop reconnecting.
 */
export function useRoomSocket(roomId, { enabled = true, onEvent } = {}) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  // Tracks whether reconnects are currently allowed. Set to false on any
  // intentional close so a late `onclose` can't schedule a reconnect.
  const shouldReconnectRef = useRef(enabled);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    clearTimeout(reconnectRef.current);
    reconnectRef.current = null;
    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      ws.onclose = null;
      ws.onerror = null;
      ws.onmessage = null;
      ws.close();
    }
  }, []);

  const connect = useCallback(() => {
    const token = getStoredToken();
    if (!enabled || !roomId || !token) return;

    shouldReconnectRef.current = true;
    disconnect();
    shouldReconnectRef.current = true;

    const url = `${WS_BASE_URL}/ws/rooms/${roomId}/?token=${encodeURIComponent(token)}`;
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
      if (shouldReconnectRef.current && getStoredToken()) {
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
