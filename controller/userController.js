const { v4: uuidv4 } = require('uuid');
const { supabase, supabaseAdmin } = require('../config/supabase');

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

    // First create the user with email confirmation disabled
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        display_name: displayName,
        phone,
        role
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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    // Authenticate user with Supabase using the regular client
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      
      if (error.message === 'Email not confirmed') {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in. Check your inbox for the verification link.'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: error.message || 'Invalid email or password',
      });
    }

    // Get additional user data based on role
    const { user } = data;
    const role = user.user_metadata?.role || 'ALUMNI';
    const tableName = role === 'ADMIN' ? 'admins' : 'alumni';
    const idField = role === 'ADMIN' ? 'admin_id' : 'alumni_id';

    const { data: userData, error: userError } = await supabase
      .from(tableName)
      .select('*')
      .eq(idField, user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      // Still return success since auth was successful
      return res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          role,
          metadata: user.user_metadata
        }
      });
    }

    // Combine auth and user data
    const responseData = {
      id: user.id,
      email: user.email,
      role,
      ...userData,
      metadata: user.user_metadata
    };

    // Remove sensitive fields
    delete responseData.password;
    delete responseData.encrypted_password;

    res.json({
      success: true,
      message: 'Login successful',
      user: responseData
    });

  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  signup,
  login
};
