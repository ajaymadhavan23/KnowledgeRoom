import {
  Bell,
  BookOpen,
  FileText,
  Home,
  LogOut,
  Search,
  Settings,
  Shield,
  User
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useConfirm } from "../../hooks/useConfirm.jsx";
import { fetchUnreadCount } from "../../services/notificationService.js";
import Avatar from "./Avatar.jsx";

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const { confirm, confirmDialog } = useConfirm();

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: "Log Out",
      message: "Are you sure you want to log out of Knowledge Room?",
      confirmText: "Log Out",
      danger: true
    });
    if (isConfirmed) {
      logout();
      navigate("/login");
    }
  };

  // Poll for unread notification count every 30 seconds
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const count = await fetchUnreadCount();
        if (!cancelled) setUnreadCount(count);
      } catch {
        // silently ignore (e.g. if token expired)
      }
    }

    poll(); // initial load
    const interval = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">KR</div>
          <div>
            <strong>Knowledge Room</strong>
            <span>{user.department}</span>
          </div>
        </div>
        <nav>
          <NavLink to="/space"><Home size={18} /> My Space</NavLink>
          <NavLink to="/blog"><BookOpen size={18} /> Blog Feed</NavLink>
          <NavLink to="/search"><Search size={18} /> Search</NavLink>
          <NavLink to="/space/saved"><FileText size={18} /> Saved</NavLink>
          <NavLink to="/my-posts"><User size={18} /> My Posts</NavLink>

          {/* Bell with red dot badge when there are unread notifications */}
          <NavLink to="/notifications" className="nav-bell-link" onClick={() => setUnreadCount(0)}>
            <span className="nav-bell-wrap">
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="notif-dot" title={`${unreadCount} unread`}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            {" "}Notifications
          </NavLink>

          <NavLink to="/settings"><Settings size={18} /> Settings</NavLink>
          {isAdmin && <NavLink to="/admin"><Shield size={18} /> Admin</NavLink>}
        </nav>
        <div className="sidebar-user-card">
          <Avatar user={user} />
          <div>
            <strong>{user.name}</strong>
            <span className="sidebar-user-role">{user.role === "admin" ? "🛡 Admin" : "Employee"}</span>
          </div>
        </div>
        <button className="ghost full" onClick={handleLogout}>
          <LogOut size={18} /> Logout
        </button>
      </aside>
      <section className="content-shell">
        <Outlet />
      </section>
      {confirmDialog}
    </div>
  );
}
