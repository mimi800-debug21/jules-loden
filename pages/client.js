import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ClientPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load products and categories from API
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/categories').then(res => res.json())
    ]).then(([productsData, categoriesData]) => {
      setProducts(productsData);
      setCategories(categoriesData);
    });
  }, []);

  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();

    if (selectedProducts.length === 0) {
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

    // Simulate payment processing
    setTimeout(async () => {
      try {
        // Get selected product details
        const selectedProductDetails = products.filter(p => selectedProducts.includes(p.id));

        // Calculate total
        const total = selectedProductDetails.reduce((sum, product) => sum + (product.price || 0), 0);

        // Create order
        const orderData = {
          customerName,
          products: selectedProductDetails,
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
          setSelectedProducts([]);
          setCustomerName('');
        } else {
          throw new Error('Fehler beim Senden der Bestellung');
        }
      } catch (error) {
        console.error('Error placing order:', error);
        alert('Fehler beim Senden der Bestellung. Bitte versuchen Sie es erneut.');
        setShowLoading(false);
      }
    }, 3000);
  };

  const selectedProductDetails = products.filter(p => selectedProducts.includes(p.id));
  const total = selectedProductDetails.reduce((sum, product) => sum + (product.price || 0), 0);

  // Group products by category
  const productsByCategory = {};
  products.forEach(product => {
    const categoryName = product.categoryName || 'Ohne Kategorie';
    if (!productsByCategory[categoryName]) {
      productsByCategory[categoryName] = [];
    }
    productsByCategory[categoryName].push(product);
  });

  return (
    <div className="container">
      <Head>
        <title>Bestellen - Jules Loden</title>
        <meta name="description" content="Bestellen Sie bei Jules Loden" />
      </Head>

      <header>
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
        <h1>Bestellen bei Jules Loden</h1>

        <div className="grid grid-2">
          <div className="panel">
            <h2>1) Produkt wählen</h2>
            <div className="product-categories">
              {Object.entries(productsByCategory).map(([categoryName, categoryProducts]) => (
                <div key={categoryName} className="category-section">
                  <h3>{categoryName}</h3>
                  <div className="product-list">
                    {categoryProducts.map(product => (
                      <div
                        key={product.id}
                        className={`product-item ${selectedProducts.includes(product.id) ? 'selected' : ''}`}
                        onClick={() => toggleProductSelection(product.id)}
                      >
                        <div className="product-info">
                          <h3>{product.name}</h3>
                          <p className="product-desc">{product.description}</p>
                          <p className="product-price">{product.price?.toFixed(2)} €</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => {}}
                          className="product-checkbox"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h2>2) Bestelldetails</h2>
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

              <div className="order-summary">
                <h3>Ihre Bestellung</h3>
                {selectedProductDetails.length > 0 ? (
                  <ul>
                    {selectedProductDetails.map(product => (
                      <li key={product.id}>
                        {product.name} - {product.price?.toFixed(2)} €
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Noch keine Artikel ausgewählt</p>
                )}
                <div className="total">
                  <strong>Gesamt: {total.toFixed(2)} €</strong>
                </div>
              </div>

              <div className="actions">
                <button type="submit" className="btn primary" disabled={selectedProducts.length === 0 || !customerName.trim()}>
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
              <p><strong>Bestellung:</strong> {selectedProductDetails.map(p => p.name).join(', ')}</p>
              <p><strong>Gesamtbetrag:</strong> {total.toFixed(2)} €</p>
              <p><strong>Name:</strong> {customerName}</p>
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
          <button onClick={() => setShowSuccess(false)} className="btn">Weiter einkaufen</button>
        </div>
      )}

      <footer className="footer">
        © 2025 Jules Loden • Bestellsystem • Sichere Zahlung • Made with ❤️
      </footer>
    </div>
  );
}