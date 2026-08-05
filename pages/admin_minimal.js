import Head from 'next/head';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { WaveIcon } from '../components/Icons';

export default function AdminPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simplified version to test build
  const loadProductsOrdersAndCategories = async () => {
    setLoading(false);
  };

  useEffect(() => {
    loadProductsOrdersAndCategories();
  }, []);

  return (
    <div className="container">
      <Head>
        <title>Admin - Restaurant am See</title>
        <meta name="description" content="Admin-Bereich für Restaurant am See" />
      </Head>

      <header>
        <div className="brand">
          <div className="brand-badge"><WaveIcon /></div>
          <div>
            <div className="brand-subtitle">Admin-Bereich</div>
            <div className="brand-title">Restaurant am See</div>
          </div>
        </div>
        <nav>
          <Link href="/admin" className="btn active">Admin</Link>
          <Link href="/client" className="btn">Bestellen</Link>
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
          <div className="grid grid-2">
            <div className="panel">
              <h2>Eingehende Bestellungen</h2>
              <div className="order-list">
                <div className="empty">Keine Bestellungen vorhanden</div>
              </div>
            </div>

            <div className="panel">
              <h2>Produkte verwalten</h2>
              <div className="product-list">
                <h3>Vorhandene Produkte</h3>
                <div className="empty">Keine Produkte vorhanden</div>
              </div>
            </div>

            <div className="panel">
              <h2>Kategorien verwalten</h2>
              <div className="category-list">
                <h3>Vorhandene Kategorien</h3>
                <div className="empty">Keine Kategorien vorhanden</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="footer">
        © 2026 Restaurant am See • Bestellsystem • Sichere Zahlung
      </footer>
    </div>
  );
}