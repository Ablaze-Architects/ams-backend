const { v4: uuidv4 } = require('uuid');
const { supabase, supabaseAdmin } = require('../config/supabase');

const signup = async (req, res) => {
  try {
    const { displayName, email, phone, password, role, socialLinks = [], ...additionalData } = req.body;

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
    if (role === 'ALUMNI') {
      // Validate required alumni fields
      if (!additionalData.course || 
          !additionalData.stream || 
          !additionalData.occupation || 
          !additionalData.yearOfGraduation) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required alumni fields: course, stream, occupation, yearOfGraduation' 
        });
      }

      // Define allowed social media platforms based on database enum
      const ALLOWED_SOCIAL_PLATFORMS = [
        'LINKEDIN',
        'GITHUB',
        'FACEBOOK',
        'INSTAGRAM',
        'REDDIT',
        'OTHER'
      ];

      // Validate social links if provided
      if (socialLinks && socialLinks.length > 0) {
        // Check for invalid platforms first
        const invalidLinks = socialLinks.filter(
          link => link.alumni_link_name && 
                 !ALLOWED_SOCIAL_PLATFORMS.includes(link.alumni_link_name.toUpperCase())
        );
        
        if (invalidLinks.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Invalid social platform(s): ${invalidLinks.map(l => l.alumni_link_name).join(', ')}. ` +
                     `Allowed values are: ${ALLOWED_SOCIAL_PLATFORMS.join(', ')}`
          });
        }
        
        // Filter out any invalid links (missing either link or name)
        const validSocialLinks = socialLinks.filter(link => link.alumni_link && link.alumni_link_name);
        
        // Update socialLinks to only include valid ones
        socialLinks.length = 0;
        socialLinks.push(...validSocialLinks);
        
        // Check if number of valid social links exceeds 5
        if (socialLinks.length > 5) {
          return res.status(400).json({
            success: false,
            message: 'Maximum of 5 social links allowed'
          });
        }
      }
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

    // Insert social links for alumni if any valid links are provided
    if (role === 'ALUMNI' && socialLinks && socialLinks.length > 0) {
      try {
        console.log('Processing social links:', JSON.stringify(socialLinks, null, 2));
        
        const socialLinksData = socialLinks.map(link => ({
          alumni_id: user.id,
          alumni_link: link.alumni_link,
          // Convert to uppercase to match enum values in the database
          alumni_link_name: link.alumni_link_name.toUpperCase()
        }));

        console.log('Prepared social links data for DB:', JSON.stringify(socialLinksData, null, 2));
        
        const { data: insertedLinks, error: linksError } = await supabase
          .from('alumni_social_links')
          .insert(socialLinksData)
          .select();

        if (linksError) {
          console.error('Error saving social links:', linksError);
          // Continue execution even if social links fail to save
        } else {
          console.log('Successfully saved social links:', JSON.stringify(insertedLinks, null, 2));
        }
      } catch (error) {
        console.error('Unexpected error processing social links:', error);
        // Continue with user creation even if social links fail
      }
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

const logout = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get the current user's session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return res.status(401).json({
        success: false,
        message: 'No active session found'
      });
    }
    
    // Verify the requesting user matches the session user
    if (session.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to perform this action'
      });
    }
    
    // Sign out the current user
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      console.error('Error signing out:', signOutError);
      return res.status(500).json({
        success: false,
        message: 'Error during logout',
        error: signOutError.message
      });
    }

    // You might want to perform additional cleanup here if needed
    // For example, invalidating refresh tokens or session records

    return res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      error: error.message
    });
  }
};



module.exports = {
  signup,
  login,
  logout
};
