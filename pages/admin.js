import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', tags: '', categoryId: '' });
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      loadProductsOrdersAndCategories();
    }
  }, [status]);

  const loadProductsOrdersAndCategories = async () => {
    try {
      const [productsRes, ordersRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/orders'),
        fetch('/api/categories')
      ]);

      const productsData = await productsRes.json();
      const ordersData = await ordersRes.json();
      const categoriesData = await categoriesRes.json();

      setProducts(productsData);
      setOrders(ordersData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container">
        <Head>
          <title>Admin - Jules Loden</title>
        </Head>
        <div className="panel">
          <h1>Admin Zugang</h1>
          <p>Sie müssen eingeloggt sein, um auf den Admin-Bereich zuzugreifen.</p>
          <Link href="/" className="btn">Zurück zur Startseite</Link>
        </div>
      </div>
    );
  }

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
        alert('Fehler beim Speichern des Produkts');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Fehler beim Speichern des Produkts');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (confirm('Sind Sie sicher, dass Sie dieses Produkt löschen möchten?')) {
      try {
        const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
        if (response.ok) {
          loadProductsAndOrders();
        } else {
          alert('Fehler beim Löschen des Produkts');
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Fehler beim Löschen des Produkts');
      }
    }
  };

  const handleEditProduct = (product) => {
    setNewProduct({
      name: product.name,
      price: product.price?.toString() || '',
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
        ...newCategory
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
        setNewCategory({ name: '', description: '' });
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
          alert('Fehler beim Löschen der Kategorie');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Fehler beim Löschen der Kategorie');
      }
    }
  };

  const handleEditCategory = (category) => {
    setNewCategory({
      name: category.name,
      description: category.description || ''
    });
    setEditingCategory(category);
  };

  const handleCancelCategoryEdit = () => {
    setNewCategory({ name: '', description: '' });
    setEditingCategory(null);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        loadProductsAndOrders();
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
          loadProductsAndOrders();
        } else {
          alert('Fehler beim Löschen der Bestellung');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Fehler beim Löschen der Bestellung');
      }
    }
  };

  const clearDoneOrders = async () => {
    if (confirm('Sind Sie sicher, dass Sie alle erledigten Bestellungen löschen möchten?')) {
      try {
        const doneOrders = orders.filter(order => order.status === 'done');
        const deletePromises = doneOrders.map(order => 
          fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
        );
        
        await Promise.all(deletePromises);
        loadProductsAndOrders();
      } catch (error) {
        console.error('Error clearing done orders:', error);
        alert('Fehler beim Löschen der erledigten Bestellungen');
      }
    }
  };

  const calculatePaymentStats = () => {
    const julesPayOrders = orders.filter(order => order.paymentMethod === 'julespay');
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
        <title>Admin - Jules Loden</title>
        <meta name="description" content="Admin-Bereich für Jules Loden" />
      </Head>

      <header>
        <div className="brand">
          <div className="brand-badge"></div>
          <div>
            <div className="brand-subtitle">Admin-Bereich</div>
            <div className="brand-title">Jules Loden</div>
          </div>
        </div>
        <nav>
          <Link href="/admin" className="btn active">Admin</Link>
          <Link href="/client" className="btn">Bestellen</Link>
          <button onClick={() => signOut()} className="btn">Logout</button>
        </nav>
      </header>

      <main>
        <h1>Admin Dashboard</h1>
        
        <div className="grid grid-2">
          <div className="panel">
            <h2>Eingehende Bestellungen</h2>
            
            <div className="actions" style={{ marginBottom: '8px' }}>
              <button onClick={clearDoneOrders} className="btn warn">Erledigte entfernen</button>
            </div>
            
            <div className="panel" style={{ background: 'rgba(34,211,238, 0.1)', border: '1px solid var(--accent)', marginBottom: '15px' }}>
              <h3 style={{ color: 'var(--accent)', marginTop: 0 }}>Jules Pay Zahlungsstatistik</h3>
              <div>Gesamtzahlungen: <span id="total-payments">{stats.totalPayments}</span> | Gesamtbetrag: <span id="total-amount">{stats.totalAmount}</span> €</div>
            </div>
            
            <div className="order-list">
              {orders.length > 0 ? (
                orders.map(order => (
                  <div key={order.id} className="order-item">
                    <div className="order-header">
                      <strong>{order.customerName}</strong>
                      <div>
                        <span className={`badge ${order.status === 'done' ? 'ok' : order.status === 'in_progress' ? 'warn' : ''}`}>
                          {order.status === 'done' ? 'erledigt' : order.status === 'in_progress' ? 'in Arbeit' : 'offen'}
                        </span>
                        <span className="badge" style={{ marginLeft: '8px' }}>
                          {order.paymentMethod === 'julespay' ? 'Jules Pay' : order.paymentMethod || 'Nicht angegeben'}
                        </span>
                      </div>
                    </div>
                    <div className="muted">Bestellt am {new Date(order.createdAt).toLocaleString('de-DE')}</div>
                    <ul className="inline-list">
                      {order.products?.map(product => (
                        <li key={product.id}>
                          {product.name}{product.price ? ` (${product.price.toFixed(2)} €)` : ''}
                        </li>
                      ))}
                    </ul>
                    <div className="actions">
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
          </div>
          
          <div className="panel">
            <h2>Produkte verwalten</h2>
            <form onSubmit={handleAddProduct}>
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

              <div className="form-row">
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

              <div className="form-group">
                <label htmlFor="product-description">Beschreibung (optional)</label>
                <textarea
                  id="product-description"
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Kurzbeschreibung..."
                ></textarea>
              </div>

              <div className="actions">
                <button type="submit" className="btn primary">
                  {editingProduct ? 'Produkt aktualisieren' : 'Produkt hinzufügen'}
                </button>
                {editingProduct && (
                  <button type="button" onClick={handleCancelEdit} className="btn">Abbrechen</button>
                )}
              </div>
            </form>

            <div className="product-list" style={{ marginTop: '20px' }}>
              <h3>Vorhandene Produkte</h3>
              {products.length > 0 ? (
                products.map(product => (
                  <div key={product.id} className="product-item">
                    <div className="product-header">
                      <strong>{product.name}</strong>
                      {product.price && <span className="badge">{product.price.toFixed(2)} €</span>}
                    </div>
                    {product.categoryName && <div className="muted">Kategorie: {product.categoryName}</div>}
                    {product.description && <div className="muted">{product.description}</div>}
                    {product.tags && <div className="muted">Tags: {product.tags}</div>}
                    <div className="actions">
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

          <div className="panel">
            <h2>Kategorien verwalten</h2>
            <form onSubmit={handleAddCategory}>
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

              <div className="actions">
                <button type="submit" className="btn primary">
                  {editingCategory ? 'Kategorie aktualisieren' : 'Kategorie hinzufügen'}
                </button>
                {editingCategory && (
                  <button type="button" onClick={handleCancelCategoryEdit} className="btn">Abbrechen</button>
                )}
              </div>
            </form>

            <div className="category-list" style={{ marginTop: '20px' }}>
              <h3>Vorhandene Kategorien</h3>
              {categories.length > 0 ? (
                categories.map(category => (
                  <div key={category.id} className="category-item">
                    <div className="category-header">
                      <strong>{category.name}</strong>
                    </div>
                    {category.description && <div className="muted">{category.description}</div>}
                    <div className="muted">Erstellt: {new Date(category.createdAt).toLocaleDateString('de-DE')}</div>
                    <div className="actions">
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
        </div>
      </main>

      <footer className="footer">
        © 2025 Jules Loden • Bestellsystem • Sichere Zahlung • Made with ❤️
      </footer>
    </div>
  );
}