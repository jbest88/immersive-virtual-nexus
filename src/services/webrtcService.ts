
import { toast } from "@/components/ui/use-toast";

// WebRTC configuration with STUN servers for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

// Default signaling server address (can be overridden in settings)
const DEFAULT_SIGNALING_SERVER = "wss://simple-signaling-server.onrender.com";

// Connection states
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

// Remote peer information
export interface RemotePeer {
  id: string;
  name: string;
  connectionState: ConnectionState;
}

// Message types for signaling
export type SignalingMessage = {
  type: 'register' | 'offer' | 'answer' | 'ice-candidate' | 'peer-list' | 'disconnect';
  senderId: string;
  senderName?: string;
  targetId?: string;
  data?: any;
};

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStreams: Map<string, MediaStream> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  
  // Signaling server setup
  private signalingSocket: WebSocket | null = null;
  private signalingServerUrl: string = DEFAULT_SIGNALING_SERVER;
  private connectionListeners: Set<(peers: RemotePeer[]) => void> = new Set();
  private streamListeners: Map<string, Set<(stream: MediaStream | null) => void>> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 2000; // ms
  
  // Remote peers currently available
  private remotePeers: RemotePeer[] = [];
  
  // Local information
  private localPeerId: string = '';
  private localPeerName: string = '';
  private isInitialized: boolean = false;

  /**
   * Initialize WebRTC service
   */
  async initialize(peerName: string = `VR-Client-${Math.floor(Math.random() * 1000)}`): Promise<() => void> {
    // If already initialized, clean up first
    if (this.isInitialized) {
      this.cleanup();
    }
    
    this.localPeerId = this.generatePeerId();
    this.localPeerName = peerName;
    
    try {
      await this.connectToSignalingServer();
      this.isInitialized = true;
      
      // Return cleanup function
      return () => {
        this.cleanupPeerListeners();
      };
    } catch (error) {
      console.error("Failed to connect to signaling server:", error);
      throw new Error("Failed to connect to signaling server");
    }
  }
  
  /**
   * Set custom signaling server URL
   */
  setSignalingServerUrl(url: string): void {
    if (this.signalingSocket) {
      console.warn("Changing signaling server while connected may cause issues");
    }
    this.signalingServerUrl = url || DEFAULT_SIGNALING_SERVER;
  }
  
  /**
   * Connect to signaling server
   */
  private async connectToSignalingServer(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.signalingSocket) {
          this.signalingSocket.close();
        }
        
        // Create new WebSocket connection
        this.signalingSocket = new WebSocket(this.signalingServerUrl);
        
        this.signalingSocket.onopen = () => {
          console.log("Connected to signaling server");
          
          // Register with the signaling server
          this.sendSignalingMessage({
            type: 'register',
            senderId: this.localPeerId,
            senderName: this.localPeerName,
            data: { role: 'both' } // Can act as both sender and receiver
          });
          
          this.reconnectAttempts = 0;
          resolve(true);
        };
        
        this.signalingSocket.onmessage = (event) => {
          this.handleSignalingMessage(event.data);
        };
        
        this.signalingSocket.onerror = (error) => {
          console.error("Signaling server error:", error);
          reject(error);
        };
        
        this.signalingSocket.onclose = () => {
          console.log("Disconnected from signaling server");
          
          // Attempt reconnection if not explicitly cleaned up
          if (this.isInitialized && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
              this.connectToSignalingServer().catch(err => {
                console.error("Reconnection failed:", err);
              });
            }, this.reconnectDelay);
          }
        };
      } catch (error) {
        console.error("Error connecting to signaling server:", error);
        reject(error);
      }
    });
  }
  
  /**
   * Send signaling message
   */
  private sendSignalingMessage(message: SignalingMessage): boolean {
    if (!this.signalingSocket || this.signalingSocket.readyState !== WebSocket.OPEN) {
      console.error("Cannot send message - signaling connection not open");
      return false;
    }
    
    try {
      this.signalingSocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending signaling message:", error);
      return false;
    }
  }
  
  /**
   * Handle incoming signaling messages
   */
  private handleSignalingMessage(rawData: string): void {
    try {
      const message: SignalingMessage = JSON.parse(rawData);
      
      switch (message.type) {
        case 'peer-list':
          this.handlePeerListUpdate(message.data?.peers || []);
          break;
        case 'offer':
          this.handleOffer(message.senderId, message.senderName || 'Unknown', message.data);
          break;
        case 'answer':
          this.handleAnswer(message.senderId, message.data);
          break;
        case 'ice-candidate':
          this.handleIceCandidate(message.senderId, message.data);
          break;
        case 'disconnect':
          this.handleRemotePeerDisconnect(message.senderId);
          break;
        default:
          console.warn("Unknown signaling message type:", message.type);
      }
    } catch (error) {
      console.error("Error handling signaling message:", error, rawData);
    }
  }
  
  /**
   * Handle peer list update from signaling server
   */
  private handlePeerListUpdate(peers: Array<{id: string, name: string}>): void {
    // Filter out our own ID
    const remotePeersRaw = peers.filter(peer => peer.id !== this.localPeerId);
    
    // Update our internal peer list, preserving connection states for existing peers
    this.remotePeers = remotePeersRaw.map(peer => {
      const existingPeer = this.remotePeers.find(p => p.id === peer.id);
      return existingPeer || {
        id: peer.id,
        name: peer.name,
        connectionState: 'disconnected'
      };
    });
    
    this.notifyPeerListeners();
  }
  
  /**
   * Handle an incoming WebRTC offer
   */
  private handleOffer(peerId: string, peerName: string, offer: RTCSessionDescriptionInit): void {
    console.log("Received offer from:", peerId, peerName);
    
    // Create or get existing connection
    const peerConnection = this.getPeerConnection(peerId);
    
    // Update peer name if we haven't seen this peer before
    const existingPeerIndex = this.remotePeers.findIndex(p => p.id === peerId);
    if (existingPeerIndex >= 0) {
      if (this.remotePeers[existingPeerIndex].name === "Unknown") {
        this.remotePeers[existingPeerIndex].name = peerName;
      }
    } else {
      this.remotePeers.push({
        id: peerId,
        name: peerName,
        connectionState: 'connecting'
      });
    }
    
    this.updatePeerConnectionState(peerId, 'connecting');
    this.notifyPeerListeners();
    
    // Process the offer
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => peerConnection.createAnswer())
      .then(answer => peerConnection.setLocalDescription(answer))
      .then(() => {
        // Send the answer back
        this.sendSignalingMessage({
          type: 'answer',
          senderId: this.localPeerId,
          targetId: peerId,
          data: peerConnection.localDescription
        });
      })
      .catch(error => {
        console.error("Error handling offer:", error);
        this.updatePeerConnectionState(peerId, 'failed');
        toast({
          title: "Connection Error",
          description: "Failed to process connection offer",
          variant: "destructive"
        });
      });
  }
  
  /**
   * Handle an incoming WebRTC answer
   */
  private handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): void {
    console.log("Received answer from:", peerId);
    
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) {
      console.error("No connection found for peer:", peerId);
      return;
    }
    
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      .catch(error => {
        console.error("Error setting remote description:", error);
        this.updatePeerConnectionState(peerId, 'failed');
      });
  }
  
  /**
   * Handle an incoming ICE candidate
   */
  private handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): void {
    const peerConnection = this.peerConnections.get(peerId);
    if (!peerConnection) {
      console.error("No connection found for peer:", peerId);
      return;
    }
    
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      .catch(error => {
        console.error("Error adding ICE candidate:", error);
      });
  }
  
  /**
   * Handle remote peer disconnect
   */
  private handleRemotePeerDisconnect(peerId: string): void {
    // Close the connection
    this.disconnectFromPeer(peerId);
  }
  
  /**
   * Generate a random peer ID
   */
  private generatePeerId(): string {
    return `peer-${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Get or create a peer connection
   */
  private getPeerConnection(peerId: string): RTCPeerConnection {
    if (this.peerConnections.has(peerId)) {
      return this.peerConnections.get(peerId)!;
    }
    
    // Create new connection
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    
    // Set up event handlers
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          senderId: this.localPeerId,
          targetId: peerId,
          data: event.candidate
        });
      }
    };
    
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state for ${peerId}:`, peerConnection.iceConnectionState);
      const connectionState = this.mapRTCStateToConnectionState(peerConnection.iceConnectionState);
      this.updatePeerConnectionState(peerId, connectionState);
    };
    
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        console.log(`Received track from ${peerId}:`, event.track.kind);
        this.remoteStreams.set(peerId, event.streams[0]);
        this.notifyStreamListeners(peerId, event.streams[0]);
      }
    };
    
    // Setup data channel for controls
    try {
      const dataChannel = peerConnection.createDataChannel('controls');
      dataChannel.onopen = () => console.log(`Data channel with ${peerId} opened`);
      dataChannel.onclose = () => console.log(`Data channel with ${peerId} closed`);
      dataChannel.onmessage = (event) => this.handleControlMessage(peerId, event.data);
      this.dataChannels.set(peerId, dataChannel);
    } catch (err) {
      console.error("Error creating data channel:", err);
    }
    
    // Store the connection
    this.peerConnections.set(peerId, peerConnection);
    
    return peerConnection;
  }
  
  /**
   * Connect to a specific peer
   */
  async connectToPeer(peerId: string): Promise<boolean> {
    const peerIdx = this.remotePeers.findIndex(p => p.id === peerId);
    if (peerIdx === -1) {
      throw new Error('Peer not found');
    }
    
    // Update the peer's connection state
    this.updatePeerConnectionState(peerId, 'connecting');
    
    try {
      const peerConnection = this.getPeerConnection(peerId);
      
      // Create an offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      // Send the offer to the remote peer
      this.sendSignalingMessage({
        type: 'offer',
        senderId: this.localPeerId,
        senderName: this.localPeerName,
        targetId: peerId,
        data: peerConnection.localDescription
      });
      
      // Connection state will be updated by ICE connection state change events
      return true;
    } catch (error) {
      console.error('Error creating offer:', error);
      this.updatePeerConnectionState(peerId, 'failed');
      throw error;
    }
  }
  
  /**
   * Share local stream with peer
   */
  async shareStreamWithPeer(peerId: string, stream: MediaStream): Promise<void> {
    const peerConnection = this.getPeerConnection(peerId);
    
    try {
      // Store local stream
      this.localStreams.set(peerId, stream);
      
      // Add tracks to the connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
    } catch (error) {
      console.error("Error sharing stream:", error);
      throw error;
    }
  }
  
  /**
   * Disconnect from a peer
   */
  disconnectFromPeer(peerId: string): void {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      // Close the connection
      peerConnection.close();
      this.peerConnections.delete(peerId);
      
      // Clean up streams
      this.stopLocalStream(peerId);
      this.remoteStreams.delete(peerId);
      this.notifyStreamListeners(peerId, null);
      
      // Close data channel
      const dataChannel = this.dataChannels.get(peerId);
      if (dataChannel) {
        dataChannel.close();
        this.dataChannels.delete(peerId);
      }
      
      // Update state
      this.updatePeerConnectionState(peerId, 'disconnected');
      
      // Notify the remote peer about disconnection
      this.sendSignalingMessage({
        type: 'disconnect',
        senderId: this.localPeerId,
        targetId: peerId
      });
    }
  }
  
  /**
   * Stop local stream for a peer
   */
  private stopLocalStream(peerId: string): void {
    const stream = this.localStreams.get(peerId);
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      this.localStreams.delete(peerId);
    }
  }
  
  /**
   * Update peer connection state
   */
  private updatePeerConnectionState(peerId: string, state: ConnectionState): void {
    const peerIdx = this.remotePeers.findIndex(p => p.id === peerId);
    if (peerIdx !== -1) {
      this.remotePeers[peerIdx].connectionState = state;
      this.notifyPeerListeners();
      
      // Show toast for connection status changes
      if (state === 'connected') {
        toast({
          title: "Connection Established",
          description: `Connected to ${this.remotePeers[peerIdx].name}`,
          variant: "default"
        });
      } else if (state === 'failed') {
        toast({
          title: "Connection Failed",
          description: `Failed to connect to ${this.remotePeers[peerIdx].name}`,
          variant: "destructive"
        });
      }
    }
  }
  
  /**
   * Map WebRTC state to our connection state
   */
  private mapRTCStateToConnectionState(state: RTCIceConnectionState): ConnectionState {
    switch (state) {
      case 'checking':
        return 'connecting';
      case 'connected':
      case 'completed':
        return 'connected';
      case 'failed':
      case 'closed':
        return 'failed';
      default:
        return 'disconnected';
    }
  }
  
  /**
   * Get remote stream for a peer
   */
  getRemoteStream(peerId: string): MediaStream | undefined {
    return this.remoteStreams.get(peerId);
  }
  
  /**
   * Get available remote peers
   */
  getRemotePeers(): RemotePeer[] {
    return [...this.remotePeers];
  }
  
  /**
   * Add listener for peer list changes
   */
  addPeerListener(listener: (peers: RemotePeer[]) => void): () => void {
    this.connectionListeners.add(listener);
    listener([...this.remotePeers]);
    return () => this.connectionListeners.delete(listener);
  }
  
  /**
   * Clean up peer listeners
   */
  private cleanupPeerListeners(): void {
    this.connectionListeners.clear();
  }
  
  /**
   * Add listener for stream changes
   */
  addStreamListener(peerId: string, listener: (stream: MediaStream | null) => void): () => void {
    if (!this.streamListeners.has(peerId)) {
      this.streamListeners.set(peerId, new Set());
    }
    
    this.streamListeners.get(peerId)!.add(listener);
    
    // Call with current stream if available
    const stream = this.remoteStreams.get(peerId);
    if (stream) {
      listener(stream);
    }
    
    return () => {
      const listeners = this.streamListeners.get(peerId);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.streamListeners.delete(peerId);
        }
      }
    };
  }
  
  /**
   * Notify all peer listeners
   */
  private notifyPeerListeners(): void {
    this.connectionListeners.forEach(listener => {
      listener([...this.remotePeers]);
    });
  }
  
  /**
   * Notify stream listeners for a specific peer
   */
  private notifyStreamListeners(peerId: string, stream: MediaStream | null): void {
    const listeners = this.streamListeners.get(peerId);
    if (listeners) {
      listeners.forEach(listener => listener(stream));
    }
  }
  
  /**
   * Send control message to peer
   */
  sendControlMessage(peerId: string, message: any): boolean {
    const dataChannel = this.dataChannels.get(peerId);
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
  
  /**
   * Handle incoming control message
   */
  private handleControlMessage(peerId: string, data: string): void {
    try {
      const message = JSON.parse(data);
      console.log(`Control message from ${peerId}:`, message);
      
      // Here you would handle different control messages
      // Examples: keyboard input, monitor selection, etc.
    } catch (error) {
      console.error('Error parsing control message:', error);
    }
  }
  
  /**
   * Clean up all connections
   */
  cleanup(): void {
    // Close all peer connections
    this.peerConnections.forEach((connection) => {
      connection.close();
    });
    
    // Stop all local streams
    this.localStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    
    // Clear all maps
    this.peerConnections.clear();
    this.localStreams.clear();
    this.remoteStreams.clear();
    this.dataChannels.clear();
    
    // Close signaling connection
    if (this.signalingSocket && this.signalingSocket.readyState === WebSocket.OPEN) {
      this.signalingSocket.close();
    }
    this.signalingSocket = null;
    
    this.isInitialized = false;
  }
}

// Create a singleton instance
const webRTCService = new WebRTCService();

export default webRTCService;
