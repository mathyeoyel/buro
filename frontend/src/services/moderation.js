import api from "./api";

export async function removeUser(roomId, userId, reason = "") {
  await api.post(`/rooms/${roomId}/remove-user/`, { user_id: userId, reason });
}

export async function blockUser(roomId, userId, reason = "") {
  await api.post(`/rooms/${roomId}/block-user/`, { user_id: userId, reason });
}

export async function createReport(payload) {
  const response = await api.post("/reports/", payload);
  return response.data.report;
}

export const REPORT_REASONS = [
  { value: "insults_or_harassment", label: "Insults or harassment" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "threats", label: "Threats" },
  { value: "exposing_private_information", label: "Private info" },
  { value: "sexual_content", label: "Sexual content" },
  { value: "spam", label: "Spam" },
  { value: "other", label: "Other" },
];

export function extractModerationError(error) {
  const data = error?.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  return "Something went wrong. Try again.";
}
