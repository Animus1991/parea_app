/**
 * Words, icons and emoji for the wall — one place so every surface (composer,
 * post header, settings, AI) says the same thing.
 */
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { Globe, Users, Network, UserCheck, ListChecks, Lock, type LucideIcon } from 'lucide-react';
import type { Audience, AudienceBase, AudienceList, ProfileSectionKey, ReactionKind } from '../../types/wall';
import { dateFnsLocale } from '../../lib/dateLocale';

type T = (el: string, en: string) => string;

export const AUDIENCE_ICON: Record<AudienceBase, LucideIcon> = {
  public: Globe,
  connections: Users,
  friends_of_friends: Network,
  specific: UserCheck,
  list: ListChecks,
  only_me: Lock,
};

export function audienceBaseLabel(base: AudienceBase, t: T): string {
  switch (base) {
    case 'public':
      return t('Δημόσιο', 'Public');
    case 'connections':
      return t('Nakamas μου', 'My Nakamas');
    case 'friends_of_friends':
      return t('Nakamas των Nakamas', 'Friends of friends');
    case 'specific':
      return t('Συγκεκριμένα άτομα', 'Specific people');
    case 'list':
      return t('Λίστα', 'List');
    case 'only_me':
      return t('Μόνο εγώ', 'Only me');
  }
}

export function audienceBaseHint(base: AudienceBase, t: T): string {
  switch (base) {
    case 'public':
      return t('Όλα τα μέλη του δικτύου Nakamas', 'Everyone on the Nakamas network');
    case 'connections':
      return t('Μόνο οι συνδέσεις σου', 'Only people you are connected with');
    case 'friends_of_friends':
      return t('Οι Nakamas σου και οι δικοί τους Nakamas', 'Your Nakamas and their Nakamas');
    case 'specific':
      return t('Διάλεξε ποιοι από τους Nakamas σου', 'Pick which of your Nakamas');
    case 'list':
      return t('Μια λίστα σου, π.χ. «Κοντινοί φίλοι»', 'One of your lists, e.g. “Close friends”');
    case 'only_me':
      return t('Κανείς άλλος — μόνο εσύ', 'Nobody else — just you');
  }
}

/** Short label for a full audience, e.g. «Nakamas μου, εκτός από 2». */
export function audienceLabel(a: Audience, t: T, lists: AudienceList[] = []): string {
  let label = audienceBaseLabel(a.base, t);
  if (a.base === 'list') {
    const list = lists.find((l) => l.id === a.listId);
    if (list) label = list.name;
  }
  if (a.base === 'specific') {
    const n = a.includeIds?.length ?? 0;
    label = n === 1 ? t('1 άτομο', '1 person') : t(`${n} άτομα`, `${n} people`);
  }
  const ex = a.base !== 'specific' && a.base !== 'only_me' ? a.excludeIds?.length ?? 0 : 0;
  if (ex > 0) label += t(`, εκτός από ${ex}`, `, except ${ex}`);
  return label;
}

export const REACTION_EMOJI: Record<ReactionKind, string> = {
  like: '👍',
  love: '❤️',
  haha: '😂',
  wow: '😮',
  sad: '😢',
  fire: '🔥',
  clap: '👏',
  going: '🙌',
  cheers: '🎉',
  party: '🥳',
  eyes: '👀',
  hug: '🤗',
  think: '🤔',
  thanks: '🙏',
  toast: '🍻',
  star: '⭐',
  ticket: '🎟️',
  music: '🎵',
};

const REACTION_LABEL: Record<ReactionKind, [string, string]> = {
  like: ['Μου αρέσει', 'Like'],
  love: ['Τέλειο', 'Love'],
  haha: ['Χαχα', 'Haha'],
  wow: ['Ουάου', 'Wow'],
  sad: ['Λυπάμαι', 'Sad'],
  fire: ['Καίει', 'Fire'],
  clap: ['Μπράβο', 'Bravo'],
  going: ['Είμαι μέσα', "I'm in"],
  cheers: ['Πάμε!', "Let's go!"],
  party: ['Πάρτι', 'Party'],
  eyes: ['Το κοιτάω', 'Watching'],
  hug: ['Αγκαλιά', 'Hug'],
  think: ['Σκέφτομαι', 'Thinking'],
  thanks: ['Ευχαριστώ', 'Thanks'],
  toast: ['Στην υγειά', 'Cheers'],
  star: ['Αστέρι', 'Star'],
  ticket: ['Εισιτήριο', 'Ticket'],
  music: ['Μουσική', 'Music'],
};

export function reactionLabel(kind: ReactionKind, t: T): string {
  const [el, en] = REACTION_LABEL[kind];
  return t(el, en);
}

export function sectionLabel(key: ProfileSectionKey, t: T): string {
  switch (key) {
    case 'about':
      return t('Σχετικά', 'About');
    case 'interests':
      return t('Ενδιαφέροντα', 'Interests');
    case 'connections':
      return t('Λίστα Nakamas', 'Nakamas list');
    case 'events':
      return t('Εκδηλώσεις μου', 'My events');
  }
}

export function sectionHint(key: ProfileSectionKey, t: T): string {
  switch (key) {
    case 'about':
      return t('Bio, πόλη και ηλικιακό εύρος', 'Bio, city and age range');
    case 'interests':
      return t('Τα ενδιαφέροντα που βοηθούν στο ταίριασμα', 'The interests that help matching');
    case 'connections':
      return t('Ποιους έχεις στους Nakamas σου', 'Who is in your Nakamas');
    case 'events':
      return t('Σε ποιες εκδηλώσεις και ομάδες συμμετέχεις', 'Which events and groups you join');
  }
}

export function relativeTime(iso: string, language: string): string {
  try {
    return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true, locale: dateFnsLocale(language) });
  } catch {
    return '';
  }
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0]).toUpperCase();
}
