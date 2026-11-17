import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Smile,
  Mic,
  Square,
  Send,
  Image as ImageIcon,
  BarChart3,
  Hash,
  AtSign,
  X,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import type { ChatMediaAttachment, ChatPoll, ChatReplyRef } from '../../types/chat';
import {
  EMOJI_CATEGORIES,
  GIPHY_CATALOG,
  QUICK_CHAT_TAGS,
  extractTagsAndMentions,
  type GiphyItem,
} from '../../lib/chatMediaCatalog';
import { fileToResizedDataUrl, imageErrorText } from '../../lib/imageResize';
import { cn } from '../../lib/utils';

export function ChatComposerTools({
  value,
  onChange,
  onSendText,
  onSendMedia,
  onSendPoll,
  replyTo,
  onClearReply,
  participants,
  disabled = false,
  compact = false,
}: {
  value: string;
  onChange: (next: string) => void;
  onSendText: (body: string, meta: { tags: string[]; mentions: string[] }) => void;
  onSendMedia: (media: ChatMediaAttachment, caption?: string) => void;
  onSendPoll: (poll: ChatPoll) => void;
  replyTo: ChatReplyRef | null;
  onClearReply: () => void;
  participants: { id: string; name: string }[];
  disabled?: boolean;
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const [panel, setPanel] = useState<'none' | 'emoji' | 'giphy' | 'poll' | 'more'>('none');
  const [emojiTab, setEmojiTab] = useState(EMOJI_CATEGORIES[0].id);
  const [gifQuery, setGifQuery] = useState('');
  const [failedGifIds, setFailedGifIds] = useState<Record<string, boolean>>({});
  const [pollQ, setPollQ] = useState('');
  const [pollOpts, setPollOpts] = useState(['', '']);

  // Voice recording state
  const [recording, setRecording] = useState(false);
  const [recSec, setRecSec] = useState(0);
  const recTimerRef = useRef<number | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Detect active @mention query at end of input
  const mentionQuery = useMemo(() => {
    const m = /(?:^|\s)@([^\s@#]*)$/.exec(value);
    return m ? m[1].toLowerCase() : null;
  }, [value]);

  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const allOption = { id: 'all', name: t('Όλοι', 'Everyone') };
    return [allOption, ...participants].filter((p) =>
      p.name.toLowerCase().includes(mentionQuery),
    );
  }, [mentionQuery, participants, t]);

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

  useEffect(() => {
    return () => {
      if (recTimerRef.current) window.clearInterval(recTimerRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  const insertToken = (token: string) => {
    const spacer = value && !value.endsWith(' ') ? ' ' : '';
    onChange(`${value}${spacer}${token} `);
    inputRef.current?.focus();
  };

  const applyMention = (name: string) => {
    const first = name.split(' ')[0];
    const replaced = value.replace(/@([^\s@#]*)$/, `@${first} `);
    onChange(replaced);
    inputRef.current?.focus();
  };

  const stopTracks = () => {
    if (recTimerRef.current) {
      window.clearInterval(recTimerRef.current);
      recTimerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    if (disabled) return;
    setPanel('none');
    setRecSec(0);
    setRecording(true);
    recChunksRef.current = [];
    recTimerRef.current = window.setInterval(() => setRecSec((s) => s + 1), 1000);

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mr = new MediaRecorder(stream);
        recorderRef.current = mr;
        mr.ondataavailable = (ev) => {
          if (ev.data.size > 0) recChunksRef.current.push(ev.data);
        };
        mr.start();
      }
    } catch {
      // Simulated audio fallback works without microphone permissions
      recorderRef.current = null;
    }
  };

  const cancelRecording = () => {
    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
    } catch {
      /* ignore */
    }
    stopTracks();
    setRecording(false);
    setRecSec(0);
  };

  const sendRecording = () => {
    const durationSec = Math.max(1, recSec);
    const waveform = Array.from({ length: 12 }, (_, i) => 4 + ((durationSec * 3 + i * 5) % 9));
    const mr = recorderRef.current;

    if (mr && mr.state !== 'inactive') {
      mr.onstop = () => {
        const blob = new Blob(recChunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const url = typeof reader.result === 'string' ? reader.result : `sim:voice:${durationSec}`;
          onSendMedia({ kind: 'voice', url, durationSec, waveform });
        };
        reader.readAsDataURL(blob);
      };
      mr.stop();
    } else {
      onSendMedia({ kind: 'voice', url: `sim:voice:${durationSec}`, durationSec, waveform });
    }
    stopTracks();
    setRecording(false);
    setRecSec(0);
  };

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const url = await fileToResizedDataUrl(file, { maxSize: 720, quality: 0.85 });
      onSendMedia({ kind: 'image', url, label: file.name });
      setPanel('none');
    } catch (err) {
      toast.error(imageErrorText(err, t));
    }
  };

  const handleCreatePoll = (e: React.FormEvent) => {
    e.preventDefault();
    const q = pollQ.trim();
    const opts = pollOpts.map((o) => o.trim()).filter(Boolean);
    if (!q || opts.length < 2) return;
    onSendPoll({
      id: `poll_${Date.now()}`,
      question: q,
      options: opts.map((label, i) => ({ id: `opt_${i}_${Date.now()}`, label, voterIds: [] })),
    });
    setPollQ('');
    setPollOpts(['', '']);
    setPanel('none');
  };

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    const meta = extractTagsAndMentions(value.trim(), participants);
    onSendText(value.trim(), meta);
    setPanel('none');
  };

  const pickGif = (g: GiphyItem) => {
    onSendMedia({
      kind: 'gif',
      url: g.url,
      fallbackUrl: g.fallbackSvgDataUrl,
      label: t(g.titleEl, g.titleEn),
    });
    setPanel('none');
  };

  return (
    <div className="border-t border-border bg-surface-raised shrink-0 relative pb-[max(0.5rem,env(safe-area-inset-bottom))] md:pb-0">
      {/* Reply-to-Reply bar */}
      {replyTo && (
        <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-brand-soft/60 border-b border-border text-xs">
          <div className="min-w-0 flex-1 border-l-2 border-brand pl-2">
            <p className="font-bold text-brand text-2xs">
              {t(`Απάντηση στον/στην ${replyTo.senderName}`, `Replying to ${replyTo.senderName}`)}
            </p>
            <p className="text-ink-muted text-2xs truncate">{replyTo.body}</p>
          </div>
          <button
            type="button"
            onClick={onClearReply}
            aria-label={t('Ακύρωση απάντησης', 'Cancel reply')}
            className="p-1 rounded-full text-ink-muted hover:bg-ink/10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* @mention autocomplete */}
      {mentionCandidates.length > 0 && (
        <div
          className="absolute bottom-full left-3 right-3 mb-1 z-30 rounded-2xl border border-border bg-surface-raised shadow-soft-lg p-1.5 flex flex-wrap gap-1"
          role="listbox"
          aria-label={t('Αναφορά χρήστη', 'Mention user')}
        >
          {mentionCandidates.slice(0, 6).map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => applyMention(u.name)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface hover:bg-brand-soft text-xs font-bold text-ink"
            >
              <AtSign className="w-3 h-3 text-brand" />
              {u.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Popover panels: Emoji / GIPHY / Poll / More */}
      {panel === 'emoji' && (
        <div className="p-2.5 border-b border-border bg-surface space-y-2 max-h-52 overflow-y-auto">
          <div className="flex items-center justify-between gap-1">
            <div className="flex gap-1">
              {EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setEmojiTab(cat.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-bold',
                    emojiTab === cat.id ? 'bg-brand text-brand-fg' : 'text-ink-muted hover:bg-ink/5',
                  )}
                >
                  {cat.icon} <span className="hidden sm:inline">{t(cat.labelEl, cat.labelEn)}</span>
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setPanel('none')} aria-label={t('Κλείσιμο', 'Close')} className="p-1 text-ink-muted">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-8 gap-1">
            {(EMOJI_CATEGORIES.find((c) => c.id === emojiTab)?.emojis ?? []).map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => {
                  onChange(`${value}${em}`);
                  inputRef.current?.focus();
                }}
                className="h-8 rounded-lg hover:bg-ink/10 text-base flex items-center justify-center transition-transform active:scale-95"
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      )}

      {panel === 'giphy' && (
        <div className="p-2.5 border-b border-border bg-surface space-y-2 max-h-60 overflow-y-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-ink text-surface">
              GIPHY
            </span>
            <input
              type="text"
              value={gifQuery}
              onChange={(e) => setGifQuery(e.target.value)}
              placeholder={t('Αναζήτηση GIF (π.χ. party, coffee)...', 'Search GIFs (party, coffee)...')}
              className="flex-1 h-8 rounded-full border border-border bg-surface-raised px-3 text-xs text-ink focus:outline-none"
            />
            <button type="button" onClick={() => setPanel('none')} aria-label={t('Κλείσιμο', 'Close')} className="p-1 text-ink-muted">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {filteredGifs.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => pickGif(g)}
                className="relative rounded-2xl overflow-hidden border border-border hover:border-brand aspect-[3/2] bg-ink/5 group"
              >
                <img
                  src={failedGifIds[g.id] ? g.fallbackSvgDataUrl : g.url}
                  alt={t(g.titleEl, g.titleEn)}
                  onError={() => setFailedGifIds((prev) => ({ ...prev, [g.id]: true }))}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-1 left-1 right-1 text-2xs font-bold text-white bg-black/55 rounded px-1 truncate">
                  {t(g.titleEl, g.titleEn)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {panel === 'poll' && (
        <form onSubmit={handleCreatePoll} className="p-3 border-b border-border bg-surface space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink">📊 {t('Νέα δημοσκόπηση', 'New poll')}</span>
            <button type="button" onClick={() => setPanel('none')} aria-label={t('Κλείσιμο', 'Close')} className="p-1 text-ink-muted">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="text"
            value={pollQ}
            onChange={(e) => setPollQ(e.target.value)}
            placeholder={t('Ερώτηση (π.χ. Τι ώρα βρισκόμαστε;)', 'Question (e.g. What time?)')}
            className="w-full h-8 rounded-2xl border border-border bg-surface-raised px-3 text-xs text-ink"
          />
          {pollOpts.map((opt, idx) => (
            <input
              key={idx}
              type="text"
              value={opt}
              onChange={(e) => setPollOpts((prev) => prev.map((v, i) => (i === idx ? e.target.value : v)))}
              placeholder={`${t('Επιλογή', 'Option')} ${idx + 1}`}
              className="w-full h-8 rounded-2xl border border-border bg-surface-raised px-3 text-xs text-ink"
            />
          ))}
          <div className="flex items-center justify-between pt-1">
            {pollOpts.length < 4 ? (
              <button
                type="button"
                onClick={() => setPollOpts((prev) => [...prev, ''])}
                className="text-2xs font-bold text-brand underline"
              >
                + {t('Προσθήκη επιλογής', 'Add option')}
              </button>
            ) : <span />}
            <button
              type="submit"
              disabled={!pollQ.trim() || pollOpts.filter((o) => o.trim()).length < 2}
              className="px-3.5 py-1 rounded-full bg-brand text-brand-fg text-xs font-bold disabled:opacity-50"
            >
              {t('Αποστολή', 'Send poll')}
            </button>
          </div>
        </form>
      )}

      {panel === 'more' && (
        <div className="p-2.5 border-b border-border bg-surface space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border bg-surface-raised text-xs font-bold text-ink cursor-pointer hover:border-brand">
                <ImageIcon className="w-3.5 h-3.5 text-brand" />
                {t('Φωτογραφία', 'Photo')}
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoPick} />
              </label>
              <button
                type="button"
                onClick={() => setPanel('poll')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border bg-surface-raised text-xs font-bold text-ink hover:border-brand"
              >
                <BarChart3 className="w-3.5 h-3.5 text-brand" />
                {t('Δημοσκόπηση', 'Poll')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(`${value}${value && !value.endsWith(' ') ? ' ' : ''}@`);
                  setPanel('none');
                  inputRef.current?.focus();
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-border bg-surface-raised text-xs font-bold text-ink hover:border-brand"
              >
                <AtSign className="w-3.5 h-3.5 text-brand" />
                {t('Αναφορά', 'Mention')}
              </button>
            </div>
            <button type="button" onClick={() => setPanel('none')} aria-label={t('Κλείσιμο', 'Close')} className="p-1 text-ink-muted">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto noscrollbar">
            <Hash className="w-3 h-3 text-ink-muted shrink-0" aria-hidden />
            {QUICK_CHAT_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  insertToken(`#${tag}`);
                  setPanel('none');
                }}
                className="px-2 py-0.5 rounded-full bg-surface-raised border border-border text-2xs font-semibold text-ink-muted hover:text-brand hover:border-brand shrink-0"
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Composer Row or Voice Recording Mode */}
      {recording ? (
        <div className="flex items-center gap-2 p-2.5">
          <button
            type="button"
            onClick={cancelRecording}
            aria-label={t('Ακύρωση ηχογράφησης', 'Cancel recording')}
            className="p-2 rounded-full text-red-600 hover:bg-red-50"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex-1 flex items-center gap-2 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            <span className="text-xs font-bold text-red-700 dark:text-red-300 tabular-nums">
              {String(Math.floor(recSec / 60))}:{String(recSec % 60).padStart(2, '0')}
            </span>
            <span className="text-2xs text-red-600/80 dark:text-red-300/80 truncate">
              {t('Ηχογράφηση φωνητικού…', 'Recording voice note…')}
            </span>
          </div>
          <button
            type="button"
            onClick={sendRecording}
            aria-label={t('Αποστολή φωνητικού', 'Send voice note')}
            className="min-h-9 px-3.5 rounded-full bg-brand text-brand-fg text-xs font-bold flex items-center gap-1"
          >
            <Square className="w-3 h-3 fill-current" />
            {t('Αποστολή', 'Send')}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmitText} className={cn('flex items-center gap-1.5', compact ? 'p-2.5' : 'p-3')}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPanel((p) => (p === 'more' ? 'none' : 'more'))}
            aria-label={t('Περισσότερα (Φωτό, Δημοσκόπηση, Tags)', 'More tools (Photo, Poll, Tags)')}
            title={t('Φωτό · Δημοσκόπηση · #Tags', 'Photo · Poll · #Tags')}
            className={cn(
              'p-1.5 rounded-full transition-colors shrink-0 disabled:opacity-40',
              panel === 'more' || panel === 'poll' ? 'bg-brand text-brand-fg' : 'text-ink-muted hover:bg-ink/10 hover:text-ink',
            )}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPanel((p) => (p === 'emoji' ? 'none' : 'emoji'))}
            aria-label={t('Emojis', 'Emojis')}
            title={t('Emojis', 'Emojis')}
            className={cn(
              'p-1.5 rounded-full transition-colors shrink-0 disabled:opacity-40',
              panel === 'emoji' ? 'bg-brand text-brand-fg' : 'text-ink-muted hover:bg-ink/10 hover:text-ink',
            )}
          >
            <Smile className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setPanel((p) => (p === 'giphy' ? 'none' : 'giphy'))}
            aria-label="GIPHY GIF"
            title="GIPHY GIF"
            className={cn(
              'px-2 py-0.5 rounded-full text-2xs font-extrabold border transition-colors shrink-0 disabled:opacity-40',
              panel === 'giphy'
                ? 'bg-brand text-brand-fg border-brand'
                : 'border-border text-ink-muted hover:border-brand hover:text-brand',
            )}
          >
            GIF
          </button>

          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={t('Μήνυμα, @όνομα ή #tag…', 'Message, @name or #tag…')}
            className="flex-1 min-w-0 min-h-9 rounded-full bg-ink/5 border border-border px-3 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/40"
            aria-label={t('Σύνθεση μηνύματος', 'Compose message')}
          />

          {value.trim() ? (
            <button
              type="submit"
              disabled={disabled}
              aria-label={t('Αποστολή', 'Send')}
              className="min-h-9 px-3 rounded-full bg-brand text-brand-fg text-xs font-bold flex items-center gap-1 shrink-0 disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" aria-hidden />
              <span className="hidden sm:inline">{t('Αποστολή', 'Send')}</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={disabled}
              onClick={() => void startRecording()}
              aria-label={t('Ηχογράφηση φωνητικού', 'Record voice note')}
              title={t('Φωνητικό μήνυμα', 'Voice note')}
              className="min-h-9 w-9 rounded-full bg-brand-soft text-brand hover:bg-brand hover:text-brand-fg flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
            >
              <Mic className="w-4 h-4" />
            </button>
          )}
        </form>
      )}
    </div>
  );
}
