import { Request, Response } from 'express';
import { db } from '@db';
import { users } from '@shared/schema';
import { eq, and, or } from 'drizzle-orm';
import { hashSync } from 'bcryptjs';
import { UserRole } from '../middleware/roleMiddleware';

// Get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const allUsers = await db.query.users.findMany({
      columns: {
        password: false,
      },
      orderBy: (users, { asc }) => [asc(users.name)],
    });
    
    return res.status(200).json(allUsers);
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({ message: 'Server error fetching users' });
  }
};

// Get user by ID (admin only)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id)),
      columns: {
        password: false,
      }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({ message: 'Server error fetching user' });
  }
};

// Create a new user (admin only)
export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, password, name, email, role } = req.body;
    
    // Validate required fields
    if (!username || !password || !name || !email || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    
    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({ 
        message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}` 
      });
    }
    
    // Check if username or email already exists
    const existingUser = await db.query.users.findFirst({
      where: or(
        eq(users.username, username),
        eq(users.email, email)
      ),
    });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    
    // Hash the password
    const hashedPassword = hashSync(password, 10);
    
    // Create new user
    const [newUser] = await db.insert(users).values({
      username,
      password: hashedPassword,
      name,
      email,
      role,
    }).returning({
      id: users.id,
      username: users.username,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });
    
    return res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Server error creating user' });
  }
};

// Update a user (admin only)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { username, password, name, email, role } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id)),
    });
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if updating to an existing username or email
    if (username || email) {
      const duplicateUser = await db.query.users.findFirst({
        where: and(
          or(
            username ? eq(users.username, username) : undefined,
            email ? eq(users.email, email) : undefined
          ),
          !eq(users.id, parseInt(id))
        ),
      });
      
      if (duplicateUser) {
        return res.status(400).json({ message: 'Username or email already exists' });
      }
    }
    
    // Validate role if provided
    if (role && !Object.values(UserRole).includes(role as UserRole)) {
      return res.status(400).json({ 
        message: `Invalid role. Must be one of: ${Object.values(UserRole).join(', ')}` 
      });
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };
    
    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    
    // Hash password if provided
    if (password) {
      updateData.password = hashSync(password, 10);
    }
    
    // Update user
    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(id)))
      .returning({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });
    
    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Server error updating user' });
  }
};

// Delete a user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, parseInt(id)),
    });
    
    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete user
    await db.delete(users).where(eq(users.id, parseInt(id)));
    
    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Server error deleting user' });
  }
};
