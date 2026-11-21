import type { StateStorage } from 'zustand/middleware';

/** Fired when the browser refuses to save (quota full, private mode). */
export const STORAGE_FULL_EVENT = 'nakamas:storage-full';

/**
 * localStorage for zustand persist that never throws: a full or blocked
 * storage keeps the app working in memory and tells the shell once.
 */
export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(STORAGE_FULL_EVENT));
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};
