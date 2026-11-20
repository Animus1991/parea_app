// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import { decodeQrPixels } from './qrScan';
import { checkInPayload, parseCheckInPayload } from './checkIn';

/**
 * Rasterises the ticket's QR exactly as the app draws it (qrcode.react path:
 * one horizontal run per dark stretch) into RGBA pixels, the way a camera
 * frame reaches the software decoder.
 */
function ticketPixels(value: string, scale = 6) {
  const svg = renderToStaticMarkup(<QRCodeSVG value={value} size={168} level="M" marginSize={4} />);
  const size = Number(/viewBox="0 0 (\d+) \d+"/.exec(svg)?.[1]);
  // Runs are written «M4 4h7v1H4z», and the last one of a row «M22,4 h7v1H22z».
  const dark = [...svg.matchAll(/M(\d+)[ ,](\d+) ?h(\d+)v1H\d+z/g)].map((m) => ({ x: +m[1], y: +m[2], len: +m[3] }));
  const side = size * scale;
  const data = new Uint8ClampedArray(side * side * 4).fill(255);
  for (const run of dark) {
    for (let py = run.y * scale; py < (run.y + 1) * scale; py++) {
      for (let px = run.x * scale; px < (run.x + run.len) * scale; px++) {
        const i = (py * side + px) * 4;
        data[i] = data[i + 1] = data[i + 2] = 0;
      }
    }
  }
  return { data, side, runs: dark.length };
}

describe('ticket QR with the software decoder (Safari / Firefox path)', () => {
  it('reads the same payload the door check-in expects', async () => {
    const payload = checkInPayload('g-nn1', 'u2', '012345');
    const { data, side, runs } = ticketPixels(payload);
    expect(runs).toBeGreaterThan(50);
    const read = await decodeQrPixels(data, side, side);
    expect(read).toBe(payload);
    expect(parseCheckInPayload(read!)).toEqual({ groupId: 'g-nn1', userId: 'u2', code: '012345' });
  });

  it('returns null for a frame with no code', async () => {
    const blank = new Uint8ClampedArray(120 * 120 * 4).fill(255);
    expect(await decodeQrPixels(blank, 120, 120)).toBeNull();
  });
});
