// controller/messageController.js
import { supabase } from "../config/supabase.js";

/**
//  * Create a message by an admin for alumni
//  * POST /api/messages/:adminId/createMessage
//  */
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
    const { data: messagesData, error } = await supabase
      .from("admin_alumni_messages")
      .insert(messagesToInsert)
      .select();

    if (error) throw error;

    // Prepare invitations data for alumni_invitations table
    const invitationsToInsert = messagesData.map(message => ({
      admin_alumni_message_id: message.admin_alumni_message_id || message.id,
      event_id: message.event_id,
      alumni_confirmation_status: 'PENDING',
      alumni_response_message: null
    }));

    // Insert invitations in a single batch
    const { error: invitationError } = await supabase
      .from("alumni_invitations")
      .insert(invitationsToInsert);

    if (invitationError) throw invitationError;

    return res.status(201).json({
      success: true,
      message: "Message and invitations created successfully",
      data: messagesData,
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

// GET /api/messages/:alumniId/getAllInvitations
export const getAllInvitations = async (req, res) => {
  const { alumniId } = req.params;

  try {
    // Fetch invitations for this alumni
    const { data, error } = await supabase
      .from("alumni_invitations")
      .select(`
        alumni_invitation_id,
        event_id,
        created_at,
        admin_alumni_messages!inner (
          alumni_id
        ),
        events (
          event_name,
          event_description,
          event_poster_key,
          event_date_time
        )
      `)
      .eq("admin_alumni_messages.alumni_id", alumniId);

    if (error) throw error;

    res.status(200).json({
      success: true,
      invitations: data,
    });
  } catch (err) {
    console.error("❌ Error fetching invitations:", err.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};