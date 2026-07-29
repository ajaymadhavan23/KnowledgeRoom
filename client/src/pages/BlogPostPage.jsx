import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CommentThread from "../components/blog/CommentThread.jsx";
import BlockRenderer from "../components/editor/BlockRenderer.jsx";
import Avatar from "../components/shared/Avatar.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { fetchPost, likePost, savePost, viewPost } from "../services/postService.js";

export default function BlogPostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [viewsCount, setViewsCount] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch post content and register the view concurrently.
    // viewsCount is driven exclusively by the viewPost response (post-write),
    // which is the accurate unique-viewer count after the atomic $addToSet.
    Promise.all([fetchPost(id), viewPost(id)]).then(([p, result]) => {
      setPost(p);
      setHasSaved(!!p.hasSaved);
      if (result?.viewsCount !== undefined) setViewsCount(result.viewsCount);
    });
  }, [id]);

  async function like() {
    const result = await likePost(id);
    setPost((current) => ({ ...current, likes: Array(result.likesCount).fill("x") }));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    try {
      await savePost(id);
      setHasSaved(true); // hide the button permanently for this user
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not save post.");
    } finally {
      setSaving(false);
    }
  }

  if (!post) return <p className="muted">Loading post...</p>;

  const isOwnPost = user && post.author && (post.author._id === user._id || post.author._id?.toString() === user._id?.toString());

  return (
    <>
      <PageHeader eyebrow="Blog post" title={post.title}>
        <button className="ghost" onClick={() => navigate(-1)}>← Back</button>
        <button className="ghost" onClick={like}>❤️ {post.likes?.length || 0}</button>
        {/* Hide Save button for own post or if already saved */}
        {!isOwnPost && !hasSaved && (
          <button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save to My Space"}
          </button>
        )}
        {!isOwnPost && hasSaved && (
          <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>✓ Saved</span>
        )}
      </PageHeader>

      {message && <p className={message.includes("✓") ? "success" : "error"}>{message}</p>}

      <article className="post-detail panel">
        <div className="author-row">
          <Avatar user={post.author} />
          <div>
            <Link to={`/profile/${post.author?._id}`}>{post.author?.name}</Link>
            <span>{post.author?.department} · 👁 {viewsCount !== null ? `${viewsCount} unique views` : "…"}</span>
          </div>
        </div>
        <p className="lead">{post.excerpt}</p>
        <div className="tag-row">{post.tags?.map((tag) => <span key={tag}>#{tag}</span>)}</div>
        <BlockRenderer blocks={post.blocks} />
      </article>
      <CommentThread postId={id} />
    </>
  );
}
