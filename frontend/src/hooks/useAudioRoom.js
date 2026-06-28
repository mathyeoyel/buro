import { useCallback, useEffect, useRef, useState } from "react";
import {
  isPermissionError,
  joinAgoraChannel,
  leaveAgoraChannel,
  publishMicrophone,
  unpublishMicrophone,
} from "../services/agoraClient";
import { getAudioToken } from "../services/audio";

function extractAudioError(err) {
  const data = err?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  return "Audio not available.";
}

/**
 * Audio hook — mock token fetch or real Agora channel join.
 * Mic publish follows Buro participant mute state (isMuted).
 */
export function useAudioRoom(roomId, { enabled = false, isMuted = true } = {}) {
  const [status, setStatus] = useState("idle");
  const [provider, setProvider] = useState(null);
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");

  const audioRef = useRef(null);
  const connectingRef = useRef(false);
  const isMutedRef = useRef(isMuted);

  isMutedRef.current = isMuted;

  const disconnect = useCallback(async () => {
    connectingRef.current = false;
    audioRef.current = null;
    await leaveAgoraChannel();
    setStatus("idle");
    setProvider(null);
    setToken(null);
    setError("");
  }, []);

  const syncMicState = useCallback(async (muted) => {
    if (audioRef.current?.provider !== "agora") return;

    try {
      if (muted) {
        await unpublishMicrophone();
      } else {
        await publishMicrophone();
        setStatus("connected");
        setError("");
      }
    } catch (err) {
      if (isPermissionError(err)) {
        setStatus("permission_denied");
        setError("Microphone permission denied.");
      } else {
        setStatus("error");
        setError("Audio not connected.");
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!roomId || !enabled || connectingRef.current) return;

    connectingRef.current = true;
    setStatus("connecting");
    setError("");

    try {
      const audio = await getAudioToken(roomId);
      audioRef.current = audio;
      setProvider(audio.provider);
      setToken(audio.token);

      if (audio.provider === "agora") {
        await joinAgoraChannel({
          appId: audio.app_id,
          channel: audio.room_name,
          token: audio.token,
          uid: audio.uid,
          onDisconnected: () => {
            setStatus("error");
            setError("Audio disconnected.");
          },
        });

        if (!isMutedRef.current) {
          try {
            await publishMicrophone();
          } catch (err) {
            if (isPermissionError(err)) {
              setStatus("permission_denied");
              setError("Microphone permission denied.");
              connectingRef.current = false;
              return;
            }
            throw err;
          }
        }
      }

      setStatus("connected");
    } catch (err) {
      setStatus("error");
      setError(extractAudioError(err));
      setProvider(null);
      setToken(null);
      audioRef.current = null;
      await leaveAgoraChannel();
    } finally {
      connectingRef.current = false;
    }
  }, [roomId, enabled]);

  useEffect(() => {
    if (!enabled) {
      disconnect();
      return undefined;
    }

    connect();
    return () => {
      leaveAgoraChannel();
    };
  }, [enabled, roomId, connect, disconnect]);

  useEffect(() => {
    if (provider !== "agora") return;
    if (status !== "connected" && status !== "permission_denied") return;
    syncMicState(isMuted);
  }, [isMuted, provider, status, syncMicState]);

  return { status, provider, token, error };
}

function audioStatusLabel(status, provider) {
  if (status === "connected") {
    return provider === "mock" ? "Mock audio ready" : "Audio ready";
  }
  if (status === "connecting") return "Connecting audio…";
  if (status === "permission_denied") return "Mic permission needed";
  if (status === "error") return "Audio not connected";
  return "Audio comes next";
}

export { audioStatusLabel };
