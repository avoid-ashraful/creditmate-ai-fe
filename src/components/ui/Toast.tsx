import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import './Toast.css';

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  message: string;
  variant?: ToastVariant;
  action?: ToastAction;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  variant: ToastVariant;
  leaving: boolean;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const EXIT_MS = 200;
const DEFAULT_DURATION = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const remove = useCallback((id: number) => {
    setToasts(current => current.filter(item => item.id !== id));
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      const timer = timersRef.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
      setToasts(current =>
        current.map(item => (item.id === id ? { ...item, leaving: true } : item))
      );
      setTimeout(() => remove(id), EXIT_MS);
    },
    [remove]
  );

  const toast = useCallback(
    (options: ToastOptions) => {
      idRef.current += 1;
      const id = idRef.current;
      const item: ToastItem = {
        ...options,
        id,
        variant: options.variant ?? 'info',
        leaving: false,
      };
      setToasts(current => [...current, item]);
      const duration = options.duration ?? DEFAULT_DURATION;
      if (duration > 0) {
        timersRef.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="cm-toast-viewport">
        {toasts.map(item => (
          <div
            key={item.id}
            role={item.variant === 'error' ? 'alert' : 'status'}
            className={[
              'cm-toast',
              `cm-toast--${item.variant}`,
              item.leaving ? 'cm-toast--leaving' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <span className="cm-toast__message">{item.message}</span>
            {item.action ? (
              <button
                type="button"
                className="cm-toast__action"
                onClick={() => {
                  item.action?.onClick();
                  dismiss(item.id);
                }}
              >
                {item.action.label}
              </button>
            ) : null}
            <button
              type="button"
              className="cm-toast__close"
              aria-label="Dismiss notification"
              onClick={() => dismiss(item.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
