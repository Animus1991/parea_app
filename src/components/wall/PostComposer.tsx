import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ImagePlus, Lock, MapPin, Palette, Plus, Smile, UserPlus, Vote, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { POST_MAX_CHARS, useWallAccess, useWallStore } from '../../store/wallStore';
import { canPostOnWall, connectionIdsOf, wallPrivacyOf } from '../../lib/audience';
import { Modal } from '../common/Modal';
import { PeopleChecklist } from './AudiencePickerModal';
import { fileToResizedDataUrl, imageErrorText } from '../../lib/imageResize';
import type { Audience } from '../../types/wall';
import { AudienceChip } from './AudienceChip';
import { AudiencePickerModal } from './AudiencePickerModal';
import { PersonAvatar } from './PersonAvatar';
import { cn } from '../../lib/utils';
import { formatPlanWhenDay } from '../../lib/dateLocale';
import { FEELINGS, WALL_TEXT_BACKGROUNDS } from '../../lib/chatMediaCatalog';
import { MediaPicker, type PickedMedia } from './MediaPicker';

const COMPOSER_ROW =
  'flex w-full flex-wrap items-stretch justify-between gap-x-2 gap-y-1.5';
/** Two-up on phones; equal share of the full card row from `sm` up. */
const COMPOSER_FILL =
  'min-h-8 min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:basis-0';
/** Two-up on phones; natural pill width, spread with space-between from `sm` up. */
const COMPOSER_PILL =
  'min-h-8 min-w-0 flex-1 basis-[calc(50%-0.25rem)] sm:flex-none sm:basis-auto';

function draftKey(ownerId: string) {
  return `nakamas-wall-draft:${ownerId}`;
}

function readDraft(ownerId: string): string {
  try {
    return sessionStorage.getItem(draftKey(ownerId)) ?? '';
  } catch {
    return '';
  }
}

function writeDraft(ownerId: string, text: string) {
  try {
    if (text) sessionStorage.setItem(draftKey(ownerId), text);
    else sessionStorage.removeItem(draftKey(ownerId));
  } catch {
    /* private mode — the draft simply is not kept */
  }
}

/**
 * «Τι σκέφτεσαι;» — writes on your own wall or, when allowed, on someone
 * else's. The audience is always visible before posting; unsent text is kept
 * for the session so a tab switch never loses it.
 */
/** One-tap starts that turn an empty box into a useful post. */
const QUICK_STARTS: { emoji: string; el: string; en: string }[] = [
  { emoji: '🙋', el: 'Ψάχνω παρέα για ', en: 'Looking for company for ' },
  { emoji: '🎟️', el: 'Πάω σε αυτό — ποιος έρχεται; ', en: 'I am going to this — who is coming? ' },
  { emoji: '⭐', el: 'Σας προτείνω ', en: 'I recommend ' },
  { emoji: '📸', el: 'Στιγμές από ', en: 'Moments from ' },
];

export function PostComposer({
  wallOwnerId,
  onPosted,
  initialEventId,
  initialText,
  focusOnOpen = false,
}: {
  wallOwnerId?: string;
  onPosted?: (id: string) => void;
  /** Pre-attached event (e.g. «Μοιράσου στον τοίχο» from an event page). */
  initialEventId?: string;
  initialText?: string;
  /** Inside a dialog the person just opened: start typing right away. */
  focusOnOpen?: boolean;
}) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const me = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const savedEvents = useStore((s) => s.savedEvents);
  const groups = useStore((s) => s.groups);
  const createPost = useWallStore((s) => s.createPost);
  const updateWallPrivacy = useWallStore((s) => s.updateWallPrivacy);
  const access = useWallAccess();
  const ownerId = wallOwnerId ?? me?.id ?? '';
  const isOwnWall = Boolean(me && ownerId === me.id);
  const owner = users.find((u) => u.id === ownerId);

  const [text, setText] = useState(() => initialText ?? readDraft(ownerId));
  // Tools stay tucked away until someone starts writing, so the feed is the first thing they see.
  const [engaged, setEngaged] = useState(() =>
    Boolean(focusOnOpen || initialEventId || (initialText ?? readDraft(ownerId)).trim()),
  );
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [gif, setGif] = useState<PickedMedia | undefined>();
  const [eventId, setEventId] = useState<string | undefined>(initialEventId);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<'emoji' | 'gif' | 'stickers'>('gif');
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [feelingId, setFeelingId] = useState<string | undefined>();
  const [feelingOpen, setFeelingOpen] = useState(false);
  const [location, setLocation] = useState('');
  const [bgId, setBgId] = useState<string | undefined>();
  const [bgOpen, setBgOpen] = useState(false);
  const [taggedIds, setTaggedIds] = useState<string[]>([]);
  const [tagsOpen, setTagsOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const defaultAudience = me ? wallPrivacyOf(access.privacyByUser, me.id).defaultAudience : null;
  const [audience, setAudience] = useState<Audience>(() => defaultAudience ?? { base: 'connections' });
  const [audienceTouched, setAudienceTouched] = useState(false);
  // Follow a changed default (Settings, AI) until the person picks one for this post.
  const defaultKey = JSON.stringify(defaultAudience);
  useEffect(() => {
    if (!audienceTouched && defaultAudience) setAudience(defaultAudience);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the serialized default
  }, [defaultKey, audienceTouched]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Drafts are kept per wall, except for one-off shares (they start from a template).
  useEffect(() => {
    if (initialText === undefined) writeDraft(ownerId, text);
  }, [ownerId, text, initialText]);

  useEffect(() => {
    if (!focusOnOpen) return;
    const el = textRef.current;
    el?.focus();
    // Caret after the ready first line.
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [focusOnOpen]);

  // Events worth sharing first: the ones you joined or saved, then the rest by date.
  const shareableEvents = useMemo(() => {
    if (!me) return [];
    const mine = new Set([...savedEvents, ...groups.filter((g) => g.members.includes(me.id)).map((g) => g.eventId)]);
    return events
      .filter((e) => e.status !== 'cancelled' && e.status !== 'archived')
      .sort((a, b) => Number(mine.has(b.id)) - Number(mine.has(a.id)) || a.date.localeCompare(b.date))
      .slice(0, 30);
  }, [events, savedEvents, groups, me]);

  const myConnections = me ? connectionIdsOf(access.graph, me.id) : [];
  const backgroundAllowed = text.trim().length <= 140 && imageUrls.length === 0 && !gif && !pollEnabled;

  useEffect(() => {
    if (bgId && !backgroundAllowed) setBgId(undefined);
  }, [bgId, backgroundAllowed]);

  if (!me) return null;
  const gate = canPostOnWall(me.id, ownerId, access);
  if (!gate.allowed) {
    if (isOwnWall) return null;
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-xs font-medium text-ink-muted" role="note">
        <Lock className="h-4 w-4 shrink-0" aria-hidden />
        {t(gate.reasonEl, gate.reasonEn)}
      </p>
    );
  }

  const ownerAudience = wallPrivacyOf(access.privacyByUser, ownerId).othersPostsAudience;
  const attached = eventId ? events.find((e) => e.id === eventId) : undefined;
  const remaining = POST_MAX_CHARS - text.length;
  const pollValid =
    !pollEnabled ||
    (pollQuestion.length <= 120 &&
      pollOptions.length >= 2 &&
      pollOptions.length <= 4 &&
      pollOptions.every((option) => option.trim().length > 0 && option.trim().length <= 60));
  const canSubmit =
    !busy &&
    (text.trim().length > 0 || imageUrls.length > 0 || Boolean(gif) || Boolean(eventId) || pollEnabled) &&
    remaining >= 0 &&
    pollValid;

  const pickImages = async (files: File[]) => {
    const selected = files;
    if (!selected.length) return;
    const slots = Math.max(0, 4 - imageUrls.length);
    if (selected.length > slots) toast.error(t('Μπορείς να προσθέσεις έως 4 φωτογραφίες.', 'You can add up to 4 photos.'));
    const toResize = selected.slice(0, slots);
    if (!toResize.length) return;
    try {
      setBusy(true);
      const resized = await Promise.all(
        toResize.map((file) => fileToResizedDataUrl(file, { maxSize: 960, quality: 0.78 })),
      );
      setImageUrls((current) => [...current, ...resized].slice(0, 4));
    } catch (err) {
      toast.error(imageErrorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (!canSubmit) return;
    const poll = pollEnabled
      ? {
          id: `poll-${Date.now()}`,
          question: pollQuestion.trim(),
          options: pollOptions.map((label, index) => ({
            id: `poll-option-${Date.now()}-${index}`,
            label: label.trim(),
            voterIds: [],
          })),
        }
      : undefined;
    const res = createPost({
      wallOwnerId: ownerId,
      text,
      imageUrls,
      imageUrl: imageUrls[0],
      gifUrl: gif?.url,
      gifFallbackUrl: gif?.fallbackUrl,
      poll,
      feeling: feelingId,
      location,
      bg: bgId,
      eventId,
      audience: isOwnWall ? audience : undefined,
      taggedIds,
    });
    if (!res.ok) {
      toast.error(t(res.reasonEl ?? '', res.reasonEn ?? ''));
      return;
    }
    setText('');
    setImageUrls([]);
    setGif(undefined);
    setEventId(undefined);
    setMoreOpen(false);
    setMediaPickerOpen(false);
    setPollEnabled(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setFeelingId(undefined);
    setFeelingOpen(false);
    setLocation('');
    setBgId(undefined);
    setBgOpen(false);
    setTaggedIds([]);
    setEngaged(false);
    setAudienceTouched(false);
    if (defaultAudience) setAudience(defaultAudience);
    writeDraft(ownerId, '');
    toast.success(
      isOwnWall
        ? t('Δημοσιεύτηκε στον τοίχο σου', 'Posted to your wall')
        : t(`Δημοσιεύτηκε στον τοίχο του/της ${owner?.name ?? ''}`, `Posted on ${owner?.name ?? ''}'s wall`),
      res.id
        ? {
            action: {
              label: t('Δες τη', 'View'),
              onClick: () => navigate(isOwnWall ? `/wall?post=${res.id}` : `/u/${ownerId}`),
            },
          }
        : undefined,
    );
    if (res.id) onPosted?.(res.id);
  };

  const placeholder = isOwnWall
    ? t(`Τι σκέφτεσαι, ${me.name};`, `What's on your mind, ${me.name}?`)
    : t(`Γράψε κάτι στον τοίχο του/της ${owner?.name ?? ''}…`, `Write something on ${owner?.name ?? ''}'s wall…`);
  const toolsOpen = engaged || Boolean(
    text.trim() || imageUrls.length || gif || eventId || taggedIds.length || pollEnabled || feelingId || location || bgId,
  );
  const selectedBackground = WALL_TEXT_BACKGROUNDS.find((background) => background.id === bgId);

  return (
    <Card className={cn('p-3 sm:p-4', !toolsOpen && 'py-3')} data-testid="wall-composer">
      <div className="flex items-start gap-3">
        <PersonAvatar user={me} />
        <div className="min-w-0 flex-1 space-y-3">
          <label className="sr-only" htmlFor={`composer-${ownerId}`}>
            {isOwnWall ? t('Νέα δημοσίευση', 'New post') : t('Δημοσίευση σε τοίχο', 'Post on wall')}
          </label>
          <textarea
            ref={textRef}
            data-autofocus={focusOnOpen || undefined}
            id={`composer-${ownerId}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setEngaged(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            rows={toolsOpen ? (text.length > 120 ? 4 : 2) : 1}
            maxLength={POST_MAX_CHARS + 50}
            placeholder={placeholder}
            style={selectedBackground ? { backgroundImage: selectedBackground.gradient } : undefined}
            className={cn(
              'w-full resize-none border border-border bg-surface px-3 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-accent',
              selectedBackground && 'min-h-36 rounded-2xl py-4 text-center text-xl font-bold text-white placeholder:text-white/80',
              toolsOpen ? (selectedBackground ? 'rounded-2xl py-4' : 'rounded-2xl py-2.5') : 'rounded-full py-2',
            )}
          />

          {taggedIds.length > 0 && (
            <p className="flex flex-wrap items-center gap-1 text-xs font-bold text-ink">
              <UserPlus className="h-3.5 w-3.5" aria-hidden />
              {t('με', 'with')}{' '}
              {taggedIds.map((id) => users.find((u) => u.id === id)?.name).filter(Boolean).join(', ')}
              <button type="button" onClick={() => setTagsOpen(true)} className="ml-1 font-bold underline">
                {t('Αλλαγή', 'Change')}
              </button>
            </p>
          )}

          {imageUrls.length > 0 && (
            <div className={cn('grid grid-cols-2 gap-1.5', imageUrls.length === 1 && 'grid-cols-1')}>
              {imageUrls.map((url, index) => (
                <div key={`${url.slice(0, 24)}-${index}`} className="relative overflow-hidden rounded-xl border border-border">
                  <img
                    src={url}
                    alt={t(`Προεπισκόπηση φωτογραφίας ${index + 1}`, `Photo preview ${index + 1}`)}
                    className="aspect-square max-h-56 w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImageUrls((current) => current.filter((_, imageIndex) => imageIndex !== index))}
                    className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
                    aria-label={t(`Αφαίρεση φωτογραφίας ${index + 1}`, `Remove photo ${index + 1}`)}
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          )}

          {gif && (
            <div className="relative max-w-[16rem] overflow-hidden rounded-xl border border-border">
              <img
                src={gif.url}
                alt={gif.label}
                onError={(event) => {
                  event.currentTarget.src = gif.fallbackUrl;
                }}
                className="aspect-[3/2] w-full object-cover"
              />
              <button
                type="button"
                onClick={() => setGif(undefined)}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label={t('Αφαίρεση GIF ή αυτοκόλλητου', 'Remove GIF or sticker')}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}

          {attached && (
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-ink" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-xs font-bold text-ink">{attached.title}</span>
              <button
                type="button"
                onClick={() => setEventId(undefined)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-raised"
                aria-label={t('Αφαίρεση εκδήλωσης', 'Remove event')}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          )}

          {eventPickerOpen && (
            <div className="rounded-2xl border border-border p-2">
              <p className="px-1 pb-1 text-xs font-bold text-ink-muted">{t('Διάλεξε εκδήλωση για να τη μοιραστείς', 'Pick an event to share')}</p>
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {shareableEvents.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setEventId(e.id);
                        setEventPickerOpen(false);
                      }}
                      className="flex min-h-8 w-full items-center gap-2 rounded-xl px-2 text-left text-xs font-bold text-ink hover:bg-surface"
                    >
                      <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{e.title}</span>
                      <span className="shrink-0 font-medium text-ink-muted">{formatPlanWhenDay(e.date, language)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      {toolsOpen && (
      <div className="mt-3 space-y-2">
        {engaged &&
          !text &&
          !eventId &&
          imageUrls.length === 0 &&
          !gif &&
          !pollEnabled &&
          !feelingId &&
          !location &&
          !bgId && (
          <div className={COMPOSER_ROW} role="group" aria-label={t('Γρήγορη αρχή', 'Quick start')}>
            {QUICK_STARTS.map((q) => (
              <button
                key={q.en}
                type="button"
                onClick={() => {
                  setText(t(q.el, q.en));
                  textRef.current?.focus();
                }}
                className={cn(
                  COMPOSER_FILL,
                  'inline-flex items-center justify-center gap-1 rounded-full border border-border bg-surface-raised px-2.5 py-1 text-center text-xs font-bold leading-tight text-ink-muted hover:border-border-strong hover:text-ink',
                )}
              >
                <span aria-hidden>{q.emoji}</span>
                <span className="min-w-0">{t(q.el, q.en).trim()}</span>
              </button>
            ))}
          </div>
        )}

        {moreOpen && (
          <div className="space-y-2">
            <div className={COMPOSER_ROW} role="group" aria-label={t('Περισσότερα εργαλεία', 'More tools')}>
              <button
                type="button"
                onClick={() => {
                  setPickerTab('gif');
                  setMediaPickerOpen((open) => !open);
                }}
                aria-expanded={mediaPickerOpen}
                className={cn(COMPOSER_PILL, 'inline-flex items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold text-ink-muted hover:bg-surface hover:text-ink')}
              >
                <Smile className="h-4 w-4" aria-hidden /> {t('GIF / Sticker', 'GIF / Sticker')}
              </button>
              <button
                type="button"
                onClick={() => setPollEnabled((enabled) => !enabled)}
                aria-pressed={pollEnabled}
                className={cn(COMPOSER_PILL, 'inline-flex items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold text-ink-muted hover:bg-surface hover:text-ink', pollEnabled && 'bg-accent-soft text-ink')}
              >
                <Vote className="h-4 w-4" aria-hidden /> {t('Δημοσκόπηση', 'Poll')}
              </button>
              <button
                type="button"
                onClick={() => setFeelingOpen((open) => !open)}
                aria-expanded={feelingOpen}
                className={cn(COMPOSER_PILL, 'inline-flex items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold text-ink-muted hover:bg-surface hover:text-ink')}
              >
                <span aria-hidden>🤩</span> {t('Διάθεση', 'Feeling')}
              </button>
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById(`location-${ownerId}`);
                  input?.focus();
                }}
                className={cn(COMPOSER_PILL, 'inline-flex items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold text-ink-muted hover:bg-surface hover:text-ink')}
              >
                <MapPin className="h-4 w-4" aria-hidden /> {t('Τοποθεσία', 'Location')}
              </button>
              <button
                type="button"
                onClick={() => setBgOpen((open) => !open)}
                aria-expanded={bgOpen}
                aria-label={t('Φόντο', 'Background')}
                title={backgroundAllowed ? undefined : t('Διαθέσιμο σε σύντομο κείμενο χωρίς media ή δημοσκόπηση', 'Available for short text without media or a poll')}
                disabled={!backgroundAllowed}
                className={cn(COMPOSER_PILL, 'inline-flex items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold text-ink-muted hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-40')}
              >
                <Palette className="h-4 w-4" aria-hidden /> {t('Φόντο', 'Background')}
              </button>
            </div>

            {mediaPickerOpen && (
              <MediaPicker
                initialTab={pickerTab}
                onEmoji={(emoji) =>
                  setText((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${emoji}`)
                }
                onGif={(media) => {
                  setGif(media);
                  setMediaPickerOpen(false);
                }}
                onSticker={(media) => {
                  setGif(media);
                  setMediaPickerOpen(false);
                }}
                onClose={() => setMediaPickerOpen(false)}
              />
            )}

            {pollEnabled && (
              <div className="space-y-2 rounded-2xl border border-border/60 bg-surface p-3">
                <label className="sr-only" htmlFor={`poll-question-${ownerId}`}>{t('Ερώτηση δημοσκόπησης', 'Poll question')}</label>
                <input
                  id={`poll-question-${ownerId}`}
                  value={pollQuestion}
                  onChange={(event) => setPollQuestion(event.target.value.slice(0, 120))}
                  maxLength={120}
                  placeholder={t('Ερώτηση (προαιρετικά)', 'Question (optional)')}
                  className="h-9 w-full rounded-xl border border-border bg-surface-raised px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
                />
                {pollOptions.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`poll-option-${ownerId}-${index}`}>
                      {t(`Επιλογή ${index + 1}`, `Option ${index + 1}`)}
                    </label>
                    <input
                      id={`poll-option-${ownerId}-${index}`}
                      value={option}
                      onChange={(event) =>
                        setPollOptions((current) => current.map((value, optionIndex) =>
                          optionIndex === index ? event.target.value.slice(0, 60) : value,
                        ))
                      }
                      maxLength={60}
                      placeholder={t(`Επιλογή ${index + 1}`, `Option ${index + 1}`)}
                      className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-surface-raised px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
                    />
                    {pollOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))}
                        aria-label={t(`Αφαίρεση επιλογής ${index + 1}`, `Remove option ${index + 1}`)}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-raised"
                      >
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    )}
                  </div>
                ))}
                {pollOptions.length < 4 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions((current) => [...current, ''])}
                    className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-accent hover:bg-accent-soft"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden /> {t('+ Επιλογή', '+ Option')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPollEnabled(false);
                    setPollQuestion('');
                    setPollOptions(['', '']);
                  }}
                  className="ml-2 inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-xs font-semibold text-ink-muted hover:bg-surface-raised"
                >
                  <X className="h-3.5 w-3.5" aria-hidden /> {t('Αφαίρεση δημοσκόπησης', 'Remove poll')}
                </button>
              </div>
            )}

            {feelingOpen && (
              <div role="group" aria-label={t('Διάλεξε διάθεση', 'Choose a feeling')} className="grid grid-cols-3 gap-1.5 rounded-2xl border border-border/60 bg-surface p-2 sm:grid-cols-4">
                {FEELINGS.map((feeling) => (
                  <button
                    key={feeling.id}
                    type="button"
                    onClick={() => {
                      setFeelingId(feeling.id);
                      setFeelingOpen(false);
                    }}
                    aria-pressed={feelingId === feeling.id}
                    className={cn('flex min-h-9 items-center gap-1.5 rounded-xl px-2 text-left text-xs font-medium text-ink hover:bg-surface-raised', feelingId === feeling.id && 'bg-accent-soft')}
                  >
                    <span aria-hidden>{feeling.emoji}</span> {t(feeling.el, feeling.en)}
                  </button>
                ))}
              </div>
            )}
            {feelingId && (() => {
              const feeling = FEELINGS.find((item) => item.id === feelingId);
              if (!feeling) return null;
              return (
                <span className="inline-flex min-h-8 items-center gap-1 rounded-full bg-accent-soft px-3 text-xs font-semibold text-ink">
                  {feeling.emoji} {t(feeling.el, feeling.en)}
                  <button type="button" onClick={() => setFeelingId(undefined)} aria-label={t('Αφαίρεση διάθεσης', 'Remove feeling')} className="ml-1 rounded-full p-1 hover:bg-surface">
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              );
            })()}

            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor={`location-${ownerId}`}>{t('Τοποθεσία', 'Location')}</label>
              <input
                id={`location-${ownerId}`}
                value={location}
                onChange={(event) => setLocation(event.target.value.slice(0, 80))}
                maxLength={80}
                placeholder={t('Πού βρίσκεσαι; (έως 80 χαρακτήρες)', 'Where are you? (up to 80 characters)')}
                className="h-9 min-w-0 flex-1 rounded-xl border border-border bg-surface px-3 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
              />
              {location && (
                <button
                  type="button"
                  onClick={() => setLocation('')}
                  aria-label={t('Αφαίρεση τοποθεσίας', 'Remove location')}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              )}
            </div>

            {bgOpen && (
              <div role="group" aria-label={t('Διάλεξε φόντο', 'Choose a background')} className="flex gap-2">
                {WALL_TEXT_BACKGROUNDS.map((background) => (
                  <button
                    key={background.id}
                    type="button"
                    onClick={() => {
                      setBgId(background.id);
                      setBgOpen(false);
                    }}
                    aria-label={t(`Φόντο ${background.id.slice(2)}`, `Background ${background.id.slice(2)}`)}
                    aria-pressed={bgId === background.id}
                    className={cn('h-9 w-12 rounded-lg border-2 border-transparent', bgId === background.id && 'border-ink')}
                    style={{ backgroundImage: background.gradient }}
                  />
                ))}
                {bgId && (
                  <button
                    type="button"
                    onClick={() => setBgId(undefined)}
                    aria-label={t('Αφαίρεση φόντου', 'Remove background')}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink-muted hover:bg-surface"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <div className={COMPOSER_ROW}>
          {isOwnWall ? (
            <AudienceChip
              audience={audience}
              onClick={() => setPickerOpen(true)}
              className={cn(COMPOSER_PILL, 'justify-center')}
            />
          ) : (
            <AudienceChip audience={ownerAudience} className={cn(COMPOSER_PILL, 'justify-center')} />
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={cn(
              COMPOSER_PILL,
              'inline-flex items-center justify-center gap-1 rounded-full px-2.5 text-xs font-bold text-ink-muted hover:bg-surface hover:text-ink',
            )}
          >
            <ImagePlus className="h-4 w-4 shrink-0" aria-hidden /> {t('Φωτογραφία', 'Photo')}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              void pickImages(files);
            }}
          />
          <button
            type="button"
            onClick={() => setEventPickerOpen((v) => !v)}
            aria-expanded={eventPickerOpen}
            className={cn(
              COMPOSER_PILL,
              'inline-flex items-center justify-center gap-1 rounded-full px-2.5 text-xs font-bold text-ink-muted hover:bg-surface hover:text-ink',
            )}
          >
            <CalendarDays className="h-4 w-4 shrink-0" aria-hidden /> {t('Εκδήλωση', 'Event')}
          </button>
          <button
            type="button"
            onClick={() => setTagsOpen(true)}
            className={cn(
              COMPOSER_PILL,
              'inline-flex items-center justify-center gap-1 rounded-full px-2.5 text-xs font-bold text-ink-muted hover:bg-surface hover:text-ink',
            )}
          >
            <UserPlus className="h-4 w-4 shrink-0" aria-hidden /> {t('Με ποιους;', 'With whom?')}
          </button>
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-label={t('Περισσότερα', 'More')}
            aria-expanded={moreOpen}
            className={cn(
              COMPOSER_PILL,
              'inline-flex items-center justify-center gap-1 rounded-full px-2.5 text-xs font-semibold text-ink-muted hover:bg-surface hover:text-ink',
              moreOpen && 'bg-accent-soft text-ink',
            )}
          >
            <Plus className="h-4 w-4" aria-hidden /> {t('Περισσότερα', 'More')}
          </button>
          <span className="ml-auto flex min-h-8 basis-full items-center justify-end gap-2 sm:ml-0 sm:basis-auto sm:flex-none">
            {remaining < 200 && (
              <span className={remaining < 0 ? 'text-xs font-bold text-red-600' : 'text-xs font-medium text-ink-muted'} aria-live="polite">
                {remaining}
              </span>
            )}
            <Button size="sm" onClick={submit} disabled={!canSubmit} loading={busy}>
              {t('Δημοσίευση', 'Post')}
            </Button>
          </span>
        </div>
        {!isOwnWall && (
          <p className="text-xs font-medium text-ink-muted">
            {t(`Το ποιος το βλέπει το ορίζει ο/η ${owner?.name ?? ''}.`, `${owner?.name ?? ''} decides who sees posts on their wall.`)}
          </p>
        )}
      </div>
      )}

      <Modal open={tagsOpen} onClose={() => setTagsOpen(false)} title={t('Με ποιους είσαι;', 'Who are you with?')} size="md">
        <p className="-mt-2 mb-3 text-sm font-medium text-ink-muted">
          {t(
            'Όσοι επισημαίνεις βλέπουν τη δημοσίευση και μπορούν να αφαιρέσουν την ετικέτα τους.',
            'People you tag see the post and can remove their tag.',
          )}
        </p>
        <PeopleChecklist
          candidateIds={myConnections}
          selected={taggedIds}
          onChange={(ids) => setTaggedIds(ids.slice(0, 20))}
          label={t('Ετικέτες', 'Tags')}
          emptyText={t('Επισημαίνεις μόνο Nakamas σου — σύνδεσου πρώτα.', 'You can tag only your Nakamas — connect first.')}
        />
        <div className="mt-4 flex justify-end">
          <Button size="sm" onClick={() => setTagsOpen(false)}>
            {t('Τέλος', 'Done')}
          </Button>
        </div>
      </Modal>

      {isOwnWall && (
        <AudiencePickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          value={audience}
          context="post"
          showMakeDefault
          onSave={(a, { makeDefault }) => {
            setAudience(a);
            setAudienceTouched(!makeDefault);
            if (makeDefault) {
              updateWallPrivacy({ defaultAudience: a });
              toast.success(t('Αποθηκεύτηκε ως προεπιλογή', 'Saved as your default'));
            }
          }}
        />
      )}
    </Card>
  );
}
