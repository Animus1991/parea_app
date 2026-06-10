import { describe, expect, it } from 'vitest';
import { resolveMockUserIdByEmail } from './mockUserEmails';

describe('mockUserEmails', () => {
  it('links demo emails to seed user ids', () => {
    expect(resolveMockUserIdByEmail('alex@nakamas.demo')).toBe('u1');
    expect(resolveMockUserIdByEmail('  DEMO@NAKAMAS.GR  ')).toBe('u1');
    expect(resolveMockUserIdByEmail('unknown@example.com')).toBeNull();
  });
});
