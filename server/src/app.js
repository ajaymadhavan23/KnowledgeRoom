import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import folderRoutes from "./routes/folderRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  })
);
app.use(express.json());

// Auto-connect to DB on every request (cached after first connection)
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Knowledge Room API is running on Vercel Serverless" });
});

app.use("/api/auth", authRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Server error"
  });
});

export default app;
