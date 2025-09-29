import express from "express";
import { createStudents , getAllStudents } from "../controller/studentController.js";

const router = express.Router();

// @route   POST /api/students/createStudents
// @desc    Create students from JSON array or CSV (multipart/form-data)
router.post("/createStudents", createStudents);
router.get("/getAllStudents", getAllStudents);

export default router;
