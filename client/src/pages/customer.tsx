import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import CustomerView from '@/components/customer/CustomerView';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CustomerPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [tableId, setTableId] = useState<number | null>(null);
  const [tableNumber, setTableNumber] = useState<number | null>(null);

  // Query to fetch table details
  const {
    data: tableData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/tables/number', id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/tables/number/${id}`);
        
        if (response.status === 404) {
          toast({
            title: 'Table not found',
            description: `We couldn't find a table with the number ${id}`,
            variant: 'destructive',
          });
          return null;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch table data');
        }
        
        return response.json();
      } catch (error) {
        console.error('Error fetching table:', error);
        toast({
          title: 'Error',
          description: 'Failed to load table information',
          variant: 'destructive',
        });
        return null;
      }
    },
    enabled: !!id && !isNaN(parseInt(id)),
  });

  // Update state when table data is loaded
  useEffect(() => {
    if (tableData) {
      setTableId(tableData.id);
      setTableNumber(tableData.number);
      
      // Add document title with table number
      document.title = `Order - Table #${tableData.number}`;
    }
  }, [tableData]);

  // Handle invalid table number
  if (!id || isNaN(parseInt(id))) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Invalid Table</h2>
            <p className="text-neutral-600">
              The table QR code you scanned is invalid. Please ask for assistance from the restaurant staff.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 py-8">
        <div className="container mx-auto px-4">
          <Card className="max-w-lg mx-auto">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-24" />
              </div>
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-64 w-full mb-4" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !tableData) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Table Not Found</h2>
            <p className="text-neutral-600">
              We couldn't find the requested table. Please ask for assistance from the restaurant staff.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render customer view with table information
  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <CustomerView tableId={tableId!} tableNumber={tableNumber!} />
    </div>
  );
}
