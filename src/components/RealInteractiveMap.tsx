import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Report } from '@/services/api';

// Fix for Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RealInteractiveMapProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
  onReady?: () => void; // fired once the map is fully initialized and tiles can load
}

// Create custom colored markers based on status
const createCustomIcon = (status: string) => {
  const color = status === 'resolved' ? '#10b981' : 
                status === 'in-progress' ? '#3b82f6' : '#ef4444';
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 25px;
        height: 25px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,0.4);
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 12px;
        ">📍</div>
      </div>
    `,
    iconSize: [25, 25],
    iconAnchor: [12, 25],
    popupAnchor: [0, -25]
  });
};

// Component to fit bounds to all markers
const FitBounds = ({ reports }: { reports: Report[] }) => {
  const map = useMap();

  useEffect(() => {
    if (reports.length > 0) {
      const validCoords = reports
        .map(r => {
          const lat = r.location?.coordinates?.lat;
          const lng = r.location?.coordinates?.lng;
          return lat && lng ? [lat, lng] as [number, number] : null;
        })
        .filter(coord => coord !== null) as [number, number][];

      if (validCoords.length > 0) {
        if (validCoords.length === 1) {
          // For a single marker, fitBounds can zoom out too much; set a sensible zoom
          map.setView(validCoords[0], 13);
        } else {
          const bounds = L.latLngBounds(validCoords);
          map.fitBounds(bounds, { padding: [20, 20] });
        }
      } else {
        // Default to Jharkhand center if no valid coordinates
        map.setView([23.3441, 85.3096], 8);
      }
    } else {
      map.setView([23.3441, 85.3096], 8);
    }
  }, [map, reports]);

  return null;
};

const RealInteractiveMap = ({ reports, onMarkerClick, onUpvoteReport, onReady }: RealInteractiveMapProps) => {
  const [mapReady, setMapReady] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    try {
      // Add custom CSS for better marker visibility
      const style = document.createElement('style');
      style.id = 'leaflet-custom-styles';
      style.textContent = `
        .custom-marker {
          background: none !important;
          border: none !important;
        }
        .leaflet-popup-content-wrapper {
          background: white;
          color: #333;
          font-family: system-ui, -apple-system, sans-serif;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        .leaflet-popup-tip {
          background: white;
        }
        .leaflet-container {
          font-family: system-ui, -apple-system, sans-serif;
          height: 100% !important;
        }
      `;
      
      // Remove existing styles first
      const existing = document.getElementById('leaflet-custom-styles');
      if (existing) {
        document.head.removeChild(existing);
      }
      
      document.head.appendChild(style);
      
      // Add a small delay to ensure Leaflet is ready
      const timer = setTimeout(() => {
        setMapReady(true);
        try { onReady?.(); } catch {}
        console.log('RealInteractiveMap is ready with', reports.length, 'reports');
      }, 100);

      return () => {
        clearTimeout(timer);
        const styleEl = document.getElementById('leaflet-custom-styles');
        if (styleEl) {
          document.head.removeChild(styleEl);
        }
      };
    } catch (error) {
      console.error('Error initializing RealInteractiveMap:', error);
      setHasError(true);
    }
  }, [reports.length]);

  if (hasError) {
    console.error('RealInteractiveMap has an error, should fallback');
    // This will trigger the error boundary
    throw new Error('RealInteractiveMap failed to initialize');
  }

  if (!mapReady) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg">
        <div className="text-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Real Interactive Map</h3>
          <p className="text-gray-600 text-sm">Initializing map with {reports.length} civic issues...</p>
          <p className="text-xs text-gray-500 mt-2">This may take a few seconds on first load...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
      {/* Statistics Panel */}
      <div 
        className="absolute top-4 left-4 z-[1000]"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid white',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          padding: '12px',
          fontFamily: 'system-ui',
          backdropFilter: 'blur(8px)'
        }}
      >
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          marginBottom: '8px', 
          color: '#1d4ed8',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          🗺️ Live Jharkhand Map
        </div>
        <div style={{ fontSize: '12px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '4px',
            color: '#374151'
          }}>
            <span>Total Issues:</span>
            <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>{reports.length}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '4px',
            color: '#374151'
          }}>
            <span>Resolved:</span>
            <span style={{ fontWeight: 'bold', color: '#10b981' }}>
              {reports.filter(r => r.status === 'resolved').length}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            color: '#374151'
          }}>
            <span>Pending:</span>
            <span style={{ fontWeight: 'bold', color: '#ef4444' }}>
              {reports.filter(r => r.status !== 'resolved').length}
            </span>
          </div>
        </div>
      </div>


      {/* External Link */}
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
          🔗 Open in Google Maps
        </button>
      </div>

      {/* REAL INTERACTIVE MAP */}
      <MapContainer
        whenReady={() => { try { onReady?.(); } catch {} }}
        center={[23.3441, 85.3096]} // Jharkhand center (Ranchi)
        zoom={8}
        minZoom={3}
        maxZoom={19}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
        className="rounded-lg"
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
        boxZoom={true}
        keyboard={true}
      >
        {/* OpenStreetMap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />
        
        {/* Auto-fit bounds to show all markers */}
        <FitBounds reports={reports} />
        
        {/* Report Markers */}
        {reports.map((report, index) => {
          const lat = report.location?.coordinates?.lat;
          const lng = report.location?.coordinates?.lng;
          const reportId = report._id || report.id || `report-${index}`;
          
          // Only show markers with valid coordinates
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            return null;
          }

          return (
            <Marker
              key={reportId}
              position={[lat, lng]}
              icon={createCustomIcon(report.status)}
              eventHandlers={{
                click: () => {
                  console.log(`🖱️ Real map marker clicked: ${report.title}`);
                  onMarkerClick?.(report);
                }
              }}
            >
              <Popup maxWidth={320} className="custom-popup">
                <div style={{ 
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  maxWidth: '280px',
                  padding: '8px'
                }}>
                  {/* Title */}
                  <h3 style={{ 
                    margin: '0 0 8px 0', 
                    color: '#1f2937', 
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '1.3'
                  }}>
                    {report.title}
                  </h3>
                  
                  {/* Tags */}
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{
                      backgroundColor: '#e5e7eb',
                      color: '#374151',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      marginRight: '6px',
                      fontWeight: '500'
                    }}>
                      {report.category}
                    </span>
                    <span style={{
                      backgroundColor: report.status === 'resolved' ? '#10b981' :
                                     report.status === 'in-progress' ? '#3b82f6' : '#ef4444',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '500'
                    }}>
                      {report.status.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Description */}
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    color: '#6b7280', 
                    fontSize: '13px',
                    lineHeight: '1.4'
                  }}>
                    {report.description?.substring(0, 120)}{report.description?.length > 120 ? '...' : ''}
                  </p>
                  
                  {/* Location */}
                  <div style={{ 
                    color: '#6b7280', 
                    fontSize: '12px',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    📍 {report.location?.address || 'Jharkhand'}
                  </div>
                  
                  {/* Stats */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '12px',
                    color: '#6b7280',
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: '8px'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      👍 {report.upvotes?.length || 0} upvotes
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      💬 {report.comments?.length || 0} comments
                    </span>
                  </div>
                  
                  {/* Action Button */}
                  <button
                    onClick={() => onUpvoteReport?.(reportId)}
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      marginTop: '8px',
                      width: '100%'
                    }}
                  >
                    👍 Support This Issue
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RealInteractiveMap;