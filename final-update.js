import { createClient } from '@libsql/client';

// Database configuration
const config = {
  url: 'libsql://jules-loden-mimi800-debug21.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjcxODc0MjIsImlkIjoiZjEyYjU1ZTMtMzcwMC00OTc3LTlmMGUtNTAwMDk4ZDA4YWI2IiwicmlkIjoiYzM4MmZiM2UtYzVmOC00ZjNiLTlkYWYtZDA1OTBlN2Q2ZWM0In0.VilVUWVV4ju3XD-B4ETPxXfnHmAyBOArQAJmFHFNOZl3MnHo6y2PnnOAK4tkuamzSTlqh-2UoXdMWF-PFJ5xAA'
};

async function finalUpdate() {
  try {
    console.log('Connecting to Turso database...');
    const client = createClient(config);
    
    // Update products with no category to use 'Lebensmittel' (ID: 2)
    const updateResult = await client.execute({
      sql: 'UPDATE products SET category_id = 2 WHERE category_id IS NULL'
    });
    
    console.log(`Updated ${updateResult.rowsAffected} products to have 'Lebensmittel' category`);
    
    // Final verification
    const products = await client.execute('SELECT p.id, p.name, p.price, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.id');
    console.log('Final products with categories:', JSON.stringify(products.rows, null, 2));
    
    const categories = await client.execute('SELECT * FROM categories');
    console.log('Final categories:', JSON.stringify(categories.rows, null, 2));
    
    console.log('Database cleanup and categorization completed successfully!');
  } catch (error) {
    console.error('Error in final update:', error);
  }
}

finalUpdate();