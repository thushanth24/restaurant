import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Add font to ensure PDF works
import { jsPDF as JsPDFType } from 'jspdf';

// Extend jsPDF with autotable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

interface OrderItem {
  menuItem: {
    name: string;
    price: string;
  };
  quantity: number;
  price: string;
}

interface OrderDetails {
  id: number;
  tableNumber: number;
  orderItems: OrderItem[];
  totalAmount: string;
  taxAmount?: string;
  createdAt: string;
  completedAt?: string;
  paymentMethod?: string;
  specialInstructions?: string;
}

interface ReceiptGeneratorProps {
  order: OrderDetails;
  restaurantName?: string;
  restaurantAddress?: string;
  restaurantPhone?: string;
  taxPercentage?: number;
  buttonLabel?: string;
  buttonVariant?: 'primary' | 'outline' | 'icon';
  className?: string;
}

export function ReceiptGenerator({
  order,
  restaurantName = 'QR Restaurant',
  restaurantAddress = '123 Main Street, Anytown, USA',
  restaurantPhone = '(555) 123-4567',
  taxPercentage = 8,
  buttonLabel = 'Generate Receipt',
  buttonVariant = 'outline',
  className = '',
}: ReceiptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReceipt = async () => {
    try {
      setIsGenerating(true);
      
      // Create a simple HTML receipt instead of using jsPDF
      // This approach is more reliable across browsers
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        throw new Error('Could not open print window. Please check your popup settings.');
      }
      
      // Calculate tax if not provided
      const subtotal = parseFloat(order.totalAmount);
      const taxAmount = order.taxAmount 
        ? parseFloat(order.taxAmount) 
        : subtotal * (taxPercentage / 100);
      const total = subtotal + taxAmount;
      
      // Format dates
      const orderDate = new Date(order.createdAt).toLocaleString();
      const completionDate = order.completedAt 
        ? new Date(order.completedAt).toLocaleString() 
        : 'N/A';
        
      // Create HTML content for receipt
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt - Order #${order.id}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              max-width: 400px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .restaurant-name {
              font-size: 22px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .restaurant-details {
              font-size: 12px;
              margin-bottom: 3px;
            }
            .receipt-title {
              font-size: 16px;
              font-weight: bold;
              text-align: center;
              margin: 15px 0;
              border-bottom: 1px solid #ccc;
              padding-bottom: 5px;
            }
            .order-info {
              margin-bottom: 15px;
              font-size: 12px;
            }
            .order-info div {
              margin-bottom: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              background-color: #f0f0f0;
              text-align: left;
              padding: 8px;
              font-size: 12px;
              border-bottom: 1px solid #ddd;
            }
            td {
              padding: 8px;
              font-size: 12px;
              border-bottom: 1px solid #eee;
            }
            .totals {
              margin-top: 15px;
              text-align: right;
              font-size: 12px;
            }
            .total-row {
              margin-top: 5px;
            }
            .grand-total {
              font-weight: bold;
              font-size: 14px;
              margin-top: 10px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 14px;
              font-style: italic;
            }
            .special-instructions {
              margin-top: 15px;
              font-size: 12px;
              font-style: italic;
            }
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="restaurant-name">${restaurantName}</div>
            <div class="restaurant-details">${restaurantAddress}</div>
            <div class="restaurant-details">${restaurantPhone}</div>
          </div>
          
          <div class="receipt-title">RECEIPT</div>
          
          <div class="order-info">
            <div><strong>Order #:</strong> ${order.id}</div>
            <div><strong>Table:</strong> ${order.tableNumber}</div>
            <div><strong>Date:</strong> ${orderDate}</div>
            <div><strong>Payment:</strong> ${order.paymentMethod || 'N/A'}</div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.orderItems.map(item => `
                <tr>
                  <td>${item.menuItem.name}</td>
                  <td>${item.quantity}</td>
                  <td>${formatCurrency(item.menuItem.price)}</td>
                  <td>${formatCurrency(parseFloat(item.menuItem.price) * item.quantity)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="total-row"><strong>Subtotal:</strong> ${formatCurrency(subtotal)}</div>
            <div class="total-row"><strong>Tax (${taxPercentage}%):</strong> ${formatCurrency(taxAmount)}</div>
            <div class="grand-total"><strong>TOTAL:</strong> ${formatCurrency(total)}</div>
          </div>
          
          ${order.specialInstructions ? `
            <div class="special-instructions">
              <strong>Special Instructions:</strong><br>
              ${order.specialInstructions}
            </div>
          ` : ''}
          
          <div class="footer">
            Thank you for dining with us!
          </div>
          
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #4a90e2; color: white; border: none; border-radius: 4px; cursor: pointer;">
              Print Receipt
            </button>
            <button onclick="window.close()" style="padding: 10px 20px; margin-left: 10px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">
              Close
            </button>
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
    } catch (error) {
      console.error('Error generating receipt:', error);
      alert('Failed to generate receipt. Please try again or contact support.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (buttonVariant === 'icon') {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={generateReceipt}
        disabled={isGenerating}
        className={className}
        title="Generate PDF receipt"
      >
        <FileText className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button
      variant={buttonVariant === 'primary' ? 'default' : 'outline'}
      size="sm"
      onClick={generateReceipt}
      disabled={isGenerating}
      className={className}
    >
      <FileText className="h-4 w-4 mr-1" />
      {isGenerating ? 'Generating...' : buttonLabel}
    </Button>
  );
}
