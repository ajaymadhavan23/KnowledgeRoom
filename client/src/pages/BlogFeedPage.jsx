import { useEffect, useState } from "react";
import PostCard from "../components/blog/PostCard.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import SearchBar from "../components/shared/SearchBar.jsx";
import TagFilter from "../components/shared/TagFilter.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getErrorMessage } from "../services/api.js";
import { fetchPosts, likePost, savePost } from "../services/postService.js";

export default function BlogFeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [sort, setSort] = useState("latest");
  const [tag, setTag] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPosts({ sort, tag }).then(setPosts);
  }, [sort, tag]);

  async function handleLike(post) {
    const result = await likePost(post._id);
    setPosts((current) => current.map((row) => row._id === post._id ? { ...row, likes: Array(result.likesCount).fill("x") } : row));
  }

  async function handleSave(post) {
    try {
      await savePost(post._id);
      // Flip hasSaved on this post so the card hides the Save button immediately
      setPosts((current) =>
        current.map((row) => row._id === post._id ? { ...row, hasSaved: true } : row)
      );
    } catch (err) {
      setMessage(getErrorMessage(err));
    }
  }

  return (
    <>
      <PageHeader eyebrow="Company knowledge" title="Blog Feed" />
      <div className="toolbar">
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="latest">Latest</option>
          <option value="top">Most liked</option>
          <option value="mostViewed">Most viewed</option>
        </select>
        <TagFilter value={tag} onChange={setTag} />
      </div>
      {message && <p className={message.includes("✓") ? "success" : "error"}>{message}</p>}
      <div className="feed-list">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={handleLike}
            onSave={handleSave}
            currentUserId={user?._id}
          />
        ))}
      </div>
      {!posts.length && <p className="muted">No public posts yet. Publish an item from your space.</p>}
    </>
  );
}
