import { useState } from 'react';
import type { WallPost } from '../../types/wall';
import type { User } from '../../types';
import { useLanguage } from '../../lib/i18n';
import { PostCard } from './PostCard';

const PAGE = 15;

/** Posts with a "show more" step so long walls stay light on phones. */
export function WallPostList({
  posts,
  viewerOverride,
  newFromId,
}: {
  posts: WallPost[];
  viewerOverride?: User | null;
  /** Everything at and after this post is new since the last visit. */
  newFromId?: string;
}) {
  const { t } = useLanguage();
  const [limit, setLimit] = useState(PAGE);
  const shown = posts.slice(0, limit);
  return (
    <div className="space-y-3" data-testid="wall-post-list">
      {shown.map((p) => (
        <div key={p.id} className="space-y-3">
          {newFromId === p.id && (
            <p className="flex items-center gap-2 pt-1 text-2xs font-bold uppercase tracking-wide text-accent" aria-hidden>
              <span className="h-px flex-1 bg-border" />
              {t('Νέα από εδώ', 'New from here')}
              <span className="h-px flex-1 bg-border" />
            </p>
          )}
          <PostCard post={p} viewerOverride={viewerOverride} />
        </div>
      ))}
      {posts.length > limit && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setLimit((n) => n + PAGE)}
            className="min-h-8 rounded-full border border-border bg-surface-raised px-4 text-xs font-bold text-ink hover:border-border-strong"
          >
            {t(`Περισσότερες δημοσιεύσεις (${posts.length - limit})`, `More posts (${posts.length - limit})`)}
          </button>
        </div>
      )}
    </div>
  );
}
