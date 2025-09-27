interface NotificationChannel {
  id: string;
  name: string;
  type: 'push' | 'websocket' | 'email' | 'sms' | 'in_app';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  enabled: boolean;
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
  deliveryOptions: {
    batchSize?: number;
    rateLimit?: number;
    quietHours?: { start: string; end: string };
  };
}

interface SmartNotification {
  id: string;
  userId: string;
  type: 'report_update' | 'system_alert' | 'community_activity' | 'achievement' | 'reminder' | 'emergency' | 'collaboration_invite' | 'maintenance';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'civic' | 'social' | 'system' | 'emergency' | 'achievement';
  data: any;
  channels: string[];
  scheduledFor: Date;
  deliveredAt?: Date;
  readAt?: Date;
  actionTaken?: boolean;
  personalizedContent: {
    relevanceScore: number;
    userPreferences: string[];
    locationBased: boolean;
    contextualData: any;
  };
  aiInsights: {
    urgencyScore: number;
    sentiment: 'positive' | 'neutral' | 'negative';
    suggestedActions: string[];
    relatedReports?: string[];
  };
}

interface CollaborationRoom {
  id: string;
  reportId: string;
  name: string;
  participants: Participant[];
  type: 'public_discussion' | 'private_review' | 'expert_consultation' | 'emergency_response';
  status: 'active' | 'archived' | 'suspended';
  createdAt: Date;
  messages: CollaborationMessage[];
  permissions: {
    canInvite: string[];
    canModerate: string[];
    canArchive: string[];
  };
  metadata: {
    reportCategory: string;
    priority: string;
    tags: string[];
    estimatedDuration: number;
  };
}

interface Participant {
  userId: string;
  role: 'citizen' | 'official' | 'expert' | 'moderator';
  permissions: string[];
  joinedAt: Date;
  lastActive: Date;
  contributionScore: number;
}

interface CollaborationMessage {
  id: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'location' | 'poll' | 'action_item' | 'status_update';
  timestamp: Date;
  reactions: { [emoji: string]: string[] };
  mentions: string[];
  attachments: MessageAttachment[];
  metadata: {
    isSystemMessage: boolean;
    priority: 'low' | 'medium' | 'high';
    sentiment: 'positive' | 'neutral' | 'negative';
  };
}

interface MessageAttachment {
  id: string;
  type: 'image' | 'document' | 'video' | 'audio' | 'location';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent: string;
  createdAt: Date;
  lastUsed: Date;
  preferences: {
    enabledTypes: string[];
    quietHours: { start: string; end: string };
    frequency: 'immediate' | 'batched' | 'daily_digest';
  };
}

interface NotificationPreferences {
  userId: string;
  channels: {
    [channelId: string]: {
      enabled: boolean;
      types: string[];
      priority: 'low' | 'medium' | 'high' | 'urgent';
      quietHours?: { start: string; end: string };
    };
  };
  frequency: 'immediate' | 'batched' | 'daily_digest' | 'weekly_summary';
  location: {
    radius: number; // km
    onlyMyReports: boolean;
    followedAreas: string[];
  };
  smartFiltering: {
    enabled: boolean;
    relevanceThreshold: number;
    duplicateFiltering: boolean;
    spamDetection: boolean;
  };
}

export class EnhancedNotificationService {
  private channels: Map<string, NotificationChannel> = new Map();
  private pendingNotifications: SmartNotification[] = [];
  private deliveredNotifications: Map<string, SmartNotification> = new Map();
  private collaborationRooms: Map<string, CollaborationRoom> = new Map();
  private pushSubscriptions: Map<string, PushSubscription> = new Map();
  private userPreferences: Map<string, NotificationPreferences> = new Map();
  private webSocket: WebSocket | null = null;
  private isConnected = false;

  constructor() {
    this.initializeChannels();
    this.startNotificationProcessor();
    this.initializeWebSocket();
  }

  private initializeChannels() {
    const defaultChannels: NotificationChannel[] = [
      {
        id: 'push',
        name: 'Push Notifications',
        type: 'push',
        priority: 'high',
        enabled: true,
        retryPolicy: { maxRetries: 3, retryDelay: 1000, backoffMultiplier: 2 },
        deliveryOptions: { rateLimit: 10, quietHours: { start: '22:00', end: '07:00' } }
      },
      {
        id: 'websocket',
        name: 'Real-time WebSocket',
        type: 'websocket',
        priority: 'urgent',
        enabled: true,
        retryPolicy: { maxRetries: 5, retryDelay: 500, backoffMultiplier: 1.5 },
        deliveryOptions: { rateLimit: 50 }
      },
      {
        id: 'in_app',
        name: 'In-App Notifications',
        type: 'in_app',
        priority: 'medium',
        enabled: true,
        retryPolicy: { maxRetries: 2, retryDelay: 2000, backoffMultiplier: 2 },
        deliveryOptions: { batchSize: 10 }
      },
      {
        id: 'email',
        name: 'Email Notifications',
        type: 'email',
        priority: 'low',
        enabled: true,
        retryPolicy: { maxRetries: 3, retryDelay: 5000, backoffMultiplier: 2 },
        deliveryOptions: { batchSize: 20, quietHours: { start: '22:00', end: '07:00' } }
      }
    ];

    defaultChannels.forEach(channel => {
      this.channels.set(channel.id, channel);
    });
  }

  private initializeWebSocket() {
    if (typeof window !== 'undefined' && 'WebSocket' in window) {
      this.connectWebSocket();
    }
  }

  private connectWebSocket(url: string = 'ws://localhost:5000') {
    try {
      this.webSocket = new WebSocket(url);
      
      this.webSocket.onopen = () => {
        this.isConnected = true;
        console.log('🔗 Enhanced notification WebSocket connected');
      };

      this.webSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.webSocket.onclose = () => {
        this.isConnected = false;
        console.log('📱 Notification WebSocket disconnected, attempting to reconnect...');
        setTimeout(() => this.connectWebSocket(url), 5000);
      };

      this.webSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to connect notification WebSocket:', error);
    }
  }

  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'notification':
        this.processIncomingNotification(data.notification);
        break;
      case 'collaboration_message':
        this.handleCollaborationMessage(data);
        break;
      case 'user_joined':
        this.handleUserJoined(data);
        break;
      case 'typing':
        this.handleTypingIndicator(data);
        break;
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  public createSmartNotification(notification: Omit<SmartNotification, 'id' | 'scheduledFor' | 'personalizedContent' | 'aiInsights'>): string {
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // AI-powered content personalization
    const personalizedContent = this.personalizeNotification(notification, notification.userId);
    const aiInsights = this.analyzeNotificationContent(notification);

    const smartNotification: SmartNotification = {
      ...notification,
      id: notificationId,
      scheduledFor: new Date(),
      personalizedContent,
      aiInsights
    };

    // Apply smart filtering
    if (this.shouldDeliverNotification(smartNotification)) {
      this.pendingNotifications.push(smartNotification);
      console.log(`📬 Smart notification created: ${smartNotification.title} (Priority: ${smartNotification.priority})`);
    }

    return notificationId;
  }

  private personalizeNotification(notification: any, userId: string) {
    const userPrefs = this.userPreferences.get(userId);
    const relevanceScore = this.calculateRelevanceScore(notification, userPrefs);

    return {
      relevanceScore,
      userPreferences: userPrefs?.smartFiltering ? Object.keys(userPrefs.channels) : [],
      locationBased: notification.data?.location !== undefined,
      contextualData: {
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        userActivity: 'active' // Would be calculated from user behavior
      }
    };
  }

  private analyzeNotificationContent(notification: any) {
    const content = `${notification.title} ${notification.message}`;
    
    // Simplified AI analysis (in real implementation, use proper NLP)
    const urgentKeywords = ['urgent', 'emergency', 'critical', 'immediate', 'asap'];
    const positiveKeywords = ['resolved', 'completed', 'approved', 'success', 'achievement'];
    const negativeKeywords = ['failed', 'rejected', 'issue', 'problem', 'error'];

    const urgencyScore = urgentKeywords.some(word => content.toLowerCase().includes(word)) ? 9 : 5;
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveKeywords.some(word => content.toLowerCase().includes(word))) sentiment = 'positive';
    else if (negativeKeywords.some(word => content.toLowerCase().includes(word))) sentiment = 'negative';

    const suggestedActions = this.generateSuggestedActions(notification.type, sentiment);

    return {
      urgencyScore,
      sentiment,
      suggestedActions,
      relatedReports: notification.data?.relatedReports || []
    };
  }

  private generateSuggestedActions(type: string, sentiment: string): string[] {
    const actionMap: { [key: string]: string[] } = {
      'report_update': ['View Report', 'Add Comment', 'Share Update'],
      'community_activity': ['Join Discussion', 'Upvote', 'Follow Topic'],
      'achievement': ['View Achievement', 'Share Success', 'Continue Progress'],
      'emergency': ['View Details', 'Report Safe', 'Contact Emergency Services'],
      'collaboration_invite': ['Join Room', 'View Details', 'Decline Politely']
    };

    return actionMap[type] || ['View Details', 'Dismiss'];
  }

  private calculateRelevanceScore(notification: any, userPrefs?: NotificationPreferences): number {
    let score = 50; // Base score

    // Priority bonus
    const priorityBonus = {
      'urgent': 40,
      'high': 20,
      'medium': 0,
      'low': -10
    };
    score += priorityBonus[notification.priority] || 0;

    // User preferences
    if (userPrefs) {
      const channelPrefs = userPrefs.channels[notification.channels[0]];
      if (channelPrefs?.enabled) score += 20;
      if (channelPrefs?.types.includes(notification.type)) score += 15;
    }

    // Location relevance
    if (notification.data?.location && userPrefs?.location) {
      score += 10; // Simplified location scoring
    }

    return Math.min(Math.max(score, 0), 100);
  }

  private shouldDeliverNotification(notification: SmartNotification): boolean {
    const userPrefs = this.userPreferences.get(notification.userId);
    
    // Check quiet hours
    if (userPrefs && this.isQuietHours(userPrefs)) {
      if (notification.priority !== 'urgent') return false;
    }

    // Check relevance threshold
    if (userPrefs?.smartFiltering.enabled) {
      if (notification.personalizedContent.relevanceScore < userPrefs.smartFiltering.relevanceThreshold) {
        return false;
      }
    }

    // Check duplicate filtering
    if (userPrefs?.smartFiltering.duplicateFiltering) {
      const recentSimilar = Array.from(this.deliveredNotifications.values()).filter(n => 
        n.userId === notification.userId && 
        n.type === notification.type &&
        Date.now() - n.deliveredAt!.getTime() < 3600000 // 1 hour
      );
      
      if (recentSimilar.length > 2) return false;
    }

    return true;
  }

  private isQuietHours(userPrefs: NotificationPreferences): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    // Check each channel for quiet hours
    return Object.values(userPrefs.channels).some(channel => {
      if (!channel.quietHours) return false;
      
      const [startHour, startMin] = channel.quietHours.start.split(':').map(Number);
      const [endHour, endMin] = channel.quietHours.end.split(':').map(Number);
      
      const startTime = startHour * 60 + startMin;
      const endTime = endHour * 60 + endMin;
      
      // Handle overnight quiet hours
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime;
      }
      
      return currentTime >= startTime && currentTime <= endTime;
    });
  }

  private startNotificationProcessor() {
    setInterval(() => {
      this.processPendingNotifications();
    }, 2000); // Process every 2 seconds

    setInterval(() => {
      this.cleanupOldNotifications();
    }, 3600000); // Cleanup every hour
  }

  private async processPendingNotifications() {
    if (this.pendingNotifications.length === 0) return;

    const notificationsToProcess = this.pendingNotifications.splice(0, 10); // Process up to 10 at a time

    for (const notification of notificationsToProcess) {
      await this.deliverNotification(notification);
    }
  }

  private async deliverNotification(notification: SmartNotification) {
    const userPrefs = this.userPreferences.get(notification.userId);
    const channels = this.determineDeliveryChannels(notification, userPrefs);

    let delivered = false;

    for (const channelId of channels) {
      const channel = this.channels.get(channelId);
      if (!channel || !channel.enabled) continue;

      try {
        await this.deliverToChannel(notification, channel);
        delivered = true;
        console.log(`📤 Notification delivered via ${channel.name}: ${notification.title}`);
      } catch (error) {
        console.error(`Failed to deliver notification via ${channel.name}:`, error);
        
        // Try next channel or retry
        if (channel.retryPolicy.maxRetries > 0) {
          setTimeout(() => {
            this.retryNotification(notification, channel);
          }, channel.retryPolicy.retryDelay);
        }
      }
    }

    if (delivered) {
      notification.deliveredAt = new Date();
      this.deliveredNotifications.set(notification.id, notification);
    }
  }

  private determineDeliveryChannels(notification: SmartNotification, userPrefs?: NotificationPreferences): string[] {
    // Default channels based on priority
    const defaultChannels = {
      'urgent': ['websocket', 'push'],
      'high': ['websocket', 'in_app'],
      'medium': ['in_app'],
      'low': ['email']
    };

    let channels = notification.channels.length > 0 ? 
      notification.channels : 
      defaultChannels[notification.priority];

    // Apply user preferences
    if (userPrefs) {
      channels = channels.filter(channelId => {
        const channelPrefs = userPrefs.channels[channelId];
        return channelPrefs?.enabled && channelPrefs.types.includes(notification.type);
      });
    }

    return channels;
  }

  private async deliverToChannel(notification: SmartNotification, channel: NotificationChannel) {
    switch (channel.type) {
      case 'websocket':
        return this.deliverViaWebSocket(notification);
      case 'push':
        return this.deliverViaPush(notification);
      case 'in_app':
        return this.deliverViaInApp(notification);
      case 'email':
        return this.deliverViaEmail(notification);
      case 'sms':
        return this.deliverViaSMS(notification);
      default:
        throw new Error(`Unknown channel type: ${channel.type}`);
    }
  }

  private async deliverViaWebSocket(notification: SmartNotification) {
    if (!this.isConnected || !this.webSocket) {
      throw new Error('WebSocket not connected');
    }

    const message = {
      type: 'notification',
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        category: notification.category,
        data: notification.data,
        aiInsights: notification.aiInsights
      }
    };

    this.webSocket.send(JSON.stringify(message));
  }

  private async deliverViaPush(notification: SmartNotification) {
    const subscription = this.pushSubscriptions.get(notification.userId);
    if (!subscription) {
      throw new Error('No push subscription found for user');
    }

    // In a real implementation, you would use a service like Firebase FCM
    console.log('📱 Delivering push notification:', {
      endpoint: subscription.endpoint,
      title: notification.title,
      body: notification.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: notification.data,
      actions: notification.aiInsights.suggestedActions.map(action => ({
        action: action.toLowerCase().replace(' ', '_'),
        title: action
      }))
    });
  }

  private async deliverViaInApp(notification: SmartNotification) {
    // Store for in-app notification display
    const inAppNotification = {
      ...notification,
      displayed: false,
      dismissed: false
    };

    // In a real implementation, this would trigger UI updates
    console.log('🔔 In-app notification ready:', inAppNotification.title);
  }

  private async deliverViaEmail(notification: SmartNotification) {
    // In a real implementation, use email service
    console.log('📧 Email notification queued:', {
      to: `user_${notification.userId}@example.com`,
      subject: notification.title,
      body: notification.message,
      priority: notification.priority
    });
  }

  private async deliverViaSMS(notification: SmartNotification) {
    // In a real implementation, use SMS service
    console.log('📱 SMS notification queued:', {
      to: `+1234567890`, // Would get from user profile
      message: `${notification.title}: ${notification.message}`,
      priority: notification.priority
    });
  }

  private async retryNotification(notification: SmartNotification, channel: NotificationChannel) {
    // Implement retry logic with exponential backoff
    console.log(`🔄 Retrying notification delivery via ${channel.name}`);
  }

  private cleanupOldNotifications() {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Remove old delivered notifications
    this.deliveredNotifications.forEach((notification, id) => {
      if (notification.deliveredAt && notification.deliveredAt < oneWeekAgo) {
        this.deliveredNotifications.delete(id);
      }
    });
  }

  // Collaboration Features

  public createCollaborationRoom(reportId: string, name: string, type: CollaborationRoom['type'], creatorId: string): string {
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const room: CollaborationRoom = {
      id: roomId,
      reportId,
      name,
      participants: [{
        userId: creatorId,
        role: 'moderator',
        permissions: ['invite', 'moderate', 'archive'],
        joinedAt: new Date(),
        lastActive: new Date(),
        contributionScore: 0
      }],
      type,
      status: 'active',
      createdAt: new Date(),
      messages: [],
      permissions: {
        canInvite: [creatorId],
        canModerate: [creatorId],
        canArchive: [creatorId]
      },
      metadata: {
        reportCategory: 'general',
        priority: 'medium',
        tags: [],
        estimatedDuration: 60 // minutes
      }
    };

    this.collaborationRooms.set(roomId, room);
    
    // Notify via WebSocket
    this.broadcastToRoom(roomId, {
      type: 'room_created',
      room: room
    });

    return roomId;
  }

  public joinCollaborationRoom(roomId: string, userId: string, role: Participant['role'] = 'citizen'): boolean {
    const room = this.collaborationRooms.get(roomId);
    if (!room || room.status !== 'active') return false;

    // Check if user is already a participant
    const existingParticipant = room.participants.find(p => p.userId === userId);
    if (existingParticipant) {
      existingParticipant.lastActive = new Date();
      return true;
    }

    const participant: Participant = {
      userId,
      role,
      permissions: this.getDefaultPermissions(role),
      joinedAt: new Date(),
      lastActive: new Date(),
      contributionScore: 0
    };

    room.participants.push(participant);

    // Add system message
    this.addSystemMessage(roomId, `${userId} joined the collaboration room`);

    // Broadcast user joined
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      participant,
      roomId
    });

    return true;
  }

  private getDefaultPermissions(role: Participant['role']): string[] {
    const permissionMap = {
      'citizen': ['message', 'react'],
      'official': ['message', 'react', 'invite'],
      'expert': ['message', 'react', 'invite', 'priority_message'],
      'moderator': ['message', 'react', 'invite', 'moderate', 'archive']
    };

    return permissionMap[role] || ['message'];
  }

  public sendCollaborationMessage(roomId: string, senderId: string, content: string, type: CollaborationMessage['type'] = 'text'): string {
    const room = this.collaborationRooms.get(roomId);
    if (!room || room.status !== 'active') return '';

    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const message: CollaborationMessage = {
      id: messageId,
      senderId,
      content,
      type,
      timestamp: new Date(),
      reactions: {},
      mentions: this.extractMentions(content),
      attachments: [],
      metadata: {
        isSystemMessage: false,
        priority: 'low',
        sentiment: this.analyzeSentiment(content)
      }
    };

    room.messages.push(message);

    // Update participant activity
    const participant = room.participants.find(p => p.userId === senderId);
    if (participant) {
      participant.lastActive = new Date();
      participant.contributionScore += 1;
    }

    // Broadcast message
    this.broadcastToRoom(roomId, {
      type: 'collaboration_message',
      message,
      roomId
    });

    // Send notifications to mentioned users
    message.mentions.forEach(mentionedUser => {
      this.createSmartNotification({
        userId: mentionedUser,
        type: 'collaboration_invite',
        title: 'You were mentioned in a collaboration',
        message: `${senderId} mentioned you: ${content.substring(0, 100)}...`,
        priority: 'medium',
        category: 'social',
        data: { roomId, messageId },
        channels: ['websocket', 'push']
      });
    });

    return messageId;
  }

  private extractMentions(content: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }

    return mentions;
  }

  private analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'thanks', 'solved', 'working'];
    const negativeWords = ['bad', 'terrible', 'broken', 'failed', 'issue', 'problem'];

    const lowerContent = content.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private addSystemMessage(roomId: string, content: string) {
    const room = this.collaborationRooms.get(roomId);
    if (!room) return;

    const systemMessage: CollaborationMessage = {
      id: `sys_${Date.now()}`,
      senderId: 'system',
      content,
      type: 'text',
      timestamp: new Date(),
      reactions: {},
      mentions: [],
      attachments: [],
      metadata: {
        isSystemMessage: true,
        priority: 'low',
        sentiment: 'neutral'
      }
    };

    room.messages.push(systemMessage);
  }

  private broadcastToRoom(roomId: string, data: any) {
    if (!this.isConnected || !this.webSocket) return;

    const room = this.collaborationRooms.get(roomId);
    if (!room) return;

    // In a real implementation, you would send to specific connected users
    room.participants.forEach(participant => {
      const message = {
        ...data,
        targetUserId: participant.userId
      };
      
      try {
        this.webSocket!.send(JSON.stringify(message));
      } catch (error) {
        console.error(`Failed to broadcast to user ${participant.userId}:`, error);
      }
    });
  }

  // Public API methods
  
  public subscribeToNotifications(userId: string, subscription: Omit<PushSubscription, 'userId' | 'createdAt' | 'lastUsed'>): boolean {
    const pushSubscription: PushSubscription = {
      ...subscription,
      userId,
      createdAt: new Date(),
      lastUsed: new Date()
    };

    this.pushSubscriptions.set(userId, pushSubscription);
    return true;
  }

  public updateNotificationPreferences(userId: string, preferences: NotificationPreferences): boolean {
    this.userPreferences.set(userId, preferences);
    return true;
  }

  public getNotificationHistory(userId: string, limit: number = 20): SmartNotification[] {
    return Array.from(this.deliveredNotifications.values())
      .filter(n => n.userId === userId)
      .sort((a, b) => b.deliveredAt!.getTime() - a.deliveredAt!.getTime())
      .slice(0, limit);
  }

  public markNotificationAsRead(notificationId: string): boolean {
    const notification = this.deliveredNotifications.get(notificationId);
    if (notification) {
      notification.readAt = new Date();
      return true;
    }
    return false;
  }

  public getCollaborationRoom(roomId: string): CollaborationRoom | null {
    return this.collaborationRooms.get(roomId) || null;
  }

  public getUserCollaborationRooms(userId: string): CollaborationRoom[] {
    return Array.from(this.collaborationRooms.values())
      .filter(room => room.participants.some(p => p.userId === userId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  public getNotificationStats() {
    const totalSent = this.deliveredNotifications.size;
    const totalRead = Array.from(this.deliveredNotifications.values()).filter(n => n.readAt).length;
    const pendingCount = this.pendingNotifications.length;
    const activeRooms = Array.from(this.collaborationRooms.values()).filter(r => r.status === 'active').length;

    return {
      totalSent,
      totalRead,
      readRate: totalSent > 0 ? (totalRead / totalSent) * 100 : 0,
      pendingCount,
      activeCollaborationRooms: activeRooms,
      connectedUsers: this.pushSubscriptions.size,
      channelsActive: Array.from(this.channels.values()).filter(c => c.enabled).length
    };
  }

  private processIncomingNotification(data: any) {
    // Handle incoming notifications from server
    console.log('📨 Incoming notification:', data);
  }

  private handleCollaborationMessage(data: any) {
    // Handle real-time collaboration messages
    console.log('💬 Collaboration message:', data);
  }

  private handleUserJoined(data: any) {
    // Handle user joining collaboration room
    console.log('👋 User joined:', data);
  }

  private handleTypingIndicator(data: any) {
    // Handle typing indicators in collaboration rooms
    console.log('⌨️ Typing indicator:', data);
  }
}

export const enhancedNotificationService = new EnhancedNotificationService();
export default enhancedNotificationService;