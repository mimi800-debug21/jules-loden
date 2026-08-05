import Head from 'next/head';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Stepper from '../components/Stepper';
import CartDrawer from '../components/CartDrawer';
import { useToast } from '../components/Toast';
import { WaveIcon, ClipboardIcon, ChefHatIcon, CheckCircleIcon } from '../components/Icons';
import useCart from '../hooks/useCart';

const STEPS = ['Gerichte', 'Details', 'Bestätigen'];
const euro = (n) => `${(n || 0).toFixed(2).replace('.', ',')} €`;

export default function WaiterPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [view, setView] = useState('new');
  const [step, setStep] = useState(0);
  const [waiterName, setWaiterName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flashId, setFlashId] = useState(null);
  const [bumpId, setBumpId] = useState(null);
  const [barBump, setBarBump] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [guestTouched, setGuestTouched] = useState(false);
  const prevOpenCount = useRef(-1);

  const toast = useToast();
  const cart = useCart(products);

  const loadProductsAndCategories = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(Array.isArray(data) ? data : []);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error);
      toast.error('Daten konnten nicht geladen werden.');
    } finally {
      setLoadingData(false);
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);

      const openCount = list.filter(
        (o) => o.status === 'open' || o.status === 'in_progress'
      ).length;
      if (prevOpenCount.current !== -1 && openCount > prevOpenCount.current) {
        toast.success('Neue Bestellung eingegangen!');
      }
      prevOpenCount.current = openCount;
    } catch (error) {
      console.error('Fehler beim Laden der Bestellungen:', error);
    }
  };

  useEffect(() => {
    loadProductsAndCategories();
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupedProducts = useMemo(
    () =>
      categories
        .map((category) => ({
          category,
          items: products.filter((p) => p.categoryId === category.id),
        }))
        .filter((group) => group.items.length > 0),
    [categories, products]
  );

  const handleAdd = (productId) => {
    cart.add(productId);
    setFlashId(productId);
    setBumpId(productId);
    setBarBump(true);
    setTimeout(() => setFlashId((id) => (id === productId ? null : id)), 600);
    setTimeout(() => setBumpId((id) => (id === productId ? null : id)), 300);
    setTimeout(() => setBarBump(false), 350);
  };

  const nextStep = () => {
    if (step === 0 && cart.count === 0) {
      toast.info('Bitte wählen Sie mindestens ein Gericht.');
      return;
    }
    if (step === 1 && !waiterName.trim()) {
      setNameTouched(true);
      toast.error('Bitte geben Sie Ihren Namen als Bedienung ein.');
      return;
    }
    if (step === 1 && !customerName.trim()) {
      setGuestTouched(true);
      toast.error('Bitte geben Sie den Namen des Gastes ein.');
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const submitOrder = async () => {
    if (cart.count === 0) {
      toast.error('Bitte wählen Sie mindestens ein Gericht.');
      return;
    }
    if (!waiterName.trim() || !customerName.trim()) {
      setNameTouched(true);
      setGuestTouched(true);
      toast.error('Bitte füllen Sie alle Angaben aus.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          waiterName: waiterName.trim(),
          products: cart.lines.map((l) => ({ id: l.id, quantity: l.qty, price: l.price })),
          total: cart.total,
          status: 'open',
          paymentMethod: 'julespay',
        }),
      });

      if (res.ok) {
        setSubmitting(false);
        cart.clear();
        setCustomerName('');
        setStep(0);
        setDrawerOpen(false);
        toast.success('Bestellung wurde an die Küche übermittelt.');
        await loadOrders();
        setView('board');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Fehler beim Senden der Bestellung.');
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Fehler beim Aufgeben der Bestellung:', error);
      toast.error('Verbindung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      setSubmitting(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadOrders();
      } else {
        toast.error('Status konnte nicht geändert werden.');
      }
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error);
      toast.error('Verbindung fehlgeschlagen.');
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
      if (res.ok) {
        loadOrders();
        toast.info('Bestellung gelöscht.');
      } else {
        toast.error('Bestellung konnte nicht gelöscht werden.');
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      toast.error('Verbindung fehlgeschlagen.');
    }
  };

  const canProceed =
    (step === 0 && cart.count > 0) ||
    (step === 1 && waiterName.trim().length > 0 && customerName.trim().length > 0) ||
    step === 2;

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="step-view" key="step-0">
          <h1 className="step-title">Gerichte auswählen</h1>
          <p className="step-hint">Wählen Sie die Gerichte und stellen Sie die Mengen mit + und − ein.</p>

          {groupedProducts.map((group) => (
            <section key={group.category.id} className="menu-group">
              <h2 className="menu-group-title">{group.category.name}</h2>
              <div className="product-grid">
                {group.items.map((product, i) => {
                  const qty = cart.items[product.id] || 0;
                  return (
                    <div
                      key={product.id}
                      className={`product-card ${flashId === product.id ? 'flash' : ''}`}
                      style={{ animationDelay: `${i * 0.04}s` }}
                    >
                      <div className="product-info">
                        <div className="product-name">{product.name}</div>
                        {product.description && <div className="product-desc">{product.description}</div>}
                        <div className="product-price">{euro(product.price)}</div>
                      </div>
                      {qty === 0 ? (
                        <button type="button" className="add-btn" onClick={() => handleAdd(product.id)}>
                          + Hinzufügen
                        </button>
                      ) : (
                        <div className="qty-stepper">
                          <button
                            type="button"
                            className="qty-btn minus"
                            onClick={() => cart.remove(product.id)}
                            aria-label={`${product.name} weniger`}
                          >
                            −
                          </button>
                          <span className="qty-value">{qty}</span>
                          <button
                            type="button"
                            className={`qty-btn plus ${bumpId === product.id ? 'bump' : ''}`}
                            onClick={() => handleAdd(product.id)}
                            aria-label={`${product.name} mehr`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          <div className="step-actions">
            <button type="button" className="btn btn-primary" onClick={nextStep} disabled={!canProceed}>
              Weiter zur Bestellung
            </button>
          </div>
        </div>
      );
    }
    if (step === 1) {
      return (
        <div className="step-view" key="step-1">
          <h1 className="step-title">Bestelldetails</h1>
          <p className="step-hint">Nur wenige Angaben — dann ist die Bestellung bereit.</p>

          <div className="inline-cart">
            <div className="inline-cart-title">
              Bestellübersicht ({cart.count} {cart.count === 1 ? 'Artikel' : 'Artikel'})
            </div>
            {cart.lines.map((line) => (
              <div className="inline-line" key={line.id}>
                <span className="line-label">{line.name}</span>
                <span className="line-qty">{line.qty}× {euro(line.itemTotal)}</span>
              </div>
            ))}
            <div className="grand-total">
              <span>Gesamt</span>
              <span className="amount">{euro(cart.total)}</span>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              nextStep();
            }}
            noValidate
          >
            <div className="form-group">
              <label className="field-label" htmlFor="waiter-name">Ihr Name (Bedienung)</label>
              <input
                id="waiter-name"
                className={`field-input ${nameTouched && !waiterName.trim() ? 'error' : ''}`}
                type="text"
                value={waiterName}
                onChange={(e) => setWaiterName(e.target.value)}
                placeholder="z. B. Jule"
                autoComplete="name"
              />
              <div className={`field-error ${nameTouched && !waiterName.trim() ? 'show' : ''}`}>
                Bitte geben Sie Ihren Namen ein.
              </div>
            </div>

            <div className="form-group">
              <label className="field-label" htmlFor="customer-name">Name des Gastes</label>
              <input
                id="customer-name"
                className={`field-input ${guestTouched && !customerName.trim() ? 'error' : ''}`}
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="z. B. Max Mustermann"
              />
              <div className={`field-error ${guestTouched && !customerName.trim() ? 'show' : ''}`}>
                Bitte geben Sie den Namen des Gastes ein.
              </div>
            </div>

            <div className="step-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>Zurück</button>
              <button type="submit" className="btn btn-primary" disabled={!canProceed}>
                Weiter zur Bestätigung
              </button>
            </div>
          </form>
        </div>
      );
    }

    return (
      <div className="step-view" key="step-3">
        <h1 className="step-title">Bitte bestätigen</h1>
        <p className="step-hint">Prüfen Sie die Bestellung und geben Sie sie an die Küche.</p>

        <div className="inline-cart">
          <div className="inline-cart-title">Bestellübersicht</div>
          {cart.lines.map((line) => (
            <div className="inline-line" key={line.id}>
              <span className="line-label">{line.name}</span>
              <span className="line-qty">{line.qty}× {euro(line.itemTotal)}</span>
            </div>
          ))}
          <div className="grand-total">
            <span>Gesamtbetrag</span>
            <span className="amount">{euro(cart.total)}</span>
          </div>
        </div>

        <div className="confirm-meta">
          <p><strong>Bedienung:</strong> {waiterName}</p>
          <p><strong>Gast:</strong> {customerName}</p>
          <p><strong>Zahlung:</strong> Online-Zahlung</p>
        </div>

        <div className="step-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Zurück</button>
          <button type="button" className="btn btn-primary" onClick={submitOrder} disabled={submitting}>
            {submitting ? <span className="spinner" aria-hidden="true"></span> : null}
            {submitting ? 'Wird gesendet…' : 'Bestellung aufgeben'}
          </button>
        </div>
      </div>
    );
  };

  const renderOrderCard = (order) => (
    <div
      key={order.id}
      className={`order-card ${
        order.status === 'in_progress' ? 'progress' : order.status === 'done' ? 'done' : ''
      }`}
    >
      <div className="order-head">
        <div>
          <div className="order-guest">{order.customerName}</div>
          <div className="order-time">{formatTime(order.createdAt)}</div>
          {order.waiterName && (
            <span className="order-tag waiter">Bedienung: {order.waiterName}</span>
          )}
        </div>
        {order.status === 'open' && <span className="status-dot" aria-label="Neu eingegangen" />}
      </div>
      <div className="order-items">
        {(order.products || []).map((p) => (
          <div className="order-item-line" key={p.id}>
            <span>{p.quantity || 1}× {p.name}</span>
            <span>{euro((p.price || 0) * (p.quantity || 1))}</span>
          </div>
        ))}
      </div>
      <div className="order-total">Gesamt: {euro(order.total)}</div>
      <div className="order-actions">
        {order.status === 'open' && (
          <button
            className="btn btn-warn"
            onClick={() => updateOrderStatus(order.id, 'in_progress')}
          >
            In Arbeit nehmen
          </button>
        )}
        {order.status === 'in_progress' && (
          <button
            className="btn btn-primary"
            onClick={() => updateOrderStatus(order.id, 'done')}
          >
            Erledigt ✓
          </button>
        )}
        {order.status === 'done' && (
          <button className="btn btn-danger btn-sm" onClick={() => deleteOrder(order.id)}>
            Löschen
          </button>
        )}
      </div>
    </div>
  );

  const openOrders = orders
    .filter((o) => o.status === 'open')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const progressOrders = orders.filter((o) => o.status === 'in_progress');
  const doneOrders = orders.filter((o) => o.status === 'done');
  const activeOrdersCount = openOrders.length + progressOrders.length;

  const renderBoard = () => (
    <div className="board">
      <section className="board-col open">
        <div className="board-col-head">
          <span className="status-dot" aria-hidden="true"></span> Offen
          <span className="count">{openOrders.length}</span>
        </div>
        <div className="board-col-list">
          {openOrders.length > 0 ? (
            openOrders.map(renderOrderCard)
          ) : (
            <div className="empty-board">
              <span className="empty-state-icon"><ClipboardIcon size={48} /></span>
              Keine offenen Bestellungen
            </div>
          )}
        </div>
      </section>

      <section className="board-col progress">
        <div className="board-col-head">
          <span className="status-dot" aria-hidden="true" style={{ background: 'var(--warn)' }}></span> In Arbeit
          <span className="count">{progressOrders.length}</span>
        </div>
        <div className="board-col-list">
          {progressOrders.length > 0 ? (
            progressOrders.map(renderOrderCard)
          ) : (
            <div className="empty-board">
              <span className="empty-state-icon"><ChefHatIcon size={48} /></span>
              Nichts in Arbeit
            </div>
          )}
        </div>
      </section>

      <section className="board-col done">
        <div className="board-col-head">
          <span className="status-dot" aria-hidden="true" style={{ background: 'var(--text-muted)' }}></span> Erledigt
          <span className="count">{doneOrders.length}</span>
        </div>
        <div className="board-col-list">
          {doneOrders.length > 0 ? (
            doneOrders.map(renderOrderCard)
          ) : (
            <div className="empty-board">
              <span className="empty-state-icon"><CheckCircleIcon size={48} /></span>
              Noch nichts erledigt
            </div>
          )}
        </div>
      </section>
    </div>
  );

  return (
    <div className="container">
      <Head>
        <title>Bedienung — Restaurant am See</title>
        <meta name="description" content="Bedienungsbereich für Restaurant am See" />
      </Head>

      <header className="topbar" style={{ position: 'static', margin: '-20px -20px 28px' }}>
        <div className="topbar-inner" style={{ paddingLeft: 0, paddingRight: 0 }}>
          <Link href="/" className="brand">
            <span className="brand-badge"><WaveIcon /></span>
            <span className="brand-title">Restaurant am See</span>
          </Link>
        </div>
      </header>

      <main>
        <div className="board-tabs">
          <button
            type="button"
            className={`board-tab ${view === 'new' ? 'active' : ''}`}
            onClick={() => setView('new')}
          >
            Neue Bestellung
          </button>
          <button
            type="button"
            className={`board-tab ${view === 'board' ? 'active' : ''}`}
            onClick={() => setView('board')}
          >
            Bestellungen
            {activeOrdersCount > 0 && <span className="tab-badge">{activeOrdersCount}</span>}
          </button>
        </div>

        {view === 'new' ? (
          <div style={{ maxWidth: 840, margin: '0 auto' }}>
            {loadingData ? (
              <div className="skeleton-stack">
                <div className="skeleton skeleton-line" style={{ width: '50%' }}></div>
                <div className="skeleton skeleton-line" style={{ width: '80%' }}></div>
                <div className="skeleton-stack" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 24 }}>
                  <div className="skeleton skeleton-tile"></div>
                  <div className="skeleton skeleton-tile"></div>
                  <div className="skeleton skeleton-tile"></div>
                  <div className="skeleton skeleton-tile"></div>
                </div>
              </div>
            ) : (
              <>
                <Stepper steps={STEPS} current={step} />
                {renderStep()}
              </>
            )}
          </div>
        ) : (
          renderBoard()
        )}
      </main>

      {view === 'new' && !loadingData && !submitting && cart.count > 0 && (
        <div className="cart-bar">
          <div className="cart-bar-inner">
            <div className="cart-bar-info">
              <span className={`cart-bar-count ${barBump ? 'bump' : ''}`}>{cart.count}</span>
              <div>
                <div className="cart-bar-total">{euro(cart.total)}</div>
                <div className="cart-bar-label">
                  {cart.count === 1 ? '1 Artikel' : `${cart.count} Artikel`}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ minWidth: 180 }}
              onClick={() => setDrawerOpen(true)}
            >
              Warenkorb
            </button>
          </div>
        </div>
      )}

      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        items={cart.items}
        products={products}
        onAdd={handleAdd}
        onRemove={cart.remove}
        onClear={cart.clear}
        count={cart.count}
        total={cart.total}
        primaryLabel="Weiter zur Bestellung"
        onPrimary={() => {
          setDrawerOpen(false);
          if (cart.count > 0 && step < 1) setStep(1);
        }}
      />

      {submitting && (
        <div className="overlay-screen">
          <div className="spinner" aria-hidden="true"></div>
          <h2>Bestellung wird übermittelt…</h2>
          <p>Die Bestellung wird an die Küche gesendet.</p>
        </div>
      )}

      <footer className="footer">
        © 2026 Restaurant am See • Bestellsystem • Sichere Zahlung
      </footer>
    </div>
  );
}
