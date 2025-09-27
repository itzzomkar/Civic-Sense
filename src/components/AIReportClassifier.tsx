import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

interface ClassificationResult {
  category: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  suggestedDepartment: string;
}

interface AIReportClassifierProps {
  reportText: string;
  onClassification: (result: ClassificationResult) => void;
}

const AIReportClassifier = ({ reportText, onClassification }: AIReportClassifierProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [model, setModel] = useState<tf.LayersModel | null>(null);

  // Category mapping
  const categories = {
    0: 'Road Maintenance',
    1: 'Waste Management',
    2: 'Water & Utilities',
    3: 'Lighting',
    4: 'Vandalism',
    5: 'Traffic',
    6: 'Infrastructure',
    7: 'Other'
  };

  const departmentMapping = {
    'Road Maintenance': 'PWD',
    'Water & Utilities': 'Water Board',
    'Lighting': 'Electricity Board',
    'Traffic': 'Traffic Police',
    'Waste Management': 'Municipal Corporation',
    'Infrastructure': 'PWD',
    'Vandalism': 'Municipal Corporation',
    'Other': 'Municipal Corporation'
  };

  const priorityKeywords = {
    urgent: ['emergency', 'danger', 'urgent', 'immediate', 'serious', 'critical'],
    high: ['major', 'important', 'significant', 'severe', 'bad'],
    medium: ['moderate', 'concern', 'issue', 'problem'],
    low: ['minor', 'small', 'slight']
  };

  // Load or create a simple classification model
  useEffect(() => {
    const loadModel = async () => {
      try {
        // In production, load your trained model
        // For demo, we'll create a simple rule-based system
        console.log('AI Classifier initialized');
      } catch (error) {
        console.error('Failed to load AI model:', error);
      }
    };

    loadModel();
  }, []);

  const analyzeText = async (text: string): Promise<ClassificationResult> => {
    const textLower = text.toLowerCase();
    
    // Rule-based classification for demo
    let category = 'Other';
    let confidence = 0.5;
    
    const roadKeywords = ['road', 'street', 'pothole', 'pavement', 'crack', 'construction'];
    const wasteKeywords = ['garbage', 'trash', 'waste', 'dump', 'litter', 'cleaning'];
    const waterKeywords = ['water', 'pipe', 'leak', 'drainage', 'flood', 'sewer'];
    const lightKeywords = ['light', 'lamp', 'electricity', 'power', 'dark', 'bulb'];
    const trafficKeywords = ['traffic', 'signal', 'parking', 'vehicle', 'jam', 'congestion'];
    
    if (roadKeywords.some(keyword => textLower.includes(keyword))) {
      category = 'Road Maintenance';
      confidence = 0.85;
    } else if (wasteKeywords.some(keyword => textLower.includes(keyword))) {
      category = 'Waste Management';
      confidence = 0.82;
    } else if (waterKeywords.some(keyword => textLower.includes(keyword))) {
      category = 'Water & Utilities';
      confidence = 0.88;
    } else if (lightKeywords.some(keyword => textLower.includes(keyword))) {
      category = 'Lighting';
      confidence = 0.80;
    } else if (trafficKeywords.some(keyword => textLower.includes(keyword))) {
      category = 'Traffic';
      confidence = 0.75;
    }

    // Determine priority
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    
    if (priorityKeywords.urgent.some(keyword => textLower.includes(keyword))) {
      priority = 'urgent';
    } else if (priorityKeywords.high.some(keyword => textLower.includes(keyword))) {
      priority = 'high';
    } else if (priorityKeywords.low.some(keyword => textLower.includes(keyword))) {
      priority = 'low';
    }

    return {
      category,
      confidence,
      priority,
      suggestedDepartment: departmentMapping[category as keyof typeof departmentMapping]
    };
  };

  const handleAnalyze = async () => {
    if (!reportText.trim() || reportText.length < 10) return;
    
    setIsAnalyzing(true);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = await analyzeText(reportText);
      setClassification(result);
      onClassification(result);
    } catch (error) {
      console.error('Classification error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (reportText.length > 20) {
      const debounceTimer = setTimeout(() => {
        handleAnalyze();
      }, 2000);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [reportText]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (!reportText.trim() || reportText.length < 10) {
    return null;
  }

  return (
    <Card className="mt-4 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-blue-800">
          <Brain className="w-4 h-4" />
          AI Analysis
          {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isAnalyzing ? (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing report content...
          </div>
        ) : classification ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Analysis Complete</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Category</p>
                <Badge variant="outline" className="text-xs">
                  {classification.category}
                </Badge>
              </div>
              
              <div>
                <p className="text-xs text-gray-600 mb-1">Priority</p>
                <Badge className={`text-xs text-white ${getPriorityColor(classification.priority)}`}>
                  {classification.priority.toUpperCase()}
                </Badge>
              </div>
            </div>
            
            <div>
              <p className="text-xs text-gray-600 mb-1">Suggested Department</p>
              <Badge variant="secondary" className="text-xs">
                {classification.suggestedDepartment}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 pt-2 border-t">
              <AlertTriangle className="w-3 h-3 text-gray-400" />
              <span className={`text-xs ${getConfidenceColor(classification.confidence)}`}>
                {Math.round(classification.confidence * 100)}% confidence
              </span>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default AIReportClassifier;