import { api } from "./api.js";

export async function fetchNotifications() {
  const { data } = await api.get("/notifications");
  return data;
}

export async function fetchUnreadCount() {
  const { data } = await api.get("/notifications/unread-count");
  return data.count;
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch("/notifications/mark-all-read");
  return data;
}
