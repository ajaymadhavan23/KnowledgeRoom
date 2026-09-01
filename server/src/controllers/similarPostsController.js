import { BlogPost } from "../models/BlogPost.js";

/**
 * GET /api/posts/:id/similar
 *
 * Uses MongoDB Atlas $vectorSearch to find semantically similar blog posts.
 * Requires the source post to have an embedding; returns [] if it doesn't.
 */
export async function getSimilarPosts(req, res, next) {
  try {
    const postId = req.params.id;

    // Fetch the source post with its embedding (which is select: false by default)
    const sourcePost = await BlogPost.findById(postId).select("+embedding");
    if (!sourcePost) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!sourcePost.embedding || sourcePost.embedding.length === 0) {
      // No embedding yet — return empty rather than erroring
      return res.json([]);
    }

    const results = await BlogPost.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: sourcePost.embedding,
          numCandidates: 100,
          limit: 6, // fetch 6 so we can exclude the source post and still have 5
        },
      },
      {
        $match: { isActive: true },
      },
      {
        $project: {
          title: 1,
          excerpt: 1,
          tags: 1,
          author: 1,
          publishedAt: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);

    // Exclude the source post itself from results
    const filtered = results.filter(
      (r) => r._id.toString() !== postId
    ).slice(0, 5);

    // Populate author info for display
    await BlogPost.populate(filtered, {
      path: "author",
      select: "name department avatarUrl",
    });

    res.json(filtered);
  } catch (error) {
    next(error);
  }
}
