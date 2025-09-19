import express from "express";
import cors from "cors";
import alumniRoutes from "./routes/alumniRoutes.js"; // ESM route
import eventRoutes from "./routes/eventRoutes.js"; // ESM route
import messageRoutes from "./routes/messageRoutes.js";

import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Load CommonJS routes
const userRoutes = require("./routes/userRoutes.js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.json({
    status: "running",
    message: "Alumni Management System API",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/user", userRoutes);     // <-- CommonJS
app.use("/api/alumni", alumniRoutes); // <-- ESM
app.use("/api/events", eventRoutes);  // <-- ESM
app.use("/api/messages", messageRoutes);
// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
  });
});

export default app;
