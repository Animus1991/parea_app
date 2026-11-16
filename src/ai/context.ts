/**
 * Builds the compact, privacy-minimised context that the cloud model sees.
 * Deliberately excludes email, phone, exact locations, member lists and chat
 * contents — only what is needed to plan actions on the user's behalf.
 */
import { format } from 'date-fns';
import { useStore } from '../store';
import { useLanguageStore } from '../store/languageStore';
import { readPageSnapshot } from '../lib/pageSnapshot';
import { WALLET_DEMO } from '../lib/walletDemo';
import { notificationsForUser } from '../lib/notificationsUtil';
import { routeIdForPath } from './routes';

export interface ContextInput {
  pathname: string;
  lastEventIds: string[];
  now?: Date;
}

export function buildContextSnapshot({ pathname, lastEventIds, now = new Date() }: ContextInput): string {
  const s = useStore.getState();
  const u = s.currentUser;
  const uid = u?.id;
  const titleOf = (id: string) => s.events.find((e) => e.id === id)?.title ?? id;
  const myGroups = uid ? s.groups.filter((g) => g.members.includes(uid) && g.status !== 'cancelled') : [];
  const pendingFeedbackId = s.getPendingFeedbackEventId();
  const pendingCompanyJoins = uid
    ? s.companyJoinRequests.filter((j) => j.targetUserId === uid && j.status === 'pending').length
    : 0;
  const page = readPageSnapshot();

  const snapshot = {
    today: format(now, 'yyyy-MM-dd (EEEE)'),
    currentPage: routeIdForPath(pathname),
    currentEventId: pathname.match(/^\/events\/([^/]+)/)?.[1] ?? null,
    uiLanguage: useLanguageStore.getState().language,
    theme: s.theme,
    pageSnapshot: page
      ? {
          titleEl: page.titleEl,
          titleEn: page.titleEn,
          state: page.state,
          summaryEl: page.summaryEl,
          summaryEn: page.summaryEn,
          visibleIds: page.visibleIds?.slice(0, 12),
        }
      : null,
    user: u
      ? {
          name: u.name,
          city: u.city,
          interests: u.interests,
          trustTier: u.trustTier,
          reliabilityScore: u.reliabilityScore,
          isOrganizerOrAdmin: u.isOrganizer,
          emailVerified: !!u.emailVerified,
          phoneVerified: !!u.phoneVerified,
          paymentVerified: !!u.paymentVerified,
          idVerified: !!u.idVerified,
        }
      : null,
    verifyGaps: u
      ? (['email', 'phone', 'payment', 'id'] as const).filter((k) => {
          if (k === 'email') return !u.emailVerified;
          if (k === 'phone') return !u.phoneVerified;
          if (k === 'payment') return !u.paymentVerified;
          return !u.idVerified;
        })
      : [],
    pendingFeedbackEventId: pendingFeedbackId,
    pendingCompanyJoinRequests: pendingCompanyJoins,
    walletDemo: { availableEur: WALLET_DEMO.availableEur, pendingEur: WALLET_DEMO.pendingEur },
    saved: s.savedEvents.slice(0, 10).map((id) => ({ id, title: titleOf(id) })),
    myGroups: myGroups.slice(0, 10).map((g) => {
      const e = s.events.find((x) => x.id === g.eventId);
      return { groupId: g.id, eventId: g.eventId, title: e?.title, date: e?.date, size: `${g.members.length}/${g.targetSize}` };
    }),
    unreadNotifications: notificationsForUser(s.notifications, uid).filter((n) => !n.read).length,
    pendingConnectionRequests: uid ? s.connectionRequests.filter((r) => r.toUserId === uid && r.status === 'pending').length : 0,
    lastResults: lastEventIds.slice(0, 8).map((id, i) => ({ n: i + 1, id, title: titleOf(id) })),
    catalogue: s.events
      .filter((e) => e.status !== 'cancelled' && e.status !== 'archived')
      .slice(0, 60)
      .map((e) => `${e.id}|${e.title}|${e.category}|${e.date} ${e.time}|${e.locationArea}|${e.isPaid ? `€${e.price}` : 'free'}`),
  };
  return JSON.stringify(snapshot);
}

export function buildSystemInstruction(contextJson: string): string {
  return [
    'You are "Nakamas AI", the built-in copilot of Nakamas — a safety-first social app for finding small groups (3–6 people) to attend real events together. It is NOT a dating app.',
    'You ACT for the user by calling the provided tools. Prefer doing over describing: if the user asks for something a tool can do, call it.',
    'Rules:',
    '- Reply in the language the user wrote in (Greek or English). Be warm, concise (max 2 short sentences after tools ran), no markdown headings.',
    '- Never invent events, ids, prices or people. Use search_events / recommend_events, or ids from the catalogue below.',
    '- "the first/second/last one" refers to lastResults (n = position). Pass the ordinal as the event string, e.g. "2" or "-1". "This event" on an event page = currentEventId (pass "this").',
    '- Tools marked by the app as requiring confirmation (create_event, send_group_message, update_privacy, update_bio, report_issue, leave_group, respond_connection_request) show the user a confirmation card; tell them to confirm it.',
    '- For new events with missing details, use draft_event (opens a pre-filled form) instead of create_event. For profile bio/name proposals use draft_profile (nothing saves until the user confirms).',
    '- For "where do I …?" / «πού …;» questions, call where_is with the user question.',
    '- For questions about how the platform works, call explain. For anything outside the app, answer briefly and steer back to events and groups.',
    '- Safety: never help with harassment, tracking people without consent, or sharing someone else\'s personal data.',
    `App context (JSON): ${contextJson}`,
  ].join('\n');
}
