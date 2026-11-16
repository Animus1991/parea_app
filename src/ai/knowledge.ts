/**
 * Bilingual knowledge base for the copilot `explain` action.
 * Answers are grounded in the platform's real rules (lib/trust.ts,
 * lib/gamification.ts, Help Center FAQ) and personalised with live user data.
 */
import type { User } from '../types';
import { reliabilityBadge, tierLabelEl, tierLabelEn } from '../lib/trust';
import { hasAny } from './text';

export interface KnowledgeTopic {
  id: string;
  stems: string[];
  titleEl: string;
  titleEn: string;
  answer: (user: User | null) => { el: string; en: string };
  /** Page where the user can act on the topic. */
  path?: string;
}

export const KNOWLEDGE_TOPICS: KnowledgeTopic[] = [
  {
    id: 'reliability',
    stems: ['αξιοπιστ', 'reliability', 'σκορ', 'score', 'no-show', 'no show'],
    titleEl: 'Βαθμός Αξιοπιστίας',
    titleEn: 'Reliability Score',
    path: '/trust',
    answer: (u) => {
      const score = u?.reliabilityScore;
      const badge = typeof score === 'number' ? reliabilityBadge(score) : null;
      const mineEl = typeof score === 'number' ? ` Ο δικός σου είναι ${score}% («${badge?.el}»).` : '';
      const mineEn = typeof score === 'number' ? ` Yours is ${score}% ("${badge?.en}").` : '';
      return {
        el: `Ο Βαθμός Αξιοπιστίας (0–100) δείχνει πόσο συνεπής είσαι. Ανεβαίνει με επιβεβαιωμένη παρουσία (+3) και καλές αξιολογήσεις (+2)· πέφτει με ακύρωση τελευταίας στιγμής (−8) ή απουσία (−15). Ακύρωση έως 24 ώρες πριν δεν σε επηρεάζει.${mineEl}`,
        en: `The Reliability Score (0–100) shows how dependable you are. It rises with confirmed attendance (+3) and good ratings (+2), and drops with late cancellations (−8) or no-shows (−15). Cancelling 24h+ ahead has no penalty.${mineEn}`,
      };
    },
  },
  {
    id: 'tiers',
    stems: ['βαθμιδ', 'επιπεδο εμπιστοσυν', 'tier', 'trust level', 'επαληθευσ', 'verification'],
    titleEl: 'Βαθμίδες Εμπιστοσύνης',
    titleEn: 'Trust Tiers',
    path: '/verification',
    answer: (u) => {
      const tierEl = u ? ` Είσαι στη βαθμίδα «${tierLabelEl(u.trustTier)}».` : '';
      const tierEn = u ? ` You are currently "${tierLabelEn(u.trustTier)}".` : '';
      return {
        el: `Υπάρχουν 3 βαθμίδες: 1) Εξερευνητής — δωρεάν δημόσιες εκδηλώσεις· 2) Επιβεβαιωμένος (email + τηλέφωνο) — μικρές ομάδες 3–5 ατόμων & εκδηλώσεις με εισιτήριο· 3) Υψηλής Εμπιστοσύνης (+ ταυτότητα) — εκδρομές, ιδιωτικές συναντήσεις και διοργάνωση.${tierEl}`,
        en: `There are 3 tiers: 1) Explorer — free public events; 2) Confirmed (email + phone) — small groups of 3–5 and ticketed events; 3) High Trust (+ ID) — trips, private meetups and hosting.${tierEn}`,
      };
    },
  },
  {
    id: 'groups',
    stems: ['πωσ λειτουργουν οι ομαδ', 'ομαδεσ', 'ομαδα ', ' groups', ' group ', 'how groups work', 'σημειο συναντησ', 'meeting point'],
    titleEl: 'Πώς λειτουργούν οι ομάδες',
    titleEn: 'How groups work',
    path: '/help',
    answer: () => ({
      el: 'Διαλέγεις μια εκδήλωση και μπαίνεις σε μικρή ομάδα (συνήθως 3–6 άτομα) με κοινά ενδιαφέροντα. Όταν η ομάδα γεμίσει, ξεκλειδώνει το group chat και αποκαλύπτεται το σημείο συνάντησης — πάντα σε δημόσιο χώρο. Σε ομάδες με αρκετά μέλη ενεργοποιείται και ομαδική έκπτωση.',
      en: 'Pick an event and join a small group (usually 3–6 people) with shared interests. When the group fills up, the group chat unlocks and the meeting point is revealed — always in a public place. Larger groups can unlock a group discount.',
    }),
  },
  {
    id: 'safety',
    stems: ['ασφαλει', 'safety', 'sos', 'τοποθεσια', 'location', 'trusted contact', 'επαφη εμπιστοσυν'],
    titleEl: 'Ασφάλεια',
    titleEn: 'Safety',
    path: '/trust',
    answer: () => ({
      el: 'Εργαλεία ασφάλειας: προαιρετική, προσωρινή κοινοποίηση ζωντανής τοποθεσίας μόνο στην ομάδα, κουμπί SOS στο group chat, σύνδεσμος για επαφή εμπιστοσύνης, κατάσταση άφιξης/ETA, συναντήσεις σε δημόσιους χώρους και αναφορά χρήστη/συνομιλίας με ένα κλικ.',
      en: 'Safety tools: optional, temporary live location shared only with your group, an SOS button in group chat, a trusted-contact link, arrival status/ETA, public meeting places and one-tap reporting of users or chats.',
    }),
  },
  {
    id: 'buddy-seek',
    stems: ['βρεσ nakamas', 'σχεδια που σχηματιζ', 'plans forming', 'buddy', 'παρεα', 'company request'],
    titleEl: 'Βρες Nakamas',
    titleEn: 'Find Nakamas',
    path: '/buddy-seek',
    answer: () => ({
      el: 'Το «Βρες Nakamas» σου επιτρέπει να δηλώσεις ότι ψάχνεις παρέα για μια εκδήλωση ή να στείλεις αίτημα σε ομάδα που σχηματίζεται. Ο διοργανωτής βλέπει μόνο ό,τι επιτρέπουν οι ρυθμίσεις απορρήτου σου και αποφασίζει· αν δεχτεί, ανοίγει αυτόματα συνομιλία.',
      en: '"Find Nakamas" lets you say you are looking for company for an event, or request to join a group that is forming. The host only sees what your privacy settings allow; if they accept, a chat opens automatically.',
    }),
  },
  {
    id: 'xp',
    stems: ['xp', 'επιπεδο', 'level', 'badge', 'σημα', 'επιτευγμα', 'achievement', 'προκλησ', 'challenge'],
    titleEl: 'XP & Επίπεδα',
    titleEn: 'XP & Levels',
    path: '/achievements',
    answer: () => ({
      el: 'Κερδίζεις XP από συμμετοχές, αξιολογήσεις (+25 ανά feedback), badges και προκλήσεις (π.χ. +30 η ημερήσια). Κάθε 200 XP ανεβαίνεις επίπεδο. Δες την πρόοδό σου στα Επιτεύγματα.',
      en: 'You earn XP from attending, giving feedback (+25 each), badges and challenges (e.g. +30 for the daily one). Every 200 XP is a new level. Track it in Achievements.',
    }),
  },
  {
    id: 'privacy',
    stems: ['απορρητ', 'privacy', 'ορατοτητ', 'visibility', 'ποιοσ βλεπει', 'who can see'],
    titleEl: 'Απόρρητο',
    titleEn: 'Privacy',
    path: '/settings',
    answer: () => ({
      el: 'Ελέγχεις ποιος βλέπει το προφίλ σου (όλοι / συνδέσεις / κανείς), ποιος σου στέλνει μήνυμα, αν αποκαλύπτεται η φωτογραφία σου πριν την επιβεβαίωση και αν μοιράζεσαι τοποθεσία. Μπορώ να τα αλλάξω για σένα — π.χ. «κάνε το προφίλ μου ιδιωτικό».',
      en: 'You control who sees your profile (everyone / connections / nobody), who can message you, whether your photo is revealed before confirmation and whether you share location. I can change these for you — e.g. "make my profile private".',
    }),
  },
  {
    id: 'payments',
    stems: ['πληρωμ', 'εισιτηρι', 'κερδη', 'payment', 'ticket', 'payout', 'refund', 'επιστροφ'],
    titleEl: 'Πληρωμές',
    titleEn: 'Payments',
    path: '/wallet',
    answer: () => ({
      el: 'Οι εκδηλώσεις με εισιτήριο πληρώνονται κατά την ένταξη σε ομάδα· οι διοργανωτές βλέπουν έσοδα και αναλήψεις στο Πορτοφόλι. Ομαδικές εκπτώσεις εφαρμόζονται αυτόματα όταν η ομάδα φτάσει το ελάχιστο μέγεθος.',
      en: 'Ticketed events are paid when you join a group; hosts see earnings and payouts in the Wallet. Group discounts apply automatically once the group reaches its minimum size.',
    }),
  },
  {
    id: 'cancel',
    stems: ['ακυρω', 'cancel', 'αποχωρ', 'leave'],
    titleEl: 'Ακύρωση συμμετοχής',
    titleEn: 'Cancelling',
    path: '/plans',
    answer: () => ({
      el: 'Μπορείς να αποχωρήσεις από ομάδα από «Τα Σχέδιά μου». Έως 24 ώρες πριν δεν υπάρχει επίπτωση· αργότερη ακύρωση μειώνει τον Βαθμό Αξιοπιστίας.',
      en: 'You can leave a group from "My Plans". Up to 24h before there is no penalty; later cancellations lower your Reliability Score.',
    }),
  },
];

export function findTopic(normalizedText: string): KnowledgeTopic | null {
  let best: { topic: KnowledgeTopic; len: number } | null = null;
  for (const topic of KNOWLEDGE_TOPICS) {
    for (const stem of topic.stems) {
      if (normalizedText.includes(stem) && (!best || stem.length > best.len)) best = { topic, len: stem.length };
    }
  }
  return best?.topic ?? null;
}

export function isQuestion(normalizedText: string): boolean {
  return (
    normalizedText.includes('?') ||
    normalizedText.includes(';') ||
    hasAny(` ${normalizedText}`, [' τι ειναι', ' πωσ ', ' γιατι', ' ποιο', ' τι σημαινει', ' what ', ' how ', ' why ', ' explain', ' εξηγησ'])
  );
}
