import { useState } from 'react';
import { CalendarPlus, Check, Code2, Copy, Download, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useStore } from '../../store';
import { useLanguage } from '../../lib/i18n';
import { buildOrganizerIcs, organizerCalendarUrl } from '../../lib/organizerCalendar';
import { downloadIcsBlob } from '../../lib/eventCalendarExport';
import { Button } from '../common/Button';
import { cn } from '../../lib/utils';

/**
 * Organizer calendar (Luma, adapted): follow in the app, subscribe with a
 * live .ics feed in any calendar app, or put a small widget on the
 * organizer's own site.
 */
export function OrganizerCalendarCard({ organizerId, organizerName, className }: { organizerId: string; organizerName: string; className?: string }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const followed = useStore((s) => s.followedOrganizerIds.includes(organizerId));
  const toggleFollow = useStore((s) => s.toggleFollowOrganizer);
  const events = useStore((s) => s.events);
  const groups = useStore((s) => s.groups);
  const [copied, setCopied] = useState<'feed' | 'embed' | null>(null);
  const origin = window.location.origin;
  const feed = organizerCalendarUrl(origin, organizerId);
  const embed = `<iframe src="${origin}/embed/organizer/${encodeURIComponent(organizerId)}" title="${organizerName} · Nakamas" width="100%" height="420" style="border:0" loading="lazy"></iframe>`;

  const copy = async (what: 'feed' | 'embed', text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  return (
    <section className={cn('rounded-2xl border border-border bg-surface-raised p-4', className)} aria-labelledby="org-cal-title">
      <h2 id="org-cal-title" className="flex items-center gap-2 text-sm font-bold text-ink">
        <CalendarPlus className="h-4 w-4" aria-hidden /> {t('Ημερολόγιο διοργανωτή', 'Organizer calendar')}
      </h2>
      <p className="mt-1 text-xs font-medium text-ink-muted">
        {t('Οι νέες εκδηλώσεις μπαίνουν μόνες τους στο ημερολόγιό σου, με το πόσες παρέες σχηματίζονται.', 'New events land in your calendar by themselves, with how many groups are forming.')}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={followed ? 'outline' : 'primary'}
          onClick={() => {
            toggleFollow(organizerId);
            toast.success(
              followed ? t('Έπαψες να ακολουθείς', 'Unfollowed') : t('Ακολουθείς τον διοργανωτή', 'Following the organizer'),
              followed
                ? undefined
                : {
                    action: {
                      label: t('Ημερολόγιο', 'Calendar'),
                      onClick: () => navigate('/agenda'),
                    },
                  },
            );
          }}
          aria-pressed={followed}
        >
          <Star className="mr-1.5 h-4 w-4" aria-hidden /> {followed ? t('Ακολουθείς', 'Following') : t('Ακολούθησε', 'Follow')}
        </Button>
        <a href={feed.webcal} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-bold text-ink hover:border-border-strong">
          <CalendarPlus className="h-4 w-4" aria-hidden /> {t('Συνδρομή στο ημερολόγιο', 'Subscribe in calendar')}
        </a>
        <Button size="sm" variant="ghost" onClick={() => copy('feed', feed.https)}>
          {copied === 'feed' ? <Check className="mr-1.5 h-4 w-4" aria-hidden /> : <Copy className="mr-1.5 h-4 w-4" aria-hidden />}
          {copied === 'feed' ? t('Αντιγράφηκε', 'Copied') : t('Σύνδεσμος .ics', '.ics link')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            downloadIcsBlob(buildOrganizerIcs({ id: organizerId, name: organizerName }, events, groups, origin), `nakamas-${organizerId}.ics`);
            toast.success(t('Το ημερολόγιο εξήχθη', 'Calendar exported'));
          }}
        >
          <Download className="mr-1.5 h-4 w-4" aria-hidden /> {t('Λήψη', 'Download')}
        </Button>
      </div>
      <details className="mt-3">
        <summary className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 text-xs font-bold text-ink">
          <Code2 className="h-4 w-4" aria-hidden /> {t('Widget για την ιστοσελίδα σου', 'Widget for your site')}
        </summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-all rounded-xl border border-border bg-surface p-3 text-2xs text-ink">{embed}</pre>
        <Button size="sm" variant="outline" className="mt-2" onClick={() => copy('embed', embed)}>
          {copied === 'embed' ? t('Αντιγράφηκε', 'Copied') : t('Αντιγραφή κώδικα', 'Copy code')}
        </Button>
      </details>
    </section>
  );
}
