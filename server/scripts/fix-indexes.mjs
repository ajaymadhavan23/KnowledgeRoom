/**
 * fix-indexes.mjs
 * Drops and recreates the text indexes on items & blogposts collections
 * so that the "language override unsupported" error is gone.
 *
 * Run from the server/ directory:
 *   node scripts/fix-indexes.mjs
 */

import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌  MONGODB_URI not found in environment. Make sure .env is present.");
  process.exit(1);
}

async function dropTextIndex(collection, label) {
  try {
    const indexes = await collection.indexes();
    const textIdx = indexes.find((idx) => idx.textIndexVersion !== undefined);
    if (textIdx) {
      await collection.dropIndex(textIdx.name);
      console.log(`✅  Dropped old text index on ${label}: ${textIdx.name}`);
    } else {
      console.log(`ℹ️   No text index found on ${label} — nothing to drop.`);
    }
  } catch (err) {
    // If the index doesn't exist Mongo throws 27 — that's fine
    if (err.code === 27) {
      console.log(`ℹ️   Text index on ${label} already absent.`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect(uri);
  console.log("Connected.\n");

  const db = mongoose.connection.db;
  const itemsCol = db.collection("items");
  const postsCol = db.collection("blogposts");

  // --- drop old text indexes ---
  await dropTextIndex(itemsCol, "items");
  await dropTextIndex(postsCol, "blogposts");

  // --- recreate with language_override so our "language" field doesn't clash ---
  console.log("\nRecreating text indexes…");

  await itemsCol.createIndex(
    { title: "text", tags: "text", "blocks.content": "text" },
    {
      name: "items_text_search",
      default_language: "none",
      language_override: "searchLanguage", // redirect mongo's special field away from "language"
    }
  );
  console.log("✅  items text index created.");

  await postsCol.createIndex(
    { title: "text", excerpt: "text", tags: "text", "blocks.content": "text" },
    {
      name: "blogposts_text_search",
      default_language: "none",
      language_override: "searchLanguage",
    }
  );
  console.log("✅  blogposts text index created.");

  // --- also ensure compound indexes are present ---
  await itemsCol.createIndex({ owner: 1, folder: 1, updatedAt: -1 }, { name: "items_owner_folder" });
  await postsCol.createIndex({ isActive: 1, publishedAt: -1 }, { name: "blogposts_active_date" });
  console.log("✅  Compound indexes ensured.");

  await mongoose.disconnect();
  console.log("\n✅  All done. Reconnect your server and try saving again.");
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
