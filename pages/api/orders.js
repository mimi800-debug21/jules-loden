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
    // Get orders with their items and product details
    const ordersResult = await client.execute(`
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
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);

    const orders = ordersResult.rows.map(row => {
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

      return order;
    });
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

async function handlePost(req, res) {
  const { customerName, products, total, status, paymentMethod } = req.body;

  if (!customerName || !products || !Array.isArray(products) || products.length === 0 || total === undefined) {
    return res.status(400).json({ error: 'Customer name, products, and total are required' });
  }

  // Start a transaction
  try {
    await client.execute('BEGIN TRANSACTION');

    // Insert the order
    const orderResult = await client.execute({
      sql: 'INSERT INTO orders (customer_name, total, status, payment_method) VALUES (?, ?, ?, ?)',
      args: [customerName, parseFloat(total), status || 'open', paymentMethod || 'julespay']
    });

    const orderId = orderResult.lastInsertRowid;

    // Insert order items
    for (const product of products) {
      await client.execute({
        sql: 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        args: [orderId, product.id, 1, product.price]
      });
    }

    await client.execute('COMMIT');

    // Return the created order
    const newOrder = await client.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [orderId]
    });

    res.status(201).json({
      id: newOrder.rows[0].id,
      customerName: newOrder.rows[0].customer_name,
      total: parseFloat(newOrder.rows[0].total),
      status: newOrder.rows[0].status,
      paymentMethod: newOrder.rows[0].payment_method,
      createdAt: newOrder.rows[0].created_at
    });
  } catch (error) {
    await client.execute('ROLLBACK');
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
}

async function handlePut(req, res) {
  const { id } = req.query;
  const { status } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
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
    res.status(500).json({ error: 'Failed to update order' });
  }
}

async function handleDelete(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Order ID is required' });
  }

  try {
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
    res.status(500).json({ error: 'Failed to delete order' });
  }
}