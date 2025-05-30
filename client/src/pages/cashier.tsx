import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import CashierDashboard from '@/components/cashier/CashierDashboard';
import LoginForm from '@/components/auth/LoginForm';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function CashierPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [attemptedRedirect, setAttemptedRedirect] = useState(false);
  
  // Set document title
  useEffect(() => {
    document.title = 'Cashier Dashboard';
  }, []);

  // Check if admin and redirect once
  useEffect(() => {
    if (!isLoading && isAuthenticated && user && user.role === 'admin' && !attemptedRedirect) {
      setAttemptedRedirect(true);
      console.log('Redirecting admin to admin page');
      navigate('/admin');
    }
  }, [isLoading, isAuthenticated, user, navigate, attemptedRedirect]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-40 rounded-full" />
            </div>
            <Skeleton className="h-12 w-full mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only allow cashiers and admins
  if (isAuthenticated && user && (user.role === 'cashier' || user.role === 'admin')) {
    return <CashierDashboard />;
  }
  
  // Show login form for unauthenticated users or wrong role
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-center mb-6">Cashier Login</h1>
          {isAuthenticated && user ? (
            <div className="text-center mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                You're currently logged in as {user.name} with the role of {user.role}.
                You need to be a cashier to access this page.
              </p>
            </div>
          ) : null}
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
