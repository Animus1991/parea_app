import { describe, expect, it } from 'vitest';
import {
  floodClearEdgeBackground,
  opaqueBounds,
  opaqueShare,
  transparentShare,
} from './prepareChatHatImage';

function makeImage(width: number, height: number): ImageData {
  return {
    data: new Uint8ClampedArray(width * height * 4),
    width,
    height,
    colorSpace: 'srgb',
  } as ImageData;
}

function paint(image: ImageData, x: number, y: number, r: number, g: number, b: number, a = 255) {
  const i = (y * image.width + x) * 4;
  image.data[i] = r;
  image.data[i + 1] = g;
  image.data[i + 2] = b;
  image.data[i + 3] = a;
}

function fill(image: ImageData, r: number, g: number, b: number, a = 255) {
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) paint(image, x, y, r, g, b, a);
  }
}

describe('prepareChatHatImage', () => {
  it('clears a plain white edge and keeps a straw-colored subject', () => {
    const image = makeImage(32, 32);
    fill(image, 255, 255, 255);
    for (let y = 8; y < 24; y++) {
      for (let x = 8; x < 24; x++) paint(image, x, y, 196, 155, 80);
    }
    expect(floodClearEdgeBackground(image)).toBe(true);
    expect(image.data[3]).toBe(0);
    const mid = ((16 * 32 + 16) * 4) + 3;
    expect(image.data[mid]).toBe(255);
    const box = opaqueBounds(image.data, 32, 32);
    expect(box).toEqual({ x: 8, y: 8, w: 16, h: 16 });
  });

  it('leaves a busy scene whose corners disagree', () => {
    const image = makeImage(16, 16);
    fill(image, 20, 40, 80);
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) paint(image, x, y, 240, 240, 240);
    }
    expect(floodClearEdgeBackground(image)).toBe(false);
    expect(opaqueShare(image.data)).toBe(1);
  });

  it('refuses a fully transparent image as empty', () => {
    const image = makeImage(8, 8);
    expect(opaqueBounds(image.data, 8, 8)).toBeNull();
    expect(opaqueShare(image.data)).toBe(0);
  });

  it('skips files that are already cut out', () => {
    const image = makeImage(8, 8);
    fill(image, 196, 155, 80, 0);
    for (let y = 2; y < 6; y++) {
      for (let x = 2; x < 6; x++) paint(image, x, y, 196, 155, 80);
    }
    expect(transparentShare(image.data)).toBeGreaterThan(0.02);
    expect(floodClearEdgeBackground(image)).toBe(false);
    expect(image.data[(2 * 8 + 2) * 4 + 3]).toBe(255);
  });
});
