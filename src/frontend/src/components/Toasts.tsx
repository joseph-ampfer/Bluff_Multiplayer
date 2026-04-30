import { useEffect, useState } from 'react';
import {
  dismissToast,
  getToasts,
  subscribeToasts,
  type Toast,
} from '../utils/toasts';

export function Toasts() {
  const [, force] = useState(0);

  useEffect(() => subscribeToasts(() => force(n => n + 1)), []);

  const toasts: Toast[] = getToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div className={`toast --${t.kind}`} key={t.id} role="status">
          <span>{t.text}</span>
          <button
            type="button"
            className="toast__close"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
