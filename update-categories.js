import { createClient } from '@libsql/client';
import fs from 'fs';

// Database configuration
const config = {
  url: 'libsql://jules-loden-mimi800-debug21.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjcxODc0MjIsImlkIjoiZjEyYjU1ZTMtMzcwMC00OTc3LTlmMGUtNTAwMDk4ZDA4YWI2IiwicmlkIjoiYzM4MmZiM2UtYzVmOC00ZjNiLTlkYWYtZDA1OTBlN2Q2ZWM0In0.VilVUWVV4ju3XD-B4ETPxXfnHmAyBOArQAJmFHFNOZl3MnHo6y2PnnOAK4tkuamzSTlqh-2UoXdMWF-PFJ5xAA'
};

async function updateProductCategories() {
  try {
    console.log('Connecting to Turso database...');
    const client = createClient(config);

    // Read the JSON file to get the original products
    const jsonData = fs.readFileSync('./gerichte_export.json', 'utf8');
    const products = JSON.parse(jsonData);

    console.log(`Found ${products.length} products to process`);

    // Get existing categories
    const categoriesResult = await client.execute('SELECT id, name FROM categories');
    const categories = categoriesResult.rows;
    
    console.log('Available categories:', categories);

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
      categories.push(sweetsCategory);
    }

    if (!beverageCategory) {
      console.log('Creating Beverage category...');
      const beverageResult = await client.execute({
        sql: `INSERT INTO categories (name, description) VALUES (?, ?)`,
        args: ['Kaffee & Getränke', 'Kaffee, Getränke und andere Heißgetränke']
      });
      beverageCategory = { id: beverageResult.lastInsertRowid, name: 'Kaffee & Getränke' };
      categories.push(beverageCategory);
    }

    // Get the latest products that match the ones in the JSON file
    // We'll identify them by name and price
    for (const product of products) {
      // Find the product in the database by name
      const findProductResult = await client.execute({
        sql: `SELECT id, name, category_id FROM products WHERE name = ? AND price = ? ORDER BY id DESC LIMIT 1`,
        args: [product.name, product.price]
      });
      
      if (findProductResult.rows.length > 0) {
        const dbProduct = findProductResult.rows[0];
        
        // Determine the appropriate category for this product
        let targetCategoryId = foodCategory ? foodCategory.id : null;
        
        if (product.name.toLowerCase().includes('espresso')) {
          targetCategoryId = beverageCategory.id;
        } else if (product.name.toLowerCase().includes('schoko') || 
                   product.name.toLowerCase().includes('lind') || 
                   product.name.toLowerCase().includes('haribo') || 
                   product.name.toLowerCase().includes('maoam') ||
                   product.name.toLowerCase().includes('mamba') ||
                   product.name.toLowerCase().includes('zitrone') ||
                   product.name.toLowerCase().includes('cola') ||
                   product.name.toLowerCase().includes('schnäps') ||
                   product.name.toLowerCase().includes('fußball')) {
          targetCategoryId = sweetsCategory.id;
        }
        
        // Update the product's category if it's different
        if (dbProduct.category_id !== targetCategoryId) {
          await client.execute({
            sql: `UPDATE products SET category_id = ? WHERE id = ?`,
            args: [targetCategoryId, dbProduct.id]
          });
          
          // Find category names for logging
          const newCategory = categories.find(cat => cat.id === targetCategoryId);
          const oldCategory = categories.find(cat => cat.id === dbProduct.category_id) || { name: 'None' };
          
          console.log(`Updated product: ${product.name} (ID: ${dbProduct.id}) from category: ${oldCategory.name} to: ${newCategory?.name || 'None'}`);
        } else {
          console.log(`Product: ${product.name} (ID: ${dbProduct.id}) already has correct category`);
        }
      } else {
        console.log(`Could not find product in database: ${product.name}`);
      }
    }

    console.log('Product category updates completed!');
  } catch (error) {
    console.error('Error updating product categories:', error);
  }
}

updateProductCategories();