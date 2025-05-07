import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '@db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AuthUser } from '@shared/types';

// JWT secret should be properly set as an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extended Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('AUTH MIDDLEWARE - Headers:', JSON.stringify(req.headers));
    
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('AUTH MIDDLEWARE - No Authorization header or not Bearer token');
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('AUTH MIDDLEWARE - Token received:', token.substring(0, 10) + '...');
    
    try {
      // Verify token - this will throw if invalid
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
      console.log('AUTH MIDDLEWARE - Token verified, user id:', decoded.id);
      
      // Find user with the decoded ID
      const user = await db.query.users.findFirst({
        where: eq(users.id, decoded.id),
        columns: {
          id: true,
          name: true,
          username: true,
          role: true,
        }
      });
      
      if (!user) {
        console.log('AUTH MIDDLEWARE - User not found for ID:', decoded.id);
        return res.status(401).json({ message: 'Unauthorized: User not found' });
      }
      
      console.log('AUTH MIDDLEWARE - User authenticated:', user.username);
      
      // Add user to request object
      req.user = user;
      
      next();
    } catch (jwtError) {
      console.error('AUTH MIDDLEWARE - JWT verification error:', jwtError);
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  } catch (error) {
    console.error('AUTH MIDDLEWARE - General error:', error);
    return res.status(401).json({ message: 'Unauthorized: Server error' });
  }
};

// Middleware to generate a guest session ID for unauthenticated users
export const createGuestSession = (req: Request, res: Response, next: NextFunction) => {
  // Check if there's a guest session already
  const guestSessionId = req.headers['x-guest-session'] as string;
  
  if (guestSessionId) {
    // Attach the guest session to the request
    req.headers['x-guest-session'] = guestSessionId;
  } else {
    // Generate a new guest session ID (using timestamp + random string)
    const newSessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    req.headers['x-guest-session'] = newSessionId;
    
    // Set the guest session as a cookie for future requests
    res.cookie('guestSession', newSessionId, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    });
  }
  
  next();
};
