import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Users,
  CalendarCheck,
  Bookmark,
  Inbox,
  ChevronRight,
  Plus,
  MapPin,
  Shield,
} from 'lucide-react';
import { useLanguage } from '../../../lib/i18n';
import { cn } from '../../../lib/utils';
import { PLANS_TYPO } from '../../../lib/typographyTokens';
import type { PlansFormingInsights } from '../../../hooks/usePlansFormingFeed';
import type { PlansFormingEnrichedItem } from '../../../lib/plansFormingUtils';
import type { Event } from '../../../types';

export function PlansFormingStatsBar({
  insights,
  compact,
  isDark,
}: {
  insights: PlansFormingInsights;
  compact?: boolean;
  isDark?: boolean;
}) {
  const { t } = useLanguage();
  const chips = [
    {
      icon: Users,
      value: insights.compatiblePlans,
      label: t('Σχέδια', 'Plans'),
      show: true,
    },
    {
      icon: CalendarCheck,
      value: insights.recruitingGroups,
      label: t('Ομάδες', 'Groups'),
      show: insights.recruitingGroups > 0,
    },
    {
      icon: Sparkles,
      value: insights.openSpots,
      label: t('Θέσεις', 'Spots'),
      show: insights.openSpots > 0,
    },
    {
      icon: Inbox,
      value: insights.pendingJoinsToReview,
      label: t('Αιτήματα', 'Requests'),
      show: insights.pendingJoinsToReview > 0,
    },
  ].filter((c) => c.show);

  if (chips.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-2', compact && 'gap-1.5')}>
      {chips.map(({ icon: Icon, value, label }) => (
        <div
          key={label}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border',
            PLANS_TYPO.statChip,
            isDark ? 'bg-white/5 border-white/10 text-gray-200' : 'bg-white border-gray-200 text-gray-700',
            compact && 'px-2 py-1',
          )}
        >
          <Icon className="w-3 h-3 text-cyan-500 shrink-0" aria-hidden />
          <span className="text-cyan-600 dark:text-cyan-400">{value}</span>
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
}: {
  plan: PlansFormingEnrichedItem;
  isDark?: boolean;
  onManage?: () => void;
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'rounded-2xl border p-3 space-y-2',
        isDark ? 'bg-cyan-950/40 border-cyan-700/40' : 'bg-cyan-50 border-cyan-200',
      )}
    >
      <p className={cn(PLANS_TYPO.sectionLabel, 'uppercase', isDark ? 'text-cyan-300' : 'text-cyan-700')}>
        {t('Το σχέδιό σας', 'Your plan')}
      </p>
      <p className={cn(PLANS_TYPO.cardTitle, 'truncate', isDark ? 'text-white' : 'text-gray-900')}>
        {plan.event.title}
      </p>
      <p className={cn(PLANS_TYPO.cardMeta, isDark ? 'text-gray-400' : 'text-gray-600')}>
        {t(plan.intentLabel.el, plan.intentLabel.en)} · {t(plan.schedule.el, plan.schedule.en)}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate(`/events/${plan.event.id}`)}
          className={cn(
            'flex-1 min-h-8 rounded-lg',
            PLANS_TYPO.statChip,
            isDark ? 'bg-cyan-600 text-white' : 'bg-cyan-600 text-white',
          )}
        >
          {t('Διαχείριση', 'Manage')}
        </button>
        {onManage && (
          <button
            type="button"
            onClick={onManage}
            className={cn(
              'px-3 min-h-8 rounded-lg border',
              PLANS_TYPO.statChip,
              isDark ? 'border-white/20 text-gray-200' : 'border-cyan-300 text-cyan-800',
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
    <div className="mb-2">
      <h3 className={cn('text-xs font-semibold', isDark ? 'text-gray-200' : 'text-gray-800')}>
        {title}
      </h3>
      {subtitle && (
        <p className={cn(PLANS_TYPO.statChip, 'mt-0.5', isDark ? 'text-gray-500' : 'text-gray-500')}>{subtitle}</p>
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
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'rounded-2xl border border-dashed p-5 text-center space-y-3',
        isDark ? 'border-white/15 bg-white/[0.02]' : 'border-gray-300 bg-gray-50/50',
      )}
    >
      <div
        className={cn(
          'w-12 h-12 mx-auto rounded-2xl flex items-center justify-center',
          isDark ? 'bg-cyan-900/30' : 'bg-cyan-100',
        )}
      >
        <Users className={cn('w-6 h-6', isDark ? 'text-cyan-400' : 'text-cyan-600')} />
      </div>
      <div>
        <p className={cn(PLANS_TYPO.cardTitle, isDark ? 'text-white' : 'text-gray-900')}>
          {t('Θέλετε να πάτε, αλλά όχι μόνοι/ες;', 'Want to go, but not alone?')}
        </p>
        <p className={cn(PLANS_TYPO.body, 'mt-1.5 leading-relaxed max-w-[240px] mx-auto', isDark ? 'text-gray-400' : 'text-gray-500')}>
          {t(
            'Δηλώστε πρόθεση για εκδήλωση ή μπείτε σε σχέδιο που ήδη σχηματίζεται — χωρίς δημόσια έκθεση από προεπιλογή.',
            'Declare intent for an event or join a forming plan — not public by default.',
          )}
        </p>
      </div>
      {suggestedEvent && (
        <button
          type="button"
          onClick={() => navigate(`/events/${suggestedEvent.id}`)}
          className={cn(
            'w-full text-left rounded-xl border p-3',
            isDark ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-gray-200 bg-white hover:shadow-sm',
          )}
        >
          <p className={cn(PLANS_TYPO.statChip, 'text-cyan-600')}>{t('Πρόταση για εσάς', 'Suggested for you')}</p>
          <p className={cn(PLANS_TYPO.cta, 'truncate mt-0.5', isDark ? 'text-white' : 'text-gray-900')}>
            {suggestedEvent.title}
          </p>
          <p className={cn(PLANS_TYPO.statChip, 'flex items-center gap-1 mt-1', isDark ? 'text-gray-500' : 'text-gray-500')}>
            <MapPin className="w-3 h-3" />
            {suggestedEvent.locationArea}
          </p>
        </button>
      )}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={onBrowse ?? (() => navigate('/'))}
          className={cn('w-full min-h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center gap-1', PLANS_TYPO.cta)}
        >
          {t('Ανακάλυψη εκδηλώσεων', 'Discover events')}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onCreate ?? (() => navigate('/buddy-seek'))}
          className={cn(
            'w-full min-h-10 rounded-xl border flex items-center justify-center gap-1',
            PLANS_TYPO.cta,
            isDark ? 'border-white/15 text-gray-200' : 'border-gray-300 text-gray-800',
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          {t('Δημιουργία αιτήματος', 'Create a request')}
        </button>
      </div>
      <p className={cn(PLANS_TYPO.statChip, 'flex items-center justify-center gap-1', isDark ? 'text-gray-600' : 'text-gray-400')}>
        <Shield className="w-3 h-3" />
        {t('Privacy-first · όχι dating feed', 'Privacy-first · not a dating feed')}
      </p>
    </div>
  );
}

export function PlansFormingValueHero({ isDark, insights }: { isDark?: boolean; insights: PlansFormingInsights }) {
  const { t } = useLanguage();
  const headline =
    insights.compatiblePlans > 0
      ? t(
          `${insights.compatiblePlans} συμβατά σχέδια τώρα`,
          `${insights.compatiblePlans} compatible plans right now`,
        )
      : t('Βρείτε παρέα για εκδήλωση', 'Find company for events');

  return (
    <div className="space-y-2">
      <p className={cn(PLANS_TYPO.cardTitle, 'leading-snug', isDark ? 'text-white' : 'text-gray-900')}>{headline}</p>
      <p className={cn(PLANS_TYPO.body, 'leading-relaxed', isDark ? 'text-gray-400' : 'text-gray-600')}>
        {t(
          'Άτομα & ομάδες για την ίδια εκδήλωση.',
          'People & groups for the same event.',
        )}
      </p>
    </div>
  );
}
