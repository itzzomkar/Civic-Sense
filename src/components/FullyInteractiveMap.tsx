import { useEffect, useRef, useState } from 'react';
import { Report } from '@/services/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ExternalLink, Satellite, Map, Loader2, Layers } from 'lucide-react';

interface FullyInteractiveMapProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
}

const FullyInteractiveMap = ({ reports, onMarkerClick, onUpvoteReport }: FullyInteractiveMapProps) => {
  // Add stronger CSS styles to fix text visibility issues
  useEffect(() => {
    // Create a style tag to inject custom CSS for map overlays with higher specificity
    const styleEl = document.createElement('style');
    styleEl.id = 'map-overlay-fix-styles';
    styleEl.innerHTML = `
      /* High specificity fix for text visibility in map overlays */
      .map-container .map-overlay-element,
      .map-container .map-overlay-element *,
      .map-container .map-overlay-element span,
      .map-container .map-overlay-element div {
        color: #000000 !important;
        text-shadow: none !important;
        mix-blend-mode: normal !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: inline !important;
      }
      
      .map-container .map-overlay-card {
        background-color: rgba(255, 255, 255, 0.98) !important;
        border: 2px solid white !important;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2) !important;
        backdrop-filter: blur(8px) !important;
      }
      
      .map-container .map-button-text {
        color: #1f2937 !important;
        font-weight: 500 !important;
      }
      
      .map-container .map-info-box,
      .map-container .map-info-box * {
        color: #ffffff !important;
        background-color: rgba(59, 130, 246, 0.95) !important;
      }
      
      .map-container .text-blue-700 {
        color: #1d4ed8 !important;
      }
      
      .map-container .text-gray-600 {
        color: #4b5563 !important;
      }
      
      .map-container .text-blue-600 {
        color: #2563eb !important;
      }
      
      .map-container .text-green-600 {
        color: #16a34a !important;
      }
      
      .map-container .text-orange-600 {
        color: #ea580c !important;
      }
      
      /* Leaflet override */
      .leaflet-container .map-overlay-element {
        pointer-events: auto !important;
        z-index: 1000 !important;
      }
    `;
    
    // Add the style tag to head if it doesn't exist already
    if (!document.getElementById('map-overlay-fix-styles')) {
      document.head.appendChild(styleEl);
    }
    
    return () => {
      // Clean up style tag on component unmount
      const existingStyle = document.getElementById('map-overlay-fix-styles');
      if (existingStyle) {
        document.head.removeChild(existingStyle);
      }
    };
  }, []);
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const loadLeafletAndInitMap = async () => {
      try {
        console.log('🗺️ Loading Leaflet for fully interactive map...');
        
        // Load Leaflet CSS if not already loaded
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const cssLink = document.createElement('link');
          cssLink.rel = 'stylesheet';
          cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          cssLink.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          cssLink.crossOrigin = '';
          document.head.appendChild(cssLink);
        }

        // Load Leaflet JS if not already loaded
        if (!(window as any).L) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => {
              console.log('✅ Leaflet loaded successfully');
              setLeafletReady(true);
              resolve();
            };
            script.onerror = () => reject(new Error('Failed to load Leaflet'));
            document.head.appendChild(script);
          });
        } else {
          setLeafletReady(true);
        }

        if (!isMounted || !mapContainer.current) return;

        const L = (window as any).L;
        if (!L) throw new Error('Leaflet not available');

        // Clear any existing map
        if (mapInstance.current) {
          mapInstance.current.remove();
        }
        mapContainer.current.innerHTML = '';

        // Jharkhand center (Ranchi)
        const jharkhandCenter: [number, number] = [23.3441, 85.3096];

        console.log('🎯 Creating interactive map instance...');
        
        // Create the map
        const map = L.map(mapContainer.current, {
          center: jharkhandCenter,
          zoom: 8,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true,
          touchZoom: true,
          boxZoom: true,
          keyboard: true
        });

        mapInstance.current = map;

        // Add tile layer based on mapType
        const addTileLayer = (type: 'streets' | 'satellite') => {
          // Remove existing layers
          map.eachLayer((layer: any) => {
            if (layer instanceof L.TileLayer) {
              map.removeLayer(layer);
            }
          });

          if (type === 'streets') {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxZoom: 19,
              minZoom: 3
            }).addTo(map);
          } else {
            // Satellite view using Esri World Imagery
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
              maxZoom: 19,
              minZoom: 3
            }).addTo(map);
          }
        };

        addTileLayer(mapType);

        console.log(`📍 Adding ${reports.length} interactive markers...`);

        // Add markers for reports
        const markers: any[] = [];
        reports.forEach((report, index) => {
          const lat = report.location?.coordinates?.lat;
          const lng = report.location?.coordinates?.lng;
          
          if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            try {
              // Create custom marker icon based on status
              const getMarkerColor = (status: string) => {
                switch (status) {
                  case 'resolved': return '#10b981'; // green
                  case 'in-progress': return '#3b82f6'; // blue
                  default: return '#ef4444'; // red
                }
              };

              const markerIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `
                  <div style="
                    background-color: ${getMarkerColor(report.status)};
                    width: 30px;
                    height: 30px;
                    border-radius: 50% 50% 50% 0;
                    border: 3px solid white;
                    box-shadow: 0 3px 10px rgba(0,0,0,0.4);
                    transform: rotate(-45deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                  ">
                    <span style="
                      transform: rotate(45deg);
                      color: white;
                      font-weight: bold;
                      font-size: 12px;
                    ">${index + 1}</span>
                  </div>
                `,
                iconSize: [30, 30],
                iconAnchor: [15, 30],
                popupAnchor: [0, -30]
              });

              const marker = L.marker([lat, lng], { icon: markerIcon });
              
              // Create popup content
              const popupContent = `
                <div style="max-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
                  <div style="border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 8px;">
                    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${report.title}</h3>
                  </div>
                  <div style="margin: 6px 0;">
                    <span style="
                      padding: 3px 8px; 
                      border-radius: 12px; 
                      font-size: 11px; 
                      font-weight: 500; 
                      background: #3b82f6; 
                      color: white;
                      margin-right: 6px;
                    ">${report.category}</span>
                    <span style="
                      padding: 3px 8px; 
                      border-radius: 12px; 
                      font-size: 11px; 
                      font-weight: 500; 
                      background: ${getMarkerColor(report.status)}; 
                      color: white;
                    ">${report.status.replace('-', ' ').toUpperCase()}</span>
                  </div>
                  <p style="margin: 8px 0; font-size: 13px; color: #4b5563; line-height: 1.4;">
                    ${report.description?.substring(0, 150)}${report.description?.length > 150 ? '...' : ''}
                  </p>
                  <div style="margin: 6px 0; font-size: 12px; color: #6b7280;">
                    📍 ${report.location?.address || 'Jharkhand'}
                  </div>
                  <div style="margin-top: 10px; display: flex; align-items: center; justify-content: between; gap: 12px;">
                    <span style="font-size: 12px; color: #6b7280;">
                      👍 ${report.upvotes?.length || 0} upvotes
                    </span>
                    <span style="font-size: 12px; color: #6b7280;">
                      💬 ${report.comments?.length || 0} comments
                    </span>
                  </div>
                </div>
              `;
              
              marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-leaflet-popup'
              });
              
              marker.addTo(map);
              markers.push(marker);
              
              // Add click handler
              marker.on('click', () => {
                console.log(`🖱️ Interactive marker clicked: ${report.title}`);
                if (onMarkerClick) onMarkerClick(report);
              });
              
            } catch (markerError) {
              console.warn(`⚠️ Failed to create marker for report ${index}:`, markerError);
            }
          }
        });

        // Fit map to show all markers
        if (markers.length > 0) {
          console.log(`🎯 Fitting map bounds for ${markers.length} markers...`);
          try {
            const group = new L.featureGroup(markers);
            map.fitBounds(group.getBounds(), { 
              padding: [20, 20],
              maxZoom: 12
            });
          } catch (boundsError) {
            console.warn('⚠️ Could not fit bounds, using default view');
            map.setView(jharkhandCenter, 8);
          }
        } else {
          map.setView(jharkhandCenter, 8);
        }

        // Handle map type changes
        const handleMapTypeChange = (newType: 'streets' | 'satellite') => {
          if (map && isMounted) {
            addTileLayer(newType);
          }
        };

        // Store the handler for cleanup
        (map as any)._handleMapTypeChange = handleMapTypeChange;

        console.log('✅ Interactive map initialization complete!');
        setError(null);
        setIsLoading(false);

      } catch (initError) {
        console.error('❌ Interactive map failed to initialize:', initError);
        if (isMounted) {
          setError(`Failed to load interactive map: ${initError}`);
          setIsLoading(false);
        }
      }
    };

    loadLeafletAndInitMap();

    return () => {
      console.log('🧹 Cleaning up interactive map...');
      isMounted = false;
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
          mapInstance.current = null;
        } catch (e) {
          console.warn('⚠️ Error cleaning up map:', e);
        }
      }
    };
  }, [reports.length]); // Re-initialize when reports change

  // Handle map type changes
  useEffect(() => {
    if (mapInstance.current && (mapInstance.current as any)._handleMapTypeChange) {
      (mapInstance.current as any)._handleMapTypeChange(mapType);
    }
  }, [mapType]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
        <div className="text-center p-8 max-w-sm">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <MapPin className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Interactive Map</h3>
          <p className="text-gray-600 text-sm mb-2">Setting up fully interactive map with {reports.length} civic issues...</p>
          <p className="text-xs text-gray-500">🗺️ Pan, zoom, and click markers</p>
          {leafletReady && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <Loader2 className="w-4 h-4 animate-spin text-green-600" />
              <span className="text-xs text-green-600">Map library ready</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-red-50 rounded-lg">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <MapPin className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-gray-800">Interactive Map Error</h3>
            <p className="text-gray-600 mb-4 text-sm">{error}</p>
            <Button onClick={() => window.location.reload()} size="sm">
              Retry Map Loading
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative rounded-lg overflow-hidden map-container" style={{ minHeight: '500px' }}>
      {/* Statistics Panel */}
      <div 
        className="absolute top-4 left-4 z-[1000] map-overlay-element" 
        style={{ 
          pointerEvents: 'auto',
          zIndex: 1000
        }}
      >
        <Card 
          className="shadow-xl bg-white/95 backdrop-blur-sm border-2 border-white map-overlay-card"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: '2px solid white',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}
        >
          <CardContent className="p-3">
            <div 
              className="text-sm font-bold mb-2 flex items-center gap-2 text-blue-700"
              style={{ color: '#1d4ed8', fontWeight: 'bold' }}
            >
              <Navigation className="w-4 h-4 text-blue-600" />
              <span style={{ color: '#1d4ed8' }}>Jharkhand Live Map</span>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between items-center gap-3">
                <span className="text-gray-600" style={{ color: '#4b5563' }}>Total Issues:</span>
                <span className="font-bold text-blue-600" style={{ color: '#2563eb', fontWeight: 'bold' }}>{reports.length}</span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-gray-600" style={{ color: '#4b5563' }}>Resolved:</span>
                <span className="font-bold text-green-600" style={{ color: '#16a34a', fontWeight: 'bold' }}>
                  {reports.filter(r => r.status === 'resolved').length}
                </span>
              </div>
              <div className="flex justify-between items-center gap-3">
                <span className="text-gray-600" style={{ color: '#4b5563' }}>Active:</span>
                <span className="font-bold text-orange-600" style={{ color: '#ea580c', fontWeight: 'bold' }}>
                  {reports.filter(r => r.status !== 'resolved').length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Type Controls */}
      <div 
        className="absolute top-4 right-4 z-[1000] flex gap-2 map-overlay-element"
        style={{ pointerEvents: 'auto', zIndex: 1000 }}
      >
        <Button
          variant={mapType === 'streets' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMapType('streets')}
          className="shadow-lg bg-white/95 backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#1f2937',
            fontWeight: '500'
          }}
        >
          <Map className="w-4 h-4 mr-1" />
          <span className="map-button-text" style={{ color: '#1f2937' }}>Streets</span>
        </Button>
        <Button
          variant={mapType === 'satellite' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMapType('satellite')}
          className="shadow-lg bg-white/95 backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#1f2937',
            fontWeight: '500'
          }}
        >
          <Satellite className="w-4 h-4 mr-1" />
          <span className="map-button-text" style={{ color: '#1f2937' }}>Satellite</span>
        </Button>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="h-full w-full rounded-lg"
        style={{ 
          minHeight: '500px',
          backgroundColor: '#f8fafc' 
        }}
      />
      
      {/* Action Buttons */}
      <div 
        className="absolute bottom-4 right-4 z-[1000] map-overlay-element"
        style={{ pointerEvents: 'auto', zIndex: 1000 }}
      >
        <Button
          variant="outline"
          size="sm"
          className="shadow-xl bg-white/95 backdrop-blur-sm border-blue-600"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#2563eb',
            color: '#2563eb'
          }}
          onClick={() => {
            const jharkhandCenter = '23.3441,85.3096';
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
          }}
        >
          <ExternalLink className="w-4 h-4 mr-1 text-blue-600" />
          <span className="text-blue-600 map-button-text" style={{ color: '#2563eb' }}>Full Screen</span>
        </Button>
      </div>

      {/* Map Info */}
      <div 
        className="absolute bottom-4 left-4 z-[1000] map-overlay-element"
        style={{ pointerEvents: 'auto', zIndex: 1000 }}
      >
        <div 
          className="px-3 py-2 rounded-lg text-xs bg-blue-600/90 backdrop-blur-sm text-white shadow-xl map-info-box"
          style={{
            backgroundColor: 'rgba(59, 130, 246, 0.95)',
            color: '#ffffff',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
          }}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3 h-3" style={{ color: '#ffffff' }} />
            <span style={{ color: '#ffffff' }}>Interactive Map • Pan & Zoom • {reports.length} GPS Locations</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullyInteractiveMap;