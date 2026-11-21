import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { AtSign, Image as ImageIcon, Send, Smile, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { EMOJI_CATEGORIES, GIPHY_CATALOG, extractTagsAndMentions, type GiphyItem } from '../../lib/chatMediaCatalog';
import { fileToResizedDataUrl, imageErrorText } from '../../lib/imageResize';
import { COMMENT_MAX_CHARS, useWallStore } from '../../store/wallStore';
import { cn } from '../../lib/utils';
import type { CommentDraft, WallComment } from '../../types/wall';
import { QUICK_POST_REACTIONS, REACTION_KINDS } from '../../types/wall';
import { PersonAvatar } from './PersonAvatar';
import { REACTION_EMOJI } from './wallText';
import type { User } from '../../types';

type Panel = 'none' | 'emoji' | 'gif';

const EXTRA_COMMENT_EMOJIS = REACTION_KINDS.filter((k) => !QUICK_POST_REACTIONS.includes(k)).map((k) => REACTION_EMOJI[k]);

const EMOJI_TABS = [
  { id: 'quick', icon: '✨', labelEl: 'Γρήγορα', labelEn: 'Quick', emojis: EXTRA_COMMENT_EMOJIS },
  ...EMOJI_CATEGORIES,
];

export function CommentComposer({
  postId,
  me,
  mentionPeople,
  replyTo,
  onClearReply,
  autoFocus = false,
  inputId,
}: {
  postId: string;
  me: User;
  mentionPeople: { id: string; name: string }[];
  replyTo: WallComment | null;
  onClearReply: () => void;
  autoFocus?: boolean;
  inputId: string;
}) {
  const { t } = useLanguage();
  const addComment = useWallStore((s) => s.addComment);
  const [text, setText] = useState('');
  const [panel, setPanel] = useState<Panel>('none');
  const [emojiTab, setEmojiTab] = useState(EMOJI_TABS[0].id);
  const [gifQuery, setGifQuery] = useState('');
  const [failedGifIds, setFailedGifIds] = useState<Record<string, boolean>>({});
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [gif, setGif] = useState<{ url: string; fallbackUrl?: string; label: string } | undefined>();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus, replyTo]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [text]);

  const mentionQuery = useMemo(() => {
    const m = /(?:^|\s)@([^\s@#]*)$/.exec(text);
    return m ? m[1].toLowerCase() : null;
  }, [text]);

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    return mentionPeople.filter((p) => p.name.toLowerCase().includes(mentionQuery)).slice(0, 6);
  }, [mentionQuery, mentionPeople]);

  const filteredGifs = useMemo(() => {
    const q = gifQuery.trim().toLowerCase();
    if (!q) return GIPHY_CATALOG;
    return GIPHY_CATALOG.filter(
      (g) =>
        g.titleEl.toLowerCase().includes(q) ||
        g.titleEn.toLowerCase().includes(q) ||
        g.keywords.some((k) => k.includes(q)),
    );
  }, [gifQuery]);

  const applyMention = (name: string) => {
    const first = name.split(' ')[0];
    setText((v) => v.replace(/@([^\s@#]*)$/, `@${first} `));
    inputRef.current?.focus();
  };

  const insertEmoji = (em: string) => {
    setText((v) => `${v}${em}`);
    inputRef.current?.focus();
  };

  const pickGif = (g: GiphyItem) => {
    setGif({ url: g.url, fallbackUrl: g.fallbackSvgDataUrl, label: t(g.titleEl, g.titleEn) });
    setImageUrl(undefined);
    setPanel('none');
  };

  const handlePhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await fileToResizedDataUrl(file, { maxSize: 720, quality: 0.85 });
      setImageUrl(url);
      setGif(undefined);
      setPanel('none');
    } catch (err) {
      toast.error(imageErrorText(err, t));
    }
  };

  const canSend = Boolean(text.trim() || imageUrl || gif);
  const remaining = COMMENT_MAX_CHARS - text.length;

  const send = () => {
    if (!canSend) return;
    const extra: CommentDraft = {
      ...(imageUrl ? { imageUrl } : {}),
      ...(gif ? { gifUrl: gif.url, gifFallbackUrl: gif.fallbackUrl } : {}),
      ...(replyTo ? { parentId: replyTo.id } : {}),
      ...(() => {
        const ids = extractTagsAndMentions(text.trim(), mentionPeople).mentions;
        return ids.length ? { mentionIds: ids } : {};
      })(),
    };
    const res = addComment(postId, text, extra);
    if (!res.ok) {
      toast.error(t(res.reasonEl, res.reasonEn));
      return;
    }
    setText('');
    setImageUrl(undefined);
    setGif(undefined);
    setPanel('none');
    onClearReply();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
    if (e.key === 'Escape' && replyTo) onClearReply();
  };

  const replyAuthor = replyTo ? mentionPeople.find((p) => p.id === replyTo.authorId)?.name : undefined;

  return (
    <div className="relative mt-3 rounded-2xl border border-border bg-surface p-2">
      {replyTo && (
        <div className="mb-1.5 flex items-center justify-between gap-2 rounded-xl bg-accent-soft/60 px-2.5 py-1.5">
          <p className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
            <span className="font-bold">
              {t(`Απάντηση στον/στην ${replyAuthor ?? ''}`, `Replying to ${replyAuthor ?? ''}`)}
            </span>
            {replyTo.text ? ` — ${replyTo.text}` : ''}
          </p>
          <button type="button" onClick={onClearReply} aria-label={t('Ακύρωση απάντησης', 'Cancel reply')} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {mentionCandidates.length > 0 && (
        <div className="mb-1.5 flex flex-wrap gap-1" role="listbox" aria-label={t('Αναφορά χρήστη', 'Mention user')}>
          {mentionCandidates.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => applyMention(u.name)}
              className="inline-flex min-h-8 items-center gap-1 rounded-full bg-surface-raised px-2.5 text-xs font-bold text-ink hover:bg-accent-soft"
            >
              <AtSign className="h-3 w-3 text-accent" />
              {u.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {panel === 'emoji' && (
        <div className="mb-2 space-y-2 rounded-xl border border-border bg-surface-raised p-2">
          <div className="flex items-center justify-between gap-1">
            <div className="flex gap-1 overflow-x-auto">
              {EMOJI_TABS.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setEmojiTab(cat.id)}
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold',
                    emojiTab === cat.id ? 'bg-accent text-accent-fg' : 'text-ink-muted hover:bg-surface',
                  )}
                >
                  {cat.icon} <span className="hidden sm:inline">{t(cat.labelEl, cat.labelEn)}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setPanel('none')} aria-label={t('Κλείσιμο', 'Close')} className="p-1 text-ink-muted">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex max-h-36 flex-wrap content-start gap-0.5 overflow-y-auto">
            {(EMOJI_TABS.find((c) => c.id === emojiTab)?.emojis ?? []).map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => insertEmoji(em)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-lg leading-none hover:bg-surface"
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {panel === 'gif' && (
        <div className="mb-2 space-y-2 rounded-xl border border-border bg-surface-raised p-2">
          <div className="flex items-center gap-2">
            <span className="rounded bg-ink px-2 py-0.5 text-2xs font-extrabold uppercase tracking-wider text-surface">GIF</span>
            <input
              type="search"
              value={gifQuery}
              onChange={(e) => setGifQuery(e.target.value)}
              placeholder={t('Αναζήτηση GIF…', 'Search GIFs…')}
              className="h-8 min-w-0 flex-1 rounded-full border border-border bg-surface px-3 text-xs text-ink outline-none focus:ring-2 focus:ring-accent"
            />
            <button type="button" onClick={() => setPanel('none')} aria-label={t('Κλείσιμο', 'Close')} className="p-1 text-ink-muted">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="grid max-h-44 grid-cols-3 gap-1.5 overflow-y-auto">
            {filteredGifs.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => pickGif(g)}
                className="relative aspect-[3/2] overflow-hidden rounded-xl border border-border hover:border-accent"
              >
                <img
                  src={failedGifIds[g.id] ? g.fallbackSvgDataUrl : g.url}
                  alt={t(g.titleEl, g.titleEn)}
                  onError={() => setFailedGifIds((prev) => ({ ...prev, [g.id]: true }))}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {(imageUrl || gif) && (
        <div className="mb-2 flex items-start gap-2">
          <div className="relative max-w-[11rem]">
            <img
              src={imageUrl ?? gif?.url}
              alt={gif?.label ?? t('Προεπισκόπηση φωτογραφίας', 'Photo preview')}
              onError={(e) => {
                if (gif?.fallbackUrl) (e.currentTarget as HTMLImageElement).src = gif.fallbackUrl;
              }}
              className="max-h-28 w-full rounded-xl object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setImageUrl(undefined);
                setGif(undefined);
              }}
              aria-label={t('Αφαίρεση συνημμένου', 'Remove attachment')}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink/80 text-surface"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-start gap-2">
        <PersonAvatar user={me} size="sm" />
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={inputId}>
            {t('Γράψε σχόλιο', 'Write a comment')}
          </label>
          <textarea
            ref={inputRef}
            id={inputId}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, COMMENT_MAX_CHARS))}
            onKeyDown={onKeyDown}
            maxLength={COMMENT_MAX_CHARS}
            placeholder={t('Γράψε ένα σχόλιο… @όνομα, emoji, GIF', 'Write a comment… @name, emoji, GIF')}
            className="max-h-40 min-h-10 w-full resize-none rounded-2xl border border-border bg-surface-raised px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-accent"
          />
          <div className="mt-1 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setPanel((p) => (p === 'emoji' ? 'none' : 'emoji'))}
              aria-label={t('Emojis', 'Emojis')}
              aria-pressed={panel === 'emoji'}
              className={cn('flex h-8 w-8 items-center justify-center rounded-full', panel === 'emoji' ? 'bg-accent text-accent-fg' : 'text-ink-muted hover:bg-surface-raised')}
            >
              <Smile className="h-4 w-4" />
            </button>
            <label className={cn('flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-muted hover:bg-surface-raised')}>
              <span className="sr-only">{t('Φωτογραφία', 'Photo')}</span>
              <ImageIcon className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => void handlePhoto(e)} />
            </label>
            <button
              type="button"
              onClick={() => setPanel((p) => (p === 'gif' ? 'none' : 'gif'))}
              aria-pressed={panel === 'gif'}
              aria-label="GIF"
              className={cn(
                'h-8 rounded-full px-2 text-2xs font-extrabold',
                panel === 'gif' ? 'bg-accent text-accent-fg' : 'text-ink-muted hover:bg-surface-raised',
              )}
            >
              GIF
            </button>
            <button
              type="button"
              onClick={() => {
                setText((v) => `${v}${v && !v.endsWith(' ') ? ' ' : ''}@`);
                inputRef.current?.focus();
              }}
              aria-label={t('Αναφορά', 'Mention')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-raised"
            >
              <AtSign className="h-4 w-4" />
            </button>
            {remaining <= 120 && (
              <span className={cn('ml-auto text-2xs font-bold tabular-nums', remaining < 0 ? 'text-rose-600' : 'text-ink-muted')}>
                {remaining}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={send}
          disabled={!canSend}
          aria-label={t('Αποστολή σχολίου', 'Send comment')}
          className="mt-0 flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-full bg-accent text-accent-fg disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
