const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Function to generate 16 digit unique ID
const generate16DigitId = () => {
  // Get current timestamp in milliseconds and convert to string
  const timestamp = Date.now().toString();
  // Get a random number between 0-9999 and pad with zeros if needed
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  // Combine and take last 16 digits
  return (timestamp + random).slice(-16);
};

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
  private_key: {
    type: String,
    default: generate16DigitId,
    unique: true,
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
    required: true,
    maxLength: 30
  },
  contact_number: {
    type: String,
    required: true,
    maxLength: 20
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Society', societySchema); 