const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { generate16DigitId } = require('../utils/idGenerator');

const societySchema = new mongoose.Schema({
  society_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  society_name: {
    type: String,
    required: true,
    maxLength: 100
  },
  city: {
    type: String,
    required: true,
    maxLength: 50
  },
  address: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxLength: 100
  },
  password: {
    type: String,
    required: false, // Made optional as it will be set in Step 2
    maxLength: 255
  },
  contact_number: {
    type: String,
    required: true,
    maxLength: 20
  },
  admin_secret_key: {
    type: String,
    // default: generate16DigitId,
    required: true,
    unique: true
  },
  admin_secret_key_expires: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  verification_files: {
    type: [String], // Array of file paths
    default: []
  },
  email_verified: {
    type: Boolean,
    default: false
  },
  is_verified: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Society', societySchema); 