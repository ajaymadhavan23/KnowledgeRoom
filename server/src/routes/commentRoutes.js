import { Router } from "express";
import { deleteComment } from "../controllers/commentController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.delete("/:id", deleteComment);

export default router;
