import { useMemo } from 'react';
import { useStore } from '../store';
import { useWallAccess, useWallStore } from '../store/wallStore';
import { canViewPost } from '../lib/audience';

/** Activity entries the signed-in person can act on (blocked people and vanished posts are left out). */
export function useMyWallActivity() {
  const me = useStore((s) => s.currentUser);
  const blocked = useStore((s) => s.blockedUserIds);
  const activity = useWallStore((s) => s.activity);
  const posts = useWallStore((s) => s.posts);
  const access = useWallAccess();
  return useMemo(() => {
    if (!me) return [];
    const byId = new Map(posts.map((p) => [p.id, p]));
    return activity.filter((a) => {
      if (a.recipientId !== me.id || blocked.includes(a.actorId)) return false;
      const post = byId.get(a.postId);
      return Boolean(post && canViewPost(me.id, post, access));
    });
  }, [me, blocked, activity, posts, access]);
}
