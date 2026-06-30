import AgoraRTC from "agora-rtc-sdk-ng";

let client = null;
let audioTrack = null;

// Track remote uids we've already subscribed+played so we don't double-subscribe.
const subscribedUsers = new Set();
// Set true when a remote audioTrack.play() is blocked by browser autoplay policy.
let remotePlaybackBlocked = false;
let onRemotePlaybackBlockedCb = null;

function isPermissionError(error) {
  const name = error?.name || "";
  const message = (error?.message || "").toLowerCase();
  return (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    message.includes("permission") ||
    message.includes("not allowed")
  );
}

function playRemoteAudio(user) {
  if (!user?.audioTrack) return;
  try {
    user.audioTrack.play();
    console.debug("Agora remote audio playing", { uid: user.uid });
  } catch (err) {
    // Most likely autoplay blocked. Flag it so the UI can offer a tap-to-enable.
    remotePlaybackBlocked = true;
    onRemotePlaybackBlockedCb?.();
    console.debug("Agora remote audio playback blocked", {
      uid: user.uid,
      name: err?.name,
    });
  }
}

async function subscribeToRemoteAudio(user) {
  if (!client) return;
  try {
    await client.subscribe(user, "audio");
    console.debug("Agora subscribed to remote audio", { uid: user.uid });
    subscribedUsers.add(user.uid);
    playRemoteAudio(user);
  } catch (err) {
    console.debug("Agora subscribe failed", { uid: user.uid, name: err?.name });
  }
}

export async function joinAgoraChannel({
  appId,
  channel,
  token,
  uid,
  onConnectionStateChange,
  onRemotePlaybackBlocked,
}) {
  await leaveAgoraChannel();

  onRemotePlaybackBlockedCb = onRemotePlaybackBlocked || null;
  remotePlaybackBlocked = false;

  const rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

  rtcClient.on("connection-state-change", (curState, prevState) => {
    onConnectionStateChange?.(curState, prevState);
  });

  rtcClient.on("user-published", async (user, mediaType) => {
    if (mediaType !== "audio") return;
    console.debug("Agora remote user published", { uid: user.uid });
    await subscribeToRemoteAudio(user);
  });

  rtcClient.on("user-unpublished", (user, mediaType) => {
    if (mediaType && mediaType !== "audio") return;
    console.debug("Agora remote user unpublished", { uid: user.uid });
    subscribedUsers.delete(user.uid);
  });

  rtcClient.on("user-left", (user) => {
    console.debug("Agora remote user left", { uid: user.uid });
    subscribedUsers.delete(user.uid);
  });

  console.debug("Agora joining channel", { provider: "agora", channel, uid });
  await rtcClient.join(appId, channel, token, uid);
  client = rtcClient;

  // Subscribe to anyone already publishing audio before we joined.
  for (const user of rtcClient.remoteUsers) {
    if (user.hasAudio && !subscribedUsers.has(user.uid)) {
      console.debug("Agora existing remote user", { uid: user.uid });
      await subscribeToRemoteAudio(user);
    }
  }
}

/**
 * Re-attempt playback of all remote audio tracks. Call this from a user
 * gesture (e.g. "Tap to enable audio") to recover from blocked autoplay.
 */
export function enableRemoteAudio() {
  if (!client) return;
  remotePlaybackBlocked = false;
  for (const user of client.remoteUsers) {
    if (user.audioTrack) {
      playRemoteAudio(user);
    }
  }
}

export function isRemotePlaybackBlocked() {
  return remotePlaybackBlocked;
}

export async function publishMicrophone() {
  if (!client) {
    throw new Error("Not connected to Agora.");
  }

  if (!audioTrack) {
    audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
  }

  audioTrack.setEnabled(true);
  await client.publish([audioTrack]);
}

export async function unpublishMicrophone() {
  if (!client || !audioTrack) return;

  audioTrack.setEnabled(false);
  await client.unpublish([audioTrack]);
  audioTrack.close();
  audioTrack = null;
}

export async function leaveAgoraChannel() {
  if (audioTrack) {
    audioTrack.close();
    audioTrack = null;
  }
  if (client) {
    await client.leave();
    client = null;
  }
  subscribedUsers.clear();
  remotePlaybackBlocked = false;
  onRemotePlaybackBlockedCb = null;
}

export function isAgoraJoined() {
  return client !== null;
}

export { isPermissionError };
