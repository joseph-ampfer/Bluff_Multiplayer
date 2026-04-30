/**
 * Phase 6 toast store. Singleton outside React so socket handlers can
 * push toasts without prop-drilling. Components subscribe via the
 * `useToasts` hook in `[Toasts.tsx](../components/Toasts.tsx)`.
 */

export type ToastKind = 'error' | 'info' | 'success' | 'liar';

export interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
  /**
   * How long before auto-dismissal, in ms. `null` means sticky (stay
   * until manually closed). Errors default to sticky.
   */
  durationMs: number | null;
}

const DEFAULT_DURATIONS: Record<ToastKind, number | null> = {
  error: null,
  info: 2400,
  success: 2400,
  liar: 3200,
};

interface ToastState {
  toasts: Toast[];
  nextId: number;
  listeners: Set<() => void>;
  timers: Map<number, number>;
}

const state: ToastState = {
  toasts: [],
  nextId: 1,
  listeners: new Set(),
  timers: new Map(),
};

function notify() {
  for (const fn of state.listeners) fn();
}

export function getToasts(): Toast[] {
  return state.toasts;
}

export function subscribeToasts(fn: () => void): () => void {
  state.listeners.add(fn);
  return () => {
    state.listeners.delete(fn);
  };
}

export function pushToast(
  kind: ToastKind,
  text: string,
  durationMs?: number | null,
): number {
  const id = state.nextId++;
  const dur = durationMs === undefined ? DEFAULT_DURATIONS[kind] : durationMs;
  const toast: Toast = { id, kind, text, durationMs: dur };
  state.toasts = [...state.toasts, toast];
  notify();

  if (dur != null && dur > 0) {
    const timer = window.setTimeout(() => {
      dismissToast(id);
    }, dur);
    state.timers.set(id, timer);
  }
  return id;
}

export function dismissToast(id: number) {
  const before = state.toasts.length;
  state.toasts = state.toasts.filter(t => t.id !== id);
  if (state.toasts.length !== before) notify();

  const timer = state.timers.get(id);
  if (timer != null) {
    window.clearTimeout(timer);
    state.timers.delete(id);
  }
}

export function clearAllToasts() {
  for (const timer of state.timers.values()) {
    window.clearTimeout(timer);
  }
  state.timers.clear();
  if (state.toasts.length > 0) {
    state.toasts = [];
    notify();
  }
}
