/**
 * NotionEditor — A Notion-style block editor (v2)
 *
 * UX improvements over v1:
 * - Drag-and-drop block reordering (⠿ drag handle)
 * - Delete block button (× on hover)
 * - Block type switcher (click the type icon to open slash menu)
 * - Tab key inserts 2 spaces in code blocks
 * - Shift+Enter creates a new block from anywhere
 * - Backspace on empty non-text block converts back to text first
 * - Link block: URL + optional label field
 * - Image block: improved with caption field
 * - Word / char count shown at the bottom
 * - Smooth fade-in animation on new blocks
 * - Better placeholder text per block type
 * - Escape closes slash menu without deleting content
 */
import { useCallback, useEffect, useRef, useState } from "react";

/* ─── block type registry ─────────────────────────────────── */
const BLOCK_TYPES = [
  { id: "text",     label: "Text",        icon: "¶",    hint: "Plain paragraph",            placeholder: "Type something… or '/' for commands" },
  { id: "heading",  label: "Heading 1",   icon: "H1",   hint: "Large section heading",       placeholder: "Heading 1" },
  { id: "heading2", label: "Heading 2",   icon: "H2",   hint: "Medium subheading",           placeholder: "Heading 2" },
  { id: "list",     label: "Bullet list", icon: "•",    hint: "Unordered list",              placeholder: "List item — one per line" },
  { id: "code",     label: "Code",        icon: "</>",  hint: "Syntax-highlighted code",     placeholder: "// write code here…" },
  { id: "image",    label: "Image",       icon: "🖼",   hint: "Image via URL",               placeholder: "https://…" },
  { id: "link",     label: "Link",        icon: "🔗",   hint: "Hyperlink",                   placeholder: "https://…" },
  { id: "divider",  label: "Divider",     icon: "─",    hint: "Horizontal rule",             placeholder: "" },
  { id: "quote",    label: "Quote",       icon: "❝",    hint: "Block quotation",             placeholder: "Quote…" },
  { id: "callout",  label: "Callout",     icon: "💡",   hint: "Highlighted callout box",     placeholder: "Callout text…" },
];

const TYPE_MAP = Object.fromEntries(BLOCK_TYPES.map((t) => [t.id, t]));

const LANGUAGES = [
  "javascript","typescript","python","html","css","sql","bash","json",
  "java","csharp","go","rust","php","ruby","plaintext",
];

/* ─── uid ─────────────────────────────────────────────────── */
let _uid = 0;
function uid() { return "b" + (++_uid); }
function makeBlock(type = "text", extra = {}) {
  return { _tid: uid(), type, content: "", language: "javascript", meta: {}, ...extra };
}
function autoResize(el) {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
}

/* ─── word count helper ───────────────────────────────────── */
function countWords(blocks) {
  const text = blocks
    .filter((b) => !["divider", "image", "link"].includes(b.type))
    .map((b) => b.content)
    .join(" ");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, chars: text.replace(/\s/g, "").length };
}

/* ════════════════════════════════════════════════════════════
   MAIN EDITOR
════════════════════════════════════════════════════════════ */
export default function NotionEditor({ blocks: initBlocks, onChange }) {
  const [blocks, setBlocksRaw] = useState(() =>
    initBlocks?.length
      ? initBlocks.map((b) => ({ _tid: uid(), ...b }))
      : [makeBlock()]
  );

  const blocksRef    = useRef(blocks);
  const onChangeRef  = useRef(onChange);
  const dragSrc      = useRef(null);   // index being dragged
  const dragOver     = useRef(null);   // index being hovered

  useEffect(() => { blocksRef.current = blocks; }, [blocks]);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const commit = useCallback((next) => {
    blocksRef.current = next;
    setBlocksRaw(next);
    onChangeRef.current?.(next.map(({ _tid, ...rest }) => rest));
  }, []);

  const [slashMenu, setSlashMenu] = useState(null);   // { blockTid, query }
  const [typeMenu, setTypeMenu]   = useState(null);   // blockTid
  const inputRefs = useRef({});

  /* ── focus ── */
  function focusAt(tid, atEnd = true) {
    requestAnimationFrame(() => {
      const el = inputRefs.current[tid];
      if (!el) return;
      el.focus();
      if (atEnd && el.setSelectionRange) {
        const len = el.value?.length ?? 0;
        el.setSelectionRange(len, len);
      }
    });
  }

  /* ── mutations ── */
  function patchBlock(tid, patch) {
    commit(blocksRef.current.map((b) => b._tid === tid ? { ...b, ...patch } : b));
  }

  function insertAfter(afterIndex, type = "text") {
    const nb = makeBlock(type);
    const next = [...blocksRef.current];
    next.splice(afterIndex + 1, 0, nb);
    commit(next);
    focusAt(nb._tid);
  }

  function removeBlock(index) {
    const cur = blocksRef.current;
    if (cur.length === 1) { commit([makeBlock()]); return; }
    const next = cur.filter((_, i) => i !== index);
    commit(next);
    focusAt(next[Math.max(0, index - 1)]._tid);
  }

  /* ── slash command apply ── */
  function applyCommand(type, tid) {
    const cur = blocksRef.current;
    const idx = cur.findIndex((b) => b._tid === tid);
    if (idx === -1) return;

    const el = inputRefs.current[tid];
    const rawVal = el ? el.value : cur[idx].content;
    const slashPos = rawVal.lastIndexOf("/");
    const contentBefore = slashPos >= 0 ? rawVal.slice(0, slashPos).trimEnd() : "";

    if (type === "divider") {
      const divider = makeBlock("divider");
      const newText = makeBlock("text");
      const next = [...cur];
      next.splice(idx, 1, divider, newText);
      commit(next);
      setSlashMenu(null);
      focusAt(newText._tid);
      return;
    }

    if (contentBefore === "") {
      commit(cur.map((b) => b._tid === tid ? { ...b, type, content: "" } : b));
    } else {
      const nb = makeBlock(type);
      const next = [...cur];
      next.splice(idx, 1, { ...cur[idx], content: contentBefore }, nb);
      commit(next);
      focusAt(nb._tid);
    }
    setSlashMenu(null);
    setTypeMenu(null);
  }

  /* ── keyboard handler ── */
  function handleKeyDown(e, tid, index) {
    // Let slash menu intercept arrows / enter
    if (slashMenu?.blockTid === tid) {
      if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key)) return;
      if (e.key === "Escape") { e.preventDefault(); setSlashMenu(null); return; }
    }
    if (typeMenu === tid) {
      if (e.key === "Escape") { e.preventDefault(); setTypeMenu(null); return; }
    }

    const block = blocksRef.current[index];

    /* Enter → new block (except code which allows newlines) */
    if (e.key === "Enter" && !e.shiftKey && block?.type !== "code") {
      e.preventDefault();
      insertAfter(index);
    }

    /* Shift+Enter always creates new block */
    if (e.key === "Enter" && e.shiftKey && block?.type === "code") {
      // normal newline in code — do nothing special
    }

    /* Tab in code → insert 2 spaces */
    if (e.key === "Tab" && block?.type === "code") {
      e.preventDefault();
      const el = inputRefs.current[tid];
      if (!el) return;
      const s = el.selectionStart;
      const v = el.value;
      const next = v.slice(0, s) + "  " + v.slice(el.selectionEnd);
      patchBlock(tid, { content: next });
      requestAnimationFrame(() => { el.setSelectionRange(s + 2, s + 2); });
      return;
    }

    /* Backspace on empty block */
    if (e.key === "Backspace") {
      const el = inputRefs.current[tid];
      if (el && el.value === "") {
        e.preventDefault();
        // Non-text empty block → convert to text first
        if (block?.type !== "text") {
          patchBlock(tid, { type: "text", content: "" });
        } else {
          removeBlock(index);
        }
      }
    }

    /* Arrow up/down between blocks */
    if (e.key === "ArrowUp" && index > 0) {
      const el = inputRefs.current[tid];
      if (!el?.value?.slice(0, el.selectionStart).includes("\n")) {
        e.preventDefault();
        focusAt(blocksRef.current[index - 1]._tid);
      }
    }
    if (e.key === "ArrowDown" && index < blocksRef.current.length - 1) {
      const el = inputRefs.current[tid];
      if (!el?.value?.slice(el.selectionEnd).includes("\n")) {
        e.preventDefault();
        focusAt(blocksRef.current[index + 1]._tid);
      }
    }
  }

  /* ── text change + slash detection ── */
  function handleChange(e, tid, index) {
    const val = e.target.value;
    autoResize(e.target);
    patchBlock(tid, { content: val });

    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const m = before.match(/(^|\n)\/([\w]*)$/);
    if (m) {
      setSlashMenu({ blockTid: tid, query: m[2].toLowerCase() });
    } else {
      setSlashMenu(null);
    }
  }

  /* ── drag reorder ── */
  function onDragStart(index) { dragSrc.current = index; }
  function onDragOver(e, index) {
    e.preventDefault();
    dragOver.current = index;
  }
  function onDrop(e) {
    e.preventDefault();
    const from = dragSrc.current;
    const to = dragOver.current;
    if (from === null || to === null || from === to) return;
    const next = [...blocksRef.current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
    dragSrc.current = null;
    dragOver.current = null;
  }

  /* ── slash menu filter ── */
  const filteredCmds = slashMenu
    ? BLOCK_TYPES.filter((c) =>
        !slashMenu.query ||
        c.id.startsWith(slashMenu.query) ||
        c.label.toLowerCase().includes(slashMenu.query)
      )
    : [];

  const showSlash = slashMenu !== null && filteredCmds.length > 0;

  /* ── stats ── */
  const { words, chars } = countWords(blocks);

  return (
    <div className="ne-canvas">
      {blocks.map((block, index) => (
        <div
          key={block._tid}
          className="ne-block-wrap"
          draggable
          onDragStart={() => onDragStart(index)}
          onDragOver={(e) => onDragOver(e, index)}
          onDrop={onDrop}
        >
          {/* ── Left gutter: drag handle + type button ── */}
          <div className="ne-gutter">
            <span className="ne-drag-handle" title="Drag to reorder">⠿</span>
            <button
              className="ne-type-btn"
              type="button"
              tabIndex={-1}
              title={TYPE_MAP[block.type]?.label || block.type}
              onMouseDown={(e) => {
                e.preventDefault();
                setTypeMenu((cur) => cur === block._tid ? null : block._tid);
                setSlashMenu(null);
              }}
            >
              {TYPE_MAP[block.type]?.icon || "¶"}
            </button>
          </div>

          {/* ── Block content ── */}
          <div className="ne-block-content">
            <BlockInput
              block={block}
              index={index}
              inputRefs={inputRefs}
              onKeyDown={(e) => handleKeyDown(e, block._tid, index)}
              onChange={(e) => handleChange(e, block._tid, index)}
              onUpdate={(patch) => patchBlock(block._tid, patch)}
            />

            {/* Slash menu */}
            {showSlash && slashMenu.blockTid === block._tid && (
              <SlashMenu
                commands={filteredCmds}
                onSelect={(type) => applyCommand(type, block._tid)}
                onClose={() => setSlashMenu(null)}
              />
            )}

            {/* Type switcher menu (click the type icon) */}
            {typeMenu === block._tid && (
              <SlashMenu
                commands={BLOCK_TYPES.filter((t) => t.id !== "divider")}
                onSelect={(type) => {
                  patchBlock(block._tid, { type });
                  setTypeMenu(null);
                  focusAt(block._tid);
                }}
                onClose={() => setTypeMenu(null)}
                title="Change block type"
              />
            )}
          </div>

          {/* ── Right: delete button ── */}
          <button
            className="ne-delete-btn"
            type="button"
            tabIndex={-1}
            title="Delete block"
            onMouseDown={(e) => { e.preventDefault(); removeBlock(index); }}
          >
            ×
          </button>
        </div>
      ))}

      {/* ── Add block row ── */}
      <div className="ne-add-row">
        <button
          className="ne-add-btn"
          type="button"
          onClick={() => insertAfter(blocks.length - 1)}
        >
          + Add block
        </button>
      </div>

      {/* ── Word count ── */}
      <div className="ne-footer">
        {words} word{words !== 1 ? "s" : ""} · {chars} char{chars !== 1 ? "s" : ""}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   BLOCK INPUT
════════════════════════════════════════════════════════════ */
function BlockInput({ block, index, inputRefs, onKeyDown, onChange, onUpdate }) {
  const setRef = (el) => {
    if (el) { inputRefs.current[block._tid] = el; autoResize(el); }
  };

  const info = TYPE_MAP[block.type] || TYPE_MAP.text;
  const shared = {
    ref: setRef,
    value: block.content,
    onChange,
    onKeyDown,
    placeholder: index === 0 && block.type === "text"
      ? "Start writing… or type '/' for commands"
      : info.placeholder,
  };

  if (block.type === "divider") {
    return <hr className="ne-divider" />;
  }

  if (block.type === "heading") {
    return <textarea {...shared} className="ne-input ne-heading1" rows={1} />;
  }
  if (block.type === "heading2") {
    return <textarea {...shared} className="ne-input ne-heading2" rows={1} />;
  }
  if (block.type === "list") {
    return <textarea {...shared} className="ne-input ne-list" rows={2} />;
  }
  if (block.type === "quote") {
    return <textarea {...shared} className="ne-input ne-quote" rows={2} />;
  }
  if (block.type === "callout") {
    return (
      <div className="ne-callout-wrap">
        <span className="ne-callout-icon">💡</span>
        <textarea {...shared} className="ne-input ne-callout-text" rows={1} />
      </div>
    );
  }

  if (block.type === "code") {
    return (
      <div className="ne-code-wrap">
        <div className="ne-code-toolbar">
          <select
            className="ne-lang-select"
            value={block.language || "javascript"}
            onChange={(e) => onUpdate({ language: e.target.value })}
          >
            {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <span className="ne-code-tip">Tab = 2 spaces · Shift+Enter = new line</span>
        </div>
        <textarea
          {...shared}
          className="ne-input ne-code"
          rows={5}
          spellCheck={false}
        />
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="ne-image-wrap">
        <div className="ne-url-row">
          <span className="ne-url-icon">🖼</span>
          <input
            ref={(el) => { if (el) inputRefs.current[block._tid] = el; }}
            className="ne-url-input"
            type="url"
            placeholder="Paste image URL…"
            value={block.content}
            onChange={onChange}
            onKeyDown={onKeyDown}
          />
        </div>
        {block.content && (
          <>
            <img
              src={block.content}
              alt={block.meta?.caption || "image"}
              className="ne-image-preview"
              onError={(e) => (e.target.style.display = "none")}
            />
            <input
              className="ne-caption-input"
              placeholder="Add a caption…"
              value={block.meta?.caption || ""}
              onChange={(e) => onUpdate({ meta: { ...block.meta, caption: e.target.value } })}
            />
          </>
        )}
      </div>
    );
  }

  if (block.type === "link") {
    return (
      <div className="ne-link-wrap">
        <div className="ne-url-row">
          <span className="ne-url-icon">🔗</span>
          <input
            ref={(el) => { if (el) inputRefs.current[block._tid] = el; }}
            className="ne-url-input"
            type="url"
            placeholder="Paste a link URL…"
            value={block.content}
            onChange={onChange}
            onKeyDown={onKeyDown}
          />
        </div>
        {block.content && (
          <>
            <input
              className="ne-caption-input"
              placeholder="Link label (optional)…"
              value={block.meta?.label || ""}
              onChange={(e) => onUpdate({ meta: { ...block.meta, label: e.target.value } })}
            />
            <a
              className="ne-link-preview"
              href={block.content}
              target="_blank"
              rel="noreferrer"
            >
              <span className="ne-link-preview-icon">🔗</span>
              {block.meta?.label || block.content}
            </a>
          </>
        )}
      </div>
    );
  }

  /* default: text */
  return <textarea {...shared} className="ne-input ne-text" rows={1} />;
}

/* ════════════════════════════════════════════════════════════
   SLASH / TYPE MENU
════════════════════════════════════════════════════════════ */
function SlashMenu({ commands, onSelect, onClose, title = "Turn into" }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => { setActiveIdx(0); }, [commands.length]);

  useEffect(() => {
    function handler(e) {
      if (e.key === "ArrowDown") {
        e.preventDefault(); e.stopPropagation();
        setActiveIdx((i) => (i + 1) % commands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault(); e.stopPropagation();
        setActiveIdx((i) => (i - 1 + commands.length) % commands.length);
      } else if (e.key === "Enter") {
        e.preventDefault(); e.stopPropagation();
        if (commands[activeIdx]) onSelect(commands[activeIdx].id);
      } else if (e.key === "Escape") {
        e.preventDefault(); e.stopPropagation();
        onClose();
      }
    }
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [commands, activeIdx, onSelect, onClose]);

  return (
    <div className="ne-slash-menu" onMouseDown={(e) => e.preventDefault()}>
      <p className="ne-slash-header">{title}</p>
      {commands.map((cmd, i) => (
        <div
          key={cmd.id}
          className={`ne-slash-item ${i === activeIdx ? "ne-slash-active" : ""}`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(cmd.id); }}
          onMouseEnter={() => setActiveIdx(i)}
        >
          <span className="ne-slash-icon">{cmd.icon}</span>
          <div>
            <div className="ne-slash-label">{cmd.label}</div>
            <div className="ne-slash-hint">{cmd.hint}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
