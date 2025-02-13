// Path: backend/services/authService.js

const userService = require('./userService');
const { AuthError } = require('../middleware/errorMiddleware');

class AuthService {
  async verifyGoogleAuth(profile) {
    if (!profile?.id || !profile?.emails?.[0]?.value) {
      throw new AuthError('Invalid Google profile data');
    }

    const user = await userService.findOrCreateGoogleUser(profile);
    await userService.updateLastLogin(user._id);
    return user;
  }

  checkUserPermissions(user, requiredRole) {
    if (!user) {
      throw new AuthError('Authentication required');
    }

    if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
      throw new AuthError('Insufficient permissions');
    }

    return true;
  }

  isAdmin(user) {
    return user?.role === 'admin';
  }

  isAuthenticated(user) {
    return user?.role === 'admin' || user?.role === 'authenticated';
  }

  async logout(req) {
    return new Promise((resolve, reject) => {
      req.logout((err) => {
        if (err) reject(new AuthError('Logout failed'));
        req.session.destroy((err) => {
          if (err) reject(new AuthError('Session destruction failed'));
          resolve();
        });
      });
    });
  }
}

module.exports = new AuthService();