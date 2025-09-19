// controller/messageController.js
import { supabase } from "../config/supabase.js";

/**
 * Create a message by an admin for alumni
 * POST /api/messages/:adminId/createMessage
 */
export const createMessage = async (req, res) => {
  const { adminId } = req.params;
  const { alumni_ids, event_id, message, message_file_key } = req.body;

  try {
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message content is required",
      });
    }

    if (!alumni_ids || !Array.isArray(alumni_ids) || alumni_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one alumni_id is required",
      });
    }

    if (!event_id) {
      return res.status(400).json({
        success: false,
        message: "event_id is required",
      });
    }

    // Prepare messages for all alumni
    const messagesToInsert = alumni_ids.map(alumni_id => ({
      admin_id: adminId,
      alumni_id,
      event_id,  // event_id is now required
      message,
      message_file_key: message_file_key || null
    }));

    // Insert all messages in a single batch
    const { data, error } = await supabase
      .from("admin_alumni_messages")
      .insert(messagesToInsert)
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
