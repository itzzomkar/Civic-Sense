import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { 
  Clock, 
  CheckCircle, 
  Circle, 
  AlertCircle, 
  User, 
  Shield,
  MessageCircle,
  Calendar,
  MapPin,
  Eye,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';
import { LoadingSpinner } from './LoadingStates';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface TimelineEvent {
  _id: string;
  type: 'status_change' | 'comment' | 'assignment' | 'priority_change' | 'location_update' | 'upvote' | 'view';
  timestamp: string;
  description: string;
  actor: {
    id: string;
    name: string;
    role: 'citizen' | 'official' | 'admin';
  };
  details?: {
    oldValue?: string;
    newValue?: string;
    reason?: string;
    location?: {
      lat: number;
      lng: number;
      address: string;
    };
  };
}

interface ReportStatus {
  value: 'reported' | 'acknowledged' | 'in-progress' | 'resolved' | 'closed';
  label: string;
  color: string;
  description: string;
}

const reportStatuses: ReportStatus[] = [
  {
    value: 'reported',
    label: 'Reported',
    color: 'bg-blue-100 text-blue-800',
    description: 'Report has been submitted and is awaiting review'
  },
  {
    value: 'acknowledged',
    label: 'Acknowledged',
    color: 'bg-yellow-100 text-yellow-800',
    description: 'Report has been reviewed and acknowledged by officials'
  },
  {
    value: 'in-progress',
    label: 'In Progress',
    color: 'bg-orange-100 text-orange-800',
    description: 'Work is actively being done to resolve the issue'
  },
  {
    value: 'resolved',
    label: 'Resolved',
    color: 'bg-green-100 text-green-800',
    description: 'Issue has been resolved and is awaiting verification'
  },
  {
    value: 'closed',
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800',
    description: 'Report is closed and complete'
  }
];

interface ReportTimelineProps {
  reportId: string;
  currentStatus: string;
  onStatusUpdate?: (newStatus: string) => void;
  showActions?: boolean;
}

export const ReportTimeline: React.FC<ReportTimelineProps> = ({
  reportId,
  currentStatus,
  onStatusUpdate,
  showActions = false
}) => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  
  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadTimeline();
  }, [reportId]);

  const loadTimeline = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/reports/${reportId}/timeline`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline || []);
      } else {
        console.error('Failed to load timeline');
      }
    } catch (error) {
      console.error('Load timeline error:', error);
      // Fallback: Generate mock timeline if API fails
      generateMockTimeline();
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockTimeline = () => {
    const mockEvents: TimelineEvent[] = [
      {
        _id: '1',
        type: 'status_change',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Report submitted',
        actor: {
          id: 'user1',
          name: 'John Citizen',
          role: 'citizen'
        },
        details: {
          newValue: 'reported'
        }
      },
      {
        _id: '2',
        type: 'view',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Report viewed by official',
        actor: {
          id: 'official1',
          name: 'Sarah Official',
          role: 'official'
        }
      },
      {
        _id: '3',
        type: 'status_change',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Status changed to acknowledged',
        actor: {
          id: 'official1',
          name: 'Sarah Official',
          role: 'official'
        },
        details: {
          oldValue: 'reported',
          newValue: 'acknowledged',
          reason: 'Report reviewed and validated'
        }
      },
      {
        _id: '4',
        type: 'upvote',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        description: '3 citizens upvoted this report',
        actor: {
          id: 'system',
          name: 'System',
          role: 'citizen'
        }
      }
    ];

    // Add current status if different
    if (currentStatus !== 'reported' && currentStatus !== 'acknowledged') {
      mockEvents.push({
        _id: '5',
        type: 'status_change',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        description: `Status changed to ${currentStatus}`,
        actor: {
          id: 'official1',
          name: 'Sarah Official',
          role: 'official'
        },
        details: {
          oldValue: 'acknowledged',
          newValue: currentStatus
        }
      });
    }

    setTimeline(mockEvents);
  };

  const updateStatus = async (newStatus: string, reason?: string) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`http://localhost:5000/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          status: newStatus,
          reason: reason || `Status updated to ${newStatus}`
        }),
      });

      if (response.ok) {
        onStatusUpdate?.(newStatus);
        await loadTimeline(); // Reload timeline to show new event
        toast.success('Status updated successfully');
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusProgress = () => {
    const statusIndex = reportStatuses.findIndex(s => s.value === currentStatus);
    return ((statusIndex + 1) / reportStatuses.length) * 100;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffHours * 60);
      return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <CheckCircle className="h-4 w-4" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4" />;
      case 'assignment':
        return <User className="h-4 w-4" />;
      case 'priority_change':
        return <AlertCircle className="h-4 w-4" />;
      case 'location_update':
        return <MapPin className="h-4 w-4" />;
      case 'upvote':
        return <ThumbsUp className="h-4 w-4" />;
      case 'view':
        return <Eye className="h-4 w-4" />;
      default:
        return <Circle className="h-4 w-4" />;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
      case 'official':
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-red-600';
      case 'official':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingSpinner text="Loading timeline..." />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Report Timeline</span>
          </div>
          <Badge className={reportStatuses.find(s => s.value === currentStatus)?.color}>
            {reportStatuses.find(s => s.value === currentStatus)?.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(getStatusProgress())}%</span>
          </div>
          <Progress value={getStatusProgress()} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Reported</span>
            <span>Resolved</span>
          </div>
        </div>

        {/* Status Actions - Only show for admin users */}
        {showActions && isAdmin && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Update Status (Admin Only)</h4>
            <div className="flex flex-wrap gap-2">
              {reportStatuses.map((status) => (
                <Button
                  key={status.value}
                  size="sm"
                  variant={currentStatus === status.value ? "default" : "outline"}
                  onClick={() => updateStatus(status.value)}
                  disabled={isUpdating || currentStatus === status.value}
                >
                  {isUpdating ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2" />
                  ) : null}
                  {status.label}
                </Button>
              ))}
            </div>
          </div>
        )}
        
        {/* Show message for non-admin users when showActions is true */}
        {showActions && !isAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-sm text-amber-800 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Only administrators can update report status
            </p>
          </div>
        )}

        {/* Timeline Events */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Activity History</h4>
          <div className="space-y-4">
            {timeline.map((event, index) => (
              <div key={event._id} className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-white
                    ${event.type === 'status_change' ? 'bg-blue-500' : 
                      event.type === 'comment' ? 'bg-green-500' :
                      event.type === 'upvote' ? 'bg-purple-500' :
                      'bg-gray-500'}
                  `}>
                    {getEventIcon(event.type)}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-px h-6 bg-gray-200 ml-4 mt-2" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="font-medium">{event.description}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500">{formatTimestamp(event.timestamp)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {event.actor.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center space-x-1">
                      <span className={`text-xs font-medium ${getRoleColor(event.actor.role)}`}>
                        {event.actor.name}
                      </span>
                      <div className={getRoleColor(event.actor.role)}>
                        {getRoleIcon(event.actor.role)}
                      </div>
                    </div>
                  </div>

                  {event.details?.reason && (
                    <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                      "{event.details.reason}"
                    </p>
                  )}

                  {event.details?.location && (
                    <div className="text-xs text-gray-600 mt-2 flex items-center space-x-1">
                      <MapPin className="h-3 w-3" />
                      <span>{event.details.location.address}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {timeline.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p>No timeline events yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportTimeline;