const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Society = require('../models/Society');
const Amenity = require('../models/Amenity');
const { logInfo, logError } = require('../logger');

/**
 * Middleware to validate admin secret key
 */
const validateSecretKey = async (req, res, next) => {
  try {
    const { society_id } = req.params;
    const { key } = req.query;

    // Validate required fields
    if (!society_id || !key) {
      return res.status(400).json({
        success: false,
        message: 'Society ID and admin key are required'
      });
    }

    // Find society by ID
    const society = await Society.findOne({ society_id });
    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }

    // Check if key matches
    if (society.admin_secret_key !== key) {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin key'
      });
    }

    // Check if key is expired
    if (new Date() > new Date(society.admin_secret_key_expires)) {
      return res.status(401).json({
        success: false,
        message: 'Admin key has expired. Please request a new key.'
      });
    }

    // Add society to request object
    req.society = society;
    next();
  } catch (error) {
    logError('Error validating admin key', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'An error occurred while validating admin key',
      error: error.message
    });
  }
};

/**
 * Load society setup page
 */
router.get('/:society_id', validateSecretKey, (req, res) => {
  try {
    // This endpoint would normally render a setup page
    // Since we're just building API endpoints, we'll return JSON instead
    
    res.status(200).json({
      success: true,
      message: 'Society setup page',
      society: {
        society_id: req.society.society_id,
        society_name: req.society.society_name,
        is_verified: req.society.is_verified,
        needs_password_setup: !req.society.password
      }
    });
  } catch (error) {
    logError('Error loading setup page', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'An error occurred while loading setup page',
      error: error.message
    });
  }
});

/**
 * Set up society admin password
 */
router.post('/:society_id/set-password', validateSecretKey, async (req, res) => {
  try {
    const { password, confirm_password } = req.body;

    // Validate password
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Validate password strength (minimum 8 characters, at least one uppercase, one lowercase, one number)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update society with hashed password
    req.society.password = hashedPassword;
    await req.society.save();

    // Log password setup
    logInfo('Society admin password set', {
      society_id: req.society.society_id
    });

    res.status(200).json({
      success: true,
      message: 'Password set successfully',
      redirect_to: `/society/setup/${req.society.society_id}/configure?key=${req.society.admin_secret_key}`
    });
  } catch (error) {
    logError('Error setting password', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'An error occurred while setting password',
      error: error.message
    });
  }
});

/**
 * Configure society (amenities, facilities, etc.)
 */
router.post('/:society_id/configure', validateSecretKey, async (req, res) => {
  try {
    const { amenities } = req.body;

    // If amenities were provided, create them
    if (amenities && Array.isArray(amenities)) {
      for (const amenity of amenities) {
        const newAmenity = new Amenity({
          society_id: req.society.society_id,
          amenity_name: amenity.name,
          amenity_type: amenity.type
        });
        await newAmenity.save();
      }

      // Log amenities setup
      logInfo('Society amenities configured', {
        society_id: req.society.society_id,
        amenity_count: amenities.length
      });
    }

    res.status(200).json({
      success: true,
      message: 'Society configured successfully',
      society_id: req.society.society_id,
      private_key: req.society.private_key
    });
  } catch (error) {
    logError('Error configuring society', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'An error occurred while configuring society',
      error: error.message
    });
  }
});

module.exports = router; 