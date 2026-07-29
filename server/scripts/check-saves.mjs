import "dotenv/config";
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI);
const items = await mongoose.connection.db.collection("items").find({ sourcePost: { $exists: true, $ne: null } }).toArray();
console.log("Items with sourcePost:", JSON.stringify(items.map(i => ({ id: i._id, owner: i.owner, sourcePost: i.sourcePost, title: i.title })), null, 2));
await mongoose.disconnect();
