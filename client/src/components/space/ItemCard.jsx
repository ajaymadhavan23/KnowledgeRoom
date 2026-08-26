import { AlertTriangle, Code2, FileText, Image, Link as LinkIcon, NotebookText } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const iconMap = { note: FileText, link: LinkIcon, code: Code2, image: Image, mixed: NotebookText };

export default function ItemCard({ item, onDelete }) {
  const Icon = iconMap[item.type] || NotebookText;
  const [confirming, setConfirming] = useState(false);

  function handleDeleteClick() {
    setConfirming(true);
  }

  function handleCancel() {
    setConfirming(false);
  }

  function handleConfirm() {
    setConfirming(false);
    onDelete?.(item._id);
  }

  return (
    <article className="item-card">
      {confirming ? (
        /* ── Inline delete confirmation ── */
        <div className="card-confirm">
          <div className="card-confirm-icon">
            <AlertTriangle size={22} />
          </div>
          <p className="card-confirm-msg">
            Delete <strong>&ldquo;{item.title || "Untitled"}&rdquo;</strong>?
            <span>This cannot be undone.</span>
          </p>
          <div className="card-confirm-actions">
            <button className="small ghost" onClick={handleCancel}>Cancel</button>
            <button className="small danger" onClick={handleConfirm}>Yes, delete</button>
          </div>
        </div>
      ) : (
        <>
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
            <button className="small danger" onClick={handleDeleteClick}>Delete</button>
          </div>
        </>
      )}
    </article>
  );
}
