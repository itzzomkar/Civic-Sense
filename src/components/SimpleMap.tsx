import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Report } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SimpleMapProps {
  reports: Report[];
}

const SimpleMap = ({ reports }: SimpleMapProps) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  console.log('SimpleMap rendered with', reports.length, 'reports');

  useEffect(() => {
    console.log('SimpleMap mounted');
    
    // Check if Leaflet is properly loaded
    if (typeof L === 'undefined') {
      setError('Leaflet library not loaded');
      return;
    }
    
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Jharkhand center (Ranchi)
  const center: [number, number] = [23.3441, 85.3096];

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Map Loading Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Interactive Map...</p>
          <p className="text-sm text-gray-500 mt-2">Found {reports.length} reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full" style={{ minHeight: '520px' }}>
      <MapContainer
        center={center}
        zoom={7}
        style={{ height: '100%', width: '100%', minHeight: '520px' }}
        className="rounded-lg"
        whenCreated={(mapInstance) => {
          // Force map to resize after creation and after tab transition
          setTimeout(() => {
            try { mapInstance.invalidateSize(); } catch {}
          }, 200);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {reports.map((report) => {
          const reportId = report._id || report.id;
          const lat = report.location.coordinates?.lat;
          const lng = report.location.coordinates?.lng;
          
          console.log('Rendering marker for report:', reportId, 'at', lat, lng);
          
          if (!lat || !lng || !reportId) {
            console.log('Skipping report due to missing data:', { reportId, lat, lng });
            return null;
          }
          
          return (
            <Marker key={reportId} position={[lat, lng]}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{report.title}</h3>
                  <p className="text-sm text-gray-600">{report.category}</p>
                  <p className="text-xs text-gray-500">{report.location.address}</p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${{
                      'resolved': 'bg-green-100 text-green-800',
                      'in-progress': 'bg-blue-100 text-blue-800',
                      'pending': 'bg-yellow-100 text-yellow-800',
                    }[report.status] || 'bg-gray-100 text-gray-800'}`}>
                      {report.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default SimpleMap;