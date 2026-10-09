import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export interface ToastProps {
  toast: { text: string; error: boolean } | null;
  onClose: () => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  if (!toast) return null;

  return (
    <div className="toast-container">
      <div className={`toast ${toast.error ? 'error' : 'success'}`}>
        {toast.error ? (
          <AlertCircle size={18} color="#f87171" />
        ) : (
          <CheckCircle2 size={18} color="#34d399" />
        )}
        <span>{toast.text}</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
            marginLeft: 8,
            display: 'flex',
            alignItems: 'center',
            padding: 2
          }}
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
