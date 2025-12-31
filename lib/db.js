import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

// Create a single client instance
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://jules-loden-mimi800-debug21.aws-ap-northeast-1.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Initialize the database with tables
export async function initializeDb() {
  try {
    // Create products table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        tags TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_name TEXT NOT NULL,
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

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export { client };