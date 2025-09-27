import { useEffect, useRef, useState } from 'react';
import { Report } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Map } from 'lucide-react';

// Declare Leaflet as global to avoid import issues
declare global {
  interface Window {
    L: any;
  }
}

interface FallbackMapProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
}

const FallbackMap = ({ reports, onMarkerClick, onUpvoteReport }: FallbackMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useStaticMap, setUseStaticMap] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        console.log('Initializing fallback map...');
        
        if (!mapContainer.current) {
          throw new Error('Map container not found');
        }

        // Load Leaflet dynamically
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';

        document.head.appendChild(link);
        document.head.appendChild(script);

        script.onload = () => {
          if (!isMounted) return;

          try {
            const L = (window as any).L;
            if (!L) {
              throw new Error('Leaflet failed to load');
            }

            console.log('Creating Leaflet map instance...');
            
            // Create map
            const map = L.map(mapContainer.current).setView([19.0760, 72.8777], 11);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 18,
            }).addTo(map);

            // Add markers for reports
            reports.forEach((report) => {
              const lat = report.location.coordinates?.lat;
              const lng = report.location.coordinates?.lng;
              
              if (lat && lng) {
                const marker = L.marker([lat, lng]).addTo(map);
                
                const popupContent = `
                  <div style="max-width: 250px;">
                    <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${report.title}</h3>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${report.category}</p>
                    <p style="margin: 0 0 8px 0; font-size: 11px; color: #888;">${report.location.address}</p>
                    <div style="margin-top: 8px;">
                      <span style="padding: 2px 6px; border-radius: 3px; font-size: 10px; background: ${
                        report.status === 'resolved' ? '#dcfce7; color: #166534' :
                        report.status === 'in-progress' ? '#dbeafe; color: #1d4ed8' :
                        report.status === 'acknowledged' ? '#fef3c7; color: #d97706' :
                        '#f3f4f6; color: #374151'
                      };">${report.status}</span>
                    </div>
                  </div>
                `;
                
                marker.bindPopup(popupContent);
                
                if (onMarkerClick) {
                  marker.on('click', () => onMarkerClick(report));
                }
              }
            });

            // Fit bounds to show all markers
            if (reports.length > 0) {
              const validReports = reports.filter(r => r.location.coordinates?.lat && r.location.coordinates?.lng);
              if (validReports.length > 0) {
                const bounds = L.latLngBounds(
                  validReports.map(r => [r.location.coordinates!.lat, r.location.coordinates!.lng])
                );
                map.fitBounds(bounds, { padding: [20, 20] });
              }
            }

            console.log('Map initialized successfully!');
            setMapInstance(map);
            setIsLoading(false);
          } catch (mapError) {
            console.error('Map creation error:', mapError);
            if (isMounted) {
              setError(`Map creation failed: ${mapError}`);
              setIsLoading(false);
            }
          }
        };

        script.onerror = () => {
          if (isMounted) {
            console.error('Failed to load Leaflet script');
            setError('Failed to load map library. Using static map instead.');
            setUseStaticMap(true);
            setIsLoading(false);
          }
        };

      } catch (initError) {
        console.error('Map initialization error:', initError);
        if (isMounted) {
          setError(`Failed to initialize map: ${initError}`);
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      isMounted = false;
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {
          console.warn('Error cleaning up map:', e);
        }
      }
    };
  }, [reports.length]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Loading Interactive Map</h3>
          <p className="text-gray-600 mb-2">Initializing map with {reports.length} civic issues...</p>
          <p className="text-sm text-gray-500">🗺️ Smart India Hackathon 2025</p>
        </div>
      </div>
    );
  }

  if (error || useStaticMap) {
    // Static map fallback using Google Static Maps
    const markers = reports.slice(0, 5).map(report => 
      `${report.location.coordinates?.lat},${report.location.coordinates?.lng}`
    ).join('|');
    
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=19.0760,72.8777&zoom=11&size=800x600&markers=color:red|${markers}&key=AIzaSyBt9QhZj4_2_YQh_j-8v-5J7Zj9mJ5Z7X0`;

    return (
      <div className="h-full w-full flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Interactive Map Unavailable</h3>
            <p className="text-muted-foreground mb-4">
              {error || 'Unable to load interactive map components'}
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="text-sm">
                <strong>📊 Found Reports:</strong> {reports.length}
              </div>
              <div className="text-xs text-gray-500 space-y-1">
                {reports.slice(0, 3).map(report => (
                  <div key={report.id || report._id}>
                    • {report.title} ({report.status})
                  </div>
                ))}
                {reports.length > 3 && <div>... and {reports.length - 3} more</div>}
              </div>
            </div>
            
            <div className="space-y-2">
              <Button onClick={() => window.location.reload()} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Interactive Map
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setUseStaticMap(true)}
                className="w-full"
              >
                <Map className="w-4 h-4 mr-2" />
                Switch to List View
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Map Statistics Overlay */}
      <div className="absolute top-4 left-4 z-[1000]">
        <Card className="shadow-lg">
          <CardContent className="p-3">
            <div className="text-sm font-semibold mb-2">🗺️ Map View</div>
            <div className="space-y-1 text-xs">
              <div>Total Issues: <span className="font-bold text-blue-600">{reports.length}</span></div>
              <div>Resolved: <span className="font-bold text-green-600">
                {reports.filter(r => r.status === 'resolved').length}
              </span></div>
              <div>In Progress: <span className="font-bold text-blue-600">
                {reports.filter(r => r.status === 'in-progress').length}
              </span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="h-full w-full rounded-lg"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default FallbackMap;