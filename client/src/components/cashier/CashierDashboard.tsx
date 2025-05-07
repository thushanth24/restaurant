import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useWebSocket } from '@/context/WebSocketContext';
import { useToast } from '@/hooks/use-toast';
import BillCard from './BillCard';
import UserAvatar from '@/components/layout/UserAvatar';
import NotificationBell from '@/components/layout/NotificationBell';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WebSocketMessageType } from '@shared/types';

export default function CashierDashboard() {
  const [activeTab, setActiveTab] = useState<string>('pending');
  const { user } = useAuth();
  const { socket, isConnected } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingPaymentNotification, setPendingPaymentNotification] = useState(false);

  // Get orders with payment status filter based on active tab
  const getStatusForTab = (tab: string) => {
    const statusMap: Record<string, { paymentStatus: string; orderStatus: string }> = {
      'pending': { paymentStatus: 'unpaid', orderStatus: 'served' },
      'completed': { paymentStatus: 'paid', orderStatus: 'completed' }
    };
    return statusMap[tab] || statusMap['pending'];
  };

  const {
    data: orders,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/orders', activeTab],
    queryFn: async ({ queryKey }) => {
      const statusFilter = getStatusForTab(queryKey[1] as string);
      const response = await fetch(`/api/orders?status=${statusFilter.orderStatus}`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const allOrders = await response.json();
      return allOrders.filter((order: any) => order.paymentStatus === statusFilter.paymentStatus);
    },
  });

  // Process payment mutation
  const processPayment = useMutation({
    mutationFn: async ({ 
      orderId, 
      paymentMethod 
    }: { 
      orderId: number, 
      paymentMethod: string 
    }) => {
      const response = await fetch(`/api/orders/${orderId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentMethod,
          cashierId: user?.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process payment');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: 'Payment processed',
        description: `Payment for order #${data.id} has been processed successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to process payment',
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
        
        if (data.type === WebSocketMessageType.ORDER_READY_FOR_PAYMENT) {
          // Play sound and show notification for new bill
          const audio = new Audio('https://cdn.freesound.org/previews/242/242501_4414128-lq.mp3');
          audio.play().catch(err => console.error('Failed to play notification sound:', err));
          
          setPendingPaymentNotification(true);
          
          toast({
            title: 'New Bill Ready',
            description: `Table #${data.payload.tableNumber} is ready for payment`,
          });
          
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
    if (tab === 'pending') {
      setPendingPaymentNotification(false);
    }
  };

  // Handle payment
  const handlePayment = (orderId: number, paymentMethod: string) => {
    processPayment.mutate({ orderId, paymentMethod });
  };

  // Count orders per status type
  const pendingCount = orders?.filter((order: any) => 
    order.status === 'served' && order.paymentStatus === 'unpaid'
  ).length || 0;
  
  const completedCount = orders?.filter((order: any) => 
    order.status === 'completed' && order.paymentStatus === 'paid'
  ).length || 0;

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
                {['pending', 'completed'].map((tab, index) => (
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
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error loading bills</h2>
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
          <h1 className="text-2xl font-semibold text-secondary">Cashier Dashboard</h1>
          <div className="flex items-center gap-4">
            <NotificationBell hasNotifications={pendingPaymentNotification} />
            {user && <UserAvatar user={user} />}
          </div>
        </div>

        {/* Payment Status Tabs */}
        <div className="mb-6">
          <div className="border-b border-neutral-200">
            <ul className="flex -mb-px" id="payment-status-tabs">
              <li className="mr-1">
                <button 
                  className={`status-tab ${activeTab === 'pending' ? 'active' : ''}`}
                  onClick={() => handleTabChange('pending')}
                >
                  Pending Payment <span className="ml-1 bg-warning text-neutral-800 rounded-full px-2 py-0.5 text-xs">{pendingCount}</span>
                </button>
              </li>
              <li className="mr-1">
                <button 
                  className={`status-tab ${activeTab === 'completed' ? 'active' : ''}`}
                  onClick={() => handleTabChange('completed')}
                >
                  Completed <span className="ml-1 bg-accent text-white rounded-full px-2 py-0.5 text-xs">{completedCount}</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bills for Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders?.length === 0 ? (
            <div className="col-span-full text-center py-10 text-neutral-500">
              No bills found for this status
            </div>
          ) : (
            orders?.map((order: any) => (
              <BillCard
                key={order.id}
                order={order}
                onProcessPayment={handlePayment}
                isPending={activeTab === 'pending'}
              />
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
