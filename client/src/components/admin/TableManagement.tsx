import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { QRCodeDisplay } from '@/components/ui/QRCodeDisplay';
import { QRCodeGenerator } from '@/components/ui/qr-code';
import { Plus, Edit, Trash2, RefreshCw, Eye } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Table } from '@shared/schema';

// Form validation schema
const tableSchema = z.object({
  number: z.coerce.number().positive("Table number must be positive"),
  seats: z.coerce.number().positive("Number of seats must be positive"),
  status: z.enum(["available", "occupied", "reserved"]).default("available")
});

type TableFormValues = z.infer<typeof tableSchema>;

export default function TableManagement() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPreviewQRDialogOpen, setIsPreviewQRDialogOpen] = useState(false);
  const [currentTable, setCurrentTable] = useState<Table | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: {
      number: 0,
      seats: 4,
      status: "available"
    }
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isAddDialogOpen && !isEditDialogOpen) {
      form.reset();
    }
  }, [isAddDialogOpen, isEditDialogOpen, form]);

  // Load existing table data when editing
  useEffect(() => {
    if (currentTable && isEditDialogOpen) {
      form.reset({
        number: currentTable.number,
        seats: currentTable.seats,
        status: currentTable.status as "available" | "occupied" | "reserved"
      });
    }
  }, [currentTable, isEditDialogOpen, form]);

  // Fetch tables
  const { 
    data: tables = [] as Table[],
    isLoading,
    error,
    refetch
  } = useQuery<Table[]>({
    queryKey: ['/api/tables'],
    retry: false,
    staleTime: 30000,
  });

  // Create table mutation
  const createTable = useMutation({
    mutationFn: async (data: TableFormValues) => {
      const response = await apiRequest('POST', '/api/tables', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      toast({
        title: 'Table created',
        description: 'The table has been created successfully',
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to create table',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  // Update table mutation
  const updateTable = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TableFormValues }) => {
      const response = await apiRequest('PUT', `/api/tables/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      toast({
        title: 'Table updated',
        description: 'The table has been updated successfully',
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to update table',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  // Delete table mutation
  const deleteTable = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/tables/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      toast({
        title: 'Table deleted',
        description: 'The table has been deleted successfully',
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete table',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  // Regenerate QR code mutation
  const regenerateQR = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/tables/${id}/regenerate-qr`);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tables'] });
      toast({
        title: 'QR Code regenerated',
        description: `QR code for Table #${data.number} has been regenerated`,
      });
      // Update the current table with the new QR code
      setCurrentTable(data);
    },
    onError: (error) => {
      toast({
        title: 'Failed to regenerate QR code',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission for creating/editing tables
  const onSubmit = (values: TableFormValues) => {
    if (isEditDialogOpen && currentTable) {
      updateTable.mutate({ id: currentTable.id, data: values });
    } else {
      createTable.mutate(values);
    }
  };

  // Open edit dialog with table data
  const handleEdit = (table: Table) => {
    setCurrentTable(table);
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDelete = (table: Table) => {
    setCurrentTable(table);
    setIsDeleteDialogOpen(true);
  };

  // Open QR code preview dialog
  const handlePreviewQR = (table: Table) => {
    setCurrentTable(table);
    setIsPreviewQRDialogOpen(true);
  };

  // Handle QR code regeneration
  const handleRegenerateQR = (id: number) => {
    regenerateQR.mutate(id);
  };

  // Get status badge class
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { class: string }> = {
      available: { class: 'bg-green-100 text-green-800' },
      occupied: { class: 'bg-red-100 text-red-800' },
      reserved: { class: 'bg-blue-100 text-blue-800' },
    };

    return statusMap[status] || { class: 'bg-neutral-100 text-neutral-800' };
  };

  // Generate QR code URL for a table
  const getTableQRUrl = (table: Table) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/table/${table.number}`;
  };

  return (
    <div className="table-management">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-medium">Tables & QR Codes</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Table
        </Button>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="bg-neutral-100 animate-pulse h-48 rounded-lg"></div>
          ))
        ) : error ? (
          <div className="col-span-full text-center py-4 text-red-500">
            Error loading tables. Please try again.
          </div>
        ) : tables.length === 0 ? (
          <div className="col-span-full text-center py-10 text-neutral-500">
            No tables found. Add a table to get started.
          </div>
        ) : (
          tables.map((table: Table) => (
            <div 
              key={table.id} 
              className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Table #{table.number}</h3>
                  <p className="text-neutral-600">Seats: {table.seats}</p>
                  <span className={`mt-2 inline-block px-2 py-1 rounded-full text-xs ${getStatusBadge(table.status).class}`}>
                    {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleEdit(table)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => handlePreviewQR(table)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between mt-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleRegenerateQR(table.id)}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate QR
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDelete(table)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Table Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Table</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Number</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Enter table number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="seats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Seats</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Enter number of seats" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Add Table</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Table Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Number</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Enter table number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="seats"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Seats</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Enter number of seats" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Update Table</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete Table #{currentTable?.number}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => currentTable && deleteTable.mutate(currentTable.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Preview Dialog */}
      <Dialog open={isPreviewQRDialogOpen} onOpenChange={setIsPreviewQRDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code for Table #{currentTable?.number}</DialogTitle>
            <DialogDescription>
              Scan this QR code with a mobile device to access the table's order page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-4">
            {currentTable && (
              <QRCodeGenerator
                data={getTableQRUrl(currentTable)}
                size={200}
                title={`Table #${currentTable.number} QR Code`}
                showDownload={true}
              />
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => currentTable && handleRegenerateQR(currentTable.id)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
            <Button onClick={() => setIsPreviewQRDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
