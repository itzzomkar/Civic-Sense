// Example TypeScript API Client for Backend Integration
// This file shows how to connect the frontend to the real backend API
// when you're ready to switch from localStorage mock to the real backend

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000/api';

interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'citizen' | 'official';
  createdAt: string;
  civicPoints?: number;
  location?: {
    city: string;
    state: string;
  };
}

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  location: {
    address: string;
    city: string;
    state: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  images?: Array<{
    url: string;
    filename: string;
  }>;
  upvotes?: number;
  comments?: Array<any>;
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
}

class ApiService {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem('token');
  }

  // Helper method to make API requests
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    // Add auth token if available
    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`,
      };
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'API request failed');
    }

    return response.json();
  }

  // Update token
  private setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Initialize demo data (compatibility method - does nothing with real backend)
  initializeDemoData(): void {
    // No-op for real backend
    console.log('Using real backend - no demo data needed');
  }

  // Get current user from token
  async getCurrentUser(): Promise<User | null> {
    if (!this.token) return null;
    
    try {
      const response = await this.request<{ success: boolean; user: User }>('/auth/verify');
      return response.user;
    } catch {
      this.setToken(null);
      return null;
    }
  }

  // Authentication
  async signUp(userData: SignUpData): Promise<User> {
    const response = await this.request<{ success: boolean; token: string; user: User }>(
      '/auth/signup',
      {
        method: 'POST',
        body: JSON.stringify(userData),
      }
    );
    
    this.setToken(response.token);
    return response.user;
  }

  async signIn(credentials: LoginCredentials): Promise<User> {
    const response = await this.request<{ success: boolean; token: string; user: User }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      }
    );
    
    this.setToken(response.token);
    return response.user;
  }

  async signOut(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // Reports
  async getAllReports(): Promise<Report[]> {
    const response = await this.request<{ success: boolean; reports: Report[] }>('/reports');
    return response.reports;
  }

  async getUserReports(userId: string): Promise<Report[]> {
    const response = await this.request<{ success: boolean; reports: Report[] }>(
      `/reports?userId=${userId}`
    );
    return response.reports;
  }

  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>, images?: File[]): Promise<Report> {
    const formData = new FormData();
    
    // Add report data
    Object.entries(reportData).forEach(([key, value]) => {
      if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });
    
    // Add images if provided
    images?.forEach(image => {
      formData.append('images', image);
    });

    const response = await fetch(`${API_BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create report');
    }

    const data = await response.json();
    return data.report;
  }

  async updateReportStatus(reportId: string, status: Report['status']): Promise<Report> {
    const response = await this.request<{ success: boolean; report: Report }>(
      `/reports/${reportId}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({ status }),
      }
    );
    return response.report;
  }

  // User Profile
  async getUserProfile(userId?: string): Promise<User> {
    const endpoint = userId ? `/users/profile/${userId}` : '/users/profile';
    const response = await this.request<{ success: boolean; user: User }>(endpoint);
    return response.user;
  }

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.request<{ success: boolean; user: User }>(
      '/users/profile',
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );
    return response.user;
  }

  // Analytics
  async getOverallStats(): Promise<any> {
    const response = await this.request<{ success: boolean; stats: any }>('/analytics/overall');
    return response.stats;
  }

  async getCategoryStats(): Promise<any> {
    const response = await this.request<{ success: boolean; categories: any[] }>('/analytics/categories');
    return response.categories;
  }

  // Check if email exists (for better UX)
  async checkEmailExists(email: string): Promise<boolean> {
    // This would need to be implemented in the backend
    // For now, return false to allow registration
    return false;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export type { User, Report, LoginCredentials, SignUpData };