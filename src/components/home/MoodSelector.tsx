import { Sparkles } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { useHomeTheme } from '../../hooks/useHomeTheme';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { HOME_MOODS } from '../../lib/homeMoodConstants';
import { cn } from '../../lib/utils';

interface MoodSelectorProps {
  activeMood: string | null;
  onSelectMood: (moodId: string | null, categories: string[]) => void;
  className?: string;
}

export function MoodSelector({ activeMood, onSelectMood, className = '' }: MoodSelectorProps) {
  const { t } = useLanguage();
  const h = useHomeTheme();
  const tok = useThemeStyles();

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className={cn('w-4 h-4', tok.isDark ? 'text-amber-400' : 'text-amber-500')} />
        <h3 className={cn('text-sm font-bold tracking-wide', h.sectionLabel)}>
          {t('Πώς νιώθεις σήμερα;', 'How are you feeling today?')}
        </h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 noscrollbar">
        {HOME_MOODS.map((mood) => {
          const isActive = activeMood === mood.id;
          const Icon = mood.icon;
          const palette = tok.isDark ? mood.dark : mood.light;

          return (
            <button
              key={mood.id}
              type="button"
              onClick={() =>
                onSelectMood(isActive ? null : mood.id, isActive ? [] : mood.categories)
              }
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all duration-300 shrink-0 shadow-soft',
                palette,
                isActive
                  ? cn(
                      'ring-2 ring-offset-2 scale-[1.02]',
                      tok.isDark ? 'ring-offset-gray-900 ring-white' : 'ring-[#111827] ring-offset-white',
                    )
                  : 'opacity-90 hover:opacity-100 hover:scale-[1.02]',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-sm font-bold tracking-wide">
                {t(mood.labelGr, mood.labelEn)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
