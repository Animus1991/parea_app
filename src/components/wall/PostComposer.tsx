import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ImagePlus, Lock, UserPlus, X } from 'lucide-react';
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
  const { t } = useLanguage();
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
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [eventId, setEventId] = useState<string | undefined>(initialEventId);
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

  useEffect(() => {
    const onFull = () =>
      toast.error(t('Ο χώρος της συσκευής γέμισε — η τελευταία αλλαγή δεν αποθηκεύτηκε.', 'Device storage is full — the last change was not saved.'));
    window.addEventListener('nakamas:storage-full', onFull);
    return () => window.removeEventListener('nakamas:storage-full', onFull);
  }, [t]);

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
  const canSubmit = !busy && (text.trim().length > 0 || Boolean(imageUrl) || Boolean(eventId)) && remaining >= 0;

  const pickImage = async (file?: File) => {
    if (!file) return;
    try {
      setBusy(true);
      setImageUrl(await fileToResizedDataUrl(file, { maxSize: 960, quality: 0.78 }));
    } catch (err) {
      toast.error(imageErrorText(err, t));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    if (!canSubmit) return;
    const res = createPost({ wallOwnerId: ownerId, text, imageUrl, eventId, audience: isOwnWall ? audience : undefined, taggedIds });
    if (!res.ok) {
      toast.error(t(res.reasonEl ?? '', res.reasonEn ?? ''));
      return;
    }
    setText('');
    setImageUrl(undefined);
    setEventId(undefined);
    setTaggedIds([]);
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
    ? t(`Τι σκέφτεσαι, ${me.name}; Ψάχνεις παρέα για κάτι;`, `What's on your mind, ${me.name}? Looking for company?`)
    : t(`Γράψε κάτι στον τοίχο του/της ${owner?.name ?? ''}…`, `Write something on ${owner?.name ?? ''}'s wall…`);

  return (
    <Card className="p-4" data-testid="wall-composer">
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submit();
              }
            }}
            rows={text.length > 120 ? 4 : 2}
            maxLength={POST_MAX_CHARS + 50}
            placeholder={placeholder}
            className="w-full resize-none rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-accent"
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

          {imageUrl && (
            <div className="relative overflow-hidden rounded-2xl border border-border">
              <img src={imageUrl} alt={t('Προεπισκόπηση φωτογραφίας', 'Photo preview')} className="max-h-72 w-full object-cover" />
              <button
                type="button"
                onClick={() => setImageUrl(undefined)}
                className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
                aria-label={t('Αφαίρεση φωτογραφίας', 'Remove photo')}
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
                      <span className="shrink-0 font-medium text-ink-muted">{e.date}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>

      <div className="mt-3 space-y-2">
        {!text && !eventId && !imageUrl && (
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
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              void pickImage(f);
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
