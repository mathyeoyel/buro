import { useCallback, useEffect, useRef, useState } from "react";
import { getAudioToken } from "../services/audio";

/**
 * Placeholder audio hook — fetches provider token but does not connect to real audio yet.
 */
export function useAudioRoom(roomId, { enabled = false } = {}) {
  const [status, setStatus] = useState("idle");
  const [provider, setProvider] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const fetchedRef = useRef(false);

  const connect = useCallback(async () => {
    if (!roomId || !enabled) return;

    setStatus("connecting");
    setError("");
    try {
      const audio = await getAudioToken(roomId);
      setProvider(audio.provider);
      setToken(audio.token);
      setStatus("connected");
    } catch (err) {
      setStatus("error");
      setError(err?.response?.data?.detail || "Audio not available.");
      setProvider(null);
      setToken(null);
    }
  }, [roomId, enabled]);

  useEffect(() => {
    if (!enabled) {
      fetchedRef.current = false;
      setStatus("idle");
      setProvider(null);
      setToken(null);
      setError("");
      return;
    }

    if (fetchedRef.current) return;
    fetchedRef.current = true;
    connect();
  }, [enabled, connect]);

  return { status, provider, token, error };
}

function audioStatusLabel(status, provider) {
  if (status === "connected" && provider === "mock") return "Mock audio ready";
  if (status === "connecting") return "Connecting audio…";
  if (status === "error") return "Audio not connected";
  if (status === "idle") return "Audio comes next";
  return "Audio comes next";
}

export { audioStatusLabel };
