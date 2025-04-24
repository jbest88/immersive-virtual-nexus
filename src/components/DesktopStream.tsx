
import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Monitor, MonitorX, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import screenCaptureService, { DisplayDevice } from '@/services/screenCaptureService';
import { toast } from '@/components/ui/use-toast';

interface DesktopStreamProps {
  deviceId?: string;
  className?: string;
  onStreamChange?: (stream: MediaStream | null) => void;
}

const DesktopStream: React.FC<DesktopStreamProps> = ({ 
  deviceId = 'display-1', 
  className,
  onStreamChange
}) => {
  const [streamStatus, setStreamStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [availableDevices, setAvailableDevices] = useState<DisplayDevice[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState(deviceId);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Initialize and load available devices
  useEffect(() => {
    const loadDevices = async () => {
      const devices = await screenCaptureService.getDisplayDevices();
      setAvailableDevices(devices);
    };
    
    loadDevices();
    
    return () => {
      if (streamRef.current) {
        stopCapture();
      }
    };
  }, []);
  
  const startCapture = async () => {
    setStreamStatus('connecting');
    
    try {
      const stream = await screenCaptureService.captureScreen(activeDeviceId);
      
      if (stream) {
        streamRef.current = stream;
        setStreamStatus('connected');
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        
        // Notify parent about the new stream
        if (onStreamChange) {
          onStreamChange(stream);
        }
        
        toast({
          title: "Screen Capture Started",
          description: "Your desktop is now being streamed to VR"
        });
      } else {
        setStreamStatus('error');
        setErrorMessage('Failed to start stream');
      }
    } catch (error) {
      console.error('Error starting capture:', error);
      setStreamStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to capture screen');
    }
  };
  
  const stopCapture = () => {
    if (streamRef.current) {
      screenCaptureService.stopCapture(activeDeviceId);
      streamRef.current = null;
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // Notify parent about stream ended
      if (onStreamChange) {
        onStreamChange(null);
      }
    }
    
    setStreamStatus('idle');
  };
  
  const handleDeviceChange = (deviceId: string) => {
    if (streamStatus === 'connected') {
      stopCapture();
    }
    
    setActiveDeviceId(deviceId);
  };
  
  const handleRetry = () => {
    setStreamStatus('idle');
    setErrorMessage('');
  };
  
  return (
    <Card className={cn("overflow-hidden relative", className)}>
      {streamStatus === 'idle' && (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-vr-bg">
          <Monitor className="h-12 w-12 mb-4 text-vr-accent" />
          <p className="text-vr-text text-xl mb-4">Ready to Stream Desktop</p>
          <Button 
            onClick={startCapture} 
            className="bg-vr-accent hover:bg-vr-accent/80"
          >
            Start Capture
          </Button>
        </div>
      )}
      
      {streamStatus === 'connecting' && (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-vr-bg">
          <div className="w-12 h-12 border-4 border-vr-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-vr-text text-xl">Connecting to desktop stream...</p>
        </div>
      )}
      
      {streamStatus === 'error' && (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-vr-bg">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <MonitorX className="h-10 w-10 text-red-400" />
          </div>
          <p className="text-red-400 text-xl mb-2">Connection Failed</p>
          <p className="text-vr-text/80 text-center mb-4">{errorMessage}</p>
          <Button 
            onClick={handleRetry} 
            variant="outline" 
            className="border-vr-accent/50 text-vr-accent"
          >
            <RefreshCcw className="h-4 w-4 mr-2" /> Try Again
          </Button>
        </div>
      )}
      
      {streamStatus === 'connected' && (
        <div className="relative h-full">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Stream controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 backdrop-blur-sm flex items-center justify-between">
            <span className="text-white text-xs">Desktop Stream</span>
            <Button 
              size="sm" 
              variant="destructive" 
              onClick={stopCapture}
              className="h-7 px-2 py-1 text-xs"
            >
              Stop
            </Button>
          </div>
          
          {/* Connection indicator */}
          <div className="absolute top-2 right-2 flex items-center bg-black/50 rounded-full px-2 py-1 backdrop-blur-sm">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-1"></div>
            <span className="text-green-400 text-xs">Live</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DesktopStream;
