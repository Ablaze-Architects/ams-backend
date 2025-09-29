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

    // Check for duplicate invitations for the same event and alumni
    const { data: existingMessages, error: existingError } = await supabase
      .from("admin_alumni_messages")
      .select("alumni_id")
      .eq("event_id", event_id)
      .in("alumni_id", alumni_ids);

    if (existingError) throw existingError;

    const duplicateAlumniIds = Array.from(new Set((existingMessages || []).map((r) => r.alumni_id)));
    if (duplicateAlumniIds.length > 0) {
      return res.status(409).json({
        success: false,
        message: "One or more alumni already have an invitation for this event",
        duplicates: duplicateAlumniIds,
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

// PATCH /api/messages/:alumniId/:eventId/updateInvitationStatus
// Body: { alumni_confirmation_status: 'ACCEPTED' | 'REJECTED', alumni_response_message?: string }
export const updateInvitationStatus = async (req, res) => {
  const { alumniId, eventId } = req.params;
  const { alumni_confirmation_status, alumni_response_message } = req.body || {};

  try {
    // Validate status
    const allowed = ["ACCEPTED", "REJECTED"];
    if (!alumni_confirmation_status || !allowed.includes(alumni_confirmation_status)) {
      return res.status(400).json({
        success: false,
        message: "alumni_confirmation_status must be one of: ACCEPTED, REJECTED",
      });
    }

    // 1) Check admin_alumni_messages for this alumniId
    const { data: aams, error: aamsError } = await supabase
      .from("admin_alumni_messages")
      .select("admin_alumni_message_id, created_at")
      .eq("alumni_id", alumniId)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (aamsError) throw aamsError;
    if (!aams || aams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No message found for the given alumniId and eventId",
      });
    }

    const adminAlumniMessageId = aams[0].admin_alumni_message_id;

    // 2) Check alumni_invitations for that admin_alumni_message_id (and event)
    const { data: invitations, error: invSelError } = await supabase
      .from("alumni_invitations")
      .select("alumni_invitation_id")
      .eq("admin_alumni_message_id", adminAlumniMessageId)
      .eq("event_id", eventId)
      .limit(1);

    if (invSelError) throw invSelError;
    if (!invitations || invitations.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No invitation found for the given alumniId and eventId",
      });
    }

    const alumniInvitationId = invitations[0].alumni_invitation_id;

    // 3) Update invitation with new status and response
    const { data: updated, error: updError } = await supabase
      .from("alumni_invitations")
      .update({
        alumni_confirmation_status,
        alumni_response_message: alumni_response_message ?? null,
      })
      .eq("alumni_invitation_id", alumniInvitationId)
      .select()
      .single();

    if (updError) throw updError;

    return res.status(200).json({
      success: true,
      message: "Invitation status updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Error updating invitation status:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
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