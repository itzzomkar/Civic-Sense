import { useEffect, useRef, useState } from 'react';
import { Report } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Map, MapPin, Navigation } from 'lucide-react';

interface InlineMapProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
}

const InlineMap = ({ reports, onMarkerClick, onUpvoteReport }: InlineMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let mapInstance: any = null;

    const initializeMap = async () => {
      try {
        console.log('🗺️ Starting inline map initialization...');
        
        if (!mapContainer.current) {
          throw new Error('Map container not found');
        }

        // Check if Leaflet is already loaded
        if (!(window as any).L) {
          console.log('📦 Loading Leaflet library...');
          
          // Create and append CSS
          if (!document.querySelector('link[href*="leaflet.css"]')) {
            const cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            cssLink.crossOrigin = '';
            document.head.appendChild(cssLink);
          }

          // Load JavaScript
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';
          
          await new Promise((resolve, reject) => {
            script.onload = () => {
              console.log('✅ Leaflet loaded successfully');
              setLeafletLoaded(true);
              resolve(true);
            };
            script.onerror = () => {
              console.error('❌ Failed to load Leaflet');
              reject(new Error('Failed to load Leaflet library'));
            };
            document.head.appendChild(script);
          });
        } else {
          console.log('✅ Leaflet already loaded');
          setLeafletLoaded(true);
        }

        if (!isMounted) return;

        const L = (window as any).L;
        if (!L) {
          throw new Error('Leaflet library not available');
        }

        console.log('🎯 Creating map instance...');
        
        // Clear any existing map
        if (mapContainer.current) {
          mapContainer.current.innerHTML = '';
        }

        // Create map with Jharkhand center (Ranchi) as default
        const defaultCenter: [number, number] = [23.3441, 85.3096];
        mapInstance = L.map(mapContainer.current, {
          center: defaultCenter,
          zoom: 11,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true
        });

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 3
        }).addTo(mapInstance);

        console.log(`📍 Adding ${reports.length} markers to map...`);

        // Add markers for reports
        const markers: any[] = [];
        reports.forEach((report, index) => {
          const lat = report.location?.coordinates?.lat;
          const lng = report.location?.coordinates?.lng;
          
          if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            try {
              const marker = L.marker([lat, lng]);
              
              // Create popup content
              const popupContent = `
                <div style="max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937;">${report.title}</h3>
                  <div style="margin: 4px 0;">
                    <span style="padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; background: #3b82f6; color: white;">${report.category}</span>
                  </div>
                  <p style="margin: 8px 0; font-size: 12px; color: #6b7280; line-height: 1.4;">${report.description?.substring(0, 100)}${report.description?.length > 100 ? '...' : ''}</p>
                  <p style="margin: 4px 0 8px 0; font-size: 11px; color: #9ca3af;">
                    📍 ${report.location?.address || 'Unknown location'}
                  </p>
                  <div style="margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                    <span style="padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 500; background: ${
                      report.status === 'resolved' ? '#dcfce7; color: #166534' :
                      report.status === 'in-progress' ? '#dbeafe; color: #1d4ed8' :
                      report.status === 'acknowledged' ? '#fef3c7; color: #d97706' :
                      '#f3f4f6; color: #374151'
                    };">${report.status.replace('-', ' ').toUpperCase()}</span>
                    <span style="font-size: 11px; color: #9ca3af;">👍 ${report.upvotes?.length || 0}</span>
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup'
              });
              
              marker.addTo(mapInstance);
              markers.push(marker);
              
              // Add click handler
              if (onMarkerClick) {
                marker.on('click', () => {
                  console.log(`🖱️ Marker clicked for: ${report.title}`);
                  onMarkerClick(report);
                });
              }
            } catch (markerError) {
              console.warn(`⚠️ Failed to create marker for report ${index}:`, markerError);
            }
          } else {
            console.warn(`⚠️ Invalid coordinates for report: ${report.title}`, { lat, lng });
          }
        });

        // Fit bounds to show all markers if we have valid ones
        if (markers.length > 0) {
          console.log(`🎯 Fitting bounds for ${markers.length} markers...`);
          try {
            const group = new L.featureGroup(markers);
            mapInstance.fitBounds(group.getBounds(), { 
              padding: [20, 20],
              maxZoom: 15 
            });
          } catch (boundsError) {
            console.warn('⚠️ Failed to fit bounds, using default view:', boundsError);
          }
        } else {
          console.log('📍 No valid markers found, using default Jharkhand center');
        }

        console.log('✅ Map initialization complete!');
        setError(null);
        setIsLoading(false);

      } catch (initError) {
        console.error('❌ Map initialization failed:', initError);
        if (isMounted) {
          setError(`Map initialization failed: ${initError}`);
          setIsLoading(false);
        }
      }
    };

    // Start initialization
    initializeMap();

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up map...');
      isMounted = false;
      if (mapInstance) {
        try {
          mapInstance.remove();
        } catch (e) {
          console.warn('⚠️ Error during map cleanup:', e);
        }
      }
    };
  }, [reports.length]); // Only re-initialize when reports count changes

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
        <div className="text-center p-8 max-w-sm">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <MapPin className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Interactive Map</h3>
          <p className="text-gray-600 text-sm mb-2">Setting up map with {reports.length} civic issue{reports.length !== 1 ? 's' : ''}...</p>
          <p className="text-xs text-gray-500">🗺️ Smart India Hackathon 2025 - Urban Guardians</p>
          {leafletLoaded && (
            <p className="text-xs text-green-600 mt-2">✅ Map library loaded</p>
          )}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-red-50 rounded-lg">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Map Loading Failed</h3>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm font-medium mb-2">📊 Available Reports: {reports.length}</div>
              <div className="text-xs text-gray-600 space-y-1">
                {reports.slice(0, 3).map(report => (
                  <div key={report.id || report._id} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      report.status === 'resolved' ? 'bg-green-500' :
                      report.status === 'in-progress' ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`} />
                    <span>{report.title}</span>
                  </div>
                ))}
                {reports.length > 3 && (
                  <div className="text-gray-500">... and {reports.length - 3} more</div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Map
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state - render the map
  return (
    <div className="relative h-full w-full">
      {/* Map Statistics Overlay */}
      <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
        <Card className="shadow-lg backdrop-blur-sm bg-white/90">
          <CardContent className="p-3">
            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              Map View
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span>Total Issues:</span>
                <span className="font-bold text-blue-600">{reports.length}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Resolved:</span>
                <span className="font-bold text-green-600">
                  {reports.filter(r => r.status === 'resolved').length}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>In Progress:</span>
                <span className="font-bold text-blue-600">
                  {reports.filter(r => r.status === 'in-progress').length}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Pending:</span>
                <span className="font-bold text-yellow-600">
                  {reports.filter(r => r.status === 'pending').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="h-full w-full rounded-lg border-2 border-gray-200"
        style={{ 
          minHeight: '500px',
          backgroundColor: '#f8fafc'
        }}
      />
      
      {/* Bottom info bar */}
      <div className="absolute bottom-4 right-4 z-[1000] pointer-events-none">
        <div className="text-xs bg-black/70 text-white px-3 py-1 rounded-full">
          🗺️ Interactive Map • Click markers for details
        </div>
      </div>
    </div>
  );
};

export default InlineMap;