interface Department {
  id: string;
  name: string;
  type: 'municipal' | 'utility' | 'emergency' | 'contractor' | 'specialized';
  categories: string[];
  capacity: {
    maxConcurrentIssues: number;
    averageResolutionTime: number; // hours
    workingHours: { start: string; end: string; days: string[] };
    skillLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  };
  currentWorkload: {
    activeIssues: number;
    pendingIssues: number;
    urgentIssues: number;
    estimatedWorkload: number; // percentage
  };
  performance: {
    completionRate: number;
    averageRating: number;
    responseTime: number; // hours
    escalationRate: number;
  };
  availability: {
    status: 'available' | 'busy' | 'offline' | 'maintenance';
    nextAvailable?: Date;
    emergencyContact?: boolean;
  };
  location: {
    zone: string;
    address: string;
    serviceRadius: number; // km
  };
  contact: {
    email: string;
    phone: string;
    emergencyPhone?: string;
  };
}

interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  conditions: RoutingCondition[];
  actions: RoutingAction[];
  enabled: boolean;
  createdAt: Date;
  lastModified: Date;
  statistics: {
    timesTriggered: number;
    successRate: number;
    averageProcessingTime: number;
  };
}

interface RoutingCondition {
  field: 'category' | 'priority' | 'location' | 'timeOfDay' | 'workload' | 'keywords' | 'userType';
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between' | 'in' | 'regex';
  value: any;
  weight: number; // 0-1
}

interface RoutingAction {
  type: 'assign_department' | 'set_priority' | 'add_tags' | 'notify_stakeholder' | 'escalate' | 'schedule';
  parameters: any;
  delay?: number; // seconds
}

interface SmartAssignment {
  reportId: string;
  assignedDepartment: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedResolutionTime: number; // hours
  confidence: number; // 0-1
  reasoning: AssignmentReasoning;
  alternativeDepartments: AlternativeAssignment[];
  scheduledFor?: Date;
  escalationRules: EscalationRule[];
}

interface AssignmentReasoning {
  primaryFactors: string[];
  categoryMatch: number; // 0-1
  workloadScore: number; // 0-1
  locationScore: number; // 0-1
  performanceScore: number; // 0-1
  availabilityScore: number; // 0-1
  overallScore: number; // 0-1
}

interface AlternativeAssignment {
  departmentId: string;
  score: number;
  reasoning: string;
  estimatedTime: number;
}

interface EscalationRule {
  id: string;
  trigger: 'timeout' | 'no_response' | 'quality_threshold' | 'citizen_complaint';
  threshold: any;
  action: 'reassign' | 'escalate_manager' | 'add_resources' | 'external_contractor';
  delay: number; // hours
}

interface WorkloadBalancer {
  enabled: boolean;
  algorithm: 'round_robin' | 'least_loaded' | 'weighted' | 'priority_based' | 'ml_optimized';
  parameters: {
    rebalanceInterval: number; // minutes
    maxImbalance: number; // percentage
    priorityWeights: { [priority: string]: number };
    performanceWeight: number; // 0-1
  };
}

interface PerformanceMetrics {
  departmentId: string;
  timeframe: 'daily' | 'weekly' | 'monthly';
  metrics: {
    totalAssigned: number;
    totalCompleted: number;
    averageResolutionTime: number;
    citizenSatisfaction: number;
    escalationRate: number;
    missedDeadlines: number;
    costEfficiency: number;
  };
  trends: {
    workloadTrend: 'increasing' | 'stable' | 'decreasing';
    performanceTrend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
  };
}

export class SmartRoutingService {
  private departments: Map<string, Department> = new Map();
  private routingRules: RoutingRule[] = [];
  private assignments: Map<string, SmartAssignment> = new Map();
  private workloadBalancer: WorkloadBalancer;
  private performanceHistory: Map<string, PerformanceMetrics[]> = new Map();

  constructor() {
    this.initializeDepartments();
    this.initializeRoutingRules();
    this.initializeWorkloadBalancer();
    this.startPerformanceMonitoring();
  }

  private initializeDepartments() {
    const defaultDepartments: Department[] = [
      {
        id: 'pwd',
        name: 'Public Works Department',
        type: 'municipal',
        categories: ['Road Maintenance', 'Infrastructure', 'Drainage'],
        capacity: {
          maxConcurrentIssues: 50,
          averageResolutionTime: 72,
          workingHours: { start: '08:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
          skillLevel: 'advanced'
        },
        currentWorkload: {
          activeIssues: 23,
          pendingIssues: 8,
          urgentIssues: 2,
          estimatedWorkload: 62
        },
        performance: {
          completionRate: 0.87,
          averageRating: 4.2,
          responseTime: 4.5,
          escalationRate: 0.12
        },
        availability: {
          status: 'available',
          emergencyContact: true
        },
        location: {
          zone: 'citywide',
          address: 'Municipal Complex, Block A',
          serviceRadius: 50
        },
        contact: {
          email: 'pwd@city.gov',
          phone: '+1-555-0101',
          emergencyPhone: '+1-555-0199'
        }
      },
      {
        id: 'water_board',
        name: 'Water & Utilities Board',
        type: 'utility',
        categories: ['Water & Utilities', 'Drainage', 'Sewage'],
        capacity: {
          maxConcurrentIssues: 30,
          averageResolutionTime: 24,
          workingHours: { start: '07:00', end: '19:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] },
          skillLevel: 'expert'
        },
        currentWorkload: {
          activeIssues: 18,
          pendingIssues: 5,
          urgentIssues: 3,
          estimatedWorkload: 77
        },
        performance: {
          completionRate: 0.92,
          averageRating: 4.6,
          responseTime: 2.1,
          escalationRate: 0.08
        },
        availability: {
          status: 'busy',
          nextAvailable: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
          emergencyContact: true
        },
        location: {
          zone: 'citywide',
          address: 'Water Treatment Plant, Sector 7',
          serviceRadius: 40
        },
        contact: {
          email: 'waterboard@utilities.gov',
          phone: '+1-555-0202',
          emergencyPhone: '+1-555-0299'
        }
      },
      {
        id: 'traffic_dept',
        name: 'Traffic Management Department',
        type: 'municipal',
        categories: ['Traffic', 'Road Signs', 'Traffic Signals'],
        capacity: {
          maxConcurrentIssues: 25,
          averageResolutionTime: 36,
          workingHours: { start: '06:00', end: '22:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
          skillLevel: 'intermediate'
        },
        currentWorkload: {
          activeIssues: 12,
          pendingIssues: 3,
          urgentIssues: 1,
          estimatedWorkload: 48
        },
        performance: {
          completionRate: 0.85,
          averageRating: 4.1,
          responseTime: 3.2,
          escalationRate: 0.15
        },
        availability: {
          status: 'available',
          emergencyContact: true
        },
        location: {
          zone: 'citywide',
          address: 'Traffic Control Center',
          serviceRadius: 35
        },
        contact: {
          email: 'traffic@city.gov',
          phone: '+1-555-0303'
        }
      },
      {
        id: 'sanitation',
        name: 'Sanitation Department',
        type: 'municipal',
        categories: ['Waste Management', 'Street Cleaning'],
        capacity: {
          maxConcurrentIssues: 40,
          averageResolutionTime: 12,
          workingHours: { start: '05:00', end: '15:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] },
          skillLevel: 'basic'
        },
        currentWorkload: {
          activeIssues: 25,
          pendingIssues: 7,
          urgentIssues: 0,
          estimatedWorkload: 80
        },
        performance: {
          completionRate: 0.91,
          averageRating: 4.0,
          responseTime: 6.0,
          escalationRate: 0.09
        },
        availability: {
          status: 'available'
        },
        location: {
          zone: 'citywide',
          address: 'Sanitation Depot, Industrial Area',
          serviceRadius: 30
        },
        contact: {
          email: 'sanitation@city.gov',
          phone: '+1-555-0404'
        }
      },
      {
        id: 'electrical',
        name: 'Electrical Department',
        type: 'utility',
        categories: ['Lighting', 'Electrical'],
        capacity: {
          maxConcurrentIssues: 20,
          averageResolutionTime: 48,
          workingHours: { start: '08:00', end: '20:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] },
          skillLevel: 'advanced'
        },
        currentWorkload: {
          activeIssues: 8,
          pendingIssues: 2,
          urgentIssues: 1,
          estimatedWorkload: 45
        },
        performance: {
          completionRate: 0.88,
          averageRating: 4.3,
          responseTime: 8.5,
          escalationRate: 0.11
        },
        availability: {
          status: 'available'
        },
        location: {
          zone: 'citywide',
          address: 'Power Grid Control Center',
          serviceRadius: 45
        },
        contact: {
          email: 'electrical@utilities.gov',
          phone: '+1-555-0505'
        }
      }
    ];

    defaultDepartments.forEach(dept => {
      this.departments.set(dept.id, dept);
    });
  }

  private initializeRoutingRules() {
    this.routingRules = [
      {
        id: 'urgent_water_issues',
        name: 'Urgent Water Issues Priority Routing',
        priority: 1,
        conditions: [
          {
            field: 'category',
            operator: 'equals',
            value: 'Water & Utilities',
            weight: 0.8
          },
          {
            field: 'priority',
            operator: 'equals',
            value: 'urgent',
            weight: 0.9
          }
        ],
        actions: [
          {
            type: 'assign_department',
            parameters: { departmentId: 'water_board', bypassWorkload: true }
          },
          {
            type: 'notify_stakeholder',
            parameters: { role: 'emergency_manager' },
            delay: 0
          }
        ],
        enabled: true,
        createdAt: new Date(),
        lastModified: new Date(),
        statistics: {
          timesTriggered: 45,
          successRate: 0.96,
          averageProcessingTime: 1.2
        }
      },
      {
        id: 'traffic_emergency',
        name: 'Traffic Emergency Fast Track',
        priority: 2,
        conditions: [
          {
            field: 'category',
            operator: 'equals',
            value: 'Traffic',
            weight: 0.7
          },
          {
            field: 'keywords',
            operator: 'contains',
            value: ['accident', 'blocked', 'signal down', 'emergency'],
            weight: 0.8
          }
        ],
        actions: [
          {
            type: 'set_priority',
            parameters: { priority: 'urgent' }
          },
          {
            type: 'assign_department',
            parameters: { departmentId: 'traffic_dept' }
          }
        ],
        enabled: true,
        createdAt: new Date(),
        lastModified: new Date(),
        statistics: {
          timesTriggered: 32,
          successRate: 0.91,
          averageProcessingTime: 0.8
        }
      },
      {
        id: 'workload_balancing',
        name: 'Dynamic Workload Balancing',
        priority: 5,
        conditions: [
          {
            field: 'workload',
            operator: 'greaterThan',
            value: 85,
            weight: 0.6
          }
        ],
        actions: [
          {
            type: 'escalate',
            parameters: { reason: 'workload_overflow', redistributeLoad: true }
          }
        ],
        enabled: true,
        createdAt: new Date(),
        lastModified: new Date(),
        statistics: {
          timesTriggered: 18,
          successRate: 0.83,
          averageProcessingTime: 2.5
        }
      }
    ];
  }

  private initializeWorkloadBalancer() {
    this.workloadBalancer = {
      enabled: true,
      algorithm: 'ml_optimized',
      parameters: {
        rebalanceInterval: 15, // minutes
        maxImbalance: 20, // percentage
        priorityWeights: {
          urgent: 4,
          high: 2,
          medium: 1,
          low: 0.5
        },
        performanceWeight: 0.3
      }
    };
  }

  private startPerformanceMonitoring() {
    // Update department performance every hour
    setInterval(() => {
      this.updateDepartmentPerformance();
    }, 3600000); // 1 hour

    // Rebalance workload every 15 minutes
    setInterval(() => {
      if (this.workloadBalancer.enabled) {
        this.rebalanceWorkload();
      }
    }, this.workloadBalancer.parameters.rebalanceInterval * 60000);
  }

  public assignReport(report: {
    id: string;
    category: string;
    priority?: string;
    description: string;
    location?: { lat: number; lng: number; address: string };
    userType?: string;
    keywords?: string[];
  }): SmartAssignment {

    console.log(`🎯 Processing smart assignment for report: ${report.id}`);

    // Apply routing rules
    const applicableRules = this.findApplicableRules(report);
    
    // Calculate priority if not set
    const priority = report.priority || this.calculatePriority(report);
    
    // Find best department match
    const departmentAssignment = this.findBestDepartment(report, priority);
    
    // Create assignment
    const assignment: SmartAssignment = {
      reportId: report.id,
      assignedDepartment: departmentAssignment.departmentId,
      priority: priority as 'low' | 'medium' | 'high' | 'urgent',
      estimatedResolutionTime: departmentAssignment.estimatedTime,
      confidence: departmentAssignment.confidence,
      reasoning: departmentAssignment.reasoning,
      alternativeDepartments: departmentAssignment.alternatives,
      escalationRules: this.generateEscalationRules(departmentAssignment.departmentId, priority)
    };

    // Apply routing rule actions
    applicableRules.forEach(rule => {
      rule.actions.forEach(action => {
        this.executeRoutingAction(action, assignment);
      });
      rule.statistics.timesTriggered++;
    });

    // Update department workload
    this.updateDepartmentWorkload(assignment.assignedDepartment, assignment);

    // Store assignment
    this.assignments.set(report.id, assignment);

    console.log(`✅ Report ${report.id} assigned to ${assignment.assignedDepartment} (${assignment.priority} priority, ${assignment.confidence.toFixed(2)} confidence)`);

    return assignment;
  }

  private findApplicableRules(report: any): RoutingRule[] {
    return this.routingRules
      .filter(rule => rule.enabled)
      .filter(rule => this.evaluateRuleConditions(rule, report))
      .sort((a, b) => a.priority - b.priority);
  }

  private evaluateRuleConditions(rule: RoutingRule, report: any): boolean {
    let totalScore = 0;
    let maxScore = 0;

    rule.conditions.forEach(condition => {
      maxScore += condition.weight;
      if (this.evaluateCondition(condition, report)) {
        totalScore += condition.weight;
      }
    });

    return totalScore / maxScore >= 0.5; // 50% threshold
  }

  private evaluateCondition(condition: RoutingCondition, report: any): boolean {
    const fieldValue = this.getFieldValue(condition.field, report);

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        if (Array.isArray(condition.value)) {
          return condition.value.some(val => 
            String(fieldValue).toLowerCase().includes(String(val).toLowerCase())
          );
        }
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'greaterThan':
        return Number(fieldValue) > Number(condition.value);
      case 'lessThan':
        return Number(fieldValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  private getFieldValue(field: string, report: any): any {
    switch (field) {
      case 'category':
        return report.category;
      case 'priority':
        return report.priority;
      case 'location':
        return report.location?.address || '';
      case 'keywords':
        return report.description + ' ' + (report.keywords?.join(' ') || '');
      case 'userType':
        return report.userType || 'citizen';
      case 'workload':
        // Calculate average workload across departments
        const workloads = Array.from(this.departments.values()).map(d => d.currentWorkload.estimatedWorkload);
        return workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
      default:
        return '';
    }
  }

  private calculatePriority(report: any): string {
    let priorityScore = 50; // Base score

    // Keywords analysis
    const urgentKeywords = ['emergency', 'urgent', 'danger', 'critical', 'immediate', 'blocked', 'flood', 'fire', 'accident'];
    const highKeywords = ['broken', 'damaged', 'not working', 'problem', 'issue', 'concern'];
    
    const text = (report.description + ' ' + (report.keywords?.join(' ') || '')).toLowerCase();
    
    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      priorityScore += 40;
    } else if (highKeywords.some(keyword => text.includes(keyword))) {
      priorityScore += 20;
    }

    // Category-based priority
    const categoryPriorities = {
      'Water & Utilities': 30,
      'Traffic': 25,
      'Road Maintenance': 15,
      'Electrical': 20,
      'Waste Management': 10,
      'Infrastructure': 20
    };
    
    priorityScore += categoryPriorities[report.category as keyof typeof categoryPriorities] || 0;

    // Time-based factors
    const hour = new Date().getHours();
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
      priorityScore += 10; // Rush hour
    }

    // Determine final priority
    if (priorityScore >= 80) return 'urgent';
    if (priorityScore >= 60) return 'high';
    if (priorityScore >= 40) return 'medium';
    return 'low';
  }

  private findBestDepartment(report: any, priority: string): {
    departmentId: string;
    estimatedTime: number;
    confidence: number;
    reasoning: AssignmentReasoning;
    alternatives: AlternativeAssignment[];
  } {
    
    const candidates: Array<{
      department: Department;
      score: number;
      factors: AssignmentReasoning;
    }> = [];

    this.departments.forEach(department => {
      const factors = this.calculateAssignmentFactors(department, report, priority);
      const score = this.calculateOverallScore(factors);
      
      candidates.push({
        department,
        score,
        factors
      });
    });

    // Sort by score
    candidates.sort((a, b) => b.score - a.score);

    const bestCandidate = candidates[0];
    const alternatives = candidates.slice(1, 4).map(candidate => ({
      departmentId: candidate.department.id,
      score: candidate.score,
      reasoning: this.generateReasoningText(candidate.factors),
      estimatedTime: this.estimateResolutionTime(candidate.department, priority)
    }));

    return {
      departmentId: bestCandidate.department.id,
      estimatedTime: this.estimateResolutionTime(bestCandidate.department, priority),
      confidence: bestCandidate.score,
      reasoning: bestCandidate.factors,
      alternatives
    };
  }

  private calculateAssignmentFactors(department: Department, report: any, priority: string): AssignmentReasoning {
    // Category match score
    const categoryMatch = department.categories.includes(report.category) ? 1.0 : 
                         department.categories.some(cat => this.isSimilarCategory(cat, report.category)) ? 0.5 : 0.1;

    // Workload score (lower workload = higher score)
    const workloadScore = Math.max(0, 1 - (department.currentWorkload.estimatedWorkload / 100));

    // Location score (simplified)
    const locationScore = 0.8; // Would calculate based on actual distance

    // Performance score
    const performanceScore = (
      department.performance.completionRate * 0.4 +
      (department.performance.averageRating / 5) * 0.3 +
      (1 - department.performance.escalationRate) * 0.2 +
      Math.max(0, 1 - (department.performance.responseTime / 48)) * 0.1
    );

    // Availability score
    let availabilityScore = 0.5;
    if (department.availability.status === 'available') availabilityScore = 1.0;
    else if (department.availability.status === 'busy') availabilityScore = 0.3;
    else if (department.availability.status === 'offline') availabilityScore = 0.1;

    // Emergency contact bonus for urgent issues
    if (priority === 'urgent' && department.availability.emergencyContact) {
      availabilityScore = Math.min(1.0, availabilityScore + 0.3);
    }

    const primaryFactors: string[] = [];
    if (categoryMatch >= 0.8) primaryFactors.push('Perfect category match');
    if (workloadScore >= 0.7) primaryFactors.push('Low workload');
    if (performanceScore >= 0.8) primaryFactors.push('High performance rating');
    if (availabilityScore >= 0.8) primaryFactors.push('Immediate availability');

    return {
      primaryFactors,
      categoryMatch,
      workloadScore,
      locationScore,
      performanceScore,
      availabilityScore,
      overallScore: this.calculateOverallScore({
        categoryMatch,
        workloadScore,
        locationScore,
        performanceScore,
        availabilityScore,
        primaryFactors: [],
        overallScore: 0
      })
    };
  }

  private calculateOverallScore(factors: Partial<AssignmentReasoning>): number {
    const weights = {
      categoryMatch: 0.35,
      workloadScore: 0.25,
      performanceScore: 0.20,
      availabilityScore: 0.15,
      locationScore: 0.05
    };

    return (
      (factors.categoryMatch || 0) * weights.categoryMatch +
      (factors.workloadScore || 0) * weights.workloadScore +
      (factors.performanceScore || 0) * weights.performanceScore +
      (factors.availabilityScore || 0) * weights.availabilityScore +
      (factors.locationScore || 0) * weights.locationScore
    );
  }

  private isSimilarCategory(deptCategory: string, reportCategory: string): boolean {
    const similarityMap: { [key: string]: string[] } = {
      'Road Maintenance': ['Infrastructure', 'Traffic'],
      'Water & Utilities': ['Drainage', 'Infrastructure'],
      'Traffic': ['Road Maintenance', 'Infrastructure'],
      'Waste Management': ['Infrastructure'],
      'Lighting': ['Electrical', 'Infrastructure']
    };

    return similarityMap[deptCategory]?.includes(reportCategory) || false;
  }

  private estimateResolutionTime(department: Department, priority: string): number {
    let baseTime = department.capacity.averageResolutionTime;
    
    // Priority adjustments
    const priorityMultipliers = {
      urgent: 0.3,
      high: 0.6,
      medium: 1.0,
      low: 1.5
    };
    
    baseTime *= priorityMultipliers[priority as keyof typeof priorityMultipliers] || 1.0;
    
    // Workload adjustment
    const workloadMultiplier = 1 + (department.currentWorkload.estimatedWorkload / 100);
    baseTime *= workloadMultiplier;
    
    return Math.round(baseTime);
  }

  private generateReasoningText(factors: AssignmentReasoning): string {
    const reasons: string[] = [];
    
    if (factors.categoryMatch >= 0.8) reasons.push('exact category match');
    if (factors.workloadScore >= 0.7) reasons.push('low current workload');
    if (factors.performanceScore >= 0.8) reasons.push('excellent performance history');
    if (factors.availabilityScore >= 0.8) reasons.push('immediate availability');
    
    return reasons.join(', ') || 'standard assignment criteria';
  }

  private generateEscalationRules(departmentId: string, priority: string): EscalationRule[] {
    const department = this.departments.get(departmentId);
    if (!department) return [];

    const rules: EscalationRule[] = [];

    // Timeout escalation
    const timeoutHours = priority === 'urgent' ? 2 : priority === 'high' ? 8 : 24;
    rules.push({
      id: `timeout_${departmentId}_${Date.now()}`,
      trigger: 'timeout',
      threshold: timeoutHours,
      action: 'escalate_manager',
      delay: timeoutHours
    });

    // No response escalation
    if (priority === 'urgent' || priority === 'high') {
      rules.push({
        id: `no_response_${departmentId}_${Date.now()}`,
        trigger: 'no_response',
        threshold: priority === 'urgent' ? 1 : 4,
        action: 'add_resources',
        delay: priority === 'urgent' ? 1 : 4
      });
    }

    return rules;
  }

  private executeRoutingAction(action: RoutingAction, assignment: SmartAssignment) {
    setTimeout(() => {
      switch (action.type) {
        case 'assign_department':
          if (action.parameters.departmentId) {
            assignment.assignedDepartment = action.parameters.departmentId;
          }
          break;
        case 'set_priority':
          assignment.priority = action.parameters.priority;
          break;
        case 'notify_stakeholder':
          console.log(`📧 Notifying stakeholder: ${action.parameters.role} for report ${assignment.reportId}`);
          break;
        case 'escalate':
          console.log(`⚠️ Escalating report ${assignment.reportId}: ${action.parameters.reason}`);
          break;
      }
    }, action.delay || 0);
  }

  private updateDepartmentWorkload(departmentId: string, assignment: SmartAssignment) {
    const department = this.departments.get(departmentId);
    if (!department) return;

    // Update current workload
    if (assignment.priority === 'urgent') {
      department.currentWorkload.urgentIssues++;
    } else {
      department.currentWorkload.activeIssues++;
    }

    // Recalculate estimated workload
    const totalWeight = 
      department.currentWorkload.urgentIssues * 4 +
      department.currentWorkload.activeIssues * 2 +
      department.currentWorkload.pendingIssues * 1;

    department.currentWorkload.estimatedWorkload = 
      Math.min(100, (totalWeight / department.capacity.maxConcurrentIssues) * 100);
  }

  private rebalanceWorkload() {
    console.log('⚖️ Rebalancing workload across departments...');

    const departments = Array.from(this.departments.values());
    const avgWorkload = departments.reduce((sum, dept) => sum + dept.currentWorkload.estimatedWorkload, 0) / departments.length;
    const maxImbalance = this.workloadBalancer.parameters.maxImbalance;

    // Find overloaded and underloaded departments
    const overloaded = departments.filter(dept => 
      dept.currentWorkload.estimatedWorkload > avgWorkload + maxImbalance
    );
    const underloaded = departments.filter(dept => 
      dept.currentWorkload.estimatedWorkload < avgWorkload - maxImbalance
    );

    if (overloaded.length > 0 && underloaded.length > 0) {
      console.log(`🔄 Rebalancing needed: ${overloaded.length} overloaded, ${underloaded.length} underloaded departments`);
      // Implementation would redistribute assignments here
    }
  }

  private updateDepartmentPerformance() {
    this.departments.forEach((department, departmentId) => {
      // Calculate new performance metrics based on recent assignments
      const recentAssignments = Array.from(this.assignments.values())
        .filter(assignment => assignment.assignedDepartment === departmentId);

      if (recentAssignments.length > 0) {
        const avgConfidence = recentAssignments.reduce((sum, a) => sum + a.confidence, 0) / recentAssignments.length;
        
        // Update performance metrics (simplified)
        department.performance.averageRating = Math.min(5, avgConfidence * 5);
        department.performance.completionRate = Math.min(1, avgConfidence + 0.1);
      }
    });
  }

  // Public API methods

  public getDepartments(): Department[] {
    return Array.from(this.departments.values());
  }

  public getDepartment(departmentId: string): Department | null {
    return this.departments.get(departmentId) || null;
  }

  public getAssignment(reportId: string): SmartAssignment | null {
    return this.assignments.get(reportId) || null;
  }

  public getRoutingRules(): RoutingRule[] {
    return [...this.routingRules];
  }

  public addRoutingRule(rule: Omit<RoutingRule, 'id' | 'createdAt' | 'lastModified' | 'statistics'>): string {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newRule: RoutingRule = {
      ...rule,
      id: ruleId,
      createdAt: new Date(),
      lastModified: new Date(),
      statistics: {
        timesTriggered: 0,
        successRate: 0,
        averageProcessingTime: 0
      }
    };

    this.routingRules.push(newRule);
    this.routingRules.sort((a, b) => a.priority - b.priority);

    console.log(`📋 New routing rule added: ${newRule.name}`);
    return ruleId;
  }

  public updateDepartmentStatus(departmentId: string, status: Department['availability']['status'], nextAvailable?: Date) {
    const department = this.departments.get(departmentId);
    if (department) {
      department.availability.status = status;
      if (nextAvailable) {
        department.availability.nextAvailable = nextAvailable;
      }
      console.log(`🏢 Department ${departmentId} status updated to: ${status}`);
    }
  }

  public getPerformanceMetrics(departmentId?: string): PerformanceMetrics[] {
    if (departmentId) {
      return this.performanceHistory.get(departmentId) || [];
    }

    // Return all departments' metrics
    const allMetrics: PerformanceMetrics[] = [];
    this.performanceHistory.forEach(metrics => {
      allMetrics.push(...metrics);
    });
    
    return allMetrics;
  }

  public getWorkloadStatus(): {
    departments: Array<{ id: string; name: string; workload: number; status: string }>;
    avgWorkload: number;
    imbalanceLevel: number;
    recommendRebalance: boolean;
  } {
    const departments = Array.from(this.departments.values());
    const avgWorkload = departments.reduce((sum, dept) => sum + dept.currentWorkload.estimatedWorkload, 0) / departments.length;
    
    const workloads = departments.map(dept => dept.currentWorkload.estimatedWorkload);
    const maxWorkload = Math.max(...workloads);
    const minWorkload = Math.min(...workloads);
    const imbalanceLevel = maxWorkload - minWorkload;

    return {
      departments: departments.map(dept => ({
        id: dept.id,
        name: dept.name,
        workload: dept.currentWorkload.estimatedWorkload,
        status: dept.availability.status
      })),
      avgWorkload,
      imbalanceLevel,
      recommendRebalance: imbalanceLevel > this.workloadBalancer.parameters.maxImbalance
    };
  }

  public simulateAssignment(report: any): SmartAssignment {
    // Create a temporary assignment without storing it
    return this.assignReport({ ...report, id: 'simulation_' + Date.now() });
  }

  public getRoutingStatistics(): {
    totalAssignments: number;
    averageConfidence: number;
    departmentUtilization: { [departmentId: string]: number };
    ruleEffectiveness: Array<{ rule: string; triggered: number; success: number }>;
  } {
    const assignments = Array.from(this.assignments.values());
    
    return {
      totalAssignments: assignments.length,
      averageConfidence: assignments.reduce((sum, a) => sum + a.confidence, 0) / assignments.length,
      departmentUtilization: Object.fromEntries(
        Array.from(this.departments.keys()).map(deptId => [
          deptId,
          assignments.filter(a => a.assignedDepartment === deptId).length
        ])
      ),
      ruleEffectiveness: this.routingRules.map(rule => ({
        rule: rule.name,
        triggered: rule.statistics.timesTriggered,
        success: Math.round(rule.statistics.successRate * 100)
      }))
    };
  }
}

export const smartRoutingService = new SmartRoutingService();
export default smartRoutingService;