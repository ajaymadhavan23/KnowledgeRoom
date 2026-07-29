import { api } from "./api.js";

export async function signup(payload) {
  const { data } = await api.post("/auth/signup", payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function updateMe(payload) {
  const { data } = await api.patch("/users/me", payload);
  return data;
}
