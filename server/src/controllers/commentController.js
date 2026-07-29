import { BlogPost } from "../models/BlogPost.js";
import { Comment } from "../models/Comment.js";
import { createNotification } from "../utils/notifications.js";

export async function getComments(req, res, next) {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .populate("author", "name department avatarUrl")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    next(error);
  }
}

export async function createComment(req, res, next) {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, isActive: true });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comment = await Comment.create({ post: post._id, author: req.user._id, text: req.body.text });
    await createNotification({ recipient: post.author, fromUser: req.user._id, post: post._id, type: "comment" });
    await comment.populate("author", "name department avatarUrl");
    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }
    await comment.deleteOne();
    res.json({ message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
}
