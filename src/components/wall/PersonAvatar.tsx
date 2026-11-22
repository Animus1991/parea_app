import { useMemo, useState } from 'react';
import { useStore } from '../../store';
import { useWallStore } from '../../store/wallStore';
import { shouldShowProfilePhoto } from '../../lib/profilePrivacy';
import { cn } from '../../lib/utils';
import type { User } from '../../types';
import { initials } from './wallText';

const SIZES = {
  sm: 'h-8 w-8 text-2xs',
  md: 'h-10 w-10 text-xs',
  lg: 'h-20 w-20 text-sm md:text-base',
} as const;

/**
 * Avatar that respects the person's photo privacy (revealPhoto / profile
 * audience). Falls back to initials, never to a stock face.
 */
export function PersonAvatar({
  user,
  size = 'md',
  className,
  viewer,
  ring = false,
  title,
}: {
  user: Pick<User, 'id' | 'name' | 'photoUrl'> & Partial<User>;
  size?: keyof typeof SIZES;
  className?: string;
  /** Simulated viewer for «Δες ως…»; defaults to the signed-in user. */
  viewer?: User | null;
  ring?: boolean;
  title?: string;
}) {
  const currentUser = useStore((s) => s.currentUser);
  const blockedUserIds = useStore((s) => s.blockedUserIds);
  const groups = useStore((s) => s.groups);
  const users = useStore((s) => s.users);
  const lists = useWallStore((s) => s.lists);
  const v = viewer === undefined ? currentUser : viewer;
  // Full context so fine-grained profile audiences (lists, «εκτός από…») also hide the photo.
  const subject = useMemo(() => (users.find((u) => u.id === user.id) ?? user) as User, [users, user]);
  const showPhoto = useMemo(
    () => shouldShowProfilePhoto(v, subject, { blockedUserIds, groups, users, lists }),
    [v, subject, blockedUserIds, groups, users, lists],
  );
  const [failed, setFailed] = useState<string | null>(null);
  const photo = showPhoto && user.photoUrl && failed !== user.photoUrl ? user.photoUrl : null;
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent-soft font-bold text-ink',
        SIZES[size],
        ring && 'ring-2 ring-accent ring-offset-2 ring-offset-surface-raised',
        className,
      )}
      title={title}
      aria-hidden
    >
      {photo ? (
        <img referrerPolicy="no-referrer" src={photo} alt="" className="h-full w-full object-cover" onError={() => setFailed(photo)} />
      ) : (
        initials(user.name)
      )}
    </span>
  );
}
