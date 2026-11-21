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

const headerLink =
  'inline-flex items-center min-h-9 text-xs font-semibold text-ink-muted hover:text-ink transition-colors';
const quietChip =
  'inline-flex items-center min-h-8 px-3 text-xs font-semibold rounded-full transition-colors';

export function BuddySeekPageActions({
  onPrivacy,
  onNewRequest,
  onMyPlans,
  onNearbyNow,
}: {
  onPrivacy: () => void;
  onNewRequest: () => void;
  onMyPlans: () => void;
  onNearbyNow: () => void;
}) {
  const { t } = useLanguage();
  return (
    <nav aria-label={t('Ενέργειες σελίδας', 'Page actions')} className="flex flex-wrap gap-x-5 gap-y-2">
      <button type="button" onClick={onPrivacy} className={headerLink}>
        {t('Ρυθμίσεις απορρήτου', 'Privacy settings')}
      </button>
      <button type="button" onClick={onNewRequest} className={headerLink}>
        {t('Νέο αίτημα από εκδήλωση', 'New request from event')}
      </button>
      <button type="button" onClick={onNearbyNow} className={headerLink}>
        {t('Καφές ή βόλτα τώρα', 'Coffee or a walk now')}
      </button>
      <button type="button" onClick={onMyPlans} className={headerLink}>
        {t('Τα σχέδιά μου', 'My plans')}
      </button>
    </nav>
  );
}

export function BuddySeekVibeNudge({ onClick }: { onClick: () => void }) {
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left text-xs font-semibold text-ink-muted hover:text-ink"
    >
      {t(
        'Ολοκλήρωσε το στυλ παρέας (5 ερωτήσεις) →',
        'Complete your group style (5 questions) →',
      )}
    </button>
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
