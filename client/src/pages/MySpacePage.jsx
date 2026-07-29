import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/shared/PageHeader.jsx";
import FolderTree from "../components/space/FolderTree.jsx";
import ItemCard from "../components/space/ItemCard.jsx";
import { createFolder, fetchFolders } from "../services/folderService.js";
import { deleteItem, fetchRecentItems } from "../services/itemService.js";

export default function MySpacePage() {
  const [folders, setFolders] = useState({ tree: [], folders: [] });
  const [items, setItems] = useState([]);
  const [folderName, setFolderName] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    const [folderData, recent] = await Promise.all([fetchFolders(), fetchRecentItems()]);
    setFolders(folderData);
    setItems(recent);
  }

  async function addFolder(event) {
    event.preventDefault();
    if (!folderName.trim()) return;
    await createFolder({ name: folderName });
    setFolderName("");
    refresh();
  }

  async function removeItem(id) {
    await deleteItem(id);
    setItems((current) => current.filter((item) => item._id !== id));
  }

  return (
    <>
      <PageHeader eyebrow="Private workspace" title="My Space">
        <Link className="button" to="/items/new">New item</Link>
      </PageHeader>
      <div className="two-column">
        <section className="panel">
          <h2>Folders</h2>
          <form className="inline-form" onSubmit={addFolder}>
            <input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="New folder" />
            <button>Add</button>
          </form>
          <FolderTree tree={folders.tree} />
        </section>
        <section>
          <h2>Continue where you left off</h2>
          <div className="grid-list">{items.map((item) => <ItemCard key={item._id} item={item} onDelete={removeItem} />)}</div>
        </section>
      </div>
    </>
  );
}
