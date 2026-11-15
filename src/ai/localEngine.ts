/**
 * Local (on-device) copilot engine — deterministic bilingual intent parser.
 *
 * Works with zero API keys and zero network, so the AI-first experience never
 * breaks (graceful degradation). Produces the same `PlannedCall`s as the
 * Gemini engine, so execution, confirmation and undo are identical.
 */
import type { EnginePlan, PlannedCall } from './types';
import {
  extractArea,
  extractCategories,
  extractDateRange,
  extractLanguage,
  extractOrdinal,
  extractPrice,
  extractQuotedOrTail,
  extractTheme,
  extractTime,
  isDemonstrative,
} from './entities';
import { findTopic, isQuestion } from './knowledge';
import { CATEGORY_CATALOG } from '../lib/categoriesCatalog';
import { matchRoute } from './routes';
import { hasAny, normalize } from './text';
import { isWhereIsQuestion } from './whereIs';

export interface LocalEngineContext {
  /** Language for generated content (e.g. draft titles). */
  lang?: 'el' | 'en';
  isAdmin: boolean;
  areas: string[];
  userNames: string[];
  lastEventIds: string[];
  now?: Date;
}

export const UNDO_CALL = '__undo';

const NAV_VERBS = ['πηγαινε', 'παμε', 'ανοιξε', 'δειξε μου', 'δειξε', 'μεταβαση', 'μετεφερε', 'go to', 'open', 'show me', 'show', 'take me', 'navigate'];
const SEARCH_VERBS = ['βρεσ', 'ψαξε', 'ψαχνω', 'αναζητ', 'θελω', 'υπαρχει', 'υπαρχουν', 'εχει κατι', 'find', 'search', 'look for', 'looking for', 'any ', 'is there', 'are there'];
const FILLER = new Set([
  'το', 'τη', 'την', 'τον', 'τα', 'τισ', 'του', 'τησ', 'στο', 'στη', 'στην', 'στα', 'μου', 'σου', 'για', 'και', 'να', 'με', 'σε', 'απο', 'μια', 'ενα', 'αυτο', 'αυτη', 'εκδηλωση', 'εκδηλωσεισ', 'παρακαλω',
  'τι', 'κανω', 'κανουμε', 'παω', 'παμε', 'βγω', 'βγουμε', 'θα', 'μπορω', 'ηθελα', 'κατι', 'ωραιο', 'καλο',
  'the', 'a', 'an', 'to', 'my', 'me', 'for', 'and', 'please', 'event', 'events', 'it', 'this', 'that', 'of', 'in', 'on',
  'what', 'should', 'could', 'can', 'do', 'go', 'out', 'there', 'is', 'are', 'anything', 'something', 'fun', 'i', 'we',
]);

function call(name: string, args: Record<string, unknown> = {}): PlannedCall {
  return { name, args };
}

function leftover(n: string, stems: readonly string[]): string {
  let out = ` ${n} `;
  for (const stem of [...stems].sort((a, b) => b.length - a.length)) out = out.split(stem).join(' ');
  return out
    .split(' ')
    .filter((w) => w.length >= 2 && !FILLER.has(w))
    .join(' ')
    .trim();
}

function eventRef(n: string, verbs: readonly string[]): string | number | null {
  const ord = extractOrdinal(n);
  if (ord !== null) return ord;
  const rest = leftover(n, verbs);
  if (rest.length >= 4) return rest;
  if (isDemonstrative(n)) return THIS_EVENT;
  return null;
}

/** Sentinel: the event in focus (event page) or the first of the last results. */
export const THIS_EVENT = 'this';

function dateArgs(n: string, now?: Date) {
  const r = extractDateRange(n, now);
  return r ? { dateFrom: r.from.slice(0, 10), dateTo: r.to.slice(0, 10), dateLabelEl: r.labelEl, dateLabelEn: r.labelEn } : {};
}

function reply(el: string, en: string): EnginePlan {
  return { reply: { el, en }, calls: [] };
}

export function planLocal(input: string, ctx: LocalEngineContext): EnginePlan {
  const raw = input.trim();
  const n = normalize(raw);
  const p = ` ${n} `;
  if (!n) return { calls: [call('capabilities')] };

  /* 1 ─ greetings & capabilities */
  if (/^(γεια|γεια σου|γεια σασ|καλημερα|καλησπερα|hi|hello|hey|yo)[!. ]*$/.test(n)) {
    return {
      reply: { el: 'Γεια! Πες μου τι θες να κάνεις — π.χ. «βρες μου δωρεάν εκδηλώσεις αυτό το σαββατοκύριακο».', en: 'Hi! Tell me what you want to do — e.g. "find free events this weekend".' },
      calls: [],
    };
  }
  if (hasAny(p, ['τι μπορεισ', 'τι κανεισ', 'what can you', 'what do you do', ' help ', ' βοηθεια ', 'πωσ με βοηθασ']) && !hasAny(p, NAV_VERBS)) {
    return { calls: [call('capabilities')] };
  }
  if (/^(ευχαριστω|thanks|thank you|thx|τελεια|ωραια|ok|οκ)[!. ]*$/.test(n)) {
    return reply('Με χαρά! Ό,τι άλλο χρειαστείς, εδώ είμαι.', "You're welcome! I'm here if you need anything else.");
  }

  /* 1b ─ catch me up («τι νέο;», «τι έχασα;») */
  if (
    hasAny(p, ['τι νεο', 'τι νεα', 'τι εχασα', 'ενημερωσε με', 'ενημερωση για μενα', 'whats new', 'what s new', 'what is new', 'what did i miss', 'catch me up', 'any news']) &&
    !hasAny(p, ['ειδοποιησ', 'notification'])
  ) {
    return { calls: [call('whats_new')] };
  }

  /* 1b2 ─ where do I …? */
  if (isWhereIsQuestion(n)) {
    return { calls: [call('where_is', { query: raw.slice(0, 120) })] };
  }

  /* 1b3 ─ draft profile proposal */
  if (
    hasAny(p, ['προφιλ', 'profile', 'bio', 'βιογραφ']) &&
    hasAny(p, ['προτειν', 'draft', 'συμπληρωσ', 'γραψε μου', 'propose', 'fill'])
  ) {
    const text = extractQuotedOrTail(raw);
    const args: Record<string, unknown> = {};
    if (text && hasAny(p, ['bio', 'βιογραφ', 'περιγραφ'])) args.bio = text;
    else if (text) args.bio = text;
    return { calls: [call('draft_profile', args)] };
  }

  /* 1c ─ verification / feedback / wallet / export / challenges / forming plans */
  if (hasAny(p, ['επαληθευ', 'verify', 'verification']) && hasAny(p, ['ξεκινα', 'κανε', 'ολοκληρ', 'start', 'complete', 'do '])) {
    const method = hasAny(p, ['email', 'ηλεκτρον', 'μαιλ']) ? 'email'
      : hasAny(p, ['τηλεφων', 'phone', 'sms']) ? 'phone'
      : hasAny(p, ['ταυτοτ', 'id ', ' identity']) ? 'id'
      : 'any';
    return { calls: [call('start_verification', { method })] };
  }
  if (hasAny(p, ['αξιολογησ', 'feedback', 'review', 'βαθμολογ']) && hasAny(p, ['εκκρεμ', 'pending', 'ανοιξ', 'open', 'γραψε', 'write'])) {
    return { calls: [call('open_feedback')] };
  }
  if (hasAny(p, ['πορτοφολ', 'wallet', 'κερδη', 'earnings', 'payout']) && hasAny(p, ['συνοψ', 'summar', 'ποσα', 'how much', 'υπολοπ', 'balance'])) {
    return { calls: [call('summarize_wallet')] };
  }
  if (
    hasAny(p, ['εξαγωγ', 'εξηγαγ', 'export', 'κατεβασ', 'download']) &&
    hasAny(p, ['ημερολογ', 'calendar', 'ατζεντα', 'agenda', 'ics', 'ολα τα σχεδια', 'all my plans'])
  ) {
    return { calls: [call('export_agenda')] };
  }
  if (hasAny(p, ['προκλησ', 'challenge']) && hasAny(p, ['μπεσ', 'μπω', 'ενταξ', 'join', 'αφησε', 'φυγε', 'leave'])) {
    const leave = hasAny(p, ['αφησε', 'φυγε', 'leave', 'αποχωρ']);
    const idMatch = n.match(/\bc(\d+)\b/);
    return { calls: [call('join_challenge', { challengeId: idMatch ? `c${idMatch[1]}` : 'c1', leave })] };
  }
  if (
    hasAny(p, ['σχηματιζ', 'forming', 'ανοιχτα σχεδια', 'list plans', 'plans forming']) ||
    (hasAny(p, ['δειξε σχεδια', 'λιστα σχεδιων', 'show plans']) && hasAny(p, ['σχηματ', 'forming', 'ανοιχτ', 'buddy']))
  ) {
    return { calls: [call('list_forming_plans')] };
  }
  if (hasAny(p, ['αιτημα παρεασ', 'company join', 'join request']) && hasAny(p, ['αποδεξ', 'δεξου', 'accept', 'απορριψ', 'decline', 'reject'])) {
    const accept = !hasAny(p, ['απορριψ', 'decline', 'reject']);
    return { calls: [call('respond_company_join', { accept })] };
  }

  /* 2 ─ undo */
  if (/^(αναιρεσ\S*|undo|ακυρωσε (το )?τελευταιο|revert)/.test(n)) return { calls: [call(UNDO_CALL)] };

  /* 3 ─ message the group */
  if (
    hasAny(p, [' στειλε', ' γραψε', ' πεσ ', ' ενημερωσε', ' message', ' tell ', ' send ', ' text ']) &&
    hasAny(p, ['ομαδα', 'group', 'chat', 'παιδια', 'everyone', 'guys', 'nakamas'])
  ) {
    const text = extractQuotedOrTail(raw);
    if (!text) {
      return reply('Τι να γράψω στην ομάδα; Π.χ. «γράψε στην ομάδα ότι θα αργήσω 10 λεπτά».', 'What should I tell the group? E.g. "tell the group I\'ll be 10 minutes late".');
    }
    const ord = extractOrdinal(n);
    return { calls: [call('send_group_message', { text, ...(ord !== null && ord !== 0 ? { event: String(ord + 1) } : {}) })] };
  }

  /* 4 ─ report an issue */
  if (hasAny(p, ['αναφορα', 'αναφερω', 'καταγγελ', ' report ']) && !isQuestion(n) && !hasAny(p, NAV_VERBS)) {
    const text = extractQuotedOrTail(raw) ?? raw;
    const category = hasAny(p, ['παρενοχλ', 'harass', 'ενοχλ']) ? 'harassment'
      : hasAny(p, ['ασφαλει', 'safety', 'κινδυν', 'danger']) ? 'safety'
      : hasAny(p, ['no-show', 'no show', 'δεν ηρθε', 'δεν εμφανιστηκε']) ? 'no_show'
      : hasAny(p, ['πληρωμ', 'payment', 'χρεωσ', 'charge']) ? 'payment'
      : hasAny(p, ['bug', 'σφαλμα', 'δεν δουλευ', 'δεν λειτουργ', 'crash', 'κολλ']) ? 'technical'
      : 'other';
    if (text.split(' ').length < 4) return { calls: [call('navigate', { page: 'report' })] };
    return { calls: [call('report_issue', { description: text, category, severity: category === 'safety' || category === 'harassment' ? 'high' : 'medium' })] };
  }

  /* 5 ─ connection requests */
  if (hasAny(p, ['αιτημα', 'αιτηματα', 'request']) && hasAny(p, ['αποδεξ', 'δεξου', 'accept', 'απορριψ', 'decline', 'reject'])) {
    const accept = !hasAny(p, ['απορριψ', 'decline', 'reject']);
    const name = ctx.userNames.find((u) => u.length >= 3 && n.includes(normalize(u)));
    return { calls: [call('respond_connection_request', { accept, ...(name ? { name } : {}) })] };
  }

  /* 6 ─ create / draft an event */
  if (
    hasAny(p, [' φτιαξε', ' δημιουργησ', ' οργανωσ', ' στησε', ' create', ' organi', ' host ', ' set up', ' δημοσιευσε', ' publish']) &&
    hasAny(p, ['εκδηλωσ', 'event', 'συναντησ', 'meetup', 'βραδια', 'night', 'εξοδο', 'outing', 'βολτα', 'πεζοπορ', 'hike', 'σινεμα', 'cinema', 'παρεα', 'group'])
  ) {
    const cats = extractCategories(n);
    const range = extractDateRange(n, ctx.now);
    const time = extractTime(n);
    const area = extractArea(n, ctx.areas);
    const quoted = raw.match(/[«"“]([^»"”]{2,})[»"”]/)?.[1];
    const size = n.match(/(\d{1,2})\s*(?:ατομα|ατομων|people|persons|members|μελη)/);
    const priceM = n.match(/(\d{1,3})\s*(?:€|ευρω|euro)/);
    const args: Record<string, unknown> = {};
    if (quoted) args.title = quoted;
    if (cats[0]) args.category = cats[0];
    if (range && range.from === range.to.slice(0, 10)) args.date = range.from;
    else if (range) args.date = range.from;
    if (time) args.time = time;
    if (area) args.area = area;
    if (size) args.maxParticipants = Number(size[1]);
    if (priceM) args.price = Number(priceM[1]);
    if (!args.title) {
      const el = ctx.lang !== 'en';
      const cat = CATEGORY_CATALOG.find((c) => c.name === cats[0]);
      const label = cat ? (el ? cat.labelGr : cat.labelEn) : el ? 'Έξοδος' : 'Meetup';
      args.title = area ? `${label} · ${area}` : el ? `${label} με Nakamas` : `${label} with Nakamas`;
    }
    const publish = hasAny(p, [' δημοσιευσε', ' publish']) && quoted && args.date && args.time;
    return { calls: [call(publish ? 'create_event' : 'draft_event', args)] };
  }

  /* 7 ─ settings (combinable: «σκοτεινό θέμα και αγγλικά») */
  const settings: PlannedCall[] = [];
  const lang = extractLanguage(p);
  if (lang && (hasAny(p, ['γλωσσ', 'language']) || hasAny(p, [' αλλαξε', ' βαλε', ' γυρισε', ' κανε', ' switch', ' change', ' set ', ' in english', ' στα αγγλικα', ' στα ελληνικα', ' σε αγγλικα', ' σε ελληνικα']))) {
    settings.push(call('set_language', { language: lang }));
  }
  const theme = extractTheme(n);
  if (theme && hasAny(p, ['θεμα', 'theme', 'mode', 'εμφανισ', 'χρωμα', 'σκοτειν', 'σκουρ', 'dark', 'φωτειν', 'ανοιχτ', ' light'])) {
    settings.push(call('set_theme', { theme: theme.kind === 'id' ? theme.id : theme.kind }));
  }
  if (hasAny(p, ['sidebar', 'πλευρικ', 'μενου', 'πλοηγηση'])) {
    if (hasAny(p, ['συμπτυξ', 'κλεισ', 'κρυψ', 'collapse', 'hide', 'μικρυν'])) settings.push(call('toggle_sidebar', { collapsed: true }));
    else if (hasAny(p, ['επεκτειν', 'ανοιξ', 'expand', 'μεγαλωσ'])) settings.push(call('toggle_sidebar', { collapsed: false }));
  }
  if (hasAny(p, ['αρχικη', ' home', 'ανακαλυψη', 'discover']) && hasAny(p, ['απλ', 'μινιμαλ', 'minimal', 'simple', 'καθαρ', 'cleaner'])) {
    settings.push(call('set_home_layout', { mode: 'light' }));
  } else if (hasAny(p, ['αρχικη', ' home', 'ανακαλυψη', 'discover']) && hasAny(p, ['πλουσι', ' rich', 'περισσοτερα'])) {
    settings.push(call('set_home_layout', { mode: 'rich' }));
  }
  if (settings.length > 0) return { calls: settings };

  /* 8 ─ leave a group */
  if (hasAny(p, ['αποχωρ', 'φυγω απο', 'βγαλε με απο', 'leave the group', 'leave my group', 'leave group', 'ακυρωσε τη συμμετοχ', 'cancel my spot'])) {
    const ref = eventRef(n, ['αποχωρησε', 'αποχωρηση', 'αποχωρω', 'απο', 'ομαδα', 'leave', 'group', 'the', 'ακυρωσε', 'συμμετοχη']);
    return ref === null
      ? reply('Από ποια ομάδα θες να αποχωρήσεις; Πες μου την εκδήλωση.', 'Which group do you want to leave? Tell me the event.')
      : { calls: [call('leave_group', { event: refArg(ref) })] };
  }

  /* 9 ─ waitlist */
  if (hasAny(p, ['λιστα αναμονησ', 'waitlist', 'waiting list'])) {
    const ref = eventRef(n, ['βαλε με', 'στη', 'λιστα αναμονησ', 'waitlist', 'waiting list', 'join', 'add me']);
    return { calls: [call('join_waitlist', { event: refArg(ref) })] };
  }

  /* 10 ─ add to calendar */
  if (hasAny(p, ['ημερολογιο', 'calendar', ' ics']) && hasAny(p, ['προσθεσ', 'βαλε', ' add', 'export', 'εξαγωγ', 'κατεβασ'])) {
    const ref = eventRef(n, ['προσθεσε', 'βαλε', 'add', 'to', 'στο', 'ημερολογιο', 'calendar', 'google', 'ics', 'export', 'κατεβασε']);
    return { calls: [call('add_to_calendar', { event: refArg(ref), target: hasAny(p, ['google']) ? 'google' : 'ics' })] };
  }

  /* 11 ─ unsave / save */
  if (hasAny(p, ['ξεαποθηκ', 'unsave', 'remove from saved', 'αφαιρεσε απο τισ αποθηκ', 'βγαλε απο τισ αποθηκ'])) {
    return { calls: [call('unsave_event', { event: refArg(eventRef(n, ['ξεαποθηκευσε', 'unsave', 'remove from saved', 'αφαιρεσε', 'βγαλε', 'απο', 'τισ', 'αποθηκευμενεσ'])) })] };
  }
  if (hasAny(p, ['αποθηκευσ', ' σωσε', ' κρατα', 'bookmark', ' save ']) && !hasAny(p, ['αποθηκευμεν', ' saved'])) {
    return { calls: [call('save_event', { event: refArg(eventRef(n, ['αποθηκευσε', 'αποθηκευση', 'σωσε', 'κρατα', 'bookmark', 'save'])) })] };
  }

  /* 12 ─ join a group */
  if (hasAny(p, [' μπεσ ', ' μπω ', 'ενταξ', 'συμμετεχ', 'γραψε με', 'κλεισε θεση', ' join', ' book ', 'θελω να παω'])) {
    const ref = eventRef(n, ['μπεσ', 'μπω', 'ενταξη', 'ενταξου', 'συμμετεχω', 'συμμετοχη', 'γραψε με', 'κλεισε θεση', 'join', 'book', 'θελω να παω', 'σε', 'ομαδα', 'group']);
    if (ref !== null) return { calls: [call('start_join_flow', { event: refArg(ref) })] };
  }

  /* 13 ─ interests */
  if (hasAny(p, ['ενδιαφερον', 'interest'])) {
    const remove = hasAny(p, ['αφαιρεσ', 'βγαλε', 'remove', 'delete', 'σβησε']);
    const add = hasAny(p, ['προσθεσ', 'βαλε', ' add', 'προσθηκ']);
    if (remove || add) {
      const cats = extractCategories(n);
      const value = cats[0] ?? leftover(n, ['προσθεσε', 'αφαιρεσε', 'βαλε', 'βγαλε', 'add', 'remove', 'delete', 'σβησε', 'ενδιαφεροντα', 'ενδιαφερον', 'interests', 'interest', 'στα', 'απο', 'from', 'to']);
      if (value) return { calls: [call(remove ? 'remove_interest' : 'add_interest', { interest: value })] };
    }
  }

  /* 14 ─ bio */
  if (hasAny(p, [' bio', 'βιογραφικ', 'about me', 'περιγραφη μου', 'σχετικα με εμενα'])) {
    const text = extractQuotedOrTail(raw);
    if (text) return { calls: [call('update_bio', { bio: text })] };
    return { calls: [call('navigate', { page: 'profile' })] };
  }

  /* 15 ─ privacy */
  const privacy: Record<string, unknown> = {};
  if (hasAny(p, ['προφιλ', 'profile'])) {
    if (hasAny(p, ['ιδιωτικ', 'private', 'κρυψ', 'hide'])) privacy.profileVisibility = 'private';
    else if (hasAny(p, ['μονο συνδεσ', 'μονο στουσ nakamas', 'connections only', 'only connections', 'only my nakamas'])) privacy.profileVisibility = 'connections';
    else if (hasAny(p, ['δημοσι', 'public'])) privacy.profileVisibility = 'public';
  }
  if (hasAny(p, ['τοποθεσι', 'location'])) {
    if (hasAny(p, ['σταματ', 'κλεισ', 'μην ', 'stop', ' off', 'hide', 'disable', 'απενεργ'])) privacy.shareLocation = false;
    else if (hasAny(p, ['ενεργοπ', 'μοιρασ', 'share', ' on', 'enable'])) privacy.shareLocation = true;
  }
  if (hasAny(p, ['φωτογραφι', 'photo']) && hasAny(p, ['κρυψ', 'hide', 'μην', 'σταματ', 'stop'])) privacy.revealPhoto = false;
  if (hasAny(p, ['μηνυμα', 'message']) && hasAny(p, ['μονο', 'only'])) {
    if (hasAny(p, ['συνδεσ', 'connection', 'nakamas'])) privacy.messagePermission = 'connections';
    else if (hasAny(p, ['ομαδ', 'group'])) privacy.messagePermission = 'groups';
  }
  if (Object.keys(privacy).length > 0) return { calls: [call('update_privacy', privacy)] };

  /* 16 ─ notification preferences */
  if (hasAny(p, ['ειδοποιησ', 'notification', 'προωθητ', 'promo', 'υπενθυμ', 'reminder'])) {
    const off = hasAny(p, ['σταματ', 'κλεισ', 'απενεργ', 'turn off', 'disable', 'no more', 'mute', 'δεν θελω']);
    const on = hasAny(p, ['ενεργοπ', 'ανοιξ', 'turn on', 'enable', 'θελω']);
    if (off || on) {
      const v = !off;
      const prefs: Record<string, boolean> = {};
      if (hasAny(p, ['προωθητ', 'promo', 'διαφημ', 'newsletter'])) prefs.promos = v;
      if (hasAny(p, ['υπενθυμ', 'reminder'])) prefs.reminders = v;
      if (hasAny(p, ['ταιριασ', 'match'])) prefs.matches = v;
      if (hasAny(p, ['μηνυματ', 'message', 'chat'])) prefs.messages = v;
      if (Object.keys(prefs).length > 0) return { calls: [call('update_notification_prefs', prefs)] };
    }
    if (hasAny(p, ['αναγνωσμεν', 'διαβασμεν', 'διαβασα', ' read', 'καθαρισ', 'clear'])) return { calls: [call('mark_notifications_read')] };
    if (!hasAny(p, NAV_VERBS) || hasAny(p, ['τι ', 'what', 'συνοψ', 'summar', 'νεα'])) return { calls: [call('summarize_notifications')] };
  }

  /* 17 ─ agenda */
  if (
    hasAny(p, ['τι εχω', 'προγραμμα μου', 'τα σχεδια μου', 'my plans', 'my schedule', 'what do i have', "what's on", 'whats on', 'what am i doing', 'ποτε ειναι', 'ποια σχεδια', 'εχω κατι']) &&
    !hasAny(p, [' ανοιξε', ' πηγαινε', ' go to', ' open '])
  ) {
    const range = extractDateRange(n, ctx.now);
    return {
      calls: [
        call(
          'summarize_agenda',
          range ? { dateFrom: range.from, dateTo: range.to, dateLabelEl: range.labelEl, dateLabelEn: range.labelEn } : { date: 'all' },
        ),
      ],
    };
  }

  /* 18 ─ progress */
  if (hasAny(p, [' xp', 'επιπεδο μου', 'my level', 'ποντοι', 'points', 'προοδο μου', 'my progress', 'ποσα badges', 'how many badges'])) {
    return { calls: [call('show_progress')] };
  }

  /* 19 ─ knowledge */
  const topic = findTopic(n);
  if (topic && (isQuestion(n) || hasAny(p, ['εξηγησ', 'explain', 'τι ειναι', 'what is']))) {
    return { calls: [call('explain', { topic: topic.id })] };
  }

  /* 20 ─ find company */
  if (hasAny(p, ['βρεσ παρεα', 'ψαχνω παρεα', 'θελω παρεα', 'μονοσ μου', 'μονη μου', 'looking for company', 'find company', 'find a buddy', 'find nakamas', 'βρεσ nakamas'])) {
    return { calls: [call('find_company')] };
  }

  /* 21 ─ open an event from the last results */
  const ord = extractOrdinal(n);
  if (ord !== null && hasAny(p, [...NAV_VERBS, ' δεσ ', ' view', ' details', 'λεπτομερει'])) {
    return { calls: [call('open_event', { event: refArg(ord) })] };
  }

  /* 22 ─ navigation */
  const route = matchRoute(n, ctx.isAdmin);
  const cats = extractCategories(n);
  const range = extractDateRange(n, ctx.now);
  const price = extractPrice(p);
  const area = extractArea(n, ctx.areas);
  const hasSearchEntities = cats.length > 0 || range !== null || price !== null || area !== null;
  if (route && (hasAny(p, NAV_VERBS) || n.split(' ').length <= 3) && !hasSearchEntities) {
    return { calls: [call('navigate', { page: route.id })] };
  }

  /* 23 ─ recommendations */
  if (hasAny(p, ['προτεινε', 'προταση', 'προτασεισ', 'recommend', 'suggest', 'τι να κανω', 'what should i do', 'ιδεεσ', 'ideas', 'βαριεμαι', 'bored', 'για μενα', 'for me']) && !hasSearchEntities) {
    return { calls: [call('recommend_events')] };
  }

  /* 24 ─ search */
  if (hasSearchEntities || hasAny(p, SEARCH_VERBS)) {
    const query = cats.length === 0 ? leftover(n, [...SEARCH_VERBS, 'εκδηλωσεισ', 'εκδηλωση', 'events', 'something', 'κατι', 'σημερα', 'αυριο', 'σαββατοκυριακο', 'weekend', 'today', 'tomorrow', 'δωρεαν', 'free']) : undefined;
    const args: Record<string, unknown> = { ...dateArgs(n, ctx.now) };
    if (cats.length) args.categories = cats;
    if (price?.kind && price.kind !== 'any') args.price = price.kind;
    if (price?.max !== undefined) args.maxPrice = price.max;
    if (area) args.area = area;
    if (query && query.length >= 3 && !area) args.query = query;
    return { calls: [call('search_events', args)] };
  }

  /* 25 ─ last resort: knowledge topic or free-text search */
  if (topic) return { calls: [call('explain', { topic: topic.id })] };
  const words = leftover(n, []);
  if (words.length >= 4) return { calls: [call('search_events', { query: words })] };

  return reply(
    'Δεν είμαι σίγουρος ότι κατάλαβα. Δοκίμασε π.χ. «βρες σινεμά αύριο», «αποθήκευσε το πρώτο», «βάλε σκοτεινό θέμα» ή «τι έχω αυτή την εβδομάδα;».',
    'I\'m not sure I understood. Try e.g. "find cinema tomorrow", "save the first one", "switch to dark mode" or "what do I have this week?".',
  );
}

function refArg(ref: string | number | null): string | undefined {
  if (ref === null) return undefined;
  if (typeof ref === 'number') return String(ref < 0 ? ref : ref + 1);
  return ref;
}
