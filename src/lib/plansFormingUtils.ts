import { format, parseISO } from 'date-fns';
import { el } from 'date-fns/locale';
import { sharedInterestCount } from './companyRequestUtils';
import type { CompanyRequest, MeetingPreference } from '../types/companyRequest';
import type { Event, Group, User } from '../types';
import type { BuddySeekDiscoveryItem } from '../hooks/useBuddySeekDiscovery';

export type PlanRoleKind = 'seeker' | 'group_builder' | 'coordinator';

export interface PlansFormingEnrichedItem extends BuddySeekDiscoveryItem {
  sharedInterestTags: string[];
  sharedInterestCount: number;
  matchPercent: number;
  urgency: { el: string; en: string; tone: 'soon' | 'normal' | 'flexible' };
  schedule: { el: string; en: string };
  scheduleFull: { el: string; en: string };
  location: string;
  groupSizeLabel: { el: string; en: string };
  meetingLabel: { el: string; en: string };
  matchReason: { el: string; en: string };
  intentLabel: { el: string; en: string };
  roleLabel: { el: string; en: string; kind: PlanRoleKind };
  isSavedEvent: boolean;
  isHighMatch: boolean;
}

export interface PlansFormingScarcityPromo {
  id: string;
  eventId: string;
  eventTitle: string;
  filled: number;
  target: number;
  scheduleFull: { el: string; en: string };
  location?: string;
  groupId?: string;
}

export function getSharedInterestTags(viewer: User, seeker: User, event: Event): string[] {
  const tags = new Set((event.tags ?? []).map((t) => t.toLowerCase()));
  const pool = [...(viewer.interests ?? []), ...Array.from(tags)];
  return (seeker.interests ?? []).filter((i) =>
    pool.some(
      (p) =>
        p.toLowerCase() === i.toLowerCase() ||
        p.toLowerCase().includes(i.toLowerCase()) ||
        i.toLowerCase().includes(p.toLowerCase()),
    ),
  );
}

export function plansFormingMatchReason(
  viewer: User,
  seeker: User,
  event: Event,
  request: CompanyRequest,
  savedEventIds: string[],
): { el: string; en: string } {
  const shared = sharedInterestCount(viewer, seeker, event);
  if (savedEventIds.includes(event.id) && shared > 0) {
    return {
      el: `Αποθηκευμένη εκδήλωση · ${shared} κοινά ενδιαφέροντα`,
      en: `Saved event · ${shared} shared interests`,
    };
  }
  if (savedEventIds.includes(event.id)) {
    return {
      el: 'Αποθηκευμένη εκδήλωση — ίδιο σχέδιο',
      en: 'Saved event — same plan context',
    };
  }
  if (shared > 0) {
    return {
      el: `${shared} κοινά ενδιαφέροντα · ${event.category}`,
      en: `${shared} shared interests · ${event.category}`,
    };
  }
  if (request.visibilityMode === 'public_event_page') {
    return { el: 'Δημόσιο στο πλαίσιο της εκδήλωσης', en: 'Public on event page' };
  }
  if (request.visibilityMode === 'same_event_viewers') {
    return {
      el: 'Βλέπετε την ίδια εκδήλωση',
      en: 'You are viewing the same event',
    };
  }
  return {
    el: 'Συμβατό με τις ρυθμίσεις ορατότητάς σας',
    en: 'Matches your visibility preferences',
  };
}

export function lookingForTypeLabel(
  type: CompanyRequest['lookingForType'],
): { el: string; en: string } {
  const map: Record<CompanyRequest['lookingForType'], { el: string; en: string }> = {
    join_group: { el: 'Ψάχνει ομάδα', en: 'Wants a group' },
    find_people: { el: '1–2 άτομα', en: 'Find 1–2 people' },
    create_group: { el: 'Νέα μικρή ομάδα', en: 'Starting a group' },
    group_merge: { el: 'Συντονισμός ομάδων', en: 'Group coordination' },
    open_to_suggestions: { el: 'Ανοιχτό σε ιδέες', en: 'Open to ideas' },
  };
  return map[type];
}

export function meetingPreferenceLabel(pref: MeetingPreference): { el: string; en: string } {
  const map: Record<MeetingPreference, { el: string; en: string }> = {
    at_venue: { el: 'Στον χώρο', en: 'At venue' },
    coffee_before: { el: 'Καφές πριν', en: 'Coffee before' },
    walk_after: { el: 'Μετά την εκδήλωση', en: 'After the event' },
    chat_first: { el: 'Chat πρώτα', en: 'Chat first' },
  };
  return map[pref];
}

export function formatEventSchedule(event: Event): { el: string; en: string } {
  const date = event.date ?? '';
  const time = event.time ?? '';
  if (date && time) {
    return {
      el: `${date} · ${time}`,
      en: `${date} · ${time}`,
    };
  }
  return { el: date || 'Ημερομηνία TBC', en: date || 'Date TBC' };
}

export function formatEventDateTimeFull(event: Event): { el: string; en: string } {
  if (!event.date) {
    return { el: 'Ημερομηνία προς επιβεβαίωση', en: 'Date to be confirmed' };
  }
  try {
    const iso = `${event.date}T${event.time || '20:00'}:00`;
    const d = parseISO(iso);
    const elStr = format(d, "EEEE d MMMM yyyy · HH:mm", { locale: el });
    const enStr = format(d, 'EEEE, MMMM d, yyyy · h:mm a');
    return { el: elStr, en: enStr };
  } catch {
    return formatEventSchedule(event);
  }
}

export function planRoleLabel(request: CompanyRequest): { el: string; en: string; kind: PlanRoleKind } {
  if (request.lookingForType === 'create_group') {
    return { el: 'Φτιάχνει μικρή ομάδα', en: 'Starting a small group', kind: 'group_builder' };
  }
  if (request.lookingForType === 'group_merge') {
    return { el: 'Συντονισμός ομάδων', en: 'Coordinating groups', kind: 'coordinator' };
  }
  return {
    el: 'Ψάχνει παρέα',
    en: 'Looking for company',
    kind: 'seeker',
  };
}

export function eventUrgency(event: Event, flexible?: boolean): PlansFormingEnrichedItem['urgency'] {
  if (flexible) {
    return { el: 'Ευέλικτο', en: 'Flexible', tone: 'flexible' };
  }
  if (!event.date) {
    return { el: 'Σύντομα', en: 'Coming up', tone: 'normal' };
  }
  try {
    const eventDate = new Date(`${event.date}T${event.time || '12:00'}`);
    const days = Math.ceil((eventDate.getTime() - Date.now()) / 86400000);
    if (days <= 0) return { el: 'Σήμερα / τώρα', en: 'Today / now', tone: 'soon' };
    if (days === 1) return { el: 'Αύριο', en: 'Tomorrow', tone: 'soon' };
    if (days <= 7) return { el: `Σε ${days} ημέρες`, en: `In ${days} days`, tone: 'soon' };
    return { el: `Σε ${days} ημέρες`, en: `In ${days} days`, tone: 'normal' };
  } catch {
    return { el: 'Σύντομα', en: 'Soon', tone: 'normal' };
  }
}

export function groupSizeLabel(request: CompanyRequest): { el: string; en: string } {
  const min = request.preferredGroupMin;
  const max = request.preferredGroupMax;
  if (min && max) return { el: `${min}–${max} άτομα`, en: `${min}–${max} people` };
  if (max) return { el: `Έως ${max}`, en: `Up to ${max}` };
  if (min) return { el: `Από ${min}+`, en: `From ${min}+` };
  return { el: 'Ευέλικτο μέγεθος', en: 'Flexible size' };
}

export function enrichPlanItem(
  item: BuddySeekDiscoveryItem,
  viewer: User,
  savedEventIds: string[],
): PlansFormingEnrichedItem {
  const sharedTags = getSharedInterestTags(viewer, item.seeker, item.event);
  const shared = sharedTags.length || sharedInterestCount(viewer, item.seeker, item.event);
  const matchPercent = Math.min(98, Math.round(item.score * 0.85 + shared * 12));
  return {
    ...item,
    sharedInterestTags: sharedTags,
    sharedInterestCount: shared,
    matchPercent,
    urgency: eventUrgency(item.event, item.intent.flexibleDates),
    schedule: formatEventSchedule(item.event),
    scheduleFull: formatEventDateTimeFull(item.event),
    location: item.event.locationArea ?? item.event.exactLocation ?? '',
    groupSizeLabel: groupSizeLabel(item.intent),
    meetingLabel: meetingPreferenceLabel(item.intent.meetingPreference),
    matchReason: plansFormingMatchReason(viewer, item.seeker, item.event, item.intent, savedEventIds),
    intentLabel: lookingForTypeLabel(item.intent.lookingForType),
    roleLabel: planRoleLabel(item.intent),
    isSavedEvent: savedEventIds.includes(item.event.id),
    isHighMatch: matchPercent >= 70 || shared >= 2,
  };
}

export function enrichRecruitingGroup(
  group: Group,
  event: Event,
  host: User | undefined,
): {
  spots: number;
  filled: number;
  target: number;
  progress: number;
  hostFirstName: string;
  note: string;
  schedule: { el: string; en: string };
  scheduleFull: { el: string; en: string };
  location: string;
} {
  const filled = group.members.length;
  const target = group.targetSize;
  const spots = Math.max(0, target - filled);
  return {
    spots,
    filled,
    target,
    progress: target > 0 ? Math.round((filled / target) * 100) : 0,
    hostFirstName: host?.name?.split(' ')[0] ?? '',
    note: group.recruitingNote ?? '',
    schedule: formatEventSchedule(event),
    scheduleFull: formatEventDateTimeFull(event),
    location: event.locationArea ?? '',
  };
}

export function buildScarcityPromos(
  groups: Group[],
  events: Event[],
  viewerId: string | undefined,
): PlansFormingScarcityPromo[] {
  if (!viewerId) return [];
  const promos: PlansFormingScarcityPromo[] = [];
  for (const g of groups) {
    if (!g.isRecruiting && g.members.length >= g.targetSize) continue;
    if (g.members.includes(viewerId)) continue;
    const filled = g.members.length;
    const target = g.targetSize;
    if (target <= 0 || filled >= target) continue;
    const ratio = filled / target;
    if (ratio < 0.45) continue;
    const event = events.find((e) => e.id === g.eventId);
    if (!event) continue;
    promos.push({
      id: `scarcity_${g.id}`,
      eventId: event.id,
      eventTitle: event.title,
      filled,
      target,
      scheduleFull: formatEventDateTimeFull(event),
      location: event.locationArea,
      groupId: g.id,
    });
  }
  return promos.sort((a, b) => b.filled / b.target - a.filled / a.target).slice(0, 4);
}
