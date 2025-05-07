import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { WebSocketMessageType } from '@shared/types';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  lastMessage: any | null;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

// Maximum number of reconnection attempts
const MAX_RECONNECT_ATTEMPTS = 10;
// Initial reconnection delay (ms)
const INITIAL_RECONNECT_DELAY = 1000;
// Maximum reconnection delay (ms)
const MAX_RECONNECT_DELAY = 30000;

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any | null>(null);
  const { user, isAuthenticated } = useAuth();
  
  // Using refs to keep track of reconnection attempts and timers
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const currentSocketRef = useRef<WebSocket | null>(null);

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      INITIAL_RECONNECT_DELAY * Math.pow(1.5, reconnectAttemptsRef.current),
      MAX_RECONNECT_DELAY
    );
    return delay + Math.random() * 1000; // Add jitter
  }, []);

  // Create WebSocket connection with improved error handling
  const connect = useCallback(() => {
    try {
      // Clear any existing timeouts
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close existing socket if any
      if (currentSocketRef.current) {
        try {
          if (currentSocketRef.current.readyState !== WebSocket.CLOSED) {
            currentSocketRef.current.close();
          }
        } catch (e) {
          console.warn('Warning when closing socket:', e);
          // Continue anyway
        }
      }
      
      // Only try to connect if window and navigator are available and online
      if (typeof window === 'undefined' || 
          typeof navigator === 'undefined' || 
          (navigator.onLine === false)) {
        console.log('Browser offline or context unavailable, delaying connection...');
        
        // Schedule a reconnection attempt
        const delay = getReconnectDelay();
        reconnectTimeoutRef.current = window.setTimeout(() => {
          connect();
        }, delay);
        
        return null;
      }
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Initializing WebSocket connection to:', wsUrl);
      
      let newSocket: WebSocket | null = null;
      
      try {
        newSocket = new WebSocket(wsUrl);
        currentSocketRef.current = newSocket;
      } catch (connError) {
        console.error('Failed to initialize WebSocket:', connError);
        
        // Schedule a retry
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = getReconnectDelay();
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(connect, delay);
        }
        
        return null;
      }
      
      console.log('WebSocket instance created, configuring event handlers...');
      
      // Set up event handlers inside a try block to handle any errors
      try {
        // Connection opened handler
        newSocket.onopen = () => {
          console.log('WebSocket connection established');
          setIsConnected(true);
          setSocket(newSocket);
          reconnectAttemptsRef.current = 0; // Reset reconnect attempts
          
          // Only try to authenticate if we have user data and socket is open
          if (isAuthenticated && user && newSocket?.readyState === WebSocket.OPEN) {
            try {
              const authMessage = JSON.stringify({
                type: 'authenticate',
                payload: {
                  userId: user.id,
                  role: user.role
                }
              });
              
              newSocket.send(authMessage);
              console.log('Authentication message sent to server');
            } catch (authError) {
              console.warn('Failed to send auth message:', authError);
              // Continue anyway, not critical
            }
          }
        };
        
        // Message handler
        newSocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);
            
            // Handle different message types with careful error handling
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
                console.log('Received message:', data);
            }
          } catch (parseError) {
            console.warn('Error parsing WebSocket message:', parseError);
            // Continue anyway, just one bad message
          }
        };
        
        // Connection closed handler
        newSocket.onclose = (event) => {
          console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason);
          setIsConnected(false);
          
          // Normal closure, don't reconnect
          if (event.code === 1000) {
            console.log('WebSocket closed normally, not reconnecting');
            return;
          }
          
          // Schedule reconnection with backoff
          if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
            const delay = getReconnectDelay();
            console.log(`Reconnecting in ${delay}ms...`);
            
            reconnectAttemptsRef.current += 1;
            reconnectTimeoutRef.current = window.setTimeout(connect, delay);
          } else {
            console.log('Maximum reconnection attempts reached. Will not retry automatically.');
          }
        };
        
        // Error handler
        newSocket.onerror = (event) => {
          // Just log the error, the close handler will deal with reconnection
          console.warn('WebSocket error event:', event);
        };
        
      } catch (setupError) {
        console.error('Error setting up WebSocket event handlers:', setupError);
        
        // Try to close the socket if we failed to set it up properly
        try {
          if (newSocket && newSocket.readyState !== WebSocket.CLOSED) {
            newSocket.close();
          }
        } catch (closeError) {
          console.warn('Error closing failed socket:', closeError);
        }
        
        // Schedule a retry
        if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = getReconnectDelay();
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(connect, delay);
        }
        
        return null;
      }
      
      return newSocket;
    } catch (error) {
      // Fallback error handler for any other unexpected errors
      console.error('Unexpected error in WebSocket connection setup:', error);
      
      // Always try to reconnect if something went wrong
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = getReconnectDelay();
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = window.setTimeout(connect, delay);
      }
      
      return null;
    }
  }, [isAuthenticated, user, getReconnectDelay]);
  
  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = connect();
    
    // Clean up on unmount
    return () => {
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (newSocket && newSocket.readyState !== WebSocket.CLOSED) {
        try {
          newSocket.close(1000, 'Component unmounting');
        } catch (e) {
          console.error('Error during socket cleanup:', e);
        }
      }
    };
  }, [connect]);

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
          console.log('Re-authentication message sent');
        } else {
          console.warn('Cannot authenticate - socket not in OPEN state');
        }
      } catch (error) {
        console.error('Error sending authentication message:', error);
      }
    }
  }, [socket, isConnected, isAuthenticated, user]);

  // Manual reconnect function for external use
  const reconnect = useCallback(() => {
    console.log('Manual reconnection triggered');
    reconnectAttemptsRef.current = 0; // Reset the counter on manual reconnect
    connect();
  }, [connect]);

  return (
    <WebSocketContext.Provider value={{ socket, isConnected, lastMessage, reconnect }}>
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
