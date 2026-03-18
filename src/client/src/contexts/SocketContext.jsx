import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_ORIGIN } from '../config/appConfig';
import { emitUserError, reportSocketEvent } from '../utils/observability';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    if (!user || !token) return;

    const newSocket = io(API_ORIGIN, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      setReconnectAttempts(0);
      reportSocketEvent('connected', { userId: user?.id });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      reportSocketEvent('disconnected', { reason });
      if (reason !== 'io client disconnect') {
        emitUserError('Real-time connection dropped. Reconnecting...', 'socket');
      }
      if (reason === 'io server disconnect') {
        newSocket.connect();
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      reportSocketEvent('connect_error', { message: error?.message || 'unknown' });
      emitUserError('Unable to establish real-time connection.', 'socket');
    });

    newSocket.on('reconnect_attempt', (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
      setReconnectAttempts(attempt);
    });

    newSocket.on('reconnect', (attempt) => {
      console.log(`Reconnected after ${attempt} attempts`);
      setIsConnected(true);
      setReconnectAttempts(0);
      reportSocketEvent('reconnected', { attempt });
    });

    newSocket.on('auth_error', () => {
      console.error('Socket authentication error');
      reportSocketEvent('auth_error');
      emitUserError('Real-time session authentication failed.', 'socket');
      newSocket.disconnect();
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [user, token]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, reconnectAttempts }}>
      {children}
    </SocketContext.Provider>
  );
};
