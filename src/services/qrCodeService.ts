import QRCode from 'qrcode';

export interface QRLocationData {
  id: string;
  name: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  commonIssues: string[];
  lastReported?: Date;
  reportCount: number;
  averageResolutionTime: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  departmentResponsible: string;
  qrCode: string;
  arMarkers?: {
    previousReports: Array<{
      title: string;
      status: 'resolved' | 'in-progress' | 'pending';
      date: Date;
    }>;
  };
}

export interface QRScanResult {
  locationId: string;
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  prefillData: {
    location: string;
    suggestedCategories: string[];
    commonIssues: string[];
  };
  historicalData: {
    totalReports: number;
    resolvedReports: number;
    avgResolutionDays: number;
    lastActivity: Date;
  };
  recommendations: {
    bestTimeToReport: string;
    expectedResponse: string;
    similarIssues: string[];
  };
}

class QRCodeService {
  private locationRegistry: Map<string, QRLocationData> = new Map();
  private baseUrl = window.location.origin;

  constructor() {
    this.initializeDemoLocations();
  }

  private initializeDemoLocations() {
    const demoLocations: QRLocationData[] = [
      {
        id: 'mumbai-bandra-station',
        name: 'Bandra Railway Station West',
        coordinates: { lat: 19.0544, lng: 72.8406 },
        address: 'Bandra West, Mumbai, Maharashtra 400050',
        commonIssues: ['Crowd Management', 'Cleanliness', 'Platform Safety'],
        reportCount: 23,
        averageResolutionTime: 5,
        priority: 'high',
        departmentResponsible: 'Railway Authority & BMC',
        qrCode: '',
        arMarkers: {
          previousReports: [
            { title: 'Platform Overcrowding', status: 'resolved', date: new Date('2024-01-15') },
            { title: 'Water Logging', status: 'in-progress', date: new Date('2024-01-20') }
          ]
        }
      },
      {
        id: 'mumbai-marine-drive',
        name: 'Marine Drive Promenade',
        coordinates: { lat: 18.9435, lng: 72.8234 },
        address: 'Marine Drive, Mumbai, Maharashtra 400002',
        commonIssues: ['Street Lighting', 'Waste Management', 'Road Maintenance'],
        reportCount: 12,
        averageResolutionTime: 7,
        priority: 'medium',
        departmentResponsible: 'BMC Public Works',
        qrCode: '',
        arMarkers: {
          previousReports: [
            { title: 'Broken Street Light', status: 'resolved', date: new Date('2024-01-10') },
            { title: 'Litter on Walkway', status: 'resolved', date: new Date('2024-01-18') }
          ]
        }
      },
      {
        id: 'mumbai-juhu-beach',
        name: 'Juhu Beach Area',
        coordinates: { lat: 19.0883, lng: 72.8265 },
        address: 'Juhu Beach, Mumbai, Maharashtra 400049',
        commonIssues: ['Beach Cleanliness', 'Public Facilities', 'Traffic Management'],
        reportCount: 34,
        averageResolutionTime: 4,
        priority: 'high',
        departmentResponsible: 'BMC & Tourism Dept',
        qrCode: '',
        arMarkers: {
          previousReports: [
            { title: 'Plastic Waste on Beach', status: 'resolved', date: new Date('2024-01-12') },
            { title: 'Broken Changing Room', status: 'in-progress', date: new Date('2024-01-22') }
          ]
        }
      },
      {
        id: 'mumbai-andheri-market',
        name: 'Andheri West Market',
        coordinates: { lat: 19.1136, lng: 72.8697 },
        address: 'Andheri West, Mumbai, Maharashtra 400053',
        commonIssues: ['Drainage Issues', 'Waste Overflow', 'Traffic Congestion'],
        reportCount: 41,
        averageResolutionTime: 6,
        priority: 'urgent',
        departmentResponsible: 'BMC Ward Office',
        qrCode: '',
        arMarkers: {
          previousReports: [
            { title: 'Blocked Storm Drain', status: 'pending', date: new Date('2024-01-25') },
            { title: 'Overflowing Garbage', status: 'in-progress', date: new Date('2024-01-23') }
          ]
        }
      },
      {
        id: 'mumbai-worli-sealink',
        name: 'Worli Sea Link Plaza',
        coordinates: { lat: 19.0176, lng: 72.8138 },
        address: 'Worli, Mumbai, Maharashtra 400018',
        commonIssues: ['Infrastructure Maintenance', 'Public Safety', 'Traffic Signals'],
        reportCount: 8,
        averageResolutionTime: 10,
        priority: 'medium',
        departmentResponsible: 'MSRDC & Traffic Police',
        qrCode: '',
        arMarkers: {
          previousReports: [
            { title: 'Toll Plaza Issue', status: 'resolved', date: new Date('2024-01-08') }
          ]
        }
      }
    ];

    // Generate QR codes for each location
    demoLocations.forEach(async (location) => {
      location.qrCode = await this.generateLocationQR(location.id);
      this.locationRegistry.set(location.id, location);
    });
  }

  public async generateLocationQR(locationId: string, customData?: Partial<QRLocationData>): Promise<string> {
    const qrData = {
      type: 'urban_guardians_location',
      version: '1.0',
      locationId,
      timestamp: Date.now(),
      reportUrl: `${this.baseUrl}/report?qr=${locationId}`,
      customData
    };

    try {
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#1f2937',
          light: '#ffffff',
        },
        width: 256
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  public async scanQRCode(qrData: string): Promise<QRScanResult | null> {
    try {
      const parsed = JSON.parse(qrData);
      
      if (parsed.type !== 'urban_guardians_location') {
        throw new Error('Invalid QR code type');
      }

      const location = this.locationRegistry.get(parsed.locationId);
      if (!location) {
        throw new Error('Location not found');
      }

      return this.buildScanResult(location);
    } catch (error) {
      console.error('Error scanning QR code:', error);
      return null;
    }
  }

  public getLocationByQR(locationId: string): QRLocationData | null {
    return this.locationRegistry.get(locationId) || null;
  }

  public getAllLocations(): QRLocationData[] {
    return Array.from(this.locationRegistry.values());
  }

  public getLocationsByArea(centerLat: number, centerLng: number, radiusKm: number = 5): QRLocationData[] {
    const locations = Array.from(this.locationRegistry.values());
    
    return locations.filter(location => {
      const distance = this.calculateDistance(
        centerLat, centerLng,
        location.coordinates.lat, location.coordinates.lng
      );
      return distance <= radiusKm;
    });
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLng = this.deg2rad(lng2 - lng1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

  private buildScanResult(location: QRLocationData): QRScanResult {
    const resolvedCount = location.arMarkers?.previousReports.filter(r => r.status === 'resolved').length || 0;
    
    return {
      locationId: location.id,
      locationName: location.name,
      coordinates: location.coordinates,
      prefillData: {
        location: location.address,
        suggestedCategories: this.getCategoriesFromIssues(location.commonIssues),
        commonIssues: location.commonIssues
      },
      historicalData: {
        totalReports: location.reportCount,
        resolvedReports: resolvedCount,
        avgResolutionDays: location.averageResolutionTime,
        lastActivity: location.lastReported || new Date()
      },
      recommendations: {
        bestTimeToReport: this.getBestReportingTime(location),
        expectedResponse: this.getExpectedResponse(location),
        similarIssues: location.commonIssues.slice(0, 3)
      }
    };
  }

  private getCategoriesFromIssues(issues: string[]): string[] {
    const categoryMap: { [key: string]: string } = {
      'Street Lighting': 'Lighting',
      'Waste Management': 'Waste Management',
      'Road Maintenance': 'Road Maintenance',
      'Drainage Issues': 'Water & Utilities',
      'Traffic Management': 'Traffic',
      'Platform Safety': 'Infrastructure',
      'Crowd Management': 'Infrastructure',
      'Cleanliness': 'Waste Management',
      'Water Logging': 'Water & Utilities',
      'Public Facilities': 'Infrastructure',
      'Beach Cleanliness': 'Waste Management',
      'Traffic Congestion': 'Traffic',
      'Infrastructure Maintenance': 'Infrastructure',
      'Public Safety': 'Infrastructure',
      'Traffic Signals': 'Traffic'
    };

    return issues.map(issue => categoryMap[issue] || 'Other').filter((category, index, self) => self.indexOf(category) === index);
  }

  private getBestReportingTime(location: QRLocationData): string {
    const hour = new Date().getHours();
    
    if (hour >= 9 && hour <= 17) {
      return 'Business hours - Expected quick response';
    } else if (hour >= 6 && hour <= 9) {
      return 'Morning hours - Good for urgent issues';
    } else if (hour >= 18 && hour <= 21) {
      return 'Evening hours - Standard response time';
    } else {
      return 'Off-hours - Response may be delayed';
    }
  }

  private getExpectedResponse(location: QRLocationData): string {
    const { averageResolutionTime, priority } = location;
    
    if (priority === 'urgent') {
      return `High priority location - Expected resolution in ${averageResolutionTime} days`;
    } else if (priority === 'high') {
      return `Important location - Typically resolved in ${averageResolutionTime} days`;
    } else {
      return `Standard priority - Average resolution time ${averageResolutionTime} days`;
    }
  }

  public updateLocationStats(locationId: string, reportAdded: boolean = true): void {
    const location = this.locationRegistry.get(locationId);
    if (!location) return;

    if (reportAdded) {
      location.reportCount++;
      location.lastReported = new Date();
    }

    // Recalculate priority based on report frequency
    if (location.reportCount > 30) {
      location.priority = 'urgent';
    } else if (location.reportCount > 15) {
      location.priority = 'high';
    } else if (location.reportCount > 5) {
      location.priority = 'medium';
    } else {
      location.priority = 'low';
    }

    this.locationRegistry.set(locationId, location);
  }

  public async generateBulkQRCodes(): Promise<{ [locationId: string]: string }> {
    const qrCodes: { [locationId: string]: string } = {};
    
    for (const [locationId, location] of this.locationRegistry) {
      try {
        qrCodes[locationId] = await this.generateLocationQR(locationId);
      } catch (error) {
        console.error(`Failed to generate QR for location ${locationId}:`, error);
      }
    }

    return qrCodes;
  }

  public getQRCodePrintableData(locationId: string): {
    qrCode: string;
    locationInfo: {
      name: string;
      address: string;
      instructions: string;
    };
  } | null {
    const location = this.locationRegistry.get(locationId);
    if (!location) return null;

    return {
      qrCode: location.qrCode,
      locationInfo: {
        name: location.name,
        address: location.address,
        instructions: 'Scan this QR code with Urban Guardians app to quickly report issues at this location'
      }
    };
  }

  // AR Integration Methods
  public getARMarkerData(locationId: string): QRLocationData['arMarkers'] {
    const location = this.locationRegistry.get(locationId);
    return location?.arMarkers;
  }

  public addARReport(locationId: string, report: { title: string; status: 'resolved' | 'in-progress' | 'pending'; date: Date }): void {
    const location = this.locationRegistry.get(locationId);
    if (!location) return;

    if (!location.arMarkers) {
      location.arMarkers = { previousReports: [] };
    }

    location.arMarkers.previousReports.unshift(report);
    
    // Keep only last 10 reports for AR display
    if (location.arMarkers.previousReports.length > 10) {
      location.arMarkers.previousReports = location.arMarkers.previousReports.slice(0, 10);
    }

    this.locationRegistry.set(locationId, location);
  }

  // Smart India Hackathon specific features
  public getHackathonDemoData(): {
    totalLocations: number;
    qrCodesGenerated: number;
    avgReportsPerLocation: number;
    topReportingLocations: Array<{
      name: string;
      reportCount: number;
      priority: string;
    }>;
  } {
    const locations = Array.from(this.locationRegistry.values());
    
    return {
      totalLocations: locations.length,
      qrCodesGenerated: locations.filter(l => l.qrCode).length,
      avgReportsPerLocation: locations.reduce((sum, loc) => sum + loc.reportCount, 0) / locations.length,
      topReportingLocations: locations
        .sort((a, b) => b.reportCount - a.reportCount)
        .slice(0, 5)
        .map(loc => ({
          name: loc.name,
          reportCount: loc.reportCount,
          priority: loc.priority
        }))
    };
  }
}

export const qrCodeService = new QRCodeService();
export default qrCodeService;