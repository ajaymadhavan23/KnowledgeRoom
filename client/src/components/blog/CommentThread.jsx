import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useConfirm } from "../../hooks/useConfirm.jsx";
import { createComment, deleteComment, fetchComments } from "../../services/postService.js";
import Avatar from "../shared/Avatar.jsx";

export default function CommentThread({ postId }) {
  const { user, isAdmin } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const { confirm, confirmDialog } = useConfirm();

  useEffect(() => {
    fetchComments(postId).then(setComments);
  }, [postId]);

  async function submit(event) {
    event.preventDefault();
    if (!text.trim()) return;
    const comment = await createComment(postId, text);
    setComments((current) => [...current, comment]);
    setText("");
  }

  async function remove(id) {
    const isConfirmed = await confirm({
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment?",
      danger: true
    });
    if (!isConfirmed) return;
    await deleteComment(id);
    setComments((current) => current.filter((comment) => comment._id !== id));
  }

  return (
    <section className="comments">
      <h2>Comments</h2>
      <form className="comment-form" onSubmit={submit}>
        <input value={text} onChange={(event) => setText(event.target.value)} placeholder="Add a comment" />
        <button>Post</button>
      </form>
      {comments.map((comment) => (
        <article className="comment" key={comment._id}>
          <Avatar user={comment.author} size="sm" />
          <div>
            <strong>{comment.author?.name}</strong>
            <p>{comment.text}</p>
            <span>{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          {(comment.author?._id === user._id || isAdmin) && <button className="small danger" onClick={() => remove(comment._id)}>Delete</button>}
        </article>
      ))}
      {confirmDialog}
    </section>
  );
}
