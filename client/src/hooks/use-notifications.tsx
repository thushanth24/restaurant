import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { POLLING_INTERVAL } from '@/lib/queryClient';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { playNotificationSound } from '@/lib/utils';

// Types for notification data
export interface Notification {
  id: number;
  type: 'new_order' | 'order_status_change' | 'payment_completed' | 'menu_item_update' | 'table_status_change';
  message: string;
  details: Record<string, any>;
  timestamp: string;
  isRead: boolean;
}

/**
 * Hook for polling-based notification system
 * @param options Configuration options
 * @returns Notification data and utility functions
 */
export function useNotifications({
  playSound = true,
  showToasts = true,
  pollingInterval = POLLING_INTERVAL,
  autoMarkAsRead = false,
  role
}: {
  playSound?: boolean;
  showToasts?: boolean;
  pollingInterval?: number;
  autoMarkAsRead?: boolean;
  role?: 'admin' | 'waiter' | 'cashier';
} = {}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const lastNotificationIdRef = useRef<number | null>(null);

  // Only enable polling when authenticated
  const enabled = isAuthenticated && !!user;
  
  // Build query key based on user role - this helps filter notifications on the server
  const queryKey = [`/api/notifications${role ? `?role=${role}` : ''}`];

  // Query for polling notifications
  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch
  } = useQuery<Notification[]>({
    queryKey,
    // Enable polling at the specified interval
    refetchInterval: enabled ? pollingInterval : false,
    // Only run query when authenticated
    enabled,
    // Avoid stale data issues by using a reasonable staleTime
    staleTime: pollingInterval / 2
  });

  // Mark notifications as read
  const markAsRead = async (ids: number[]) => {
    if (!ids.length) return;
    
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ids })
      });
      
      // Invalidate the notifications query to refetch with updated data
      queryClient.invalidateQueries({ queryKey });
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  // Show toast notifications for new items
  useEffect(() => {
    // Type assertion to make TypeScript happy
    const notificationArray = notifications as Notification[];
    
    if (!notificationArray.length || !enabled || !showToasts) return;
    
    // Get the last notification (most recent)
    const latestNotification = notificationArray[0];
    
    // Check if this is a new notification
    if (
      lastNotificationIdRef.current !== null &&
      latestNotification.id > lastNotificationIdRef.current &&
      !latestNotification.isRead
    ) {
      // Show toast notification
      toast({
        title: getNotificationTitle(latestNotification.type),
        description: latestNotification.message,
        variant: 'default',
      });
      
      // Play sound if enabled
      if (playSound) {
        playNotificationSound();
      }
      
      // Mark as read automatically if configured
      if (autoMarkAsRead) {
        markAsRead([latestNotification.id]);
      }
    }
    
    // Update the reference to the latest notification ID
    lastNotificationIdRef.current = latestNotification.id;
  }, [notifications, enabled, showToasts, playSound, autoMarkAsRead, toast, markAsRead]);

  // Cast notifications to proper type to make TypeScript happy
  const typedNotifications = notifications as Notification[];
  
  return {
    notifications: typedNotifications,
    unreadCount: typedNotifications.filter((n: Notification) => !n.isRead).length,
    isLoading,
    isError,
    error,
    refetch,
    markAsRead
  };
}

// Helper function to get a user-friendly title based on notification type
function getNotificationTitle(type: string): string {
  switch (type) {
    case 'new_order':
      return 'New Order Received';
    case 'order_status_change':
      return 'Order Status Updated';
    case 'payment_completed':
      return 'Payment Completed';
    case 'menu_item_update':
      return 'Menu Item Updated';
    case 'table_status_change':
      return 'Table Status Changed';
    default:
      return 'Notification';
  }
}