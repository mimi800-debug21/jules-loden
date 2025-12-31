# Jules Loden Database Schema

The application uses a Turso SQLite database with the following tables:

## Products Table
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  tags TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Orders Table
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  total REAL NOT NULL,
  status TEXT DEFAULT 'open',
  payment_method TEXT DEFAULT 'julespay',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Order Items Table
```sql
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  product_id INTEGER,
  quantity INTEGER DEFAULT 1,
  price REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

## Relationships
- Each order can have multiple order items (one-to-many)
- Each order item is linked to one product (many-to-one)
- Foreign key constraints ensure referential integrity