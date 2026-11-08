'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const getSocketUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

export interface UseSocketOptions {
  tableId?: string;
  isManager?: boolean;
  isKitchen?: boolean;
  autoConnect?: boolean;
}

export function useSocket({
  tableId,
  isManager = false,
  isKitchen = false,
  autoConnect = true,
}: UseSocketOptions = {}) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!autoConnect) return;

    const socketInstance: Socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);

      // Join appropriate rooms
      if (tableId) {
        socketInstance.emit('join_table_room', tableId);
      }
      if (isManager) {
        socketInstance.emit('join_manager_room');
      }
      if (isKitchen) {
        socketInstance.emit('join_kitchen_room');
      }
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (tableId) {
        socketInstance.emit('leave_table_room', tableId);
      }
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [tableId, isManager, isKitchen, autoConnect]);

  const on = <T>(event: string, callback: (data: T) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on(event, callback);

    return () => {
      socket.off(event, callback);
    };
  };

  const emit = (event: string, data?: unknown) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    on,
    emit,
  };
}

export default useSocket;
