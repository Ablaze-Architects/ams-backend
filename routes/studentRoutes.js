import express from "express";
import { createStudents } from "../controller/studentController.js";

const router = express.Router();

// @route   POST /api/students/createStudents
// @desc    Create students from JSON array or CSV (multipart/form-data)
router.post("/createStudents", createStudents);

export default router;
