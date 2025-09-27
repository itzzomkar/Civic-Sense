import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from '@/components/ui/dialog';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  X,
  Upload,
  Film,
  Settings,
  Info,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VideoData {
  url: string;
  title: string;
  description: string;
  uploadedAt: string;
  uploadedBy: string;
}

export default function VideoDemo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Check if user is admin (you can modify this logic based on your admin criteria)
  const isAdmin = user?.email === 'admin@example.com' || user?.role === 'admin';
  
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('Platform Demo');
  const [videoDescription, setVideoDescription] = useState('Learn how to use Urban Guardians to report and track civic issues in your community.');
  
  // Load saved video data from localStorage
  const [videoData, setVideoData] = useState<VideoData | null>(() => {
    const saved = localStorage.getItem('demoVideo');
    if (saved) {
      return JSON.parse(saved);
    }
    // Default demo video (you can use any public video URL for testing)
    return {
      url: 'https://www.w3schools.com/html/mov_bbb.mp4', // Sample video for testing
      title: 'Urban Guardians Platform Demo',
      description: 'Learn how to use our platform to report and track civic issues in your community. See how easy it is to make a difference!',
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'System'
    };
  });

  useEffect(() => {
    // Save video data to localStorage whenever it changes
    if (videoData) {
      localStorage.setItem('demoVideo', JSON.stringify(videoData));
    }
  }, [videoData]);

  // Video control functions
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen && containerRef.current) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if ((containerRef.current as any).webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      } else if ((containerRef.current as any).msRequestFullscreen) {
        (containerRef.current as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // Handle video upload/update (admin only)
  const handleVideoUpdate = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "URL Required",
        description: "Please enter a valid video URL",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newVideoData: VideoData = {
      url: videoUrl.trim(),
      title: videoTitle.trim() || 'Platform Demo',
      description: videoDescription.trim() || 'Learn how to use Urban Guardians',
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.name || 'Admin'
    };
    
    setVideoData(newVideoData);
    setIsLoading(false);
    setShowAdminPanel(false);
    
    toast({
      title: "Video Updated",
      description: "Demo video has been successfully updated",
    });
  };

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Reset playing state when dialog closes
  useEffect(() => {
    if (!isOpen && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Watch Demo Button */}
      <Button 
        onClick={() => setIsOpen(true)}
        variant="outline" 
        size="lg" 
        className="text-lg px-8 py-6"
      >
        <Film className="w-5 h-5 mr-2" />
        Watch Demo
      </Button>

      {/* Video Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl w-full p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">
                  {videoData?.title || 'Platform Demo'}
                </DialogTitle>
                <DialogDesc className="mt-2">
                  {videoData?.description}
                </DialogDesc>
              </div>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Admin Panel */}
          {isAdmin && showAdminPanel && (
            <div className="px-6 py-4 bg-muted/50 border-y">
              <div className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Admin Panel: Update the demo video URL and details below.
                  </AlertDescription>
                </Alert>
                
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="video-url">Video URL</Label>
                    <Input
                      id="video-url"
                      placeholder="Enter video URL (MP4, WebM, or YouTube embed URL)"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="video-title">Title</Label>
                    <Input
                      id="video-title"
                      placeholder="Enter video title"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="video-desc">Description</Label>
                    <Input
                      id="video-desc"
                      placeholder="Enter video description"
                      value={videoDescription}
                      onChange={(e) => setVideoDescription(e.target.value)}
                    />
                  </div>
                  
                  <Button 
                    onClick={handleVideoUpdate} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Update Video
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Video Container */}
          <div 
            ref={containerRef}
            className="relative bg-black aspect-video w-full"
          >
            {videoData?.url ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-contain"
                  src={videoData.url}
                  poster="/api/placeholder/1280/720"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onLoadStart={() => setIsLoading(true)}
                  onLoadedData={() => setIsLoading(false)}
                  preload="metadata"
                  playsInline
                  controls={false}
                >
                  Your browser does not support the video tag.
                </video>

                {/* Custom Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={togglePlay}
                      >
                        {isPlaying ? (
                          <Pause className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={toggleMute}
                      >
                        {isMuted ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={toggleFullscreen}
                    >
                      <Maximize2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white">
                  <Film className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No video available</p>
                  {isAdmin && (
                    <p className="text-sm mt-2 opacity-75">
                      Click Admin to add a demo video
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          {videoData && (
            <div className="px-6 py-4 border-t bg-muted/30">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Uploaded by {videoData.uploadedBy}
                </span>
                <span>
                  {new Date(videoData.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}