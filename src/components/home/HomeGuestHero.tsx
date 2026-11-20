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
      <h1 className={cn(APP_TYPO.pageTitle, 'text-ink')}>
        {t('Βρείτε την επόμενη εμπειρία σας', 'Find your next experience')}
      </h1>
      <Button
        variant="ghost"
        size="sm"
        className="!rounded-full text-cyan-700"
        onClick={() => navigate('/help')}
      >
        {t('Πώς λειτουργεί το Nakamas', 'How Nakamas works')}
      </Button>
    </motion.section>
  );
}
