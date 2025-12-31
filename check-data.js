import { client } from './lib/db.js';

async function checkData() {
  try {
    // Check categories
    console.log('Categories:');
    const categories = await client.execute('SELECT * FROM categories');
    console.table(categories.rows);
    
    // Check products
    console.log('\nProducts:');
    const products = await client.execute(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
    `);
    console.table(products.rows);
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

checkData();