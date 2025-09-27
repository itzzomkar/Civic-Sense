interface EnvironmentalMetric {
  id: string;
  name: string;
  category: 'carbon' | 'waste' | 'energy' | 'water' | 'air_quality' | 'biodiversity' | 'noise';
  unit: string;
  description: string;
  baseline?: number;
  target?: number;
  currentValue: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
  dataSource: string;
}

interface CarbonFootprintData {
  reportId: string;
  category: string;
  location: { lat: number; lng: number; address: string };
  emissions: {
    transportation: number; // kg CO2
    equipment: number; // kg CO2
    materials: number; // kg CO2
    energy: number; // kg CO2
    waste: number; // kg CO2
  };
  calculationMethod: string;
  estimatedReduction: number; // kg CO2 saved after resolution
  offsetPotential: number; // kg CO2 that can be offset
}

interface GreenInitiative {
  id: string;
  title: string;
  type: 'tree_planting' | 'energy_efficiency' | 'waste_reduction' | 'water_conservation' | 'sustainable_transport' | 'renewable_energy' | 'green_infrastructure';
  description: string;
  targetAudience: string[];
  location?: { lat: number; lng: number; address: string };
  status: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  budget?: {
    allocated: number;
    spent: number;
    currency: string;
  };
  impact: {
    co2Reduction: number; // kg CO2/year
    energySaved: number; // kWh/year
    waterSaved: number; // liters/year
    wasteReduced: number; // kg/year
    participantsReached: number;
    areaImproved: number; // m²
  };
  progress: {
    percentComplete: number;
    milestonesCompleted: number;
    totalMilestones: number;
    currentPhase: string;
  };
  partners: string[];
  relatedReports: string[];
  metrics: EnvironmentalMetric[];
}

interface SustainabilityGoal {
  id: string;
  name: string;
  category: 'carbon_neutral' | 'waste_zero' | 'energy_renewable' | 'transport_green' | 'air_quality' | 'biodiversity';
  description: string;
  targetDate: Date;
  currentProgress: number; // 0-100%
  milestones: Array<{
    id: string;
    name: string;
    targetDate: Date;
    completed: boolean;
    completedDate?: Date;
    impact: number; // contribution to overall goal %
  }>;
  kpis: Array<{
    metric: string;
    currentValue: number;
    targetValue: number;
    unit: string;
    progress: number; // 0-100%
  }>;
  relatedInitiatives: string[];
  stakeholders: string[];
}

interface EnvironmentalAlert {
  id: string;
  type: 'pollution_spike' | 'emission_increase' | 'target_missed' | 'resource_depletion' | 'biodiversity_threat';
  severity: 'info' | 'warning' | 'critical' | 'emergency';
  title: string;
  message: string;
  location?: { lat: number; lng: number; address: string };
  affectedMetrics: string[];
  triggeredAt: Date;
  resolvedAt?: Date;
  actionsTaken: string[];
  responsibleDepartment?: string;
}

interface ClimateAdaptationPlan {
  id: string;
  name: string;
  riskType: 'flood' | 'heatwave' | 'drought' | 'storm' | 'air_pollution' | 'water_scarcity';
  assessmentData: {
    probabilityScore: number; // 0-100
    impactScore: number; // 0-100
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    affectedAreas: string[];
    vulnerablePopulation: number;
    economicImpact: number;
  };
  adaptationMeasures: Array<{
    id: string;
    name: string;
    type: 'infrastructure' | 'policy' | 'technology' | 'behavioral' | 'natural';
    cost: number;
    effectiveness: number; // 0-100
    timeframe: 'short' | 'medium' | 'long'; // <1yr, 1-5yr, >5yr
    implementationStatus: 'planned' | 'in_progress' | 'completed' | 'deferred';
  }>;
  monitoringIndicators: string[];
}

interface GreenCertification {
  id: string;
  name: string;
  standard: 'ISO14001' | 'LEED' | 'BREEAM' | 'Carbon_Neutral' | 'Green_Building' | 'Sustainable_City';
  level: string;
  certifiedEntity: string;
  issueDate: Date;
  expiryDate: Date;
  requirements: string[];
  complianceStatus: 'compliant' | 'minor_issues' | 'major_issues' | 'expired';
  auditResults: Array<{
    date: Date;
    auditor: string;
    score: number;
    findings: string[];
    recommendations: string[];
  }>;
}

export class EnvironmentalImpactService {
  private metrics: Map<string, EnvironmentalMetric> = new Map();
  private carbonFootprints: Map<string, CarbonFootprintData> = new Map();
  private greenInitiatives: Map<string, GreenInitiative> = new Map();
  private sustainabilityGoals: Map<string, SustainabilityGoal> = new Map();
  private environmentalAlerts: Map<string, EnvironmentalAlert> = new Map();
  private climateAdaptationPlans: Map<string, ClimateAdaptationPlan> = new Map();
  private certifications: Map<string, GreenCertification> = new Map();

  constructor() {
    this.initializeBaseMetrics();
    this.initializeGreenInitiatives();
    this.initializeSustainabilityGoals();
    this.initializeClimateAdaptationPlans();
    this.startEnvironmentalMonitoring();
  }

  private initializeBaseMetrics() {
    const baseMetrics: EnvironmentalMetric[] = [
      {
        id: 'city_carbon_emissions',
        name: 'City Carbon Emissions',
        category: 'carbon',
        unit: 'tonnes CO2/year',
        description: 'Total carbon emissions from city operations and infrastructure',
        baseline: 125000,
        target: 62500, // 50% reduction by 2030
        currentValue: 118500,
        trend: 'improving',
        lastUpdated: new Date(),
        dataSource: 'Municipal Environmental Department'
      },
      {
        id: 'waste_recycling_rate',
        name: 'Waste Recycling Rate',
        category: 'waste',
        unit: '%',
        description: 'Percentage of total waste that is recycled',
        baseline: 35,
        target: 75,
        currentValue: 52,
        trend: 'improving',
        lastUpdated: new Date(),
        dataSource: 'Waste Management Department'
      },
      {
        id: 'renewable_energy_usage',
        name: 'Renewable Energy Usage',
        category: 'energy',
        unit: '%',
        description: 'Percentage of city energy from renewable sources',
        baseline: 15,
        target: 80,
        currentValue: 28,
        trend: 'improving',
        lastUpdated: new Date(),
        dataSource: 'Energy Department'
      },
      {
        id: 'air_quality_index',
        name: 'Air Quality Index',
        category: 'air_quality',
        unit: 'AQI',
        description: 'Average air quality index across monitoring stations',
        baseline: 85,
        target: 45, // Good air quality
        currentValue: 72,
        trend: 'improving',
        lastUpdated: new Date(),
        dataSource: 'Environmental Monitoring Network'
      },
      {
        id: 'water_consumption',
        name: 'Per Capita Water Consumption',
        category: 'water',
        unit: 'liters/person/day',
        description: 'Average daily water consumption per person',
        baseline: 280,
        target: 200,
        currentValue: 255,
        trend: 'improving',
        lastUpdated: new Date(),
        dataSource: 'Water Utilities Board'
      },
      {
        id: 'green_cover',
        name: 'Urban Green Cover',
        category: 'biodiversity',
        unit: '%',
        description: 'Percentage of city area covered by vegetation',
        baseline: 18,
        target: 35,
        currentValue: 23,
        trend: 'improving',
        lastUpdated: new Date(),
        dataSource: 'Parks and Recreation Department'
      },
      {
        id: 'noise_pollution',
        name: 'Average Noise Level',
        category: 'noise',
        unit: 'dB',
        description: 'Average noise level in commercial and residential areas',
        baseline: 68,
        target: 55,
        currentValue: 64,
        trend: 'improving',
        lastUpdated: new Date(),
        dataSource: 'Environmental Monitoring'
      }
    ];

    baseMetrics.forEach(metric => {
      this.metrics.set(metric.id, metric);
    });
  }

  private initializeGreenInitiatives() {
    const initiatives: GreenInitiative[] = [
      {
        id: 'urban_forest_2025',
        title: 'Urban Forest Expansion 2025',
        type: 'tree_planting',
        description: 'Plant 50,000 native trees across the city to improve air quality and reduce urban heat island effect',
        targetAudience: ['residents', 'schools', 'businesses', 'volunteers'],
        location: { lat: 0, lng: 0, address: 'Citywide Initiative' },
        status: 'active',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2025-12-31'),
        budget: {
          allocated: 2500000,
          spent: 875000,
          currency: 'USD'
        },
        impact: {
          co2Reduction: 125000, // kg CO2/year when mature
          energySaved: 0,
          waterSaved: 0,
          wasteReduced: 0,
          participantsReached: 15000,
          areaImproved: 5000000 // 5 km²
        },
        progress: {
          percentComplete: 35,
          milestonesCompleted: 7,
          totalMilestones: 20,
          currentPhase: 'Community Planting Events'
        },
        partners: ['Green Earth NGO', 'City Schools Network', 'Local Nurseries'],
        relatedReports: [],
        metrics: ['city_carbon_emissions', 'green_cover', 'air_quality_index']
      },
      {
        id: 'solar_rooftops_program',
        title: 'Municipal Solar Rooftops Program',
        type: 'renewable_energy',
        description: 'Install solar panels on 500 municipal and residential buildings',
        targetAudience: ['homeowners', 'businesses', 'municipal_buildings'],
        status: 'active',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2026-03-01'),
        budget: {
          allocated: 8000000,
          spent: 2400000,
          currency: 'USD'
        },
        impact: {
          co2Reduction: 180000, // kg CO2/year
          energySaved: 3200000, // kWh/year
          waterSaved: 0,
          wasteReduced: 0,
          participantsReached: 500,
          areaImproved: 125000 // m² of solar panels
        },
        progress: {
          percentComplete: 30,
          milestonesCompleted: 6,
          totalMilestones: 20,
          currentPhase: 'Residential Installation Phase'
        },
        partners: ['SolarTech Solutions', 'Municipal Energy Department', 'Green Finance Bank'],
        relatedReports: [],
        metrics: ['renewable_energy_usage', 'city_carbon_emissions']
      },
      {
        id: 'zero_waste_districts',
        title: 'Zero Waste Pilot Districts',
        type: 'waste_reduction',
        description: 'Implement zero waste strategies in 3 pilot districts',
        targetAudience: ['residents', 'businesses', 'restaurants'],
        status: 'active',
        startDate: new Date('2024-06-01'),
        endDate: new Date('2025-06-01'),
        budget: {
          allocated: 1200000,
          spent: 420000,
          currency: 'USD'
        },
        impact: {
          co2Reduction: 45000, // kg CO2/year
          energySaved: 0,
          waterSaved: 0,
          wasteReduced: 2500000, // kg/year
          participantsReached: 25000,
          areaImproved: 15000000 // m² covered
        },
        progress: {
          percentComplete: 45,
          milestonesCompleted: 9,
          totalMilestones: 20,
          currentPhase: 'Community Education and Setup'
        },
        partners: ['Waste Warriors NGO', 'Local Businesses Association'],
        relatedReports: [],
        metrics: ['waste_recycling_rate', 'city_carbon_emissions']
      },
      {
        id: 'smart_water_conservation',
        title: 'Smart Water Conservation Network',
        type: 'water_conservation',
        description: 'Deploy IoT sensors and smart meters for water conservation',
        targetAudience: ['residents', 'commercial_buildings', 'municipal_facilities'],
        status: 'active',
        startDate: new Date('2024-02-01'),
        endDate: new Date('2025-08-01'),
        budget: {
          allocated: 3500000,
          spent: 1050000,
          currency: 'USD'
        },
        impact: {
          co2Reduction: 25000, // kg CO2/year (reduced pumping energy)
          energySaved: 450000, // kWh/year
          waterSaved: 50000000, // liters/year
          wasteReduced: 0,
          participantsReached: 50000,
          areaImproved: 25000000 // m² monitored
        },
        progress: {
          percentComplete: 30,
          milestonesCompleted: 6,
          totalMilestones: 20,
          currentPhase: 'Sensor Deployment'
        },
        partners: ['AquaTech Systems', 'Water Conservation Institute'],
        relatedReports: [],
        metrics: ['water_consumption', 'city_carbon_emissions']
      }
    ];

    initiatives.forEach(initiative => {
      this.greenInitiatives.set(initiative.id, initiative);
    });
  }

  private initializeSustainabilityGoals() {
    const goals: SustainabilityGoal[] = [
      {
        id: 'carbon_neutral_2030',
        name: 'Carbon Neutral City by 2030',
        category: 'carbon_neutral',
        description: 'Achieve net-zero carbon emissions for all city operations and significantly reduce community emissions',
        targetDate: new Date('2030-12-31'),
        currentProgress: 22,
        milestones: [
          {
            id: 'm1',
            name: '25% emissions reduction',
            targetDate: new Date('2026-12-31'),
            completed: false,
            impact: 25
          },
          {
            id: 'm2',
            name: '50% renewable energy',
            targetDate: new Date('2027-12-31'),
            completed: false,
            impact: 30
          },
          {
            id: 'm3',
            name: 'Green transportation fleet',
            targetDate: new Date('2028-12-31'),
            completed: false,
            impact: 20
          },
          {
            id: 'm4',
            name: 'Carbon offset programs',
            targetDate: new Date('2029-12-31'),
            completed: false,
            impact: 25
          }
        ],
        kpis: [
          {
            metric: 'Total CO2 emissions',
            currentValue: 118500,
            targetValue: 0,
            unit: 'tonnes/year',
            progress: 5
          },
          {
            metric: 'Renewable energy percentage',
            currentValue: 28,
            targetValue: 100,
            unit: '%',
            progress: 28
          }
        ],
        relatedInitiatives: ['urban_forest_2025', 'solar_rooftops_program'],
        stakeholders: ['Mayor Office', 'Environmental Department', 'Energy Department', 'Citizens']
      },
      {
        id: 'waste_zero_2028',
        name: 'Zero Waste City by 2028',
        category: 'waste_zero',
        description: 'Achieve 90% waste diversion from landfills through reduction, reuse, recycling, and composting',
        targetDate: new Date('2028-12-31'),
        currentProgress: 35,
        milestones: [
          {
            id: 'm1',
            name: '70% recycling rate',
            targetDate: new Date('2026-06-30'),
            completed: false,
            impact: 40
          },
          {
            id: 'm2',
            name: 'Citywide composting program',
            targetDate: new Date('2027-03-31'),
            completed: false,
            impact: 30
          },
          {
            id: 'm3',
            name: 'Plastic-free municipal operations',
            targetDate: new Date('2025-12-31'),
            completed: false,
            impact: 20
          },
          {
            id: 'm4',
            name: 'Industrial symbiosis network',
            targetDate: new Date('2028-06-30'),
            completed: false,
            impact: 10
          }
        ],
        kpis: [
          {
            metric: 'Waste recycling rate',
            currentValue: 52,
            targetValue: 90,
            unit: '%',
            progress: 58
          },
          {
            metric: 'Landfill diversion rate',
            currentValue: 48,
            targetValue: 90,
            unit: '%',
            progress: 53
          }
        ],
        relatedInitiatives: ['zero_waste_districts'],
        stakeholders: ['Waste Management', 'Environmental Department', 'Businesses', 'Citizens']
      }
    ];

    goals.forEach(goal => {
      this.sustainabilityGoals.set(goal.id, goal);
    });
  }

  private initializeClimateAdaptationPlans() {
    const plans: ClimateAdaptationPlan[] = [
      {
        id: 'flood_resilience_plan',
        name: 'Urban Flood Resilience Plan',
        riskType: 'flood',
        assessmentData: {
          probabilityScore: 75,
          impactScore: 85,
          riskLevel: 'high',
          affectedAreas: ['Downtown District', 'Industrial Zone', 'Riverside Communities'],
          vulnerablePopulation: 125000,
          economicImpact: 50000000
        },
        adaptationMeasures: [
          {
            id: 'green_infrastructure',
            name: 'Green Infrastructure Network',
            type: 'natural',
            cost: 15000000,
            effectiveness: 80,
            timeframe: 'medium',
            implementationStatus: 'in_progress'
          },
          {
            id: 'early_warning_system',
            name: 'Flood Early Warning System',
            type: 'technology',
            cost: 2500000,
            effectiveness: 90,
            timeframe: 'short',
            implementationStatus: 'completed'
          },
          {
            id: 'building_codes_update',
            name: 'Flood-Resilient Building Codes',
            type: 'policy',
            cost: 500000,
            effectiveness: 70,
            timeframe: 'short',
            implementationStatus: 'planned'
          }
        ],
        monitoringIndicators: ['rainfall_intensity', 'water_level_sensors', 'evacuation_response_time']
      },
      {
        id: 'heat_island_mitigation',
        name: 'Urban Heat Island Mitigation',
        riskType: 'heatwave',
        assessmentData: {
          probabilityScore: 85,
          impactScore: 70,
          riskLevel: 'high',
          affectedAreas: ['Commercial District', 'Dense Residential Areas'],
          vulnerablePopulation: 200000,
          economicImpact: 25000000
        },
        adaptationMeasures: [
          {
            id: 'cool_roofs_program',
            name: 'Cool Roofs and Green Roofs Program',
            type: 'infrastructure',
            cost: 8000000,
            effectiveness: 75,
            timeframe: 'medium',
            implementationStatus: 'in_progress'
          },
          {
            id: 'urban_canopy_expansion',
            name: 'Urban Tree Canopy Expansion',
            type: 'natural',
            cost: 12000000,
            effectiveness: 85,
            timeframe: 'long',
            implementationStatus: 'in_progress'
          },
          {
            id: 'cooling_centers',
            name: 'Public Cooling Centers Network',
            type: 'infrastructure',
            cost: 3000000,
            effectiveness: 95,
            timeframe: 'short',
            implementationStatus: 'completed'
          }
        ],
        monitoringIndicators: ['surface_temperature', 'heat_index', 'energy_demand', 'health_incidents']
      }
    ];

    plans.forEach(plan => {
      this.climateAdaptationPlans.set(plan.id, plan);
    });
  }

  private startEnvironmentalMonitoring() {
    // Monitor environmental metrics every hour
    setInterval(() => {
      this.updateEnvironmentalMetrics();
      this.checkEnvironmentalAlerts();
    }, 3600000); // 1 hour

    // Update initiative progress daily
    setInterval(() => {
      this.updateInitiativeProgress();
    }, 86400000); // 24 hours

    // Check sustainability goals weekly
    setInterval(() => {
      this.updateSustainabilityGoals();
    }, 604800000); // 1 week
  }

  public calculateCarbonFootprint(report: {
    id: string;
    category: string;
    description: string;
    location: { lat: number; lng: number; address: string };
    priority?: string;
  }): CarbonFootprintData {

    console.log(`🌱 Calculating carbon footprint for report: ${report.id}`);

    // Base emission factors (kg CO2)
    const emissionFactors = {
      transportation: {
        'Road Maintenance': 25,
        'Traffic': 15,
        'Water & Utilities': 30,
        'Electrical': 20,
        'Waste Management': 35,
        'default': 20
      },
      equipment: {
        'Road Maintenance': 50,
        'Traffic': 10,
        'Water & Utilities': 40,
        'Electrical': 60,
        'Waste Management': 30,
        'default': 25
      },
      materials: {
        'Road Maintenance': 100,
        'Traffic': 20,
        'Water & Utilities': 80,
        'Electrical': 40,
        'Waste Management': 15,
        'default': 50
      },
      energy: {
        'Road Maintenance': 30,
        'Traffic': 40,
        'Water & Utilities': 70,
        'Electrical': 20,
        'Waste Management': 25,
        'default': 35
      },
      waste: {
        'Road Maintenance': 15,
        'Traffic': 5,
        'Water & Utilities': 10,
        'Electrical': 25,
        'Waste Management': 0, // Waste management reduces waste
        'default': 10
      }
    };

    // Calculate emissions for each category
    const emissions = {
      transportation: emissionFactors.transportation[report.category as keyof typeof emissionFactors.transportation] || emissionFactors.transportation.default,
      equipment: emissionFactors.equipment[report.category as keyof typeof emissionFactors.equipment] || emissionFactors.equipment.default,
      materials: emissionFactors.materials[report.category as keyof typeof emissionFactors.materials] || emissionFactors.materials.default,
      energy: emissionFactors.energy[report.category as keyof typeof emissionFactors.energy] || emissionFactors.energy.default,
      waste: emissionFactors.waste[report.category as keyof typeof emissionFactors.waste] || emissionFactors.waste.default
    };

    // Priority multiplier (urgent issues may require more resources)
    const priorityMultiplier = report.priority === 'urgent' ? 1.5 : report.priority === 'high' ? 1.2 : 1.0;

    Object.keys(emissions).forEach(key => {
      emissions[key as keyof typeof emissions] *= priorityMultiplier;
    });

    // Estimate reduction potential after resolution
    const estimatedReduction = this.calculateEmissionReduction(report.category, emissions);

    // Calculate offset potential through green initiatives
    const offsetPotential = this.calculateOffsetPotential(report.location);

    const carbonFootprint: CarbonFootprintData = {
      reportId: report.id,
      category: report.category,
      location: report.location,
      emissions,
      calculationMethod: 'Category-based emission factors with priority adjustment',
      estimatedReduction,
      offsetPotential
    };

    this.carbonFootprints.set(report.id, carbonFootprint);

    console.log(`📊 Carbon footprint calculated: ${Object.values(emissions).reduce((sum, val) => sum + val, 0).toFixed(2)} kg CO2`);

    return carbonFootprint;
  }

  private calculateEmissionReduction(category: string, emissions: any): number {
    // Estimate emissions saved after fixing the issue
    const reductionFactors = {
      'Road Maintenance': 0.6, // Better roads = less fuel consumption
      'Traffic': 0.8, // Fixed traffic signals = reduced idling
      'Water & Utilities': 0.4, // Fixed leaks = less pumping energy
      'Electrical': 0.7, // Efficient lighting = energy savings
      'Waste Management': 0.9, // Proper waste management = methane reduction
      'default': 0.5
    };

    const factor = reductionFactors[category as keyof typeof reductionFactors] || reductionFactors.default;
    const totalEmissions = Object.values(emissions).reduce((sum: number, val: number) => sum + val, 0);
    
    return totalEmissions * factor * 365; // Annual reduction
  }

  private calculateOffsetPotential(location: { lat: number; lng: number; address: string }): number {
    // Simplified calculation based on nearby green initiatives
    let offsetPotential = 0;

    this.greenInitiatives.forEach(initiative => {
      if (initiative.type === 'tree_planting' || initiative.type === 'green_infrastructure') {
        // Simplified distance calculation (in real implementation, use proper distance formula)
        const distance = Math.abs(location.lat - (initiative.location?.lat || 0)) + 
                        Math.abs(location.lng - (initiative.location?.lng || 0));
        
        if (distance < 0.1) { // Within ~10km
          offsetPotential += initiative.impact.co2Reduction * 0.1; // 10% allocation
        }
      }
    });

    return Math.round(offsetPotential);
  }

  public trackGreenSolution(reportId: string, solutionType: 'energy_efficient' | 'sustainable_materials' | 'green_technology' | 'nature_based', impact: {
    co2Saved: number;
    energySaved?: number;
    waterSaved?: number;
    wasteReduced?: number;
  }): void {

    console.log(`🌿 Tracking green solution for report ${reportId}: ${solutionType}`);

    // Find existing carbon footprint
    const footprint = this.carbonFootprints.get(reportId);
    if (footprint) {
      footprint.estimatedReduction += impact.co2Saved;
    }

    // Update relevant metrics
    this.updateMetricValue('city_carbon_emissions', -impact.co2Saved / 1000); // Convert to tonnes

    if (impact.energySaved) {
      // Update energy efficiency metrics
      const currentRenewablePercentage = this.metrics.get('renewable_energy_usage')?.currentValue || 0;
      this.updateMetricValue('renewable_energy_usage', currentRenewablePercentage + 0.1);
    }

    if (impact.wasteReduced) {
      // Update waste metrics
      const currentRecyclingRate = this.metrics.get('waste_recycling_rate')?.currentValue || 0;
      this.updateMetricValue('waste_recycling_rate', currentRecyclingRate + 0.1);
    }

    if (impact.waterSaved) {
      // Update water metrics
      this.updateMetricValue('water_consumption', -(impact.waterSaved || 0) / 1000);
    }

    // Log the green solution
    console.log(`✅ Green solution tracked: ${impact.co2Saved.toFixed(2)} kg CO2 saved`);
  }

  private updateMetricValue(metricId: string, change: number): void {
    const metric = this.metrics.get(metricId);
    if (metric) {
      metric.currentValue += change;
      metric.lastUpdated = new Date();
      
      // Update trend
      if (metric.target) {
        const progressBefore = this.calculateProgress(metric.currentValue - change, metric.baseline, metric.target);
        const progressAfter = this.calculateProgress(metric.currentValue, metric.baseline, metric.target);
        
        if (progressAfter > progressBefore) {
          metric.trend = 'improving';
        } else if (progressAfter < progressBefore) {
          metric.trend = 'declining';
        } else {
          metric.trend = 'stable';
        }
      }
    }
  }

  private calculateProgress(current: number, baseline?: number, target?: number): number {
    if (!baseline || !target) return 0;
    
    if (target > baseline) {
      return Math.max(0, Math.min(100, ((current - baseline) / (target - baseline)) * 100));
    } else {
      return Math.max(0, Math.min(100, ((baseline - current) / (baseline - target)) * 100));
    }
  }

  private updateEnvironmentalMetrics(): void {
    // Simulate real-time updates to environmental metrics
    this.metrics.forEach(metric => {
      // Small random fluctuations
      const fluctuation = (Math.random() - 0.5) * (metric.currentValue * 0.01);
      metric.currentValue += fluctuation;
      metric.lastUpdated = new Date();
    });
  }

  private checkEnvironmentalAlerts(): void {
    // Check for environmental threshold breaches
    this.metrics.forEach((metric, metricId) => {
      if (metric.trend === 'declining' && metric.target) {
        const progress = this.calculateProgress(metric.currentValue, metric.baseline, metric.target);
        
        if (progress < 20) { // Less than 20% progress toward target
          this.createEnvironmentalAlert({
            type: 'target_missed',
            severity: 'warning',
            title: `${metric.name} Target at Risk`,
            message: `Current progress toward ${metric.name} target is only ${progress.toFixed(1)}%`,
            affectedMetrics: [metricId]
          });
        }
      }
    });
  }

  private createEnvironmentalAlert(alertData: Omit<EnvironmentalAlert, 'id' | 'triggeredAt'>): void {
    const alert: EnvironmentalAlert = {
      ...alertData,
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggeredAt: new Date(),
      actionsTaken: []
    };

    this.environmentalAlerts.set(alert.id, alert);
    console.log(`🚨 Environmental alert created: ${alert.title}`);
  }

  private updateInitiativeProgress(): void {
    this.greenInitiatives.forEach(initiative => {
      if (initiative.status === 'active') {
        // Simulate progress updates
        const dailyProgress = Math.random() * 2; // 0-2% daily progress
        initiative.progress.percentComplete = Math.min(100, initiative.progress.percentComplete + dailyProgress);
        
        // Update milestones
        const expectedMilestones = Math.floor((initiative.progress.percentComplete / 100) * initiative.progress.totalMilestones);
        initiative.progress.milestonesCompleted = Math.min(expectedMilestones, initiative.progress.totalMilestones);
        
        // Update status if complete
        if (initiative.progress.percentComplete >= 100) {
          initiative.status = 'completed';
          console.log(`✅ Green initiative completed: ${initiative.title}`);
        }
      }
    });
  }

  private updateSustainabilityGoals(): void {
    this.sustainabilityGoals.forEach(goal => {
      // Update KPIs based on current metrics
      goal.kpis.forEach(kpi => {
        const relatedMetric = this.findMetricByName(kpi.metric);
        if (relatedMetric) {
          kpi.currentValue = relatedMetric.currentValue;
          kpi.progress = this.calculateProgress(kpi.currentValue, 
            kpi.targetValue > kpi.currentValue ? 0 : kpi.targetValue * 2, 
            kpi.targetValue);
        }
      });

      // Update overall progress
      const avgKpiProgress = goal.kpis.reduce((sum, kpi) => sum + kpi.progress, 0) / goal.kpis.length;
      goal.currentProgress = Math.round(avgKpiProgress);

      // Check milestone completion
      goal.milestones.forEach(milestone => {
        if (!milestone.completed && goal.currentProgress >= milestone.impact) {
          milestone.completed = true;
          milestone.completedDate = new Date();
          console.log(`🎯 Milestone completed: ${milestone.name} for goal ${goal.name}`);
        }
      });
    });
  }

  private findMetricByName(name: string): EnvironmentalMetric | null {
    for (const metric of this.metrics.values()) {
      if (metric.name.toLowerCase().includes(name.toLowerCase()) || 
          name.toLowerCase().includes(metric.name.toLowerCase())) {
        return metric;
      }
    }
    return null;
  }

  // Public API methods

  public getEnvironmentalMetrics(): EnvironmentalMetric[] {
    return Array.from(this.metrics.values());
  }

  public getMetric(metricId: string): EnvironmentalMetric | null {
    return this.metrics.get(metricId) || null;
  }

  public getCarbonFootprint(reportId: string): CarbonFootprintData | null {
    return this.carbonFootprints.get(reportId) || null;
  }

  public getGreenInitiatives(status?: GreenInitiative['status']): GreenInitiative[] {
    const initiatives = Array.from(this.greenInitiatives.values());
    return status ? initiatives.filter(i => i.status === status) : initiatives;
  }

  public getGreenInitiative(initiativeId: string): GreenInitiative | null {
    return this.greenInitiatives.get(initiativeId) || null;
  }

  public getSustainabilityGoals(): SustainabilityGoal[] {
    return Array.from(this.sustainabilityGoals.values());
  }

  public getSustainabilityGoal(goalId: string): SustainabilityGoal | null {
    return this.sustainabilityGoals.get(goalId) || null;
  }

  public getEnvironmentalAlerts(severity?: EnvironmentalAlert['severity']): EnvironmentalAlert[] {
    const alerts = Array.from(this.environmentalAlerts.values());
    return severity ? alerts.filter(a => a.severity === severity) : alerts;
  }

  public getClimateAdaptationPlans(): ClimateAdaptationPlan[] {
    return Array.from(this.climateAdaptationPlans.values());
  }

  public getClimateAdaptationPlan(planId: string): ClimateAdaptationPlan | null {
    return this.climateAdaptationPlans.get(planId) || null;
  }

  public getEnvironmentalDashboard(): {
    metrics: EnvironmentalMetric[];
    initiatives: Array<{ name: string; progress: number; impact: string }>;
    goals: Array<{ name: string; progress: number; target: string }>;
    alerts: Array<{ title: string; severity: string; age: number }>;
    carbonSummary: {
      totalEmissions: number;
      reductionPotential: number;
      offsetAvailable: number;
    };
  } {
    const metrics = this.getEnvironmentalMetrics();
    
    const initiatives = this.getGreenInitiatives('active').map(initiative => ({
      name: initiative.title,
      progress: initiative.progress.percentComplete,
      impact: `${initiative.impact.co2Reduction.toLocaleString()} kg CO2/year reduction`
    }));

    const goals = this.getSustainabilityGoals().map(goal => ({
      name: goal.name,
      progress: goal.currentProgress,
      target: goal.targetDate.toLocaleDateString()
    }));

    const alerts = this.getEnvironmentalAlerts().map(alert => ({
      title: alert.title,
      severity: alert.severity,
      age: Math.floor((Date.now() - alert.triggeredAt.getTime()) / (1000 * 60 * 60)) // hours
    }));

    const footprints = Array.from(this.carbonFootprints.values());
    const carbonSummary = {
      totalEmissions: footprints.reduce((sum, fp) => sum + Object.values(fp.emissions).reduce((s, e) => s + e, 0), 0),
      reductionPotential: footprints.reduce((sum, fp) => sum + fp.estimatedReduction, 0),
      offsetAvailable: footprints.reduce((sum, fp) => sum + fp.offsetPotential, 0)
    };

    return {
      metrics,
      initiatives: initiatives.slice(0, 5), // Top 5
      goals: goals.slice(0, 3), // Top 3
      alerts: alerts.slice(0, 10), // Recent 10
      carbonSummary
    };
  }

  public addGreenInitiative(initiative: Omit<GreenInitiative, 'id' | 'progress'>): string {
    const initiativeId = `initiative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newInitiative: GreenInitiative = {
      ...initiative,
      id: initiativeId,
      progress: {
        percentComplete: 0,
        milestonesCompleted: 0,
        totalMilestones: 20, // Default
        currentPhase: 'Planning'
      }
    };

    this.greenInitiatives.set(initiativeId, newInitiative);
    console.log(`🌱 New green initiative added: ${newInitiative.title}`);
    
    return initiativeId;
  }

  public updateInitiativeProgress(initiativeId: string, progress: Partial<GreenInitiative['progress']>): boolean {
    const initiative = this.greenInitiatives.get(initiativeId);
    if (!initiative) return false;

    initiative.progress = { ...initiative.progress, ...progress };
    
    if (initiative.progress.percentComplete >= 100 && initiative.status === 'active') {
      initiative.status = 'completed';
    }

    console.log(`📈 Initiative progress updated: ${initiative.title} - ${initiative.progress.percentComplete}%`);
    return true;
  }

  public resolveEnvironmentalAlert(alertId: string, actions: string[]): boolean {
    const alert = this.environmentalAlerts.get(alertId);
    if (!alert) return false;

    alert.resolvedAt = new Date();
    alert.actionsTaken = actions;

    console.log(`✅ Environmental alert resolved: ${alert.title}`);
    return true;
  }

  public generateEnvironmentalReport(timeframe: 'daily' | 'weekly' | 'monthly' | 'quarterly'): {
    period: string;
    summary: {
      metricsImproved: number;
      metricsDeclined: number;
      initiativesCompleted: number;
      carbonReduced: number;
    };
    recommendations: string[];
    achievements: string[];
  } {
    const now = new Date();
    const metrics = this.getEnvironmentalMetrics();
    
    const improvingMetrics = metrics.filter(m => m.trend === 'improving').length;
    const decliningMetrics = metrics.filter(m => m.trend === 'declining').length;
    
    const completedInitiatives = this.getGreenInitiatives('completed').length;
    const totalCarbonReduction = Array.from(this.carbonFootprints.values())
      .reduce((sum, fp) => sum + fp.estimatedReduction, 0);

    const recommendations: string[] = [];
    const achievements: string[] = [];

    // Generate recommendations based on declining metrics
    metrics.filter(m => m.trend === 'declining').forEach(metric => {
      recommendations.push(`Implement action plan for improving ${metric.name}`);
    });

    // Generate achievements based on completed initiatives
    this.getGreenInitiatives('completed').forEach(initiative => {
      achievements.push(`Completed ${initiative.title} with ${initiative.impact.co2Reduction.toLocaleString()} kg CO2/year reduction`);
    });

    return {
      period: `${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Report - ${now.toLocaleDateString()}`,
      summary: {
        metricsImproved: improvingMetrics,
        metricsDeclined: decliningMetrics,
        initiativesCompleted: completedInitiatives,
        carbonReduced: Math.round(totalCarbonReduction)
      },
      recommendations: recommendations.slice(0, 5),
      achievements: achievements.slice(0, 3)
    };
  }
}

export const environmentalImpactService = new EnvironmentalImpactService();
export default environmentalImpactService;