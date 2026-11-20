// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { INVITE_ID_PATTERN, validHostKey } from './invitesStore';
import { newHostKey, newInviteId } from '../src/services/invitesApi';

/** What the app mints must be what the server accepts, and must not be guessable. */
describe('invite ids and host keys', () => {
  it('mints ids the server accepts, with 96 random bits', () => {
    const id = newInviteId();
    expect(id).toMatch(/^inv_[0-9a-f]{24}$/);
    expect(INVITE_ID_PATTERN.test(id)).toBe(true);
  });

  it('never repeats an id', () => {
    const ids = new Set(Array.from({ length: 2000 }, () => newInviteId()));
    expect(ids.size).toBe(2000);
  });

  it('mints host keys the server accepts', () => {
    expect(validHostKey(newHostKey())).toBe(true);
  });
});
