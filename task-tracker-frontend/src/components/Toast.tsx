// src/components/Toast.tsx
import { useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ toast, onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast, onClose, duration]);

  if (!toast) return null;

  const iconName =
    toast.type === 'success'
      ? 'check_circle'
      : toast.type === 'error'
      ? 'error'
      : 'info';

  return (
    <div className={`toast-container toast-${toast.type}`} role="status" aria-live="polite">
      <div className="toast-content">
        <span className="material-symbols-outlined toast-icon">{iconName}</span>
        <span className="toast-text">{toast.message}</span>
      </div>
      <button
        type="button"
        className="toast-close-btn"
        onClick={onClose}
        aria-label="Tutup notifikasi"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
    </div>
  );
}
