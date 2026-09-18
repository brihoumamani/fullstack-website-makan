// makan-backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token
const generateToken = (userId, role) => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'makan_secure_jwt_secret_dz_2026',
    { expiresIn: '7d' }
  );
};

// Cookie options helper
const getCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  };
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // 1. Check if user exists
    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate({
      path: 'favorites',
      populate: { path: 'agentId' }
    });
    if (!user) {
      // Return exact 404 status code as requested
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 2. Validate password with bcrypt compare
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Return exact 401 status code as requested
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // 3. Generate JWT
    const token = generateToken(user._id, user.role);

    // 4. Set httpOnly cookie
    res.cookie('token', token, getCookieOptions());

    // 5. Send 200 OK response with user payload
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipType: user.membershipType,
        companyName: user.companyName,
        phone: user.phone,
        avatar: user.avatar,
        hasAdvertiserProfile: user.hasAdvertiserProfile || false,
        activeDashboardMode: user.activeDashboardMode || 'client',
        advertiserProfile: user.advertiserProfile || {},
        wilaya: user.wilaya || '',
        commune: user.commune || '',
        address: user.address || '',
        emailConsent: user.emailConsent || false,
        smsConsent: user.smsConsent || false,
        favorites: user.favorites || []
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      membershipType,
      companyName,
      taxNumber,
      phone,
      avatar
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user
    const user = await User.create({
      name: name || (membershipType === 'corporate' ? companyName : 'MAKAN User'),
      email: trimmedEmail,
      password,
      role: role || 'user',
      membershipType: membershipType || 'individual',
      companyName: companyName || '',
      taxNumber: taxNumber || '',
      phone: phone || '',
      avatar: avatar || undefined
    });

    // Generate JWT
    const token = generateToken(user._id, user.role);

    // Set cookie
    res.cookie('token', token, getCookieOptions());

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipType: user.membershipType,
        companyName: user.companyName,
        phone: user.phone,
        avatar: user.avatar,
        hasAdvertiserProfile: user.hasAdvertiserProfile || false,
        activeDashboardMode: user.activeDashboardMode || 'client',
        advertiserProfile: user.advertiserProfile || {},
        wilaya: user.wilaya || '',
        commune: user.commune || '',
        address: user.address || '',
        emailConsent: user.emailConsent || false,
        smsConsent: user.smsConsent || false,
        favorites: user.favorites || []
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout',
      error: error.message
    });
  }
};

// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // Extract token from cookie or Authorization header
    let token = req.cookies?.token;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'makan_secure_jwt_secret_dz_2026'
    );

    const user = await User.findById(decoded.userId).select('-password').populate({
      path: 'favorites',
      populate: { path: 'agentId' }
    });
    if (!user) {
      res.clearCookie('token', getCookieOptions());
      return res.status(401).json({
        success: false,
        message: 'User not found or session expired'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        membershipType: user.membershipType,
        companyName: user.companyName,
        phone: user.phone,
        avatar: user.avatar,
        hasAdvertiserProfile: user.hasAdvertiserProfile || false,
        activeDashboardMode: user.activeDashboardMode || 'client',
        advertiserProfile: user.advertiserProfile || {},
        wilaya: user.wilaya || '',
        commune: user.commune || '',
        address: user.address || '',
        emailConsent: user.emailConsent || false,
        smsConsent: user.smsConsent || false,
        favorites: user.favorites || []
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token'
    });
  }
};

module.exports = {
  login,
  register,
  logout,
  getMe
};
