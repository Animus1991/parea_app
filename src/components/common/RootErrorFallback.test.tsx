import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { renderToStaticMarkup } from 'react-dom/server';
import { RootErrorFallback } from './RootErrorFallback';
import { fallbackLanguage } from '../../lib/fallbackLanguage';

describe('provider-independent error recovery', () => {
  afterEach(() => {
    localStorage.removeItem('nakamas-language');
    vi.restoreAllMocks();
  });

  it('honors the stored language and keeps technical details collapsed', () => {
    localStorage.setItem('nakamas-language', JSON.stringify({ state: { language: 'el' } }));
    const html = renderToStaticMarkup(<RootErrorFallback error={new Error('<broken>')} />);
    expect(html).toContain('Κάτι πήγε στραβά');
    expect(html).toContain('<details');
    expect(html).not.toContain('<details open');
    expect(html).toContain('&lt;broken&gt;');
  });

  it('falls back to browser language for missing, invalid or inaccessible storage', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB');
    expect(fallbackLanguage()).toBe('en');
    localStorage.setItem('nakamas-language', '{broken');
    expect(fallbackLanguage()).toBe('en');
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('el-GR');
    expect(fallbackLanguage()).toBe('el');
  });

  it('renders empty errors safely and exposes both recovery actions', () => {
    localStorage.setItem('nakamas-language', JSON.stringify({ state: { language: 'en' } }));
    const container = document.createElement('div');
    const root = createRoot(container);
    const onReload = vi.fn();
    const onHome = vi.fn();
    flushSync(() => root.render(<RootErrorFallback error={null} onReload={onReload} onHome={onHome} />));
    const buttons = container.querySelectorAll('button');
    expect(buttons[0]).toHaveTextContent('Reload');
    expect(buttons[1]).toHaveTextContent('Go home');
    buttons[0].click();
    buttons[1].click();
    expect(onReload).toHaveBeenCalledOnce();
    expect(onHome).toHaveBeenCalledOnce();
    root.unmount();
  });
});
