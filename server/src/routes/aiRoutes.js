import { Router } from "express";
import { createBlogDraft } from "../controllers/aiController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.post("/blog-draft", createBlogDraft);

export default router;
