/**
 * Curated bilingual catalogs for Nakamas SOTA Chat:
 * - Categorized Emoji Picker + Quick Reactions
 * - GIPHY GIF & Animated Sticker Picker (with inline SVG fallback so zero images break offline)
 * - Quick #tags & @mention / #tag parser
 */

import { foldSearchText } from './greekText';

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
  {
    id: 'food',
    icon: '🍔',
    labelEl: 'Φαγητό',
    labelEn: 'Food',
    emojis: ['🍔', '🍟', '🍕', '🌮', '🌯', '🥗', '🍣', '🍜', '🍰', '🍩', '🍪', '🍓', '🍉', '🥑', '🥐', '🧀'],
  },
  {
    id: 'travel',
    icon: '✈️',
    labelEl: 'Ταξίδι',
    labelEn: 'Travel',
    emojis: ['✈️', '🧳', '🚗', '🚆', '🚲', '🛵', '⛵', '🚢', '🗺️', '🧭', '🏖️', '🏝️', '🏕️', '🏔️', '🌍', '📸'],
  },
  {
    id: 'sports',
    icon: '⚽',
    labelEl: 'Σπορ',
    labelEn: 'Sports',
    emojis: ['⚽', '🏀', '🏐', '🎾', '🏓', '🏸', '🏊', '🏃', '🚴', '🧘', '🥾', '🏋️', '🧗', '⛷️', '🥇', '🏆'],
  },
  {
    id: 'symbols',
    icon: '💯',
    labelEl: 'Σύμβολα',
    labelEn: 'Symbols',
    emojis: ['💯', '✅', '❌', '❓', '❗', '💬', '💡', '🔔', '🔗', '📍', '❤️', '💔', '⭐', '♻️', '⚠️', '🔒'],
  },
];

export const EMOJI_KEYWORDS: Record<string, string[]> = {
  '😀': ['χαμόγελο', 'χαρούμενος', 'happy', 'smile'],
  '😂': ['γέλιο', 'αστείο', 'laugh', 'funny'],
  '🥹': ['συγκινημένος', 'δάκρυ', 'moved', 'teary'],
  '😍': ['αγάπη', 'καρδιά', 'love', 'adore'],
  '🤩': ['ενθουσιασμός', 'εντυπωσιακό', 'excited', 'starstruck'],
  '🥳': ['πάρτι', 'γιορτή', 'party', 'celebrate'],
  '😎': ['κουλ', 'γυαλιά', 'cool', 'sunglasses'],
  '🤗': ['αγκαλιά', 'hug', 'welcome'],
  '🤔': ['σκέψη', 'αναρωτιέμαι', 'think', 'wonder'],
  '😅': ['αμήχανο', 'ανακούφιση', 'sweat', 'relief'],
  '🙃': ['ανάποδα', 'ειρωνεία', 'upside down', 'silly'],
  '😴': ['ύπνος', 'νύστα', 'sleep', 'tired'],
  '🤯': ['σοκ', 'έκπληξη', 'mind blown', 'shocked'],
  '😇': ['άγγελος', 'αθώος', 'angel', 'innocent'],
  '🫶': ['καρδιά με χέρια', 'αγάπη', 'heart hands', 'love'],
  '✨': ['λάμψη', 'μαγεία', 'sparkles', 'magic'],
  '🎉': ['πάρτι', 'κομφετί', 'party', 'celebration'],
  '🥂': ['υγεία', 'σαμπάνια', 'cheers', 'champagne'],
  '🍻': ['μπύρα', 'ποτό', 'beer', 'cheers'],
  '☕': ['καφές', 'καφετέρια', 'coffee', 'cafe'],
  '🍸': ['κοκτέιλ', 'ποτό', 'cocktail', 'drink'],
  '🍕': ['πίτσα', 'φαγητό', 'pizza', 'food'],
  '🎬': ['σινεμά', 'ταινία', 'movie', 'cinema'],
  '🎵': ['μουσική', 'τραγούδι', 'music', 'song'],
  '🎸': ['κιθάρα', 'μουσική', 'guitar', 'music'],
  '🎭': ['θέατρο', 'τέχνη', 'theater', 'arts'],
  '🎲': ['παιχνίδι', 'ζάρια', 'game', 'dice'],
  '🎟️': ['εισιτήριο', 'συναυλία', 'ticket', 'concert'],
  '🕺': ['χορός', 'χορεύω', 'dance', 'dancing'],
  '💃': ['χορός', 'χορεύω', 'dance', 'dancing'],
  '🎤': ['μικρόφωνο', 'καραόκε', 'microphone', 'karaoke'],
  '🕯️': ['κερί', 'ρομαντικό', 'candle', 'romantic'],
  '👍': ['ναι', 'εντάξει', 'like', 'yes', 'thumbs up'],
  '👏': ['μπράβο', 'χειροκρότημα', 'clap', 'applause'],
  '🙌': ['τέλεια', 'πανηγυρισμός', 'celebrate', 'hooray'],
  '🤝': ['συμφωνία', 'συνεργασία', 'deal', 'handshake'],
  '✌️': ['ειρήνη', 'νίκη', 'peace', 'victory'],
  '🤞': ['καλή τύχη', 'ελπίζω', 'fingers crossed', 'luck'],
  '👌': ['οκ', 'τέλειο', 'okay', 'perfect'],
  '💪': ['δύναμη', 'γυμναστήριο', 'strong', 'muscle'],
  '👋': ['γεια', 'χαιρετισμός', 'hello', 'wave'],
  '🫡': ['χαιρετισμός', 'σεβασμός', 'salute', 'respect'],
  '🙏': ['ευχαριστώ', 'παρακαλώ', 'thanks', 'please', 'pray'],
  '👀': ['βλέπω', 'μάτια', 'eyes', 'watching'],
  '💬': ['μήνυμα', 'συζήτηση', 'message', 'chat'],
  '📍': ['τοποθεσία', 'σημείο', 'location', 'pin'],
  '⏰': ['ώρα', 'ξυπνητήρι', 'time', 'alarm'],
  '✅': ['σωστό', 'έτοιμο', 'check', 'done'],
  '❤️': ['καρδιά', 'αγάπη', 'heart', 'love'],
  '🧡': ['πορτοκαλί καρδιά', 'αγάπη', 'orange heart', 'love'],
  '💛': ['κίτρινη καρδιά', 'φιλία', 'yellow heart', 'friendship'],
  '💚': ['πράσινη καρδιά', 'φύση', 'green heart', 'nature'],
  '🩵': ['γαλάζια καρδιά', 'αγάπη', 'blue heart', 'love'],
  '💜': ['μωβ καρδιά', 'αγάπη', 'purple heart', 'love'],
  '🔥': ['φωτιά', 'τέλειο', 'fire', 'hot'],
  '⚡': ['αστραπή', 'ενέργεια', 'lightning', 'energy'],
  '🌟': ['αστέρι', 'λάμψη', 'star', 'shine'],
  '💫': ['ζάλη', 'μαγεία', 'dizzy', 'magic'],
  '🌈': ['ουράνιο τόξο', 'χρώματα', 'rainbow', 'colors'],
  '🌊': ['κύμα', 'θάλασσα', 'wave', 'sea'],
  '⛰️': ['βουνό', 'φύση', 'mountain', 'outdoors'],
  '🌿': ['φύση', 'φυτό', 'nature', 'plant'],
  '🌙': ['φεγγάρι', 'νύχτα', 'moon', 'night'],
  '☀️': ['ήλιος', 'καλοκαίρι', 'sun', 'summer'],
  '🍔': ['μπέργκερ', 'φαγητό', 'burger', 'food'],
  '🍟': ['πατάτες', 'φαγητό', 'fries', 'food'],
  '🌮': ['τάκο', 'φαγητό', 'taco', 'food'],
  '🌯': ['μπουρίτο', 'φαγητό', 'burrito', 'food'],
  '🥗': ['σαλάτα', 'φαγητό', 'salad', 'food'],
  '🍣': ['σούσι', 'φαγητό', 'sushi', 'food'],
  '🍜': ['νουντλς', 'σούπα', 'noodles', 'soup'],
  '🍰': ['τούρτα', 'γλυκό', 'cake', 'dessert'],
  '🍩': ['ντόνατ', 'γλυκό', 'donut', 'dessert'],
  '🍪': ['μπισκότο', 'γλυκό', 'cookie', 'dessert'],
  '🍓': ['φράουλα', 'φρούτο', 'strawberry', 'fruit'],
  '🍉': ['καρπούζι', 'φρούτο', 'watermelon', 'fruit'],
  '🥑': ['αβοκάντο', 'φαγητό', 'avocado', 'food'],
  '🥐': ['κρουασάν', 'πρωινό', 'croissant', 'breakfast'],
  '🧀': ['τυρί', 'φαγητό', 'cheese', 'food'],
  '✈️': ['ταξίδι', 'αεροπλάνο', 'travel', 'plane'],
  '🧳': ['βαλίτσα', 'ταξίδι', 'luggage', 'travel'],
  '🚗': ['αυτοκίνητο', 'οδήγηση', 'car', 'drive'],
  '🚆': ['τρένο', 'ταξίδι', 'train', 'travel'],
  '🚲': ['ποδήλατο', 'βόλτα', 'bike', 'cycling'],
  '🛵': ['σκούτερ', 'ταξίδι', 'scooter', 'travel'],
  '⛵': ['ιστιοπλοΐα', 'θάλασσα', 'sailboat', 'sea'],
  '🚢': ['πλοίο', 'ταξίδι', 'ship', 'travel'],
  '🗺️': ['χάρτης', 'ταξίδι', 'map', 'travel'],
  '🧭': ['πυξίδα', 'προσανατολισμός', 'compass', 'direction'],
  '🏖️': ['παραλία', 'καλοκαίρι', 'beach', 'summer'],
  '🏝️': ['νησί', 'διακοπές', 'island', 'holiday'],
  '🏕️': ['κάμπινγκ', 'φύση', 'camping', 'outdoors'],
  '🏔️': ['βουνό', 'πεζοπορία', 'mountain', 'hiking'],
  '🌍': ['κόσμος', 'ταξίδι', 'world', 'travel'],
  '📸': ['φωτογραφία', 'κάμερα', 'photo', 'camera'],
  '⚽': ['ποδόσφαιρο', 'μπάλα', 'football', 'soccer'],
  '🏀': ['μπάσκετ', 'μπάλα', 'basketball'],
  '🏐': ['βόλεϊ', 'μπάλα', 'volleyball'],
  '🎾': ['τένις', 'ρακέτα', 'tennis'],
  '🏓': ['πινγκ πονγκ', 'ρακέτα', 'table tennis'],
  '🏸': ['μπάντμιντον', 'ρακέτα', 'badminton'],
  '🏊': ['κολύμβηση', 'πισίνα', 'swimming'],
  '🏃': ['τρέξιμο', 'άσκηση', 'running', 'exercise'],
  '🚴': ['ποδηλασία', 'άσκηση', 'cycling', 'exercise'],
  '🧘': ['γιόγκα', 'χαλάρωση', 'yoga', 'relax'],
  '🥾': ['πεζοπορία', 'βουνό', 'hiking', 'boot'],
  '🏋️': ['βάρη', 'γυμναστήριο', 'lifting', 'gym'],
  '🧗': ['αναρρίχηση', 'βουνό', 'climbing'],
  '⛷️': ['σκι', 'χιόνι', 'ski', 'snow'],
  '🥇': ['μετάλλιο', 'νίκη', 'gold', 'medal'],
  '🏆': ['κύπελλο', 'νικητής', 'trophy', 'winner'],
  '💯': ['τέλειο', 'εκατό', 'perfect', 'hundred'],
  '❌': ['όχι', 'λάθος', 'no', 'wrong'],
  '❓': ['ερώτηση', 'απορία', 'question'],
  '❗': ['σημαντικό', 'θαυμαστικό', 'important', 'exclamation'],
  '💡': ['ιδέα', 'έμπνευση', 'idea', 'inspiration'],
  '🔔': ['ειδοποίηση', 'καμπανάκι', 'notification', 'bell'],
  '🔗': ['σύνδεσμος', 'link', 'url'],
  '💔': ['ραγισμένη καρδιά', 'λύπη', 'broken heart', 'sad'],
  '⭐': ['αστέρι', 'βαθμολογία', 'star', 'favorite'],
  '♻️': ['ανακύκλωση', 'οικολογία', 'recycle', 'eco'],
  '⚠️': ['προσοχή', 'κίνδυνος', 'warning', 'caution'],
  '🔒': ['κλειδωμένο', 'ασφάλεια', 'lock', 'secure'],
};

export function searchEmojis(query: string, emojis = EMOJI_CATEGORIES.flatMap((category) => category.emojis)): string[] {
  const needle = foldSearchText(query);
  if (!needle) return emojis;
  return emojis.filter((emoji) => foldSearchText([emoji, ...(EMOJI_KEYWORDS[emoji] ?? [])].join(' ')).includes(needle));
}

export interface GiphyItem {
  id: string;
  titleEl: string;
  titleEn: string;
  keywords: string[];
  category: GiphyCategory;
  url: string;
  fallbackSvgDataUrl: string;
}

export type GiphyCategory = 'joy' | 'love' | 'laugh' | 'social' | 'yesno' | 'thanks';

function escapeSvgText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function makeStickerSvg(bg1: string, bg2: string, emoji: string, text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 160">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs>
  <rect width="240" height="160" rx="18" fill="url(#g)"/>
  <text x="120" y="84" text-anchor="middle" font-size="52">${emoji}</text>
  <text x="120" y="132" text-anchor="middle" font-family="Inter,sans-serif" font-weight="800" font-size="18" fill="#ffffff">${escapeSvgText(text)}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const GIPHY_CATALOG: GiphyItem[] = [
  {
    id: 'gif_party',
    titleEl: 'Πάρτι!',
    titleEn: 'Party!',
    keywords: ['party', 'παρτι', 'celebrate', 'γιορτη', 'fun'],
    category: 'joy',
    url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#0ea5e9', '#6366f1', '🥳', 'PARTY TIME!'),
  },
  {
    id: 'gif_cheers',
    titleEl: 'Στην υγειά μας',
    titleEn: 'Cheers',
    keywords: ['cheers', 'drink', 'ποτο', 'μπυρα', 'κρασι', 'υγεια'],
    category: 'thanks',
    url: 'https://media.giphy.com/media/g9582DNuQppxC/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#f59e0b', '#ea580c', '🥂', 'CHEERS!'),
  },
  {
    id: 'gif_coffee',
    titleEl: 'Ώρα για καφέ',
    titleEn: 'Coffee time',
    keywords: ['coffee', 'καφες', 'morning', 'πρωι', 'cafe'],
    category: 'social',
    url: 'https://media.giphy.com/media/3oriO04qxVReM5rJEA/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#78350f', '#b45309', '☕', 'COFFEE?'),
  },
  {
    id: 'gif_yes',
    titleEl: 'Μέσα! / Ναι!',
    titleEn: 'I am in!',
    keywords: ['yes', 'ναι', 'μεσα', 'ok', 'deal', 'agree'],
    category: 'yesno',
    url: 'https://media.giphy.com/media/3ohzdIuqJoo8QdKlnW/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#059669', '#10b981', '🙌', "I'M IN!"),
  },
  {
    id: 'gif_laugh',
    titleEl: 'Χαχα τέλειο',
    titleEn: 'Haha',
    keywords: ['laugh', 'haha', 'lol', 'γελ', 'αστειο', 'funny'],
    category: 'laugh',
    url: 'https://media.giphy.com/media/10JhviFuU2gWD6/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#ec4899', '#f43f5e', '😂', 'HAHAHA!'),
  },
  {
    id: 'gif_hello',
    titleEl: 'Γεια σε όλους',
    titleEn: 'Hey team',
    keywords: ['hello', 'hi', 'hey', 'γεια', 'καλησπερα', 'wave'],
    category: 'social',
    url: 'https://media.giphy.com/media/ASd0Ukj0y3qMM/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#0891b2', '#06b6d4', '👋', 'HEY THERE!'),
  },
  {
    id: 'gif_onmyway',
    titleEl: 'Έρχομαι τώρα!',
    titleEn: 'On my way!',
    keywords: ['omw', 'run', 'way', 'ερχομαι', 'φτανω', 'walk'],
    category: 'joy',
    url: 'https://media.giphy.com/media/3o7ZetIsjtbkgNE1I4/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#2563eb', '#3b82f6', '🏃', 'ON MY WAY!'),
  },
  {
    id: 'gif_love',
    titleEl: 'Υπέροχο!',
    titleEn: 'Love it!',
    keywords: ['love', 'heart', 'αγαπ', 'τελειο', 'wow'],
    category: 'love',
    url: 'https://media.giphy.com/media/26BRv0ThflsHCqDrG/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#e11d48', '#db2777', '❤️', 'LOVE IT!'),
  },
  {
    id: 'gif_cinema',
    titleEl: 'Σινεμά / Popcorn',
    titleEn: 'Movie night',
    keywords: ['movie', 'cinema', 'σινεμα', 'ταινια', 'popcorn'],
    category: 'social',
    url: 'https://media.giphy.com/media/NipFetnQOuKhW/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#7c3aed', '#4f46e5', '🍿', 'MOVIE NIGHT'),
  },
  {
    id: 'gif_dance',
    titleEl: 'Χορός & μουσική',
    titleEn: 'Dance vibe',
    keywords: ['dance', 'music', 'χορος', 'μουσικη', 'vibe', 'dj'],
    category: 'joy',
    url: 'https://media.giphy.com/media/l3vRlT2k2L35Cnn5C/giphy.gif',
    fallbackSvgDataUrl: makeStickerSvg('#9333ea', '#c026d3', '💃', 'GOOD VIBES'),
  },
];

const LOCAL_GIF_SEEDS: Array<{
  id: string;
  titleEl: string;
  titleEn: string;
  keywords: string[];
  category: GiphyCategory;
  bg: [string, string];
  emoji: string;
}> = [
  { id: 'joy_sunshine', titleEl: 'Μια υπέροχη μέρα', titleEn: 'Such a lovely day', keywords: ['sun', 'day', 'ήλιος'], category: 'joy', bg: ['#f59e0b', '#f97316'], emoji: '☀️' },
  { id: 'joy_hurray', titleEl: 'Τα καταφέραμε!', titleEn: 'We did it!', keywords: ['win', 'hooray', 'νίκη'], category: 'joy', bg: ['#0ea5e9', '#6366f1'], emoji: '🙌' },
  { id: 'joy_party', titleEl: 'Ώρα για πάρτι', titleEn: 'Party time', keywords: ['party', 'dance', 'πάρτι'], category: 'joy', bg: ['#ec4899', '#8b5cf6'], emoji: '🥳' },
  { id: 'joy_wow', titleEl: 'Ουάου!', titleEn: 'Wow!', keywords: ['wow', 'amazing', 'ουάου'], category: 'joy', bg: ['#14b8a6', '#0ea5e9'], emoji: '🤩' },
  { id: 'joy_cheer', titleEl: 'Τέλεια νέα', titleEn: 'Great news', keywords: ['great', 'news', 'νέα'], category: 'joy', bg: ['#10b981', '#14b8a6'], emoji: '✨' },
  { id: 'love_heart', titleEl: 'Με αγάπη', titleEn: 'With love', keywords: ['heart', 'love', 'καρδιά'], category: 'love', bg: ['#e11d48', '#db2777'], emoji: '💖' },
  { id: 'love_hug', titleEl: 'Μια μεγάλη αγκαλιά', titleEn: 'Big hug', keywords: ['hug', 'love', 'αγκαλιά'], category: 'love', bg: ['#fb7185', '#f472b6'], emoji: '🤗' },
  { id: 'love_sweet', titleEl: 'Γλυκιά στιγμή', titleEn: 'Sweet moment', keywords: ['sweet', 'kiss', 'γλυκό'], category: 'love', bg: ['#c026d3', '#ec4899'], emoji: '😘' },
  { id: 'love_care', titleEl: 'Σε σκέφτομαι', titleEn: 'Thinking of you', keywords: ['care', 'miss', 'σκέφτομαι'], category: 'love', bg: ['#8b5cf6', '#d946ef'], emoji: '🫶' },
  { id: 'love_blush', titleEl: 'Τι γλυκό!', titleEn: 'So sweet!', keywords: ['sweet', 'cute', 'γλυκό'], category: 'love', bg: ['#f43f5e', '#fb7185'], emoji: '🥰' },
  { id: 'laugh_lol', titleEl: 'Πεθαίνω στα γέλια', titleEn: 'LOL', keywords: ['lol', 'laugh', 'γέλιο'], category: 'laugh', bg: ['#eab308', '#f97316'], emoji: '🤣' },
  { id: 'laugh_rofl', titleEl: 'Χαχαχα!', titleEn: 'Hahaha!', keywords: ['haha', 'funny', 'αστείο'], category: 'laugh', bg: ['#f97316', '#ef4444'], emoji: '😂' },
  { id: 'laugh_giggle', titleEl: 'Κρατιέμαι με το ζόρι', titleEn: 'Trying not to laugh', keywords: ['giggle', 'funny', 'γελάω'], category: 'laugh', bg: ['#ca8a04', '#f59e0b'], emoji: '😆' },
  { id: 'laugh_smirk', titleEl: 'Το ήξερα!', titleEn: 'I knew it!', keywords: ['smirk', 'funny', 'ήξερα'], category: 'laugh', bg: ['#7c3aed', '#ec4899'], emoji: '😏' },
  { id: 'laugh_tears', titleEl: 'Δεν αντέχω!', titleEn: 'Can’t stop!', keywords: ['laugh', 'tears', 'γέλιο'], category: 'laugh', bg: ['#2563eb', '#06b6d4'], emoji: '😹' },
  { id: 'social_hello', titleEl: 'Γεια σου!', titleEn: 'Hey there!', keywords: ['hello', 'hi', 'γεια'], category: 'social', bg: ['#0891b2', '#6366f1'], emoji: '👋' },
  { id: 'social_coffee', titleEl: 'Πάμε για καφέ;', titleEn: 'Coffee date?', keywords: ['coffee', 'cafe', 'καφές'], category: 'social', bg: ['#78350f', '#d97706'], emoji: '☕' },
  { id: 'social_movie', titleEl: 'Βραδιά σινεμά', titleEn: 'Movie night', keywords: ['movie', 'cinema', 'σινεμά'], category: 'social', bg: ['#312e81', '#7c3aed'], emoji: '🎬' },
  { id: 'social_cheers', titleEl: 'Στην υγειά μας!', titleEn: 'Cheers!', keywords: ['cheers', 'drink', 'ποτό'], category: 'social', bg: ['#059669', '#0d9488'], emoji: '🥂' },
  { id: 'social_wave', titleEl: 'Τα λέμε σύντομα', titleEn: 'See you soon', keywords: ['bye', 'see you', 'αντίο'], category: 'social', bg: ['#0ea5e9', '#14b8a6'], emoji: '🫡' },
  { id: 'yesno_yes', titleEl: 'Ναι, μέσα!', titleEn: 'Yes, I’m in!', keywords: ['yes', 'in', 'ναι'], category: 'yesno', bg: ['#059669', '#10b981'], emoji: '✅' },
  { id: 'yesno_no', titleEl: 'Ίσως την επόμενη', titleEn: 'Maybe next time', keywords: ['no', 'maybe', 'όχι'], category: 'yesno', bg: ['#64748b', '#94a3b8'], emoji: '🙅' },
  { id: 'yesno_maybe', titleEl: 'Χμμ, θα δω', titleEn: 'Hmm, maybe', keywords: ['maybe', 'think', 'ίσως'], category: 'yesno', bg: ['#7c3aed', '#6366f1'], emoji: '🤔' },
  { id: 'yesno_ready', titleEl: 'Έτοιμος/η!', titleEn: 'Ready!', keywords: ['ready', 'yes', 'έτοιμος'], category: 'yesno', bg: ['#0284c7', '#2563eb'], emoji: '🙋' },
  { id: 'yesno_go', titleEl: 'Φύγαμε!', titleEn: 'Let’s go!', keywords: ['go', 'yes', 'πάμε'], category: 'yesno', bg: ['#ea580c', '#f59e0b'], emoji: '🚀' },
  { id: 'thanks_thanks', titleEl: 'Ευχαριστώ πολύ', titleEn: 'Thank you so much', keywords: ['thanks', 'thank you', 'ευχαριστώ'], category: 'thanks', bg: ['#0f766e', '#14b8a6'], emoji: '🙏' },
  { id: 'thanks_welcome', titleEl: 'Παρακαλώ!', titleEn: 'You’re welcome!', keywords: ['welcome', 'thanks', 'παρακαλώ'], category: 'thanks', bg: ['#2563eb', '#7c3aed'], emoji: '🫶' },
  { id: 'thanks_appreciate', titleEl: 'Το εκτιμώ!', titleEn: 'Much appreciated!', keywords: ['appreciate', 'thanks', 'εκτιμώ'], category: 'thanks', bg: ['#0d9488', '#22c55e'], emoji: '💚' },
  { id: 'thanks_kind', titleEl: 'Πολύ γλυκό από μέρους σου', titleEn: 'That’s so kind', keywords: ['kind', 'sweet', 'ευγενικό'], category: 'thanks', bg: ['#db2777', '#8b5cf6'], emoji: '🥹' },
  { id: 'thanks_cheers', titleEl: 'Σε ευχαριστώ!', titleEn: 'Thanks a million!', keywords: ['thank', 'cheers', 'ευχαριστώ'], category: 'thanks', bg: ['#d97706', '#eab308'], emoji: '✨' },
];

GIPHY_CATALOG.push(
  ...LOCAL_GIF_SEEDS.map((item) => {
    const fallbackSvgDataUrl = makeStickerSvg(item.bg[0], item.bg[1], item.emoji, item.titleEn);
    return { ...item, url: fallbackSvgDataUrl, fallbackSvgDataUrl };
  }),
);

export interface NakamasSticker {
  id: string;
  titleEl: string;
  titleEn: string;
  emoji: string;
  bg: [string, string];
  imageUrl?: string;
}

export const NAKAMAS_STICKERS: NakamasSticker[] = [
  { id: 'hat-plan', titleEl: 'Το πλάνο', titleEn: 'The plan', emoji: '🧢', bg: ['#0284c7', '#4f46e5'], imageUrl: '/chat-hats/01-plan.png' },
  { id: 'hat-wear', titleEl: 'Το look', titleEn: 'The look', emoji: '👕', bg: ['#be123c', '#f97316'], imageUrl: '/chat-hats/05-wear.png' },
  { id: 'hat-table', titleEl: 'Στο τραπέζι', titleEn: 'At the table', emoji: '🍽️', bg: ['#059669', '#0d9488'], imageUrl: '/chat-hats/13-yellow-table.png' },
  { id: 'hat-drawn', titleEl: 'Η παρέα', titleEn: 'The crew', emoji: '🎨', bg: ['#7c3aed', '#db2777'], imageUrl: '/chat-hats/15-drawn-anime.png' },
  { id: 'sticker-coming', titleEl: 'Έρχομαι!', titleEn: "I'm in!", emoji: '🙌', bg: ['#059669', '#10b981'] },
  { id: 'sticker-seat', titleEl: 'Κράτα μου θέση', titleEn: 'Save me a seat', emoji: '🪑', bg: ['#0ea5e9', '#6366f1'] },
  { id: 'sticker-see-you', titleEl: 'Τα λέμε εκεί', titleEn: 'See you there', emoji: '👋', bg: ['#7c3aed', '#ec4899'] },
  { id: 'sticker-thanks', titleEl: 'Ευχαριστώ!', titleEn: 'Thanks!', emoji: '🙏', bg: ['#0f766e', '#14b8a6'] },
  { id: 'sticker-shall-we', titleEl: 'Πάμε;', titleEn: 'Shall we?', emoji: '🚀', bg: ['#ea580c', '#f59e0b'] },
  { id: 'sticker-great-night', titleEl: 'Τέλεια βραδιά', titleEn: 'Great night', emoji: '✨', bg: ['#312e81', '#ec4899'] },
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

export const FEELINGS = [
  { id: 'excited', emoji: '🤩', el: 'ενθουσιασμένος/η', en: 'excited' },
  { id: 'chill', emoji: '😌', el: 'χαλαρός/ή', en: 'chill' },
  { id: 'grateful', emoji: '🙏', el: 'ευγνώμων', en: 'grateful' },
  { id: 'hungry', emoji: '😋', el: 'πεινασμένος/η', en: 'hungry' },
  { id: 'party', emoji: '🥳', el: 'σε γιορτινή διάθεση', en: 'in a party mood' },
  { id: 'watching', emoji: '🎬', el: 'βλέπει ταινία', en: 'watching a movie' },
  { id: 'hiking', emoji: '🥾', el: 'για πεζοπορία', en: 'going hiking' },
  { id: 'listening', emoji: '🎵', el: 'ακούει μουσική', en: 'listening to music' },
  { id: 'eating', emoji: '🍽️', el: 'τρώει', en: 'eating' },
  { id: 'travelling', emoji: '✈️', el: 'ταξιδεύει', en: 'travelling' },
  { id: 'celebrating', emoji: '🎉', el: 'γιορτάζει', en: 'celebrating' },
  { id: 'coffee', emoji: '☕', el: 'για καφέ', en: 'having coffee' },
] as const;

export const WALL_TEXT_BACKGROUNDS = STORY_BG_GRADIENTS.map((gradient, index) => ({
  id: `bg${index + 1}`,
  gradient,
}));

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
