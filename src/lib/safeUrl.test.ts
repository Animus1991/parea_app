import { describe, expect, it } from 'vitest';
import { safeExternalUrl } from './safeUrl';

describe('safeExternalUrl', () => {
  it('keeps http and https URLs', () => {
    expect(safeExternalUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(safeExternalUrl('http://example.com')).toBe('http://example.com/');
  });

  it('adds https to bare hosts and protocol-relative URLs', () => {
    expect(safeExternalUrl('example.com/page')).toBe('https://example.com/page');
    expect(safeExternalUrl('//example.com')).toBe('https://example.com/');
    expect(safeExternalUrl('  www.example.gr  ')).toBe('https://www.example.gr/');
  });

  it('rejects script and other non-web schemes', () => {
    expect(safeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(safeExternalUrl(' JavaScript:alert(1)')).toBeNull();
    expect(safeExternalUrl('data:text/html,<b>x</b>')).toBeNull();
    expect(safeExternalUrl('vbscript:x')).toBeNull();
    expect(safeExternalUrl('ftp://example.com')).toBeNull();
  });

  it('rejects empty and malformed values', () => {
    expect(safeExternalUrl('')).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl('https://')).toBeNull();
  });
});
