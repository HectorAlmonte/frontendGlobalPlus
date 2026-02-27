"use client";

import { useState, useEffect } from "react";

/**
 * Drop-in replacement for useState that persists the value in localStorage.
 * Key is automatically prefixed with "filters:".
 * SSR-safe: reads localStorage only on the client (lazy initializer).
 * NOTE: Do NOT use for Date objects — serialize dates as ISO strings instead.
 */
export function usePersistedState<T>(
  key: string,
  initial: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const fullKey = `filters:${key}`;

  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const stored = localStorage.getItem(fullKey);
      if (stored === null) return initial;
      return JSON.parse(stored) as T;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(fullKey, JSON.stringify(state));
    } catch {
      // Ignore (private browsing, quota exceeded, etc.)
    }
  }, [fullKey, state]);

  return [state, setState];
}
