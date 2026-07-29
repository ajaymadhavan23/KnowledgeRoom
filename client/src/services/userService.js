import { api } from "./api.js";

export async function fetchUserProfile(id) {
  const { data } = await api.get(`/users/${id}`);
  return data;
}
