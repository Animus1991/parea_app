import React, { useState } from 'react';
import { Search, Book, MessageCircle, FileText, ChevronRight, ChevronDown, Zap, Shield, CreditCard, Users } from 'lucide-react';
import { Card } from '../common/Card';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';

function useAccent() {
  const theme = useStore((s) => s.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';
  const base = {
    isDark,
    head: isDark ? 'text-white' : 'text-[#111827]',
    sub: isDark ? 'text-gray-400' : 'text-gray-600',
    muted: isDark ? 'text-gray-500' : 'text-gray-400',
    faqAnswer: isDark ? 'text-gray-400' : 'text-gray-600',
    chevron: isDark ? 'text-gray-500' : 'text-gray-400',
    topicBg: isDark ? 'border-gray-700/40 bg-gray-800/30 hover:bg-gray-700/30' : 'border-gray-100 bg-white hover:shadow-soft',
    topicLabel: isDark ? 'text-white' : 'text-[#111827]',
  };

  if (theme === 'vibrant' || theme === 'vibrant-dark') return {
    ...base,
    heroBg: isDark ? 'bg-fuchsia-800/60' : 'bg-fuchsia-600',
    heroSub: isDark ? 'text-fuchsia-300' : 'text-fuchsia-100',
    heroCircle: 'bg-white opacity-10',
    inputBg: 'bg-white text-gray-900 focus:ring-white',
    sectionHead: isDark ? 'text-gray-500' : 'text-gray-400',
    articleCat: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600',
    articleHover: isDark ? 'hover:border-fuchsia-700' : 'hover:border-fuchsia-200',
    contactIcon: isDark ? 'text-fuchsia-400' : 'text-fuchsia-600',
    contactBtn: isDark ? 'bg-fuchsia-600 hover:bg-fuchsia-700' : 'bg-fuchsia-600 hover:bg-fuchsia-700',
  };
  if (theme === 'neon' || theme === 'neon-dark' || theme === 'bento-dark') return {
    ...base,
    heroBg: isDark ? 'bg-emerald-800/50' : 'bg-emerald-600',
    heroSub: isDark ? 'text-emerald-300' : 'text-emerald-100',
    heroCircle: 'bg-white opacity-10',
    inputBg: 'bg-white text-gray-900 focus:ring-white',
    sectionHead: isDark ? 'text-gray-500' : 'text-gray-400',
    articleCat: isDark ? 'text-emerald-400' : 'text-emerald-600',
    articleHover: isDark ? 'hover:border-emerald-700' : 'hover:border-emerald-200',
    contactIcon: isDark ? 'text-emerald-400' : 'text-emerald-600',
    contactBtn: isDark ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700',
  };
  if (theme === 'bento') return {
    ...base,
    heroBg: 'bg-indigo-600',
    heroSub: 'text-indigo-100',
    heroCircle: 'bg-white opacity-10',
    inputBg: 'bg-white text-gray-900 focus:ring-white',
    sectionHead: 'text-gray-400',
    articleCat: 'text-indigo-600',
    articleHover: 'hover:border-indigo-200',
    contactIcon: 'text-indigo-600',
    contactBtn: 'bg-indigo-600 hover:bg-indigo-700',
  };
  // Classic
  return {
    ...base,
    heroBg: 'bg-cyan-600',
    heroSub: 'text-cyan-100',
    heroCircle: 'bg-white opacity-10',
    inputBg: 'bg-white text-gray-900 focus:ring-white',
    sectionHead: 'text-gray-400',
    articleCat: 'text-cyan-600',
    articleHover: 'hover:border-cyan-200',
    contactIcon: 'text-cyan-600',
    contactBtn: 'bg-cyan-600 hover:bg-cyan-700',
  };
}

export default function HelpCenterPageContent() {
  const { t } = useLanguage();
  const a = useAccent();
  const [search, setSearch] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const articles = [
    { id: 1, title: t('Πώς να αναφέρετε μια μη εμφάνιση', 'How to report a no-show'), category: t('Εμπιστοσύνη & Ασφάλεια', 'Trust & Safety') },
    { id: 2, title: t('Επιστροφή χρημάτων για ακυρωμένη εκδήλωση', 'Refund for canceled event'), category: t('Πληρωμές', 'Payments') },
    { id: 3, title: t('Συμβουλές διοργάνωσης', 'Tips for hosting your first meetup'), category: t('Διοργανωτές', 'Organizers') },
    { id: 4, title: t('Αλλαγή ειδοποιήσεων', 'Change notification preferences'), category: t('Λογαριασμός', 'Account') },
  ];

  const faqs = [
    { id: 1, q: t('Πώς λειτουργούν οι ομάδες;', 'How do groups work?'), a: t('Οι ομάδες σχηματίζονται αυτόματα όταν αρκετά άτομα εκδηλώσουν ενδιαφέρον. Μόλις γεμίσει η ομάδα, αποκαλύπτεται το σημείο συνάντησης.', 'Groups form automatically when enough people express interest. Once the group fills up, the meeting point is revealed.') },
    { id: 2, q: t('Τι γίνεται αν κάποιος δεν εμφανιστεί;', 'What if someone doesn\'t show up?'), a: t('Η αξιοπιστία του μειώνεται και μπορεί να λάβει προσωρινό αποκλεισμό.', 'Their reliability score decreases and they may receive a temporary ban.') },
    { id: 3, q: t('Πώς αυξάνω το Trust Score;', 'How to increase Trust Score?'), a: t('Επαληθεύστε email, τηλέφωνο, ταυτότητα. Παρακολουθήστε εκδηλώσεις τακτικά.', 'Verify email, phone and ID. Attend events regularly.') },
    { id: 4, q: t('Μπορώ να ακυρώσω συμμετοχή;', 'Can I cancel?'), a: t('Ναι, μέχρι 24 ώρες πριν. Αργότερη ακύρωση επηρεάζει το score σας.', 'Yes, up to 24 hours before. Later cancellation affects your score.') },
  ];

  const popularTopics = [
    { label: t('Ασφάλεια', 'Safety'), icon: Shield, color: a.isDark ? 'text-red-400 bg-red-900/20' : 'text-red-600 bg-red-50' },
    { label: t('Πληρωμές', 'Payments'), icon: CreditCard, color: a.isDark ? 'text-emerald-400 bg-emerald-900/20' : 'text-emerald-600 bg-emerald-50' },
    { label: t('Ομάδες', 'Groups'), icon: Users, color: a.isDark ? 'text-blue-400 bg-blue-900/20' : 'text-blue-600 bg-blue-50' },
    { label: t('Γρήγορη Βοήθεια', 'Quick Help'), icon: Zap, color: a.isDark ? 'text-amber-400 bg-amber-900/20' : 'text-amber-600 bg-amber-50' },
  ];

  const filtered = articles.filter(ar => ar.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-full mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in pb-20 md:pb-0">
      {/* Hero */}
      <div className={cn("text-white rounded-2xl p-8 text-center shadow-md relative overflow-hidden", a.heroBg)}>
        <div className={cn("absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full", a.heroCircle)}></div>
        <div className={cn("absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full", a.heroCircle)}></div>
        <h1 className="text-xl md:text-2xl font-black mb-2 relative z-10">{t('Κέντρο Βοήθειας', 'Help Center')}</h1>
        <p className={cn("text-base font-medium mb-6 relative z-10", a.heroSub)}>{t('Πώς μπορούμε να βοηθήσουμε;', 'How can we help you?')}</p>
        <div className="relative max-w-md mx-auto z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Αναζήτηση άρθρων...', 'Search articles...')}
            className={cn("w-full pl-10 pr-4 py-2.5 rounded-xl text-base font-medium focus:outline-none focus:ring-2", a.inputBg)}
          />
        </div>
      </div>

      {/* Popular Topics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {popularTopics.map(topic => {
          const Icon = topic.icon;
          return (
            <button key={topic.label} className={cn("flex items-center gap-2 p-3 rounded-xl border transition-all", a.topicBg)}>
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", topic.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={cn("text-sm font-bold", a.topicLabel)}>{topic.label}</span>
            </button>
          );
        })}
      </div>

      {/* FAQ */}
      <div>
        <h2 className={cn("text-[11px] font-bold tracking-wider uppercase mb-3", a.sectionHead)}>{t('Συχνές Ερωτήσεις', 'FAQ')}</h2>
        <div className="space-y-2">
          {faqs.map(faq => (
            <Card key={faq.id} className="overflow-hidden">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                className="w-full p-4 flex items-center justify-between text-left"
              >
                <span className={cn("font-bold text-sm pr-4", a.head)}>{faq.q}</span>
                <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform", a.chevron, expandedFAQ === faq.id && 'rotate-180')} />
              </button>
              {expandedFAQ === faq.id && (
                <div className="px-4 pb-4 -mt-1">
                  <p className={cn("text-sm font-medium leading-relaxed", a.faqAnswer)}>{faq.a}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Articles */}
      <div>
        <h2 className={cn("text-[11px] font-bold tracking-wider uppercase mb-3", a.sectionHead)}>{t('Άρθρα Βοήθειας', 'Help Articles')}</h2>
        <div className="space-y-3">
          {filtered.map(article => (
            <Card key={article.id} className={cn("p-4 flex items-center justify-between cursor-pointer transition-colors", a.articleHover)}>
              <div>
                <span className={cn("text-xs font-bold tracking-wide", a.articleCat)}>{article.category}</span>
                <h3 className={cn("font-bold text-base mt-0.5", a.head)}>{article.title}</h3>
              </div>
              <ChevronRight className={cn("w-4 h-4 shrink-0", a.chevron)} />
            </Card>
          ))}
        </div>
      </div>

      {/* Contact */}
      <Card className="p-6 text-center">
        <MessageCircle className={cn("w-8 h-8 mx-auto mb-3", a.contactIcon)} />
        <h3 className={cn("font-bold mb-1", a.head)}>{t('Χρειάζεστε βοήθεια;', 'Need more help?')}</h3>
        <p className={cn("text-sm mb-2", a.sub)}>{t('Επικοινωνήστε μαζί μας', 'Contact our support team')}</p>
        <div className="flex items-center justify-center gap-1.5 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-bold text-green-500">{t('Online τώρα', 'Online now')} • ~2min</span>
        </div>
        <button className={cn("px-4 py-2 text-white text-sm font-bold rounded-lg transition-colors", a.contactBtn)}>
          {t('Αποστολή μηνύματος', 'Send message')}
        </button>
      </Card>
    </div>
  );
}
