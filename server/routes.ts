import type { Express } from "express";
import { createServer, type Server } from "http";
import { authenticate, createGuestSession } from "./middleware/authMiddleware";
import { isAdmin, isWaiter, isCashier, isWaiterOrCashier } from "./middleware/roleMiddleware";
import { WebSocketServer, WebSocket } from "ws";
import { websocketManager } from "./utils/websocketManager";

// Import controllers
import * as authController from "./controllers/authController";
import * as menuController from "./controllers/menuController";
import * as tableController from "./controllers/tableController";
import * as orderController from "./controllers/orderController";
import * as userController from "./controllers/userController";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);
  
  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Initialize WebSocket manager
  websocketManager.initialize(httpServer);
  
  // Set up API prefix
  const apiPrefix = '/api';
  
  // Auth routes
  app.post(`${apiPrefix}/auth/login`, authController.login);
  app.get(`${apiPrefix}/auth/me`, authenticate, authController.getCurrentUser);
  app.post(`${apiPrefix}/auth/logout`, authenticate, authController.logout);
  
  // Menu routes
  app.get(`${apiPrefix}/categories`, menuController.getAllCategories);
  app.get(`${apiPrefix}/menu-items`, menuController.getMenuItems);
  app.get(`${apiPrefix}/menu-items/:id`, menuController.getMenuItemById);
  
  // Admin menu management routes
  app.post(`${apiPrefix}/categories`, authenticate, isAdmin, menuController.createCategory);
  app.put(`${apiPrefix}/categories/:id`, authenticate, isAdmin, menuController.updateCategory);
  app.delete(`${apiPrefix}/categories/:id`, authenticate, isAdmin, menuController.deleteCategory);
  
  app.post(`${apiPrefix}/menu-items`, authenticate, isAdmin, menuController.createMenuItem);
  app.put(`${apiPrefix}/menu-items/:id`, authenticate, isAdmin, menuController.updateMenuItem);
  app.delete(`${apiPrefix}/menu-items/:id`, authenticate, isAdmin, menuController.deleteMenuItem);
  
  // Table routes
  app.get(`${apiPrefix}/tables`, tableController.getAllTables);
  app.get(`${apiPrefix}/tables/:id`, tableController.getTableById);
  app.get(`${apiPrefix}/tables/number/:number`, tableController.getTableByNumber);
  
  // Admin table management routes
  app.post(`${apiPrefix}/tables`, authenticate, isAdmin, tableController.createTable);
  app.put(`${apiPrefix}/tables/:id`, authenticate, isAdmin, tableController.updateTable);
  app.delete(`${apiPrefix}/tables/:id`, authenticate, isAdmin, tableController.deleteTable);
  app.post(`${apiPrefix}/tables/:id/regenerate-qr`, authenticate, isAdmin, tableController.regenerateTableQRCode);
  
  // Order routes
  app.get(`${apiPrefix}/orders`, authenticate, isWaiterOrCashier, orderController.getAllOrders);
  app.get(`${apiPrefix}/orders/:id`, authenticate, isWaiterOrCashier, orderController.getOrderById);
  app.get(`${apiPrefix}/tables/:tableId/active-order`, orderController.getActiveOrderForTable);
  
  // Guest order routes (with guest session)
  app.post(`${apiPrefix}/orders`, createGuestSession, orderController.createOrder);
  app.post(`${apiPrefix}/orders/:id/items`, createGuestSession, orderController.addItemsToOrder);
  app.post(`${apiPrefix}/orders/:id/feedback`, createGuestSession, orderController.addFeedback);
  
  // Waiter order management routes
  app.put(`${apiPrefix}/orders/:id/status`, authenticate, isWaiter, orderController.updateOrderStatus);
  
  // Cashier payment routes
  app.post(`${apiPrefix}/orders/:id/payment`, authenticate, isCashier, orderController.processPayment);
  
  // User management routes (admin only)
  app.get(`${apiPrefix}/users`, authenticate, isAdmin, userController.getAllUsers);
  app.get(`${apiPrefix}/users/:id`, authenticate, isAdmin, userController.getUserById);
  app.post(`${apiPrefix}/users`, authenticate, isAdmin, userController.createUser);
  app.put(`${apiPrefix}/users/:id`, authenticate, isAdmin, userController.updateUser);
  app.delete(`${apiPrefix}/users/:id`, authenticate, isAdmin, userController.deleteUser);
  
  return httpServer;
}
