import express from "express";
import { createMessage, getAllInvitations, updateInvitationStatus } from "../controller/messageController.js";

const router = express.Router();

// POST /api/messages/:adminId/createMessage
router.post("/:adminId/createMessage", createMessage);

// GET /api/messages/:alumniId/getAllInvitations
router.get("/:alumniId/getAllInvitations", getAllInvitations);

// PATCH /api/messages/:alumniId/:eventId/updateInvitationStatus
router.patch("/:alumniId/:eventId/updateInvitationStatus", updateInvitationStatus);

export default router;
