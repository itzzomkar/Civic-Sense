import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cpu, Wifi, AlertTriangle } from 'lucide-react';

const IoTDashboard = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            IoT Sensor Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Monitor and manage IoT sensors across the city for proactive issue detection and automated reporting.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="w-4 h-4" />
                <span className="font-medium">Online Sensors</span>
              </div>
              <div className="text-2xl font-bold text-green-600">4/6</div>
              <p className="text-xs text-muted-foreground">67% network availability</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Active Alerts</span>
              </div>
              <div className="text-2xl font-bold text-red-600">3</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Avg Battery</span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">61%</div>
              <p className="text-xs text-muted-foreground">Network health</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Recent Sensor Alerts</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Traffic Noise Monitor</span>
                  <p className="text-sm text-muted-foreground">Noise level exceeds threshold (82 dB)</p>
                </div>
                <Badge variant="destructive">Critical</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Air Quality Sensor</span>
                  <p className="text-sm text-muted-foreground">AQI above recommended level (78)</p>
                </div>
                <Badge variant="secondary">Warning</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Traffic Flow Sensor</span>
                  <p className="text-sm text-muted-foreground">Device offline for 25 minutes</p>
                </div>
                <Badge variant="outline">Offline</Badge>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Button size="sm">Configure Sensors</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IoTDashboard;