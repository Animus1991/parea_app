import React, { useState } from 'react';
import { Search, Book, MessageCircle, FileText, ChevronRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { useLanguage } from "../lib/i18n";

export default function HelpCenter() {
    const { t } = useLanguage();
    
  const [search, setSearch] = useState('');

  const articles = [
    { id: 1, title: t(`Πώς να αναφέρετε μια μη εμφάνιση (no-show)`, `How to report a no-show`), category: t(`Εμπιστοσύνη & Ασφάλεια`, `Trust & Safety`) },
    { id: 2, title: t(`Επιστροφή χρημάτων για ακυρωμένη εκδήλωση`, `Refund for canceled event`), category: t(`Πληρωμές`, `Payments`) },
    { id: 3, title: t(`Συμβουλές για τη διοργάνωση της πρώτης σας συνάντησης`, `Tips for hosting your first meetup`), category: t(`Διοργανωτές`, `Organizers`) },
    { id: 4, title: t(`Αλλαγή προτιμήσεων ειδοποιήσεων`, `Change notification preferences`), category: t(`Λογαριασμός`, `Account`) },
  ];

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="bg-cyan-600 text-white rounded-2xl p-8 mb-8 text-center shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10"></div>
        
        <h1 className="text-2xl md:text-3xl font-black mb-2 relative z-10">
</h1>
</div>
</div>
  );
}
