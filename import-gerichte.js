import { createClient } from '@libsql/client';
import fs from 'fs';

// Database configuration
const config = {
  url: 'libsql://jules-loden-mimi800-debug21.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjcxODc0MjIsImlkIjoiZjEyYjU1ZTMtMzcwMC00OTc3LTlmMGUtNTAwMDk4ZDA4YWI2IiwicmlkIjoiYzM4MmZiM2UtYzVmOC00ZjNiLTlkYWYtZDA1OTBlN2Q2ZWM0In0.VilVUWVV4ju3XD-B4ETPxXfnHmAyBOArQAJmFHFNOZl3MnHo6y2PnnOAK4tkuamzSTlqh-2UoXdMWF-PFJ5xAA'
};

async function importGerichte() {
  try {
    console.log('Connecting to Turso database...');
    const client = createClient(config);

    // Read the JSON file
    const jsonData = fs.readFileSync('./gerichte_export.json', 'utf8');
    const products = JSON.parse(jsonData);

    console.log(`Found ${products.length} products to import`);

    // Get existing categories
    const categoriesResult = await client.execute('SELECT id, name FROM categories');
    const categories = categoriesResult.rows;
    
    console.log('Available categories before adding new ones:', categories);

    // Check if we need to create new categories for beverages and sweets
    let foodCategory = categories.find(cat => cat.name.toLowerCase().includes('lebensmittel') || cat.name.toLowerCase().includes('food'));
    let sweetsCategory = categories.find(cat => cat.name.toLowerCase().includes('süßigkeiten') || cat.name.toLowerCase().includes('sweets'));
    let beverageCategory = categories.find(cat => cat.name.toLowerCase().includes('kaffee') || cat.name.toLowerCase().includes('getränke') || cat.name.toLowerCase().includes('beverage'));

    // Create new categories if they don't exist
    if (!sweetsCategory) {
      console.log('Creating Sweets category...');
      const sweetsResult = await client.execute({
        sql: `INSERT INTO categories (name, description) VALUES (?, ?)`,
        args: ['Süßigkeiten', 'Süßigkeiten und Snacks']
      });
      sweetsCategory = { id: sweetsResult.lastInsertRowid, name: 'Süßigkeiten' };
    }

    if (!beverageCategory) {
      console.log('Creating Beverage category...');
      const beverageResult = await client.execute({
        sql: `INSERT INTO categories (name, description) VALUES (?, ?)`,
        args: ['Kaffee & Getränke', 'Kaffee, Getränke und andere Heißgetränke']
      });
      beverageCategory = { id: beverageResult.lastInsertRowid, name: 'Kaffee & Getränke' };
    }

    // Refresh categories list
    const updatedCategoriesResult = await client.execute('SELECT id, name FROM categories');
    const updatedCategories = updatedCategoriesResult.rows;
    console.log('Available categories after adding new ones:', updatedCategories);

    // Insert each product with appropriate category assignment
    for (const product of products) {
      let categoryId = foodCategory ? foodCategory.id : null;
      
      // Assign to appropriate category based on product name
      if (product.name.toLowerCase().includes('espresso')) {
        categoryId = beverageCategory.id;
      } else if (product.name.toLowerCase().includes('schoko') || 
                 product.name.toLowerCase().includes('lind') || 
                 product.name.toLowerCase().includes('haribo') || 
                 product.name.toLowerCase().includes('maoam') ||
                 product.name.toLowerCase().includes('mamba') ||
                 product.name.toLowerCase().includes('zitrone') ||
                 product.name.toLowerCase().includes('cola') ||
                 product.name.toLowerCase().includes('schnäps') ||
                 product.name.toLowerCase().includes('fußball')) {
        categoryId = sweetsCategory.id;
      }

      // Insert the product with the determined category
      const insertResult = await client.execute({
        sql: `INSERT INTO products (name, price, description, tags, category_id) VALUES (?, ?, ?, ?, ?)`,
        args: [product.name, product.price, product.desc || '', product.tags || '', categoryId]
      });

      // Find category name for logging
      const category = updatedCategories.find(cat => cat.id === categoryId);
      console.log(`Inserted product: ${product.name} with ID: ${insertResult.lastInsertRowid} in category: ${category?.name || 'None'}`);
    }

    console.log('All products imported successfully!');
  } catch (error) {
    console.error('Error importing products:', error);
  }
}

importGerichte();