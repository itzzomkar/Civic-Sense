import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MapPin, 
  Bell, 
  BellOff, 
  Navigation, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Report } from '@/services/api';

interface GeofenceAlert {
  id: string;
  report: Report;
  distance: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  dismissed: boolean;
}

const GeofenceNotifications = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [alerts, setAlerts] = useState<GeofenceAlert[]>([]);
  const [radius, setRadius] = useState(1000); // meters
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  
  const { toast } = useToast();

  // Request location permission and start watching position
  useEffect(() => {
    if (isEnabled && navigator.geolocation) {
      checkLocationPermission();
    }
  }, [isEnabled]);

  const checkLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setPermissionStatus(permission.state);
      
      if (permission.state === 'granted') {
        startLocationTracking();
      } else if (permission.state === 'prompt') {
        requestLocation();
      }
      
      permission.addEventListener('change', () => {
        setPermissionStatus(permission.state);
        if (permission.state === 'granted') {
          startLocationTracking();
        } else {
          stopLocationTracking();
        }
      });
    } catch (error) {
      console.error('Permission API not supported:', error);
      requestLocation();
    }
  };

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setPermissionStatus('granted');
        startLocationTracking();
        
        toast({
          title: 'Location access granted',
          description: 'You will now receive alerts about nearby civic issues.'
        });
      },
      (error) => {
        console.error('Location error:', error);
        setPermissionStatus('denied');
        
        toast({
          title: 'Location access denied',
          description: 'Enable location access to receive geofenced notifications.',
          variant: 'destructive'
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setUserLocation(newLocation);
        checkNearbyReports(newLocation);
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: false,
        timeout: 30000,
        maximumAge: 60000 // 1 minute
      }
    );

    // Store watchId for cleanup
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  };

  const stopLocationTracking = () => {
    setUserLocation(null);
    setAlerts([]);
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Check for nearby reports and create alerts
  const checkNearbyReports = async (location: {lat: number, lng: number}) => {
    try {
      // In a real implementation, this would call your API with location parameters
      // For demo, we'll simulate nearby reports
      const mockNearbyReports: Report[] = [
        {
          _id: '1',
          title: 'Broken streetlight on Main Street',
          description: 'The streetlight has been out for 3 days, making the area unsafe at night.',
          category: 'Lighting',
          status: 'pending',
          priority: 'high',
          location: {
            address: '123 Main Street',
            coordinates: { lat: location.lat + 0.001, lng: location.lng + 0.001 }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          upvotes: [],
          comments: []
        }
      ];

      const newAlerts: GeofenceAlert[] = [];
      
      mockNearbyReports.forEach(report => {
        if (report.location?.coordinates) {
          const distance = calculateDistance(
            location.lat,
            location.lng,
            report.location.coordinates.lat,
            report.location.coordinates.lng
          );
          
          if (distance <= radius && !alerts.some(alert => alert.report._id === report._id)) {
            newAlerts.push({
              id: `alert_${report._id}_${Date.now()}`,
              report,
              distance: Math.round(distance),
              priority: report.priority as any || 'medium',
              timestamp: new Date(),
              dismissed: false
            });
          }
        }
      });
      
      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev, ...newAlerts]);
        
        // Show notification
        newAlerts.forEach(alert => {
          showNotification(alert);
        });
      }
    } catch (error) {
      console.error('Error checking nearby reports:', error);
    }
  };

  const showNotification = (alert: GeofenceAlert) => {
    // Browser notification
    if (Notification.permission === 'granted') {
      const notification = new Notification(`Nearby Issue: ${alert.report.title}`, {
        body: `${alert.distance}m away - ${alert.report.category}`,
        icon: '/favicon.ico',
        tag: alert.id
      });
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
    
    // Toast notification
    toast({
      title: `Nearby civic issue (${alert.distance}m away)`,
      description: alert.report.title,
      action: (
        <Button size="sm" onClick={() => viewReport(alert.report)}>
          View
        </Button>
      )
    });
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  const viewReport = (report: Report) => {
    // Navigate to report details or open in modal
    console.log('Viewing report:', report.title);
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast({
          title: 'Notifications enabled',
          description: 'You will receive browser notifications for nearby issues.'
        });
      }
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const activeAlerts = alerts.filter(alert => !alert.dismissed);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Geofenced Notifications
          <Badge variant="secondary">{activeAlerts.length}</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <Bell className="w-5 h-5 text-blue-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium">Location-based Alerts</p>
              <p className="text-sm text-gray-600">
                Get notified about civic issues near you ({formatDistance(radius)} radius)
              </p>
            </div>
          </div>
          <Switch 
            checked={isEnabled} 
            onCheckedChange={setIsEnabled}
          />
        </div>

        {/* Permission Status */}
        {isEnabled && (
          <>
            {permissionStatus === 'denied' && (
              <Alert>
                <Navigation className="w-4 h-4" />
                <AlertDescription>
                  Location access is required for geofenced notifications. 
                  <Button 
                    variant="link" 
                    className="h-auto p-0 ml-1"
                    onClick={checkLocationPermission}
                  >
                    Grant permission
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {permissionStatus === 'granted' && userLocation && (
              <div className="flex items-center gap-2 text-sm text-green-600 p-2 bg-green-50 rounded">
                <MapPin className="w-4 h-4" />
                Location tracking active
                {Notification.permission !== 'granted' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={requestNotificationPermission}
                    className="ml-auto"
                  >
                    Enable Browser Notifications
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Nearby Issues</h4>
            {activeAlerts.map((alert) => (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border ${getPriorityColor(alert.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(alert.report.status)}
                      <Badge variant="outline" className="text-xs">
                        {alert.report.category}
                      </Badge>
                      <Badge className="text-xs bg-blue-100 text-blue-800">
                        {formatDistance(alert.distance)} away
                      </Badge>
                    </div>
                    <h5 className="font-medium text-sm mb-1">
                      {alert.report.title}
                    </h5>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {alert.report.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        {alert.report.location?.address}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => viewReport(alert.report)}
                    >
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Settings */}
        {isEnabled && permissionStatus === 'granted' && (
          <div className="pt-4 border-t">
            <label className="block text-sm font-medium mb-2">
              Alert Radius: {formatDistance(radius)}
            </label>
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>100m</span>
              <span>5km</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeofenceNotifications;