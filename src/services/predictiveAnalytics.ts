interface Report {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority?: string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  resolvedAt?: string | Date;
  location: any;
  userId: string;
}

interface PredictiveInsight {
  type: 'trend' | 'prediction' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  data?: any;
  impact: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  timeframe?: string;
}

interface ResolutionTimePredictor {
  category: string;
  averageHours: number;
  predictionModel: {
    baseTime: number;
    categoryMultiplier: number;
    priorityMultiplier: number;
    seasonalFactor: number;
  };
}

interface HotspotData {
  location: string;
  coordinates?: { lat: number; lng: number };
  issueCount: number;
  categories: { [category: string]: number };
  trend: 'increasing' | 'stable' | 'decreasing';
  riskScore: number;
  recommendations: string[];
}

export class PredictiveAnalytics {
  private reports: Report[] = [];
  private resolutionPredictors: Map<string, ResolutionTimePredictor> = new Map();

  constructor() {
    this.initializeResolutionPredictors();
  }

  private initializeResolutionPredictors() {
    // Initialize with baseline resolution time predictors
    const predictors = [
      { category: 'Road Maintenance', averageHours: 72, baseTime: 48, categoryMultiplier: 1.5, priorityMultiplier: 1.2, seasonalFactor: 1.1 },
      { category: 'Water & Utilities', averageHours: 24, baseTime: 12, categoryMultiplier: 2.0, priorityMultiplier: 1.8, seasonalFactor: 1.0 },
      { category: 'Lighting', averageHours: 48, baseTime: 24, categoryMultiplier: 1.0, priorityMultiplier: 1.1, seasonalFactor: 0.9 },
      { category: 'Waste Management', averageHours: 12, baseTime: 6, categoryMultiplier: 0.8, priorityMultiplier: 1.0, seasonalFactor: 1.2 },
      { category: 'Traffic', averageHours: 36, baseTime: 18, categoryMultiplier: 1.3, priorityMultiplier: 1.5, seasonalFactor: 1.0 },
      { category: 'Vandalism', averageHours: 96, baseTime: 48, categoryMultiplier: 0.7, priorityMultiplier: 0.9, seasonalFactor: 1.0 },
      { category: 'Infrastructure', averageHours: 120, baseTime: 72, categoryMultiplier: 2.5, priorityMultiplier: 1.3, seasonalFactor: 1.3 },
    ];

    predictors.forEach(predictor => {
      this.resolutionPredictors.set(predictor.category, {
        category: predictor.category,
        averageHours: predictor.averageHours,
        predictionModel: {
          baseTime: predictor.baseTime,
          categoryMultiplier: predictor.categoryMultiplier,
          priorityMultiplier: predictor.priorityMultiplier,
          seasonalFactor: predictor.seasonalFactor
        }
      });
    });
  }

  public updateReportsData(reports: Report[]) {
    this.reports = reports;
    this.updatePredictiveModels();
  }

  private updatePredictiveModels() {
    // Update resolution time predictors based on historical data
    const resolvedReports = this.reports.filter(r => r.status === 'resolved' && r.resolvedAt);
    
    // Group by category and calculate actual resolution times
    const categoryStats = new Map<string, { times: number[], count: number }>();
    
    resolvedReports.forEach(report => {
      const createdTime = new Date(report.createdAt).getTime();
      const resolvedTime = new Date(report.resolvedAt!).getTime();
      const resolutionHours = (resolvedTime - createdTime) / (1000 * 60 * 60);
      
      if (!categoryStats.has(report.category)) {
        categoryStats.set(report.category, { times: [], count: 0 });
      }
      
      const stats = categoryStats.get(report.category)!;
      stats.times.push(resolutionHours);
      stats.count++;
    });

    // Update predictors with real data
    categoryStats.forEach((stats, category) => {
      if (stats.times.length >= 3) { // Need at least 3 data points
        const averageHours = stats.times.reduce((a, b) => a + b, 0) / stats.times.length;
        const predictor = this.resolutionPredictors.get(category);
        
        if (predictor) {
          predictor.averageHours = averageHours;
          // Adjust model parameters based on variance
          const variance = stats.times.reduce((acc, time) => acc + Math.pow(time - averageHours, 2), 0) / stats.times.length;
          const adjustmentFactor = Math.min(variance / (averageHours * averageHours), 0.5);
          predictor.predictionModel.categoryMultiplier *= (1 + adjustmentFactor);
        }
      }
    });
  }

  public predictResolutionTime(report: Partial<Report>): {
    estimatedHours: number;
    estimatedDate: Date;
    confidence: number;
    factors: string[];
  } {
    const predictor = this.resolutionPredictors.get(report.category || 'Other');
    
    if (!predictor) {
      return {
        estimatedHours: 48,
        estimatedDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        confidence: 0.3,
        factors: ['No historical data available']
      };
    }

    let estimatedHours = predictor.predictionModel.baseTime;
    const factors: string[] = [];

    // Category factor
    estimatedHours *= predictor.predictionModel.categoryMultiplier;
    factors.push(`Category: ${report.category} (${predictor.predictionModel.categoryMultiplier.toFixed(1)}x)`);

    // Priority factor
    const priorityMultipliers = { 'low': 0.8, 'medium': 1.0, 'high': 1.3, 'urgent': 1.8 };
    const priorityMultiplier = priorityMultipliers[report.priority as keyof typeof priorityMultipliers] || 1.0;
    estimatedHours *= priorityMultiplier;
    factors.push(`Priority: ${report.priority || 'medium'} (${priorityMultiplier.toFixed(1)}x)`);

    // Seasonal factor (simplified)
    const month = new Date().getMonth();
    const isWinterMonth = month >= 10 || month <= 2;
    const seasonalMultiplier = isWinterMonth ? predictor.predictionModel.seasonalFactor : 1.0;
    estimatedHours *= seasonalMultiplier;
    if (seasonalMultiplier !== 1.0) {
      factors.push(`Season: ${isWinterMonth ? 'Winter' : 'Other'} (${seasonalMultiplier.toFixed(1)}x)`);
    }

    // Current workload factor
    const currentPendingCount = this.reports.filter(r => 
      r.status === 'pending' && r.category === report.category
    ).length;
    const workloadMultiplier = Math.min(1 + (currentPendingCount * 0.1), 2.0);
    estimatedHours *= workloadMultiplier;
    if (workloadMultiplier > 1.1) {
      factors.push(`Current workload: ${currentPendingCount} pending (${workloadMultiplier.toFixed(1)}x)`);
    }

    const estimatedDate = new Date(Date.now() + estimatedHours * 60 * 60 * 1000);
    
    // Calculate confidence based on data availability and variance
    const historicalCount = this.reports.filter(r => r.category === report.category && r.status === 'resolved').length;
    const confidence = Math.min(0.9, 0.3 + (historicalCount * 0.05));

    return {
      estimatedHours: Math.round(estimatedHours),
      estimatedDate,
      confidence,
      factors
    };
  }

  public identifyHotspots(): HotspotData[] {
    // Group reports by location
    const locationStats = new Map<string, {
      issues: Report[];
      categories: Map<string, number>;
      recentCount: number;
    }>();

    // Simple location grouping (in real implementation, you'd use proper geocoding)
    this.reports.forEach(report => {
      const location = typeof report.location === 'string' 
        ? report.location 
        : report.location?.address || 'Unknown Location';
      
      // Extract area/neighborhood from address (simplified)
      const normalizedLocation = this.normalizeLocation(location);
      
      if (!locationStats.has(normalizedLocation)) {
        locationStats.set(normalizedLocation, {
          issues: [],
          categories: new Map(),
          recentCount: 0
        });
      }

      const stats = locationStats.get(normalizedLocation)!;
      stats.issues.push(report);
      
      const categoryCount = stats.categories.get(report.category) || 0;
      stats.categories.set(report.category, categoryCount + 1);
      
      // Count recent issues (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (new Date(report.createdAt) > thirtyDaysAgo) {
        stats.recentCount++;
      }
    });

    // Convert to hotspot data and calculate risk scores
    const hotspots: HotspotData[] = [];
    
    locationStats.forEach((stats, location) => {
      const totalIssues = stats.issues.length;
      if (totalIssues >= 3) { // Only consider locations with 3+ issues
        
        // Calculate trend
        const oldCount = totalIssues - stats.recentCount;
        const trend = stats.recentCount > oldCount * 1.5 ? 'increasing' :
                     stats.recentCount < oldCount * 0.5 ? 'decreasing' : 'stable';

        // Calculate risk score
        let riskScore = Math.min(totalIssues / 10, 1.0); // Base on total issues
        riskScore *= stats.recentCount / totalIssues; // Weight by recent activity
        riskScore *= stats.categories.size; // Multiple categories increase risk
        
        // Category-specific risk multipliers
        const highRiskCategories = ['Water & Utilities', 'Traffic', 'Infrastructure'];
        const hasHighRiskCategory = Array.from(stats.categories.keys())
          .some(cat => highRiskCategories.includes(cat));
        if (hasHighRiskCategory) riskScore *= 1.3;

        // Generate recommendations
        const recommendations = this.generateLocationRecommendations(stats.categories, trend);

        hotspots.push({
          location,
          issueCount: totalIssues,
          categories: Object.fromEntries(stats.categories),
          trend,
          riskScore: Math.min(riskScore * 100, 100), // Scale to 0-100
          recommendations
        });
      }
    });

    // Sort by risk score
    return hotspots.sort((a, b) => b.riskScore - a.riskScore).slice(0, 10);
  }

  private normalizeLocation(location: string): string {
    // Simple location normalization - in real app, use proper geocoding
    const parts = location.split(',');
    if (parts.length >= 2) {
      return parts.slice(-2).join(',').trim(); // Take last 2 parts (area, city)
    }
    return location;
  }

  private generateLocationRecommendations(categories: Map<string, number>, trend: string): string[] {
    const recommendations: string[] = [];
    const sortedCategories = Array.from(categories.entries()).sort((a, b) => b[1] - a[1]);
    
    if (trend === 'increasing') {
      recommendations.push('📈 Escalating issues detected - prioritize immediate assessment');
    }

    sortedCategories.forEach(([category, count]) => {
      if (count >= 3) {
        switch (category) {
          case 'Road Maintenance':
            recommendations.push('🛣️ Consider comprehensive road infrastructure assessment');
            break;
          case 'Water & Utilities':
            recommendations.push('💧 Schedule water infrastructure inspection and maintenance');
            break;
          case 'Lighting':
            recommendations.push('💡 Implement area-wide lighting audit and upgrades');
            break;
          case 'Waste Management':
            recommendations.push('🗑️ Review waste collection schedule and bin capacity');
            break;
          case 'Traffic':
            recommendations.push('🚦 Conduct traffic flow analysis and signal optimization');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('📋 Monitor area for pattern development');
    }

    return recommendations.slice(0, 3); // Limit to top 3 recommendations
  }

  public generateInsights(): PredictiveInsight[] {
    const insights: PredictiveInsight[] = [];

    // Trend Analysis
    const trendInsight = this.analyzeTrends();
    if (trendInsight) insights.push(trendInsight);

    // Workload Prediction
    const workloadInsight = this.predictWorkload();
    if (workloadInsight) insights.push(workloadInsight);

    // Seasonal Pattern Detection
    const seasonalInsight = this.detectSeasonalPatterns();
    if (seasonalInsight) insights.push(seasonalInsight);

    // Department Performance Analysis
    const performanceInsight = this.analyzeDepartmentPerformance();
    if (performanceInsight) insights.push(performanceInsight);

    // Resource Optimization
    const resourceInsight = this.optimizeResourceAllocation();
    if (resourceInsight) insights.push(resourceInsight);

    return insights.sort((a, b) => {
      const impactWeight = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return (impactWeight[b.impact] + b.confidence) - (impactWeight[a.impact] + a.confidence);
    });
  }

  private analyzeTrends(): PredictiveInsight | null {
    if (this.reports.length < 10) return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentCount = this.reports.filter(r => new Date(r.createdAt) > thirtyDaysAgo).length;
    const previousCount = this.reports.filter(r => {
      const date = new Date(r.createdAt);
      return date > sixtyDaysAgo && date <= thirtyDaysAgo;
    }).length;

    if (previousCount === 0) return null;

    const changePercent = ((recentCount - previousCount) / previousCount) * 100;
    const isIncreasing = changePercent > 15;
    const isDecreasing = changePercent < -15;

    if (isIncreasing || isDecreasing) {
      return {
        type: 'trend',
        title: `${isIncreasing ? '📈 Increasing' : '📉 Decreasing'} Report Trend`,
        description: `Reports have ${isIncreasing ? 'increased' : 'decreased'} by ${Math.abs(changePercent).toFixed(1)}% in the last 30 days`,
        confidence: Math.min(Math.abs(changePercent) / 50, 0.9),
        impact: Math.abs(changePercent) > 50 ? 'high' : Math.abs(changePercent) > 25 ? 'medium' : 'low',
        actionable: true,
        timeframe: '30 days',
        data: { changePercent, recentCount, previousCount }
      };
    }

    return null;
  }

  private predictWorkload(): PredictiveInsight | null {
    const pendingReports = this.reports.filter(r => r.status === 'pending' || r.status === 'acknowledged');
    const averageResolutionHours = this.calculateAverageResolutionTime();

    if (pendingReports.length === 0) return null;

    const estimatedBacklogHours = pendingReports.reduce((total, report) => {
      const prediction = this.predictResolutionTime(report);
      return total + prediction.estimatedHours;
    }, 0);

    const workingHoursPerDay = 8;
    const estimatedDaysToComplete = estimatedBacklogHours / workingHoursPerDay;

    let impact: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (estimatedDaysToComplete > 30) impact = 'critical';
    else if (estimatedDaysToComplete > 14) impact = 'high';
    else if (estimatedDaysToComplete > 7) impact = 'medium';

    return {
      type: 'prediction',
      title: '⏳ Workload Prediction',
      description: `Current backlog estimated to take ${Math.ceil(estimatedDaysToComplete)} days to complete with current resources`,
      confidence: 0.7,
      impact,
      actionable: true,
      timeframe: `${Math.ceil(estimatedDaysToComplete)} days`,
      data: { 
        backlogHours: estimatedBacklogHours, 
        pendingCount: pendingReports.length,
        averageResolutionHours 
      }
    };
  }

  private detectSeasonalPatterns(): PredictiveInsight | null {
    // Group reports by month
    const monthlyData = new Map<number, number>();
    
    this.reports.forEach(report => {
      const month = new Date(report.createdAt).getMonth();
      monthlyData.set(month, (monthlyData.get(month) || 0) + 1);
    });

    if (monthlyData.size < 6) return null; // Need at least 6 months of data

    // Find peak month
    let peakMonth = 0;
    let peakCount = 0;
    monthlyData.forEach((count, month) => {
      if (count > peakCount) {
        peakMonth = month;
        peakCount = count;
      }
    });

    const currentMonth = new Date().getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Check if we're approaching peak season
    const monthsUntilPeak = (peakMonth - currentMonth + 12) % 12;
    
    if (monthsUntilPeak <= 2) {
      return {
        type: 'prediction',
        title: '🌡️ Seasonal Pattern Alert',
        description: `Historically, ${monthNames[peakMonth]} shows ${Math.round((peakCount / (this.reports.length / 12)) * 100 - 100)}% higher report volume`,
        confidence: 0.8,
        impact: 'medium',
        actionable: true,
        timeframe: `${monthsUntilPeak} months`,
        data: { peakMonth: monthNames[peakMonth], peakCount, currentMonth: monthNames[currentMonth] }
      };
    }

    return null;
  }

  private analyzeDepartmentPerformance(): PredictiveInsight | null {
    const departmentStats = new Map<string, {
      total: number;
      resolved: number;
      avgResolutionTime: number;
    }>();

    // Calculate department performance
    this.reports.forEach(report => {
      const dept = this.getCategoryDepartment(report.category);
      if (!departmentStats.has(dept)) {
        departmentStats.set(dept, { total: 0, resolved: 0, avgResolutionTime: 0 });
      }
      
      const stats = departmentStats.get(dept)!;
      stats.total++;
      
      if (report.status === 'resolved' && report.resolvedAt) {
        stats.resolved++;
        const resolutionHours = (new Date(report.resolvedAt).getTime() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60);
        stats.avgResolutionTime = ((stats.avgResolutionTime * (stats.resolved - 1)) + resolutionHours) / stats.resolved;
      }
    });

    // Find underperforming department
    let worstDept = '';
    let worstScore = 1;
    
    departmentStats.forEach((stats, dept) => {
      const resolutionRate = stats.resolved / stats.total;
      const efficiency = stats.avgResolutionTime > 0 ? Math.min(48 / stats.avgResolutionTime, 1) : 0;
      const overallScore = (resolutionRate + efficiency) / 2;
      
      if (overallScore < worstScore && stats.total >= 5) {
        worstScore = overallScore;
        worstDept = dept;
      }
    });

    if (worstDept && worstScore < 0.6) {
      const stats = departmentStats.get(worstDept)!;
      return {
        type: 'anomaly',
        title: '⚠️ Department Performance Alert',
        description: `${worstDept} showing below-average performance: ${Math.round(stats.resolved / stats.total * 100)}% resolution rate`,
        confidence: 0.8,
        impact: 'medium',
        actionable: true,
        data: { 
          department: worstDept, 
          resolutionRate: stats.resolved / stats.total,
          avgResolutionTime: stats.avgResolutionTime
        }
      };
    }

    return null;
  }

  private optimizeResourceAllocation(): PredictiveInsight | null {
    const categoryLoad = new Map<string, number>();
    const pendingByCategory = new Map<string, number>();

    this.reports.forEach(report => {
      const count = categoryLoad.get(report.category) || 0;
      categoryLoad.set(report.category, count + 1);

      if (report.status === 'pending' || report.status === 'acknowledged') {
        const pending = pendingByCategory.get(report.category) || 0;
        pendingByCategory.set(report.category, pending + 1);
      }
    });

    // Find category with highest pending ratio
    let highestCategory = '';
    let highestRatio = 0;

    categoryLoad.forEach((total, category) => {
      const pending = pendingByCategory.get(category) || 0;
      const ratio = pending / total;
      
      if (ratio > highestRatio && pending >= 3) {
        highestRatio = ratio;
        highestCategory = category;
      }
    });

    if (highestCategory && highestRatio > 0.4) {
      return {
        type: 'recommendation',
        title: '🎯 Resource Optimization',
        description: `Consider allocating additional resources to ${highestCategory} - ${Math.round(highestRatio * 100)}% of issues are pending`,
        confidence: 0.9,
        impact: highestRatio > 0.7 ? 'high' : 'medium',
        actionable: true,
        data: { 
          category: highestCategory, 
          pendingRatio: highestRatio,
          pendingCount: pendingByCategory.get(highestCategory)
        }
      };
    }

    return null;
  }

  private calculateAverageResolutionTime(): number {
    const resolvedReports = this.reports.filter(r => r.status === 'resolved' && r.resolvedAt);
    
    if (resolvedReports.length === 0) return 48; // Default 48 hours

    const totalHours = resolvedReports.reduce((sum, report) => {
      const hours = (new Date(report.resolvedAt!).getTime() - new Date(report.createdAt).getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return totalHours / resolvedReports.length;
  }

  private getCategoryDepartment(category: string): string {
    const departmentMap: { [key: string]: string } = {
      'Road Maintenance': 'Public Works Department',
      'Water & Utilities': 'Water Board',
      'Lighting': 'Electrical Department',
      'Waste Management': 'Sanitation Department',
      'Traffic': 'Traffic Police',
      'Vandalism': 'Security Department',
      'Infrastructure': 'Public Works Department',
      'Other': 'General Administration'
    };

    return departmentMap[category] || 'General Administration';
  }

  public getRealtimeMetrics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      todayReports: this.reports.filter(r => new Date(r.createdAt) >= today).length,
      weeklyReports: this.reports.filter(r => new Date(r.createdAt) >= thisWeek).length,
      monthlyReports: this.reports.filter(r => new Date(r.createdAt) >= thisMonth).length,
      pendingBacklog: this.reports.filter(r => r.status === 'pending').length,
      urgentIssues: this.reports.filter(r => r.priority === 'urgent' && r.status !== 'resolved').length,
      averageResolutionTime: this.calculateAverageResolutionTime(),
      resolutionRate: this.reports.filter(r => r.status === 'resolved').length / Math.max(this.reports.length, 1)
    };
  }
}

export const predictiveAnalytics = new PredictiveAnalytics();
export default predictiveAnalytics;