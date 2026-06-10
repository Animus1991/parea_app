import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../lib/i18n';
import { Button } from '../common/Button';

/** Marketing hero for unauthenticated users (Login / landing). */
export function HomeGuestHero() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg mx-auto mb-8 text-center space-y-4"
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 mb-2">
        <Compass className="w-6 h-6" />
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-cyan-600">
        {t('Εξερεύνηση Δραστηριοτήτων', 'Explore Activities')}
      </p>
      <h1 className="text-2xl md:text-3xl font-black text-[#111827] leading-tight">
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
        onClick={() => navigate('/trust')}
      >
        {t('Πώς λειτουργεί το Nakamas', 'How Nakamas works')}
      </Button>
    </motion.section>
  );
}
