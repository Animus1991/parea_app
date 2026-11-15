/**
 * Copilot action registry (Φ23) — the single place that defines what the AI
 * is allowed to do. Each action maps onto EXISTING store actions / routes, so
 * anything the AI does is exactly what the UI would do (same validation, same
 * persistence, same side effects). Declarations double as Gemini tools.
 */
import { format, parseISO } from 'date-fns';
import { el as elLocale, enUS } from 'date-fns/locale';
import { useStore, DEFAULT_USER_SETTINGS, type HomeHeroMode, type UserSettings } from '../store';
import { useChatStore } from '../store/chatStore';
import { useLanguageStore } from '../store/languageStore';
import type { Event, Group } from '../types';
import { THEME_IDS, THEME_LABELS, isDarkTheme, type ThemeId } from '../lib/themes';
import { computeUserXp, levelForXp } from '../lib/gamification';
import { computeAchievements } from '../lib/achievements';
import { downloadICS, openGoogleCalendar } from '../lib/eventCalendarExport';
import { homePathWithCategory, homePathWithSearch } from '../lib/homeDeepLinks';
import { APP_ROUTES, routeById } from './routes';
import { KNOWLEDGE_TOPICS, findTopic } from './knowledge';
import { extractDateRange, CATEGORY_SYNONYMS } from './entities';
import { normalize } from './text';
import { resolveEventRef, searchEvents } from './eventSearch';
import type { ActionArgs, ActionResult, ActionRuntime, CopilotAction, ParamSchema } from './types';
import { isPlatformAdmin } from '../lib/roles';
import { buildReturnSummary, describeReturnPart, returnPartPath } from '../lib/returnVisit';
import { previousVisitAt } from '../lib/visitClock';

/* ───────────────────────── helpers ───────────────────────── */

const S = (description: string, extra: Partial<ParamSchema> = {}): ParamSchema => ({ type: 'STRING', description, ...extra });
const B = (description: string): ParamSchema => ({ type: 'BOOLEAN', description });
const N = (description: string): ParamSchema => ({ type: 'NUMBER', description });
const OBJ = (properties: Record<string, ParamSchema>, required: string[] = []): ParamSchema => ({
  type: 'OBJECT',
  properties,
  ...(required.length ? { required } : {}),
});

const EVENT_REF = S(
  'Event id (e.g. "e3"), part of its title, an ordinal into the last result list ("1" = first, "2" = second, "-1" = last), or "this" for the event page currently open.',
);

export const CATEGORY_NAMES = Object.keys(CATEGORY_SYNONYMS);

const DATE_KEYWORDS = ['today', 'tomorrow', 'weekend', 'this_week', 'next_week', 'this_month', 'next_month'] as const;

function str(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}
function bool(v: unknown): boolean | undefined {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}
function num(v: unknown): number | undefined {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function state() {
  return useStore.getState();
}

function fail(el: string, en: string): ActionResult {
  return { ok: false, el, en };
}

export function formatEventLine(e: Event, lang: 'el' | 'en'): string {
  let when = e.date;
  try {
    when = format(parseISO(e.date), 'EEE d/M', { locale: lang === 'el' ? elLocale : enUS });
  } catch {
    /* keep raw */
  }
  const price = e.isPaid && e.price > 0 ? `€${e.price}` : lang === 'el' ? 'Δωρεάν' : 'Free';
  return `${e.title} · ${when} ${e.time} · ${e.locationArea} · ${price}`;
}

function eventData(e: Event) {
  return {
    id: e.id,
    title: e.title,
    date: e.date,
    time: e.time,
    area: e.locationArea,
    category: e.category,
    price: e.isPaid ? e.price : 0,
  };
}

function resolveEvent(ref: unknown, rt: ActionRuntime): Event | null {
  const s = state();
  const empty = ref === undefined || ref === null || (typeof ref === 'string' && (!ref.trim() || ref.trim() === 'this'));
  if (empty) {
    const focusId = rt.currentEventId ?? rt.lastEventIds[0];
    return focusId ? s.events.find((e) => e.id === focusId) ?? null : null;
  }
  // Ordinals arrive as "2" / "-1" strings from the model or as numbers from the local engine.
  if (typeof ref === 'string' && /^-?\d{1,2}$/.test(ref.trim())) {
    const n = Number(ref.trim());
    return resolveEventRef(n > 0 ? n - 1 : n, s.events, rt.lastEventIds);
  }
  return resolveEventRef(ref, s.events, rt.lastEventIds);
}

function notFoundEvent(): ActionResult {
  return fail(
    'Δεν βρήκα ποια εκδήλωση εννοείς. Πες μου τον τίτλο ή ζήτα πρώτα μια αναζήτηση.',
    "I couldn't tell which event you mean. Tell me its title or search first.",
  );
}

function userGroupForEvent(eventId: string): Group | undefined {
  const s = state();
  const uid = s.currentUser?.id;
  if (!uid) return undefined;
  return s.groups.find((g) => g.eventId === eventId && g.members.includes(uid));
}

function myGroups(): Group[] {
  const s = state();
  const uid = s.currentUser?.id;
  if (!uid) return [];
  return s.groups.filter((g) => g.members.includes(uid) && g.status !== 'cancelled');
}

function dateRangeFromArgs(args: ActionArgs) {
  const keyword = str(args.date);
  if (keyword) {
    const phrase = keyword.replace(/_/g, ' ');
    const r = extractDateRange(normalize(phrase));
    if (r) return r;
  }
  const from = str(args.dateFrom);
  const to = str(args.dateTo) ?? from;
  if (!from) return null;
  const short = (d: string) => {
    try {
      return format(parseISO(d), 'd/M');
    } catch {
      return d;
    }
  };
  const fallback = from === to ? short(from) : `${short(from)} – ${short(to ?? from)}`;
  return { from, to: to ?? from, labelEl: str(args.dateLabelEl) ?? fallback, labelEn: str(args.dateLabelEn) ?? fallback };
}

function canonicalCategory(input: string): string | null {
  const n = normalize(input);
  for (const cat of CATEGORY_NAMES) {
    if (normalize(cat) === n) return cat;
  }
  for (const cat of CATEGORY_NAMES) {
    if ((CATEGORY_SYNONYMS[cat] ?? []).some((stem) => stem.trim() && n.includes(stem.trim()))) return cat;
  }
  return null;
}

function themeTarget(raw: string, current: string): ThemeId | null {
  const n = normalize(raw);
  if ((THEME_IDS as readonly string[]).includes(n)) return n as ThemeId;
  const family = current.replace(/-dark$/, '');
  if (n === 'dark') {
    if (isDarkTheme(current)) return current as ThemeId;
    return (family === 'classic' ? 'neon-dark' : `${family}-dark`) as ThemeId;
  }
  if (n === 'light') {
    if (!isDarkTheme(current)) return current as ThemeId;
    return family as ThemeId;
  }
  return null;
}

/* ───────────────────────── actions ───────────────────────── */

const navigateAction: CopilotAction = {
  name: 'navigate',
  description: 'Open a page of the app.',
  risk: 'safe',
  parameters: OBJ({ page: S('Destination page id', { enum: APP_ROUTES.map((r) => r.id) }) }, ['page']),
  run: (args, rt) => {
    const route = routeById(String(args.page ?? ''));
    if (!route) return fail('Δεν βρήκα αυτή τη σελίδα.', "I couldn't find that page.");
    if (route.adminOnly && !isPlatformAdmin(state().currentUser)) {
      return fail('Η σελίδα διαχείρισης είναι μόνο για διαχειριστές.', 'The admin page is for admins only.');
    }
    rt.navigate(route.path);
    return { ok: true, el: `Άνοιξα: ${route.labelEl}.`, en: `Opened ${route.labelEn}.`, data: { path: route.path } };
  },
};

const searchAction: CopilotAction = {
  name: 'search_events',
  description:
    'Search the event catalogue. Combine any filters. Results are shown to the user as cards and remembered so later commands can refer to "the second one".',
  risk: 'safe',
  parameters: OBJ({
    query: S('Free-text keywords (title, tags, description).'),
    categories: { type: 'ARRAY', items: S('Category', { enum: CATEGORY_NAMES }), description: 'Event categories.' },
    date: S('Relative date window.', { enum: [...DATE_KEYWORDS] }),
    dateFrom: S('Start date yyyy-MM-dd (alternative to `date`).'),
    dateTo: S('End date yyyy-MM-dd.'),
    price: S('Price filter.', { enum: ['free', 'paid', 'any'] }),
    maxPrice: N('Maximum ticket price in euro.'),
    area: S('Neighbourhood, e.g. "Gazi", "Koukaki".'),
    limit: N('Max results (1-12, default 5).'),
    showInFeed: B('Also apply the search to the Discover feed page.'),
  }),
  run: (args, rt) => {
    const s = state();
    const range = dateRangeFromArgs(args);
    const rawCats = Array.isArray(args.categories) ? args.categories : str(args.categories) ? [args.categories] : [];
    const categories = rawCats.map((c) => canonicalCategory(String(c))).filter((c): c is string => Boolean(c));
    const price = str(args.price) as 'free' | 'paid' | 'any' | undefined;
    const result = searchEvents(s.events, s.currentUser, {
      query: str(args.query),
      categories,
      dateFrom: range?.from,
      dateTo: range?.to,
      price,
      maxPrice: num(args.maxPrice),
      area: str(args.area),
      limit: num(args.limit) ?? 5,
    });
    const ids = result.events.map((e) => e.id);
    if (bool(args.showInFeed)) {
      if (categories.length === 1 && !str(args.query)) rt.navigate(homePathWithCategory(categories[0]));
      else if (str(args.query)) rt.navigate(homePathWithSearch(String(args.query)));
    }
    const link = categories.length === 1
      ? { path: homePathWithCategory(categories[0]), el: 'Όλα στο feed', en: 'See all in feed' }
      : str(args.query)
        ? { path: homePathWithSearch(String(args.query)), el: 'Όλα στο feed', en: 'See all in feed' }
        : undefined;
    if (ids.length === 0) {
      return {
        ok: true,
        el: 'Δεν βρήκα εκδηλώσεις με αυτά τα κριτήρια. Δοκίμασε άλλη κατηγορία, περιοχή ή ημερομηνία.',
        en: 'No events match those filters. Try another category, area or date.',
        eventIds: [],
        data: { count: 0 },
      };
    }
    const forEl = range ? ` για «${range.labelEl}»` : '';
    const forEn = range ? ` for "${range.labelEn}"` : '';
    const one = result.totalMatches === 1;
    const onlyDate = categories.length === 0 && !str(args.query) && !price && num(args.maxPrice) === undefined && !str(args.area);
    const queryNoteEl = result.relaxedQuery ? ` Δεν βρήκα ακριβώς «${str(args.query)}», οπότε κράτησα τα υπόλοιπα κριτήρια.` : '';
    const queryNoteEn = result.relaxedQuery ? ` Nothing matched "${str(args.query)}" exactly, so I kept your other filters.` : '';
    return {
      ok: true,
      el: result.relaxedDate
        ? onlyDate
          ? `Δεν υπάρχουν προγραμματισμένες εκδηλώσεις${forEl}. Αυτές ταιριάζουν περισσότερο σε σένα:`
          : `Δεν υπάρχουν εκδηλώσεις${forEl}. Αυτές ταιριάζουν στα υπόλοιπα κριτήρια:`
        : one
          ? `Βρήκα 1 εκδήλωση${forEl}:${queryNoteEl}`
          : `Βρήκα ${result.totalMatches} εκδηλώσεις${forEl}. Οι καλύτερες για σένα:${queryNoteEl}`,
      en: result.relaxedDate
        ? onlyDate
          ? `Nothing is scheduled${forEn}. These suit you best:`
          : `Nothing is scheduled${forEn}. These match your other filters:`
        : one
          ? `Found 1 event${forEn}:${queryNoteEn}`
          : `Found ${result.totalMatches} events${forEn}. Best matches for you:${queryNoteEn}`,
      eventIds: ids,
      link,
      data: { count: result.totalMatches, relaxedDate: result.relaxedDate, events: result.events.map(eventData) },
    };
  },
};

const recommendAction: CopilotAction = {
  name: 'recommend_events',
  description: "Recommend events based on the user's interests, onboarding preferences and trending events.",
  risk: 'safe',
  parameters: OBJ({ limit: N('Max results (default 4).') }),
  run: (args) => {
    const s = state();
    const joined = new Set(myGroups().map((g) => g.eventId));
    const pool = s.events.filter((e) => !joined.has(e.id));
    const result = searchEvents(pool, s.currentUser, { limit: num(args.limit) ?? 4 });
    const interests = (s.currentUser?.interests ?? []).slice(0, 3).join(', ');
    return {
      ok: true,
      el: interests ? `Με βάση τα ενδιαφέροντά σου (${interests}), προτείνω:` : 'Αυτές ξεχωρίζουν αυτή τη στιγμή:',
      en: interests ? `Based on your interests (${interests}), I suggest:` : 'These stand out right now:',
      eventIds: result.events.map((e) => e.id),
      data: { events: result.events.map(eventData) },
    };
  },
};

const openEventAction: CopilotAction = {
  name: 'open_event',
  description: 'Open the detail page of an event.',
  risk: 'safe',
  parameters: OBJ({ event: EVENT_REF }, ['event']),
  run: (args, rt) => {
    const e = resolveEvent(args.event, rt);
    if (!e) return notFoundEvent();
    rt.navigate(`/events/${e.id}`);
    return { ok: true, el: `Άνοιξα την «${e.title}».`, en: `Opened "${e.title}".`, eventIds: [e.id] };
  },
};

const saveAction: CopilotAction = {
  name: 'save_event',
  description: 'Bookmark an event to the Saved list.',
  risk: 'safe',
  parameters: OBJ({ event: EVENT_REF }, ['event']),
  run: (args, rt) => {
    const e = resolveEvent(args.event, rt);
    if (!e) return notFoundEvent();
    if (state().savedEvents.includes(e.id)) {
      return { ok: true, el: `Η «${e.title}» είναι ήδη αποθηκευμένη.`, en: `"${e.title}" is already saved.`, eventIds: [e.id] };
    }
    state().toggleSavedEvent(e.id);
    return {
      ok: true,
      el: `Αποθήκευσα την «${e.title}».`,
      en: `Saved "${e.title}".`,
      eventIds: [e.id],
      undo: () => {
        if (state().savedEvents.includes(e.id)) state().toggleSavedEvent(e.id);
      },
      link: { path: '/saved', el: 'Αποθηκευμένες', en: 'Saved' },
    };
  },
};

const unsaveAction: CopilotAction = {
  name: 'unsave_event',
  description: 'Remove an event from the Saved list.',
  risk: 'safe',
  parameters: OBJ({ event: EVENT_REF }, ['event']),
  run: (args, rt) => {
    const e = resolveEvent(args.event, rt);
    if (!e) return notFoundEvent();
    if (!state().savedEvents.includes(e.id)) {
      return { ok: true, el: `Η «${e.title}» δεν ήταν αποθηκευμένη.`, en: `"${e.title}" wasn't saved.` };
    }
    state().toggleSavedEvent(e.id);
    return {
      ok: true,
      el: `Αφαίρεσα την «${e.title}» από τις αποθηκευμένες.`,
      en: `Removed "${e.title}" from Saved.`,
      undo: () => {
        if (!state().savedEvents.includes(e.id)) state().toggleSavedEvent(e.id);
      },
    };
  },
};

const waitlistAction: CopilotAction = {
  name: 'join_waitlist',
  description: 'Join the waitlist of a full event.',
  risk: 'safe',
  parameters: OBJ({ event: EVENT_REF }, ['event']),
  run: (args, rt) => {
    const e = resolveEvent(args.event, rt);
    if (!e) return notFoundEvent();
    if (state().waitlistedEvents.includes(e.id)) {
      return { ok: true, el: 'Είσαι ήδη στη λίστα αναμονής.', en: "You're already on the waitlist." };
    }
    state().addToWaitlist(e.id);
    return {
      ok: true,
      el: `Σε έβαλα στη λίστα αναμονής για «${e.title}». Θα ειδοποιηθείς αν ανοίξει θέση.`,
      en: `You're on the waitlist for "${e.title}". You'll be notified if a spot opens.`,
      undo: () => state().removeFromWaitlist(e.id),
    };
  },
};

const joinFlowAction: CopilotAction = {
  name: 'start_join_flow',
  description: 'Start joining a group for an event (opens the guided join flow with trust checks).',
  risk: 'safe',
  parameters: OBJ({ event: EVENT_REF }, ['event']),
  run: (args, rt) => {
    const e = resolveEvent(args.event, rt);
    if (!e) return notFoundEvent();
    if (userGroupForEvent(e.id)) {
      return {
        ok: true,
        el: `Είσαι ήδη σε ομάδα για «${e.title}».`,
        en: `You're already in a group for "${e.title}".`,
        link: { path: `/chat/${userGroupForEvent(e.id)!.id}`, el: 'Άνοιγμα chat', en: 'Open chat' },
      };
    }
    const gate = state().canJoinEvent(e.id);
    if (!gate.ok) return fail(gate.messageEl, gate.messageEn);
    rt.navigate(`/events/${e.id}/join`);
    return {
      ok: true,
      el: `Ξεκίνησα την ένταξη για «${e.title}» — διάλεξε ομάδα στα επόμενα βήματα.`,
      en: `Started joining "${e.title}" — pick a group in the next steps.`,
    };
  },
};

const calendarAction: CopilotAction = {
  name: 'add_to_calendar',
  description: 'Add an event to the user\'s external calendar (.ics download or Google Calendar).',
  risk: 'safe',
  parameters: OBJ({ event: EVENT_REF, target: S('Calendar target', { enum: ['ics', 'google'] }) }, ['event']),
  run: (args, rt) => {
    const e = resolveEvent(args.event, rt);
    if (!e) return notFoundEvent();
    const ok = str(args.target) === 'google' ? openGoogleCalendar(e) : downloadICS(e);
    if (!ok) return fail('Η εκδήλωση δεν έχει έγκυρη ημερομηνία για ημερολόγιο.', 'This event has no valid date for a calendar.');
    return {
      ok: true,
      el: str(args.target) === 'google' ? `Άνοιξα το Google Calendar για «${e.title}».` : `Κατέβηκε το αρχείο .ics για «${e.title}».`,
      en: str(args.target) === 'google' ? `Opened Google Calendar for "${e.title}".` : `Downloaded the .ics file for "${e.title}".`,
    };
  },
};

const leaveGroupAction: CopilotAction = {
  name: 'leave_group',
  description: 'Leave the group the user joined for an event. Late cancellations lower the reliability score.',
  risk: 'destructive',
  parameters: OBJ({ event: EVENT_REF }, ['event']),
  preview: (args, rt) => {
    const e = resolveEvent(args.event, rt);
    return {
      el: e ? `Αποχώρηση από την ομάδα για «${e.title}»` : 'Αποχώρηση από ομάδα',
      en: e ? `Leave your group for "${e.title}"` : 'Leave group',
    };
  },
  run: (args, rt) => {
    const e = resolveEvent(args.event, rt);
    if (!e) return notFoundEvent();
    const g = userGroupForEvent(e.id);
    if (!g) return fail(`Δεν είσαι σε ομάδα για «${e.title}».`, `You're not in a group for "${e.title}".`);
    state().leaveGroup(g.id);
    return {
      ok: true,
      el: `Αποχώρησες από την ομάδα για «${e.title}».`,
      en: `You left the group for "${e.title}".`,
      undo: () => state().joinGroup(g.id),
    };
  },
};

const agendaAction: CopilotAction = {
  name: 'summarize_agenda',
  description: "Summarise the user's plans (joined groups, saved and waitlisted events) for a period.",
  risk: 'safe',
  parameters: OBJ({ date: S('Period', { enum: [...DATE_KEYWORDS, 'all'] }) }),
  run: (args) => {
    const s = state();
    const range = args.date === 'all' ? null : dateRangeFromArgs(args);
    const joinedIds = new Set(myGroups().map((g) => g.eventId));
    const relevant = s.events.filter(
      (e) => (joinedIds.has(e.id) || s.savedEvents.includes(e.id) || s.waitlistedEvents.includes(e.id)) && e.status !== 'cancelled',
    );
    const inRange = range ? relevant.filter((e) => e.date >= range.from && e.date <= range.to) : relevant;
    const sorted = [...inRange].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    const label = range ? { el: ` (${range.labelEl})`, en: ` (${range.labelEn})` } : { el: '', en: '' };
    if (sorted.length === 0) {
      return {
        ok: true,
        el: `Δεν έχεις σχέδια${label.el}. Θες να σου προτείνω κάτι;`,
        en: `You have no plans${label.en}. Want a suggestion?`,
        link: { path: '/agenda', el: 'Ημερολόγιο', en: 'Calendar' },
      };
    }
    const joined = sorted.filter((e) => joinedIds.has(e.id)).length;
    const lines = (lang: 'el' | 'en') =>
      sorted
        .slice(0, 6)
        .map((e) => `• ${formatEventLine(e, lang)}${joinedIds.has(e.id) ? (lang === 'el' ? ' — ομάδα ✓' : ' — group ✓') : ''}`)
        .join('\n');
    return {
      ok: true,
      el: `Έχεις ${sorted.length} σχέδια${label.el} (${joined} με ομάδα):\n${lines('el')}`,
      en: `You have ${sorted.length} plans${label.en} (${joined} with a group):\n${lines('en')}`,
      eventIds: sorted.slice(0, 6).map((e) => e.id),
      link: { path: '/agenda', el: 'Ημερολόγιο', en: 'Calendar' },
      data: { events: sorted.slice(0, 10).map(eventData) },
    };
  },
};

const EVENT_FIELDS = {
  title: S('Event title.'),
  category: S('Category', { enum: CATEGORY_NAMES }),
  date: S('Date yyyy-MM-dd.'),
  time: S('Start time HH:mm.'),
  area: S('Neighbourhood / meeting area.'),
  description: S('Short description (2 sentences).'),
  maxParticipants: N('Group size (2-12).'),
  price: N('Ticket price in euro (0 = free).'),
};

function eventFromArgs(args: ActionArgs) {
  const cat = str(args.category) ? canonicalCategory(String(args.category)) ?? 'Social' : 'Social';
  const price = Math.max(0, num(args.price) ?? 0);
  return {
    title: str(args.title) ?? '',
    category: cat,
    date: str(args.date) ?? '',
    time: str(args.time) ?? '',
    area: str(args.area) ?? '',
    description: str(args.description) ?? '',
    maxParticipants: Math.min(12, Math.max(2, Math.round(num(args.maxParticipants) ?? 4))),
    price,
  };
}

const draftEventAction: CopilotAction = {
  name: 'draft_event',
  description: 'Open the Create Event form pre-filled with the given details so the user can review and publish.',
  risk: 'safe',
  parameters: OBJ(EVENT_FIELDS),
  run: (args, rt) => {
    const d = eventFromArgs(args);
    const q = new URLSearchParams({ ai: '1' });
    if (d.title) q.set('title', d.title);
    q.set('category', d.category);
    if (d.date) q.set('date', d.date);
    if (d.time) q.set('time', d.time);
    if (d.area) q.set('location', d.area);
    if (d.description) q.set('description', d.description);
    q.set('max', String(d.maxParticipants));
    if (d.price > 0) q.set('price', String(d.price));
    rt.navigate(`/create?${q.toString()}`);
    return {
      ok: true,
      el: 'Άνοιξα τη φόρμα δημιουργίας με τα στοιχεία συμπληρωμένα. Έλεγξέ τα και πάτα «Δημοσίευση».',
      en: 'Opened the create form with the details filled in. Review them and press "Publish".',
    };
  },
};

const createEventAction: CopilotAction = {
  name: 'create_event',
  description: 'Publish a new event immediately (requires user confirmation). Prefer draft_event when details are incomplete.',
  risk: 'confirm',
  parameters: OBJ(EVENT_FIELDS, ['title', 'date', 'time']),
  preview: (args) => {
    const d = eventFromArgs(args);
    const priceEl = d.price > 0 ? `€${d.price}` : 'Δωρεάν';
    const priceEn = d.price > 0 ? `€${d.price}` : 'Free';
    return {
      el: `Δημοσίευση: «${d.title}» · ${d.date} ${d.time} · ${d.area || 'Αθήνα'} · ${d.maxParticipants} άτομα · ${priceEl}`,
      en: `Publish: "${d.title}" · ${d.date} ${d.time} · ${d.area || 'Athens'} · ${d.maxParticipants} people · ${priceEn}`,
    };
  },
  run: (args) => {
    const s = state();
    if (!s.currentUser) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const d = eventFromArgs(args);
    if (!d.title || !d.date || !d.time) {
      return fail('Χρειάζομαι τίτλο, ημερομηνία και ώρα.', 'I need a title, a date and a time.');
    }
    const id = `e${Date.now()}`;
    s.createEvent({
      id,
      title: d.title,
      category: d.category,
      description: d.description || `${d.title} — Nakamas.`,
      date: d.date,
      time: d.time,
      duration: '2h',
      locationArea: d.area || 'Athens',
      exactLocation: d.area || 'Athens (TBD)',
      lat: 37.9838,
      lng: 23.7275,
      isPaid: d.price > 0,
      price: d.price,
      organizerId: s.currentUser.id,
      timeZone: 'EET (Athens)',
      safetyLevel: 'low',
      minTrustTierAccess: '1_explorer',
      maxParticipants: d.maxParticipants,
      tags: ['social', 'ai-created'],
      imageUrl: `https://picsum.photos/seed/${id}/800/600`,
    });
    return {
      ok: true,
      el: `Δημοσιεύτηκε η «${d.title}». Δημιουργήθηκε και η ομάδα σου.`,
      en: `"${d.title}" is published and your group was created.`,
      eventIds: [id],
      undo: () => state().cancelEvent(id),
      link: { path: '/manage', el: 'Πίνακας Διοργανωτή', en: 'Organizer dashboard' },
    };
  },
};

function pickGroup(args: ActionArgs, rt: ActionRuntime): { group: Group; event: Event } | null {
  const s = state();
  if (args.event !== undefined && args.event !== null && String(args.event).trim()) {
    const e = resolveEvent(args.event, rt);
    if (!e) return null;
    const g = userGroupForEvent(e.id);
    return g ? { group: g, event: e } : null;
  }
  const groups = myGroups();
  const withEvents = groups
    .map((g) => ({ group: g, event: s.events.find((e) => e.id === g.eventId) }))
    .filter((x): x is { group: Group; event: Event } => Boolean(x.event))
    .sort((a, b) => a.event.date.localeCompare(b.event.date));
  const today = new Date().toISOString().slice(0, 10);
  return withEvents.find((x) => x.event.date >= today) ?? withEvents[withEvents.length - 1] ?? null;
}

const messageAction: CopilotAction = {
  name: 'send_group_message',
  description: "Send a message to the user's group chat for an event (defaults to the next upcoming group).",
  risk: 'confirm',
  parameters: OBJ({ event: EVENT_REF, text: S('Message text exactly as it should be sent.') }, ['text']),
  preview: (args, rt) => {
    const target = pickGroup(args, rt);
    return {
      el: `Μήνυμα στην ομάδα «${target?.event.title ?? '—'}»: «${str(args.text) ?? ''}»`,
      en: `Message to "${target?.event.title ?? '—'}" group: "${str(args.text) ?? ''}"`,
    };
  },
  run: (args, rt) => {
    const s = state();
    const text = str(args.text);
    if (!text) return fail('Τι να γράψω;', 'What should I write?');
    if (!s.currentUser) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const target = pickGroup(args, rt);
    if (!target) return fail('Δεν βρήκα ομάδα στην οποία ανήκεις.', "I couldn't find a group you belong to.");
    const chat = useChatStore.getState();
    const conversationId = chat.ensureEventGroupConversation({
      groupId: target.group.id,
      eventId: target.event.id,
      title: target.event.title,
      participantUserIds: target.group.members,
      meetingPoint: target.group.meetingPoint,
    });
    chat.sendMessage(conversationId, text, s.currentUser.id);
    return {
      ok: true,
      el: `Στάλθηκε στην ομάδα «${target.event.title}».`,
      en: `Sent to the "${target.event.title}" group.`,
      link: { path: `/chat/${target.group.id}`, el: 'Άνοιγμα chat', en: 'Open chat' },
    };
  },
};

const openChatAction: CopilotAction = {
  name: 'open_chat',
  description: 'Open the group chat for an event, or the inbox when no event is given.',
  risk: 'safe',
  parameters: OBJ({ event: EVENT_REF }),
  run: (args, rt) => {
    if (args.event !== undefined && String(args.event ?? '').trim()) {
      const target = pickGroup(args, rt);
      if (!target) return fail('Δεν είσαι σε ομάδα για αυτή την εκδήλωση.', "You're not in a group for that event.");
      rt.navigate(`/chat/${target.group.id}`);
      return { ok: true, el: `Άνοιξα το chat της «${target.event.title}».`, en: `Opened the "${target.event.title}" chat.` };
    }
    rt.navigate('/chats');
    return { ok: true, el: 'Άνοιξα τις συνομιλίες.', en: 'Opened your chats.' };
  },
};

const connectionAction: CopilotAction = {
  name: 'respond_connection_request',
  description: 'Accept or decline a pending Nakamas (connection) request. If name is omitted, the oldest pending request is used.',
  risk: 'confirm',
  parameters: OBJ({ name: S('Name of the person who sent the request.'), accept: B('true = accept, false = decline') }, ['accept']),
  preview: (args) => {
    const req = findConnectionRequest(args);
    const name = req ? state().users.find((u) => u.id === req.fromUserId)?.name ?? '—' : '—';
    const accept = bool(args.accept) !== false;
    return { el: `${accept ? 'Αποδοχή' : 'Απόρριψη'} αιτήματος από ${name}`, en: `${accept ? 'Accept' : 'Decline'} request from ${name}` };
  },
  run: (args) => {
    const req = findConnectionRequest(args);
    if (!req) return fail('Δεν υπάρχει εκκρεμές αίτημα σύνδεσης.', 'There are no pending connection requests.');
    const name = state().users.find((u) => u.id === req.fromUserId)?.name ?? '';
    if (bool(args.accept) === false) {
      state().declineConnectionRequest(req.id);
      return { ok: true, el: `Απέρριψα το αίτημα από ${name}.`, en: `Declined ${name}'s request.` };
    }
    state().acceptConnectionRequest(req.id);
    return {
      ok: true,
      el: `Εσύ και ο/η ${name} είστε πλέον Nakamas.`,
      en: `You and ${name} are now Nakamas.`,
      link: { path: '/connections', el: 'Οι Nakamas μου', en: 'My Nakamas' },
    };
  },
};

function findConnectionRequest(args: ActionArgs) {
  const s = state();
  const uid = s.currentUser?.id;
  const pending = s.connectionRequests.filter((r) => r.toUserId === uid && r.status === 'pending');
  const name = str(args.name);
  if (!name) return pending[0];
  const key = normalize(name);
  return pending.find((r) => normalize(s.users.find((u) => u.id === r.fromUserId)?.name ?? '').includes(key)) ?? null;
}

const findCompanyAction: CopilotAction = {
  name: 'find_company',
  description: 'Open "Find Nakamas" (BuddySeek) to look for company or groups forming for events.',
  risk: 'safe',
  parameters: OBJ({}),
  run: (_args, rt) => {
    rt.navigate('/buddy-seek');
    return { ok: true, el: 'Άνοιξα το «Βρες Nakamas».', en: 'Opened "Find Nakamas".' };
  },
};

const themeAction: CopilotAction = {
  name: 'set_theme',
  description: 'Change the visual theme. Use "dark" / "light" to switch mode within the current family.',
  risk: 'safe',
  parameters: OBJ({ theme: S('Theme id, or "dark" / "light".', { enum: [...THEME_IDS, 'dark', 'light'] }) }, ['theme']),
  run: (args) => {
    const s = state();
    const prev = s.theme;
    const target = themeTarget(String(args.theme ?? ''), prev);
    if (!target) return fail('Δεν αναγνώρισα το θέμα.', "I didn't recognise that theme.");
    if (target === prev) return { ok: true, el: 'Αυτό το θέμα είναι ήδη ενεργό.', en: 'That theme is already active.' };
    s.setTheme(target);
    return {
      ok: true,
      el: `Εφάρμοσα το θέμα «${THEME_LABELS[target].el}».`,
      en: `Applied the "${THEME_LABELS[target].en}" theme.`,
      undo: () => state().setTheme(prev),
    };
  },
};

const languageAction: CopilotAction = {
  name: 'set_language',
  description: 'Change the interface language.',
  risk: 'safe',
  parameters: OBJ({ language: S('Language', { enum: ['el', 'en'] }) }, ['language']),
  run: (args) => {
    const lang = args.language === 'en' ? 'en' : 'el';
    const store = useLanguageStore.getState();
    const prev = store.language;
    if (prev === lang) return { ok: true, el: 'Η γλώσσα είναι ήδη αυτή.', en: 'That language is already active.' };
    store.setLanguage(lang);
    return {
      ok: true,
      el: lang === 'en' ? 'Η εφαρμογή είναι πλέον στα αγγλικά.' : 'Η εφαρμογή είναι πλέον στα ελληνικά.',
      en: lang === 'en' ? 'The app is now in English.' : 'The app is now in Greek.',
      undo: () => useLanguageStore.getState().setLanguage(prev),
    };
  },
};

const homeLayoutAction: CopilotAction = {
  name: 'set_home_layout',
  description: 'Change how rich the Discover page hero is: light (minimal), balanced, rich.',
  risk: 'safe',
  parameters: OBJ({ mode: S('Layout', { enum: ['light', 'balanced', 'rich'] }) }, ['mode']),
  run: (args) => {
    const mode = (['light', 'balanced', 'rich'] as const).find((m) => m === args.mode);
    if (!mode) return fail('Επίλεξε light, balanced ή rich.', 'Choose light, balanced or rich.');
    const prev = state().homeHeroMode;
    state().setHomeHeroMode(mode as HomeHeroMode);
    const label = { light: ['Μινιμαλιστική', 'Minimal'], balanced: ['Ισορροπημένη', 'Balanced'], rich: ['Πλούσια', 'Rich'] }[mode];
    return {
      ok: true,
      el: `Η Ανακάλυψη είναι πλέον σε «${label[0]}» προβολή.`,
      en: `Discover now uses the "${label[1]}" layout.`,
      undo: () => state().setHomeHeroMode(prev),
    };
  },
};

const bioAction: CopilotAction = {
  name: 'update_bio',
  description: "Replace the user's profile bio (visible to others).",
  risk: 'confirm',
  parameters: OBJ({ bio: S('New bio, max 200 characters.') }, ['bio']),
  preview: (args) => ({ el: `Νέο bio: «${str(args.bio) ?? ''}»`, en: `New bio: "${str(args.bio) ?? ''}"` }),
  run: (args) => {
    const s = state();
    const bio = (str(args.bio) ?? '').slice(0, 200);
    if (!s.currentUser || !bio) return fail('Λείπει το κείμενο.', 'The text is missing.');
    const prev = s.currentUser.bio;
    s.updateUser(s.currentUser.id, { bio });
    const uid = s.currentUser.id;
    return {
      ok: true,
      el: 'Ενημέρωσα το bio σου.',
      en: 'Your bio is updated.',
      undo: () => state().updateUser(uid, { bio: prev }),
      link: { path: '/profile', el: 'Προφίλ', en: 'Profile' },
    };
  },
};

function interestAction(add: boolean): CopilotAction {
  return {
    name: add ? 'add_interest' : 'remove_interest',
    description: add ? 'Add an interest to the profile (improves recommendations).' : 'Remove an interest from the profile.',
    risk: 'safe',
    parameters: OBJ({ interest: S('Interest or category name.') }, ['interest']),
    run: (args) => {
      const s = state();
      const raw = str(args.interest);
      if (!s.currentUser || !raw) return fail('Ποιο ενδιαφέρον;', 'Which interest?');
      const value = canonicalCategory(raw) ?? raw;
      const prev = s.currentUser.interests ?? [];
      const has = prev.some((i) => normalize(i) === normalize(value));
      if (add && has) return { ok: true, el: `Το «${value}» υπάρχει ήδη.`, en: `"${value}" is already there.` };
      if (!add && !has) return { ok: true, el: `Το «${value}» δεν είναι στα ενδιαφέροντά σου.`, en: `"${value}" isn't in your interests.` };
      const next = add ? [...prev, value] : prev.filter((i) => normalize(i) !== normalize(value));
      const uid = s.currentUser.id;
      s.updateUser(uid, { interests: next });
      return {
        ok: true,
        el: add ? `Πρόσθεσα «${value}» στα ενδιαφέροντα — οι προτάσεις σου θα προσαρμοστούν.` : `Αφαίρεσα «${value}» από τα ενδιαφέροντα.`,
        en: add ? `Added "${value}" to your interests — recommendations will adapt.` : `Removed "${value}" from your interests.`,
        undo: () => state().updateUser(uid, { interests: prev }),
      };
    },
  };
}

const PRIVACY_LABELS: Record<string, [string, string]> = {
  profileVisibility: ['Ορατότητα προφίλ', 'Profile visibility'],
  messagePermission: ['Ποιος στέλνει μηνύματα', 'Who can message'],
  shareLocation: ['Κοινοποίηση τοποθεσίας', 'Location sharing'],
  revealPhoto: ['Αποκάλυψη φωτογραφίας', 'Photo reveal'],
  allowMutualPing: ['Αμοιβαία ειδοποίηση', 'Mutual ping'],
  allowOrganizerMsg: ['Μηνύματα διοργανωτών', 'Organizer messages'],
};

function privacyPatch(args: ActionArgs): Partial<UserSettings['privacy']> {
  const patch: Partial<UserSettings['privacy']> = {};
  const vis = str(args.profileVisibility);
  if (vis === 'public' || vis === 'connections' || vis === 'private') patch.profileVisibility = vis;
  const msg = str(args.messagePermission);
  if (msg === 'everyone' || msg === 'connections' || msg === 'groups') patch.messagePermission = msg;
  for (const k of ['shareLocation', 'revealPhoto', 'allowMutualPing', 'allowOrganizerMsg'] as const) {
    const v = bool(args[k]);
    if (v !== undefined) patch[k] = v;
  }
  return patch;
}

function describePatch(patch: Record<string, unknown>, lang: 'el' | 'en'): string {
  return Object.entries(patch)
    .map(([k, v]) => {
      const label = PRIVACY_LABELS[k]?.[lang === 'el' ? 0 : 1] ?? k;
      const val = typeof v === 'boolean' ? (v ? (lang === 'el' ? 'ναι' : 'on') : lang === 'el' ? 'όχι' : 'off') : String(v);
      return `${label}: ${val}`;
    })
    .join(' · ');
}

const privacyAction: CopilotAction = {
  name: 'update_privacy',
  description: 'Change privacy settings (profile visibility, who can message, location sharing, photo reveal).',
  risk: 'confirm',
  parameters: OBJ({
    profileVisibility: S('Who can see the profile', { enum: ['public', 'connections', 'private'] }),
    messagePermission: S('Who can message', { enum: ['everyone', 'connections', 'groups'] }),
    shareLocation: B('Share location with confirmed groups.'),
    revealPhoto: B('Reveal photo before group confirmation.'),
    allowMutualPing: B('Allow mutual pings.'),
    allowOrganizerMsg: B('Allow organizers to message.'),
  }),
  preview: (args) => {
    const p = privacyPatch(args);
    return { el: `Απόρρητο → ${describePatch(p, 'el') || '—'}`, en: `Privacy → ${describePatch(p, 'en') || '—'}` };
  },
  run: (args) => {
    const s = state();
    const patch = privacyPatch(args);
    if (Object.keys(patch).length === 0) return fail('Δεν κατάλαβα ποια ρύθμιση να αλλάξω.', "I didn't catch which setting to change.");
    const prev = { ...(s.userSettings?.privacy ?? DEFAULT_USER_SETTINGS.privacy) };
    s.updatePrivacySettings(patch);
    return {
      ok: true,
      el: `Ενημέρωσα το απόρρητο: ${describePatch(patch, 'el')}.`,
      en: `Privacy updated: ${describePatch(patch, 'en')}.`,
      undo: () => state().updatePrivacySettings(prev),
      link: { path: '/settings', el: 'Ρυθμίσεις', en: 'Settings' },
    };
  },
};

const notifPrefsAction: CopilotAction = {
  name: 'update_notification_prefs',
  description: 'Turn notification categories on or off.',
  risk: 'safe',
  parameters: OBJ({
    matches: B('New group matches.'),
    messages: B('Chat messages.'),
    reminders: B('Event reminders.'),
    promos: B('Promotions & news.'),
  }),
  run: (args) => {
    const s = state();
    const prev = { ...(s.userSettings?.notificationPrefs ?? DEFAULT_USER_SETTINGS.notificationPrefs) };
    const next = { ...prev };
    const labels: Record<string, [string, string]> = {
      matches: ['ταιριάσματα', 'matches'],
      messages: ['μηνύματα', 'messages'],
      reminders: ['υπενθυμίσεις', 'reminders'],
      promos: ['προωθητικά', 'promotions'],
    };
    const changed: string[] = [];
    for (const k of ['matches', 'messages', 'reminders', 'promos'] as const) {
      const v = bool(args[k]);
      if (v !== undefined && v !== next[k]) {
        next[k] = v;
        changed.push(k);
      }
    }
    if (changed.length === 0) return { ok: true, el: 'Δεν χρειάστηκε αλλαγή.', en: 'Nothing needed to change.' };
    s.updateUserSettings({ notificationPrefs: next });
    const fmt = (lang: 0 | 1) => changed.map((k) => `${labels[k][lang]}: ${next[k as keyof typeof next] ? (lang ? 'on' : 'ναι') : lang ? 'off' : 'όχι'}`).join(', ');
    return {
      ok: true,
      el: `Ειδοποιήσεις → ${fmt(0)}.`,
      en: `Notifications → ${fmt(1)}.`,
      undo: () => state().updateUserSettings({ notificationPrefs: prev }),
    };
  },
};

const sidebarAction: CopilotAction = {
  name: 'toggle_sidebar',
  description: 'Collapse or expand the desktop side navigation.',
  risk: 'safe',
  parameters: OBJ({ collapsed: B('true = collapse') }, ['collapsed']),
  run: (args) => {
    const prev = state().sidebarCollapsed;
    const next = bool(args.collapsed) ?? !prev;
    state().setSidebarCollapsed(next);
    return {
      ok: true,
      el: next ? 'Σύμπτυξα την πλευρική πλοήγηση.' : 'Επέκτεινα την πλευρική πλοήγηση.',
      en: next ? 'Collapsed the sidebar.' : 'Expanded the sidebar.',
      undo: () => state().setSidebarCollapsed(prev),
    };
  },
};

const markReadAction: CopilotAction = {
  name: 'mark_notifications_read',
  description: 'Mark all notifications as read.',
  risk: 'safe',
  parameters: OBJ({}),
  run: () => {
    const prev = state().notifications;
    const unread = prev.filter((n) => !n.read).length;
    if (unread === 0) return { ok: true, el: 'Δεν έχεις αδιάβαστες ειδοποιήσεις.', en: 'You have no unread notifications.' };
    state().markAllNotificationsRead();
    return {
      ok: true,
      el: `Σημείωσα ${unread} ειδοποιήσεις ως αναγνωσμένες.`,
      en: `Marked ${unread} notifications as read.`,
      undo: () => useStore.setState({ notifications: prev }),
    };
  },
};

const notifSummaryAction: CopilotAction = {
  name: 'summarize_notifications',
  description: 'Summarise unread notifications.',
  risk: 'safe',
  parameters: OBJ({}),
  run: () => {
    const unread = state().notifications.filter((n) => !n.read);
    if (unread.length === 0) return { ok: true, el: 'Είσαι ενημερωμένος — καμία νέα ειδοποίηση.', en: "You're all caught up — no new notifications." };
    const top = unread.slice(0, 4);
    return {
      ok: true,
      el: `Έχεις ${unread.length} αδιάβαστες:\n${top.map((n) => `• ${n.messageGr || n.messageEn}`).join('\n')}`,
      en: `You have ${unread.length} unread:\n${top.map((n) => `• ${n.messageEn || n.messageGr}`).join('\n')}`,
      link: { path: '/notifications', el: 'Ειδοποιήσεις', en: 'Notifications' },
      data: { unread: unread.length, items: top.map((n) => n.messageEn) },
    };
  },
};

/** Same source as the Home welcome-back line (lib/returnVisit), so both always agree. */
const whatsNewAction: CopilotAction = {
  name: 'whats_new',
  description: "Catch the user up: their next plan within two days, new plans for them since the last visit, unread messages and notifications.",
  risk: 'safe',
  parameters: OBJ({}),
  run: () => {
    const s = state();
    const user = s.currentUser;
    if (!user) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const now = new Date();
    const previous = previousVisitAt(user.id);
    const since = previous ?? now.getTime() - 7 * 24 * 3600 * 1000;
    const mine = new Set(s.groups.filter((g) => g.members.includes(user.id) || g.pendingMembers?.includes(user.id)).map((g) => g.eventId));
    const next = s.events
      .filter((e) => mine.has(e.id))
      .map((e) => ({ id: e.id, title: e.title, start: new Date(`${e.date}T${/^\d{2}:\d{2}$/.test(e.time ?? '') ? e.time : '12:00'}:00`) }))
      .filter((e) => !Number.isNaN(e.start.getTime()) && e.start.getTime() >= now.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime())[0] ?? null;
    const newPlans = s.companyRequests.filter(
      (r) => r.status === 'active' && r.creatorUserId !== user.id && Date.parse(r.createdAt) > since,
    ).length;
    const unreadChats = useChatStore.getState().conversations.reduce((n, c) => n + (c.status === 'archived' ? 0 : c.unreadCount), 0);
    // Asked directly, so news counts even within the same session.
    const parts = buildReturnSummary({
      now,
      previousVisitAt: 0,
      nextEvent: next,
      newPlans,
      unreadChats,
      unreadNotifications: s.notifications.filter((n) => !n.read).length,
    });
    if (parts.length === 0) {
      return { ok: true, el: 'Είσαι ενημερωμένος: τίποτα νέο αυτή τη στιγμή.', en: "You're all caught up: nothing new right now." };
    }
    const tEl = (g: string) => g;
    const tEn = (_g: string, e: string) => e;
    const first = parts[0];
    return {
      ok: true,
      el: `Τι νέο υπάρχει:\n${parts.map((p) => `• ${describeReturnPart(p, tEl)}`).join('\n')}`,
      en: `What's new:\n${parts.map((p) => `• ${describeReturnPart(p, tEn)}`).join('\n')}`,
      link: { path: returnPartPath(first), el: 'Άνοιγμα', en: 'Open' },
      data: { parts: parts.map((p) => p.kind), newPlans, unreadChats },
    };
  },
};

const progressAction: CopilotAction = {
  name: 'show_progress',
  description: "Report the user's XP, level, badges and joined challenges.",
  risk: 'safe',
  parameters: OBJ({}),
  run: () => {
    const s = state();
    if (!s.currentUser) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const xp = computeUserXp(s.currentUser, true, Object.keys(s.feedbackSubmitted).length, s.bonusXp);
    const lvl = levelForXp(xp);
    // Same live source as the Achievements page (lib/achievements.ts).
    const achievements = computeAchievements({ user: s.currentUser, events: s.events, groups: s.groups, feedbackEventIds: Object.keys(s.feedbackSubmitted) });
    const badges = achievements.filter((b) => b.unlocked).length;
    const next = achievements.filter((b) => !b.unlocked).sort((x, y) => y.progress / y.goal - x.progress / x.goal)[0];
    const nextEl = next ? ` Πιο κοντά είσαι στο «${next.titleEl}» (${next.progress}/${next.goal}).` : '';
    const nextEn = next ? ` Closest next badge: "${next.titleEn}" (${next.progress}/${next.goal}).` : '';
    return {
      ok: true,
      el: `Επίπεδο ${lvl.level} («${lvl.titleEl}») με ${xp} XP — ${lvl.nextAt - xp} XP για το επόμενο. Badges: ${badges}/${achievements.length}. Ενεργές προκλήσεις: ${s.challengesJoined.length}.${nextEl}`,
      en: `Level ${lvl.level} ("${lvl.titleEn}") with ${xp} XP — ${lvl.nextAt - xp} XP to go. Badges: ${badges}/${achievements.length}. Active challenges: ${s.challengesJoined.length}.${nextEn}`,
      link: { path: '/achievements', el: 'Επιτεύγματα', en: 'Achievements' },
      data: { xp, level: lvl.level },
    };
  },
};

const reportAction: CopilotAction = {
  name: 'report_issue',
  description: 'File a problem report to the moderation team (requires confirmation).',
  risk: 'confirm',
  parameters: OBJ(
    {
      category: S('Report category', { enum: ['safety', 'harassment', 'no_show', 'technical', 'payment', 'other'] }),
      description: S('What happened, in the user\'s words.'),
      severity: S('Severity', { enum: ['low', 'medium', 'high'] }),
    },
    ['description'],
  ),
  preview: (args) => ({
    el: `Αναφορά (${str(args.category) ?? 'other'}, ${str(args.severity) ?? 'medium'}): «${str(args.description) ?? ''}»`,
    en: `Report (${str(args.category) ?? 'other'}, ${str(args.severity) ?? 'medium'}): "${str(args.description) ?? ''}"`,
  }),
  run: (args) => {
    const description = str(args.description);
    if (!description) return fail('Περίγραψέ μου τι συνέβη.', 'Tell me what happened.');
    const sev = str(args.severity);
    const id = state().submitIssueReport({
      category: str(args.category) ?? 'other',
      severity: sev === 'low' || sev === 'high' ? sev : 'medium',
      description,
      evidenceNames: [],
    });
    return {
      ok: true,
      el: `Η αναφορά καταχωρήθηκε (#${id.slice(-6)}). Η ομάδα ασφαλείας θα την εξετάσει.`,
      en: `Report filed (#${id.slice(-6)}). The safety team will review it.`,
    };
  },
};

const explainAction: CopilotAction = {
  name: 'explain',
  description: 'Answer a question about how Nakamas works (reliability, tiers, groups, safety, Find Nakamas, XP, privacy, payments, cancelling).',
  risk: 'safe',
  parameters: OBJ({ topic: S('Topic id or the question', { enum: KNOWLEDGE_TOPICS.map((k) => k.id) }) }, ['topic']),
  run: (args) => {
    const raw = String(args.topic ?? '');
    const topic = KNOWLEDGE_TOPICS.find((k) => k.id === raw) ?? findTopic(normalize(raw));
    if (!topic) return capabilitiesAction.run({}, {} as ActionRuntime) as ActionResult;
    const ans = topic.answer(state().currentUser);
    return {
      ok: true,
      el: ans.el,
      en: ans.en,
      link: topic.path ? { path: topic.path, el: topic.titleEl, en: topic.titleEn } : undefined,
    };
  },
};

const capabilitiesAction: CopilotAction = {
  name: 'capabilities',
  description: 'Explain what the assistant can do.',
  risk: 'safe',
  parameters: OBJ({}),
  run: () => ({
    ok: true,
    el:
      'Μπορώ να κάνω πράγματα για σένα σε όλη την εφαρμογή:\n• Να βρω και να προτείνω εκδηλώσεις (κατηγορία, ημέρα, τιμή, περιοχή)\n• Να αποθηκεύσω, να ανοίξω, να βάλω στο ημερολόγιο ή να ξεκινήσω ένταξη σε ομάδα\n• Να συνοψίσω το πρόγραμμα και τις ειδοποιήσεις σου\n• Να σου πω τι νέο υπάρχει από την τελευταία σου επίσκεψη: «τι νέο;»\n• Να στείλω μήνυμα στην ομάδα σου ή να δημιουργήσω εκδήλωση (με επιβεβαίωση)\n• Να αλλάξω θέμα, γλώσσα, απόρρητο, ειδοποιήσεις, ενδιαφέροντα\n• Να εξηγήσω αξιοπιστία, βαθμίδες, ασφάλεια, XP\nΌ,τι κάνω αναιρείται με ένα κλικ.',
    en:
      'I can act for you across the app:\n• Find and recommend events (category, day, price, area)\n• Save, open, add to calendar or start joining a group\n• Summarise your schedule and notifications\n• Catch you up on what is new since your last visit: “what’s new?”\n• Message your group or create an event (with confirmation)\n• Change theme, language, privacy, notifications, interests\n• Explain reliability, tiers, safety and XP\nEverything I do can be undone in one click.',
  }),
};

const resolveReportAction: CopilotAction = {
  name: 'resolve_report',
  description: 'Admin only: change the status of an issue report.',
  risk: 'confirm',
  adminOnly: true,
  parameters: OBJ(
    { reportId: S('Report id (or "latest").'), status: S('New status', { enum: ['reviewing', 'resolved', 'dismissed'] }) },
    ['status'],
  ),
  preview: (args) => ({ el: `Αναφορά → ${str(args.status)}`, en: `Report → ${str(args.status)}` }),
  run: (args) => {
    const s = state();
    const id = str(args.reportId);
    const report = !id || id === 'latest' ? s.issueReports.find((r) => r.status === 'open') : s.issueReports.find((r) => r.id === id || r.id.endsWith(id));
    if (!report) return fail('Δεν βρήκα ανοικτή αναφορά.', 'No open report found.');
    const status = (['reviewing', 'resolved', 'dismissed'] as const).find((x) => x === args.status) ?? 'reviewing';
    const prev = report.status;
    s.resolveIssueReport(report.id, status);
    s.logAdminAction(`ai_${status}`, report.id);
    return {
      ok: true,
      el: `Η αναφορά «${report.category}» → ${status}.`,
      en: `Report "${report.category}" → ${status}.`,
      undo: () => state().resolveIssueReport(report.id, prev),
    };
  },
};

export const COPILOT_ACTIONS: CopilotAction[] = [
  navigateAction,
  searchAction,
  recommendAction,
  openEventAction,
  saveAction,
  unsaveAction,
  waitlistAction,
  joinFlowAction,
  calendarAction,
  leaveGroupAction,
  agendaAction,
  draftEventAction,
  createEventAction,
  messageAction,
  openChatAction,
  connectionAction,
  findCompanyAction,
  themeAction,
  languageAction,
  homeLayoutAction,
  bioAction,
  interestAction(true),
  interestAction(false),
  privacyAction,
  notifPrefsAction,
  sidebarAction,
  markReadAction,
  notifSummaryAction,
  whatsNewAction,
  progressAction,
  reportAction,
  explainAction,
  capabilitiesAction,
  resolveReportAction,
];

export function getAction(name: string): CopilotAction | undefined {
  return COPILOT_ACTIONS.find((a) => a.name === name);
}

/** Actions visible to the current user (least privilege: admin tools hidden from members). */
export function availableActions(): CopilotAction[] {
  const isAdmin = isPlatformAdmin(state().currentUser);
  return COPILOT_ACTIONS.filter((a) => !a.adminOnly || isAdmin);
}

/** Gemini `functionDeclarations` for the actions available to the current user. */
export function toFunctionDeclarations() {
  return availableActions().map((a) => {
    const hasParams = Object.keys(a.parameters.properties ?? {}).length > 0;
    return hasParams
      ? { name: a.name, description: a.description, parameters: a.parameters }
      : { name: a.name, description: a.description };
  });
}
