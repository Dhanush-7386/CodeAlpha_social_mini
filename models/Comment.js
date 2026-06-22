const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'Post reference is required'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
  },
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxlength: [300, 'Comment cannot exceed 300 characters'],
    trim: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
