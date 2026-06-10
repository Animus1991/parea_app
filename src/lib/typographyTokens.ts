/**
 * App-wide density type scale — replaces arbitrary text-[N.Npx] (CoFounderBay crosswalk).
 * Maps to @theme tokens in src/index.css (--text-xs through --text-4xl).
 */
export const APP_TYPO = {
  /** ~10–11px — micro labels, badges, caps */
  micro: 'text-xs',
  /** ~11px — section headings, KPI labels */
  sectionLabel: 'text-xs font-bold tracking-wide',
  /** ~13px — body, list rows, meta */
  body: 'text-sm',
  /** ~13px medium emphasis */
  bodyMedium: 'text-sm font-medium',
  /** ~14px — card titles */
  cardTitle: 'text-base font-bold leading-snug',
  /** ~16px — modal / panel titles */
  panelTitle: 'text-lg font-bold',
  /** Hero / page titles */
  pageTitle: 'text-lg md:text-2xl font-bold tracking-tight leading-tight',
  heroSubtitle: 'text-sm md:text-base font-medium leading-relaxed',
} as const;

/** Popup chat window density */
export const CHAT_TYPO = {
  title: 'text-sm font-bold',
  subtitle: 'text-xs text-gray-500',
  badge: 'text-xs text-cyan-400 font-bold',
  menu: 'text-xs',
  lockNotice: 'text-xs text-amber-100',
  sender: 'text-xs text-gray-500 mb-0.5',
  bubble: 'text-sm leading-relaxed break-words',
  systemBubble: 'text-xs text-center',
  input: 'text-sm',
  sendBtn: 'text-sm font-bold',
  footer: 'text-xs text-gray-500',
} as const;

/** Plans forming / BuddySeek shared chips */
export const PLANS_FORMING_TYPO = {
  statChip: 'text-xs font-bold',
  cardTitle: 'text-sm font-bold',
  cardMeta: 'text-xs font-medium',
  sectionLabel: 'text-xs font-bold tracking-wide',
  body: 'text-sm font-medium',
  cta: 'text-sm font-bold',
} as const;

/** Group chat page density (7 theme variants) */
export const GROUP_CHAT_TYPO = {
  notice: 'text-xs font-semibold tracking-tight capitalize',
  systemBanner: 'text-sm font-medium leading-tight',
  dayLabel: 'text-xs font-semibold tracking-tight capitalize',
  bubble: 'text-base leading-relaxed',
  timestamp: 'text-xs font-medium tracking-wide',
  headerTitle: 'text-sm md:text-base font-bold',
  headerSub: 'text-xs md:text-sm tracking-wide font-bold',
  select: 'text-xs font-bold',
  amberBar: 'text-xs sm:text-sm font-bold tracking-wide',
  panelTitle: 'text-sm font-bold tracking-wide',
  panelBody: 'text-sm font-medium',
  microBadge: 'text-xs font-bold tracking-wide',
} as const;

/** Inbox list density */
export const INBOX_TYPO = {
  pageTitle: 'text-base md:text-lg font-bold tracking-tight',
  pageSub: 'text-sm font-medium',
  tab: 'text-sm font-bold',
  badge: 'text-xs font-bold',
  search: 'text-sm font-medium',
  filter: 'text-sm font-bold',
  rowTitle: 'text-base truncate',
  rowMeta: 'text-xs font-medium',
  rowPreview: 'text-sm truncate',
  unread: 'text-xs font-bold',
  cta: 'text-sm font-bold',
} as const;

/** Plans page density */
export const PLANS_TYPO = {
  pageTitle: 'text-base md:text-lg font-bold',
  pageSub: 'text-sm font-medium',
  statLabel: 'text-xs font-semibold',
  nextLabel: 'text-xs font-bold uppercase tracking-wide',
  nextTitle: 'text-base font-bold truncate',
  nextBadge: 'text-sm font-bold',
  bannerTitle: 'text-base font-bold',
  bannerBody: 'text-sm font-medium',
  bannerCta: 'text-sm font-bold',
  cardTitle: 'text-xl font-bold',
  cardDate: 'text-lg font-bold',
  cardTime: 'text-sm font-medium',
  cardMeta: 'text-sm font-medium',
  chip: 'text-xs font-bold',
  cta: 'text-sm font-bold',
} as const;

/** Event card density (high-traffic feed) */
export const EVENT_CARD_TYPO = {
  badge: 'text-xs font-extrabold tracking-wide leading-none',
  chip: 'text-xs font-semibold capitalize tracking-wide',
  dateBadge: 'text-xs sm:text-sm font-black tracking-tight',
  dateSub: 'text-xs leading-none font-bold',
  title: 'text-base font-bold leading-snug',
  matchScore: 'text-sm font-black leading-none',
  matchLabel: 'text-xs font-semibold capitalize tracking-wide',
  meta: 'text-sm font-medium',
  hint: 'text-xs font-semibold',
  cta: 'text-sm font-bold',
  avatarLabel: 'text-xs font-semibold capitalize',
  progressTitle: 'text-sm font-bold capitalize tracking-tight',
  progressSub: 'text-xs font-medium',
  statusBtn: 'text-xs font-bold',
  etaInput: 'text-xs font-medium',
  etaSubmit: 'text-xs font-bold',
  toggleLabel: 'text-xs font-bold',
  toggleHint: 'text-xs',
  safetyLabel: 'text-xs font-bold',
  safetyLink: 'text-xs font-medium underline underline-offset-2',
  modalBtn: 'text-sm font-bold',
  locationTitle: 'text-sm font-bold',
  locationHint: 'text-xs leading-relaxed',
  link: 'text-xs font-bold',
} as const;
