import type { Event, Group, User } from '../types';
import { formatEur } from './money';
import { eventTagLabels } from './eventTags';

const LOCATION_EL: Record<string, string> = {
  'Ilisia, Athens': 'Ιλίσια, Αθήνα',
  'Metaxourgeio, Athens': 'Μεταξουργείο, Αθήνα',
  'Mets, Athens': 'Μετς, Αθήνα',
  'Pangrati, Athens': 'Παγκράτι, Αθήνα',
  'Parnitha, Attica': 'Πάρνηθα, Αττική',
  'Piraeus → Aegina': 'Πειραιάς → Αίγινα',
  'Plaka, Athens': 'Πλάκα, Αθήνα',
  'Syntagma, Athens': 'Σύνταγμα, Αθήνα',
  'Vouliagmeni, Athens': 'Βουλιαγμένη, Αθήνα',
  'Thisio, Athens': 'Θησείο, Αθήνα',
  'Exarchia, Athens': 'Εξάρχεια, Αθήνα',
  'Kaisariani, Athens': 'Καισαριανή, Αθήνα',
  'Faliro, Athens': 'Φάληρο, Αθήνα',
  'Gazi, Athens': 'Γκάζι, Αθήνα',
  'Makrygianni, Athens': 'Μακρυγιάννη, Αθήνα',
  'Tavros, Athens': 'Ταύρος, Αθήνα',
  'Kallithea, Athens': 'Καλλιθέα, Αθήνα',
  'Kerameikos, Athens': 'Κεραμεικός, Αθήνα',
  'Alimos, Athens': 'Άλιμος, Αθήνα',
  'Schinias, Marathon': 'Σχινιάς, Μαραθώνας',
  'Monastiraki, Athens': 'Μοναστηράκι, Αθήνα',
  'Pagrati, Athens': 'Παγκράτι, Αθήνα',
  'Koukaki, Athens': 'Κουκάκι, Αθήνα',
  'Zappeio, Athens': 'Ζάππειο, Αθήνα',
  'Psyrri, Athens': 'Ψυρρή, Αθήνα',
  'Kolonaki, Athens': 'Κολωνάκι, Αθήνα',
  'Petralona, Athens': 'Πετράλωνα, Αθήνα',
  'Kypseli, Athens': 'Κυψέλη, Αθήνα',
  'Neos Kosmos, Athens': 'Νέος Κόσμος, Αθήνα',
  'Glyfada, Athens': 'Γλυφάδα, Αθήνα',
  'Piraeus': 'Πειραιάς',
  Athens: 'Αθήνα',
};

function padTime(time: string): string {
  const [h = '00', m = '00', s = '00'] = time.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:${s.padStart(2, '0')}`;
}

export function eventOccursAt(event: { date: string; time?: string }): Date {
  return new Date(`${event.date}T${padTime(event.time || '23:59')}`);
}

/** Browse lists hide these; the store may still keep them for history. */
export function isLiveCatalogEvent(event: Pick<Event, 'status'>): boolean {
  return event.status !== 'cancelled' && event.status !== 'archived';
}

export function isEventPast(
  event: { date: string; time?: string },
  now: Date = new Date(),
): boolean {
  const when = eventOccursAt(event);
  if (Number.isNaN(when.getTime())) return false;
  return when.getTime() < now.getTime();
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Night-of coordination window: same local calendar day, or within 24 hours
 * of the start. Used so maps / arrival / SOS appear at the outing, not while browsing.
 */
export function isEventImminent(
  event: { date: string; time?: string },
  now: Date = new Date(),
): boolean {
  if (isEventPast(event, now)) return false;
  const start = eventOccursAt(event);
  if (Number.isNaN(start.getTime())) return false;
  const sameDay = event.date === localDateKey(now);
  const hoursUntil = (start.getTime() - now.getTime()) / 36e5;
  return sameDay || hoursUntil <= 24;
}

/** Arrival, live map and SOS — only for confirmed members, and only that night. */
export function showNightCoordinationTools(opts: {
  inGroup: boolean;
  event: { date: string; time?: string };
  alreadyActive?: boolean;
  now?: Date;
}): boolean {
  if (opts.alreadyActive) return true;
  if (!opts.inGroup) return false;
  return isEventImminent(opts.event, opts.now);
}

export function formatEventPrice(
  event: { isPaid: boolean; price: number },
  language: 'el' | 'en',
  freeEl = 'Δωρεάν',
  freeEn = 'Free',
): string {
  if (!event.isPaid || event.price <= 0) return language === 'el' ? freeEl : freeEn;
  return formatEur(event.price, language);
}

export function formatLocationArea(area: string, language: 'el' | 'en'): string {
  if (language !== 'el') return area;
  return LOCATION_EL[area] ?? area.replace(/\bAthens\b/g, 'Αθήνα');
}

export function translateEventTag(
  tag: string,
  t: (el: string, en: string) => string,
): string {
  const labels = eventTagLabels(tag);
  return t(labels.el, labels.en);
}

export type EventJoinState = 'join' | 'rate' | 'view' | 'chat';

export function getEventJoinState(
  event: Event,
  opts: {
    currentUser: User | null;
    groups: Group[];
    pendingFeedbackId: string | null;
    now?: Date;
  },
): EventJoinState {
  const past = isEventPast(event, opts.now);
  const userGroup = opts.currentUser
    ? opts.groups.find(
        (g) => g.eventId === event.id && g.members.includes(opts.currentUser!.id),
      )
    : undefined;

  if (past) {
    if (userGroup && opts.pendingFeedbackId === event.id) return 'rate';
    return 'view';
  }
  if (userGroup) return 'chat';
  return 'join';
}
