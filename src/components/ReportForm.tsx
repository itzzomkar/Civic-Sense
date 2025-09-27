import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Camera, 
  MapPin, 
  Upload, 
  Mic, 
  MicOff, 
  Send, 
  Loader2, 
  LogIn, 
  X,
  Navigation,
  Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useStatistics } from "@/contexts/StatisticsContext";
import { useLanguage } from "@/contexts/LanguageContext";

const ReportForm = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [cityGuess, setCityGuess] = useState<string | null>(null);
  const [stateGuess, setStateGuess] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { incrementReports } = useStatistics();
  const { t, language } = useLanguage();

  const categories = [
    { value: "Road Maintenance", label: t.reportForm.categories.roadMaintenance, color: "bg-destructive" },
    { value: "Waste Management", label: t.reportForm.categories.wasteManagement, color: "bg-warning" },
    { value: "Water & Utilities", label: t.reportForm.categories.waterUtilities, color: "bg-primary" },
    { value: "Lighting", label: t.reportForm.categories.lighting, color: "bg-accent" },
    { value: "Vandalism", label: t.reportForm.categories.vandalism, color: "bg-secondary" },
    { value: "Traffic", label: t.reportForm.categories.traffic, color: "bg-destructive" },
    { value: "Infrastructure", label: t.reportForm.categories.infrastructure, color: "bg-muted-foreground" },
    { value: "Other", label: t.reportForm.categories.other, color: "bg-foreground" },
  ];

  // Prefill from URL params (for QR deep links)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const loc = params.get('location');
    const desc = params.get('description');
    const autodetect = params.get('autodetect');

    if (cat) setSelectedCategory(cat);
    if (loc) setLocation(loc);
    if (desc) setDescription(desc);

    if (autodetect === '1' || autodetect === 'true') {
      const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
      if (!isSecure) {
        // Inform user that mobile scan over LAN requires HTTPS for GPS
        toast({
          title: t?.toasts?.info || 'Notice',
          description: 'Auto-detect needs HTTPS (or localhost). On phones scanning a LAN IP, GPS may be blocked by the browser.',
        });
      }
      if ('geolocation' in navigator) {
        setIsFetchingLocation(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = Number(pos.coords.latitude.toFixed(6));
            const lng = Number(pos.coords.longitude.toFixed(6));
            setCoordinates({ lat, lng });
            // Show coordinates in the location field so the user sees something immediately
            setLocation(`${lat}, ${lng}`);
            setIsFetchingLocation(false);
            toast({ title: 'Location detected', description: `GPS: ${lat}, ${lng}` });
          },
          (err) => {
            console.warn('Geolocation error:', err);
            setIsFetchingLocation(false);
            let message = err.message || 'Unable to get location';
            if (!isSecure) {
              message += ' • Tip: use HTTPS or localhost to enable GPS.';
            }
            toast({ title: 'Location access failed', description: message, variant: 'destructive' });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        );
      } else {
        toast({ title: 'Location not supported', description: 'Your browser does not support geolocation.' });
      }
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setDescription(prev => prev + ' ' + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        
        let errorMessage = "Could not access microphone.";
        if (event.error === 'not-allowed') {
          errorMessage = "Microphone access denied. Please enable microphone permissions.";
        } else if (event.error === 'no-speech') {
          errorMessage = "No speech detected. Please try again.";
        } else if (event.error === 'network') {
          errorMessage = "Network error. Please check your connection.";
        }
        
        toast({
          title: t.toasts.error,
          description: errorMessage,
          variant: "destructive",
        });
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    // Cleanup camera stream on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast, stream]);

  // Handle Camera Capture - Open camera stream
  const handleCameraCapture = async () => {
    try {
      setShowCamera(true);
      setIsCapturing(true);
      
      // Request camera access
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setStream(mediaStream);
      
      // Set video source
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (error: any) {
      setShowCamera(false);
      setIsCapturing(false);
      
      let errorMessage = "Could not access camera.";
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = "Camera permission denied. Please enable camera access in your browser settings.";
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = "No camera found on this device.";
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = "Camera is already in use by another application.";
      }
      
      toast({
        title: t.toasts.error,
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Take photo from video stream
  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to video size
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        
        // Convert to base64
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImages(prev => [...prev, imageData]);
        
        toast({
          title: t.reportForm.messages.photoCaptured,
          description: t.reportForm.messages.photoAddedToReport,
        });
        
        // Close camera
        closeCamera();
      }
    }
  };

  // Close camera stream
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    setIsCapturing(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setCapturedImages(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        }
      });
      toast({
        title: t.reportForm.messages.filesUploaded,
        description: `${files.length} ${t.reportForm.messages.filesAddedToReport}`,
      });
    }
  };

  // Remove image
  const removeImage = (index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Handle Voice Recording
  const toggleRecording = async () => {
    if (!recognitionRef.current) {
      toast({
        title: t.toasts.error,
        description: t.reportForm.messages.voiceNotSupported,
        variant: "destructive",
      });
      return;
    }

    if (isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setIsRecording(false);
    } else {
      try {
        // Request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        recognitionRef.current.start();
        setIsRecording(true);
        toast({
          title: t.reportForm.messages.voiceRecordingStarted,
          description: t.reportForm.messages.speakNow,
        });
      } catch (error: any) {
        let errorMessage = "Could not access microphone.";
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          errorMessage = "Microphone permission denied. Please enable microphone access.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No microphone found on this device.";
        }
        
        toast({
          title: t.toasts.error,
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  // Get Current Location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: t.toasts.error,
        description: t.reportForm.messages.locationNotSupported,
        variant: "destructive",
      });
      return;
    }

    setIsFetchingLocation(true);
    toast({
      title: t.reportForm.messages.fetchingLocation,
      description: t.reportForm.messages.gettingCurrentLocation,
    });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        
        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          if (data.display_name) {
            setLocation(data.display_name);
            // Capture precise city/state from reverse geocoding when available
            const addr = data.address || {};
            setCityGuess(addr.city || addr.town || addr.village || addr.county || addr.district || null);
            setStateGuess(addr.state || null);
            toast({
              title: t.reportForm.messages.locationFound,
              description: t.reportForm.messages.locationAdded,
            });
          } else {
            setLocation(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
          }
        } catch (error) {
          // Fallback to coordinates if reverse geocoding fails
          setLocation(`Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
          toast({
            title: t.reportForm.messages.locationAdded,
            description: t.reportForm.messages.gpsCoordinatesAdded,
          });
        }
        setIsFetchingLocation(false);
      },
      (error) => {
        setIsFetchingLocation(false);
        let errorMessage = "Could not get your location.";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast({
          title: t.toasts.error,
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: t.reportForm.messages.authRequired,
        description: t.reportForm.messages.signInToSubmit,
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !selectedCategory || !description.trim() || !location.trim()) {
      toast({
        title: t.reportForm.messages.missingInfo,
        description: t.reportForm.messages.fillAllFields,
        variant: "destructive",
      });
      return;
    }

    // Heuristic city/state extraction from the typed address
    const guessCityState = (addr: string) => {
      // If the address is a plain GPS string like "Lat: x, Lng: y", don't try to parse city/state
      if (/^lat\s*:/i.test(addr)) {
        return { city: undefined, state: undefined };
      }
      const parts = addr.split(',').map(s => s.trim()).filter(Boolean);
      let state: string | undefined;
      let city: string | undefined;
      if (parts.length >= 1) state = parts[parts.length - 1];
      if (parts.length >= 2) city = parts[parts.length - 2];
      return {
        city: city && city.length > 0 ? city : undefined,
        state: state && state.length > 0 ? state : undefined,
      };
    };

    try {
      setIsSubmitting(true);

      // Build a backend-friendly location object
      const { city, state } = guessCityState(location.trim());
      const preparedLocation: any = {
        address: location.trim(),
        city: (cityGuess || city || 'Unknown'),
        state: (stateGuess || state || 'Unknown'),
        country: 'India',
      };
      if (coordinates) {
        // Save in both formats to support both backend variants
        preparedLocation.coordinates = {
          lat: Number(coordinates.lat),
          lng: Number(coordinates.lng),
        } as any;
        (preparedLocation as any).geo = {
          type: 'Point',
          coordinates: [Number(coordinates.lng), Number(coordinates.lat)],
        };
      } else {
        // Forward geocode typed address to get coordinates if user didn't press GPS button
        try {
          const q = encodeURIComponent(`${location.trim()}, ${preparedLocation.city}, ${preparedLocation.state}, India`);
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`, {
            headers: { 'Accept-Language': 'en' }
          });
          const geoJson = await geoRes.json();
          if (Array.isArray(geoJson) && geoJson.length > 0) {
            const lat = Number(geoJson[0].lat);
            const lng = Number(geoJson[0].lon);
            if (!isNaN(lat) && !isNaN(lng)) {
              preparedLocation.coordinates = {
                lat,
                lng,
              } as any;
              (preparedLocation as any).geo = {
                type: 'Point',
                coordinates: [lng, lat],
              };
            }
          }
        } catch (e) {
          // If geocoding fails, proceed without GPS; backend may still accept address-only
        }
      }
      
      const report = await apiService.createReport({
        title: title.trim(),
        description: description.trim(),
        category: selectedCategory,
        location: preparedLocation as any,
        status: 'pending',
        // userId is set server-side from the token on most backends
      } as any);
      
      // Increment statistics for new report
      incrementReports();
      
      toast({
        title: t.toasts.success,
        description: t.reportForm.messages.reportSubmitted,
      });

      // Reset form
      setTitle("");
      setSelectedCategory("");
      setDescription("");
      setLocation("");
      setCapturedImages([]);
      setCoordinates(null);
      setCityGuess(null);
      setStateGuess(null);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t.reportForm.messages.submitFailed;
      
      // Check if this is an offline storage message
      const isOfflineMode = errorMessage.includes('saved offline');
      
      toast({
        title: isOfflineMode ? "Report Saved Offline" : t.toasts.error,
        description: errorMessage,
        variant: isOfflineMode ? "default" : "destructive",
      });
      
      // If saved offline, still reset the form as it was "successful"
      if (isOfflineMode) {
        // Reset form
        setTitle("");
        setSelectedCategory("");
        setDescription("");
        setLocation("");
        setCapturedImages([]);
        setCoordinates(null);
        setCityGuess(null);
        setStateGuess(null);
        
        // Show additional info about offline mode
        setTimeout(() => {
          toast({
            title: "Offline Mode Active",
            description: "Your reports will sync automatically when connection is restored.",
          });
        }, 2000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="shadow-soft">
          <CardContent className="text-center py-12">
            <LogIn className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t.reportForm.signInRequired}</h2>
            <p className="text-muted-foreground mb-6">
              {t.reportForm.signInMessage}
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/login')} variant="default">
                {t.signIn.title}
              </Button>
              <Button onClick={() => navigate('/signup')} variant="outline">
                {t.signUp.linkText}
              </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Card className="shadow-soft">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold civic-gradient bg-clip-text text-transparent">
            {t.reportForm.title}
          </CardTitle>
          <p className="text-muted-foreground">
            {t.reportForm.subtitle}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">{t.reportForm.fields.title} *</Label>
              <Input
                id="title"
                placeholder={t.reportForm.placeholders.title}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            
            {/* Category Selection */}
            <div className="space-y-2">
              <Label htmlFor="category">{t.reportForm.fields.category} *</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isSubmitting}>
                <SelectTrigger>
                  <SelectValue placeholder={t.reportForm.placeholders.category} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        <span>{category.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Photo/Video Upload */}
            <div className="space-y-2">
              <Label>{t.reportForm.fields.photos}</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-20 flex-col" 
                  disabled={isSubmitting}
                  onClick={handleCameraCapture}
                >
                  <Camera className="w-6 h-6 mb-2" />
                  <span className="text-sm">{t.reportForm.buttons.takePhoto}</span>
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-20 flex-col" 
                  disabled={isSubmitting}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-6 h-6 mb-2" />
                  <span className="text-sm">{t.reportForm.buttons.uploadFiles}</span>
                </Button>
              </div>
              
              {/* Hidden file input for upload only */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              
              {/* Image Preview */}
              {capturedImages.length > 0 && (
                <div className="mt-4 space-y-2">
                  <Label className="text-sm">{t.reportForm.attachedImages} ({capturedImages.length})</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {capturedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Captured ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {t.reportForm.helpText.photos}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">{t.reportForm.fields.description} *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleRecording}
                  className={isRecording ? "text-destructive" : ""}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {isRecording ? t.reportForm.buttons.stop : t.reportForm.buttons.voice}
                </Button>
              </div>
              <Textarea
                id="description"
                placeholder={t.reportForm.placeholders.description}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
                required
                disabled={isSubmitting}
              />
              {isRecording && (
                <Badge variant="destructive" className="animate-pulse">
                  {t.reportForm.recordingStatus}
                </Badge>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">{t.reportForm.fields.location} *</Label>
              <div className="flex space-x-2">
                <Input
                  id="location"
                  placeholder={t.reportForm.placeholders.location}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1"
                  required
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="px-3"
                  disabled={isFetchingLocation || isSubmitting}
                >
                  {isFetchingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                </Button>
              </div>
              {coordinates && (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>📍 GPS: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</p>
                  <a 
                    href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-1"
                  >
                    {t.reportForm.viewOnMaps}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
              {!coordinates && (
                <p className="text-xs text-muted-foreground">
                  {t.reportForm.helpText.location}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="civic"
              className="w-full h-12 text-lg"
              disabled={isSubmitting || !title.trim() || !selectedCategory || !description.trim() || !location.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  {t.reportForm.buttons.submitting}
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  {t.reportForm.buttons.submit}
                </>
              )}
            </Button>
          </form>

          {/* Help Text */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {t.reportForm.disclaimer}
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full">
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              autoPlay
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button
                onClick={takePhoto}
                className="bg-white hover:bg-gray-100 text-black rounded-full w-16 h-16 p-0"
              >
                <Camera className="w-8 h-8" />
              </Button>
              <Button
                onClick={closeCamera}
                variant="destructive"
                className="rounded-full w-16 h-16 p-0"
              >
                <X className="w-8 h-8" />
              </Button>
            </div>
            
            <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-lg">
              <p className="text-sm">{t.reportForm.messages.tapToCapture}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportForm;
