/**
 * Backfill Embeddings Script
 *
 * One-time script to generate embeddings for all existing blog posts
 * that don't have one yet. Run from project root:
 *
 *   node server/scripts/backfillEmbeddings.js
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { connectDB } from "../src/config/db.js";
import { BlogPost } from "../src/models/BlogPost.js";
import {
  extractTextForEmbedding,
  generateEmbedding,
} from "../src/services/embeddingService.js";

// Small delay between Gemini API calls to respect rate limits
const DELAY_MS = 500;
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function backfill() {
  console.log("[backfill] Connecting to database...");
  await connectDB();

  // Find all posts that don't have an embedding yet
  const posts = await BlogPost.find({
    $or: [
      { embedding: { $exists: false } },
      { embedding: null },
      { embedding: { $size: 0 } },
    ],
  }).select("+embedding");

  console.log(`[backfill] Found ${posts.length} posts without embeddings\n`);

  if (posts.length === 0) {
    console.log("[backfill] Nothing to do — all posts already have embeddings.");
    process.exit(0);
  }

  let done = 0;
  let failed = 0;

  for (const post of posts) {
    try {
      const text = extractTextForEmbedding(post.title, post.blocks);
      if (!text) {
        console.log(
          `  ⚠ Skipping "${post.title}" — no textual content`
        );
        done++;
        continue;
      }

      const embedding = await generateEmbedding(text);
      await BlogPost.findByIdAndUpdate(post._id, { embedding });

      done++;
      console.log(
        `  ✓ ${done}/${posts.length} — "${post.title}" (${embedding.length} dims)`
      );
    } catch (err) {
      failed++;
      done++;
      console.error(
        `  ✗ ${done}/${posts.length} — "${post.title}" FAILED: ${err.message}`
      );
    }

    // Rate-limit delay
    if (done < posts.length) await sleep(DELAY_MS);
  }

  console.log(
    `\n[backfill] Done! ${done - failed} succeeded, ${failed} failed out of ${posts.length} total.`
  );
  process.exit(failed > 0 ? 1 : 0);
}

backfill().catch((err) => {
  console.error("[backfill] Fatal error:", err);
  process.exit(1);
});
