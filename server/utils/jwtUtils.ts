import jwt from 'jsonwebtoken';
import { AuthUser } from '@shared/types';

// JWT secret should be properly set as an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export const generateToken = (user: AuthUser): string => {
  // Create JWT payload
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  // Sign and return the token
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): AuthUser | null => {
  try {
    // Verify the token and return the decoded user
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};
