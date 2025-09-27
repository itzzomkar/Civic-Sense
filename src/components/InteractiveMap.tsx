import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Import Leaflet CSS
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MapPin, 
  ThumbsUp, 
  MessageCircle, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  Clock,
  Navigation,
  Zap
} from 'lucide-react';
import { Report } from '@/services/api';

// Fix for Leaflet icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different statuses
const createStatusIcon = (status: string, priority?: string) => {
  const getColor = () => {
    switch (status) {
      case 'resolved': return '#10B981'; // green
      case 'in-progress': return '#3B82F6'; // blue
      case 'acknowledged': return '#F59E0B'; // amber
      case 'urgent': return '#EF4444'; // red
      default: return '#6B7280'; // gray
    }
  };

  const color = getColor();
  const size = priority === 'urgent' ? 35 : priority === 'high' ? 30 : 25;
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-size: ${size/3}px;
          font-weight: bold;
        ">
          ${status === 'resolved' ? '✓' : status === 'urgent' ? '!' : '●'}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size]
  });
};

// Component to handle map centering
const MapController = ({ center, reports }: { center: [number, number]; reports: Report[] }) => {
  const map = useMap();
  
  useEffect(() => {
    if (reports.length > 0) {
      const coords = reports
        .map(r => [r.location.coordinates?.lat, r.location.coordinates?.lng] as [number|undefined, number|undefined])
        .filter(([lat, lng]) => typeof lat === 'number' && typeof lng === 'number') as [number, number][];
      if (coords.length > 0) {
        const bounds = L.latLngBounds(coords);
        setTimeout(() => {
          try {
            map.invalidateSize();
            map.fitBounds(bounds, { padding: [20, 20] });
          } catch {}
        }, 50);
      } else {
        setTimeout(() => {
          try { map.invalidateSize(); map.setView(center, 7); } catch {}
        }, 50);
      }
    } else {
      setTimeout(() => {
        try { map.invalidateSize(); map.setView(center, 7); } catch {}
      }, 50);
    }
  }, [map, center, reports]);

  return null;
};

interface InteractiveMapProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
  className?: string;
}

const InteractiveMap = ({ 
  reports, 
  onMarkerClick, 
  onUpvoteReport, 
  className = "" 
}: InteractiveMapProps) => {
  // Jharkhand center (Ranchi)
  const JHARKHAND_CENTER: [number, number] = [23.3441, 85.3096];
  const [userLocation, setUserLocation] = useState<[number, number]>(JHARKHAND_CENTER);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<L.Map>(null);

  // Ensure map renders correctly when shown after being hidden (e.g., tabs)
  useEffect(() => {
    const t = setTimeout(() => {
      if (mapRef.current) {
        try { mapRef.current.invalidateSize(); } catch {}
      }
    }, 300);
    const onResize = () => {
      if (mapRef.current) {
        try { mapRef.current.invalidateSize(); } catch {}
      }
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); clearTimeout(t); };
  }, []);

  // Get user's current location
  const getCurrentLocation = () => {
    setIsLocating(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          setIsLocating(false);
          
          // Center map on user location
          if (mapRef.current) {
            mapRef.current.setView([latitude, longitude], 14);
          }
        },
        (error) => {
          console.log('Geolocation error:', error);
          setIsLocating(false);
          // Fallback to Jharkhand (Ranchi)
          setUserLocation(JHARKHAND_CENTER);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } else {
      setIsLocating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved': return <CheckCircle className="w-3 h-3" />;
      case 'in-progress': return <AlertCircle className="w-3 h-3" />;
      case 'acknowledged': return <Clock className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-success';
      case 'in-progress': return 'bg-primary';
      case 'acknowledged': return 'bg-warning';
      default: return 'bg-muted-foreground';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`relative h-full ${className}`} style={{ minHeight: '520px' }}>
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
        <Card className="shadow-lg">
          <CardContent className="p-2">
            <Button 
              size="sm" 
              variant="outline"
              onClick={getCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-2"
            >
              {isLocating ? (
                <Zap className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              {isLocating ? 'Locating...' : 'My Location'}
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardContent className="p-3 text-xs">
            <div className="space-y-2">
              <div className="font-semibold">Legend:</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full"></div>
                <span>Resolved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-warning rounded-full"></div>
                <span>Acknowledged</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-muted-foreground rounded-full"></div>
                <span>Pending</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistics Overlay */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Card className="shadow-lg">
          <CardContent className="p-3">
            <div className="text-sm font-semibold mb-2">🗺️ Map Statistics</div>
            <div className="space-y-1 text-xs">
              <div>Total Issues: <span className="font-bold text-primary">{reports.length}</span></div>
              <div>Resolved: <span className="font-bold text-success">
                {reports.filter(r => r.status === 'resolved').length}
              </span></div>
              <div>In Progress: <span className="font-bold text-primary">
                {reports.filter(r => r.status === 'in-progress').length}
              </span></div>
              <div>Pending: <span className="font-bold text-warning">
                {reports.filter(r => r.status === 'pending').length}
              </span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Container */}
      <MapContainer
        whenCreated={(map) => {
          // store map instance and immediately fix size
          // slight delay allows the tab transition to complete
          mapRef.current = map as unknown as L.Map;
          setTimeout(() => {
            try { map.invalidateSize(); } catch {}
          }, 200);
        }}
        center={userLocation}
        zoom={7}
        style={{ height: '100%', width: '100%', minHeight: '520px' }}
        className="rounded-lg"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />
        
        {/* Map Controller */}
        <MapController center={userLocation} reports={reports} />
        
        {/* Report Markers */}
        {reports.map((report) => {
          const reportId = report._id || report.id;
          const lat = report.location.coordinates?.lat;
          const lng = report.location.coordinates?.lng;
          
          if (!lat || !lng) return null;
          
          return (
            <Marker
              key={reportId}
              position={[lat, lng]}
              icon={createStatusIcon(report.status, report.priority)}
              eventHandlers={{
                click: () => onMarkerClick?.(report)
              }}
            >
              <Popup className="custom-popup" maxWidth={300}>
                <div className="space-y-3 p-2">
                  {/* Header */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm leading-tight">{report.title}</h3>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`} />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">{report.category}</Badge>
                      <Badge 
                        className={`text-xs ${getStatusColor(report.status)} text-white`}
                      >
                        <div className="flex items-center gap-1">
                          {getStatusIcon(report.status)}
                          <span className="capitalize">{report.status.replace('-', ' ')}</span>
                        </div>
                      </Badge>
                      {report.priority && (
                        <Badge variant="secondary" className="text-xs">
                          {report.priority}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {report.description}
                  </p>

                  {/* Location */}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-3 h-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground text-xs">
                      {report.location.address}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{report.upvotes?.length || 0} support</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{report.comments?.length || 0} comments</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatTimeAgo(report.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs flex-1"
                      onClick={() => onUpvoteReport?.(reportId || '')}
                    >
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      Support
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-xs flex-1"
                      onClick={() => onMarkerClick?.(report)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        {/* User Location Marker */}
        <Marker 
          position={userLocation}
          icon={L.divIcon({
            className: 'user-location-marker',
            html: `
              <div style="
                background: linear-gradient(135deg, #3B82F6, #1D4ED8);
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                animation: pulse 2s infinite;
              "></div>
              <style>
                @keyframes pulse {
                  0% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
                  50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
                  100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
                }
              </style>
            `,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-semibold">📍 Your Location</div>
              <div className="text-muted-foreground">Current position</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default InteractiveMap;