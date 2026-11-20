/**
 * Reading a ticket QR from the camera (Φ28). Chrome/Android has a native
 * BarcodeDetector; Safari and Firefox do not, so there the decoder (jsQR) is
 * loaded on demand — only when the host actually starts scanning.
 */
export type QrFrameReader = (video: HTMLVideoElement) => Promise<string | null>;

type NativeDetector = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type NativeDetectorCtor = {
  new (o: { formats: string[] }): NativeDetector;
  getSupportedFormats?: () => Promise<string[]>;
};

/** Longest side handed to the software decoder: plenty for a ticket held up to the camera, and fast. */
const MAX_DECODE_SIDE = 480;

/** Decodes one RGBA frame with jsQR (tickets are dark-on-light, so no inverted pass). */
export async function decodeQrPixels(data: Uint8ClampedArray, width: number, height: number): Promise<string | null> {
  const { default: jsQR } = await import('jsqr');
  return jsQR(data, width, height, { inversionAttempts: 'dontInvert' })?.data || null;
}

export function cameraScanSupported(): boolean {
  return typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia);
}

export async function createQrFrameReader(): Promise<QrFrameReader> {
  const Native = (window as unknown as { BarcodeDetector?: NativeDetectorCtor }).BarcodeDetector;
  if (Native) {
    try {
      const formats = await Native.getSupportedFormats?.();
      if (!formats || formats.includes('qr_code')) {
        const detector = new Native({ formats: ['qr_code'] });
        return async (video) => (await detector.detect(video).catch(() => []))[0]?.rawValue ?? null;
      }
    } catch {
      /* fall through to the software decoder */
    }
  }
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  return async (video) => {
    if (!ctx || !video.videoWidth || !video.videoHeight) return null;
    const scale = Math.min(1, MAX_DECODE_SIDE / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return decodeQrPixels(frame.data, frame.width, frame.height);
  };
}
