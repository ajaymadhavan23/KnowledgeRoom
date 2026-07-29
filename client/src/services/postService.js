import { api } from "./api.js";

export async function fetchPosts(params) {
  const { data } = await api.get("/posts", { params });
  return data;
}

export async function searchPosts(params) {
  const { data } = await api.get("/posts/search", { params });
  return data;
}

export async function fetchPost(id) {
  const { data } = await api.get(`/posts/${id}`);
  return data;
}

export async function likePost(id) {
  const { data } = await api.post(`/posts/${id}/like`);
  return data;
}

export async function viewPost(id) {
  const { data } = await api.post(`/posts/${id}/view`);
  return data;
}

export async function savePost(id) {
  const { data } = await api.post(`/posts/${id}/save`);
  return data;
}

export async function unpublishPost(id) {
  const { data } = await api.post(`/posts/${id}/unpublish`);
  return data;
}

export async function fetchMyPosts() {
  const { data } = await api.get("/posts/mine");
  return data;
}

export async function fetchComments(postId) {
  const { data } = await api.get(`/posts/${postId}/comments`);
  return data;
}

export async function createComment(postId, text) {
  const { data } = await api.post(`/posts/${postId}/comments`, { text });
  return data;
}

export async function deleteComment(id) {
  const { data } = await api.delete(`/comments/${id}`);
  return data;
}
