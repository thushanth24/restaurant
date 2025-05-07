import { createContext, useContext, ReactNode } from 'react';
import { useNotifications, Notification } from '@/hooks/use-notifications';
import { useAuth } from '@/context/AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (ids: number[]) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Configure notifications based on user role
  const role = user?.role;
  
  // Set up notifications with role-based filtering
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead
  } = useNotifications({
    playSound: true,
    showToasts: true,
    autoMarkAsRead: false,
    role: role as 'admin' | 'waiter' | 'cashier' | undefined
  });

  return (
    <NotificationContext.Provider 
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  
  return context;
}