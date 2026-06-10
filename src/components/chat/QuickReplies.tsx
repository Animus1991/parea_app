import { useLanguage } from '../../lib/i18n';

const REPLIES = [
  { el: 'Έρχομαι', en: "I'm on my way" },
  { el: 'Έφτασα', en: 'I arrived' },
  { el: 'Θα αργήσω ~10′', en: "I'll be ~10 min late" },
  { el: 'Στην είσοδο;', en: 'Meet at the entrance?' },
  { el: 'Καφές πριν;', en: 'Coffee before?' },
  { el: 'Τα λέμε εκεί', en: 'See you there' },
  { el: 'Χρειάζομαι βοήθεια', en: 'Need help' },
];

export function QuickReplies({ onSelect, disabled }: { onSelect: (text: string) => void; disabled?: boolean }) {
  const { t } = useLanguage();
  if (disabled) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto px-3 pb-2 scrollbar-none" role="list">
      {REPLIES.map((r) => (
        <button
          key={r.en}
          type="button"
          role="listitem"
          onClick={() => onSelect(t(r.el, r.en))}
          className="shrink-0 text-xs font-bold px-2.5 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-cyan-600/20 text-gray-300"
        >
          {t(r.el, r.en)}
        </button>
      ))}
    </div>
  );
}
