const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// ─── GET /:postId — Get comments for a post ─────────────────────────────────
router.get('/:postId', async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      comments,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST / — Add comment ────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const { postId, text } = req.body;

    if (!postId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Post ID and text are required.',
      });
    }

    if (text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Comment text cannot be empty.',
      });
    }

    // Verify post exists
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Create comment
    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      text: text.trim(),
    });

    // Increment commentCount on the post
    post.commentCount += 1;
    await post.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'username profilePicture');

    res.status(201).json({
      success: true,
      comment: populatedComment,
    });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /:id — Delete comment ────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    // Only author can delete
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments.',
      });
    }

    // Decrement commentCount on the post
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentCount: -1 },
    });

    await Comment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
