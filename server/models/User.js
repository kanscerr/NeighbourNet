const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new mongoose.Schema({
  user_id: {
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
  flat_id: {
    type: String,
    required: true,
    ref: 'Flat'
  },
  role: {
    type: String,
    enum: ['admin', 'resident', 'staff'],
    required: true
  },
  first_name: {
    type: String,
    required: true,
    maxLength: 255
  },
  last_name: {
    type: String,
    required: true,
    maxLength: 255
  },
  email: {
    type: String,
    required: true,
    unique: true,
    maxLength: 255
  },
  password: {
    type: String,
    required: true,
    maxLength: 255
  },
  phone: {
    type: String,
    maxLength: 15
  },
  rent_status: {
    type: String,
    enum: ['owner', 'renter', 'leased'],
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  amenities: [{
    amenity_id: {
      type: String,
      ref: 'Amenity'
    }
  }]
});

module.exports = mongoose.model('User', userSchema); 