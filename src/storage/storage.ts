/** localStorage wrapper that never throws (private mode, quota, corrupted JSON). */
export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Minimal observable store so several components stay in sync with localStorage. */
export function createStore<T>(load: () => T) {
  let value: T | undefined;
  const listeners = new Set<() => void>();
  return {
    get(): T {
      if (value === undefined) value = load();
      return value;
    },
    set(next: T) {
      value = next;
      listeners.forEach((l) => l());
    },
    reload() {
      value = load();
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
