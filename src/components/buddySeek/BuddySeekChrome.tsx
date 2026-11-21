import { CalendarCheck, Coffee, Plus, Shield, Sparkles } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

export type BuddySeekFilterKey =
  | 'all'
  | 'open_spots'
  | 'verified'
  | 'small_groups'
  | 'flexible'
  | 'saved_events'
  | 'high_match';

const BUDDY_SEEK_FILTERS: { key: BuddySeekFilterKey; el: string; en: string }[] = [
  { key: 'all', el: 'Όλα', en: 'All' },
  { key: 'high_match', el: 'Υψηλή συμβατότητα', en: 'High match' },
  { key: 'saved_events', el: 'Αποθηκευμένες', en: 'Saved events' },
  { key: 'flexible', el: 'Ευέλικτα', en: 'Flexible' },
  { key: 'open_spots', el: 'Ανοιχτές θέσεις', en: 'Open spots' },
  { key: 'small_groups', el: 'Μικρές ομάδες', en: 'Small groups' },
  { key: 'verified', el: 'Επαληθευμένοι', en: 'Verified' },
];

const quietChip =
  'inline-flex items-center min-h-8 px-3 text-xs font-semibold rounded-full transition-colors';

const actionTile = 'group flex w-16 shrink-0 flex-col items-center gap-1 text-center focus-visible:outline-none';
const actionIcon =
  'flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface-raised text-ink transition-colors group-hover:border-border-strong group-focus-visible:ring-2 group-focus-visible:ring-accent';
const actionLabel = 'text-xs font-semibold leading-tight text-ink-muted group-hover:text-ink';

/**
 * Page actions as one row of icons with a short label under each. The accessible
 * name starts with the visible label and adds what the short label leaves out.
 */
export function BuddySeekPageActions({
  onPrivacy,
  onNewRequest,
  onMyPlans,
  onNearbyNow,
  onVibe,
}: {
  onPrivacy: () => void;
  onNewRequest: () => void;
  onMyPlans: () => void;
  onNearbyNow: () => void;
  /** Shown only while the group-style quiz is not done. */
  onVibe?: () => void;
}) {
  const { t } = useLanguage();
  const actions: { key: string; icon: typeof Shield; label: string; name?: string; onClick: () => void; accent?: boolean }[] = [
    { key: 'privacy', icon: Shield, label: t('Απόρρητο', 'Privacy'), name: t('Απόρρητο: ρυθμίσεις', 'Privacy settings'), onClick: onPrivacy },
    { key: 'new', icon: Plus, label: t('Νέο αίτημα', 'New request'), name: t('Νέο αίτημα από εκδήλωση', 'New request from event'), onClick: onNewRequest },
    { key: 'nearby', icon: Coffee, label: t('Παρέα τώρα', 'Company now'), name: t('Παρέα τώρα: καφές ή βόλτα', 'Company now: coffee or a walk'), onClick: onNearbyNow },
    { key: 'plans', icon: CalendarCheck, label: t('Σχέδια', 'Plans'), name: t('Σχέδια: τα σχέδιά μου', 'Plans: my plans'), onClick: onMyPlans },
    ...(onVibe
      ? [{ key: 'vibe', icon: Sparkles, label: t('Στυλ παρέας', 'Group style'), name: t('Στυλ παρέας: 5 ερωτήσεις', 'Group style: 5 questions'), onClick: onVibe, accent: true }]
      : []),
  ];
  return (
    <nav aria-label={t('Ενέργειες σελίδας', 'Page actions')} className="flex gap-1.5 overflow-x-auto scrollbar-hide md:gap-3">
      {actions.map(({ key, icon: Icon, label, name, onClick, accent }) => (
        <button key={key} type="button" onClick={onClick} aria-label={name} title={name} className={actionTile}>
          <span className={cn(actionIcon, accent && 'border-accent bg-accent-soft')}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <span className={actionLabel}>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function BuddySeekFilterBar({
  filter,
  filterCounts,
  filtersOpen,
  onToggleOpen,
  onChange,
  filtersId = 'buddy-seek-filters',
}: {
  filter: BuddySeekFilterKey;
  filterCounts: Record<BuddySeekFilterKey, number>;
  filtersOpen: boolean;
  onToggleOpen: () => void;
  onChange: (key: BuddySeekFilterKey) => void;
  filtersId?: string;
}) {
  const { t } = useLanguage();
  const active = BUDDY_SEEK_FILTERS.find((item) => item.key === filter);
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
        <button
          type="button"
          aria-expanded={filtersOpen}
          aria-controls={filtersId}
          onClick={onToggleOpen}
          className={cn(quietChip, filtersOpen ? 'bg-cyan-600 text-white' : 'text-ink hover:text-ink-muted')}
        >
          {t('Φίλτρα', 'Filters')}
          {filter !== 'all' && <span className="ml-1.5 tabular-nums opacity-80">1</span>}
        </button>
        {!filtersOpen && filter !== 'all' && (
          <button
            type="button"
            onClick={() => onChange('all')}
            className={cn(quietChip, 'bg-cyan-600 text-white gap-1.5')}
            aria-label={t('Καθαρισμός φίλτρου', 'Clear filter')}
          >
            {t(active?.el ?? 'Φίλτρο', active?.en ?? 'Filter')}
            {filterCounts[filter] > 0 && <span className="tabular-nums opacity-80">{filterCounts[filter]}</span>}
          </button>
        )}
      </div>
      {filtersOpen && (
        <div id={filtersId} className="flex flex-wrap gap-x-1 gap-y-2">
          {BUDDY_SEEK_FILTERS.map(({ key, el, en }) => {
            const count = filterCounts[key];
            return (
              <button
                key={key}
                type="button"
                aria-pressed={filter === key}
                onClick={() => onChange(key === filter && key !== 'all' ? 'all' : key)}
                className={cn(
                  quietChip,
                  'gap-1.5',
                  filter === key ? 'bg-cyan-600 text-white' : 'text-ink-muted hover:text-ink',
                )}
              >
                {t(el, en)}
                {count > 0 && <span className="tabular-nums opacity-80">{count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
