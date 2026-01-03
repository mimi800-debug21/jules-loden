import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ClientPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Load products and categories from API with optimized loading
  const loadProductsAndCategories = async () => {
    setLoadingData(true); // Show loading indicator

    try {
      // Use Promise.allSettled to handle both requests independently
      const [productsRes, categoriesRes] = await Promise.allSettled([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);

      // Process products
      if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
        const productsData = await productsRes.value.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
      } else {
        console.error('Error loading products:', productsRes.reason || 'Unknown error');
        setProducts([]);
      }

      // Process categories
      if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
        const categoriesData = await categoriesRes.value.json();
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

        // Initialize expanded state for all categories to false
        const initialExpandedState = {};
        categoriesData.forEach(category => {
          initialExpandedState[category.id] = false;
        });
        setExpandedCategories(initialExpandedState);
      } else {
        console.error('Error loading categories:', categoriesRes.reason || 'Unknown error');
        setCategories([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setProducts([]);
      setCategories([]);
    } finally {
      setLoadingData(false); // Hide loading indicator
    }
  };

  useEffect(() => {
    loadProductsAndCategories();

    // Set up auto-refresh every 5 minutes (300000 milliseconds)
    const interval = setInterval(loadProductsAndCategories, 300000);

    return () => clearInterval(interval);
  }, []);

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      if (prev[productId]) {
        const newSelected = { ...prev };
        delete newSelected[productId];
        return newSelected;
      } else {
        return { ...prev, [productId]: 1 }; // Default quantity is 1
      }
    });
  };

  const updateProductQuantity = (productId, quantity) => {
    if (quantity < 1) {
      // If quantity is less than 1, remove the product
      setSelectedProducts(prev => {
        const newSelected = { ...prev };
        delete newSelected[productId];
        return newSelected;
      });
    } else {
      setSelectedProducts(prev => ({
        ...prev,
        [productId]: quantity
      }));
    }
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();

    if (Object.keys(selectedProducts).length === 0) {
      alert('Bitte wählen Sie mindestens ein Gericht aus.');
      return;
    }

    if (!customerName.trim()) {
      alert('Bitte geben Sie Ihren Namen ein.');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmOrder = async () => {
    setShowConfirmation(false);
    setShowLoading(true);

    try {
      // Get selected product details with quantities
      const selectedProductDetails = [];
      let total = 0;

      for (const [productId, quantity] of Object.entries(selectedProducts)) {
        const product = products.find(p => p.id === parseInt(productId));
        if (product) {
          const itemTotal = (product.price || 0) * quantity;
          selectedProductDetails.push({
            ...product,
            quantity: quantity,
            itemTotal: itemTotal
          });
          total += itemTotal;
        }
      }

      // Create order
      const orderData = {
        customerName,
        deliveryAddress: deliveryAddress.trim() || null, // Send null if empty
        products: selectedProductDetails.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        total,
        status: 'open',
        paymentMethod: 'julespay'
      };

      // Send order to API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (response.ok) {
        setShowLoading(false);
        setShowSuccess(true);
        // Reset form
        setSelectedProducts({});
        setCustomerName('');
        setDeliveryAddress('');
      } else {
        const errorData = await response.json();
        console.error('Error placing order:', errorData);
        alert('Fehler beim Senden der Bestellung. Bitte versuchen Sie es erneut.');
        setShowLoading(false);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Fehler beim Senden der Bestellung. Bitte versuchen Sie es erneut.');
      setShowLoading(false);
    }
  };

  // Calculate selected products and total
  const selectedProductDetails = [];
  let total = 0;

  for (const [productId, quantity] of Object.entries(selectedProducts)) {
    const product = products.find(p => p.id === parseInt(productId));
    if (product) {
      const itemTotal = (product.price || 0) * quantity;
      selectedProductDetails.push({
        ...product,
        quantity: quantity,
        itemTotal: itemTotal
      });
      total += itemTotal;
    }
  }

  // Group products by category
  const productsByCategory = {};
  products.forEach(product => {
    const categoryId = product.categoryId;
    const categoryName = product.categoryName || 'Ohne Kategorie';

    if (!productsByCategory[categoryId]) {
      productsByCategory[categoryId] = {
        name: categoryName,
        products: []
      };
    }
    productsByCategory[categoryId].products.push(product);
  });

  return (
    <div className="container">
      <Head>
        <title>Bestellen - Jules Loden</title>
        <meta name="description" content="Bestellen Sie bei Jules Loden" />
      </Head>

      <header className="main-header">
        <div className="brand">
          <div className="brand-badge"></div>
          <div>
            <div className="brand-subtitle">Online Bestellsystem</div>
            <div className="brand-title">Jules Loden</div>
          </div>
        </div>
        <nav>
          <Link href="/client" className="btn active">Bestellen</Link>
          <Link href="/" className="btn">Home</Link>
        </nav>
      </header>

      <main>
        <h1 className="page-title">Bestellen bei Jules Loden</h1>

        <div className="main-grid">
          <div className="products-panel">
            <h2 className="section-title">1) Kategorie wählen</h2>

            {loadingData ? (
              <div className="loading-data">
                <div className="spinner"></div>
                <p>Produkte werden geladen...</p>
              </div>
            ) : (
              <div className="categories-container">
                {categories.map(category => {
                  const categoryProducts = products.filter(p => p.categoryId === category.id);
                  const isExpanded = expandedCategories[category.id] || false;

                  return (
                    <div key={category.id} className="category-card">
                      <div
                        className="category-header"
                        onClick={() => toggleCategory(category.id)}
                      >
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
                                  {selectedProducts[product.id] && (
                                    <div className="product-quantity">
                                      <button
                                        className="btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateProductQuantity(product.id, selectedProducts[product.id] - 1);
                                        }}
                                      >
                                        -
                                      </button>
                                      <span className="quantity">{selectedProducts[product.id]}</span>
                                      <button
                                        className="btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateProductQuantity(product.id, selectedProducts[product.id] + 1);
                                        }}
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                  {!selectedProducts[product.id] && (
                                    <div className="product-select">
                                      <input
                                        type="checkbox"
                                        checked={false}
                                        onChange={() => {}}
                                        className="product-checkbox"
                                      />
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

                {/* Show products without category if any exist */}
                {products.filter(p => !p.categoryId).length > 0 && (
                  <div className="category-card">
                    <div
                      className="category-header"
                      onClick={() => toggleCategory('uncategorized')}
                    >
                      <h3 className="category-name">Ohne Kategorie</h3>
                      <div className="category-toggle">
                        <span className={`toggle-icon ${expandedCategories['uncategorized'] ? 'expanded' : ''}`}>▼</span>
                      </div>
                    </div>

                    {expandedCategories['uncategorized'] && (
                      <div className="category-products">
                        <div className="product-grid">
                          {products.filter(p => !p.categoryId).map(product => (
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
                              {selectedProducts[product.id] && (
                                <div className="product-quantity">
                                  <button
                                    className="btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateProductQuantity(product.id, selectedProducts[product.id] - 1);
                                    }}
                                  >
                                    -
                                  </button>
                                  <span className="quantity">{selectedProducts[product.id]}</span>
                                  <button
                                    className="btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateProductQuantity(product.id, selectedProducts[product.id] + 1);
                                    }}
                                  >
                                    +
                                  </button>
                                </div>
                              )}
                              {!selectedProducts[product.id] && (
                                <div className="product-select">
                                  <input
                                    type="checkbox"
                                    checked={false}
                                    onChange={() => {}}
                                    className="product-checkbox"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="order-panel">
            <h2 className="section-title">2) Bestelldetails</h2>
            <form onSubmit={handleOrderSubmit}>
              <div className="form-group">
                <label htmlFor="customer-name">Ihr Name</label>
                <input
                  type="text"
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Max Mustermann"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="delivery-address">Lieferadresse (optional)</label>
                <input
                  type="text"
                  id="delivery-address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Musterstraße 123, 12345 Musterstadt"
                />
              </div>

              <div className="order-summary">
                <h3>Ihre Bestellung</h3>
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
                <button type="submit" className="btn primary" disabled={Object.keys(selectedProducts).length === 0 || !customerName.trim()}>
                  Zur Kasse
                </button>
                <Link href="/" className="btn">Abbrechen</Link>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h2>Zahlung bestätigen</h2>
            <p>Möchten Sie diese Bestellung wirklich tätigen?</p>

            <div className="order-summary">
              <p><strong>Bestellung:</strong> {selectedProductDetails.map(p => `${p.quantity}x ${p.name}`).join(', ')}</p>
              <p><strong>Gesamtbetrag:</strong> {total.toFixed(2)} €</p>
              <p><strong>Name:</strong> {customerName}</p>
              {deliveryAddress && <p><strong>Lieferadresse:</strong> {deliveryAddress}</p>}
              <p><strong>Zahlungsmethode:</strong> Jules Pay</p>
            </div>

            <div className="modal-actions">
              <button onClick={confirmOrder} className="btn primary">Bestellen</button>
              <button onClick={() => setShowConfirmation(false)} className="btn">Abbrechen</button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {showLoading && (
        <div className="loading-screen">
          <div className="spinner"></div>
          <h2>Zahlung wird verarbeitet...</h2>
          <p>Ihre Bestellung wird sicher übermittelt</p>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="success-message">
          <div className="success-icon">🎉</div>
          <h2>Bestellung erfolgreich aufgegeben!</h2>
          <p>Ihre Bestellung wurde erfolgreich übermittelt.</p>
          <p>Jules Pay Zahlung bestätigt</p>

          {/* Advertisement for bringlymit.de - shown after successful purchase */}
          <div className="advertisement">
            <div className="ad-content">
              <h3>Perfekt für Ihre nächste Party! 🎉</h3>
              <p>Die einfache Mitbring-Liste für Ihre nächste Veranstaltung:</p>
              <a href="https://bringlymit.de" target="_blank" rel="noopener noreferrer" className="ad-link">
                <strong>bringlymit.de</strong>
              </a>
              <p className="ad-description">Keine Anmeldung. Einfach Link teilen. Alle tragen ein, was sie mitbringen.</p>
            </div>
          </div>

          <button onClick={() => setShowSuccess(false)} className="btn">Weiter einkaufen</button>
        </div>
      )}

      <footer className="footer">
        © 2025 Jules Loden • Bestellsystem • Sichere Zahlung • Made with ❤️
      </footer>
    </div>
  );
}