import React from 'react';
import { ShieldCheck, Phone, Mail, CreditCard, Award, UserCheck, TrendingUp, Calendar, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useStore } from '../../store';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

function useAccent() {
  const theme = useStore((s) => s.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';

  if (theme === 'vibrant' || theme === 'vibrant-dark') return {
    isDark,
    head: isDark ? 'text-white' : 'text-[#111827]',
    sub: isDark ? 'text-gray-400' : 'text-gray-600',
    muted: isDark ? 'text-gray-500' : 'text-gray-400',
    link: isDark ? 'text-fuchsia-400 hover:underline' : 'text-fuchsia-600 hover:underline',
    iconAccent: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600',
    scoreStroke: '#d946ef',
    scoreFill: isDark ? 'fill-white' : 'fill-[#111827]',
    timelineDot: 'bg-fuchsia-500',
    timelineLine: isDark ? 'bg-gray-700' : 'bg-gray-200',
    infoBg: isDark ? 'bg-gray-800/30 border-none shadow-none' : 'bg-gray-50 border-none shadow-none',
  };

  if (theme === 'neon' || theme === 'neon-dark' || theme === 'bento-dark') return {
    isDark,
    head: isDark ? 'text-white' : 'text-[#111827]',
    sub: isDark ? 'text-gray-400' : 'text-gray-600',
    muted: isDark ? 'text-gray-500' : 'text-gray-400',
    link: isDark ? 'text-emerald-400 hover:underline' : 'text-emerald-600 hover:underline',
    iconAccent: isDark ? 'text-emerald-400' : 'text-emerald-600',
    scoreStroke: '#10b981',
    scoreFill: isDark ? 'fill-white' : 'fill-[#111827]',
    timelineDot: 'bg-emerald-500',
    timelineLine: isDark ? 'bg-gray-700' : 'bg-gray-200',
    infoBg: isDark ? 'bg-gray-800/30 border-none shadow-none' : 'bg-gray-50 border-none shadow-none',
  };

  if (theme === 'bento') return {
    isDark: false,
    head: 'text-[#111827]',
    sub: 'text-gray-600',
    muted: 'text-gray-400',
    link: 'text-indigo-600 hover:underline',
    iconAccent: 'text-indigo-600',
    scoreStroke: '#6366f1',
    scoreFill: 'fill-[#111827]',
    timelineDot: 'bg-indigo-500',
    timelineLine: 'bg-gray-200',
    infoBg: 'bg-gray-50 border-none shadow-none',
  };

  // Classic
  return {
    isDark: false,
    head: 'text-[#111827]',
    sub: 'text-gray-600',
    muted: 'text-gray-400',
    link: 'text-cyan-600 hover:underline',
    iconAccent: 'text-emerald-600',
    scoreStroke: '#10b981',
    scoreFill: 'fill-[#111827]',
    timelineDot: 'bg-green-500',
    timelineLine: 'bg-gray-200',
    infoBg: 'bg-gray-50 border-none shadow-none',
  };
}

export default function TrustCenterPageContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const a = useAccent();
  const currentUser = useStore((s) => s.currentUser);

  if (!currentUser) return null;

  const trustTier = currentUser.trustTier || 'Newcomer';
  const reliabilityScore = currentUser.reliabilityScore ?? 85;
  const circumference = 2 * Math.PI * 52;
  const strokeDash = (reliabilityScore / 100) * circumference;

  const timeline = [
    { date: t('9 Μαΐ', 'May 9'), event: t('Επαλήθευση τηλεφώνου ολοκληρώθηκε', 'Phone verification completed'), positive: true },
    { date: t('5 Μαΐ', 'May 5'), event: t('Αξιολογήθηκε 5/5 από ομάδα "Comedy Night"', 'Rated 5/5 by "Comedy Night" group'), positive: true },
    { date: t('1 Μαΐ', 'May 1'), event: t('Συμμετοχή σε "Release Athens" επιβεβαιώθηκε', 'Attended "Release Athens" confirmed'), positive: true },
    { date: t('28 Απρ', 'Apr 28'), event: t('Email επαλήθευση ολοκληρώθηκε', 'Email verification completed'), positive: true },
    { date: t('25 Απρ', 'Apr 25'), event: t('Δημιουργία λογαριασμού — Newcomer', 'Account created — Newcomer'), positive: true },
  ];

  return (
    <div className="mx-auto max-w-full space-y-6 md:space-y-8 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div>
        <h1 className={cn("text-xl md:text-2xl font-bold tracking-tight", a.head)}>{t('Κέντρο Εμπιστοσύνης', 'Trust Center')}</h1>
        <p className={cn("mt-2 text-sm leading-relaxed max-w-xl", a.sub)}>
          {t('Η αξιοπιστία σας βασίζεται στις επαληθεύσεις και τις αξιολογήσεις σας.', 'Your trust score is based on your verifications and reviews.')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Verification Status */}
        <Card className="p-5 space-y-5">
          <div>
            <h2 className={cn("text-[11px] font-bold tracking-wider uppercase mb-3 flex items-center gap-1.5", a.muted)}>
              <ShieldCheck className={cn("h-3.5 w-3.5", a.iconAccent)} />{t('Κατάσταση Επαλήθευσης', 'Verification Status')}
            </h2>
            <p className={cn("text-base font-bold", a.head)}>{trustTier}</p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-2 text-[13px] font-medium", a.sub)}>
                <Mail className={cn("h-3.5 w-3.5", a.muted)} /> Email
              </div>
              <Badge variant="success" className="text-[11px] px-1.5 py-0.5">{t('Επαληθευμένο', 'Verified')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-2 text-[13px] font-medium", a.sub)}>
                <Phone className={cn("h-3.5 w-3.5", a.muted)} />{t('Τηλέφωνο', 'Phone')}
              </div>
              <Badge variant="success" className="text-[11px] px-1.5 py-0.5">{t('Επαληθευμένο', 'Verified')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-2 text-[13px] font-medium", a.sub)}>
                <CreditCard className={cn("h-3.5 w-3.5", a.muted)} />{t('Πληρωμή', 'Payment')}
              </div>
              <Badge variant="success" className="text-[11px] px-1.5 py-0.5">{t('Επαληθευμένο', 'Verified')}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-2 text-[13px] font-medium", a.muted)}>
                <UserCheck className="h-3.5 w-3.5" />{t('Ταυτότητα', 'Government ID')}
              </div>
              <button onClick={() => navigate('/verification')} className={cn("text-[11px] font-bold cursor-pointer tracking-wide", a.link)}>
                {t('Επαλήθευση', 'Verify')}
              </button>
            </div>
          </div>

          <div className={cn("pt-4 border-t", a.isDark ? "border-gray-700/40" : "border-gray-100")}>
            <div className="flex items-center justify-between">
              <div className={cn("flex items-center gap-2 text-sm font-bold", a.head)}>
                <Award className="h-4 w-4 text-amber-500" />{t('Βαθμός Αξιοπιστίας', 'Reliability Score')}
              </div>
              <span className="text-base font-bold text-emerald-600">{reliabilityScore}%</span>
            </div>
            <p className={cn("text-sm mt-1.5 font-medium leading-relaxed", a.sub)}>
              {t('Βασίζεται στις παρουσίες, αξιολογήσεις και συμπεριφορά σας.', 'Based on your attendance, reviews, and behavior.')}
            </p>
          </div>
        </Card>

        {/* Radial Score + Info */}
        <div className="space-y-3">
          <Card className="p-5 flex flex-col items-center">
            <svg width="120" height="120" viewBox="0 0 120 120" className="mb-2">
              <circle cx="60" cy="60" r="52" fill="none" stroke={a.isDark ? '#374151' : '#e5e7eb'} strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={a.scoreStroke} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`} transform="rotate(-90 60 60)" />
              <text x="60" y="56" textAnchor="middle" className={cn("text-[30px] font-black", a.scoreFill)} fontSize="28">{reliabilityScore}</text>
              <text x="60" y="74" textAnchor="middle" className="fill-gray-400" fontSize="10" fontWeight="600">%</text>
            </svg>
            <p className={cn("text-xs font-bold tracking-wide", a.muted)}>{t('Βαθμός Αξιοπιστίας', 'Reliability Score')}</p>
          </Card>

          <Card className={a.infoBg}>
            <div className="p-4 md:p-5">
              <h3 className={cn("text-xs font-bold tracking-wide mb-1.5", a.head)}>{t('Πώς λειτουργεί', 'How It Works')}</h3>
              <p className={cn("text-sm leading-relaxed", a.sub)}>
                {t('Κάθε επαλήθευση αυξάνει το επίπεδο εμπιστοσύνης σας, ξεκλειδώνοντας πρόσβαση σε εκδηλώσεις υψηλής ασφάλειας.', 'Each verification raises your trust tier, unlocking access to high-safety events.')}
              </p>
            </div>
          </Card>
          <Card className={a.infoBg}>
            <div className="p-4 md:p-5">
              <h3 className={cn("text-xs font-bold tracking-wide mb-1.5", a.head)}>{t('Επίπεδα Εμπιστοσύνης', 'Trust Tiers')}</h3>
              <p className={cn("text-sm leading-relaxed", a.sub)}>
                {t('Newcomer → Verified → Trusted → Super Trusted. Κάθε επίπεδο απαιτεί περισσότερες επαληθεύσεις.', 'Newcomer → Verified → Trusted → Super Trusted. Each tier requires more verifications.')}
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Trust Timeline */}
      <Card className="p-5">
        <h3 className={cn("text-xs font-bold tracking-wide mb-4 flex items-center gap-1.5", a.head)}>
          <TrendingUp className={cn("w-3.5 h-3.5", a.iconAccent)} />{t('Ιστορικό Εμπιστοσύνης', 'Trust History')}
        </h3>
        <div className="space-y-0">
          {timeline.map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={cn("w-2 h-2 rounded-full mt-1.5", item.positive ? a.timelineDot : 'bg-red-400')} />
                {i < timeline.length - 1 && <div className={cn("w-px flex-1", a.timelineLine)} />}
              </div>
              <div className="pb-4">
                <p className={cn("text-sm font-medium", a.head)}>{item.event}</p>
                <span className={cn("text-[11px] font-medium", a.muted)}>{item.date}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
