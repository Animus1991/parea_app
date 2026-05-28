import React from 'react';
import { ShieldCheck, UserCheck, Smartphone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

function useAccent() {
  const theme = useStore((s) => s.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';
  const base = {
    isDark,
    head: isDark ? 'text-white' : 'text-[#111827]',
    sub: isDark ? 'text-gray-400' : 'text-gray-500',
    muted: isDark ? 'text-gray-500' : 'text-gray-400',
    borderB: isDark ? 'border-gray-700/40' : 'border-gray-100',
    pendingIcon: isDark ? 'bg-gray-700/30 text-gray-400 border-gray-600' : 'bg-gray-50 text-gray-400 border-gray-200',
    pendingLabel: isDark ? 'text-gray-500' : 'text-gray-400',
    uploadArea: isDark ? 'bg-gray-800/30 border-gray-600' : 'bg-gray-50 border-gray-200',
    uploadText: isDark ? 'text-gray-400' : 'text-gray-500',
    advBadge: isDark ? 'bg-gray-700/40 text-gray-400' : 'bg-gray-100 text-gray-600',
    scoreBg: 'bg-gradient-to-br from-cyan-500 to-emerald-500',
    tierListText: isDark ? 'text-gray-400' : 'text-gray-600',
  };

  if (theme === 'vibrant' || theme === 'vibrant-dark') return {
    ...base,
    progressBg: isDark ? 'bg-fuchsia-900/20 border-fuchsia-800/30' : 'bg-fuchsia-50 border-fuchsia-200',
    progressIcon: isDark ? 'bg-fuchsia-900/30' : 'bg-fuchsia-100',
    progressIconColor: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600',
    progressHead: isDark ? 'text-fuchsia-300' : 'text-fuchsia-900',
    progressSub: isDark ? 'text-fuchsia-400' : 'text-fuchsia-700',
    progressBar: isDark ? 'bg-fuchsia-800/30' : 'bg-fuchsia-200',
    progressFill: 'bg-fuchsia-500',
    completedIcon: isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-600',
    tierEmail: isDark ? 'bg-cyan-900/20 border-cyan-800/30' : 'bg-cyan-50 border-cyan-100',
    tierPhone: isDark ? 'bg-purple-900/20 border-purple-800/30' : 'bg-purple-50 border-purple-100',
    tierId: isDark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-100',
    tierTimeBg: isDark ? 'bg-gray-800/50' : 'bg-white',
  };

  // Default + neon + bento variants
  return {
    ...base,
    progressBg: isDark ? 'bg-emerald-900/20 border-emerald-800/30' : 'bg-emerald-50 border-emerald-200',
    progressIcon: isDark ? 'bg-emerald-900/30' : 'bg-emerald-100',
    progressIconColor: isDark ? 'text-emerald-400' : 'text-emerald-600',
    progressHead: isDark ? 'text-emerald-300' : 'text-emerald-900',
    progressSub: isDark ? 'text-emerald-400' : 'text-emerald-700',
    progressBar: isDark ? 'bg-emerald-800/30' : 'bg-emerald-200',
    progressFill: 'bg-emerald-500',
    completedIcon: isDark ? 'bg-cyan-900/30 text-cyan-400' : 'bg-cyan-50 text-cyan-600',
    tierEmail: isDark ? 'bg-cyan-900/20 border-cyan-800/30' : 'bg-cyan-50 border-cyan-100',
    tierPhone: isDark ? 'bg-purple-900/20 border-purple-800/30' : 'bg-purple-50 border-purple-100',
    tierId: isDark ? 'bg-amber-900/20 border-amber-800/30' : 'bg-amber-50 border-amber-100',
    tierTimeBg: isDark ? 'bg-gray-800/50' : 'bg-white',
  };
}

export default function VerificationCenterPageContent() {
  const { t } = useLanguage();
  const a = useAccent();

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div>
        <h1 className={cn("text-xl md:text-2xl font-bold", a.head)}>{t('Κέντρο Επαλήθευσης', 'Verification Center')}</h1>
        <p className={cn("font-medium text-sm mt-1", a.sub)}>{t('Επαληθεύστε την ταυτότητά σας για μεγαλύτερη ασφάλεια', 'Verify your identity for greater safety')}</p>
      </div>

      {/* Progress */}
      <div className={cn("rounded-xl p-4 flex gap-4 border", a.progressBg)}>
        <div className={cn("w-12 h-[42px] rounded-full flex items-center justify-center shrink-0", a.progressIcon)}>
          <ShieldCheck className={cn("w-6 h-6", a.progressIconColor)} />
        </div>
        <div className="flex-1">
          <h2 className={cn("font-bold text-sm", a.progressHead)}>{t('Πρόοδος Επαλήθευσης', 'Verification Progress')}</h2>
          <p className={cn("text-xs mt-1 mb-3", a.progressSub)}>{t('2 από 3 βήματα', '2 of 3 steps completed')}</p>
          <div className={cn("w-full rounded-full h-2", a.progressBar)}>
            <div className={cn("h-2 rounded-full w-2/3", a.progressFill)}></div>
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Email — completed */}
        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", a.completedIcon)}>
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("font-bold text-sm", a.head)}>{t('Email Επαλήθευση', 'Email Verification')}</h3>
                <p className={cn("text-[10px] font-bold tracking-wider mt-0.5", a.isDark ? "text-emerald-400" : "text-emerald-600")}>{t('Ολοκληρώθηκε', 'Completed')}</p>
              </div>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>
        </Card>

        {/* Phone — pending */}
        <Card className="p-5">
          <div className={cn("flex items-start justify-between border-b pb-4 mb-4", a.borderB)}>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", a.pendingIcon)}>
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("font-bold text-sm", a.head)}>{t('Τηλέφωνο', 'Phone Number')}</h3>
                <p className={cn("text-[10px] font-bold tracking-wider mt-0.5", a.pendingLabel)}>{t('Σε εκκρεμότητα', 'Pending')}</p>
              </div>
            </div>
          </div>
          <p className={cn("text-sm mb-3", a.sub)}>{t('Θα σας στείλουμε SMS με κωδικό.', 'We\'ll send you an SMS code.')}</p>
          <Button variant="outline" size="sm" className="w-full text-xs">{t('Επαλήθευση Τώρα', 'Verify Now')}</Button>
        </Card>

        {/* Government ID — optional */}
        <Card className="p-5 md:col-span-2">
          <div className={cn("flex items-start justify-between border-b pb-4 mb-4", a.borderB)}>
            <div className="flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border", a.pendingIcon)}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className={cn("font-bold text-sm", a.head)}>{t('Ταυτότητα / Διαβατήριο', 'Government ID')}</h3>
                <p className={cn("text-[10px] font-bold tracking-wider mt-0.5", a.pendingLabel)}>{t('Προαιρετικό', 'Optional')}</p>
              </div>
            </div>
            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide", a.advBadge)}>{t('Προχωρημένο', 'Advanced')}</span>
          </div>
          <p className={cn("text-sm mb-4 max-w-xl", a.sub)}>{t('Ανεβάστε φωτογραφία ταυτότητας για εκδηλώσεις υψηλής ασφάλειας.', 'Upload a photo of your ID to access high-safety events.')}</p>
          <div className={cn("p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-dashed", a.uploadArea)}>
            <div className={cn("flex gap-3 text-sm font-medium", a.uploadText)}>
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4" />{t('Ασφαλές', 'Secure')}</span>
              <span className="flex items-center gap-1"><UserCheck className="w-4 h-4" />{t('Ιδιωτικό', 'Private')}</span>
            </div>
            <Button size="sm" className="w-full sm:w-auto shrink-0 shadow-soft">{t('Μεταφόρτωση', 'Upload')}</Button>
          </div>
        </Card>
      </div>

      {/* Tier benefits */}
      <Card className="p-5">
        <h3 className={cn("text-xs font-bold tracking-wide mb-4", a.head)}>{t('Τι ξεκλειδώνετε', 'What you unlock')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            {
              icon: Mail, label: 'Email', color: 'text-cyan-600', bg: a.tierEmail,
              items: [t('Βασική πρόσβαση', 'Basic access'), t('Εγγραφή σε ομάδες', 'Join groups'), t('Ομαδικές συνομιλίες', 'Group chats')],
              time: '~1 ' + t('λεπτό', 'min'),
              timeColor: isDarkColor(a.isDark, 'text-cyan-400', 'text-cyan-600'),
            },
            {
              icon: Smartphone, label: t('Τηλέφωνο', 'Phone'), color: 'text-purple-600', bg: a.tierPhone,
              items: [t('Δημιουργία εκδηλώσεων', 'Create events'), 'Trust Score +15%', t('Ιδιωτικά events', 'Private events')],
              time: '~2 ' + t('λεπτά', 'min'),
              timeColor: isDarkColor(a.isDark, 'text-purple-400', 'text-purple-600'),
            },
            {
              icon: FileText, label: t('Ταυτότητα', 'ID'), color: 'text-amber-600', bg: a.tierId,
              items: [t('Πλήρης πρόσβαση', 'Full access'), 'Trust Score +25%', t('Organizer badge', 'Organizer badge')],
              time: '~5 ' + t('λεπτά', 'min'),
              timeColor: isDarkColor(a.isDark, 'text-amber-400', 'text-amber-600'),
            },
          ].map(tier => {
            const Icon = tier.icon;
            return (
              <div key={tier.label} className={cn("border rounded-lg p-3", tier.bg)}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={cn("w-4 h-4", tier.color)} />
                  <span className={cn("text-sm font-bold", a.head)}>{tier.label}</span>
                </div>
                <ul className={cn("space-y-1 text-xs font-medium", a.tierListText)}>
                  {tier.items.map(item => <li key={item}>• {item}</li>)}
                </ul>
                <span className={cn("mt-2 inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-full", tier.timeColor, a.tierTimeBg)}>{tier.time}</span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Trust Score Impact */}
      <Card className="p-4 flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-base shrink-0", a.scoreBg)}>72%</div>
        <div className="flex-1">
          <p className={cn("text-sm font-bold", a.head)}>{t('Τρέχον Trust Score', 'Current Trust Score')}</p>
          <p className={cn("text-xs font-medium mt-0.5", a.sub)}>{t('Ολοκληρώστε τηλέφωνο για +15%', 'Complete phone for +15%')}</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-emerald-500">→ 87%</span>
          <p className={cn("text-[10px] font-medium", a.muted)}>{t('μετά', 'after')}</p>
        </div>
      </Card>
    </div>
  );
}

function isDarkColor(isDark: boolean, darkVal: string, lightVal: string) {
  return isDark ? darkVal : lightVal;
}
