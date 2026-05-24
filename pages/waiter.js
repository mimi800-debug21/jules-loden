import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WaiterPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [waiterName, setWaiterName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [orders, setOrders] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, ordersRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/orders')
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(Array.isArray(data) ? data : []);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(Array.isArray(data) ? data : []);
        const initialExpandedState = {};
        data.forEach(category => { initialExpandedState[category.id] = false; });
        setExpandedCategories(initialExpandedState);
      }

      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      if (prev[productId]) {
        const newSelected = { ...prev };
        delete newSelected[productId];
        return newSelected;
      } else {
        return { ...prev, [productId]: 1 };
      }
    });
  };

  const updateProductQuantity = (productId, quantity) => {
    if (quantity < 1) {
      setSelectedProducts(prev => {
        const newSelected = { ...prev };
        delete newSelected[productId];
        return newSelected;
      });
    } else {
      setSelectedProducts(prev => ({ ...prev, [productId]: quantity }));
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();

    if (Object.keys(selectedProducts).length === 0) {
      alert('Bitte wählen Sie mindestens ein Gericht aus.');
      return;
    }

    if (!customerName.trim()) {
      alert('Bitte geben Sie den Kundennamen ein.');
      return;
    }

    if (!waiterName.trim()) {
      alert('Bitte geben Sie Ihren Namen als Bedienung ein.');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    setShowConfirmation(false);
    setShowLoading(true);

    try {
      const selectedProductDetails = [];
      let total = 0;

      for (const [productId, quantity] of Object.entries(selectedProducts)) {
        const product = products.find(p => p.id === parseInt(productId));
        if (product) {
          const itemTotal = (product.price || 0) * quantity;
          selectedProductDetails.push({ ...product, quantity, itemTotal });
          total += itemTotal;
        }
      }

      const orderData = {
        customerName,
        waiterName,
        products: selectedProductDetails.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total,
        status: 'open',
        paymentMethod: 'julespay'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        setShowLoading(false);
        setShowSuccess(true);
        setSelectedProducts({});
        setCustomerName('');
        loadData();
      } else {
        alert('Fehler beim Senden der Bestellung.');
        setShowLoading(false);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Fehler beim Senden der Bestellung.');
      setShowLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) loadData();
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const statusText = (s) => s === 'done' ? 'Erledigt' : s === 'in_progress' ? 'In Arbeit' : 'Offen';
  const statusClass = (s) => s === 'done' ? 'ok' : s === 'in_progress' ? 'warn' : '';

  const selectedProductDetails = [];
  let total = 0;
  for (const [productId, quantity] of Object.entries(selectedProducts)) {
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      const itemTotal = (product.price || 0) * quantity;
      selectedProductDetails.push({ ...product, quantity, itemTotal });
      total += itemTotal;
    }
  }

  const productsByCategory = {};
  products.forEach(product => {
    const catId = product.categoryId;
    const catName = product.categoryName || 'Ohne Kategorie';
    if (!productsByCategory[catId]) productsByCategory[catId] = { name: catName, products: [] };
    productsByCategory[catId].products.push(product);
  });

  const openOrders = orders.filter(o => o.status === 'open');
  const inProgressOrders = orders.filter(o => o.status === 'in_progress');

  return (
    <div className="container">
      <Head>
        <title>Bedienung - Jules Loden</title>
        <meta name="description" content="Bedienungsbereich für Jules Loden" />
      </Head>

      <header className="main-header">
        <div className="brand">
          <div className="brand-badge"></div>
          <div>
            <div className="brand-subtitle">Bedienungsbereich</div>
            <div className="brand-title">Jules Loden</div>
          </div>
        </div>
        <nav>
          <Link href="/waiter" className="btn active">Bestellung aufnehmen</Link>
          <Link href="/client" className="btn">Gast bestellt selbst</Link>
          <Link href="/" className="btn">Home</Link>
        </nav>
      </header>

      <main>
        <h1 className="page-title">Bestellung für Gast aufnehmen</h1>

        {loadingData ? (
          <div className="loading-data">
            <div className="spinner"></div>
            <p>Daten werden geladen...</p>
          </div>
        ) : (
          <>
            <div className="main-grid">
              <div className="products-panel">
                <h2 className="section-title">1) Kategorie wählen</h2>

                <div className="categories-container">
                  {categories.map(category => {
                    const categoryProducts = products.filter(p => p.categoryId === category.id);
                    const isExpanded = expandedCategories[category.id] || false;

                    return (
                      <div key={category.id} className="category-card">
                        <div className="category-header" onClick={() => toggleCategory(category.id)}>
                          <h3 className="category-name">{category.name}</h3>
                          <div className="category-toggle">
                            <span className={`toggle-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="category-products">
                            {categoryProducts.length > 0 ? (
                              <div className="product-grid">
                                {categoryProducts.map(product => (
                                  <div
                                    key={product.id}
                                    className={`product-card ${selectedProducts[product.id] ? 'selected' : ''}`}
                                    onClick={() => toggleProductSelection(product.id)}
                                  >
                                    <div className="product-info">
                                      <h4 className="product-name">{product.name}</h4>
                                      <p className="product-desc">{product.description}</p>
                                      <p className="product-price">{product.price?.toFixed(2)} €</p>
                                    </div>
                                    {selectedProducts[product.id] ? (
                                      <div className="product-quantity">
                                        <button className="btn" onClick={(e) => { e.stopPropagation(); updateProductQuantity(product.id, selectedProducts[product.id] - 1); }}>-</button>
                                        <span className="quantity">{selectedProducts[product.id]}</span>
                                        <button className="btn" onClick={(e) => { e.stopPropagation(); updateProductQuantity(product.id, selectedProducts[product.id] + 1); }}>+</button>
                                      </div>
                                    ) : (
                                      <div className="product-select">
                                        <input type="checkbox" checked={false} onChange={() => {}} className="product-checkbox" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="no-products">Keine Produkte in dieser Kategorie</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="order-panel">
                <h2 className="section-title">2) Bestelldetails</h2>
                <form onSubmit={handleOrderSubmit}>
                  <div className="form-group">
                    <label htmlFor="waiter-name">Ihr Name (Bedienung)</label>
                    <input type="text" id="waiter-name" value={waiterName} onChange={(e) => setWaiterName(e.target.value)} placeholder="z. B. Jule" required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="customer-name">Name des Gastes</label>
                    <input type="text" id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="z. B. Max Mustermann" required />
                  </div>

                  <div className="order-summary">
                    <h3>Bestellübersicht</h3>
                    {selectedProductDetails.length > 0 ? (
                      <ul className="order-items">
                        {selectedProductDetails.map(product => (
                          <li key={product.id} className="order-item">
                            {product.quantity}x {product.name} - {product.price?.toFixed(2)} € ({product.itemTotal.toFixed(2)} €)
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="no-items">Noch keine Artikel ausgewählt</p>
                    )}
                    <div className="total">
                      <strong>Gesamt: {total.toFixed(2)} €</strong>
                    </div>
                  </div>

                  <div className="actions">
                    <button type="submit" className="btn primary" disabled={Object.keys(selectedProducts).length === 0 || !customerName.trim() || !waiterName.trim()}>
                      Bestellung aufgeben
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="admin-section" style={{ marginTop: 24 }}>
              <div className="section-header">
                <h2>Offene Bestellungen ({openOrders.length + inProgressOrders.length})</h2>
              </div>
              <div className="order-list">
                {[...openOrders, ...inProgressOrders].length > 0 ? (
                  [...openOrders, ...inProgressOrders].map(order => (
                    <div key={order.id} className="order-item">
                      <div className="order-header">
                        <div className="order-info">
                          <strong>{order.customerName}</strong>
                          {order.waiterName && <span className="badge" style={{ marginLeft: 8 }}>Bedienung: {order.waiterName}</span>}
                          <div className="order-meta">{new Date(order.createdAt).toLocaleString('de-DE')}</div>
                        </div>
                        <div className="order-statuses">
                          <span className={`badge ${statusClass(order.status)}`}>{statusText(order.status)}</span>
                        </div>
                      </div>
                      <div className="order-products">
                        <ul>
                          {order.products && order.products.map(p => (
                            <li key={p.id}>{p.quantity || 1}x {p.name}{p.price ? ` (${p.price.toFixed(2)} €)` : ''}</li>
                          ))}
                        </ul>
                        <div className="total"><strong>Gesamt: {order.total?.toFixed(2)} €</strong></div>
                      </div>
                      <div className="order-actions">
                        {order.status === 'open' && (
                          <button onClick={() => updateOrderStatus(order.id, 'in_progress')} className="btn warn">In Arbeit nehmen</button>
                        )}
                        {order.status === 'in_progress' && (
                          <button onClick={() => updateOrderStatus(order.id, 'done')} className="btn ok">Als erledigt markieren</button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">Keine offenen Bestellungen</div>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h2>Bestellung bestätigen</h2>
            <p>Möchten Sie diese Bestellung aufgeben?</p>
            <div className="order-summary">
              <p><strong>Bedienung:</strong> {waiterName}</p>
              <p><strong>Gast:</strong> {customerName}</p>
              <p><strong>Bestellung:</strong> {selectedProductDetails.map(p => `${p.quantity}x ${p.name}`).join(', ')}</p>
              <p><strong>Gesamtbetrag:</strong> {total.toFixed(2)} €</p>
            </div>
            <div className="modal-actions">
              <button onClick={confirmOrder} className="btn primary">Bestellung aufgeben</button>
              <button onClick={() => setShowConfirmation(false)} className="btn">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {showLoading && (
        <div className="loading-screen">
          <div className="spinner"></div>
          <h2>Bestellung wird übermittelt...</h2>
        </div>
      )}

      {showSuccess && (
        <div className="success-message">
          <div className="success-icon">✅</div>
          <h2>Bestellung erfolgreich aufgegeben!</h2>
          <p>Die Bestellung wurde an die Küche übermittelt.</p>
          <button onClick={() => setShowSuccess(false)} className="btn">Weitere Bestellung aufnehmen</button>
        </div>
      )}

      <footer className="footer">
        © 2025 Jules Loden • Bestellsystem • Sichere Zahlung • Made with ❤️
      </footer>
    </div>
  );
}
