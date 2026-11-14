import { useState } from 'react';
import { Zap, Play, Pause } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { toast } from 'sonner';

const RULES = [
  { id: 'auto_flag_chat', labelEl: 'Αυτόματη σήμανση chat reports', labelEn: 'Auto-flag chat reports' },
  { id: 'auto_review_buddy', labelEl: 'Ειδοποίηση admin για Buddy Seek', labelEn: 'Notify admin on Buddy Seek flags' },
  { id: 'digest_daily', labelEl: 'Ημερήσιο digest moderation', labelEn: 'Daily moderation digest' },
];

export function AdminAutomationPanel() {
  const { t, language } = useLanguage();
  const a = usePageContrast();
  const logAdminAction = useStore((s) => s.logAdminAction);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    auto_flag_chat: true,
    auto_review_buddy: false,
    digest_daily: true,
  });
  const [running, setRunning] = useState(true);

  const toggle = (id: string) => {
    setEnabled((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      logAdminAction('automation_toggle', id, String(next[id]));
      toast.success(t('Κανόνας ενημερώθηκε', 'Rule updated'));
      return next;
    });
  };

  return (
    <Card className={cn('p-5 space-y-4', a.cardSurface)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className={cn('w-5 h-5', a.iconAccent)} />
          <h2 className={cn('text-sm font-bold', a.head)}>{t('Automation Engine', 'Automation Engine')}</h2>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setRunning((r) => !r);
            logAdminAction('automation_engine', running ? 'pause' : 'resume');
            toast.info(running ? t('Παύση engine', 'Engine paused') : t('Εκκίνηση engine', 'Engine running'));
          }}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {running ? t('Ενεργό', 'Running') : t('Παυμένο', 'Paused')}
        </Button>
      </div>
      <ul className="space-y-2">
        {RULES.map((rule) => (
          <li
            key={rule.id}
            className={cn('flex items-center justify-between gap-3 p-3 rounded-xl border', a.borderB)}
          >
            <span className={cn('text-sm font-medium', a.head)}>
              {language === 'el' ? rule.labelEl : rule.labelEn}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={enabled[rule.id]}
              onClick={() => toggle(rule.id)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                enabled[rule.id] ? 'bg-cyan-600' : 'bg-gray-300',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  enabled[rule.id] ? 'translate-x-5' : 'translate-x-0.5',
                )}
              />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
