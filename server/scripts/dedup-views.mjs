/**
 * dedup-views.mjs
 * One-time fix: deduplicate the `views` array on every BlogPost document.
 * The old code had a race condition that could push the same userId more than once.
 * This script converts each views array to a Set (unique ObjectIds) and saves it back.
 *
 * Run from the server/ directory:
 *   node scripts/dedup-views.mjs
 */

import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌  MONGODB_URI not found in environment. Make sure .env is present.");
  process.exit(1);
}

async function main() {
  console.log("Connecting to MongoDB…");
  await mongoose.connect(uri);
  console.log("Connected.\n");

  const col = mongoose.connection.db.collection("blogposts");

  const posts = await col.find({}, { projection: { views: 1 } }).toArray();
  console.log(`Found ${posts.length} blog post(s). Checking for duplicate views…\n`);

  let fixed = 0;

  for (const post of posts) {
    const original = post.views ?? [];
    // Deduplicate by converting ObjectId → string, then back to ObjectId
    const seen = new Set();
    const deduped = original.filter((id) => {
      const key = id.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (deduped.length !== original.length) {
      await col.updateOne({ _id: post._id }, { $set: { views: deduped } });
      console.log(
        `✅  Post ${post._id}: ${original.length} → ${deduped.length} unique views`
      );
      fixed++;
    }
  }

  if (fixed === 0) {
    console.log("ℹ️  No duplicates found — all views arrays are already clean.");
  } else {
    console.log(`\n✅  Fixed ${fixed} post(s).`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error("❌  Error:", err.message);
  process.exit(1);
});
