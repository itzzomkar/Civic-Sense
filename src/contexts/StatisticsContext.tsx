import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Statistics {
  issuesResolved: number;
  activeCitizens: number;
  totalReports: number;
  responseRate: number;
  userRating: number;
  myReports: number;
  pendingReports: number;
  inProgressReports: number;
}

interface StatisticsContextType {
  stats: Statistics;
  incrementReports: () => void;
  incrementResolved: () => void;
  incrementPending: () => void;
  incrementInProgress: () => void;
  decrementPending: () => void;
  addActiveCitizen: () => void;
  updateResponseRate: (rate: number) => void;
  updateUserRating: (rating: number) => void;
  refreshStats: () => void;
}

const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

export const useStatistics = () => {
  const context = useContext(StatisticsContext);
  if (!context) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
};

interface StatisticsProviderProps {
  children: ReactNode;
}

export const StatisticsProvider: React.FC<StatisticsProviderProps> = ({ children }) => {
  // Initialize stats from localStorage or with default values
  const [stats, setStats] = useState<Statistics>(() => {
    const savedStats = localStorage.getItem('appStatistics');
    if (savedStats) {
      return JSON.parse(savedStats);
    }
    
    // Default statistics
    return {
      issuesResolved: 0,
      activeCitizens: 1, // Start with 1 for the current user
      totalReports: 0,
      responseRate: 0,
      userRating: 0,
      myReports: 0,
      pendingReports: 0,
      inProgressReports: 0,
    };
  });

  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('appStatistics', JSON.stringify(stats));
  }, [stats]);

  // Load existing reports from localStorage to calculate initial stats
  useEffect(() => {
    const loadExistingData = () => {
      // Check for existing reports in localStorage
      const savedReports = localStorage.getItem('userReports');
      if (savedReports) {
        try {
          const reports = JSON.parse(savedReports);
          if (Array.isArray(reports)) {
            const resolved = reports.filter((r: any) => r.status === 'resolved').length;
            const pending = reports.filter((r: any) => r.status === 'pending').length;
            const inProgress = reports.filter((r: any) => r.status === 'in-progress').length;
            
            setStats(prev => ({
              ...prev,
              myReports: reports.length,
              issuesResolved: resolved,
              pendingReports: pending,
              inProgressReports: inProgress,
              totalReports: reports.length,
              // Calculate response rate based on resolved vs total
              responseRate: reports.length > 0 ? Math.round((resolved / reports.length) * 100) : 0,
            }));
          }
        } catch (error) {
          console.error('Error loading existing reports:', error);
        }
      }

      // Check for unique users (simplified - in real app would track actual users)
      const uniqueUsers = localStorage.getItem('uniqueUsers');
      if (uniqueUsers) {
        try {
          const users = JSON.parse(uniqueUsers);
          setStats(prev => ({ ...prev, activeCitizens: users.length || 1 }));
        } catch (error) {
          console.error('Error loading users:', error);
        }
      }

      // Load saved ratings
      const savedRatings = localStorage.getItem('userRatings');
      if (savedRatings) {
        try {
          const ratings = JSON.parse(savedRatings);
          const avgRating = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
          setStats(prev => ({ ...prev, userRating: avgRating }));
        } catch (error) {
          console.error('Error loading ratings:', error);
        }
      }
    };

    loadExistingData();
  }, []);

  const incrementReports = () => {
    setStats(prev => ({
      ...prev,
      totalReports: prev.totalReports + 1,
      myReports: prev.myReports + 1,
      pendingReports: prev.pendingReports + 1,
    }));
  };

  const incrementResolved = () => {
    setStats(prev => {
      const newResolved = prev.issuesResolved + 1;
      const newPending = Math.max(0, prev.pendingReports - 1);
      const newResponseRate = prev.totalReports > 0 
        ? Math.round((newResolved / prev.totalReports) * 100) 
        : 0;
      
      return {
        ...prev,
        issuesResolved: newResolved,
        pendingReports: newPending,
        responseRate: newResponseRate,
      };
    });
  };

  const incrementPending = () => {
    setStats(prev => ({
      ...prev,
      pendingReports: prev.pendingReports + 1,
    }));
  };

  const incrementInProgress = () => {
    setStats(prev => ({
      ...prev,
      inProgressReports: prev.inProgressReports + 1,
      pendingReports: Math.max(0, prev.pendingReports - 1),
    }));
  };

  const decrementPending = () => {
    setStats(prev => ({
      ...prev,
      pendingReports: Math.max(0, prev.pendingReports - 1),
    }));
  };

  const addActiveCitizen = () => {
    setStats(prev => ({
      ...prev,
      activeCitizens: prev.activeCitizens + 1,
    }));
  };

  const updateResponseRate = (rate: number) => {
    setStats(prev => ({
      ...prev,
      responseRate: Math.min(100, Math.max(0, rate)),
    }));
  };

  const updateUserRating = (rating: number) => {
    // Save rating to array for averaging
    const savedRatings = localStorage.getItem('userRatings');
    let ratings = savedRatings ? JSON.parse(savedRatings) : [];
    ratings.push(rating);
    localStorage.setItem('userRatings', JSON.stringify(ratings));
    
    const avgRating = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
    
    setStats(prev => ({
      ...prev,
      userRating: Number(avgRating.toFixed(1)),
    }));
  };

  const refreshStats = () => {
    // Re-calculate stats from localStorage
    const savedReports = localStorage.getItem('userReports');
    if (savedReports) {
      try {
        const reports = JSON.parse(savedReports);
        if (Array.isArray(reports)) {
          const resolved = reports.filter((r: any) => r.status === 'resolved').length;
          const pending = reports.filter((r: any) => r.status === 'pending').length;
          const inProgress = reports.filter((r: any) => r.status === 'in-progress').length;
          
          setStats(prev => ({
            ...prev,
            myReports: reports.length,
            issuesResolved: resolved,
            pendingReports: pending,
            inProgressReports: inProgress,
            totalReports: reports.length,
            responseRate: reports.length > 0 ? Math.round((resolved / reports.length) * 100) : 0,
          }));
        }
      } catch (error) {
        console.error('Error refreshing stats:', error);
      }
    }
  };

  const value: StatisticsContextType = {
    stats,
    incrementReports,
    incrementResolved,
    incrementPending,
    incrementInProgress,
    decrementPending,
    addActiveCitizen,
    updateResponseRate,
    updateUserRating,
    refreshStats,
  };

  return (
    <StatisticsContext.Provider value={value}>
      {children}
    </StatisticsContext.Provider>
  );
};