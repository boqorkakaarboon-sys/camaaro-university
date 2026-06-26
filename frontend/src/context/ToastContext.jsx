import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
const colors = {
  success: { bg: '#e8f5ee', border: 'var(--green)', text: 'var(--green)' },
  error:   { bg: '#fdecea', border: 'var(--red)',   text: 'var(--red)' },
  info:    { bg: '#eaf2fb', border: '#2980b9',       text: '#2980b9' },
  warning: { bg: '#fef6e7', border: 'var(--gold)',   text: '#b8860b' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  // Convenience methods so both calling styles work across the app:
  //   useToast().showToast(msg, 'success')   <- newer pages
  //   useToast().success(msg) / .error(msg)  <- original pages (Admin/Teacher/Student)
  const success = useCallback((msg, duration) => showToast(msg, 'success', duration), [showToast]);
  const error   = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast]);
  const info    = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast]);
  const warning = useCallback((msg, duration) => showToast(msg, 'warning', duration), [showToast]);
  const warn    = warning; // alias used by some pages (e.g. ExamBuilder)

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, warn }}>
      {children}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.6rem', maxWidth: 360 }}>
        {toasts.map((t) => {
          const c = colors[t.type] || colors.info;
          return (
            <div key={t.id} style={{
              background: c.bg, border: `1.5px solid ${c.border}`, color: c.text,
              padding: '0.85rem 1.1rem', borderRadius: 10, fontSize: '0.88rem', fontWeight: 500,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
              animation: 'slideIn 0.25s ease',
            }}>
              <span>{icons[t.type] || icons.info}</span>
              <span style={{ lineHeight: 1.4 }}>{t.message}</span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes slideIn { from { opacity:0; transform: translateX(30px); } to { opacity:1; transform: translateX(0); } }`}</style>
    </ToastContext.Provider>
  );
};
