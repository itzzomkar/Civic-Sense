import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  ThumbsUp, 
  MessageCircle, 
  Clock, 
  Search, 
  Filter,
  Map,
  List,
  CheckCircle,
  AlertCircle,
  Calendar,
  Loader2,
  Shield,
  Edit3
} from "lucide-react";
import { apiService, Report } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import RealInteractiveMap from "@/components/RealInteractiveMap";
import BasicMap from "@/components/BasicMap";
import MapErrorBoundary from "@/components/MapErrorBoundary";

// MapWithFallback Component
interface MapWithFallbackProps {
  reports: Report[];
  onMarkerClick?: (report: Report) => void;
  onUpvoteReport?: (reportId: string) => void;
  onMapError?: () => void;
  onMapLoad?: () => void;
}

const MapWithFallback = ({ reports, onMarkerClick, onUpvoteReport, onMapError, onMapLoad }: MapWithFallbackProps) => {
  const [useBasicMap, setUseBasicMap] = useState(false);
  const [mapInitialized, setMapInitialized] = useState(false);

  useEffect(() => {
    // Try to load the real map first
    const timer = setTimeout(() => {
      if (!mapInitialized) {
        console.log('Real map taking too long, switching to basic map');
        setUseBasicMap(true);
        onMapError?.();
      }
    }, 8000); // Give real map 8 seconds to load

    return () => clearTimeout(timer);
  }, [mapInitialized, onMapError]);

  const handleMapLoad = () => {
    setMapInitialized(true);
    onMapLoad?.();
  };

  const handleMapError = () => {
    console.log('Map error, switching to basic map');
    setUseBasicMap(true);
    onMapError?.();
  };

  if (useBasicMap) {
    return (
      <BasicMap 
        reports={reports}
        onMarkerClick={onMarkerClick}
        onUpvoteReport={onUpvoteReport}
      />
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapErrorBoundary 
        onError={handleMapError}
        fallback={
          <BasicMap 
            reports={reports}
            onMarkerClick={onMarkerClick}
            onUpvoteReport={onUpvoteReport}
          />
        }
      >
        <RealInteractiveMap 
          reports={reports}
          onMarkerClick={(report) => {
            onMarkerClick?.(report);
          }}
          onUpvoteReport={onUpvoteReport}
          onReady={handleMapLoad}
        />
      </MapErrorBoundary>
      
      {/* Fallback trigger button */}
      <div className="absolute top-2 left-2 z-20">
        <button
          onClick={handleMapError}
          className="text-xs bg-white/80 hover:bg-white text-blue-600 hover:text-blue-800 px-2 py-1 rounded border border-blue-200 shadow-sm transition-all"
          title="Switch to basic map if interactive map has issues"
        >
          Use Basic Map
        </button>
      </div>
    </div>
  );
};

const CommunityFeed = () => {
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upvotedReports, setUpvotedReports] = useState<Set<string>>(new Set());
  const [processingVotes, setProcessingVotes] = useState<Set<string>>(new Set());
  const [updatingStatus, setUpdatingStatus] = useState<Set<string>>(new Set());
  const [mapError, setMapError] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Check if current user is admin
  const isAdmin = user?.role === 'admin';

  // Load reports on component mount
  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        console.log('Loading community reports...');
        
        const allReports = await apiService.getAllReports();
        console.log(`Loaded ${allReports.length} reports successfully`);
        
        // Ensure reports is always an array, even if API returns undefined/null
        setReports(Array.isArray(allReports) ? allReports : []);
        
        // Initialize upvoted reports based on current user
        const currentUser = apiService.getCurrentUser();
        if (currentUser) {
          const upvoted = new Set<string>();
          const validReports = Array.isArray(allReports) ? allReports : [];
          
          validReports.forEach(report => {
            if (report && (report._id || report.id)) {
              const hasUpvoted = report.upvotes?.some(upvote => 
                upvote.userId === currentUser._id || upvote.userId === currentUser.id
              );
              if (hasUpvoted) {
                upvoted.add(report._id || report.id || '');
              }
            }
          });
          setUpvotedReports(upvoted);
        }
      } catch (error) {
        console.error('Failed to load reports:', error);
        
        // Set empty array on error to prevent crashes
        setReports([]);
        
        toast({
          title: "Failed to load reports",
          description: error instanceof Error ? error.message : "Unable to fetch community reports. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [toast]);

  // Add error handling for map components
  useEffect(() => {
    const timer = setTimeout(() => {
      if (viewMode === 'map' && !mapError) {
        // If the map view has been active for 10 seconds without issues, assume it's working
        console.log('Map appears to be working correctly');
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [viewMode, mapError]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-warning";
      case "in-progress": return "bg-primary";
      case "resolved": return "bg-success";
      default: return "bg-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-3 h-3" />;
      case "in-progress": return <AlertCircle className="w-3 h-3" />;
      case "resolved": return <CheckCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const handleUpvote = async (reportId: string) => {
    if (!reportId || processingVotes.has(reportId)) return;
    
    try {
      setProcessingVotes(prev => new Set(prev).add(reportId));
      console.log(`Upvoting report: ${reportId}`);
      
      const updatedReport = await apiService.upvoteReport(reportId);
      
      if (updatedReport) {
        // Update the report in the list safely
        setReports(prev => Array.isArray(prev) ? prev.map(report => 
          (report._id === reportId || report.id === reportId) ? updatedReport : report
        ) : []);
        
        // Check if user has upvoted
        const currentUser = apiService.getCurrentUser();
        const hasUpvoted = updatedReport.upvotes?.some(upvote => 
          upvote.userId === currentUser?._id || upvote.userId === currentUser?.id
        );
        
        if (hasUpvoted) {
          setUpvotedReports(prev => new Set(prev).add(reportId));
          toast({
            title: "Thanks for your support!",
            description: "Your vote helps prioritize community issues.",
          });
        } else {
          setUpvotedReports(prev => {
            const newSet = new Set(prev);
            newSet.delete(reportId);
            return newSet;
          });
          toast({
            title: "Vote removed",
            description: "Your support has been removed from this report.",
          });
        }
      }
    } catch (error) {
      console.error('Upvote error:', error);
      toast({
        title: "Failed to vote",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setProcessingVotes(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };
  
  // Function to update report status (admin only)
  const updateReportStatus = async (reportId: string, newStatus: string) => {
    if (!reportId || !isAdmin || updatingStatus.has(reportId)) return;
    
    try {
      setUpdatingStatus(prev => new Set(prev).add(reportId));
      console.log(`Updating report ${reportId} status to: ${newStatus}`);
      console.log('Current user:', user);
      console.log('Is admin:', isAdmin);
      console.log('User role:', user?.role);
      const token = localStorage.getItem('civic_auth_token'); // Use correct token key
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');
      
      const response = await fetch(`http://localhost:5000/api/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          reason: `Status updated to ${newStatus} by admin`
        }),
      });
      
      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      
      if (response.ok) {
        // Update the report in the list
        const updatedReport = result.data || result;
        
        // Create updated report with new status for immediate UI update
        const reportUpdate = {
          ...reports.find(r => (r._id === reportId || r.id === reportId)),
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
        
        setReports(prev => Array.isArray(prev) ? prev.map(report => 
          (report._id === reportId || report.id === reportId) ? reportUpdate : report
        ) : []);
        
        toast({
          title: "Status Updated",
          description: `Report status changed to ${newStatus.replace('-', ' ')}`,
        });
      } else {
        throw new Error(result.error || result.message || `Server responded with status ${response.status}`);
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast({
        title: "Failed to update status",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Less than an hour ago";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
  };

  const filteredReports = Array.isArray(reports) ? reports.filter(report => {
    try {
      if (!report) return false;
      
      const matchesStatus = filterStatus === "all" || report.status === filterStatus;
      const locationStr = typeof report.location === 'string' ? report.location : report.location?.address || '';
      const matchesSearch = (report.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           locationStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (report.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (report.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    } catch (error) {
      console.warn('Error filtering report:', error, report);
      return false;
    }
  }) : [];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold civic-gradient bg-clip-text text-transparent mb-2">
          Community Issues
        </h1>
        <p className="text-muted-foreground">
          Browse and support civic issues reported by your community
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6 shadow-soft">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search issues or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Toggle */}
      <Tabs value={viewMode} onValueChange={(value) => {
        console.log(`Switching from ${viewMode} to ${value}`);
        setViewMode(value as "list" | "map");
        setMapError(false); // Reset map error when switching
        setMapLoaded(false); // Reset map loaded state
      }}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            List View ({filteredReports.length} items)
          </TabsTrigger>
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map className="w-4 h-4" />
            Map View {mapLoaded && !mapError ? '✓' : mapError ? '⚠' : '⏳'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="shadow-soft">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-5 w-20" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">
                  {reports.length === 0 
                    ? "No community reports yet. Be the first to report an issue!" 
                    : "No issues found matching your filters."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredReports.map((report, index) => {
              if (!report) return null;
              
              const reportId = report._id || report.id || `report-${index}`;
              const locationStr = typeof report.location === 'string' ? report.location : report.location?.address || 'Location not specified';
              const upvoteCount = report.upvotes?.length || 0;
              const commentCount = report.comments?.length || 0;
              const isProcessingVote = processingVotes.has(reportId);
              const isUpvoted = upvotedReports.has(reportId);
              const isUpdatingStatus = updatingStatus.has(reportId);
              
              return (
                <Card key={reportId} className="shadow-soft hover:shadow-strong transition-civic">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{report.category}</Badge>
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`} />
                            <span className="text-xs text-muted-foreground capitalize">
                              {report.status.replace("-", " ")}
                            </span>
                          </div>
                          {report.priority && (
                            <Badge variant="secondary" className="text-xs">
                              {report.priority}
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold mb-1">{report.title}</h3>
                        <p className="text-muted-foreground text-sm mb-2 line-clamp-2">{report.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[200px]">{locationStr}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatTimeAgo(report.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`text-muted-foreground hover:text-primary ${
                            isUpvoted ? 'text-primary bg-primary/10' : ''
                          }`}
                          onClick={() => handleUpvote(reportId)}
                          disabled={isProcessingVote}
                        >
                          {isProcessingVote ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <ThumbsUp className="w-4 h-4 mr-1" />
                          )}
                          {isUpvoted ? 'Supported' : 'Support'} ({upvoteCount})
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Comments ({commentCount})
                        </Button>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {getStatusIcon(report.status)}
                        <span className="capitalize">{report.status.replace("-", " ")}</span>
                      </div>
                    </div>
                    
                    {/* Admin Status Update Controls */}
                    {isAdmin && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-primary">
                            <Shield className="w-4 h-4" />
                            <span>Admin Controls</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {['pending', 'acknowledged', 'in-progress', 'resolved'].map((status) => (
                            <Button
                              key={status}
                              size="sm"
                              variant={report.status === status ? "default" : "outline"}
                              className="text-xs h-7 px-2"
                              onClick={() => updateReportStatus(reportId, status)}
                              disabled={isUpdatingStatus || report.status === status}
                            >
                              {isUpdatingStatus ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <Edit3 className="w-3 h-3 mr-1" />
                              )}
                              {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="map">
          <Card className="h-[600px] shadow-soft">
            <CardContent className="h-full p-4">
              {isLoading ? (
                <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="relative mb-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                      <MapPin className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Loading Map</h3>
                    <p className="text-sm text-gray-600 mb-2">Preparing interactive map view...</p>
                    <p className="text-xs text-gray-500">🗺️ {filteredReports.length} issues ready to display</p>
                  </div>
                </div>
              ) : filteredReports.length === 0 ? (
                <div className="h-full bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Issues to Display</h3>
                    <p className="text-muted-foreground">
                      {reports.length === 0 
                        ? "No community reports yet. Be the first to report an issue!" 
                        : "No issues found matching your filters."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-full relative">
                  <MapWithFallback 
                    reports={filteredReports}
                    onMarkerClick={(report) => {
                      console.log('Map marker clicked:', report.title);
                    }}
                    onUpvoteReport={handleUpvote}
                    onMapError={() => setMapError(true)}
                    onMapLoad={() => setMapLoaded(true)}
                  />
                  
                  {/* Success indicator when map loads properly */}
                  {mapLoaded && !mapError && (
                    <div className="absolute top-4 right-4 z-20">
                      <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Interactive Map Active
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityFeed;