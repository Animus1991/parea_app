import { Calendar, MapPin } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';
import { GROUP_CHAT_STARTERS } from '../../lib/chatSystemCopy';

export function GroupChatThreadStarter({
  eventTitle,
  whenLabel,
  whereLabel,
  onPick,
}: {
  eventTitle: string;
  whenLabel: string;
  whereLabel?: string;
  onPick: (text: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="mx-4 my-3 rounded-2xl border border-dashed border-border bg-white/90 dark:bg-surface-raised/90 px-4 py-3.5">
      <p className="text-sm font-bold text-ink text-center">
        {t('Η ομάδα είναι έτοιμη', 'Your group is ready')}
      </p>
      <p className="text-xs text-ink-muted text-center mt-1 leading-relaxed">
        {t(
          `Συντονιστείτε για «${eventTitle}». Πείτε γεια και συμφωνήστε πού θα συναντηθείτε.`,
          `Coordinate for “${eventTitle}”. Say hi and agree where to meet.`,
        )}
      </p>
      <p className="text-xs font-medium text-ink text-center mt-2.5 flex items-center justify-center gap-1.5 flex-wrap">
        <Calendar className="h-3 w-3 shrink-0 text-ink-muted" aria-hidden />
        <span>{whenLabel}</span>
        {whereLabel ? (
          <>
            <span className="text-ink-muted" aria-hidden>
              ·
            </span>
            <MapPin className="h-3 w-3 shrink-0 text-ink-muted" aria-hidden />
            <span>{whereLabel}</span>
          </>
        ) : null}
      </p>
      <div
        className="flex flex-wrap justify-center gap-1.5 mt-3"
        role="toolbar"
        aria-label={t('Πρώτα μηνύματα', 'First messages')}
      >
        {GROUP_CHAT_STARTERS.map((p) => (
          <button
            key={p[1]}
            type="button"
            onClick={() => onPick(t(p[0], p[1]))}
            className="text-xs font-semibold px-2.5 py-1 min-h-8 rounded-full border border-border-strong bg-ink/5 hover:bg-brand/20 text-ink transition-colors"
          >
            {t(p[0], p[1])}
          </button>
        ))}
      </div>
    </div>
  );
}
