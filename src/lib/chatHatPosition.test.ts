import { describe, expect, it } from 'vitest';
import {
  chatHatAnchorFromPixels,
  chatHatPixelsFromAnchor,
  chatHatSizePx,
  clamp01,
  clampChatHatPixels,
  isChatHatAnchor,
} from './chatHatPosition';

describe('chat hat placement', () => {
  it('uses the 96px FAB on phones and 112px from md up', () => {
    expect(chatHatSizePx(390)).toBe(96);
    expect(chatHatSizePx(767)).toBe(96);
    expect(chatHatSizePx(768)).toBe(112);
  });

  it('clamps a 0–1 factor', () => {
    expect(clamp01(-2)).toBe(0);
    expect(clamp01(0.4)).toBe(0.4);
    expect(clamp01(3)).toBe(1);
    expect(clamp01(Number.NaN)).toBe(0);
  });

  it('keeps the hat on screen', () => {
    expect(clampChatHatPixels(-40, -10, 96, 390, 844)).toEqual({ left: 8, top: 8 });
    expect(clampChatHatPixels(400, 900, 96, 390, 844)).toEqual({
      left: 390 - 96 - 8,
      top: 844 - 96 - 8,
    });
  });

  it('round-trips a normalized anchor through a different viewport', () => {
    const size = 96;
    const start = chatHatAnchorFromPixels(200, 400, size, 390, 844);
    const onPhone = chatHatPixelsFromAnchor(start, size, 390, 844);
    expect(onPhone.left).toBeCloseTo(200, 5);
    expect(onPhone.top).toBeCloseTo(400, 5);

    const onWide = chatHatPixelsFromAnchor(start, 112, 1280, 800);
    expect(onWide.left).toBeGreaterThan(200);
    expect(onWide.top).toBeGreaterThan(8);
    expect(onWide.left).toBeLessThan(1280 - 112);
    expect(onWide.top).toBeLessThan(800 - 112);
  });

  it('treats the default bottom-right corner as nx/ny ≈ 1', () => {
    const size = 96;
    const left = 390 - size - 8;
    const top = 844 - size - 8;
    const anchor = chatHatAnchorFromPixels(left, top, size, 390, 844);
    expect(anchor.nx).toBeCloseTo(1);
    expect(anchor.ny).toBeCloseTo(1);
  });

  it('accepts only finite anchors', () => {
    expect(isChatHatAnchor({ nx: 0.2, ny: 0.8 })).toBe(true);
    expect(isChatHatAnchor({ nx: 0.2 })).toBe(false);
    expect(isChatHatAnchor(null)).toBe(false);
  });
});
