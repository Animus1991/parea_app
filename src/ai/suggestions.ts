import { routeIdForPath } from './routes';

export interface CopilotSuggestion {
  el: string;
  en: string;
}

const S = (el: string, en: string): CopilotSuggestion => ({ el, en });

export const GAP_FIRST_SUGGESTIONS: CopilotSuggestion[] = [
  S('Πέμπτη μετά τις 8;', 'Thursday after 8?'),
  S('Παρασκευή βράδυ;', 'Friday evening?'),
  S('Σαββατοκύριακο;', 'This weekend?'),
  S('Όποτε — δες τι ταιριάζει', 'Whenever — show what fits'),
];

const BY_ROUTE: Record<string, CopilotSuggestion[]> = {
  home: GAP_FIRST_SUGGESTIONS,
  categories: [
    S('Βρες πεζοπορία', 'Find hiking'),
    S('Συναυλίες κάτω από 20€', 'Concerts under €20'),
    S('Πρόσθεσε σινεμά στα ενδιαφέροντα', 'Add cinema to my interests'),
  ],
  tags: [
    S('Δείξε τις Nakamas Nights', 'Show Nakamas Nights'),
    S('Ποιες ετικέτες είναι δημοφιλείς;', 'Which tags are popular?'),
    S('Βρες εκδηλώσεις με εργαστήριο', 'Find workshop events'),
  ],
  nearby: [S('Τι γίνεται στο Γκάζι;', "What's on in Gazi?"), S('Βρες εκδηλώσεις στο Κουκάκι', 'Find events in Koukaki')],
  event: [
    S('Αποθήκευσε αυτή την εκδήλωση', 'Save this event'),
    S('Πρόσθεσέ τη στο ημερολόγιο', 'Add this to my calendar'),
    S('Θέλω να μπω σε ομάδα για αυτή', 'Join a group for this'),
  ],
  agenda: [
    S('Τι έχω αυτή την εβδομάδα;', 'What do I have this week?'),
    S('Εξήγαγε το ημερολόγιό μου', 'Export my calendar'),
    S('Πρότεινέ μου κάτι για το Σάββατο', 'Suggest something for Saturday'),
  ],
  plans: [
    S('Τι έχω αυτή την εβδομάδα;', 'What do I have this week?'),
    S('Γράψε στην ομάδα ότι θα αργήσω 10 λεπτά', "Tell the group I'll be 10 minutes late"),
    S('Άνοιξε την εκκρεμή αξιολόγηση', 'Open my pending review'),
  ],
  chats: [S('Γράψε στην ομάδα ότι έφτασα', "Tell the group I've arrived"), S('Τι νέο υπάρχει;', "What's new?")],
  chat: [S('Γράψε στην ομάδα ότι έφτασα', "Tell the group I've arrived"), S('Πώς λειτουργεί η ασφάλεια;', 'How does safety work?')],
  create: [
    S('Φτιάξε εκδήλωση για σινεμά την Παρασκευή στις 21:00', 'Create a cinema night on Friday at 21:00'),
    S('Οργάνωσε πεζοπορία το Σάββατο στις 9 το πρωί για 5 άτομα', 'Organise a hike on Saturday at 9am for 5 people'),
  ],
  settings: [
    S('Βάλε σκοτεινό θέμα', 'Switch to dark mode'),
    S('Άλλαξε γλώσσα σε αγγλικά', 'Change language to Greek'),
    S('Κάνε το προφίλ μου ιδιωτικό', 'Make my profile private'),
    S('Σταμάτα τις προωθητικές ειδοποιήσεις', 'Turn off promotional notifications'),
  ],
  profile: [
    S('Πρόσθεσε πεζοπορία στα ενδιαφέροντα', 'Add hiking to my interests'),
    S('Πόσα XP έχω;', 'How much XP do I have?'),
    S('Σταμάτα την κοινοποίηση τοποθεσίας', 'Stop sharing my location'),
  ],
  trust: [
    S('Σύνοψη αξιοπιστίας και κενών', 'Summarise my trust and gaps'),
    S('Πώς ανεβαίνει η αξιοπιστία μου;', 'How does my reliability go up?'),
    S('Τι είναι οι βαθμίδες εμπιστοσύνης;', 'What are trust tiers?'),
  ],
  verification: [
    S('Σύνοψη αξιοπιστίας και κενών', 'Summarise my trust and gaps'),
    S('Ξεκίνα επαλήθευση email', 'Start email verification'),
    S('Πώς ανεβαίνει η αξιοπιστία μου;', 'How does my reliability go up?'),
  ],
  achievements: [S('Πόσα XP έχω;', 'How much XP do I have?'), S('Πώς κερδίζω XP;', 'How do I earn XP?')],
  leaderboard: [S('Πόσα XP έχω;', 'How much XP do I have?'), S('Πώς κερδίζω XP;', 'How do I earn XP?')],
  challenges: [
    S('Μπες στην πρώτη πρόκληση', 'Join the first challenge'),
    S('Πόσα XP έχω;', 'How much XP do I have?'),
    S('Πώς κερδίζω XP;', 'How do I earn XP?'),
  ],
  notifications: [S('Σημείωσε όλες ως αναγνωσμένες', 'Mark all as read'), S('Τι νέο υπάρχει στις ειδοποιήσεις;', 'Summarise my notifications')],
  help: [
    S('Πώς λειτουργούν οι ομάδες;', 'How do groups work?'),
    S('Πώς λειτουργεί η ασφάλεια;', 'How does safety work?'),
    S('Τι μπορείς να κάνεις;', 'What can you do?'),
  ],
  'buddy-seek': [
    S('Δείξε σχέδια που σχηματίζονται', 'List plans that are forming'),
    S('Πώς λειτουργεί το Βρες Nakamas;', 'How does Find Nakamas work?'),
    S('Αποδέξου το αίτημα παρέας', 'Accept the company join request'),
  ],
  'our-night': [
    S('Πού είναι το σημείο συνάντησης;', 'Where is the meeting point?'),
    S('Πώς λειτουργεί η ασφάλεια;', 'How does safety work?'),
    S('Κάλεσε φίλους στην ομάδα', 'Invite friends to the group'),
  ],
  wall: [
    S('Τι κάνουν οι φίλοι μου;', 'What are my friends up to?'),
    S('Δημοσίευσε στον τοίχο', 'Post to the wall'),
    S('Περιόρισε τις παλιές δημοσιεύσεις', 'Limit past posts'),
  ],
  connections: [S('Αποδέξου το αίτημα σύνδεσης', 'Accept the connection request'), S('Τι νέο υπάρχει;', "What's new?")],
  manage: [
    S('Φτιάξε εκδήλωση για επιτραπέζια την Πέμπτη στις 20:00', 'Create a board games night on Thursday at 20:00'),
    S('Σύνοψη πορτοφολιού', 'Summarise my wallet'),
    S('Τι έχω αυτή την εβδομάδα;', 'What do I have this week?'),
  ],
  wallet: [
    S('Σύνοψη πορτοφολιού', 'Summarise my wallet'),
    S('Άνοιξε διαχείριση πληρωμών', 'Open payout management'),
    S('Πώς λειτουργούν οι πληρωμές;', 'How do payments work?'),
  ],
  history: [
    S('Άνοιξε την εκκρεμή αξιολόγηση', 'Open my pending review'),
    S('Τι έχω ολοκληρώσει;', 'What have I completed?'),
  ],
  saved: [
    S('Τι έχω αποθηκεύσει;', 'What have I saved?'),
    S('Πρότεινέ μου κάτι νέο', 'Recommend something new'),
  ],
  feedback: [
    S('Άνοιξε την εκκρεμή αξιολόγηση', 'Open my pending review'),
    S('Πώς κερδίζω XP;', 'How do I earn XP?'),
  ],
  report: [S('Πώς λειτουργεί η ασφάλεια;', 'How does safety work?')],
};

const DEFAULTS: CopilotSuggestion[] = [
  S('Τι μπορείς να κάνεις;', 'What can you do?'),
  S('Πρότεινέ μου κάτι', 'Recommend something'),
  S('Τι έχω αυτή την εβδομάδα;', 'What do I have this week?'),
];

/** Page-aware prompt chips (always padded with general ones, max 4). */
export function suggestionsForPath(pathname: string): CopilotSuggestion[] {
  const own = BY_ROUTE[routeIdForPath(pathname)] ?? [];
  const merged = [...own];
  for (const d of DEFAULTS) if (merged.length < 4 && !merged.some((m) => m.el === d.el)) merged.push(d);
  return merged.slice(0, 4);
}
