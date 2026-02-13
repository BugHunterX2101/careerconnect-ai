const express = require('express');
const router = express.Router();

// Test endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Test route is working',
    timestamp: new Date().toISOString(),
    server: 'CareerConnect AI',
    version: '2.0.0'
  });
});

// Database test
router.get('/db', async (req, res) => {
  try {
    const { getSequelize } = require('../database/sequelize');
    const sequelize = getSequelize();
    await sequelize.authenticate();
    res.json({
      success: true,
      message: 'Database connection is working',
      database: 'SQLite'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// User model test
router.get('/user-model', async (req, res) => {
  try {
    const { User } = require('../models/User');
    const UserModel = User();
    res.json({
      success: true,
      message: 'User model is available',
      model: 'User'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'User model not available',
      error: error.message
    });
  }
});

module.exports = router;