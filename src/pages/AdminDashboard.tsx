import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { AlertCircle, UserMinus, ShieldAlert, Flag, Search, CheckCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useLanguage } from '../lib/i18n';

export default function AdminDashboard() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-full space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-red-700">{t('Πίνακας Συντονισμού & Εμπιστοσύνης', 'Moderation & Trust Dashboard')}</h1>
        <p className="mt-1 text-xs text-gray-500 font-medium">{t('Εσωτερική προβολή διαχειριστή: Εκδώστε ιδιωτικές επισημάνσεις συμπεριφοράς για να επηρεάσετε τη βαθμολογία αξιοπιστίας των χρηστών.', 'Internal admin view: Issue private behavior flags to influence user reliability scores.')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border-t-4 border-t-blue-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">{t('Αιτήματα Διοργανωτών', 'Organizer Requests')}</h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">12</p>
        </Card>
        <Card className="p-4 border-t-4 border-t-indigo-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">{t('Εγκρίσεις Υψηλής Εμπιστοσύνης', 'High-Trust Approvals')}</h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">4</p>
        </Card>
        <Card className="p-4 border-t-4 border-t-red-500">
          <h3 className="text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">{t('Ενεργές Αναστολές', 'Active Suspensions')}</h3>
          <p className="text-2xl font-bold text-[#111827] mt-2">1</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-10">
        
        <div className="md:col-span-7 space-y-6">
          <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wide">{t('Έλεγχος Αναφερθέντων Περιστατικών', 'Review Reported Incidents')}</h2>
          <div className="space-y-4">
            <Card className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                 <div className="mt-1"><AlertCircle className="h-4 w-4 text-yellow-500" /></div>
                 <div>
                   <p className="font-bold text-[#111827] text-sm">{t('Χρήστης u4: Επανειλημμένη μη εμφάνιση (x2)', 'User u4: Repeated No-Show (x2)')}</p>
                   <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t('Έχασε το Stand-up (1 Μαΐου) και το Cinema (10 Μαΐου) σύμφωνα με τον Διοργανωτή. Δεν ακύρωσε στην εφαρμογή.', 'Missed Stand-up (May 1) and Cinema (May 10) according to Organizer. Did not cancel in app.')}</p>
                 </div>
              </div>
              <div className="flex gap-2">
                <button className="text-sm uppercase tracking-wider bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded font-bold transition-colors shadow-sm border border-gray-200">
                  {t('Απόρριψη', 'Dismiss')}
                </button>
                <button className="text-sm uppercase tracking-wider bg-red-50 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded font-bold transition-colors border border-red-200">
                  {t('Έκδοση Επισήμανσης', 'Issue Flag')}
                </button>
              </div>
            </Card>

            <Card className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-red-200 bg-red-50/30">
              <div className="flex items-start gap-3">
                 <div className="mt-1"><ShieldAlert className="h-4 w-4 text-red-500" /></div>
                 <div>
                   <p className="font-bold text-[#111827] text-sm">{t('Χρήστης u9: Ιδιωτική Αναφορά Ασφαλείας', 'User u9: Private Safety Report')}</p>
                   <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{t('Δύο χρήστες από την Ομάδα g3 (Πεζοπορία) ανέφεραν ακατάλληλα μηνύματα. Απαιτείται χειροκίνητος έλεγχος των αρχείων καταγραφής συνομιλιών.', 'Two users from Group g3 (Hiking) reported inappropriate messaging. Requires manual review of chat logs.')}</p>
                 </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button className="text-sm uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded font-bold shadow-sm transition-colors">
                  {t('Αναστολή & Έλεγχος', 'Suspend & Review')}
                </button>
              </div>
            </Card>
          </div>
        </div>

        <div className="md:col-span-5 relative">
          <div className="sticky top-24">
            <h2 className="text-sm font-bold text-[#111827] uppercase tracking-wide mb-6 flex items-center gap-2">
              <Flag className="h-4 w-4 text-gray-400" /> {t('Έκδοση Ιδιωτικής Επισήμανσης Συμπεριφοράς', 'Issue Private Behavior Flag')}
            </h2>
            <Card className="p-5 bg-gray-50 border-gray-200">
              <p className="text-sm text-gray-500 font-bold uppercase tracking-wide mb-4">
                {t('Οι επισημάνσεις αφαιρούν πόντους αξιοπιστίας χωρίς δημόσια διαπόμπευση.', 'Flags deduct reliability points without public shaming.')}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#111827] mb-1.5 block">{t('Αναζήτηση Χρήστη', 'Search User')}</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="text" placeholder={t('ID Χρήστη, Email ή Όνομα...', 'User ID, Email or Name...')} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#111827] mb-1.5 block">{t('Κατηγορία Επισήμανσης', 'Flag Category')}</label>
                  <select className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none bg-white">
                    <option>{t('Μη Εμφάνιση (Μείωση σκορ -20)', 'No-Show (Drop score -20)')}</option>
                    <option>{t('Αργοπορημένη Ακύρωση (Μείωση σκορ -10)', 'Late Cancellation (Drop score -10)')}</option>
                    <option>{t('Αγενής Συμπεριφορά (Μείωση σκορ -30)', 'Rude Conduct / Flaky (Drop score -30)')}</option>
                    <option>{t('Σοβαρή Παράβαση (Άμεση Αναστολή)', 'Major Violation (Immediate Suspend)')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-[#111827] mb-1.5 block">{t('Εσωτερικές Σημειώσεις (Υποχρεωτικό)', 'Internal Notes (Required)')}</label>
                  <textarea rows={3} placeholder={t('Δώστε πλαίσιο για άλλους συντονιστές...', 'Provide context for other moderators...')} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none resize-none"></textarea>
                </div>
                
                <Button className="w-full bg-[#111827]">{t('Εφαρμογή Εσωτερικής Επισήμανσης', 'Apply Internal Flag')}</Button>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  );
}
