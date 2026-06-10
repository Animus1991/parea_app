import { useMemo, useState } from 'react';
import { Card } from '../common/Card';
import { AlertCircle, ShieldAlert, Flag, Search, TrendingUp } from 'lucide-react';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { usePageContrast } from '../../hooks/usePageContrast';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { CompanyRequestModerationPanel } from '../buddySeek/CompanyRequestModerationPanel';
import { ChatModerationPanel } from '../chat/ChatModerationPanel';
import { toast } from 'sonner';

export default function AdminDashboardPageContent() {
  const { t } = useLanguage();
  const a = usePageContrast();
  const users = useStore((s) => s.users);
  const events = useStore((s) => s.events);
  const issueReports = useStore((s) => s.issueReports);
  const resolveIssueReport = useStore((s) => s.resolveIssueReport);
  const logAdminAction = useStore((s) => s.logAdminAction);

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
      toast.error(t('Εισάγετε email ή ID χρήστη', 'Enter a user email or ID'));
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
    <div className="mx-auto max-w-full space-y-8 pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className={cn('text-[16px] md:text-[18px] font-bold', a.isDark ? 'text-red-400' : 'text-red-700')}>
          {t('Πίνακας Διαχείρισης', 'Admin Dashboard')}
        </h1>
        <p className={cn('mt-1 text-sm font-medium', a.sub)}>
          {t('Εποπτεία πλατφόρμας & μετριασμός', 'Platform oversight & moderation')}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className={cn('p-4 border-t-4 border-t-blue-500', a.cardSurface)}>
          <h3 className={cn('text-xs font-bold tracking-wider', a.muted)}>{t('Ενεργοί', 'Active')}</h3>
          <p className={cn('text-[20px] font-black mt-1', a.head)}>{users.length}</p>
          <p className="text-[11px] text-green-500 font-bold flex items-center gap-0.5">
            <TrendingUp className="w-2.5 h-2.5" />
            {t('χρήστες', 'users')}
          </p>
        </Card>
        <Card className={cn('p-4 border-t-4 border-t-cyan-500', a.cardSurface)}>
          <h3 className={cn('text-xs font-bold tracking-wider', a.muted)}>{t('Αναφορές', 'Reports')}</h3>
          <p className={cn('text-[20px] font-black mt-1', a.head)}>{pendingReports.length}</p>
          <p className="text-[11px] text-amber-500 font-bold">{t('εκκρεμείς', 'pending')}</p>
        </Card>
        <Card className={cn('p-4 border-t-4 border-t-red-500', a.cardSurface)}>
          <h3 className={cn('text-xs font-bold tracking-wider', a.muted)}>{t('Επιλύθηκαν', 'Resolved')}</h3>
          <p className={cn('text-[20px] font-black mt-1', a.head)}>{resolvedCount}</p>
          <p className={cn('text-[11px] font-medium', a.muted)}>{t('συνολικά', 'total')}</p>
        </Card>
        <Card className={cn('p-4 border-t-4 border-t-emerald-500', a.cardSurface)}>
          <h3 className={cn('text-xs font-bold tracking-wider', a.muted)}>{t('Εκδηλώσεις', 'Events')}</h3>
          <p className={cn('text-[20px] font-black mt-1', a.head)}>{events.length}</p>
          <p className={cn('text-[11px] font-medium', a.muted)}>{t('στη βάση', 'in catalog')}</p>
        </Card>
      </div>

      <Card className={cn('p-4', a.cardSurface)}>
        <h3 className={cn('text-xs font-bold tracking-widest mb-3', a.head)}>{t('Υγεία Πλατφόρμας', 'Platform Health')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-[11px] font-medium', a.muted)}>{t('Μ.Ο. Αξιοπιστία', 'Avg Reliability')}</span>
              <span className="text-[12.5px] font-bold text-emerald-600">{avgReliability}%</span>
            </div>
            <div className={cn('w-full h-1.5 rounded-full', a.progressBg)}>
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${avgReliability}%` }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-[11px] font-medium', a.muted)}>{t('No-show rate', 'No-show rate')}</span>
              <span className="text-[12.5px] font-bold text-amber-600">4.2%</span>
            </div>
            <div className={cn('w-full h-1.5 rounded-full', a.progressBg)}>
              <div className="bg-amber-400 h-full rounded-full" style={{ width: '4.2%' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={cn('text-[11px] font-medium', a.muted)}>{t('Επαληθευμένοι', 'Verified')}</span>
              <span className="text-[12.5px] font-bold text-cyan-600">{verifiedPct}%</span>
            </div>
            <div className={cn('w-full h-1.5 rounded-full', a.progressBg)}>
              <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${verifiedPct}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7 space-y-6">
          <h2 className={cn('text-base font-bold tracking-wide', a.head)}>{t('Πρόσφατες Αναφορές', 'Recent Reports')}</h2>
          {displayReports.length === 0 ? (
            <Card className={cn('p-6 text-center', a.cardSurface)}>
              <p className={cn('text-sm font-medium', a.muted)}>
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
                      <p className={cn('text-sm mt-0.5 leading-relaxed', a.sub)}>
                        {report.description || t('Χωρίς περιγραφή', 'No description')}
                      </p>
                      <p className={cn('text-[11px] mt-1', a.muted)}>
                        {report.severity} • {new Date(report.createdAt).toLocaleDateString()}
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
                      className="text-xs tracking-wider bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded font-bold transition-colors border border-red-200"
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
                <p className={cn('text-sm mt-0.5', a.sub)}>
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
            <h2 className={cn('text-sm font-bold tracking-wide mb-6 flex items-center gap-2', a.head)}>
              <Flag className="h-4 w-4 text-gray-400" />
              {t('Γρήγορη Ενέργεια', 'Quick Action')}
            </h2>
            <Card className={cn('p-5', a.isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200')}>
              <p className={cn('text-xs font-bold tracking-wide mb-4', a.muted)}>{t('Αναζήτηση Χρήστη', 'Search User')}</p>
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
                  <select
                    value={adminAction}
                    onChange={(e) => setAdminAction(e.target.value)}
                    className={cn('w-full px-3 py-2 text-xs border rounded-lg focus:ring-2 focus:ring-cyan-600 focus:outline-none', a.inputBg)}
                  >
                    <option value="warning">{t('Προειδοποίηση', 'Warning')}</option>
                    <option value="suspend_7d">{t('Αναστολή 7 ημέρες', 'Suspend 7 days')}</option>
                    <option value="ban">{t('Μόνιμος αποκλεισμός', 'Permanent ban')}</option>
                    <option value="reset_reliability">{t('Επαναφορά αξιοπιστίας', 'Reset reliability')}</option>
                  </select>
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
    </div>
  );
}
