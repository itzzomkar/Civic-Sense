import React, { useEffect, useRef, useState } from 'react';
import { Report } from '@/services/api';
import { MapPin, Navigation, ExternalLink, Satellite, Map, Layers } from 'lucide-react';

interface ReliableMapProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
}

const ReliableMap = ({ reports, onMarkerClick, onUpvoteReport }: ReliableMapProps) => {
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate loading and then show the map
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Much shorter loading time

    return () => clearTimeout(timer);
  }, []);

  // Calculate marker positions based on GPS coordinates
  const getMarkerPosition = (report: Report, index: number) => {
    const lat = report.location?.coordinates?.lat;
    const lng = report.location?.coordinates?.lng;
    
    if (lat && lng) {
      // Jharkhand bounds: lat 21.5-25.6, lng 83.0-87.9
      const JH_LAT_MIN = 21.5, JH_LAT_MAX = 25.6;
      const JH_LNG_MIN = 83.0, JH_LNG_MAX = 87.9;
      
      const x = ((lng - JH_LNG_MIN) / (JH_LNG_MAX - JH_LNG_MIN)) * 80 + 10;
      const y = ((JH_LAT_MAX - lat) / (JH_LAT_MAX - JH_LAT_MIN)) * 70 + 15;
      
      return {
        x: Math.max(10, Math.min(90, x)),
        y: Math.max(15, Math.min(85, y))
      };
    }
    
    // Fallback positions
    const fallbackPositions = [
      { x: 30, y: 30 }, { x: 70, y: 40 }, { x: 50, y: 60 },
      { x: 25, y: 70 }, { x: 75, y: 25 }, { x: 45, y: 45 }
    ];
    return fallbackPositions[index % fallbackPositions.length];
  };

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

  return (
    <div className="h-full w-full relative rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
      {/* Statistics Panel - Using solid styling */}
      <div 
        className="absolute top-4 left-4 z-50" 
        style={{ 
          backgroundColor: '#ffffff',
          border: '2px solid #e5e7eb',
          borderRadius: '8px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          fontFamily: 'system-ui',
          minWidth: '200px'
        }}
      >
        <div style={{ 
          fontSize: '14px', 
          fontWeight: 'bold', 
          marginBottom: '12px', 
          color: '#1d4ed8',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Navigation style={{ width: '16px', height: '16px', color: '#1d4ed8' }} />
          Jharkhand Live Map
        </div>
        <div style={{ fontSize: '13px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '6px',
            color: '#374151'
          }}>
            <span>Total Issues:</span>
            <span style={{ fontWeight: 'bold', color: '#1d4ed8' }}>{reports.length}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '6px',
            color: '#374151'
          }}>
            <span>Resolved:</span>
            <span style={{ fontWeight: 'bold', color: '#16a34a' }}>
              {reports.filter(r => r.status === 'resolved').length}
            </span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            color: '#374151'
          }}>
            <span>Active:</span>
            <span style={{ fontWeight: 'bold', color: '#dc2626' }}>
              {reports.filter(r => r.status !== 'resolved').length}
            </span>
          </div>
        </div>
      </div>

      {/* Map Type Controls */}
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setMapType('streets')}
          style={{
            backgroundColor: mapType === 'streets' ? '#1d4ed8' : '#ffffff',
            color: mapType === 'streets' ? '#ffffff' : '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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
            backgroundColor: mapType === 'satellite' ? '#1d4ed8' : '#ffffff',
            color: mapType === 'satellite' ? '#ffffff' : '#374151',
            border: '2px solid #e5e7eb',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
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

      {/* Interactive Map Background */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: mapType === 'satellite' ? '#2d5a27' : '#a7c5eb',
          backgroundImage: mapType === 'satellite' 
            ? `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
               radial-gradient(circle at 80% 20%, rgba(255, 206, 84, 0.2) 0%, transparent 50%),
               radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)`
            : `linear-gradient(45deg, #e3f2fd 25%, transparent 25%), 
               linear-gradient(-45deg, #e3f2fd 25%, transparent 25%),
               linear-gradient(45deg, transparent 75%, #e3f2fd 75%),
               linear-gradient(-45deg, transparent 75%, #e3f2fd 75%)`,
          backgroundSize: mapType === 'satellite' ? '100% 100%' : '30px 30px',
          backgroundPosition: mapType === 'satellite' ? '0 0' : '0 0, 0 15px, 15px -15px, -15px 0px'
        }}
      >
        {/* Map Features */}
        <div className="absolute inset-0">
          {/* Roads */}
          <div className="absolute top-1/4 left-0 right-0 h-2 bg-gray-700 opacity-60"></div>
          <div className="absolute top-3/4 left-0 right-0 h-2 bg-gray-700 opacity-60"></div>
          <div className="absolute left-1/3 top-0 bottom-0 w-2 bg-gray-700 opacity-60"></div>
          <div className="absolute left-2/3 top-0 bottom-0 w-2 bg-gray-700 opacity-60"></div>
          
          {/* Water bodies */}
          <div className="absolute top-12 right-12 w-24 h-16 rounded-xl bg-blue-600 opacity-70"></div>
          <div className="absolute bottom-16 left-16 w-32 h-8 rounded-xl bg-blue-600 opacity-70"></div>
          
          {/* Green areas */}
          <div className="absolute top-20 left-20 w-16 h-16 rounded-xl bg-green-600 opacity-50"></div>
          <div className="absolute bottom-24 right-24 w-12 h-12 rounded-xl bg-green-600 opacity-50"></div>
        </div>
        
        {/* Report Markers */}
        <div className="absolute inset-0 p-8">
          {reports.map((report, index) => {
            const position = getMarkerPosition(report, index);
            const reportId = report._id || report.id || `report-${index}`;
            
            return (
              <div
                key={reportId}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                onClick={() => {
                  setSelectedReport(selectedReport?.id === reportId ? null : report);
                  onMarkerClick?.(report);
                }}
              >
                {/* Marker Pin */}
                <div 
                  className="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold cursor-pointer transform hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: report.status === 'resolved' ? '#10b981' :
                                   report.status === 'in-progress' ? '#3b82f6' : '#ef4444',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                  }}
                >
                  {index + 1}
                </div>
                
                {/* Hover Popup */}
                <div 
                  className="absolute bottom-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none"
                  style={{ minWidth: '200px' }}
                >
                  <div 
                    className="rounded-lg shadow-2xl p-3 border-2 border-white"
                    style={{ backgroundColor: '#ffffff' }}
                  >
                    <div className="text-sm font-bold mb-2" style={{ color: '#1f2937' }}>
                      {report.title}
                    </div>
                    <div className="text-xs mb-2" style={{ color: '#6b7280' }}>
                      {report.category} • {report.location?.address || 'Jharkhand'}
                    </div>
                    <div className="flex items-center justify-between">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-bold text-white"
                        style={{
                          backgroundColor: report.status === 'resolved' ? '#10b981' :
                                         report.status === 'in-progress' ? '#3b82f6' : '#ef4444'
                        }}
                      >
                        {report.status.replace('-', ' ').toUpperCase()}
                      </span>
                      <span className="text-xs" style={{ color: '#6b7280' }}>
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

      {/* Map Info Bar */}
      <div 
        className="absolute bottom-4 left-4 z-50"
        style={{
          backgroundColor: '#1d4ed8',
          color: '#ffffff',
          borderRadius: '6px',
          padding: '8px 12px',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <Layers style={{ width: '12px', height: '12px' }} />
        <span>Interactive Map • Click Markers • {reports.length} GPS Locations</span>
      </div>

      {/* External Link Button */}
      <div className="absolute bottom-4 right-4 z-50">
        <button
          onClick={() => {
            const url = `https://www.google.com/maps/@23.3441,85.3096,8z`;
            window.open(url, '_blank');
          }}
          style={{
            backgroundColor: '#ffffff',
            color: '#1d4ed8',
            border: '2px solid #1d4ed8',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
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

      {/* Selected Report Details */}
      {selectedReport && (
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60"
          style={{
            backgroundColor: '#ffffff',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            maxWidth: '400px',
            width: '90%'
          }}
        >
          <button
            onClick={() => setSelectedReport(null)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ×
          </button>
          
          <h3 style={{ 
            margin: '0 0 12px 0', 
            color: '#1f2937', 
            fontSize: '18px',
            fontWeight: 'bold' 
          }}>
            {selectedReport.title}
          </h3>
          
          <p style={{ 
            margin: '0 0 12px 0', 
            color: '#6b7280', 
            fontSize: '14px',
            lineHeight: '1.5' 
          }}>
            {selectedReport.description}
          </p>
          
          <div style={{ marginBottom: '12px' }}>
            <span style={{
              backgroundColor: '#e5e7eb',
              color: '#374151',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              marginRight: '8px'
            }}>
              {selectedReport.category}
            </span>
            <span style={{
              backgroundColor: selectedReport.status === 'resolved' ? '#10b981' :
                             selectedReport.status === 'in-progress' ? '#3b82f6' : '#ef4444',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '12px',
              fontSize: '12px'
            }}>
              {selectedReport.status.replace('-', ' ').toUpperCase()}
            </span>
          </div>
          
          <div style={{ 
            color: '#6b7280', 
            fontSize: '12px',
            marginBottom: '16px'
          }}>
            📍 {selectedReport.location?.address || 'Jharkhand'}
          </div>
          
          <div style={{ 
            display: 'flex', 
            gap: '8px',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            <span>👍 {selectedReport.upvotes?.length || 0} upvotes</span>
            <span>💬 {selectedReport.comments?.length || 0} comments</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReliableMap;