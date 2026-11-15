import { describe, expect, it } from 'vitest';
import { isWhereIsQuestion, rankWhereIs } from './whereIs';
import { normalize } from './text';

describe('whereIs', () => {
  it('recognises bilingual where questions', () => {
    expect(isWhereIsQuestion(normalize('πού εξάγω το ημερολόγιο;'))).toBe(true);
    expect(isWhereIsQuestion(normalize('where do I verify my email?'))).toBe(true);
    expect(isWhereIsQuestion(normalize('βρες μου σινεμά'))).toBe(false);
  });

  it('ranks calendar export toward agenda', () => {
    const hits = rankWhereIs('πού εξάγω το ημερολόγιο;', false, 3);
    expect(hits[0]?.route.id).toBe('agenda');
  });

  it('ranks verification toward verification/trust', () => {
    const hits = rankWhereIs('where do I verify my identity?', false, 3);
    expect(['verification', 'trust']).toContain(hits[0]?.route.id);
  });
});
