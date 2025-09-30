// controller/mentorController.js
import { supabase } from "../config/supabase.js";

// POST /api/mentor/:alumniId/createMentor
// Body: { mentor_name (reqd), mentor_description, mentor_occupation (reqd), mentor_email (reqd), mentor_phone_number }
export const createMentor = async (req, res) => {
  const { alumniId } = req.params;
  const {
    mentor_name,
    mentor_description = null,
    mentor_occupation,
    mentor_email,
    mentor_phone_number = null,
  } = req.body || {};

  try {
    // Validate required fields
    const missing = [];
    if (!alumniId) missing.push("alumniId");
    if (!mentor_name) missing.push("mentor_name");
    if (!mentor_occupation) missing.push("mentor_occupation");
    if (!mentor_email) missing.push("mentor_email");

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required field(s): ${missing.join(", ")}`,
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mentor_email)) {
      return res.status(400).json({
        success: false,
        message: "mentor_email is not a valid email",
      });
    }

    // Insert mentor record
    const payload = {
      alumni_id: alumniId,
      mentor_name,
      mentor_description,
      mentor_occupation,
      mentor_email,
      mentor_phone_number,
    };

    const { data, error } = await supabase
      .from("mentors")
      .insert([payload])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Mentor created successfully",
      data,
    });
  } catch (err) {
    console.error("❌ Error creating mentor:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
