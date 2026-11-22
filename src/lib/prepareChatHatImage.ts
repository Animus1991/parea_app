import {
  ImageResizeFailure,
  MAX_IMAGE_INPUT_BYTES,
  fitWithin,
  loadImage,
} from './imageResize';

/** 2× the desktop FAB (112px) so the bubble stays sharp. */
export const CHAT_HAT_ASSET_PX = 224;
export const MAX_CUSTOM_CHAT_HATS = 8;
/** Hard cap on a persisted data URL so localStorage cannot blow the quota. */
export const MAX_CUSTOM_HAT_DATA_URL_CHARS = 400_000;
/** Working copy before the final square — keeps flood-fill cheap on phones. */
const WORK_MAX_EDGE = 640;
const ALPHA_CUTOUT = 16;
const OPAQUE_FLOOR = 24;
const CORNER_SAMPLE = 5;
const BG_MATCH = 38;
const CORNER_AGREE = 48;
const MIN_OPAQUE_AFTER_CLEAR = 0.08;
const ALREADY_CUTOUT = 0.02;
const PAD = 0.1;

type Rgb = [number, number, number];

function dist(a: Rgb, b: Rgb): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function samplePatch(data: Uint8ClampedArray, width: number, height: number, x0: number, y0: number): Rgb {
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  const x1 = Math.min(width, x0 + CORNER_SAMPLE);
  const y1 = Math.min(height, y0 + CORNER_SAMPLE);
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] < OPAQUE_FLOOR) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
  }
  if (!n) return [255, 255, 255];
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

export function transparentShare(data: Uint8ClampedArray): number {
  if (!data.length) return 0;
  const pixels = data.length / 4;
  let n = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < ALPHA_CUTOUT) n++;
  }
  return n / pixels;
}

export function opaqueShare(data: Uint8ClampedArray): number {
  if (!data.length) return 0;
  const pixels = data.length / 4;
  let n = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] >= OPAQUE_FLOOR) n++;
  }
  return n / pixels;
}

export function opaqueBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
): { x: number; y: number; w: number; h: number } | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] < OPAQUE_FLOOR) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/**
 * Punch a connected studio/plain backdrop to transparent. Leaves the photo
 * alone when corners disagree (busy scene) or when the file is already cut out.
 * Returns true when pixels changed.
 */
export function floodClearEdgeBackground(image: ImageData): boolean {
  const { data, width, height } = image;
  if (transparentShare(data) >= ALREADY_CUTOUT) return false;

  const corners: Rgb[] = [
    samplePatch(data, width, height, 0, 0),
    samplePatch(data, width, height, Math.max(0, width - CORNER_SAMPLE), 0),
    samplePatch(data, width, height, 0, Math.max(0, height - CORNER_SAMPLE)),
    samplePatch(data, width, height, Math.max(0, width - CORNER_SAMPLE), Math.max(0, height - CORNER_SAMPLE)),
  ];
  const bg: Rgb = [
    Math.round(corners.reduce((s, c) => s + c[0], 0) / 4),
    Math.round(corners.reduce((s, c) => s + c[1], 0) / 4),
    Math.round(corners.reduce((s, c) => s + c[2], 0) / 4),
  ];
  if (corners.some((c) => dist(c, bg) > CORNER_AGREE)) return false;

  const matches = (i: number) => {
    if (data[i + 3] < ALPHA_CUTOUT) return false;
    return dist([data[i], data[i + 1], data[i + 2]], bg) <= BG_MATCH;
  };

  const seen = new Uint8Array(width * height);
  const qx = new Int32Array(width * height);
  const qy = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const push = (x: number, y: number) => {
    const p = y * width + x;
    if (seen[p]) return;
    if (!matches(p * 4)) return;
    seen[p] = 1;
    qx[tail] = x;
    qy[tail] = y;
    tail++;
  };

  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  if (!tail) return false;

  while (head < tail) {
    const x = qx[head];
    const y = qy[head];
    head++;
    data[(y * width + x) * 4 + 3] = 0;
    if (x > 0) push(x - 1, y);
    if (x + 1 < width) push(x + 1, y);
    if (y > 0) push(x, y - 1);
    if (y + 1 < height) push(x, y + 1);
  }
  return true;
}

function drawContained(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  size: number,
): void {
  const pad = Math.round(size * PAD);
  const inner = size - pad * 2;
  const scale = Math.min(inner / sw, inner / sh);
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));
  const dx = Math.round((size - dw) / 2);
  const dy = Math.round((size - dh) / 2);
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Turns a picked photo into a 224×224 PNG data URL for the chat bubble:
 * edge-connected plain backgrounds become transparent, then the subject is
 * fitted (never stretched) into the FAB box.
 */
export async function fileToChatHatDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ImageResizeFailure('not_image');
  if (file.size > MAX_IMAGE_INPUT_BYTES) throw new ImageResizeFailure('too_large');

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const fitted = fitWithin(img.naturalWidth, img.naturalHeight, WORK_MAX_EDGE);
    if (!fitted.width || !fitted.height) throw new ImageResizeFailure('decode_failed');

    const work = document.createElement('canvas');
    work.width = fitted.width;
    work.height = fitted.height;
    const workCtx = work.getContext('2d', { willReadFrequently: true });
    if (!workCtx) throw new ImageResizeFailure('decode_failed');
    workCtx.drawImage(img, 0, 0, fitted.width, fitted.height);

    const snapshot = workCtx.getImageData(0, 0, fitted.width, fitted.height);
    const backup = new Uint8ClampedArray(snapshot.data);
    floodClearEdgeBackground(snapshot);
    if (opaqueShare(snapshot.data) < MIN_OPAQUE_AFTER_CLEAR) {
      snapshot.data.set(backup);
    }
    workCtx.putImageData(snapshot, 0, 0);

    const box = opaqueBounds(snapshot.data, fitted.width, fitted.height);
    if (!box) throw new ImageResizeFailure('empty_hat');

    const out = document.createElement('canvas');
    out.width = CHAT_HAT_ASSET_PX;
    out.height = CHAT_HAT_ASSET_PX;
    const outCtx = out.getContext('2d');
    if (!outCtx) throw new ImageResizeFailure('decode_failed');
    drawContained(outCtx, work, box.x, box.y, box.w, box.h, CHAT_HAT_ASSET_PX);
    const src = out.toDataURL('image/png');
    if (src.length > MAX_CUSTOM_HAT_DATA_URL_CHARS) throw new ImageResizeFailure('too_large');
    return src;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
