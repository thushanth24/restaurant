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

  // Initialize WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        console.log('Initializing WebSocket connection to:', wsUrl);
        
        const newSocket = new WebSocket(wsUrl);
        
        // Connection opened
        newSocket.addEventListener('open', () => {
          console.log('WebSocket connection established');
          setIsConnected(true);
          setSocket(newSocket);
          
          // Authenticate if user is logged in
          if (isAuthenticated && user && newSocket.readyState === WebSocket.OPEN) {
            newSocket.send(JSON.stringify({
              type: 'authenticate',
              payload: {
                userId: user.id,
                role: user.role
              }
            }));
          }
        });
        
        // Listen for messages
        newSocket.addEventListener('message', (event: MessageEvent) => {
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
        });
        
        // Connection closed
        newSocket.addEventListener('close', () => {
          console.log('WebSocket connection closed');
          setIsConnected(false);
          
          // Try to reconnect after a delay
          setTimeout(() => {
            connect();
          }, 3000);
        });
        
        // Connection error
        newSocket.addEventListener('error', (error) => {
          console.error('WebSocket error:', error);
        });
        
        return newSocket;
      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        return null;
      }
    };
    
    const newSocket = connect();
    
    // Clean up on unmount
    return () => {
      if (newSocket && newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [isAuthenticated, user]);

  // Re-authenticate when user status changes
  useEffect(() => {
    if (socket && isConnected && isAuthenticated && user) {
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'authenticate',
            payload: {
              userId: user.id,
              role: user.role
            }
          }));
        }
      } catch (error) {
        console.error('Error sending authentication message:', error);
      }
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
