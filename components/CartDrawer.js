import { useEffect } from 'react';
import { CartIcon } from './Icons';

const euro = (n) => `${(n || 0).toFixed(2).replace('.', ',')} €`;

export default function CartDrawer({
  open,
  onClose,
  items,
  products,
  onAdd,
  onRemove,
  onClear,
  count,
  total,
  primaryLabel = 'Weiter zur Kasse',
  onPrimary,
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const lines = Object.entries(items)
    .map(([id, qty]) => {
      const p = products.find((prod) => prod.id === parseInt(id));
      return p ? { ...p, qty } : null;
    })
    .filter(Boolean);

  return (
    <>
      <div
        className={`drawer-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`drawer ${open ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Ihr Warenkorb"
      >
        <div className="drawer-handle" aria-hidden="true" />
        <div className="drawer-head">
          <h2 className="drawer-title">Ihr Warenkorb</h2>
          <button className="drawer-close" onClick={onClose} aria-label="Warenkorb schließen">×</button>
        </div>

        <div className="drawer-body">
          {lines.length === 0 ? (
            <div className="drawer-empty">
              <span className="drawer-empty-icon"><CartIcon size={48} /></span>
              Ihr Warenkorb ist noch leer.
            </div>
          ) : (
            lines.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.name}</div>
                  <div className="cart-item-price">{euro(item.price)} pro Stück</div>
                </div>
                <div className="qty-stepper">
                  <button
                    className="qty-btn minus"
                    onClick={() => onRemove(item.id)}
                    aria-label={`${item.name} weniger`}
                  >
                    −
                  </button>
                  <span className="qty-value">{item.qty}</span>
                  <button
                    className="qty-btn plus"
                    onClick={() => onAdd(item.id)}
                    aria-label={`${item.name} mehr`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <div className="drawer-foot">
            <div className="drawer-total">
              <span>{count} {count === 1 ? 'Artikel' : 'Artikel'}</span>
              <span className="amount">{euro(total)}</span>
            </div>
            <button className="btn btn-primary btn-block" onClick={onPrimary}>
              {primaryLabel}
            </button>
            {onClear && (
              <button className="btn btn-ghost btn-block" onClick={onClear} style={{ marginTop: 10 }}>
                Warenkorb leeren
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
