export function getTimeGreeting(
  name: string,
  t: (gr: string, en: string) => string,
): string {
  const h = new Date().getHours();
  if (h < 12) return t(`Καλημέρα, ${name}`, `Good morning, ${name}`);
  if (h < 17) return t(`Καλό απόγευμα, ${name}`, `Good afternoon, ${name}`);
  return t(`Καλό βράδυ, ${name}`, `Good evening, ${name}`);
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
