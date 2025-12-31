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
    res.setHeader('Cache-Control', 's-maxage=2, stale-while-revalidate=5');

    // Get specific order with its items and product details
    const orderResult = await client.execute({
      sql: `
        SELECT o.*,
               GROUP_CONCAT(
                 json_object(
                   'id', p.id,
                   'name', p.name,
                   'price', p.price
                 )
               ) as products_json
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.id = ?
        GROUP BY o.id
      `,
      args: [parseInt(id)]
    });

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const row = orderResult.rows[0];
    const order = {
      id: row.id,
      customerName: row.customer_name,
      total: parseFloat(row.total),
      status: row.status,
      paymentMethod: row.payment_method,
      createdAt: row.created_at
    };

    // Parse products JSON
    if (row.products_json) {
      try {
        const productsArray = JSON.parse(`[${row.products_json}]`);
        // Remove duplicates that occur due to GROUP_CONCAT
        const uniqueProducts = [];
        const seenIds = new Set();

        for (const product of productsArray) {
          if (typeof product === 'string') {
            const parsed = JSON.parse(product);
            if (!seenIds.has(parsed.id)) {
              uniqueProducts.push({
                id: parsed.id,
                name: parsed.name,
                price: parseFloat(parsed.price)
              });
              seenIds.add(parsed.id);
            }
          } else if (!seenIds.has(product.id)) {
            uniqueProducts.push({
              id: product.id,
              name: product.name,
              price: parseFloat(product.price)
            });
            seenIds.add(product.id);
          }
        }

        order.products = uniqueProducts;
      } catch (e) {
        console.error('Error parsing products JSON:', e);
        order.products = [];
      }
    } else {
      order.products = [];
    }

    res.status(200).json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
}

async function handlePut(req, res, id) {
  const { status } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    // First check if order exists
    const existingOrder = await client.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [parseInt(id)]
    });

    if (existingOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const result = await client.execute({
      sql: 'UPDATE orders SET status = ? WHERE id = ?',
      args: [status, parseInt(id)]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updatedOrder = await client.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [parseInt(id)]
    });

    res.status(200).json({
      id: updatedOrder.rows[0].id,
      customerName: updatedOrder.rows[0].customer_name,
      total: parseFloat(updatedOrder.rows[0].total),
      status: updatedOrder.rows[0].status,
      paymentMethod: updatedOrder.rows[0].payment_method,
      createdAt: updatedOrder.rows[0].created_at
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: error.message || 'Failed to update order' });
  }
}

async function handleDelete(req, res, id) {
  if (!id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
    // First check if order exists
    const existingOrder = await client.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [parseInt(id)]
    });

    if (existingOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Delete order items first (due to foreign key constraints)
    await client.execute({
      sql: 'DELETE FROM order_items WHERE order_id = ?',
      args: [parseInt(id)]
    });

    // Then delete the order
    const result = await client.execute({
      sql: 'DELETE FROM orders WHERE id = ?',
      args: [parseInt(id)]
    });

    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: error.message || 'Failed to delete order' });
  }
}