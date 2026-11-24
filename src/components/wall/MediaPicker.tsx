import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import {
  EMOJI_CATEGORIES,
  EMOJI_KEYWORDS,
  GIPHY_CATALOG,
  NAKAMAS_STICKERS,
  makeStickerSvg,
  searchEmojis,
  type GiphyCategory,
} from '../../lib/chatMediaCatalog';
import { searchGifs, trendingGifs } from '../../lib/giphy';
import { cn } from '../../lib/utils';

const RECENT_KEY = 'nakamas-recent-emojis';
const RECENT_LIMIT = 16;

export type PickedMedia = {
  url: string;
  fallbackUrl: string;
  label: string;
};

type PickerTab = 'emoji' | 'gif' | 'stickers';
type GiphyFilter = GiphyCategory | 'all';

const GIF_CATEGORIES: { id: GiphyFilter; icon: string; el: string; en: string }[] = [
  { id: 'all', icon: '✨', el: 'Όλα', en: 'All' },
  { id: 'joy', icon: '🎉', el: 'Χαρά', en: 'Joy' },
  { id: 'love', icon: '❤️', el: 'Αγάπη', en: 'Love' },
  { id: 'laugh', icon: '😂', el: 'Γέλιο', en: 'Laugh' },
  { id: 'social', icon: '👋', el: 'Παρέα', en: 'Social' },
  { id: 'yesno', icon: '✅', el: 'Ναι/Όχι', en: 'Yes/No' },
  { id: 'thanks', icon: '🙏', el: 'Ευχαριστώ', en: 'Thanks' },
];

function readRecentEmojis(): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as unknown;
    if (!Array.isArray(parsed)) return [];
    const valid = new Set(EMOJI_CATEGORIES.flatMap((category) => category.emojis));
    return parsed.filter((emoji): emoji is string => typeof emoji === 'string' && valid.has(emoji)).slice(0, RECENT_LIMIT);
  } catch {
    return [];
  }
}

function rememberEmoji(emoji: string, current: string[]): string[] {
  const next = [emoji, ...current.filter((item) => item !== emoji)].slice(0, RECENT_LIMIT);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Recent picks are optional when storage is unavailable.
  }
  return next;
}

export function MediaPicker({
  initialTab = 'emoji',
  quickEmojis = [],
  onEmoji,
  onGif,
  onSticker,
  onClose,
}: {
  initialTab?: PickerTab;
  quickEmojis?: string[];
  onEmoji?: (emoji: string) => void;
  onGif?: (media: PickedMedia) => void;
  onSticker?: (media: PickedMedia) => void;
  onClose?: () => void;
}) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<PickerTab>(initialTab);
  const [recentEmojis, setRecentEmojis] = useState(readRecentEmojis);
  const [emojiQuery, setEmojiQuery] = useState('');
  const [emojiCategory, setEmojiCategory] = useState(() => (readRecentEmojis().length ? 'recent' : 'smileys'));
  const [gifQuery, setGifQuery] = useState('');
  const [debouncedGifQuery, setDebouncedGifQuery] = useState('');
  const [gifCategory, setGifCategory] = useState<GiphyFilter>('all');
  const [gifs, setGifs] = useState(GIPHY_CATALOG);
  const [failedGifIds, setFailedGifIds] = useState<Record<string, boolean>>({});
  const [loadingGifs, setLoadingGifs] = useState(false);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedGifQuery(gifQuery.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [gifQuery]);

  useEffect(() => {
    if (tab !== 'gif') return undefined;
    let active = true;
    setLoadingGifs(true);
    const load = debouncedGifQuery ? searchGifs(debouncedGifQuery) : trendingGifs();
    void load.then((results) => {
      if (!active) return;
      setGifs(results);
      setLoadingGifs(false);
    });
    return () => {
      active = false;
    };
  }, [debouncedGifQuery, tab]);

  const emojiTabs = useMemo(
    () => [
      ...(recentEmojis.length ? [{ id: 'recent', icon: '◷', labelEl: 'Πρόσφατα', labelEn: 'Recent', emojis: recentEmojis }] : []),
      ...(quickEmojis.length ? [{ id: 'quick', icon: '✨', labelEl: 'Γρήγορα', labelEn: 'Quick', emojis: quickEmojis }] : []),
      ...EMOJI_CATEGORIES,
    ],
    [recentEmojis, quickEmojis],
  );
  const activeEmojiTab = emojiTabs.find((category) => category.id === emojiCategory) ?? emojiTabs[0];
  const visibleEmojis = useMemo(() => {
    if (!activeEmojiTab) return [];
    return searchEmojis(emojiQuery, activeEmojiTab.emojis);
  }, [activeEmojiTab, emojiQuery]);
  const visibleGifs = useMemo(
    () => gifs.filter((gif) => gifCategory === 'all' || gif.category === gifCategory),
    [gifs, gifCategory],
  );

  const pickEmoji = (emoji: string) => {
    setRecentEmojis((current) => rememberEmoji(emoji, current));
    onEmoji?.(emoji);
  };

  const chooseGif = (gif: (typeof GIPHY_CATALOG)[number]) => {
    onGif?.({
      url: failedGifIds[gif.id] ? gif.fallbackSvgDataUrl : gif.url,
      fallbackUrl: gif.fallbackSvgDataUrl,
      label: t(gif.titleEl, gif.titleEn),
    });
  };

  const chooseSticker = (sticker: (typeof NAKAMAS_STICKERS)[number]) => {
    const caption = t(sticker.titleEl, sticker.titleEn);
    const fallbackUrl = makeStickerSvg(sticker.bg[0], sticker.bg[1], sticker.emoji, caption);
    onSticker?.({
      url: sticker.imageUrl ? new URL(sticker.imageUrl, window.location.origin).href : fallbackUrl,
      fallbackUrl,
      label: caption,
    });
  };

  const tabs: { id: PickerTab; labelEl: string; labelEn: string }[] = [
    { id: 'emoji', labelEl: 'Emoji', labelEn: 'Emoji' },
    { id: 'gif', labelEl: 'GIF', labelEn: 'GIF' },
    { id: 'stickers', labelEl: 'Αυτοκόλλητα', labelEn: 'Stickers' },
  ];

  return (
    <div className="max-h-64 overflow-hidden rounded-xl border border-border bg-surface-raised" data-testid="wall-media-picker">
      <div className="flex items-center gap-1 border-b border-border/60 px-2 py-1">
        <div role="tablist" aria-label={t('Επιλογή πολυμέσου', 'Choose media')} className="flex min-w-0 flex-1 gap-1">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                'min-h-8 rounded-full px-3 text-xs font-semibold',
                tab === item.id ? 'bg-accent text-accent-fg' : 'text-ink-muted hover:bg-surface',
              )}
            >
              {t(item.labelEl, item.labelEn)}
            </button>
          ))}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('Κλείσιμο', 'Close')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {tab === 'emoji' && (
        <div className="space-y-1.5 p-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              type="search"
              value={emojiQuery}
              onChange={(event) => setEmojiQuery(event.target.value)}
              placeholder={t('Αναζήτηση emoji…', 'Search emoji…')}
              aria-label={t('Αναζήτηση emoji', 'Search emoji')}
              className="h-8 w-full rounded-full border border-border bg-surface pl-8 pr-3 text-xs text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <div role="group" aria-label={t('Κατηγορίες emoji', 'Emoji categories')} className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {emojiTabs.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setEmojiCategory(category.id)}
                aria-label={t(category.labelEl, category.labelEn)}
                aria-pressed={emojiCategory === category.id}
                title={t(category.labelEl, category.labelEn)}
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm',
                  emojiCategory === category.id ? 'bg-accent-soft text-ink' : 'text-ink-muted hover:bg-surface',
                )}
              >
                {category.icon}
              </button>
            ))}
          </div>
          <div className="flex max-h-36 flex-wrap content-start gap-0.5 overflow-y-auto">
            {visibleEmojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => pickEmoji(emoji)}
                aria-label={t(`Εισαγωγή ${EMOJI_KEYWORDS[emoji]?.[0] ?? emoji}`, `Insert ${emoji}`)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-xl leading-none hover:bg-surface"
              >
                {emoji}
              </button>
            ))}
            {visibleEmojis.length === 0 && <p className="px-2 py-3 text-xs text-ink-muted">{t('Δεν βρέθηκαν emoji', 'No emoji found')}</p>}
          </div>
        </div>
      )}

      {tab === 'gif' && (
        <div className="space-y-1.5 p-2">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" aria-hidden />
            <input
              type="search"
              value={gifQuery}
              onChange={(event) => setGifQuery(event.target.value)}
              placeholder={t('Αναζήτηση GIF…', 'Search GIFs…')}
              aria-label={t('Αναζήτηση GIF', 'Search GIFs')}
              className="h-8 w-full rounded-full border border-border bg-surface pl-8 pr-3 text-xs text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </label>
          <div role="group" aria-label={t('Κατηγορίες GIF', 'GIF categories')} className="flex gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {GIF_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setGifCategory(category.id)}
                aria-label={t(category.el, category.en)}
                aria-pressed={gifCategory === category.id}
                className={cn(
                  'min-h-7 shrink-0 rounded-full px-2.5 text-2xs font-semibold',
                  gifCategory === category.id ? 'bg-accent-soft text-ink' : 'text-ink-muted hover:bg-surface',
                )}
              >
                <span aria-hidden>{category.icon}</span> {t(category.el, category.en)}
              </button>
            ))}
          </div>
          <p className="text-2xs font-semibold uppercase tracking-wide text-ink-muted">
            {debouncedGifQuery ? t('Αποτελέσματα', 'Results') : t('Trending', 'Trending')}
          </p>
          <div className="grid max-h-28 grid-cols-3 gap-1.5 overflow-y-auto">
            {visibleGifs.map((gif) => (
              <button
                key={gif.id}
                type="button"
                onClick={() => chooseGif(gif)}
                aria-label={t(gif.titleEl, gif.titleEn)}
                className="relative aspect-[3/2] overflow-hidden rounded-lg border border-border hover:border-accent"
              >
                <img
                  src={failedGifIds[gif.id] ? gif.fallbackSvgDataUrl : gif.url}
                  alt={t(gif.titleEl, gif.titleEn)}
                  onError={() => setFailedGifIds((failed) => ({ ...failed, [gif.id]: true }))}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
            {!loadingGifs && visibleGifs.length === 0 && (
              <p className="col-span-3 py-3 text-center text-xs text-ink-muted">{t('Δεν βρέθηκαν GIF', 'No GIFs found')}</p>
            )}
            {loadingGifs && <p className="col-span-3 py-3 text-center text-xs text-ink-muted">{t('Φόρτωση…', 'Loading…')}</p>}
          </div>
        </div>
      )}

      {tab === 'stickers' && (
        <div className="grid max-h-52 grid-cols-2 gap-1.5 overflow-y-auto p-2 sm:grid-cols-3">
          {NAKAMAS_STICKERS.map((sticker) => {
            const caption = t(sticker.titleEl, sticker.titleEn);
            const src = sticker.imageUrl ?? makeStickerSvg(sticker.bg[0], sticker.bg[1], sticker.emoji, caption);
            return (
              <button
                key={sticker.id}
                type="button"
                onClick={() => chooseSticker(sticker)}
                aria-label={caption}
                className="overflow-hidden rounded-lg border border-border bg-surface text-left hover:border-accent"
              >
                <img src={src} alt={caption} className="aspect-[3/2] w-full object-cover" loading="lazy" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
