import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Monitor, Keyboard, Menu, ArrowRight, ScreenShare } from 'lucide-react';
import DesktopStream from '@/components/DesktopStream';
import NetworkDisplayComponent from '@/components/NetworkDisplayComponent';

interface VRMenuProps {
  onSettingChange: (setting: string, value: any) => void;
  settings: {
    screenOpacity: number;
    screenCurvature: number;
    environmentBrightness: number;
    showKeyboard: boolean;
    enableMultiMonitor: boolean;
    highPerformanceMode: boolean;
  };
  desktopStream: MediaStream | null;
  networkStreams: {[peerId: string]: MediaStream};
  onStreamChange: (stream: MediaStream | null) => void;
  onNetworkStream: (peerId: string, stream: MediaStream | null) => void;
}

const VRMenu: React.FC<VRMenuProps> = ({ 
  onSettingChange, 
  settings, 
  desktopStream, 
  networkStreams,
  onStreamChange,
  onNetworkStream 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className={`fixed bottom-8 right-8 transition-all duration-300 z-50 ${isExpanded ? 'w-96' : 'w-16'}`}>
      <Button 
        className="absolute right-0 bottom-0 w-16 h-16 rounded-full bg-vr-primary text-white shadow-lg hover:bg-vr-secondary transition-all"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <Menu size={24} />
      </Button>
      
      {isExpanded && (
        <Card className="vr-panel mb-20 w-full animate-fade-in">
          <CardHeader>
            <CardTitle className="text-vr-text vr-glow flex items-center gap-2">
              <Settings size={18} /> Virtual Desktop Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="display" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="display">Display</TabsTrigger>
                <TabsTrigger value="screens">Screens</TabsTrigger>
                <TabsTrigger value="system">System</TabsTrigger>
              </TabsList>
              
              <TabsContent value="display" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="screenOpacity" className="text-vr-text">Screen Opacity</Label>
                    <span className="text-vr-text">{settings.screenOpacity * 100}%</span>
                  </div>
                  <Slider 
                    id="screenOpacity"
                    min={0.3} 
                    max={1} 
                    step={0.05} 
                    value={[settings.screenOpacity]} 
                    onValueChange={(value) => onSettingChange('screenOpacity', value[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="screenCurvature" className="text-vr-text">Screen Curvature</Label>
                    <span className="text-vr-text">{Math.round(settings.screenCurvature * 100)}%</span>
                  </div>
                  <Slider 
                    id="screenCurvature"
                    min={0} 
                    max={0.5} 
                    step={0.05} 
                    value={[settings.screenCurvature]}
                    onValueChange={(value) => onSettingChange('screenCurvature', value[0])} 
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="brightness" className="text-vr-text">Environment Brightness</Label>
                    <span className="text-vr-text">{Math.round(settings.environmentBrightness * 100)}%</span>
                  </div>
                  <Slider 
                    id="brightness"
                    min={0.1} 
                    max={1} 
                    step={0.05} 
                    value={[settings.environmentBrightness]}
                    onValueChange={(value) => onSettingChange('environmentBrightness', value[0])} 
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="multiMonitor" className="text-vr-text">Multi-monitor Support</Label>
                  <Switch 
                    id="multiMonitor" 
                    checked={settings.enableMultiMonitor}
                    onCheckedChange={(checked) => onSettingChange('enableMultiMonitor', checked)} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="screens" className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-vr-text">Local Desktop Stream</Label>
                  <div className="border rounded-md p-2">
                    <DesktopStream 
                      className="h-32" 
                      onStreamChange={onStreamChange}
                    />
                    <div className="mt-2 text-xs text-vr-text/70 text-center">
                      {desktopStream 
                        ? "Desktop stream active" 
                        : "Click to start desktop stream"}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-vr-text">Network Streams</Label>
                  <NetworkDisplayComponent
                    className="border rounded-md p-2"
                    onStreamReceived={onNetworkStream}
                  />
                  <div className="mt-2 text-xs text-vr-text/70 text-center">
                    {Object.keys(networkStreams).length > 0
                      ? `Connected to ${Object.keys(networkStreams).length} remote desktop(s)`
                      : "Connect to desktop on your local network"}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="multiMonitor" className="text-vr-text">Multi-monitor Support</Label>
                  <Switch 
                    id="multiMonitor" 
                    checked={settings.enableMultiMonitor}
                    onCheckedChange={(checked) => onSettingChange('enableMultiMonitor', checked)} 
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="system" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="performanceMode" className="text-vr-text">High Performance Mode</Label>
                  <Switch 
                    id="performanceMode" 
                    checked={settings.highPerformanceMode}
                    onCheckedChange={(checked) => onSettingChange('highPerformanceMode', checked)} 
                  />
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label className="text-vr-text">Connection Status</Label>
                  <div className="vr-panel p-3 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-vr-text">Desktop Connection:</span>
                      <span className="text-green-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-400 rounded-full inline-block animate-pulse"></span> 
                        Connected
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-vr-text">Current Latency:</span>
                      <span className="text-vr-accent">12ms</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-vr-text">Stream Quality:</span>
                      <span className="text-vr-accent">High (60 FPS)</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-vr-secondary hover:bg-vr-secondary/80" 
                  variant="default"
                >
                  Reconnect Desktop <ArrowRight size={16} className="ml-2" />
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VRMenu;
