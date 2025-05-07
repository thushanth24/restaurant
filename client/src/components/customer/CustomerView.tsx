import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import MenuCategory from './MenuCategory';
import MenuItem from './MenuItem';
import OrderSummary from './OrderSummary';
import { Category, MenuItem as MenuItemType } from '@shared/schema';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CustomerViewProps {
  tableId: number;
  tableNumber: number;
}

export default function CustomerView({ tableId, tableNumber }: CustomerViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cartItems, setCartItems] = useState<{
    menuItemId: number;
    name: string;
    price: string;
    quantity: number;
  }[]>([]);
  const [language, setLanguage] = useState<string>('English');
  const { toast } = useToast();

  // Fetch menu categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError
  } = useQuery({
    queryKey: ['/api/categories'],
  });

  // Fetch menu items - this will refetch when selectedCategory changes
  const {
    data: menuItems,
    isLoading: menuItemsLoading,
    error: menuItemsError
  } = useQuery({
    queryKey: ['/api/menu-items', selectedCategory === 'all' ? null : selectedCategory],
    queryFn: async ({ queryKey }) => {
      const categoryParam = queryKey[1] ? `?categoryId=${queryKey[1]}` : '';
      const res = await fetch(`/api/menu-items${categoryParam}`);
      if (!res.ok) throw new Error('Failed to fetch menu items');
      return res.json();
    },
  });

  // Check for active order on this table
  const {
    data: activeOrder,
    isLoading: orderLoading,
    refetch: refetchActiveOrder
  } = useQuery({
    queryKey: ['/api/tables', tableId, 'active-order'],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/tables/${tableId}/active-order`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error('Failed to fetch active order');
        return res.json();
      } catch (error) {
        console.error('Error fetching active order:', error);
        return null;
      }
    },
  });

  // Load cart from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_table_${tableId}`);
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        localStorage.removeItem(`cart_table_${tableId}`);
      }
    }
  }, [tableId]);

  // Save cart to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem(`cart_table_${tableId}`, JSON.stringify(cartItems));
  }, [cartItems, tableId]);

  // Add item to cart
  const addToCart = (item: MenuItemType) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(i => i.menuItemId === item.id);
      
      if (existingItem) {
        return prevItems.map(i => 
          i.menuItemId === item.id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i
        );
      } else {
        return [...prevItems, {
          menuItemId: item.id,
          name: item.name,
          price: item.price.toString(),
          quantity: 1
        }];
      }
    });

    toast({
      title: 'Item added',
      description: `${item.name} added to your order`,
    });
  };

  // Remove item from cart
  const removeFromCart = (menuItemId: number) => {
    setCartItems(prevItems => prevItems.filter(item => item.menuItemId !== menuItemId));
  };

  // Update item quantity
  const updateItemQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(menuItemId);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  // Place order
  const placeOrder = async () => {
    if (cartItems.length === 0) {
      toast({
        title: 'Cannot place order',
        description: 'Your cart is empty',
        variant: 'destructive',
      });
      return;
    }

    try {
      const guestSessionId = localStorage.getItem('guestSessionId') || 
        `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      if (!localStorage.getItem('guestSessionId')) {
        localStorage.setItem('guestSessionId', guestSessionId);
      }

      const orderItems = cartItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId,
          items: orderItems,
          guestSessionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to place order');
      }

      const orderData = await response.json();

      toast({
        title: 'Order placed successfully',
        description: `Your order #${orderData.id} has been sent to the kitchen`,
      });

      // Clear cart
      setCartItems([]);
      localStorage.removeItem(`cart_table_${tableId}`);

      // Refresh active order
      refetchActiveOrder();
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: 'Failed to place order',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
  };

  // Calculate total price
  const totalPrice = cartItems.reduce(
    (total, item) => total + parseFloat(item.price) * item.quantity, 
    0
  );

  if (categoriesLoading || menuItemsLoading) {
    return (
      <div className="container mx-auto px-4">
        <Card className="max-w-lg mx-auto bg-white rounded-lg shadow-md mb-6">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-32" />
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="flex overflow-x-auto pb-2 gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-10 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="p-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 w-full mb-4 rounded-lg" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (categoriesError || menuItemsError) {
    return (
      <div className="container mx-auto px-4">
        <Card className="max-w-lg mx-auto bg-white rounded-lg shadow-md mb-6 p-6">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error loading menu</h2>
          <p className="text-neutral-600">
            We're experiencing technical difficulties. Please try again later or ask for assistance.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <Card className="max-w-lg mx-auto bg-white rounded-lg shadow-md mb-6">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-secondary">Table #{tableNumber}</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <select
                  className="form-select text-sm rounded border-neutral-300 focus:ring-primary focus:border-primary"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option>English</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <button className="text-primary hover:text-secondary" aria-label="Help">
                  <i className="fas fa-question-circle"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Categories */}
        <div className="p-4 border-b">
          <div className="flex overflow-x-auto pb-2 gap-2">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-full ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
              }`}
              onClick={() => setSelectedCategory('all')}
            >
              All
            </button>
            
            {categories?.map((category: Category) => (
              <MenuCategory
                key={category.id}
                id={category.id}
                name={category.name}
                isSelected={selectedCategory === category.id.toString()}
                onClick={() => setSelectedCategory(category.id.toString())}
              />
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4">
          <div className="mb-4">
            <div className="flex justify-between mb-2">
              <h3 className="font-medium text-neutral-700">
                {selectedCategory === 'all' ? 'All Items' : categories?.find((c: Category) => c.id.toString() === selectedCategory)?.name || 'Menu Items'}
              </h3>
              {selectedCategory !== 'all' && (
                <button 
                  className="text-sm text-primary"
                  onClick={() => setSelectedCategory('all')}
                >
                  View All
                </button>
              )}
            </div>
            
            {menuItems?.length === 0 ? (
              <div className="p-4 text-center text-neutral-500">
                No menu items available in this category
              </div>
            ) : (
              menuItems?.map((item: MenuItemType) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  onAddToCart={() => addToCart(item)}
                />
              ))
            )}
          </div>
        </div>

        {/* Order Summary */}
        <OrderSummary
          items={cartItems}
          totalPrice={totalPrice}
          onRemoveItem={removeFromCart}
          onUpdateQuantity={updateItemQuantity}
          onPlaceOrder={placeOrder}
          existingOrder={activeOrder}
        />
      </Card>
    </div>
  );
}
