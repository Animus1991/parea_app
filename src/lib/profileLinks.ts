/**
 * Where a person's profile lives. Organizers keep their venue page
 * (`/organizer/:id`); every other member has a personal profile with a wall
 * (`/u/:id`). Both routes redirect to the right one, so old links keep working.
 */
export function profilePathFor(user: { id: string; isOrganizer?: boolean }): string {
  return user.isOrganizer ? `/organizer/${encodeURIComponent(user.id)}` : `/u/${encodeURIComponent(user.id)}`;
}
