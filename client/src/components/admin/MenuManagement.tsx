import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';
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
  FormDescription,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MenuItem, Category } from '@shared/schema';

// Form validation schema
const menuItemSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.coerce.number().positive("Price must be a positive number"),
  image: z.string().optional(),
  categoryId: z.coerce.number().positive("Category is required"),
  isAvailable: z.boolean().default(true),
  allergies: z.array(z.string()).default([]),
  dietaryInfo: z.array(z.string()).default([])
});

type MenuItemFormValues = z.infer<typeof menuItemSchema>;

export default function MenuManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup
  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      image: '',
      categoryId: 0,
      isAvailable: true,
      allergies: [],
      dietaryInfo: []
    }
  });

  // Reset form when dialog closes
  useEffect(() => {
    if (!isAddDialogOpen && !isEditDialogOpen) {
      form.reset();
    }
  }, [isAddDialogOpen, isEditDialogOpen, form]);

  // Load existing menu item data when editing
  useEffect(() => {
    if (currentMenuItem && isEditDialogOpen) {
      const allergies = typeof currentMenuItem.allergies === 'string' 
        ? JSON.parse(currentMenuItem.allergies as string) 
        : currentMenuItem.allergies || [];
        
      const dietaryInfo = typeof currentMenuItem.dietaryInfo === 'string'
        ? JSON.parse(currentMenuItem.dietaryInfo as string)
        : currentMenuItem.dietaryInfo || [];

      form.reset({
        name: currentMenuItem.name,
        description: currentMenuItem.description || '',
        price: parseFloat(currentMenuItem.price.toString()),
        image: currentMenuItem.image || '',
        categoryId: currentMenuItem.categoryId,
        isAvailable: currentMenuItem.isAvailable,
        allergies,
        dietaryInfo
      });
    }
  }, [currentMenuItem, isEditDialogOpen, form]);

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/categories');
      return response.json();
    }
  });

  // Fetch menu items
  const { 
    data: menuItems = [],
    isLoading,
    error,
    refetch
  } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu-items', searchTerm, selectedCategory],
    queryFn: async ({ queryKey }) => {
      let url = '/api/menu-items';
      const search = queryKey[1] as string;
      const category = queryKey[2] as string;
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category && category !== 'all') params.append('categoryId', category);
      
      const queryString = params.toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      
      const response = await apiRequest('GET', fullUrl);
      return response.json();
    },
  });

  // Create menu item mutation
  const createMenuItem = useMutation({
    mutationFn: async (data: MenuItemFormValues) => {
      const response = await apiRequest('POST', '/api/menu-items', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      toast({
        title: 'Menu item created',
        description: 'The menu item has been created successfully',
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to create menu item',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  // Update menu item mutation
  const updateMenuItem = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: MenuItemFormValues }) => {
      const response = await apiRequest('PUT', `/api/menu-items/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      toast({
        title: 'Menu item updated',
        description: 'The menu item has been updated successfully',
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to update menu item',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  // Delete menu item mutation
  const deleteMenuItem = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/menu-items/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu-items'] });
      toast({
        title: 'Menu item deleted',
        description: 'The menu item has been deleted successfully',
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete menu item',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission for creating/editing menu items
  const onSubmit = (values: MenuItemFormValues) => {
    if (isEditDialogOpen && currentMenuItem) {
      updateMenuItem.mutate({ id: currentMenuItem.id, data: values });
    } else {
      createMenuItem.mutate(values);
    }
  };

  // Open edit dialog with menu item data
  const handleEdit = (item: MenuItem) => {
    setCurrentMenuItem(item);
    setIsEditDialogOpen(true);
  };

  // Open delete confirmation dialog
  const handleDelete = (item: MenuItem) => {
    setCurrentMenuItem(item);
    setIsDeleteDialogOpen(true);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = menuItems ? menuItems.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = menuItems ? Math.ceil(menuItems.length / itemsPerPage) : 0;

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="menu-management">
      <div className="flex justify-between mb-4">
        <h2 className="text-xl font-medium">Menu Items</h2>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Menu Category Filter */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category: Category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="relative flex-1">
            <Input
              placeholder="Search menu items..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          </div>
        </div>
      </div>

      {/* Menu Items Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-4">Loading menu items...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-red-500">
                  Error loading menu items. Please try again.
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4">No menu items found</td>
              </tr>
            ) : (
              currentItems.map((item: any) => (
                <tr key={item.id} className="hover:bg-neutral-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {item.image && (
                        <div className="w-10 h-10 rounded overflow-hidden">
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                      )}
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-neutral-600">
                    {item.category?.name || 'Uncategorized'}
                  </td>
                  <td className="py-3 px-4 text-neutral-600">
                    ${parseFloat(item.price).toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.isAvailable ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button 
                        className="p-1 text-neutral-500 hover:text-secondary"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        className="p-1 text-neutral-500 hover:text-danger"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-neutral-500">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, menuItems.length)} of {menuItems.length} entries
          </div>
          <div className="pagination">
            <button 
              className={`pagination-item ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`pagination-item ${currentPage === i + 1 ? 'active' : ''}`}
                onClick={() => paginate(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            
            <button 
              className={`pagination-item ${currentPage === totalPages ? 'disabled' : ''}`}
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Menu Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Menu Item</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter item description" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          min="0" 
                          step="0.01" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category: Category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter image URL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a URL for the item image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Available</FormLabel>
                      <FormDescription>
                        Item is in stock and available for ordering
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Save Menu Item</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Menu Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Menu Item</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter item description" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          min="0" 
                          step="0.01" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString() || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((category: Category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter image URL" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter a URL for the item image
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Available</FormLabel>
                      <FormDescription>
                        Item is in stock and available for ordering
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Update Menu Item</Button>
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
              Are you sure you want to delete the menu item "{currentMenuItem?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => currentMenuItem && deleteMenuItem.mutate(currentMenuItem.id)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
