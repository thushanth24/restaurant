import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import NotFound from "@/pages/not-found";
import CustomerPage from "@/pages/customer";
import WaiterPage from "@/pages/waiter";
import CashierPage from "@/pages/cashier";
import AdminPage from "@/pages/admin";
import AuthPage from "@/pages/auth-page";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

function Router() {
  return (
    <Switch>
      {/* Customer facing page */}
      <Route path="/table/:id" component={CustomerPage} />
      
      {/* Admin/Staff facing pages */}
      <Route path="/waiter" component={WaiterPage} />
      <Route path="/cashier" component={CashierPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Main page - redirect to admin page */}
      <Route path="/">
        {() => {
          const { isAuthenticated, isLoading } = useAuth();
          
          useEffect(() => {
            if (!isLoading) {
              if (isAuthenticated) {
                // Redirect to appropriate dashboard based on user role
                window.location.replace('/admin');
              } else {
                // Redirect to login page (will need to create this)
                window.location.replace('/auth');
              }
            }
          }, [isAuthenticated, isLoading]);
          
          return (
            <div className="flex items-center justify-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          );
        }}
      </Route>

      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Add meta description for SEO
  useEffect(() => {
    document.title = "QR Restaurant - Order & Pay";
    
    const metaDescription = document.createElement('meta');
    metaDescription.name = 'description';
    metaDescription.content = 'QR code-based restaurant ordering system. Scan, order, and pay without waiting for service.';
    document.head.appendChild(metaDescription);
    
    return () => {
      document.head.removeChild(metaDescription);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WebSocketProvider>
          <Router />
          <Toaster />
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
