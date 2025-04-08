const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const flatSchema = new mongoose.Schema({
  flat_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  society_id: {
    type: String,
    required: true,
    ref: 'Society'
  },
  flat_number: {
    type: String,
    required: true,
    maxLength: 20
  },
  floor: {
    type: String,
    required: true
  },
  owner_name: {
    type: String,
    required: true,
    maxLength: 255
  },
  is_vacant: {
    type: Boolean,
    required: true,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Flat', flatSchema); 