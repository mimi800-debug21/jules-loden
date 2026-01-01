import { createClient } from '@libsql/client';

// Database configuration
const config = {
  url: 'libsql://jules-loden-mimi800-debug21.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjcxODc0MjIsImlkIjoiZjEyYjU1ZTMtMzcwMC00OTc3LTlmMGUtNTAwMDk4ZDA4YWI2IiwicmlkIjoiYzM4MmZiM2UtYzVmOC00ZjNiLTlkYWYtZDA1OTBlN2Q2ZWM0In0.VilVUWVV4ju3XD-B4ETPxXfnHmAyBOArQAJmFHFNOZl3MnHo6y2PnnOAK4tkuamzSTlqh-2UoXdMWF-PFJ5xAA'
};

async function cleanupDatabase() {
  try {
    console.log('Connecting to Turso database...');
    const client = createClient(config);

    // Step 1: Identify and remove duplicate products
    // First, let's find all duplicate products based on name and price
    const allProductsResult = await client.execute(`
      SELECT id, name, price, category_id 
      FROM products 
      ORDER BY name, price, id
    `);
    
    const products = allProductsResult.rows;
    const productsByName = {};
    
    // Group products by name and price
    for (const product of products) {
      const key = `${product.name}_${product.price}`;
      if (!productsByName[key]) {
        productsByName[key] = [];
      }
      productsByName[key].push(product);
    }
    
    // Identify duplicates (products with same name and price)
    const duplicates = [];
    for (const [key, productList] of Object.entries(productsByName)) {
      if (productList.length > 1) {
        // Keep the first one (lowest ID), mark others as duplicates
        const sortedProducts = productList.sort((a, b) => a.id - b.id);
        for (let i = 1; i < sortedProducts.length; i++) {
          duplicates.push(sortedProducts[i].id);
        }
        console.log(`Found ${productList.length} duplicates for: ${productList[0].name} (price: ${productList[0].price})`);
      }
    }
    
    // Remove duplicates
    if (duplicates.length > 0) {
      console.log(`Removing ${duplicates.length} duplicate products...`);
      for (const duplicateId of duplicates) {
        await client.execute({
          sql: `DELETE FROM products WHERE id = ?`,
          args: [duplicateId]
        });
        console.log(`Removed duplicate product with ID: ${duplicateId}`);
      }
    } else {
      console.log('No duplicates found.');
    }

    // Step 2: Remove extra categories and update products to use only "Post" and "Lebensmittel"
    const categoriesResult = await client.execute('SELECT id, name FROM categories ORDER BY id');
    const categories = categoriesResult.rows;
    
    console.log('Current categories:', categories);
    
    // Find the required categories
    const lebensmittelCategory = categories.find(cat => cat.name === 'Lebensmittel');
    const postCategory = categories.find(cat => cat.name === 'Post');
    
    if (!lebensmittelCategory || !postCategory) {
      console.error('Required categories "Lebensmittel" or "Post" not found!');
      return;
    }
    
    // Update all products to use only "Lebensmittel" or "Post" categories
    // For now, assign all products to "Lebensmittel" category (you can adjust this logic as needed)
    const updateResult = await client.execute({
      sql: `UPDATE products SET category_id = ? WHERE category_id NOT IN (?, ?)`,
      args: [lebensmittelCategory.id, lebensmittelCategory.id, postCategory.id]
    });
    
    console.log(`Updated ${updateResult.rowsAffected} products to use allowed categories`);
    
    // Now delete the extra categories (Süßigkeiten and Kaffee & Getränke)
    for (const category of categories) {
      if (category.name !== 'Lebensmittel' && category.name !== 'Post') {
        console.log(`Removing category: ${category.name} (ID: ${category.id})`);
        
        // First, make sure no products are using this category
        await client.execute({
          sql: `UPDATE products SET category_id = ? WHERE category_id = ?`,
          args: [lebensmittelCategory.id, category.id]
        });
        
        // Then delete the category
        await client.execute({
          sql: `DELETE FROM categories WHERE id = ?`,
          args: [category.id]
        });
      }
    }
    
    // Verify the cleanup
    const finalProductsResult = await client.execute(`
      SELECT p.id, p.name, p.price, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.id
    `);
    
    const finalCategoriesResult = await client.execute('SELECT * FROM categories ORDER BY id');
    
    console.log('Final products:', JSON.stringify(finalProductsResult.rows, null, 2));
    console.log('Final categories:', JSON.stringify(finalCategoriesResult.rows, null, 2));
    
    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  }
}

cleanupDatabase();