const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
  },
  caption: {
    type: String,
    default: '',
    maxlength: [2200, 'Caption cannot exceed 2200 characters'],
    trim: true,
  },
  image: {
    type: String,
    required: [true, 'Image is required for a post'],
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  commentCount: {
    type: Number,
    default: 0,
  },
  shares: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model('Post', postSchema);
