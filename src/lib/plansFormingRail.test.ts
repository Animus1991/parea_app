import { describe, expect, it } from 'vitest';
import { hidesFindCompanyShortcut, isPlansRailRoute } from './plansFormingRail';

describe('find-company surfaces', () => {
  it('keeps the desktop rail on Home only', () => {
    expect(isPlansRailRoute('/')).toBe(true);
    expect(isPlansRailRoute('/plans')).toBe(false);
    expect(isPlansRailRoute('/buddy-seek')).toBe(false);
  });

  it('does not stack the nearby-outings overlay on My Plans', () => {
    expect(hidesFindCompanyShortcut('/')).toBe(false);
    expect(hidesFindCompanyShortcut('/events/e1')).toBe(false);
    expect(hidesFindCompanyShortcut('/buddy-seek')).toBe(false);
    expect(hidesFindCompanyShortcut('/plans')).toBe(true);
    expect(hidesFindCompanyShortcut('/plans/foo')).toBe(true);
  });
});
