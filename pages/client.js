import Head from 'next/head';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Stepper from '../components/Stepper';
import CartDrawer from '../components/CartDrawer';
import { useToast } from '../components/Toast';
import { WaveIcon, BoxEmptyIcon, LockIcon } from '../components/Icons';
import { getCategoryState, formatCountdown } from '../lib/availability';
import useCart from '../hooks/useCart';

const STEPS = ['Speisekarte', 'An deinen Tisch', 'Bestätigen'];
const euro = (n) => `${(n || 0).toFixed(2).replace('.', ',')} €`;

export default function ClientPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingState, setLoadingState] = useState('loading'); // 'loading' | 'ready' | 'error'
  const [step, setStep] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState(0); // 0 idle, 1 transmit, 2 captured, 3 done
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const [bumpId, setBumpId] = useState(null);
  const [barBump, setBarBump] = useState(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const toast = useToast();
  const cart = useCart(products);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoadingState('loading');
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      let ok = true;
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(Array.isArray(data) ? data : []);
      } else {
        ok = false;
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(Array.isArray(data) ? data : []);
      } else {
        ok = false;
      }
      setLoadingState(ok ? 'ready' : 'error');
    } catch (error) {
      console.error('Laden fehlgeschlagen:', error);
      setLoadingState('error');
      if (silent) {
        toast.error('Daten konnten nicht aktualisiert werden.', { action: { label: 'Erneut', onClick: () => load() } });
      }
    }
  }, [toast]);

  useEffect(() => {
    load();
    const interval = setInterval(() => load({ silent: true }), 300000);
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
        // keep empty categories too — they'll render an explicit empty state
        .filter((group) => group.items.length > 0 || true),
    [categories, products]
  );

  const handleAdd = useCallback((productId) => {
    cart.add(productId);
    setFlashId(productId);
    setBumpId(productId);
    setBarBump(productId);
    const t1 = setTimeout(() => setFlashId((id) => (id === productId ? null : id)), 600);
    const t2 = setTimeout(() => setBumpId((id) => (id === productId ? null : id)), 300);
    const t3 = setTimeout(() => setBarBump((id) => (id === productId ? null : id)), 350);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [cart]);

  const handleClearWithUndo = () => {
    const snapshot = { ...cart.items };
    if (Object.keys(snapshot).length === 0) return;
    cart.clear();
    toast.info('Warenkorb geleert.', {
      duration: 6000,
      action: {
        label: 'Rückgängig',
        onClick: () => {
          // restore via adducting each line qty
          Object.entries(snapshot).forEach(([id, qty]) => {
            for (let i = 0; i < qty; i++) cart.add(parseInt(id));
          });
        },
      },
    });
  };

  const canProceed =
    (step === 0 && cart.count > 0) ||
    (step === 1 && customerName.trim().length > 0) ||
    step === 2;

  const nextStep = () => {
    if (step === 0 && cart.count === 0) {
      toast.info('Such dir zuerst ein Gericht aus.');
      return;
    }
    if (step === 1 && !customerName.trim()) {
      setNameTouched(true);
      toast.error('Wie dürfen wir dich nennen? — bitte Name eintragen.');
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const submitOrder = async () => {
    if (cart.count === 0) {
      toast.error('Dein Warenkorb ist leer.');
      return;
    }
    if (!customerName.trim()) {
      setNameTouched(true);
      toast.error('Bitte trage deinen Namen ein.');
      return;
    }

    setSubmitting(true);
    setSubmitPhase(1);
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
        setSubmitPhase(2);
        await new Promise((r) => setTimeout(r, 350));
        setSubmitPhase(3);
        setLastOrder({ lines: cart.lines.map((l) => ({ ...l })), total: cart.total });
        setShowSuccess(true);
        cart.clear();
        setCustomerName('');
        setDeliveryAddress('');
        setStep(0);
        setDrawerOpen(false);
        setSubmitting(false);
        setSubmitPhase(0);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Bestellung konnte nicht gesendet werden.', {
          action: { label: 'Erneut versuchen', onClick: submitOrder },
        });
        setSubmitting(false);
        setSubmitPhase(0);
      }
    } catch (error) {
      console.error('Senden fehlgeschlagen:', error);
      toast.error('Kein Netz? Versuche es gleich nochmal.', {
        action: { label: 'Erneut', onClick: submitOrder },
      });
      setSubmitting(false);
      setSubmitPhase(0);
    }
  };

  const confetti = useMemo(() => {
    if (!showSuccess) return [];
    const palette = ['#0e6b62', '#c2410c', '#b45309', '#9a3412', '#073a35', '#d97706'];
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: palette[i % palette.length],
      delay: Math.random() * 0.5,
      duration: 2.6 + Math.random() * 1.6,
      sway: `${(Math.random() - 0.5) * 28}vw`,
      w: 7 + Math.random() * 6,
      h: 12 + Math.random() * 8,
    }));
  }, [showSuccess]);

  const renderProductsStep = () => (
    <div className="step-view" key="step-0">
      <h1 className="step-title">Speisekarte</h1>
      <p className="step-hint">Schau dir die Karte an, wähle ein Gericht und stell mit + die Menge ein.</p>

      {groupedProducts.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon"><BoxEmptyIcon size={56} /></span>
          <div className="empty-title">Die Karte ist gleich wieder da</div>
          <div className="empty-sub">Die Küche rüstet gerade um. Probier es in ein paar Minuten nochmal.</div>
          <div className="err-actions" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => load()}>Neu laden</button>
          </div>
        </div>
      ) : (
        groupedProducts.map((group) => {
          const av = getCategoryState(group.category, now);
          const available = av.state === 'open';
          return (
            <section key={group.category.id} className="menu-group">
              {!available ? (
                <div className="menu-group-locked">
                  <span className="menu-group-locked-icon"><LockIcon size={24} /></span>
                  <div>
                    <div className="menu-group-title" style={{ marginBottom: 4 }}>{group.category.name}</div>
                    {av.state === 'locked' ? (
                      <div className="locked-line">
                        Öffnet in&nbsp;<strong>{formatCountdown(av.opensAt.getTime() - now)}</strong>
                      </div>
                    ) : (
                      <div className="locked-line">Heute geschlossen.</div>
                    )}
                    <div className="locked-sub">Sobald die Kategorie freigegeben ist, erscheint sie hier.</div>
                  </div>
                </div>
              ) : group.items.length === 0 ? (
                <div className="empty-state" style={{ padding: '32px 16px' }}>
                  <div className="empty-sub">In dieser Kategorie ist heute nichts dabei.</div>
                </div>
              ) : (
                <>
                  <h2 className="menu-group-title">{group.category.name}</h2>
                  <div className="product-grid">
                    {group.items.map((product, i) => {
                      const qty = cart.items[product.id] || 0;
                      return (
                        <div
                          key={product.id}
                          className={`product-card ${flashId === product.id ? 'flash' : ''}`}
                          style={{ animationDelay: `${Math.min(i * 0.03, 0.3)}s` }}
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
                            aria-label={`${product.name} entfernt eine Portion`}
                          >
                            −
                          </button>
                          <span className="qty-value">{qty}</span>
                          <button
                            type="button"
                            className={`qty-btn plus ${bumpId === product.id ? 'bump' : ''}`}
                            onClick={() => handleAdd(product.id)}
                            aria-label={`${product.name} noch eine Portion`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
          </section>
        );
      })
    )}

      {groupedProducts.length > 0 && (
        <div className="step-actions">
          <button type="button" className="btn btn-primary" onClick={nextStep} disabled={!canProceed}>
            Zur Bestellung
          </button>
        </div>
      )}
    </div>
  );

  const renderDetailsStep = () => (
    <div className="step-view" key="step-1">
      <h1 className="step-title">An deinen Tisch</h1>
      <p className="step-hint">Wir bringen die Bestellung an deinen Tisch — sag uns deinen Namen.</p>

      <div className="inline-cart">
        <div className="inline-cart-title">
          Deine Auswahl · {cart.count} {cart.count === 1 ? 'Gericht' : 'Gerichte'}
        </div>
        {cart.lines.map((line) => (
          <div className="inline-line" key={line.id}>
            <span className="line-label">{line.name}</span>
            <span className="line-qty">{line.qty}× {euro(line.itemTotal)}</span>
          </div>
        ))}
        <div className="grand-total">
          <span>Summe</span>
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
          <label className="field-label" htmlFor="customer-name">Dein Name</label>
          <input
            id="customer-name"
            className={`field-input ${nameTouched && !customerName.trim() ? 'error' : ''}`}
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="z. B. Jule"
            autoComplete="name"
          />
          <div className={`field-error ${nameTouched && !customerName.trim() ? 'show' : ''}`}>
            Bitte trag deinen Namen ein.
          </div>
        </div>

        <div className="form-group">
          <label className="field-label" htmlFor="delivery-address">Tisch oder Anmerkung <span className="muted" style={{ fontWeight: 600 }}>(optional)</span></label>
          <input
            id="delivery-address"
            className="field-input"
            type="text"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="Tisch 12, Allergien, …"
            autoComplete="off"
          />
        </div>

        <div className="step-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>Zurück</button>
          <button type="submit" className="btn btn-primary" disabled={!customerName.trim()}>
            Zur Bestätigung
          </button>
        </div>
      </form>
    </div>
  );

  const renderConfirmStep = () => (
    <div className="step-view" key="step-3">
      <h1 className="step-title">Kurz checken</h1>
      <p className="step-hint">Passt alles? Mit „Bestellen“ geht die Karte an die Küche.</p>

      <div className="inline-cart">
        <div className="inline-cart-title">Deine Bestellung</div>
        {cart.lines.map((line) => (
          <div className="inline-line" key={line.id}>
            <span className="line-label">{line.name}</span>
            <span className="line-qty">{line.qty}× {euro(line.itemTotal)}</span>
          </div>
        ))}
        <div className="grand-total">
          <span>Zahlbetrag</span>
          <span className="amount">{euro(cart.total)}</span>
        </div>
      </div>

      <div className="confirm-meta">
        <div className="success-meta-line"><strong>Name</strong><span>{customerName}</span></div>
        {deliveryAddress && <div className="success-meta-line"><strong>Hinweis</strong><span>{deliveryAddress}</span></div>}
        <div className="success-meta-line"><strong>Zahlung</strong><span>Jules Pay</span></div>
      </div>

      <div className="step-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Zurück</button>
        <button type="button" className="btn btn-primary" onClick={submitOrder} disabled={submitting}>
          {submitting ? <span className="spinner" aria-hidden="true"></span> : null}
          {submitting ? 'Wird übermittelt…' : 'Bestellen'}
        </button>
      </div>
    </div>
  );

  const PHASE_COPY = {
    1: { t: 'Bestellung läuft an die Küche', s: 'Sekundenbruchteil — bleib dran.' },
    2: { t: 'Zahlung erfasst', s: 'Jules Pay hat den Betrag verbucht.' },
    3: { t: 'Bestellt', s: 'Die Küche rüstet bereits.' },
  };

  return (
    <div className="container-narrow">
      <Head>
        <title>Speisekarte — Restaurant am Teich</title>
        <meta name="description" content="Bestelle am Tegernsee: Speisekarte von Restaurant am Teich." />
      </Head>

      <header className="topbar-site">
        <div className="topbar-site-inner">
          <Link href="/" className="brand-lockup">
            <span className="brand-mark"><WaveIcon size={24} /></span>
            <span className="brand-name">
              <span className="name">Restaurant am Teich</span>
              <span className="role">Selbst bedient</span>
            </span>
          </Link>
        </div>
      </header>

      <main style={{ paddingTop: 16 }}>
        {loadingState === 'loading' ? (
          <div className="skeleton-stack">
            <div className="skeleton skeleton-line" style={{ width: '46%', height: 32 }} />
            <div className="skeleton skeleton-line" style={{ width: '72%', height: 20, marginBottom: 24 }} />
            {[0, 1].map((g) => (
              <div key={g} style={{ marginBottom: 24 }}>
                <div className="skeleton skeleton-line" style={{ width: '32%', height: 22, marginBottom: 14 }} />
                <div className="skeleton-stack" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {[0, 1, 2].map((i) => (<div key={i} className="skeleton skeleton-tile" />))}
                </div>
              </div>
            ))}
          </div>
        ) : loadingState === 'error' ? (
          <div className="error-card">
            <div className="err-title">Die Karte lässt sich gerade nicht laden</div>
            <div className="err-text">Vielleicht ein kurzer Netz-Wink. Probier es in wenigen Sekunden nochmal.</div>
            <div className="err-actions">
              <button type="button" className="btn btn-primary btn-sm" onClick={() => load()}>Neu laden</button>
            </div>
          </div>
        ) : (
          <>
            <Stepper steps={STEPS} current={step} />
            {step === 0 && renderProductsStep()}
            {step === 1 && renderDetailsStep()}
            {step === 2 && renderConfirmStep()}
          </>
        )}
      </main>

      {loadingState === 'ready' && !submitting && !showSuccess && cart.count > 0 && (
        <div className="cart-bar">
          <div className="cart-bar-inner">
            <div className="cart-bar-info">
              <span className={`cart-bar-count ${barBump ? 'bump' : ''}`}>{cart.count}</span>
              <div>
                <div className="cart-bar-total">{euro(cart.total)}</div>
                <div className="cart-bar-label">{cart.count === 1 ? '1 Gericht' : `${cart.count} Gerichte`}</div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ minWidth: 160 }}
              onClick={() => setDrawerOpen(true)}
            >
              Warenkorb öffnen
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
        onClear={handleClearWithUndo}
        count={cart.count}
        total={cart.total}
        primaryLabel="Zur Bestellung"
        onPrimary={() => {
          setDrawerOpen(false);
          if (cart.count > 0 && step < 1) setStep(1);
        }}
      />

      {submitting && (
        <div className="overlay-screen">
          <div className="spinner" aria-hidden="true"></div>
          <h2>{PHASE_COPY[submitPhase]?.t || 'Wird übermittelt…'}</h2>
          <p>{PHASE_COPY[submitPhase]?.s || ''}</p>
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
            <h1 className="success-title">Danke, die Bestellung ist raus</h1>
            <p className="success-sub">Die Küche kümmert sich. Einen Moment — wir bringen's an den Tisch.</p>

            <div className="success-card">
              <div className="inline-cart-title">Was du bestellt hast</div>
              {lastOrder && lastOrder.lines.map((line) => (
                <div className="inline-line" key={line.id}>
                  <span className="line-label">{line.name}</span>
                  <span className="line-qty">{line.qty}× {euro(line.itemTotal)}</span>
                </div>
              ))}
              <div className="grand-total">
                <span>Zahlbetrag</span>
                <span className="amount">{euro(lastOrder ? lastOrder.total : 0)}</span>
              </div>
            </div>

            <div className="success-actions">
              <button type="button" className="btn btn-primary" onClick={() => setShowSuccess(false)}>
                Noch etwas bestellen
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="footer">
        Restaurant am Teich · Hinten im Garten · Service: schreien sie einfach
      </footer>
    </div>
  );
}
