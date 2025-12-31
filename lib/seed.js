import { client, initializeDb } from './db.js';

async function seedDatabase() {
  try {
    console.log('Initializing database...');
    await initializeDb();
    
    // Insert example categories
    console.log('Inserting example categories...');
    const categories = [
      { name: 'Lebensmittel', description: 'Essen und Trinken' },
      { name: 'Post', description: 'Postdienstleistungen' },
      { name: 'Elektronik', description: 'Elektronische Geräte' },
      { name: 'Bekleidung', description: 'Kleidung und Accessoires' }
    ];
    
    for (const category of categories) {
      try {
        await client.execute({
          sql: 'INSERT INTO categories (name, description) VALUES (?, ?)',
          args: [category.name, category.description]
        });
        console.log(`Inserted category: ${category.name}`);
      } catch (err) {
        // Ignore duplicate key errors if categories already exist
        if (err.message.includes('UNIQUE constraint failed')) {
          console.log(`Category ${category.name} already exists`);
        } else {
          throw err;
        }
      }
    }
    
    // Get category IDs for products
    const categoriesResult = await client.execute('SELECT * FROM categories');
    const categoryMap = {};
    categoriesResult.rows.forEach(cat => {
      categoryMap[cat.name] = cat.id;
    });
    
    // Insert example products
    console.log('Inserting example products...');
    const products = [
      { 
        name: 'Apfel', 
        price: 1.50, 
        description: 'Frischer roter Apfel', 
        tags: 'Obst, gesund',
        categoryId: categoryMap['Lebensmittel']
      },
      { 
        name: 'Brot', 
        price: 2.99, 
        description: 'Frisches Weißbrot', 
        tags: 'Backwaren',
        categoryId: categoryMap['Lebensmittel']
      },
      { 
        name: 'Briefmarke', 
        price: 0.80, 
        description: 'Standardbriefmarke', 
        tags: 'Post, Versand',
        categoryId: categoryMap['Post']
      },
      { 
        name: 'Paketversand', 
        price: 5.99, 
        description: 'Paketversand deutschlandweit', 
        tags: 'Post, Versand',
        categoryId: categoryMap['Post']
      },
      { 
        name: 'Smartphone', 
        price: 699.00, 
        description: 'Neuestes Smartphone Modell', 
        tags: 'Elektronik, Mobil',
        categoryId: categoryMap['Elektronik']
      },
      { 
        name: 'T-Shirt', 
        price: 19.99, 
        description: 'Baumwoll T-Shirt in verschiedenen Farben', 
        tags: 'Kleidung, Oberteile',
        categoryId: categoryMap['Bekleidung']
      }
    ];
    
    for (const product of products) {
      try {
        await client.execute({
          sql: 'INSERT INTO products (name, price, description, tags, category_id) VALUES (?, ?, ?, ?, ?)',
          args: [product.name, product.price, product.description, product.tags, product.categoryId]
        });
        console.log(`Inserted product: ${product.name}`);
      } catch (err) {
        // Ignore errors if products already exist
        console.log(`Product ${product.name} may already exist`);
      }
    }
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Run the seeding function if this file is executed directly
if (process.argv[1].endsWith('seed.js')) {
  seedDatabase();
}

export { seedDatabase };