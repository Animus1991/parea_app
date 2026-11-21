import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Newspaper, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useWallStore } from '../../store/wallStore';
import { formatPlanWhenDay } from '../../lib/dateLocale';
import { AudienceChip } from '../wall/AudienceChip';

/**
 * Admin › Μετριασμός › «Δημοσιεύσεις τοίχου»: reported posts with their
 * content and audience, one-tap remove / dismiss, and removed posts with
 * restore. Every action is written to the admin log.
 */
export function AdminWallModeration() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const issueReports = useStore((s) => s.issueReports);
  const users = useStore((s) => s.users);
  const resolveIssueReport = useStore((s) => s.resolveIssueReport);
  const logAdminAction = useStore((s) => s.logAdminAction);
  const posts = useWallStore((s) => s.posts);
  const moderatePost = useWallStore((s) => s.moderatePost);

  const reported = useMemo(() => {
    const open = issueReports.filter((r) => r.targetType === 'wall_post' && (r.status === 'open' || r.status === 'reviewing'));
    const byPost = new Map<string, { postId: string; reasons: string[]; reportIds: string[]; at: string }>();
    for (const r of open) {
      const id = r.targetId ?? '';
      const cur = byPost.get(id) ?? { postId: id, reasons: [], reportIds: [], at: r.createdAt };
      cur.reasons.push(r.description.split(' — ')[0]);
      cur.reportIds.push(r.id);
      byPost.set(id, cur);
    }
    return [...byPost.values()].sort((a, b) => b.reportIds.length - a.reportIds.length || b.at.localeCompare(a.at));
  }, [issueReports]);

  const removed = useMemo(() => posts.filter((p) => p.moderation?.status === 'removed'), [posts]);

  const remove = (postId: string) => {
    const res = moderatePost(postId, 'remove');
    if (!res.ok) return toast.error(t(res.reasonEl ?? '', res.reasonEn ?? ''));
    toast.success(t('Η δημοσίευση αφαιρέθηκε — ο συντάκτης ενημερώθηκε', 'Post removed — the author was notified'));
  };

  const dismiss = (postId: string, reportIds: string[]) => {
    for (const id of reportIds) resolveIssueReport(id, 'dismissed');
    logAdminAction('wall_report_dismissed', postId);
    toast.success(t('Οι αναφορές απορρίφθηκαν', 'Reports dismissed'));
  };

  const restore = (postId: string) => {
    const res = moderatePost(postId, 'restore');
    if (!res.ok) return toast.error(t(res.reasonEl ?? '', res.reasonEn ?? ''));
    toast.success(t('Η δημοσίευση επανήλθε', 'Post restored'));
  };

  return (
    <section aria-labelledby="admin-wall-title" className="space-y-3">
      <h2 id="admin-wall-title" className="card-heading-lg flex items-center gap-2 font-bold tracking-wide text-ink">
        <Newspaper className="h-4 w-4" aria-hidden /> {t('Δημοσιεύσεις τοίχου', 'Wall posts')}
        {reported.length > 0 && (
          <span className="rounded-full bg-red-600 px-2 py-0.5 text-2xs font-bold text-white">{reported.length}</span>
        )}
      </h2>

      {reported.length === 0 ? (
        <Card className="p-4">
          <p className="card-copy font-medium text-ink-muted">
            {t('Καμία αναφερμένη δημοσίευση. Οι αναφορές από τον Τοίχο εμφανίζονται εδώ.', 'No reported posts. Reports from the Wall appear here.')}
          </p>
        </Card>
      ) : (
        reported.map((r) => {
          const post = posts.find((p) => p.id === r.postId);
          const author = post ? users.find((u) => u.id === post.authorId) : undefined;
          return (
            <Card key={r.postId} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-muted">
                <ShieldAlert className="h-4 w-4 text-red-600" aria-hidden />
                <span className="font-bold text-ink">
                  {r.reportIds.length === 1 ? t('1 αναφορά', '1 report') : t(`${r.reportIds.length} αναφορές`, `${r.reportIds.length} reports`)}
                </span>
                <span>· {[...new Set(r.reasons)].join(', ')}</span>
                <span>· {formatPlanWhenDay(r.at, language)}</span>
              </div>
              {post ? (
                <>
                  <p className="text-sm font-bold text-ink">{author?.name ?? post.authorId}</p>
                  <p className="line-clamp-3 whitespace-pre-wrap text-sm font-medium text-ink">{post.text || t('(χωρίς κείμενο)', '(no text)')}</p>
                  <AudienceChip audience={post.audience} />
                </>
              ) : (
                <p className="text-sm font-medium text-ink-muted">{t('Η δημοσίευση έχει ήδη διαγραφεί.', 'The post was already deleted.')}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {post && post.moderation?.status !== 'removed' && (
                  <Button size="sm" variant="danger" onClick={() => remove(post.id)} className="gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" aria-hidden /> {t('Αφαίρεση δημοσίευσης', 'Remove post')}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => dismiss(r.postId, r.reportIds)} className="gap-1.5">
                  <XCircle className="h-3.5 w-3.5" aria-hidden /> {t('Απόρριψη αναφοράς', 'Dismiss report')}
                </Button>
                {post && (
                  <Button size="sm" variant="ghost" onClick={() => navigate(`/wall?post=${encodeURIComponent(post.id)}`)} className="gap-1.5">
                    <Eye className="h-3.5 w-3.5" aria-hidden /> {t('Προβολή', 'View')}
                  </Button>
                )}
              </div>
            </Card>
          );
        })
      )}

      {removed.length > 0 && (
        <Card className="space-y-2 p-4">
          <h3 className="text-sm font-bold text-ink">{t('Αφαιρεμένες δημοσιεύσεις', 'Removed posts')}</h3>
          <ul className="space-y-2">
            {removed.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">
                  <span className="font-bold">{users.find((u) => u.id === p.authorId)?.name ?? p.authorId}:</span> {p.text}
                </span>
                <Button size="sm" variant="ghost" onClick={() => restore(p.id)} className="gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> {t('Επαναφορά', 'Restore')}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
