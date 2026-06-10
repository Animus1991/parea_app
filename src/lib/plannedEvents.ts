import { parseISO, isSameDay } from 'date-fns';
import type { Event, Group, User } from '../types';
import type { PlannedEvent, PlannedGroupStatus, PlannedTicketStatus, PlannedUserStatus } from '../types/plannedEvent';
import { inferEventEndDate, parseEventStart } from './eventCalendarExport';

export function eventToPlannedEvent(
  event: Event,
  group: Group | undefined,
  currentUser: User | null,
  waitlisted: boolean,
): PlannedEvent | null {
  const start = parseEventStart(event);
  if (!start) return null;
  const end = inferEventEndDate(event, start) ?? new Date(start.getTime() + 2 * 60 * 60 * 1000);

  let userStatus: PlannedUserStatus = 'confirmed';
  if (waitlisted) userStatus = 'waitlist';
  else if (group?.pendingMembers?.includes(currentUser?.id ?? '')) userStatus = 'pending';

  let groupStatus: PlannedGroupStatus = 'none';
  if (group) groupStatus = group.status;

  const ticketStatus: PlannedTicketStatus =
    event.isPaid && userStatus === 'confirmed' ? 'active' : event.isPaid ? 'pending' : 'none';

  return {
    id: event.id,
    title: event.title,
    category: event.category,
    imageUrl:
      event.imageUrl ||
      `https://picsum.photos/seed/${encodeURIComponent(event.id)}/800/600`,
    startDateTime: start,
    endDateTime: end,
    locationName: event.locationArea,
    address: event.exactLocation || event.locationArea,
    lat: event.lat,
    lng: event.lng,
    trustTier: event.minTrustTierAccess,
    verificationRequired: event.minTrustTierAccess !== '1_explorer',
    groupStatus,
    ticketStatus,
    userStatus,
    meetingPoint: group?.meetingPoint,
    groupId: group?.id,
    event,
    parsedDate: parseISO(event.date),
    time: event.time,
  };
}

export function sortPlannedEventsForDay(events: PlannedEvent[]): PlannedEvent[] {
  return [...events].sort(
    (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime(),
  );
}

export function plannedEventsForDay(events: PlannedEvent[], day: Date): PlannedEvent[] {
  return sortPlannedEventsForDay(events.filter((e) => isSameDay(e.parsedDate, day)));
}
