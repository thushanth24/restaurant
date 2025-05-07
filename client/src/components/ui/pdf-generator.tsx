import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

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
      
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a5',
      });
      
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
      
      // Add restaurant info
      doc.setFontSize(18);
      doc.text(restaurantName, 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(restaurantAddress, 105, 22, { align: 'center' });
      doc.text(restaurantPhone, 105, 27, { align: 'center' });
      
      // Add order info
      doc.setFontSize(12);
      doc.text('RECEIPT', 105, 35, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Order #: ${order.id}`, 15, 45);
      doc.text(`Table: ${order.tableNumber}`, 15, 50);
      doc.text(`Date: ${orderDate}`, 15, 55);
      doc.text(`Payment: ${order.paymentMethod || 'N/A'}`, 15, 60);
      
      // Add items table
      const tableColumn = ['Item', 'Qty', 'Price', 'Total'];
      const tableRows = order.orderItems.map(item => [
        item.menuItem.name,
        item.quantity,
        formatCurrency(item.menuItem.price),
        formatCurrency(parseFloat(item.menuItem.price) * item.quantity)
      ]);
      
      (doc as any).autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 70,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [255, 107, 53] },
        margin: { top: 70, right: 15, bottom: 20, left: 15 },
      });
      
      // Add totals
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.text('Subtotal:', 105, finalY, { align: 'right' });
      doc.text(formatCurrency(subtotal), 130, finalY, { align: 'right' });
      
      doc.text(`Tax (${taxPercentage}%):`, 105, finalY + 5, { align: 'right' });
      doc.text(formatCurrency(taxAmount), 130, finalY + 5, { align: 'right' });
      
      doc.setFont(undefined, 'bold');
      doc.text('TOTAL:', 105, finalY + 12, { align: 'right' });
      doc.text(formatCurrency(total), 130, finalY + 12, { align: 'right' });
      doc.setFont(undefined, 'normal');
      
      // Add special instructions if any
      if (order.specialInstructions) {
        doc.text('Special Instructions:', 15, finalY + 20);
        doc.text(order.specialInstructions, 15, finalY + 25);
      }
      
      // Add thank you message
      doc.setFontSize(11);
      doc.text('Thank you for dining with us!', 105, finalY + 35, { align: 'center' });
      
      // Save PDF
      doc.save(`receipt-order-${order.id}.pdf`);
    } catch (error) {
      console.error('Error generating receipt:', error);
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
