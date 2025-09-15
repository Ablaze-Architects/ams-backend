import express from "express";
import { getAllAlumni } from "../controller/alumniController.js";

const router = express.Router();

router.get("/", getAllAlumni);

export default router;   // <-- ESM export
