import { createContext, ReactNode, useContext } from 'react';
import { Notification, useNotifications } from '@/hooks/use-notifications';
import { useAuth } from '@/context/AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (ids: number[]) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  
  // Configure notifications based on user role
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
  } = useNotifications({
    enabled: isAuthenticated,
    role: user?.role,
    pollingInterval: 5000, // Poll every 5 seconds
    showToasts: true, // Show toast notifications for new items
    playSound: true, // Play sound for new notifications
    autoMarkAsRead: false, // Don't automatically mark as read
  });

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}