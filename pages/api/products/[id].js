import { client, initializeDb } from '../../../lib/db';

export default async function handler(req, res) {
  const { id } = req.query;

  // Initialize database on first request
  if (req.method === 'GET' || req.method === 'PUT' || req.method === 'DELETE') {
    try {
      await initializeDb();
    } catch (error) {
      console.error('Database initialization error:', error);
      return res.status(500).json({ error: 'Database initialization failed' });
    }
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res, id);
    case 'PUT':
      return handlePut(req, res, id);
    case 'DELETE':
      return handleDelete(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function handleGet(req, res, id) {
  try {
    // Add cache headers for faster performance
    res.setHeader('Cache-Control', 's-maxage=5, stale-while-revalidate=10');

    const result = await client.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [parseInt(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const row = result.rows[0];
    const product = {
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      description: row.description,
      tags: row.tags,
      categoryId: row.category_id,
      categoryName: row.category_name,
      createdAt: row.created_at
    };

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

async function handlePut(req, res, id) {
  const { name, price, description, tags, categoryId } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  try {
    // First check if product exists
    const existingProduct = await client.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [parseInt(id)]
    });

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const result = await client.execute({
      sql: 'UPDATE products SET name = ?, price = ?, description = ?, tags = ?, category_id = ? WHERE id = ?',
      args: [name, parseFloat(price), description || null, tags || null, categoryId || null, parseInt(id)]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = await client.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [parseInt(id)]);

    res.status(200).json({
      id: updatedProduct.rows[0].id,
      name: updatedProduct.rows[0].name,
      price: parseFloat(updatedProduct.rows[0].price),
      description: updatedProduct.rows[0].description,
      tags: updatedProduct.rows[0].tags,
      categoryId: updatedProduct.rows[0].category_id,
      categoryName: updatedProduct.rows[0].category_name,
      createdAt: updatedProduct.rows[0].created_at
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: error.message || 'Failed to update product' });
  }
}

async function handleDelete(req, res, id) {
  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    // First check if product exists
    const existingProduct = await client.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [parseInt(id)]
    });

    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete related order items first (due to foreign key constraints)
    await client.execute({
      sql: 'DELETE FROM order_items WHERE product_id = ?',
      args: [parseInt(id)]
    });

    // Then delete the product
    const result = await client.execute({
      sql: 'DELETE FROM products WHERE id = ?',
      args: [parseInt(id)]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: error.message || 'Failed to delete product' });
  }
}