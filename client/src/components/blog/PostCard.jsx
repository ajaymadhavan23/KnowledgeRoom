import { Heart, MessageCircle, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import Avatar from "../shared/Avatar.jsx";

export default function PostCard({ post, onLike, onSave, currentUserId }) {
  const isOwnPost = currentUserId && post.author &&
    (post.author._id === currentUserId || post.author._id?.toString() === currentUserId?.toString());

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
        <button className="ghost small" onClick={() => onLike?.(post)}>❤️ {post.likes?.length || post.likesCount || 0}</button>
        <span><Eye size={16} /> {post.views?.length || post.viewsCount || 0}</span>
        <span><MessageCircle size={16} /> {post.commentsCount || 0}</span>
        {/* Don't show Save for user's own posts or already-saved posts */}
        {isOwnPost && (
          <span style={{ fontSize: "0.8rem", color: "#647783" }}>Your post</span>
        )}
        {!isOwnPost && !post.hasSaved && (
          <button className="ghost small" onClick={() => onSave?.(post)}>💾 Save</button>
        )}
        {!isOwnPost && post.hasSaved && (
          <span style={{ fontSize: "0.8rem", color: "#647783" }}>✓ Saved</span>
        )}
      </div>
    </article>
  );
}
