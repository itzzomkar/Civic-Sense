import { useState, useEffect } from 'react';
import { Report } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ExternalLink, Satellite, Map } from 'lucide-react';

interface SimpleRealMapProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
}

const SimpleRealMap = ({ reports, onMarkerClick, onUpvoteReport }: SimpleRealMapProps) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  // Jharkhand center coordinates (Ranchi)
  const jharkhandCenter = '23.3441,85.3096';
  
  // Create a Google Maps URL with markers for each report
  const createMapUrl = () => {
    const baseUrl = 'https://www.google.com/maps/embed/v1/view';
    const params = new URLSearchParams({
      key: 'AIzaSyBFw0Qbyq9zTvyU02W1_k8T8MQKElZxnb0', // Public embed key
      center: jharkhandCenter,
      zoom: '8',
      maptype: mapType
    });
    
    return `${baseUrl}?${params.toString()}`;
  };

  const openInGoogleMaps = () => {
    // Create markers string for Google Maps URL
    const markersString = reports.map((report, index) => {
      const lat = report.location?.coordinates?.lat;
      const lng = report.location?.coordinates?.lng;
      
      if (lat && lng) {
        const color = report.status === 'resolved' ? 'green' : 
                     report.status === 'in-progress' ? 'blue' : 'red';
        return `&markers=color:${color}%7Clabel:${index + 1}%7C${lat},${lng}`;
      }
      return '';
    }).filter(marker => marker !== '').join('');
    
    const url = `https://www.google.com/maps/@${jharkhandCenter},8z${markersString}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
        <div className="text-center p-8">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <Satellite className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Loading Real Map</h3>
          <p className="text-sm text-gray-600 mb-2">Loading interactive map of Jharkhand...</p>
          <p className="text-xs text-gray-500">🗺️ {reports.length} civic issues to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg relative" style={{ minHeight: '500px' }}>
      {/* Statistics Panel */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="shadow-xl border-2 border-white bg-white/95">
          <CardContent className="p-3">
            <div className="text-sm font-bold mb-2 flex items-center gap-2 text-blue-700">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Jharkhand Civic Issues</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center gap-3">
                <span className="text-gray-600">Total Issues:</span>
                <span className="font-bold text-blue-600">{reports.length}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-gray-600">Resolved:</span>
                <span className="font-bold text-green-600">
                  {reports.filter(r => r.status === 'resolved').length}
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-gray-600">Active:</span>
                <span className="font-bold text-orange-600">
                  {reports.filter(r => r.status !== 'resolved').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Type Toggle */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant={mapType === 'roadmap' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMapType('roadmap')}
          className="shadow-lg bg-white border-blue-600"
        >
          <Map className="w-4 h-4 mr-1" />
          Streets
        </Button>
        <Button
          variant={mapType === 'satellite' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMapType('satellite')}
          className="shadow-lg bg-white border-blue-600"
        >
          <Satellite className="w-4 h-4 mr-1" />
          Satellite
        </Button>
      </div>

      {/* OpenStreetMap with custom markers overlay */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        {/* Base OpenStreetMap */}
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=83.0,21.5,87.9,25.6&layer=mapnik"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          title="Jharkhand Real Map"
          className="rounded-lg"
        />
        
        {/* Custom markers overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {reports.map((report, index) => {
            const lat = report.location?.coordinates?.lat;
            const lng = report.location?.coordinates?.lng;
            
            if (!lat || !lng) return null;
            
            // Convert lat/lng to screen coordinates for Jharkhand bounds
            const JH_LAT_MIN = 21.5, JH_LAT_MAX = 25.6;
            const JH_LNG_MIN = 83.0, JH_LNG_MAX = 87.9;
            
            const x = ((lng - JH_LNG_MIN) / (JH_LNG_MAX - JH_LNG_MIN)) * 100;
            const y = ((JH_LAT_MAX - lat) / (JH_LAT_MAX - JH_LAT_MIN)) * 100;
            
            return (
              <div
                key={report._id || report.id || index}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto z-20"
                style={{ 
                  left: `${Math.min(95, Math.max(5, x))}%`, 
                  top: `${Math.min(95, Math.max(5, y))}%` 
                }}
                onClick={() => onMarkerClick && onMarkerClick(report)}
              >
                <div 
                  className="w-8 h-8 rounded-full border-3 border-white shadow-2xl flex items-center justify-center text-white text-xs font-bold cursor-pointer transform hover:scale-125 transition-all duration-200"
                  style={{
                    backgroundColor: report.status === 'resolved' ? '#10b981' :
                                   report.status === 'in-progress' ? '#3b82f6' :
                                   '#ef4444',
                    borderWidth: '3px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                  }}
                >
                  {index + 1}
                </div>
                
                {/* Hover popup */}
                <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                  <div className="rounded-xl shadow-2xl p-3 max-w-xs border-2 border-blue-600 bg-white">
                    <div className="text-sm font-bold mb-1 text-blue-800">
                      {report.title}
                    </div>
                    <div className="text-xs font-medium mb-2 text-gray-700">
                      {report.category}
                    </div>
                    <div className="text-xs mb-2 text-gray-600">
                      📍 {typeof report.location === 'string' ? report.location : report.location?.address || 'Jharkhand'}
                    </div>
                    <div className="flex items-center justify-between">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-bold text-white"
                        style={{
                          backgroundColor: report.status === 'resolved' ? '#10b981' :
                                         report.status === 'in-progress' ? '#3b82f6' :
                                         '#ef4444'
                        }}
                      >
                        {report.status.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        👍 {report.upvotes?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* External Maps Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          className="border-2 border-blue-600 shadow-lg hover:shadow-xl bg-white/95"
          onClick={openInGoogleMaps}
        >
          <ExternalLink className="w-4 h-4 mr-1 text-blue-600" />
          <span className="text-blue-600">Open in Google Maps</span>
        </Button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="px-3 py-2 rounded-lg text-xs flex items-center gap-2 bg-blue-600 text-white shadow-lg">
          <MapPin className="w-3 h-3" />
          <span>Real Jharkhand Map • {reports.length} Issues</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleRealMap;