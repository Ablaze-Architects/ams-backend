import express from "express";
import { createMessage, getAllInvitations } from "../controller/messageController.js";

const router = express.Router();

// POST /api/messages/:adminId/createMessage
router.post("/:adminId/createMessage", createMessage);

// GET /api/messages/:alumniId/getAllInvitations
router.get("/:alumniId/getAllInvitations", getAllInvitations);

export default router;
