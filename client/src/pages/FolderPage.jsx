import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import LoadingState from "../components/shared/LoadingState.jsx";
import PageHeader from "../components/shared/PageHeader.jsx";
import ItemCard from "../components/space/ItemCard.jsx";
import { useConfirm } from "../hooks/useConfirm.jsx";
import { deleteFolder } from "../services/folderService.js";
import { deleteItem, fetchItems } from "../services/itemService.js";

export default function FolderPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const { confirm, confirmDialog } = useConfirm();

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
    const ok = await confirm({
      title: "Delete this folder?",
      message:
        "All items inside (including published posts) will be permanently removed. Saved copies in others' spaces will remain.",
      confirmText: "Yes, delete everything",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteFolder(folderId);
      navigate("/space");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Could not delete folder.");
    }
  }

  return (
    <>
      {confirmDialog}
      <PageHeader eyebrow="Folder" title="Folder view">
        <button className="ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <Link className="button" to={`/items/new?folder=${folderId}`}>New item here</Link>
        <button className="danger" onClick={handleDeleteFolder}>
          <Trash2 size={16} /> Delete Folder
        </button>
      </PageHeader>

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
