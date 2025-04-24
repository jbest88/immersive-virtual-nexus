
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Monitor, WifiOff, CheckCircle, ArrowLeft, RefreshCw, Settings, Wifi, Link2 } from 'lucide-react';
import webRTCService, { RemotePeer } from '@/services/webrtcService';

const ShareDesktop = () => {
  const navigate = useNavigate();
  const [streamStatus, setStreamStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [screenName, setScreenName] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [signalingStatus, setSignalingStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // Stream management
  const streamRef = useRef<MediaStream | null>(null);
  
  // Peer management
  const [connectedClients, setConnectedClients] = useState<RemotePeer[]>([]);
  
  // Initialize WebRTC
  useEffect(() => {
    const initWebRTC = async () => {
      try {
        setSignalingStatus('connecting');
        
        // Initialize WebRTC service with a descriptive name
        await webRTCService.initialize(`Desktop-${Math.floor(Math.random() * 1000)}`);
        
        setSignalingStatus('connected');
        
        // Add listener for connected peers
        const cleanupListener = webRTCService.addPeerListener((peers) => {
          // Filter for connected peers only
          setConnectedClients(peers.filter(p => p.connectionState === 'connected'));
        });
        
        return cleanupListener;
      } catch (error) {
        console.error("Failed to initialize WebRTC:", error);
        setSignalingStatus('disconnected');
        toast({
          title: "Connection Failed",
          description: "Could not initialize network connection",
          variant: "destructive"
        });
        return () => {};
      }
    };
    
    let cleanupFunction: (() => void) | undefined;
    
    initWebRTC().then(cleanup => {
      cleanupFunction = cleanup;
    });
    
    return () => {
      // Clean up
      if (cleanupFunction) cleanupFunction();
      webRTCService.cleanup();
      stopCapture();
    };
  }, []);
  
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
      
      // Share with all currently connected clients
      await Promise.all(connectedClients.map(async client => {
        try {
          await webRTCService.shareStreamWithPeer(client.id, stream);
          
          toast({
            title: "Stream Shared",
            description: `Your desktop is now being shared with ${client.name}`
          });
        } catch (error) {
          console.error(`Failed to share with ${client.name}:`, error);
        }
      }));
      
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
  };
  
  // Disconnect a specific client
  const disconnectClient = (clientId: string) => {
    webRTCService.disconnectFromPeer(clientId);
    
    toast({
      title: "Client Disconnected",
      description: `Disconnected client from your desktop`
    });
  };
  
  // Refresh the peer connection
  const refreshPeers = async () => {
    try {
      // Re-initialize WebRTC to refresh connections
      await webRTCService.initialize(`Desktop-${Math.floor(Math.random() * 1000)}`);
      
      toast({
        title: "Network Refreshed",
        description: "Looking for new VR clients on the network"
      });
    } catch (error) {
      console.error("Failed to refresh:", error);
    }
  };
  
  // Get signaling server status indicator
  const getSignalingStatusElement = () => {
    switch (signalingStatus) {
      case 'connected':
        return (
          <div className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span className="text-green-500">Signaling Server Connected</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            <span className="text-yellow-500">Connecting to Signaling Server</span>
          </div>
        );
      case 'disconnected':
        return (
          <div className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span className="text-red-500">Signaling Server Disconnected</span>
          </div>
        );
    }
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
                <CardTitle className="text-vr-accent flex justify-between items-center">
                  <span>Desktop Preview</span>
                  {getSignalingStatusElement()}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                {streamStatus === 'idle' && (
                  <div className="h-64 md:h-80 flex flex-col items-center justify-center bg-vr-primary/5 rounded border border-dashed border-vr-primary/30">
                    <Monitor className="h-12 w-12 mb-4 text-vr-accent/50" />
                    <p className="text-vr-text/70 mb-6">Click below to share your desktop</p>
                    <Button 
                      onClick={startCapture}
                      disabled={signalingStatus !== 'connected'}
                    >
                      Start Broadcasting
                    </Button>
                    {signalingStatus !== 'connected' && (
                      <p className="text-xs text-red-400 mt-2">
                        Connect to signaling server first
                      </p>
                    )}
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
                <CardTitle className="text-vr-accent flex items-center justify-between">
                  <span>Connected Clients</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={refreshPeers}
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {connectedClients.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center border-dashed border rounded border-vr-primary/30 p-4">
                    <WifiOff className="h-8 w-8 mb-2 text-vr-text/30" />
                    <p className="text-vr-text/50 text-sm">
                      {signalingStatus === 'connected' 
                        ? "Waiting for VR clients to connect..."
                        : "Connect to network to allow connections"}
                    </p>
                    {streamStatus === 'connected' && signalingStatus === 'connected' && (
                      <p className="text-xs text-vr-text/50 mt-2">
                        Share your broadcast code with VR clients
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {connectedClients.map(client => (
                      <div key={client.id} className="flex items-center justify-between p-2 bg-vr-primary/10 rounded">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                          <span className="text-sm">{client.name}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => disconnectClient(client.id)}
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
                    <div className="flex items-center justify-between">
                      <span>Signaling:</span>
                      <span className={`font-medium ${
                        signalingStatus === 'connected' 
                          ? 'text-green-400' 
                          : signalingStatus === 'connecting' 
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }`}>
                        {signalingStatus.charAt(0).toUpperCase() + signalingStatus.slice(1)}
                      </span>
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
                
                <Button 
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center"
                  onClick={() => {
                    // Open a dialog or page where users can configure network settings
                    toast({
                      title: "Network Settings",
                      description: "Configure your network connection parameters"
                    });
                  }}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Network Settings
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
