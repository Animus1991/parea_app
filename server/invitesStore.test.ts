// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  addResponse,
  getPublicInvite,
  listResponses,
  openInvitesDb,
  sanitizeCard,
  sanitizeResponse,
  upsertInvite,
  validHostKey,
} from './invitesStore';

const KEY = 'host-key-0123456789abcdef';
const card = () =>
  sanitizeCard({
    eventId: 'nn1',
    eventTitle: 'Nakamas Nights',
    date: '2026-11-27',
    time: '20:30',
    area: 'Psyrri, Athens',
    category: 'Social',
    coverId: 'soc-teal',
    hostFirstName: 'Alex',
    members: 4,
    targetSize: 6,
    exactLocation: 'must not be stored',
  })!;

describe('server invites (Φ28)', () => {
  it('keeps only public, bounded card fields', () => {
    expect(card()).not.toHaveProperty('exactLocation');
    expect(sanitizeCard({ ...card(), date: 'tomorrow' })).toBeNull();
    expect(sanitizeCard({ ...card(), eventTitle: '' })).toBeNull();
    expect(sanitizeCard(null)).toBeNull();
    expect(sanitizeResponse({ name: '  Σοφία  ', status: 'going' })).toEqual({ name: 'Σοφία', status: 'going' });
    expect(sanitizeResponse({ name: 'S', status: 'going' })).toBeNull();
    expect(sanitizeResponse({ name: 'Σοφία', status: 'yes' })).toBeNull();
    expect(validHostKey(KEY)).toBe(true);
    expect(validHostKey('short')).toBe(false);
  });

  it('lets only the first publisher update the invite', () => {
    const db = openInvitesDb(':memory:');
    expect(upsertInvite(db, 'inv1', card(), KEY)).toBe('created');
    expect(upsertInvite(db, 'inv1', { ...card(), coverId: 'soc-plum' }, KEY)).toBe('updated');
    expect(upsertInvite(db, 'inv1', card(), 'someone-else-0123456789')).toBe('forbidden');
    expect(getPublicInvite(db, 'inv1')!.card.coverId).toBe('soc-plum');
  });

  it('counts answers publicly and shows names only with the host key', () => {
    const db = openInvitesDb(':memory:');
    upsertInvite(db, 'inv1', card(), KEY);
    addResponse(db, 'inv1', { name: 'Σοφία', status: 'maybe' });
    addResponse(db, 'inv1', { name: 'σοφία', status: 'going' });
    addResponse(db, 'inv1', { name: 'Γιάννης', status: 'maybe' });
    expect(getPublicInvite(db, 'inv1')).toMatchObject({ going: 1, maybe: 1 });
    expect(JSON.stringify(getPublicInvite(db, 'inv1'))).not.toContain('Σοφία');
    const names = listResponses(db, 'inv1', KEY);
    expect(Array.isArray(names) && names.map((r) => `${r.name}:${r.status}`)).toEqual(['σοφία:going', 'Γιάννης:maybe']);
    expect(listResponses(db, 'inv1', 'wrong-key-0123456789abc')).toBe('forbidden');
    expect(addResponse(db, 'nope', { name: 'Σοφία', status: 'going' })).toBe('not_found');
  });

  it('stops taking answers when the outing is closed', () => {
    const db = openInvitesDb(':memory:');
    upsertInvite(db, 'inv1', { ...card(), closed: true }, KEY);
    expect(addResponse(db, 'inv1', { name: 'Σοφία', status: 'going' })).toBe('closed');
  });
});
