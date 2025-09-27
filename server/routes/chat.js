const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Report = require('../models/Report');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const database = require('../config/database');

// Helper function to get chat data (fallback or MongoDB)
const getChatData = async (filter) => {
  if (database.fallbackMode) {
    return await database.findLocal('chats', filter);
  } else {
    return await Chat.find(filter)
      .populate('participants.user', 'name email role')
      .populate('messages.sender', 'name role')
      .populate('reportId', 'title category location');
  }
};

const createChatLocal = async (chatData) => {
  if (database.fallbackMode) {
    return await database.createLocal('chats', chatData);
  } else {
    const chat = new Chat(chatData);
    return await chat.save();
  }
};

// @route   GET /api/chat/report/:reportId
// @desc    Get or create chat for a specific report
// @access  Private
router.get('/report/:reportId', authenticate, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check if report exists
    let report;
    if (database.fallbackMode) {
      report = await database.findOneLocal('reports', { _id: reportId });
    } else {
      report = await Report.findById(reportId);
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Find or create chat
    let chat;
    if (database.fallbackMode) {
      chat = await database.findOneLocal('chats', { reportId });
      
      if (!chat) {
        // Create new chat
        const newChatData = {
          reportId,
          participants: [
            {
              user: report.reportedBy,
              role: 'citizen',
              joinedAt: new Date().toISOString(),
              lastSeen: new Date().toISOString()
            }
          ],
          messages: [],
          status: 'active',
          metadata: {
            lastMessageAt: new Date().toISOString(),
            totalMessages: 0,
            unreadCount: {
              citizen: 0,
              official: 0,
              admin: 0
            }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        chat = await database.createLocal('chats', newChatData);
      }

      // Add current user as participant if not already added
      const isParticipant = chat.participants.some(p => p.user === userId);
      if (!isParticipant && (userRole === 'official' || userRole === 'admin')) {
        chat.participants.push({
          user: userId,
          role: userRole,
          joinedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString()
        });
        await database.updateLocal('chats', { _id: chat._id }, chat);
      }
    } else {
      chat = await Chat.findOne({ reportId })
        .populate('participants.user', 'name email role')
        .populate('messages.sender', 'name role');

      if (!chat) {
        // Create new chat
        chat = new Chat({
          reportId,
          participants: [
            {
              user: report.reportedBy,
              role: 'citizen'
            }
          ]
        });
        await chat.save();
      }

      // Add current user as participant if not already added
      const isParticipant = chat.participants.some(p => 
        p.user._id.toString() === userId.toString()
      );
      
      if (!isParticipant && (userRole === 'official' || userRole === 'admin')) {
        await chat.addParticipant(userId, userRole);
        // Reload chat with populated data
        chat = await Chat.findById(chat._id)
          .populate('participants.user', 'name email role')
          .populate('messages.sender', 'name role');
      }
    }

    res.json({
      success: true,
      chat: chat
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ error: 'Failed to get chat' });
  }
});

// @route   GET /api/chat/user
// @desc    Get all chats for current user
// @access  Private
router.get('/user', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let chats;
    if (database.fallbackMode) {
      const allChats = await database.findLocal('chats', {});
      chats = allChats.filter(chat => 
        chat.participants.some(p => p.user === userId)
      );
    } else {
      chats = await Chat.find({
        'participants.user': userId
      })
      .populate('participants.user', 'name email role')
      .populate('reportId', 'title category location status')
      .sort({ 'metadata.lastMessageAt': -1 });
    }

    res.json({
      success: true,
      chats: chats
    });
  } catch (error) {
    console.error('Get user chats error:', error);
    res.status(500).json({ error: 'Failed to get chats' });
  }
});

// @route   POST /api/chat/:chatId/message
// @desc    Send a message in a chat
// @access  Private
router.post('/:chatId/message', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const messageData = {
      sender: userId,
      senderRole: userRole,
      content: content.trim(),
      messageType,
      isRead: false,
      createdAt: new Date().toISOString()
    };

    let chat;
    if (database.fallbackMode) {
      chat = await database.findOneLocal('chats', { _id: chatId });
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      // Add message
      chat.messages.push(messageData);
      chat.metadata.totalMessages += 1;
      chat.metadata.lastMessageAt = new Date().toISOString();
      chat.metadata.lastMessageBy = userId;
      
      // Update unread counts for other participants
      chat.participants.forEach(participant => {
        if (participant.user !== userId) {
          chat.metadata.unreadCount[participant.role] += 1;
        }
      });

      await database.updateLocal('chats', { _id: chatId }, chat);
    } else {
      chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      await chat.addMessage(messageData);
      
      // Reload with populated data
      chat = await Chat.findById(chatId)
        .populate('participants.user', 'name email role')
        .populate('messages.sender', 'name role');
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      // Emit to all participants
      chat.participants.forEach(participant => {
        const participantId = database.fallbackMode ? participant.user : participant.user._id;
        io.to(`user_${participantId}`).emit('new_message', {
          chatId: chat._id,
          message: messageData,
          reportId: chat.reportId
        });
      });
    }

    res.json({
      success: true,
      message: messageData,
      chat: chat
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// @route   PUT /api/chat/:chatId/read
// @desc    Mark messages as read
// @access  Private
router.put('/:chatId/read', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let chat;
    if (database.fallbackMode) {
      chat = await database.findOneLocal('chats', { _id: chatId });
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      // Mark messages as read
      chat.messages.forEach(message => {
        if (message.sender !== userId && !message.isRead) {
          message.isRead = true;
          message.readAt = new Date().toISOString();
        }
      });

      // Reset unread count for this user's role
      chat.metadata.unreadCount[userRole] = 0;

      // Update participant's last seen
      const participant = chat.participants.find(p => p.user === userId);
      if (participant) {
        participant.lastSeen = new Date().toISOString();
      }

      await database.updateLocal('chats', { _id: chatId }, chat);
    } else {
      chat = await Chat.findById(chatId);
      if (!chat) {
        return res.status(404).json({ error: 'Chat not found' });
      }

      await chat.markAsRead(userId, userRole);
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// @route   GET /api/chat/:chatId/messages
// @desc    Get messages for a specific chat
// @access  Private
router.get('/:chatId/messages', authenticate, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    let chat;
    if (database.fallbackMode) {
      chat = await database.findOneLocal('chats', { _id: chatId });
    } else {
      chat = await Chat.findById(chatId)
        .populate('messages.sender', 'name role');
    }

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Paginate messages (latest first)
    const startIndex = (page - 1) * limit;
    const messages = chat.messages
      .slice()
      .reverse() // Latest first
      .slice(startIndex, startIndex + parseInt(limit));

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      totalMessages: chat.messages.length,
      hasMore: startIndex + parseInt(limit) < chat.messages.length
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

module.exports = router;