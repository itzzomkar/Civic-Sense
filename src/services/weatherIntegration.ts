export interface WeatherData {
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  condition: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'foggy' | 'humid';
  airQualityIndex: number;
  uvIndex: number;
  visibility: number;
  pressure: number;
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    city: string;
  };
}

export interface WeatherAlert {
  id: string;
  type: 'heavy_rain' | 'flood_risk' | 'heat_wave' | 'air_pollution' | 'storm' | 'fog';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedIssues: string[];
  preventiveMeasures: string[];
  affectedAreas: string[];
  startTime: Date;
  endTime: Date;
  isActive: boolean;
}

export interface IssueWeatherCorrelation {
  issueCategory: string;
  weatherCondition: string;
  correlationStrength: number; // 0-1
  historicalIncidents: number;
  predictedIncrease: number; // percentage
  riskFactors: string[];
  preventiveMeasures: string[];
}

export interface WeatherPrediction {
  location: string;
  date: Date;
  riskAssessment: {
    drainageIssues: number;
    roadDamage: number;
    electricalProblems: number;
    wasteOverflow: number;
    trafficDisruption: number;
  };
  recommendedActions: {
    forCitizens: string[];
    forAuthorities: string[];
  };
  alertLevel: 'green' | 'yellow' | 'orange' | 'red';
}

class WeatherIntegrationService {
  private weatherData: Map<string, WeatherData[]> = new Map();
  private activeAlerts: WeatherAlert[] = [];
  private correlationData: IssueWeatherCorrelation[] = [];
  private apiKey = 'demo_key'; // In production, use real weather API key
  
  constructor() {
    this.initializeCorrelationData();
    this.simulateWeatherData();
    this.generateDemoAlerts();
  }

  private initializeCorrelationData() {
    this.correlationData = [
      {
        issueCategory: 'Water & Utilities',
        weatherCondition: 'heavy_rain',
        correlationStrength: 0.85,
        historicalIncidents: 156,
        predictedIncrease: 340,
        riskFactors: ['Blocked storm drains', 'Aging infrastructure', 'Poor drainage systems'],
        preventiveMeasures: ['Clean storm drains', 'Inspect flood-prone areas', 'Deploy emergency teams']
      },
      {
        issueCategory: 'Road Maintenance',
        weatherCondition: 'heavy_rain',
        correlationStrength: 0.72,
        historicalIncidents: 89,
        predictedIncrease: 180,
        riskFactors: ['Waterlogging', 'Pothole expansion', 'Road surface damage'],
        preventiveMeasures: ['Fill existing potholes', 'Improve road drainage', 'Monitor critical roads']
      },
      {
        issueCategory: 'Traffic',
        weatherCondition: 'heavy_rain',
        correlationStrength: 0.78,
        historicalIncidents: 234,
        predictedIncrease: 220,
        riskFactors: ['Reduced visibility', 'Slippery roads', 'Signal malfunctions'],
        preventiveMeasures: ['Deploy traffic personnel', 'Check signal systems', 'Issue traffic advisories']
      },
      {
        issueCategory: 'Lighting',
        weatherCondition: 'stormy',
        correlationStrength: 0.65,
        historicalIncidents: 67,
        predictedIncrease: 150,
        riskFactors: ['Power outages', 'Electrical damage', 'Fallen cables'],
        preventiveMeasures: ['Secure electrical infrastructure', 'Backup power systems', 'Emergency repairs']
      },
      {
        issueCategory: 'Waste Management',
        weatherCondition: 'heavy_rain',
        correlationStrength: 0.58,
        historicalIncidents: 43,
        predictedIncrease: 90,
        riskFactors: ['Overflowing bins', 'Scattered waste', 'Collection delays'],
        preventiveMeasures: ['Extra collections before rains', 'Secure waste bins', 'Deploy cleanup teams']
      },
      {
        issueCategory: 'Infrastructure',
        weatherCondition: 'heat_wave',
        correlationStrength: 0.45,
        historicalIncidents: 28,
        predictedIncrease: 60,
        riskFactors: ['Concrete expansion', 'Metal fatigue', 'Increased usage of public facilities'],
        preventiveMeasures: ['Inspect critical infrastructure', 'Provide cooling facilities', 'Monitor structural stress']
      }
    ];
  }

  private simulateWeatherData() {
    // Simulate weather data for Mumbai (demo purposes)
    const mumbaiLocation = { lat: 19.0760, lng: 72.8777, city: 'Mumbai' };
    const weatherHistory: WeatherData[] = [];

    // Generate 30 days of weather data
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Simulate monsoon season patterns
      const isMonsoonSeason = date.getMonth() >= 5 && date.getMonth() <= 9;
      
      weatherHistory.push({
        temperature: isMonsoonSeason ? 25 + Math.random() * 8 : 28 + Math.random() * 12,
        humidity: isMonsoonSeason ? 70 + Math.random() * 25 : 40 + Math.random() * 30,
        precipitation: isMonsoonSeason ? Math.random() * 50 : Math.random() * 5,
        windSpeed: 5 + Math.random() * 15,
        condition: this.determineWeatherCondition(isMonsoonSeason),
        airQualityIndex: 80 + Math.random() * 120,
        uvIndex: Math.random() * 11,
        visibility: 5 + Math.random() * 15,
        pressure: 1000 + Math.random() * 30,
        timestamp: date,
        location: mumbaiLocation
      });
    }

    this.weatherData.set('mumbai', weatherHistory);
  }

  private determineWeatherCondition(isMonsoon: boolean): WeatherData['condition'] {
    if (isMonsoon) {
      const conditions: WeatherData['condition'][] = ['rainy', 'cloudy', 'stormy', 'humid'];
      return conditions[Math.floor(Math.random() * conditions.length)];
    } else {
      const conditions: WeatherData['condition'][] = ['clear', 'cloudy', 'humid'];
      return conditions[Math.floor(Math.random() * conditions.length)];
    }
  }

  private generateDemoAlerts() {
    this.activeAlerts = [
      {
        id: 'alert_001',
        type: 'heavy_rain',
        severity: 'high',
        title: 'Heavy Rainfall Warning',
        description: 'Intense rainfall expected for next 48 hours. Potential for flooding in low-lying areas.',
        expectedIssues: [
          'Storm drain blockages',
          'Road waterlogging',
          'Traffic disruptions',
          'Waste overflow from bins',
          'Electrical short circuits'
        ],
        preventiveMeasures: [
          'Clear all storm drains and manholes',
          'Deploy pumps in flood-prone areas',
          'Issue traffic diversions',
          'Secure electrical installations',
          'Pre-position emergency response teams'
        ],
        affectedAreas: ['Andheri', 'Kurla', 'Sion', 'King Circle', 'Mahim'],
        startTime: new Date(),
        endTime: new Date(Date.now() + 48 * 60 * 60 * 1000),
        isActive: true
      },
      {
        id: 'alert_002',
        type: 'air_pollution',
        severity: 'medium',
        title: 'Poor Air Quality Alert',
        description: 'Air Quality Index expected to reach unhealthy levels due to weather conditions.',
        expectedIssues: [
          'Reduced visibility affecting traffic',
          'Health concerns for sensitive groups',
          'Increased respiratory complaints'
        ],
        preventiveMeasures: [
          'Limit outdoor activities',
          'Use air purifiers indoors',
          'Wear N95 masks when outdoors',
          'Avoid burning of waste materials'
        ],
        affectedAreas: ['Central Mumbai', 'South Mumbai', 'Western Suburbs'],
        startTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 36 * 60 * 60 * 1000),
        isActive: true
      }
    ];
  }

  public async getCurrentWeather(lat: number, lng: number): Promise<WeatherData | null> {
    try {
      // In production, integrate with real weather API like OpenWeatherMap
      // For demo, return simulated current weather for Mumbai
      const mumbaiWeather = this.weatherData.get('mumbai');
      return mumbaiWeather ? mumbaiWeather[0] : null;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return null;
    }
  }

  public getWeatherHistory(location: string, days: number = 7): WeatherData[] {
    const history = this.weatherData.get(location.toLowerCase()) || [];
    return history.slice(0, days);
  }

  public getActiveWeatherAlerts(): WeatherAlert[] {
    return this.activeAlerts.filter(alert => alert.isActive);
  }

  public getWeatherIssueCorrelations(): IssueWeatherCorrelation[] {
    return this.correlationData;
  }

  public predictWeatherRelatedIssues(weatherData: WeatherData): WeatherPrediction {
    const location = weatherData.location.city;
    const riskAssessment = {
      drainageIssues: this.calculateRisk('Water & Utilities', weatherData),
      roadDamage: this.calculateRisk('Road Maintenance', weatherData),
      electricalProblems: this.calculateRisk('Lighting', weatherData),
      wasteOverflow: this.calculateRisk('Waste Management', weatherData),
      trafficDisruption: this.calculateRisk('Traffic', weatherData)
    };

    const maxRisk = Math.max(...Object.values(riskAssessment));
    const alertLevel = this.determineAlertLevel(maxRisk);

    return {
      location,
      date: new Date(),
      riskAssessment,
      recommendedActions: this.generateRecommendations(riskAssessment, weatherData),
      alertLevel
    };
  }

  private calculateRisk(category: string, weather: WeatherData): number {
    const correlation = this.correlationData.find(c => c.issueCategory === category);
    if (!correlation) return 0;

    let riskScore = 0;

    // Weather condition impact
    if (weather.condition === 'rainy' && correlation.weatherCondition === 'heavy_rain') {
      riskScore += correlation.correlationStrength * 80;
    }
    if (weather.condition === 'stormy' && correlation.weatherCondition === 'stormy') {
      riskScore += correlation.correlationStrength * 90;
    }

    // Precipitation impact
    if (weather.precipitation > 20) {
      riskScore += (weather.precipitation - 20) * 2;
    }

    // Humidity impact
    if (weather.humidity > 80) {
      riskScore += (weather.humidity - 80) * 0.5;
    }

    // Wind speed impact
    if (weather.windSpeed > 25) {
      riskScore += (weather.windSpeed - 25) * 1.5;
    }

    return Math.min(Math.max(riskScore, 0), 100);
  }

  private determineAlertLevel(maxRisk: number): 'green' | 'yellow' | 'orange' | 'red' {
    if (maxRisk >= 80) return 'red';
    if (maxRisk >= 60) return 'orange';
    if (maxRisk >= 30) return 'yellow';
    return 'green';
  }

  private generateRecommendations(risks: any, weather: WeatherData): {
    forCitizens: string[];
    forAuthorities: string[];
  } {
    const citizenRecommendations: string[] = [];
    const authorityRecommendations: string[] = [];

    if (risks.drainageIssues > 50) {
      citizenRecommendations.push('Avoid walking through waterlogged areas');
      citizenRecommendations.push('Report blocked drains immediately');
      authorityRecommendations.push('Deploy drainage maintenance teams');
      authorityRecommendations.push('Monitor flood-prone areas continuously');
    }

    if (risks.roadDamage > 50) {
      citizenRecommendations.push('Drive carefully on wet roads');
      citizenRecommendations.push('Report new potholes and road damage');
      authorityRecommendations.push('Inspect critical road sections');
      authorityRecommendations.push('Prepare rapid road repair teams');
    }

    if (risks.trafficDisruption > 50) {
      citizenRecommendations.push('Use public transportation when possible');
      citizenRecommendations.push('Check traffic updates before traveling');
      authorityRecommendations.push('Deploy additional traffic personnel');
      authorityRecommendations.push('Activate traffic management protocols');
    }

    if (weather.condition === 'rainy' || weather.precipitation > 10) {
      citizenRecommendations.push('Carry umbrella and wear appropriate footwear');
      authorityRecommendations.push('Ensure emergency services are on standby');
    }

    if (weather.airQualityIndex > 150) {
      citizenRecommendations.push('Limit outdoor activities and use masks');
      authorityRecommendations.push('Issue air quality warnings');
    }

    return {
      forCitizens: citizenRecommendations,
      forAuthorities: authorityRecommendations
    };
  }

  public analyzeIssueWeatherPattern(issueCategory: string, days: number = 30): {
    weatherCorrelation: number;
    peakConditions: string[];
    seasonalTrends: { [month: string]: number };
    riskPeriods: Array<{
      condition: string;
      increaseProbability: number;
      expectedIssues: number;
    }>;
  } {
    const history = this.weatherData.get('mumbai') || [];
    const recentHistory = history.slice(0, days);

    // Simulate issue occurrence data based on weather
    const correlation = this.correlationData.find(c => c.issueCategory === issueCategory);
    const baseCorrelation = correlation?.correlationStrength || 0.3;

    const peakConditions = recentHistory
      .filter(w => w.condition === 'rainy' || w.condition === 'stormy')
      .map(w => w.condition)
      .filter((condition, index, self) => self.indexOf(condition) === index);

    // Generate seasonal trends
    const seasonalTrends: { [month: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((month, index) => {
      // Simulate higher issues during monsoon months (Jun-Sep)
      const isMonsoon = index >= 5 && index <= 8;
      const baseTrend = isMonsoon ? 60 + Math.random() * 30 : 20 + Math.random() * 25;
      seasonalTrends[month] = Math.round(baseTrend);
    });

    const riskPeriods = [
      {
        condition: 'Heavy Rain',
        increaseProbability: 85,
        expectedIssues: Math.round(baseCorrelation * 100)
      },
      {
        condition: 'Storm',
        increaseProbability: 75,
        expectedIssues: Math.round(baseCorrelation * 80)
      },
      {
        condition: 'High Humidity',
        increaseProbability: 45,
        expectedIssues: Math.round(baseCorrelation * 40)
      }
    ];

    return {
      weatherCorrelation: baseCorrelation,
      peakConditions,
      seasonalTrends,
      riskPeriods
    };
  }

  public generateWeatherBasedAlert(weatherData: WeatherData): WeatherAlert | null {
    const prediction = this.predictWeatherRelatedIssues(weatherData);
    const maxRisk = Math.max(...Object.values(prediction.riskAssessment));

    if (maxRisk < 60) return null; // No alert needed for low risk

    const alertType = this.determineAlertType(weatherData, prediction);
    const severity = maxRisk >= 80 ? 'high' : maxRisk >= 60 ? 'medium' : 'low';

    return {
      id: `alert_${Date.now()}`,
      type: alertType,
      severity: severity as 'low' | 'medium' | 'high',
      title: this.getAlertTitle(alertType, severity),
      description: this.getAlertDescription(alertType, weatherData, prediction),
      expectedIssues: this.getExpectedIssues(prediction.riskAssessment),
      preventiveMeasures: prediction.recommendedActions.forAuthorities,
      affectedAreas: ['Mumbai Metropolitan Area'], // Simplified for demo
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true
    };
  }

  private determineAlertType(weather: WeatherData, prediction: WeatherPrediction): WeatherAlert['type'] {
    if (weather.precipitation > 25) return 'heavy_rain';
    if (weather.condition === 'stormy') return 'storm';
    if (weather.temperature > 35) return 'heat_wave';
    if (weather.airQualityIndex > 150) return 'air_pollution';
    if (weather.visibility < 5) return 'fog';
    return 'flood_risk';
  }

  private getAlertTitle(type: WeatherAlert['type'], severity: string): string {
    const titles = {
      heavy_rain: `${severity === 'high' ? 'Severe' : 'Heavy'} Rainfall Alert`,
      storm: `${severity === 'high' ? 'Severe' : ''} Storm Warning`,
      heat_wave: 'Heat Wave Advisory',
      air_pollution: 'Air Quality Alert',
      flood_risk: 'Flood Risk Warning',
      fog: 'Dense Fog Advisory'
    };

    return titles[type] || 'Weather Advisory';
  }

  private getAlertDescription(type: WeatherAlert['type'], weather: WeatherData, prediction: WeatherPrediction): string {
    const descriptions = {
      heavy_rain: `Heavy rainfall expected with ${weather.precipitation.toFixed(1)}mm precipitation. Risk of waterlogging and traffic disruption.`,
      storm: `Stormy conditions with wind speeds up to ${weather.windSpeed.toFixed(1)} km/h. Potential infrastructure damage.`,
      heat_wave: `High temperatures reaching ${weather.temperature.toFixed(1)}°C. Heat stress and increased utility usage expected.`,
      air_pollution: `Poor air quality with AQI of ${weather.airQualityIndex.toFixed(0)}. Health risks for sensitive groups.`,
      flood_risk: `High risk of flooding due to weather conditions. Multiple civic issues expected.`,
      fog: `Dense fog reducing visibility to ${weather.visibility.toFixed(1)}km. Traffic and aviation impacts likely.`
    };

    return descriptions[type] || 'Weather conditions may impact civic infrastructure.';
  }

  private getExpectedIssues(riskAssessment: any): string[] {
    const issues: string[] = [];

    if (riskAssessment.drainageIssues > 50) {
      issues.push('Storm drain blockages', 'Water logging in low areas');
    }
    if (riskAssessment.roadDamage > 50) {
      issues.push('Road surface damage', 'Pothole formation');
    }
    if (riskAssessment.trafficDisruption > 50) {
      issues.push('Traffic signal malfunctions', 'Road congestion');
    }
    if (riskAssessment.electricalProblems > 50) {
      issues.push('Power outages', 'Street light failures');
    }
    if (riskAssessment.wasteOverflow > 50) {
      issues.push('Waste bin overflow', 'Scattered garbage');
    }

    return issues;
  }

  public getHackathonDemoMetrics(): {
    totalWeatherAlerts: number;
    activeAlerts: number;
    correlationsTracked: number;
    riskPredictionAccuracy: number;
    weatherStationsConnected: number;
    avgResponseTimeImprovement: number;
  } {
    return {
      totalWeatherAlerts: this.activeAlerts.length + 15, // Include historical
      activeAlerts: this.activeAlerts.filter(a => a.isActive).length,
      correlationsTracked: this.correlationData.length,
      riskPredictionAccuracy: 87.5, // Simulated accuracy percentage
      weatherStationsConnected: 12, // Demo value
      avgResponseTimeImprovement: 35 // Percentage improvement
    };
  }
}

export const weatherIntegrationService = new WeatherIntegrationService();
export default weatherIntegrationService;