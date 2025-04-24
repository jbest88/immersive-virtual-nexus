
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

import VRScene from '@/components/VRScene';
import VRMenu from '@/components/VRMenu';
import VRKeyboard from '@/components/VRKeyboard';
import DesktopStream from '@/components/DesktopStream';

const Index = () => {
  // State for all VR settings
  const [vrSettings, setVrSettings] = useState({
    screenOpacity: 0.9,
    screenCurvature: 0.2,
    environmentBrightness: 0.7,
    showKeyboard: false,
    enableMultiMonitor: true,
    highPerformanceMode: false,
  });
  
  // Handle settings changes
  const handleSettingChange = (setting: string, value: any) => {
    setVrSettings(prev => ({ ...prev, [setting]: value }));
    
    // Show toast for feedback
    toast({
      title: "Setting Updated",
      description: `${setting} has been updated to ${value}`,
    });
  };
  
  // Handle keyboard input
  const handleKeyPress = (key: string) => {
    console.log("Key pressed:", key);
    // This would send the key to the desktop stream in a real implementation
  };
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-vr-bg text-vr-text">
      {/* Main VR Scene */}
      <VRScene 
        environmentBrightness={vrSettings.environmentBrightness}
        enablePerformanceMonitor={vrSettings.highPerformanceMode}
      />
      
      {/* Top status bar */}
      <div className="absolute top-0 left-0 right-0 bg-vr-panel/30 backdrop-blur-md flex items-center justify-between px-6 py-3 z-30">
        <h1 className="text-xl font-bold vr-glow">Immersive Virtual Desktop</h1>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-sm">Desktop Connected</span>
          </div>
          
          <Button 
            variant="ghost" 
            className="text-vr-accent hover:text-vr-accent/80 border border-vr-accent/30"
            onClick={() => toast({
              title: "Connection Status",
              description: "Desktop stream connected with 12ms latency",
            })}
          >
            Session Active
          </Button>
        </div>
      </div>
      
      {/* Virtual Keyboard (conditionally rendered based on settings) */}
      {vrSettings.showKeyboard && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-4xl">
          <VRKeyboard onKeyPress={handleKeyPress} />
        </div>
      )}
      
      {/* Settings menu */}
      <VRMenu 
        settings={vrSettings}
        onSettingChange={handleSettingChange}
      />
      
      {/* Demo controls - would be replaced with actual VR input in a real app */}
      <div className="absolute top-20 right-6 z-30 vr-panel p-4 w-72">
        <h3 className="text-lg font-semibold mb-3 text-vr-accent">Demo Controls</h3>
        <p className="text-sm mb-4">This panel allows you to test the virtual desktop functionality.</p>
        
        <Tabs defaultValue="screens">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="screens">Screens</TabsTrigger>
            <TabsTrigger value="preview">Desktop Preview</TabsTrigger>
          </TabsList>
          
          <TabsContent value="screens">
            <div className="space-y-3">
              <Button 
                className="w-full"
                onClick={() => toast({
                  title: "Screen Added",
                  description: "A new virtual monitor has been added to your workspace.",
                })}
              >
                Add Screen
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-vr-accent/50 text-vr-accent"
                onClick={() => {
                  toast({
                    title: "Screens Rearranged",
                    description: "Your virtual screens have been aligned in a horizontal layout.",
                  });
                }}
              >
                Arrange Horizontally
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full border-vr-accent/50 text-vr-accent"
                onClick={() => {
                  toast({
                    title: "Screens Reset",
                    description: "All screen positions have been reset to default.",
                  });
                }}
              >
                Reset Positions
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="preview">
            <Card className="border-0 overflow-hidden">
              <CardContent className="p-1">
                <DesktopStream className="h-48" />
              </CardContent>
            </Card>
            
            <div className="mt-3 text-xs text-vr-text/70 text-center">
              Preview of desktop stream
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Information panel */}
      <div className="absolute bottom-6 left-6 z-30 vr-panel p-4 max-w-md">
        <h2 className="text-lg font-semibold mb-2">Virtual Desktop Experience</h2>
        <p className="text-sm text-vr-text/90 mb-3">
          This application demonstrates a VR desktop environment that allows you to view and interact 
          with your computer screens in virtual reality.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="text-xs bg-vr-primary/20 p-2 rounded">
            <span className="block font-medium text-vr-accent">Move Screen</span>
            <span className="text-vr-text/80">Grab + Drag</span>
          </div>
          <div className="text-xs bg-vr-primary/20 p-2 rounded">
            <span className="block font-medium text-vr-accent">Resize Screen</span>
            <span className="text-vr-text/80">Grab Corners</span>
          </div>
          <div className="text-xs bg-vr-primary/20 p-2 rounded">
            <span className="block font-medium text-vr-accent">Toggle Menu</span>
            <span className="text-vr-text/80">Left Controller + B</span>
          </div>
          <div className="text-xs bg-vr-primary/20 p-2 rounded">
            <span className="block font-medium text-vr-accent">Reset View</span>
            <span className="text-vr-text/80">Both Triggers + Y</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
