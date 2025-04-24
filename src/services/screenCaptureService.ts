
import { toast } from "@/components/ui/use-toast";

export interface DisplayDevice {
  id: string;
  name: string;
}

export interface ScreenCaptureOptions {
  audio: boolean;
  video: boolean;
  preferCurrentTab?: boolean;
  selfBrowserSurface?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
  systemAudio?: 'include' | 'exclude';
}

class ScreenCaptureService {
  private streams: Map<string, MediaStream> = new Map();
  private streamIdMap: Map<MediaStream, string> = new Map();
  
  /**
   * Get available display screens
   */
  async getDisplayDevices(): Promise<DisplayDevice[]> {
    try {
      // First request to trigger permission prompt
      const tempStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      // Stop the stream immediately
      tempStream.getTracks().forEach(track => track.stop());
      
      // Mock available displays (actual enumeration of displays is not supported by browsers for security)
      // In a real app, this would be replaced by proper device selection UX
      const mockDisplays: DisplayDevice[] = [
        { id: 'display-1', name: 'Primary Display' },
        { id: 'display-2', name: 'Secondary Monitor' },
        { id: 'display-3', name: 'Application Window' }
      ];
      
      return mockDisplays;
    } catch (error) {
      console.error('Error getting display devices:', error);
      toast({
        title: "Permission Error",
        description: "Screen capture permission was denied",
        variant: "destructive"
      });
      return [];
    }
  }
  
  /**
   * Start screen capture for a specific display
   */
  async captureScreen(displayId: string, options: Partial<ScreenCaptureOptions> = {}): Promise<MediaStream | null> {
    try {
      // Set default options
      const captureOptions: ScreenCaptureOptions = {
        audio: options.audio ?? false,
        video: true,
        preferCurrentTab: options.preferCurrentTab,
        selfBrowserSurface: options.selfBrowserSurface || 'exclude',
        surfaceSwitching: options.surfaceSwitching || 'include',
        systemAudio: options.systemAudio || 'exclude'
      };
      
      // Request screen capture from the browser
      const stream = await navigator.mediaDevices.getDisplayMedia(captureOptions);
      
      // Store the display ID mapping for this stream instead of modifying the read-only id property
      this.streamIdMap.set(stream, displayId);
      
      // Store the stream
      this.streams.set(displayId, stream);
      
      // Set up track ended listener to clean up
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        this.stopCapture(displayId);
      });
      
      return stream;
    } catch (error) {
      console.error('Error capturing screen:', error);
      toast({
        title: "Capture Failed",
        description: error instanceof Error ? error.message : "Failed to capture screen",
        variant: "destructive"
      });
      return null;
    }
  }
  
  /**
   * Get an active stream by display ID
   */
  getStream(displayId: string): MediaStream | undefined {
    return this.streams.get(displayId);
  }
  
  /**
   * Get the display ID associated with a stream
   */
  getDisplayId(stream: MediaStream): string | undefined {
    return this.streamIdMap.get(stream);
  }
  
  /**
   * Get all active streams
   */
  getAllStreams(): Map<string, MediaStream> {
    return new Map(this.streams);
  }
  
  /**
   * Stop capture for a specific display
   */
  stopCapture(displayId: string): void {
    const stream = this.streams.get(displayId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.streamIdMap.delete(stream);
      this.streams.delete(displayId);
    }
  }
  
  /**
   * Stop all active captures
   */
  stopAllCaptures(): void {
    this.streams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
      this.streamIdMap.delete(stream);
    });
    this.streams.clear();
  }
}

// Create a singleton instance
const screenCaptureService = new ScreenCaptureService();

export default screenCaptureService;
