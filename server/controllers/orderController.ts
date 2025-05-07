import { Request, Response } from 'express';
import { db } from '@db';
import { orders, orderItems, tables, menuItems } from '@shared/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { websocketManager } from '../utils/websocketManager';
import { WebSocketMessageType } from '@shared/types';

// Get all orders with optional filters
export const getAllOrders = async (req: Request, res: Response) => {
  try {
    const { status, tableId } = req.query;
    
    let query = db.query.orders.findMany({
      with: {
        table: true,
        orderItems: {
          with: {
            menuItem: true
          }
        },
        server: true,
        cashier: true
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });
    
    // Apply filters if provided
    if (status) {
      query = db.query.orders.findMany({
        where: eq(orders.status, status as string),
        with: {
          table: true,
          orderItems: {
            with: {
              menuItem: true
            }
          },
          server: true,
          cashier: true
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });
    }
    
    if (tableId && !isNaN(parseInt(tableId as string))) {
      query = db.query.orders.findMany({
        where: eq(orders.tableId, parseInt(tableId as string)),
        with: {
          table: true,
          orderItems: {
            with: {
              menuItem: true
            }
          },
          server: true,
          cashier: true
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });
    }
    
    // Apply both filters if both provided
    if (status && tableId && !isNaN(parseInt(tableId as string))) {
      query = db.query.orders.findMany({
        where: and(
          eq(orders.status, status as string),
          eq(orders.tableId, parseInt(tableId as string))
        ),
        with: {
          table: true,
          orderItems: {
            with: {
              menuItem: true
            }
          },
          server: true,
          cashier: true
        },
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });
    }
    
    const allOrders = await query;
    
    return res.status(200).json(allOrders);
  } catch (error) {
    console.error('Error getting orders:', error);
    return res.status(500).json({ message: 'Server error fetching orders' });
  }
};

// Get a specific order by ID
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(id)),
      with: {
        table: true,
        orderItems: {
          with: {
            menuItem: true
          }
        },
        server: true,
        cashier: true
      }
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    return res.status(200).json(order);
  } catch (error) {
    console.error('Error getting order:', error);
    return res.status(500).json({ message: 'Server error fetching order' });
  }
};

// Get active order for a table
export const getActiveOrderForTable = async (req: Request, res: Response) => {
  try {
    const { tableId } = req.params;
    
    if (!tableId || isNaN(parseInt(tableId))) {
      return res.status(400).json({ message: 'Invalid table ID' });
    }
    
    // Get active orders for the table (pending, placed, or preparing)
    const activeOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.tableId, parseInt(tableId)),
        inArray(orders.status, ['pending', 'placed', 'preparing', 'served'])
      ),
      with: {
        table: true,
        orderItems: {
          with: {
            menuItem: true
          }
        }
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    });
    
    if (!activeOrder) {
      return res.status(404).json({ message: 'No active order found for this table' });
    }
    
    return res.status(200).json(activeOrder);
  } catch (error) {
    console.error('Error getting active order for table:', error);
    return res.status(500).json({ message: 'Server error fetching active order' });
  }
};

// Create a new order
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { tableId, items, specialInstructions, guestName, guestSessionId } = req.body;
    
    // Validate required fields
    if (!tableId || !items || !items.length) {
      return res.status(400).json({ message: 'Table ID and at least one item are required' });
    }
    
    // Check if table exists
    const table = await db.query.tables.findFirst({
      where: eq(tables.id, tableId),
    });
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Check if there's already an active order for this table
    const activeOrder = await db.query.orders.findFirst({
      where: and(
        eq(orders.tableId, tableId),
        inArray(orders.status, ['pending', 'placed', 'preparing'])
      ),
    });
    
    if (activeOrder) {
      return res.status(400).json({ 
        message: 'There is already an active order for this table',
        orderId: activeOrder.id
      });
    }
    
    // Set guest session ID (either from request or generate new one)
    const sessionId = guestSessionId || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    
    // Start a transaction for order creation
    const orderData = {
      tableId,
      specialInstructions: specialInstructions || '',
      guestName: guestName || '',
      guestSessionId: sessionId,
      status: 'pending'
    };
    
    // Create the order
    const [newOrder] = await db.insert(orders).values(orderData).returning();
    
    // Calculate total amount and add each item
    let totalAmount = 0;
    
    for (const item of items) {
      // Get the menu item to get its current price
      const menuItem = await db.query.menuItems.findFirst({
        where: eq(menuItems.id, item.menuItemId)
      });
      
      if (!menuItem) {
        console.error(`Menu item with ID ${item.menuItemId} not found`);
        continue;
      }
      
      // Check if the item is available
      if (!menuItem.isAvailable) {
        console.error(`Menu item ${menuItem.name} is not available`);
        continue;
      }
      
      // Add the order item
      await db.insert(orderItems).values({
        orderId: newOrder.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions || null
      });
      
      // Calculate price for this item
      const itemTotal = parseFloat(menuItem.price.toString()) * item.quantity;
      totalAmount += itemTotal;
    }
    
    // Update order with total amount
    const [updatedOrder] = await db.update(orders)
      .set({
        totalAmount: totalAmount.toFixed(2),
      })
      .where(eq(orders.id, newOrder.id))
      .returning();
    
    // Update table status to occupied
    await db.update(tables)
      .set({
        status: 'occupied',
        updatedAt: new Date()
      })
      .where(eq(tables.id, tableId));
    
    // Get the complete order with items
    const completeOrder = await db.query.orders.findFirst({
      where: eq(orders.id, newOrder.id),
      with: {
        table: true,
        orderItems: {
          with: {
            menuItem: true
          }
        }
      }
    });
    
    // Notify waiters about the new order
    websocketManager.notifyNewOrder(
      newOrder.id,
      table.number
    );
    
    return res.status(201).json(completeOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ message: 'Server error creating order' });
  }
};

// Update order status
export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, serverId } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    // Check if order exists
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(id)),
      with: {
        table: true
      }
    });
    
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if the status transition is valid
    const validTransitions: Record<string, string[]> = {
      'pending': ['placed', 'cancelled'],
      'placed': ['preparing', 'cancelled'],
      'preparing': ['served', 'cancelled'],
      'served': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    
    if (!validTransitions[existingOrder.status].includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${existingOrder.status} to ${status}` 
      });
    }
    
    // Update order status
    const updateData: any = {
      status,
      updatedAt: new Date()
    };
    
    // If moving to completed status, set completedAt
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    // If status is placed or preparing, assign server if provided
    if (['placed', 'preparing'].includes(status) && serverId) {
      updateData.serverId = serverId;
    }
    
    const [updatedOrder] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, parseInt(id)))
      .returning();
    
    // Get the updated order with all related data
    const completeOrder = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(id)),
      with: {
        table: true,
        orderItems: {
          with: {
            menuItem: true
          }
        },
        server: true,
        cashier: true
      }
    });
    
    // Special handling for completed orders
    if (status === 'completed') {
      // Mark table as available
      await db.update(tables)
        .set({
          status: 'available',
          updatedAt: new Date()
        })
        .where(eq(tables.id, existingOrder.tableId));
      
      // Notify about table status
      websocketManager.notifyTableStatusChange(
        existingOrder.tableId,
        existingOrder.table.number,
        'available'
      );
    }
    
    // If status is changed to served, notify cashiers it's ready for payment
    if (status === 'served') {
      websocketManager.notifyOrderReadyForPayment(
        updatedOrder.id,
        existingOrder.table.number,
        updatedOrder.totalAmount.toString()
      );
    }
    
    // Notify clients about the order status change
    websocketManager.notifyOrderStatusChange(
      updatedOrder.id,
      existingOrder.table.number,
      status
    );
    
    return res.status(200).json(completeOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    return res.status(500).json({ message: 'Server error updating order status' });
  }
};

// Process payment for an order
export const processPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod, cashierId } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required' });
    }
    
    // Check if order exists
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(id)),
      with: {
        table: true
      }
    });
    
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order status is 'served'
    if (existingOrder.status !== 'served') {
      return res.status(400).json({ 
        message: `Order must be in 'served' status to process payment. Current status: ${existingOrder.status}` 
      });
    }
    
    // Update order with payment information
    const [updatedOrder] = await db.update(orders)
      .set({
        paymentStatus: 'paid',
        paymentMethod,
        cashierId,
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(orders.id, parseInt(id)))
      .returning();
    
    // Mark table as available
    await db.update(tables)
      .set({
        status: 'available',
        updatedAt: new Date()
      })
      .where(eq(tables.id, existingOrder.tableId));
    
    // Get complete order with related data
    const completeOrder = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(id)),
      with: {
        table: true,
        orderItems: {
          with: {
            menuItem: true
          }
        },
        server: true,
        cashier: true
      }
    });
    
    // Notify about payment completion
    websocketManager.notifyPaymentCompleted(
      updatedOrder.id,
      existingOrder.table.number
    );
    
    // Notify about table status
    websocketManager.notifyTableStatusChange(
      existingOrder.tableId,
      existingOrder.table.number,
      'available'
    );
    
    return res.status(200).json(completeOrder);
  } catch (error) {
    console.error('Error processing payment:', error);
    return res.status(500).json({ message: 'Server error processing payment' });
  }
};

// Add items to an existing order
export const addItemsToOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    if (!items || !items.length) {
      return res.status(400).json({ message: 'Items array is required' });
    }
    
    // Check if order exists
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(id)),
      with: {
        orderItems: true
      }
    });
    
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order status allows adding items
    if (!['pending', 'placed', 'preparing'].includes(existingOrder.status)) {
      return res.status(400).json({ 
        message: `Cannot add items to an order with status '${existingOrder.status}'` 
      });
    }
    
    // Calculate current total amount
    let totalAmount = parseFloat(existingOrder.totalAmount.toString());
    
    // Add each new item
    for (const item of items) {
      // Get the menu item
      const menuItem = await db.query.menuItems.findFirst({
        where: eq(menuItems.id, item.menuItemId)
      });
      
      if (!menuItem) {
        console.error(`Menu item with ID ${item.menuItemId} not found`);
        continue;
      }
      
      // Check if item is available
      if (!menuItem.isAvailable) {
        console.error(`Menu item ${menuItem.name} is not available`);
        continue;
      }
      
      // Check if the item already exists in the order
      const existingItem = existingOrder.orderItems.find(
        orderItem => orderItem.menuItemId === item.menuItemId
      );
      
      if (existingItem) {
        // Update existing item quantity
        const newQuantity = existingItem.quantity + item.quantity;
        
        await db.update(orderItems)
          .set({
            quantity: newQuantity,
            updatedAt: new Date()
          })
          .where(eq(orderItems.id, existingItem.id));
        
        // Update total amount
        totalAmount += parseFloat(menuItem.price.toString()) * item.quantity;
      } else {
        // Add new order item
        await db.insert(orderItems).values({
          orderId: parseInt(id),
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: menuItem.price,
          specialInstructions: item.specialInstructions || null
        });
        
        // Update total amount
        totalAmount += parseFloat(menuItem.price.toString()) * item.quantity;
      }
    }
    
    // Update order with new total amount
    const [updatedOrder] = await db.update(orders)
      .set({
        totalAmount: totalAmount.toFixed(2),
        updatedAt: new Date()
      })
      .where(eq(orders.id, parseInt(id)))
      .returning();
    
    // Get the updated order with all items
    const completeOrder = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(id)),
      with: {
        table: true,
        orderItems: {
          with: {
            menuItem: true
          }
        },
        server: true,
        cashier: true
      }
    });
    
    return res.status(200).json(completeOrder);
  } catch (error) {
    console.error('Error adding items to order:', error);
    return res.status(500).json({ message: 'Server error adding items to order' });
  }
};

// Add feedback to a completed order
export const addFeedback = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    if (!feedback) {
      return res.status(400).json({ message: 'Feedback is required' });
    }
    
    // Check if order exists
    const existingOrder = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(id))
    });
    
    if (!existingOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if order is completed
    if (existingOrder.status !== 'completed') {
      return res.status(400).json({ 
        message: 'Feedback can only be added to completed orders' 
      });
    }
    
    // Update order with feedback
    const [updatedOrder] = await db.update(orders)
      .set({
        feedback,
        updatedAt: new Date()
      })
      .where(eq(orders.id, parseInt(id)))
      .returning();
    
    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error adding feedback to order:', error);
    return res.status(500).json({ message: 'Server error adding feedback' });
  }
};
