import { describe, expect, it } from 'vitest';
import { homeVerifyIsNeeded } from './useHomeVerifyNeeded';

describe('homeVerifyIsNeeded', () => {
  it('hides when both email and phone are verified', () => {
    expect(homeVerifyIsNeeded({ emailVerified: true, phoneVerified: true }, false)).toBe(false);
  });

  it('shows when a contact method is still unverified', () => {
    expect(homeVerifyIsNeeded({ emailVerified: false, phoneVerified: true }, false)).toBe(true);
    expect(homeVerifyIsNeeded({ emailVerified: true, phoneVerified: false }, false)).toBe(true);
  });

  it('hides after the session dismiss', () => {
    expect(homeVerifyIsNeeded({ emailVerified: false, phoneVerified: false }, true)).toBe(false);
  });
});
