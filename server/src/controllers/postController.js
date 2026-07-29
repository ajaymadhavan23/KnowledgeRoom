import { BlogPost } from "../models/BlogPost.js";
import { Comment } from "../models/Comment.js";
import { Item } from "../models/Item.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { createNotification } from "../utils/notifications.js";
import { ensureSavedFolder } from "../utils/folders.js";

function postPopulate(query) {
  return query.populate("author", "name department avatarUrl bio role");
}

export async function getPosts(req, res, next) {
  try {
    const { sort = "latest", tag = "", page = 1, limit = 10 } = req.query;
    const query = { isActive: true };
    if (tag) query.tags = tag;

    const sortMap = {
      latest: { publishedAt: -1 },
      top: { likesCount: -1 },
      mostViewed: { viewsCount: -1 }
    };

    const pipeline = [
      { $match: query },
      { $addFields: { likesCount: { $size: "$likes" }, viewsCount: { $size: "$views" } } },
      { $sort: sortMap[sort] || sortMap.latest },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) }
    ];

    const posts = await BlogPost.aggregate(pipeline);
    await BlogPost.populate(posts, { path: "author", select: "name department avatarUrl bio role" });

    // Attach per-user hasSaved flag so the feed card knows whether to show Save
    const userId = req.user._id;
    const postIds = posts.map((p) => p._id);
    const savedItems = await Item.find({ owner: userId, sourcePost: { $in: postIds } }, "sourcePost");
    const savedSet = new Set(savedItems.map((item) => item.sourcePost.toString()));
    const postsWithSaved = posts.map((p) => ({
      ...p,
      hasLiked: p.likes?.some((id) => id.toString() === userId.toString()),
      hasSaved: savedSet.has(p._id.toString())
    }));

    res.json(postsWithSaved);
  } catch (error) {
    next(error);
  }
}

export async function searchPosts(req, res, next) {
  try {
    const { q = "", tag = "" } = req.query;
    const query = { isActive: true };
    if (q) query.$text = { $search: q };
    if (tag) query.tags = tag;
    const posts = await postPopulate(BlogPost.find(query).sort(q ? { score: { $meta: "textScore" } } : { publishedAt: -1 }));
    res.json(posts);
  } catch (error) {
    next(error);
  }
}

export async function getPost(req, res, next) {
  try {
    const post = await postPopulate(BlogPost.findOne({ _id: req.params.id, isActive: true }));
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Check if the requesting user already saved this post into their space
    const hasSaved = !!(await Item.exists({ owner: req.user._id, sourcePost: post._id }));

    res.json({ ...post.toObject(), hasSaved });
  } catch (error) {
    next(error);
  }
}

export async function toggleLike(req, res, next) {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, isActive: true });
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);
    post.likes = alreadyLiked ? post.likes.filter((id) => id.toString() !== userId) : [...post.likes, req.user._id];
    await post.save();

    if (!alreadyLiked) {
      await createNotification({ recipient: post.author, fromUser: req.user._id, post: post._id, type: "like" });
    }

    res.json({ liked: !alreadyLiked, likesCount: post.likes.length });
  } catch (error) {
    next(error);
  }
}

export async function registerView(req, res, next) {
  try {
    // $addToSet is atomic — it only adds the userId if it's not already present,
    // guaranteeing unique-user view counting without any race condition.
    const updated = await BlogPost.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { $addToSet: { views: req.user._id } },
      { new: true, select: "views" }
    );

    if (!updated) return res.status(404).json({ message: "Post not found" });

    res.json({ viewsCount: updated.views.length });
  } catch (error) {
    next(error);
  }
}

export async function savePost(req, res, next) {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, isActive: true });
    if (!post) return res.status(404).json({ message: "Post not found" });

    // Prevent the author from saving their own post
    if (post.author.toString() === req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot save your own post." });
    }

    // Prevent saving the same post twice
    const alreadySaved = await Item.exists({ owner: req.user._id, sourcePost: post._id });
    if (alreadySaved) {
      return res.status(409).json({ message: "You have already saved this post." });
    }

    const folder = await ensureSavedFolder(req.user._id);
    const item = await Item.create({
      owner: req.user._id,
      folder: folder._id,
      title: post.title,
      type: "mixed",
      tags: post.tags,
      blocks: post.blocks,
      sourcePost: post._id
    });

    await createNotification({ recipient: post.author, fromUser: req.user._id, post: post._id, type: "save" });
    res.status(201).json(item);
  } catch (error) {
    next(error);
  }
}

export async function unpublishPost(req, res, next) {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not allowed" });
    }

    post.isActive = false;
    await post.save();
    await Item.updateMany({ publishedPostId: post._id, owner: post.author }, { isPublished: false, publishedPostId: null });
    res.json({ message: "Post unpublished" });
  } catch (error) {
    next(error);
  }
}

export async function getMyPosts(req, res, next) {
  try {
    const posts = await BlogPost.find({ author: req.user._id }).sort({ publishedAt: -1 });
    const counts = await Comment.aggregate([{ $match: { post: { $in: posts.map((post) => post._id) } } }, { $group: { _id: "$post", count: { $sum: 1 } } }]);
    const countMap = new Map(counts.map((row) => [row._id.toString(), row.count]));
    res.json(posts.map((post) => ({ ...post.toObject(), commentsCount: countMap.get(post._id.toString()) || 0 })));
  } catch (error) {
    next(error);
  }
}
