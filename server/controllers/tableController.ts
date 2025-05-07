import { Request, Response } from 'express';
import { db } from '@db';
import { tables } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { generateTableQRCode } from '../utils/qrCodeGenerator';
import { websocketManager } from '../utils/websocketManager';

// Get all tables
export const getAllTables = async (req: Request, res: Response) => {
  try {
    const allTables = await db.query.tables.findMany({
      orderBy: (tables, { asc }) => [asc(tables.number)],
    });
    
    return res.status(200).json(allTables);
  } catch (error) {
    console.error('Error getting tables:', error);
    return res.status(500).json({ message: 'Server error fetching tables' });
  }
};

// Get single table by ID
export const getTableById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid table ID' });
    }
    
    const table = await db.query.tables.findFirst({
      where: eq(tables.id, parseInt(id)),
    });
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    return res.status(200).json(table);
  } catch (error) {
    console.error('Error getting table:', error);
    return res.status(500).json({ message: 'Server error fetching table' });
  }
};

// Get table by number
export const getTableByNumber = async (req: Request, res: Response) => {
  try {
    const { number } = req.params;
    
    if (!number || isNaN(parseInt(number))) {
      return res.status(400).json({ message: 'Invalid table number' });
    }
    
    const table = await db.query.tables.findFirst({
      where: eq(tables.number, parseInt(number)),
    });
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    return res.status(200).json(table);
  } catch (error) {
    console.error('Error getting table by number:', error);
    return res.status(500).json({ message: 'Server error fetching table' });
  }
};

// Create a new table
export const createTable = async (req: Request, res: Response) => {
  try {
    const { number, seats } = req.body;
    
    // Validate required fields
    if (!number || !seats) {
      return res.status(400).json({ message: 'Table number and seats are required' });
    }
    
    // Check if table number already exists
    const existingTable = await db.query.tables.findFirst({
      where: eq(tables.number, number),
    });
    
    if (existingTable) {
      return res.status(400).json({ message: `Table with number ${number} already exists` });
    }
    
    // Generate QR code for the new table
    const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
    const qrCode = await generateTableQRCode(number, baseUrl);
    
    // Insert new table
    const [newTable] = await db.insert(tables).values({
      number,
      seats,
      status: 'available',
      qrCode,
    }).returning();
    
    return res.status(201).json(newTable);
  } catch (error) {
    console.error('Error creating table:', error);
    return res.status(500).json({ message: 'Server error creating table' });
  }
};

// Update a table
export const updateTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { number, seats, status } = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid table ID' });
    }
    
    // Check if table exists
    const existingTable = await db.query.tables.findFirst({
      where: eq(tables.id, parseInt(id)),
    });
    
    if (!existingTable) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    let newQrCode = existingTable.qrCode;
    
    // If table number changed, generate new QR code
    if (number && number !== existingTable.number) {
      // Check if new table number already exists
      const tableWithSameNumber = await db.query.tables.findFirst({
        where: and(
          eq(tables.number, number),
          eq(tables.id, parseInt(id), 'not')
        ),
      });
      
      if (tableWithSameNumber) {
        return res.status(400).json({ message: `Table with number ${number} already exists` });
      }
      
      // Generate new QR code
      const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
      newQrCode = await generateTableQRCode(number, baseUrl);
    }
    
    // Update table
    const [updatedTable] = await db.update(tables)
      .set({
        number: number !== undefined ? number : existingTable.number,
        seats: seats !== undefined ? seats : existingTable.seats,
        status: status !== undefined ? status : existingTable.status,
        qrCode: newQrCode,
        updatedAt: new Date(),
      })
      .where(eq(tables.id, parseInt(id)))
      .returning();
    
    // If status changed, notify via WebSocket
    if (status && status !== existingTable.status) {
      websocketManager.notifyTableStatusChange(
        updatedTable.id,
        updatedTable.number,
        updatedTable.status
      );
    }
    
    return res.status(200).json(updatedTable);
  } catch (error) {
    console.error('Error updating table:', error);
    return res.status(500).json({ message: 'Server error updating table' });
  }
};

// Delete a table
export const deleteTable = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid table ID' });
    }
    
    // Check if table exists
    const existingTable = await db.query.tables.findFirst({
      where: eq(tables.id, parseInt(id)),
    });
    
    if (!existingTable) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Delete table
    await db.delete(tables).where(eq(tables.id, parseInt(id)));
    
    return res.status(200).json({ message: 'Table deleted successfully' });
  } catch (error) {
    console.error('Error deleting table:', error);
    return res.status(500).json({ message: 'Server error deleting table' });
  }
};

// Generate new QR code for an existing table
export const regenerateTableQRCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ message: 'Invalid table ID' });
    }
    
    // Check if table exists
    const existingTable = await db.query.tables.findFirst({
      where: eq(tables.id, parseInt(id)),
    });
    
    if (!existingTable) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    // Generate new QR code
    const baseUrl = process.env.BASE_URL || `http://${req.headers.host}`;
    const newQrCode = await generateTableQRCode(existingTable.number, baseUrl);
    
    // Update table with new QR code
    const [updatedTable] = await db.update(tables)
      .set({
        qrCode: newQrCode,
        updatedAt: new Date(),
      })
      .where(eq(tables.id, parseInt(id)))
      .returning();
    
    return res.status(200).json(updatedTable);
  } catch (error) {
    console.error('Error regenerating QR code:', error);
    return res.status(500).json({ message: 'Server error regenerating QR code' });
  }
};
