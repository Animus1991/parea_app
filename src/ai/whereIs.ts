/**
 * "Where do I …?" over APP_ROUTES + Help topic aliases (CFB where-is, Nakamas).
 */
import { APP_ROUTES, type AppRoute } from './routes';
import { normalize } from './text';

export type WhereIsHit = {
  route: AppRoute;
  score: number;
  matched: string[];
  reasonEl: string;
  reasonEn: string;
};

const FILLERS = new Set([
  'where', 'which', 'what', 'how', 'do', 'does', 'can', 'i', 'my', 'the', 'a', 'an', 'to', 'in', 'on', 'of', 'for', 'is', 'find', 'go', 'get', 'see', 'open', 'page',
  'που', 'πως', 'ποια', 'ποιο', 'σε', 'στο', 'στη', 'στην', 'το', 'τη', 'την', 'τον', 'τα', 'μου', 'κανω', 'μπορω', 'βρω', 'βρισκω', 'ειναι', 'να', 'και', 'για', 'με', 'απο', 'σελιδα',
]);

/** Extra bilingual stems → route ids (Help / product synonyms). */
const ALIASES: Record<string, string[]> = {
  export: ['agenda', 'wallet'],
  download: ['agenda'],
  ics: ['agenda'],
  calendar: ['agenda'],
  ημερολογ: ['agenda'],
  εξαγωγ: ['agenda', 'wallet'],
  verify: ['verification', 'trust'],
  επαληθευ: ['verification', 'trust'],
  trust: ['trust', 'verification'],
  εμπιστοσυν: ['trust'],
  reliability: ['trust'],
  αξιοπιστ: ['trust'],
  wallet: ['wallet'],
  πορτοφολ: ['wallet'],
  payout: ['wallet'],
  πληρωμ: ['wallet'],
  feedback: ['history'],
  αξιολογ: ['history'],
  review: ['history'],
  buddy: ['buddy-seek'],
  παρεα: ['buddy-seek'],
  company: ['buddy-seek'],
  σχηματιζ: ['buddy-seek'],
  chat: ['chats'],
  μηνυμ: ['chats'],
  συνομιλ: ['chats'],
  notification: ['notifications'],
  ειδοποι: ['notifications'],
  privacy: ['settings'],
  απορρητ: ['settings'],
  theme: ['settings'],
  θεμα: ['settings'],
  language: ['settings'],
  γλωσσ: ['settings'],
  availability: ['settings'],
  διαθεσιμ: ['settings'],
  xp: ['achievements', 'challenges'],
  badge: ['achievements'],
  επιτευγμ: ['achievements'],
  προκλησ: ['challenges'],
  challenge: ['challenges'],
  help: ['help'],
  βοηθει: ['help'],
  faq: ['help'],
  groups: ['nearby', 'buddy-seek', 'help'],
  ομαδ: ['nearby', 'buddy-seek', 'help'],
  safety: ['trust', 'help', 'report'],
  ασφαλει: ['trust', 'help', 'report'],
  report: ['report'],
  αναφορα: ['report'],
  saved: ['saved'],
  αποθηκευ: ['saved'],
  create: ['create'],
  δημιουργ: ['create'],
  profile: ['profile'],
  προφιλ: ['profile'],
  connections: ['connections'],
  φιλ: ['connections'],
  nakamas: ['connections', 'buddy-seek'],
};

export function isWhereIsQuestion(normalized: string): boolean {
  const p = ` ${normalized} `;
  // Avoid relative «που» ("plans that are forming") — require location/howto stems.
  return (
    normalized.startsWith('που ') ||
    normalized.startsWith('where ') ||
    p.includes(' που βρισκ') ||
    p.includes(' που ανοιγ') ||
    p.includes(' που παω ') ||
    p.includes(' που κανω ') ||
    p.includes(' που εξαγ') ||
    p.includes(' που κατεβαζ') ||
    p.includes(' που ρυθμιζ') ||
    p.includes(' where do ') ||
    p.includes(' where can ') ||
    p.includes(' where is ') ||
    p.includes(' how do i find ') ||
    p.includes(' how do i open ') ||
    p.includes(' how do i export ') ||
    p.includes(' how do i verify ')
  );
}

function terms(normalized: string): string[] {
  return normalized
    .split(/[^a-z0-9α-ωάέήίόύώϊϋ]+/i)
    .map((w) => normalize(w))
    .filter((w) => w.length >= 2 && !FILLERS.has(w));
}

export function rankWhereIs(query: string, isAdmin: boolean, limit = 3): WhereIsHit[] {
  const n = normalize(query);
  const words = terms(n);
  const scores = new Map<string, { route: AppRoute; score: number; matched: string[] }>();

  for (const route of APP_ROUTES) {
    if (route.adminOnly && !isAdmin) continue;
    let score = 0;
    const matched: string[] = [];
    for (const stem of route.stems) {
      if (n.includes(stem)) {
        score += 4 + stem.length;
        matched.push(stem);
      }
      for (const w of words) {
        if (stem.includes(w) || w.includes(stem)) {
          score += 2;
          matched.push(w);
        }
      }
    }
    const labelN = normalize(`${route.labelEl} ${route.labelEn}`);
    for (const w of words) {
      if (labelN.includes(w)) {
        score += 3;
        matched.push(w);
      }
    }
    for (const w of words) {
      const ids = ALIASES[w];
      if (ids?.includes(route.id)) {
        score += 5;
        matched.push(w);
      }
      for (const [alias, dest] of Object.entries(ALIASES)) {
        if (w.startsWith(alias.slice(0, Math.min(5, alias.length))) && dest.includes(route.id)) {
          score += 3;
          matched.push(alias);
        }
      }
    }
    if (score > 0) scores.set(route.id, { route, score, matched: [...new Set(matched)] });
  }

  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((h) => ({
      ...h,
      reasonEl: h.matched.length ? `ταιριάζει με: ${h.matched.slice(0, 3).join(', ')}` : 'σχετική σελίδα',
      reasonEn: h.matched.length ? `matched: ${h.matched.slice(0, 3).join(', ')}` : 'related page',
    }));
}
