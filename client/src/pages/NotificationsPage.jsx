import { useEffect, useState } from "react";
import { Bell, Bookmark, CheckCircle2, Heart, MessageCircle, Send } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/shared/PageHeader.jsx";
import { fetchNotifications, markNotificationRead } from "../services/notificationService.js";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications().then(setNotifications);
  }, []);

  async function mark(id) {
    await markNotificationRead(id);
    // Notification deleted on backend — remove it from the local list
    setNotifications((current) => current.filter((note) => note._id !== id));
  }

  async function markAll() {
    const unread = notifications.filter((n) => !n.isRead);
    await Promise.all(unread.map((n) => markNotificationRead(n._id)));
    // All notifications deleted on backend — clear the entire list
    setNotifications([]);
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <>
      <PageHeader eyebrow="Activity" title="Notifications">
        {unreadCount > 0 && (
          <button className="ghost small" onClick={markAll}>Mark all read</button>
        )}
      </PageHeader>
      <div className="feed-list">
        {notifications.map((note) => (
          <article className={`notification ${note.isRead ? "" : "unread"}`} key={note._id}>
            <span className={`notification-icon ${note.type}`}>
              {notificationIcon(note.type)}
            </span>
            <div className="notification-body">
              {note.type === "new_post" ? (
                <span>
                  <strong>{note.fromUser?.name || "Someone"}</strong> published a new post
                  {note.post && <> — <Link to={`/blog/${note.post._id}`}>"{note.post.title}"</Link></>}
                </span>
              ) : (
                <span>
                  <strong>{note.fromUser?.name || "Someone"}</strong>
                  {" "}{verb(note.type)} your post
                  {note.post && <> "<Link to={`/blog/${note.post._id}`}>{note.post.title}</Link>"</>}
                </span>
              )}
              <small>{new Date(note.createdAt).toLocaleString()}</small>
            </div>
            {!note.isRead && <button className="small ghost" onClick={() => mark(note._id)}>Mark read</button>}
          </article>
        ))}
      </div>
      {!notifications.length && (
        <div className="empty-state">
          <Bell size={34} />
          <strong>All caught up</strong>
          <span>New likes, comments, saves, and posts will appear here.</span>
        </div>
      )}
    </>
  );
}

function verb(type) {
  return { like: "liked", comment: "commented on", save: "saved", new_post: "published" }[type] || "interacted with";
}

function notificationIcon(type) {
  const icons = {
    like: <Heart size={18} />,
    comment: <MessageCircle size={18} />,
    save: <Bookmark size={18} />,
    new_post: <Send size={18} />,
  };
  return icons[type] || <CheckCircle2 size={18} />;
}
