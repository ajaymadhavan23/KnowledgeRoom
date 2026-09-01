import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import Avatar from "../shared/Avatar.jsx";
import { fetchSimilarPosts } from "../../services/postService.js";

export default function SimilarPosts({ postId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setPosts([]);

    fetchSimilarPosts(postId)
      .then((data) => {
        if (active) setPosts(data);
      })
      .catch(() => {
        // Silently fail — similar posts are non-critical
        if (active) setPosts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [postId]);

  if (loading) {
    return (
      <section className="similar-posts panel">
        <h3 className="similar-posts__title">
          <Sparkles size={18} /> Similar Posts
        </h3>
        <div className="similar-posts__skeleton">
          {[1, 2, 3].map((i) => (
            <div key={i} className="similar-posts__skeleton-card" />
          ))}
        </div>
      </section>
    );
  }

  if (posts.length === 0) return null;

  return (
    <section className="similar-posts panel">
      <h3 className="similar-posts__title">
        <Sparkles size={18} /> Similar Posts
      </h3>
      <div className="similar-posts__grid">
        {posts.map((post) => (
          <Link
            to={`/blog/${post._id}`}
            key={post._id}
            className="similar-posts__card"
          >
            <div className="similar-posts__card-header">
              {post.author && <Avatar user={post.author} size={24} />}
              <span className="similar-posts__author">
                {post.author?.name || "Unknown"}
              </span>
              {post.score != null && (
                <span className="similar-posts__score">
                  {Math.round(post.score * 100)}% match
                </span>
              )}
            </div>
            <h4 className="similar-posts__card-title">{post.title}</h4>
            {post.excerpt && (
              <p className="similar-posts__excerpt">{post.excerpt}</p>
            )}
            {post.tags?.length > 0 && (
              <div className="similar-posts__tags">
                {post.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="similar-posts__tag">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
