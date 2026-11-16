import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ImagePlus, Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { POST_MAX_CHARS, useWallAccess, useWallStore } from '../../store/wallStore';
import { canPostOnWall, wallPrivacyOf } from '../../lib/audience';
import { fileToResizedDataUrl, imageErrorText } from '../../lib/imageResize';
import type { Audience } from '../../types/wall';
import { AudienceChip } from './AudienceChip';
import { AudiencePickerModal } from './AudiencePickerModal';
import { PersonAvatar } from './PersonAvatar';

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
export function PostComposer({ wallOwnerId, onPosted }: { wallOwnerId?: string; onPosted?: (id: string) => void }) {
  const { t } = useLanguage();
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

  const [text, setText] = useState(() => readDraft(ownerId));
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [eventId, setEventId] = useState<string | undefined>();
  const [audience, setAudience] = useState<Audience>(() => (me ? wallPrivacyOf(access.privacyByUser, me.id).defaultAudience : { base: 'connections' }));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [eventPickerOpen, setEventPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => writeDraft(ownerId, text), [ownerId, text]);

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
    const res = createPost({ wallOwnerId: ownerId, text, imageUrl, eventId, audience: isOwnWall ? audience : undefined });
    if (!res.ok) {
      toast.error(t(res.reasonEl ?? '', res.reasonEn ?? ''));
      return;
    }
    setText('');
    setImageUrl(undefined);
    setEventId(undefined);
    writeDraft(ownerId, '');
    toast.success(
      isOwnWall
        ? t('Δημοσιεύτηκε στον τοίχο σου', 'Posted to your wall')
        : t(`Δημοσιεύτηκε στον τοίχο του/της ${owner?.name ?? ''}`, `Posted on ${owner?.name ?? ''}'s wall`),
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
                      className="flex min-h-10 w-full items-center gap-2 rounded-xl px-2 text-left text-xs font-bold text-ink hover:bg-surface"
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

          <div className="flex flex-wrap items-center gap-2">
            {isOwnWall ? (
              <AudienceChip audience={audience} onClick={() => setPickerOpen(true)} />
            ) : (
              <AudienceChip audience={ownerAudience} />
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex min-h-8 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-ink-muted hover:bg-surface hover:text-ink"
            >
              <ImagePlus className="h-4 w-4" aria-hidden /> {t('Φωτογραφία', 'Photo')}
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
              className="inline-flex min-h-8 items-center gap-1 rounded-full px-2.5 text-xs font-bold text-ink-muted hover:bg-surface hover:text-ink"
            >
              <CalendarDays className="h-4 w-4" aria-hidden /> {t('Εκδήλωση', 'Event')}
            </button>
            <span className="ml-auto flex items-center gap-2">
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
      </div>

      {isOwnWall && (
        <AudiencePickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          value={audience}
          context="post"
          showMakeDefault
          onSave={(a, { makeDefault }) => {
            setAudience(a);
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
