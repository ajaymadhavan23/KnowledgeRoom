import { Folder } from "../models/Folder.js";

export async function ensureSavedFolder(owner) {
  let folder = await Folder.findOne({ owner, isSystemFolder: true, name: "Saved from Community" });

  if (!folder) {
    folder = await Folder.create({
      owner,
      name: "Saved from Community",
      parentFolder: null,
      isSystemFolder: true
    });
  }

  return folder;
}

export function buildFolderTree(folders) {
  const map = new Map();
  const roots = [];

  folders.forEach((folder) => {
    const node = { ...folder.toObject(), children: [] };
    map.set(folder._id.toString(), node);
  });

  map.forEach((node) => {
    const parentId = node.parentFolder?.toString();
    if (parentId && map.has(parentId)) {
      map.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
