const nodemailer = require('nodemailer');
const { logInfo, logError } = require('../logger');
const fs = require('fs');
const path = require('path');

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD
    }
  });
};

/**
 * Send email to admin with new society registration details
 * @param {Object} society - The society object
 * @param {Array} files - Array of uploaded files
 */
const sendAdminVerificationEmail = async (society, files) => {
  try {
    const transporter = createTransporter();
    
    // Create file attachments
    const attachments = files.map(file => {
      return {
        filename: path.basename(file.path),
        path: file.path
      };
    });

    // Prepare email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `[VERIFICATION NEEDED] New Society Registration: ${society.society_name}`,
      html: `
        <h1>New Society Registration Needs Verification</h1>
        <p>A new society has registered and needs your verification:</p>
        <table border="1" cellpadding="5" style="border-collapse: collapse;">
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Society ID</td>
            <td>${society.society_id}</td>
          </tr>
          <tr>
            <td>Society Name</td>
            <td>${society.society_name}</td>
          </tr>
          <tr>
            <td>City</td>
            <td>${society.city}</td>
          </tr>
          <tr>
            <td>Address</td>
            <td>${society.address}</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>${society.email}</td>
          </tr>
          <tr>
            <td>Contact Number</td>
            <td>${society.contact_number}</td>
          </tr>
          <tr>
            <td>Admin Secret Key</td>
            <td>${society.admin_secret_key}</td>
          </tr>
        </table>
        <p>Documents have been attached to this email for verification.</p>
        <p>To verify this society, click the link below:</p>
        <a href="http://localhost:${process.env.PORT || 5000}/api/society/admin-verify/${society.society_id}?key=${process.env.ADMIN_VERIFICATION_KEY || 'admin123'}">
          Verify Society
        </a>
        <p>Thank you.</p>
      `,
      attachments: attachments
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    logInfo('Admin verification email sent', {
      society_id: society.society_id,
      admin_email: process.env.ADMIN_EMAIL
    });
    
    return true;
  } catch (error) {
    logError('Error sending admin verification email', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

/**
 * Send email to society with setup instructions
 * @param {Object} society - The society object
 */
const sendSocietySetupEmail = async (society) => {
  try {
    const transporter = createTransporter();
    
    const setupUrl = `http://localhost:${process.env.PORT || 5000}/society/setup/${society.society_id}?key=${society.admin_secret_key}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: society.email,
      subject: 'Your NeighbourNet Society Registration is Verified',
      html: `
        <h1>Welcome to NeighbourNet!</h1>
        <p>Congratulations! Your society <strong>${society.society_name}</strong> has been verified.</p>
        <p>You can now set up your society workspace by clicking the link below:</p>
        <a href="${setupUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          Set Up Your Society
        </a>
        <p>This link is valid for 7 days. Your admin secret key is: <strong>${society.admin_secret_key}</strong></p>
        <p>Please keep your society details secure:</p>
        <ul>
          <li>Private Key: ${society.admin_secret_key}</li>
        </ul>
        <p>Thank you for choosing NeighbourNet for your society management needs.</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    logInfo('Society setup email sent', {
      society_id: society.society_id,
      society_email: society.email
    });
    
    return true;
  } catch (error) {
    logError('Error sending society setup email', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

/**
 * Send verification email to society admin
 * @param {Object} society - The society object
 */
const sendVerificationEmail = async (society) => {
  try {
    const transporter = createTransporter();
    
    const verifyUrl = `http://localhost:${process.env.PORT || 5000}/api/society/verify/${society.society_id}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: society.email,
      subject: 'Verify Your NeighbourNet Society Registration',
      html: `
        <h1>Welcome to NeighbourNet!</h1>
        <p>Thank you for registering your society. Please verify your email by clicking the link below:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          Verify Your Society Email
        </a>
        <p>After email verification, an administrator will review your documents and approve your registration.</p>
        <p>Your society details:</p>
        <p>Please keep this information secure.</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    logInfo('Verification email sent', {
      society_id: society.society_id,
      society_email: society.email
    });
    
    return true;
  } catch (error) {
    logError('Error sending verification email', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

/**
 * Send email with regenerated admin secret key
 * @param {Object} society - The society object
 */
const sendSecretKeyEmail = async (society) => {
  try {
    const transporter = createTransporter();
    
    const setupUrl = `http://localhost:${process.env.PORT || 5000}/society/setup/${society.society_id}?key=${society.admin_secret_key}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: society.email,
      subject: 'Your NeighbourNet Admin Secret Key Has Been Regenerated',
      html: `
        <h1>Admin Secret Key Regenerated</h1>
        <p>Your admin secret key for society <strong>${society.society_name}</strong> has been regenerated.</p>
        <p>Your new admin secret key is: <strong>${society.admin_secret_key}</strong></p>
        <p>You can access your society setup page using the link below:</p>
        <a href="${setupUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          Go to Society Setup
        </a>
        <p>This key will expire in 7 days.</p>
        <p>If you did not request this key regeneration, please contact support immediately.</p>
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    logInfo('Secret key email sent', {
      society_id: society.society_id,
      society_email: society.email
    });
    
    return true;
  } catch (error) {
    logError('Error sending secret key email', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
};

module.exports = {
  sendAdminVerificationEmail,
  sendSocietySetupEmail,
  sendVerificationEmail,
  sendSecretKeyEmail
}; 