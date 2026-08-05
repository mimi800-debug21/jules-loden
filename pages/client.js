import Head from 'next/head';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Stepper from '../components/Stepper';
import CartDrawer from '../components/CartDrawer';
import { useToast } from '../components/Toast';
import { WaveIcon } from '../components/Icons';
import useCart from '../hooks/useCart';

const STEPS = ['Gerichte', 'Details', 'Bestätigen'];
const euro = (n) => `${(n || 0).toFixed(2).replace('.', ',')} €`;

export default function ClientPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [step, setStep] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [flashId, setFlashId] = useState(null);
  const [bumpId, setBumpId] = useState(null);
  const [barBump, setBarBump] = useState(false);
  const [nameTouched, setNameTouched] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const toast = useToast();
  const cart = useCart(products);

  const loadData = async () => {
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

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 300000);
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

  const canProceed =
    (step === 0 && cart.count > 0) ||
    (step === 1 && customerName.trim().length > 0) ||
    step === 2;

  const nextStep = () => {
    if (step === 0 && cart.count === 0) {
      toast.info('Bitte wählen Sie mindestens ein Gericht.');
      return;
    }
    if (step === 1 && !customerName.trim()) {
      setNameTouched(true);
      toast.error('Bitte geben Sie Ihren Namen ein.');
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const submitOrder = async () => {
    if (cart.count === 0) {
      toast.error('Bitte wählen Sie mindestens ein Gericht.');
      return;
    }
    if (!customerName.trim()) {
      setNameTouched(true);
      toast.error('Bitte geben Sie Ihren Namen ein.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          deliveryAddress: deliveryAddress.trim() || null,
          products: cart.lines.map((l) => ({ id: l.id, quantity: l.qty, price: l.price })),
          total: cart.total,
          status: 'open',
          paymentMethod: 'julespay',
        }),
      });

      if (res.ok) {
        setSubmitting(false);
        setLastOrder({ lines: cart.lines.map((l) => ({ ...l })), total: cart.total });
        setShowSuccess(true);
        cart.clear();
        setCustomerName('');
        setDeliveryAddress('');
        setStep(0);
        setDrawerOpen(false);
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

  const confetti = useMemo(() => {
    if (!showSuccess) return [];
    const colors = ['#16a34a', '#0f766e', '#d97706', '#dc2626', '#2563eb', '#7c3aed', '#ea580c'];
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[i % colors.length],
      delay: Math.random() * 0.8,
      duration: 2.6 + Math.random() * 2.2,
      sway: `${(Math.random() - 0.5) * 44}vw`,
      w: 7 + Math.random() * 7,
      h: 12 + Math.random() * 10,
    }));
  }, [showSuccess]);

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="step-view" key="step-0">
          <h1 className="step-title">Unsere Gerichte</h1>
          <p className="step-hint">Wählen Sie Ihre Gerichte und stellen Sie die Menge mit + und − ein.</p>

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
          <h1 className="step-title">Ihre Bestelldetails</h1>
          <p className="step-hint">Nur wenige Angaben noch — dann sind Sie fertig.</p>

          <div className="inline-cart">
            <div className="inline-cart-title">
              Ihre Auswahl ({cart.count} {cart.count === 1 ? 'Artikel' : 'Artikel'})
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
              <label className="field-label" htmlFor="customer-name">Ihr Name</label>
              <input
                id="customer-name"
                className={`field-input ${nameTouched && !customerName.trim() ? 'error' : ''}`}
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="z. B. Max Mustermann"
                autoComplete="name"
              />
              <div className={`field-error ${nameTouched && !customerName.trim() ? 'show' : ''}`}>
                Bitte geben Sie Ihren Namen ein.
              </div>
            </div>

            <div className="form-group">
              <label className="field-label" htmlFor="delivery-address">Lieferadresse (optional)</label>
              <input
                id="delivery-address"
                className="field-input"
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Musterstraße 123, 12345 Musterstadt"
                autoComplete="street-address"
              />
              <div className="field-hint">Falls keine Lieferung gewünscht ist, einfach leer lassen.</div>
            </div>

            <div className="step-actions">
              <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>Zurück</button>
              <button type="submit" className="btn btn-primary" disabled={!customerName.trim()}>
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
        <p className="step-hint">Prüfen Sie Ihre Bestellung. Sie wird sicher online bezahlt.</p>

        <div className="inline-cart">
          <div className="inline-cart-title">Ihre Bestellung</div>
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
          <p><strong>Name:</strong> {customerName}</p>
          {deliveryAddress && <p><strong>Lieferadresse:</strong> {deliveryAddress}</p>}
          <p><strong>Zahlung:</strong> Online-Zahlung</p>
        </div>

        <div className="step-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Zurück</button>
          <button type="button" className="btn btn-primary" onClick={submitOrder} disabled={submitting}>
            {submitting ? <span className="spinner" aria-hidden="true"></span> : null}
            {submitting ? 'Wird gesendet…' : 'Jetzt bestellen'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="container-narrow">
      <Head>
        <title>Bestellen — Restaurant am See</title>
        <meta name="description" content="Bestellen Sie im Restaurant am See" />
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
      </main>

      {!loadingData && !submitting && !showSuccess && cart.count > 0 && (
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
          <h2>Zahlung wird verarbeitet…</h2>
          <p>Ihre Bestellung wird sicher übermittelt.</p>
        </div>
      )}

      {showSuccess && (
        <div className="success-overlay">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className="confetti-piece"
              aria-hidden="true"
              style={{
                left: `${piece.left}%`,
                width: piece.w,
                height: piece.h,
                background: piece.color,
                animationDelay: `${piece.delay}s`,
                animationDuration: `${piece.duration}s`,
                '--sway': piece.sway,
              }}
            />
          ))}
          <div className="success-box">
            <svg className="success-check" viewBox="0 0 100 100" aria-hidden="true">
              <circle className="check-circle" cx="50" cy="50" r="44" />
              <path className="check-mark" d="M28 52 L44 68 L73 36" />
            </svg>
            <h1 className="success-title">Bestellung erfolgreich!</h1>
            <p className="success-sub">Zahlung bestätigt. Vielen Dank!</p>

            <div className="success-card">
              <div className="inline-cart-title">Ihre Bestellung wurde übermittelt</div>
              {lastOrder && lastOrder.lines.map((line) => (
                <div className="inline-line" key={line.id}>
                  <span className="line-label">{line.name}</span>
                  <span className="line-qty">{line.qty}× {euro(line.itemTotal)}</span>
                </div>
              ))}
              <div className="grand-total">
                <span>Gesamtbetrag</span>
                <span className="amount">{euro(lastOrder ? lastOrder.total : 0)}</span>
              </div>
            </div>

            <div className="ad-box">
              <div className="ad-eyebrow">Empfehlung</div>
              <h3>Perfekt für Ihre nächste Feier</h3>
              <p>Die einfache Mitbring-Liste für Ihre nächste Veranstaltung:</p>
              <a href="https://bringlymit.de" target="_blank" rel="noopener noreferrer" className="ad-link">
                bringlymit.de
              </a>
              <p>Keine Anmeldung. Einfach Link teilen. Alle tragen ein, was sie mitbringen.</p>
            </div>

            <div className="success-actions">
              <button type="button" className="btn btn-primary" onClick={() => setShowSuccess(false)}>
                Weiter bestellen
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        © 2026 Restaurant am See • Bestellsystem • Sichere Zahlung
      </footer>
    </div>
  );
}
