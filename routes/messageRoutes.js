// routes/messageRoutes.js
import express from "express";
import { createMessage } from "../controller/messageController.js";

const router = express.Router();

// POST /api/messages/:adminId/createMessage
router.post("/:adminId/createMessage", createMessage);

export default router;
