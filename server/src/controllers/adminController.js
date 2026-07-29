import { BlogPost } from "../models/BlogPost.js";
import { Comment } from "../models/Comment.js";
import { Item } from "../models/Item.js";
import { User } from "../models/User.js";

export async function getStats(_req, res, next) {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalPosts,
      totalItems,
      totalComments,
      activeUsers,
      topViewedPosts,
      topLikedPosts,
      postsPerDay,
      departmentBreakdown
    ] = await Promise.all([
      User.countDocuments(),
      BlogPost.countDocuments({ isActive: true }),
      Item.countDocuments(),
      Comment.countDocuments(),

      // Top 5 most active authors
      BlogPost.aggregate([
        { $group: { _id: "$author", posts: { $sum: 1 }, likes: { $sum: { $size: "$likes" } }, views: { $sum: { $size: "$views" } } } },
        { $sort: { posts: -1, likes: -1 } },
        { $limit: 5 },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { posts: 1, likes: 1, views: 1, "user.name": 1, "user.department": 1 } }
      ]),

      // Top 5 most viewed posts
      BlogPost.aggregate([
        { $match: { isActive: true } },
        { $addFields: { viewsCount: { $size: "$views" } } },
        { $sort: { viewsCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "author" } },
        { $unwind: "$author" },
        { $project: { title: 1, viewsCount: 1, "author.name": 1 } }
      ]),

      // Top 5 most liked posts
      BlogPost.aggregate([
        { $match: { isActive: true } },
        { $addFields: { likesCount: { $size: "$likes" } } },
        { $sort: { likesCount: -1 } },
        { $limit: 5 },
        { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "author" } },
        { $unwind: "$author" },
        { $project: { title: 1, likesCount: 1, "author.name": 1 } }
      ]),

      // Posts published per day (last 14 days)
      BlogPost.aggregate([
        { $match: { publishedAt: { $gte: fourteenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%m/%d", date: "$publishedAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $project: { date: "$_id", count: 1, _id: 0 } }
      ]),

      // Posts count by department
      BlogPost.aggregate([
        { $match: { isActive: true } },
        { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "author" } },
        { $unwind: "$author" },
        { $group: { _id: "$author.department", posts: { $sum: 1 }, totalLikes: { $sum: { $size: "$likes" } }, totalViews: { $sum: { $size: "$views" } } } },
        { $sort: { posts: -1 } },
        { $project: { department: "$_id", posts: 1, totalLikes: 1, totalViews: 1, _id: 0 } }
      ])
    ]);

    res.json({
      totalUsers, totalPosts, totalItems, totalComments,
      activeUsers, topViewedPosts, topLikedPosts, postsPerDay, departmentBreakdown
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminPosts(_req, res, next) {
  try {
    const posts = await BlogPost.find().populate("author", "name department avatarUrl").sort({ publishedAt: -1 });
    res.json(posts);
  } catch (error) {
    next(error);
  }
}

export async function deactivatePost(req, res, next) {
  try {
    const post = await BlogPost.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (error) {
    next(error);
  }
}
