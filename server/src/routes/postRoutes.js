import { Router } from "express";
import { createComment, getComments } from "../controllers/commentController.js";
import {
  getMyPosts,
  getPost,
  getPosts,
  registerView,
  savePost,
  searchPosts,
  toggleLike,
  unpublishPost
} from "../controllers/postController.js";
import { getSimilarPosts } from "../controllers/similarPostsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/mine", getMyPosts);
router.get("/search", searchPosts);
router.get("/", getPosts);
router.get("/:id", getPost);
router.post("/:id/unpublish", unpublishPost);
router.post("/:id/like", toggleLike);
router.post("/:id/view", registerView);
router.post("/:id/save", savePost);
router.get("/:id/similar", getSimilarPosts);
router.get("/:id/comments", getComments);
router.post("/:id/comments", createComment);

export default router;
