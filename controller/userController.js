const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const signup = async (req, res) => {
  try {
    const { displayName, email, phone, password, role, ...additionalData } = req.body;

    // Validate required fields
    if (!displayName || !email || !phone || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Validate role
    if (!['ADMIN', 'ALUMNI'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be either ADMIN or ALUMNI' 
      });
    }

    // Validate additional fields for ALUMNI
    if (role === 'ALUMNI' && (
      !additionalData.course || 
      !additionalData.stream || 
      !additionalData.occupation || 
      !additionalData.yearOfGraduation
    )) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required alumni fields: course, stream, occupation, yearOfGraduation' 
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          phone,
          role
        }
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }

    const user = authData.user;
    let tableData;

    // Prepare data based on role
    if (role === 'ADMIN') {
      tableData = {
        admin_id: user.id,
        admin_name: displayName,
        admin_email: email,
        admin_phone_no: phone
      };
    } else { // ALUMNI
      tableData = {
        alumni_id: user.id,
        alumni_name: displayName,
        alumni_email: email,
        alumni_phone_no: phone,
        alumni_course: additionalData.course,
        alumni_stream: additionalData.stream,
        alumni_occupation: additionalData.occupation,
        alumni_year_of_graduation: parseInt(additionalData.yearOfGraduation, 10)
      };
    }

    // Insert into the appropriate table
    const { data, error: dbError } = await supabase
      .from(role === 'ADMIN' ? 'admins' : 'alumni')
      .insert([tableData])
      .select();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        id: user.id,
        email: user.email,
        role,
        ...(role === 'ALUMNI' && {
          course: additionalData.course,
          stream: additionalData.stream,
          occupation: additionalData.occupation,
          yearOfGraduation: additionalData.yearOfGraduation
        })
      }
    });

  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

module.exports = {
  signup
};
