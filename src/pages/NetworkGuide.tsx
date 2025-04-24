
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Laptop, Wifi, Smartphone, ArrowRight, Link, CheckCircle2 } from 'lucide-react';

const NetworkGuide = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-vr-bg text-vr-text p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold vr-glow">Network Desktop Sharing Guide</h1>
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            className="text-vr-accent hover:text-vr-accent/80 border border-vr-accent/30"
          >
            Return to VR <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="vr-panel">
            <CardHeader className="pb-2">
              <CardTitle>
                <div className="flex items-center text-vr-accent">
                  <Laptop className="mr-2 h-5 w-5" /> 
                  Desktop
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">
                Share your desktop screen directly to the VR environment with minimal latency.
              </p>
              <div className="text-xs text-vr-text/70">
                <p className="flex items-center mb-1">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" /> Same-device streaming
                </p>
                <p className="flex items-center mb-1">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" /> No additional software
                </p>
                <p className="flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" /> Built-in browser support
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="vr-panel">
            <CardHeader className="pb-2">
              <CardTitle>
                <div className="flex items-center text-vr-accent">
                  <Wifi className="mr-2 h-5 w-5" /> 
                  Network
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">
                Connect to screens from other devices on your local network using WebRTC.
              </p>
              <div className="text-xs text-vr-text/70">
                <p className="flex items-center mb-1">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" /> Cross-device streaming
                </p>
                <p className="flex items-center mb-1">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" /> Local network only
                </p>
                <p className="flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" /> Peer-to-peer encryption
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="vr-panel">
            <CardHeader className="pb-2">
              <CardTitle>
                <div className="flex items-center text-vr-accent">
                  <Smartphone className="mr-2 h-5 w-5" /> 
                  Mobile
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-3">
                View a mobile device screen in your VR environment (coming soon).
              </p>
              <div className="text-xs text-vr-text/70">
                <p className="flex items-center mb-1">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" /> Mobile companion app
                </p>
                <p className="flex items-center mb-1">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" /> Touch interaction
                </p>
                <p className="flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-green-400" /> Notification mirroring
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="vr-panel mb-12">
          <CardHeader>
            <CardTitle className="text-vr-accent">
              <div className="flex items-center">
                <Link className="mr-2 h-5 w-5" /> 
                Connection Setup Guide
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Local Desktop Connection</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-vr-primary flex items-center justify-center text-vr-accent mr-3">1</span>
                  <p>Open the VR application in your web browser</p>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-vr-primary flex items-center justify-center text-vr-accent mr-3">2</span>
                  <p>Click on the "Local" tab in the control panel</p>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-vr-primary flex items-center justify-center text-vr-accent mr-3">3</span>
                  <p>Select "Start Capture" to grant screen sharing permission</p>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-vr-primary flex items-center justify-center text-vr-accent mr-3">4</span>
                  <p>Choose which display or window to share</p>
                </li>
              </ol>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-2">Network Desktop Connection</h3>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-vr-primary flex items-center justify-center text-vr-accent mr-3">1</span>
                  <p>Ensure both devices are on the same local network</p>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-vr-primary flex items-center justify-center text-vr-accent mr-3">2</span>
                  <p>On the desktop you want to share, visit <code className="bg-vr-primary/20 px-1 rounded">https://your-vr-app.com/share</code></p>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-vr-primary flex items-center justify-center text-vr-accent mr-3">3</span>
                  <p>Click "Broadcast Desktop" and select which screen to share</p>
                </li>
                <li className="flex items-start">
                  <span className="w-6 h-6 rounded-full bg-vr-primary flex items-center justify-center text-vr-accent mr-3">4</span>
                  <p>In your VR app, go to the "Network" tab and connect to the discovered device</p>
                </li>
              </ol>
            </div>
            
            <Separator />
            
            <div className="bg-vr-primary/10 p-4 rounded">
              <h4 className="font-medium mb-2 text-vr-accent">Troubleshooting Tips</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-vr-accent shrink-0 mt-0.5" />
                  <p>If devices don't see each other, ensure they're on the same subnet</p>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-vr-accent shrink-0 mt-0.5" />
                  <p>For best performance, use a 5GHz WiFi connection</p>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-vr-accent shrink-0 mt-0.5" />
                  <p>Ensure no firewall is blocking WebRTC connections (UDP ports)</p>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-vr-accent shrink-0 mt-0.5" />
                  <p>Try refreshing the device list if connections fail</p>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
            >
              Get Started with Desktop Sharing
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default NetworkGuide;
