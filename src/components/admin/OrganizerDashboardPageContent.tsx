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
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useStore } from '../../store';
import { toast } from 'sonner';

const CHART_DATA = [
  { name: 'Mon', views: 400, clicks: 240 },
  { name: 'Tue', views: 300, clicks: 139 },
  { name: 'Wed', views: 600, clicks: 400 },
  { name: 'Thu', views: 278, clicks: 190 },
  { name: 'Fri', views: 189, clicks: 80 },
  { name: 'Sat', views: 500, clicks: 380 },
  { name: 'Sun', views: 800, clicks: 530 },
];

const STATS = [
  {
    labelEl: 'Ενεργές',
    labelEn: 'Active Events',
    val: '3',
    trendEl: '+1',
    trendEn: '+1',
    icon: Calendar,
    iconWrap: 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-100 dark:border-cyan-800',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    trendColor: 'text-cyan-600 dark:text-cyan-400',
  },
  {
    labelEl: 'Συμμετέχοντες',
    labelEn: 'Participants',
    val: '48',
    trendEl: '+12%',
    trendEn: '+12%',
    icon: Users,
    iconWrap: 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    trendColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    labelEl: 'Βαθμολογία',
    labelEn: 'Rating',
    val: '4.8',
    trendEl: '23 αξιολογήσεις',
    trendEn: '23 reviews',
    icon: Star,
    iconWrap: 'bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800',
    iconColor: 'text-amber-600 dark:text-amber-400',
    trendColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    labelEl: 'Έσοδα',
    labelEn: 'Revenue',
    val: '€340',
    trendEl: 'Αυτόν τον μήνα',
    trendEn: 'This month',
    icon: DollarSign,
    iconWrap: 'bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800',
    iconColor: 'text-purple-600 dark:text-purple-400',
    trendColor: 'text-purple-600 dark:text-purple-400',
  },
] as const;

const QUICK_TEMPLATES = [
  { labelEl: 'Πεζοπορία', labelEn: 'Hiking', icon: '🥾' },
  { labelEl: 'Σινεμά', labelEn: 'Cinema', icon: '🎬' },
  { labelEl: 'Stand-up', labelEn: 'Stand-up', icon: '🎤' },
  { labelEl: 'Επιτραπέζια', labelEn: 'Board Games', icon: '🎲' },
] as const;

type OrganizerGroup = {
  nameEl: string;
  nameEn: string;
  statusEl: string;
  statusEn: string;
  fill: string;
  full: boolean;
  highlight?: boolean;
  hasUnread?: boolean;
};

type OrganizerEvent = {
  category: string;
  whenEl: string;
  whenEn: string;
  titleEl: string;
  titleEn: string;
  spots: string;
  groups: OrganizerGroup[];
  showSettings?: boolean;
  actions: 'full' | 'compact';
};

const ORGANIZER_EVENTS: OrganizerEvent[] = [
  {
    category: 'Stand-up',
    whenEl: 'Σε 2 μέρες',
    whenEn: 'In 2 days',
    titleEl: 'Stand-up Comedy Night',
    titleEn: 'Stand-up Comedy Night',
    spots: '12/20',
    showSettings: true,
    actions: 'full',
    groups: [
      {
        nameEl: 'Ομάδα #1',
        nameEn: 'Group #1',
        statusEl: 'Επιβεβαιωμένη',
        statusEn: 'Confirmed',
        fill: '4/4',
        full: true,
      },
      {
        nameEl: 'Ομάδα #2',
        nameEn: 'Group #2',
        statusEl: 'Αναμένεται 1 ακόμα',
        statusEn: 'Waiting for 1 more',
        fill: '3/4',
        full: false,
      },
    ],
  },
  {
    category: 'Hiking',
    whenEl: 'Σε 5 μέρες',
    whenEn: 'In 5 days',
    titleEl: 'Πεζοπορία στον Υμηττό',
    titleEn: 'Hike on Hymettus',
    spots: '6/8',
    actions: 'compact',
    groups: [
      {
        nameEl: 'Ομάδα #1',
        nameEn: 'Group #1',
        statusEl: 'Νέο μήνυμα',
        statusEn: 'New message',
        fill: '3/4',
        full: false,
        highlight: true,
        hasUnread: true,
      },
    ],
  },
];

export default function OrganizerDashboardPageContent() {
  const { t } = useLanguage();
  const p = usePageContrast();
  const navigate = useNavigate();
  const cancelEvent = useStore((s) => s.cancelEvent);
  const archiveEvent = useStore((s) => s.archiveEvent);
  const publishMeetingPoint = useStore((s) => s.publishMeetingPoint);
  const sendGroupAnnouncement = useStore((s) => s.sendGroupAnnouncement);

  const demoEventId = 'e1';
  const demoGroupId = 'g1';

  const handleMessageGroup = (groupId: string) => {
    navigate(`/chat/${groupId}`);
  };

  const handleEditEvent = () => navigate(`/create?edit=${demoEventId}`);
  const handleTemplate = (template: string) => navigate(`/create?template=${template}`);
  const handleAnnouncement = () => {
    sendGroupAnnouncement(demoGroupId, 'Νέα ανακοίνωση από τον διοργανωτή', 'New announcement from the organizer');
    toast.success(t('Η ανακοίνωση στάλθηκε στην ομάδα', 'Announcement sent to the group'));
  };
  const handleMeetingPoint = () => {
    publishMeetingPoint(demoGroupId, t('Πλατεία Συντάγματος — κύρια είσοδος', 'Syntagma Square — main entrance'));
    toast.success(t('Το σημείο συνάντησης δημοσιεύτηκε', 'Meeting point published'));
  };
  const handleCancelEvent = () => {
    cancelEvent(demoEventId);
    toast.success(t('Η εκδήλωση ακυρώθηκε (demo)', 'Event cancelled (demo)'));
  };
  const handleArchiveEvent = () => {
    archiveEvent(demoEventId);
    toast.success(t('Η εκδήλωση αρχειοθετήθηκε (demo)', 'Event archived (demo)'));
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12 animate-in fade-in duration-500">
      <div
        className={cn(
          'relative overflow-hidden p-6 md:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-soft border',
          p.isDark ? 'bg-[hsl(220_16%_16%)] border-[hsl(220_13%_22%)]' : 'bg-gradient-to-br from-indigo-900 to-purple-900 border-indigo-800 text-white',
        )}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md shadow-soft border border-white/20">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className={cn('text-2xl md:text-3xl font-extrabold tracking-tight', p.isDark ? p.head : 'text-white')}>
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
            className="w-full md:w-auto font-bold px-6 shadow-soft hover:shadow-soft-md rounded-2xl"
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
        {STATS.map((stat, i) => (
          <div
            key={i}
            className={cn(
              'p-5 md:p-6 rounded-2xl border shadow-soft relative overflow-hidden flex flex-col justify-between',
              p.cardSurface,
              p.borderB,
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <span className={cn('w-8 h-8 rounded-lg flex items-center justify-center', stat.iconWrap)}>
                <stat.icon className={cn('w-4 h-4', stat.iconColor)} />
              </span>
              <span className={cn('text-[10px] font-bold uppercase tracking-widest', p.muted)}>
                {t(stat.labelEl, stat.labelEn)}
              </span>
            </div>
            <div>
              <p className={cn('text-3xl font-black', p.head)}>{stat.val}</p>
              <p className={cn('text-[11px] font-bold mt-1', stat.trendColor)}>
                {t(stat.trendEl, stat.trendEn)}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={cn('lg:col-span-2 p-6 rounded-2xl border shadow-soft', p.cardSurface, p.borderB)}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className={cn('text-lg font-bold tracking-tight', p.head)}>
                {t('Επισκεψιμότητα Εκδηλώσεων', 'Event Traffic')}
              </h3>
              <p className={cn('text-xs font-medium mt-1', p.muted)}>
                {t(
                  'Προβολές και κλικ στις ενεργές σας εκδηλώσεις (Τελ. 7 ημέρες)',
                  'Views and clicks on your active events (Last 7 days)',
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className={cn('text-[10px] uppercase font-bold', p.muted)}>
                  {t('Προβολές', 'Views')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className={cn('text-[10px] uppercase font-bold', p.muted)}>
                  {t('Κλικ', 'Clicks')}
                </span>
              </div>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                  labelStyle={{ fontWeight: 'bold', color: p.isDark ? '#f3f4f6' : '#111827' }}
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
            'p-6 rounded-2xl border shadow-soft flex flex-col justify-between space-y-6',
            p.cardSurface,
            p.borderB,
          )}
        >
          <div>
            <h3 className={cn('text-lg font-bold tracking-tight mb-4', p.head)}>
              {t('Συνολική Πληρότητα', 'Overall Fill Rate')}
            </h3>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-black text-cyan-600 dark:text-cyan-400 leading-none">72%</span>
              <span className={cn('text-xs font-bold', p.muted)}>
                {t('18/25 θέσεις', '18/25 spots')}
              </span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-full rounded-full"
                style={{ width: '72%' }}
              />
            </div>
          </div>

          <div>
            <h3 className={cn('text-sm font-bold uppercase tracking-wider mb-4', p.head)}>
              {t('Ικανοποίηση Κοινού', 'Audience Satisfaction')}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div
                className={cn(
                  'text-center p-3 rounded-2xl border',
                  p.isDark ? 'bg-emerald-900/10 border-emerald-900/30' : 'bg-emerald-50 border-emerald-100',
                )}
              >
                <p className={cn('text-xl sm:text-2xl font-black', p.isDark ? 'text-emerald-400' : 'text-emerald-700')}>
                  92%
                </p>
                <p
                  className={cn(
                    'text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1',
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
                  6%
                </p>
                <p
                  className={cn(
                    'text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1',
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
                  2%
                </p>
                <p
                  className={cn(
                    'text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1',
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
                {t(
                  '«Εξαιρετική οργάνωση, ο οικοδεσπότης ήταν φοβερός και περάσαμε τέλεια!»',
                  '"Excellent organization, the host was amazing and we had a great time!"',
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'p-6 rounded-2xl border shadow-soft flex flex-col md:flex-row items-center justify-between gap-6',
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

        {ORGANIZER_EVENTS.map((ev) => (
          <div
            key={ev.titleEn}
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
                    <Clock className="w-3.5 h-3.5" /> {t(ev.whenEl, ev.whenEn)}
                  </span>
                </div>
                <h3 className={cn('text-xl font-bold tracking-tight', p.head)}>
                  {t(ev.titleEl, ev.titleEn)}
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <div className={cn('text-right border-r pr-4', p.borderB)}>
                  <p className={cn('text-2xl font-black', p.head)}>{ev.spots}</p>
                  <p className={cn('text-[10px] font-bold uppercase tracking-widest', p.muted)}>
                    {t('Θέσεις', 'Spots')}
                  </p>
                </div>
                {ev.showSettings && (
                  <Button variant="outline" size="sm" className="shrink-0 rounded-2xl" onClick={() => navigate('/settings')}>
                    <Settings className="w-4 h-4 mr-2" />
                    {t('Ρυθμίσεις', 'Settings')}
                  </Button>
                )}
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <h4 className={cn('text-xs font-bold uppercase tracking-widest flex items-center gap-2', p.muted)}>
                  <Users className="w-4 h-4" />
                  {t('Διαχείριση Ομάδων', 'Group Management')}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ev.groups.map((grp, i) => (
                    <div
                      key={i}
                      className={cn(
                        'p-4 rounded-2xl border flex items-center justify-between transition-all hover:shadow-soft',
                        grp.highlight
                          ? p.isDark
                            ? 'bg-cyan-900/20 border-cyan-800'
                            : 'bg-cyan-50 border-cyan-100'
                          : p.isDark
                            ? 'bg-white/5 border-white/10 hover:bg-white/10'
                            : 'bg-gray-50 border-gray-200 hover:bg-white',
                      )}
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className={cn('font-bold text-sm', p.head)}>
                            {t(grp.nameEl, grp.nameEn)}
                          </p>
                          <span
                            className={cn(
                              'text-[10px] font-black px-1.5 py-0.5 rounded-md',
                              grp.full
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
                            )}
                          >
                            {grp.fill}
                          </span>
                        </div>
                        <p className={cn('text-xs font-medium', p.muted)}>
                          {t(grp.statusEl, grp.statusEn)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={cn(
                          'relative p-2 rounded-full border shadow-soft transition-colors',
                          p.isDark
                            ? 'bg-gray-800 border-gray-700 text-cyan-400 hover:bg-gray-700'
                            : 'bg-white border-gray-200 text-cyan-600 hover:bg-cyan-50',
                        )}
                        title={t('Μήνυμα ομάδας', 'Message group')}
                        aria-label={t('Μήνυμα ομάδας', 'Message group')}
                        onClick={() => handleMessageGroup(demoGroupId)}
                      >
                        <MessageSquare className="w-4 h-4" />
                        {grp.hasUnread && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className={cn('text-xs font-bold uppercase tracking-widest flex items-center gap-2', p.muted)}>
                  {ev.actions === 'full' ? (
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
                  <Button variant="outline" className="w-full justify-between rounded-2xl" size="sm" onClick={handleEditEvent}>
                    {t('Επεξεργασία', 'Edit')}
                    <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                  </Button>
                  {ev.actions === 'full' && (
                    <>
                      <Button variant="outline" className="w-full justify-between rounded-2xl" size="sm" onClick={handleAnnouncement}>
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
                        onClick={handleMeetingPoint}
                      >
                        {t('Δημοσίευση Τοποθεσίας', 'Publish Meeting Point')}
                        <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20 mt-2 rounded-2xl"
                        size="sm"
                        onClick={handleCancelEvent}
                      >
                        {t('Ακύρωση Εκδήλωσης', 'Cancel Event')}
                      </Button>
                    </>
                  )}
                  {ev.actions === 'compact' && (
                    <Button variant="outline" className="w-full rounded-2xl" size="sm" onClick={handleArchiveEvent}>
                      {t('Αρχειοθέτηση', 'Archive')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
