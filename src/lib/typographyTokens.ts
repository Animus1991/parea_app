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
  pageTitle: 'text-lg font-bold tracking-tight leading-tight',
  heroSubtitle: 'text-sm md:text-base font-medium leading-relaxed',
} as const;

/** Popup chat window density */
export const CHAT_TYPO = {
  title: 'text-sm font-bold',
  subtitle: 'text-xs text-ink-muted',
  badge: 'text-xs text-brand font-bold',
  menu: 'text-xs',
  lockNotice: 'text-xs text-amber-700 dark:text-amber-200',
  sender: 'text-xs text-ink-muted mb-0.5',
  bubble: 'text-sm leading-relaxed break-words',
  systemBubble: 'text-xs text-center',
  input: 'text-sm',
  sendBtn: 'text-sm font-bold',
  footer: 'text-xs text-ink-muted',
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
  cardTitle: 'text-lg font-bold',
  cardDate: 'text-lg font-bold',
  cardTime: 'text-sm font-medium',
  cardMeta: 'text-sm font-medium',
  chip: 'text-xs font-bold',
  cta: 'text-sm font-bold',
} as const;

/** BuddySeek card density */
export const BUDDY_SEEK_TYPO = {
  title: 'text-base font-bold leading-snug',
  meta: 'text-sm font-medium',
  label: 'text-xs font-bold tracking-wide',
  chip: 'text-xs font-semibold',
  body: 'text-sm leading-relaxed',
  cta: 'text-sm font-bold',
  micro: 'text-xs font-medium',
} as const;

/** App shell nav density */
export const SHELL_TYPO = {
  logo: 'text-lg',
  logoMobile: 'text-lg',
  sectionLabel: 'text-sm font-bold tracking-wide',
  dashboard: 'text-sm font-bold tracking-wide',
  search: 'text-sm',
  createBtn: 'text-sm font-bold',
  langBtn: 'text-xs font-bold',
  badge: 'text-xs font-bold',
  userLabel: 'text-xs font-bold tracking-wide',
  userName: 'text-xs font-bold',
  avatar: 'text-xs',
  tabLabel: 'text-xs font-medium leading-none',
  soon: 'text-xs font-bold tracking-wide',
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

/** Calendar / agenda density */
export const CALENDAR_TYPO = {
  pageTitle: 'text-base md:text-lg font-bold tracking-tight',
  pageSub: 'text-sm font-medium',
  dayLabel: 'text-xs font-bold',
  dayNumber: 'text-sm font-bold',
  eventTitle: 'text-sm font-bold leading-snug',
  eventMeta: 'text-xs font-medium',
  hourLabel: 'text-xs font-semibold',
  modalTitle: 'text-lg font-bold',
  modalSub: 'text-sm font-medium',
  chip: 'text-xs font-bold',
  cta: 'text-sm font-bold',
} as const;

/** Home feed density (merged with legacy homeTypography.ts — P1-T2) */
export const HOME_TYPO = {
  heroBadge: 'text-sm font-bold tracking-wide',
  heroTitle: 'text-lg font-bold tracking-tight leading-tight',
  heroSub: 'text-sm md:text-base font-medium',
  heroSubtitle: 'text-sm md:text-base font-medium leading-relaxed',
  heroStats: 'text-xs font-bold tracking-wide',
  heroMapBtn: 'text-sm font-bold',
  stepTitle: 'text-sm font-bold',
  stepBody: 'text-xs leading-relaxed font-medium',
  feedTab: 'text-xs font-bold',
  sectionLabel: 'text-xs font-bold tracking-wide uppercase',
  filterChip: 'text-xs font-bold',
  statValue: 'text-sm font-bold',
  statLabel: 'text-xs font-medium',
  cardTitle: 'text-base font-bold',
  cardMeta: 'text-sm font-medium',
  hint: 'text-xs font-medium',
  cta: 'text-sm font-bold',
} as const;

/** Report / trust issue flow */
export const REPORT_TYPO = {
  pageTitle: 'text-base md:text-lg font-bold',
  pageSub: 'text-sm font-medium',
  sectionLabel: 'text-xs font-bold tracking-wide uppercase',
  fieldLabel: 'text-sm font-bold',
  fieldHint: 'text-xs font-medium leading-relaxed',
  option: 'text-sm font-medium',
  chip: 'text-xs font-bold',
  cta: 'text-sm font-bold',
} as const;

/** Onboarding wizard density */
export const ONBOARDING_TYPO = {
  stepLabel: 'text-xs font-bold tracking-wide uppercase',
  title: 'text-lg font-bold leading-tight',
  subtitle: 'text-sm md:text-base font-medium leading-relaxed',
  optionTitle: 'text-sm font-bold',
  optionBody: 'text-xs font-medium leading-relaxed',
  chip: 'text-xs font-semibold',
  cta: 'text-sm font-bold',
  skip: 'text-xs font-bold',
} as const;
