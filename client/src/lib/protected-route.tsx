import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { Route, Redirect, useLocation } from "wouter";
import { useEffect } from "react";

type UserRole = 'admin' | 'waiter' | 'cashier';

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({
  path,
  component: Component,
  allowedRoles = []
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  return (
    <Route path={path}>
      {() => {
        // If authentication is still loading, show spinner
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-border" />
            </div>
          );
        }
        
        // If not authenticated, redirect to login
        if (!user) {
          return <Redirect to="/auth" />;
        }
        
        // If roles specified and user doesn't have permission
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as UserRole)) {
          // Redirect to appropriate role-based dashboard
          if (user.role === 'admin') {
            return <Redirect to="/admin" />;
          } else if (user.role === 'waiter') {
            return <Redirect to="/waiter" />;
          } else if (user.role === 'cashier') {
            return <Redirect to="/cashier" />;
          } else {
            // Fallback for unknown roles
            return <Redirect to="/" />;
          }
        }
        
        // User is authenticated and has permission
        return <Component />;
      }}
    </Route>
  );
}

export function RoleBasedRedirect() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (isLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }
    
    // Redirect to appropriate dashboard based on role
    switch(user.role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'waiter':
        navigate('/waiter');
        break;
      case 'cashier':
        navigate('/cashier');
        break;
      default:
        navigate('/auth');
    }
  }, [user, isLoading, navigate]);
  
  // Show loading spinner while determining where to redirect
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-border" />
    </div>
  );
}