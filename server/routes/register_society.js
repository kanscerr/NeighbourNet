const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const Society = require('../models/Society');
const { logInfo, logError } = require('../logger');
const { 
  sendAdminVerificationEmail, 
  sendSocietySetupEmail, 
  sendVerificationEmail,
  sendSecretKeyEmail 
} = require('../utils/emailService');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create society-specific directory
    const societyDir = path.join(uploadsDir, req.body.society_name.replace(/\s+/g, '_'));
    if (!fs.existsSync(societyDir)) {
      fs.mkdirSync(societyDir, { recursive: true });
    }
    cb(null, societyDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    cb(null, 'verification-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to allow only certain file types
const fileFilter = (req, file, cb) => {
  // Accept images and PDF
  const allowedFileTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, PDF, DOC, and DOCX files are allowed'), false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB limit
  }
});

/**
 * Step 1: Register a new society
 * This endpoint handles the initial registration of a society
 */
router.post('/register', upload.array('verification_documents', 5), async (req, res) => {
  try {
    const {
      society_name,
      city,
      address,
      email,
      contact_number
    } = req.body;

    // Validate required fields
    if (!society_name || !city || !address || !email || !contact_number) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate if files were uploaded
    // if (!req.files || req.files.length === 0) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Verification documents are required'
    //   });
    // }

    // Check if society with same email already exists
    const existingSociety = await Society.findOne({ email });
    if (existingSociety) {
      return res.status(400).json({
        success: false,
        message: 'A society with this email already exists'
      });
    }

    // Create new society
    const newSociety = new Society({
      society_name,
      city,
      address,
      email,
      contact_number,
    //   verification_files: req.files.map(file => file.path.replace(/\\/g, '/')),
      is_verified: false
    });

    // Save the society to database
    await newSociety.save();

    // Log the society registration
    logInfo('New society registered', {
      society_id: newSociety.society_id,
      society_name: newSociety.society_name
    });

    // Send verification email to society email
    await sendVerificationEmail(newSociety);

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Society registered successfully. Please check your email for verification.',
      society_id: newSociety.society_id,
      private_key: newSociety.private_key,
      admin_secret_key: newSociety.admin_secret_key
    });

  } catch (error) {
    logError('Error registering society', {
      error: error.message,
      stack: error.stack
    });

    // Check for specific error types
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the limit of 5MB'
      });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred during registration',
      error: error.message
    });
  }
});

/**
 * Verify society email
 * This endpoint handles the verification of a society's email
 */
router.get('/verify/:society_id', async (req, res) => {
  try {
    const { society_id } = req.params;

    // Find society by ID
    const society = await Society.findOne({ society_id });
    if (!society) {
      return res.status(404).json({
        success: false,
        message: 'Society not found'
      });
    }

    // Update email verification status
    society.email_verified = true;
    await society.save();

    // Log the verification
    logInfo('Society email verified', {
      society_id: society.society_id,
      society_name: society.society_name
    });

    // Send email to admin for verification with all details and files
    await sendAdminVerificationEmail(society, society.verification_files.map(filePath => ({ path: filePath })));

    // Return success page instead of redirecting
    res.send(`
      <html>
        <head>
          <title>Email Verified</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .success { color: green; }
            .box { border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1 class="success">Email Verified Successfully!</h1>
          <div class="box">
            <p>Thank you for verifying your email address.</p>
            <p>Your society registration is now pending admin approval.</p>
            <p>Once an administrator verifies your details, you will receive a setup link via email.</p>
            <p>Society ID: ${society.society_id}</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    logError('Error verifying society email', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'An error occurred during verification',
      error: error.message
    });
  }
});

/**
 * Admin verification of society
 * This endpoint allows an admin to verify a society registration
 */
router.get('/admin-verify/:society_id', async (req, res) => {
  try {
    const { society_id } = req.params;
    const { key } = req.query;

    // Verify admin key
    if (key !== (process.env.ADMIN_VERIFICATION_KEY || 'admin123')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Invalid admin key'
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

    // Update verification status
    society.is_verified = true;
    await society.save();

    // Log the admin verification
    logInfo('Society verified by admin', {
      society_id: society.society_id,
      society_name: society.society_name
    });

    // Send email to society with setup link
    await sendSocietySetupEmail(society);

    // Return success page
    res.send(`
      <html>
        <head>
          <title>Society Verified</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .success { color: green; }
            .box { border: 1px solid #ddd; padding: 20px; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1 class="success">Society Verified Successfully!</h1>
          <div class="box">
            <p>You have successfully verified the society:</p>
            <p><strong>${society.society_name}</strong></p>
            <p>An email with setup instructions has been sent to the society admin.</p>
          </div>
        </body>
      </html>
    `);

  } catch (error) {
    logError('Error in admin verification', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'An error occurred during admin verification',
      error: error.message
    });
  }
});

//regenerate admin secret key
router.post('/regenerate-key', async (req, res) => {
  try {
    const { society_id, email, previous_key } = req.body;
    let society;
    if (society_id && email) {
      // Find society by society_id and email combination
      society = await Society.findOne({ admin_secret_key: previous_key, email });
      if (!society) {
        return res.status(404).json({
          success: false,
          message: 'Society not found or email does not match'
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either previous secret key OR society ID and email are required'
      });
    }

    // Generate new 16-digit admin secret key
    const admin_secret_key_expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    society.admin_secret_key_expires = admin_secret_key_expires;
    society.admin_secret_key = undefined;
    await society.save();
    await sendSecretKeyEmail(society);

    logInfo('Admin secret key regenerated', {
      society_id: society.society_id
    });

    res.status(200).json({
      success: true,
      message: 'Admin secret key regenerated successfully. Please check your email.',
      admin_secret_key: society.admin_secret_key
    });

  } catch (error) {
    logError('Error regenerating admin secret key', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'An error occurred during key regeneration',
      error: error.message
    });
  }
});

module.exports = router;
