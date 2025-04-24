
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DesktopStreamProps {
  deviceId?: string;
  className?: string;
  isConnected?: boolean;
}

const DesktopStream: React.FC<DesktopStreamProps> = ({ 
  deviceId, 
  className,
  isConnected = true
}) => {
  const [streamStatus, setStreamStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [errorMessage, setErrorMessage] = useState('');
  
  useEffect(() => {
    // Mock connection process
    const timer = setTimeout(() => {
      if (isConnected) {
        setStreamStatus('connected');
      } else {
        setStreamStatus('error');
        setErrorMessage('Could not connect to desktop stream. Please check your connection and permissions.');
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isConnected]);
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      {streamStatus === 'connecting' && (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-vr-bg">
          <div className="w-12 h-12 border-4 border-vr-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-vr-text text-xl">Connecting to desktop stream...</p>
        </div>
      )}
      
      {streamStatus === 'error' && (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-vr-bg">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <p className="text-red-400 text-xl mb-2">Connection Failed</p>
          <p className="text-vr-text/80 text-center">{errorMessage}</p>
        </div>
      )}
      
      {streamStatus === 'connected' && (
        <div className="relative h-full">
          {/* This would be replaced with actual desktop streaming component in a real app */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col">
            {/* Mock desktop UI */}
            <div className="bg-gray-900 p-2 flex items-center justify-between border-b border-gray-700">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-gray-400 text-xs">Desktop Stream - Connected</div>
              <div className="text-xs text-gray-500">12ms</div>
            </div>
            
            <div className="flex-1 flex">
              {/* Mock file explorer */}
              <div className="w-48 bg-gray-800 p-2">
                <div className="text-gray-300 text-sm mb-2">File Explorer</div>
                <div className="space-y-1">
                  <div className="text-gray-400 text-xs pl-2">Documents</div>
                  <div className="text-gray-400 text-xs pl-2">Downloads</div>
                  <div className="text-gray-400 text-xs pl-2">Pictures</div>
                  <div className="text-gray-400 text-xs pl-2">Videos</div>
                </div>
              </div>
              
              {/* Mock content area */}
              <div className="flex-1 bg-gray-700 p-2">
                <div className="bg-white rounded shadow h-full"></div>
              </div>
            </div>
            
            {/* Mock taskbar */}
            <div className="bg-gray-900 p-1 flex items-center space-x-2 border-t border-gray-700">
              <div className="w-8 h-6 rounded bg-blue-500"></div>
              <div className="w-8 h-6 rounded bg-gray-700"></div>
              <div className="w-8 h-6 rounded bg-gray-700"></div>
              <div className="flex-1"></div>
              <div className="text-xs text-gray-400">4:30 PM</div>
            </div>
          </div>
          
          {/* Connection indicator */}
          <div className="absolute top-2 right-2 flex items-center bg-gray-900/50 rounded-full px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse mr-1"></div>
            <span className="text-green-400 text-xs">Live</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default DesktopStream;
