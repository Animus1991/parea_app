/**
 * Turns a picked image file into a small, self-contained JPEG data URL.
 *
 * Why: `URL.createObjectURL()` links die on reload, yet they were being saved
 * into persisted state, so profile photos turned into broken images after a
 * refresh. A downscaled data URL survives reloads and stays small enough for
 * on-device storage (a few hundred KB at most).
 */
export interface ResizeOptions {
  /** Longest edge in px after resizing. */
  maxSize: number;
  /** JPEG quality 0–1. */
  quality?: number;
}

/** Inputs larger than this are refused before decoding (protects low-end phones). */
export const MAX_IMAGE_INPUT_BYTES = 15 * 1024 * 1024;

export type ImageResizeError = 'not_image' | 'too_large' | 'decode_failed';

export class ImageResizeFailure extends Error {
  constructor(public readonly code: ImageResizeError) {
    super(code);
    this.name = 'ImageResizeFailure';
  }
}

/** Target dimensions that keep the aspect ratio and never upscale. */
export function fitWithin(width: number, height: number, maxSize: number): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(1, maxSize / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new ImageResizeFailure('decode_failed'));
    img.src = src;
  });
}

export async function fileToResizedDataUrl(file: File, { maxSize, quality = 0.82 }: ResizeOptions): Promise<string> {
  if (!file.type.startsWith('image/')) throw new ImageResizeFailure('not_image');
  if (file.size > MAX_IMAGE_INPUT_BYTES) throw new ImageResizeFailure('too_large');
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    const { width, height } = fitWithin(img.naturalWidth, img.naturalHeight, maxSize);
    if (!width || !height) throw new ImageResizeFailure('decode_failed');
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new ImageResizeFailure('decode_failed');
    // JPEG has no alpha: paint white first so transparent PNGs do not turn black.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Plain-language reason for a failed pick. */
export function imageErrorText(err: unknown, t: (el: string, en: string) => string): string {
  const code = err instanceof ImageResizeFailure ? err.code : 'decode_failed';
  if (code === 'not_image') return t('Διάλεξε αρχείο εικόνας (JPG, PNG, WebP).', 'Pick an image file (JPG, PNG, WebP).');
  if (code === 'too_large') return t('Η εικόνα είναι πάνω από 15 MB.', 'The image is larger than 15 MB.');
  return t('Δεν ήταν δυνατή η ανάγνωση της εικόνας.', 'The image could not be read.');
}
