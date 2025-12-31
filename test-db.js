import { client } from './lib/db.js';

async function testDB() {
  try {
    console.log('Testing database connection...');
    
    // Test categories
    const categories = await client.execute('SELECT * FROM categories');
    console.log('Categories found:', categories.rows.length);
    
    // Test products
    const products = await client.execute('SELECT * FROM products');
    console.log('Products found:', products.rows.length);
    
    console.log('\nDatabase is working correctly!');
    console.log('Categories:', categories.rows.map(c => c.name));
    console.log('Products:', products.rows.map(p => `${p.name} (${p.price}€)`));
  } catch (error) {
    console.error('Database error:', error);
  }
}
testDB();