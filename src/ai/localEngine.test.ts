import { describe, expect, it } from 'vitest';
import { planLocal, UNDO_CALL, type LocalEngineContext } from './localEngine';
import { extractDateRange, extractTime, extractCategories, extractArea } from './entities';
import { normalize, fuzzyKey } from './text';

const ctx: LocalEngineContext = {
  isAdmin: false,
  areas: ['Gazi, Athens', 'Koukaki, Athens', 'Psyrri, Athens', 'Piraeus → Aegina'],
  userNames: ['Maria', 'Nikos'],
  lastEventIds: ['e1', 'e2', 'e3'],
  // Friday 13 Nov 2026
  now: new Date('2026-11-13T10:00:00'),
};

const first = (text: string) => planLocal(text, ctx).calls[0];

describe('text helpers', () => {
  it('normalizes Greek accents, case and final sigma', () => {
    expect(normalize('ΣΑΒΒΑΤΟΚΎΡΙΑΚΟ Καφές')).toBe('σαββατοκυριακο καφεσ');
  });
  it('matches Greek input against Latin data', () => {
    expect(fuzzyKey('γκάζι')).toBe(fuzzyKey('Gazi'));
    expect(fuzzyKey('Ψυρρή')).toBe(fuzzyKey('Psyrri'));
  });
});

describe('entities', () => {
  const now = ctx.now!;
  it('resolves the upcoming weekend', () => {
    const r = extractDateRange(normalize('αυτό το Σαββατοκύριακο'), now);
    expect(r?.from).toBe('2026-11-14');
    expect(r?.to).toBe('2026-11-15');
  });
  it('resolves tomorrow and weekday names', () => {
    expect(extractDateRange(normalize('αύριο'), now)?.from).toBe('2026-11-14');
    expect(extractDateRange(normalize('την Τρίτη'), now)?.from).toBe('2026-11-17');
    expect(extractDateRange('next week', now)?.from).toBe('2026-11-16');
  });
  it('parses clock times', () => {
    expect(extractTime(normalize('στις 21:30'))).toBe('21:30');
    expect(extractTime(normalize('στις 9 το βράδυ'))).toBe('21:00');
    expect(extractTime('at 7pm')).toBe('19:00');
  });
  it('maps synonyms to categories', () => {
    expect(extractCategories(normalize('θέλω πεζοπορία'))).toContain('Hiking');
    expect(extractCategories(normalize('ηλεκτρονική μουσική'))).toEqual(['Electronic Music']);
    expect(extractCategories('a movie night')).toContain('Cinema');
  });
  it('finds areas written in Greek', () => {
    expect(extractArea(normalize('κάτι στο Γκάζι'), ctx.areas)).toBe('Gazi');
  });
});

describe('planLocal intents', () => {
  it('searches with category, date and price', () => {
    const c = first('Βρες μου δωρεάν πεζοπορία αυτό το Σαββατοκύριακο');
    expect(c.name).toBe('search_events');
    expect(c.args).toMatchObject({ categories: ['Hiking'], price: 'free', dateFrom: '2026-11-14', dateTo: '2026-11-15' });
  });
  it('searches by area in English', () => {
    expect(first('anything in Koukaki tonight?')).toMatchObject({ name: 'search_events', args: { area: 'Koukaki' } });
  });
  it('saves by ordinal reference', () => {
    expect(first('αποθήκευσε το δεύτερο')).toEqual({ name: 'save_event', args: { event: '2' } });
    expect(first('save the last one')).toEqual({ name: 'save_event', args: { event: '-1' } });
  });
  it('switches theme and language together', () => {
    const calls = planLocal('βάλε σκοτεινό θέμα και αγγλικά', ctx).calls.map((c) => c.name);
    expect(calls).toEqual(['set_language', 'set_theme']);
  });
  it('messages the group with the tail text', () => {
    expect(first('γράψε στην ομάδα ότι θα αργήσω 10 λεπτά')).toEqual({
      name: 'send_group_message',
      args: { text: 'θα αργήσω 10 λεπτά' },
    });
  });
  it('drafts an event with extracted details', () => {
    const c = first('Φτιάξε εκδήλωση για σινεμά την Παρασκευή στις 21:00 στο Ψυρρή για 4 άτομα');
    expect(c.name).toBe('draft_event');
    expect(c.args).toMatchObject({ category: 'Cinema', date: '2026-11-13', time: '21:00', area: 'Psyrri', maxParticipants: 4 });
    expect(c.args.title).toBe('Σινεμά · Psyrri');
  });
  it('summarizes the agenda for this week', () => {
    expect(first('τι έχω αυτή την εβδομάδα;')).toMatchObject({
      name: 'summarize_agenda',
      args: { dateFrom: '2026-11-13', dateLabelEn: 'This week' },
    });
  });
  it('navigates by page synonyms', () => {
    expect(first('άνοιξε τις ρυθμίσεις')).toEqual({ name: 'navigate', args: { page: 'settings' } });
    expect(first('go to my calendar')).toEqual({ name: 'navigate', args: { page: 'agenda' } });
    expect(first('ειδοποιήσεις')).toMatchObject({ name: 'summarize_notifications' });
  });
  it('catches the user up on «τι νέο;» but keeps notification questions separate', () => {
    expect(first('τι νέο υπάρχει;')).toMatchObject({ name: 'whats_new' });
    expect(first('τι έχασα;')).toMatchObject({ name: 'whats_new' });
    expect(first("what's new?")).toMatchObject({ name: 'whats_new' });
    expect(first('τι νέα ειδοποιήσεις έχω;')).toMatchObject({ name: 'summarize_notifications' });
  });
  it('plans verification, wallet, export and forming-plan intents', () => {
    expect(first('ξεκίνα επαλήθευση email')).toMatchObject({ name: 'start_verification', args: { method: 'email' } });
    expect(first('σύνοψη πορτοφολιού')).toMatchObject({ name: 'summarize_wallet' });
    expect(first('εξήγαγε το ημερολόγιό μου')).toMatchObject({ name: 'export_agenda' });
    expect(first('δείξε σχέδια που σχηματίζονται')).toMatchObject({ name: 'list_forming_plans' });
    expect(first('μπες στην πρόκληση c2')).toMatchObject({ name: 'join_challenge', args: { challengeId: 'c2', leave: false } });
  });
  it('plans where_is and draft_profile', () => {
    expect(first('πού εξάγω το ημερολόγιο;')).toMatchObject({ name: 'where_is' });
    expect(first('where do I verify my email?')).toMatchObject({ name: 'where_is' });
    expect(first('πρότεινε bio για το προφίλ μου: «Λατρεύω πεζοπορία»')).toMatchObject({ name: 'draft_profile' });
  });
  it('hides admin routes from members', () => {
    expect(first('open admin')?.args?.page).not.toBe('admin');
  });
  it('answers knowledge questions', () => {
    expect(first('Πώς ανεβαίνει η αξιοπιστία μου;')).toEqual({ name: 'explain', args: { topic: 'reliability' } });
  });
  it('updates privacy', () => {
    expect(first('κάνε το προφίλ μου ιδιωτικό')).toEqual({ name: 'update_privacy', args: { profileVisibility: 'private' } });
    expect(first('stop sharing my location')).toEqual({ name: 'update_privacy', args: { shareLocation: false } });
  });
  it('turns off promotional notifications', () => {
    expect(first('σταμάτα τις προωθητικές ειδοποιήσεις')).toEqual({ name: 'update_notification_prefs', args: { promos: false } });
  });
  it('adds interests', () => {
    expect(first('πρόσθεσε τη γιόγκα στα ενδιαφέροντά μου')).toEqual({ name: 'add_interest', args: { interest: 'Wellness' } });
  });
  it('recognises undo and capabilities', () => {
    expect(first('αναίρεση').name).toBe(UNDO_CALL);
    expect(first('τι μπορείς να κάνεις;').name).toBe('capabilities');
  });
  it('falls back to a clarifying reply for gibberish', () => {
    const plan = planLocal('qq', ctx);
    expect(plan.calls).toHaveLength(0);
    expect(plan.reply?.en).toMatch(/not sure/);
  });
});

describe('demonstratives', () => {
  it('maps «this event» to the focused event sentinel', () => {
    expect(first('αποθήκευσε αυτή την εκδήλωση')).toEqual({ name: 'save_event', args: { event: 'this' } });
    expect(first('add this to my calendar')).toMatchObject({ name: 'add_to_calendar', args: { event: 'this' } });
  });
});

describe('conversational queries', () => {
  it('does not turn filler words into search keywords', () => {
    const c = first('Τι να κάνω αυτό το Σαββατοκύριακο;');
    expect(c.name).toBe('search_events');
    expect(c.args.query).toBeUndefined();
    expect(c.args).toMatchObject({ dateFrom: '2026-11-14', dateTo: '2026-11-15' });
  });
});
