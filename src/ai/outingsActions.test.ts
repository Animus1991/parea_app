import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '../store';
import { getAction } from './actions';
import { planLocal, type LocalEngineContext } from './localEngine';
import type { ActionResult, ActionRuntime } from './types';

const navigated: string[] = [];
const rt = (over: Partial<ActionRuntime> = {}): ActionRuntime => ({
  navigate: (p) => navigated.push(p),
  pathname: '/',
  lang: 'el',
  lastEventIds: [],
  ...over,
});
async function run(name: string, args: Record<string, unknown> = {}): Promise<ActionResult> {
  const a = getAction(name);
  if (!a) throw new Error(`missing ${name}`);
  return a.run(args, rt());
}

const ctx: LocalEngineContext = {
  isAdmin: false,
  areas: ['Koukaki, Athens', 'Psyrri, Athens', 'Gazi, Athens'],
  userNames: ['Maria'],
  lastEventIds: [],
  now: new Date('2026-11-16T10:00:00'),
};
const first = (text: string) => planLocal(text, ctx).calls[0];

describe('outings in Nakamas AI (Φ27)', () => {
  beforeEach(() => {
    navigated.length = 0;
    useStore.getState().enterDemoMode();
    useStore.getState().exitDemoMode();
    useStore.getState().enterDemoMode();
  });

  it('understands the new phrases on-device', () => {
    expect(first('δείξε μου τη βραδιά μας')?.name).toBe('show_my_night');
    expect(first('ποιος είναι ο κωδικός ομάδας;')?.name).toBe('show_my_night');
    const coffee = first('φτιάξε έναν καφέ αύριο στις 11:00 στο Κουκάκι για 3 άτομα');
    expect(coffee).toMatchObject({ name: 'create_mini_outing', args: { kind: 'coffee', date: '2026-11-17', time: '11:00', size: 3 } });
    expect(planLocal('φτιάξε καφέ', ctx).calls).toHaveLength(0);
    expect(first('οργάνωσε τρέξιμο αύριο 09:00 στο Γκάζι μόνο για γυναίκες')).toMatchObject({ name: 'create_mini_outing', args: { kind: 'run', womenNb: true } });
    expect(first('άνοιξε τις Nakamas Nights')).toMatchObject({ name: 'open_collection', args: { collection: 'nakamas-nights' } });
    expect(first('θέλω να κάνω ένσταση για την απουσία')?.name).toBe('summarize_standing');
    expect(first('κάλεσε φίλους στη βραδιά')?.name).toBe('invite_friends');
    // Creating an event is still an event.
    expect(first('φτιάξε εκδήλωση για καφέ αύριο')?.name).toBe('draft_event');
  });

  it('opens «Η βραδιά μας» for the next group outing', async () => {
    const r = await run('show_my_night');
    expect(r.ok).toBe(true);
    expect(navigated[0]).toMatch(/^\/night\//);
  });

  it('creates a small outing behind a confirmation, with undo', async () => {
    expect(getAction('create_mini_outing')!.risk).toBe('confirm');
    const r = await run('create_mini_outing', { kind: 'walk', date: '2099-01-02', time: '10:00', area: 'Koukaki', size: 4 });
    expect(r.ok).toBe(true);
    const gid = navigated[0].replace('/night/', '');
    const g = useStore.getState().groups.find((x) => x.id === gid)!;
    expect(g.targetSize).toBe(4);
    r.undo?.();
    expect(useStore.getState().events.find((e) => e.id === g.eventId)!.status).toBe('cancelled');
    expect((await run('create_mini_outing', { kind: 'walk', date: '2000-01-01', time: '10:00', area: 'Koukaki' })).ok).toBe(false);
  });

  it('opens a collection with a forming-groups count, explains standing, makes an invite', async () => {
    const c = await run('open_collection', { collection: 'nakamas-nights' });
    expect(c.ok).toBe(true);
    expect(navigated).toContain('/collections/nakamas-nights');
    const st = await run('summarize_standing');
    expect(st.ok).toBe(true);
    expect(st.el).toContain('Όλα καλά');
    const inv = await run('invite_friends');
    expect(inv.ok).toBe(true);
    expect(String((inv.data as { url: string }).url)).toContain('/i/');
  });
});
