import { useEffect, useRef, useState } from 'react';
import { Report } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Map, MapPin, Navigation } from 'lucide-react';

interface SimpleInlineMapProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
}

const SimpleInlineMap = ({ reports, onMarkerClick, onUpvoteReport }: SimpleInlineMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet library
  useEffect(() => {
    const loadLeaflet = async () => {
      if ((window as any).L) {
        console.log('✅ Leaflet already available');
        setLeafletReady(true);
        return;
      }

      try {
        console.log('📦 Loading Leaflet CSS...');
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          cssLink.crossOrigin = '';
          document.head.appendChild(cssLink);
        }

        console.log('📦 Loading Leaflet JavaScript...');
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        
        script.onload = () => {
          console.log('✅ Leaflet loaded successfully!');
          setLeafletReady(true);
        };

        script.onerror = (e) => {
          console.error('❌ Failed to load Leaflet:', e);
          setError('Failed to load map library');
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        console.error('❌ Error loading Leaflet:', err);
        setError('Error loading map library');
        setIsLoading(false);
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map when Leaflet is ready
  useEffect(() => {
    if (!leafletReady || !mapContainer.current) {
      return;
    }

    const initMap = () => {
      try {
        console.log('🗺️ Initializing map...');
        
        // Clean up existing map
        if (mapInstance.current) {
          console.log('🧹 Cleaning up existing map');
          mapInstance.current.remove();
          mapInstance.current = null;
        }

        const container = mapContainer.current;
        if (!container) {
          throw new Error('Map container not found');
        }

        // Clear container
        container.innerHTML = '';
        
        const L = (window as any).L;
        if (!L) {
          throw new Error('Leaflet library not loaded');
        }

        console.log('🎯 Creating map instance...');
        
        // Create map centered on Mumbai
        const map = L.map(container, {
          center: [19.0760, 72.8777],
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true
        });

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18
        }).addTo(map);

        console.log(`📍 Adding ${reports.length} markers...`);

        // Add markers for reports
        const markers: any[] = [];
        reports.forEach((report) => {
          const lat = report.location?.coordinates?.lat;
          const lng = report.location?.coordinates?.lng;
          
          if (lat && lng && typeof lat === 'number' && typeof lng === 'number') {
            const marker = L.marker([lat, lng]);
            
            const popupContent = `
              <div style="max-width: 200px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">${report.title}</h4>
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${report.category}</p>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #888;">
                  📍 ${report.location?.address || 'Location not specified'}
                </p>
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span style="background: ${report.status === 'resolved' ? '#10b981' : report.status === 'in-progress' ? '#3b82f6' : '#f59e0b'}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 10px;">
                    ${report.status.toUpperCase().replace('-', ' ')}
                  </span>
                  <span style="font-size: 11px; color: #666;">👍 ${report.upvotes?.length || 0}</span>
                </div>
              </div>
            `;
            
            marker.bindPopup(popupContent);
            marker.addTo(map);
            markers.push(marker);
            
            if (onMarkerClick) {
              marker.on('click', () => onMarkerClick(report));
            }
          }
        });

        // Fit bounds if we have markers
        if (markers.length > 0) {
          const group = new L.featureGroup(markers);
          map.fitBounds(group.getBounds(), { 
            padding: [20, 20],
            maxZoom: 15 
          });
        }

        mapInstance.current = map;
        console.log('✅ Map initialized successfully!');
        setError(null);
        setIsLoading(false);
        
      } catch (initError) {
        console.error('❌ Map initialization error:', initError);
        setError(`Map failed to load: ${initError}`);
        setIsLoading(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initMap, 100);
    return () => clearTimeout(timer);
    
  }, [leafletReady, reports.length]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        console.log('🧹 Cleaning up map on unmount');
        try {
          mapInstance.current.remove();
        } catch (e) {
          console.warn('Warning during cleanup:', e);
        }
      }
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
          <p className="text-sm text-gray-600 mb-2">
            {leafletReady ? 'Initializing map...' : 'Loading map library...'}
          </p>
          <p className="text-xs text-gray-500">🗺️ {reports.length} issues to display</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-red-50 rounded-lg">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Map Unavailable</h3>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <div className="text-sm font-medium mb-2">📊 Reports Available: {reports.length}</div>
              <div className="text-xs text-gray-600 space-y-1">
                {reports.slice(0, 3).map((report, index) => (
                  <div key={report.id || report._id || index} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      report.status === 'resolved' ? 'bg-green-500' :
                      report.status === 'in-progress' ? 'bg-blue-500' : 'bg-yellow-500'
                    }`} />
                    <span className="truncate">{report.title}</span>
                  </div>
                ))}
                {reports.length > 3 && (
                  <div className="text-gray-500">... and {reports.length - 3} more</div>
                )}
              </div>
            </div>
            
            <Button onClick={() => window.location.reload()} size="sm" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Map
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* Statistics overlay */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <Card className="shadow-lg bg-white/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              Live Map
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center gap-3">
                <span>Total:</span>
                <span className="font-bold text-blue-600">{reports.length}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span>Resolved:</span>
                <span className="font-bold text-green-600">
                  {reports.filter(r => r.status === 'resolved').length}
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span>Active:</span>
                <span className="font-bold text-orange-600">
                  {reports.filter(r => r.status !== 'resolved').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="h-full w-full rounded-lg"
        style={{ minHeight: '500px', backgroundColor: '#f1f5f9' }}
        id="map-container"
      />
      
      {/* Info badge */}
      <div className="absolute bottom-4 right-4 z-[1000] pointer-events-none">
        <div className="text-xs bg-black/80 text-white px-3 py-1 rounded-full">
          🗺️ Click markers for details
        </div>
      </div>
    </div>
  );
};

export default SimpleInlineMap;