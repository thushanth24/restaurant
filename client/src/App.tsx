import { Route, Switch, useLocation } from "wouter";
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
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

// Component to handle loading state
function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}

// Component to handle redirection based on auth state
function HomeRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [redirected, setRedirected] = useState(false);
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Only perform the redirect once
    if (redirected) return;
    
    if (!isLoading) {
      setRedirected(true);
      
      if (isAuthenticated && user) {
        console.log('HomeRedirect: User authenticated, redirecting to admin dashboard');
        setLocation('/admin');
      } else {
        console.log('HomeRedirect: User not authenticated, redirecting to auth page');
        setLocation('/auth');
      }
    }
  }, [isAuthenticated, isLoading, redirected, setLocation, user]);
  
  return <LoadingPage />;
}

// Main router component
function Router() {
  return (
    <Switch>
      {/* Home redirects based on auth status */}
      <Route path="/" component={HomeRedirect} />
      
      {/* Auth page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Customer facing page */}
      <Route path="/table/:id" component={CustomerPage} />
      
      {/* Admin/Staff facing pages */}
      <Route path="/waiter" component={WaiterPage} />
      <Route path="/cashier" component={CashierPage} />
      <Route path="/admin" component={AdminPage} />

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
