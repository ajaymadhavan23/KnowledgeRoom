import { useEffect, useState } from "react";
import LoadingState from "../components/shared/LoadingState.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import { useConfirm } from "../hooks/useConfirm.jsx";
import { fetchMyPosts, unpublishPost } from "../services/postService.js";

export default function MyPostsPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchMyPosts()
      .then((data) => { if (active) setPosts(data); })
      .catch((err) => { if (active) setMessage(err?.response?.data?.message || "Could not load published posts."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function unpublish(id, title) {
    const isConfirmed = await confirm({
      title: "Unpublish Post",
      message: `Are you sure you want to unpublish "${title || "this post"}"? It will no longer be visible in the public blog.`,
      danger: true
    });
    if (!isConfirmed) return;
    await unpublishPost(id);
    setPosts((current) => current.map((post) => post._id === id ? { ...post, isActive: false } : post));
  }

  return (
    <>
      <PageHeader eyebrow="Your public work" title="My Published Posts" />
      {message && <p className="error">{message}</p>}
      {loading ? (
        <LoadingState label="Loading your published posts..." />
      ) : (
        <>
          <div className="table-list">
            {posts.map((post) => (
              <article className="table-row" key={post._id}>
                <div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                </div>
                <span>{post.likes?.length || 0} likes</span>
                <span>{post.views?.length || 0} views</span>
                <span>{post.commentsCount || 0} comments</span>
                <span>{post.isActive ? "Active" : "Inactive"}</span>
                {post.isActive && <button className="small danger" onClick={() => unpublish(post._id, post.title)}>Unpublish</button>}
              </article>
            ))}
          </div>
          {!posts.length && <p className="muted">You have not published any posts yet.</p>}
        </>
      )}
      {confirmDialog}
    </>
  );
}
