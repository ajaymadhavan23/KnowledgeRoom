import axios from "axios";
import { BlogPost } from "../models/BlogPost.js";
import { Comment } from "../models/Comment.js";
import { Item } from "../models/Item.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

function normalizeTags(tags = []) {
  return [...new Set(tags.map((tag) => String(tag).trim()).filter(Boolean))];
}

function normalizeFolder(folder) {
  return folder || null;
}

function normalizeBlocks(blocks = []) {
  return blocks.map((block) => ({
    type: block.type || "text",
    content: block.content || "",
    language: block.type === "code" ? block.language || "plaintext" : undefined,
    meta: block.meta || {}
  }));
}

export async function getItems(req, res, next) {
  try {
    const { folderId } = req.query;
    const query = { owner: req.user._id };

    if (folderId === "root") query.folder = null;
    else if (folderId) query.folder = folderId;

    const items = await Item.find(query).sort({ updatedAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function getRecentItems(req, res, next) {
  try {
    const items = await Item.find({ owner: req.user._id }).sort({ updatedAt: -1 }).limit(8);
    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function searchItems(req, res, next) {
  try {
    const { q = "", tag = "", type = "" } = req.query;
    const query = { owner: req.user._id };

    if (q) query.$text = { $search: q };
    if (tag) query.tags = tag;
    if (type) query.type = type;

    const items = await Item.find(query).sort(q ? { score: { $meta: "textScore" } } : { updatedAt: -1 });
    res.json(items);
  } catch (error) {
    next(error);
  }
}

export async function getItem(req, res, next) {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user._id })
      .populate({ path: "sourcePost", select: "title author", populate: { path: "author", select: "name department" } });
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function createItem(req, res, next) {
  try {
    const item = await Item.create({
      owner: req.user._id,
      folder: normalizeFolder(req.body.folder),
      title: req.body.title || "Untitled",
      type: req.body.type || "mixed",
      tags: normalizeTags(req.body.tags),
      blocks: req.body.blocks?.length ? normalizeBlocks(req.body.blocks) : [{ type: "text", content: "" }]
    });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function updateItem(req, res, next) {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user._id });
    if (!item) return res.status(404).json({ message: "Item not found" });

    ["title", "type"].forEach((field) => {
      if (req.body[field] !== undefined) item[field] = req.body[field];
    });
    if (req.body.folder !== undefined) item.folder = normalizeFolder(req.body.folder);
    if (req.body.blocks !== undefined) item.blocks = normalizeBlocks(req.body.blocks);
    if (req.body.tags !== undefined) item.tags = normalizeTags(req.body.tags);

    await item.save();
    res.json(item);
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(req, res, next) {
  try {
    const item = await Item.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!item) return res.status(404).json({ message: "Item not found" });

    // Cascade-delete the published BlogPost + its comments & notifications
    if (item.publishedPostId) {
      await BlogPost.findByIdAndDelete(item.publishedPostId);
      await Comment.deleteMany({ post: item.publishedPostId });
      await Notification.deleteMany({ post: item.publishedPostId });
    }

    res.json({ message: "Item deleted" });
  } catch (error) {
    next(error);
  }
}

export async function publishItem(req, res, next) {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user._id });
    if (!item) return res.status(404).json({ message: "Item not found" });

    const post = await BlogPost.create({
      author: req.user._id,
      originalItem: item._id,
      title: item.title,
      excerpt: req.body.excerpt || item.blocks?.[0]?.content?.slice(0, 180) || "",
      tags: item.tags,
      blocks: item.blocks
    });

    item.isPublished = true;
    item.publishedPostId = post._id;
    await item.save();

    // Notify all other users that a new post was published
    const allUsers = await User.find(
      { _id: { $ne: req.user._id } },
      { _id: 1, email: 1, name: 1 }
    ).lean();

    if (allUsers.length > 0) {
      const notifications = allUsers.map((u) => ({
        recipient: u._id,
        type: "new_post",
        fromUser: req.user._id,
        post: post._id,
        isRead: false
      }));
      await Notification.insertMany(notifications, { ordered: false });
    }

    // Respond immediately — don't block on the webhook
    res.status(201).json(post);

    // Fire-and-forget: notify n8n to email all users about the new post
    if (process.env.N8N_WEBHOOK_URL && allUsers.length > 0) {
      const recipients = allUsers.map((u) => ({ email: u.email, name: u.name }));
      axios
        .post(process.env.N8N_WEBHOOK_URL, {
          postId: post._id.toString(),
          title: post.title,
          authorName: req.user.name,
          postUrl: `${process.env.CLIENT_URL}/blog/${post._id}`,
          recipients
        })
        .catch((err) => console.error("[n8n] Webhook failed:", err.message));
    }
  } catch (error) {
    next(error);
  }
}
