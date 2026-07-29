import { Code2, FileText, Image, Link as LinkIcon, NotebookText } from "lucide-react";
import { Link } from "react-router-dom";
import { useConfirm } from "../../hooks/useConfirm.jsx";

const iconMap = { note: FileText, link: LinkIcon, code: Code2, image: Image, mixed: NotebookText };

export default function ItemCard({ item, onDelete }) {
  const Icon = iconMap[item.type] || NotebookText;
  const { confirm, confirmDialog } = useConfirm();

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: "Delete Item",
      message: `Are you sure you want to delete "${item.title || "Untitled"}"? This action cannot be undone.`,
      danger: true
    });
    if (isConfirmed) {
      onDelete?.(item._id);
    }
  };

  return (
    <article className="item-card">
      <div className="card-topline">
        <Icon size={18} />
        <span>{item.type}</span>
      </div>
      <Link to={`/items/${item._id}`}><h3>{item.title}</h3></Link>
      <p>{item.blocks?.[0]?.content || "Open to start writing."}</p>
      <div className="tag-row">
        {item.tags?.slice(0, 4).map((tag) => <span key={tag}>#{tag}</span>)}
      </div>
      <div className="card-actions">
        <Link className="button small ghost" to={`/items/${item._id}`}>Open</Link>
        <button className="small danger" onClick={handleDelete}>Delete</button>
      </div>
      {confirmDialog}
    </article>
  );
}
