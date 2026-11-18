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
import { downloadCalendarIcs } from '../lib/calendarIcs';
import { FORM_DRAFT_ROUTES, stashFormDraft } from '../lib/formDraft';
import { homePathWithCategory, homePathWithSearch } from '../lib/homeDeepLinks';
import { formatWalletEur, WALLET_DEMO } from '../lib/walletDemo';
import { nextVerifyGap, verifyDemo, verifyDemoSnapshot, type VerifyDemoMethod } from '../lib/verifyDemo';
import { APP_ROUTES, routeById } from './routes';
import { KNOWLEDGE_TOPICS, findTopic } from './knowledge';
import { extractDateRange, CATEGORY_SYNONYMS } from './entities';
import { normalize } from './text';
import { resolveEventRef, searchEvents } from './eventSearch';
import { rankWhereIs } from './whereIs';
import type { ActionArgs, ActionResult, ActionRuntime, CopilotAction, ParamSchema } from './types';
import { isPlatformAdmin } from '../lib/roles';
import { buildReturnSummary, describeReturnPart, returnPartPath } from '../lib/returnVisit';
import { previousVisitAt } from '../lib/visitClock';
import { interestLabel } from '../lib/interests';
import { visiblePosts, wallPrivacyOf } from '../lib/audience';
import type { Audience } from '../types/wall';
import { COLLECTIONS, collectionById, collectionEvents, formingGroups, venueById, timeMinus } from '../lib/outings';
import { standingFor, strikeLabel } from '../lib/consequences';
import { eventStartMs } from '../store/outingsSlice';
import { notificationsForUser } from '../lib/notificationsUtil';

/** The wall store loads on demand so the first page (login) never ships wall code. */
const loadWallStore = () => import('../store/wallStore').then((m) => m.useWallStore);

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

const SETTINGS_SECTIONS = ['availability', 'chat', 'buddy-seek'] as const;

const navigateAction: CopilotAction = {
  name: 'navigate',
  description:
    'Open a page of the app. For settings, optional section deep-links: availability, chat, buddy-seek.',
  risk: 'safe',
  parameters: OBJ({
    page: S('Destination page id', { enum: APP_ROUTES.map((r) => r.id) }),
    section: S('Settings deep-link section', { enum: [...SETTINGS_SECTIONS] }),
  }, ['page']),
  run: (args, rt) => {
    const route = routeById(String(args.page ?? ''));
    if (!route) return fail('Δεν βρήκα αυτή τη σελίδα.', "I couldn't find that page.");
    if (route.adminOnly && !isPlatformAdmin(state().currentUser)) {
      return fail('Η σελίδα διαχείρισης είναι μόνο για διαχειριστές.', 'The admin page is for admins only.');
    }
    let path = route.path;
    const section = str(args.section);
    if (route.id === 'settings' && section && (SETTINGS_SECTIONS as readonly string[]).includes(section)) {
      path = section === 'availability' ? '/settings?availability=1' : `/settings?section=${section}`;
    }
    rt.navigate(path);
    return { ok: true, el: `Άνοιξα: ${route.labelEl}.`, en: `Opened ${route.labelEn}.`, data: { path } };
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
    const top = (s.currentUser?.interests ?? []).slice(0, 3);
    const interestsEl = top.map((i) => interestLabel(i, 'el')).join(', ');
    const interestsEn = top.map((i) => interestLabel(i, 'en')).join(', ');
    return {
      ok: true,
      el: top.length ? `Με βάση τα ενδιαφέροντά σου (${interestsEl}), προτείνω:` : 'Αυτές ξεχωρίζουν αυτή τη στιγμή:',
      en: top.length ? `Based on your interests (${interestsEn}), I suggest:` : 'These stand out right now:',
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
      el: `Σε έβαλα στη λίστα αναμονής για «${e.title}». Αποθηκεύτηκε στα σχέδιά σου — παρακολούθησε από εκεί αν ανοίξει θέση.`,
      en: `You're on the waitlist for "${e.title}". Saved on My plans — watch there if a seat opens.`,
      link: { path: '/plans', el: 'Τα σχέδιά μου', en: 'My plans' },
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
    const uid = state().currentUser?.id;
    state().leaveGroup(g.id);
    // Φ27 — a seat handed to the waitlist belongs to someone else now: no undo.
    const after = state().groups.find((x) => x.id === g.id);
    const handedOver = Boolean(uid && after?.lastTransfer?.fromUserId === uid && Date.now() - Date.parse(after.lastTransfer.at) < 60_000);
    return {
      ok: true,
      el: handedOver
        ? `Αποχώρησες από την ομάδα για «${e.title}». Η θέση σου πέρασε στο πρώτο άτομο της λίστας αναμονής.`
        : `Αποχώρησες από την ομάδα για «${e.title}».`,
      en: handedOver
        ? `You left the group for "${e.title}". Your seat passed to the first person on the waitlist.`
        : `You left the group for "${e.title}".`,
      ...(handedOver ? {} : { undo: () => state().joinGroup(g.id) }),
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
    // Single prefill channel: form draft stash. `?ai=1` only flags the banner.
    // Organizer deep-links keep using `?edit=` / `?template=` separately.
    stashFormDraft(
      'event',
      {
        title: d.title,
        category: d.category,
        date: d.date,
        time: d.time,
        location: d.area,
        description: d.description,
        max: d.maxParticipants,
        price: d.price,
      },
      'AI draft',
    );
    rt.navigate(`${FORM_DRAFT_ROUTES.event}?ai=1`);
    return {
      ok: true,
      el: 'Άνοιξα τη φόρμα δημιουργίας με τα στοιχεία συμπληρωμένα. Έλεγξέ τα και πάτα «Δημοσίευση».',
      en: 'Opened the create form with the details filled in. Review them and press "Publish".',
    };
  },
};

const draftProfileAction: CopilotAction = {
  name: 'draft_profile',
  description: 'Open the profile with bio / name / interests proposed — nothing is saved until the user confirms.',
  risk: 'safe',
  parameters: OBJ({
    bio: S('Proposed bio text.'),
    name: S('Proposed display name.'),
    interest: S('Interest to propose adding.'),
  }),
  run: (args, rt) => {
    if (!state().currentUser) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const fields: Record<string, string> = {};
    const bio = str(args.bio);
    const name = str(args.name);
    const interest = str(args.interest);
    if (bio) fields.bio = bio;
    if (name) fields.name = name;
    if (interest) fields.interest = interest;
    if (Object.keys(fields).length === 0) {
      rt.navigate(FORM_DRAFT_ROUTES.profile);
      return { ok: true, el: 'Άνοιξα το προφίλ σου.', en: 'Opened your profile.' };
    }
    stashFormDraft('profile', fields, 'AI draft');
    rt.navigate(`${FORM_DRAFT_ROUTES.profile}?aiDraft=1`);
    return {
      ok: true,
      el: 'Πρότεινα αλλαγές στο προφίλ — έλεγξέ τις και πάτα Αποθήκευση.',
      en: 'Proposed profile changes — review them and press Save.',
      link: { path: '/profile', el: 'Προφίλ', en: 'Profile' },
    };
  },
};

const whereIsAction: CopilotAction = {
  name: 'where_is',
  description: 'Answer "where do I …?" by ranking app pages (and Help) from the route registry.',
  risk: 'safe',
  parameters: OBJ({ query: S('The where/how-do-I question.') }, ['query']),
  run: (args, rt) => {
    const query = str(args.query) ?? '';
    if (!query) return fail('Πες μου τι ψάχνεις — π.χ. «πού εξάγω το ημερολόγιο;».', 'Tell me what you are looking for — e.g. "where do I export the calendar?".');
    const hits = rankWhereIs(query, isPlatformAdmin(state().currentUser), 3);
    if (hits.length === 0) {
      const nq = normalize(query);
      // Bridge to Help deep-links (`?topic=`) or a concrete route when Help has no matching topic.
      if (/xp|επιτευγμ|badge|επιπεδ/.test(nq)) {
        rt.navigate('/achievements');
        return {
          ok: true,
          el: 'Άνοιξα τα Επιτεύγματα — εκεί φαίνονται XP και badges.',
          en: 'Opened Achievements — XP and badges live there.',
          link: { path: '/achievements', el: 'Επιτεύγματα', en: 'Achievements' },
        };
      }
      const topic = /ομαδ|group/.test(nq)
        ? 'groups'
        : /ασφαλει|safety/.test(nq)
          ? 'safety'
          : /πληρωμ|payment|wallet|πορτοφ/.test(nq)
            ? 'payments'
            : null;
      const helpPath = topic ? `/help?topic=${topic}` : '/help';
      rt.navigate(helpPath);
      return {
        ok: true,
        el: 'Δεν βρήκα ακριβή σελίδα — άνοιξα το Κέντρο Βοήθειας. Μπορείς και να με ρωτήσεις διαφορετικά.',
        en: "I couldn't pin a page — opened Help. You can also rephrase the question.",
        link: { path: helpPath, el: 'Βοήθεια', en: 'Help' },
      };
    }
    const top = hits[0];
    const nq = normalize(query);
    const path =
      top.route.id === 'help'
        ? /ομαδ|group/.test(nq)
          ? '/help?topic=groups'
          : /ασφαλει|safety/.test(nq)
            ? '/help?topic=safety'
            : /πληρωμ|payment|wallet|πορτοφ/.test(nq)
              ? '/help?topic=payments'
              : top.route.path
        : top.route.path;
    rt.navigate(path);
    const linesEl = hits.map((h) => `• ${h.route.labelEl} — ${h.reasonEl}`).join('\n');
    const linesEn = hits.map((h) => `• ${h.route.labelEn} — ${h.reasonEn}`).join('\n');
    return {
      ok: true,
      el: `Το βρήκα εδώ:\n${linesEl}`,
      en: `Here is where:\n${linesEn}`,
      link: { path, el: top.route.labelEl, en: top.route.labelEn },
      data: { paths: hits.map((h) => h.route.path) },
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

const PRIVACY_VALUE_LABELS: Record<string, [string, string]> = {
  public: ['δημόσιο', 'public'],
  connections: ['μόνο συνδέσεις Nakamas', 'connections only'],
  private: ['ιδιωτικό', 'private'],
  everyone: ['όλοι', 'everyone'],
  groups: ['ομάδες ίδιας εκδήλωσης', 'same event groups'],
};

function describePatch(patch: Record<string, unknown>, lang: 'el' | 'en'): string {
  return Object.entries(patch)
    .map(([k, v]) => {
      const label = PRIVACY_LABELS[k]?.[lang === 'el' ? 0 : 1] ?? k;
      let val: string;
      if (typeof v === 'boolean') {
        val = v ? (lang === 'el' ? 'ναι' : 'on') : lang === 'el' ? 'όχι' : 'off';
      } else if (typeof v === 'string' && PRIVACY_VALUE_LABELS[v]) {
        val = PRIVACY_VALUE_LABELS[v][lang === 'el' ? 0 : 1];
      } else {
        val = String(v);
      }
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

/* ───────────────────────── wall (Φ26) ───────────────────────── */

const WALL_AUDIENCES = ['public', 'connections', 'friends_of_friends', 'only_me'] as const;
const WALL_AUDIENCE_LABEL: Record<string, [string, string]> = {
  public: ['Δημόσιο — όλο το δίκτυο Nakamas', 'Public — the whole Nakamas network'],
  connections: ['Nakamas μου', 'My Nakamas'],
  friends_of_friends: ['Nakamas των Nakamas', 'Friends of friends'],
  only_me: ['Μόνο εγώ', 'Only me'],
  specific: ['Συγκεκριμένα άτομα', 'Specific people'],
  list: ['Λίστα', 'List'],
};

function wallAudienceArg(args: ActionArgs, byUser: Parameters<typeof wallPrivacyOf>[0]): Audience {
  const a = str(args.audience);
  if (a && (WALL_AUDIENCES as readonly string[]).includes(a)) return { base: a as Audience['base'] };
  const me = state().currentUser?.id ?? '';
  return wallPrivacyOf(byUser, me).defaultAudience;
}

const postToWallAction: CopilotAction = {
  name: 'post_to_wall',
  description:
    "Publish a post on the user's own wall (Nakamas Wall). Audience: public (whole network), connections, friends_of_friends or only_me; omitted = the user's default. Optionally attach an event.",
  risk: 'confirm',
  parameters: OBJ(
    {
      text: S('Post text, max 2000 characters, in the language the user wrote.'),
      audience: S('Who can see it', { enum: [...WALL_AUDIENCES] }),
      event: EVENT_REF,
    },
    ['text'],
  ),
  preview: (args, rt) => {
    const chosen = str(args.audience);
    const label = chosen && WALL_AUDIENCE_LABEL[chosen] ? WALL_AUDIENCE_LABEL[chosen] : ['η προεπιλογή σου', 'your default'];
    const ev = args.event !== undefined ? resolveEvent(args.event, rt) : null;
    const text = (str(args.text) ?? '').slice(0, 140);
    return {
      el: `Δημοσίευση στον τοίχο σου · Κοινό: ${label[0]}${ev ? ` · Εκδήλωση: ${ev.title}` : ''}\n«${text}»`,
      en: `Post on your wall · Audience: ${label[1]}${ev ? ` · Event: ${ev.title}` : ''}\n"${text}"`,
    };
  },
  run: async (args, rt) => {
    const text = (str(args.text) ?? '').slice(0, 2000);
    if (!text) return fail('Τι να γράψω; Πες μου το κείμενο σε «εισαγωγικά».', 'What should I post? Give me the text in "quotes".');
    const ev = args.event !== undefined ? resolveEvent(args.event, rt) : null;
    const useWallStore = await loadWallStore();
    const audience = wallAudienceArg(args, useWallStore.getState().privacyByUser);
    const res = useWallStore.getState().createPost({ text, audience, eventId: ev?.id });
    if (!res.ok || !res.id) return fail(res.reasonEl ?? 'Δεν δημοσιεύτηκε.', res.reasonEn ?? 'Not posted.');
    const id = res.id;
    const [el, en] = WALL_AUDIENCE_LABEL[audience.base] ?? WALL_AUDIENCE_LABEL.connections;
    return {
      ok: true,
      el: `Δημοσιεύτηκε στον τοίχο σου (κοινό: ${el}).`,
      en: `Posted on your wall (audience: ${en}).`,
      undo: () => {
        useWallStore.getState().deletePost(id);
      },
      link: { path: '/wall', el: 'Τοίχος', en: 'Wall' },
      data: { postId: id, audience: audience.base },
    };
  },
};

const limitPastPostsAction: CopilotAction = {
  name: 'limit_past_posts',
  description: "Make all of the user's past public / friends-of-friends wall posts visible to their Nakamas (connections) only.",
  risk: 'confirm',
  parameters: OBJ({}),
  preview: () => ({
    el: 'Οι δημόσιες δημοσιεύσεις σου (και όσες βλέπουν οι Nakamas των Nakamas) θα γίνουν ορατές μόνο στους Nakamas σου.',
    en: 'Your public (and friends-of-friends) posts will become visible to your Nakamas only.',
  }),
  run: async () => {
    const useWallStore = await loadWallStore();
    const previous = useWallStore.getState().limitPastPosts();
    const n = Object.keys(previous).length;
    if (n === 0) return { ok: true, el: 'Όλες οι δημοσιεύσεις σου είναι ήδη μόνο για Nakamas (ή στενότερο κοινό).', en: 'All your posts are already Nakamas-only (or narrower).' };
    return {
      ok: true,
      el: `Περιόρισα ${n} δημοσιεύσεις στους Nakamas σου.`,
      en: `Limited ${n} posts to your Nakamas.`,
      undo: () => useWallStore.getState().restoreAudiences(previous),
      link: { path: '/profile?tab=privacy', el: 'Απόρρητο', en: 'Privacy' },
    };
  },
};

const summarizeWallAction: CopilotAction = {
  name: 'summarize_wall',
  description: "Summarise what the user's Nakamas are posting (latest posts visible to the user) and their unread wall activity.",
  risk: 'safe',
  parameters: OBJ({}),
  run: async () => {
    const s = state();
    const me = s.currentUser;
    if (!me) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const w = (await loadWallStore()).getState();
    const ctx = {
      graph: { users: s.users, lists: w.lists, viewerBlockedIds: s.blockedUserIds, suspendedUserIds: s.suspendedUserIds },
      privacyByUser: w.privacyByUser,
    };
    const hidden = w.hiddenPostIds[me.id] ?? [];
    const latest = visiblePosts(me.id, w.posts, ctx, { hiddenIds: hidden }).filter((p) => p.authorId !== me.id).slice(0, 4);
    const unread = w.activity.filter((a) => a.recipientId === me.id && !a.read && !s.blockedUserIds.includes(a.actorId)).length;
    if (latest.length === 0 && unread === 0) {
      return {
        ok: true,
        el: 'Ησυχία στον τοίχο — κανένα νέο από τους Nakamas σου. Θες να γράψεις τι σχεδιάζεις;',
        en: 'Quiet on the wall — nothing new from your Nakamas. Want to share what you are planning?',
        link: { path: '/wall', el: 'Τοίχος', en: 'Wall' },
      };
    }
    const nameOf = (id: string) => s.users.find((u) => u.id === id)?.name ?? id;
    const line = (p: (typeof latest)[number], lang: 'el' | 'en') => {
      const ev = p.eventId ? s.events.find((e) => e.id === p.eventId) : undefined;
      const text = p.text.length > 90 ? `${p.text.slice(0, 90)}…` : p.text;
      return `• ${nameOf(p.authorId)}: ${text}${ev ? (lang === 'el' ? ` (εκδήλωση: ${ev.title})` : ` (event: ${ev.title})`) : ''}`;
    };
    const head = (lang: 'el' | 'en') =>
      unread > 0
        ? lang === 'el'
          ? `Έχεις ${unread} νέα στη δραστηριότητα του τοίχου.`
          : `You have ${unread} new in your wall activity.`
        : '';
    return {
      ok: true,
      el: [head('el'), latest.length ? `Τελευταία από τους Nakamas σου:\n${latest.map((p) => line(p, 'el')).join('\n')}` : ''].filter(Boolean).join('\n'),
      en: [head('en'), latest.length ? `Latest from your Nakamas:\n${latest.map((p) => line(p, 'en')).join('\n')}` : ''].filter(Boolean).join('\n'),
      link: { path: '/wall', el: 'Τοίχος', en: 'Wall' },
      data: { posts: latest.map((p) => ({ id: p.id, author: nameOf(p.authorId), text: p.text.slice(0, 140), eventId: p.eventId })), unread },
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
    social: B('Wall activity: comments, reactions, posts on my wall, tags.'),
  }),
  run: (args) => {
    const s = state();
    const prev = { ...DEFAULT_USER_SETTINGS.notificationPrefs, ...(s.userSettings?.notificationPrefs ?? {}) };
    const next = { ...prev };
    const labels: Record<string, [string, string]> = {
      matches: ['ταιριάσματα', 'matches'],
      messages: ['μηνύματα', 'messages'],
      reminders: ['υπενθυμίσεις', 'reminders'],
      promos: ['προωθητικά', 'promotions'],
      social: ['δραστηριότητα τοίχου', 'wall activity'],
    };
    const changed: string[] = [];
    for (const k of ['matches', 'messages', 'reminders', 'promos', 'social'] as const) {
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
    const uid = state().currentUser?.id;
    const unread = notificationsForUser(prev, uid).filter((n) => !n.read).length;
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
    const uid = state().currentUser?.id;
    const unread = notificationsForUser(state().notifications, uid).filter((n) => !n.read);
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
  description:
    "Catch the user up: next plan, new plans, unread messages/notifications, pending feedback, verify gaps, incoming company joins.",
  risk: 'safe',
  parameters: OBJ({}),
  run: async () => {
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
    const w = (await loadWallStore()).getState();
    const wallCtx = {
      graph: { users: s.users, lists: w.lists, viewerBlockedIds: s.blockedUserIds, suspendedUserIds: s.suspendedUserIds },
      privacyByUser: w.privacyByUser,
    };
    const newPosts = visiblePosts(user.id, w.posts, wallCtx).filter((p) => p.authorId !== user.id && Date.parse(p.createdAt) > since).length;
    const parts = buildReturnSummary({
      now,
      previousVisitAt: 0,
      nextEvent: next,
      newPlans,
      unreadChats,
      unreadNotifications: notificationsForUser(s.notifications, user.id).filter((n) => !n.read).length,
      newPosts,
    });
    const extras: { el: string; en: string; path: string }[] = [];
    const pendingFeedback = s.getPendingFeedbackEventId();
    if (pendingFeedback) {
      const title = s.events.find((e) => e.id === pendingFeedback)?.title ?? pendingFeedback;
      extras.push({
        el: `Εκκρεμεί αξιολόγηση για «${title}»`,
        en: `Pending review for "${title}"`,
        path: `/history/feedback/${pendingFeedback}`,
      });
    }
    const incomingJoins = s.companyJoinRequests.filter((j) => j.targetUserId === user.id && j.status === 'pending').length;
    if (incomingJoins > 0) {
      extras.push({
        el: incomingJoins === 1 ? '1 νέο αίτημα παρέας' : `${incomingJoins} νέα αιτήματα παρέας`,
        en: incomingJoins === 1 ? '1 company join request' : `${incomingJoins} company join requests`,
        path: '/buddy-seek',
      });
    }
    const gaps: string[] = [];
    if (!user.emailVerified) gaps.push('email');
    if (!user.phoneVerified) gaps.push('phone');
    if (gaps.length > 0) {
      extras.push({
        el: `Λείπει επαλήθευση: ${gaps.join(', ')}`,
        en: `Verification still needed: ${gaps.join(', ')}`,
        path: '/verification',
      });
    }
    if (parts.length === 0 && extras.length === 0) {
      return { ok: true, el: 'Είσαι ενημερωμένος: τίποτα νέο αυτή τη στιγμή.', en: "You're all caught up: nothing new right now." };
    }
    const tEl = (g: string) => g;
    const tEn = (_g: string, e: string) => e;
    const firstPath = parts.length > 0 ? returnPartPath(parts[0]) : extras[0]?.path ?? '/';
    const elLines = [
      ...parts.map((p) => `• ${describeReturnPart(p, tEl)}`),
      ...extras.map((e) => `• ${e.el}`),
    ];
    const enLines = [
      ...parts.map((p) => `• ${describeReturnPart(p, tEn)}`),
      ...extras.map((e) => `• ${e.en}`),
    ];
    return {
      ok: true,
      el: `Τι νέο υπάρχει:\n${elLines.join('\n')}`,
      en: `What's new:\n${enLines.join('\n')}`,
      link: { path: firstPath, el: 'Άνοιγμα', en: 'Open' },
      data: {
        parts: parts.map((p) => p.kind),
        extras: extras.map((e) => e.path),
        newPlans,
        unreadChats,
        pendingFeedback,
        incomingJoins,
        verifyGaps: gaps,
      },
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

const startVerificationAction: CopilotAction = {
  name: 'start_verification',
  description:
    'Open Identity Verification and complete one demo email/phone/id step (same helper as the Verification Center buttons).',
  risk: 'safe',
  parameters: OBJ({
    method: S('Verification method', { enum: ['email', 'phone', 'id', 'any'] }),
  }),
  run: (args, rt) => {
    const user = state().currentUser;
    if (!user) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const method = str(args.method) ?? 'any';
    const pick: VerifyDemoMethod | null =
      method === 'email' || method === 'phone' || method === 'id'
        ? method
        : nextVerifyGap(user);
    if (!pick) {
      rt.navigate('/verification');
      return {
        ok: true,
        el: 'Είσαι ήδη επαληθευμένος σε email, τηλέφωνο και ταυτότητα.',
        en: 'You are already verified for email, phone and ID.',
        link: { path: '/verification', el: 'Επαλήθευση', en: 'Verification' },
      };
    }
    const prev = verifyDemoSnapshot(user);
    const changed = verifyDemo(pick);
    const path = `/verification?method=${pick}`;
    rt.navigate(path);
    const labels = {
      email: ['email', 'email'],
      phone: ['τηλέφωνο', 'phone'],
      id: ['ταυτότητα', 'ID'],
    } as const;
    if (!changed) {
      return {
        ok: true,
        el: `Το ${labels[pick][0]} είναι ήδη επαληθευμένο — άνοιξα το Κέντρο Επαλήθευσης.`,
        en: `${labels[pick][1]} is already verified — opened Verification.`,
        link: { path, el: 'Επαλήθευση', en: 'Verification' },
      };
    }
    return {
      ok: true,
      el: `Ολοκλήρωσα demo επαλήθευση ${labels[pick][0]} και άνοιξα το Κέντρο Επαλήθευσης.`,
      en: `Completed demo ${labels[pick][1]} verification and opened Verification.`,
      undo: () => state().updateUser(user.id, prev),
      link: { path, el: 'Επαλήθευση', en: 'Verification' },
    };
  },
};

const openFeedbackAction: CopilotAction = {
  name: 'open_feedback',
  description: 'Open the pending post-event feedback form, or History if none is pending.',
  risk: 'safe',
  parameters: OBJ({ event: EVENT_REF }),
  run: (args, rt) => {
    const s = state();
    if (!s.currentUser) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const explicit = str(args.event);
    const id =
      explicit && explicit !== 'this'
        ? resolveEvent(args.event, rt)?.id
        : s.getPendingFeedbackEventId() ?? resolveEvent(args.event, rt)?.id;
    if (!id) {
      rt.navigate('/history');
      return {
        ok: true,
        el: 'Δεν έχεις εκκρεμή αξιολόγηση — άνοιξα το Ιστορικό.',
        en: 'No pending review — opened History.',
        link: { path: '/history', el: 'Ιστορικό', en: 'History' },
      };
    }
    const path = `/history/feedback/${id}`;
    rt.navigate(path);
    const title = s.events.find((e) => e.id === id)?.title ?? id;
    return {
      ok: true,
      el: `Άνοιξα την αξιολόγηση για «${title}».`,
      en: `Opened the review for "${title}".`,
      link: { path, el: 'Αξιολόγηση', en: 'Review' },
    };
  },
};

const exportAgendaAction: CopilotAction = {
  name: 'export_agenda',
  description: 'Download a bulk .ics of the user upcoming joined/saved plans (same as Calendar export).',
  risk: 'safe',
  parameters: OBJ({}),
  run: () => {
    const s = state();
    if (!s.currentUser) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const uid = s.currentUser.id;
    const joined = new Set(s.groups.filter((g) => g.members.includes(uid)).map((g) => g.eventId));
    const now = new Date().toISOString().slice(0, 10);
    const events = s.events
      .filter(
        (e) =>
          e.status !== 'cancelled' &&
          e.date >= now &&
          (joined.has(e.id) || s.savedEvents.includes(e.id) || s.waitlistedEvents.includes(e.id)),
      )
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    if (events.length === 0) {
      return {
        ok: true,
        el: 'Δεν υπάρχουν επερχόμενα σχέδια για εξαγωγή.',
        en: 'There are no upcoming plans to export.',
        link: { path: '/agenda', el: 'Ημερολόγιο', en: 'Calendar' },
      };
    }
    downloadCalendarIcs(
      events.map((e) => ({
        title: e.title,
        date: e.date,
        time: e.time,
        locationArea: e.locationArea,
      })),
      'parea-calendar.ics',
    );
    return {
      ok: true,
      el: `Εξήγαγα ${events.length} εκδηλώσεις σε .ics.`,
      en: `Exported ${events.length} events to .ics.`,
      link: { path: '/agenda', el: 'Ημερολόγιο', en: 'Calendar' },
      data: { count: events.length },
    };
  },
};

const summarizeWalletAction: CopilotAction = {
  name: 'summarize_wallet',
  description: 'Summarise available and pending earnings and offer a bridge to payout management.',
  risk: 'safe',
  parameters: OBJ({}),
  run: (_args, rt) => {
    const s = state();
    if (!s.currentUser) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    if (!s.currentUser.isOrganizer) {
      rt.navigate('/wallet');
      return {
        ok: true,
        el: 'Το πορτοφόλι είναι για διοργανωτές — άνοιξα τη σελίδα για να δεις τη demo προβολή.',
        en: 'Wallet is for organizers — opened the page so you can see the demo view.',
        link: { path: '/wallet', el: 'Πορτοφόλι', en: 'Wallet' },
      };
    }
    return {
      ok: true,
      el: `Demo στοιχεία: διαθέσιμο ${formatWalletEur(WALLET_DEMO.availableEur)}, εκκρεμές ${formatWalletEur(WALLET_DEMO.pendingEur)}. Θες διαχείριση πληρωμών;`,
      en: `Demo figures: available ${formatWalletEur(WALLET_DEMO.availableEur)}, pending ${formatWalletEur(WALLET_DEMO.pendingEur)}. Want payout management?`,
      link: { path: '/wallet', el: 'Πορτοφόλι', en: 'Wallet' },
      data: { available: WALLET_DEMO.availableEur, pending: WALLET_DEMO.pendingEur, demo: true },
    };
  },
};

/** Live trust/verify gaps — bridges to Trust or the next Verification method (no second verify mutate). */
const summarizeTrustAction: CopilotAction = {
  name: 'summarize_trust',
  description:
    'Summarise reliability score and open verification gaps, then bridge to Trust Center or Verification.',
  risk: 'safe',
  parameters: OBJ({}),
  run: (_args, rt) => {
    const user = state().currentUser;
    if (!user) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const score = user.reliabilityScore ?? 0;
    const stars = (score / 20).toFixed(1);
    const gap = nextVerifyGap(user);
    const labels = {
      email: ['email', 'email'],
      phone: ['τηλέφωνο', 'phone'],
      id: ['ταυτότητα', 'ID'],
    } as const;
    if (!gap) {
      rt.navigate('/trust');
      return {
        ok: true,
        el: `Αξιοπιστία ${stars}/5 (${score}/100). Email και τηλέφωνο είναι εντάξει — άνοιξα τη σελίδα αξιοπιστίας.`,
        en: `Reliability ${stars}/5 (${score}/100). Email and phone are in order — opened the reliability page.`,
        link: { path: '/trust', el: 'Αξιοπιστία', en: 'Reliability' },
        data: { score, gap: null },
      };
    }
    const path = `/verification?method=${gap}`;
    rt.navigate(path);
    return {
      ok: true,
      el: `Αξιοπιστία ${stars}/5 (${score}/100). Επόμενο κενό: ${labels[gap][0]} — άνοιξα την επαλήθευση.`,
      en: `Reliability ${stars}/5 (${score}/100). Next gap: ${labels[gap][1]} — opened Verification.`,
      link: { path, el: 'Επαλήθευση', en: 'Verification' },
      data: { score, gap },
    };
  },
};

const listFormingAction: CopilotAction = {
  name: 'list_forming_plans',
  description: 'List active Find-Nakamas company requests (plans forming) the user can join or review.',
  risk: 'safe',
  parameters: OBJ({ limit: N('Max items (1-8, default 5).') }),
  run: (args, rt) => {
    const s = state();
    const user = s.currentUser;
    if (!user) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const limit = Math.min(8, Math.max(1, Math.floor(num(args.limit) ?? 5)));
    const active = s.companyRequests
      .filter((r) => r.status === 'active')
      .slice(0, limit);
    if (active.length === 0) {
      rt.navigate('/buddy-seek');
      return {
        ok: true,
        el: 'Δεν υπάρχουν ανοιχτά σχέδια αυτή τη στιγμή — άνοιξα το Βρες Nakamas.',
        en: 'No open plans right now — opened Find Nakamas.',
        link: { path: '/buddy-seek', el: 'Βρες Nakamas', en: 'Find Nakamas' },
      };
    }
    const lines = (lang: 'el' | 'en') =>
      active
        .map((r) => {
          const e = s.events.find((x) => x.id === r.eventId);
          const title = e?.title ?? r.eventId;
          const mine = r.creatorUserId === user.id;
          return `• ${title}${mine ? (lang === 'el' ? ' (δικό σου)' : ' (yours)') : ''}`;
        })
        .join('\n');
    return {
      ok: true,
      el: `Ανοιχτά σχέδια (${active.length}):\n${lines('el')}`,
      en: `Open plans (${active.length}):\n${lines('en')}`,
      link: { path: '/buddy-seek', el: 'Βρες Nakamas', en: 'Find Nakamas' },
      data: { ids: active.map((r) => r.id) },
    };
  },
};

const respondCompanyJoinAction: CopilotAction = {
  name: 'respond_company_join',
  description: 'Accept or decline a pending company join request on Find Nakamas (requires confirmation).',
  risk: 'confirm',
  parameters: OBJ(
    {
      accept: B('true = accept, false = decline'),
      requestId: S('Join request id, or omit for the newest pending for you.'),
    },
    ['accept'],
  ),
  preview: (args) => {
    const accept = bool(args.accept) !== false;
    return {
      el: accept ? 'Αποδοχή αιτήματος παρέας' : 'Απόρριψη αιτήματος παρέας',
      en: accept ? 'Accept company join request' : 'Decline company join request',
    };
  },
  run: (args, rt) => {
    const s = state();
    const user = s.currentUser;
    if (!user) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const accept = bool(args.accept) !== false;
    const id = str(args.requestId);
    const pending = s.companyJoinRequests.filter((j) => j.targetUserId === user.id && j.status === 'pending');
    const join = id
      ? s.companyJoinRequests.find((j) => j.id === id || j.id.endsWith(id))
      : pending[0];
    if (!join || join.targetUserId !== user.id || join.status !== 'pending') {
      return fail('Δεν βρήκα εκκρεμές αίτημα παρέας.', 'No pending company join request found.');
    }
    if (accept) {
      const groupId = s.acceptCompanyJoinRequest(join.id);
      if (!groupId) return fail('Αποτυχία αποδοχής αιτήματος.', 'Could not accept the request.');
      rt.navigate(`/chat/${groupId}`);
      return {
        ok: true,
        el: 'Αποδέχτηκα το αίτημα και άνοιξα το chat συντονισμού.',
        en: 'Accepted the request and opened the coordination chat.',
        link: { path: `/chat/${groupId}`, el: 'Chat', en: 'Chat' },
      };
    }
    s.declineCompanyJoinRequest(join.id);
    return {
      ok: true,
      el: 'Απέρριψα το αίτημα παρέας.',
      en: 'Declined the company join request.',
      link: { path: '/buddy-seek', el: 'Βρες Nakamas', en: 'Find Nakamas' },
    };
  },
};

const joinChallengeAction: CopilotAction = {
  name: 'join_challenge',
  description: 'Join or leave a gamification challenge by id (c1, c2, c3, …).',
  risk: 'safe',
  parameters: OBJ({ challengeId: S('Challenge id, e.g. c1.'), leave: B('true = leave instead of join') }, ['challengeId']),
  run: (args) => {
    const s = state();
    if (!s.currentUser) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const id = str(args.challengeId);
    if (!id) return fail('Πες μου ποια πρόκληση (π.χ. c1).', 'Tell me which challenge (e.g. c1).');
    const leave = bool(args.leave) === true;
    const joined = s.challengesJoined.includes(id);
    if (leave && !joined) {
      return { ok: true, el: 'Δεν είσαι σε αυτή την πρόκληση.', en: 'You are not in that challenge.' };
    }
    if (!leave && joined) {
      return {
        ok: true,
        el: 'Είσαι ήδη σε αυτή την πρόκληση.',
        en: 'You are already in that challenge.',
        link: { path: '/challenges', el: 'Προκλήσεις', en: 'Challenges' },
      };
    }
    s.toggleChallengeJoined(id);
    return {
      ok: true,
      el: leave ? `Έφυγες από την πρόκληση ${id}.` : `Μπήκες στην πρόκληση ${id}.`,
      en: leave ? `Left challenge ${id}.` : `Joined challenge ${id}.`,
      undo: () => state().toggleChallengeJoined(id),
      link: { path: '/challenges', el: 'Προκλήσεις', en: 'Challenges' },
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
      'Μπορώ να κάνω πράγματα για σένα σε όλη την εφαρμογή:\n• Να βρω και να προτείνω εκδηλώσεις (κατηγορία, ημέρα, τιμή, περιοχή)\n• Να αποθηκεύσω, να ανοίξω, να βάλω στο ημερολόγιο ή να ξεκινήσω ένταξη σε ομάδα\n• Να συνοψίσω το πρόγραμμα, τις ειδοποιήσεις, το πορτοφόλι και την αξιοπιστία σου\n• Να εξάγω όλο το ημερολόγιο σε .ics και να ανοίξω εκκρεμή αξιολόγηση\n• Να ξεκινήσω επαλήθευση και να σου πω τι νέο υπάρχει (και κενά εμπιστοσύνης)\n• Να δείξω σχέδια που σχηματίζονται και να απαντήσω σε αιτήματα παρέας\n• Να απαντήσω «πού …;» με where_is και να προτείνω πρόχειρα φόρμας (εκδήλωση/προφίλ)\n• Να μπω σε προκλήσεις, να στείλω μήνυμα ή να δημιουργήσω εκδήλωση (με επιβεβαίωση)\n• Να δημοσιεύσω στον τοίχο σου με το κοινό που επιλέγεις, να σου πω τι γράφουν οι Nakamas σου ή να περιορίσω παλαιότερες δημοσιεύσεις\n• Να αλλάξω θέμα, γλώσσα, απόρρητο, ειδοποιήσεις, ενδιαφέροντα\nΌ,τι κάνω αναιρείται με ένα κλικ.',
    en:
      'I can act for you across the app:\n• Find and recommend events (category, day, price, area)\n• Save, open, add to calendar or start joining a group\n• Summarise your schedule, notifications, wallet and trust\n• Export the whole calendar as .ics and open a pending review\n• Start verification and catch you up on what’s new (including trust gaps)\n• List plans forming and respond to company join requests\n• Answer “where do I …?” and propose form drafts (event/profile)\n• Join challenges, message your group or create an event (with confirmation)\n• Post on your wall with the audience you choose, catch you up on your Nakamas’ posts, or limit past posts\n• Change theme, language, privacy, notifications, interests\nEverything I do can be undone in one click.',
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

/* ───────────────────────── Φ27 — outings ───────────────────────── */

/** The user's next group outing (or the one for a given event). */
function nextMyGroup(eventId?: string): { group: Group; event: Event } | null {
  const s = state();
  const uid = s.currentUser?.id;
  if (!uid) return null;
  const now = Date.now();
  const mine = s.groups
    .filter((g) => g.members.includes(uid) && g.status !== 'cancelled' && (!eventId || g.eventId === eventId))
    .map((g) => ({ group: g, event: s.events.find((e) => e.id === g.eventId) }))
    .filter((x): x is { group: Group; event: Event } => Boolean(x.event));
  if (eventId) return mine[0] ?? null;
  const upcoming = mine
    .map((x) => ({ ...x, start: eventStartMs(x.event) ?? 0 }))
    .filter((x) => x.start >= now - 6 * 3_600_000)
    .sort((a, b) => a.start - b.start);
  return upcoming[0] ?? null;
}

const showMyNightAction: CopilotAction = {
  name: 'show_my_night',
  description:
    'Open «Η βραδιά μας» (Our night) for the user’s next group outing, or for a given event: door ticket/check-in, meeting point, pre-meet place, group code, who is coming.',
  risk: 'safe',
  parameters: OBJ({ event: EVENT_REF }),
  run: (args, rt) => {
    const e = args.event !== undefined && args.event !== null && str(String(args.event)) ? resolveEvent(args.event, rt) : null;
    const found = nextMyGroup(e?.id);
    if (!found) {
      return fail(
        e ? `Δεν είσαι σε ομάδα για «${e.title}».` : 'Δεν έχεις κάποια προσεχή έξοδο με ομάδα. Θες να βρούμε μία;',
        e ? `You're not in a group for "${e.title}".` : "You don't have an upcoming group outing. Want to find one?",
      );
    }
    const { group: g, event: ev } = found;
    const revealed = g.status === 'confirmed' || g.status === 'completed';
    const venue = venueById(g.preMeet?.venueId);
    const path = `/night/${g.id}`;
    rt.navigate(path);
    const parts = (lang: 'el' | 'en') =>
      [
        formatEventLine(ev, lang),
        lang === 'el' ? `${g.members.length}/${g.targetSize} μέλη` : `${g.members.length}/${g.targetSize} members`,
        revealed && g.meetingPoint ? (lang === 'el' ? `Σημείο: ${g.meetingPoint}` : `Meeting point: ${g.meetingPoint}`) : null,
        revealed && venue && g.preMeet
          ? lang === 'el'
            ? `Συνάντηση πριν: ${venue.name} στις ${timeMinus(ev.time, g.preMeet.minutesBefore)}`
            : `Meet before: ${venue.name} at ${timeMinus(ev.time, g.preMeet.minutesBefore)}`
          : null,
        g.discountUnlocked && g.code ? (lang === 'el' ? `Κωδικός ομάδας: ${g.code}` : `Group code: ${g.code}`) : null,
      ]
        .filter(Boolean)
        .join('\n');
    return {
      ok: true,
      el: `Άνοιξα «Η βραδιά μας».\n${parts('el')}`,
      en: `Opened «Our night».\n${parts('en')}`,
      link: { path, el: 'Η βραδιά μας', en: 'Our night' },
      data: { groupId: g.id, eventId: ev.id },
    };
  },
};

const MINI_KINDS = ['coffee', 'walk', 'run', 'drink'] as const;
const MINI_LABEL: Record<(typeof MINI_KINDS)[number], [string, string]> = {
  coffee: ['Καφές', 'Coffee'],
  walk: ['Βόλτα', 'Walk'],
  run: ['Τρέξιμο', 'Run'],
  drink: ['Ένα ποτό', 'A drink'],
};

const createMiniOutingAction: CopilotAction = {
  name: 'create_mini_outing',
  description:
    'Create a small outing without an event (coffee, walk, run or a drink) for 2–6 people in «Βρες Nakamas». Same trust rules as events; the exact spot is shown to members only.',
  risk: 'confirm',
  parameters: OBJ(
    {
      kind: S('Kind of outing.', { enum: [...MINI_KINDS] }),
      date: S('Date as YYYY-MM-DD (today or later).'),
      time: S('Start time HH:MM (24h).'),
      area: S('Neighbourhood shown to everyone, e.g. "Koukaki".'),
      spot: S('Exact spot, shown to members only (optional).'),
      size: N('Group size including the user (2-6, default 3).'),
      womenNb: B('Women & non-binary only (requires the user to have set it in their profile).'),
    },
    ['kind', 'date', 'time', 'area'],
  ),
  preview: (args) => {
    const k = (MINI_KINDS as readonly string[]).includes(String(args.kind)) ? (args.kind as (typeof MINI_KINDS)[number]) : 'coffee';
    return {
      el: `Νέα μικρή έξοδος: ${MINI_LABEL[k][0]} · ${str(args.area) ?? ''} · ${str(args.date) ?? ''} ${str(args.time) ?? ''}`,
      en: `New small outing: ${MINI_LABEL[k][1]} · ${str(args.area) ?? ''} · ${str(args.date) ?? ''} ${str(args.time) ?? ''}`,
    };
  },
  run: (args, rt) => {
    const s = state();
    if (!s.currentUser) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const kind = (MINI_KINDS as readonly string[]).includes(String(args.kind)) ? (args.kind as (typeof MINI_KINDS)[number]) : 'coffee';
    const date = str(args.date);
    const time = str(args.time);
    const area = str(args.area);
    const today = new Date().toISOString().slice(0, 10);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < today) return fail('Χρειάζομαι σημερινή ή μελλοντική ημερομηνία (ΕΕΕΕ-ΜΜ-ΗΗ).', 'I need today or a future date (YYYY-MM-DD).');
    if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return fail('Χρειάζομαι ώρα (π.χ. 11:00).', 'I need a time (e.g. 11:00).');
    if (!area) return fail('Σε ποια περιοχή;', 'Which area?');
    const size = Math.min(6, Math.max(2, Math.floor(num(args.size) ?? 3)));
    const groupId = s.createMiniOuting({
      kind,
      date,
      time,
      area: area.includes(',') ? area : `${area}, Athens`,
      exactLocation: str(args.spot),
      size,
      genderMode: bool(args.womenNb) ? 'women_nb' : 'mixed',
    });
    if (!groupId) return fail('Δεν μπορείς να ξεκινήσεις έξοδο όσο ισχύει παύση.', 'You cannot start an outing while a pause applies.');
    const g = state().groups.find((x) => x.id === groupId);
    const path = `/night/${groupId}`;
    rt.navigate(path);
    return {
      ok: true,
      el: `Δημοσιεύτηκε: ${MINI_LABEL[kind][0]} · ${area} · ${date} ${time} για ${size} άτομα${g?.genderMode === 'women_nb' ? ' (γυναίκες & μη δυαδικά)' : ''}.`,
      en: `Published: ${MINI_LABEL[kind][1]} · ${area} · ${date} ${time} for ${size} people${g?.genderMode === 'women_nb' ? ' (women & non-binary)' : ''}.`,
      link: { path, el: 'Η βραδιά μας', en: 'Our night' },
      undo: () => {
        if (g) state().cancelEvent(g.eventId);
      },
    };
  },
};

const openCollectionAction: CopilotAction = {
  name: 'open_collection',
  description:
    'Open a themed collection of events (free, weekend, first time solo, quiet nights, outdoors, Nakamas Nights) with how many groups are forming.',
  risk: 'safe',
  parameters: OBJ({ collection: S('Collection id.', { enum: COLLECTIONS.map((c) => c.id) }) }),
  run: (args, rt) => {
    const c = collectionById(str(args.collection));
    if (!c) {
      rt.navigate('/collections');
      return { ok: true, el: 'Άνοιξα τις Συλλογές.', en: 'Opened Collections.', link: { path: '/collections', el: 'Συλλογές', en: 'Collections' } };
    }
    const s = state();
    const today = new Date().toISOString().slice(0, 10);
    const list = collectionEvents(c, s.events, s.groups).filter((e) => e.date >= today);
    const forming = list.reduce((n, e) => n + formingGroups(e, s.groups).length, 0);
    const path = `/collections/${c.id}`;
    rt.navigate(path);
    return {
      ok: true,
      el: `«${c.el}»: ${list.length} προσεχείς εκδηλώσεις, ${forming} παρέες σχηματίζονται.${list[0] ? `\nΠρώτη: ${formatEventLine(list[0], 'el')}` : ''}`,
      en: `"${c.en}": ${list.length} upcoming events, ${forming} groups forming.${list[0] ? `\nFirst: ${formatEventLine(list[0], 'en')}` : ''}`,
      link: { path, el: c.el, en: c.en },
      eventIds: list.slice(0, 8).map((e) => e.id),
    };
  },
};

const summarizeStandingAction: CopilotAction = {
  name: 'summarize_standing',
  description:
    'Explain the user’s standing (warning / 7-day pause / review) from absences and late cancels in the last 90 days, and how to appeal.',
  risk: 'safe',
  parameters: OBJ({}),
  run: (_args, rt) => {
    const s = state();
    const me = s.currentUser;
    if (!me) return fail('Χρειάζεται σύνδεση.', 'You need to sign in.');
    const st = standingFor(s.strikes, me.id);
    const mine = s.strikes.filter((x) => x.userId === me.id);
    const pending = mine.filter((x) => x.appeal?.status === 'pending').length;
    const last = mine.sort((a, b) => b.at.localeCompare(a.at))[0];
    rt.navigate('/trust');
    const tEl = (el: string) => el;
    return {
      ok: true,
      el: `${st.titleEl}. ${st.explainEl}${last ? `\nΤελευταίο: ${strikeLabel(last.kind, tEl)}.` : ''}${pending ? `\nΕνστάσεις σε εξέταση: ${pending}.` : ''}${last && !last.appeal ? '\nΜπορείς να κάνεις ένσταση στη σελίδα αξιοπιστίας.' : ''}`,
      en: `${st.titleEn}. ${st.explainEn}${last ? `\nLatest: ${strikeLabel(last.kind, (_e, en) => en)}.` : ''}${pending ? `\nAppeals under review: ${pending}.` : ''}${last && !last.appeal ? '\nYou can appeal on the reliability page.' : ''}`,
      link: { path: '/trust', el: 'Αξιοπιστία', en: 'Reliability' },
      data: { level: st.level, active: st.active },
    };
  },
};

const inviteFriendsAction: CopilotAction = {
  name: 'invite_friends',
  description:
    'Create (or reuse) an invite link for the user’s group outing that friends can answer without an account.',
  risk: 'safe',
  parameters: OBJ({ event: EVENT_REF }),
  run: (args, rt) => {
    const e = args.event !== undefined && args.event !== null && str(String(args.event)) ? resolveEvent(args.event, rt) : null;
    const found = nextMyGroup(e?.id);
    if (!found) return fail('Δεν βρήκα ομάδα σου για πρόσκληση.', "I couldn't find a group of yours to invite to.");
    if (found.group.members.length >= found.group.targetSize) return fail('Η ομάδα είναι πλήρης.', 'The group is full.');
    const id = state().createPlanInvite(found.group.id);
    if (!id) return fail('Δεν μπόρεσα να φτιάξω πρόσκληση.', 'I could not create an invite.');
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/i/${id}`;
    return {
      ok: true,
      el: `Ο σύνδεσμος πρόσκλησης για «${found.event.title}»: ${url}\nΟι φίλοι σου απαντούν χωρίς λογαριασμό· τα ονόματα τα βλέπεις μόνο εσύ.`,
      en: `Invite link for "${found.event.title}": ${url}\nFriends answer without an account; only you see the names.`,
      link: { path: `/night/${found.group.id}`, el: 'Η βραδιά μας', en: 'Our night' },
      data: { inviteId: id, url },
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
  exportAgendaAction,
  draftEventAction,
  draftProfileAction,
  whereIsAction,
  createEventAction,
  messageAction,
  openChatAction,
  connectionAction,
  findCompanyAction,
  listFormingAction,
  respondCompanyJoinAction,
  startVerificationAction,
  openFeedbackAction,
  summarizeWalletAction,
  summarizeTrustAction,
  joinChallengeAction,
  themeAction,
  languageAction,
  homeLayoutAction,
  bioAction,
  interestAction(true),
  interestAction(false),
  privacyAction,
  postToWallAction,
  limitPastPostsAction,
  summarizeWallAction,
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
  showMyNightAction,
  createMiniOutingAction,
  openCollectionAction,
  summarizeStandingAction,
  inviteFriendsAction,
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
