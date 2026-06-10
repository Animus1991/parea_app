import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { DAILY_TIPS_GR, DAILY_TIPS_EN } from '../../lib/homeGreeting';

export function HomeDailyTip() {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const [tipIndex] = useState(() => Math.floor(Math.random() * DAILY_TIPS_GR.length));

  return (
    <div className={`rounded-2xl px-4 py-3 flex items-start gap-3 ${h.tipBanner}`}>
      <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
        <Lightbulb className="w-3.5 h-3.5 text-amber-700" />
      </div>
      <div>
        <span className={`text-xs font-bold uppercase tracking-widest block mb-0.5 ${h.tipLabel}`}>
          {t('Συμβουλή Ημέρας', 'Tip of the Day')}
        </span>
        <p className={`text-sm font-medium leading-relaxed ${h.tipBody}`}>
          {t(DAILY_TIPS_GR[tipIndex], DAILY_TIPS_EN[tipIndex])}
        </p>
      </div>
    </div>
  );
}
