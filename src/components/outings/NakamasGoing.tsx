import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import { useStore } from '../../store';
import { useWallAccess } from '../../store/wallStore';
import { useLanguage } from '../../lib/i18n';
import { canViewProfileSection, graphConnected } from '../../lib/audience';
import { PersonAvatar } from '../wall/PersonAvatar';
import type { User } from '../../types';

/**
 * «Ποιοι Nakamas σου πάνε» (Pie, adapted): your connections who are in a
 * group for this event — each one only if their «Εκδηλώσεις» profile
 * section is visible to you. People who hide it are never counted.
 */
export function NakamasGoing({ eventId, className }: { eventId: string; className?: string }) {
  const { t } = useLanguage();
  const me = useStore((s) => s.currentUser);
  const groups = useStore((s) => s.groups);
  const users = useStore((s) => s.users);
  const access = useWallAccess();

  const going = useMemo(() => {
    if (!me) return [] as User[];
    const ids = new Set(
      groups.filter((g) => g.eventId === eventId && g.status !== 'cancelled').flatMap((g) => g.members),
    );
    ids.delete(me.id);
    return [...ids]
      .map((id) => users.find((u) => u.id === id))
      .filter((u): u is User => Boolean(u))
      .filter((u) => graphConnected(access.graph, me.id, u.id) && canViewProfileSection(me.id, u.id, 'events', access));
  }, [me, groups, users, eventId, access]);

  if (going.length === 0) return null;
  const names = going.map((u) => u.name.split(' ')[0]);
  const text =
    names.length === 1
      ? t(`Ο/Η ${names[0]} πάει`, `${names[0]} is going`)
      : names.length === 2
        ? t(`${names[0]} και ${names[1]} πάνε`, `${names[0]} and ${names[1]} are going`)
        : t(`${names[0]}, ${names[1]} και ${names.length - 2} ακόμη πάνε`, `${names[0]}, ${names[1]} and ${names.length - 2} more are going`);

  return (
    <section className={className} aria-labelledby="nakamas-going-title">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4 py-3">
        <div className="flex -space-x-2">
          {going.slice(0, 4).map((u) => (
            <Link key={u.id} to={`/u/${u.id}`} aria-label={u.name}>
              <PersonAvatar user={u} size="sm" className="ring-2 ring-surface-raised" />
            </Link>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <h2 id="nakamas-going-title" className="flex items-center gap-1.5 text-xs font-bold text-ink-muted">
            <HeartHandshake className="h-3.5 w-3.5" aria-hidden /> {t('Ποιοι Nakamas σου πάνε', 'Your Nakamas going')}
          </h2>
          <p className="text-sm font-bold text-ink">{text}</p>
        </div>
        <Link
          to={`/events/${eventId}#groups`}
          className="shrink-0 text-xs font-bold text-ink underline underline-offset-2"
        >
          {t('Δες ομάδες', 'See groups')}
        </Link>
      </div>
    </section>
  );
}
