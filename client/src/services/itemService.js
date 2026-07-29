import { api } from "./api.js";

export async function fetchItems(folderId) {
  const params = folderId ? { folderId } : {};
  const { data } = await api.get("/items", { params });
  return data;
}

export async function fetchRecentItems() {
  const { data } = await api.get("/items/recent");
  return data;
}

export async function searchItems(params) {
  const { data } = await api.get("/items/search", { params });
  return data;
}

export async function fetchItem(id) {
  const { data } = await api.get(`/items/${id}`);
  return data;
}

export async function createItem(payload) {
  const { data } = await api.post("/items", payload);
  return data;
}

export async function updateItem(id, payload) {
  const { data } = await api.patch(`/items/${id}`, payload);
  return data;
}

export async function deleteItem(id) {
  const { data } = await api.delete(`/items/${id}`);
  return data;
}

export async function publishItem(id, payload) {
  const { data } = await api.post(`/items/${id}/publish`, payload);
  return data;
}
