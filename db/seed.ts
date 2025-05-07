import { db } from "./index";
import { users, tables, categories, menuItems, orders, orderItems } from "@shared/schema";
import { createId } from '@paralleldrive/cuid2';
import { hashSync } from 'bcryptjs';
import QRCode from 'qrcode';

async function seed() {
  try {
    console.log("Starting to seed database...");

    // Create users with different roles
    const existingUsers = await db.query.users.findMany();
    
    if (existingUsers.length === 0) {
      console.log("Seeding users...");
      const hashedPassword = hashSync('password123', 10);
      
      await db.insert(users).values([
        {
          username: 'admin',
          password: hashedPassword,
          name: 'Robert Johnson',
          email: 'admin@restaurant.com',
          role: 'admin',
        },
        {
          username: 'waiter',
          password: hashedPassword,
          name: 'John Doe',
          email: 'waiter@restaurant.com',
          role: 'waiter',
        },
        {
          username: 'cashier',
          password: hashedPassword,
          name: 'Sarah Miller',
          email: 'cashier@restaurant.com',
          role: 'cashier',
        }
      ]);
      console.log("Users seeded successfully.");
    } else {
      console.log(`Found ${existingUsers.length} existing users. Skipping user seeding.`);
    }

    // Create restaurant tables and generate QR codes
    const existingTables = await db.query.tables.findMany();
    
    if (existingTables.length === 0) {
      console.log("Seeding tables...");
      
      // Create 15 tables with QR codes
      for (let i = 1; i <= 15; i++) {
        const tableNumber = i;
        const seats = i % 5 === 0 ? 8 : (i % 3 === 0 ? 6 : 4); // Mix of 4, 6, and 8 seat tables
        
        // Generate QR code as a data URL (using the protocol/host from env when available)
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        const tableUrl = `${baseUrl}/table/${tableNumber}`;
        const qrCodeImage = await QRCode.toDataURL(tableUrl);
        
        await db.insert(tables).values({
          number: tableNumber,
          seats: seats,
          status: 'available',
          qrCode: qrCodeImage
        });
      }
      console.log("Tables seeded successfully.");
    } else {
      console.log(`Found ${existingTables.length} existing tables. Skipping table seeding.`);
    }

    // Create menu categories
    const existingCategories = await db.query.categories.findMany();
    
    if (existingCategories.length === 0) {
      console.log("Seeding menu categories...");
      
      await db.insert(categories).values([
        {
          name: 'Appetizers',
          description: 'Starters and small plates to begin your meal',
          isActive: true
        },
        {
          name: 'Main Course',
          description: 'Our signature main dishes',
          isActive: true
        },
        {
          name: 'Desserts',
          description: 'Sweet treats to finish your meal',
          isActive: true
        },
        {
          name: 'Drinks',
          description: 'Beverages to accompany your meal',
          isActive: true
        }
      ]);
      console.log("Menu categories seeded successfully.");
    } else {
      console.log(`Found ${existingCategories.length} existing categories. Skipping category seeding.`);
    }

    // Now fetch categories to get their IDs
    const categoriesData = await db.query.categories.findMany();
    const categoryMap = categoriesData.reduce<Record<string, number>>((acc, category) => {
      acc[category.name] = category.id;
      return acc;
    }, {});

    // Check if menu items already exist
    const existingMenuItems = await db.query.menuItems.findMany();
    
    if (existingMenuItems.length === 0 && categoriesData.length > 0) {
      console.log("Seeding menu items...");
      
      await db.insert(menuItems).values([
        // Appetizers
        {
          name: 'Tomato Bruschetta',
          description: 'Toasted bread with fresh tomatoes, basil, and olive oil.',
          price: '8.95',
          image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
          categoryId: categoryMap['Appetizers'],
          isAvailable: true,
          allergies: JSON.stringify(['gluten']),
          dietaryInfo: JSON.stringify(['vegetarian'])
        },
        {
          name: 'Garlic Bread',
          description: 'Freshly baked bread with garlic butter and herbs.',
          price: '5.95',
          image: 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
          categoryId: categoryMap['Appetizers'],
          isAvailable: true,
          allergies: JSON.stringify(['gluten', 'dairy']),
          dietaryInfo: JSON.stringify(['vegetarian'])
        },
        
        // Main Course
        {
          name: 'Classic Cheeseburger',
          description: 'Beef patty, cheese, lettuce, tomato, and house sauce.',
          price: '14.50',
          image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
          categoryId: categoryMap['Main Course'],
          isAvailable: true,
          allergies: JSON.stringify(['gluten', 'dairy']),
          dietaryInfo: JSON.stringify([])
        },
        {
          name: 'Grilled Salmon',
          description: 'Fresh salmon fillet grilled with lemon and herbs, served with seasonal vegetables.',
          price: '22.50',
          image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
          categoryId: categoryMap['Main Course'],
          isAvailable: true,
          allergies: JSON.stringify(['fish']),
          dietaryInfo: JSON.stringify(['gluten-free'])
        },
        
        // Desserts
        {
          name: 'Chocolate Lava Cake',
          description: 'Warm chocolate cake with a molten center, served with vanilla ice cream.',
          price: '9.95',
          image: 'https://pixabay.com/get/g1026a2e9b0339a995c82a5242758861dceb38469ca00057cdd4ce516866248a64cf0c761bd8080ea0bc47e95ae6e0d02f4f379cdc2e195836fa4fe82814653e0_1280.jpg',
          categoryId: categoryMap['Desserts'],
          isAvailable: false,
          allergies: JSON.stringify(['gluten', 'dairy', 'eggs']),
          dietaryInfo: JSON.stringify(['vegetarian'])
        },
        
        // Drinks
        {
          name: 'Sparkling Water',
          description: 'Refreshing carbonated water.',
          price: '3.50',
          image: 'https://images.unsplash.com/photo-1574365569389-a10d488ca3fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
          categoryId: categoryMap['Drinks'],
          isAvailable: true,
          allergies: JSON.stringify([]),
          dietaryInfo: JSON.stringify(['vegan', 'gluten-free'])
        },
        {
          name: 'Caesar Salad',
          description: 'Crisp romaine lettuce with Caesar dressing, croutons, and parmesan cheese.',
          price: '10.95',
          image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200',
          categoryId: categoryMap['Appetizers'],
          isAvailable: true,
          allergies: JSON.stringify(['gluten', 'dairy', 'eggs']),
          dietaryInfo: JSON.stringify(['contains meat'])
        }
      ]);
      console.log("Menu items seeded successfully.");
    } else {
      console.log(`Found ${existingMenuItems.length} existing menu items. Skipping menu item seeding.`);
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
