import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LoadingState from "../components/shared/LoadingState.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import ItemCard from "../components/space/ItemCard.jsx";
import { deleteFolder } from "../services/folderService.js";
import { deleteItem, fetchItems } from "../services/itemService.js";

export default function FolderPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchItems(folderId)
      .then((data) => { if (active) setItems(data); })
      .catch((err) => { if (active) setMessage(err?.response?.data?.message || "Could not load folder."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [folderId]);

  async function remove(id) {
    await deleteItem(id);
    setItems((current) => current.filter((item) => item._id !== id));
  }

  async function handleDeleteFolder() {
    setDeleting(true);
    try {
      await deleteFolder(folderId);
      navigate("/space");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not delete folder.");
      setConfirmingDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Folder" title="Folder view">
        <button className="ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <Link className="button" to={`/items/new?folder=${folderId}`}>New item here</Link>
        <button className="danger" onClick={() => setConfirmingDelete(true)}>
          <Trash2 size={16} /> Delete Folder
        </button>
      </PageHeader>

      {/* ── Folder delete confirmation banner ── */}
      {confirmingDelete && (
        <div className="folder-delete-confirm">
          <AlertTriangle size={20} />
          <span>
            <strong>Delete this folder?</strong> All items inside (including published posts) will be permanently removed.
            Saved copies in others&apos; spaces will remain.
          </span>
          <div className="folder-delete-confirm-actions">
            <button className="small ghost" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
              Cancel
            </button>
            <button className="small danger" onClick={handleDeleteFolder} disabled={deleting}>
              {deleting ? "Deleting…" : "Yes, delete everything"}
            </button>
          </div>
        </div>
      )}

      {message && <p className="error">{message}</p>}
      {loading ? (
        <LoadingState label="Loading folder..." />
      ) : (
        <>
          <div className="grid-list">{items.map((item) => <ItemCard key={item._id} item={item} onDelete={remove} />)}</div>
          {!items.length && <p className="muted">This folder is empty.</p>}
        </>
      )}
    </>
  );
}
