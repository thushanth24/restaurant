import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function NotificationTester() {
  const [type, setType] = useState<string>('new_order');
  const [message, setMessage] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('admin');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message) return;
    
    setIsSending(true);
    
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type,
          message,
          targetRole
        })
      });
      
      if (response.ok) {
        setMessage('');
        alert('Test notification sent successfully!');
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || 'Failed to send test notification'}`);
      }
    } catch (error) {
      alert(`Error: ${error}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Tester</CardTitle>
        <CardDescription>
          Send test notifications to test the real-time notification system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notification-type">Notification Type</Label>
            <Select
              value={type}
              onValueChange={setType}
            >
              <SelectTrigger id="notification-type">
                <SelectValue placeholder="Select notification type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_order">New Order</SelectItem>
                <SelectItem value="order_status_change">Order Status Change</SelectItem>
                <SelectItem value="payment_completed">Payment Completed</SelectItem>
                <SelectItem value="menu_item_update">Menu Item Update</SelectItem>
                <SelectItem value="table_status_change">Table Status Change</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notification-message">Message</Label>
            <Input
              id="notification-message"
              placeholder="Enter notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target-role">Target Role</Label>
            <Select
              value={targetRole}
              onValueChange={setTargetRole}
            >
              <SelectTrigger id="target-role">
                <SelectValue placeholder="Select target role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="waiter">Waiter</SelectItem>
                <SelectItem value="cashier">Cashier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button type="submit" disabled={isSending || !message}>
            {isSending ? 'Sending...' : 'Send Test Notification'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}