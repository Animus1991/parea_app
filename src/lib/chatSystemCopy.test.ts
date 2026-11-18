import { describe, expect, it } from 'vitest';
import {
  GROUP_CHAT_STARTERS,
  SYS_COORDINATION_UNLOCKED,
  SYS_DM_UNLOCKED,
  localizeSystemBody,
} from './chatSystemCopy';

const tEl = (el: string, _en?: string) => el;
const tEn = (el: string, en?: string) => en ?? el;

describe('localizeSystemBody', () => {
  it('translates the coordination unlock key and the legacy English sentence', () => {
    expect(localizeSystemBody(SYS_COORDINATION_UNLOCKED, tEl)).toMatch(/ομάδα επιβεβαιώθηκε/);
    expect(localizeSystemBody('Coordination chat unlocked after mutual accept.', tEl)).toMatch(
      /ομάδα επιβεβαιώθηκε/,
    );
    expect(localizeSystemBody(SYS_COORDINATION_UNLOCKED, tEn)).toMatch(/group is confirmed/i);
  });

  it('translates DM unlock copy', () => {
    expect(localizeSystemBody(SYS_DM_UNLOCKED, tEl)).toMatch(/προσωπική συνομιλία/);
    expect(localizeSystemBody('Direct message unlocked between connections.', tEn)).toMatch(
      /Direct message unlocked/,
    );
  });

  it('picks the Greek side of bilingual slash bodies', () => {
    expect(
      localizeSystemBody(
        'I have arrived at the meeting point. / Έφτασα στο σημείο συνάντησης.',
        tEl,
      ),
    ).toBe('Έφτασα στο σημείο συνάντησης.');
    expect(
      localizeSystemBody(
        'I have arrived at the meeting point. / Έφτασα στο σημείο συνάντησης.',
        tEn,
      ),
    ).toBe('I have arrived at the meeting point.');
  });

  it('leaves ordinary user text unchanged', () => {
    expect(localizeSystemBody('Γεια σε όλους!', tEn)).toBe('Γεια σε όλους!');
  });

  it('exposes starter prompts for the empty group thread', () => {
    expect(GROUP_CHAT_STARTERS.length).toBeGreaterThanOrEqual(3);
  });
});
