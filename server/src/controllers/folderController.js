import mongoose from "mongoose";
import { BlogPost } from "../models/BlogPost.js";
import { Comment } from "../models/Comment.js";
import { Folder } from "../models/Folder.js";
import { Item } from "../models/Item.js";
import { Notification } from "../models/Notification.js";
import { buildFolderTree } from "../utils/folders.js";

export async function getFolders(req, res, next) {
  try {
    const folders = await Folder.find({ owner: req.user._id }).sort({ name: 1 });
    res.json({ folders, tree: buildFolderTree(folders) });
  } catch (error) {
    next(error);
  }
}

export async function createFolder(req, res, next) {
  try {
    const { name, parentFolder = null } = req.body;
    const folder = await Folder.create({ owner: req.user._id, name, parentFolder });
    res.status(201).json(folder);
  } catch (error) {
    next(error);
  }
}

export async function updateFolder(req, res, next) {
  try {
    const { name, parentFolder } = req.body;
    const folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id });

    if (!folder) return res.status(404).json({ message: "Folder not found" });
    if (folder.isSystemFolder && parentFolder !== undefined) {
      return res.status(400).json({ message: "System folder cannot be moved" });
    }

    if (name) folder.name = name;
    if (parentFolder !== undefined) folder.parentFolder = parentFolder || null;
    await folder.save();
    res.json(folder);
  } catch (error) {
    next(error);
  }
}

/**
 * Recursively collect the IDs of a folder and all its descendant sub-folders
 * that are owned by the given user.
 */
async function collectDescendantFolderIds(rootId, ownerId) {
  const allIds = [rootId];
  const queue = [rootId];

  while (queue.length) {
    const parentId = queue.shift();
    const children = await Folder.find(
      { owner: ownerId, parentFolder: parentId },
      { _id: 1 }
    ).lean();

    for (const child of children) {
      allIds.push(child._id);
      queue.push(child._id);
    }
  }

  return allIds;
}

export async function deleteFolder(req, res, next) {
  const session = await mongoose.startSession();
  try {
    let found = false;

    await session.withTransaction(async () => {
      const folder = await Folder.findOne(
        { _id: req.params.id, owner: req.user._id },
        null,
        { session }
      );
      if (!folder) return;
      if (folder.isSystemFolder) throw new Error("System folder cannot be deleted");
      found = true;

      // ── 1. Collect this folder + all nested sub-folders ───────────────────
      const folderIds = await collectDescendantFolderIds(folder._id, req.user._id);

      // ── 2. Find every item that lives inside any of those folders ──────────
      const items = await Item.find(
        { owner: req.user._id, folder: { $in: folderIds } },
        { _id: 1, publishedPostId: 1 },
        { session }
      ).lean();

      const publishedPostIds = items
        .map((i) => i.publishedPostId)
        .filter(Boolean);

      // ── 3. Cascade-delete published blog posts + their comments/notifs ─────
      if (publishedPostIds.length) {
        await BlogPost.deleteMany({ _id: { $in: publishedPostIds } }).session(session);
        await Comment.deleteMany({ post: { $in: publishedPostIds } }).session(session);
        await Notification.deleteMany({ post: { $in: publishedPostIds } }).session(session);
      }

      // ── 4. Delete all items that belonged to these folders ─────────────────
      const itemIds = items.map((i) => i._id);
      if (itemIds.length) {
        await Item.deleteMany({ _id: { $in: itemIds } }).session(session);
      }

      // ── 5. Delete all the folders (root + descendants) ────────────────────
      await Folder.deleteMany({ _id: { $in: folderIds } }).session(session);
    });

    if (!found) return res.status(404).json({ message: "Folder not found" });
    res.json({ message: "Folder deleted" });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
}
