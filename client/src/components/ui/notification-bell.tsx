import { useEffect, useState } from "react";
import { BellIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ScrollArea,
  ScrollBar
} from "@/components/ui/scroll-area";
import { useNotifications, type Notification } from "@/hooks/use-notifications";
import { timeAgo } from "@/lib/utils";
import { playNotificationSound } from "@/lib/utils";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications({
    roleFilter: null, // Get all notifications for this user's role
    pollingInterval: 5000, // Poll every 5 seconds
  });

  const [isOpen, setIsOpen] = useState(false);
  const [lastNotificationCount, setLastNotificationCount] = useState(0);

  // Play sound when new notifications arrive
  useEffect(() => {
    if (unreadCount > lastNotificationCount && lastNotificationCount > 0) {
      playNotificationSound();
    }
    setLastNotificationCount(unreadCount);
  }, [unreadCount, lastNotificationCount]);

  // Mark all as read when opening the popover
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open && unreadCount > 0) {
      const unreadIds = notifications
        .filter((n: Notification) => !n.isRead)
        .map((n: Notification) => n.id);
      
      if (unreadIds.length > 0) {
        markAsRead(unreadIds);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    return <BellIcon size={16} />;
  };

  const getNotificationColorClass = (type: string) => {
    switch (type) {
      case 'new_order':
        return 'bg-blue-50 border-blue-100';
      case 'order_status_change':
        return 'bg-purple-50 border-purple-100';
      case 'payment_completed':
        return 'bg-green-50 border-green-100';
      case 'menu_item_update':
        return 'bg-amber-50 border-amber-100';
      case 'table_status_change':
        return 'bg-gray-50 border-gray-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative"
        >
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-sm text-muted-foreground">
            {notifications.length 
              ? `You have ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`
              : 'No notifications yet'}
          </p>
        </div>
        {notifications.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="grid gap-1 p-2">
              {notifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 rounded-md border p-3 text-sm ${
                    notification.isRead ? 'opacity-60' : 'font-medium'
                  } ${getNotificationColorClass(notification.type)}`}
                >
                  <div className="mt-1 text-foreground">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="grid gap-1">
                    <p>{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {timeAgo(notification.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <ScrollBar />
          </ScrollArea>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            You're all caught up!
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}