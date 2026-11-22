import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Eye, Newspaper, CircleDot, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useWallAccess, useWallStore } from '../../store/wallStore';
import { canViewPost, graphConnected, tagShownOnProfile, visiblePosts } from '../../lib/audience';
import { APP_TYPO } from '../../lib/typographyTokens';
import { PAGE_FILL } from '../layout/PageShell';
import { cn } from '../../lib/utils';
import { Chip } from '../common/Chip';
import { EmptyState } from '../common/EmptyState';
import { usePublishPageSnapshot } from '../../hooks/usePublishPageSnapshot';
import { PostComposer } from './PostComposer';
import { WallPostList } from './WallPostList';
import { PostCard } from './PostCard';
import { ChatStoriesStrip } from '../chat/ChatStoriesStrip';
import { foldSearchText } from '../../lib/greekText';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [wallSearch, setWallSearch] = useState(() => searchParams.get('q') ?? '');
  const [showHidden, setShowHidden] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const savedByViewer = useWallStore((s) => s.savedPostIds);
  const composerRef = useRef<HTMLDivElement>(null);
  const myId = me?.id ?? null;
  const focusId = searchParams.get('post');
  useEffect(() => {
    setWallSearch(searchParams.get('q') ?? '');
  }, [searchParams]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      const query = wallSearch.trim();
      if (query) next.set('q', query);
      else next.delete('q');
      if (next.toString() !== searchParams.toString()) {
        setSearchParams(next, { replace: true, preventScrollReset: true });
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [wallSearch, searchParams, setSearchParams]);
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
  const savedIds = useMemo(() => (myId ? savedByViewer[myId] ?? [] : []), [savedByViewer, myId]);
  const all = useMemo(() => visiblePosts(myId, posts, access, { hiddenIds }), [myId, posts, access, hiddenIds]);
  const savedPosts = useMemo(
    () => visiblePosts(myId, posts.filter((p) => savedIds.includes(p.id)), access),
    [myId, posts, savedIds, access],
  );
  const users = useStore((s) => s.users);
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

  const needle = foldSearchText(wallSearch);
  const nameOf = (id: string) => foldSearchText(users.find((u) => u.id === id)?.name ?? '');
  const list = (needle
    ? byFilter[filter].filter(
        (p) =>
          foldSearchText(p.text).includes(needle) ||
          nameOf(p.authorId).includes(needle) ||
          nameOf(p.wallOwnerId).includes(needle),
      )
    : byFilter[filter]);
  const newFromId =
    seenBefore && filter === 'all' && !needle
      ? list.find((p) => p.authorId !== myId && p.createdAt > seenBefore)?.id
      : undefined;
  const filters: { id: FeedFilter; el: string; en: string; hintEl: string; hintEn: string }[] = [
    { id: 'all', el: 'Όλα', en: 'All', hintEl: 'Ό,τι μπορείς να δεις', hintEn: 'Everything you can see' },
    {
      id: 'connections',
      el: 'Από Nakamas',
      en: 'From Nakamas',
      hintEl: 'Δημοσιεύσεις των συνδέσεών σου',
      hintEn: 'Posts from people you are connected with',
    },
    {
      id: 'network',
      el: 'Δημόσιες',
      en: 'Public',
      hintEl: 'Ανοιχτές δημοσιεύσεις από ανθρώπους που δεν είναι ακόμα Nakamas σου',
      hintEn: 'Open posts from people who are not your Nakamas yet',
    },
    {
      id: 'mine',
      el: 'Δικά μου',
      en: 'Mine',
      hintEl: 'Στον τοίχο σου, από σένα, ή με ετικέτα σου',
      hintEn: 'On your wall, by you, or tagging you',
    },
  ];

  return (
    <div className={cn(PAGE_FILL, 'space-y-4 pb-8 md:pb-6 animate-in fade-in duration-300')}>
      <div className="flex flex-col gap-1">
        <h1 className={cn(APP_TYPO.pageTitle, 'flex items-center gap-2 text-ink')}>
          <Newspaper className="h-5 w-5" aria-hidden /> {t('Τοίχος Nakamas', 'Nakamas Wall')}
        </h1>
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
          <input
            type="search"
            value={wallSearch}
            onChange={(e) => setWallSearch(e.target.value)}
            placeholder={t('Αναζήτηση στον τοίχο…', 'Search the wall…')}
            aria-label={t('Αναζήτηση στον τοίχο', 'Search the wall')}
            className="h-9 w-full rounded-full border border-border bg-surface pl-9 pr-8 text-sm font-medium text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-accent"
          />
          {wallSearch && (
            <button
              type="button"
              onClick={() => setWallSearch('')}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-ink-muted hover:bg-surface-raised hover:text-ink"
              aria-label={t('Καθαρισμός αναζήτησης', 'Clear search')}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>
      <ChatStoriesStrip compact />
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

      <div className="sticky top-1 z-10 -mx-1 space-y-2 bg-surface/95 px-1 py-1 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
        <div
          className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label={t('Φίλτρο ροής', 'Feed filter')}
        >
          {filters.map((f) => (
            <Chip
              key={f.id}
              active={filter === f.id}
              onClick={() => setFilter(f.id)}
              title={t(f.hintEl, f.hintEn)}
              aria-label={`${t(f.el, f.en)}, ${byFilter[f.id].length}. ${t(f.hintEl, f.hintEn)}`}
              className="shrink-0 whitespace-nowrap"
            >
              {t(f.el, f.en)}
              <span className="ml-1 tabular-nums font-medium opacity-70">{byFilter[f.id].length}</span>
            </Chip>
          ))}
        </div>
        {newCount > 0 && filter === 'all' && (
          <p className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted" role="status">
            <CircleDot className="h-3.5 w-3.5" aria-hidden />
            {newCount === 1
              ? t('1 νέα από την τελευταία σου επίσκεψη', '1 new since your last visit')
              : t(`${newCount} νέες από την τελευταία σου επίσκεψη`, `${newCount} new since your last visit`)}
          </p>
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
          character="crew"
          actionLabel={t('Γράψε δημοσίευση', 'Write a post')}
          onAction={() => {
            composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            composerRef.current?.querySelector('textarea')?.focus();
          }}
          askAi
          askPrompt={
            filter === 'mine'
              ? t(
                  'Βοήθησέ με να γράψω μια ωραία πρόσκληση για τον τοίχο μου.',
                  'Help me write a nice invite post for my wall.',
                )
              : t(
                  'Δείξε μου τι κάνουν οι Nakamas μου ή βρες παρέα για έξοδο.',
                  'Show me what my Nakamas are up to or find company for an outing.',
                )
          }
        />
      ) : (
        <WallPostList key={filter} posts={list} newFromId={newFromId} />
      )}

      {savedPosts.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowSaved((v) => !v)}
            aria-expanded={showSaved}
            className="inline-flex min-h-8 items-center gap-2 text-xs font-bold text-ink-muted hover:text-ink"
          >
            <Bookmark className="h-4 w-4" aria-hidden />
            {t(`Αποθηκευμένες (${savedPosts.length})`, `Saved (${savedPosts.length})`)}
          </button>
          {showSaved && savedPosts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      {hiddenPosts.length > 0 && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            aria-expanded={showHidden}
            className="inline-flex min-h-8 items-center gap-2 text-xs font-bold text-ink-muted hover:text-ink"
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
