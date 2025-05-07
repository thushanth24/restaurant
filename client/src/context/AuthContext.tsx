import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface User {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'waiter' | 'cashier';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const checkAuth = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem('token');
    console.log('Checking auth with token:', token ? 'Token exists' : 'No token');

    if (!token) {
      console.log('No token found, returning unauthenticated');
      setIsLoading(false);
      return false;
    }

    try {
      setIsLoading(true);
      console.log('Fetching user data from /api/auth/debug-me');
      const response = await apiRequest('GET', '/api/auth/debug-me');
      const data = await response.json();
      console.log('Auth check response:', data);

      if (data.user) {
        console.log('User authenticated successfully:', data.user);
        setUser(data.user);
        setIsLoading(false);
        return true;
      } else {
        console.log('Invalid token - no user returned');
        localStorage.removeItem('token');
        setUser(null);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsLoading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkAuth(); // now safe — stable reference
  }, [checkAuth]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await response.json();

      if (data.token && data.user) {
        localStorage.setItem('token', data.token);
        setUser(data.user);

        toast({
          title: 'Login successful',
          description: `Welcome back, ${data.user.name}!`,
        });

        return true;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);

      toast({
        title: 'Login failed',
        description: 'Invalid username or password',
        variant: 'destructive',
      });

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);

    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out',
    });

    navigate('/');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}
