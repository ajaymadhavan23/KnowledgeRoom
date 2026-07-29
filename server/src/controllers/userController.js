import { BlogPost } from "../models/BlogPost.js";
import { User } from "../models/User.js";

export async function getProfile(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select("name department avatarUrl bio role createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });
    const posts = await BlogPost.find({ author: user._id, isActive: true }).sort({ publishedAt: -1 });
    res.json({ user, posts });
  } catch (error) {
    next(error);
  }
}

export async function updateMe(req, res, next) {
  try {
    const allowed = ["name", "department", "avatarUrl", "bio"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) req.user[field] = req.body[field];
    });
    await req.user.save();
    res.json(req.user.toSafeJSON());
  } catch (error) {
    next(error);
  }
}
