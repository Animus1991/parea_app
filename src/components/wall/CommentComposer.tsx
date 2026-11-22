import { useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { AtSign, Image as ImageIcon, Send, Smile, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { extractTagsAndMentions } from '../../lib/chatMediaCatalog';
import { fileToResizedDataUrl, imageErrorText } from '../../lib/imageResize';
import { COMMENT_MAX_CHARS, useWallStore } from '../../store/wallStore';
import { cn } from '../../lib/utils';
import type { CommentDraft, WallComment } from '../../types/wall';
import { QUICK_POST_REACTIONS, REACTION_KINDS } from '../../types/wall';
import { PersonAvatar } from './PersonAvatar';
import { REACTION_EMOJI } from './wallText';
import type { User } from '../../types';
import { MediaPicker, type PickedMedia } from './MediaPicker';

type Panel = 'none' | 'media';

const EXTRA_COMMENT_EMOJIS = REACTION_KINDS.filter((k) => !QUICK_POST_REACTIONS.includes(k)).map((k) => REACTION_EMOJI[k]);

export function CommentComposer({
  postId,
  me,
  mentionPeople,
  replyTo,
  onClearReply,
  focusOnOpen = false,
  inputId,
}: {
  postId: string;
  me: User;
  mentionPeople: { id: string; name: string }[];
  replyTo: WallComment | null;
  onClearReply: () => void;
  focusOnOpen?: boolean;
  inputId: string;
}) {
  const { t } = useLanguage();
  const addComment = useWallStore((s) => s.addComment);
  const [text, setText] = useState('');
  const [panel, setPanel] = useState<Panel>('none');
  const [pickerTab, setPickerTab] = useState<'emoji' | 'gif' | 'stickers'>('emoji');
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [gif, setGif] = useState<{ url: string; fallbackUrl?: string; label: string } | undefined>();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (focusOnOpen) inputRef.current?.focus();
  }, [focusOnOpen, replyTo]);

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

  const applyMention = (name: string) => {
    const first = name.split(' ')[0];
    setText((v) => v.replace(/@([^\s@#]*)$/, `@${first} `));
    inputRef.current?.focus();
  };

  const insertEmoji = (em: string) => {
    setText((v) => `${v}${em}`);
    inputRef.current?.focus();
  };

  const pickGif = (media: PickedMedia) => {
    setGif({ url: media.url, fallbackUrl: media.fallbackUrl, label: media.label });
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
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
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
            {replyTo.text
              ? ` — ${replyTo.text.trim().slice(0, replyTo.text.trim().length > 80 ? 79 : 80)}${replyTo.text.trim().length > 80 ? '…' : ''}`
              : ''}
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

      {panel === 'media' && (
        <div className="mb-2">
          <MediaPicker
            initialTab={pickerTab}
            quickEmojis={EXTRA_COMMENT_EMOJIS}
            onEmoji={insertEmoji}
            onGif={pickGif}
            onSticker={pickGif}
            onClose={() => setPanel('none')}
          />
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
              onClick={() => {
                if (panel === 'media' && pickerTab === 'emoji') setPanel('none');
                else {
                  setPickerTab('emoji');
                  setPanel('media');
                }
              }}
              aria-label={t('Emoji', 'Emoji')}
              aria-pressed={panel === 'media' && pickerTab === 'emoji'}
              className={cn('flex h-8 w-8 items-center justify-center rounded-full', panel === 'media' && pickerTab === 'emoji' ? 'bg-accent text-accent-fg' : 'text-ink-muted hover:bg-surface-raised')}
            >
              <Smile className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={t('Φωτογραφία', 'Photo')}
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface-raised"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handlePhoto(e)}
            />
            <button
              type="button"
              onClick={() => {
                if (panel === 'media' && pickerTab === 'gif') setPanel('none');
                else {
                  setPickerTab('gif');
                  setPanel('media');
                }
              }}
              aria-pressed={panel === 'media' && pickerTab === 'gif'}
              aria-label="GIF"
              className={cn(
                'h-8 rounded-full px-2 text-2xs font-extrabold',
                panel === 'media' && pickerTab === 'gif' ? 'bg-accent text-accent-fg' : 'text-ink-muted hover:bg-surface-raised',
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
