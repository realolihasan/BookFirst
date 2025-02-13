// Path: backend/services/userService.js

const User = require('../models/User');
const { USER_ROLES } = require('../config/constants');
const { NotFoundError, ValidationError, ForbiddenError } = require('../middleware/errorMiddleware');

class UserService {
  async createUser(userData) {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    const user = new User({
      ...userData,
      role: userData.email === process.env.ADMIN_EMAIL ? USER_ROLES.ADMIN : USER_ROLES.PUBLIC
    });

    await user.save();
    return user;
  }

  async getUser(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async getAllUsers() {
    return User.find().select('-__v');
  }

  async updateRole(userId, newRole, portfolioId = null) {
    if (!Object.values(USER_ROLES).includes(newRole)) {
      throw new ValidationError('Invalid role');
    }
  
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      throw new NotFoundError('User not found');
    }
  
    targetUser.role = newRole;
    if (newRole === USER_ROLES.MODEL) {
      if (!portfolioId) {
        throw new ValidationError('Portfolio ID is required for model role');
      }
      targetUser.portfolioId = portfolioId;
    } else {
      targetUser.portfolioId = null; // Clear portfolioId if not a model
    }
  
    await targetUser.save();
    return targetUser;
  }

  async deleteUser(currentUser, userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.email === currentUser.email) {
      throw new ForbiddenError('Cannot delete your own account');
    }

    await user.deleteOne();
    return { message: 'User deleted successfully' };
  }

  async findOrCreateGoogleUser(profile) {
    let user = await User.findOne({ googleId: profile.id });

    if (!user) {
      user = await this.createUser({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0].value
      });
    }

    return user;
  }

  async updateLastLogin(userId) {
    await User.findByIdAndUpdate(userId, { 
      lastLogin: new Date(),
      $inc: { loginCount: 1 }
    });
  }

  async getAdmins() {
    return User.find({ role: USER_ROLES.ADMIN });
  }
  

async createStripeConnectAccount(user) {
  if (!user.role === USER_ROLES.MODEL && !user.role === USER_ROLES.CO_ADMIN) {
    throw new ForbiddenError('Only models and co-admins can connect Stripe accounts');
  }

  const account = await stripeService.createConnectAccount({
    email: user.email,
    type: 'express'
  });

  user.stripeConnectId = account.id;
  await user.save();

  return account.accountLink;
}

}

module.exports = new UserService();