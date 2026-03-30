import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';
import { wsClient, WebSocketClient } from '../services/websocketClient';

interface WebSocketContextValue {
  connectionState: string;
  client: WebSocketClient;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  connectionState: 'disconnected',
  client: wsClient,
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [connectionState, setConnectionState] = useState<string>('disconnected');

  useEffect(() => {
    const handleConnectionChange = (state: string) => {
      setConnectionState(state);
    };

    wsClient.on('connection_change', handleConnectionChange);
    wsClient.connect();

    return () => {
      wsClient.off('connection_change', handleConnectionChange);
      wsClient.disconnect();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ connectionState, client: wsClient }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
