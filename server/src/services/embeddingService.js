import { GoogleGenerativeAI } from "@google/generative-ai";
import { BlogPost } from "../models/BlogPost.js";

// ── Gemini Embedding Client ────────────────────────────────────────────────

function getGenAI() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Set GEMINI_API_KEY in server/.env"
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

// ── Text Extraction ────────────────────────────────────────────────────────

const TEXTUAL_BLOCK_TYPES = new Set([
  "text",
  "heading",
  "heading2",
  "code",
  "list",
  "link",
]);

/**
 * Combines title + block contents into a single string suitable for embedding.
 * Skips non-textual blocks (image, divider) since they carry no searchable text.
 */
export function extractTextForEmbedding(title, blocks = []) {
  const bodyParts = blocks
    .filter((b) => TEXTUAL_BLOCK_TYPES.has(b.type) && b.content)
    .map((b) => b.content);

  return [title, ...bodyParts].join("\n").trim();
}

// ── Embedding Generation ───────────────────────────────────────────────────

/**
 * Generate a 768-dimensional embedding vector for the given text.
 * Uses Gemini gemini-embedding-001 model.
 */
export async function generateEmbedding(text) {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  const result = await model.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768
  });
  return result.embedding.values; // number[] — 768 floats
}

// ── Fire-and-Forget Wrapper ────────────────────────────────────────────────

/**
 * Generate and persist an embedding for a BlogPost.
 * Designed to be called fire-and-forget after the publish response is sent.
 */
export async function generateEmbeddingForPost(postId, title, blocks) {
  const text = extractTextForEmbedding(title, blocks);
  if (!text) {
    console.warn(`[embedding] Skipping post ${postId} — no textual content`);
    return;
  }

  const embedding = await generateEmbedding(text);
  await BlogPost.findByIdAndUpdate(postId, { embedding });
  console.log(`[embedding] ✓ Generated for post ${postId}`);
}
