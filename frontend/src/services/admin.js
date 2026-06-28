import api from "./api";

export async function getAdminReports() {
  const response = await api.get("/admin/reports/");
  return response.data.reports;
}

export async function updateReportStatus(reportId, status) {
  const response = await api.patch(`/admin/reports/${reportId}/`, { status });
  return response.data.report;
}

export async function getAdminLiveRooms() {
  const response = await api.get("/admin/live-rooms/");
  return response.data.rooms;
}

export async function adminEndRoom(roomId) {
  const response = await api.post(`/admin/rooms/${roomId}/end/`);
  return response.data.room;
}

export async function adminSuspendUser(userId, reason = "") {
  const response = await api.post(`/admin/users/${userId}/suspend/`, { reason });
  return response.data;
}

export async function adminUnsuspendUser(userId) {
  const response = await api.post(`/admin/users/${userId}/unsuspend/`);
  return response.data;
}
