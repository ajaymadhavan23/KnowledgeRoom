import { Router } from "express";
import { createFolder, deleteFolder, getFolders, updateFolder } from "../controllers/folderController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/", getFolders);
router.post("/", createFolder);
router.patch("/:id", updateFolder);
router.delete("/:id", deleteFolder);

export default router;
