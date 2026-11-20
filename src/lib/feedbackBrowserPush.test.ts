import { describe, expect, it } from 'vitest';
import { feedbackPushCopy } from './feedbackBrowserPush';

describe('feedbackPushCopy', () => {
  it('stays short and does not mention a join lock', () => {
    const el = feedbackPushCopy('Cine Thisio', 'el');
    const en = feedbackPushCopy('Cine Thisio', 'en');
    expect(el.title).toBe('Πώς πέρασες;');
    expect(el.body).toContain('Cine Thisio');
    expect(en.title).toBe('How was it?');
    expect(`${el.title} ${el.body} ${en.title} ${en.body}`).not.toMatch(/join|βραδιά μέχρι/i);
  });
});
