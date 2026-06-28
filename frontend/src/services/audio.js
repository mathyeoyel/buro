import api from "./api";

export async function getAudioToken(roomId) {
  const response = await api.post(`/rooms/${roomId}/audio-token/`);
  return response.data.audio;
}
