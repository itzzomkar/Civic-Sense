interface User {
  _id?: string;
  id?: string;
  email: string;
  name?: string;
  profilePicture?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: 'reporting' | 'community' | 'consistency' | 'impact' | 'special';
  condition: (userStats: UserStats) => boolean;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  unlockDate?: Date;
}

interface UserStats {
  userId: string;
  totalReports: number;
  resolvedReports: number;
  upvotesReceived: number;
  commentsGiven: number;
  streakDays: number;
  lastActiveDate: Date;
  categoriesReported: string[];
  averageReportQuality: number;
  communityContributions: number;
  impactScore: number;
  joinDate: Date;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  requirement: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'individual' | 'community' | 'seasonal';
  duration: number; // in days
  startDate: Date;
  endDate: Date;
  target: number;
  currentProgress: number;
  rewards: {
    points: number;
    badges?: string[];
    specialReward?: string;
  };
  participants: string[];
  isActive: boolean;
}

interface LeaderboardEntry {
  userId: string;
  user: User;
  rank: number;
  score: number;
  badge?: Badge;
  change: number; // rank change from previous period
  stats: {
    reports: number;
    resolved: number;
    impact: number;
    streak: number;
  };
}

interface CivicImpactMetrics {
  carbonSaved: number; // kg CO2
  timeSaved: number; // hours for citizens
  moneySaved: number; // estimated cost savings
  communityEngagement: number; // participation score
  governmentEfficiency: number; // response time improvement
}

export class GamificationService {
  private achievements: Achievement[] = [];
  private userStats: Map<string, UserStats> = new Map();
  private activeChallenges: Challenge[] = [];
  private userAchievements: Map<string, string[]> = new Map();

  constructor() {
    this.initializeAchievements();
    this.initializeChallenges();
  }

  private initializeAchievements() {
    this.achievements = [
      // Reporting Achievements
      {
        id: 'first_report',
        title: '🎯 First Step',
        description: 'Submit your first civic report',
        icon: '🎯',
        points: 50,
        category: 'reporting',
        condition: (stats) => stats.totalReports >= 1,
        rarity: 'common'
      },
      {
        id: 'power_reporter',
        title: '📈 Power Reporter',
        description: 'Submit 10 civic reports',
        icon: '📈',
        points: 200,
        category: 'reporting',
        condition: (stats) => stats.totalReports >= 10,
        rarity: 'uncommon'
      },
      {
        id: 'civic_champion',
        title: '🏆 Civic Champion',
        description: 'Submit 50 civic reports',
        icon: '🏆',
        points: 1000,
        category: 'reporting',
        condition: (stats) => stats.totalReports >= 50,
        rarity: 'rare'
      },
      {
        id: 'city_guardian',
        title: '🛡️ City Guardian',
        description: 'Submit 100 civic reports',
        icon: '🛡️',
        points: 2500,
        category: 'reporting',
        condition: (stats) => stats.totalReports >= 100,
        rarity: 'epic'
      },

      // Community Achievements
      {
        id: 'helpful_citizen',
        title: '🤝 Helpful Citizen',
        description: 'Receive 25 upvotes on your reports',
        icon: '🤝',
        points: 300,
        category: 'community',
        condition: (stats) => stats.upvotesReceived >= 25,
        rarity: 'uncommon'
      },
      {
        id: 'community_voice',
        title: '🗣️ Community Voice',
        description: 'Leave 50 helpful comments',
        icon: '🗣️',
        points: 400,
        category: 'community',
        condition: (stats) => stats.commentsGiven >= 50,
        rarity: 'uncommon'
      },

      // Consistency Achievements
      {
        id: 'consistent_citizen',
        title: '📅 Consistent Citizen',
        description: 'Maintain a 7-day activity streak',
        icon: '📅',
        points: 300,
        category: 'consistency',
        condition: (stats) => stats.streakDays >= 7,
        rarity: 'uncommon'
      },
      {
        id: 'dedication_master',
        title: '💪 Dedication Master',
        description: 'Maintain a 30-day activity streak',
        icon: '💪',
        points: 1500,
        category: 'consistency',
        condition: (stats) => stats.streakDays >= 30,
        rarity: 'rare'
      },

      // Impact Achievements
      {
        id: 'problem_solver',
        title: '✅ Problem Solver',
        description: 'Have 10 of your reports resolved',
        icon: '✅',
        points: 500,
        category: 'impact',
        condition: (stats) => stats.resolvedReports >= 10,
        rarity: 'uncommon'
      },
      {
        id: 'change_maker',
        title: '⚡ Change Maker',
        description: 'Achieve high civic impact score (500+)',
        icon: '⚡',
        points: 1000,
        category: 'impact',
        condition: (stats) => stats.impactScore >= 500,
        rarity: 'rare'
      },

      // Special Achievements
      {
        id: 'category_explorer',
        title: '🧭 Category Explorer',
        description: 'Report issues in 5 different categories',
        icon: '🧭',
        points: 400,
        category: 'special',
        condition: (stats) => stats.categoriesReported.length >= 5,
        rarity: 'uncommon'
      },
      {
        id: 'pioneer',
        title: '🚀 Pioneer',
        description: 'Join in the first month of launch',
        icon: '🚀',
        points: 1000,
        category: 'special',
        condition: (stats) => {
          const oneMonthAfterLaunch = new Date('2024-01-01');
          oneMonthAfterLaunch.setMonth(oneMonthAfterLaunch.getMonth() + 1);
          return stats.joinDate <= oneMonthAfterLaunch;
        },
        rarity: 'legendary'
      }
    ];
  }

  private initializeChallenges() {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    this.activeChallenges = [
      {
        id: 'weekly_reporter',
        title: '📅 Weekly Reporter',
        description: 'Submit 5 reports this week',
        icon: '📅',
        type: 'individual',
        duration: 7,
        startDate: now,
        endDate: weekFromNow,
        target: 5,
        currentProgress: 0,
        rewards: {
          points: 200,
          badges: ['weekly_achiever']
        },
        participants: [],
        isActive: true
      },
      {
        id: 'community_cleanup',
        title: '🧹 Community Cleanup',
        description: 'Community goal: Report 100 waste management issues',
        icon: '🧹',
        type: 'community',
        duration: 30,
        startDate: now,
        endDate: monthFromNow,
        target: 100,
        currentProgress: 0,
        rewards: {
          points: 500,
          badges: ['cleanup_hero'],
          specialReward: 'Community Recognition Certificate'
        },
        participants: [],
        isActive: true
      },
      {
        id: 'green_initiative',
        title: '🌱 Green Initiative',
        description: 'Focus on environmental issues this month',
        icon: '🌱',
        type: 'seasonal',
        duration: 30,
        startDate: now,
        endDate: monthFromNow,
        target: 50,
        currentProgress: 0,
        rewards: {
          points: 750,
          badges: ['eco_warrior'],
          specialReward: 'Tree Plantation Certificate'
        },
        participants: [],
        isActive: true
      }
    ];
  }

  public updateUserStats(userId: string, statsUpdate: Partial<UserStats>) {
    const currentStats = this.userStats.get(userId) || this.createDefaultStats(userId);
    const updatedStats = { ...currentStats, ...statsUpdate };
    this.userStats.set(userId, updatedStats);
    
    // Check for new achievements
    this.checkAchievements(userId);
    
    return updatedStats;
  }

  private createDefaultStats(userId: string): UserStats {
    return {
      userId,
      totalReports: 0,
      resolvedReports: 0,
      upvotesReceived: 0,
      commentsGiven: 0,
      streakDays: 0,
      lastActiveDate: new Date(),
      categoriesReported: [],
      averageReportQuality: 0,
      communityContributions: 0,
      impactScore: 0,
      joinDate: new Date()
    };
  }

  public onReportSubmitted(userId: string, category: string, qualityScore: number = 70) {
    const stats = this.userStats.get(userId) || this.createDefaultStats(userId);
    
    // Update stats
    stats.totalReports++;
    stats.lastActiveDate = new Date();
    
    // Add category if not already tracked
    if (!stats.categoriesReported.includes(category)) {
      stats.categoriesReported.push(category);
    }
    
    // Update quality score (weighted average)
    stats.averageReportQuality = ((stats.averageReportQuality * (stats.totalReports - 1)) + qualityScore) / stats.totalReports;
    
    // Update streak
    this.updateStreak(userId);
    
    // Update impact score
    stats.impactScore += this.calculateReportImpact(category, qualityScore);
    
    this.updateUserStats(userId, stats);
    
    // Update challenges
    this.updateChallengeProgress(userId, 'report_submitted', { category });
    
    return this.getPointsEarned(userId, 'report_submitted');
  }

  public onReportResolved(userId: string) {
    const stats = this.userStats.get(userId) || this.createDefaultStats(userId);
    stats.resolvedReports++;
    stats.impactScore += 50; // Bonus for getting issues resolved
    
    this.updateUserStats(userId, stats);
    return this.getPointsEarned(userId, 'report_resolved');
  }

  public onUpvoteReceived(userId: string) {
    const stats = this.userStats.get(userId) || this.createDefaultStats(userId);
    stats.upvotesReceived++;
    stats.impactScore += 5;
    
    this.updateUserStats(userId, stats);
    return this.getPointsEarned(userId, 'upvote_received');
  }

  public onCommentGiven(userId: string) {
    const stats = this.userStats.get(userId) || this.createDefaultStats(userId);
    stats.commentsGiven++;
    stats.communityContributions++;
    stats.impactScore += 2;
    
    this.updateUserStats(userId, stats);
    return this.getPointsEarned(userId, 'comment_given');
  }

  private updateStreak(userId: string) {
    const stats = this.userStats.get(userId)!;
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastActive = new Date(stats.lastActiveDate);
    
    // Check if user was active yesterday or today
    if (this.isSameDay(lastActive, yesterday) || this.isSameDay(lastActive, today)) {
      if (!this.isSameDay(lastActive, today)) {
        stats.streakDays++;
      }
    } else {
      stats.streakDays = 1; // Reset streak
    }
    
    stats.lastActiveDate = today;
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  private calculateReportImpact(category: string, qualityScore: number): number {
    const categoryMultipliers = {
      'Water & Utilities': 2.0,
      'Traffic': 1.8,
      'Road Maintenance': 1.5,
      'Waste Management': 1.3,
      'Infrastructure': 1.7,
      'Lighting': 1.0,
      'Vandalism': 0.8,
      'Other': 1.0
    };
    
    const multiplier = categoryMultipliers[category as keyof typeof categoryMultipliers] || 1.0;
    return Math.round((qualityScore / 100) * 25 * multiplier);
  }

  private checkAchievements(userId: string) {
    const stats = this.userStats.get(userId)!;
    const userAchievements = this.userAchievements.get(userId) || [];
    const newAchievements: string[] = [];
    
    this.achievements.forEach(achievement => {
      if (!userAchievements.includes(achievement.id) && achievement.condition(stats)) {
        userAchievements.push(achievement.id);
        newAchievements.push(achievement.id);
        achievement.unlockDate = new Date();
      }
    });
    
    this.userAchievements.set(userId, userAchievements);
    return newAchievements;
  }

  private updateChallengeProgress(userId: string, action: string, data: any = {}) {
    this.activeChallenges.forEach(challenge => {
      if (!challenge.isActive) return;
      
      // Add user to participants if not already there
      if (!challenge.participants.includes(userId)) {
        challenge.participants.push(userId);
      }
      
      // Update progress based on challenge type
      switch (challenge.id) {
        case 'weekly_reporter':
          if (action === 'report_submitted') {
            challenge.currentProgress++;
          }
          break;
        case 'community_cleanup':
          if (action === 'report_submitted' && data.category === 'Waste Management') {
            challenge.currentProgress++;
          }
          break;
        case 'green_initiative':
          if (action === 'report_submitted' && 
              ['Waste Management', 'Water & Utilities', 'Infrastructure'].includes(data.category)) {
            challenge.currentProgress++;
          }
          break;
      }
    });
  }

  private getPointsEarned(userId: string, action: string): number {
    const pointsMap = {
      'report_submitted': 25,
      'report_resolved': 50,
      'upvote_received': 5,
      'comment_given': 2
    };
    
    return pointsMap[action as keyof typeof pointsMap] || 0;
  }

  public getUserProfile(userId: string) {
    const stats = this.userStats.get(userId) || this.createDefaultStats(userId);
    const achievements = this.userAchievements.get(userId) || [];
    const totalPoints = this.calculateTotalPoints(userId);
    const level = this.calculateLevel(totalPoints);
    const badge = this.getBadgeForLevel(level);
    
    return {
      stats,
      achievements: achievements.map(id => this.achievements.find(a => a.id === id)).filter(Boolean),
      totalPoints,
      level,
      badge,
      rank: this.getUserRank(userId),
      nextLevelPoints: this.getNextLevelPoints(level),
      progressToNextLevel: this.getProgressToNextLevel(totalPoints, level)
    };
  }

  private calculateTotalPoints(userId: string): number {
    const stats = this.userStats.get(userId) || this.createDefaultStats(userId);
    const achievements = this.userAchievements.get(userId) || [];
    
    let points = 0;
    
    // Base points from activities
    points += stats.totalReports * 25;
    points += stats.resolvedReports * 50;
    points += stats.upvotesReceived * 5;
    points += stats.commentsGiven * 2;
    points += stats.streakDays * 10;
    points += Math.floor(stats.impactScore);
    
    // Achievement points
    achievements.forEach(achievementId => {
      const achievement = this.achievements.find(a => a.id === achievementId);
      if (achievement) {
        points += achievement.points;
      }
    });
    
    return points;
  }

  private calculateLevel(points: number): number {
    // Progressive leveling system
    const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500];
    
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (points >= levelThresholds[i]) {
        return i + 1;
      }
    }
    
    return 1;
  }

  private getBadgeForLevel(level: number): Badge {
    const badges = [
      { id: 'newbie', name: 'Newbie', icon: '🌱', color: '#22c55e', description: 'Just getting started', requirement: 'Level 1-2' },
      { id: 'citizen', name: 'Active Citizen', icon: '👤', color: '#3b82f6', description: 'Regular contributor', requirement: 'Level 3-4' },
      { id: 'advocate', name: 'Civic Advocate', icon: '📢', color: '#8b5cf6', description: 'Strong community voice', requirement: 'Level 5-6' },
      { id: 'leader', name: 'Community Leader', icon: '⭐', color: '#f59e0b', description: 'Leading by example', requirement: 'Level 7-8' },
      { id: 'champion', name: 'Civic Champion', icon: '🏆', color: '#ef4444', description: 'Top tier contributor', requirement: 'Level 9-10' },
      { id: 'legend', name: 'Urban Legend', icon: '👑', color: '#9333ea', description: 'Legendary status', requirement: 'Level 11+' }
    ];
    
    const badgeIndex = Math.min(Math.floor((level - 1) / 2), badges.length - 1);
    return badges[badgeIndex];
  }

  private getUserRank(userId: string): number {
    const allUsers = Array.from(this.userStats.keys());
    const userPoints = allUsers.map(id => ({
      userId: id,
      points: this.calculateTotalPoints(id)
    }));
    
    userPoints.sort((a, b) => b.points - a.points);
    
    const userIndex = userPoints.findIndex(u => u.userId === userId);
    return userIndex + 1;
  }

  private getNextLevelPoints(level: number): number {
    const levelThresholds = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 10000];
    return levelThresholds[level] || levelThresholds[levelThresholds.length - 1];
  }

  private getProgressToNextLevel(currentPoints: number, level: number): number {
    const currentLevelThreshold = this.getNextLevelPoints(level - 1);
    const nextLevelThreshold = this.getNextLevelPoints(level);
    
    const progress = (currentPoints - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold);
    return Math.min(Math.max(progress, 0), 1);
  }

  public getLeaderboard(type: 'points' | 'reports' | 'impact' = 'points', limit: number = 20): LeaderboardEntry[] {
    const allUsers = Array.from(this.userStats.keys());
    
    const entries = allUsers.map(userId => {
      const stats = this.userStats.get(userId)!;
      const totalPoints = this.calculateTotalPoints(userId);
      const level = this.calculateLevel(totalPoints);
      const badge = this.getBadgeForLevel(level);
      
      let score = totalPoints;
      if (type === 'reports') score = stats.totalReports;
      if (type === 'impact') score = stats.impactScore;
      
      return {
        userId,
        user: { _id: userId, id: userId, email: `user${userId}@example.com` }, // Mock user data
        rank: 0, // Will be set after sorting
        score,
        badge,
        change: 0, // Would be calculated from historical data
        stats: {
          reports: stats.totalReports,
          resolved: stats.resolvedReports,
          impact: stats.impactScore,
          streak: stats.streakDays
        }
      };
    });
    
    // Sort by score
    entries.sort((a, b) => b.score - a.score);
    
    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    return entries.slice(0, limit);
  }

  public getActiveChallenges(): Challenge[] {
    return this.activeChallenges.filter(c => c.isActive);
  }

  public getUserChallengeProgress(userId: string): Challenge[] {
    return this.activeChallenges
      .filter(c => c.participants.includes(userId))
      .map(challenge => ({
        ...challenge,
        userProgress: this.calculateUserChallengeProgress(userId, challenge)
      }));
  }

  private calculateUserChallengeProgress(userId: string, challenge: Challenge): number {
    // This would be more sophisticated in a real implementation
    // For now, return a portion of the total progress
    return Math.floor(challenge.currentProgress / Math.max(challenge.participants.length, 1));
  }

  public getCivicImpactMetrics(userId?: string): CivicImpactMetrics {
    const stats = userId ? [this.userStats.get(userId)] : Array.from(this.userStats.values());
    const validStats = stats.filter(Boolean) as UserStats[];
    
    const totalReports = validStats.reduce((sum, s) => sum + s.totalReports, 0);
    const totalResolved = validStats.reduce((sum, s) => sum + s.resolvedReports, 0);
    const totalImpact = validStats.reduce((sum, s) => sum + s.impactScore, 0);
    
    // Estimated impact calculations (simplified)
    const carbonSaved = totalResolved * 2.5; // 2.5kg CO2 per resolved issue
    const timeSaved = totalResolved * 0.5; // 30 minutes saved per resolved issue
    const moneySaved = totalResolved * 150; // ₹150 saved per resolved issue
    const communityEngagement = Math.min((totalReports / 1000) * 100, 100); // 0-100 scale
    const governmentEfficiency = Math.min((totalResolved / totalReports) * 100, 100) || 0;
    
    return {
      carbonSaved,
      timeSaved,
      moneySaved,
      communityEngagement,
      governmentEfficiency
    };
  }

  public getRecentAchievements(userId: string, days: number = 7): Achievement[] {
    const achievements = this.userAchievements.get(userId) || [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return achievements
      .map(id => this.achievements.find(a => a.id === id))
      .filter(a => a && a.unlockDate && a.unlockDate >= cutoffDate)
      .filter(Boolean) as Achievement[];
  }
}

export const gamificationService = new GamificationService();
export default gamificationService;