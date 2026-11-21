import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store';
import { Button } from '../common/Button';
import { Users, CheckCircle, Split, ShieldCheck, Tag, HeartHandshake, ListOrdered } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { PAGE_FILL } from '../layout/PageShell';
import { canAccessEvent } from '../../lib/trust';
import { computeDiscountedPrice } from '../../lib/groupUtils';
import { toast } from 'sonner';
import { GroupInsights } from '../outings/GroupInsights';
import { VibeQuizModal } from '../outings/VibeQuizModal';
import { fitsGenderMode } from '../../lib/outings';
import type { GroupGenderMode } from '../../types/outings';
import { formatEur } from '../../lib/money';

export default function JoinGroupFlow() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const preSelectedGroupId = searchParams.get('group') ?? searchParams.get('groupId');

  const events = useStore((state) => state.events);
  const groups = useStore((state) => state.groups);
  const currentUser = useStore((state) => state.currentUser);
  const joinGroup = useStore((state) => state.joinGroup);
  const createGroup = useStore((state) => state.createGroup);
  const placeCommitmentHold = useStore((state) => state.placeCommitmentHold);
  const hasCommitmentHold = useStore((state) => state.hasCommitmentHold);
  const canJoinEvent = useStore((state) => state.canJoinEvent);
  // Φ27 — one gate per group (capacity → waitlist, women & non-binary, blocks, standing).
  const canJoinGroup = useStore((state) => state.canJoinGroup);
  const joinGroupWaitlist = useStore((state) => state.joinGroupWaitlist);
  const [genderMode, setGenderMode] = useState<GroupGenderMode>('mixed');
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  const event = events.find((e) => e.id === eventId);
  const [step, setStep] = useState(1);
  const [groupType, setGroupType] = useState<'existing' | 'new'>(
    preSelectedGroupId ? 'existing' : 'new',
  );
  const [newGroupSize, setNewGroupSize] = useState(4);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(preSelectedGroupId);
  const [commitmentAccepted, setCommitmentAccepted] = useState(false);

  useEffect(() => {
    if (!eventId || !preSelectedGroupId) return;
    const match = groups.find(
      (g) => g.id === preSelectedGroupId && g.eventId === eventId && g.members.length < g.targetSize,
    );
    if (match) {
      setSelectedGroupId(preSelectedGroupId);
      setGroupType('existing');
    }
  }, [preSelectedGroupId, eventId, groups]);

  if (!event || !eventId) return null;

  const gate = canAccessEvent(currentUser, event);
  const storeGate = canJoinEvent(eventId);
  const needsCommitment = !event.isPaid && !hasCommitmentHold(eventId);

  const availableGroups = groups.filter(
    (g) => g.eventId === eventId && g.members.length < g.targetSize && g.status !== 'cancelled',
  );
  const fullGroups = groups.filter(
    (g) => g.eventId === eventId && g.members.length >= g.targetSize && g.status !== 'cancelled' && !g.members.includes(currentUser?.id ?? ''),
  );
  const myGroup = groups.find((g) => g.eventId === eventId && currentUser && g.members.includes(currentUser.id));
  const selectedGate = selectedGroupId ? canJoinGroup(selectedGroupId) : null;
  const canWomenNb = fitsGenderMode(currentUser, 'women_nb');

  const canContinueStep1 =
    gate.allowed &&
    (groupType === 'new' || (availableGroups.length > 0 && Boolean(selectedGroupId) && Boolean(selectedGate?.ok)));

  const discountedPrice =
    event.isPaid && event.groupDiscount
      ? computeDiscountedPrice(event, event.groupDiscount.minSize)
      : event.price;

  const handleConfirm = () => {
    if (!gate.allowed) {
      toast.error(t(gate.messageEl, gate.messageEn));
      return;
    }
    if (!storeGate.ok) {
      toast.error(t(storeGate.messageEl, storeGate.messageEn));
      return;
    }
    if (needsCommitment && !commitmentAccepted) {
      toast.error(
        t(
          'Αποδέξου τη δέσμευση συμμετοχής για δωρεάν εκδηλώσεις.',
          'Accept the participation commitment for free events.',
        ),
      );
      return;
    }
    if (groupType === 'existing') {
      const target = selectedGroupId ?? availableGroups[0]?.id;
      if (!target) return;
      const g = canJoinGroup(target);
      if (!g.ok) {
        toast.error(t(g.el, g.en));
        return;
      }
      if (needsCommitment) placeCommitmentHold(eventId);
      joinGroup(target);
      setJoinedGroupId(target);
    } else {
      if (needsCommitment) placeCommitmentHold(eventId);
      createGroup(event.id, newGroupSize, { genderMode });
      const mine = useStore
        .getState()
        .groups.filter((g) => g.eventId === event.id && g.hostId === currentUser?.id);
      setJoinedGroupId(mine[mine.length - 1]?.id ?? null);
    }
    setStep(3);
  };

  return (
    <div className={cn(PAGE_FILL, 'rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-6 md:p-8 dark:bg-surface-raised dark:border-border')}>
      <h1 className="sr-only text-lg md:text-xl">{t('Συμμετοχή σε ομάδα', 'Join a group')}: {event.title}</h1>
      {!gate.allowed && (
        <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-medium flex gap-2">
          <ShieldCheck className="w-5 h-5 shrink-0" />
          {t(gate.messageEl, gate.messageEn)}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-sm md:text-base font-bold text-ink">
              {t('Συμμετοχή ή δημιουργία ομάδας', 'Join or Create a Group')}
            </h2>
            <p className="mt-1 text-sm text-gray-500 font-medium">{event.title}</p>
          </div>

          {event.isPaid && event.groupDiscount && (
            <p className="text-xs font-medium p-3 bg-cyan-50 border border-cyan-100 rounded-xl text-cyan-900 leading-relaxed dark:bg-cyan-950/40 dark:border-cyan-800/50 dark:text-cyan-100">
              {`${t('Έκπτωση', 'Discount')} −${event.groupDiscount.percentage}% ${t('από', 'from')} ${event.groupDiscount.minSize}+ ${t('μέλη', 'members')}`}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setGroupType('existing')}
              className={`p-3 rounded-xl border text-left text-xs min-h-[72px] ${groupType === 'existing' ? 'border-accent bg-cyan-50 dark:bg-cyan-950/40 ring-1 ring-accent' : 'border-gray-100 dark:border-border'}`}
            >
              <Users className={`h-4 w-4 mb-1.5 ${groupType === 'existing' ? 'text-cyan-600' : 'text-gray-400'}`} />
              <p className="font-bold text-xs">{t('Υπάρχουσα ομάδα', 'Join Existing')}</p>
            </button>
            <button
              type="button"
              onClick={() => setGroupType('new')}
              className={`p-3 rounded-xl border text-left text-xs min-h-[72px] ${groupType === 'new' ? 'border-accent bg-cyan-50 dark:bg-cyan-950/40 ring-1 ring-accent' : 'border-gray-100 dark:border-border'}`}
            >
              <Split className={`h-4 w-4 mb-1.5 ${groupType === 'new' ? 'text-cyan-600' : 'text-gray-400'}`} />
              <p className="font-bold text-xs">{t('Νέα ομάδα', 'Start New Group')}</p>
            </button>
          </div>

          {groupType === 'existing' && (
            <div className="space-y-2">
              {availableGroups.length === 0 ? (
                <p className="text-sm text-gray-500 font-medium p-3 bg-gray-50 rounded-xl border border-gray-100">
                  {t('Δεν υπάρχουν διαθέσιμες ομάδες — δημιούργησε νέα.', 'No available groups — start a new one.')}
                </p>
              ) : (
                availableGroups.map((g) => {
                  const gGate = canJoinGroup(g.id);
                  const isMine = gGate.reason === 'member';
                  return (
                    <div
                      key={g.id}
                      className={`w-full rounded-xl border transition-colors ${
                        selectedGroupId === g.id
                          ? 'border-accent bg-cyan-50 dark:bg-cyan-950/40 ring-1 ring-accent'
                          : 'border-gray-100 hover:border-gray-200 dark:border-border'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => (isMine ? navigate(`/night/${g.id}`) : setSelectedGroupId(g.id))}
                        aria-pressed={selectedGroupId === g.id}
                        className="w-full p-3 text-left"
                      >
                        <p className="font-bold text-sm text-ink">
                          {t('Ομάδα', 'Group')} · {g.members.length}/{g.targetSize} {t('μέλη', 'members')}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          {g.status === 'confirmed'
                            ? t('Επιβεβαιωμένη', 'Confirmed')
                            : t('Εκκρεμής', 'Pending')}
                          {isMine ? t(' · είσαι μέλος — άνοιξε «Η βραδιά μας»', ' · you are in — open «Our night»') : ''}
                        </p>
                      </button>
                      <div className="px-3 pb-3">
                        <GroupInsights group={g} />
                        {!gGate.ok && !isMine && (
                          <p className="mt-1 text-xs font-bold text-amber-800 dark:text-amber-200">{t(gGate.el, gGate.en)}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              {fullGroups.length > 0 && (
                <div className="rounded-xl border border-dashed border-border p-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
                    <ListOrdered className="h-4 w-4" aria-hidden /> {t('Πλήρεις ομάδες — λίστα αναμονής', 'Full groups — waitlist')}
                  </p>
                  <ul className="mt-2 space-y-2">
                    {fullGroups.map((g) => {
                      const waiting = Boolean(currentUser && g.waitlist?.includes(currentUser.id));
                      return (
                        <li key={g.id} className="flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-ink">
                            {g.members.length}/{g.targetSize} · {t(`${g.waitlist?.length ?? 0} σε αναμονή`, `${g.waitlist?.length ?? 0} waiting`)}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={waiting}
                            onClick={() => {
                              if (joinGroupWaitlist(g.id)) {
                                toast.success(
                                  t(
                                    'Είσαι στη λίστα αναμονής — η θέση περνά σε σένα στην ίδια τιμή.',
                                    'You are on the waitlist — the seat passes to you at the same price.',
                                  ),
                                  {
                                    action: {
                                      label: t('Η βραδιά μας', 'Our night'),
                                      onClick: () => navigate(`/night/${g.id}`),
                                    },
                                  },
                                );
                              } else {
                                const gg = canJoinGroup(g.id);
                                toast.error(t(gg.el, gg.en));
                              }
                            }}
                          >
                            {waiting ? t('Σε αναμονή', 'Waiting') : t('Λίστα αναμονής', 'Join waitlist')}
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          {groupType === 'new' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {[3, 4, 5, 6].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setNewGroupSize(size)}
                    className={`flex-1 py-2 min-h-8 rounded-xl font-bold text-xs ${newGroupSize === size ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              <fieldset>
                <legend className="flex items-center gap-1.5 text-xs font-bold text-ink">
                  <HeartHandshake className="h-4 w-4" aria-hidden /> {t('Ποιοι μπορούν να μπουν', 'Who can join')}
                </legend>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {([
                    { id: 'mixed', el: 'Όλοι', en: 'Everyone' },
                    { id: 'women_nb', el: 'Γυναίκες & μη δυαδικά', en: 'Women & non-binary' },
                  ] as const).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      aria-pressed={genderMode === o.id}
                      disabled={o.id === 'women_nb' && !canWomenNb}
                      onClick={() => setGenderMode(o.id)}
                      className={`min-h-8 rounded-xl border px-2 text-xs font-bold disabled:opacity-50 ${genderMode === o.id ? 'border-accent bg-cyan-50 text-ink dark:bg-cyan-950/40 ring-1 ring-accent' : 'border-gray-100 text-ink dark:border-border'}`}
                    >
                      {t(o.el, o.en)}
                    </button>
                  ))}
                </div>
                {!canWomenNb && (
                  <p className="mt-1 text-xs font-medium text-ink-muted dark:text-gray-300">
                    {t('Η επιλογή «Γυναίκες & μη δυαδικά» ανοίγει αν το δηλώσεις στο προφίλ σου (δεν εμφανίζεται δημόσια).', 'The “Women & non-binary” option opens if you set it in your profile (never shown publicly).')}
                  </p>
                )}
              </fieldset>
            </div>
          )}

          {myGroup && (
            <button
              type="button"
              onClick={() => navigate(`/night/${myGroup.id}`)}
              className="w-full rounded-xl border border-border p-3 text-left text-xs font-bold text-ink"
            >
              {t('Είσαι ήδη σε ομάδα για αυτή την εκδήλωση → «Η βραδιά μας»', 'You are already in a group for this event → «Our night»')}
            </button>
          )}

          <Button className="w-full min-h-8" onClick={() => setStep(2)} disabled={!canContinueStep1}>
            {t('Συνέχεια', 'Continue')}
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm md:text-base">{t('Επιβεβαίωση', 'Confirmation')}</h3>

          {event.isPaid ? (
            <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>{t('Τιμή', 'Price')}</span>
                <span>{formatEur(event.price, language)}</span>
              </div>
              {event.groupDiscount && (
                <div className="flex justify-between text-sm font-bold text-emerald-700">
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {t('Με ομαδική έκπτωση', 'With group discount')}
                  </span>
                  <span>{formatEur(Number(discountedPrice), language)}</span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                {t(
                  'Προεξουσιοδότηση — χρέωση μόνο μετά την επιβεβαίωση της ομάδας.',
                  'Pre-authorization — charged only after group confirmation.',
                )}
              </p>
            </div>
          ) : (
            <label className="flex gap-3 p-4 rounded-xl border border-cyan-100 bg-cyan-50/50 cursor-pointer dark:border-cyan-800/50 dark:bg-cyan-950/30">
              <input
                type="checkbox"
                checked={commitmentAccepted}
                onChange={(e) => setCommitmentAccepted(e.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span className="text-xs font-medium text-cyan-900 leading-relaxed">
                {t(
                  'Αποδέχομαι δέσμευση συμμετοχής (hold) για δωρεάν εκδήλωση — ακύρωση εντός 24ω πριν χωρίς ποινή.',
                  'I accept a participation commitment hold for this free event — cancel 24h before without penalty.',
                )}
              </span>
            </label>
          )}

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 min-h-8" onClick={() => setStep(1)}>
              {t('Πίσω', 'Back')}
            </Button>
            <Button variant="primary" className="flex-[2] min-h-8" onClick={handleConfirm}>
              {t('Επιβεβαίωση συμμετοχής', 'Confirm join')}
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="text-center space-y-4 py-4">
          <CheckCircle className="w-11 h-11 text-emerald-500 mx-auto" />
          <h3 className="text-sm md:text-base font-bold">{t('Μπήκες!', "You're in!")}</h3>
          <p className="text-sm text-gray-500 font-medium">
            {t('Το group chat ξεκλειδώνει όταν η ομάδα επιβεβαιωθεί.', 'Group chat unlocks when the group is confirmed.')}
          </p>
          {joinedGroupId && (
            <Button className="w-full min-h-8" onClick={() => navigate(`/night/${joinedGroupId}`)}>
              {t('Άνοιξε «Η βραδιά μας»', 'Open «Our night»')}
            </Button>
          )}
          {!currentUser?.vibe && (
            <button
              type="button"
              onClick={() => setQuizOpen(true)}
              className="flex w-full items-center gap-2 rounded-xl border border-border p-3 text-left text-xs font-bold text-ink"
            >
              <HeartHandshake className="h-4 w-4 shrink-0" aria-hidden />
              {t('Κάνε το κουίζ «Το στυλ παρέας μου» (1′) για να βλέπεις γιατί ταιριάζετε.', 'Take the “My group style” quiz (1 min) to see why you match.')}
            </button>
          )}
          <Button variant="outline" className="w-full min-h-8" onClick={() => navigate(`/events/${eventId}`)}>
            {t('Επιστροφή στην εκδήλωση', 'Back to event')}
          </Button>
          <button
            type="button"
            onClick={() => navigate('/inbox')}
            className="text-xs font-bold text-gray-500 underline underline-offset-2"
          >
            {t('Άνοιξε Inbox', 'Open Inbox')}
          </button>
          {quizOpen && <VibeQuizModal open={quizOpen} onClose={() => setQuizOpen(false)} />}
        </div>
      )}
    </div>
  );
}
