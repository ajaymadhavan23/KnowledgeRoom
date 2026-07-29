import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-css";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-java";
import "prismjs/components/prism-sql";

const LANG_MAP = {
  javascript: Prism.languages.javascript,
  typescript: Prism.languages.typescript,
  python: Prism.languages.python,
  css: Prism.languages.css,
  bash: Prism.languages.bash,
  json: Prism.languages.json,
  java: Prism.languages.java,
  sql: Prism.languages.sql,
};

function highlight(code, lang) {
  const grammar = LANG_MAP[lang] || Prism.languages.javascript;
  try { return Prism.highlight(code || "", grammar, lang || "javascript"); }
  catch { return code || ""; }
}

export default function BlockRenderer({ blocks = [] }) {
  return (
    <div className="rendered-blocks">
      {blocks.map((block, index) => {
        const key = block._id || block._tempId || index;

        if (block.type === "heading")
          return <h1 key={key} className="rendered-h1">{block.content}</h1>;

        if (block.type === "heading2")
          return <h2 key={key} className="rendered-h2">{block.content}</h2>;

        if (block.type === "quote")
          return (
            <blockquote key={key} className="rendered-quote">
              {block.content}
            </blockquote>
          );

        if (block.type === "callout")
          return (
            <div key={key} className="rendered-callout">
              <span className="rendered-callout-icon">💡</span>
              <span>{block.content}</span>
            </div>
          );

        if (block.type === "code") {
          const html = highlight(block.content, block.language);
          return (
            <div key={key} className="rendered-code-wrap">
              {block.language && <span className="rendered-code-lang">{block.language}</span>}
              <pre className="rendered-pre"><code dangerouslySetInnerHTML={{ __html: html }} /></pre>
            </div>
          );
        }

        if (block.type === "link")
          return (
            <a key={key} className="rendered-link" href={block.content} target="_blank" rel="noreferrer">
              <span className="rendered-link-icon">🔗</span>
              {block.meta?.label || block.meta?.title || block.content}
            </a>
          );

        if (block.type === "image")
          return (
            <figure key={key} className="rendered-figure">
              <img src={block.content} alt={block.meta?.caption || "image"} className="rendered-img" />
              {block.meta?.caption && <figcaption className="rendered-caption">{block.meta.caption}</figcaption>}
            </figure>
          );

        if (block.type === "list")
          return (
            <ul key={key} className="rendered-list">
              {block.content.split("\n").filter(Boolean).map((line, li) => <li key={li}>{line}</li>)}
            </ul>
          );

        if (block.type === "divider")
          return <hr key={key} className="rendered-divider" />;

        // default: paragraph
        if (!block.content?.trim()) return null;
        return <p key={key}>{block.content}</p>;
      })}
    </div>
  );
}
