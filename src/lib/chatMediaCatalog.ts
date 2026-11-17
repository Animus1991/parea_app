/**
 * Curated bilingual catalogs for Nakamas SOTA Chat:
 * - Categorized Emoji Picker + Quick Reactions
 * - GIPHY GIF & Animated Sticker Picker (with inline SVG fallback so zero images break offline)
 * - Quick #tags & @mention / #tag parser
 */

export const QUICK_REACTIONS = ['👍', '❤️', '😂', '🔥', '🎉', '👀'] as const;

export interface EmojiCategory {
  id: string;
  icon: string;
  labelEl: string;
  labelEn: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    icon: '😊',
    labelEl: 'Πρόσωπα',
    labelEn: 'Smileys',
    emojis: ['😀', '😂', '🥹', '😍', '🤩', '🥳', '😎', '🤗', '🤔', '😅', '🙃', '😴', '🤯', '😇', '🫶', '✨'],
  },
  {
    id: 'social',
    icon: '🎉',
    labelEl: 'Έξοδος',
    labelEn: 'Social',
    emojis: ['🎉', '🥂', '🍻', '☕', '🍸', '🍕', '🎬', '🎵', '🎸', '🎭', '🎲', '🎟️', '🕺', '💃', '🎤', '🕯️'],
  },
  {
    id: 'gestures',
    icon: '🙌',
    labelEl: 'Χειρονομίες',
    labelEn: 'Gestures',
    emojis: ['👍', '👏', '🙌', '🤝', '✌️', '🤞', '👌', '💪', '👋', '🫡', '🙏', '👀', '💬', '📍', '⏰', '✅'],
  },
  {
    id: 'vibe',
    icon: '❤️',
    labelEl: 'Vibe',
    labelEn: 'Vibe',
    emojis: ['❤️', '🧡', '💛', '💚', '🩵', '💜', '🔥', '⚡', '🌟', '💫', '🌈', '🌊', '⛰️', '🌿', '🌙', '☀️'],
  },
];

export interface GiphyItem {
  id: string;
  titleEl: string;
  titleEn: string;
  keywords: string[];
  url: string;
  fallbackSvgDataUrl: string;
}

function makeStickerSvg(bg1: string, bg2: string, emoji: string, text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs>
  <rect width="240" height="160" rx="18" fill="url(#g)"/>
  <text x="120" y="84" text-anchor="middle" font-size="52">${emoji}</text>
  <text x="120" y="132" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="18" fill="#ffffff">${text}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const GIPHY_CATALOG: GiphyItem[] = [
  {
    id: 'gif_party',
    titleEl: 'Πάρτι!',
    titleEn: 'Party!',
    keywords: ['party', 'παρτι', 'celebrate', 'γιορτη', 'fun'],
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#0ea5e9', '#6366f1', '🥳', 'PARTY TIME!'),
  },
  {
    id: 'gif_cheers',
    titleEl: 'Στην υγειά μας',
    titleEn: 'Cheers',
    keywords: ['cheers', 'drink', 'ποτο', 'μπυρα', 'κρασι', 'υγεια'],
    url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#f59e0b', '#ea580c', '🥂', 'CHEERS!'),
  },
  {
    id: 'gif_coffee',
    titleEl: 'Ώρα για καφέ',
    titleEn: 'Coffee time',
    keywords: ['coffee', 'καφες', 'morning', 'πρωι', 'cafe'],
    url: 'https://media.giphy.com/media/3oriO04qxVReM5rJEA/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#78350f', '#b45309', '☕', 'COFFEE?'),
  },
  {
    id: 'gif_yes',
    titleEl: 'Μέσα! / Ναι!',
    titleEn: 'I am in!',
    keywords: ['yes', 'ναι', 'μεσα', 'ok', 'deal', 'agree'],
    url: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#059669', '#10b981', '🙌', "I'M IN!"),
  },
  {
    id: 'gif_laugh',
    titleEl: 'Χαχα τέλειο',
    titleEn: 'Haha',
    keywords: ['laugh', 'haha', 'lol', 'γελ', 'αστειο', 'funny'],
    url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#ec4899', '#f43f5e', '😂', 'HAHAHA!'),
  },
  {
    id: 'gif_hello',
    titleEl: 'Γεια σε όλους',
    titleEn: 'Hey team',
    keywords: ['hello', 'hi', 'hey', 'γεια', 'καλησπερα', 'wave'],
    url: 'https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#0891b2', '#06b6d4', '👋', 'HEY THERE!'),
  },
  {
    id: 'gif_onmyway',
    titleEl: 'Έρχομαι τώρα!',
    titleEn: 'On my way!',
    keywords: ['omw', 'run', 'way', 'ερχομαι', 'φτανω', 'walk'],
    url: 'https://media.giphy.com/media/3o7ZetIsjtbkgNE1I4/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#2563eb', '#3b82f6', '🏃', 'ON MY WAY!'),
  },
  {
    id: 'gif_love',
    titleEl: 'Υπέροχο!',
    titleEn: 'Love it!',
    keywords: ['love', 'heart', 'αγαπ', 'τελειο', 'wow'],
    url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#e11d48', '#db2777', '❤️', 'LOVE IT!'),
  },
  {
    id: 'gif_cinema',
    titleEl: 'Σινεμά / Popcorn',
    titleEn: 'Movie night',
    keywords: ['movie', 'cinema', 'σινεμα', 'ταινια', 'popcorn'],
    url: 'https://media.giphy.com/media/NipFetnQOuKhW/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#7c3aed', '#4f46e5', '🍿', 'MOVIE NIGHT'),
  },
  {
    id: 'gif_dance',
    titleEl: 'Χορός & μουσική',
    titleEn: 'Dance vibe',
    keywords: ['dance', 'music', 'χορος', 'μουσικη', 'vibe', 'dj'],
    url: 'https://media.giphy.com/media/l3vRlT2k2L35Cnn5C/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#9333ea', '#c026d3', '💃', 'GOOD VIBES'),
  },
];

export const QUICK_CHAT_TAGS = [
  'συνάντηση',
  'εισιτήρια',
  'καφές',
  'φαγητό',
  'έφτασα',
  'φωτό',
] as const;

export const STORY_BG_GRADIENTS = [
  'linear-gradient(135deg, #0b6d6f 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
  'linear-gradient(135deg, #ea580c 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
  'linear-gradient(135deg, #059669 0%, #14b8a6 100%)',
] as const;

/** Extract #tags and @mentions from message text. */
export function extractTagsAndMentions(
  body: string,
  participants: { id: string; name: string }[],
): { tags: string[]; mentions: string[] } {
  const tags = Array.from(
    new Set(
      [...body.matchAll(/#([\p{L}\p{N}_-]{2,28})/gu)].map((m) => m[1].toLowerCase()),
    ),
  );
  const mentions = new Set<string>();
  const lower = body.toLowerCase();
  if (/@(all|όλοι|ολοι)\b/iu.test(body)) mentions.add('all');
  for (const u of participants) {
    const first = u.name.split(' ')[0]?.toLowerCase();
    if (!first) continue;
    if (lower.includes(`@${first}`) || lower.includes(`@${u.name.toLowerCase()}`)) {
      mentions.add(u.id);
    }
  }
  return { tags, mentions: [...mentions] };
}
