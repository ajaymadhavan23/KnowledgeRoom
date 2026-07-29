import { useEffect, useState } from "react";
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
      {!notifications.length && <p className="muted">No notifications yet.</p>}
    </>
  );
}

function verb(type) {
  return { like: "liked", comment: "commented on", save: "saved", new_post: "published" }[type] || "interacted with";
}
