import React, { useState } from 'react';
import { Flag, AlertTriangle, ShieldCheck, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../lib/i18n';

export default function ReportIssue() {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#111827]">{t('Αναφορά Προβλήματος', 'Report an Issue')}</h1>
          <p className="text-gray-500 font-medium text-xs md:text-sm mt-1">{t('Βοηθήστε μας να διατηρήσουμε την κοινότητα ασφαλή.', 'Help us maintain a safe community.')}</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-[#111827] transition-colors rounded-full p-2 bg-white border border-gray-200 shadow-sm">
          <X className="w-5 h-5" />
        </button>
      </div>

      {step === 1 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 bg-red-50 border-b border-red-100 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-bold text-[#111827] text-sm">{t('Πληροφορίες Έκτακτης Ανάγκης', 'Emergency Info')}</h3>
              <p className="text-xs text-red-800 mt-1 leading-relaxed">{t('Εάν εσείς ή κάποιος άλλος βρίσκεται σε άμεσο κίνδυνο, παρακαλώ επικοινωνήστε πρώτα με τις τοπικές υπηρεσίες έκτακτης ανάγκης (112). Το προσωπικό του Nakamas δεν επεμβαίνει σε τέτοιες περιπτώσεις.', 'If you or anyone else is in immediate danger, please contact local emergency services (112) first. Nakamas staff are not first responders.')}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-2">{t('Τι αφορά αυτή η αναφορά;', 'What is this regarding?')}</label>
              <select className="w-full h-11 px-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm font-medium" required>
                <option value="">{t('Επιλέξτε μια επιλογή...', 'Select an option...')}</option>
                <option value="user_behavior">{t('Ανάρμοστη Συμπεριφορά Χρήστη', 'Inappropriate User Behavior')}</option>
                <option value="event_safety">{t('Ανησυχία για την Ασφάλεια Εκδήλωσης', 'Event Safety Concern')}</option>
                <option value="fake_profile">{t('Ψεύτικο Προφίλ ή Απάτη', 'Fake Profile or Scam')}</option>
                <option value="no_show">{t('Επανειλημμένη Μη Εμφάνιση', 'Repeated No-shows')}</option>
                <option value="other">{t('Άλλο Πρόβλημα', 'Other Issue')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111827] uppercase tracking-wider mb-2">{t('Περιγραφή του προβλήματος', 'Description of the issue')}</label>
              <textarea 
                className="w-full px-3 py-3 rounded-lg border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent text-sm font-medium resize-none" 
                rows={5} 
                placeholder={t('Παρακαλώ δώστε όσες περισσότερες λεπτομέρειες μπορείτε. Οι πληροφορίες αυτές τηρούνται αυστηρά εμπιστευτικές.', 'Please provide as much detail as possible. This information is kept strictly confidential.')}
                required
              ></textarea>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                {t('Η αναφορά σας είναι ιδιωτική. Το μέρος που αναφέρεται ', 'Your report is private. The reported party will ')} 
                <span className="font-bold text-[#111827]">{t('δεν', 'never')}</span> 
                {t(' θα δει ποτέ ποιος το ανέφερε. Η ομάδα Εμπιστοσύνης & Ασφάλειας θα την ελέγξει εντός 24 ωρών.', ' see who reported them. Our Trust & Safety team will review this within 24 hours.')}
              </p>
            </div>

            <button type="submit" className="w-full bg-[#111827] text-white py-3 rounded-full text-xs font-bold shadow-sm hover:bg-black transition-colors uppercase tracking-wider">
              {t('Υποβολή Αναφοράς', 'Submit Report')}
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-[#111827] mb-2">{t('Η Αναφορά Υποβλήθηκε', 'Report Submitted')}</h2>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            {t('Ευχαριστούμε που μας βοηθάτε να διατηρήσουμε την κοινότητα του Nakamas ασφαλή. Η ομάδα Εμπιστοσύνης & Ασφάλειας θα εξετάσει την αναφορά σας και θα λάβει τα κατάλληλα μέτρα.', 'Thank you for helping keep the Nakamas community safe. Our Trust & Safety team will review your report and take appropriate action.')}
          </p>
          <button 
            onClick={() => navigate('/')}
            className="bg-gray-100 text-[#111827] px-6 py-2.5 rounded-full text-xs font-bold hover:bg-gray-200 transition-colors uppercase tracking-wider"
          >
            {t('Επιστροφή στον Πίνακα Ελέγχου', 'Return to Dashboard')}
          </button>
        </div>
      )}
    </div>
  );
}
