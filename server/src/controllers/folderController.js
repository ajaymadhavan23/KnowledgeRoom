import mongoose from "mongoose";
import { Folder } from "../models/Folder.js";
import { Item } from "../models/Item.js";
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

export async function deleteFolder(req, res, next) {
  const session = await mongoose.startSession();
  try {
    let folder;
    await session.withTransaction(async () => {
      folder = await Folder.findOne({ _id: req.params.id, owner: req.user._id }).session(session);
      if (!folder) return;
      if (folder.isSystemFolder) throw new Error("System folder cannot be deleted");

      await Item.updateMany({ owner: req.user._id, folder: folder._id }, { folder: null }).session(session);
      await Folder.updateMany({ owner: req.user._id, parentFolder: folder._id }, { parentFolder: null }).session(session);
      await Folder.deleteOne({ _id: folder._id }).session(session);
    });

    if (!folder) return res.status(404).json({ message: "Folder not found" });
    res.json({ message: "Folder deleted" });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
}
