const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// ─── Multer config for avatar uploads ─────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// ─── GET / — List all users ───────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /search?q= — Search users by username ───────────────────────────────
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        success: true,
        users: [],
      });
    }

    const users = await User.find({
      username: { $regex: q.trim(), $options: 'i' },
    }).select('-password');

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /:id — Get single user ──────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'username profilePicture')
      .populate('following', 'username profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// ─── PUT /profile — Update bio and profile picture ───────────────────────────
router.put('/profile', avatarUpload.single('profilePicture'), async (req, res, next) => {
  try {
    const updates = {};

    if (req.body.bio !== undefined) {
      updates.bio = req.body.bio;
    }

    if (req.file) {
      updates.profilePicture = `/uploads/avatars/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /:id/follow — Follow/unfollow toggle ──────────────────────────────
router.post('/:id/follow', async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    // Can't follow yourself
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot follow yourself.',
      });
    }

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const isFollowing = targetUser.followers.includes(currentUserId);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: currentUserId },
      });
      await User.findByIdAndUpdate(currentUserId, {
        $pull: { following: targetUserId },
      });

      res.json({
        success: true,
        message: 'Unfollowed successfully.',
        isFollowing: false,
      });
    } else {
      // Follow
      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: currentUserId },
      });
      await User.findByIdAndUpdate(currentUserId, {
        $addToSet: { following: targetUserId },
      });

      res.json({
        success: true,
        message: 'Followed successfully.',
        isFollowing: true,
      });
    }
  } catch (error) {
    next(error);
  }
});

// ─── GET /:id/posts — Get all posts by a user ───────────────────────────────
router.get('/:id/posts', async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.params.id })
      .populate('author', 'username profilePicture')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
