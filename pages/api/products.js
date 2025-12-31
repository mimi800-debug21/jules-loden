import { client, initializeDb } from '../../lib/db';

export default async function handler(req, res) {
  // Initialize database on first request
  if (req.method === 'GET' || req.method === 'POST') {
    try {
      await initializeDb();
    } catch (error) {
      console.error('Database initialization error:', error);
      return res.status(500).json({ error: 'Database initialization failed' });
    }
  }

  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PUT':
      return handlePut(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function handleGet(req, res) {
  try {
    const result = await client.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.created_at DESC
    `);
    const products = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      price: parseFloat(row.price),
      description: row.description,
      tags: row.tags,
      categoryId: row.category_id,
      categoryName: row.category_name,
      createdAt: row.created_at
    }));

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

async function handlePost(req, res) {
  const { name, price, description, tags, categoryId } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  try {
    const result = await client.execute({
      sql: 'INSERT INTO products (name, price, description, tags, category_id) VALUES (?, ?, ?, ?, ?)',
      args: [name, parseFloat(price), description || null, tags || null, categoryId || null]
    });

    const newProduct = await client.execute(`
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [result.lastInsertRowid]);

    res.status(201).json({
      id: newProduct.rows[0].id,
      name: newProduct.rows[0].name,
      price: parseFloat(newProduct.rows[0].price),
      description: newProduct.rows[0].description,
      tags: newProduct.rows[0].tags,
      categoryId: newProduct.rows[0].category_id,
      categoryName: newProduct.rows[0].category_name,
      createdAt: newProduct.rows[0].created_at
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

async function handlePut(req, res) {
  const { id } = req.query;
  const { name, price, description, tags, categoryId } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
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
    res.status(500).json({ error: 'Failed to update product' });
  }
}

async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
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
    res.status(500).json({ error: 'Failed to delete product' });
  }
}