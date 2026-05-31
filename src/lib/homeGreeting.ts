export function getTimeGreeting(
  name: string,
  t: (gr: string, en: string) => string,
): string {
  const h = new Date().getHours();
  if (h < 12) return t(`Καλημέρα, ${name} ☀️`, `Good morning, ${name} ☀️`);
  if (h < 17) return t(`Καλό απόγευμα, ${name} 🌤️`, `Good afternoon, ${name} 🌤️`);
  return t(`Καλό βράδυ, ${name} 🌙`, `Good evening, ${name} 🌙`);
}

export function getMotivation(t: (gr: string, en: string) => string): string {
  const h = new Date().getHours();
  if (h < 9)
    return t('Νωρίς ξεκίνησε — νωρίς φτάνει!', 'Early start — great adventures await!');
  if (h < 12)
    return t(
      'Τέλεια ώρα για να ανακαλύψεις νέες εμπειρίες.',
      'Perfect time to discover new experiences.',
    );
  if (h < 17)
    return t(
      'Απογευματινή ενέργεια — κάνε την να μετράει.',
      'Afternoon energy — make it count.',
    );
  return t(
    'Βραδινή έξοδος; Οι θρύλοι βγαίνουν αργά!',
    'Evening plans? Legends go out after dark!',
  );
}

export const DAILY_TIPS_GR = [
  'Η αξιολόγησή σου μετά από μια εκδήλωση βοηθά την κοινότητα να αναπτυχθεί.',
  'Επιβεβαίωσε τη συμμετοχή σου 24 ώρες πριν για να διατηρήσεις την αξιοπιστία σου στο 100%.',
  'Μικρές ομάδες = βαθύτερες γνωριμίες. Δοκίμασε μια εκδήλωση με λιγότερα από 6 άτομα.',
  'Η επαλήθευση της ταυτότητάς σου ξεκλειδώνει προσβάσεις σε αποκλειστικές εμπειρίες.',
  'Πρότεινε μια εκδήλωση στους φίλους σου και διπλασίασε τη διασκέδαση!',
  'Συμμετοχή σε εκδηλώσεις διαφορετικών κατηγοριών αυξάνει τα XP σου ταχύτερα.',
] as const;

export const DAILY_TIPS_EN = [
  'Rating your experience after an event helps the community grow.',
  'Confirm attendance 24h before an event to keep your reliability at 100%.',
  'Small groups = deeper connections. Try an event with fewer than 6 people.',
  'Verifying your identity unlocks access to exclusive experiences.',
  'Suggest an event to your Nakamas and double the fun!',
  'Attending different event categories earns XP faster.',
] as const;
