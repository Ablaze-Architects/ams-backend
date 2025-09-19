// controller/messageController.js
import { supabase } from "../config/supabase.js";

/**
 * Create a message by an admin for alumni
 * POST /api/messages/:adminId/createMessage
 */
export const createMessage = async (req, res) => {
  const { adminId } = req.params;
  const { alumni_id, event_id, message, message_file_key } = req.body;

  try {
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    // Insert into admin_alumni_messages
    const { data, error } = await supabase
      .from("admin_alumni_messages")
      .insert([
        {
          admin_id: adminId,
          alumni_id,
          event_id,
          message,
          message_file_key,
        },
      ])
      .select();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: "Message created successfully",
      data,
    });
  } catch (err) {
    console.error("Error creating message:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
