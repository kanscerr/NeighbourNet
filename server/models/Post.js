const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const postContentSchema = new mongoose.Schema({
  content_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

const postSchema = new mongoose.Schema({
  post_id: {
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
  user_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true,
    maxLength: 255
  },
  status: {
    type: String,
    enum: ['active', 'done'],
    required: true,
    default: 'active'
  },
  content: postContentSchema,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', postSchema); 