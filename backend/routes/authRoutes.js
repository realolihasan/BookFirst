// Path: backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const { USER_ROLES } = require('../config/constants');
const User = require('../models/User');
const { catchAsync } = require('../middleware/errorMiddleware');

// Use the globally exposed passport instance from server.js
const passport = global.passport;

// Route to initiate Google authentication
router.get('/google', (req, res, next) => {
  // Store the return URL if provided
  if (req.query.returnTo) {
    req.session.returnTo = req.query.returnTo;
  }
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    prompt: 'select_account' // Always show account selector
  })(req, res, next);
});

// Google authentication callback route
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  catchAsync(async (req, res) => {
    try {
      // Get or create user from the passport authentication
      const user = req.user;
      
      // If this is a new user, set default role to PUBLIC
      if (!user.role || user.role === USER_ROLES.PUBLIC) {
        user.role = USER_ROLES.PUBLIC;
        await user.save();
      }

      // Update last login timestamp
      user.lastLogin = new Date();
      await user.save();

      // Redirect to the stored returnTo URL or default location
      const returnTo = req.session.returnTo || process.env.CLIENT_URL || 'http://localhost:5173';
      delete req.session.returnTo;

      res.redirect(returnTo);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
  })
);

// Route to get the authenticated user's information
router.get('/user', (req, res) => {
  if (req.isAuthenticated() && req.user) {
    // Handle both Mongoose documents and plain objects
    const userInfo = req.user.toObject ? req.user.toObject() : req.user;
    
    // Remove sensitive information
    const { 
      googleId, 
      __v, 
      workHistory,
      ...safeUserInfo 
    } = userInfo;

    res.json(safeUserInfo);
  } else {
    res.status(401).json({ 
      status: 'error', 
      message: 'User not authenticated' 
    });
  }
});

// Route to check authentication status
router.get('/status', (req, res) => {
  res.json({
    isAuthenticated: req.isAuthenticated(),
    user: req.user ? req.user.toPublicJSON() : null
  });
});

// Route to log out the user
router.get('/logout', (req, res, next) => {
  // Get return URL before destroying session
  const returnTo = req.query.returnTo || process.env.CLIENT_URL || 'http://localhost:5173';

  req.logout((err) => {
    if (err) {
      console.error("Logout error:", err);
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
        return next(err);
      }
      // Clear the cookie
      res.clearCookie(process.env.SESSION_NAME || 'connect.sid');
      res.redirect(returnTo);
    });
  });
});

// Debug route (only in development)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug', (req, res) => {
    res.json({
      session: req.session,
      user: req.user,
      cookies: req.cookies,
      isAuthenticated: req.isAuthenticated()
    });
  });
}

router.get('/debug-session', (req, res) => {
  res.json({
    session: req.session,
    user: req.user,
    isAuthenticated: req.isAuthenticated(),
    cookies: req.cookies,
    headers: req.headers
  });
});

module.exports = router;