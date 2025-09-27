import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Route, Brain } from 'lucide-react';

const SmartRoutingDashboard = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Smart Routing & Priority Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            AI-powered department assignment, workload balancing, and intelligent routing statistics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4" />
                <span className="font-medium">Assignment Confidence</span>
              </div>
              <div className="text-2xl font-bold text-green-600">91.3%</div>
              <p className="text-xs text-muted-foreground">Average confidence score</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Route className="w-4 h-4" />
                <span className="font-medium">Total Assignments</span>
              </div>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Avg Workload</span>
              </div>
              <div className="text-2xl font-bold">62%</div>
              <p className="text-xs text-muted-foreground">Balanced distribution</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Department Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Public Works Department</span>
                  <p className="text-sm text-muted-foreground">23 active issues - 87% completion rate</p>
                </div>
                <span className="text-green-600 font-medium">Available</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Water & Utilities Board</span>
                  <p className="text-sm text-muted-foreground">18 active issues - 92% completion rate</p>
                </div>
                <span className="text-yellow-600 font-medium">Busy</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Traffic Management</span>
                  <p className="text-sm text-muted-foreground">12 active issues - 85% completion rate</p>
                </div>
                <span className="text-green-600 font-medium">Available</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Button size="sm">Configure Routing Rules</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartRoutingDashboard;