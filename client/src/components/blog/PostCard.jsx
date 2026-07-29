import { Bookmark, Check, Eye, Heart, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Avatar from "../shared/Avatar.jsx";

export default function PostCard({ post, onLike, onSave, currentUserId }) {
  const isOwnPost = currentUserId && post.author &&
    (post.author._id === currentUserId || post.author._id?.toString() === currentUserId?.toString());
  const hasLiked = post.hasLiked ?? Boolean(
    post.likes?.some((id) => id?._id === currentUserId || id?.toString() === currentUserId?.toString())
  );
  const likesCount = post.likesCount ?? post.likes?.length ?? 0;

  return (
    <article className="post-card">
      <div className="author-row">
        <Avatar user={post.author} />
        <div>
          <Link to={`/profile/${post.author?._id}`}>{post.author?.name || "Unknown"}</Link>
          <span>{post.author?.department} · {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
      <Link to={`/blog/${post._id}`}><h2>{post.title}</h2></Link>
      <p>{post.excerpt || post.blocks?.[0]?.content || "No excerpt yet."}</p>
      <div className="tag-row">{post.tags?.map((tag) => <span key={tag}>#{tag}</span>)}</div>
      <div className="metric-row">
        <button
          className={`ghost small like-button ${hasLiked ? "liked" : ""}`}
          onClick={() => onLike?.(post)}
          aria-pressed={hasLiked}
          aria-label={hasLiked ? "Unlike post" : "Like post"}
        >
          <Heart size={15} fill={hasLiked ? "currentColor" : "none"} /> {likesCount}
        </button>
        <span><Eye size={16} /> {post.views?.length || post.viewsCount || 0}</span>
        <span><MessageCircle size={16} /> {post.commentsCount || 0}</span>
        {/* Don't show Save for user's own posts or already-saved posts */}
        {isOwnPost && (
          <span className="status-chip">Your post</span>
        )}
        {!isOwnPost && !post.hasSaved && (
          <button className="ghost small" onClick={() => onSave?.(post)}><Bookmark size={15} /> Save</button>
        )}
        {!isOwnPost && post.hasSaved && (
          <span className="status-chip"><Check size={14} /> Saved</span>
        )}
      </div>
    </article>
  );
}
