const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const visitorPassSchema = new mongoose.Schema({
  pass_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  visitor_name: {
    type: String,
    required: true,
    maxLength: 255
  },
  visitor_phone: {
    type: String,
    required: true,
    maxLength: 15
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
  expiry_date: {
    type: Date,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VisitorPass', visitorPassSchema); 