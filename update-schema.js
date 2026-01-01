import { createClient } from '@libsql/client';

// Database configuration
const config = {
  url: 'libsql://jules-loden-mimi800-debug21.aws-ap-northeast-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NjcxODc0MjIsImlkIjoiZjEyYjU1ZTMtMzcwMC00OTc3LTlmMGUtNTAwMDk4ZDA4YWI2IiwicmlkIjoiYzM4MmZiM2UtYzVmOC00ZjNiLTlkYWYtZDA1OTBlN2Q2ZWM0In0.VilVUWVV4ju3XD-B4ETPxXfnHmAyBOArQAJmFHFNOZl3MnHo6y2PnnOAK4tkuamzSTlqh-2UoXdMWF-PFJ5xAA'
};

async function updateSchema() {
  try {
    console.log('Connecting to Turso database...');
    const client = createClient(config);

    // Add delivery_address column to orders table
    try {
      await client.execute('ALTER TABLE orders ADD COLUMN delivery_address TEXT');
      console.log('Added delivery_address column to orders table');
    } catch (error) {
      // Column might already exist, which is fine
      if (error.message.includes('duplicate column name')) {
        console.log('delivery_address column already exists');
      } else {
        console.error('Error adding delivery_address column:', error);
      }
    }

    // Verify the schema changes
    const schemaResult = await client.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'");
    console.log('Updated orders table schema:', schemaResult.rows[0]?.sql);

    console.log('Database schema updated successfully!');
  } catch (error) {
    console.error('Error updating database schema:', error);
  }
}

updateSchema();