import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyThemeSelection } from './applyTheme';

describe('applyThemeSelection', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = '';
  });

  it('sets store and html dataset', () => {
    const setTheme = vi.fn();
    applyThemeSelection('bento', setTheme);
    expect(setTheme).toHaveBeenCalledWith('bento');
    expect(document.documentElement.dataset.theme).toBe('bento');
  });

  it('no-ops when the theme is already active', () => {
    const setTheme = vi.fn();
    applyThemeSelection('neon', setTheme, 'neon');
    expect(setTheme).not.toHaveBeenCalled();
    expect(document.documentElement.dataset.theme).toBe('');
  });
});
