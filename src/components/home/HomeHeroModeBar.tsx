import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useStore } from '../../store';
import { HOME_HERO_MODES } from '../../lib/homeHeroModes';
import { cn } from '../../lib/utils';

export function HomeHeroModeBar({ className }: { className?: string }) {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const homeHeroMode = useStore((s) => s.homeHeroMode);
  const setHomeHeroMode = useStore((s) => s.setHomeHeroMode);

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      <span className={cn('text-xs font-bold uppercase tracking-widest', h.sectionLabel)}>
        {t('Προβολή αρχικής', 'Home layout')}
      </span>
      <div
        className="flex p-0.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm"
        role="group"
        aria-label={t('Επιλογή πυκνότητας hero', 'Hero density')}
      >
        {HOME_HERO_MODES.map(({ id, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => setHomeHeroMode(id)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-bold transition-all',
              homeHeroMode === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-white/90 hover:bg-white/15',
            )}
          >
            {t(labelKey[0], labelKey[1])}
          </button>
        ))}
      </div>
    </div>
  );
}
