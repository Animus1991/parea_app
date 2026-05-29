import type { Event, Group, User } from '../types';

export function computeMatchScore(user: User, event: Event): number {
  const tags = event.tags ?? [];
  const interests = user.interests ?? [];
  if (tags.length === 0) return 55;

  const overlap = tags.filter((t) =>
    interests.some((i) => i.toLowerCase() === t.toLowerCase()),
  ).length;
  const tagScore = Math.round((overlap / tags.length) * 55);
  const categoryBonus = interests.some((i) =>
    event.category.toLowerCase().includes(i.toLowerCase()),
  )
    ? 15
    : 0;
  const tierBonus =
    user.trustTier === '3_high_trust' ? 10 : user.trustTier === '2_confirmed' ? 5 : 0;

  return Math.min(99, Math.max(20, 30 + tagScore + categoryBonus + tierBonus));
}

export function getMatchingPreview(
  event: Event,
  groups: Group[],
  users: User[],
  currentUser: User | null,
): { count: number; labelEl: string; labelEn: string } | null {
  if (!currentUser) return null;

  const eventGroups = groups.filter((g) => g.eventId === event.id);
  const openGroups = eventGroups.filter(
    (g) => g.members.length < g.targetSize && g.status !== 'cancelled',
  );
  if (openGroups.length === 0) return null;

  const candidateIds = new Set<string>();
  for (const g of openGroups) {
    for (const uid of g.members) {
      if (uid !== currentUser.id) candidateIds.add(uid);
    }
  }

  const sharedInterestCount = [...candidateIds].filter((uid) => {
    const u = users.find((x) => x.id === uid);
    if (!u) return false;
    return (u.interests ?? []).some((i) =>
      (event.tags ?? []).some((t) => t.toLowerCase() === i.toLowerCase()),
    );
  }).length;

  const count = Math.max(sharedInterestCount, Math.min(3, candidateIds.size));
  if (count === 0) return null;

  return {
    count,
    labelEl: `${count} ${count === 1 ? 'άτομο' : 'άτομα'} με κοινά ενδιαφέροντα ψάχνουν παρέα`,
    labelEn: `${count} ${count === 1 ? 'person' : 'people'} with shared interests looking for company`,
  };
}
