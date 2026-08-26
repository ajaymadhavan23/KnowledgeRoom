const supportedCodeLanguages = new Set([
  "javascript",
  "typescript",
  "python",
  "html",
  "css",
  "sql",
  "bash",
  "json",
  "java",
  "csharp",
  "go",
  "rust",
  "php",
  "ruby",
  "plaintext"
]);

function cleanInlineMarkdown(value) {
  return String(value || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .trim();
}

function flushParagraph(blocks, lines) {
  const content = lines.join(" ").trim();
  if (content) blocks.push({ type: "text", content, language: "", meta: {} });
  lines.length = 0;
}

function flushList(blocks, lines) {
  const content = lines.map(cleanInlineMarkdown).filter(Boolean).join("\n");
  if (content) blocks.push({ type: "list", content, language: "", meta: {} });
  lines.length = 0;
}

export function markdownToBlocks(markdown = "") {
  const blocks = [];
  const paragraphLines = [];
  const listLines = [];
  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  let inCode = false;
  let codeLanguage = "plaintext";
  let codeLines = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    const fence = trimmed.match(/^```(\w+)?/);

    if (fence) {
      if (inCode) {
        blocks.push({
          type: "code",
          content: codeLines.join("\n").trimEnd(),
          language: supportedCodeLanguages.has(codeLanguage) ? codeLanguage : "plaintext",
          meta: {}
        });
        inCode = false;
        codeLanguage = "plaintext";
        codeLines = [];
      } else {
        flushParagraph(blocks, paragraphLines);
        flushList(blocks, listLines);
        inCode = true;
        codeLanguage = (fence[1] || "plaintext").toLowerCase();
      }
      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    if (!trimmed) {
      flushParagraph(blocks, paragraphLines);
      flushList(blocks, listLines);
      continue;
    }

    const h1 = trimmed.match(/^#\s+(.+)/);
    const h2 = trimmed.match(/^##\s+(.+)/);
    const h3 = trimmed.match(/^###\s+(.+)/);
    const list = trimmed.match(/^[-*]\s+(.+)/);

    if (h1 || h2 || h3) {
      flushParagraph(blocks, paragraphLines);
      flushList(blocks, listLines);
      blocks.push({
        type: h1 ? "heading" : "heading2",
        content: cleanInlineMarkdown((h1 || h2 || h3)[1]),
        language: "",
        meta: {}
      });
      continue;
    }

    if (list) {
      flushParagraph(blocks, paragraphLines);
      listLines.push(list[1]);
      continue;
    }

    flushList(blocks, listLines);
    paragraphLines.push(cleanInlineMarkdown(trimmed));
  }

  if (inCode && codeLines.length) {
    blocks.push({
      type: "code",
      content: codeLines.join("\n").trimEnd(),
      language: supportedCodeLanguages.has(codeLanguage) ? codeLanguage : "plaintext",
      meta: {}
    });
  }
  flushParagraph(blocks, paragraphLines);
  flushList(blocks, listLines);

  return blocks.length ? blocks : [{ type: "text", content: "", language: "", meta: {} }];
}
