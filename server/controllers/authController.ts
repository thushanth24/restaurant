import { Request, Response } from 'express';
import { db } from '@db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { compareSync } from 'bcryptjs';
import { generateToken } from '../utils/jwtUtils';
import { LoginRequest } from '@shared/types';

// Login controller
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password }: LoginRequest = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username
    const user = await db.query.users.findFirst({
      where: eq(users.username, username)
    });

    // Check if user exists and password is correct
    if (!user || !compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role
    });

    // Return user info and token
    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user controller
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    // User is already attached to request by the authenticate middleware
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    return res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ message: 'Server error getting current user' });
  }
};

// Logout controller (for session invalidation if needed)
export const logout = async (req: Request, res: Response) => {
  try {
    // JWT tokens are stateless, so actual logout happens on the client by removing the token
    return res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error during logout' });
  }
};
