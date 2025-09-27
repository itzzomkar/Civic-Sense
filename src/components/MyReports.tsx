import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Calendar, 
  MapPin, 
  Eye,
  MessageCircle,
  Award,
  TrendingUp,
  LogIn
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, Report } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import ChatInterface from "@/components/ChatInterface";

const MyReports = () => {
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [chatReportId, setChatReportId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserReports = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const reports = await apiService.getUserReports(user.id);
        setUserReports(reports);
      } catch (error) {
        toast({
          title: "Failed to load reports",
          description: "Unable to fetch your reports. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserReports();
  }, [user, toast]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-warning text-warning-foreground";
      case "in-progress": return "bg-primary text-primary-foreground";
      case "resolved": return "bg-success text-success-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4" />;
      case "in-progress": return <AlertCircle className="w-4 h-4" />;
      case "resolved": return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case "pending": return 25;
      case "in-progress": return 65;
      case "resolved": return 100;
      default: return 0;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate user stats
  const totalReports = userReports.length;
  const resolvedReports = userReports.filter(r => r.status === "resolved").length;
  const inProgressReports = userReports.filter(r => r.status === "in-progress").length;
  const pendingReports = userReports.filter(r => r.status === "pending").length;
  const userPoints = resolvedReports * 50 + inProgressReports * 20 + pendingReports * 10;

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="shadow-soft">
          <CardContent className="text-center py-12">
            <LogIn className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-6">
              Please sign in to your account to view your civic issue reports.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/login')} variant="default">
                Sign In
              </Button>
              <Button onClick={() => navigate('/signup')} variant="outline">
                Create Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold civic-gradient bg-clip-text text-transparent mb-2">
          My Reports
        </h1>
        <p className="text-muted-foreground">
          Track the status of your civic issue reports
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reports</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{totalReports}</p>
                )}
              </div>
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-success">{resolvedReports}</p>
                )}
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-primary">{inProgressReports}</p>
                )}
              </div>
              <AlertCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Civic Points</p>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold text-accent">{userPoints}</p>
                )}
              </div>
              <Award className="w-8 h-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="shadow-soft">
                <CardHeader>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-6 w-3/4" />
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : userReports.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't submitted any civic issue reports. Start making a difference in your community!
              </p>
              <Button onClick={() => window.location.href = '/?view=report'} variant="default">
                Report Your First Issue
              </Button>
            </CardContent>
          </Card>
        ) : (
          userReports.map((report) => (
          <Card key={report.id} className="shadow-soft hover:shadow-strong transition-civic">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{report.category}</Badge>
                    <Badge className={getStatusColor(report.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(report.status)}
                        <span className="capitalize">{report.status.replace("-", " ")}</span>
                      </div>
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mb-2">{report.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {report.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Submitted {formatDate(report.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{getProgressValue(report.status)}%</span>
                </div>
                <Progress value={getProgressValue(report.status)} className="h-2" />
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-1">Issue Description</h4>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </div>

              {/* Department Response */}
              {report.status !== 'pending' && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <h4 className="font-medium mb-1 text-sm">Status Update</h4>
                  <p className="text-sm text-muted-foreground">
                    {report.status === 'in-progress' 
                      ? 'Your report has been reviewed and assigned to the relevant department for resolution.' 
                      : 'This issue has been resolved. Thank you for reporting it!'}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Submitted</p>
                  <p className="font-medium">{formatDate(report.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Update</p>
                  <p className="font-medium">{formatDate(report.updatedAt)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t">
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-1" />
                  View Details
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setChatReportId(report.id)}>
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Open Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
        )}
      </div>

      {/* Achievement Section */}
      <Card className="mt-8 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            Community Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-semibold">Community Helper</h3>
              <p className="text-sm text-muted-foreground">Resolved {resolvedReports} issues</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold">Active Citizen</h3>
              <p className="text-sm text-muted-foreground">{userPoints} civic points earned</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-8 h-8 text-accent" />
              </div>
              <h3 className="font-semibold">Top Reporter</h3>
              <p className="text-sm text-muted-foreground">Rank #12 this month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    {/* Chat Dialog */}
      <Dialog open={!!chatReportId} onOpenChange={(open) => !open && setChatReportId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Report Discussion</DialogTitle>
          </DialogHeader>
          {chatReportId && (
            <ChatInterface reportId={chatReportId} onClose={() => setChatReportId(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyReports;
