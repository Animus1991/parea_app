import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { ShieldCheck, Phone, Mail, CreditCard, Award, UserCheck } from 'lucide-react';
import { useStore } from '../store';
import { useLanguage } from '../lib/i18n';

export default function TrustCenter() {
  const { t } = useLanguage();
  const currentUser = useStore((state) => state.currentUser);
  return (
    <div className="mx-auto max-w-full space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-extrabold text-[#111827] tracking-tight">{t('Πώς λειτουργούν οι ομάδες', 'How groups work')}</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-gray-600 max-w-xl">
          {t('Το Nakamas είναι μια πλατφόρμα συνοδών εκδηλώσεων, φτιαγμένη για να σας βοηθήσει να βρείτε παρέα για τις εμπειρίες που αγαπάτε. Βασιζόμαστε στην ξεκάθαρη οργάνωση, τον συντονισμό μικρών ομάδων και την επαληθευμένη πρόσβαση για να διασφαλίσουμε ότι όλοι περνούν καλά.', 'Nakamas is an event companion platform built to help you find company for the experiences you love. We rely on clear organization, small group coordination, and verified access to ensure everyone has a comfortable time.')}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
         {/* Current Status */}
         <Card className="p-5 space-y-5">
           <div>
             <h2 className="text-[10px] font-bold text-[#6B7280] uppercase tracking-widest mb-3 flex items-center gap-1.5">
               <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> {t('Η Κατάσταση Εμπιστοσύνης μου', 'My Trust Status')}
             </h2>
             <p className="text-[13px] font-bold text-[#111827]">{t('Επίπεδο 5 - Εξαιρετικά Αξιόπιστος', 'Tier 5 - Highly Reliable')}</p>
           </div>
           
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                 <Mail className="h-3.5 w-3.5 text-gray-400" /> {t('Email', 'Email')}
               </div>
               <Badge variant="success" className="text-[9px] px-1.5 py-0.5">{t('Επαληθεύτηκε', 'Verified')}</Badge>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                 <Phone className="h-3.5 w-3.5 text-gray-400" /> {t('Τηλέφωνο', 'Phone')}
               </div>
               <Badge variant="success" className="text-[9px] px-1.5 py-0.5">{t('Επαληθεύτηκε', 'Verified')}</Badge>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                 <CreditCard className="h-3.5 w-3.5 text-gray-400" /> {t('Πληρωμή', 'Payment')}
               </div>
               <Badge variant="success" className="text-[9px] px-1.5 py-0.5">{t('Επαληθεύτηκε', 'Verified')}</Badge>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                 <UserCheck className="h-3.5 w-3.5 text-gray-300" /> {t('Ταυτότητα (Αστυνομική)', 'Government ID')}
               </div>
               <span className="text-[9px] text-indigo-600 font-bold cursor-pointer hover:underline uppercase tracking-wider">{t('Επαλήθευση Τώρα', 'Verify Now')}</span>
             </div>
           </div>
           
           <div className="pt-4 border-t border-gray-100">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-2 text-[13px] font-bold text-[#111827]">
                 <Award className="h-4 w-4 text-amber-500" /> {t('Βαθμολογία Αξιοπιστίας', 'Reliability Score')}
               </div>
               <span className="text-[13px] font-bold text-emerald-600">{currentUser.reliabilityScore}%</span>
             </div>
             <p className="text-[11px] text-gray-500 mt-1.5 font-medium leading-relaxed">{t('Κερδίζεται από την έγκαιρη συμμετοχή σε εκδηλώσεις.', 'Earned through showing up to events on time.')}</p>
           </div>
         </Card>

         {/* Info */}
         <div className="space-y-3">
            <Card className="p-4 md:p-5 bg-gray-50 border-none shadow-none">
              <h3 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-1.5">{t('Συντονισμός Ομάδας', 'Group Coordination')}</h3>
              <p className="text-[11px] md:text-xs text-gray-600 leading-relaxed">{t('Οι εκδηλώσεις είναι δημόσιες, αλλά η δική σας ομάδα είναι ιδιωτική. Ορισμένες δραστηριότητες (όπως πεζοπορίες ή ιδιωτικοί χώροι) απαιτούν επαληθευμένη συμμετοχή για να διασφαλιστεί μια δομημένη και αξιόπιστη δυναμική στην ομάδα.', 'Events are public, but your specific group is private. Some activities (like hikes and private venues) require verified participation to ensure a structured, reliable group dynamic.')}</p>
            </Card>
            <Card className="p-4 md:p-5 bg-gray-50 border-none shadow-none">
              <h3 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-1.5">{t('Προτεραιότητα στην ιδιωτικότητα', 'Privacy first')}</h3>
              <p className="text-[11px] md:text-xs text-gray-600 leading-relaxed">{t('Δεν εμφανίζουμε ποτέ το τηλέφωνο, το email ή τις λεπτομέρειες πληρωμής σας σε άλλους χρήστες. Μοιράζεστε το προφίλ σας μόνο με την επιβεβαιωμένη ομάδα σας όταν και εφόσον το επιλέξετε.', 'We never show your phone, email, or payment details to other users. You only share your profile with your confirmed group when and if you choose to.')}</p>
            </Card>
            <Card className="p-4 md:p-5 bg-gray-50 border-none shadow-none">
              <h3 className="text-[10px] font-bold text-[#111827] uppercase tracking-wider mb-1.5">{t('Όχι δημόσιες βαθμολογίες ατόμων', 'No public person ratings')}</h3>
              <p className="text-[11px] md:text-xs text-gray-600 leading-relaxed">{t('Δεν χρησιμοποιούμε αστέρια για τους ανθρώπους. Παρακολουθούμε εσωτερικά αυτούς που δεν εμφανίζονται και δίνουμε σε όλους ένα σκορ αξιοπιστίας, το οποίο βοηθά στη διασφάλιση της ποιότητας των ομάδων.', 'We do not use star ratings for people. We track no-shows internally and give everyone a reliability score, which helps ensure group quality.')}</p>
            </Card>
         </div>
      </div>
    </div>
  );
}
