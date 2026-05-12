import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { IconHeart } from './ui/Icons';

interface ToastData {
  id: string;
  title: string;
  subtitle?: string;
  projectColor?: string;
  type?: 'save' | 'move' | 'info';
  onUndo?: () => void;
}

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastData; onDismiss: () => void }) {
  const handleUndo = () => {
    toast.onUndo?.();
    onDismiss();
  };

  return (
    <div className="toast">
      <div className="toast-ico">
        {toast.type === 'save' || !toast.type ? (
          <IconHeart size={14} filled />
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 11 V19 A2 2 0 0 1 19 21 H5 A2 2 0 0 1 3 19 V5 A2 2 0 0 1 5 3 H13"/>
            <path d="M21 3 L11 13 L7 9"/>
          </svg>
        )}
      </div>
      <div className="toast-body">
        <div className="toast-title">
          {toast.title}
          {toast.projectColor && (
            <span className="swatch" style={{ background: toast.projectColor }} />
          )}
        </div>
        {toast.subtitle && <div className="toast-sub">{toast.subtitle}</div>}
      </div>
      {toast.onUndo && (
        <button className="toast-undo" onClick={handleUndo}>
          Undo
        </button>
      )}
    </div>
  );
}

export default ToastProvider;
