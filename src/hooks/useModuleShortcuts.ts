"use client";

import { useEffect } from "react";

interface Options {
  /** Called when user presses 'n' or 'N' (create new item) */
  onNew?: () => void;
  /**
   * CSS selector for the search input to focus when '/' is pressed.
   * Defaults to "[data-search-input]".
   */
  searchSelector?: string;
}

/**
 * Registers global keyboard shortcuts for a module page.
 * - 'n' / 'N' → calls onNew()
 * - '/' → focuses the search input matching searchSelector
 *
 * Ignores events when focus is inside input, textarea, select, or contenteditable.
 * Ignores events when Ctrl, Meta, or Alt modifiers are active.
 */
export function useModuleShortcuts({ onNew, searchSelector }: Options = {}) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      // Ignore modifier key combos
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Ignore when focus is inside a form field
      const target = e.target as HTMLElement;
      const tag = target.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (target.isContentEditable) return;

      if ((e.key === "n" || e.key === "N") && onNew) {
        e.preventDefault();
        onNew();
        return;
      }

      if (e.key === "/") {
        const selector = searchSelector ?? "[data-search-input]";
        const el = document.querySelector<HTMLInputElement>(selector);
        if (el) {
          e.preventDefault();
          el.focus();
          el.select();
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onNew, searchSelector]);
}
