import { useEffect, useRef, useState } from 'react';
import { Report } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, MapPin, Navigation, ExternalLink } from 'lucide-react';

interface BasicMapProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
}

const BasicMap = ({ reports, onMarkerClick, onUpvoteReport }: BasicMapProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Set a timeout to show fallback after 5 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowFallback(true);
    }, 5000);

    // Check if we can load a simple map
    const testTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(testTimer);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
        <div className="text-center p-8">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <MapPin className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Loading Map</h3>
          <p className="text-sm text-gray-600 mb-2">Setting up interactive map...</p>
          <p className="text-xs text-gray-500">🗺️ {reports.length} issues ready to display</p>
        </div>
      </div>
    );
  }

  // Ultra-simple but clearly visible map
  return (
    <div 
      className="h-full w-full rounded-lg relative border-4"
      style={{
        backgroundColor: '#4fc3f7',
        minHeight: '500px',
        borderColor: '#1565c0',
        borderStyle: 'solid'
      }}
    >
      {/* Header */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="shadow-xl border-2 border-white" style={{ backgroundColor: '#ffffff' }}>
          <CardContent className="p-3">
            <div className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#1565c0' }}>
              <Navigation className="w-4 h-4" style={{ color: '#1976d2' }} />
              <span style={{ color: '#1565c0' }}>Jharkhand Civic Issues</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center gap-3">
                <span style={{ color: '#424242' }}>Total Issues:</span>
                <span className="font-bold" style={{ color: '#1976d2' }}>{reports.length}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span style={{ color: '#424242' }}>Resolved:</span>
                <span className="font-bold" style={{ color: '#2e7d32' }}>
                  {reports.filter(r => r.status === 'resolved').length}
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span style={{ color: '#424242' }}>Active:</span>
                <span className="font-bold" style={{ color: '#ef6c00' }}>
                  {reports.filter(r => r.status !== 'resolved').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Simple but clearly visible map background */}
      <div className="absolute inset-0 rounded-lg" style={{
        backgroundColor: '#81d4fa',
        backgroundImage: `
          linear-gradient(#1976d2 1px, transparent 1px),
          linear-gradient(90deg, #1976d2 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }}>
        {/* Clear Map Features */}
        <div className="absolute inset-0">
          {/* Major roads */}
          <div className="absolute top-1/4 left-0 right-0 h-3" style={{ backgroundColor: '#424242', opacity: 0.8 }}></div>
          <div className="absolute top-3/4 left-0 right-0 h-3" style={{ backgroundColor: '#424242', opacity: 0.8 }}></div>
          <div className="absolute left-1/3 top-0 bottom-0 w-3" style={{ backgroundColor: '#424242', opacity: 0.8 }}></div>
          <div className="absolute left-2/3 top-0 bottom-0 w-3" style={{ backgroundColor: '#424242', opacity: 0.8 }}></div>
          
          {/* Water bodies */}
          <div className="absolute top-12 right-12 w-32 h-20 rounded-xl" style={{ backgroundColor: '#0d47a1', opacity: 0.6 }}></div>
          <div className="absolute bottom-16 left-16 w-40 h-12 rounded-xl" style={{ backgroundColor: '#0d47a1', opacity: 0.6 }}></div>
          
          {/* Green areas/parks */}
          <div className="absolute top-20 left-20 w-24 h-24 rounded-xl" style={{ backgroundColor: '#1b5e20', opacity: 0.5 }}></div>
          <div className="absolute bottom-24 right-24 w-20 h-20 rounded-xl" style={{ backgroundColor: '#1b5e20', opacity: 0.5 }}></div>
          
          {/* City landmarks */}
          <div className="absolute top-1/2 left-1/2 w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2" style={{ backgroundColor: '#d32f2f', opacity: 0.8 }}></div>
        </div>
        
        {/* Location markers for reports */}
        <div className="absolute inset-0 p-8">
          {reports.map((report, index) => {
            // Use actual coordinates if available, otherwise distribute evenly
            let x, y;
            const lat = report.location?.coordinates?.lat;
            const lng = report.location?.coordinates?.lng;
            
            if (lat && lng) {
              // Simple projection for Jharkhand region (approximation)
              // Jharkhand bounds: lat 21.5-25.6, lng 83.0-87.9
              const JH_LAT_MIN = 21.5, JH_LAT_MAX = 25.6;
              const JH_LNG_MIN = 83.0, JH_LNG_MAX = 87.9;
              
              x = ((lng - JH_LNG_MIN) / (JH_LNG_MAX - JH_LNG_MIN)) * 80 + 10;
              y = ((JH_LAT_MAX - lat) / (JH_LAT_MAX - JH_LAT_MIN)) * 70 + 15;
              
              // Clamp to valid range
              x = Math.max(10, Math.min(90, x));
              y = Math.max(15, Math.min(85, y));
            } else {
              // Fallback to distributed positions
              const positions = [
                { x: 30, y: 30 }, { x: 70, y: 40 }, { x: 50, y: 60 },
                { x: 25, y: 70 }, { x: 75, y: 25 }, { x: 45, y: 45 }
              ];
              const pos = positions[index % positions.length];
              x = pos.x;
              y = pos.y;
            }
            
            return (
              <div
                key={report.id || report._id || index}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${x}%`, top: `${y}%` }}
                onClick={() => onMarkerClick && onMarkerClick(report)}
              >
                {/* Marker Pin */}
                <div className={`relative`}>
                  <div 
                    className="w-8 h-8 rounded-full border-3 border-white shadow-xl flex items-center justify-center text-white text-sm font-bold cursor-pointer transform hover:scale-110 transition-transform"
                    style={{
                      backgroundColor: report.status === 'resolved' ? '#4caf50' :
                                     report.status === 'in-progress' ? '#2196f3' :
                                     '#f44336',
                      borderWidth: '3px',
                      borderColor: '#ffffff',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}
                  >
                    📍
                  </div>
                  
                  {/* Popup on hover */}
                  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                    <div className="rounded-lg shadow-2xl p-4 max-w-xs border-4 border-white" style={{ backgroundColor: '#ffffff' }}>
                      <div className="text-sm font-bold mb-2" style={{ color: '#1565c0' }}>
                        {report.title}
                      </div>
                      <div className="text-xs font-medium mb-2" style={{ color: '#424242' }}>
                        {report.category}
                      </div>
                      <div className="text-xs mb-3" style={{ color: '#666666' }}>
                        📍 {typeof report.location === 'string' ? report.location : report.location?.address || 'Jharkhand'}
                      </div>
                      <div className="flex items-center justify-between">
                        <span 
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{
                            backgroundColor: report.status === 'resolved' ? '#4caf50' :
                                           report.status === 'in-progress' ? '#2196f3' :
                                           '#f44336',
                            color: '#ffffff'
                          }}
                        >
                          {report.status.replace('-', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs font-medium" style={{ color: '#424242' }}>
                          👍 {report.upvotes?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom info */}
      <div className="absolute bottom-4 right-4 z-10">
        <div className="px-3 py-2 rounded-lg text-xs flex items-center gap-2 border-2 border-white shadow-lg" style={{ backgroundColor: '#1565c0', color: '#ffffff' }}>
          <MapPin className="w-3 h-3" style={{ color: '#ffffff' }} />
          <span style={{ color: '#ffffff' }}>Interactive Civic Issues Map</span>
        </div>
      </div>

      {/* Center message */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="border-4 border-white rounded-xl p-6 shadow-2xl max-w-sm" style={{ backgroundColor: '#ffffff' }}>
            <Navigation className="w-12 h-12 mx-auto mb-4" style={{ color: '#1976d2' }} />
            <h3 className="text-lg font-bold mb-2" style={{ color: '#1565c0' }}>
              Jharkhand Civic Issues Map
            </h3>
            <p className="text-sm mb-4" style={{ color: '#424242' }}>
              {reports.length} community reports displayed across Jharkhand
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f44336' }}></div>
                  <span style={{ color: '#424242' }}>Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2196f3' }}></div>
                  <span style={{ color: '#424242' }}>In Progress</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4caf50' }}></div>
                  <span style={{ color: '#424242' }}>Resolved</span>
                </div>
              </div>
              <p className="text-xs" style={{ color: '#666666' }}>
                🎯 Hover over markers for details • Click to view full report
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Try external map button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          className="border-2 border-blue-600 shadow-lg hover:shadow-xl"
          style={{ 
            backgroundColor: '#ffffff', 
            color: '#1976d2',
            borderColor: '#1976d2'
          }}
          onClick={() => {
            const center = '23.3441,85.3096'; // Jharkhand center (Ranchi)
            const url = `https://www.google.com/maps/@${center},8z`;
            window.open(url, '_blank');
          }}
        >
          <ExternalLink className="w-4 h-4 mr-1" style={{ color: '#1976d2' }} />
          <span style={{ color: '#1976d2' }}>Open in Maps</span>
        </Button>
      </div>
    </div>
  );
};

export default BasicMap;