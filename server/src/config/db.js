import mongoose from "mongoose";

let isConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI environment variable is missing.");
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  mongoose.set("strictQuery", true);
  const db = await mongoose.connect(uri);
  isConnected = db.connections[0].readyState === 1;
  console.log("MongoDB connected");
}
