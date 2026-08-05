import { useState, useCallback, useMemo } from 'react';

export default function useCart(products) {
  const [items, setItems] = useState({});

  const add = useCallback((productId) => {
    setItems((prev) => ({ ...prev, [productId]: (prev[productId] || 0) + 1 }));
  }, []);

  const remove = useCallback((productId) => {
    setItems((prev) => {
      const next = { ...prev };
      if ((next[productId] || 0) <= 1) delete next[productId];
      else next[productId] -= 1;
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems({}), []);

  const count = useMemo(
    () => Object.values(items).reduce((sum, qty) => sum + qty, 0),
    [items]
  );

  const total = useMemo(
    () =>
      Object.entries(items).reduce((sum, [id, qty]) => {
        const p = (products || []).find((prod) => prod.id === parseInt(id));
        return sum + (p ? (p.price || 0) * qty : 0);
      }, 0),
    [items, products]
  );

  const lines = useMemo(
    () =>
      Object.entries(items)
        .map(([id, qty]) => {
          const p = (products || []).find((prod) => prod.id === parseInt(id));
          return p ? { ...p, qty, itemTotal: (p.price || 0) * qty } : null;
        })
        .filter(Boolean),
    [items, products]
  );

  return { items, add, remove, clear, count, total, lines };
}
