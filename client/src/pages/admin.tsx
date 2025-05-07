import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from '@/components/admin/AdminDashboard';
import LoginForm from '@/components/auth/LoginForm';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Set document title
  useEffect(() => {
    document.title = 'Admin Dashboard';
  }, []);

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
            <div className="grid grid-cols-1 gap-4">
              <Skeleton className="h-96 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only allow admins
  if (isAuthenticated && user && user.role === 'admin') {
    return <AdminDashboard />;
  }
  
  // Show login form for unauthenticated users or wrong role
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h1 className="text-2xl font-semibold text-center mb-6">Admin Login</h1>
          {isAuthenticated && user ? (
            <div className="text-center mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                You're currently logged in as {user.name} with the role of {user.role}.
                You need to be an admin to access this page.
              </p>
            </div>
          ) : null}
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
