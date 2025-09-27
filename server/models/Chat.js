const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderRole: {
    type: String,
    enum: ['citizen', 'official', 'admin'],
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  attachments: [{
    url: String,
    filename: String,
    mimetype: String,
    size: Number
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const chatSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true,
    unique: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['citizen', 'official', 'admin'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    lastSeen: {
      type: Date,
      default: Date.now
    }
  }],
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active'
  },
  metadata: {
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    lastMessageBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    totalMessages: {
      type: Number,
      default: 0
    },
    unreadCount: {
      citizen: { type: Number, default: 0 },
      official: { type: Number, default: 0 },
      admin: { type: Number, default: 0 }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better performance
chatSchema.index({ reportId: 1 });
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ 'metadata.lastMessageAt': -1 });
chatSchema.index({ createdAt: -1 });

// Update timestamp
chatSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
chatSchema.methods.addMessage = function(messageData) {
  this.messages.push(messageData);
  this.metadata.totalMessages += 1;
  this.metadata.lastMessageAt = Date.now();
  this.metadata.lastMessageBy = messageData.sender;
  
  // Update unread counts for other participants
  this.participants.forEach(participant => {
    if (participant.user.toString() !== messageData.sender.toString()) {
      this.metadata.unreadCount[participant.role] += 1;
    }
  });
  
  return this.save();
};

chatSchema.methods.markAsRead = function(userId, userRole) {
  // Mark messages as read
  this.messages.forEach(message => {
    if (message.sender.toString() !== userId.toString() && !message.isRead) {
      message.isRead = true;
      message.readAt = Date.now();
    }
  });
  
  // Reset unread count for this user's role
  this.metadata.unreadCount[userRole] = 0;
  
  // Update participant's last seen
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.lastSeen = Date.now();
  }
  
  return this.save();
};

chatSchema.methods.addParticipant = function(userId, userRole) {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      role: userRole,
      joinedAt: Date.now(),
      lastSeen: Date.now()
    });
  }
  return this.save();
};

module.exports = mongoose.model('Chat', chatSchema);