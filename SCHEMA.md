# Restaurant am Teich Database Schema

The application uses a Turso SQLite database with the following tables:

## Categories Table
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  available_from TEXT,
  available_until TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- `available_from` (ISO datetime or `NULL`): the category is locked on the guest menu until this time (live countdown shown).
- `available_until` (ISO datetime or `NULL`): the category closes again at this time.
- Both empty → category is always available.
- `sort_order`: display order on the client/waiter menu (ascending). New categories are appended at the end. Admin can reorder with the ▲/▼ buttons.

## Products Table
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  tags TEXT,
  category_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
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
- Each product can belong to one category (many-to-one)
- Each order can have multiple order items (one-to-many)
- Each order item is linked to one product (many-to-one)
- Foreign key constraints ensure referential integrity