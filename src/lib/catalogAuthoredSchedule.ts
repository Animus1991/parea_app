import { authoredEvents } from '../data/mockEvents';
import { authoredCalendarPlanEvents } from '../data/mockCalendarPlan';
import { refreshLiveCatalogDates } from './demoCatalogDates';

export const CATALOG_AUTHORED_SCHEDULE = new Map(
  [...authoredEvents, ...authoredCalendarPlanEvents].map((event) => [
    event.id,
    { date: event.date, time: event.time },
  ]),
);

/** Overlay today's demo schedule onto known catalog ids; user-created extras keep their dates. */
export function withFreshCatalogDates<T extends { id: string; date: string; time?: string }>(
  events: T[],
  now?: Date,
): T[] {
  return refreshLiveCatalogDates(events, CATALOG_AUTHORED_SCHEDULE, now);
}
