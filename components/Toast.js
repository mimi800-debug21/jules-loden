import { createContext, useContext, useState, useCallback, useRef } from 'react';

const ToastContext = createContext(null);

const ICONS = { success: '✓', error: '✕', info: 'i' };
const DEFAULT_DURATION = 3800;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((message, type = 'info', options = {}) => {
    const id = ++idRef.current;
    const { action, duration = DEFAULT_DURATION } = options;
    setToasts((t) => [...t, { id, message, type, action }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  const success = useCallback((m, o) => push(m, 'success', o), [push]);
  const error = useCallback((m, o) => push(m, 'error', o), [push]);
  const info = useCallback((m, o) => push(m, 'info', o), [push]);

  const handleAction = (toast) => {
    if (toast.action) toast.action.onClick();
    dismiss(toast.id);
  };

  return (
    <ToastContext.Provider value={{ push, success, error, info }}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type}`} role="status">
            <span className="toast-icon" aria-hidden="true">{ICONS[toast.type]}</span>
            <span className="toast-msg">{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                className="toast-action"
                onClick={() => handleAction(toast)}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
