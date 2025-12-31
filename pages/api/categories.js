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
    const result = await client.execute('SELECT * FROM categories ORDER BY created_at DESC');
    const categories = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at
    }));
    
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

async function handlePost(req, res) {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    const result = await client.execute({
      sql: 'INSERT INTO categories (name, description) VALUES (?, ?)',
      args: [name, description || null]
    });

    const newCategory = await client.execute({
      sql: 'SELECT * FROM categories WHERE id = ?',
      args: [result.lastInsertRowid]
    });

    res.status(201).json({
      id: newCategory.rows[0].id,
      name: newCategory.rows[0].name,
      description: newCategory.rows[0].description,
      createdAt: newCategory.rows[0].created_at
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
}

async function handlePut(req, res) {
  const { id } = req.query;
  const { name, description } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  try {
    const result = await client.execute({
      sql: 'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      args: [name, description || null, parseInt(id)]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updatedCategory = await client.execute({
      sql: 'SELECT * FROM categories WHERE id = ?',
      args: [parseInt(id)]
    });

    res.status(200).json({
      id: updatedCategory.rows[0].id,
      name: updatedCategory.rows[0].name,
      description: updatedCategory.rows[0].description,
      createdAt: updatedCategory.rows[0].created_at
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
}

async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  try {
    const result = await client.execute({
      sql: 'DELETE FROM categories WHERE id = ?',
      args: [parseInt(id)]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
}