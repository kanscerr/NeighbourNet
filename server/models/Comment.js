const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const commentContentSchema = new mongoose.Schema({
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

const commentSchema = new mongoose.Schema({
  comment_id: {
    type: String,
    default: () => uuidv4(),
    unique: true,
    required: true
  },
  post_id: {
    type: String,
    required: true,
    ref: 'Post'
  },
  user_id: {
    type: String,
    required: true,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['active', 'deleted'],
    required: true,
    default: 'active'
  },
  content: commentContentSchema,
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', commentSchema); 