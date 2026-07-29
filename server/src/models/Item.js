import mongoose from "mongoose";

export const blockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["text", "heading", "heading2", "code", "link", "image", "list", "divider"],
      default: "text"
    },
    content: { type: String, default: "" },
    language: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { _id: true }
);

const itemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: "Folder", default: null },
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["note", "link", "code", "image", "mixed"],
      default: "mixed"
    },
    tags: [{ type: String, trim: true }],
    blocks: { type: [blockSchema], default: [] },
    isPublished: { type: Boolean, default: false },
    publishedPostId: { type: mongoose.Schema.Types.ObjectId, ref: "BlogPost", default: null },
    sourcePost: { type: mongoose.Schema.Types.ObjectId, ref: "BlogPost", default: null }
  },
  { timestamps: true }
);

itemSchema.index(
  { title: "text", tags: "text", "blocks.content": "text" },
  { default_language: "none", language_override: "searchLanguage" }
);
itemSchema.index({ owner: 1, folder: 1, updatedAt: -1 });

export const Item = mongoose.model("Item", itemSchema);
