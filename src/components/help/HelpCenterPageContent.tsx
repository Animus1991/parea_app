import React, { useState, useMemo } from 'react';
import { CopilotInlinePrompt } from '../copilot/CopilotInlinePrompt';
import { openCopilot } from '../../ai/copilot';
import { Bot } from 'lucide-react';
import { Search, Book, MessageCircle, FileText, ChevronRight, ChevronDown, Zap, Shield, CreditCard, Users } from 'lucide-react';
import { Card } from '../common/Card';
import { useLanguage } from '../../lib/i18n';
import { cn } from '../../lib/utils';
import { usePageContrast } from '../../hooks/usePageContrast';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isLiveSupportConfigured, openLiveSupport } from '../../services/support';

export default function HelpCenterPageContent() {
  const { t, tu } = useLanguage();
  const a = usePageContrast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const liveSupport = isLiveSupportConfigured();

  const articles = [
    { id: 1, title: t('Πώς να αναφέρετε μια μη εμφάνιση', 'How to report a no-show'), category: t('Εμπιστοσύνη & Ασφάλεια', 'Trust & Safety'), content: t('Ανοίξτε τη σελίδα της εκδήλωσης και πατήστε «Αναφορά». Καταγράψτε ποιος δεν εμφανίστηκε εντός 24 ωρών. Η ομάδα εμπιστοσύνης εξετάζει την αναφορά και ενημερώνει το Trust Score του χρήστη.', 'Open the event page and tap "Report". Record who didn\'t show up within 24 hours. Our trust team reviews the report and updates the user\'s Trust Score.') },
    { id: 2, title: t('Επιστροφή χρημάτων για ακυρωμένη εκδήλωση', 'Refund for canceled event'), category: t('Πληρωμές', 'Payments'), content: t('Αν ο διοργανωτής ακυρώσει την εκδήλωση, η προέγκριση πληρωμής ακυρώνεται αυτόματα εντός 3-5 εργάσιμων ημερών. Για χρεώσεις που έχουν ήδη ολοκληρωθεί, η επιστροφή γίνεται στο αρχικό μέσο πληρωμής.', 'If the organizer cancels, the payment pre-authorization is voided automatically within 3-5 business days. For completed charges, refunds go back to the original payment method.') },
    { id: 3, title: t('Συμβουλές διοργάνωσης', 'Tips for hosting your first meetup'), category: t('Διοργανωτές', 'Organizers'), content: t('Ξεκινήστε με μικρή ομάδα 3-5 ατόμων, ορίστε ξεκάθαρο σημείο συνάντησης, στείλτε ανακοίνωση την προηγούμενη μέρα και επιβεβαιώστε τις παρουσίες μετά το event για να χτίσετε Trust Score.', 'Start with a small 3-5 person group, set a clear meeting point, send an announcement the day before, and confirm attendance after the event to build Trust Score.') },
    { id: 4, title: t('Αλλαγή ειδοποιήσεων', 'Change notification preferences'), category: t('Λογαριασμός', 'Account'), content: t('Πηγαίνετε Ρυθμίσεις → Ειδοποιήσεις και επιλέξτε ποιες ενημερώσεις θέλετε (νέα μηνύματα, αλλαγές εκδηλώσεων, υπενθυμίσεις). Οι αλλαγές αποθηκεύονται αυτόματα.', 'Go to Settings → Notifications and choose which updates you want (new messages, event changes, reminders). Changes save automatically.') },
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return articles.filter((ar) => {
      const matchesSearch = !q || ar.title.toLowerCase().includes(q) || ar.category.toLowerCase().includes(q);
      const matchesTopic = !topicFilter || ar.category.toLowerCase().includes(topicFilter.toLowerCase());
      return matchesSearch && matchesTopic;
    });
  }, [articles, search, topicFilter]);

  const filteredFaqs = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return faqs;
    return faqs.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [faqs, search]);

  const hasResults = filtered.length > 0 || filteredFaqs.length > 0;

  return (
    <div className="max-w-full mx-auto space-y-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
      {/* Hero */}
      <div className={cn("text-white rounded-2xl p-5 text-center shadow-soft-md relative overflow-hidden", a.heroBg)}>
        <div className={cn("absolute top-0 right-0 -mr-8 -mt-5 w-32 h-32 rounded-full", a.heroCircle)}></div>
        <div className={cn("absolute bottom-0 left-0 -ml-8 -mb-5 w-24 h-24 rounded-full", a.heroCircle)}></div>
        <h1 className="text-sm md:text-base font-black mb-2 relative z-10">{t('Κέντρο Βοήθειας', 'Help Center')}</h1>
        <p className={cn("text-base font-medium mb-4 relative z-10", a.heroSub)}>{t('Πώς μπορούμε να βοηθήσουμε;', 'How can we help you?')}</p>
        <div className="relative max-w-md mx-auto z-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('Αναζήτηση άρθρων...', 'Search articles...')}
            className={cn("search-control w-full h-9 pl-9 pr-3 rounded-xl focus:outline-none focus:ring-2", a.inputBg)}
          />
        </div>
      </div>

      {/* Popular Topics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {popularTopics.map(topic => {
          const Icon = topic.icon;
          return (
            <button
              key={topic.label}
              type="button"
              onClick={() => setTopicFilter(topicFilter === topic.label ? null : topic.label)}
              className={cn("flex items-center gap-2 p-3 rounded-xl border transition-all w-full", a.topicBg, topicFilter === topic.label && 'ring-2 ring-cyan-500/40')}
            >
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
        <h2 className={cn("text-xs font-bold tracking-wider uppercase mb-3", a.sectionHead)}>{tu('Συχνές Ερωτήσεις', 'FAQ')}</h2>
        <div className="space-y-2">
          {filteredFaqs.map(faq => (
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
        <h2 className={cn("text-xs font-bold tracking-wider uppercase mb-3", a.sectionHead)}>{tu('Άρθρα Βοήθειας', 'Help Articles')}</h2>
        <div className="space-y-3">
          {filtered.map(article => (
            <Card
              key={article.id}
              className={cn("p-4 cursor-pointer transition-colors", a.articleHover)}
              onClick={() => setExpandedArticle(expandedArticle === article.id ? null : article.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className={cn("text-xs font-bold tracking-wide", a.articleCat)}>{article.category}</span>
                  <h3 className={cn("font-bold text-base mt-0.5", a.head)}>{article.title}</h3>
                </div>
                <ChevronRight className={cn("w-4 h-4 shrink-0", a.chevron, expandedArticle === article.id && 'rotate-90')} />
              </div>
              {expandedArticle === article.id && (
                <p className={cn("text-sm font-medium leading-relaxed mt-3 pt-3 border-t border-gray-100", a.faqAnswer)}>{article.content}</p>
              )}
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card className="p-4 text-center">
              <p className={cn('text-sm font-medium', a.muted)}>{t('Κανένα άρθρο δεν ταιριάζει.', 'No articles match your search.')}</p>
            </Card>
          )}
        </div>
      </div>

      {!hasResults && search && (
        <Card className="p-4 text-center">
          <p className={cn('text-sm font-medium', a.muted)}>{t('Δεν βρέθηκαν αποτελέσματα. Δοκιμάστε άλλους όρους.', 'No results found. Try different terms.')}</p>
          <button
            type="button"
            onClick={() => openCopilot(search)}
            className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Bot className="h-4 w-4" aria-hidden />
            {t('Ρώτα το Nakamas AI', 'Ask Nakamas AI')}
          </button>
        </Card>
      )}

      <CopilotInlinePrompt title={{ el: 'Ρώτα το Nakamas AI αντί να ψάχνεις', en: 'Ask Nakamas AI instead of searching' }} />

      {/* Contact */}
      <Card className="p-4 text-center">
        <MessageCircle className={cn("w-8 h-8 mx-auto mb-3", a.contactIcon)} />
        <h3 className={cn("font-bold mb-1", a.head)}>{t('Χρειάζεστε βοήθεια;', 'Need more help?')}</h3>
        <p className={cn("text-sm mb-2", a.sub)}>{t('Επικοινωνήστε μαζί μας', 'Contact our support team')}</p>
        <div className="flex items-center justify-center gap-1.5 mb-4">
          {liveSupport ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-ink-muted">
                {t('Ζωντανή υποστήριξη διαθέσιμη', 'Live support available')}
              </span>
            </>
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-bold text-ink-muted">
                {t('Υποστήριξη demo (χωρίς live agent)', 'Demo support (no live agent)')}
              </span>
            </>
          )}
        </div>
        <button
          type="button"
          className={cn("px-4 py-2 text-white text-sm font-bold rounded-lg transition-colors", a.contactBtn)}
          onClick={() => {
            if (liveSupport && openLiveSupport()) {
              toast.success(t('Άνοιγμα καναλιού υποστήριξης…', 'Opening support channel…'));
              return;
            }
            toast.success(t('Το μήνυμα στάλθηκε (demo)', 'Message sent (demo)'));
            navigate('/report');
          }}
        >
          {liveSupport
            ? t('Επικοινωνία με υποστήριξη', 'Contact support')
            : t('Αποστολή μηνύματος', 'Send message')}
        </button>
      </Card>
    </div>
  );
}
