import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingState from "../components/shared/LoadingState.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import FolderTree from "../components/space/FolderTree.jsx";
import ItemCard from "../components/space/ItemCard.jsx";
import { useConfirm } from "../hooks/useConfirm.jsx";
import { createFolder, deleteFolder, fetchFolders } from "../services/folderService.js";
import { deleteItem, fetchRecentItems } from "../services/itemService.js";

export default function MySpacePage() {
  const [folders, setFolders] = useState({ tree: [], folders: [] });
  const [items, setItems] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      const [folderData, recent] = await Promise.all([fetchFolders(), fetchRecentItems()]);
      setFolders(folderData);
      setItems(recent);
      setMessage("");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not load your space.");
    } finally {
      setLoading(false);
    }
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

  async function requestFolderDelete(id, name) {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      message:
        "All items inside this folder (including any sub-folders and their published posts) will be permanently deleted. Saved copies in other users' spaces will remain.",
      confirmText: "Yes, delete everything",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteFolder(id);
      refresh();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not delete folder.");
    }
  }

  return (
    <>
      {confirmDialog}
      <PageHeader eyebrow="Private workspace" title="My Space">
        <Link className="button" to="/items/new">New item</Link>
      </PageHeader>
      {message && <p className="error">{message}</p>}
      {loading ? (
        <LoadingState label="Loading your space..." />
      ) : (
        <div className="two-column">
          <section className="panel">
            <h2>Folders</h2>
            <form className="inline-form" onSubmit={addFolder}>
              <input value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="New folder" />
              <button>Add</button>
            </form>
            <FolderTree tree={folders.tree} onDelete={requestFolderDelete} />
          </section>
          <section>
            <h2>Continue where you left off</h2>
            <div className="grid-list">{items.map((item) => <ItemCard key={item._id} item={item} onDelete={removeItem} />)}</div>
          </section>
        </div>
      )}
    </>
  );
}
