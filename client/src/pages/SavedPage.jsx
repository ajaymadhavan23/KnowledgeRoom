import { useEffect, useState } from "react";
import LoadingState from "../components/shared/LoadingState.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import ItemCard from "../components/space/ItemCard.jsx";
import { fetchFolders } from "../services/folderService.js";
import { deleteItem, fetchItems } from "../services/itemService.js";

export default function SavedPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchFolders().then(({ folders }) => {
      if (!active) return;
      const saved = folders.find((folder) => folder.isSystemFolder);
      if (!saved) return [];
      return fetchItems(saved._id).then((data) => { if (active) setItems(data); });
    }).catch((err) => {
      if (active) setMessage(err?.response?.data?.message || "Could not load saved items.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function remove(id) {
    await deleteItem(id);
    setItems((current) => current.filter((item) => item._id !== id));
  }

  return (
    <>
      <PageHeader eyebrow="Community saves" title="Saved from Community" />
      {message && <p className="error">{message}</p>}
      {loading ? (
        <LoadingState label="Loading saved items..." />
      ) : (
        <>
          <div className="grid-list">{items.map((item) => <ItemCard key={item._id} item={item} onDelete={remove} />)}</div>
          {!items.length && <p className="muted">Saved blog posts will appear here.</p>}
        </>
      )}
    </>
  );
}
