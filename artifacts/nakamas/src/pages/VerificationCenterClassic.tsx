import React, { useRef } from 'react';
import { ShieldCheck, UserCheck, Smartphone, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useLanguage } from "../lib/i18n";
import { useStore } from '../store';
import { toast } from 'sonner';

export default function VerificationCenterClassic() {
    const { t } = useLanguage();
    const currentUser = useStore((state) => state.currentUser);
    const idUploadRef = useRef<HTMLInputElement>(null);

    const emailVerified = currentUser?.emailVerified ?? true;
    const phoneVerified = currentUser?.phoneVerified ?? false;
    const idVerified = currentUser?.idVerified ?? false;
    const stepsCompleted = [emailVerified, phoneVerified, idVerified].filter(Boolean).length;
    const totalSteps = 3;
    const progressPct = Math.round((stepsCompleted / totalSteps) * 100);

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[20.104264919475px] md:text-[26.7902365993px] font-bold text-[#111827]">{t(`Κέντρο Επαλήθευσης`, `Verification Center`)}</h1>
          <p className="text-gray-500 font-medium text-[13.551608211075px] md:text-[14.626916949961px] mt-1">{t(`Επαληθεύστε την ταυτότητά σας για μεγαλύτερη ασφάλεια`, `Verify your identity for greater safety`)}</p>
        </div>
      </div>

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-4 mt-6">
        <div className="w-12 h-[42px] bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
           <ShieldCheck className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-emerald-900 text-[15.083739px]">{t(`Πρόοδος Επαλήθευσης`, `Verification Progress`)}</h2>
          <p className="text-[13.0815px] text-emerald-700 mt-1 mb-3">{stepsCompleted} {t(`από`, `of`)} {totalSteps} {t(`βήματα ολοκληρώθηκαν`, `steps completed`)}</p>
          <div className="w-full bg-emerald-200 rounded-full h-2">
            <div className="bg-emerald-600 h-2 rounded-full transition-all" style={{ width: `${progressPct}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
           <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-bold text-[15.083739px] text-[#111827]">{t(`Email Επαλήθευση`, `Email Verification`)}</h3>
                    <p className="text-[10.90125px] text-gray-500 font-bold tracking-wider mt-0.5">{t(`Ολοκληρώθηκε`, `Completed`)}</p>
                 </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
           </div>
        </Card>

        <Card className="p-5">
           <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${phoneVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                    <Smartphone className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-bold text-[15.083739px] text-[#111827]">{t(`Τηλέφωνο`, `Phone Number`)}</h3>
                    <p className={`text-[10.90125px] font-bold tracking-wider mt-0.5 ${phoneVerified ? 'text-emerald-600' : 'text-gray-400'}`}>{phoneVerified ? t(`Ολοκληρώθηκε`, `Completed`) : t(`Σε εκκρεμότητα`, `Pending`)}</p>
                 </div>
              </div>
              {phoneVerified && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
           </div>
           <p className="text-[13.0815px] text-gray-500 mb-3">{t(`Θα σας στείλουμε ένα SMS με κωδικό επαλήθευσης.`, `We'll send you an SMS with a verification code.`)}</p>
           {!phoneVerified && (
             <Button
               variant="outline"
               size="sm"
               className="w-full text-[12.82117815px]"
               onClick={() => toast.info(t(`Αποστολή SMS...`, `Sending SMS...`), { description: t(`Θα σας στείλουμε κωδικό στο εγγεγραμμένο τηλέφωνο.`, `We'll send a code to your registered number.`) })}
             >{t(`Επαλήθευση Τώρα`, `Verify Now`)}</Button>
           )}
        </Card>

        <Card className="p-5 md:col-span-2">
           <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${idVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                    <FileText className="w-5 h-5" />
                 </div>
                 <div>
                    <h3 className="font-bold text-[15.083739px] text-[#111827]">{t(`Ταυτότητα / Διαβατήριο`, `Government ID`)}</h3>
                    <p className={`text-[10.90125px] font-bold tracking-wider mt-0.5 ${idVerified ? 'text-emerald-600' : 'text-gray-400'}`}>{idVerified ? t(`Ολοκληρώθηκε`, `Completed`) : t(`Προαιρετικό`, `Optional`)}</p>
                 </div>
              </div>
              {idVerified ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <span className="bg-gray-100 text-gray-600 text-[10.90125px] font-bold px-2 py-0.5 rounded-full tracking-wide">{t(`Προχωρημένο`, `Advanced`)}</span>}
           </div>
           <p className="text-[14.908928449356px] text-gray-500 mb-4 max-w-xl">{t(`Ανεβάστε φωτογραφία της ταυτότητάς σας για πρόσβαση σε εκδηλώσεις υψηλής ασφάλειας.`, `Upload a photo of your ID to access high-safety events.`)}</p>
           {!idVerified && (
             <div className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-dashed border-gray-200">
               <div className="flex gap-3 text-[14.535px] text-gray-500 font-medium">
                  <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4"/>{t(`Ασφαλές`, `Secure`)}</span>
                  <span className="flex items-center gap-1"><UserCheck className="w-4 h-4"/>{t(`Ιδιωτικό`, `Private`)}</span>
               </div>
               <Button
                 size="sm"
                 className="w-full sm:w-auto shrink-0 shadow-sm"
                 onClick={() => idUploadRef.current?.click()}
               >{t(`Μεταφόρτωση`, `Upload`)}</Button>
               <input
                 ref={idUploadRef}
                 type="file"
                 accept="image/*"
                 className="hidden"
                 onChange={() => toast.success(t(`Η ταυτότητα μεταφορτώθηκε. Θα ελεγχθεί σε 24 ώρες.`, `ID uploaded. It will be reviewed within 24 hours.`))}
               />
             </div>
           )}
        </Card>
      </div>

      {/* Benefits per tier */}
      <Card className="p-5">
        <h3 className="text-[12.5px] font-bold text-[#111827] tracking-wide mb-4">{t(`Τι ξεκλειδώνετε`, `What you unlock`)}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-cyan-600" />
              <span className="text-[13.8px] font-bold text-cyan-900">Email</span>
            </div>
            <ul className="space-y-1 text-[12.5px] text-gray-600 font-medium">
              <li>• {t(`Βασική πρόσβαση`, `Basic access`)}</li>
              <li>• {t(`Εγγραφή σε ομάδες`, `Join groups`)}</li>
              <li>• {t(`Ομαδικές συνομιλίες`, `Group chats`)}</li>
            </ul>
            <span className="mt-2 inline-block text-[11.2px] font-bold text-cyan-600 bg-white px-2 py-0.5 rounded-full">~1 {t(`λεπτό`, `min`)}</span>
          </div>
          <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4 text-purple-600" />
              <span className="text-[13.8px] font-bold text-purple-900">{t(`Τηλέφωνο`, `Phone`)}</span>
            </div>
            <ul className="space-y-1 text-[12.5px] text-gray-600 font-medium">
              <li>• {t(`Δημιουργία εκδηλώσεων`, `Create events`)}</li>
              <li>• {t(`Trust Score +15%`, `Trust Score +15%`)}</li>
              <li>• {t(`Πρόσβαση σε ιδιωτικά events`, `Access private events`)}</li>
            </ul>
            <span className="mt-2 inline-block text-[11.2px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded-full">~2 {t(`λεπτά`, `min`)}</span>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span className="text-[13.8px] font-bold text-amber-900">{t(`Ταυτότητα`, `ID`)}</span>
            </div>
            <ul className="space-y-1 text-[12.5px] text-gray-600 font-medium">
              <li>• {t(`Πλήρης πρόσβαση`, `Full access`)}</li>
              <li>• {t(`Trust Score +25%`, `Trust Score +25%`)}</li>
              <li>• {t(`Organizer badge`, `Organizer badge`)}</li>
            </ul>
            <span className="mt-2 inline-block text-[11.2px] font-bold text-amber-600 bg-white px-2 py-0.5 rounded-full">~5 {t(`λεπτά`, `min`)}</span>
          </div>
        </div>
      </Card>

      {/* Trust Score Impact */}
      <Card className="p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white font-black text-[18px] shrink-0">72%</div>
        <div className="flex-1">
          <p className="text-[13.8px] font-bold text-[#111827]">{t(`Τρέχον Trust Score`, `Current Trust Score`)}</p>
          <p className="text-[11.2px] text-gray-500 font-medium mt-0.5">{t(`Ολοκληρώστε την επαλήθευση τηλεφώνου για +15%`, `Complete phone verification for +15%`)}</p>
        </div>
        <div className="text-right">
          <span className="text-[12.5px] font-bold text-emerald-600">→ 87%</span>
          <p className="text-[11.2px] text-gray-400 font-medium">{t(`μετά`, `after`)}</p>
        </div>
      </Card>
    </div>
  );
}
