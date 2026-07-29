import { Plus, Trash2 } from "lucide-react";

const blockTypes = ["text", "heading", "list", "code", "link", "image"];

export default function BlockEditor({ blocks, onChange }) {
  function updateBlock(index, patch) {
    onChange(blocks.map((block, currentIndex) => currentIndex === index ? { ...block, ...patch } : block));
  }

  function addBlock(type = "text") {
    onChange([...blocks, { type, content: "", language: type === "code" ? "javascript" : "", meta: {} }]);
  }

  function removeBlock(index) {
    onChange(blocks.filter((_block, currentIndex) => currentIndex !== index));
  }

  return (
    <div className="block-editor">
      {blocks.map((block, index) => (
        <div className="block-row" key={block._id || index}>
          <div className="block-tools">
            <select value={block.type} onChange={(event) => updateBlock(index, { type: event.target.value })}>
              {blockTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            {block.type === "code" && (
              <input value={block.language || ""} onChange={(event) => updateBlock(index, { language: event.target.value })} placeholder="language" />
            )}
            {block.type === "image" && (
              <input value={block.meta?.alt || ""} onChange={(event) => updateBlock(index, { meta: { ...block.meta, alt: event.target.value } })} placeholder="alt text" />
            )}
            <button className="icon danger" type="button" onClick={() => removeBlock(index)} title="Remove block"><Trash2 size={16} /></button>
          </div>
          <textarea
            rows={block.type === "code" || block.type === "list" ? 6 : 3}
            value={block.content}
            onChange={(event) => updateBlock(index, { content: event.target.value })}
            placeholder={placeholderFor(block.type)}
          />
        </div>
      ))}
      <div className="add-blocks">
        {blockTypes.map((type) => (
          <button className="small ghost" type="button" key={type} onClick={() => addBlock(type)}>
            <Plus size={14} /> {type}
          </button>
        ))}
      </div>
    </div>
  );
}

function placeholderFor(type) {
  const map = {
    text: "Write a paragraph...",
    heading: "Section heading",
    list: "One bullet per line",
    code: "Paste code here",
    link: "https://example.com",
    image: "https://image-url.com/file.jpg"
  };
  return map[type] || "Content";
}
