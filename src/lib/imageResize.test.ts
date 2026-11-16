import { describe, expect, it } from 'vitest';
import { fitWithin, fileToResizedDataUrl, ImageResizeFailure, MAX_IMAGE_INPUT_BYTES } from './imageResize';

describe('imageResize', () => {
  it('keeps the aspect ratio and never upscales', () => {
    expect(fitWithin(4000, 3000, 800)).toEqual({ width: 800, height: 600 });
    expect(fitWithin(300, 1200, 600)).toEqual({ width: 150, height: 600 });
    expect(fitWithin(200, 100, 800)).toEqual({ width: 200, height: 100 });
    expect(fitWithin(0, 100, 800)).toEqual({ width: 0, height: 0 });
  });

  it('refuses non-images and oversized inputs before decoding', async () => {
    await expect(fileToResizedDataUrl(new File(['x'], 'a.txt', { type: 'text/plain' }), { maxSize: 100 })).rejects.toMatchObject({ code: 'not_image' });
    const big = new File(['x'], 'b.jpg', { type: 'image/jpeg' });
    Object.defineProperty(big, 'size', { value: MAX_IMAGE_INPUT_BYTES + 1 });
    await expect(fileToResizedDataUrl(big, { maxSize: 100 })).rejects.toBeInstanceOf(ImageResizeFailure);
  });
});
