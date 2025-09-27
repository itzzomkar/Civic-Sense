import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Mic, MicOff, Volume2, Play, Pause, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceReportInputProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
}

const VoiceReportInput = ({ onTranscription, disabled = false }: VoiceReportInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcription, setTranscription] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const { toast } = useToast();

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (recognitionRef.current) {
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US'; // Could be made dynamic based on user preference
        
        recognitionRef.current.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          if (finalTranscript) {
            setTranscription(prev => prev + finalTranscript);
            onTranscription(transcription + finalTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          toast({
            title: 'Voice recognition error',
            description: 'Please try again or type your report instead.',
            variant: 'destructive'
          });
        };
        
        recognitionRef.current.onend = () => {
          setIsRecording(false);
          setIsTranscribing(false);
        };
      }
    }
  }, [transcription, onTranscription, toast]);

  const startRecording = async () => {
    try {
      // Check for microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start speech recognition if available
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      // Also record audio for backup/playback
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) { // Max 2 minutes
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      
      toast({
        title: 'Recording started',
        description: 'Speak clearly about the civic issue you want to report.'
      });
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Cannot access microphone',
        description: 'Please allow microphone access and try again.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setIsRecording(false);
    setIsTranscribing(true);
    
    // Simulate processing time for transcription
    setTimeout(() => {
      setIsTranscribing(false);
      if (transcription) {
        toast({
          title: 'Voice transcribed successfully',
          description: 'Your voice report has been converted to text.'
        });
      }
    }, 2000);
  };

  const playRecording = () => {
    if (audioBlob && !isPlaying) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audioRef.current = audio;
      
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    } else if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    setTranscription('');
    setRecordingTime(0);
    setIsPlaying(false);
    onTranscription('');
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isSupported = typeof window !== 'undefined' && 
    (('SpeechRecognition' in window) || ('webkitSpeechRecognition' in window)) &&
    navigator.mediaDevices && 
    navigator.mediaDevices.getUserMedia;

  if (!isSupported) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-orange-800">
            Voice recording is not supported in your browser. Please type your report instead.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardContent className="p-4 space-y-4">
        {/* Recording Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording && !audioBlob ? (
            <Button
              onClick={startRecording}
              disabled={disabled}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Voice Report
            </Button>
          ) : isRecording ? (
            <Button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full animate-pulse"
            >
              <MicOff className="w-5 h-5 mr-2" />
              Stop Recording
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={playRecording}
                variant="outline"
                size="sm"
                disabled={!audioBlob}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                onClick={resetRecording}
                variant="outline"
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Record Again
              </Button>
            </div>
          )}
        </div>

        {/* Recording Progress */}
        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-red-600 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                Recording...
              </span>
              <span className="font-mono">{formatTime(recordingTime)}</span>
            </div>
            <Progress value={(recordingTime / 120) * 100} className="h-2" />
            <p className="text-xs text-center text-gray-600">
              Maximum recording time: 2 minutes
            </p>
          </div>
        )}

        {/* Transcription Progress */}
        {isTranscribing && (
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span className="text-sm">Converting speech to text...</span>
            </div>
            <Progress value={66} className="h-2" />
          </div>
        )}

        {/* Live Transcription */}
        {transcription && (
          <div className="p-3 bg-white rounded-md border border-blue-200">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Voice Transcription:</h4>
            <p className="text-sm text-gray-800 italic">"{transcription}"</p>
          </div>
        )}

        {/* Instructions */}
        <div className="text-xs text-center text-gray-600 space-y-1">
          <p>💡 <strong>Tips for better recognition:</strong></p>
          <p>• Speak clearly and at normal pace</p>
          <p>• Describe the location, issue type, and details</p>
          <p>• Mention if it's urgent or affects many people</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Type declarations for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default VoiceReportInput;