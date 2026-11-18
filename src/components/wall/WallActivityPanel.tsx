import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, MessageCircle, PenLine, ShieldAlert, Tag, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../lib/i18n';
import { useStore } from '../../store';
import { useWallStore } from '../../store/wallStore';
import { tagShownOnProfile } from '../../lib/audience';
import { useMyWallActivity } from '../../hooks/useMyWallActivity';
import type { WallActivity } from '../../types/wall';
import { cn } from '../../lib/utils';
import { PersonAvatar } from './PersonAvatar';
import { REACTION_EMOJI, relativeTime } from './wallText';

type T = (el: string, en: string) => string;

const KIND_ICON = {
  comment: MessageCircle,
  reaction: Bell,
  wall_post: PenLine,
  tag: Tag,
  moderation: ShieldAlert,
} as const;

function describe(a: WallActivity, actor: string, onMyWall: boolean, t: T): string {
  const quote = a.excerpt ? ` «${a.excerpt}»` : '';
  switch (a.kind) {
    case 'comment':
      return onMyWall
        ? t(`${actor} σχολίασε στον τοίχο σου:${quote}`, `${actor} commented on your wall:${quote}`)
        : t(`${actor} σχολίασε τη δημοσίευσή σου:${quote}`, `${actor} commented on your post:${quote}`);
    case 'reaction':
      return t(
        `${actor} αντέδρασε ${a.reaction ? REACTION_EMOJI[a.reaction] : ''} στη δημοσίευσή σου`,
        `${actor} reacted ${a.reaction ? REACTION_EMOJI[a.reaction] : ''} to your post`,
      );
    case 'wall_post':
      return t(`${actor} έγραψε στον τοίχο σου:${quote}`, `${actor} posted on your wall:${quote}`);
    case 'tag':
      return t(`${actor} σε επισήμανε σε μια δημοσίευση:${quote}`, `${actor} tagged you in a post:${quote}`);
    case 'moderation':
      return t('Η συντονιστική ομάδα αφαίρεσε μια δημοσίευσή σου', 'The moderation team removed one of your posts');
  }
}

/**
 * «Δραστηριότητα» — what happened around your posts and wall, newest first.
 * Each line opens the post; tags can be approved or removed right here.
 */
export function WallActivityPanel({ limit = 5, title }: { limit?: number; title?: string }) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const me = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const posts = useWallStore((s) => s.posts);
  const privacyByUser = useWallStore((s) => s.privacyByUser);
  const { markActivityRead, approveTag, removeMyTag } = useWallStore.getState();
  const items = useMyWallActivity();
  const [showAll, setShowAll] = useState(false);
  const unread = items.filter((a) => !a.read).length;
  if (!me || items.length === 0) return null;
  const shown = showAll ? items : items.slice(0, limit);

  const open = (a: WallActivity) => {
    markActivityRead([a.id]);
    navigate(`/wall?post=${encodeURIComponent(a.postId)}`);
  };

  return (
    <section aria-labelledby="wall-activity-title" className="rounded-2xl border border-border bg-surface-raised p-3">
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <h2 id="wall-activity-title" className="flex items-center gap-2 text-sm font-bold text-ink">
          <Bell className="h-4 w-4" aria-hidden />
          {title ?? t('Δραστηριότητα', 'Activity')}
          {unread > 0 && (
            <span className="rounded-full bg-accent px-2 py-0.5 text-2xs font-bold text-accent-fg">
              {unread === 1 ? t('1 νέα', '1 new') : t(`${unread} νέες`, `${unread} new`)}
            </span>
          )}
        </h2>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => {
              markActivityRead();
              toast.success(t('Όλη η δραστηριότητα αναγνωσμένη', 'All activity marked read'));
            }}
            className="inline-flex min-h-8 items-center gap-1 rounded-full px-2 text-xs font-bold text-ink-muted hover:text-ink"
          >
            <CheckCheck className="h-3.5 w-3.5" aria-hidden /> {t('Όλα αναγνωσμένα', 'Mark all read')}
          </button>
        )}
      </div>
      <ul className="space-y-1">
        {shown.map((a) => {
          const actor = users.find((u) => u.id === a.actorId);
          const post = posts.find((p) => p.id === a.postId);
          const Icon = KIND_ICON[a.kind];
          const tagPending = a.kind === 'tag' && post && (post.taggedIds ?? []).includes(me.id) && !tagShownOnProfile(post, me.id, privacyByUser);
          return (
            <li key={a.id} className={cn('rounded-xl', !a.read && 'bg-accent-soft')}>
              <div className="flex items-start gap-3 px-2 py-2">
                {actor ? <PersonAvatar user={actor} size="sm" /> : <span className="h-8 w-8" />}
                <div className="min-w-0 flex-1">
                  <button type="button" onClick={() => open(a)} className="block w-full text-left">
                    <span className="flex items-start gap-1.5 text-sm font-medium text-ink">
                      <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', a.read ? 'text-ink-muted' : 'text-ink')} aria-hidden />
                      <span className="line-clamp-2">{describe(a, actor?.name ?? t('Κάποιος', 'Someone'), post?.wallOwnerId === me.id && post.authorId !== me.id, t)}</span>
                    </span>
                    <span className={cn('mt-0.5 block text-xs font-medium', a.read ? 'text-ink-muted' : 'text-ink')}>
                      {relativeTime(a.createdAt, language)}
                      {!a.read && <span className="sr-only">{t(' · νέα', ' · new')}</span>}
                    </span>
                  </button>
                  {tagPending && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          approveTag(a.postId);
                          toast.success(t('Εμφανίζεται πλέον στο προφίλ σου', 'Now shown on your profile'));
                        }}
                        className="inline-flex min-h-8 items-center gap-1 rounded-full bg-accent px-3 text-xs font-bold text-accent-fg"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden /> {t('Εμφάνιση στο προφίλ μου', 'Show on my profile')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          removeMyTag(a.postId);
                          toast.success(t('Η ετικέτα σου αφαιρέθηκε', 'Your tag was removed'));
                        }}
                        className="inline-flex min-h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-bold text-ink"
                      >
                        <UserMinus className="h-3.5 w-3.5" aria-hidden /> {t('Αφαίρεση ετικέτας', 'Remove tag')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      {items.length > limit && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          aria-expanded={showAll}
          className="mt-1 min-h-9 w-full rounded-xl text-xs font-bold text-ink-muted hover:bg-surface hover:text-ink"
        >
          {showAll ? t('Λιγότερα', 'Show less') : t(`Όλη η δραστηριότητα (${items.length})`, `All activity (${items.length})`)}
        </button>
      )}
    </section>
  );
}
