import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WaveIcon, LockIcon } from '../components/Icons';
import { formatSchedule } from '../lib/availability';

const EMPTY_CATEGORY = { name: '', description: '', availableFrom: '', availableUntil: '' };

const toIso = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', tags: '', categoryId: '' });
  const [newCategory, setNewCategory] = useState(EMPTY_CATEGORY);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load products, orders and categories from API
  const loadProductsOrdersAndCategories = async () => {
    try {
      const [productsRes, ordersRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/categories')
      ]);

      // Only update state if requests were successful
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        console.error('Error fetching products:', await productsRes.text());
        setProducts([]);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } else {
        console.error('Error fetching orders:', await ordersRes.text());
        setOrders([]);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      } else {
        console.error('Error fetching categories:', await categoriesRes.text());
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays as fallback
      setProducts([]);
      setOrders([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductsOrdersAndCategories();

    // Set up auto-refresh every 5 seconds for admin panel
    const interval = setInterval(loadProductsOrdersAndCategories, 5000);

    return () => clearInterval(interval);
  }, []);


  const handleAddProduct = async (e) => {
    e.preventDefault();

    try {
      const productData = {
        ...newProduct,
        price: parseFloat(newProduct.price) || 0,
        categoryId: newProduct.categoryId ? parseInt(newProduct.categoryId) : null
      };

      const response = editingProduct
        ? await fetch(`/api/products/${editingProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          })
        : await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productData)
          });

      if (response.ok) {
        setNewProduct({ name: '', price: '', description: '', tags: '', categoryId: '' });
        setEditingProduct(null);
        loadProductsOrdersAndCategories();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Fehler beim Speichern des Produkts: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Fehler beim Speichern des Produkts: ' + (error.message || 'Verbindung fehlgeschlagen'));
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('Sind Sie sicher, dass Sie dieses Produkt löschen möchten?')) {
      try {
        const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (response.ok) {
          loadProductsOrdersAndCategories();
        } else {
          const errorData = await response.json();
          console.error('Error deleting product:', errorData);
          alert(`Fehler beim Löschen des Produkts: ${errorData.error || 'Unbekannter Fehler'}`);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Fehler beim Löschen des Produkts: Verbindung fehlgeschlagen');
      }
    }
  };

  const handleEditProduct = (product) => {
    setNewProduct({
      name: product.name,
      price: product.price ? product.price.toString() : '',
      description: product.description || '',
      tags: product.tags || '',
      categoryId: product.categoryId || ''
    });
    setEditingProduct(product);
  };

  const handleCancelEdit = () => {
    setNewProduct({ name: '', price: '', description: '', tags: '', categoryId: '' });
    setEditingProduct(null);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();

    try {
      const categoryData = {
        name: newCategory.name,
        description: newCategory.description,
        availableFrom: toIso(newCategory.availableFrom),
        availableUntil: toIso(newCategory.availableUntil)
      };

      const response = editingCategory
        ? await fetch(`/api/categories/${editingCategory.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
          })
        : await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
          });

      if (response.ok) {
        setNewCategory(EMPTY_CATEGORY);
        setEditingCategory(null);
        loadProductsOrdersAndCategories();
      } else {
        alert('Fehler beim Speichern der Kategorie');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Fehler beim Speichern der Kategorie');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (confirm('Sind Sie sicher, dass Sie diese Kategorie löschen möchten?')) {
      try {
        const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        if (response.ok) {
          loadProductsOrdersAndCategories();
        } else {
          const errorData = await response.json();
          console.error('Error deleting category:', errorData);
          alert(`Fehler beim Löschen der Kategorie: ${errorData.error || 'Unbekannter Fehler'}`);
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Fehler beim Löschen der Kategorie: Verbindung fehlgeschlagen');
      }
    }
  };

  const handleEditCategory = (category) => {
    setNewCategory({
      name: category.name,
      description: category.description || '',
      availableFrom: toLocalInput(category.availableFrom),
      availableUntil: toLocalInput(category.availableUntil)
    });
    setEditingCategory(category);
  };

  const handleCancelCategoryEdit = () => {
    setNewCategory(EMPTY_CATEGORY);
    setEditingCategory(null);
  };

  const moveCategory = async (index, direction) => {
    const next = [...categories];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];

    try {
      const updates = next.map((c, i) =>
        fetch(`/api/categories/${c.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: c.name,
            description: c.description || '',
            availableFrom: c.availableFrom,
            availableUntil: c.availableUntil,
            sortOrder: i,
          }),
        })
      );
      const results = await Promise.all(updates);
      if (results.every((r) => r.ok)) {
        loadProductsOrdersAndCategories();
      } else {
        alert('Fehler beim Speichern der Reihenfolge');
      }
    } catch (error) {
      console.error('Error reordering categories:', error);
      alert('Fehler beim Speichern der Reihenfolge');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        loadProductsOrdersAndCategories();
      } else {
        alert('Fehler beim Aktualisieren des Status');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Fehler beim Aktualisieren des Status');
    }
  };

  const deleteOrder = async (orderId) => {
    if (confirm('Sind Sie sicher, dass Sie diese Bestellung löschen möchten?')) {
      try {
        const response = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
        if (response.ok) {
          loadProductsOrdersAndCategories();
        } else {
          const errorData = await response.json();
          console.error('Error deleting order:', errorData);
          alert(`Fehler beim Löschen der Bestellung: ${errorData.error || 'Unbekannter Fehler'}`);
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Fehler beim Löschen der Bestellung: Verbindung fehlgeschlagen');
      }
    }
  };

  const clearDoneOrders = async () => {
    if (confirm('Sind Sie sicher, dass Sie alle erledigten Bestellungen löschen möchten?')) {
      try {
        const doneOrders = Array.isArray(orders) ? orders.filter(order => order.status === 'done') : [];
        const deletePromises = doneOrders.map(order =>
          fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
        );

        await Promise.all(deletePromises);
        loadProductsOrdersAndCategories();
      } catch (error) {
        console.error('Error clearing done orders:', error);
        alert('Fehler beim Löschen der erledigten Bestellungen');
      }
    }
  };

  const calculatePaymentStats = () => {
    const julesPayOrders = Array.isArray(orders) ? orders.filter(order => order.paymentMethod === 'julespay') : [];
    const totalAmount = julesPayOrders.reduce((sum, order) => {
      return sum + (order.total || 0);
    }, 0);

    return {
      totalPayments: julesPayOrders.length,
      totalAmount: totalAmount.toFixed(2)
    };
  };

  const stats = calculatePaymentStats();

  return (
    <div className="container">
      <Head>
        <title>Admin - Restaurant am Teich</title>
        <meta name="description" content="Admin-Bereich für Restaurant am Teich" />
      </Head>

      <header>
        <div className="brand">
          <div className="brand-badge"><WaveIcon /></div>
          <div>
            <div className="brand-subtitle">Admin-Bereich</div>
            <div className="brand-title">Restaurant am Teich</div>
          </div>
        </div>
        <nav>
          <Link href="/admin" className="btn active">Admin</Link>
          <Link href="/client" className="btn">Bestellen</Link>
          <Link href="/waiter" className="btn">Bedienung</Link>
        </nav>
      </header>

      <main>
        <h1>Admin Dashboard</h1>

        {loading ? (
          <div className="loading-data">
            <div className="spinner"></div>
            <p>Daten werden geladen...</p>
          </div>
        ) : (
          <div className="admin-layout">
            <div className="admin-sidebar">
              <nav className="admin-nav">
                <a href="#orders" className="nav-link active">Bestellungen</a>
                <a href="#products" className="nav-link">Produkte</a>
                <a href="#categories" className="nav-link">Kategorien</a>
              </nav>
            </div>

            <div className="admin-content">
              <section id="orders" className="admin-section">
                <div className="section-header">
                  <h2>Eingehende Bestellungen</h2>
                  <div className="section-actions">
                    <button onClick={clearDoneOrders} className="btn warn">Erledigte entfernen</button>
                  </div>
                </div>

                <div className="stats-card">
                  <h3>Zahlungsstatistik</h3>
                  <div className="stats-values">
                    <div className="stat-item">
                      <span className="stat-label">Gesamtzahlungen:</span>
                      <span className="stat-value">{stats.totalPayments}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Gesamtbetrag:</span>
                      <span className="stat-value">{stats.totalAmount} €</span>
                    </div>
                  </div>
                </div>

                <div className="order-list">
                  {orders.length > 0 ? (
                    orders.map(order => (
                      <div key={order.id} className="order-item">
                        <div className="order-header">
                          <div className="order-info">
                            <strong>{order.customerName}</strong>
                            {order.waiterName && <div className="order-meta" style={{ color: 'var(--accent)', marginTop: 4 }}>Bedienung {order.waiterName} hat das in Auftrag gegeben</div>}
                            <div className="order-meta">
                              Bestellt am {new Date(order.createdAt).toLocaleString('de-DE')}
                            </div>
                          </div>
                          <div className="order-statuses">
                            {(() => {
                              const statusClass = order.status === 'done' ? 'ok' : order.status === 'in_progress' ? 'warn' : '';
                              const statusText = order.status === 'done' ? 'erledigt' : order.status === 'in_progress' ? 'in Arbeit' : 'offen';
                              return <span className={`badge ${statusClass}`}>{statusText}</span>;
                            })()}
                            <span className="badge">
                              {order.paymentMethod === 'julespay' ? 'Online-Zahlung' : (order.paymentMethod || 'Nicht angegeben')}
                            </span>
                          </div>
                        </div>

                        <div className="order-products">
                          <ul>
                            {order.products && order.products.map(product => (
                              <li key={product.id}>
                                {product.quantity || 1}x {product.name}{product.price ? ` (${product.price.toFixed(2)} €)` : ''}
                              </li>
                            ))}
                          </ul>
                          {order.deliveryAddress && (
                            <div className="delivery-address">
                              <strong>Lieferadresse:</strong> {order.deliveryAddress}
                            </div>
                          )}
                        </div>

                        <div className="order-actions">
                          <button
                            onClick={() => updateOrderStatus(order.id, 'in_progress')}
                            className="btn ok"
                          >
                            In Arbeit
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'done')}
                            className="btn warn"
                          >
                            Abhaken (erledigt)
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.id, 'open')}
                            className="btn primary"
                          >
                            Zurück auf 'offen'
                          </button>
                          <button
                            onClick={() => deleteOrder(order.id)}
                            className="btn danger"
                          >
                            Löschen
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty">Keine Bestellungen vorhanden</div>
                  )}
                </div>
              </section>

              <section id="products" className="admin-section">
                <div className="section-header">
                  <h2>Produkte verwalten</h2>
                </div>

                <div className="form-container">
                  <form onSubmit={handleAddProduct} className="product-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="product-name">Produktname</label>
                        <input
                          type="text"
                          id="product-name"
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                          placeholder="z. B. Spaghetti Bolognese"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="product-price">Preis (€)</label>
                        <input
                          type="number"
                          id="product-price"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                          placeholder="9.90"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="product-category">Kategorie</label>
                        <select
                          id="product-category"
                          value={newProduct.categoryId}
                          onChange={(e) => setNewProduct({...newProduct, categoryId: e.target.value || ''})}
                        >
                          <option value="">Ohne Kategorie</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="product-tags">Tags (optional)</label>
                        <input
                          type="text"
                          id="product-tags"
                          value={newProduct.tags}
                          onChange={(e) => setNewProduct({...newProduct, tags: e.target.value})}
                          placeholder="vegan, scharf, ..."
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="product-description">Beschreibung (optional)</label>
                      <textarea
                        id="product-description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                        placeholder="Kurzbeschreibung..."
                      ></textarea>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn primary">
                        {editingProduct ? 'Produkt aktualisieren' : 'Produkt hinzufügen'}
                      </button>
                      {editingProduct && (
                        <button type="button" onClick={handleCancelEdit} className="btn">Abbrechen</button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="section-content">
                  <h3>Vorhandene Produkte</h3>
                  <div className="product-list">
                    {products.length > 0 ? (
                      products.map(product => (
                        <div key={product.id} className="product-item">
                          <div className="product-info">
                            <div className="product-header">
                              <strong>{product.name}</strong>
                              {product.price && <span className="badge">{product.price.toFixed(2)} €</span>}
                            </div>
                            {product.categoryName && <div className="muted">Kategorie: {product.categoryName}</div>}
                            {product.description && <div className="muted">{product.description}</div>}
                            {product.tags && <div className="muted">Tags: {product.tags}</div>}
                          </div>
                          <div className="product-actions">
                            <button onClick={() => handleEditProduct(product)} className="btn primary">Bearbeiten</button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="btn danger">Löschen</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty">Keine Produkte vorhanden</div>
                    )}
                  </div>
                </div>
              </section>

              <section id="categories" className="admin-section">
                <div className="section-header">
                  <h2>Kategorien verwalten</h2>
                </div>

                <div className="form-container">
                  <form onSubmit={handleAddCategory} className="category-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="category-name">Kategoriename</label>
                        <input
                          type="text"
                          id="category-name"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                          placeholder="z. B. Lebensmittel"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="category-description">Beschreibung (optional)</label>
                        <textarea
                          id="category-description"
                          value={newCategory.description}
                          onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                          placeholder="Beschreibung der Kategorie..."
                        ></textarea>
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="category-available-from">Frei ab (optional)</label>
                        <input
                          type="datetime-local"
                          id="category-available-from"
                          value={newCategory.availableFrom}
                          onChange={(e) => setNewCategory({...newCategory, availableFrom: e.target.value})}
                        />
                        <div className="muted" style={{ marginTop: 4 }}>Kategorie öffnet automatisch um diese Uhrzeit.</div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="category-available-until">Frei bis (optional)</label>
                        <input
                          type="datetime-local"
                          id="category-available-until"
                          value={newCategory.availableUntil}
                          onChange={(e) => setNewCategory({...newCategory, availableUntil: e.target.value})}
                        />
                        <div className="muted" style={{ marginTop: 4 }}>Kategorie schließt automatisch um diese Uhrzeit.</div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn primary">
                        {editingCategory ? 'Kategorie aktualisieren' : 'Kategorie hinzufügen'}
                      </button>
                      {editingCategory && (
                        <button type="button" onClick={handleCancelCategoryEdit} className="btn">Abbrechen</button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="section-content">
                  <h3>Vorhandene Kategorien</h3>
                  <div className="category-list">
                    {categories.length > 0 ? (
                      categories.map((category, index) => (
                        <div key={category.id} className="category-item">
                          <div className="category-reorder">
                            <button
                              type="button"
                              className="reorder-btn"
                              onClick={() => moveCategory(index, -1)}
                              disabled={index === 0}
                              aria-label={`${category.name} nach oben`}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className="reorder-btn"
                              onClick={() => moveCategory(index, 1)}
                              disabled={index === categories.length - 1}
                              aria-label={`${category.name} nach unten`}
                            >
                              ▼
                            </button>
                          </div>
                          <div className="category-info">
                            <div className="category-header">
                              <strong>{category.name}</strong>
                            </div>
                            {category.description && <div className="muted">{category.description}</div>}
                            <div className="muted">Erstellt: {new Date(category.createdAt).toLocaleDateString('de-DE')}</div>
                            <div className="muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {(category.availableFrom || category.availableUntil) && <LockIcon size={14} />}
                              {formatSchedule(category.availableFrom, category.availableUntil)}
                            </div>
                          </div>
                          <div className="category-actions">
                            <button onClick={() => handleEditCategory(category)} className="btn primary">Bearbeiten</button>
                            <button onClick={() => handleDeleteCategory(category.id)} className="btn danger">Löschen</button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="empty">Keine Kategorien vorhanden</div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        © 2026 Restaurant am Teich • Bestellsystem • Sichere Zahlung
      </footer>
    </div>
  );
}