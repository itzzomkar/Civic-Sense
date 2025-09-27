import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Clock,
  MapPin,
  User,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import socketService from '@/services/socket';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  reportId?: string;
  icon?: React.ReactNode;
}

interface NotificationSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSystem = ({ isOpen, onClose }: NotificationSystemProps) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize notifications and socket listeners
  useEffect(() => {
    if (user) {
      socketService.connect(user.id);
      loadNotifications();
      setupSocketListeners();
    }

    return () => {
      cleanupSocketListeners();
    };
  }, [user]);

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const loadNotifications = () => {
    // Load demo notifications for hackathon
    const demoNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        title: 'Report Resolved',
        message: 'Your report about pothole on Main Street has been resolved by PWD.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
        reportId: 'RPT001',
        icon: <CheckCircle className="w-4 h-4" />
      },
      {
        id: '2',
        type: 'info',
        title: 'Status Update',
        message: 'Your streetlight repair request is now in progress.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: false,
        reportId: 'RPT002',
        icon: <Clock className="w-4 h-4" />
      },
      {
        id: '3',
        type: 'warning',
        title: 'Community Alert',
        message: 'Multiple users reported similar issue in your area. Consider upvoting existing reports.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
        read: true,
        icon: <AlertCircle className="w-4 h-4" />
      },
      {
        id: '4',
        type: 'info',
        title: 'Welcome!',
        message: 'Thank you for joining Urban Guardians. Start reporting civic issues to make your city better.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
        icon: <User className="w-4 h-4" />
      }
    ];

    setNotifications(demoNotifications);
  };

  const setupSocketListeners = () => {
    // Listen for report status changes
    socketService.onReportStatusChanged((data) => {
      const newNotification: Notification = {
        id: `status-${Date.now()}`,
        type: data.status === 'resolved' ? 'success' : 'info',
        title: 'Report Status Updated',
        message: `Your report #${data.reportId} status changed to: ${data.status}`,
        timestamp: new Date(data.timestamp),
        read: false,
        reportId: data.reportId,
        icon: data.status === 'resolved' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />
      };

      setNotifications(prev => [newNotification, ...prev]);
      
      // Show toast notification
      toast(newNotification.title, {
        description: newNotification.message,
        action: {
          label: 'View',
          onClick: () => console.log('View report:', data.reportId)
        }
      });
    });

    // Listen for new report notifications (for admins)
    socketService.onNewReportNotification((data) => {
      if (user?.role === 'admin' || user?.role === 'official') {
        const newNotification: Notification = {
          id: `new-report-${Date.now()}`,
          type: 'info',
          title: 'New Report Submitted',
          message: `New ${data.category} report: ${data.title}`,
          timestamp: new Date(data.timestamp),
          read: false,
          reportId: data.reportId,
          icon: <MapPin className="w-4 h-4" />
        };

        setNotifications(prev => [newNotification, ...prev]);
        
        // Show toast for admins
        toast(newNotification.title, {
          description: newNotification.message
        });
      }
    });
  };

  const cleanupSocketListeners = () => {
    socketService.removeListener('report-status-changed');
    socketService.removeListener('new-report-notification');
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(n => n.id !== notificationId)
    );
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50 dark:bg-green-950';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'error': return 'border-l-red-500 bg-red-50 dark:bg-red-950';
      default: return 'border-l-blue-500 bg-blue-50 dark:bg-blue-950';
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm">
      <div className="fixed right-4 top-16 w-96 max-w-[calc(100vw-2rem)]">
        <Card className="shadow-lg border-2">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
                <p className="text-sm">We'll notify you when there are updates</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2 p-2">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-sm",
                        getNotificationColor(notification.type),
                        !notification.read && "ring-2 ring-primary/20"
                      )}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {notification.icon || <Info className="w-4 h-4" />}
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm leading-tight">
                              {notification.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-1 leading-tight">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                            
                            {notification.reportId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('View report:', notification.reportId);
                                }}
                              >
                                View Report
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>

          {/* Footer */}
          <div className="border-t p-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => console.log('Open notification settings')}
            >
              <Settings className="w-4 h-4 mr-2" />
              Notification Settings
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotificationSystem;