import { useSyncExternalStore } from 'react';

export interface MiniStore<T> {
  get(): T;
  set(next: T | ((prev: T) => T)): void;
  subscribe(fn: () => void): () => void;
}

export function createStore<T>(initial: T): MiniStore<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(next) {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      listeners.forEach((l) => l());
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

export function useMini<T, S>(store: MiniStore<T>, select: (t: T) => S): S {
  return useSyncExternalStore(store.subscribe, () => select(store.get()));
}

/** Re-render on any change signal from an object with onChange(). */
export function useSignal(subscribe: (fn: () => void) => () => void, getVersion: () => unknown): void {
  useSyncExternalStore(subscribe, getVersion);
}
