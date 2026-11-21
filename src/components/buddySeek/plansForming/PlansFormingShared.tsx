import { useNavigate } from 'react-router-dom';
import {
  Users,
  CalendarCheck,
  Inbox,
  ChevronRight,
  Plus,
  MapPin,
  CircleDot,
} from 'lucide-react';
import { useLanguage } from '../../../lib/i18n';
import { cn } from '../../../lib/utils';
import { PLANS_FORMING_TYPO } from '../../../lib/typographyTokens';
import { NakamasMini } from '../../illustrations/NakamasMini';
import type { PlansFormingInsights } from '../../../hooks/usePlansFormingFeed';
import type { PlansFormingEnrichedItem } from '../../../lib/plansFormingUtils';
import type { Event } from '../../../types';
import { formatLocationArea } from '../../../lib/eventDisplay';
import { countNoun } from '../../../lib/plural';

export function PlansFormingStatsBar({
  insights,
  compact,
  isDark,
  plain,
}: {
  insights: PlansFormingInsights;
  compact?: boolean;
  isDark?: boolean;
  /** One quiet line of text («4 σχέδια · 1 ομάδα · 3 θέσεις») instead of chips. */
  plain?: boolean;
}) {
  const { t } = useLanguage();
  const chips = [
    {
      icon: Users,
      value: insights.compatiblePlans,
      label: t('Παρέες', 'Company'),
      one: t('παρέα', 'looking'),
      show: true,
    },
    {
      icon: CalendarCheck,
      value: insights.recruitingGroups,
      label: t('Ομάδες', 'Groups'),
      one: t('ομάδα', 'group'),
      show: insights.recruitingGroups > 0,
    },
    {
      icon: CircleDot,
      value: insights.openSpots,
      label: t('Θέσεις', 'Spots'),
      one: t('θέση', 'spot'),
      show: insights.openSpots > 0,
    },
    {
      icon: Inbox,
      value: insights.pendingJoinsToReview,
      label: t('Αιτήματα', 'Requests'),
      one: t('αίτημα', 'request'),
      show: insights.pendingJoinsToReview > 0,
    },
  ].filter((c) => c.show);

  if (chips.length === 0) return null;

  if (plain) {
    return (
      <p className={cn(PLANS_FORMING_TYPO.statChip, 'flex flex-wrap items-center gap-x-1.5', isDark ? 'text-gray-400' : 'text-gray-500')}>
        {chips.map(({ value, label, one }, i) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>·</span>}
            <span>
              <span className={cn('font-semibold', isDark ? 'text-gray-200' : 'text-gray-800')}>{value}</span> {value === 1 ? one : label.toLocaleLowerCase()}
            </span>
          </span>
        ))}
      </p>
    );
  }

  return (
    <div className={cn('flex flex-wrap gap-2', compact && 'gap-1.5')}>
      {chips.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2 py-1',
            PLANS_FORMING_TYPO.statChip,
            isDark ? 'bg-white/5 text-gray-200' : 'bg-white/70 text-gray-700',
            compact && 'px-1.5 py-0.5',
          )}
        >
          <Icon className="w-3 h-3 text-cyan-600/70 dark:text-cyan-400/80 shrink-0" aria-hidden />
          <span className="font-semibold text-cyan-700 dark:text-cyan-300">{value}</span>
          <span className={cn('font-medium', isDark ? 'text-gray-400' : 'text-gray-500')}>{label}</span>
        </div>
      ))}
    </div>
  );
}

export function PlansFormingYourPlanBanner({
  plan,
  isDark,
  onManage,
  onEdit,
}: {
  plan: PlansFormingEnrichedItem;
  isDark?: boolean;
  /** Opens event detail / manage surface */
  onManage?: () => void;
  /** Opens the company-request edit wizard */
  onEdit?: () => void;
}) {
  const { t, tu } = useLanguage();
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'rounded-2xl shadow-soft px-4 py-4 space-y-3',
        isDark ? 'bg-white/[0.04]' : 'bg-white',
      )}
    >
      <p className={cn(PLANS_FORMING_TYPO.sectionLabel, isDark ? 'text-cyan-300' : 'text-cyan-700')}>
        {tu('Το σχέδιό σου', 'Your plan')}
      </p>
      <p className={cn(PLANS_FORMING_TYPO.cardTitle, 'leading-snug', isDark ? 'text-white' : 'text-gray-900')}>
        {plan.event.title}
      </p>
      <p className={cn(PLANS_FORMING_TYPO.cardMeta, 'leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}>
        {t(plan.intentLabel.el, plan.intentLabel.en)} · {t(plan.schedule.el, plan.schedule.en)}
      </p>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
        <button
          type="button"
          onClick={() => (onManage ? onManage() : navigate(`/events/${plan.event.id}`))}
          className={cn(
            'px-4 min-h-9 rounded-full bg-cyan-600 text-white',
            PLANS_FORMING_TYPO.cta,
          )}
        >
          {t('Διαχείριση', 'Manage')}
        </button>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className={cn(
              'min-h-9',
              PLANS_FORMING_TYPO.cta,
              isDark ? 'text-gray-400 hover:text-white' : 'text-ink-muted hover:text-ink',
            )}
          >
            {t('Επεξεργασία', 'Edit')}
          </button>
        )}
      </div>
    </div>
  );
}

export function PlansFormingSectionTitle({
  title,
  subtitle,
  isDark,
}: {
  title: string;
  subtitle?: string;
  isDark?: boolean;
}) {
  return (
    <div className="space-y-1">
      <h3 className={cn('text-xs font-semibold tracking-wide', isDark ? 'text-gray-200' : 'text-gray-800')}>
        {title}
      </h3>
      {subtitle && (
        <p className={cn(PLANS_FORMING_TYPO.statChip, isDark ? 'text-gray-500' : 'text-gray-500')}>{subtitle}</p>
      )}
    </div>
  );
}

export function PlansFormingEmptyState({
  isDark,
  suggestedEvent,
  onBrowse,
  onCreate,
}: {
  isDark?: boolean;
  suggestedEvent?: Event | null;
  onBrowse?: () => void;
  onCreate?: () => void;
}) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed p-5 text-center space-y-3',
        isDark ? 'border-white/15 bg-white/[0.02]' : 'border-gray-300 bg-gray-50/50',
      )}
    >
      <NakamasMini id="crew" size={48} className="mx-auto" />
      <div>
        <p className={cn(PLANS_FORMING_TYPO.cardTitle, isDark ? 'text-white' : 'text-gray-900')}>
          {t('Θέλεις να πας, αλλά όχι μόνος/η;', 'Want to go, but not alone?')}
        </p>
        <p className={cn(PLANS_FORMING_TYPO.body, 'mt-1.5 leading-relaxed max-w-[240px] mx-auto', isDark ? 'text-gray-400' : 'text-gray-500')}>
          {t('Δήλωσε πρόθεση ή μπες σε σχέδιο που σχηματίζεται.', 'Declare intent or join a forming plan.')}
        </p>
      </div>
      {suggestedEvent && (
        <button
          type="button"
          onClick={() => navigate(`/events/${suggestedEvent.id}`)}
          className={cn(
            'w-full text-left rounded-xl border p-3',
            isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-white hover:shadow-soft',
          )}
        >
          <p className={cn(PLANS_FORMING_TYPO.statChip, 'text-cyan-600')}>{t('Πρόταση για εσάς', 'Suggested for you')}</p>
          <p className={cn(PLANS_FORMING_TYPO.cta, 'truncate mt-0.5', isDark ? 'text-white' : 'text-gray-900')}>
            {suggestedEvent.title}
          </p>
          <p className={cn(PLANS_FORMING_TYPO.statChip, 'flex items-center gap-1 mt-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
            <MapPin className="w-3 h-3" />
            {formatLocationArea(suggestedEvent.locationArea, language)}
          </p>
        </button>
      )}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={onBrowse ?? (() => navigate('/'))}
          className={cn('w-full min-h-8 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1', PLANS_FORMING_TYPO.cta)}
        >
          {t('Ανακάλυψη εκδηλώσεων', 'Discover events')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onCreate ?? (() => navigate('/buddy-seek'))}
          className={cn(
            'w-full min-h-8 rounded-xl border flex items-center justify-center gap-1',
            PLANS_FORMING_TYPO.cta,
            isDark ? 'border-white/15 text-gray-200' : 'border-gray-300 text-gray-800',
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('Δημιουργία αιτήματος', 'Create a request')}
        </button>
      </div>
    </div>
  );
}

export function PlansFormingValueHero({
  isDark,
  insights,
  compact,
}: {
  isDark?: boolean;
  insights: PlansFormingInsights;
  /** Rail / sheet: sit under the title as a quieter count, not a second headline. */
  compact?: boolean;
}) {
  const { t } = useLanguage();
  const headline =
    insights.compatiblePlans > 0
      ? t(
          `${countNoun(insights.compatiblePlans, 'παρέα', 'παρέες')} τώρα`,
          `${countNoun(insights.compatiblePlans, 'group', 'groups')} now`,
        )
      : t('Βρες Nakamas για εκδήλωση', 'Find Nakamas for an event');

  return (
    <p
      className={cn(
        compact ? 'text-xs font-medium leading-relaxed' : cn(PLANS_FORMING_TYPO.cardTitle, 'leading-snug'),
        compact
          ? isDark
            ? 'text-gray-400'
            : 'text-ink-muted'
          : isDark
            ? 'text-white'
            : 'text-gray-900',
      )}
    >
      {headline}
    </p>
  );
}
