import { Request, Response, NextFunction } from 'express';

// Define user roles
export enum UserRole {
  ADMIN = 'admin',
  WAITER = 'waiter',
  CASHIER = 'cashier'
}

// Middleware to check if user has required role
export const hasRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // If there's no user or role on the request, unauthorized
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    // Check if the user's role is in the allowed roles array
    if (!roles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ 
        message: 'Forbidden: You do not have permission to access this resource' 
      });
    }

    // If the user has the required role, proceed
    next();
  };
};

// Convenience middleware for specific roles
export const isAdmin = hasRole([UserRole.ADMIN]);
export const isWaiter = hasRole([UserRole.WAITER, UserRole.ADMIN]);
export const isCashier = hasRole([UserRole.CASHIER, UserRole.ADMIN]);
export const isWaiterOrCashier = hasRole([UserRole.WAITER, UserRole.CASHIER, UserRole.ADMIN]);
