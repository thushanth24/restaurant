import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

// Login form schema
const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Registration form schema
const registerSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'waiter', 'cashier']),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState('login');
  const [, navigate] = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();

  // Prevent redirect loop with a state variable
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  
  useEffect(() => {
    // Only attempt redirect once
    if (redirectAttempted) return;
    
    console.log('Auth page - Auth state:', { isAuthenticated, isLoading });
    
    if (!isLoading) {
      setRedirectAttempted(true);
      
      if (isAuthenticated) {
        console.log('Auth page - Redirecting authenticated user to admin dashboard');
        // Use setTimeout to ensure this happens after render
        setTimeout(() => {
          navigate('/admin');
        }, 10);
      }
    }
  }, [isAuthenticated, isLoading, navigate, redirectAttempted]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: 'waiter',
    },
  });

  const onLoginSubmit = async (values: LoginFormValues) => {
    const success = await login(values.username, values.password);
    
    if (success) {
      // Use direct window location navigation to admin page for a clean state
      setTimeout(() => {
        window.location.href = '/admin';
      }, 500); // Short delay to ensure state is updated
    }
  };

  const onRegisterSubmit = async (values: RegisterFormValues) => {
    // This will be implemented later
    console.log('Register values:', values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 gap-0">
      {/* Authentication Form */}
      <div className="flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">QR Restaurant</CardTitle>
            <CardDescription>
              Sign in to access the restaurant management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={loginForm.formState.isSubmitting}
                    >
                      {loginForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Create a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Create a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="waiter">Waiter</option>
                            <option value="cashier">Cashier</option>
                            <option value="admin">Admin</option>
                          </select>
                          <FormDescription>
                            Select your role in the restaurant
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={registerForm.formState.isSubmitting}
                    >
                      {registerForm.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            {activeTab === 'login' ? (
              <p>Don't have an account? <Button variant="link" className="p-0" onClick={() => setActiveTab('register')}>Register</Button></p>
            ) : (
              <p>Already have an account? <Button variant="link" className="p-0" onClick={() => setActiveTab('login')}>Login</Button></p>
            )}
          </CardFooter>
        </Card>
      </div>
      
      {/* Hero section */}
      <div className="hidden md:flex flex-col items-center justify-center bg-primary text-primary-foreground p-8">
        <div className="max-w-md space-y-6">
          <h1 className="text-3xl font-bold">QR Restaurant Management System</h1>
          <p className="text-lg">
            A comprehensive solution for managing your restaurant operations - from orders to payments, all in one place.
          </p>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 bg-primary-foreground text-primary h-6 w-6 rounded-full flex items-center justify-center">✓</div>
              <div>
                <h3 className="font-medium">Streamlined Ordering</h3>
                <p className="text-sm opacity-90">Customers scan QR codes to place orders directly from their table</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 bg-primary-foreground text-primary h-6 w-6 rounded-full flex items-center justify-center">✓</div>
              <div>
                <h3 className="font-medium">Real-time Updates</h3>
                <p className="text-sm opacity-90">Instant notifications keep staff updated on new orders and status changes</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5 bg-primary-foreground text-primary h-6 w-6 rounded-full flex items-center justify-center">✓</div>
              <div>
                <h3 className="font-medium">Comprehensive Dashboard</h3>
                <p className="text-sm opacity-90">Monitor sales, manage inventory, and analyze performance in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}