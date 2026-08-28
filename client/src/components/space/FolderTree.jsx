import { ChevronRight, Folder, Trash2 } from "lucide-react";
import { NavLink } from "react-router-dom";

function Branch({ folder, depth = 0, onDelete }) {
  const path = folder.isSystemFolder ? "/space/saved" : `/space/folder/${folder._id}`;
  return (
    <div style={depth > 0 ? { paddingLeft: depth * 16 } : undefined}>
      <div className="tree-row-wrap">
        <NavLink className="tree-row tree-row-link" to={path}>
          <ChevronRight size={14} />
          <Folder size={16} />
          <span>{folder.name}</span>
        </NavLink>
        {!folder.isSystemFolder && (
          <button
            className="tree-delete-btn"
            title={`Delete "${folder.name}"`}
            onClick={(e) => { e.preventDefault(); onDelete?.(folder._id, folder.name); }}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {folder.children?.map((child) => (
        <Branch key={child._id} folder={child} depth={depth + 1} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function FolderTree({ tree = [], onDelete }) {
  return (
    <div className="tree">
      <NavLink className="tree-row" to="/space">
        <ChevronRight size={14} />
        <Folder size={16} />
        <span>Root</span>
      </NavLink>
      {tree.map((folder) => <Branch key={folder._id} folder={folder} onDelete={onDelete} />)}
    </div>
  );
}
