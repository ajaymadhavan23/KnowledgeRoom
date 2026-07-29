import { Router } from "express";
import {
  createItem,
  deleteItem,
  getItem,
  getItems,
  getRecentItems,
  publishItem,
  searchItems,
  updateItem
} from "../controllers/itemController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);
router.get("/recent", getRecentItems);
router.get("/search", searchItems);
router.get("/", getItems);
router.get("/:id", getItem);
router.post("/", createItem);
router.patch("/:id", updateItem);
router.delete("/:id", deleteItem);
router.post("/:id/publish", publishItem);

export default router;
