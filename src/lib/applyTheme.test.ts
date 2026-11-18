import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyThemeSelection } from './applyTheme';

vi.mock('sonner', () => ({
  toast: { message: vi.fn() },
}));

import { toast } from 'sonner';

describe('applyThemeSelection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.dataset.theme = '';
  });

  it('sets store, html dataset, and toasts in English', () => {
    const setTheme = vi.fn();
    applyThemeSelection('bento', setTheme, 'en');
    expect(setTheme).toHaveBeenCalledWith('bento');
    expect(document.documentElement.dataset.theme).toBe('bento');
    expect(toast.message).toHaveBeenCalledWith('Theme: Bento');
  });

  it('toasts in Greek', () => {
    applyThemeSelection('classic', vi.fn(), 'el');
    expect(toast.message).toHaveBeenCalledWith('Θέμα: Κλασικό');
  });

  it('no-ops when the theme is already active', () => {
    const setTheme = vi.fn();
    applyThemeSelection('neon', setTheme, 'en', 'neon');
    expect(setTheme).not.toHaveBeenCalled();
    expect(toast.message).not.toHaveBeenCalled();
  });
});
