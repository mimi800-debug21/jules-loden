import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

// Only load dotenv in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

// Create a single client instance
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db', // Use local file in development if no URL provided
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Track if database has been initialized
let dbInitialized = false;

// Initialize the database with tables
export async function initializeDb() {
  if (dbInitialized) {
    return; // Skip initialization if already done
  }

  try {
    // Create categories table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create products table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        tags TEXT,
        category_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // Create orders table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
        waiter_name TEXT,
        total REAL NOT NULL,
        status TEXT DEFAULT 'open',
        payment_method TEXT DEFAULT 'julespay',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create order_items table (to link orders with products)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER DEFAULT 1,
        price REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);

    dbInitialized = true;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export { client };