import { useEffect, useState } from "react";
import PageHeader from "../components/shared/PageHeader.jsx";
import ItemCard from "../components/space/ItemCard.jsx";
import { fetchFolders } from "../services/folderService.js";
import { deleteItem, fetchItems } from "../services/itemService.js";

export default function SavedPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchFolders().then(({ folders }) => {
      const saved = folders.find((folder) => folder.isSystemFolder);
      if (saved) fetchItems(saved._id).then(setItems);
    });
  }, []);

  async function remove(id) {
    await deleteItem(id);
    setItems((current) => current.filter((item) => item._id !== id));
  }

  return (
    <>
      <PageHeader eyebrow="Community saves" title="Saved from Community" />
      <div className="grid-list">{items.map((item) => <ItemCard key={item._id} item={item} onDelete={remove} />)}</div>
      {!items.length && <p className="muted">Saved blog posts will appear here.</p>}
    </>
  );
}
