import { useEffect, useCallback } from 'react';
import socket from '../utils/socket';

export function useSocket(event, handler) {
  useEffect(() => {
    if (handler) {
      socket.on(event, handler);
    }
    return () => {
      socket.off(event, handler);
    };
  }, [event, handler]);
}

export function useSocketEmit() {
  const emit = useCallback((event, data) => {
    socket.emit(event, data);
  }, []);
  return emit;
}

export { socket };
