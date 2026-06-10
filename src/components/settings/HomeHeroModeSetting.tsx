import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useStore } from '../../store';
import { HOME_HERO_MODES } from '../../lib/homeHeroModes';
import { cn } from '../../lib/utils';

export function HomeHeroModeSetting() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const homeHeroMode = useStore((s) => s.homeHeroMode);
  const setHomeHeroMode = useStore((s) => s.setHomeHeroMode);

  return (
    <div className="space-y-3" role="group" aria-label={t('Προβολή αρχικής', 'Home layout')}>
      {HOME_HERO_MODES.map(({ id, labelKey, descKey }) => (
        <button
          key={id}
          type="button"
          onClick={() => setHomeHeroMode(id)}
          className={cn(
            'w-full flex items-start justify-between gap-3 p-4 rounded-xl border text-left transition-colors',
            homeHeroMode === id
              ? cn(a.isDark ? 'border-cyan-500/50 bg-cyan-900/20' : 'border-cyan-300 bg-cyan-50/80')
              : cn(a.borderB, a.itemHover),
          )}
        >
          <div>
            <span className={cn('text-sm font-bold block', a.head)}>
              {t(labelKey[0], labelKey[1])}
            </span>
            <span className={cn('text-xs font-medium mt-0.5 block', a.sub)}>
              {t(descKey[0], descKey[1])}
            </span>
          </div>
          {homeHeroMode === id && (
            <span
              className={cn(
                'text-xs font-bold uppercase tracking-wider shrink-0 px-2 py-1 rounded-full',
                a.isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700',
              )}
            >
              {t('Ενεργό', 'Active')}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
