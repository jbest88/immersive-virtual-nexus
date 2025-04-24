
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, Monitor, RefreshCw, Link2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import webRTCService, { RemotePeer } from '@/services/webrtcService';

interface NetworkDisplayComponentProps {
  className?: string;
  onStreamReceived?: (peerId: string, stream: MediaStream | null) => void;
}

const NetworkDisplayComponent: React.FC<NetworkDisplayComponentProps> = ({ 
  className,
  onStreamReceived
}) => {
  const [initialized, setInitialized] = useState(false);
  const [remotePeers, setRemotePeers] = useState<RemotePeer[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize WebRTC service
  useEffect(() => {
    const initWebRTC = async () => {
      try {
        await webRTCService.initialize("VR-Client");
        setInitialized(true);
        
        // Set up listener for peer updates
        const cleanupListener = webRTCService.addPeerListener((peers) => {
          setRemotePeers(peers);
        });
        
        return cleanupListener;
      } catch (error) {
        console.error("Failed to initialize WebRTC:", error);
        toast({
          title: "Connection Failed",
          description: "Could not initialize network connection",
          variant: "destructive"
        });
        return () => {}; // Return empty cleanup function in case of error
      }
    };
    
    let cleanupFunction: (() => void) | undefined;
    
    initWebRTC().then(cleanup => {
      cleanupFunction = cleanup;
    });
    
    return () => {
      // Clean up listener and all connections
      if (cleanupFunction) cleanupFunction();
      webRTCService.cleanup();
    };
  }, []);
  
  // Set up stream listeners for each peer
  useEffect(() => {
    if (!onStreamReceived) return;
    
    const cleanupFunctions = remotePeers.map(peer => {
      return webRTCService.addStreamListener(peer.id, (stream) => {
        onStreamReceived(peer.id, stream);
      });
    });
    
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [remotePeers, onStreamReceived]);
  
  // Connect to a peer
  const connectToPeer = async (peerId: string) => {
    try {
      await webRTCService.connectToPeer(peerId);
    } catch (error) {
      console.error("Failed to connect to peer:", error);
      toast({
        title: "Connection Failed",
        description: "Could not connect to the remote desktop",
        variant: "destructive"
      });
    }
  };
  
  // Disconnect from a peer
  const disconnectFromPeer = (peerId: string) => {
    webRTCService.disconnectFromPeer(peerId);
  };
  
  // Refresh peers list
  const refreshPeers = async () => {
    setRefreshing(true);
    
    // Re-initialize the service to re-discover peers
    try {
      await webRTCService.initialize("VR-Client");
      toast({
        title: "Refresh Complete",
        description: "Finished scanning for available devices",
      });
    } catch (error) {
      console.error("Failed to refresh peers:", error);
      toast({
        title: "Refresh Failed",
        description: "Could not scan for available devices",
        variant: "destructive"
      });
    }
    
    setRefreshing(false);
  };
  
  // Get connection status icon based on state
  const getStatusIcon = (state: string) => {
    switch (state) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'connecting':
        return <Wifi className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'failed':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <WifiOff className="h-4 w-4 text-gray-400" />;
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="text-vr-accent flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Network Devices
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={refreshPeers}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!initialized ? (
          <div className="flex items-center justify-center p-4">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-vr-accent mb-3"></div>
              <p className="text-vr-text text-sm">Initializing network...</p>
            </div>
          </div>
        ) : remotePeers.length === 0 ? (
          <div className="p-4 text-center border rounded-md border-dashed border-vr-primary/30">
            <WifiOff className="h-8 w-8 mx-auto mb-2 text-vr-text/50" />
            <p className="text-vr-text/70">No devices found</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={refreshPeers}
            >
              Scan Again
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {remotePeers.map(peer => (
              <div 
                key={peer.id} 
                className="p-2 border rounded-md flex items-center justify-between bg-vr-primary/10"
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    <Monitor className="h-6 w-6 text-vr-accent/70" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-vr-text">{peer.name}</p>
                    <div className="flex items-center gap-1 text-xs text-vr-text/70">
                      {getStatusIcon(peer.connectionState)}
                      <span>{peer.connectionState.charAt(0).toUpperCase() + peer.connectionState.slice(1)}</span>
                    </div>
                  </div>
                </div>
                
                {peer.connectionState === 'connected' ? (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => disconnectFromPeer(peer.id)}
                  >
                    Disconnect
                  </Button>
                ) : peer.connectionState === 'connecting' ? (
                  <Button 
                    disabled
                    variant="outline" 
                    size="sm"
                  >
                    <div className="w-4 h-4 border-2 border-t-transparent border-vr-accent rounded-full animate-spin mr-1"></div>
                    Connecting
                  </Button>
                ) : (
                  <Button 
                    variant="default" 
                    size="sm"
                    onClick={() => connectToPeer(peer.id)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkDisplayComponent;
