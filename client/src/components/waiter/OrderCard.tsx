import { useState } from 'react';
import { Order, OrderItem } from '@shared/schema';
import { timeAgo, formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Printer } from 'lucide-react';

interface OrderCardProps {
  order: any; // Using any because the order includes related data
  onAccept: () => void;
  onPrepare: () => void;
  onServe: () => void;
  onCancel: () => void;
}

export default function OrderCard({ order, onAccept, onPrepare, onServe, onCancel }: OrderCardProps) {
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  // Format creation time as "X time ago"
  const timeAgoStr = timeAgo(new Date(order.createdAt));

  // Get status badge class and text
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { class: string; text: string }> = {
      pending: { class: 'bg-primary text-white', text: 'New' },
      placed: { class: 'bg-blue-500 text-white', text: 'Placed' },
      preparing: { class: 'bg-warning text-neutral-800', text: 'Preparing' },
      served: { class: 'bg-accent text-white', text: 'Served' },
      completed: { class: 'bg-green-500 text-white', text: 'Completed' },
      cancelled: { class: 'bg-danger text-white', text: 'Cancelled' },
    };

    return statusMap[status] || { class: 'bg-neutral-500 text-white', text: status };
  };

  const statusBadge = getStatusBadge(order.status);

  // Get action buttons based on order status
  const getActionButtons = () => {
    switch (order.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 bg-accent text-white rounded font-medium hover:bg-accent/90"
              onClick={onAccept}
            >
              Accept
            </button>
            <button
              className="py-2 px-3 border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-100"
              onClick={() => setShowConfirmCancel(true)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        );
      case 'placed':
        return (
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 bg-warning text-neutral-800 rounded font-medium hover:bg-warning/90"
              onClick={onPrepare}
            >
              Start Preparing
            </button>
            <button
              className="py-2 px-3 border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-100"
              onClick={() => setShowConfirmCancel(true)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        );
      case 'preparing':
        return (
          <div className="flex gap-2">
            <button
              className="flex-1 py-2 bg-accent text-white rounded font-medium hover:bg-accent/90"
              onClick={onServe}
            >
              Mark as Served
            </button>
            <button
              className="py-2 px-3 border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-100"
              onClick={() => window.print()}
            >
              <i className="fas fa-print"></i>
            </button>
          </div>
        );
      case 'served':
        return (
          <div className="flex justify-center">
            <span className="text-neutral-600 text-sm">
              Waiting for payment
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  // Calculate total amount from items
  const totalAmount = parseFloat(order.totalAmount);

  return (
    <>
      <div className="order-card">
        <div className="order-card-header">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Table #{order.table.number}</span>
              <span className={`text-xs ${statusBadge.class} px-2 py-0.5 rounded-full`}>
                {statusBadge.text}
              </span>
            </div>
            <span className="text-sm text-neutral-500">{timeAgoStr}</span>
          </div>
        </div>
        <div className="order-card-body">
          <ul className="mb-4">
            {order.orderItems.map((item: any) => (
              <li key={item.id} className="flex justify-between mb-2">
                <span>
                  {item.quantity} × {item.menuItem.name}
                </span>
                <span className="text-neutral-600">
                  {formatCurrency(parseFloat(item.price) * item.quantity)}
                </span>
              </li>
            ))}
            {order.specialInstructions && (
              <li className="text-sm mt-2 p-2 bg-neutral-50 rounded">
                <span className="font-medium">Special instructions:</span> {order.specialInstructions}
              </li>
            )}
          </ul>
          <div className="flex justify-between font-medium mb-4">
            <span>Total</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
          {getActionButtons()}
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showConfirmCancel} onOpenChange={setShowConfirmCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel order #{order.id} for Table #{order.table.number}?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmCancel(false)}>
              No, Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onCancel();
                setShowConfirmCancel(false);
              }}
            >
              Yes, Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
