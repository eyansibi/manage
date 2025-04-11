import { io } from 'socket.io-client';

// Create a singleton socket instance that persists across page navigations
class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnecting = false;
    this.listeners = new Map();
    this.userId = null;
  }

  // Initialize socket connection
  initialize(userId) {
    // Store user ID for reconnection
    this.userId = userId;

    // If socket already exists and is connected, don't create a new one
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected:', this.socket.id);
      return this.socket;
    }

    // If we're already reconnecting, don't start a new connection
    if (this.reconnecting) {
      console.log('Already attempting to reconnect socket');
      return null;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    console.log("SocketService: Connecting to socket at:", API_URL);
    
    this.reconnecting = true;
    
    // Create new socket
    this.socket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true,
      forceNew: false, // Don't force a new connection
    });

    // Set up event listeners
    this.socket.on('connect', () => {
      console.log('SocketService: Socket connected with ID:', this.socket.id);
      this.connected = true;
      this.reconnecting = false;
      
      // Join notification room
      if (this.userId) {
        console.log('SocketService: Joining notification room for user:', this.userId);
        this.socket.emit('join-notification-room', this.userId);
      }
      
      // Apply any stored listeners
      this.applyStoredListeners();
    });

    this.socket.on('disconnect', (reason) => {
      console.error('SOCKET DISCONNECT DIAGNOSTIC:');
      console.error('- Reason:', reason);
      console.error('- User ID at disconnect time:', this.userId);
      console.error('- Page URL at disconnect time:', window.location.href);
      console.error('- Time:', new Date().toISOString());
      this.connected = false;
      
      // Attempt to reconnect if disconnected unexpectedly
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // The disconnection was initiated by the server, try to reconnect
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketService: Connection error:', error.message);
      this.connected = false;
      this.reconnecting = false;
    });

    return this.socket;
  }

  // Reconnect if disconnected
  reconnect() {
    if (this.reconnecting || !this.userId) return;
    
    console.log('SocketService: Attempting to reconnect');
    this.reconnecting = true;
    
    // Try to reconnect after a short delay
    setTimeout(() => {
      this.initialize(this.userId);
    }, 1000);
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Check if socket is connected
  isConnected() {
    return this.socket && this.connected;
  }

  // Store listeners that should be applied when socket reconnects
  applyStoredListeners() {
    if (!this.socket) return;
    
    // Apply all stored listeners to the socket
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    });
  }

  // Add event listener
  on(event, callback) {
    // Store the listener for reconnection
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    // Only add if not already in the list
    const callbacks = this.listeners.get(event);
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }

    // If we have a socket, add the listener directly
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    // Remove from stored listeners
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }

    // Remove from socket if it exists
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Emit event
  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
      return true;
    }
    return false;
  }

  // Join a room
  joinRoom(roomName) {
    if (this.socket && this.connected) {
      this.socket.emit('join-room', roomName);
      return true;
    }
    return false;
  }

  // Clean up
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.reconnecting = false;
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;