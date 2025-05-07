import { Request, Response } from 'express';
import { db } from '@db';
import { menuItems, categories } from '@shared/schema';
import { eq, like, and, or, inArray } from 'drizzle-orm';
import { websocketManager } from '../utils/websocketManager';
import { WebSocketMessageType } from '@shared/types';

// Get all menu categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const allCategories = await db.query.categories.findMany({
      where: eq(categories.isActive, true),
      orderBy: (categories, { asc }) => [asc(categories.name)],
    });
    
    return res.status(200).json(allCategories);
  } catch (error) {
    console.error('Error getting categories:', error);
    return res.status(500).json({ message: 'Server error fetching categories' });
  }
};

// Get all menu items with optional category filter
export const getMenuItems = async (req: Request, res: Response) => {
  try {
    const { categoryId, search, onlyAvailable } = req.query;
    
    let query = db.query.menuItems.findMany({
      with: {
        category: true
      },
      orderBy: (menuItems, { asc }) => [asc(menuItems.name)],
    });
    
    // Build query conditions
    const conditions = [];
    
    // Filter by category if provided
    if (categoryId && typeof categoryId === 'string') {
      const catId = parseInt(categoryId);
      if (!isNaN(catId)) {
        conditions.push(eq(menuItems.categoryId, catId));
      }
    }
    
    // Filter by search term if provided
    if (search && typeof search === 'string') {
      conditions.push(
        or(
          like(menuItems.name, `%${search}%`),
          like(menuItems.description, `%${search}%`)
        )
      );
    }
    
    // Filter only available items if requested
    if (onlyAvailable === 'true') {
      conditions.push(eq(menuItems.isAvailable, true));
    }
    
    // Apply all conditions if any
    if (conditions.length > 0) {
      query = db.query.menuItems.findMany({
        where: and(...conditions),
        with: {
          category: true
        },
        orderBy: (menuItems, { asc }) => [asc(menuItems.name)],
      });
    }
    
    const items = await query;
    
    return res.status(200).json(items);
  } catch (error) {
    console.error('Error getting menu items:', error);
    return res.status(500).json({ message: 'Server error fetching menu items' });
  }
};

// Get a single menu item by ID
export const getMenuItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    
    const menuItem = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, parseInt(id)),
      with: {
        category: true
      }
    });
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    return res.status(200).json(menuItem);
  } catch (error) {
    console.error('Error getting menu item:', error);
    return res.status(500).json({ message: 'Server error fetching menu item' });
  }
};

// Create a new menu item
export const createMenuItem = async (req: Request, res: Response) => {
  try {
    const { name, description, price, image, categoryId, isAvailable, allergies, dietaryInfo } = req.body;
    
    // Validate required fields
    if (!name || !price || !categoryId) {
      return res.status(400).json({ message: 'Name, price, and category ID are required' });
    }
    
    // Check if category exists
    const category = await db.query.categories.findFirst({
      where: eq(categories.id, categoryId)
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Insert the new menu item
    const [newMenuItem] = await db.insert(menuItems).values({
      name,
      description,
      price: price.toString(),
      image,
      categoryId,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
      allergies: JSON.stringify(allergies || []),
      dietaryInfo: JSON.stringify(dietaryInfo || [])
    }).returning();
    
    return res.status(201).json(newMenuItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    return res.status(500).json({ message: 'Server error creating menu item' });
  }
};

// Update a menu item
export const updateMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, price, image, categoryId, isAvailable, allergies, dietaryInfo } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    
    // Check if the menu item exists
    const existingItem = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, parseInt(id))
    });
    
    if (!existingItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Update menu item
    const [updatedMenuItem] = await db.update(menuItems)
      .set({
        name: name !== undefined ? name : existingItem.name,
        description: description !== undefined ? description : existingItem.description,
        price: price !== undefined ? price.toString() : existingItem.price,
        image: image !== undefined ? image : existingItem.image,
        categoryId: categoryId !== undefined ? categoryId : existingItem.categoryId,
        isAvailable: isAvailable !== undefined ? isAvailable : existingItem.isAvailable,
        allergies: allergies !== undefined ? JSON.stringify(allergies) : existingItem.allergies,
        dietaryInfo: dietaryInfo !== undefined ? JSON.stringify(dietaryInfo) : existingItem.dietaryInfo,
        updatedAt: new Date()
      })
      .where(eq(menuItems.id, parseInt(id)))
      .returning();
    
    // If availability changed, notify clients via WebSocket
    if (isAvailable !== undefined && isAvailable !== existingItem.isAvailable) {
      websocketManager.notifyMenuItemAvailabilityChange(
        updatedMenuItem.id,
        updatedMenuItem.name,
        updatedMenuItem.isAvailable
      );
    }
    
    return res.status(200).json(updatedMenuItem);
  } catch (error) {
    console.error('Error updating menu item:', error);
    return res.status(500).json({ message: 'Server error updating menu item' });
  }
};

// Delete a menu item
export const deleteMenuItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    
    // Check if menu item exists
    const existingItem = await db.query.menuItems.findFirst({
      where: eq(menuItems.id, parseInt(id))
    });
    
    if (!existingItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }
    
    // Delete menu item
    await db.delete(menuItems).where(eq(menuItems.id, parseInt(id)));
    
    return res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return res.status(500).json({ message: 'Server error deleting menu item' });
  }
};

// Create a new category
export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, availableFrom, availableTo, isActive } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    
    // Insert new category
    const [newCategory] = await db.insert(categories).values({
      name,
      description,
      availableFrom,
      availableTo,
      isActive: isActive !== undefined ? isActive : true,
    }).returning();
    
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    return res.status(500).json({ message: 'Server error creating category' });
  }
};

// Update a category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, availableFrom, availableTo, isActive } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    // Check if category exists
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, parseInt(id))
    });
    
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Update category
    const [updatedCategory] = await db.update(categories)
      .set({
        name: name !== undefined ? name : existingCategory.name,
        description: description !== undefined ? description : existingCategory.description,
        availableFrom: availableFrom !== undefined ? availableFrom : existingCategory.availableFrom,
        availableTo: availableTo !== undefined ? availableTo : existingCategory.availableTo,
        isActive: isActive !== undefined ? isActive : existingCategory.isActive,
        updatedAt: new Date()
      })
      .where(eq(categories.id, parseInt(id)))
      .returning();
    
    return res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    return res.status(500).json({ message: 'Server error updating category' });
  }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid category ID' });
    }
    
    // Check if category exists
    const existingCategory = await db.query.categories.findFirst({
      where: eq(categories.id, parseInt(id))
    });
    
    if (!existingCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if category has menu items
    const categoryItems = await db.query.menuItems.findMany({
      where: eq(menuItems.categoryId, parseInt(id))
    });
    
    if (categoryItems.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with associated menu items. Delete or move the items first.' 
      });
    }
    
    // Delete category
    await db.delete(categories).where(eq(categories.id, parseInt(id)));
    
    return res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({ message: 'Server error deleting category' });
  }
};
