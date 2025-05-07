import { useNotificationContext } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDate } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEffect, useState } from 'react';

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotificationContext();
  const [open, setOpen] = useState(false);
  
  // Mark all as read when popover is closed
  useEffect(() => {
    if (!open && unreadCount > 0) {
      const unreadIds = notifications
        .filter(notification => !notification.isRead)
        .map(notification => notification.id);
      
      markAsRead(unreadIds);
    }
  }, [open, unreadCount, notifications, markAsRead]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b border-border px-4 py-2">
          <h4 className="text-sm font-medium">Notifications</h4>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications.length > 0 ? (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 ${notification.isRead ? '' : 'bg-muted/50'}`}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <h5 className="text-sm font-medium">
                      {getNotificationTitle(notification.type)}
                    </h5>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center p-4">
              <p className="text-center text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// Helper function to get a user-friendly title based on notification type
function getNotificationTitle(type: string): string {
  switch (type) {
    case 'new_order':
      return 'New Order';
    case 'order_status_change':
      return 'Order Status';
    case 'payment_completed':
      return 'Payment';
    case 'menu_item_update':
      return 'Menu Item';
    case 'table_status_change':
      return 'Table Status';
    default:
      return 'Notification';
  }
}

// Helper function to format timestamp as relative time (e.g., "5m ago")
function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  
  if (diffSeconds < 60) {
    return 'just now';
  }
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  
  return formatDate(date);
}