import { api } from "./api.js";

export async function fetchFolders() {
  const { data } = await api.get("/folders");
  return data;
}

export async function createFolder(payload) {
  const { data } = await api.post("/folders", payload);
  return data;
}

export async function updateFolder(id, payload) {
  const { data } = await api.patch(`/folders/${id}`, payload);
  return data;
}

export async function deleteFolder(id) {
  const { data } = await api.delete(`/folders/${id}`);
  return data;
}
