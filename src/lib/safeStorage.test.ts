import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeStorage, STORAGE_FULL_EVENT } from './safeStorage';

describe('safeStorage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('does not throw when the browser refuses to save, and says so once', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    const onFull = vi.fn();
    window.addEventListener(STORAGE_FULL_EVENT, onFull);
    expect(() => safeStorage.setItem('k', 'v')).not.toThrow();
    expect(onFull).toHaveBeenCalledTimes(1);
    window.removeEventListener(STORAGE_FULL_EVENT, onFull);
  });

  it('reads as empty when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(safeStorage.getItem('k')).toBeNull();
  });
});
