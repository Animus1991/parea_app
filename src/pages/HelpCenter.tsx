import React, { useState } from 'react';
import { Search, Book, MessageCircle, FileText, ChevronRight } from 'lucide-react';
import { Card } from '../components/common/Card';
import { useLanguage } from '../lib/i18n';

export default function HelpCenter() {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');

  const articles = [
    { id: 1, title: t('Πώς να αναφέρετε μια μη-εμφάνιση', 'How to report a no-show'), category: t('Εμπιστοσύνη & Ασφάλεια', 'Trust & Safety') },
    { id: 2, title: t('Λήψη επιστροφής χρημάτων για ακυρωμένη εκδήλωση', 'Getting a refund for a canceled event'), category: t('Πληρωμές', 'Payments') },
    { id: 3, title: t('Συμβουλές για τη διοργάνωση της πρώτης σας συνάντησης', 'Tips for hosting your first meetup'), category: t('Διοργανωτές', 'Organizers') },
    { id: 4, title: t('Αλλαγή των προτιμήσεων ειδοποιήσεων', 'Changing your notification preferences'), category: t('Λογαριασμός', 'Account') },
  ];

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      <div className="bg-indigo-600 text-white rounded-2xl p-8 mb-8 text-center shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
        <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10"></div>
        
        <h1 className="text-2xl md:text-3xl font-black mb-2 relative z-10">{t('Πώς μπορούμε να βοηθήσουμε;', 'How can we help?')}</h1>
        <p className="text-indigo-100 text-sm mb-6 relative z-10">{t('Αναζητήστε στη γνωσιακή μας βάση ή επικοινωνήστε με την ομάδα μας.', 'Search our knowledge base or get in touch with our team.')}</p>
        
        <div className="relative max-w-lg mx-auto z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Αναζήτηση για άρθρα, οδηγούς...', 'Search for articles, guides...')} 
            className="w-full pl-12 pr-4 py-3 md:py-4 rounded-xl border-0 shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-400/50 text-[#111827] text-base transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-indigo-100">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Book className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#111827] mb-1">{t('Οδηγοί & Εκμάθηση', 'Guides & Tutorials')}</h3>
          <p className="text-xs text-gray-500">{t('Μάθετε πώς να αξιοποιήσετε στο έπακρο το Nakamas.', 'Learn how to make the most out of Nakamas.')}</p>
        </Card>
        
        <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-indigo-100">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#111827] mb-1">{t('Πολιτικές', 'Policies')}</h3>
          <p className="text-xs text-gray-500">{t('Διαβάστε τους όρους, τις προϋποθέσεις και τις οδηγίες κοινότητας.', 'Read our terms, conditions, and community guidelines.')}</p>
        </Card>

        <Card className="p-6 text-center hover:shadow-md transition-shadow cursor-pointer border border-transparent hover:border-indigo-100">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-[#111827] mb-1">{t('Επικοινωνία με υποστήριξη', 'Contact Support')}</h3>
          <p className="text-xs text-gray-500">{t('Δεν μπορείτε να βρείτε την απάντηση; Επικοινωνήστε με την ομάδα μας.', 'Can\'t find the answer? Reach out to our team.')}</p>
        </Card>
      </div>

      <div className="pt-8">
        <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">{t('Συχνές Ερωτήσεις', 'Frequently Asked Questions')}</h2>
        <Card className="divide-y divide-gray-100">
          {articles.map((article) => (
             <div key={article.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer group">
                <div>
                   <p className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider mb-1">{article.category}</p>
                   <h4 className="text-sm font-medium text-[#111827] group-hover:text-indigo-600 transition-colors">{article.title}</h4>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
             </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
