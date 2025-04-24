
import { toast } from "@/components/ui/use-toast";

// ICE server configuration for WebRTC
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ]
};

// Connection states
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'failed';

// Remote peer information
export interface RemotePeer {
  id: string;
  name: string;
  connectionState: ConnectionState;
}

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private localStreams: Map<string, MediaStream> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  
  // Signaling server setup (using a simple WebSocket)
  private signalingSocket: WebSocket | null = null;
  private connectionListeners: Set<(peers: RemotePeer[]) => void> = new Set();
  private streamListeners: Map<string, Set<(stream: MediaStream | null) => void>> = new Map();
  
  // Remote peers currently available
  private remotePeers: RemotePeer[] = [];
  
  // Local information
  private localPeerId: string = '';
  private localPeerName: string = '';
  
  /**
   * Initialize WebRTC service
   */
  initialize(peerName: string = `VR-Client-${Math.floor(Math.random() * 1000)}`) {
    this.localPeerId = this.generatePeerId();
    this.localPeerName = peerName;
    
    return this.connectToSignalingServer();
  }
  
  /**
   * Connect to signaling server
   */
  private connectToSignalingServer(): Promise<boolean> {
    return new Promise((resolve) => {
      // In a real implementation, we would connect to an actual signaling server
      // For demo purposes, we'll simulate this interaction
      
      // Simulate successful connection after a short delay
      setTimeout(() => {
        this.onSignalingConnected();
        resolve(true);
      }, 1000);
    });
  }
  
  /**
   * Signaling server connected handler
   */
  private onSignalingConnected() {
    // Simulate discovering some peers on the network
    this.discoverPeers();
    
    // In a real implementation, we would set up event listeners for the WebSocket here
  }
  
  /**
   * Send signaling message to a specific peer
   */
  private sendSignalingMessage(peerId: string, type: string, payload: any) {
    // In a real implementation, this would send a message through the WebSocket
    // For demo purposes, we'll simulate this with direct function calls
    
    console.log(`Sending ${type} message to ${peerId}:`, payload);
    
    // Simulate message delivery
    setTimeout(() => {
      if (type === 'offer') {
        this.simulateReceiveOffer(peerId, payload);
      } else if (type === 'answer') {
        this.simulateReceiveAnswer(peerId, payload);
      } else if (type === 'ice-candidate') {
        this.simulateReceiveIceCandidate(peerId, payload);
      }
    }, 300);
  }
  
  /**
   * Simulate receiving an offer
   */
  private simulateReceiveOffer(fromPeerId: string, offer: RTCSessionDescriptionInit) {
    const peerConnection = this.getPeerConnection(fromPeerId);
    
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => peerConnection.createAnswer())
      .then(answer => peerConnection.setLocalDescription(answer))
      .then(() => {
        this.sendSignalingMessage(fromPeerId, 'answer', peerConnection.localDescription);
      })
      .catch(error => {
        console.error('Error handling offer:', error);
        toast({
          title: "Connection Error",
          description: "Failed to process connection offer",
          variant: "destructive"
        });
      });
  }
  
  /**
   * Simulate receiving an answer
   */
  private simulateReceiveAnswer(fromPeerId: string, answer: RTCSessionDescriptionInit) {
    const peerConnection = this.peerConnections.get(fromPeerId);
    if (peerConnection) {
      peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
        .catch(error => {
          console.error('Error setting remote description:', error);
        });
    }
  }
  
  /**
   * Simulate receiving an ICE candidate
   */
  private simulateReceiveIceCandidate(fromPeerId: string, candidate: RTCIceCandidateInit) {
    const peerConnection = this.peerConnections.get(fromPeerId);
    if (peerConnection) {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        .catch(error => {
          console.error('Error adding ICE candidate:', error);
        });
    }
  }
  
  /**
   * Discover peers on the local network
   */
  private discoverPeers() {
    // In a real implementation, this would receive peer information from the signaling server
    // For demo purposes, we'll simulate finding peers
    
    this.remotePeers = [
      { 
        id: this.generatePeerId(), 
        name: "Desktop-Main",
        connectionState: 'disconnected' 
      },
      { 
        id: this.generatePeerId(), 
        name: "Desktop-Secondary",
        connectionState: 'disconnected' 
      }
    ];
    
    this.notifyPeerListeners();
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
        this.sendSignalingMessage(peerId, 'ice-candidate', event.candidate);
      }
    };
    
    peerConnection.oniceconnectionstatechange = () => {
      const connectionState = this.mapRTCStateToConnectionState(peerConnection.iceConnectionState);
      this.updatePeerConnectionState(peerId, connectionState);
    };
    
    peerConnection.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        this.remoteStreams.set(peerId, event.streams[0]);
        this.notifyStreamListeners(peerId, event.streams[0]);
      }
    };
    
    // Setup data channel for controls
    const dataChannel = peerConnection.createDataChannel('controls');
    dataChannel.onopen = () => console.log(`Data channel with ${peerId} opened`);
    dataChannel.onclose = () => console.log(`Data channel with ${peerId} closed`);
    dataChannel.onmessage = (event) => this.handleControlMessage(peerId, event.data);
    this.dataChannels.set(peerId, dataChannel);
    
    // Store the connection
    this.peerConnections.set(peerId, peerConnection);
    
    return peerConnection;
  }
  
  /**
   * Connect to a specific peer
   */
  connectToPeer(peerId: string): Promise<boolean> {
    const peerIdx = this.remotePeers.findIndex(p => p.id === peerId);
    if (peerIdx === -1) {
      return Promise.reject(new Error('Peer not found'));
    }
    
    // Update the peer's connection state
    this.updatePeerConnectionState(peerId, 'connecting');
    
    return new Promise((resolve, reject) => {
      const peerConnection = this.getPeerConnection(peerId);
      
      // Create an offer
      peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
          // Send the offer to the remote peer
          this.sendSignalingMessage(peerId, 'offer', peerConnection.localDescription);
          
          // Simulate successful connection after a short delay
          setTimeout(() => {
            this.updatePeerConnectionState(peerId, 'connected');
            resolve(true);
          }, 1500);
        })
        .catch(error => {
          console.error('Error creating offer:', error);
          this.updatePeerConnectionState(peerId, 'failed');
          reject(error);
        });
    });
  }
  
  /**
   * Share local stream with peer
   */
  shareStreamWithPeer(peerId: string, stream: MediaStream): Promise<void> {
    return new Promise((resolve, reject) => {
      const peerConnection = this.getPeerConnection(peerId);
      
      // Store local stream
      this.localStreams.set(peerId, stream);
      
      // Add tracks to the connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      resolve();
    });
  }
  
  /**
   * Disconnect from a peer
   */
  disconnectFromPeer(peerId: string) {
    const peerConnection = this.peerConnections.get(peerId);
    if (peerConnection) {
      // Close the connection
      peerConnection.close();
      this.peerConnections.delete(peerId);
      
      // Clean up streams
      const localStream = this.localStreams.get(peerId);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
        this.localStreams.delete(peerId);
      }
      
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
    }
  }
  
  /**
   * Update peer connection state
   */
  private updatePeerConnectionState(peerId: string, state: ConnectionState) {
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
  addPeerListener(listener: (peers: RemotePeer[]) => void) {
    this.connectionListeners.add(listener);
    listener([...this.remotePeers]);
    return () => this.connectionListeners.delete(listener);
  }
  
  /**
   * Add listener for stream changes
   */
  addStreamListener(peerId: string, listener: (stream: MediaStream | null) => void) {
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
  private notifyPeerListeners() {
    this.connectionListeners.forEach(listener => {
      listener([...this.remotePeers]);
    });
  }
  
  /**
   * Notify stream listeners for a specific peer
   */
  private notifyStreamListeners(peerId: string, stream: MediaStream | null) {
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
  private handleControlMessage(peerId: string, data: any) {
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
  cleanup() {
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
  }
}

// Create a singleton instance
const webRTCService = new WebRTCService();

export default webRTCService;
