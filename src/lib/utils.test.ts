import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn (className merge)', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('drops falsy values', () => {
    expect(cn('a', false, null, undefined, 'c')).toBe('a c');
  });
});
