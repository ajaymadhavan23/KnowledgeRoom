import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import BlockRenderer from "../components/editor/BlockRenderer.jsx";
import NotionEditor from "../components/editor/NotionEditor.jsx";
import { createItem, fetchItem, publishItem, updateItem } from "../services/itemService.js";

const blank = {
  title: "Untitled",
  type: "mixed",
  tags: [],
  blocks: [{ type: "text", content: "", language: "", meta: {} }]
};

export default function ItemEditorPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(blank);
  const [excerpt, setExcerpt] = useState("");
  const [preview, setPreview] = useState(Boolean(id));   // existing notes → preview first
  const [showPublishPanel, setShowPublishPanel] = useState(false);
  const [status, setStatus] = useState({ msg: "", type: "" }); // { msg, type: 'success'|'error'|'' }
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchItem(id).then((data) => { setItem(data); setExcerpt(""); });
      setPreview(true);
    } else {
      setItem({ ...blank, folder: searchParams.get("folder") || null });
      setPreview(false);
    }
  }, [id, searchParams]);

  function flash(msg, type = "success") {
    setStatus({ msg, type });
    setTimeout(() => setStatus({ msg: "", type: "" }), 3000);
  }

  /* ────────────────────────────────────────────────────────
   * SAVE — saves the note to personal space.
   * Returns the saved item (so publish can chain on it).
   * ──────────────────────────────────────────────────────── */
  async function save(silent = false) {
    if (saving) return item;
    setSaving(true);
    try {
      const payload = {
        title: item.title || "Untitled",
        type: item.type || "mixed",
        tags: normalizeTags(item.tags),
        blocks: item.blocks,
        folder: item.folder || null,
      };
      const saved = id
        ? await updateItem(id, payload)
        : await createItem(payload);

      setItem(saved);
      if (!silent) flash("Saved to your space ✓");
      setPreview(true);

      // Update the URL to the real item ID (for new items)
      if (!id) navigate(`/items/${saved._id}`, { replace: true });

      return saved;
    } catch (err) {
      flash(err?.response?.data?.message || "Save failed", "error");
      return null;
    } finally {
      setSaving(false);
    }
  }

  /* ────────────────────────────────────────────────────────
   * PUBLISH — saves first if needed, then creates a blog post.
   * Never double-saves if the item already has an _id.
   * ──────────────────────────────────────────────────────── */
  async function publish() {
    if (publishing) return;
    setPublishing(true);
    try {
      let target = item;

      // If the note has never been saved (no _id), save it first silently
      if (!item._id) {
        target = await save(true /* silent */);
        if (!target) return; // save failed
      } else if (!preview) {
        // We're in edit mode with an existing note — save any unsaved edits first
        target = await save(true /* silent */);
        if (!target) return;
      }

      // Now publish the saved item to the blog
      const post = await publishItem(target._id, { excerpt });
      flash("Published to the blog ✓");
      setShowPublishPanel(false);

      // Small delay so user sees the flash, then navigate to the blog post
      setTimeout(() => navigate(`/blog/${post._id}`), 800);
    } catch (err) {
      flash(err?.response?.data?.message || "Publish failed", "error");
    } finally {
      setPublishing(false);
    }
  }

  /* ── shared status bar ── */
  const StatusBar = status.msg ? (
    <span className={`nt-status-msg nt-status-${status.type}`}>{status.msg}</span>
  ) : null;

  /* ── publish panel (shared between preview & edit) ── */
  const PublishPanel = showPublishPanel ? (
    <div className="notion-publish-bar">
      <label className="nt-pub-label">
        Excerpt <span className="nt-pub-sublabel">(optional — shown as preview in the blog feed)</span>
      </label>
      <textarea
        className="nt-excerpt"
        rows={3}
        value={excerpt}
        onChange={(e) => setExcerpt(e.target.value)}
        placeholder="Write a short summary for readers…"
      />
      <div className="nt-pub-actions">
        <span className="nt-pub-hint">
          📝 Publishing creates a <strong>public copy</strong>. Your private note stays independent.
        </span>
        {item.publishedPostId && (
          <Link to={`/blog/${item.publishedPostId}`} className="nt-btn-ghost" target="_blank">
            View published post ↗
          </Link>
        )}
        <button
          className="nt-btn-primary"
          onClick={publish}
          disabled={publishing || saving}
        >
          {publishing ? "Publishing…" : "🚀 Publish to Blog"}
        </button>
      </div>
    </div>
  ) : null;

  /* ════════════════════════════════════════════════════════
     PREVIEW MODE
     ════════════════════════════════════════════════════════ */
  if (preview) {
    return (
      <div className="notion-page">
        <div className="notion-topbar">
          <button className="nt-back-btn" onClick={() => navigate(-1)}>← Back</button>
          <div className="nt-actions">
            {StatusBar}
            <button className="nt-btn-ghost" onClick={() => setPreview(false)}>✏️ Edit</button>
            <button
              className={`nt-btn-ghost ${showPublishPanel ? "nt-btn-active" : ""}`}
              onClick={() => setShowPublishPanel((s) => !s)}
            >
              {item.isPublished ? "📤 Re-publish" : "🚀 Publish"}
            </button>
          </div>
        </div>

        {PublishPanel}

        <div className="notion-doc">
          <h1 className="notion-page-title">{item.title || "Untitled"}</h1>
          {item.tags?.filter(Boolean).length > 0 && (
            <div className="notion-tags">
              {item.tags.filter(Boolean).map((t) => (
                <span key={t} className="notion-tag">#{t.trim()}</span>
              ))}
            </div>
          )}
          {/* Attribution banner — shown on items saved from the community blog */}
          {item.sourcePost?.author && (
            <div className="saved-from-banner">
              <span className="saved-from-icon">🔖</span>
              <span>
                Originally published by{" "}
                <strong>{item.sourcePost.author.name}</strong>
                {item.sourcePost.author.department && (
                  <> · <em>{item.sourcePost.author.department}</em></>
                )}
              </span>
            </div>
          )}
          <div className="notion-rendered">
            <BlockRenderer blocks={item.blocks} />
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════
     EDIT MODE
     ════════════════════════════════════════════════════════ */
  return (
    <div className="notion-page">
      <div className="notion-topbar">
        <button
          className="nt-back-btn"
          onClick={() => { if (id) setPreview(true); else navigate(-1); }}
        >
          ← {id ? "Cancel" : "Back"}
        </button>
        <div className="nt-actions">
          {StatusBar}
          <button
            className={`nt-btn-ghost ${showPublishPanel ? "nt-btn-active" : ""}`}
            onClick={() => setShowPublishPanel((s) => !s)}
          >
            {item.isPublished ? "📤 Re-publish" : "🚀 Publish"}
          </button>
          <button
            className="nt-btn-primary"
            onClick={() => save()}
            disabled={saving || publishing}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {PublishPanel}

      {/* ── Editable canvas ── */}
      <div className="notion-doc">
        <textarea
          className="notion-title-input"
          value={item.title}
          onChange={(e) => setItem((p) => ({ ...p, title: e.target.value }))}
          placeholder="Untitled"
          rows={1}
          onInput={(e) => {
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}
        />

        <input
          className="notion-tags-input"
          value={(item.tags || []).join(", ")}
          onChange={(e) => setItem((p) => ({ ...p, tags: e.target.value.split(",") }))}
          placeholder="Add tags (comma separated)…"
        />

        <NotionEditor
          key={item._id || "new"}
          blocks={item.blocks || []}
          onChange={(blocks) => setItem((p) => ({ ...p, blocks }))}
        />
      </div>
    </div>
  );
}

function normalizeTags(tags) {
  const arr = Array.isArray(tags) ? tags : String(tags || "").split(",");
  return [...new Set(arr.map((t) => t.trim()).filter(Boolean))];
}
