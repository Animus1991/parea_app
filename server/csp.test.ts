import { describe, expect, it } from 'vitest';
import { buildCsp, cspHeaderName, cspMode, originOf } from './csp';

const directive = (csp: string, name: string) => csp.split('; ').find((d) => d.startsWith(name + ' ')) ?? '';

describe('Content-Security-Policy', () => {
  it('locks scripts, objects, framing and base to known sources', () => {
    const csp = buildCsp({});
    expect(directive(csp, 'script-src')).toBe("script-src 'self' https://accounts.google.com https://apis.google.com https://www.gstatic.com");
    expect(directive(csp, 'script-src')).not.toContain('unsafe-inline');
    expect(directive(csp, 'script-src')).not.toContain('unsafe-eval');
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it('adds the configured API, socket and auth origins', () => {
    const csp = buildCsp({
      VITE_API_BASE_URL: 'https://api.nakamas.app/v1',
      VITE_WS_URL: 'wss://rt.nakamas.app',
      VITE_FIREBASE_AUTH_DOMAIN: 'login.nakamas.app',
    });
    const connect = directive(csp, 'connect-src');
    expect(connect).toContain('https://api.nakamas.app');
    expect(connect).toContain('wss://api.nakamas.app');
    expect(connect).toContain('wss://rt.nakamas.app');
    expect(directive(csp, 'frame-src')).toContain('https://login.nakamas.app');
  });

  it('ignores malformed extras instead of injecting them', () => {
    const csp = buildCsp({ CSP_CONNECT_SRC: "https://ok.example.com 'unsafe-inline' javascript:x;script-src *", VITE_FIREBASE_AUTH_DOMAIN: 'evil; script-src *' });
    expect(directive(csp, 'connect-src')).toContain('https://ok.example.com');
    expect(csp).not.toContain("'unsafe-inline' javascript");
    expect(csp).not.toContain('script-src *');
    expect(directive(csp, 'frame-src')).not.toContain('evil');
  });

  it('adds a report endpoint and picks the header by mode', () => {
    expect(buildCsp({}, { reportUri: '/api/csp-report' })).toMatch(/report-uri \/api\/csp-report$/);
    expect(cspMode({})).toBe('enforce');
    expect(cspHeaderName(cspMode({ CSP_MODE: 'report-only' }))).toBe('Content-Security-Policy-Report-Only');
    expect(cspHeaderName(cspMode({ CSP_MODE: 'off' }))).toBeNull();
    expect(originOf('/relative')).toBeNull();
    expect(originOf('ftp://x.y')).toBeNull();
  });
});
