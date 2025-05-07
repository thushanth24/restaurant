import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface OrderItem {
  menuItemId: number;
  name: string;
  price: string;
  quantity: number;
}

interface OrderSummaryProps {
  items: OrderItem[];
  totalPrice: number;
  onRemoveItem: (menuItemId: number) => void;
  onUpdateQuantity: (menuItemId: number, quantity: number) => void;
  onPlaceOrder: () => void;
  existingOrder: any;
}

export default function OrderSummary({ 
  items, 
  totalPrice, 
  onRemoveItem, 
  onUpdateQuantity, 
  onPlaceOrder,
  existingOrder 
}: OrderSummaryProps) {
  const [showExistingOrderDialog, setShowExistingOrderDialog] = useState(false);

  const handlePlaceOrder = () => {
    if (existingOrder) {
      setShowExistingOrderDialog(true);
    } else {
      onPlaceOrder();
    }
  };

  const formatOrderStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Pending',
      'placed': 'Placed',
      'preparing': 'Being prepared',
      'served': 'Served',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[status] || status;
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t md:relative md:shadow-none md:border-t-0 z-10">
        <div className="max-w-lg mx-auto">
          <div className="p-4">
            <div className="flex justify-between mb-2">
              <h3 className="font-medium">Your Order</h3>
              <span className="text-neutral-600">{items.length} items</span>
            </div>
            
            <div className="max-h-36 overflow-y-auto mb-4">
              {items.length === 0 ? (
                <div className="py-4 text-center text-neutral-500">
                  Your cart is empty
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between py-1 border-b border-neutral-100 text-sm">
                    <div>
                      <span className="font-medium">{item.quantity} × </span>
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>{formatCurrency(parseFloat(item.price) * item.quantity)}</span>
                      <button 
                        className="text-neutral-400 hover:text-danger"
                        onClick={() => onRemoveItem(item.menuItemId)}
                        aria-label={`Remove ${item.name}`}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="flex justify-between mb-3 font-medium">
              <span>Total</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
            
            <button 
              className="w-full py-3 bg-primary text-white rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handlePlaceOrder}
              disabled={items.length === 0}
            >
              {existingOrder ? 'Update Order' : 'Place Order'}
            </button>
            
            {existingOrder && (
              <div className="mt-3 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
                <div className="font-medium">
                  You have an active order (#{existingOrder.id})
                </div>
                <div className="text-xs mt-1">
                  Status: {formatOrderStatus(existingOrder.status)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog for existing order */}
      <Dialog open={showExistingOrderDialog} onOpenChange={setShowExistingOrderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Active Order Exists</DialogTitle>
            <DialogDescription>
              You already have an active order (#{existingOrder?.id}). 
              Do you want to place a new order or update your existing order?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col space-y-2 mt-2">
            <Button variant="default" onClick={onPlaceOrder}>
              Place New Order
            </Button>
            <Button variant="outline" onClick={() => setShowExistingOrderDialog(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
