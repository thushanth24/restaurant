import { useState } from 'react';
import { formatCurrency, timeAgo } from '@/lib/utils';
import { ReceiptGenerator } from '@/components/ui/pdf-generator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BillCardProps {
  order: any;
  onProcessPayment: (orderId: number, paymentMethod: string) => void;
  isPending: boolean;
}

export default function BillCard({ order, onProcessPayment, isPending }: BillCardProps) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('');

  // Calculate subtotal and tax
  const subtotal = parseFloat(order.totalAmount);
  const taxRate = 0.08; // 8% tax
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  // Format creation time as "X time ago"
  const timeAgoStr = timeAgo(new Date(order.createdAt));

  const handlePayment = () => {
    if (!paymentMethod) {
      return;
    }
    
    onProcessPayment(order.id, paymentMethod);
    setShowPaymentDialog(false);
  };

  return (
    <>
      <div className="bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div className="p-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Table #{order.table.number}</span>
              <span className="text-xs bg-warning text-neutral-800 px-2 py-0.5 rounded-full">
                {isPending ? 'Ready for Payment' : 'Paid'}
              </span>
            </div>
            <span className="text-sm text-neutral-500">Bill #{order.id}</span>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-4 max-h-40 overflow-y-auto">
            {order.orderItems.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm mb-1">
                <span>{item.quantity} × {item.menuItem.name}</span>
                <span>{formatCurrency(parseFloat(item.price) * item.quantity)}</span>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between mb-2 text-sm">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between mb-2 text-sm">
            <span>Tax (8%)</span>
            <span>{formatCurrency(taxAmount)}</span>
          </div>
          <div className="flex justify-between font-medium mb-4 border-t border-neutral-200 pt-2">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          
          {isPending ? (
            <>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button 
                  className="py-2 bg-white border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-100"
                  onClick={() => {
                    setPaymentMethod('card');
                    setShowPaymentDialog(true);
                  }}
                >
                  <i className="fas fa-credit-card mr-1"></i> Card
                </button>
                <button 
                  className="py-2 bg-white border border-neutral-300 text-neutral-700 rounded hover:bg-neutral-100"
                  onClick={() => {
                    setPaymentMethod('cash');
                    setShowPaymentDialog(true);
                  }}
                >
                  <i className="fas fa-money-bill-wave mr-1"></i> Cash
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 bg-accent text-white rounded font-medium hover:bg-accent/90 disabled:opacity-50"
                  onClick={() => setShowPaymentDialog(true)}
                  disabled={!isPending}
                >
                  Mark as Paid
                </button>
                <ReceiptGenerator
                  order={{
                    id: order.id,
                    tableNumber: order.table.number,
                    orderItems: order.orderItems,
                    totalAmount: order.totalAmount,
                    taxAmount: taxAmount.toString(),
                    createdAt: order.createdAt,
                    completedAt: order.completedAt,
                    paymentMethod: order.paymentMethod,
                    specialInstructions: order.specialInstructions
                  }}
                  buttonVariant="icon"
                />
              </div>
            </>
          ) : (
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <div className="font-medium">Payment Method</div>
                <div className="text-neutral-600 capitalize">{order.paymentMethod || 'Unknown'}</div>
              </div>
              <ReceiptGenerator
                order={{
                  id: order.id,
                  tableNumber: order.table.number,
                  orderItems: order.orderItems,
                  totalAmount: order.totalAmount,
                  taxAmount: taxAmount.toString(),
                  createdAt: order.createdAt,
                  completedAt: order.completedAt,
                  paymentMethod: order.paymentMethod,
                  specialInstructions: order.specialInstructions
                }}
                buttonLabel="Receipt"
                buttonVariant="outline"
              />
            </div>
          )}
        </div>
      </div>

      {/* Payment Confirmation Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">
              Confirm payment for Table #{order.table.number}, Bill #{order.id}
            </p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div 
                className={`p-4 border rounded-md text-center cursor-pointer ${
                  paymentMethod === 'card' ? 'border-primary bg-primary/10' : 'border-neutral-200'
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <i className="fas fa-credit-card text-2xl mb-2"></i>
                <div>Card Payment</div>
              </div>
              <div 
                className={`p-4 border rounded-md text-center cursor-pointer ${
                  paymentMethod === 'cash' ? 'border-primary bg-primary/10' : 'border-neutral-200'
                }`}
                onClick={() => setPaymentMethod('cash')}
              >
                <i className="fas fa-money-bill-wave text-2xl mb-2"></i>
                <div>Cash Payment</div>
              </div>
            </div>
            <div className="flex justify-between font-medium text-lg">
              <span>Total Amount:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button 
              disabled={!paymentMethod} 
              onClick={handlePayment}
            >
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
