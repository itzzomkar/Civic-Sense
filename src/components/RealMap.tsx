import { useState, useEffect } from 'react';
import { Report } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ExternalLink, Satellite, Map } from 'lucide-react';

interface RealMapProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
}

const RealMap = ({ reports, onMarkerClick, onUpvoteReport }: RealMapProps) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite'>('roadmap');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Jharkhand center coordinates (Ranchi)
  const jharkhandCenter = '23.3441,85.3096';
  // Jharkhand bounds (approx) for the OSM iframe and for projecting markers to screen
  const JH_LEFT = 83.0;   // min lon
  const JH_RIGHT = 87.9;  // max lon
  const JH_BOTTOM = 21.5; // min lat
  const JH_TOP = 25.6;    // max lat

  // Create markers string for Google Maps embed - use actual coordinates from reports
  const markersString = reports.map((report, index) => {
    const lat = report.location?.coordinates?.lat;
    const lng = report.location?.coordinates?.lng;
    
    // Only add marker if we have valid coordinates
    if (lat && lng) {
      const color = report.status === 'resolved' ? 'green' : 
                   report.status === 'in-progress' ? 'blue' : 'red';
      return `&markers=color:${color}%7Clabel:${index + 1}%7C${lat},${lng}`;
    }
    return '';
  }).filter(marker => marker !== '').join('');

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
        <div className="text-center p-8">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <Satellite className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Loading Map</h3>
          <p className="text-sm text-gray-600 mb-2">Loading view of Jharkhand...</p>
          <p className="text-xs text-gray-500">🗺️ {reports.length} civic issues to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-lg relative" style={{ minHeight: '500px' }}>
      {/* Statistics Panel */}
      <div className="absolute top-4 left-4 z-10">
        <Card className="shadow-xl border-2 border-white" style={{ backgroundColor: 'rgba(255,255,255,0.95)' }}>
          <CardContent className="p-3">
            <div className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: '#1565c0' }}>
              <Navigation className="w-4 h-4" style={{ color: '#1976d2' }} />
              <span>Jharkhand Civic Issues</span>
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

      {/* Map Type Toggle */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <Button
          variant={mapType === 'roadmap' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMapType('roadmap')}
          className="shadow-lg"
          style={{ backgroundColor: mapType === 'roadmap' ? '#1976d2' : '#ffffff', color: mapType === 'roadmap' ? '#ffffff' : '#1976d2' }}
        >
          <Map className="w-4 h-4 mr-1" />
          Streets
        </Button>
        <Button
          variant={mapType === 'satellite' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMapType('satellite')}
          className="shadow-lg"
          style={{ backgroundColor: mapType === 'satellite' ? '#1976d2' : '#ffffff', color: mapType === 'satellite' ? '#ffffff' : '#1976d2' }}
        >
          <Satellite className="w-4 h-4 mr-1" />
          Satellite
        </Button>
      </div>

      {/* Real OpenStreetMap Embed - No API Key Required */}
      <div className="absolute inset-0 rounded-lg overflow-hidden border-4 border-blue-600">
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${JH_LEFT},${JH_BOTTOM},${JH_RIGHT},${JH_TOP}&layer=mapnik&marker=${jharkhandCenter}`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen={true}
          loading="lazy"
          title="Jharkhand Civic Issues - OpenStreetMap"
        >
        </iframe>
      </div>

      {/* Issue Markers Overlay (screen-projected for the default view) */}
      <div className="absolute inset-0 pointer-events-none">
        {reports.map((report, index) => {
          // Position markers based on coordinates; if missing, skip
          const lat = report.location?.coordinates?.lat;
          const lng = report.location?.coordinates?.lng;
          if (lat == null || lng == null) return null;
          
          // Convert coordinates to screen position (approximate for fixed bounds)
          const x = ((lng - JH_LEFT) / (JH_RIGHT - JH_LEFT)) * 100;
          const y = ((JH_TOP - lat) / (JH_TOP - JH_BOTTOM)) * 100;
          
          return (
            <div
              key={report.id || report._id || index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group pointer-events-auto"
              style={{ left: `${Math.min(95, Math.max(5, x))}%`, top: `${Math.min(95, Math.max(5, y))}%` }}
              onClick={() => onMarkerClick && onMarkerClick(report)}
            >
              <div 
                className="w-9 h-9 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white text-xs font-extrabold cursor-pointer transform hover:scale-125 transition-all duration-200"
                style={{
                  background: report.status === 'resolved' ? 'linear-gradient(135deg,#43a047,#2e7d32)' :
                             report.status === 'in-progress' ? 'linear-gradient(135deg,#1e88e5,#1565c0)' :
                             'linear-gradient(135deg,#e53935,#b71c1c)',
                  boxShadow: '0 10px 24px rgba(0,0,0,0.35)'
                }}
              >
                {index + 1}
              </div>
              
              {/* Hover popup */}
              <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                <div className="rounded-xl shadow-2xl p-4 max-w-xs border-2 border-blue-600 bg-white">
                  <div className="text-sm font-bold mb-1 text-blue-800">
                    {report.title}
                  </div>
                  <div className="text-xs font-medium mb-2 text-slate-700">
                    {report.category}
                  </div>
                  <div className="text-xs mb-3 text-slate-600">
                    📍 {typeof report.location === 'string' ? report.location : report.location?.address || 'Jharkhand'}
                  </div>
                  <div className="flex items-center justify-between">
                    <span 
                      className="px-3 py-1 rounded-full text-[10px] font-bold text-white"
                      style={{
                        backgroundColor: report.status === 'resolved' ? '#4caf50' :
                                       report.status === 'in-progress' ? '#2196f3' :
                                       '#f44336'
                      }}
                    >
                      {report.status.replace('-', ' ').toUpperCase()}
                    </span>
                    <span className="text-xs font-medium text-slate-700">
                      👍 {report.upvotes?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* External Maps Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          variant="outline"
          size="sm"
          className="border-2 border-blue-600 shadow-lg hover:shadow-xl"
          style={{ 
            backgroundColor: 'rgba(255,255,255,0.95)', 
            color: '#1976d2',
            borderColor: '#1976d2'
          }}
          onClick={() => {
            const url = `https://www.google.com/maps/@${jharkhandCenter},8z${markersString}`;
            window.open(url, '_blank');
          }}
        >
          <ExternalLink className="w-4 h-4 mr-1" style={{ color: '#1976d2' }} />
          <span style={{ color: '#1976d2' }}>Full Screen</span>
        </Button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 z-10">
        <div className="px-3 py-2 rounded-lg text-xs flex items-center gap-2 border-2 border-white shadow-lg" style={{ backgroundColor: 'rgba(21,101,192,0.9)', color: '#ffffff' }}>
          <MapPin className="w-3 h-3" style={{ color: '#ffffff' }} />
          <span style={{ color: '#ffffff' }}>Live Jharkhand Map • {reports.length} Issues</span>
        </div>
      </div>
    </div>
  );
};

export default RealMap;
