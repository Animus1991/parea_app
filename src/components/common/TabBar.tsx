import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function TabBar({ tabs, activeTab, onChange, className }: TabBarProps) {
  const { t } = useLanguage();
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';

  const getActiveClass = () =>
    isDark
      ? 'border-2 border-gray-400 text-gray-100 bg-gray-700/50 rounded-full px-4 py-1.5 font-bold transition-all duration-200'
      : 'btn-pill-active';

  const getInactiveClass = () =>
    isDark
      ? 'border-2 border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5 rounded-full px-4 py-1.5 font-semibold transition-all duration-200'
      : 'btn-pill-inactive';

  const getActiveCountClass = () =>
    isDark ? 'bg-gray-500 text-white' : 'bg-gray-600 text-white';

  const getInactiveCountClass = () =>
    isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600';

  return (
    <div className={cn("flex gap-1 overflow-x-auto noscrollbar", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "whitespace-nowrap text-[13.8px]",
            activeTab === tab.id ? getActiveClass() : getInactiveClass()
          )}
        >
          {tab.label}
          {tab.count != null && tab.count > 0 && (
            <span className={cn(
              "ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[11px] font-bold px-1",
              activeTab === tab.id ? getActiveCountClass() : getInactiveCountClass()
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
