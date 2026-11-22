import { describe, expect, it } from 'vitest';
import { desktopPopupSlots, popupDockRightCss } from './popupChatLayout';

describe('desktopPopupSlots', () => {
  it('keeps a single sheet on phones', () => {
    expect(desktopPopupSlots(390)).toBe(1);
    expect(desktopPopupSlots(767)).toBe(1);
  });

  it('fits only what the content column can hold', () => {
    expect(desktopPopupSlots(1024)).toBe(2);
    expect(desktopPopupSlots(1280)).toBe(3);
    expect(desktopPopupSlots(1440)).toBe(3);
    expect(desktopPopupSlots(1600)).toBe(4);
    expect(desktopPopupSlots(1920)).toBe(4);
  });
});

describe('popupDockRightCss', () => {
  it('parks the hat column just left of the stack', () => {
    expect(popupDockRightCss(0)).toBeUndefined();
    expect(popupDockRightCss(2)).toBe('calc(1.5rem + 2 * 22.5rem)');
  });
});
