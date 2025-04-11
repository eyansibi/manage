import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { io } from 'socket.io-client';
import useSession from '../hooks/useSession';

// Create context
const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useSession();
  const socketRef = useRef(null); // Keep a ref to avoid recreating socket unnecessarily

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (!user || !user._id) return;

    // If we already have a socket, don't create a new one
    if (socketRef.current) return;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    console.log("SocketProvider: Connecting to socket at:", API_URL);
    
    // Initialize socket connection with cookies for auth
    const newSocket = io(API_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      autoConnect: true
    });
    
    // Store in ref
    socketRef.current = newSocket;
    setSocket(newSocket);
    
    // Add connection event listeners
    newSocket.on('connect', () => {
      console.log('SocketProvider: Socket connected successfully with ID:', newSocket.id);
      setConnected(true);
      
      // Join notification room after successful connection
      console.log('SocketProvider: Joining notification room for user:', user._id);
      newSocket.emit('join-notification-room', user._id);
    });
    
    newSocket.on('test-notification', (data) => {
      console.log('SocketProvider: Test notification received:', data);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('SocketProvider: Socket connection error:', error.message);
      setConnected(false);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.log('SocketProvider: Socket disconnected:', reason);
      setConnected(false);
    });
    
    newSocket.on('error', (error) => {
      console.error('SocketProvider: Socket error:', error.message);
    });
    
    // Clean up on component unmount only
    return () => {
      console.log('SocketProvider: Cleaning up socket connection on unmount');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
    };
  }, [user]);

  // Simply pass the socket and connected status to children
  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

// Custom hook to use the socket
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};