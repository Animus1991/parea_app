/**
 * App-wide density type scale — compact, harmonious roles across every surface.
 * Maps to @theme tokens in src/index.css (--text-2xs through --text-4xl).
 */
export const APP_TYPO = {
  /** Micro labels, badges, caps */
  micro: 'text-2xs',
  /** Section headings, KPI labels */
  sectionLabel: 'text-2xs font-bold tracking-wide',
  /** Body, list rows, meta */
  body: 'text-sm',
  /** Body medium emphasis */
  bodyMedium: 'text-sm font-medium',
  /** Card titles */
  cardTitle: 'card-heading font-bold leading-snug',
  /** Modal / panel titles */
  panelTitle: 'text-base font-bold',
  /** Hero / page titles — capped near body for harmony */
  pageTitle: 'text-base md:text-lg font-bold tracking-tight leading-tight',
  heroSubtitle: 'text-xs md:text-sm font-medium leading-relaxed',
} as const;

/** Popup chat window density */
export const CHAT_TYPO = {
  title: 'text-sm font-bold',
  subtitle: 'text-2xs text-ink-muted',
  badge: 'text-2xs text-brand font-bold',
  menu: 'text-2xs',
  lockNotice: 'text-2xs text-amber-700 dark:text-amber-200',
  sender: 'text-2xs text-ink-muted mb-0.5',
  bubble: 'text-sm leading-relaxed break-words',
  systemBubble: 'text-2xs text-center',
  input: 'text-xs',
  sendBtn: 'text-xs font-bold',
  footer: 'text-2xs text-ink-muted',
} as const;

/** Plans forming / BuddySeek shared chips */
export const PLANS_FORMING_TYPO = {
  statChip: 'card-copy-micro font-bold',
  cardTitle: 'card-heading font-bold',
  cardMeta: 'card-meta font-medium',
  sectionLabel: 'text-2xs font-bold tracking-wide',
  body: 'card-copy-sm font-medium',
  cta: 'card-cta',
} as const;

/** Inbox list density */
export const INBOX_TYPO = {
  pageTitle: 'text-sm md:text-base font-bold tracking-tight',
  pageSub: 'text-xs font-medium',
  tab: 'text-xs font-bold',
  badge: 'text-2xs font-bold',
  search: 'text-xs font-medium',
  filter: 'text-2xs font-bold',
  rowTitle: 'text-sm truncate',
  rowMeta: 'text-2xs font-medium',
  rowPreview: 'text-xs truncate',
  unread: 'text-2xs font-bold',
  cta: 'text-xs font-bold',
} as const;

/** Plans page density */
export const PLANS_TYPO = {
  pageTitle: 'text-sm md:text-base font-bold',
  pageSub: 'text-xs font-medium',
  statLabel: 'text-2xs font-semibold',
  nextLabel: 'text-2xs font-bold uppercase tracking-wide',
  nextTitle: 'text-sm font-bold truncate',
  nextBadge: 'text-xs font-bold',
  bannerTitle: 'text-sm font-bold',
  bannerBody: 'text-xs font-medium',
  bannerCta: 'text-xs font-bold',
  cardTitle: 'card-heading-lg font-bold',
  cardDate: 'card-heading font-bold',
  cardTime: 'card-meta font-medium',
  cardMeta: 'card-meta font-medium',
  chip: 'card-copy-micro font-bold',
  cta: 'card-cta',
} as const;

/** BuddySeek card density */
export const BUDDY_SEEK_TYPO = {
  title: 'card-heading font-bold leading-snug',
  meta: 'card-meta font-medium',
  label: 'card-badge font-bold tracking-wide',
  chip: 'card-copy-micro font-semibold',
  body: 'card-copy leading-relaxed',
  cta: 'card-cta',
  micro: 'card-copy-micro font-medium',
} as const;

/** App shell nav density */
export const SHELL_TYPO = {
  logo: 'nakamas-logo nakamas-logo--lg',
  logoMobile: 'nakamas-logo',
  sectionLabel: 'text-xs font-bold tracking-wide',
  dashboard: 'text-xs font-bold tracking-wide',
  search: 'text-xs',
  createBtn: 'text-xs font-bold',
  langBtn: 'text-2xs font-bold',
  badge: 'text-2xs font-bold',
  userLabel: 'text-2xs font-bold tracking-wide',
  userName: 'text-2xs font-bold',
  avatar: 'text-2xs',
  tabLabel: 'text-2xs font-medium leading-none',
  soon: 'text-2xs font-bold tracking-wide',
} as const;

/** Event card density (high-traffic feed) */
export const EVENT_CARD_TYPO = {
  badge: 'card-badge font-extrabold tracking-wide leading-none',
  chip: 'card-badge font-semibold capitalize tracking-wide',
  dateBadge: 'text-2xs sm:text-xs font-black tracking-tight',
  dateSub: 'text-2xs leading-none font-bold',
  title: 'card-heading font-bold leading-snug',
  matchScore: 'text-xs font-black leading-none',
  matchLabel: 'card-copy-micro font-semibold capitalize tracking-wide',
  meta: 'card-meta font-medium',
  hint: 'card-copy-micro font-semibold',
  cta: 'card-cta',
  avatarLabel: 'card-copy-micro font-semibold capitalize',
  progressTitle: 'text-xs font-bold capitalize tracking-tight',
  progressSub: 'card-copy-micro font-medium',
  statusBtn: 'text-2xs font-bold',
  etaInput: 'text-2xs font-medium',
  etaSubmit: 'text-2xs font-bold',
  toggleLabel: 'text-2xs font-bold',
  toggleHint: 'card-copy-micro',
  safetyLabel: 'text-2xs font-bold',
  safetyLink: 'card-copy-micro font-medium underline underline-offset-2',
  modalBtn: 'text-xs font-bold',
  locationTitle: 'text-xs font-bold',
  locationHint: 'card-copy-micro leading-relaxed',
  link: 'text-2xs font-bold',
} as const;

/** Calendar / agenda density */
export const CALENDAR_TYPO = {
  pageTitle: 'text-sm md:text-base font-bold tracking-tight',
  pageSub: 'text-xs font-medium',
  dayLabel: 'text-2xs font-bold',
  dayNumber: 'text-xs font-bold',
  eventTitle: 'text-xs font-bold leading-snug',
  eventMeta: 'text-2xs font-medium',
  hourLabel: 'text-2xs font-semibold',
  modalTitle: 'text-base font-bold',
  modalSub: 'text-xs font-medium',
  chip: 'text-2xs font-bold',
  cta: 'text-xs font-bold',
} as const;

/** Home feed density */
export const HOME_TYPO = {
  heroBadge: 'text-xs font-bold tracking-wide',
  heroTitle: 'text-base md:text-lg font-bold tracking-tight leading-tight',
  heroSub: 'text-xs md:text-sm font-medium',
  heroSubtitle: 'text-xs md:text-sm font-medium leading-relaxed',
  heroStats: 'text-2xs font-bold tracking-wide',
  heroMapBtn: 'text-xs font-bold',
  stepTitle: 'text-xs font-bold',
  stepBody: 'text-2xs leading-relaxed font-medium',
  feedTab: 'text-xs font-bold',
  sectionLabel: 'text-2xs font-bold tracking-wide uppercase',
  /** Category / tag / feed / filter chips — same type + height as «Όλα» */
  filterChip: 'filter-chip text-xs font-bold',
  /** Mood chips with icons («Χαλαρά»…) — same type, slightly taller */
  filterChipMood: 'filter-chip filter-chip--mood text-xs font-bold',
  /** Native filter / sort dropdowns — same height as «Όλα» */
  filterSelect: 'filter-select',
  /** Equal width for home meta filters (type / date / comfort / distance / host / sort) */
  filterControlEqual: 'filter-control-equal',
  statValue: 'text-xs font-bold',
  statLabel: 'text-2xs font-medium',
  cardTitle: 'card-heading font-bold',
  cardMeta: 'card-meta font-medium',
  hint: 'card-copy-micro font-medium',
  cta: 'card-cta',
} as const;

/** Report / trust issue flow */
export const REPORT_TYPO = {
  pageTitle: 'text-sm md:text-base font-bold',
  pageSub: 'text-xs font-medium',
  sectionLabel: 'text-2xs font-bold tracking-wide uppercase',
  fieldLabel: 'text-xs font-bold',
  fieldHint: 'text-2xs font-medium leading-relaxed',
  option: 'text-xs font-medium',
  chip: 'text-2xs font-bold',
  cta: 'text-xs font-bold',
} as const;

/** Onboarding wizard density */
export const ONBOARDING_TYPO = {
  stepLabel: 'text-2xs font-bold tracking-wide uppercase',
  title: 'text-base md:text-lg font-bold leading-tight',
  subtitle: 'text-xs md:text-sm font-medium leading-relaxed',
  optionTitle: 'text-xs font-bold',
  optionBody: 'text-2xs font-medium leading-relaxed',
  chip: 'text-2xs font-semibold',
  cta: 'text-xs font-bold',
  skip: 'text-2xs font-bold',
} as const;
