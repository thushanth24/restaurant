import { Request, Response } from 'express';
import { db } from '../../db';
import { notifications, notificationsRelations, users } from '../../shared/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

// Get notifications for a user based on their role
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the user to check their role
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all notifications for this user's role, or all if admin
    const userNotifications = await db.query.notifications.findMany({
      orderBy: [desc(notifications.timestamp)],
      limit: 50, // Limit to the 50 most recent notifications
    });

    // Filter notifications based on role after fetching
    const filteredNotifications = user.role === 'admin' 
      ? userNotifications 
      : userNotifications.filter(notification => 
          notification.targetRole === user.role || 
          (req.query.role && notification.targetRole === req.query.role));
      

    return res.status(200).json(filteredNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Mark notifications as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { ids } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid notification IDs' });
    }

    // Update the isRead status for the specified notifications
    await db.update(notifications)
      .set({ isRead: true })
      .where(inArray(notifications.id, ids))
      .execute();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new notification
export const createNotification = async (
  type: "new_order" | "order_status_change" | "payment_completed" | "menu_item_update" | "table_status_change",
  message: string,
  details: Record<string, any> = {},
  targetRole?: "admin" | "waiter" | "cashier" | null
) => {
  try {
    // Create the notification directly with proper typing
    const [notification] = await db.insert(notifications).values({
      type, // Now properly typed
      message,
      details, // Details already typed as jsonb in schema
      timestamp: new Date(),
      isRead: false,
      targetRole: targetRole || null
    }).returning();

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Create a test notification via API endpoint
export const createTestNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the user to check if they are admin
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create test notifications' });
    }

    const { type, message, targetRole, details = {} } = req.body;

    if (!type || !message) {
      return res.status(400).json({ error: 'Type and message are required' });
    }

    // Validate notification type
    const validTypes = ['new_order', 'order_status_change', 'payment_completed', 'menu_item_update', 'table_status_change'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid notification type' });
    }

    // Validate target role if provided
    if (targetRole && !['admin', 'waiter', 'cashier'].includes(targetRole)) {
      return res.status(400).json({ error: 'Invalid target role' });
    }

    // Create the notification with proper type casting
    const notification = await db.insert(notifications).values({
      // Use type assertion for the enum types
      type: type as any,
      message,
      details,
      timestamp: new Date(),
      isRead: false,
      targetRole: targetRole as any || null
    }).returning();

    if (!notification || notification.length === 0) {
      return res.status(500).json({ error: 'Failed to create notification' });
    }

    return res.status(201).json(notification[0]);
  } catch (error) {
    console.error('Error creating test notification:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};