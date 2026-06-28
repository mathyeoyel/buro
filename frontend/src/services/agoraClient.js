import AgoraRTC from "agora-rtc-sdk-ng";

let client = null;
let audioTrack = null;

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

export async function joinAgoraChannel({
  appId,
  channel,
  token,
  uid,
  onConnectionStateChange,
}) {
  await leaveAgoraChannel();

  const rtcClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  rtcClient.on("connection-state-change", (curState, prevState) => {
    onConnectionStateChange?.(curState, prevState);
  });

  await rtcClient.join(appId, channel, token, uid);
  client = rtcClient;
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
}

export function isAgoraJoined() {
  return client !== null;
}

export { isPermissionError };
