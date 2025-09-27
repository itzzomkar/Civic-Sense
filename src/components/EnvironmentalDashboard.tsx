import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf } from 'lucide-react';

const EnvironmentalDashboard = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            Environmental Impact Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Track environmental metrics, carbon emissions, green initiatives, and sustainability goals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4" />
                <span className="font-medium">Carbon Emissions</span>
              </div>
              <div className="text-2xl font-bold text-red-600">118.5k</div>
              <p className="text-xs text-muted-foreground">tonnes CO2/year (target: 62.5k)</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Recycling Rate</span>
              </div>
              <div className="text-2xl font-bold text-green-600">52%</div>
              <p className="text-xs text-muted-foreground">target: 75%</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium">Green Cover</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">23%</div>
              <p className="text-xs text-muted-foreground">target: 35%</p>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Active Green Initiatives</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Urban Forest Expansion 2025</span>
                  <p className="text-sm text-muted-foreground">Plant 50,000 native trees - 35% complete</p>
                </div>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Solar Rooftops Program</span>
                  <p className="text-sm text-muted-foreground">Install solar panels - 30% complete</p>
                </div>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <span className="font-medium">Zero Waste Districts</span>
                  <p className="text-sm text-muted-foreground">Pilot program - 45% complete</p>
                </div>
                <span className="text-green-600 font-medium">Active</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentalDashboard;