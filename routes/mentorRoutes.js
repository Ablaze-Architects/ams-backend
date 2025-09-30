// routes/mentorRoutes.js
import express from "express";
import { createMentor } from "../controller/mentorController.js";

const router = express.Router();

// POST /api/mentor/:alumniId/createMentor
router.post("/:alumniId/createMentor", createMentor);

export default router;
