import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '../store';
import { useLanguageStore } from '../store/languageStore';
import { availableActions, getAction, toFunctionDeclarations } from './actions';
import type { ActionResult, ActionRuntime } from './types';

const navigated: string[] = [];
const rt = (over: Partial<ActionRuntime> = {}): ActionRuntime => ({
  navigate: (p) => navigated.push(p),
  pathname: '/',
  lang: 'el',
  lastEventIds: [],
  ...over,
});

async function run(name: string, args: Record<string, unknown>, runtime = rt()): Promise<ActionResult> {
  const action = getAction(name);
  if (!action) throw new Error(`missing action ${name}`);
  return action.run(args, runtime);
}

describe('copilot action registry', () => {
  beforeEach(() => {
    navigated.length = 0;
  });

  it('declares valid Gemini tools with unique names', () => {
    const decls = toFunctionDeclarations();
    const names = decls.map((d) => d.name);
    expect(new Set(names).size).toBe(names.length);
    for (const d of decls) {
      expect(d.description.length).toBeGreaterThan(10);
      if ('parameters' in d && d.parameters) expect(d.parameters.type).toBe('OBJECT');
    }
  });

  it('hides admin-only tools from non-admin users (least privilege)', () => {
    const prev = useStore.getState().currentUser;
    // An organizer is not an admin: hosting events grants no moderation tools.
    useStore.setState({ currentUser: prev ? { ...prev, isOrganizer: true, isAdmin: false } : prev });
    expect(availableActions().some((a) => a.name === 'resolve_report')).toBe(false);
    useStore.setState({ currentUser: prev ? { ...prev, isAdmin: true } : prev });
    expect(availableActions().some((a) => a.name === 'resolve_report')).toBe(true);
    useStore.setState({ currentUser: prev });
  });

  it('becoming a host never grants the admin role', () => {
    const s = useStore.getState();
    const uid = s.currentUser!.id;
    s.updateUser(uid, { isAdmin: true } as never);
    expect(useStore.getState().currentUser?.isAdmin ?? false).toBe(false);
    const event = s.events.find((e) => !s.groups.some((g) => g.eventId === e.id && g.hostId));
    if (event) useStore.getState().becomeEventHost(event.id);
    expect(useStore.getState().currentUser?.isOrganizer).toBe(true);
    expect(useStore.getState().currentUser?.isAdmin ?? false).toBe(false);
  });

  it('saves an event and undoes it', async () => {
    const id = useStore.getState().events.find((e) => !useStore.getState().savedEvents.includes(e.id))!.id;
    const res = await run('save_event', { event: id });
    expect(res.ok).toBe(true);
    expect(useStore.getState().savedEvents).toContain(id);
    res.undo?.();
    expect(useStore.getState().savedEvents).not.toContain(id);
  });

  it('resolves ordinals against the last result list', async () => {
    const ids = useStore.getState().events.slice(0, 3).map((e) => e.id);
    const res = await run('open_event', { event: '2' }, rt({ lastEventIds: ids }));
    expect(res.ok).toBe(true);
    expect(navigated.at(-1)).toBe(`/events/${ids[1]}`);
  });

  it('resolves «this» to the open event page', async () => {
    const id = useStore.getState().events[4].id;
    const res = await run('open_event', { event: 'this' }, rt({ currentEventId: id }));
    expect(res.eventIds).toEqual([id]);
  });

  it('switches theme family to dark and back with undo', async () => {
    useStore.getState().setTheme('bento');
    const res = await run('set_theme', { theme: 'dark' });
    expect(useStore.getState().theme).toBe('bento-dark');
    res.undo?.();
    expect(useStore.getState().theme).toBe('bento');
  });

  it('changes the persisted UI language', async () => {
    useLanguageStore.getState().setLanguage('el');
    const res = await run('set_language', { language: 'en' });
    expect(useLanguageStore.getState().language).toBe('en');
    expect(res.el).toMatch(/αγγλικά/);
    res.undo?.();
    expect(useLanguageStore.getState().language).toBe('el');
  });

  it('updates privacy through the shared settings slice', async () => {
    const res = await run('update_privacy', { profileVisibility: 'private', shareLocation: 'false' });
    expect(res.ok).toBe(true);
    expect(useStore.getState().userSettings.privacy.profileVisibility).toBe('private');
    expect(useStore.getState().userSettings.privacy.shareLocation).toBe(false);
    res.undo?.();
    expect(useStore.getState().userSettings.privacy.profileVisibility).not.toBe('private');
  });

  it('searches by canonical category and price', async () => {
    const res = await run('search_events', { categories: ['πεζοπορία'], price: 'free' });
    expect(res.ok).toBe(true);
    const events = useStore.getState().events;
    for (const id of res.eventIds ?? []) {
      const e = events.find((x) => x.id === id)!;
      expect(e.category).toBe('Hiking');
      expect(e.isPaid && e.price > 0).toBe(false);
    }
  });

  it('marks notifications read and restores them on undo', async () => {
    const before = useStore.getState().notifications.filter((n) => !n.read).length;
    const res = await run('mark_notifications_read', {});
    expect(useStore.getState().notifications.every((n) => n.read)).toBe(true);
    res.undo?.();
    expect(useStore.getState().notifications.filter((n) => !n.read).length).toBe(before);
  });

  it('refuses to create an event without a date and time', async () => {
    const res = await run('create_event', { title: 'Test' });
    expect(res.ok).toBe(false);
  });
});
