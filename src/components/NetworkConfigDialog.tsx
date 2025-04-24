
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Settings } from 'lucide-react';
import webRTCService from '@/services/webrtcService';

interface NetworkConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NetworkConfigDialog: React.FC<NetworkConfigDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const [signalingServer, setSignalingServer] = useState<string>('wss://simple-signaling-server.onrender.com');
  const [peerName, setPeerName] = useState<string>(`VR-Client-${Math.floor(Math.random() * 1000)}`);
  
  // Apply network configuration
  const applyConfiguration = async () => {
    try {
      // Update signaling server URL
      webRTCService.setSignalingServerUrl(signalingServer);
      
      // Re-initialize with new settings
      await webRTCService.initialize(peerName);
      
      toast({
        title: "Configuration Applied",
        description: "Network settings have been updated",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to apply network configuration:", error);
      toast({
        title: "Configuration Failed",
        description: "Could not apply new network settings",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Network Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your WebRTC network settings for connecting VR and desktop devices.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="signaling-server">Signaling Server</Label>
            <Input 
              id="signaling-server" 
              value={signalingServer}
              onChange={(e) => setSignalingServer(e.target.value)}
              placeholder="wss://your-signaling-server.com"
            />
            <p className="text-xs text-vr-text/50">WebSocket URL for peer discovery and signaling</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="peer-name">Device Name</Label>
            <Input 
              id="peer-name" 
              value={peerName}
              onChange={(e) => setPeerName(e.target.value)}
              placeholder="VR-Client"
            />
            <p className="text-xs text-vr-text/50">Name displayed to other devices on the network</p>
          </div>
          
          <div className="bg-vr-primary/10 p-3 rounded">
            <h4 className="text-sm font-medium text-vr-accent mb-2">Advanced Settings</h4>
            <p className="text-xs text-vr-text/70">
              For custom STUN/TURN servers and other advanced configuration options, 
              please refer to the connection guide.
            </p>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={applyConfiguration}>
            Apply Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NetworkConfigDialog;
