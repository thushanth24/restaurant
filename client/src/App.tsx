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
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      {/* Customer facing page */}
      <Route path="/table/:id" component={CustomerPage} />
      
      {/* Admin/Staff facing pages */}
      <Route path="/waiter" component={WaiterPage} />
      <Route path="/cashier" component={CashierPage} />
      <Route path="/admin" component={AdminPage} />
      
      {/* Main page - redirect to admin page */}
      <Route path="/">
        {() => {
          window.location.href = "/admin";
          return null;
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
