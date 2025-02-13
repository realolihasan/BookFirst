// Path : backend\routes\userRoutes.js

const express = require('express');
const { isAuthenticated, isAdmin, isAdminOrCoAdmin } = require('../middleware/authMiddleware');
const { catchAsync } = require('../middleware/errorMiddleware');
const userService = require('../services/userService');

const router = express.Router();

//------------------------------------------------------------------------------
// Controller Logic
//------------------------------------------------------------------------------

const getCurrentUser = catchAsync(async (req, res) => {
  const user = await userService.getUser(req.user._id);
  res.status(200).json({
    status: 'success',
    data: user
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: users
  });
});

const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUser(req.params.id);
  res.status(200).json({
    status: 'success',
    data: user
  });
});

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({
    status: 'success',
    data: user
  });
});

const updateRole = catchAsync(async (req, res) => {
  const user = await userService.updateRole(req.body.userId, req.body.role, req.body.portfolioId);  // fixed
  res.status(200).json({
    status: 'success',
    data: user
  });
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.user, req.params.id);
  res.status(204).json({
    status: 'success',
    data: null
  });
});

const setupStripeConnect = catchAsync(async (req, res) => {
  const stripeUrl = await userService.createStripeConnectAccount(req.user);
  res.status(200).json({
    status: 'success',
    data: { url: stripeUrl }
  });
});

//------------------------------------------------------------------------------
// Routes
//------------------------------------------------------------------------------

router.use(isAuthenticated);

router.get('/me', getCurrentUser);

// Routes accessible by both Admin and Co-Admin
router.get('/', isAdminOrCoAdmin, getAllUsers);
router.get('/:id', isAdminOrCoAdmin, getUserById);

// Admin only routes
router.post('/', isAdmin, createUser);
router.post('/role', isAdmin, updateRole);
router.delete('/:id', isAdmin, deleteUser);
router.post('/stripe-connect', isAdmin, setupStripeConnect);

module.exports = router;