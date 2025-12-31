import { client, initializeDb } from './lib/db.js';
import { readFile } from 'fs/promises';

// Read the gerichte_export.json file
async function importProducts() {
  try {
    // Initialize the database
    await initializeDb();

    // Read the JSON file
    const data = await readFile('./gerichte_export.json', 'utf8');
    const products = JSON.parse(data);

    console.log(`Found ${products.length} products to import`);

    // Define categories based on product types
    const categories = {
      'Kaffee & Getränke': ['Espresso'],
      'Süßigkeiten': [
        'Fußball Schokokugel',
        'Mamba Set',
        'Moam Cola Set',
        'Maoam Zitrone',
        'Mini Lind Tafel Golden',
        'Schnäpsle',
        'Haribo Normal mini',
        'Schoko Lolli',
        'Rote Lind Kugel'
      ]
    };

    // Create categories in the database if they don't exist
    const categoryMap = {};
    for (const [categoryName, productNames] of Object.entries(categories)) {
      // Check if category already exists
      const existingCategoryResult = await client.execute({
        sql: 'SELECT id FROM categories WHERE name = ?',
        args: [categoryName]
      });

      let categoryId;
      if (existingCategoryResult.rows.length > 0) {
        categoryId = existingCategoryResult.rows[0].id;
        console.log(`Category "${categoryName}" already exists with ID ${categoryId}`);
      } else {
        // Create new category
        const result = await client.execute({
          sql: 'INSERT INTO categories (name, description) VALUES (?, ?)',
          args: [categoryName, `${categoryName} Produkte`]
        });
        categoryId = result.lastInsertRowid;
        console.log(`Created category "${categoryName}" with ID ${categoryId}`);
      }

      // Map product names to category ID
      for (const productName of productNames) {
        categoryMap[productName] = categoryId;
      }
    }

    // Import products
    let importedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      // Check if product already exists
      const existingProductResult = await client.execute({
        sql: 'SELECT id FROM products WHERE name = ?',
        args: [product.name]
      });

      if (existingProductResult.rows.length > 0) {
        console.log(`Product "${product.name}" already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Determine category ID for this product
      let categoryId = null;
      if (categoryMap[product.name]) {
        categoryId = categoryMap[product.name];
      } else {
        // If product doesn't match any predefined category, put it in a default category
        // or create a new category for it
        const defaultCategoryResult = await client.execute({
          sql: 'SELECT id FROM categories WHERE name = ?',
          args: ['Sonstiges']
        });

        if (defaultCategoryResult.rows.length > 0) {
          categoryId = defaultCategoryResult.rows[0].id;
        } else {
          // Create "Sonstiges" category
          const result = await client.execute({
            sql: 'INSERT INTO categories (name, description) VALUES (?, ?)',
            args: ['Sonstiges', 'Sonstige Produkte']
          });
          categoryId = result.lastInsertRowid;
          console.log(`Created default category "Sonstiges" with ID ${categoryId}`);
        }
      }

      // Insert the product
      await client.execute({
        sql: 'INSERT INTO products (name, price, description, tags, category_id) VALUES (?, ?, ?, ?, ?)',
        args: [
          product.name,
          product.price,
          product.desc || '',
          product.tags || '',
          categoryId
        ]
      });

      console.log(`Imported product: ${product.name}`);
      importedCount++;
    }

    console.log(`\nImport completed!`);
    console.log(`- ${importedCount} products imported`);
    console.log(`- ${skippedCount} products skipped (already existed)`);

  } catch (error) {
    console.error('Error importing products:', error);
  }
}

// Run the import
importProducts();