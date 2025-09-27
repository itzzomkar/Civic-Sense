import React, { useEffect, useRef, useState } from 'react';
import { Report } from '@/services/api';
import { MapPin, Layers, ExternalLink, Satellite, Map } from 'lucide-react';

interface SimpleInteractiveMapProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
}

const SimpleInteractiveMap = ({ reports, onMarkerClick, onUpvoteReport }: SimpleInteractiveMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        console.log('🗺️ Initializing simple interactive map...');
        
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const css = document.createElement('link');
          css.rel = 'stylesheet';
          css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          css.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
          css.crossOrigin = '';
          document.head.appendChild(css);
        }

        // Load Leaflet JS
        if (!(window as any).L) {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
          script.crossOrigin = '';
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = reject;
            document.head.appendChild(script);
          });
        }

        if (!isMounted || !mapContainer.current) return;

        const L = (window as any).L;
        if (!L) throw new Error('Leaflet failed to load');

        // Clean up any existing map
        if (mapInstance.current) {
          mapInstance.current.remove();
        }
        mapContainer.current.innerHTML = '';

        console.log('🎯 Creating Leaflet map instance...');
        
        // Create interactive map
        const map = L.map(mapContainer.current, {
          center: [23.3441, 85.3096], // Jharkhand center
          zoom: 8,
          zoomControl: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          dragging: true,
          touchZoom: true
        });

        mapInstance.current = map;

        // Add tile layer
        const updateTileLayer = () => {
          // Remove existing tile layers
          map.eachLayer((layer: any) => {
            if (layer instanceof L.TileLayer) {
              map.removeLayer(layer);
            }
          });

          if (mapType === 'streets') {
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap contributors',
              maxZoom: 19
            }).addTo(map);
          } else {
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: '© Esri',
              maxZoom: 19
            }).addTo(map);
          }
        };

        updateTileLayer();

        console.log(`📍 Adding ${reports.length} markers to map...`);

        // Add markers
        const markers: any[] = [];
        reports.forEach((report, index) => {
          const lat = report.location?.coordinates?.lat;
          const lng = report.location?.coordinates?.lng;
          
          if (lat && lng) {
            const color = report.status === 'resolved' ? '#10b981' : 
                         report.status === 'in-progress' ? '#3b82f6' : '#ef4444';

            const marker = L.marker([lat, lng]).addTo(map);
            
            const popupContent = `
              <div style="font-family: system-ui; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${report.title}</h3>
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${report.description?.substring(0, 100)}...</p>
                <div style="color: #4b5563; font-size: 12px;">📍 ${report.location?.address || 'Jharkhand'}</div>
                <div style="margin-top: 8px;">
                  <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                    ${report.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            `;
            
            marker.bindPopup(popupContent);
            markers.push(marker);

            marker.on('click', () => {
              console.log(`🖱️ Marker clicked: ${report.title}`);
              if (onMarkerClick) onMarkerClick(report);
            });
          }
        });

        // Fit bounds to markers
        if (markers.length > 0) {
          const group = new L.featureGroup(markers);
          map.fitBounds(group.getBounds(), { padding: [20, 20] });
        }

        // Store tile layer updater
        (map as any)._updateTileLayer = updateTileLayer;

        console.log('✅ Simple interactive map ready!');
        setError(null);
        setIsLoading(false);

      } catch (initError) {
        console.error('❌ Map initialization failed:', initError);
        if (isMounted) {
          setError(`Failed to load map: ${initError}`);
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      console.log('🧹 Cleaning up map...');
      isMounted = false;
      if (mapInstance.current) {
        try {
          mapInstance.current.remove();
          mapInstance.current = null;
        } catch (e) {
          console.warn('Cleanup error:', e);
        }
      }
    };
  }, [reports.length]);

  // Handle map type changes
  useEffect(() => {
    if (mapInstance.current && (mapInstance.current as any)._updateTileLayer) {
      (mapInstance.current as any)._updateTileLayer();
    }
  }, [mapType]);

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Interactive Map</h3>
          <p className="text-gray-600 text-sm">Setting up map with {reports.length} civic issues...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-red-50 rounded-lg">
        <div className="text-center p-6">
          <MapPin className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Map Error</h3>
          <p className="text-gray-600 mb-4 text-sm">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
      {/* Statistics Panel - Using CSS background to ensure visibility */}
      <div 
        className="absolute top-4 left-4 z-[1000]" 
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid white',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          padding: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#000000',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#1d4ed8' }}>
          🗺️ Jharkhand Live Map
        </div>
        <div style={{ fontSize: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#4b5563' }}>Total Issues:</span>
            <span style={{ fontWeight: 'bold', color: '#2563eb' }}>{reports.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#4b5563' }}>Resolved:</span>
            <span style={{ fontWeight: 'bold', color: '#16a34a' }}>
              {reports.filter(r => r.status === 'resolved').length}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#4b5563' }}>Active:</span>
            <span style={{ fontWeight: 'bold', color: '#ea580c' }}>
              {reports.filter(r => r.status !== 'resolved').length}
            </span>
          </div>
        </div>
      </div>

      {/* Map Type Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        <button
          onClick={() => setMapType('streets')}
          style={{
            backgroundColor: mapType === 'streets' ? '#2563eb' : 'rgba(255, 255, 255, 0.95)',
            color: mapType === 'streets' ? '#ffffff' : '#1f2937',
            border: '2px solid white',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Map style={{ width: '16px', height: '16px' }} />
          Streets
        </button>
        <button
          onClick={() => setMapType('satellite')}
          style={{
            backgroundColor: mapType === 'satellite' ? '#2563eb' : 'rgba(255, 255, 255, 0.95)',
            color: mapType === 'satellite' ? '#ffffff' : '#1f2937',
            border: '2px solid white',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Satellite style={{ width: '16px', height: '16px' }} />
          Satellite
        </button>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="h-full w-full"
        style={{ 
          minHeight: '500px',
          backgroundColor: '#f1f5f9'
        }}
      />
      
      {/* Map Info Bar */}
      <div 
        className="absolute bottom-4 left-4 z-[1000]"
        style={{
          backgroundColor: 'rgba(59, 130, 246, 0.9)',
          color: '#ffffff',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <Layers style={{ width: '12px', height: '12px', color: '#ffffff' }} />
        <span style={{ color: '#ffffff' }}>Interactive Map • Pan & Zoom • {reports.length} GPS Locations</span>
      </div>

      {/* External Link Button */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <button
          onClick={() => {
            const url = `https://www.google.com/maps/@23.3441,85.3096,8z`;
            window.open(url, '_blank');
          }}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#2563eb',
            border: '2px solid #2563eb',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <ExternalLink style={{ width: '16px', height: '16px' }} />
          Full Screen
        </button>
      </div>
    </div>
  );
};

export default SimpleInteractiveMap;