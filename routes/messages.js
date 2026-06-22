const express = require('express');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// ─── GET /conversations — List all conversations for the authenticated user ──
router.get('/conversations', async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'username profilePicture')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /conversations — Create or get existing conversation ───────────────
router.post('/conversations', async (req, res, next) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: 'Participant ID is required.',
      });
    }

    // Can't message yourself
    if (participantId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot create a conversation with yourself.',
      });
    }

    // Check if conversation already exists between these two users
    const existingConversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId], $size: 2 },
    })
      .populate('participants', 'username profilePicture')
      .populate('lastMessage');

    if (existingConversation) {
      return res.json({
        success: true,
        conversation: existingConversation,
        isNew: false,
      });
    }

    // Create new conversation
    const conversation = await Conversation.create({
      participants: [req.user._id, participantId],
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username profilePicture')
      .populate('lastMessage');

    res.status(201).json({
      success: true,
      conversation: populatedConversation,
      isNew: true,
    });
  } catch (error) {
    next(error);
  }
});

// ─── GET /conversations/:id — Get messages in a conversation ─────────────────
router.get('/conversations/:id', async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    // Verify user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this conversation.',
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      Message.find({ conversation: req.params.id })
        .populate('sender', 'username profilePicture')
        .populate('sharedPost')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversation: req.params.id }),
    ]);

    res.json({
      success: true,
      messages,
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

// ─── POST /conversations/:id — Send a message ───────────────────────────────
router.post('/conversations/:id', async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
      });
    }

    // Verify user is a participant
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this conversation.',
      });
    }

    const { text, sharedPost } = req.body;

    if (!text && !sharedPost) {
      return res.status(400).json({
        success: false,
        message: 'Message text or shared post is required.',
      });
    }

    // Create message
    const messageData = {
      conversation: req.params.id,
      sender: req.user._id,
      readBy: [req.user._id],
    };

    if (text) {
      messageData.text = text.trim();
    }

    if (sharedPost) {
      messageData.sharedPost = sharedPost;
    }

    const message = await Message.create(messageData);

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture')
      .populate('sharedPost');

    // Emit socket event for real-time
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${req.params.id}`).emit('message:received', populatedMessage);
    }

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    next(error);
  }
});

// ─── PUT /:id/read — Mark messages as read ───────────────────────────────────
router.put('/:id/read', async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
      });
    }

    // Verify user is a participant of the conversation
    const conversation = await Conversation.findById(message.conversation);

    if (!conversation || !conversation.participants.includes(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this conversation.',
      });
    }

    // Mark all messages in the conversation up to this message as read by this user
    await Message.updateMany(
      {
        conversation: message.conversation,
        createdAt: { $lte: message.createdAt },
        readBy: { $ne: req.user._id },
      },
      {
        $addToSet: { readBy: req.user._id },
      },
    );

    res.json({
      success: true,
      message: 'Messages marked as read.',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
