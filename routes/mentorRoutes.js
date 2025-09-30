// routes/mentorRoutes.js
import express from "express";
import { createMentor, getAllMentors, getMentorById } from "../controller/mentorController.js";

const router = express.Router();

// POST /api/mentor/:alumniId/createMentor
router.post("/:alumniId/createMentor", createMentor);

// GET /api/mentor/getAllMentors
router.get("/getAllMentors", getAllMentors);

// GET /api/mentor/:mentorId
router.get("/:mentorId", getMentorById);

export default router;
