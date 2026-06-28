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
  const enabledRef = useRef(enabled);
  const isMutedRef = useRef(isMuted);

  enabledRef.current = enabled;
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

  const handleConnectionState = useCallback((curState) => {
    if (!enabledRef.current) return;

    if (curState === "RECONNECTING") {
      setStatus("reconnecting");
    } else if (curState === "CONNECTED") {
      setStatus("connected");
      setError("");
    } else if (curState === "DISCONNECTED") {
      setStatus("error");
      setError("Audio disconnected.");
    }
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

  const retryMic = useCallback(async () => {
    if (audioRef.current?.provider !== "agora") return;
    if (isMutedRef.current) return;
    await syncMicState(false);
  }, [syncMicState]);

  const connect = useCallback(async () => {
    if (!roomId || !enabled || connectingRef.current) return;

    connectingRef.current = true;
    setStatus("connecting");
    setError("");

    try {
      const audio = await getAudioToken(roomId);
      if (!enabledRef.current) return;

      audioRef.current = audio;
      setProvider(audio.provider);
      setToken(audio.token);

      if (audio.provider === "agora") {
        await joinAgoraChannel({
          appId: audio.app_id,
          channel: audio.room_name,
          token: audio.token,
          uid: audio.uid,
          onConnectionStateChange: handleConnectionState,
        });

        if (!enabledRef.current) {
          await leaveAgoraChannel();
          return;
        }

        if (!isMutedRef.current) {
          try {
            await publishMicrophone();
          } catch (err) {
            if (isPermissionError(err)) {
              setStatus("permission_denied");
              setError("Microphone permission denied.");
              return;
            }
            throw err;
          }
        }
      }

      setStatus("connected");
    } catch (err) {
      if (!enabledRef.current) return;
      setStatus("error");
      setError(extractAudioError(err));
      setProvider(null);
      setToken(null);
      audioRef.current = null;
      await leaveAgoraChannel();
    } finally {
      connectingRef.current = false;
    }
  }, [roomId, enabled, handleConnectionState]);

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

  return { status, provider, token, error, disconnect, retryMic };
}

function audioStatusLabel(status, provider) {
  if (status === "connected") {
    return provider === "mock" ? "Mock audio ready" : "Audio ready";
  }
  if (status === "connecting") return "Connecting…";
  if (status === "reconnecting") return "Reconnecting…";
  if (status === "permission_denied") return "Allow mic to talk";
  if (status === "error") return "Audio not connected";
  return "Getting ready…";
}

function canUseMicToggle({ isParticipant, isEnded, provider, status }) {
  if (!isParticipant || isEnded) return false;
  if (provider === "mock") return true;
  if (provider === "agora") {
    return status === "connected" || status === "permission_denied";
  }
  return status === "connected";
}

export { audioStatusLabel, canUseMicToggle };
