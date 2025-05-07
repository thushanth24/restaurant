import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users & Roles
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin", "waiter", "cashier"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

// Restaurant Tables
export const tables = pgTable("tables", {
  id: serial("id").primaryKey(),
  number: integer("number").notNull().unique(),
  seats: integer("seats").notNull(),
  status: text("status", { enum: ["available", "occupied", "reserved"] }).default("available").notNull(),
  qrCode: text("qr_code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const tablesRelations = relations(tables, ({ many }) => ({
  orders: many(orders),
}));

// Menu Categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  menuItems: many(menuItems),
}));

// Menu Items
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  image: text("image"),
  categoryId: integer("category_id").references(() => categories.id).notNull(),
  isAvailable: boolean("is_available").default(true).notNull(),
  availableFrom: timestamp("available_from"),
  availableTo: timestamp("available_to"),
  allergies: jsonb("allergies").default([]).notNull(),
  dietaryInfo: jsonb("dietary_info").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  category: one(categories, { fields: [menuItems.categoryId], references: [categories.id] }),
  orderItems: many(orderItems),
}));

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").references(() => tables.id).notNull(),
  status: text("status", { 
    enum: ["pending", "placed", "preparing", "served", "completed", "cancelled"] 
  }).default("pending").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).default("0").notNull(),
  paymentStatus: text("payment_status", { 
    enum: ["unpaid", "paid"] 
  }).default("unpaid").notNull(),
  paymentMethod: text("payment_method", { 
    enum: ["cash", "card", ""] 
  }).default(""),
  serverId: integer("server_id").references(() => users.id),
  cashierId: integer("cashier_id").references(() => users.id),
  feedback: text("feedback"),
  specialInstructions: text("special_instructions"),
  guestName: text("guest_name"),
  guestSessionId: text("guest_session_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(tables, { fields: [orders.tableId], references: [tables.id] }),
  server: one(users, { fields: [orders.serverId], references: [users.id] }),
  cashier: one(users, { fields: [orders.cashierId], references: [users.id] }),
  orderItems: many(orderItems),
}));

// Order Items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  menuItemId: integer("menu_item_id").references(() => menuItems.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text("special_instructions"),
  status: text("status", { 
    enum: ["pending", "preparing", "served", "cancelled"] 
  }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  orderItemIdx: uniqueIndex("order_item_idx").on(t.orderId, t.menuItemId),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
}));

// Schemas for validation
export const userInsertSchema = createInsertSchema(users, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema) => schema.email("Must provide a valid email"),
  password: (schema) => schema.min(6, "Password must be at least 6 characters"),
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
});

export const tableInsertSchema = createInsertSchema(tables, {
  number: (schema) => schema.refine(val => Number(val) > 0, "Table number must be positive"),
  seats: (schema) => schema.refine(val => Number(val) > 0, "Seats must be positive"),
});

export const categoryInsertSchema = createInsertSchema(categories, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
});

export const menuItemInsertSchema = createInsertSchema(menuItems, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  price: (schema) => schema.refine(val => Number(val) > 0, "Price must be positive"),
});

export const orderInsertSchema = createInsertSchema(orders, {
  tableId: (schema) => schema.refine(val => Number(val) > 0, "Table ID must be positive"),
  guestSessionId: (schema) => schema.min(1, "Guest session ID is required"),
});

export const orderItemInsertSchema = createInsertSchema(orderItems, {
  orderId: (schema) => schema.refine(val => Number(val) > 0, "Order ID must be positive"),
  menuItemId: (schema) => schema.refine(val => Number(val) > 0, "Menu item ID must be positive"),
  quantity: (schema) => schema.refine(val => Number(val) > 0, "Quantity must be positive"),
  price: (schema) => schema.refine(val => Number(val) > 0, "Price must be positive"),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type", { 
    enum: ["new_order", "order_status_change", "payment_completed", "menu_item_update", "table_status_change"] 
  }).notNull(),
  message: text("message").notNull(),
  details: jsonb("details").default({}).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  targetRole: text("target_role", { enum: ["admin", "waiter", "cashier"] }),
});

export const notificationsRelations = relations(notifications, ({}) => ({}));

export const notificationInsertSchema = createInsertSchema(notifications, {
  message: (schema) => schema.min(1, "Message is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type UserInsert = z.infer<typeof userInsertSchema>;

export type Table = typeof tables.$inferSelect;
export type TableInsert = z.infer<typeof tableInsertSchema>;

export type Category = typeof categories.$inferSelect;
export type CategoryInsert = z.infer<typeof categoryInsertSchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type MenuItemInsert = z.infer<typeof menuItemInsertSchema>;

export type Order = typeof orders.$inferSelect;
export type OrderInsert = z.infer<typeof orderInsertSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type OrderItemInsert = z.infer<typeof orderItemInsertSchema>;

export type Notification = typeof notifications.$inferSelect;
export type NotificationInsert = z.infer<typeof notificationInsertSchema>;
