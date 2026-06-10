import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';

interface LoginExploreDemoButtonProps {
  className?: string;
  variant?: 'outline' | 'ghost';
}

/** Guest explore entry — parity across all login themes (CoFounderBay demo mode). */
export function LoginExploreDemoButton({
  className,
  variant = 'outline',
}: LoginExploreDemoButtonProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const enterDemoMode = useStore((s) => s.enterDemoMode);

  const handleExploreDemo = () => {
    enterDemoMode();
    navigate('/');
  };

  return (
    <Button
      variant={variant}
      size="lg"
      className={cn('w-full', className)}
      onClick={handleExploreDemo}
    >
      {t('Εξερεύνηση ως επισκέπτης (Demo)', 'Explore as guest (Demo)')}
    </Button>
  );
}
