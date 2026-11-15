import { describe, expect, it } from 'vitest';
import { topicsForAction } from './invalidation';

describe('invalidation map', () => {
  it('maps company join to company+groups+chat+notifications', () => {
    expect(topicsForAction('respond_company_join')).toEqual(
      expect.arrayContaining(['company', 'groups', 'chat', 'notifications']),
    );
  });

  it('returns empty for unknown tools', () => {
    expect(topicsForAction('capabilities')).toEqual([]);
  });
});
