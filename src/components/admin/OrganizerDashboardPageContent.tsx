import { useMemo, useState } from 'react';
import { TabBar } from '../common/TabBar';
import { BarChart3 } from 'lucide-react';
import {
  Calendar,
  Users,
  MessageSquare,
  Plus,
  MoreHorizontal,
  TrendingUp,
  Star,
  DollarSign,
  Activity,
  Settings,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { el as elLocale, enUS as enLocale } from 'date-fns/locale';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { useStore } from '../../store';
import { toast } from 'sonner';

const QUICK_TEMPLATES = [
  { labelEl: 'Πεζοπορία', labelEn: 'Hiking', icon: '🥾' },
  { labelEl: 'Σινεμά', labelEn: 'Cinema', icon: '🎬' },
  { labelEl: 'Stand-up', labelEn: 'Stand-up', icon: '🎤' },
  { labelEl: 'Επιτραπέζια', labelEn: 'Board Games', icon: '🎲' },
] as const;

export default function OrganizerDashboardPageContent() {
  const { t, tu, language } = useLanguage();
  const p = usePageContrast();
  const navigate = useNavigate();
  const currentUser = useStore((s) => s.currentUser);
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const cancelEvent = useStore((s) => s.cancelEvent);
  const archiveEvent = useStore((s) => s.archiveEvent);
  const publishMeetingPoint = useStore((s) => s.publishMeetingPoint);
  const sendGroupAnnouncement = useStore((s) => s.sendGroupAnnouncement);

  const myEvents = useMemo(() => {
    if (!currentUser) return [];
    const hostEventIds = new Set(
      groups.filter((g) => g.hostId === currentUser.id).map((g) => g.eventId),
    );
    return events.filter(
      (e) =>
        e.status !== 'cancelled' &&
        e.status !== 'archived' &&
        (e.organizerId === currentUser.id || hostEventIds.has(e.id)),
    );
  }, [events, groups, currentUser]);

  const liveStats = useMemo(() => {
    const active = myEvents.filter((e) => e.status !== 'archived').length;
    const eventIds = new Set(myEvents.map((e) => e.id));
    const myGroups = groups.filter((g) => eventIds.has(g.eventId) && g.status !== 'cancelled');
    const participants = myGroups.reduce((sum, g) => sum + g.members.length, 0);
    const rating = currentUser?.reliabilityScore != null
      ? (currentUser.reliabilityScore / 20).toFixed(1)
      : '—';
    const revenue = myEvents.reduce((sum, e) => {
      if (!e.isPaid) return sum;
      const filled = groups
        .filter((g) => g.eventId === e.id && g.status !== 'cancelled')
        .reduce((s, g) => s + g.members.length, 0);
      return sum + filled * (e.price || 0);
    }, 0);
    // Φ25 — fill rate & satisfaction from real groups / feedback (previously fixed 72% · 92/6/2).
    const capacity = myGroups.reduce((sum, g) => sum + g.targetSize, 0);
    const fillPct = capacity > 0 ? Math.round((participants / capacity) * 100) : 0;
    const reviews = Object.values(feedbackSubmitted).filter((f) => eventIds.has(f.eventId));
    const pct = (n: number) => (reviews.length ? Math.round((n / reviews.length) * 100) : 0);
    const positive = pct(reviews.filter((f) => f.overallRating >= 4).length);
    const negative = pct(reviews.filter((f) => f.overallRating <= 2).length);
    const neutral = reviews.length ? Math.max(0, 100 - positive - negative) : 0;
    const quote = [...reviews].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).find((f) => f.comment?.trim())?.comment ?? null;
    return { active, participants, rating, revenue, capacity, fillPct, reviews: reviews.length, positive, neutral, negative, quote };
  }, [myEvents, groups, currentUser, feedbackSubmitted]);
  const [section, setSection] = useState<'events' | 'analytics'>('events');

  /** Deterministic 7-day series scaled from live organizer counts (demo analytics, not fake constants). */
  const chartData = useMemo(() => {
    const dayNames =
      language === 'en'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : ['Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ', 'Κυρ'];
    const baseViews = Math.max(12, liveStats.participants * 14 + liveStats.active * 48);
    const baseClicks = Math.max(4, Math.round(baseViews * 0.38));
    return dayNames.map((name, i) => {
      const wave = 0.72 + 0.28 * Math.sin((i / 6) * Math.PI);
      const jitter = 0.88 + (i % 3) * 0.06;
      return {
        name,
        views: Math.round(baseViews * wave * jitter),
        clicks: Math.round(baseClicks * wave * (0.82 + (i % 2) * 0.12)),
      };
    });
  }, [liveStats.active, liveStats.participants, language]);

  const statsCards = [
    {
      labelEl: 'Ενεργές',
      labelEn: 'Active Events',
      val: String(liveStats.active),
      trendEl: t('Από το store', 'From your events'),
      trendEn: t('Από το store', 'From your events'),
      icon: Calendar,
      iconWrap: 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      trendColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      labelEl: 'Συμμετέχοντες',
      labelEn: 'Participants',
      val: String(liveStats.participants),
      trendEl: t('Σε ομάδες σας', 'Across your groups'),
      trendEn: t('Σε ομάδες σας', 'Across your groups'),
      icon: Users,
      iconWrap: 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      trendColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      labelEl: 'Αξιοπιστία',
      labelEn: 'Reliability',
      val: liveStats.rating === '—' ? '—' : `${liveStats.rating}/5`,
      trendEl: t('Βαθμός αξιοπιστίας', 'Reliability score'),
      trendEn: t('Βαθμός αξιοπιστίας', 'Reliability score'),
      icon: Star,
      iconWrap: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
      trendColor: 'text-amber-600 dark:text-amber-400',
    },
    {
      labelEl: 'Έσοδα',
      labelEn: 'Revenue',
      val: `€${liveStats.revenue}`,
      trendEl: t('Από επί πληρωμή', 'From paid events'),
      trendEn: t('Από επί πληρωμή', 'From paid events'),
      icon: DollarSign,
      iconWrap: 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800',
      iconColor: 'text-purple-600 dark:text-purple-400',
      trendColor: 'text-purple-600 dark:text-purple-400',
    },
  ] as const;

  const handleMessageGroup = (groupId: string) => {
    navigate(`/chat/${groupId}`);
  };

  const handleEditEvent = (eventId: string) => navigate(`/create?edit=${eventId}`);
  const handleTemplate = (template: string) => navigate(`/create?template=${template}`);
  const handleAnnouncement = (groupId: string) => {
    sendGroupAnnouncement(groupId, 'Νέα ανακοίνωση από τον διοργανωτή', 'New announcement from the organizer');
    toast.success(t('Η ανακοίνωση στάλθηκε στην ομάδα', 'Announcement sent to the group'));
  };
  const handleMeetingPoint = (groupId: string) => {
    publishMeetingPoint(groupId, t('Πλατεία Συντάγματος — κύρια είσοδος', 'Syntagma Square — main entrance'));
    toast.success(t('Το σημείο συνάντησης δημοσιεύτηκε', 'Meeting point published'));
  };
  const handleCancelEvent = (eventId: string) => {
    cancelEvent(eventId);
    toast.success(t('Η εκδήλωση ακυρώθηκε', 'Event cancelled'));
  };
  const handleArchiveEvent = (eventId: string) => {
    archiveEvent(eventId);
    toast.success(t('Η εκδήλωση αρχειοθετήθηκε', 'Event archived'));
  };

  const relativeWhen = (dateStr: string) => {
    try {
      const d = parseISO(dateStr);
      if (!isValid(d)) return dateStr;
      return formatDistanceToNow(d, {
        addSuffix: true,
        locale: language === 'en' ? enLocale : elLocale,
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-4 animate-in fade-in duration-500">
      <div
        className={cn(
          'relative overflow-hidden p-4 md:p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-soft border',
          p.isDark ? 'bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)]' : 'bg-gradient-to-br from-indigo-900 to-purple-900 border-indigo-800 text-white',
        )}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md shadow-soft border border-white/20">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className={cn('text-sm md:text-base font-extrabold tracking-tight', p.isDark ? p.head : 'text-white')}>
              {t('Πίνακας Διοργανωτή', 'Organizer Workspace')}
            </h1>
            <p className={cn('text-sm md:text-base font-medium mt-1', p.isDark ? p.sub : 'text-indigo-200')}>
              {t(
                'Διαχείριση εκδηλώσεων, analytics & επικοινωνία ομάδων',
                'Manage events, analytics & group communications',
              )}
            </p>
          </div>
        </div>

        <div className="relative z-10">
          <Button
            variant={p.isAB ? 'primary' : 'gradient'}
            onClick={() => navigate('/create')}
            className="w-full md:w-auto font-bold px-4 shadow-soft hover:shadow-soft-md rounded-2xl"
          >
            <Plus className="w-5 h-5 mr-1" /> {t('Νέα Εκδήλωση', 'New Event')}
          </Button>
        </div>

        {!p.isDark && (
          <>
            <div className="absolute right-0 top-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute left-1/4 bottom-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          </>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsCards.map((stat, i) => (
          <div
            key={i}
            className={cn(
              'p-5 md:p-4 rounded-2xl border shadow-soft relative overflow-hidden flex flex-col justify-between',
              p.cardSurface,
              p.borderB,
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.iconWrap)}>
                <stat.icon className={cn('w-4 h-4', stat.iconColor)} />
              </span>
              <span className={cn('text-xs font-bold uppercase tracking-widest', p.muted)}>
                {tu(stat.labelEl, stat.labelEn)}
              </span>
            </div>
            <div>
              <p className={cn('text-2xl font-black', p.head)}>{stat.val}</p>
              <p className={cn('text-xs font-bold mt-1', stat.trendColor)}>
                {stat.trendEl}
              </p>
            </div>
          </div>
        ))}
      </div>

      <TabBar
        variant="segmented"
        idBase="organizer"
        ariaLabel={t('Ενότητες διοργανωτή', 'Organizer sections')}
        activeTab={section}
        onChange={(id) => setSection(id as 'events' | 'analytics')}
        tabs={[
          { id: 'events', label: t('Εκδηλώσεις & γρήγορη δημιουργία', 'Events & quick create'), icon: Calendar, count: myEvents.length },
          { id: 'analytics', label: t('Analytics & ικανοποίηση', 'Analytics & satisfaction'), icon: BarChart3 },
        ]}
      />

      {section === 'events' && (
        <div role="tabpanel" id="organizer-panel-events" aria-labelledby="organizer-tab-events" className="space-y-5">
      <div
        className={cn(
          'p-4 rounded-2xl border shadow-soft flex flex-col md:flex-row items-center justify-between gap-4',
          p.cardSurface,
          p.borderB,
        )}
      >
        <div>
          <h3 className={cn('text-lg font-bold tracking-tight', p.head)}>
            {t('Γρήγορη Δημιουργία', 'Quick Create')}
          </h3>
          <p className={cn('text-sm font-medium mt-1', p.muted)}>
            {t(
              'Χρησιμοποιήστε έτοιμα πρότυπα για τη νέα σας εκδήλωση.',
              'Use ready-made templates for your next event.',
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {QUICK_TEMPLATES.map((tpl) => (
            <button
              key={tpl.labelEn}
              type="button"
              onClick={() => handleTemplate(tpl.labelEn.toLowerCase().replace(/\s+/g, '-'))}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-2xl border transition-all shadow-soft hover:shadow-soft-md hover:-translate-y-0.5',
                p.cardSurface,
                p.borderB,
                p.head,
              )}
            >
              <span className="text-lg">{tpl.icon}</span>
              <span className="text-xs font-bold">{t(tpl.labelEl, tpl.labelEn)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className={cn('text-xl font-extrabold tracking-tight flex items-center gap-2', p.head)}>
          <Calendar className={cn('w-5 h-5', p.iconAccent)} /> {t('Οι Εκδηλώσεις μου', 'My Events')}
        </h2>

        {myEvents.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t('Δεν έχετε ακόμα εκδηλώσεις', 'No events yet')}
            description={t(
              'Δημιουργήστε την πρώτη σας εμπειρία για να εμφανιστεί εδώ.',
              'Create your first experience to see it here.',
            )}
            actionLabel={t('Νέα Εκδήλωση', 'New Event')}
            onAction={() => navigate('/create')}
          />
        ) : (
          myEvents.map((ev) => {
            const eventGroups = groups.filter((g) => g.eventId === ev.id && g.status !== 'cancelled');
            const memberCount = eventGroups.reduce((s, g) => s + g.members.length, 0);
            const capacity = ev.maxParticipants || eventGroups.reduce((s, g) => s + g.targetSize, 0) || 0;
            const primaryGroupId = eventGroups[0]?.id;
            const actionsMode = eventGroups.length > 0 ? 'full' : 'compact';

            return (
              <div
                key={ev.id}
                className={cn('rounded-2xl p-1 shadow-soft border overflow-hidden', p.cardSurface, p.borderB)}
              >
                <div
                  className={cn(
                    'p-5 border-b flex flex-col md:flex-row md:items-center justify-between gap-4',
                    p.isDark ? 'bg-black/20 border-white/5' : 'bg-gray-50/50 border-gray-100',
                  )}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          p.isDark
                            ? 'bg-cyan-900/30 text-cyan-400 border-cyan-800'
                            : 'bg-cyan-50 text-cyan-700 border-cyan-200',
                        )}
                      >
                        {ev.category}
                      </Badge>
                      <span className={cn('text-xs font-bold flex items-center gap-1', p.muted)}>
                        <Clock className="w-3.5 h-3.5" aria-hidden /> {relativeWhen(ev.date)}
                      </span>
                    </div>
                    <h3 className={cn('text-xl font-bold tracking-tight', p.head)}>{ev.title}</h3>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={cn('text-right border-r pr-4', p.borderB)}>
                      <p className={cn('text-2xl font-black', p.head)}>
                        {memberCount}/{capacity || '—'}
                      </p>
                      <p className={cn('text-xs font-bold uppercase tracking-widest', p.muted)}>
                        {tu('Θέσεις', 'Spots')}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0 rounded-2xl" onClick={() => navigate('/settings')}>
                      <Settings className="w-4 h-4 mr-2" />
                      {t('Ρυθμίσεις', 'Settings')}
                    </Button>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-4">
                    <h4 className={cn('text-xs font-bold uppercase tracking-widest flex items-center gap-2', p.muted)}>
                      <Users className="w-4 h-4" />
                      {t('Διαχείριση Ομάδων', 'Group Management')}
                    </h4>

                    {eventGroups.length === 0 ? (
                      <p className={cn('text-sm', p.muted)}>
                        {t('Δεν υπάρχουν ακόμα ομάδες για αυτή την εκδήλωση.', 'No groups for this event yet.')}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {eventGroups.map((grp, i) => {
                          const full = grp.members.length >= grp.targetSize;
                          const spotsLeft = Math.max(0, grp.targetSize - grp.members.length);
                          return (
                            <div
                              key={grp.id}
                              className={cn(
                                'p-4 rounded-2xl border flex items-center justify-between transition-all hover:shadow-soft',
                                p.isDark
                                  ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                  : 'bg-gray-50 border-gray-200 hover:bg-white',
                              )}
                            >
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className={cn('font-bold text-sm', p.head)}>
                                    {t(`Ομάδα #${i + 1}`, `Group #${i + 1}`)}
                                  </p>
                                  <span
                                    className={cn(
                                      'text-xs font-black px-1.5 py-0.5 rounded-lg',
                                      full
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
                                    )}
                                  >
                                    {grp.members.length}/{grp.targetSize}
                                  </span>
                                </div>
                                <p className={cn('text-xs font-medium', p.muted)}>
                                  {full
                                    ? t('Επιβεβαιωμένη', 'Confirmed')
                                    : t(`Αναμένεται ${spotsLeft} ακόμα`, `Waiting for ${spotsLeft} more`)}
                                </p>
                              </div>
                              <button
                                type="button"
                                className={cn(
                                  'relative p-2 min-h-10 min-w-10 flex items-center justify-center rounded-full border shadow-soft transition-colors',
                                  p.isDark
                                    ? 'bg-gray-800 border-gray-700 text-cyan-400 hover:bg-gray-700'
                                    : 'bg-white border-gray-200 text-cyan-600 hover:bg-cyan-50',
                                )}
                                title={t('Μήνυμα ομάδας', 'Message group')}
                                aria-label={t('Μήνυμα ομάδας', 'Message group')}
                                onClick={() => handleMessageGroup(grp.id)}
                              >
                                <MessageSquare className="w-4 h-4" aria-hidden />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h4 className={cn('text-xs font-bold uppercase tracking-widest flex items-center gap-2', p.muted)}>
                      {actionsMode === 'full' ? (
                        <>
                          <TrendingUp className="w-4 h-4" />
                          {t('Ενέργειες', 'Actions')}
                        </>
                      ) : (
                        <>
                          <MoreHorizontal className="w-4 h-4" />
                          {t('Περισσότερα', 'More')}
                        </>
                      )}
                    </h4>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-between rounded-2xl" size="sm" onClick={() => handleEditEvent(ev.id)}>
                        {t('Επεξεργασία', 'Edit')}
                        <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                      </Button>
                      {actionsMode === 'full' && primaryGroupId && (
                        <>
                          <Button variant="outline" className="w-full justify-between rounded-2xl" size="sm" onClick={() => handleAnnouncement(primaryGroupId)}>
                            {t('Αποστολή Ανακοίνωσης', 'Send Announcement')}
                            <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                          </Button>
                          <Button
                            variant={p.isAB ? 'primary' : 'outline'}
                            className={cn(
                              'w-full justify-between rounded-2xl',
                              !p.isAB &&
                                'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400',
                            )}
                            size="sm"
                            onClick={() => handleMeetingPoint(primaryGroupId)}
                          >
                            {t('Δημοσίευση Τοποθεσίας', 'Publish Meeting Point')}
                            <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 mt-2 rounded-2xl"
                            size="sm"
                            onClick={() => handleCancelEvent(ev.id)}
                          >
                            {t('Ακύρωση Εκδήλωσης', 'Cancel Event')}
                          </Button>
                        </>
                      )}
                      {actionsMode === 'compact' && (
                        <Button variant="outline" className="w-full rounded-2xl" size="sm" onClick={() => handleArchiveEvent(ev.id)}>
                          {t('Αρχειοθέτηση', 'Archive')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
        </div>
      )}

      {section === 'analytics' && (
        <div role="tabpanel" id="organizer-panel-analytics" aria-labelledby="organizer-tab-analytics">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={cn('lg:col-span-2 p-4 rounded-2xl border shadow-soft', p.cardSurface, p.borderB)}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={cn('text-lg font-bold tracking-tight', p.head)}>
                {t('Επισκεψιμότητα Εκδηλώσεων', 'Event Traffic')}
              </h3>
              <p className={cn('text-xs font-medium mt-1', p.muted)}>
                {t(
                  'Εκτίμηση 7 ημερών από τις εκδηλώσεις/μέλη σας (demo analytics)',
                  '7-day estimate from your events/members (demo analytics)',
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className={cn('text-xs uppercase font-bold', p.muted)}>
                  {tu('Προβολές', 'Views')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className={cn('text-xs uppercase font-bold', p.muted)}>
                  {tu('Κλικ', 'Clicks')}
                </span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={p.isDark ? '#6366f1' : '#4f46e5'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={p.isDark ? '#6366f1' : '#4f46e5'} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={p.isDark ? '#22d3ee' : '#06b6d4'} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={p.isDark ? '#22d3ee' : '#06b6d4'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: p.isDark ? '#9ca3af' : '#6b7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: p.isDark ? '#1f2937' : '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  labelStyle={{ fontWeight: 'bold', color: 'var(--color-ink)' }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke={p.isDark ? '#6366f1' : '#4f46e5'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorViews)"
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke={p.isDark ? '#22d3ee' : '#06b6d4'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorClicks)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div
          className={cn(
            'p-4 rounded-2xl border shadow-soft flex flex-col justify-between space-y-4',
            p.cardSurface,
            p.borderB,
          )}
        >
          <div>
            <h3 className={cn('text-lg font-bold tracking-tight mb-4', p.head)}>
              {t('Συνολική Πληρότητα', 'Overall Fill Rate')}
            </h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 leading-none tabular-nums">{liveStats.fillPct}%</span>
              <span className={cn('text-xs font-bold tabular-nums', p.muted)}>
                {t(`${liveStats.participants}/${liveStats.capacity} θέσεις`, `${liveStats.participants}/${liveStats.capacity} spots`)}
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full"
                style={{ width: `${liveStats.fillPct}%` }}
              />
            </div>
          </div>

          <div>
            <h3 className={cn('text-sm font-bold uppercase tracking-wider mb-4', p.head)}>
              {tu('Ικανοποίηση Κοινού', 'Audience Satisfaction')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div
                className={cn(
                  'text-center p-3 rounded-2xl border',
                  p.isDark ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100',
                )}
              >
                <p className={cn('text-xl sm:text-2xl font-black', p.isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                  {liveStats.reviews ? `${liveStats.positive}%` : '—'}
                </p>
                <p
                  className={cn(
                    'text-xs sm:text-xs font-bold uppercase tracking-widest mt-1',
                    p.isDark ? 'text-emerald-500' : 'text-emerald-600',
                  )}
                >
                  {t('Θετικές', 'Positive')}
                </p>
              </div>
              <div
                className={cn(
                  'text-center p-3 rounded-2xl border',
                  p.isDark ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-100',
                )}
              >
                <p className={cn('text-xl sm:text-2xl font-black', p.isDark ? 'text-amber-400' : 'text-amber-700')}>
                  {liveStats.reviews ? `${liveStats.neutral}%` : '—'}
                </p>
                <p
                  className={cn(
                    'text-xs sm:text-xs font-bold uppercase tracking-widest mt-1',
                    p.isDark ? 'text-amber-500' : 'text-amber-600',
                  )}
                >
                  {t('Ουδέτερες', 'Neutral')}
                </p>
              </div>
              <div
                className={cn(
                  'text-center p-3 rounded-2xl border',
                  p.isDark ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100',
                )}
              >
                <p className={cn('text-xl sm:text-2xl font-black', p.isDark ? 'text-red-400' : 'text-red-700')}>
                  {liveStats.reviews ? `${liveStats.negative}%` : '—'}
                </p>
                <p
                  className={cn(
                    'text-xs sm:text-xs font-bold uppercase tracking-widest mt-1',
                    p.isDark ? 'text-red-500' : 'text-red-600',
                  )}
                >
                  {t('Αρνητικές', 'Negative')}
                </p>
              </div>
            </div>

            <div
              className={cn(
                'p-4 rounded-2xl border mt-4 flex items-start gap-3',
                p.isDark ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100',
              )}
            >
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
              <p className={cn('text-xs font-medium italic leading-relaxed', p.muted)}>
                {liveStats.quote
                  ? `«${liveStats.quote}»`
                  : t(
                      `Δεν υπάρχουν ακόμη σχόλια (${liveStats.reviews} αξιολογήσεις). Τα σχόλια των συμμετεχόντων θα εμφανίζονται εδώ.`,
                      `No comments yet (${liveStats.reviews} reviews). Participant comments will appear here.`,
                    )}
              </p>
            </div>
          </div>
        </div>
      </div>

        </div>
      )}
    </div>
  );
}
