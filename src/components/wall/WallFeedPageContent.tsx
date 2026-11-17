import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, Newspaper, ShieldCheck, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useWallAccess, useWallStore } from '../../store/wallStore';
import { canViewPost, graphConnected, tagShownOnProfile, visiblePosts } from '../../lib/audience';
import { WallActivityPanel } from './WallActivityPanel';
import { APP_TYPO } from '../../lib/typographyTokens';
import { cn } from '../../lib/utils';
import { Chip } from '../common/Chip';
import { EmptyState } from '../common/EmptyState';
import { CopilotInlinePrompt } from '../copilot/CopilotInlinePrompt';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { PostComposer } from './PostComposer';
import { WallPostList } from './WallPostList';
import { PostCard } from './PostCard';

type FeedFilter = 'all' | 'connections' | 'network' | 'mine';

/**
 * Τοίχος Nakamas — what your Nakamas (and the wider network, when they post
 * publicly) are planning. Every post shows its audience; nothing you were not
 * meant to see ever reaches this list (lib/audience.ts decides).
 */
export default function WallFeedPageContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const me = useStore((s) => s.currentUser);
  const posts = useWallStore((s) => s.posts);
  const hiddenByViewer = useWallStore((s) => s.hiddenPostIds);
  const feedSeenAt = useWallStore((s) => s.feedSeenAt);
  const markFeedSeen = useWallStore((s) => s.markFeedSeen);
  const access = useWallAccess();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [showHidden, setShowHidden] = useState(false);
  const composerRef = useRef<HTMLDivElement>(null);
  const myId = me?.id ?? null;
  const [searchParams, setSearchParams] = useSearchParams();
  // The audience explainer isone-time schooling: once understood, it leaves.
  const [audienceHintDismissed, setAudienceHintDismissed] = useState(() => {
    try {
      return localStorage.getItem('nakamas.wallAudienceHintDismissed') === '1';
    } catch {
      return false;
    }
  });
  const dismissAudienceHint = () => {
    setAudienceHintDismissed(true);
    try {
      localStorage.setItem('nakamas.wallAudienceHintDismissed', '1');
    } catch {
      /* private mode: it returns next visit */
    }
  };
  const focusId = searchParams.get('post');
  const focusPost = useMemo(() => {
    const p = focusId ? posts.find((x) => x.id === focusId) : undefined;
    return p && myId && canViewPost(myId, p, access) ? p : null;
  }, [focusId, posts, myId, access]);

  // «Νέα από την τελευταία φορά»: frozen at first render, then the visit is recorded.
  const [seenBefore] = useState(() => (myId ? feedSeenAt[myId] ?? null : null));
  useEffect(() => {
    markFeedSeen();
  }, [markFeedSeen]);

  const hiddenIds = useMemo(() => (myId ? hiddenByViewer[myId] ?? [] : []), [hiddenByViewer, myId]);
  const all = useMemo(() => visiblePosts(myId, posts, access, { hiddenIds }), [myId, posts, access, hiddenIds]);
  const hiddenPosts = useMemo(
    () => visiblePosts(myId, posts.filter((p) => hiddenIds.includes(p.id)), access),
    [myId, posts, hiddenIds, access],
  );

  const byFilter = useMemo(() => {
    if (!myId) return { all: [], connections: [], network: [], mine: [] };
    const isConn = (id: string) => graphConnected(access.graph, myId, id);
    return {
      all,
      connections: all.filter((p) => p.authorId !== myId && isConn(p.authorId)),
      network: all.filter((p) => p.authorId !== myId && !isConn(p.authorId)),
      mine: all.filter((p) => p.authorId === myId || p.wallOwnerId === myId || tagShownOnProfile(p, myId, access.privacyByUser)),
    };
  }, [all, myId, access.graph, access.privacyByUser]);

  const newCount = useMemo(
    () => (seenBefore ? all.filter((p) => p.authorId !== myId && p.createdAt > seenBefore).length : 0),
    [all, seenBefore, myId],
  );

  usePublishPageSnapshot({
    titleEl: 'Τοίχος Nakamas',
    titleEn: 'Nakamas Wall',
    summaryEl: `${all.length} δημοσιεύσεις ορατές σε σένα`,
    summaryEn: `${all.length} posts visible to you`,
  });

  if (!me) return null;

  const list = byFilter[filter];
  const filters: { id: FeedFilter; el: string; en: string }[] = [
    { id: 'all', el: 'Όλα', en: 'All' },
    { id: 'connections', el: 'Nakamas μου', en: 'My Nakamas' },
    { id: 'network', el: 'Δημόσια δικτύου', en: 'Network (public)' },
    { id: 'mine', el: 'Ο τοίχος μου', en: 'My wall' },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-20 md:pb-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-1">
        <h1 className={cn(APP_TYPO.pageTitle, 'flex items-center gap-2 text-ink')}>
          <Newspaper className="h-5 w-5" aria-hidden /> {t('Τοίχος Nakamas', 'Nakamas Wall')}
        </h1>
        <p className={cn(APP_TYPO.pageSub, 'text-ink-muted')}>
          {t('Τι σχεδιάζουν οι Nakamas σου — κι εσύ ορίζεις ποιος βλέπει κάθε δημοσίευσή σου.', 'What your Nakamas are planning — and you choose who sees each of your posts.')}
        </p>
      </div>
      <CopilotInlinePrompt maxChips={2} title={{ el: 'Βοήθεια για τον τοίχο', en: 'Help for the wall' }} />

      {focusId && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.delete('post');
              setSearchParams(next, { replace: true });
            }}
            className="inline-flex min-h-9 items-center gap-1.5 text-xs font-bold text-ink-muted hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {t('Όλη η ροή', 'Whole feed')}
          </button>
          {focusPost ? (
            <PostCard post={focusPost} highlighted />
          ) : (
            <div className="space-y-3 rounded-2xl border border-dashed border-border px-4 py-4">
              <p role="status" className="text-sm font-medium text-ink-muted">
                {t('Αυτή η δημοσίευση δεν είναι πια διαθέσιμη για σένα.', 'This post is no longer available to you.')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(searchParams);
                    next.delete('post');
                    setSearchParams(next, { replace: true });
                  }}
                  className="inline-flex min-h-9 items-center rounded-full border border-border px-3 text-xs font-bold text-ink"
                >
                  {t('Όλη η ροή', 'Whole feed')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/buddy-seek')}
                  className="inline-flex min-h-9 items-center rounded-full px-3 text-xs font-bold text-ink underline"
                >
                  {t('Βρες Nakamas', 'Find Nakamas')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={composerRef}>
        <PostComposer />
      </div>

      <WallActivityPanel />

      {!audienceHintDismissed && (
        <div className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4 py-3">
          <ShieldCheck className="h-5 w-5 shrink-0 text-ink" aria-hidden />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-ink">{t('Εσύ ελέγχεις το κοινό σου', 'You control your audience')}</span>
            <span className="block text-xs font-medium text-ink-muted">
              {t(
                'Ανά δημοσίευση · ενότητες μόνο αν το προφίλ είναι ορατό σε εκείνους.',
                'Per post · sections only if the profile is visible to them.',
              )}
            </span>
          </span>
          <button
            type="button"
            onClick={() => navigate('/profile?tab=privacy')}
            className="shrink-0 text-xs font-bold text-ink underline underline-offset-2"
          >
            {t('Ρυθμίσεις', 'Settings')}
          </button>
          <button
            type="button"
            onClick={dismissAudienceHint}
            aria-label={t('Το κατάλαβα, απόκρυψη', 'Got it, dismiss')}
            title={t('Το κατάλαβα', 'Got it')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('Φίλτρο ροής', 'Feed filter')}>
        {filters.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {t(f.el, f.en)} <span className="ml-1 tabular-nums opacity-80">{byFilter[f.id].length}</span>
          </Chip>
        ))}
        {newCount > 0 && filter === 'all' && (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-ink" role="status">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {newCount === 1 ? t('1 νέα από την τελευταία σου επίσκεψη', '1 new since your last visit') : t(`${newCount} νέες από την τελευταία σου επίσκεψη`, `${newCount} new since your last visit`)}
          </span>
        )}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Newspaper}
          title={
            filter === 'mine'
              ? t('Ο τοίχος σου είναι ακόμα άδειος', 'Your wall is still empty')
              : filter === 'network'
                ? t('Καμία δημόσια δημοσίευση ακόμα', 'No public posts yet')
                : filter === 'connections' && byFilter.all.length > 0
                  ? t('Καμία δημοσίευση από τους Nakamas σου ακόμα', 'No posts from your Nakamas yet')
                  : t('Ήσυχα εδώ προς το παρόν', 'Quiet here for now')
          }
          description={
            filter === 'mine'
              ? t('Γράψε τι σχεδιάζεις — οι Nakamas σου μπορούν να έρθουν μαζί.', 'Share what you are planning — your Nakamas can join you.')
              : filter === 'connections' && byFilter.all.length > 0
                ? t('Δείξε όλη τη ροή ή γράψε κάτι δικό σου.', 'Show the whole feed or write something of your own.')
                : t('Σύνδεσου με άτομα από τις εκδηλώσεις σου για να βλέπεις τα σχέδιά τους.', 'Connect with people from your events to see their plans.')
          }
          actionLabel={
            filter === 'mine' || filter === 'all'
              ? t('Γράψε δημοσίευση', 'Write a post')
              : filter === 'connections' && byFilter.all.length > 0
                ? t('Δείξε όλα', 'Show all')
                : t('Βρες Nakamas', 'Find Nakamas')
          }
          onAction={() => {
            if (filter === 'mine' || filter === 'all') {
              composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              composerRef.current?.querySelector('textarea')?.focus();
            } else if (filter === 'connections' && byFilter.all.length > 0) {
              setFilter('all');
            } else navigate('/buddy-seek');
          }}
          secondaryLabel={
            filter === 'mine'
              ? undefined
              : filter === 'all'
                ? t('Βρες Nakamas', 'Find Nakamas')
                : filter === 'connections' && byFilter.all.length > 0
                  ? t('Βρες Nakamas', 'Find Nakamas')
                  : t('Οι Nakamas μου', 'My Nakamas')
          }
          onSecondary={
            filter === 'mine'
              ? undefined
              : filter === 'all' || (filter === 'connections' && byFilter.all.length > 0)
                ? () => navigate('/buddy-seek')
                : () => navigate('/connections')
          }
        />
      ) : (
        <WallPostList key={filter} posts={list} />
      )}

      {hiddenPosts.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            aria-expanded={showHidden}
            className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-ink-muted hover:text-ink"
          >
            <Eye className="h-4 w-4" aria-hidden />
            {showHidden
              ? t('Απόκρυψη κρυμμένων δημοσιεύσεων', 'Hide hidden posts')
              : t(`Κρυμμένες δημοσιεύσεις (${hiddenPosts.length})`, `Hidden posts (${hiddenPosts.length})`)}
          </button>
          {showHidden &&
            hiddenPosts.map((p) => (
              <div key={p.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    useWallStore.getState().unhidePost(p.id);
                    toast.success(t('Επανήλθε στη ροή σου', 'Back in your feed'));
                  }}
                  className="text-xs font-bold text-ink underline"
                >
                  {t('Επαναφορά στη ροή', 'Show in feed again')}
                </button>
                <PostCard post={p} />
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
