import { useMemo, useState } from 'react';
import { Card } from '../common/Card';
import { AlertCircle, ShieldAlert, Flag, Search, TrendingUp, Activity, Users as UsersIcon, Settings2, Ban, RotateCcw, Wand2, Palette, KeyRound, ShieldCheck } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO, startOfWeek } from 'date-fns';
import { TabBar } from '../common/TabBar';
import { AdminWallModeration } from './AdminWallModeration';
import { AdminOutingsPanel } from './AdminOutingsPanel';
import { outingMetrics } from '../../lib/outings';
import { tierLabelEl, tierLabelEn } from '../../lib/trust';
import type { AdminSafeguards } from '../../store';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { CompanyRequestModerationPanel } from '../buddySeek/CompanyRequestModerationPanel';
import { ChatModerationPanel } from '../chat/ChatModerationPanel';
import { AdminAutomationPanel } from './AdminAutomationPanel';
import { AdminBrandingPanel } from './AdminBrandingPanel';
import { AdminSSOPanel } from './AdminSSOPanel';
import { toast } from 'sonner';
import { useAiAuditStore, type AiAuditStatus } from '../../store/aiAuditStore';
import { intlLocale } from '../../lib/dateLocale';
import { APP_TYPO } from '../../lib/typographyTokens';
import { AppSelect } from '../common/AppSelect';
import { PhotoOrInitials } from '../common/PhotoOrInitials';
import { formatLocationArea, locationMatchesQuery } from '../../lib/eventDisplay';

type AdminTab = 'overview' | 'moderation' | 'users' | 'system' | 'automation' | 'branding' | 'sso';

export default function AdminDashboardPageContent() {
  const { t, language } = useLanguage();
  const a = usePageContrast();
  const users = useStore((s) => s.users);
  const currentUserId = useStore((s) => s.currentUser?.id);
  const events = useStore((s) => s.events);
  const issueReports = useStore((s) => s.issueReports);
  const resolveIssueReport = useStore((s) => s.resolveIssueReport);
  const logAdminAction = useStore((s) => s.logAdminAction);

  const [adminTab, setAdminTab] = useState<AdminTab>('overview');
  const groups = useStore((s) => s.groups);
  const adminActions = useStore((s) => s.adminActions);
  const aiAudit = useAiAuditStore((s) => s.entries);
  const suspendedUserIds = useStore((s) => s.suspendedUserIds);
  const toggleUserSuspended = useStore((s) => s.toggleUserSuspended);
  const safeguards = useStore((s) => s.adminSafeguards);
  const setAdminSafeguard = useStore((s) => s.setAdminSafeguard);
  const [userQuery, setUserQuery] = useState('');
  const feedbackSubmitted = useStore((s) => s.feedbackSubmitted);
  const strikes = useStore((s) => s.strikes);
  const verifiedActive = useMemo(() => outingMetrics(groups, users, strikes).verifiedActive, [groups, users, strikes]);
  /** Φ25 — no-show rate from attendance answers in reviews (was a fixed 4.2%). */
  const noShowPct = useMemo(() => {
    const answers = Object.values(feedbackSubmitted).filter((f) => f.attendance);
    if (answers.length === 0) return null;
    const missed = answers.filter((f) => f.attendance === 'no_show' || f.attendance === 'late_cancel').length;
    return Math.round((missed / answers.length) * 1000) / 10;
  }, [feedbackSubmitted]);
  const [chartRange, setChartRange] = useState<'8w' | 'all'>('8w');
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  /** Real activity: events & participants per week across the catalogue. */
  const activity = useMemo(() => {
    const buckets = new Map<string, { week: string; events: number; participants: number }>();
    for (const e of events) {
      let monday: Date;
      try {
        monday = startOfWeek(parseISO(e.date), { weekStartsOn: 1 });
      } catch {
        continue;
      }
      const key = format(monday, 'yyyy-MM-dd');
      const b = buckets.get(key) ?? { week: format(monday, 'd/M'), events: 0, participants: 0 };
      b.events += 1;
      b.participants += groups.filter((g) => g.eventId === e.id).reduce((n, g) => n + g.members.length, 0);
      buckets.set(key, b);
    }
    const sorted = [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
    return chartRange === '8w' ? sorted.slice(-8) : sorted;
  }, [events, groups, chartRange]);

  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q) ||
        locationMatchesQuery(u.city, q, language),
    );
  }, [language, users, userQuery]);

  const SAFEGUARDS: { key: keyof AdminSafeguards; title: string; desc: string }[] = [
    {
      key: 'autoSuspendNoShow',
      title: t('Αυτόματη αναστολή (3+ no-shows)', 'Auto-suspend (3+ no-shows)'),
      desc: t('Προσωρινός περιορισμός συμμετοχής μετά από επαναλαμβανόμενες αδικαιολόγητες απουσίες.', 'Temporarily restrict joining after repeated unexplained no-shows.'),
    },
    {
      key: 'requireIdForOrganizers',
      title: t('Ταυτότητα για διοργανωτές', 'Require ID for organizers'),
      desc: t('Επαλήθευση ταυτότητας πριν τη δημοσίευση εκδηλώσεων επί πληρωμή.', 'Verify identity before publishing paid experiences.'),
    },
    {
      key: 'strictAntiSpam',
      title: t('Αυστηρό φίλτρο spam', 'Strict anti-spam shield'),
      desc: t('Φιλτράρει ύποπτους συνδέσμους και μαζικά μηνύματα στις ομαδικές συνομιλίες.', 'Filters suspicious links and bulk messages in group chats.'),
    },
    {
      key: 'maintenanceMode',
      title: t('Λειτουργία συντήρησης', 'Maintenance mode'),
      desc: t('Εμφανίζει σε όλους τους χρήστες ειδοποίηση συντήρησης κατά τις αναβαθμίσεις.', 'Shows every user a maintenance notice during upgrades.'),
    },
  ];
  const [searchUser, setSearchUser] = useState('');
  const [adminAction, setAdminAction] = useState('warning');
  const [adminNote, setAdminNote] = useState('');

  const pendingReports = useMemo(
    () => issueReports.filter((r) => r.status === 'open' || r.status === 'reviewing'),
    [issueReports],
  );
  const resolvedCount = issueReports.filter((r) => r.status === 'resolved').length;
  const avgReliability = useMemo(() => {
    if (users.length === 0) return 0;
    return Math.round(users.reduce((sum, u) => sum + (u.reliabilityScore ?? 50), 0) / users.length);
  }, [users]);
  const verifiedPct = useMemo(() => {
    if (users.length === 0) return 0;
    return Math.round((users.filter((u) => u.emailVerified && u.phoneVerified).length / users.length) * 100);
  }, [users]);

  const handleReview = (reportId: string) => {
    resolveIssueReport(reportId, 'reviewing');
    logAdminAction('review_report', reportId);
    toast.success(t('Η αναφορά μπήκε σε εξέταση', 'Report marked for review'));
  };

  const handleBanFromReport = (reportId: string) => {
    resolveIssueReport(reportId, 'resolved');
    logAdminAction('ban_from_report', reportId, adminNote || undefined);
    toast.success(t('Εφαρμόστηκε αποκλεισμός (demo)', 'Ban applied (demo)'));
  };

  const handleSuspendDemo = () => {
    logAdminAction('suspend_user', searchUser || 'demo_user', adminNote || undefined);
    toast.success(t('Εφαρμόστηκε αναστολή (demo)', 'Suspension applied (demo)'));
  };

  const handleApplyQuickAction = () => {
    if (!searchUser.trim()) {
      toast.error(t('Γράψε email ή ID χρήστη', 'Enter a user email or ID'));
      return;
    }
    logAdminAction(adminAction, searchUser.trim(), adminNote.trim() || undefined);
    toast.success(t('Η ενέργεια καταγράφηκε (demo)', 'Action logged (demo)'));
    setAdminNote('');
  };

  const displayReports = pendingReports.length > 0
    ? pendingReports.slice(0, 5)
    : issueReports.slice(0, 2);

  return (
    <div className="mx-auto max-w-full space-y-4 pb-4 animate-in fade-in duration-500">
      <div className={cn('p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4', a.cardSurface, a.borderB)}>
        <div className="flex items-center gap-4">
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0', a.isDark ? 'bg-red-950/30 border-red-900/50' : 'bg-red-50 border-red-200')}>
            <ShieldAlert className={cn('w-6 h-6', a.isDark ? 'text-red-400' : 'text-red-600')} aria-hidden />
          </div>
          <div>
            <h1 className={cn(APP_TYPO.pageTitle, a.isDark ? 'text-red-400' : 'text-red-700')}>
              {t('Πίνακας διαχείρισης', 'Admin Dashboard')}
            </h1>
            <p className={cn('mt-0.5 text-sm font-medium', a.sub)}>
              {t('Εποπτεία πλατφόρμας & μετριασμός', 'Platform oversight & moderation')}
            </p>
          </div>
        </div>
        <div role="status" className={cn('flex items-center gap-2 px-4 py-2.5 rounded-xl border', a.borderB)}>
          <span className={cn('inline-flex h-2 w-2 rounded-full', safeguards.maintenanceMode ? 'bg-amber-500' : 'bg-emerald-500')} aria-hidden />
          <span className={cn('text-sm font-bold', safeguards.maintenanceMode ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400')}>
            {safeguards.maintenanceMode ? t('Λειτουργία συντήρησης ενεργή', 'Maintenance mode active') : t('Όλα τα συστήματα λειτουργούν', 'All systems operational')}
          </span>
        </div>
      </div>

      <TabBar
        variant="segmented"
        idBase="admin"
        ariaLabel={t('Ενότητες διαχείρισης', 'Admin sections')}
        activeTab={adminTab}
        onChange={(id) => setAdminTab(id as AdminTab)}
        tabs={[
          { id: 'overview', label: t('Γενική εικόνα', 'Overview'), icon: Activity },
          { id: 'moderation', label: t('Μετριασμός', 'Moderation'), icon: Flag, count: pendingReports.length },
          { id: 'users', label: t('Χρήστες', 'Users'), icon: UsersIcon, count: suspendedUserIds.length },
          { id: 'system', label: t('Σύστημα', 'System'), icon: Settings2 },
          { id: 'automation', label: 'Automation', icon: Wand2 },
          { id: 'branding', label: 'Branding', icon: Palette },
          { id: 'sso', label: 'SSO', icon: KeyRound },
        ]}
      />

      <div role="tabpanel" id={`admin-panel-${adminTab}`} aria-labelledby={`admin-tab-${adminTab}`} className="space-y-4">
      {adminTab === 'automation' && <AdminAutomationPanel />}
      {adminTab === 'branding' && <AdminBrandingPanel />}
      {adminTab === 'sso' && <AdminSSOPanel />}

      {adminTab === 'overview' && (
      <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={cn('p-4 border-t-4 border-t-blue-500', a.cardSurface)}>
          {/* Φ27 — «active» counts verified people in a live group, not accounts. */}
          <h3 className={cn('text-xs font-bold tracking-wider', a.muted)}>{t('Ενεργοί (επαληθευμένοι)', 'Active (verified)')}</h3>
          <p className={cn('text-sm md:text-base font-bold mt-1', a.head)}>{verifiedActive}</p>
          <p className="text-xs text-green-700 dark:text-green-400 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-2.5 h-2.5" />
            {t(`από ${users.length} λογαριασμούς`, `of ${users.length} accounts`)}
          </p>
        </Card>
        <Card className={cn('p-4 border-t-4 border-t-cyan-500', a.cardSurface)}>
          <h3 className={cn('text-xs font-bold tracking-wider', a.muted)}>{t('Αναφορές', 'Reports')}</h3>
          <p className={cn('text-sm md:text-base font-bold mt-1', a.head)}>{pendingReports.length}</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">{t('εκκρεμείς', 'pending')}</p>
        </Card>
        <Card className={cn('p-4 border-t-4 border-t-red-500', a.cardSurface)}>
          <h3 className={cn('text-xs font-bold tracking-wider', a.muted)}>{t('Επιλύθηκαν', 'Resolved')}</h3>
          <p className={cn('text-sm md:text-base font-bold mt-1', a.head)}>{resolvedCount}</p>
          <p className={cn('text-xs font-medium', a.muted)}>{t('συνολικά', 'total')}</p>
        </Card>
        <Card className={cn('p-4 border-t-4 border-t-emerald-500', a.cardSurface)}>
          <h3 className={cn('text-xs font-bold tracking-wider', a.muted)}>{t('Εκδηλώσεις', 'Events')}</h3>
          <p className={cn('text-sm md:text-base font-bold mt-1', a.head)}>{events.length}</p>
          <p className={cn('text-xs font-medium', a.muted)}>{t('στη βάση', 'in catalog')}</p>
        </Card>
      </div>

      <AdminOutingsPanel section="metrics" />

      <Card className={cn('p-4', a.cardSurface)}>
        <h3 className={cn('text-xs font-bold tracking-widest mb-3', a.head)}>{t('Υγεία πλατφόρμας', 'Platform Health')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-xs font-medium', a.muted)}>{t('Μ.Ο. Αξιοπιστία', 'Avg Reliability')}</span>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{avgReliability}%</span>
            </div>
            <div className={cn('w-full h-1.5 rounded-full', a.progressBg)}>
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${avgReliability}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-xs font-medium', a.muted)}>{t('No-show rate', 'No-show rate')}</span>
              <span className="text-sm font-bold text-amber-600 tabular-nums">{noShowPct === null ? '—' : `${noShowPct}%`}</span>
            </div>
            <div className={cn('w-full h-1.5 rounded-full', a.progressBg)}>
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${noShowPct ?? 0}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-xs font-medium', a.muted)}>{t('Επαληθευμένοι', 'Verified')}</span>
              <span className="text-sm font-bold text-cyan-600">{verifiedPct}%</span>
            </div>
            <div className={cn('w-full h-1.5 rounded-full', a.progressBg)}>
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${verifiedPct}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <Card className={cn('p-5', a.cardSurface)}>
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className={cn('text-sm font-bold', a.head)}>{t('Εκδηλώσεις & συμμετοχές ανά εβδομάδα', 'Events & participants per week')}</h2>
          <label className="sr-only" htmlFor="admin-chart-range">{t('Εύρος', 'Range')}</label>
          <AppSelect
            id="admin-chart-range"
            ariaLabel={t('Εύρος', 'Range')}
            value={chartRange}
            onValueChange={(v) => setChartRange(v as '8w' | 'all')}
            className={cn('filter-select border outline-none', a.inputBg)}
            options={[
              { value: '8w', label: t('Τελευταίες 8 εβδομάδες', 'Last 8 weeks') },
              { value: 'all', label: t('Όλο το διάστημα', 'All time') },
            ]}
          />
        </div>
        <div className="h-56 w-full" role="img" aria-label={t(`Γράφημα δραστηριότητας: ${activity.reduce((n, b) => n + b.events, 0)} εκδηλώσεις`, `Activity chart: ${activity.reduce((n, b) => n + b.events, 0)} events`)}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activity} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="adminActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--color-ink-muted)' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)', borderRadius: 12, color: 'var(--color-ink)' }}
                formatter={(value, name) => [value, name === 'events' ? t('Εκδηλώσεις', 'Events') : t('Συμμετέχοντες', 'Participants')]}
              />
              <Area type="monotone" dataKey="participants" stroke="var(--color-ink-muted)" strokeWidth={1.5} fill="none" animationDuration={reduceMotion ? 0 : 500} />
              <Area type="monotone" dataKey="events" stroke="var(--color-accent)" strokeWidth={2.5} fill="url(#adminActivity)" animationDuration={reduceMotion ? 0 : 500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
      </>
      )}

      {adminTab === 'users' && (
      <Card className={cn('p-0 overflow-hidden', a.cardSurface)}>
        <div className={cn('p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4', a.borderB)}>
          <div>
            <h2 className={cn('text-sm font-bold', a.head)}>{t('Λογαριασμοί χρηστών', 'User accounts')}</h2>
            <p className={cn('text-xs mt-0.5', a.muted)}>{t('Επίπεδο επαλήθευσης, αξιοπιστία και πρόσβαση', 'Trust tier, reliability and access')}</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', a.muted)} aria-hidden />
            <label htmlFor="admin-user-search" className="sr-only">{t('Αναζήτηση μέλους', 'Search member')}</label>
            <input
              id="admin-user-search"
              type="search"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder={t('Όνομα, id ή πόλη…', 'Name, id or city…')}
              className={cn('w-full pl-9 pr-3 py-2 text-sm rounded-xl border outline-none focus:ring-2 focus:ring-cyan-600', a.inputBg)}
            />
          </div>
        </div>
        {filteredUsers.length === 0 ? (
          <p className={cn('p-4 text-center text-sm', a.muted)}>{t('Κανένα μέλος δεν ταιριάζει.', 'No members match.')}</p>
        ) : (
          <ul className={cn('divide-y', a.isDark ? 'divide-gray-700/40' : 'divide-gray-100')}>
            {filteredUsers.map((u) => {
              const suspended = suspendedUserIds.includes(u.id);
              return (
                <li key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn('w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold', a.isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}>
                      <PhotoOrInitials src={u.photoUrl} name={u.name} />
                    </span>
                    <div className="min-w-0">
                      <p className={cn('font-bold text-sm flex items-center gap-2 flex-wrap', a.head)}>
                        {u.name}
                        <span className={cn('text-2xs font-semibold px-2 py-0.5 rounded-md', suspended ? 'bg-red-500/15 text-red-700 dark:text-red-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300')}>
                          {suspended ? t('Σε αναστολή', 'Suspended') : t('Ενεργός', 'Active')}
                        </span>
                        {u.idVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-label={t('Επαληθευμένη ταυτότητα', 'ID verified')} />}
                      </p>
                      <p className={cn('text-xs mt-0.5', a.muted)}>
                        {formatLocationArea(u.city, language)} · {t(tierLabelEl(u.trustTier), tierLabelEn(u.trustTier))} · {t('Αξιοπιστία', 'Reliability')} {u.reliabilityScore}%
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={suspended ? 'outline' : 'danger'}
                    disabled={u.id === currentUserId}
                    onClick={() => {
                      toggleUserSuspended(u.id);
                      toast.success(suspended ? t(`Ο λογαριασμός ${u.name} επανήλθε`, `${u.name} restored`) : t(`Ο λογαριασμός ${u.name} τέθηκε σε αναστολή`, `${u.name} suspended`));
                    }}
                    className="self-end sm:self-auto flex items-center gap-1.5"
                  >
                    {suspended ? <RotateCcw className="w-3.5 h-3.5" aria-hidden /> : <Ban className="w-3.5 h-3.5" aria-hidden />}
                    {suspended ? t('Επαναφορά', 'Restore') : t('Αναστολή', 'Suspend')}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      )}

      {adminTab === 'system' && (
      <>
      <Card className={cn('p-5 space-y-4', a.cardSurface)}>
        <div>
          <h2 className={cn('text-sm font-bold', a.head)}>{t('Κανόνες ασφάλειας & πλατφόρμας', 'Safety & platform safeguards')}</h2>
          <p className={cn('text-xs mt-0.5', a.muted)}>{t('Κάθε αλλαγή αποθηκεύεται και καταγράφεται στο ιστορικό ενεργειών.', 'Every change is saved and written to the action log.')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SAFEGUARDS.map((item) => {
            const on = safeguards[item.key];
            return (
              <button
                key={item.key}
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => {
                  setAdminSafeguard(item.key, !on);
                  toast.success(t('Η ρύθμιση ενημερώθηκε', 'Policy updated'));
                }}
                className={cn('p-4 rounded-xl border flex items-center justify-between gap-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent', a.borderB, a.isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50')}
              >
                <span>
                  <span className={cn('block text-sm font-bold', a.head)}>{item.title}</span>
                  <span className={cn('block text-xs mt-1 leading-relaxed', a.muted)}>{item.desc}</span>
                </span>
                <span aria-hidden className={cn('w-11 h-6 rounded-full p-0.5 shrink-0 flex items-center transition-colors', on ? 'bg-accent' : 'bg-gray-300 dark:bg-gray-600')}>
                  <span className={cn('w-5 h-5 rounded-full bg-white shadow-soft transition-transform', on ? 'translate-x-5' : 'translate-x-0')} />
                </span>
              </button>
            );
          })}
        </div>
      </Card>
      <Card className={cn('p-5', a.cardSurface)}>
        <h2 className={cn('text-sm font-bold mb-3', a.head)}>{t('Ιστορικό ενεργειών διαχείρισης', 'Admin action log')}</h2>
        {adminActions.length === 0 ? (
          <p className={cn('text-sm', a.muted)}>{t('Δεν υπάρχουν ενέργειες ακόμη.', 'No actions yet.')}</p>
        ) : (
          <ol className="space-y-2">
            {adminActions.slice(0, 8).map((act) => (
              <li key={act.id} className={cn('flex items-center justify-between gap-3 text-xs', a.sub)}>
                <span className="font-mono truncate">{act.action}{act.targetId ? ` → ${act.targetId}` : ''}</span>
                <time dateTime={act.createdAt} className={cn('shrink-0 tabular-nums', a.muted)}>{new Date(act.createdAt).toLocaleString(intlLocale(language))}</time>
              </li>
            ))}
          </ol>
        )}
      </Card>
      {/* Every action Nakamas AI executed, was refused or had cancelled (privacy-minimised). */}
      <Card className={cn('p-5', a.cardSurface)}>
        <h2 className={cn('text-sm font-bold mb-3', a.head)}>{t('Ιστορικό ενεργειών Nakamas AI', 'Nakamas AI action log')}</h2>
        {aiAudit.length === 0 ? (
          <p className={cn('text-sm', a.muted)}>{t('Το AI δεν έχει εκτελέσει ενέργειες ακόμη.', 'Nakamas AI has not performed any actions yet.')}</p>
        ) : (
          <ol className="space-y-2">
            {aiAudit.slice(0, 10).map((e) => {
              const who = users.find((u) => u.id === e.userId)?.name ?? e.userId ?? '—';
              const statusLabel: Record<AiAuditStatus, [string, string]> = {
                done: ['εκτελέστηκε', 'done'],
                failed: ['απέτυχε', 'failed'],
                cancelled: ['ακυρώθηκε', 'cancelled'],
                undone: ['αναιρέθηκε', 'undone'],
                denied: ['απορρίφθηκε', 'denied'],
              };
              const [el, en] = statusLabel[e.status];
              return (
                <li key={e.id} className={cn('flex items-center justify-between gap-3 text-xs', a.sub)}>
                  <span className="min-w-0 truncate">
                    <span className="font-mono">{e.action}</span>
                    {' · '}
                    <span className={e.status === 'denied' || e.status === 'failed' ? 'font-semibold text-red-700 dark:text-red-300' : undefined}>{t(el, en)}</span>
                    {' · '}
                    {who}
                    {e.risk !== 'safe' && e.risk !== 'unknown' ? ` · ${e.risk}` : ''}
                  </span>
                  <time dateTime={e.at} className={cn('shrink-0 tabular-nums', a.muted)}>{new Date(e.at).toLocaleString(intlLocale(language))}</time>
                </li>
              );
            })}
          </ol>
        )}
      </Card>
      </>
      )}

      {adminTab === 'moderation' && (
      <>
      <AdminOutingsPanel section="appeals" />
      <AdminWallModeration />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        <div className="md:col-span-7 space-y-4">
          <h2 className={cn('card-heading-lg font-bold tracking-wide', a.head)}>{t('Πρόσφατες αναφορές', 'Recent Reports')}</h2>
          {displayReports.length === 0 ? (
            <Card className={cn('p-4 text-center', a.cardSurface)}>
              <p className={cn('card-copy font-medium', a.muted)}>
                {t('Δεν υπάρχουν αναφορές ακόμα. Οι αναφορές από /report εμφανίζονται εδώ.', 'No reports yet. Reports from /report appear here.')}
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {displayReports.map((report) => (
                <Card key={report.id} className={cn('p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4', a.cardSurface)}>
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <p className={cn('font-bold text-sm', a.head)}>{report.category}</p>
                      <p className={cn('card-copy mt-0.5 leading-relaxed', a.sub)}>
                        {report.description || t('Χωρίς περιγραφή', 'No description')}
                      </p>
                      <p className={cn('text-xs mt-1', a.muted)}>
                        {report.severity} • {new Date(report.createdAt).toLocaleDateString(intlLocale(language))}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleReview(report.id)}
                      className={cn('text-xs tracking-wider px-3 py-1.5 rounded-2xl font-bold transition-all border', a.isDark ? 'bg-white/10 hover:bg-white/15 border-white/10' : 'bg-gray-100 hover:bg-gray-200 border-gray-100')}
                    >
                      {t('Εξέταση', 'Review')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBanFromReport(report.id)}
                      className="text-xs tracking-wider bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold transition-colors border border-red-200"
                    >
                      {t('Αποκλεισμός', 'Ban')}
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <Card className={cn('p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border', a.isDark ? 'border-red-900/40 bg-red-900/10' : 'border-red-200 bg-red-50/30')}>
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 text-red-500 mt-1" />
              <div>
                <p className={cn('font-bold text-sm', a.head)}>
                  {t('Ύποπτος λογαριασμός — πολλαπλές no-shows', 'Suspicious account — multiple no-shows')}
                </p>
                <p className={cn('card-copy mt-0.5', a.sub)}>
                  {t('3 no-shows τον τελευταίο μήνα (demo)', '3 no-shows in the last month (demo)')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSuspendDemo}
              className="text-xs tracking-wider bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-2xl font-bold shadow-soft transition-all"
            >
              {t('Αναστολή', 'Suspend')}
            </button>
          </Card>
        </div>

        <div className="md:col-span-5 relative">
          <div className="sticky top-24">
            <h2 className={cn('text-sm font-bold tracking-wide mb-4 flex items-center gap-2', a.head)}>
              <Flag className="h-4 w-4 text-gray-400" />
              {t('Γρήγορη ενέργεια', 'Quick Action')}
            </h2>
            <Card className={cn('p-5', a.isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200')}>
              <p className={cn('text-xs font-bold tracking-wide mb-4', a.muted)}>{t('Αναζήτηση χρήστη', 'Search User')}</p>
              <div className="space-y-4">
                <div>
                  <label className={cn('text-xs font-bold mb-1.5 block', a.head)}>{t('Email ή ID', 'Email or ID')}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      placeholder={t('Αναζήτηση...', 'Search...')}
                      className={cn('w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-cyan-600 focus:outline-none', a.inputBg)}
                    />
                  </div>
                </div>
                <div>
                  <label className={cn('text-xs font-bold mb-1.5 block', a.head)}>{t('Ενέργεια', 'Action')}</label>
                  <AppSelect
                    ariaLabel={t("Ενέργεια διαχείρισης", "Moderation action")}
                    value={adminAction}
                    onValueChange={setAdminAction}
                    className={cn('filter-select w-full border', a.inputBg)}
                    options={[
                      { value: 'warning', label: t('Προειδοποίηση', 'Warning') },
                      { value: 'suspend_7d', label: t('Αναστολή 7 ημέρες', 'Suspend 7 days') },
                      { value: 'ban', label: t('Μόνιμος αποκλεισμός', 'Permanent ban') },
                      { value: 'reset_reliability', label: t('Επαναφορά αξιοπιστίας', 'Reset reliability') },
                    ]}
                  />
                </div>
                <div>
                  <label className={cn('text-xs font-bold mb-1.5 block', a.head)}>{t('Σημείωση', 'Note')}</label>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder={t('Αιτιολογία...', 'Reason...')}
                    className={cn('w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-cyan-600 focus:outline-none resize-none', a.inputBg)}
                  />
                </div>
                <Button className="w-full" onClick={handleApplyQuickAction}>
                  {t('Εφαρμογή', 'Apply')}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <CompanyRequestModerationPanel />
      <ChatModerationPanel />
      </>
      )}
      </div>
    </div>
  );
}
