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
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function handleGet(req, res) {
  try {
    // Add cache headers for faster performance
    res.setHeader('Cache-Control', 's-maxage=2, stale-while-revalidate=5');

    // Get orders with their items and product details
    const ordersResult = await client.execute(`
      SELECT o.*,
             GROUP_CONCAT(
               json_object(
                 'id', p.id,
                 'name', p.name,
                 'price', p.price,
                 'quantity', oi.quantity
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
        deliveryAddress: row.delivery_address,
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
                  price: parseFloat(parsed.price),
                  quantity: parsed.quantity
                });
                seenIds.add(parsed.id);
              }
            } else if (!seenIds.has(product.id)) {
              uniqueProducts.push({
                id: product.id,
                name: product.name,
                price: parseFloat(product.price),
                quantity: product.quantity
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
  const { customerName, deliveryAddress, products, total, status, paymentMethod } = req.body;

  if (!customerName || !products || !Array.isArray(products) || products.length === 0 || total === undefined) {
    return res.status(400).json({ error: 'Customer name, products, and total are required' });
  }

  try {
    // Insert the order
    const orderResult = await client.execute({
      sql: 'INSERT INTO orders (customer_name, delivery_address, total, status, payment_method) VALUES (?, ?, ?, ?, ?)',
      args: [customerName, deliveryAddress, parseFloat(total), status || 'open', paymentMethod || 'julespay']
    });

    const orderId = orderResult.lastInsertRowid;

    // Insert order items
    for (const product of products) {
      const quantity = product.quantity || 1; // Default to 1 if no quantity specified
      await client.execute({
        sql: 'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        args: [orderId, product.id, quantity, product.price]
      });
    }

    // Return the created order
    const newOrder = await client.execute({
      sql: 'SELECT * FROM orders WHERE id = ?',
      args: [orderId]
    });

    res.status(201).json({
      id: newOrder.rows[0].id,
      customerName: newOrder.rows[0].customer_name,
      deliveryAddress: newOrder.rows[0].delivery_address,
      total: parseFloat(newOrder.rows[0].total),
      status: newOrder.rows[0].status,
      paymentMethod: newOrder.rows[0].payment_method,
      createdAt: newOrder.rows[0].created_at
    });
  } catch (error) {
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

