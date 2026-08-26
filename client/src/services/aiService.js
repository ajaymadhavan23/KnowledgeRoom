import { api } from "./api.js";

export async function generateBlogDraft(payload) {
  const { data } = await api.post("/ai/blog-draft", payload);
  return data;
}
