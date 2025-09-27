// import * as tf from '@tensorflow/tfjs'; // Temporarily disabled

export interface CategoryPrediction {
  category: string;
  confidence: number;
  suggestedPriority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface AIAnalysis {
  primaryCategory: CategoryPrediction;
  alternativeCategories: CategoryPrediction[];
  sentiment: 'positive' | 'neutral' | 'negative';
  urgencyScore: number;
  keywords: string[];
}

class AICategorization {
  // private model: tf.LayersModel | null = null; // Temporarily disabled
  private isLoading = false;
  private vectorizer: any = null;

  // Category mappings with associated keywords and priority rules
  private categoryKeywords = {
    'Road Maintenance': {
      keywords: ['pothole', 'crack', 'road', 'street', 'pavement', 'asphalt', 'broken', 'damaged', 'repair', 'construction'],
      urgencyMultiplier: 1.2,
      commonIssues: ['potholes', 'cracks', 'broken road', 'construction debris']
    },
    'Waste Management': {
      keywords: ['garbage', 'waste', 'trash', 'litter', 'dump', 'smell', 'bin', 'collection', 'overflowing', 'dirty'],
      urgencyMultiplier: 1.0,
      commonIssues: ['overflowing bins', 'uncollected garbage', 'illegal dumping', 'bad odor']
    },
    'Water & Utilities': {
      keywords: ['water', 'pipe', 'leak', 'burst', 'drainage', 'sewer', 'flood', 'blockage', 'overflow', 'supply'],
      urgencyMultiplier: 1.5,
      commonIssues: ['water leaks', 'pipe bursts', 'drainage issues', 'water supply problems']
    },
    'Lighting': {
      keywords: ['light', 'lamp', 'bulb', 'dark', 'broken', 'flickering', 'street light', 'pole', 'electrical'],
      urgencyMultiplier: 0.8,
      commonIssues: ['broken street lights', 'flickering lights', 'dark areas', 'electrical issues']
    },
    'Traffic': {
      keywords: ['traffic', 'signal', 'sign', 'congestion', 'accident', 'blocked', 'jam', 'unsafe', 'crossing'],
      urgencyMultiplier: 1.3,
      commonIssues: ['traffic signals not working', 'blocked roads', 'unsafe crossings', 'traffic congestion']
    },
    'Vandalism': {
      keywords: ['vandalism', 'graffiti', 'damaged', 'broken', 'destroyed', 'defaced', 'stolen', 'property'],
      urgencyMultiplier: 0.9,
      commonIssues: ['graffiti on walls', 'damaged public property', 'stolen items', 'broken facilities']
    },
    'Infrastructure': {
      keywords: ['building', 'structure', 'bridge', 'sidewalk', 'park', 'facility', 'maintenance', 'repair'],
      urgencyMultiplier: 1.1,
      commonIssues: ['damaged sidewalks', 'broken facilities', 'bridge issues', 'park maintenance']
    }
  };

  // Simple keyword-based classification (fallback when ML model isn't available)
  private classifyByKeywords(text: string): CategoryPrediction[] {
    const lowercaseText = text.toLowerCase();
    const scores: { [key: string]: number } = {};

    // Calculate scores for each category based on keyword matches
    Object.entries(this.categoryKeywords).forEach(([category, data]) => {
      let score = 0;
      data.keywords.forEach(keyword => {
        const matches = (lowercaseText.match(new RegExp(keyword, 'g')) || []).length;
        score += matches * (1 + keyword.length / 10); // Longer keywords get slightly higher weight
      });
      scores[category] = score * data.urgencyMultiplier;
    });

    // Sort by score and return top predictions
    const sortedCategories = Object.entries(scores)
      .filter(([_, score]) => score > 0)
      .sort(([_, a], [__, b]) => b - a)
      .map(([category, score]) => ({
        category,
        confidence: Math.min(score / 10, 0.95), // Normalize and cap at 95%
        suggestedPriority: this.determinePriority(score, category)
      }));

    // If no matches found, return "Other" with low confidence
    if (sortedCategories.length === 0) {
      return [{
        category: 'Other',
        confidence: 0.3,
        suggestedPriority: 'medium' as const
      }];
    }

    return sortedCategories;
  }

  private determinePriority(score: number, category: string): 'low' | 'medium' | 'high' | 'urgent' {
    const categoryData = this.categoryKeywords[category];
    const adjustedScore = score * (categoryData?.urgencyMultiplier || 1);

    if (adjustedScore >= 8) return 'urgent';
    if (adjustedScore >= 5) return 'high';
    if (adjustedScore >= 2) return 'medium';
    return 'low';
  }

  // Analyze sentiment from text
  private analyzeSentiment(text: string): { sentiment: 'positive' | 'neutral' | 'negative', score: number } {
    const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'working', 'fixed', 'clean'];
    const negativeWords = ['bad', 'terrible', 'awful', 'broken', 'dirty', 'dangerous', 'urgent', 'emergency', 'horrible', 'disgusting'];
    
    const lowercaseText = text.toLowerCase();
    let positiveScore = 0;
    let negativeScore = 0;

    positiveWords.forEach(word => {
      positiveScore += (lowercaseText.match(new RegExp(word, 'g')) || []).length;
    });

    negativeWords.forEach(word => {
      negativeScore += (lowercaseText.match(new RegExp(word, 'g')) || []).length;
    });

    const totalScore = positiveScore - negativeScore;
    const sentiment = totalScore > 0 ? 'positive' : totalScore < 0 ? 'negative' : 'neutral';

    return { sentiment, score: Math.abs(totalScore) };
  }

  // Extract keywords from text
  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can']);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    // Count word frequencies
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Return top 10 keywords sorted by frequency
    return Object.entries(wordCount)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  // Calculate urgency score based on multiple factors
  private calculateUrgencyScore(text: string, sentiment: string): number {
    const urgentKeywords = ['emergency', 'urgent', 'dangerous', 'blocked', 'burst', 'flood', 'accident', 'broken'];
    const lowercaseText = text.toLowerCase();
    
    let urgencyScore = 0;
    
    // Check for urgent keywords
    urgentKeywords.forEach(keyword => {
      if (lowercaseText.includes(keyword)) {
        urgencyScore += 2;
      }
    });

    // Sentiment affects urgency
    if (sentiment === 'negative') urgencyScore += 1;
    if (sentiment === 'positive') urgencyScore -= 0.5;

    // Text length might indicate detail level (more detailed = potentially more urgent)
    if (text.length > 200) urgencyScore += 0.5;

    // Normalize to 0-10 scale
    return Math.min(Math.max(urgencyScore, 0), 10);
  }

  // Main analysis function
  public async analyzeReport(title: string, description: string): Promise<AIAnalysis> {
    const fullText = `${title} ${description}`;
    
    try {
      // Get category predictions
      const categoryPredictions = this.classifyByKeywords(fullText);
      
      // Analyze sentiment
      const sentimentAnalysis = this.analyzeSentiment(fullText);
      
      // Extract keywords
      const keywords = this.extractKeywords(fullText);
      
      // Calculate urgency score
      const urgencyScore = this.calculateUrgencyScore(fullText, sentimentAnalysis.sentiment);

      return {
        primaryCategory: categoryPredictions[0] || {
          category: 'Other',
          confidence: 0.3,
          suggestedPriority: 'medium'
        },
        alternativeCategories: categoryPredictions.slice(1, 3),
        sentiment: sentimentAnalysis.sentiment,
        urgencyScore,
        keywords
      };
    } catch (error) {
      console.error('AI Analysis failed:', error);
      
      // Fallback analysis
      return {
        primaryCategory: {
          category: 'Other',
          confidence: 0.3,
          suggestedPriority: 'medium'
        },
        alternativeCategories: [],
        sentiment: 'neutral',
        urgencyScore: 3,
        keywords: this.extractKeywords(fullText)
      };
    }
  }

  // Get category suggestions based on partial input
  public getSuggestions(partialText: string): string[] {
    const lowercaseText = partialText.toLowerCase();
    const suggestions: { category: string, relevance: number }[] = [];

    Object.entries(this.categoryKeywords).forEach(([category, data]) => {
      let relevance = 0;
      data.keywords.forEach(keyword => {
        if (keyword.includes(lowercaseText) || lowercaseText.includes(keyword)) {
          relevance += 1;
        }
      });
      if (relevance > 0) {
        suggestions.push({ category, relevance });
      }
    });

    return suggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5)
      .map(s => s.category);
  }

  // Get common issues for a category
  public getCommonIssues(category: string): string[] {
    return this.categoryKeywords[category]?.commonIssues || [];
  }

  // Initialize the service (can be extended to load ML models)
  public async initialize(): Promise<void> {
    try {
      // In a real implementation, you would load a pre-trained TensorFlow.js model here
      // await tf.loadLayersModel('/models/issue-classifier.json');
      console.log('AI Categorization service initialized');
    } catch (error) {
      console.warn('Failed to load ML model, using keyword-based fallback:', error);
    }
  }

  // Real-time classification as user types
  public async getRealtimeSuggestion(text: string): Promise<{
    category: string;
    confidence: number;
    reasoning: string;
  } | null> {
    if (text.length < 10) return null;

    const analysis = await this.analyzeReport('', text);
    const primary = analysis.primaryCategory;

    if (primary.confidence > 0.5) {
      const categoryData = this.categoryKeywords[primary.category];
      const matchedKeywords = categoryData?.keywords.filter(keyword => 
        text.toLowerCase().includes(keyword)
      ) || [];

      return {
        category: primary.category,
        confidence: primary.confidence,
        reasoning: `Detected keywords: ${matchedKeywords.join(', ')}`
      };
    }

    return null;
  }
}

// Export singleton instance
export const aiCategorization = new AICategorization();

// Auto-initialize
aiCategorization.initialize().catch(console.error);

export default aiCategorization;