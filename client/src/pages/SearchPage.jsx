import { useEffect, useState } from "react";
import PostCard from "../components/blog/PostCard.jsx";
import LoadingState from "../components/shared/LoadingState.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import SearchBar from "../components/shared/SearchBar.jsx";
import TagFilter from "../components/shared/TagFilter.jsx";
import ItemCard from "../components/space/ItemCard.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import { searchItems } from "../services/itemService.js";
import { searchPosts } from "../services/postService.js";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [items, setItems] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const debouncedQ = useDebounce(q);
  const debouncedTag = useDebounce(tag);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      searchItems({ q: debouncedQ, tag: debouncedTag }),
      searchPosts({ q: debouncedQ, tag: debouncedTag })
    ]).then(([nextItems, nextPosts]) => {
      if (!active) return;
      setItems(nextItems);
      setPosts(nextPosts);
      setMessage("");
    }).catch((err) => {
      if (active) setMessage(err?.response?.data?.message || "Search failed.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [debouncedQ, debouncedTag]);

  return (
    <>
      <PageHeader eyebrow="Discovery" title="Search" />
      <div className="toolbar"><SearchBar value={q} onChange={setQ} placeholder="Search private items and public posts" /><TagFilter value={tag} onChange={setTag} /></div>
      {message && <p className="error">{message}</p>}
      {loading ? (
        <LoadingState label="Searching..." />
      ) : (
        <>
          <h2>Personal items</h2>
          <div className="grid-list">{items.map((item) => <ItemCard key={item._id} item={item} />)}</div>
          {!items.length && <p className="muted">No matching personal items.</p>}
          <h2>Public posts</h2>
          <div className="feed-list">{posts.map((post) => <PostCard key={post._id} post={post} />)}</div>
          {!posts.length && <p className="muted">No matching public posts.</p>}
        </>
      )}
    </>
  );
}
