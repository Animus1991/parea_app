import type { Event, User } from '../types';
import { computeMatchScore } from './matching';

export interface MatchExplanation {
  score: number;
  sharedStrengths: string[];
  mismatchFlags: string[];
  dimensions: {
    tags: number;
    category: number;
    trust: number;
  };
}

function tPair(el: string, en: string, lang: 'el' | 'en'): string {
  return lang === 'el' ? el : en;
}

export function explainEventMatch(
  user: User,
  event: Event,
  lang: 'el' | 'en' = 'el',
): MatchExplanation {
  const tags = event.tags ?? [];
  const interests = user.interests ?? [];
  const overlap = tags.filter((tag) =>
    interests.some((i) => i.toLowerCase() === tag.toLowerCase()),
  );

  const tagScore = tags.length
    ? Math.round((overlap.length / tags.length) * 55)
    : 0;
  const categoryBonus = interests.some((i) =>
    event.category.toLowerCase().includes(i.toLowerCase()),
  )
    ? 15
    : 0;
  const tierBonus =
    user.trustTier === '3_high_trust' ? 10 : user.trustTier === '2_confirmed' ? 5 : 0;

  const score = computeMatchScore(user, event);
  const sharedStrengths: string[] = [];
  const mismatchFlags: string[] = [];

  if (overlap.length > 0) {
    sharedStrengths.push(
      tPair(
        `${overlap.length} κοινά ενδιαφέροντα (${overlap.slice(0, 2).join(', ')})`,
        `${overlap.length} shared interests (${overlap.slice(0, 2).join(', ')})`,
        lang,
      ),
    );
  }
  if (categoryBonus > 0) {
    sharedStrengths.push(
      tPair(`Ταιριάζει στην κατηγορία ${event.category}`, `Fits ${event.category} category`, lang),
    );
  }
  if (tierBonus > 0) {
    sharedStrengths.push(
      tPair('Υψηλό επίπεδο εμπιστοσύνης', 'Strong trust tier', lang),
    );
  }
  if (overlap.length === 0 && tags.length > 0) {
    mismatchFlags.push(
      tPair('Λίγα κοινά tags — δοκίμασε άλλες κατηγορίες', 'Few shared tags — try other categories', lang),
    );
  }
  if (user.trustTier === '1_explorer') {
    mismatchFlags.push(
      tPair('Επίπεδο explorer — ορισμένες ομάδες απαιτούν επιβεβαίωση', 'Explorer tier — some groups need verification', lang),
    );
  }

  return {
    score,
    sharedStrengths,
    mismatchFlags,
    dimensions: { tags: tagScore, category: categoryBonus, trust: tierBonus },
  };
}

export function formatExplainChips(explanation: MatchExplanation, lang: 'el' | 'en'): string[] {
  const chips: string[] = [`${explanation.score}%`];
  for (const s of explanation.sharedStrengths.slice(0, 2)) chips.push(s);
  for (const m of explanation.mismatchFlags.slice(0, 1)) chips.push(m);
  return chips;
}
