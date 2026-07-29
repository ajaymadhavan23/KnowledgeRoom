import mongoose from "mongoose";
import { blockSchema } from "./Item.js";

const blogPostSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalItem: { type: mongoose.Schema.Types.ObjectId, ref: "Item", default: null },
    title: { type: String, required: true, trim: true },
    excerpt: { type: String, default: "", trim: true },
    tags: [{ type: String, trim: true }],
    blocks: { type: [blockSchema], default: [] },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    views: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isActive: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

blogPostSchema.index(
  { title: "text", excerpt: "text", tags: "text", "blocks.content": "text" },
  { default_language: "none", language_override: "searchLanguage" }
);
blogPostSchema.index({ isActive: 1, publishedAt: -1 });

export const BlogPost = mongoose.model("BlogPost", blogPostSchema);
