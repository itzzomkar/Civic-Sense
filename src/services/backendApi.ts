// API service for connecting to the Express backend
// Falls back to localStorage if backend is unavailable

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'citizen' | 'admin' | 'official';
  civicPoints?: number;
  stats?: {
    totalReports: number;
    resolvedReports: number;
    pendingReports: number;
    upvotesReceived: number;
  };
  createdAt: string;
  lastLogin?: string;
}

export interface Report {
  id: string;
  _id?: string;
  title: string;
  description: string;
  category: string;
  location: string | {
    address: string;
    city?: string;
    state?: string;
    coordinates?: { lat: number; lng: number };
  };
  status: 'pending' | 'acknowledged' | 'in-progress' | 'resolved' | 'closed' | 'rejected';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  userId: string | User;
  images?: string[];
  upvotes?: any[];
  upvoteCount?: number;
  comments?: any[];
  createdAt: string;
  updatedAt: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user: User;
  error?: string;
}

class BackendApiService {
  private token: string | null = null;
  private isBackendAvailable: boolean = true;

  constructor() {
    // Load token from localStorage if exists
    this.token = localStorage.getItem('auth_token');
    // Check backend availability on initialization
    this.checkBackendHealth();
  }

  // Check if backend is available
  private async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      this.isBackendAvailable = response.ok;
      return response.ok;
    } catch {
      this.isBackendAvailable = false;
      console.log('Backend not available, using local storage fallback');
      return false;
    }
  }

  // Helper method for API requests
  private async apiRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Authentication methods
  async signUp(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<User> {
    if (!this.isBackendAvailable) {
      // Fallback to localStorage
      return this.localSignUp(userData);
    }

    try {
      const response = await this.apiRequest<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.token) {
        this.token = response.token;
        localStorage.setItem('auth_token', response.token);
      }

      const user = response.user;
      // Normalize ID field
      if (user._id && !user.id) {
        user.id = user._id;
      }

      localStorage.setItem('current_user', JSON.stringify(user));
      return user;
    } catch (error) {
      // If backend fails, try localStorage fallback
      if (!this.isBackendAvailable) {
        return this.localSignUp(userData);
      }
      throw error;
    }
  }

  async signIn(credentials: {
    email: string;
    password: string;
  }): Promise<User> {
    if (!this.isBackendAvailable) {
      return this.localSignIn(credentials);
    }

    try {
      const response = await this.apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.token) {
        this.token = response.token;
        localStorage.setItem('auth_token', response.token);
      }

      const user = response.user;
      // Normalize ID field
      if (user._id && !user.id) {
        user.id = user._id;
      }

      localStorage.setItem('current_user', JSON.stringify(user));
      return user;
    } catch (error) {
      if (!this.isBackendAvailable) {
        return this.localSignIn(credentials);
      }
      throw error;
    }
  }

  async signOut(): Promise<void> {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    
    if (this.isBackendAvailable) {
      try {
        await this.apiRequest('/auth/logout', { method: 'POST' });
      } catch {
        // Ignore logout errors
      }
    }
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // Report methods
  async createReport(reportData: {
    title: string;
    description: string;
    category: string;
    location: string | any;
    images?: string[];
  }): Promise<Report> {
    if (!this.isBackendAvailable) {
      return this.localCreateReport(reportData);
    }

    try {
      const response = await this.apiRequest<{ success: boolean; report: Report }>(
        '/reports',
        {
          method: 'POST',
          body: JSON.stringify(reportData),
        }
      );

      const report = response.report;
      // Normalize ID field
      if (report._id && !report.id) {
        report.id = report._id;
      }

      return report;
    } catch (error) {
      if (!this.isBackendAvailable) {
        return this.localCreateReport(reportData);
      }
      throw error;
    }
  }

  async getUserReports(userId: string): Promise<Report[]> {
    if (!this.isBackendAvailable) {
      return this.localGetUserReports(userId);
    }

    try {
      const response = await this.apiRequest<{ success: boolean; reports: Report[] }>(
        `/reports?userId=${userId}`
      );

      return response.reports.map(report => {
        if (report._id && !report.id) {
          report.id = report._id;
        }
        return report;
      });
    } catch {
      return this.localGetUserReports(userId);
    }
  }

  async getAllReports(): Promise<Report[]> {
    if (!this.isBackendAvailable) {
      return this.localGetAllReports();
    }

    try {
      const response = await this.apiRequest<{ success: boolean; reports: Report[] }>(
        '/reports'
      );

      return response.reports.map(report => {
        if (report._id && !report.id) {
          report.id = report._id;
        }
        return report;
      });
    } catch {
      return this.localGetAllReports();
    }
  }

  async updateReportStatus(
    reportId: string,
    status: Report['status']
  ): Promise<Report> {
    if (!this.isBackendAvailable) {
      return this.localUpdateReportStatus(reportId, status);
    }

    try {
      const response = await this.apiRequest<{ success: boolean; report: Report }>(
        `/reports/${reportId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status }),
        }
      );

      const report = response.report;
      if (report._id && !report.id) {
        report.id = report._id;
      }

      return report;
    } catch {
      return this.localUpdateReportStatus(reportId, status);
    }
  }

  async upvoteReport(reportId: string): Promise<{ success: boolean; upvoteCount: number }> {
    if (!this.isBackendAvailable) {
      return this.localUpvoteReport(reportId);
    }

    try {
      return await this.apiRequest(`/reports/${reportId}/upvote`, {
        method: 'POST',
      });
    } catch {
      return this.localUpvoteReport(reportId);
    }
  }

  // Check email availability
  async checkEmailExists(email: string): Promise<boolean> {
    // For now, just check locally
    const users = this.getLocalUsers();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // Export data
  async exportData(format: 'json' | 'csv'): Promise<any> {
    if (!this.isBackendAvailable) {
      return this.localExportData(format);
    }

    try {
      return await this.apiRequest(`/export/${format}`);
    } catch {
      return this.localExportData(format);
    }
  }

  // Local storage fallback methods
  private localSignUp(userData: any): User {
    const users = this.getLocalUsers();
    
    if (users.find(u => u.email === userData.email)) {
      throw new Error('Email already registered');
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: 'citizen',
      civicPoints: 0,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('civic_users', JSON.stringify(users));
    
    // Store password (in production, this would be hashed)
    const passwords = this.getLocalPasswords();
    passwords[newUser.id] = userData.password;
    localStorage.setItem('civic_passwords', JSON.stringify(passwords));

    localStorage.setItem('current_user', JSON.stringify(newUser));
    return newUser;
  }

  private localSignIn(credentials: any): User {
    const users = this.getLocalUsers();
    const passwords = this.getLocalPasswords();
    
    const user = users.find(u => u.email === credentials.email);
    
    if (!user || passwords[user.id] !== credentials.password) {
      throw new Error('Invalid email or password');
    }

    localStorage.setItem('current_user', JSON.stringify(user));
    return user;
  }

  private localCreateReport(reportData: any): Report {
    const reports = this.getLocalReports();
    const user = this.getCurrentUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const newReport: Report = {
      id: Date.now().toString(),
      ...reportData,
      userId: user.id,
      status: 'pending',
      priority: 'medium',
      upvotes: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reports.push(newReport);
    localStorage.setItem('civic_reports', JSON.stringify(reports));
    
    return newReport;
  }

  private localGetUserReports(userId: string): Report[] {
    const reports = this.getLocalReports();
    return reports.filter(r => r.userId === userId);
  }

  private localGetAllReports(): Report[] {
    return this.getLocalReports();
  }

  private localUpdateReportStatus(reportId: string, status: Report['status']): Report {
    const reports = this.getLocalReports();
    const index = reports.findIndex(r => r.id === reportId);
    
    if (index === -1) {
      throw new Error('Report not found');
    }

    reports[index] = {
      ...reports[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    localStorage.setItem('civic_reports', JSON.stringify(reports));
    return reports[index];
  }

  private localUpvoteReport(reportId: string): { success: boolean; upvoteCount: number } {
    const reports = this.getLocalReports();
    const index = reports.findIndex(r => r.id === reportId);
    
    if (index === -1) {
      throw new Error('Report not found');
    }

    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const report = reports[index];
    report.upvotes = report.upvotes || [];
    
    const existingIndex = report.upvotes.findIndex((u: any) => u.userId === user.id);
    
    if (existingIndex > -1) {
      report.upvotes.splice(existingIndex, 1);
    } else {
      report.upvotes.push({ userId: user.id, createdAt: new Date().toISOString() });
    }

    localStorage.setItem('civic_reports', JSON.stringify(reports));
    
    return {
      success: true,
      upvoteCount: report.upvotes.length,
    };
  }

  private localExportData(format: string): any {
    const data = {
      users: this.getLocalUsers(),
      reports: this.getLocalReports(),
      exportedAt: new Date().toISOString(),
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `urban_guardians_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    return { success: true, format, recordCount: data.reports.length };
  }

  private getLocalUsers(): User[] {
    const usersStr = localStorage.getItem('civic_users');
    return usersStr ? JSON.parse(usersStr) : [];
  }

  private getLocalReports(): Report[] {
    const reportsStr = localStorage.getItem('civic_reports');
    return reportsStr ? JSON.parse(reportsStr) : [];
  }

  private getLocalPasswords(): Record<string, string> {
    const passwordsStr = localStorage.getItem('civic_passwords');
    return passwordsStr ? JSON.parse(passwordsStr) : {};
  }
}

// Export singleton instance
export const backendApi = new BackendApiService();

// Also export the old apiService for backward compatibility
export const apiService = backendApi;