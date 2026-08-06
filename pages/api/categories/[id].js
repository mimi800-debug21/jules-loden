import { client, initializeDb } from '../../../lib/db';

const toIso = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const mapCategory = (row) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  availableFrom: row.available_from || null,
  availableUntil: row.available_until || null,
  sortOrder: row.sort_order ?? 0,
  createdAt: row.created_at,
});

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

    const result = await client.execute({
      sql: 'SELECT * FROM categories WHERE id = ?',
      args: [parseInt(id)]
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json(mapCategory(result.rows[0]));
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
}

async function handlePut(req, res, id) {
  const { name, description } = req.body;
  const availableFrom = toIso(req.body.availableFrom);
  const availableUntil = toIso(req.body.availableUntil);
  const sortOrder = parseInt(req.body.sortOrder, 10) || 0;

  if (!id) {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    // First check if category exists
    const existingCategory = await client.execute({
      sql: 'SELECT * FROM categories WHERE id = ?',
      args: [parseInt(id)]
    });

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
  }

    const result = await client.execute({
      sql: 'UPDATE categories SET name = ?, description = ?, available_from = ?, available_until = ?, sort_order = ? WHERE id = ?',
      args: [name, description || null, availableFrom, availableUntil, sortOrder, parseInt(id)]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updatedCategory = await client.execute({
      sql: 'SELECT * FROM categories WHERE id = ?',
      args: [parseInt(id)]
    });

    res.status(200).json(mapCategory(updatedCategory.rows[0]));
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: error.message || 'Failed to update category' });
  }
}

async function handleDelete(req, res, id) {
  if (!id) {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  try {
    // First check if category exists
    const existingCategory = await client.execute({
      sql: 'SELECT * FROM categories WHERE id = ?',
      args: [parseInt(id)]
    });

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Set products in this category to have no category (NULL) instead of deleting them
    await client.execute({
      sql: 'UPDATE products SET category_id = NULL WHERE category_id = ?',
      args: [parseInt(id)]
    });

    // Then delete the category
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
    res.status(500).json({ error: error.message || 'Failed to delete category' });
  }
}