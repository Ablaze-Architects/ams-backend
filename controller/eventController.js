const { supabase } = require('../config/supabase');

// @desc    Get all events with admin details
// @route   GET /api/events/:adminId/getAllEvents
// @access  Private/Admin
exports.getAllEvents = async (req, res) => {
    try {
        const { adminId } = req.params;

        // Verify the admin exists (for authentication only)
        const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', adminId)
            .single();

        if (adminError || !admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found or unauthorized'
            });
        }

        // Get all events with admin details using a join
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select(`
                event_id,
                admin_id,
                admins:admin_id (admin_name),
                event_name,
                event_description,
                event_poster_key,
                event_date_time,
                created_at,
                updated_at
            `);

        if (eventsError) {
            console.error('Error fetching events:', eventsError);
            throw new Error('Failed to fetch events');
        }

        // Format the response to include admin details
        const formattedEvents = events.map(event => ({
            event_id: event.event_id,
            admin_id: event.admin_id,
            admin_name: event.admins?.admin_name || 'Unknown Admin',
            event_name: event.event_name,
            event_description: event.event_description,
            event_poster_key: event.event_poster_key,
            event_date_time: event.event_date_time,
            created_at: event.created_at,
            updated_at: event.updated_at
        }));

        res.status(200).json({
            success: true,
            count: formattedEvents.length,
            data: formattedEvents
        });

    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching events',
            error: error.message
        });
    }
};


// @desc    Create a new event
// @route   POST /api/events/:adminId/createEvent
// @access  Private/Admin
exports.createEvent = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { 
            event_name, 
            event_description = '', 
            event_poster_key = null, 
            event_date_time 
        } = req.body;

        // Basic validation
        if (!event_name || !event_date_time) {
            return res.status(400).json({
                success: false,
                message: 'Event name and date/time are required'
            });
        }

        // Verify the admin exists in the admins table
        const { data: admin, error: adminError } = await supabase
            .from('admins')
            .select('admin_id')
            .eq('admin_id', adminId)
            .single();

        if (adminError || !admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found or unauthorized'
            });
        }

        // Insert the new event into the events table
        const { data: newEvent, error: insertError } = await supabase
            .from('events')
            .insert([
                {
                    admin_id: adminId,
                    event_name,
                    event_description,
                    event_poster_key,
                    event_date_time: new Date(event_date_time).toISOString(),
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting event:', insertError);
            throw new Error('Failed to create event');
        }

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: newEvent
        });

    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while creating event',
            error: error.message
        });
    }
};
