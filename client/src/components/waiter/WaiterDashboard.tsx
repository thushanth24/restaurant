import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import OrderCard from './OrderCard';
import UserAvatar from '@/components/layout/UserAvatar';
import NotificationBell from '@/components/layout/NotificationBell';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WebSocketMessageType } from '@shared/types';

export default function WaiterDashboard() {
  const [activeTab, setActiveTab] = useState<string>('new');
  const { user } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [hasNewOrders, setHasNewOrders] = useState(false);

  // Get orders with status filter based on active tab
  const getStatusForTab = (tab: string) => {
    const statusMap: Record<string, string> = {
      'new': 'pending',
      'in-progress': 'placed',
      'served': 'served'
    };
    return statusMap[tab] || 'pending';
  };

  const {
    data: orders,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/orders', activeTab],
    queryFn: async ({ queryKey }) => {
      const status = getStatusForTab(queryKey[1] as string);
      const response = await apiRequest('GET', `/api/orders?status=${status}`);
      return response.json();
    },
  });

  // Update order status mutation
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: number, status: string }) => {
      const response = await apiRequest('PUT', `/api/orders/${orderId}/status`, {
        status,
        serverId: user?.id
      });
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: 'Order updated',
        description: `Order #${data.id} status updated to ${data.status}`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update order',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  // Listen for WebSocket messages
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === WebSocketMessageType.NEW_ORDER) {
          // Play sound and show notification for new order
          const audio = new Audio('https://cdn.freesound.org/previews/684/684982_14287070-lq.mp3');
          audio.play().catch(err => console.error('Failed to play notification sound:', err));
          
          setHasNewOrders(true);
          
          toast({
            title: 'New Order',
            description: `New order received for Table #${data.payload.tableNumber}`,
          });
          
          // Refetch orders to update the list
          refetch();
        }
        
        if (data.type === WebSocketMessageType.ORDER_STATUS_CHANGE) {
          // Refetch orders to update the list
          refetch();
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);
    };
  }, [socket, isConnected, refetch, toast]);

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'new') {
      setHasNewOrders(false);
    }
  };

  // Handle order actions
  const handleAcceptOrder = (orderId: number) => {
    updateOrderStatus.mutate({ orderId, status: 'placed' });
  };

  const handlePrepareOrder = (orderId: number) => {
    updateOrderStatus.mutate({ orderId, status: 'preparing' });
  };

  const handleServeOrder = (orderId: number) => {
    updateOrderStatus.mutate({ orderId, status: 'served' });
  };

  const handleCancelOrder = (orderId: number) => {
    updateOrderStatus.mutate({ orderId, status: 'cancelled' });
  };

  // Count orders per status type
  const newOrdersCount = orders?.filter((order: any) => order.status === 'pending').length || 0;
  const inProgressOrdersCount = orders?.filter((order: any) => 
    ['placed', 'preparing'].includes(order.status)
  ).length || 0;
  const servedOrdersCount = orders?.filter((order: any) => order.status === 'served').length || 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4">
        <Card className="bg-white rounded-lg shadow-md mb-6 p-4">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-48" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
          <div className="mb-6">
            <div className="border-b border-neutral-200">
              <div className="flex -mb-px">
                {['new', 'in-progress', 'served'].map((tab, index) => (
                  <Skeleton key={index} className="h-10 w-32 mr-2" />
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4">
        <Card className="bg-white rounded-lg shadow-md mb-6 p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error loading orders</h2>
          <p className="text-neutral-600">
            We're experiencing technical difficulties. Please try again later.
          </p>
          <button
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
            onClick={() => refetch()}
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <Card className="bg-white rounded-lg shadow-md mb-6 p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-secondary">Waiter Dashboard</h1>
          <div className="flex items-center gap-4">
            <NotificationBell hasNotifications={hasNewOrders} />
            {user && <UserAvatar user={user} />}
          </div>
        </div>

        {/* Order Status Tabs */}
        <div className="mb-6">
          <div className="border-b border-neutral-200">
            <ul className="flex -mb-px" id="order-status-tabs">
              <li className="mr-1">
                <button 
                  className={`status-tab ${activeTab === 'new' ? 'active' : ''}`}
                  onClick={() => handleTabChange('new')}
                >
                  New Orders <span className="ml-1 bg-primary text-white rounded-full px-2 py-0.5 text-xs">{newOrdersCount}</span>
                </button>
              </li>
              <li className="mr-1">
                <button 
                  className={`status-tab ${activeTab === 'in-progress' ? 'active' : ''}`}
                  onClick={() => handleTabChange('in-progress')}
                >
                  In Progress <span className="ml-1 bg-warning text-neutral-800 rounded-full px-2 py-0.5 text-xs">{inProgressOrdersCount}</span>
                </button>
              </li>
              <li className="mr-1">
                <button 
                  className={`status-tab ${activeTab === 'served' ? 'active' : ''}`}
                  onClick={() => handleTabChange('served')}
                >
                  Served <span className="ml-1 bg-accent text-white rounded-full px-2 py-0.5 text-xs">{servedOrdersCount}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Order Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders?.length === 0 ? (
            <div className="col-span-full text-center py-10 text-neutral-500">
              No orders found for this status
            </div>
          ) : (
            orders?.map((order: any) => (
              <OrderCard
                key={order.id}
                order={order}
                onAccept={() => handleAcceptOrder(order.id)}
                onPrepare={() => handlePrepareOrder(order.id)}
                onServe={() => handleServeOrder(order.id)}
                onCancel={() => handleCancelOrder(order.id)}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
