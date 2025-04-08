const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const amenitySchema = new mongoose.Schema({
  amenity_id: {
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
  amenity_name: {
    type: String,
    required: true,
    maxLength: 100
  },
  amenity_type: {
    type: String,
    maxLength: 50
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Amenity', amenitySchema); 