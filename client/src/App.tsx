import { Route, Switch } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { WebSocketProvider } from "@/context/WebSocketContext";
import NotFound from "@/pages/not-found";
import CustomerPage from "@/pages/customer";
import WaiterPage from "@/pages/waiter";
import CashierPage from "@/pages/cashier";
import AdminPage from "@/pages/admin";
import AuthPage from "@/pages/auth-page";
import { useEffect } from "react";
import { ProtectedRoute, RoleBasedRedirect } from "@/lib/protected-route";

// Component to handle loading state
function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
    </div>
  );
}

// Main router component
function Router() {
  return (
    <Switch>
      {/* Home redirects based on auth status and role */}
      <Route path="/" component={RoleBasedRedirect} />
      
      {/* Auth page */}
      <Route path="/auth" component={AuthPage} />
      
      {/* Customer facing page */}
      <Route path="/table/:id" component={CustomerPage} />
      
      {/* Admin/Staff facing pages with role protection */}
      <ProtectedRoute 
        path="/admin" 
        component={AdminPage} 
        allowedRoles={['admin']} 
      />
      <ProtectedRoute 
        path="/waiter" 
        component={WaiterPage}
        allowedRoles={['waiter', 'admin']}
      />
      <ProtectedRoute 
        path="/cashier" 
        component={CashierPage}
        allowedRoles={['cashier', 'admin']}
      />

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
          <NotificationProvider>
            <Router />
            <Toaster />
          </NotificationProvider>
        </WebSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
