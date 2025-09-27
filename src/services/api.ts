// API service layer for backend operations
// Real HTTP calls to Node.js/Express backend

interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'citizen' | 'admin';
  civicPoints?: number;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  stats?: {
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
  };
  createdAt: string;
  token?: string;
}

interface Report {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'acknowledged' | 'in-progress' | 'resolved' | 'rejected';
  userId: string;
  location: {
    address: string;
    city?: string;
    state?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images?: Array<{
    url: string;
    caption?: string;
  }>;
  upvotes?: Array<{
    userId: string;
    createdAt: string;
  }>;
  comments?: Array<{
    userId: string;
    text: string;
    createdAt: string;
  }>;
  department?: string;
  assignedTo?: string;
  statusHistory?: Array<{
    status: string;
    changedBy: string;
    reason?: string;
    changedAt: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private readonly BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  
  private readonly CURRENT_USER_KEY = 'civic_current_user';
  private readonly TOKEN_KEY = 'civic_auth_token';

  // HTTP client with authentication
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${this.BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        const extra = errorData.details ? ` | details: ${JSON.stringify(errorData.details)}` : (errorData.error ? ` | error: ${errorData.error}` : '');
        const message = errorData.message || errorData.error || 'Request failed';
        throw new Error(`[${response.status}] ${message}${extra}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Map low-level network errors to a clearer message
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Network request failed')) {
        throw new Error(`Unable to connect to server. Please ensure the backend is running at ${this.BASE_URL}.`);
      }
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Token management
  private getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // User Authentication
  async signUp(userData: SignUpData): Promise<User> {
    // Try primary endpoint first
    try {
      const response = await this.request<any>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Normalize different backend shapes: {data:{user,token}} OR {success, user, token}
      const user: User | undefined = response?.data?.user || response?.user;
      const token: string | undefined = response?.data?.token || response?.token;

      if (user && token) {
        this.setToken(token);
        this.setCurrentUser(user);
        return user;
      }

      throw new Error(response?.error || 'Signup failed');
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      // If the endpoint is missing (e.g., demo server uses /auth/register), try fallback once
      if (msg.includes('[404]') || msg.includes('not found') || msg.includes('endpoint')) {
        const response = await this.request<any>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(userData),
        });

        const user: User | undefined = response?.data?.user || response?.user;
        const token: string | undefined = response?.data?.token || response?.token;

        if (user && token) {
          this.setToken(token);
          this.setCurrentUser(user);
          return user;
        }
        throw new Error(response?.error || 'Signup failed');
      }
      throw err;
    }
  }

  async signIn(credentials: LoginCredentials): Promise<User> {
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    // Normalize shapes: {data:{user,token}} OR {success, user, token}
    const user: User | undefined = response?.data?.user || response?.user;
    const token: string | undefined = response?.data?.token || response?.token;

    if (user && token) {
      this.setToken(token);
      this.setCurrentUser(user);
      return user;
    }
    
    throw new Error(response?.error || 'Login failed');
  }

  async signOut(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.warn('Logout request failed, clearing local session anyway', error);
    } finally {
      this.removeToken();
      localStorage.removeItem(this.CURRENT_USER_KEY);
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
  }

  // Check if email exists (useful for better UX)
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response = await this.request<ApiResponse<{ exists: boolean }>>(`/auth/check-email?email=${encodeURIComponent(email)}`);
      return response.data?.exists || false;
    } catch (error) {
      return false;
    }
  }

  // Reports Management
  async createReport(reportData: Omit<Report, '_id' | 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
    // Prepare payload with location normalization (do not remap category on first attempt)
    const payload: any = { ...reportData };
    if (typeof payload.location === 'string') {
      payload.location = { address: payload.location };
    }

    const tryCreate = async (body: any) => {
      const response = await this.request<any>('/reports', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      let report: any = response?.data?.report || response?.data || response?.report;
      if (report) {
        return this.normalizeReportCoordinates(report) as Report;
      }
      throw new Error(response?.error || 'Failed to create report');
    };

    try {
      // First attempt: send category as-is (works for the local server schema)
      return await tryCreate(payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : '';
      // If the backend rejects category enum, try backend variant mappings and retry once
      if (msg.includes('not a valid enum value') || msg.includes('validation failed') || msg.includes('enum')) {
        const remapCategory = (cat: string) => {
          const map: Record<string, string> = {
            // Canonical UI values
            'Road Maintenance': 'Infrastructure',
            'Water & Utilities': 'Water & Sanitation',
            'Lighting': 'Infrastructure',
            'Vandalism': 'Public Safety',
            'Traffic': 'Transportation',
            'Waste Management': 'Waste Management',
            'Infrastructure': 'Infrastructure',
            'Other': 'Other',
            // Synonyms/labels that may appear from translations or UI tweaks
            'Street Lighting': 'Infrastructure',
            'Traffic & Signals': 'Transportation',
            'Water and Utilities': 'Water & Sanitation',
            'Water & Sanitation': 'Water & Sanitation',
            'Public Safety': 'Public Safety',
            'Transportation': 'Transportation',
            'Utilities': 'Utilities',
          };
          return map[cat] || cat;
        };
        const retryPayload = { ...payload, category: remapCategory(payload.category) };
        try {
          return await tryCreate(retryPayload);
        } catch (secondErr) {
          // Fall through to offline/save handling below
          err = secondErr;
        }
      }

      // Offline handling for network errors only
      if (err instanceof Error && err.message.includes('Failed to fetch')) {
        const offlineReport = {
          ...payload,
          location: typeof payload.location === 'string' ? { address: payload.location } : payload.location,
          id: this.generateOfflineId(),
          _id: this.generateOfflineId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          _offline: true,
        };
        this.storeOfflineReport(offlineReport);
        throw new Error('Unable to connect to server. Your report has been saved offline and will be submitted when connection is restored.');
      }

      throw err;
    }
  }

  // Ensure coordinates.lat/lng exist regardless of backend coordinate shape
  private normalizeReportCoordinates(r: any): any {
    if (!r || !r.location) return r;
    const loc = r.location;
    // If GeoJSON present: { coordinates: [lng, lat] }
    if (loc.coordinates && Array.isArray((loc.coordinates as any).coordinates)) {
      const arr = (loc.coordinates as any).coordinates as number[];
      const lng = Number(arr[0]);
      const lat = Number(arr[1]);
      r.location.coordinates = { lat, lng } as any;
    } else if (loc.coordinates && typeof (loc.coordinates as any).lat === 'number' && typeof (loc.coordinates as any).lng === 'number') {
      // already normalized
    } else if (Array.isArray(loc.coordinates)) {
      // Bare array [lng, lat]
      const arr = loc.coordinates as number[];
      r.location.coordinates = { lat: Number(arr[1]), lng: Number(arr[0]) } as any;
    }
    return r;
  }

  // Normalize various API response shapes to a plain array of reports
  private normalizeReportsResponse(resp: any): Report[] {
    const arr = (() => {
      if (!resp) return [];
      if (Array.isArray(resp)) return resp as Report[];
      if (Array.isArray(resp.data)) return resp.data as Report[];
      if (Array.isArray(resp.reports)) return resp.reports as Report[];
      if (resp.data?.reports && Array.isArray(resp.data.reports)) return resp.data.reports as Report[];
      return [];
    })();

    // Normalize coords
    return arr.map((r: any) => this.normalizeReportCoordinates(r));
  }

  async getUserReports(userId?: string): Promise<Report[]> {
    try {
      const endpoint = userId ? `/reports/user/${userId}` : '/reports/my';
      const response = await this.request<any>(endpoint);
      const onlineReports = this.normalizeReportsResponse(response);
      
      // Add offline reports for current user
      const currentUser = this.getCurrentUser();
      const offlineReports = this.getOfflineReports().filter(r => 
        r.userId === (userId || currentUser?.id || currentUser?._id)
      );
      
      return [...onlineReports, ...offlineReports];
    } catch (error) {
      console.warn('Backend unavailable, showing offline reports only', error);
      const currentUser = this.getCurrentUser();
      return this.getOfflineReports().filter(r => 
        r.userId === (userId || currentUser?.id || currentUser?._id)
      );
    }
  }

  async getAllReports(): Promise<Report[]> {
    try {
      const response = await this.request<any>('/reports');
      const onlineReports = this.normalizeReportsResponse(response);
      
      // Also include offline reports in the list
      const offlineReports = this.getOfflineReports();
      return [...onlineReports, ...offlineReports];
    } catch (error) {
      console.warn('Backend unavailable, showing offline reports only', error);
      // Return only offline reports if backend is unavailable
      return this.getOfflineReports();
    }
  }

  async updateReportStatus(reportId: string, status: Report['status'], reason?: string): Promise<Report> {
    const response = await this.request<any>(`/reports/${reportId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });

    // Accept both {data: Report} and {data: {report}}
    if (response?.data?.report) return response.data.report as Report;
    if (response?.data) return response.data as Report;
    if (response?.report) return response.report as Report;
    
    throw new Error(response?.error || 'Failed to update report status');
  }

  async getReport(reportId: string): Promise<Report> {
    const response = await this.request<any>(`/reports/${reportId}`);
    
    let rep: any = response?.data?.report || response?.data || response?.report;
    if (rep) return this.normalizeReportCoordinates(rep) as Report;
    
    throw new Error(response?.error || 'Report not found');
  }

  // Community features
  async upvoteReport(reportId: string): Promise<Report> {
    const response = await this.request<any>(`/reports/${reportId}/upvote`, {
      method: 'POST',
    });

    // Some backends return the full report, others return { upvoted, upvoteCount }
    let rep: any = response?.data?.report || (response?.data && (response.data as any)._id && response.data) || (response?._id && response);
    if (rep) return this.normalizeReportCoordinates(rep) as Report;

    // Fallback: fetch the updated report
    return this.getReport(reportId);
  }

  async addComment(reportId: string, text: string): Promise<Report> {
    const response = await this.request<any>(`/reports/${reportId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });

    let rep: any = response?.data?.report || (response?.data && (response.data as any)._id && response.data) || (response?._id && response);
    if (rep) return this.normalizeReportCoordinates(rep) as Report;
    
    // Fallback
    return this.getReport(reportId);
  }

  // Image upload
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${this.BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        ...(this.getToken() && { Authorization: `Bearer ${this.getToken()}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.data?.url || data.url;
  }

  // Analytics
  async getAnalytics(): Promise<any> {
    const response = await this.request<ApiResponse<any>>('/analytics');
    return response.data || {};
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.request('/health');
      return true;
    } catch (error) {
      return false;
    }
  }


  // Offline support methods
  private generateOfflineId(): string {
    return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  private storeOfflineReport(report: any): void {
    const offlineReports = this.getOfflineReports();
    offlineReports.push(report);
    localStorage.setItem('civic_offline_reports', JSON.stringify(offlineReports));
  }
  
  private getOfflineReports(): any[] {
    const stored = localStorage.getItem('civic_offline_reports');
    return stored ? JSON.parse(stored) : [];
  }
  
  public getOfflineReportsCount(): number {
    return this.getOfflineReports().length;
  }
  
  public async syncOfflineReports(): Promise<void> {
    const offlineReports = this.getOfflineReports();
    if (offlineReports.length === 0) return;
    
    const synced = [];
    for (const report of offlineReports) {
      try {
        // Remove offline-specific fields
        const { _offline, id, _id, createdAt, updatedAt, ...cleanReport } = report;
        await this.createReport(cleanReport);
        synced.push(report);
      } catch (error) {
        console.warn('Failed to sync report:', error);
        break; // Stop syncing if we hit an error
      }
    }
    
    // Remove synced reports from offline storage
    if (synced.length > 0) {
      const remaining = offlineReports.filter(r => !synced.includes(r));
      localStorage.setItem('civic_offline_reports', JSON.stringify(remaining));
    }
  }

  // Utility method to check authentication
  isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
  }

  // Get user profile
  async getProfile(): Promise<User> {
    const response = await this.request<ApiResponse<User>>('/users/profile');
    
    if (response.data) {
      this.setCurrentUser(response.data);
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to get profile');
  }

  // Update user profile
  async updateProfile(profileData: Partial<User>): Promise<User> {
    const response = await this.request<ApiResponse<User>>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });

    if (response.data) {
      this.setCurrentUser(response.data);
      return response.data;
    }
    
    throw new Error(response.error || 'Failed to update profile');
  }
}

// Export singleton instance
export const apiService = new ApiService();
export type { User, Report, LoginCredentials, SignUpData };