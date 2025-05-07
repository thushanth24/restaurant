import { WebSocket, WebSocketServer } from 'ws';
import { WebSocketMessage, WebSocketMessageType } from '@shared/types';
import http from 'http';

interface Client {
  ws: WebSocket;
  role?: string;
  userId?: number;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, Client> = new Map();

  // Initialize the WebSocket server
  initialize(server: http.Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws' 
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      
      // Add new client to the map
      this.clients.set(ws, { ws });

      // Handle incoming messages
      ws.on('message', (message: string) => {
        try {
          const parsedMessage = JSON.parse(message) as WebSocketMessage;
          
          // Handle authentication message
          if (parsedMessage.type === 'authenticate') {
            const client = this.clients.get(ws);
            if (client) {
              client.role = parsedMessage.payload.role;
              client.userId = parsedMessage.payload.userId;
              this.clients.set(ws, client);
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      // Handle client disconnect
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });
    });

    console.log('WebSocket server initialized');
  }

  // Send a message to all connected clients
  broadcast(message: WebSocketMessage) {
    if (!this.wss) {
      console.error('WebSocket server not initialized');
      return;
    }

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Send a message to clients with a specific role
  broadcastToRole(message: WebSocketMessage, role: string) {
    if (!this.wss) {
      console.error('WebSocket server not initialized');
      return;
    }

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN && client.role === role) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Send a message to a specific user
  sendToUser(message: WebSocketMessage, userId: number) {
    if (!this.wss) {
      console.error('WebSocket server not initialized');
      return;
    }

    this.clients.forEach((client) => {
      if (client.ws.readyState === WebSocket.OPEN && client.userId === userId) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Notify waiters about new orders
  notifyNewOrder(orderId: number, tableNumber: number) {
    this.broadcastToRole({
      type: WebSocketMessageType.NEW_ORDER,
      payload: {
        orderId,
        tableNumber,
        timestamp: new Date()
      }
    }, 'waiter');
  }

  // Notify about order status changes
  notifyOrderStatusChange(orderId: number, tableNumber: number, status: string) {
    this.broadcast({
      type: WebSocketMessageType.ORDER_STATUS_CHANGE,
      payload: {
        orderId,
        tableNumber,
        status,
        timestamp: new Date()
      }
    });
  }

  // Notify cashiers about orders ready for payment
  notifyOrderReadyForPayment(orderId: number, tableNumber: number, totalAmount: string) {
    this.broadcastToRole({
      type: WebSocketMessageType.ORDER_READY_FOR_PAYMENT,
      payload: {
        orderId,
        tableNumber,
        totalAmount,
        timestamp: new Date()
      }
    }, 'cashier');
  }

  // Notify about completed payments
  notifyPaymentCompleted(orderId: number, tableNumber: number) {
    this.broadcast({
      type: WebSocketMessageType.PAYMENT_COMPLETED,
      payload: {
        orderId,
        tableNumber,
        timestamp: new Date()
      }
    });
  }

  // Notify about menu item availability changes
  notifyMenuItemAvailabilityChange(menuItemId: number, name: string, isAvailable: boolean) {
    this.broadcast({
      type: WebSocketMessageType.MENU_ITEM_AVAILABILITY_CHANGE,
      payload: {
        menuItemId,
        name,
        isAvailable,
        timestamp: new Date()
      }
    });
  }

  // Notify about table status changes
  notifyTableStatusChange(tableId: number, tableNumber: number, status: string) {
    this.broadcast({
      type: WebSocketMessageType.TABLE_STATUS_CHANGE,
      payload: {
        tableId,
        tableNumber,
        status,
        timestamp: new Date()
      }
    });
  }
}

// Create and export singleton instance
export const websocketManager = new WebSocketManager();
