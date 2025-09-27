import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { 
  MessageCircle, 
  Send, 
  Phone, 
  User, 
  Shield, 
  Clock, 
  CheckCheck,
  MoreVertical
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

interface Message {
  _id: string;
  sender: string;
  senderRole: 'citizen' | 'official' | 'admin';
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface Participant {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
  };
  role: 'citizen' | 'official' | 'admin';
  joinedAt: string;
  lastSeen: string;
}

interface Chat {
  _id: string;
  reportId: string;
  participants: Participant[];
  messages: Message[];
  status: 'active' | 'closed' | 'archived';
  metadata: {
    lastMessageAt: string;
    lastMessageBy?: string;
    totalMessages: number;
    unreadCount: {
      citizen: number;
      official: number;
      admin: number;
    };
  };
}

interface ChatInterfaceProps {
  reportId: string;
  onClose?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ reportId, onClose }) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!user) return;

    // Initialize socket connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join user room for notifications
    newSocket.emit('join-user-room', user.id);

    // Listen for new messages
    newSocket.on('new_message', (data) => {
      if (data.reportId === reportId) {
        setMessages(prev => [...prev, data.message]);
      }
    });

    // Listen for typing indicators
    newSocket.on('user-typing', (data) => {
      if (data.userId !== user.id) {
        setTypingUsers(prev => {
          if (data.isTyping) {
            return [...prev.filter(id => id !== data.userId), data.userId];
          } else {
            return prev.filter(id => id !== data.userId);
          }
        });

        // Clear typing after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== data.userId));
        }, 3000);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, reportId]);

  useEffect(() => {
    loadChat();
  }, [reportId]);

  const loadChat = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/chat/report/${reportId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChat(data.chat);
        setMessages(data.chat.messages || []);
        
        // Join chat room
        if (socket) {
          socket.emit('join-chat', data.chat._id);
        }

        // Mark messages as read
        if (data.chat.messages && data.chat.messages.length > 0) {
          markAsRead(data.chat._id);
        }
      } else {
        toast.error('Failed to load chat');
      }
    } catch (error) {
      console.error('Load chat error:', error);
      toast.error('Failed to load chat');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat || isSending) return;

    setSending(true);
    try {
      const response = await fetch(`http://localhost:5000/api/chat/${chat._id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: 'text'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        
        // Stop typing indicator
        if (socket && chat) {
          socket.emit('typing', {
            chatId: chat._id,
            userId: user?.id,
            userName: user?.name,
            isTyping: false
          });
        }
      } else {
        toast.error('Failed to send message');
      }
    } catch (error) {
      console.error('Send message error:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (chatId: string) => {
    try {
      await fetch(`http://localhost:5000/api/chat/${chatId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (socket && chat) {
      socket.emit('typing', {
        chatId: chat._id,
        userId: user?.id,
        userName: user?.name,
        isTyping: true
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', {
          chatId: chat._id,
          userId: user?.id,
          userName: user?.name,
          isTyping: false
        });
      }, 1000);
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'official':
        return 'bg-blue-100 text-blue-800';
      case 'citizen':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />;
      case 'official':
        return <Shield className="h-3 w-3" />;
      case 'citizen':
        return <User className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400 animate-pulse" />
            <p className="mt-2 text-gray-600">Loading chat...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chat) {
    return (
      <Card className="w-full h-96">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-2 text-gray-600">No chat found for this report</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-96 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Discussion</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {chat.participants.length} participant{chat.participants.length !== 1 ? 's' : ''}
            </Badge>
            {onClose && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={onClose}>
                    Close Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
        
        {/* Participants */}
        <div className="flex items-center space-x-2 pt-2">
          {chat.participants.map((participant, index) => (
            <div key={index} className="flex items-center space-x-1">
              <Avatar className="h-6 w-6">
                <AvatarImage src="" />
                <AvatarFallback className="text-xs">
                  {participant.user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-medium">{participant.user.name}</span>
                <Badge variant="secondary" className={`text-xs px-1 py-0 ${getRoleColor(participant.role)}`}>
                  {getRoleIcon(participant.role)}
                  <span className="ml-1">{participant.role}</span>
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="flex-1 p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwn = message.sender === user?.id;
              const senderParticipant = chat.participants.find(p => 
                p.user._id === message.sender
              );
              
              return (
                <div key={message._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                    {!isOwn && (
                      <div className="flex items-center space-x-2 mb-1">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="text-xs">
                            {senderParticipant?.user.name?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-gray-700">
                          {senderParticipant?.user.name}
                        </span>
                        <Badge variant="secondary" className={`text-xs px-1 py-0 ${getRoleColor(message.senderRole)}`}>
                          {getRoleIcon(message.senderRole)}
                        </Badge>
                      </div>
                    )}
                    
                    <div className={`rounded-lg px-3 py-2 ${
                      isOwn 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    <div className={`flex items-center mt-1 text-xs text-gray-500 ${
                      isOwn ? 'justify-end' : 'justify-start'
                    }`}>
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{formatMessageTime(message.createdAt)}</span>
                      {isOwn && message.isRead && (
                        <CheckCheck className="h-3 w-3 ml-1 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {typingUsers.length > 0 && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2">typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <Separator />

        <div className="p-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={handleTyping}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              disabled={isSending}
              className="flex-1"
            />
            <Button 
              onClick={sendMessage} 
              disabled={!newMessage.trim() || isSending}
              size="sm"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;