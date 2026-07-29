import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    parentFolder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
    isSystemFolder: { type: Boolean, default: false }
  },
  { timestamps: true }
);

folderSchema.index({ owner: 1, parentFolder: 1, name: 1 });

export const Folder = mongoose.model("Folder", folderSchema);
