import { Router } from "express";
import { deactivatePost, getAdminPosts, getStats } from "../controllers/adminController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth, requireAdmin);
router.get("/stats", getStats);
router.get("/posts", getAdminPosts);
router.patch("/posts/:id/deactivate", deactivatePost);

export default router;
