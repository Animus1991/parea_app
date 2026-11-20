import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Footprints, HeartHandshake, MapPin, Plus, Wine, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { formatPlanWhen } from '../../lib/dateLocale';
import { formatLocationArea } from '../../lib/eventDisplay';
import { fitsGenderMode } from '../../lib/outings';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { cn } from '../../lib/utils';
import type { MiniOutingKind } from '../../store/outingsSlice';
import type { GroupGenderMode } from '../../types/outings';
import { AppSelect } from '../common/AppSelect';

const KINDS: { id: MiniOutingKind; el: string; en: string; icon: typeof Coffee }[] = [
  { id: 'coffee', el: 'Καφές', en: 'Coffee', icon: Coffee },
  { id: 'walk', el: 'Βόλτα', en: 'Walk', icon: Footprints },
  { id: 'run', el: 'Τρέξιμο', en: 'Run', icon: Zap },
  { id: 'drink', el: 'Ένα ποτό', en: 'A drink', icon: Wine },
];

function kindOf(tags: string[] | undefined): (typeof KINDS)[number] {
  return KINDS.find((k) => tags?.includes(k.id)) ?? KINDS[0];
}

/**
 * Small outings without an event (Timeleft, adapted): a coffee, a walk or a
 * run with 2–6 people, under the same trust rules (confirmed phone), with
 * the exact spot shown only to members and an optional women & non-binary
 * mode.
 */
export function MiniOutingsSection() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const me = useStore((s) => s.currentUser);
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const users = useStore((s) => s.users);
  const canJoinEvent = useStore((s) => s.canJoinEvent);
  const canJoinGroup = useStore((s) => s.canJoinGroup);
  const joinGroup = useStore((s) => s.joinGroup);
  const joinGroupWaitlist = useStore((s) => s.joinGroupWaitlist);
  const [composerOpen, setComposerOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const list = useMemo(
    () =>
      events
        .filter((e) => e.kind === 'mini_outing' && e.status !== 'cancelled' && e.date >= today)
        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
        .map((e) => ({ event: e, group: groups.find((g) => g.eventId === e.id && g.status !== 'cancelled') }))
        .filter((x): x is { event: typeof x.event; group: NonNullable<typeof x.group> } => Boolean(x.group)),
    [events, groups, today],
  );

  const join = (groupId: string, eventId: string) => {
    const ev = canJoinEvent(eventId);
    if (!ev.ok) {
      toast.error(t(ev.messageEl, ev.messageEn));
      return;
    }
    const gate = canJoinGroup(groupId);
    if (gate.ok) {
      joinGroup(groupId);
      toast.success(t('Μπήκες! Το σημείο φαίνεται στη «Βραδιά μας».', 'You are in! The spot is on «Our night».'));
      navigate(`/night/${groupId}`);
    } else if (gate.reason === 'full' && joinGroupWaitlist(groupId)) {
      toast.success(t('Είσαι στη λίστα αναμονής.', 'You are on the waitlist.'), {
        action: {
          label: t('Η βραδιά μας', 'Our night'),
          onClick: () => navigate(`/night/${groupId}`),
        },
      });
    } else {
      toast.error(t(gate.el, gate.en));
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-border bg-surface-raised p-4" aria-labelledby="mini-outings-title">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 id="mini-outings-title" className="text-sm font-bold text-ink md:text-base">
            {t('Μικρές έξοδοι', 'Small outings')}
          </h2>
          <p className="text-xs font-medium text-ink-muted">
            {t('Καφές, βόλτα ή τρέξιμο με 2–6 άτομα.', 'Coffee, a walk or a run with 2–6 people.')}{' '}
            <button
              type="button"
              onClick={() => navigate('/collections')}
              className="font-semibold text-ink-muted underline underline-offset-2 hover:text-ink"
            >
              {t('Συλλογές', 'Collections')}
            </button>
          </p>
        </div>
        <Button size="sm" onClick={() => setComposerOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden /> {t('Νέα μικρή έξοδος', 'New small outing')}
        </Button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-3 py-4 text-center">
          <p className="text-xs font-medium text-ink-muted">
            {t('Καμία μικρή έξοδος ακόμη — ξεκίνα εσύ την πρώτη.', 'No small outings yet — start the first one.')}
          </p>
          <Button size="sm" className="mt-3" onClick={() => setComposerOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" aria-hidden /> {t('Νέα μικρή έξοδος', 'New small outing')}
          </Button>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {list.map(({ event, group }) => {
            const k = kindOf(event.tags);
            const Icon = k.icon;
            const host = users.find((u) => u.id === group.hostId);
            const mine = me ? group.members.includes(me.id) : false;
            const waiting = me ? group.waitlist?.includes(me.id) : false;
            const full = group.members.length >= group.targetSize;
            const genderBlocked = group.genderMode === 'women_nb' && !fitsGenderMode(me, 'women_nb');
            return (
              <li key={group.id} className="rounded-xl border border-border bg-surface p-3">
                <p className="flex items-center gap-1.5 text-2xs font-bold text-ink-muted">
                  <Icon className="h-3.5 w-3.5" aria-hidden /> {t(k.el, k.en)} · {formatPlanWhen(event.date, event.time, language)}
                </p>
                <p className="mt-0.5 text-sm font-bold text-ink">{event.title}</p>
                <p className="flex items-center gap-1 text-xs font-medium text-ink-muted">
                  <MapPin className="h-3.5 w-3.5" aria-hidden /> {formatLocationArea(event.locationArea, language)}
                </p>
                <p className="mt-1 text-xs font-medium text-ink">
                  {t(`${group.members.length}/${group.targetSize} · με ${host?.name.split(' ')[0] ?? '—'}`, `${group.members.length}/${group.targetSize} · with ${host?.name.split(' ')[0] ?? '—'}`)}
                </p>
                {group.genderMode === 'women_nb' && (
                  <p className="mt-0.5 flex items-center gap-1 text-2xs font-bold text-ink">
                    <HeartHandshake className="h-3 w-3" aria-hidden /> {t('Γυναίκες & μη δυαδικά άτομα', 'Women & non-binary')}
                  </p>
                )}
                <div className="mt-2">
                  {mine ? (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/night/${group.id}`)}>
                      {t('Η βραδιά μας', 'Our night')}
                    </Button>
                  ) : waiting ? (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/night/${group.id}`)}>
                      {t('Στη λίστα αναμονής · βραδιά', 'On waitlist · our night')}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={genderBlocked || full ? 'outline' : 'primary'}
                      onClick={() => {
                        if (genderBlocked) {
                          toast.message(
                            t(
                              'Αυτή η έξοδος είναι μόνο για γυναίκες και μη δυαδικά άτομα. Μπορείς να ενημερώσεις το προφίλ σου αν θες.',
                              'This outing is for women and non-binary people only. You can update your profile if you want.',
                            ),
                            {
                              action: {
                                label: t('Προφίλ', 'Profile'),
                                onClick: () => navigate('/profile'),
                              },
                            },
                          );
                          return;
                        }
                        join(group.id, event.id);
                      }}
                    >
                      {genderBlocked ? t('Μόνο γυναίκες & μη δυαδικά', 'Women & non-binary only') : full ? t('Λίστα αναμονής', 'Join waitlist') : t('Μπες', 'Join')}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {composerOpen && <MiniOutingComposer onClose={() => setComposerOpen(false)} />}
    </section>
  );
}

function MiniOutingComposer({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const me = useStore((s) => s.currentUser);
  const create = useStore((s) => s.createMiniOuting);
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  const [kind, setKind] = useState<MiniOutingKind>('coffee');
  const [date, setDate] = useState(tomorrow);
  const [time, setTime] = useState('11:00');
  const [area, setArea] = useState('');
  const [spot, setSpot] = useState('');
  const [size, setSize] = useState(3);
  const [mode, setMode] = useState<GroupGenderMode>('mixed');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const canWomen = fitsGenderMode(me, 'women_nb');
  const tierOk = me?.trustTier !== '1_explorer';

  const submit = () => {
    if (!area.trim()) {
      setError(t('Γράψε περιοχή (π.χ. Κουκάκι).', 'Type an area (e.g. Koukaki).'));
      return;
    }
    if (date < new Date().toISOString().slice(0, 10)) {
      setError(t('Διάλεξε σημερινή ή μελλοντική ημερομηνία.', 'Pick today or a future date.'));
      return;
    }
    const groupId = create({ kind, date, time, area: area.includes(',') ? area : `${area.trim()}, Athens`, exactLocation: spot, size, genderMode: mode, note });
    if (!groupId) {
      setError(t('Δεν μπορείς να ξεκινήσεις έξοδο όσο ισχύει παύση.', 'You cannot start an outing while a pause applies.'));
      return;
    }
    toast.success(t('Η έξοδος δημοσιεύτηκε!', 'Outing published!'), {
      action: {
        label: t('Μοιράσου στον τοίχο', 'Share to wall'),
        onClick: () => navigate('/wall'),
      },
    });
    onClose();
    navigate(`/night/${groupId}`);
  };

  const field = 'mt-1 min-h-10 w-full rounded-xl border border-border bg-surface px-3 text-sm font-medium text-ink';
  return (
    <Modal open onClose={onClose} title={t('Νέα μικρή έξοδος', 'New small outing')} size="md">
      {!tierOk && (
        <p className="mb-3 rounded-xl border border-border px-3 py-2 text-xs font-bold text-ink">
          {t('Για να μπουν άλλοι χρειάζεται επιβεβαιωμένο τηλέφωνο — το ίδιο ισχύει και για σένα ως οικοδεσπότη.', 'Others need a confirmed phone to join — and so do you as the host.')}
        </p>
      )}
      <fieldset>
        <legend className="text-xs font-bold text-ink">{t('Τι κάνουμε;', 'What are we doing?')}</legend>
        <div className="mt-1.5 grid grid-cols-4 gap-2">
          {KINDS.map(({ id, el, en, icon: Icon }, i) => (
            <button
              key={id}
              type="button"
              data-autofocus={i === 0 ? true : undefined}
              aria-pressed={kind === id}
              onClick={() => setKind(id)}
              className={cn(
                'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-bold',
                kind === id ? 'border-transparent bg-accent text-accent-fg' : 'border-border text-ink hover:border-border-strong',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden /> {t(el, en)}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-bold text-ink">
          {t('Ημερομηνία', 'Date')}
          <input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className={field} />
        </label>
        <label className="text-xs font-bold text-ink">
          {t('Ώρα', 'Time')}
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={field} />
        </label>
      </div>
      <label className="mt-3 block text-xs font-bold text-ink">
        {t('Περιοχή (φαίνεται σε όλους)', 'Area (shown to everyone)')}
        <input value={area} maxLength={60} onChange={(e) => setArea(e.target.value)} placeholder={t('π.χ. Κουκάκι', 'e.g. Koukaki')} className={field} />
      </label>
      <label className="mt-3 block text-xs font-bold text-ink">
        {t('Ακριβές σημείο (μόνο για μέλη)', 'Exact spot (members only)')}
        <input value={spot} maxLength={100} onChange={(e) => setSpot(e.target.value)} placeholder={t('π.χ. καφέ στη γωνία Δράκου', 'e.g. café on the corner of Drakou')} className={field} />
      </label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-bold text-ink">
          {t('Άτομα (μαζί σου)', 'People (with you)')}
          <AppSelect
            ariaLabel={t('Άτομα (μαζί σου)', 'People (with you)')}
            value={String(size)}
            onValueChange={(v) => setSize(Number(v))}
            className={field}
            options={[2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: String(n) }))}
          />
        </label>
        <label className="text-xs font-bold text-ink">
          {t('Ποιοι μπορούν να μπουν', 'Who can join')}
          <AppSelect
            ariaLabel={t('Ποιοι μπορούν να μπουν', 'Who can join')}
            value={mode}
            onValueChange={(v) => setMode(v as GroupGenderMode)}
            className={field}
            options={[
              { value: 'mixed', label: t('Όλοι', 'Everyone') },
              {
                value: 'women_nb',
                label: t('Γυναίκες & μη δυαδικά άτομα', 'Women & non-binary'),
                disabled: !canWomen,
              },
            ]}
          />
        </label>
      </div>
      {!canWomen && (
        <p className="mt-1 text-2xs font-medium text-ink-muted dark:text-gray-300">
          {t('Η επιλογή «Γυναίκες & μη δυαδικά» ανοίγει αν το δηλώσεις στο προφίλ σου.', 'The “Women & non-binary” option opens if you set it in your profile.')}{' '}
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate('/profile');
            }}
            className="font-bold text-ink underline underline-offset-2"
          >
            {t('Προφίλ', 'Profile')}
          </button>
        </p>
      )}
      <label className="mt-3 block text-xs font-bold text-ink">
        {t('Λίγα λόγια (προαιρετικό)', 'A few words (optional)')}
        <input value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} className={field} />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-xs font-bold text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onClose}>
          {t('Άκυρο', 'Cancel')}
        </Button>
        <Button size="sm" onClick={submit}>
          {t('Δημοσίευση', 'Publish')}
        </Button>
      </div>
    </Modal>
  );
}
