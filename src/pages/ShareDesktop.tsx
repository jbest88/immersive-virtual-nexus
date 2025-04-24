
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Monitor, WifiOff, CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const ShareDesktop = () => {
  const navigate = useNavigate();
  const [streamStatus, setStreamStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [screenName, setScreenName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Stream management
  const streamRef = useRef<MediaStream | null>(null);
  
  // Peer management (simulated in this demo)
  const [connectedClients, setConnectedClients] = useState<string[]>([]);
  
  // Simulate peer discovery
  useEffect(() => {
    if (streamStatus === 'connected') {
      // Simulate discovering VR clients after a connection is established
      const interval = setInterval(() => {
        if (Math.random() > 0.7 && connectedClients.length < 3) {
          const newClient = `VR-Client-${Math.floor(Math.random() * 100)}`;
          if (!connectedClients.includes(newClient)) {
            setConnectedClients(prev => [...prev, newClient]);
            
            toast({
              title: "New Connection",
              description: `${newClient} connected to your desktop`
            });
          }
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [streamStatus, connectedClients]);
  
  // Start screen capture
  const startCapture = async () => {
    setStreamStatus('connecting');
    
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ 
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      
      // Get the screen name if possible
      const videoTrack = stream.getVideoTracks()[0];
      setScreenName(videoTrack.label || 'Screen');
      
      // Set up video preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        stopCapture();
      };
      
      setStreamStatus('connected');
      
      toast({
        title: "Broadcasting Started",
        description: "Your desktop is now available to VR clients"
      });
      
    } catch (error) {
      console.error("Error starting capture:", error);
      setStreamStatus('error');
      
      toast({
        title: "Capture Failed",
        description: error instanceof Error ? error.message : "Failed to capture screen",
        variant: "destructive"
      });
    }
  };
  
  // Stop screen capture
  const stopCapture = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    
    setStreamStatus('idle');
    setConnectedClients([]);
  };
  
  // Disconnect a specific client
  const disconnectClient = (clientId: string) => {
    setConnectedClients(prev => prev.filter(id => id !== clientId));
    
    toast({
      title: "Client Disconnected",
      description: `Disconnected ${clientId} from your desktop`
    });
  };
  
  return (
    <div className="min-h-screen bg-vr-bg text-vr-text p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold vr-glow">Share Desktop to VR</h1>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="text-vr-accent hover:text-vr-accent/80 border border-vr-accent/30"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to VR
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card className="vr-panel h-full">
              <CardHeader>
                <CardTitle className="text-vr-accent">Desktop Preview</CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                {streamStatus === 'idle' && (
                  <div className="h-64 md:h-80 flex flex-col items-center justify-center bg-vr-primary/5 rounded border border-dashed border-vr-primary/30">
                    <Monitor className="h-12 w-12 mb-4 text-vr-accent/50" />
                    <p className="text-vr-text/70 mb-6">Click below to share your desktop</p>
                    <Button onClick={startCapture}>
                      Start Broadcasting
                    </Button>
                  </div>
                )}
                
                {streamStatus === 'connecting' && (
                  <div className="h-64 md:h-80 flex flex-col items-center justify-center bg-vr-primary/5 rounded border border-vr-primary/30">
                    <div className="w-12 h-12 border-4 border-vr-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-vr-text/70">Waiting for screen selection...</p>
                  </div>
                )}
                
                {streamStatus === 'error' && (
                  <div className="h-64 md:h-80 flex flex-col items-center justify-center bg-vr-primary/5 rounded border border-red-500/30">
                    <WifiOff className="h-12 w-12 mb-4 text-red-500/70" />
                    <p className="text-red-400 mb-6">Failed to start broadcasting</p>
                    <Button onClick={startCapture}>
                      Try Again
                    </Button>
                  </div>
                )}
                
                {streamStatus === 'connected' && (
                  <div className="relative">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      muted 
                      className="w-full h-64 md:h-80 object-contain bg-black rounded"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded-full text-xs flex items-center">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></span>
                      LIVE
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs">
                      {screenName}
                    </div>
                  </div>
                )}
              </CardContent>
              {streamStatus === 'connected' && (
                <CardFooter>
                  <Button 
                    variant="destructive" 
                    onClick={stopCapture} 
                    className="w-full"
                  >
                    Stop Broadcasting
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>
          
          <div>
            <Card className="vr-panel h-full">
              <CardHeader>
                <CardTitle className="text-vr-accent">Connected Clients</CardTitle>
              </CardHeader>
              <CardContent>
                {connectedClients.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center border-dashed border rounded border-vr-primary/30 p-4">
                    <WifiOff className="h-8 w-8 mb-2 text-vr-text/30" />
                    <p className="text-vr-text/50 text-sm">
                      {streamStatus === 'connected' 
                        ? "Waiting for VR clients to connect..."
                        : "Start broadcasting to allow connections"}
                    </p>
                    {streamStatus === 'connected' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4"
                        onClick={() => {
                          toast({
                            title: "Scanning for Clients",
                            description: "Looking for VR clients on the network"
                          });
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Scan Network
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {connectedClients.map(client => (
                      <div key={client} className="flex items-center justify-between p-2 bg-vr-primary/10 rounded">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span className="text-sm">{client}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => disconnectClient(client)}
                        >
                          <WifiOff className="h-4 w-4 text-red-400" />
                          <span className="sr-only">Disconnect</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <div className="w-full bg-vr-primary/10 p-3 rounded text-sm">
                  <h4 className="font-medium text-vr-accent mb-2">Connection Info</h4>
                  <div className="space-y-1 text-vr-text/70">
                    <div className="flex items-center justify-between">
                      <span>Status:</span>
                      <span className="font-medium text-vr-text">
                        {streamStatus === 'connected' ? 'Broadcasting' : 'Offline'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Network:</span>
                      <span className="font-medium text-vr-text">Local WiFi</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Encryption:</span>
                      <span className="font-medium text-green-400">Secure (E2E)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Clients:</span>
                      <span className="font-medium text-vr-text">{connectedClients.length}</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  className="w-full border-vr-accent/30 text-vr-accent"
                  onClick={() => navigate('/guide')}
                >
                  View Connection Guide
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareDesktop;
