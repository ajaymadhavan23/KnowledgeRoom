import { Router } from "express";
import { getProfile, updateMe } from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.patch("/me", updateMe);
router.get("/:id", getProfile);

export default router;
