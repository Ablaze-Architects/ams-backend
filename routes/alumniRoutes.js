import express from "express";
import { getAllAlumni , getAlumniById } from "../controller/alumniController.js";

const router = express.Router();

router.get("/", getAllAlumni);

//GET api for particular alumni
router.get("/:alumniId", getAlumniById);

export default router;   // <-- ESM export
