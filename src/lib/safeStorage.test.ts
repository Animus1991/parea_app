import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeStorage, STORAGE_FULL_EVENT } from './safeStorage';

const refusing = (name: string) => ({
  getItem: () => {
    throw new DOMException(name, name);
  },
  setItem: () => {
    throw new DOMException(name, name);
  },
  removeItem: () => {
    throw new DOMException(name, name);
  },
});

describe('safeStorage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('does not throw when the browser refuses to save, and says so once', () => {
    vi.stubGlobal('localStorage', refusing('QuotaExceededError'));
    const onFull = vi.fn();
    window.addEventListener(STORAGE_FULL_EVENT, onFull);
    expect(() => safeStorage.setItem('k', 'v')).not.toThrow();
    expect(onFull).toHaveBeenCalledTimes(1);
    window.removeEventListener(STORAGE_FULL_EVENT, onFull);
  });

  it('reads as empty and removes quietly when storage is blocked', () => {
    vi.stubGlobal('localStorage', refusing('SecurityError'));
    expect(safeStorage.getItem('k')).toBeNull();
    expect(() => safeStorage.removeItem('k')).not.toThrow();
  });
});
