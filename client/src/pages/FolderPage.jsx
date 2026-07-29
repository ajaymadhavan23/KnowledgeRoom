import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/shared/PageHeader.jsx";
import ItemCard from "../components/space/ItemCard.jsx";
import { deleteItem, fetchItems } from "../services/itemService.js";

export default function FolderPage() {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchItems(folderId).then(setItems);
  }, [folderId]);

  async function remove(id) {
    await deleteItem(id);
    setItems((current) => current.filter((item) => item._id !== id));
  }

  return (
    <>
      <PageHeader eyebrow="Folder" title="Folder view">
        <button className="ghost" onClick={() => navigate(-1)}><ArrowLeft size={16} /> Back</button>
        <Link className="button" to={`/items/new?folder=${folderId}`}>New item here</Link>
      </PageHeader>
      <div className="grid-list">{items.map((item) => <ItemCard key={item._id} item={item} onDelete={remove} />)}</div>
      {!items.length && <p className="muted">This folder is empty.</p>}
    </>
  );
}
