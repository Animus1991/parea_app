import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../../lib/i18n';
import { APP_TYPO } from '../../lib/typographyTokens';
import { cn } from '../../lib/utils';
import { Button } from '../common/Button';
import { NakamasMini } from '../illustrations/NakamasMini';

/** Marketing hero for unauthenticated users (Login / landing). */
export function HomeGuestHero() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto mb-5 text-center space-y-4"
    >
      <NakamasMini id="explorer" size={48} className="mx-auto" />
      <p className="text-xs font-semibold tracking-[0.14em] text-cyan-700">
        {t('Εξερεύνηση Δραστηριοτήτων', 'Explore Activities')}
      </p>
      <h1 className={cn(APP_TYPO.pageTitle, 'text-ink')}>
        {t('Βρείτε την επόμενη εμπειρία σας', 'Find your next experience')}
      </h1>
      <p className="text-sm text-gray-600 font-medium leading-relaxed max-w-md mx-auto">
        {t(
          'Ανακαλύψτε επιλεγμένες εκδηλώσεις που ταιριάζουν στα ενδιαφέροντά σας, συνδεθείτε με ομάδες που μοιράζονται τα ίδια πάθη και σχεδιάστε εκπληκτικές βόλτες.',
          'Discover curated events that match your interests, connect with groups who share your passions, and plan amazing outings.',
        )}
      </p>
      <Button
        variant="primary"
        className="!rounded-full"
        onClick={() => navigate('/help')}
      >
        {t('Πώς λειτουργεί το Nakamas', 'How Nakamas works')}
      </Button>
    </motion.section>
  );
}
