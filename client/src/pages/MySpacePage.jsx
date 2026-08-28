import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import LoadingState from "../components/shared/LoadingState.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import FolderTree from "../components/space/FolderTree.jsx";
import ItemCard from "../components/space/ItemCard.jsx";
import { createFolder, deleteFolder, fetchFolders } from "../services/folderService.js";
import { deleteItem, fetchRecentItems } from "../services/itemService.js";

export default function MySpacePage() {
  const [folders, setFolders] = useState({ tree: [], folders: [] });
  const [items, setItems] = useState([]);
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Folder delete confirmation state
  const [pendingDelete, setPendingDelete] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

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

  function requestFolderDelete(id, name) {
    setPendingDelete({ id, name });
  }

  async function confirmFolderDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteFolder(pendingDelete.id);
      setPendingDelete(null);
      refresh();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not delete folder.");
      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Private workspace" title="My Space">
        <Link className="button" to="/items/new">New item</Link>
      </PageHeader>

      {/* ── Folder delete modal ── */}
      {pendingDelete && (
        <div className="modal-overlay" onClick={() => !deleting && setPendingDelete(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon danger">
              <AlertTriangle size={28} />
            </div>
            <h3>Delete &ldquo;{pendingDelete.name}&rdquo;?</h3>
            <p>
              All items inside this folder (including any sub-folders and their published posts)
              will be <strong>permanently deleted</strong>. Saved copies in other users&apos; spaces
              will remain.
            </p>
            <div className="modal-actions">
              <button className="ghost" onClick={() => setPendingDelete(null)} disabled={deleting}>
                Cancel
              </button>
              <button className="danger" onClick={confirmFolderDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Yes, delete everything"}
              </button>
            </div>
          </div>
        </div>
      )}

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

