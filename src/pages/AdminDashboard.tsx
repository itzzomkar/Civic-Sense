import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, Users, FileText, TrendingUp, 
  Clock, CheckCircle, 
  QrCode, Coins
} from 'lucide-react';
import SmartRoutingDashboard from '@/components/SmartRoutingDashboard';
import EnvironmentalDashboard from '@/components/EnvironmentalDashboard';
import QRCodeGenerator from '@/components/QRCodeGenerator';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    totalReports: 267,
    activeUsers: 1542,
    pendingIssues: 34,
    resolvedToday: 12,
    qrLocations: 5
  });


  // Mock leaderboard data
  const leaderboard = [
    { userId: '001', rank: 1, score: 2850, stats: { reports: 45, resolved: 38 }, badge: { name: 'Civic Champion' } },
    { userId: '002', rank: 2, score: 2340, stats: { reports: 32, resolved: 28 }, badge: { name: 'Active Reporter' } },
    { userId: '003', rank: 3, score: 1920, stats: { reports: 28, resolved: 22 }, badge: { name: 'Community Helper' } },
    { userId: '004', rank: 4, score: 1650, stats: { reports: 23, resolved: 18 }, badge: { name: 'Civic Volunteer' } },
    { userId: '005', rank: 5, score: 1320, stats: { reports: 19, resolved: 14 }, badge: { name: 'Newcomer' } }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            Urban Guardians Admin
          </h1>
          <p className="text-muted-foreground mt-2">Civic Issue Management Dashboard</p>
        </div>


        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Reports</p>
                  <p className="text-2xl font-bold">{dashboardData.totalReports}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Users</p>
                  <p className="text-2xl font-bold">{dashboardData.activeUsers}</p>
                </div>
                <Users className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">Pending</p>
                  <p className="text-2xl font-bold">{dashboardData.pendingIssues}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Resolved Today</p>
                  <p className="text-2xl font-bold">{dashboardData.resolvedToday}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>



          <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm">QR Locations</p>
                  <p className="text-2xl font-bold">{dashboardData.qrLocations}</p>
                </div>
                <QrCode className="w-8 h-8 text-indigo-200" />
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="smart-routing">🛣️ Smart Routing</TabsTrigger>
            <TabsTrigger value="environmental">🌱 Environmental</TabsTrigger>
            <TabsTrigger value="qr-tools">🔲 QR Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Resolution Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Water & Utilities</span>
                        <span>89%</span>
                      </div>
                      <Progress value={89} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Road Maintenance</span>
                        <span>76%</span>
                      </div>
                      <Progress value={76} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Waste Management</span>
                        <span>92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Traffic Issues</span>
                        <span>85%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5" />
                    Top Civic Champions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div key={entry.userId} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-3">
                          <Badge variant={index === 0 ? 'default' : 'secondary'}>
                            #{entry.rank}
                          </Badge>
                          <div>
                            <div className="font-medium">User {entry.userId}</div>
                            <div className="text-sm text-muted-foreground">
                              {entry.stats.reports} reports • {entry.stats.resolved} resolved
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{Math.round(entry.score)} pts</div>
                          <div className="text-xs text-muted-foreground">{entry.badge?.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

          </TabsContent>


          <TabsContent value="smart-routing">
            <SmartRoutingDashboard />
          </TabsContent>

          <TabsContent value="environmental">
            <EnvironmentalDashboard />
          </TabsContent>


          <TabsContent value="qr-tools">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <QRCodeGenerator />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;