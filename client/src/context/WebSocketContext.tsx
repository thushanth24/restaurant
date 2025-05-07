import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WebSocketMessageType } from '@shared/types';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  lastMessage: any | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Initialize WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Initializing WebSocket connection to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      
      // Send authentication message if user is logged in
      if (isAuthenticated && user) {
        ws.send(JSON.stringify({
          type: 'authenticate',
          payload: {
            userId: user.id,
            role: user.role
          }
        }));
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        
        // Handle different message types
        switch (data.type) {
          case WebSocketMessageType.NEW_ORDER:
            console.log('New order received:', data.payload);
            break;
          case WebSocketMessageType.ORDER_STATUS_CHANGE:
            console.log('Order status changed:', data.payload);
            break;
          case WebSocketMessageType.ORDER_READY_FOR_PAYMENT:
            console.log('Order ready for payment:', data.payload);
            break;
          case WebSocketMessageType.PAYMENT_COMPLETED:
            console.log('Payment completed:', data.payload);
            break;
          case WebSocketMessageType.MENU_ITEM_AVAILABILITY_CHANGE:
            console.log('Menu item availability changed:', data.payload);
            break;
          case WebSocketMessageType.TABLE_STATUS_CHANGE:
            console.log('Table status changed:', data.payload);
            break;
          default:
            console.log('Unknown message type:', data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    setSocket(ws);
    
    // Clean up on unmount
    return () => {
      ws.close();
    };
  }, [isAuthenticated, user]);

  // Re-authenticate when user status changes
  useEffect(() => {
    if (socket && isConnected && isAuthenticated && user) {
      socket.send(JSON.stringify({
        type: 'authenticate',
        payload: {
          userId: user.id,
          role: user.role
        }
      }));
    }
  }, [socket, isConnected, isAuthenticated, user]);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, lastMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
}
