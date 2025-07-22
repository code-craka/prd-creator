import { useState, useRef, useEffect } from 'react';

// Define WebSocket message types
export interface WebSocketMessage {
  type: string;
  payload?: unknown;
  timestamp?: number;
  id?: string;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (message: WebSocketMessage) => void;
  lastMessage: WebSocketMessage | null;
  connect: (url: string) => void;
  disconnect: () => void;
}

export const useWebSocket = (url?: string): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    if (!url || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      wsRef.current = new WebSocket(url);
      
      wsRef.current.onopen = () => {
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          
          // Validate message structure
          if (typeof messageData === 'object' && messageData !== null && typeof messageData.type === 'string') {
            const message: WebSocketMessage = {
              type: messageData.type,
              payload: messageData.payload,
              timestamp: messageData.timestamp || Date.now(),
              id: messageData.id
            };
            setLastMessage(message);
          } else {
            // Invalid message format, log for debugging
            console.warn('Received invalid WebSocket message format:', messageData);
          }
        } catch (error) {
          // Handle JSON parsing errors gracefully
          console.warn('Failed to parse WebSocket message as JSON:', error instanceof Error ? error.message : 'Unknown error');
          
          // Try to handle as plain text message
          if (typeof event.data === 'string') {
            const textMessage: WebSocketMessage = {
              type: 'text',
              payload: event.data,
              timestamp: Date.now()
            };
            setLastMessage(textMessage);
          }
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
      };

      wsRef.current.onerror = (_error) => {
        console.warn('WebSocket connection error occurred');
        setIsConnected(false);
      };
    } catch (error) {
      console.warn('Failed to create WebSocket connection:', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        const messageString = JSON.stringify(message);
        wsRef.current.send(messageString);
      } catch (error) {
        console.warn('Failed to serialize WebSocket message:', error instanceof Error ? error.message : 'Unknown error');
      }
    } else {
      console.warn('WebSocket is not connected. Cannot send message.');
    }
  };

  useEffect(() => {
    if (url) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [url]);

  return {
    isConnected,
    sendMessage,
    lastMessage,
    connect,
    disconnect,
  };
};