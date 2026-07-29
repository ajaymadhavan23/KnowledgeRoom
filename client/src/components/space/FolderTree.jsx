import { ChevronRight, Folder } from "lucide-react";
import { NavLink } from "react-router-dom";

function Branch({ folder, depth = 0 }) {
  const path = folder.isSystemFolder ? "/space/saved" : `/space/folder/${folder._id}`;
  return (
    <div>
      <NavLink className="tree-row" style={{ paddingLeft: 10 + depth * 18 }} to={path}>
        <ChevronRight size={14} />
        <Folder size={16} />
        <span>{folder.name}</span>
      </NavLink>
      {folder.children?.map((child) => <Branch key={child._id} folder={child} depth={depth + 1} />)}
    </div>
  );
}

export default function FolderTree({ tree = [] }) {
  return (
    <div className="tree">
      <NavLink className="tree-row" to="/space">
        <ChevronRight size={14} />
        <Folder size={16} />
        <span>Root</span>
      </NavLink>
      {tree.map((folder) => <Branch key={folder._id} folder={folder} />)}
    </div>
  );
}
