import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { supabase } = require("../config/supabase.js");

// GET /api/alumni
export const getAllAlumni = async (req, res) => {
  try {
    const { data: alumniData, error: alumniError } = await supabase
      .from("alumni")
      .select("*");

    if (alumniError) throw alumniError;

    // For each alumni, fetch their social links
    const alumniWithSocial = await Promise.all(
      alumniData.map(async (alumnus) => {
        const { data: socialLinks, error: socialError } = await supabase
          .from("alumni_social_links")
          .select("alumni_link, alumni_link_name")
          .eq("alumni_id", alumnus.alumni_id);

        alumnus.social_links = socialError ? [] : socialLinks || [];
        return alumnus;
      })
    );

    res.status(200).json(alumniWithSocial);
  } catch (error) {
    console.error("❌ Error fetching alumni:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error fetching alumni",
    });
  }
};

// GET /api/alumni/:alumniId
export const getAlumniById = async (req, res) => {
  const { alumniId } = req.params;

  try {
    const { data: alumnus, error } = await supabase
      .from("alumni")
      .select("*")
      .eq("alumni_id", alumniId)
      .single();

    if (error) throw error;

    if (!alumnus) {
      return res.status(404).json({
        success: false,
        message: "Alumni not found",
      });
    }

    // Fetch social links
    const { data: socialLinks, error: socialError } = await supabase
      .from("alumni_social_links")
      .select("alumni_link, alumni_link_name")
      .eq("alumni_id", alumniId);

    alumnus.social_links = socialError ? [] : socialLinks || [];

    res.status(200).json(alumnus);
  } catch (error) {
    console.error("❌ Error fetching alumni by ID:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error fetching alumni by ID",
    });
  }
};
