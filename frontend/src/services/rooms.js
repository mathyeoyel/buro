import api from "./api";

export async function getLiveRooms() {
  const response = await api.get("/rooms/live/");
  return response.data.rooms;
}

export async function startRoom(payload = {}) {
  const response = await api.post("/rooms/start/", payload);
  return response.data.room;
}

export async function getRoom(roomId) {
  const response = await api.get(`/rooms/${roomId}/`);
  return response.data.room;
}

export async function joinRoom(roomId) {
  const response = await api.post(`/rooms/${roomId}/join/`);
  return response.data.room;
}

export async function leaveRoom(roomId) {
  await api.post(`/rooms/${roomId}/leave/`);
}

export async function endRoom(roomId) {
  const response = await api.post(`/rooms/${roomId}/end/`);
  return response.data.room;
}

export async function updateRoom(roomId, payload) {
  const response = await api.patch(`/rooms/${roomId}/`, payload);
  return response.data.room;
}

export function extractRoomError(error) {
  const data = error?.response?.data;
  if (!data) return "Something went wrong. Try again.";
  if (typeof data.detail === "string") return data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey && Array.isArray(data[firstKey])) return data[firstKey][0];
  return "Something went wrong. Try again.";
}
