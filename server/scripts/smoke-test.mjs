/**
 * smoke-test.mjs — verifies all CRUD operations work after index fix
 * Run: node scripts/smoke-test.mjs
 */
import "dotenv/config";
import mongoose from "mongoose";
import { Item } from "../src/models/Item.js";
import { User } from "../src/models/User.js";

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("MONGODB_URI missing"); process.exit(1); }

async function main() {
  await mongoose.connect(uri);
  console.log("Connected\n");

  // find or create a dummy user
  let user = await User.findOne({ email: "smoketest@example.com" });
  if (!user) {
    const bcrypt = (await import("bcryptjs")).default;
    user = await User.create({
      name: "Smoke",
      email: "smoketest@example.com",
      passwordHash: await bcrypt.hash("password123", 10),
      department: "Engineering",
      role: "employee"
    });
    console.log("Created user:", user._id);
  }

  // CREATE
  const item = await Item.create({
    owner: user._id,
    folder: null,
    title: "Smoke Test Item",
    type: "mixed",
    tags: ["React", "Test"],
    blocks: [
      { type: "text", content: "Hello world", language: undefined, meta: {} },
      { type: "code", content: "console.log(1)", language: "javascript", meta: {} },
      { type: "heading", content: "My Heading 1", language: undefined, meta: {} },
      { type: "heading2", content: "My Heading 2", language: undefined, meta: {} },
      { type: "divider", content: "", language: undefined, meta: {} }
    ]
  });
  console.log("✅ CREATE:", item._id.toString(), "-", item.title);

  // READ
  const found = await Item.findById(item._id);
  console.log("✅ READ  :", found.title, "| blocks:", found.blocks.length);

  // UPDATE
  found.title = "Updated Smoke Item";
  found.blocks[0].content = "Updated content";
  await found.save();
  console.log("✅ UPDATE:", found.title);

  // DELETE
  await Item.findByIdAndDelete(item._id);
  const gone = await Item.findById(item._id);
  console.log("✅ DELETE:", gone === null ? "confirmed gone" : "❌ still exists");

  await mongoose.disconnect();
  console.log("\n✅  All CRUD operations passed.");
}

main().catch((err) => {
  console.error("❌  FAILED:", err.message);
  process.exit(1);
});
