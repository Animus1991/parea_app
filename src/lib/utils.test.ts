import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('keeps text-count next to a text colour (it is a size, not a colour)', () => {
    expect(cn('px-1 text-count font-bold', 'text-ink-muted')).toBe('px-1 text-count font-bold text-ink-muted');
  });

  it('still lets a later size win over text-count', () => {
    expect(cn('text-count', 'text-xs')).toBe('text-xs');
  });
});
