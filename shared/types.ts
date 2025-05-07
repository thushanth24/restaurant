// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    username: string;
    role: string;
  };
}

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: string;
}

// Guest session types
export interface GuestSession {
  id: string;
  tableId: number;
  tableNumber: number;
  createdAt: Date;
}

// WebSocket message types
export enum WebSocketMessageType {
  NEW_ORDER = 'new_order',
  ORDER_STATUS_CHANGE = 'order_status_change',
  ORDER_READY_FOR_PAYMENT = 'order_ready_for_payment',
  PAYMENT_COMPLETED = 'payment_completed',
  MENU_ITEM_AVAILABILITY_CHANGE = 'menu_item_availability_change',
  TABLE_STATUS_CHANGE = 'table_status_change',
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}

export interface OrderNotification {
  orderId: number;
  tableId: number;
  tableNumber: number;
  status: string;
  totalAmount: string;
  timestamp: Date;
}

// Extended types from schema with relations
export interface CategoryWithMenuItems extends Category {
  menuItems: MenuItem[];
}

export interface MenuItemWithCategory extends MenuItem {
  category: Category;
}

export interface OrderWithDetails extends Order {
  table: Table;
  orderItems: OrderItemWithMenuItem[];
  server?: User;
  cashier?: User;
}

export interface OrderItemWithMenuItem extends OrderItem {
  menuItem: MenuItem;
}

export interface TableWithOrders extends Table {
  orders: Order[];
}

// Import required types from schema
import {
  User,
  Table,
  Category,
  MenuItem,
  Order,
  OrderItem
} from './schema';
