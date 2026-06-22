const express = require('express');
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── Multer config for post image uploads ─────────────────────────────────────
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'posts'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const postUpload = multer({
  storage: postStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extValid = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimeValid = allowedTypes.test(file.mimetype.split('/')[1]);
    if (extValid && mimeValid) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed.'));
    }
  },
});

// All routes require authentication
router.use(auth);

// ─── GET / — Paginated feed ──────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find()
        .populate('author', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Post.countDocuments(),
    ]);

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /:id — Get single post ──────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username profilePicture');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    res.json({
      success: true,
      post,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST / — Create post ────────────────────────────────────────────────────
router.post('/', postUpload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image is required for a post.',
      });
    }

    const post = await Post.create({
      author: req.user._id,
      caption: req.body.caption || '',
      image: `/uploads/posts/${req.file.filename}`,
    });

    const populatedPost = await Post.findById(post._id)
      .populate('author', 'username profilePicture');

    res.status(201).json({
      success: true,
      post: populatedPost,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /:id/like — Toggle like ────────────────────────────────────────────
router.post('/:id/like', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    const userId = req.user._id;
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      post.likes.pull(userId);
    } else {
      post.likes.addToSet(userId);
    }

    await post.save();

    res.json({
      success: true,
      isLiked: !isLiked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /:id — Delete post ────────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Only author can delete
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts.',
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /:id/share — Share post to a conversation ─────────────────────────
router.post('/:id/share', async (req, res, next) => {
  try {
    const { conversationId } = req.body;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required.',
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found.',
      });
    }

    // Verify user is a participant of the conversation
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this conversation.',
      });
    }

    // Create message with shared post
    const message = await Message.create({
      conversation: conversationId,
      sender: req.user._id,
      sharedPost: post._id,
      readBy: [req.user._id],
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Increment shares count
    post.shares += 1;
    await post.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture')
      .populate('sharedPost');

    // Emit socket event for real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('message:received', populatedMessage);
    }

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
