import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { VIBE_QUESTIONS, isCompleteVibe } from '../../lib/vibe';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';
import type { VibeProfile } from '../../types/outings';

/**
 * «Το στυλ παρέας μου» (Timeleft / Pie, adapted): five optional questions.
 * The answers only feed «γιατί ταιριάζετε» and group fit; they are never a
 * hidden score and can be cleared any time.
 */
export function VibeQuizModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const me = useStore((s) => s.currentUser);
  const setVibe = useStore((s) => s.setVibe);
  const [answers, setAnswers] = useState<Partial<VibeProfile>>(() => ({ ...(me?.vibe ?? {}) }));
  const [step, setStep] = useState(0);
  const q = VIBE_QUESTIONS[step];
  const last = step === VIBE_QUESTIONS.length - 1;
  const chosen = answers[q.key];

  const finish = () => {
    const full = { ...answers, answeredAt: new Date().toISOString() };
    if (isCompleteVibe(full)) {
      setVibe(full);
      toast.success(t('Το στυλ παρέας αποθηκεύτηκε', 'Group style saved'), {
        action: {
          label: t('Βρες Nakamas', 'Find Nakamas'),
          onClick: () => navigate('/buddy-seek'),
        },
      });
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('Το στυλ παρέας μου', 'My group style')} size="md">
      <p className="text-xs font-medium text-ink-muted">
        {t(`Ερώτηση ${step + 1} από ${VIBE_QUESTIONS.length} · προαιρετικό, αλλάζει όποτε θες`, `Question ${step + 1} of ${VIBE_QUESTIONS.length} · optional, change it any time`)}
      </p>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-border" aria-hidden>
        <div className="h-full bg-accent transition-all" style={{ width: `${((step + 1) / VIBE_QUESTIONS.length) * 100}%` }} />
      </div>
      <fieldset className="mt-4">
        <legend className="text-sm font-bold text-ink">{t(q.el, q.en)}</legend>
        <div className="mt-3 grid gap-2">
          {q.options.map((o, i) => (
            <button
              key={String(o.value)}
              type="button"
              data-autofocus={i === 0 ? true : undefined}
              aria-pressed={chosen === o.value}
              onClick={() => setAnswers((a) => ({ ...a, [q.key]: o.value }))}
              className={cn(
                'min-h-8 rounded-xl border px-3 text-left text-sm font-bold',
                chosen === o.value ? 'border-transparent bg-accent text-accent-fg' : 'border-border text-ink hover:border-border-strong',
              )}
            >
              {t(o.el, o.en)}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="mt-4 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}>
          {step === 0 ? t('Αργότερα', 'Later') : t('Πίσω', 'Back')}
        </Button>
        {last ? (
          <Button size="sm" onClick={finish} disabled={!isCompleteVibe({ ...answers, answeredAt: 'x' })}>
            {t('Αποθήκευση', 'Save')}
          </Button>
        ) : (
          <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={chosen === undefined}>
            {t('Επόμενη', 'Next')}
          </Button>
        )}
      </div>
    </Modal>
  );
}
