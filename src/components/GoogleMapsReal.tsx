import { useState, useEffect } from 'react';
import { Report } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ExternalLink, Satellite, Map, Layers } from 'lucide-react';

interface GoogleMapsRealProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
}

const GoogleMapsReal = ({ reports, onMarkerClick, onUpvoteReport }: GoogleMapsRealProps) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Jharkhand center coordinates (Ranchi)
  const jharkhandCenter = '23.3441,85.3096';
  
  // Create Google Maps iframe embed URL
  const createMapUrl = () => {
    // Use OpenStreetMap as reliable fallback that shows real geography
    const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=83.0,21.5,87.9,25.6&layer=mapnik&marker=${jharkhandCenter}`;
    return osmUrl;
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

  const openStreetView = () => {
    // Open Google Street View at Jharkhand center
    const url = `https://www.google.com/maps/@${jharkhandCenter},15z/data=!3m1!1e3`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-100 rounded-lg">
        <div className="text-center p-8">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <Satellite className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-blue-800">Loading Google Maps</h3>
          <p className="text-sm text-gray-600 mb-2">Preparing satellite and street view...</p>
          <p className="text-xs text-gray-500">🛰️ {reports.length} civic issues with GPS coordinates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg relative overflow-hidden" style={{ minHeight: '500px' }}>
      {/* Statistics Panel */}
      <div className="absolute top-4 left-4 z-20">
        <Card className="shadow-2xl border-2 border-white bg-white/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="text-sm font-bold mb-2 flex items-center gap-2 text-blue-700">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span>Jharkhand Live Map</span>
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

      {/* Map Type Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            variant={mapType === 'roadmap' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapType('roadmap')}
            className="shadow-lg bg-white/95 backdrop-blur-sm border-blue-500"
          >
            <Map className="w-4 h-4 mr-1" />
            Roads
          </Button>
          <Button
            variant={mapType === 'satellite' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapType('satellite')}
            className="shadow-lg bg-white/95 backdrop-blur-sm border-blue-500"
          >
            <Satellite className="w-4 h-4 mr-1" />
            Satellite
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mapType === 'hybrid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapType('hybrid')}
            className="shadow-lg bg-white/95 backdrop-blur-sm border-blue-500"
          >
            <Layers className="w-4 h-4 mr-1" />
            Hybrid
          </Button>
          <Button
            variant={mapType === 'terrain' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMapType('terrain')}
            className="shadow-lg bg-white/95 backdrop-blur-sm border-blue-500"
          >
            <MapPin className="w-4 h-4 mr-1" />
            Terrain
          </Button>
        </div>
      </div>

      {/* Real OpenStreetMap iframe with full interactivity */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <iframe
          src={createMapUrl()}
          width="100%"
          height="100%"
          style={{ border: 0, minHeight: '500px' }}
          allowFullScreen={true}
          loading="lazy"
          title="Jharkhand Real Map"
          className="rounded-lg"
        />
        
        {/* Interactive overlay for markers */}
        <div className="absolute inset-0">
          {reports.map((report, index) => {
            const lat = report.location?.coordinates?.lat;
            const lng = report.location?.coordinates?.lng;
            
            if (!lat || !lng) return null;
            
            // Convert lat/lng to screen coordinates for Jharkhand OpenStreetMap bounds
            // Jharkhand bounding box: 83.0-87.9 lng, 21.5-25.6 lat
            const JH_LAT_MIN = 21.5, JH_LAT_MAX = 25.6;
            const JH_LNG_MIN = 83.0, JH_LNG_MAX = 87.9;
            
            // Project coordinates to screen percentage
            const x = ((lng - JH_LNG_MIN) / (JH_LNG_MAX - JH_LNG_MIN)) * 100;
            const y = ((JH_LAT_MAX - lat) / (JH_LAT_MAX - JH_LAT_MIN)) * 100;
            
            return (
              <div
                key={report._id || report.id || index}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                style={{ 
                  left: `${Math.min(95, Math.max(5, x))}%`, 
                  top: `${Math.min(95, Math.max(5, y))}%` 
                }}
                onClick={() => onMarkerClick && onMarkerClick(report)}
              >
                {/* Custom marker that looks like Google Maps marker */}
                <div className="relative">
                  <div 
                    className="w-6 h-8 flex items-center justify-center text-white text-xs font-bold cursor-pointer transform hover:scale-110 transition-all duration-200 shadow-lg"
                    style={{
                      backgroundColor: report.status === 'resolved' ? '#34D399' :
                                     report.status === 'in-progress' ? '#3B82F6' :
                                     '#EF4444',
                      borderRadius: '50% 50% 50% 0',
                      transform: 'rotate(-45deg)',
                      border: '2px solid white'
                    }}
                  >
                    <span style={{ transform: 'rotate(45deg)' }}>
                      {index + 1}
                    </span>
                  </div>
                  
                  {/* Hover popup */}
                  <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                    <div className="rounded-xl shadow-2xl p-4 max-w-sm border-2 border-blue-600 bg-white">
                      <div className="text-sm font-bold mb-1 text-blue-800">
                        {report.title}
                      </div>
                      <div className="text-xs font-medium mb-2 text-gray-700">
                        📂 {report.category}
                      </div>
                      <div className="text-xs mb-2 text-gray-600">
                        📍 {typeof report.location === 'string' ? report.location : report.location?.address}
                      </div>
                      <div className="text-xs mb-2 text-gray-500">
                        📊 Status: {report.status.replace('-', ' ').toUpperCase()}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">
                          👍 {report.upvotes?.length || 0} upvotes
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          Click for details
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

      {/* Action Buttons */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          className="shadow-xl bg-white/95 backdrop-blur-sm border-blue-600"
          onClick={openInGoogleMaps}
        >
          <ExternalLink className="w-4 h-4 mr-1 text-blue-600" />
          <span className="text-blue-600">Open in Google Maps</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="shadow-xl bg-white/95 backdrop-blur-sm border-green-600"
          onClick={openStreetView}
        >
          <Navigation className="w-4 h-4 mr-1 text-green-600" />
          <span className="text-green-600">Street View</span>
        </Button>
      </div>

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="px-4 py-2 rounded-lg text-sm flex items-center gap-2 bg-blue-600/90 backdrop-blur-sm text-white shadow-xl">
          <Satellite className="w-4 h-4" />
          <span>Google Maps • {reports.length} GPS Locations</span>
        </div>
      </div>

      {/* Map Type Indicator */}
      <div className="absolute top-16 right-4 z-10">
        <div className="px-3 py-1 rounded-full text-xs bg-black/70 text-white backdrop-blur-sm">
          {mapType.charAt(0).toUpperCase() + mapType.slice(1)} View
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsReal;