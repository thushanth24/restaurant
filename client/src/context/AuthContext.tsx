import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const authCheckPerformed = useRef(false);
  
  // Check auth only once on initial mount
  useEffect(() => {
    // Prevent multiple auth checks
    if (authCheckPerformed.current) return;
    
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('AuthProvider: No token found');
        setIsLoading(false);
        authCheckPerformed.current = true;
        return;
      }
      
      try {
        console.log('AuthProvider: Checking authentication status...');
        const response = await apiRequest('GET', '/api/auth/debug-me');
        const data = await response.json();
        
        if (data.user) {
          console.log('AuthProvider: Authentication successful');
          setUser(data.user);
        } else {
          console.log('AuthProvider: Invalid auth data returned');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('AuthProvider: Authentication check error', error);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false);
        authCheckPerformed.current = true;
      }
    };
    
    checkAuth();
  }, []);
  
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
    
    // Use window.location instead of wouter navigation to ensure a clean state
    window.location.href = '/auth';
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout
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
