import { api } from "./api.js";

export async function fetchAdminStats() {
  const { data } = await api.get("/admin/stats");
  return data;
}

export async function fetchAdminPosts() {
  const { data } = await api.get("/admin/posts");
  return data;
}

export async function deactivatePost(id) {
  const { data } = await api.patch(`/admin/posts/${id}/deactivate`);
  return data;
}
