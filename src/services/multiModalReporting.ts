interface MediaCapture {
  id: string;
  type: 'video' | 'audio' | 'image' | 'document' | 'location' | 'ar_marker' | 'sketch';
  url: string;
  filename: string;
  size: number;
  duration?: number; // for video/audio
  mimeType: string;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  metadata: {
    capturedAt: Date;
    location?: GeolocationPosition;
    deviceInfo: DeviceInfo;
    cameraSettings?: CameraSettings;
    audioSettings?: AudioSettings;
    editingHistory?: EditAction[];
  };
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiAnalysis?: MediaAnalysis;
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  cameraCapabilities?: MediaDeviceInfo[];
  microphoneCapabilities?: MediaDeviceInfo[];
  screenResolution: { width: number; height: number };
}

interface CameraSettings {
  resolution: { width: number; height: number };
  frameRate: number;
  facingMode: 'user' | 'environment';
  flash: 'auto' | 'on' | 'off';
  focus: 'auto' | 'manual';
  zoom: number;
  stabilization: boolean;
}

interface AudioSettings {
  sampleRate: number;
  channels: number;
  bitRate: number;
  noiseCancellation: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
}

interface EditAction {
  id: string;
  type: 'crop' | 'rotate' | 'filter' | 'annotate' | 'trim' | 'enhance' | 'blur_sensitive';
  timestamp: Date;
  parameters: any;
  undoable: boolean;
}

interface MediaAnalysis {
  visualContent?: {
    objects: DetectedObject[];
    text: ExtractedText[];
    faces: FaceDetection[];
    landmarks: LandmarkDetection[];
    qualityScore: number;
  };
  audioContent?: {
    transcription: string;
    language: string;
    confidence: number;
    speakers: SpeakerIdentification[];
    emotions: EmotionAnalysis[];
  };
  contextualInfo: {
    location: LocationContext;
    timeContext: TimeContext;
    weatherConditions?: WeatherInfo;
    trafficConditions?: TrafficInfo;
  };
  civicRelevance: {
    categoryPredictions: { category: string; confidence: number }[];
    urgencyScore: number;
    publicSafetyConcern: boolean;
    estimatedCost: number;
  };
}

interface DetectedObject {
  id: string;
  name: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  category: 'infrastructure' | 'vehicle' | 'person' | 'sign' | 'damage' | 'waste' | 'vegetation';
}

interface ExtractedText {
  id: string;
  text: string;
  confidence: number;
  language: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  textType: 'sign' | 'license_plate' | 'address' | 'notice' | 'other';
}

interface FaceDetection {
  id: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  blurred: boolean; // Privacy protection
  estimatedAge?: number;
  emotion?: string;
}

interface LandmarkDetection {
  id: string;
  name: string;
  confidence: number;
  coordinates: { lat: number; lng: number };
  category: 'building' | 'monument' | 'park' | 'intersection' | 'facility';
}

interface SpeakerIdentification {
  speakerId: string;
  startTime: number;
  endTime: number;
  confidence: number;
  characteristics: string[];
}

interface EmotionAnalysis {
  emotion: 'angry' | 'frustrated' | 'concerned' | 'neutral' | 'satisfied' | 'happy';
  confidence: number;
  timeSpan: { start: number; end: number };
}

interface LocationContext {
  address: string;
  coordinates: { lat: number; lng: number };
  accuracy: number;
  nearbyLandmarks: string[];
  administrativeArea: string;
  postalCode: string;
}

interface TimeContext {
  timestamp: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  season: 'spring' | 'summer' | 'fall' | 'winter';
  isWorkingHours: boolean;
  isWeekend: boolean;
}

interface WeatherInfo {
  temperature: number;
  humidity: number;
  conditions: string;
  visibility: number;
  windSpeed: number;
}

interface TrafficInfo {
  congestionLevel: 'low' | 'medium' | 'high' | 'severe';
  estimatedSpeed: number;
  nearbyEvents: string[];
}

interface ARMarker {
  id: string;
  position: { x: number; y: number; z: number };
  type: 'location_pin' | 'measurement' | 'annotation' | 'direction_arrow';
  data: any;
  visible: boolean;
  persistent: boolean;
}

interface SketchAnnotation {
  id: string;
  type: 'arrow' | 'circle' | 'rectangle' | 'freehand' | 'text' | 'measurement';
  coordinates: number[][];
  style: {
    color: string;
    strokeWidth: number;
    opacity: number;
    fill?: string;
  };
  text?: string;
  measurements?: { value: number; unit: string };
}

interface VoiceNote {
  id: string;
  audioUrl: string;
  duration: number;
  transcription: string;
  language: string;
  confidence: number;
  keywords: string[];
  summary: string;
  timestamp: Date;
  location?: GeolocationPosition;
}

export class MultiModalReportingService {
  private mediaCaptures: Map<string, MediaCapture> = new Map();
  private arMarkers: Map<string, ARMarker> = new Map();
  private sketchAnnotations: Map<string, SketchAnnotation> = new Map();
  private voiceNotes: Map<string, VoiceNote> = new Map();
  private isInitialized = false;
  private supportedFormats = {
    video: ['webm', 'mp4', 'mov'],
    audio: ['webm', 'mp3', 'wav', 'm4a'],
    image: ['jpg', 'jpeg', 'png', 'webp'],
    document: ['pdf', 'doc', 'docx', 'txt']
  };

  constructor() {
    this.initializeMediaCapabilities();
  }

  private async initializeMediaCapabilities() {
    try {
      // Check device capabilities
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      console.log(`📹 Video devices found: ${videoDevices.length}`);
      console.log(`🎤 Audio devices found: ${audioDevices.length}`);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize media capabilities:', error);
    }
  }

  // Video Recording
  public async startVideoRecording(options: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    maxDuration: number;
    facingMode?: 'user' | 'environment';
  }): Promise<string> {
    const captureId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const constraints = this.getVideoConstraints(options);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: this.getVideoBitRate(options.quality)
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const videoBlob = new Blob(chunks, { type: 'video/webm' });
        await this.processVideoCapture(captureId, videoBlob, options);
        
        // Stop camera stream
        stream.getTracks().forEach(track => track.stop());
      };

      // Auto-stop after max duration
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, options.maxDuration * 1000);

      mediaRecorder.start();
      
      // Create media capture record
      const mediaCapture: MediaCapture = {
        id: captureId,
        type: 'video',
        url: '',
        filename: `video_${Date.now()}.webm`,
        size: 0,
        quality: options.quality,
        mimeType: 'video/webm',
        metadata: {
          capturedAt: new Date(),
          location: await this.getCurrentLocation(),
          deviceInfo: this.getDeviceInfo(),
          cameraSettings: this.getCameraSettings(options)
        },
        processingStatus: 'pending'
      };

      this.mediaCaptures.set(captureId, mediaCapture);
      
      return captureId;
    } catch (error) {
      console.error('Failed to start video recording:', error);
      throw error;
    }
  }

  private getVideoConstraints(options: any): MediaStreamConstraints {
    const resolutions = {
      low: { width: 640, height: 480 },
      medium: { width: 1280, height: 720 },
      high: { width: 1920, height: 1080 },
      ultra: { width: 3840, height: 2160 }
    };

    return {
      video: {
        ...resolutions[options.quality],
        facingMode: options.facingMode || 'environment',
        frameRate: options.quality === 'ultra' ? 60 : 30
      },
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
  }

  private getVideoBitRate(quality: string): number {
    const bitRates = {
      low: 500000,      // 0.5 Mbps
      medium: 1500000,  // 1.5 Mbps
      high: 4000000,    // 4 Mbps
      ultra: 8000000    // 8 Mbps
    };
    return bitRates[quality as keyof typeof bitRates] || bitRates.medium;
  }

  private async processVideoCapture(captureId: string, videoBlob: Blob, options: any) {
    const mediaCapture = this.mediaCaptures.get(captureId);
    if (!mediaCapture) return;

    mediaCapture.processingStatus = 'processing';
    mediaCapture.size = videoBlob.size;
    mediaCapture.url = URL.createObjectURL(videoBlob);
    
    // Get video duration
    const video = document.createElement('video');
    video.src = mediaCapture.url;
    
    video.onloadedmetadata = async () => {
      mediaCapture.duration = video.duration;
      
      // AI Analysis
      mediaCapture.aiAnalysis = await this.analyzeVideoContent(videoBlob, video);
      mediaCapture.processingStatus = 'completed';
      
      console.log(`🎥 Video processed: ${mediaCapture.filename} (${(mediaCapture.size / 1024 / 1024).toFixed(2)}MB)`);
    };
  }

  private async analyzeVideoContent(videoBlob: Blob, videoElement: HTMLVideoElement): Promise<MediaAnalysis> {
    // Capture frame for visual analysis
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    ctx.drawImage(videoElement, 0, 0);
    
    // Simulate AI analysis (in real implementation, use computer vision APIs)
    const visualContent = await this.analyzeImageContent(canvas);
    const contextualInfo = await this.getContextualInfo();
    
    return {
      visualContent,
      contextualInfo,
      civicRelevance: {
        categoryPredictions: [
          { category: 'Road Maintenance', confidence: 0.8 },
          { category: 'Infrastructure', confidence: 0.6 }
        ],
        urgencyScore: 7,
        publicSafetyConcern: false,
        estimatedCost: 500
      }
    };
  }

  // Audio Recording & Voice Notes
  public async startAudioRecording(options: {
    maxDuration: number;
    quality: 'low' | 'medium' | 'high';
    transcribeRealtime: boolean;
  }): Promise<string> {
    const captureId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const constraints = this.getAudioConstraints(options);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: this.getAudioBitRate(options.quality)
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        await this.processAudioCapture(captureId, audioBlob, options);
        
        // Stop microphone stream
        stream.getTracks().forEach(track => track.stop());
      };

      // Auto-stop after max duration
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, options.maxDuration * 1000);

      mediaRecorder.start();
      
      // Create media capture record
      const mediaCapture: MediaCapture = {
        id: captureId,
        type: 'audio',
        url: '',
        filename: `audio_${Date.now()}.webm`,
        size: 0,
        quality: options.quality,
        mimeType: 'audio/webm',
        metadata: {
          capturedAt: new Date(),
          location: await this.getCurrentLocation(),
          deviceInfo: this.getDeviceInfo(),
          audioSettings: this.getAudioSettings(options)
        },
        processingStatus: 'pending'
      };

      this.mediaCaptures.set(captureId, mediaCapture);
      
      return captureId;
    } catch (error) {
      console.error('Failed to start audio recording:', error);
      throw error;
    }
  }

  private getAudioConstraints(options: any): MediaStreamConstraints {
    return {
      audio: {
        sampleRate: options.quality === 'high' ? 48000 : 44100,
        channelCount: 2,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    };
  }

  private getAudioBitRate(quality: string): number {
    const bitRates = {
      low: 64000,    // 64 kbps
      medium: 128000, // 128 kbps
      high: 256000   // 256 kbps
    };
    return bitRates[quality as keyof typeof bitRates] || bitRates.medium;
  }

  private async processAudioCapture(captureId: string, audioBlob: Blob, options: any) {
    const mediaCapture = this.mediaCaptures.get(captureId);
    if (!mediaCapture) return;

    mediaCapture.processingStatus = 'processing';
    mediaCapture.size = audioBlob.size;
    mediaCapture.url = URL.createObjectURL(audioBlob);
    
    // Get audio duration
    const audio = new Audio(mediaCapture.url);
    
    audio.onloadedmetadata = async () => {
      mediaCapture.duration = audio.duration;
      
      // Transcription and analysis
      const transcription = await this.transcribeAudio(audioBlob);
      const voiceNote = await this.createVoiceNote(captureId, audioBlob, transcription);
      
      mediaCapture.aiAnalysis = {
        audioContent: {
          transcription: transcription.text,
          language: transcription.language,
          confidence: transcription.confidence,
          speakers: transcription.speakers || [],
          emotions: transcription.emotions || []
        },
        contextualInfo: await this.getContextualInfo(),
        civicRelevance: this.analyzeCivicRelevance(transcription.text)
      };
      
      mediaCapture.processingStatus = 'completed';
      this.voiceNotes.set(captureId, voiceNote);
      
      console.log(`🎤 Audio processed: ${mediaCapture.filename} (${(mediaCapture.size / 1024 / 1024).toFixed(2)}MB)`);
    };
  }

  private async transcribeAudio(audioBlob: Blob): Promise<{
    text: string;
    language: string;
    confidence: number;
    speakers?: SpeakerIdentification[];
    emotions?: EmotionAnalysis[];
  }> {
    // Simulate speech-to-text (in real implementation, use Web Speech API or cloud service)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          text: "There's a large pothole on Main Street that needs immediate attention. It's causing traffic delays and could damage vehicles.",
          language: 'en-US',
          confidence: 0.92,
          speakers: [{
            speakerId: 'speaker_1',
            startTime: 0,
            endTime: 8.5,
            confidence: 0.88,
            characteristics: ['male', 'adult', 'concerned']
          }],
          emotions: [{
            emotion: 'concerned',
            confidence: 0.85,
            timeSpan: { start: 0, end: 8.5 }
          }]
        });
      }, 2000);
    });
  }

  private async createVoiceNote(captureId: string, audioBlob: Blob, transcription: any): Promise<VoiceNote> {
    const keywords = this.extractKeywords(transcription.text);
    const summary = this.generateSummary(transcription.text);
    
    return {
      id: captureId,
      audioUrl: URL.createObjectURL(audioBlob),
      duration: 0, // Will be set when audio loads
      transcription: transcription.text,
      language: transcription.language,
      confidence: transcription.confidence,
      keywords,
      summary,
      timestamp: new Date(),
      location: await this.getCurrentLocation()
    };
  }

  // AR Location Marking
  public async startARSession(reportLocation: { lat: number; lng: number }): Promise<string> {
    const sessionId = `ar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Request camera permissions for AR
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      console.log(`🔍 AR Session started: ${sessionId}`);
      
      // Initialize AR markers
      this.initializeARMarkers(sessionId, reportLocation);
      
      return sessionId;
    } catch (error) {
      console.error('Failed to start AR session:', error);
      throw error;
    }
  }

  private initializeARMarkers(sessionId: string, location: { lat: number; lng: number }) {
    // Create default location pin
    const locationPin: ARMarker = {
      id: `marker_${sessionId}_location`,
      position: { x: 0, y: 0, z: -2 }, // 2 meters in front
      type: 'location_pin',
      data: { location, label: 'Report Location' },
      visible: true,
      persistent: true
    };
    
    this.arMarkers.set(locationPin.id, locationPin);
  }

  public addARMarker(sessionId: string, marker: Omit<ARMarker, 'id'>): string {
    const markerId = `marker_${sessionId}_${Date.now()}`;
    const arMarker: ARMarker = {
      ...marker,
      id: markerId
    };
    
    this.arMarkers.set(markerId, arMarker);
    console.log(`📍 AR Marker added: ${markerId}`);
    
    return markerId;
  }

  // Sketch Annotations
  public createSketch(dimensions: { width: number; height: number }): string {
    const sketchId = `sketch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`✏️ Sketch session created: ${sketchId}`);
    return sketchId;
  }

  public addSketchAnnotation(sketchId: string, annotation: Omit<SketchAnnotation, 'id'>): string {
    const annotationId = `annotation_${sketchId}_${Date.now()}`;
    const sketchAnnotation: SketchAnnotation = {
      ...annotation,
      id: annotationId
    };
    
    this.sketchAnnotations.set(annotationId, sketchAnnotation);
    console.log(`✏️ Sketch annotation added: ${annotationId}`);
    
    return annotationId;
  }

  // Image Analysis
  private async analyzeImageContent(canvas: HTMLCanvasElement): Promise<any> {
    // Simulate computer vision analysis
    const objects: DetectedObject[] = [
      {
        id: 'obj_1',
        name: 'pothole',
        confidence: 0.92,
        boundingBox: { x: 120, y: 180, width: 80, height: 60 },
        category: 'damage'
      },
      {
        id: 'obj_2',
        name: 'road_sign',
        confidence: 0.87,
        boundingBox: { x: 300, y: 50, width: 40, height: 40 },
        category: 'sign'
      }
    ];

    const text: ExtractedText[] = [
      {
        id: 'text_1',
        text: 'MAIN ST',
        confidence: 0.95,
        language: 'en',
        boundingBox: { x: 290, y: 45, width: 50, height: 15 },
        textType: 'sign'
      }
    ];

    return {
      objects,
      text,
      faces: [], // Privacy-protected, would be blurred
      landmarks: [],
      qualityScore: 0.88
    };
  }

  private async getCurrentLocation(): Promise<GeolocationPosition | undefined> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(undefined);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        () => resolve(undefined),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }

  private getDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      deviceType: this.detectDeviceType(),
      screenResolution: {
        width: window.screen.width,
        height: window.screen.height
      }
    };
  }

  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mobile')) return 'mobile';
    if (userAgent.includes('tablet') || userAgent.includes('ipad')) return 'tablet';
    return 'desktop';
  }

  private getCameraSettings(options: any): CameraSettings {
    return {
      resolution: options.quality === 'ultra' ? { width: 3840, height: 2160 } : { width: 1920, height: 1080 },
      frameRate: options.quality === 'ultra' ? 60 : 30,
      facingMode: options.facingMode || 'environment',
      flash: 'auto',
      focus: 'auto',
      zoom: 1.0,
      stabilization: true
    };
  }

  private getAudioSettings(options: any): AudioSettings {
    return {
      sampleRate: options.quality === 'high' ? 48000 : 44100,
      channels: 2,
      bitRate: this.getAudioBitRate(options.quality),
      noiseCancellation: true,
      echoCancellation: true,
      autoGainControl: true
    };
  }

  private async getContextualInfo(): Promise<any> {
    const now = new Date();
    const location = await this.getCurrentLocation();
    
    return {
      location: location ? {
        address: 'Main Street, City Center',
        coordinates: { lat: location.coords.latitude, lng: location.coords.longitude },
        accuracy: location.coords.accuracy,
        nearbyLandmarks: ['City Hall', 'Central Park'],
        administrativeArea: 'Downtown',
        postalCode: '12345'
      } : undefined,
      timeContext: {
        timestamp: now,
        timeOfDay: this.getTimeOfDay(now.getHours()),
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
        season: this.getSeason(now.getMonth()),
        isWorkingHours: this.isWorkingHours(now),
        isWeekend: now.getDay() === 0 || now.getDay() === 6
      },
      weatherConditions: {
        temperature: 22,
        humidity: 65,
        conditions: 'Partly Cloudy',
        visibility: 10,
        windSpeed: 5
      }
    };
  }

  private getTimeOfDay(hour: number): string {
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private getSeason(month: number): string {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private isWorkingHours(date: Date): boolean {
    const hour = date.getHours();
    const isWeekday = date.getDay() !== 0 && date.getDay() !== 6;
    return isWeekday && hour >= 9 && hour < 17;
  }

  private analyzeCivicRelevance(text: string): any {
    const civicKeywords = {
      'Road Maintenance': ['pothole', 'road', 'street', 'pavement', 'crack'],
      'Water & Utilities': ['water', 'pipe', 'leak', 'flood', 'drainage'],
      'Waste Management': ['garbage', 'trash', 'waste', 'bin', 'litter'],
      'Traffic': ['traffic', 'signal', 'sign', 'congestion', 'accident'],
      'Lighting': ['light', 'lamp', 'dark', 'broken', 'flickering']
    };

    const predictions = Object.entries(civicKeywords).map(([category, keywords]) => {
      const matches = keywords.filter(keyword => text.toLowerCase().includes(keyword)).length;
      return { category, confidence: Math.min(matches * 0.3, 0.95) };
    }).filter(p => p.confidence > 0);

    const urgencyKeywords = ['urgent', 'emergency', 'dangerous', 'immediate', 'critical'];
    const urgencyScore = urgencyKeywords.some(keyword => text.toLowerCase().includes(keyword)) ? 9 : 5;

    return {
      categoryPredictions: predictions,
      urgencyScore,
      publicSafetyConcern: urgencyScore >= 8,
      estimatedCost: this.estimateCost(predictions[0]?.category || 'Other')
    };
  }

  private estimateCost(category: string): number {
    const costEstimates = {
      'Road Maintenance': 1200,
      'Water & Utilities': 800,
      'Waste Management': 200,
      'Traffic': 600,
      'Lighting': 300,
      'Infrastructure': 2000,
      'Other': 500
    };
    return costEstimates[category as keyof typeof costEstimates] || 500;
  }

  private extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 10);
  }

  private generateSummary(text: string): string {
    // Simple extractive summarization
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length <= 2) return text;
    
    // Return first and most informative sentence
    return sentences[0].trim() + '.';
  }

  // Public API Methods

  public getMediaCapture(captureId: string): MediaCapture | null {
    return this.mediaCaptures.get(captureId) || null;
  }

  public getAllMediaCaptures(): MediaCapture[] {
    return Array.from(this.mediaCaptures.values());
  }

  public getVoiceNote(noteId: string): VoiceNote | null {
    return this.voiceNotes.get(noteId) || null;
  }

  public getAllVoiceNotes(): VoiceNote[] {
    return Array.from(this.voiceNotes.values());
  }

  public getARMarkers(sessionId: string): ARMarker[] {
    return Array.from(this.arMarkers.values())
      .filter(marker => marker.id.includes(sessionId));
  }

  public getSketchAnnotations(sketchId: string): SketchAnnotation[] {
    return Array.from(this.sketchAnnotations.values())
      .filter(annotation => annotation.id.includes(sketchId));
  }

  public exportMediaReport(captureIds: string[]): {
    mediaCaptures: MediaCapture[];
    totalSize: number;
    totalDuration: number;
    aiInsights: any;
  } {
    const captures = captureIds.map(id => this.mediaCaptures.get(id)).filter(Boolean) as MediaCapture[];
    const totalSize = captures.reduce((sum, capture) => sum + capture.size, 0);
    const totalDuration = captures.reduce((sum, capture) => sum + (capture.duration || 0), 0);
    
    // Aggregate AI insights
    const aiInsights = {
      detectedObjects: captures.flatMap(c => c.aiAnalysis?.visualContent?.objects || []),
      extractedText: captures.flatMap(c => c.aiAnalysis?.visualContent?.text || []),
      transcriptions: captures.filter(c => c.type === 'audio').map(c => c.aiAnalysis?.audioContent?.transcription).filter(Boolean),
      avgCivicRelevance: captures.reduce((sum, c) => sum + (c.aiAnalysis?.civicRelevance?.urgencyScore || 0), 0) / captures.length,
      estimatedTotalCost: captures.reduce((sum, c) => sum + (c.aiAnalysis?.civicRelevance?.estimatedCost || 0), 0)
    };

    return {
      mediaCaptures: captures,
      totalSize,
      totalDuration,
      aiInsights
    };
  }

  public getCapabilityReport(): {
    video: boolean;
    audio: boolean;
    camera: boolean;
    geolocation: boolean;
    ar: boolean;
    supportedFormats: typeof this.supportedFormats;
  } {
    return {
      video: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      audio: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      geolocation: 'geolocation' in navigator,
      ar: 'xr' in navigator, // WebXR support
      supportedFormats: this.supportedFormats
    };
  }

  public cleanup(): void {
    // Cleanup media URLs to free memory
    this.mediaCaptures.forEach(capture => {
      if (capture.url) {
        URL.revokeObjectURL(capture.url);
      }
    });
    
    this.voiceNotes.forEach(note => {
      if (note.audioUrl) {
        URL.revokeObjectURL(note.audioUrl);
      }
    });

    this.mediaCaptures.clear();
    this.voiceNotes.clear();
    this.arMarkers.clear();
    this.sketchAnnotations.clear();
  }
}

export const multiModalReporting = new MultiModalReportingService();
export default multiModalReporting;