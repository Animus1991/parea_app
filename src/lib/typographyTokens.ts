/**
 * App-wide density type scale — matches the Wallet page template (canonical)
 * and Home logged-in / guest heroes.
 * Source of truth: WalletPageContent + HomeGuestHero / HomeLoggedInHero
 * (`text-sm md:text-base` titles, `text-sm` body/sub, `text-xs` chips/section labels).
 * Maps to @theme tokens in src/index.css (--text-2xs through --text-4xl).
 */
export const APP_TYPO = {
  /** Micro labels, badges, caps */
  micro: 'text-2xs',
  /** Section headings, KPI labels — Wallet balance/pending labels */
  sectionLabel: 'text-xs font-semibold tracking-wide',
  /** Body, list rows, meta */
  body: 'text-sm',
  /** Body medium emphasis */
  bodyMedium: 'text-sm font-medium',
  /** Card titles */
  cardTitle: 'card-heading font-bold leading-snug',
  /** Card subtitle under the title — always ≤ cardTitle */
  cardSub: 'card-copy-sm font-medium',
  /** Central card content / values / descriptions — always ≤ cardSub */
  cardBody: 'card-copy font-medium',
  /** Modal / panel titles — under page title scale */
  panelTitle: 'text-sm md:text-base font-bold',
  /** Page / hero titles — strictly above subtitle, h2, cardTitle & buttons on every viewport */
  pageTitle: 'text-lg md:text-xl font-bold tracking-tight leading-tight',
  /** Page subtitle under the title — cleanly subordinate on mobile (12px < 14px) & desktop (12px < 15px) */
  pageSub: 'text-sm font-medium',
  heroSubtitle: 'text-sm font-medium leading-relaxed',
  /** KPI numerals — Wallet / Profile stats, capped at or under page title */
  statValue: 'text-base md:text-lg font-bold tabular-nums leading-none',
  /** Secondary KPI (Wallet pending) */
  statValueSecondary: 'text-sm md:text-base font-bold tabular-nums leading-none',
  /** List / bank card row title — Wallet tx / bank account */
  rowTitle: 'text-sm font-bold',
  /** List / bank card meta — Wallet status / bank mask */
  rowMeta: 'text-xs font-medium',
  /** List date / micro label with tracking — Wallet tx date */
  rowDate: 'text-xs font-bold tracking-wide',
  /** KPI helper under a stat — Wallet pending hint */
  kpiHint: 'text-xs font-medium leading-tight',
  /** Status / demo note under page sub — Wallet Stripe note */
  statusNote: 'text-xs font-bold',
  /** In-card section heading — Wallet “Recent Transactions” */
  sectionInCard: 'card-heading-lg font-bold',
  /** Banner titles (verify / feedback) — ≤ page title */
  bannerTitle: 'text-sm font-bold',
  /** Banner body */
  bannerBody: 'text-xs font-medium leading-relaxed',
  /**
   * Canonical button / CTA label size — matches Wallet Button + Plans «Αξιολόγηση»
   * (.btn-gradient / Button md). Use for every action button across the app.
   */
  btn: 'text-xs font-semibold',
} as const;

/** Explicit Wallet page template — aliases of APP_TYPO for page authors. */
export const WALLET_TYPO = {
  pageTitle: APP_TYPO.pageTitle,
  pageSub: APP_TYPO.pageSub,
  statusNote: APP_TYPO.statusNote,
  kpiLabel: APP_TYPO.sectionLabel,
  kpiValue: APP_TYPO.statValue,
  kpiValueSecondary: APP_TYPO.statValueSecondary,
  kpiHint: APP_TYPO.kpiHint,
  rowTitle: APP_TYPO.rowTitle,
  rowMeta: APP_TYPO.rowMeta,
  rowDate: APP_TYPO.rowDate,
  sectionInCard: APP_TYPO.sectionInCard,
  modalBody: APP_TYPO.cardBody,
  btn: APP_TYPO.btn,
} as const;

/**
 * Profile page density — in-card type never exceeds type outside the cards.
 * Outside: pageTitle 14/15 → pageSub 12.
 * In cards: identity / KPI / rows ≤ 12px (pageSub); section 10; meta 10; micro 9.
 */
export const PROFILE_TYPO = {
  pageTitle: APP_TYPO.pageTitle,
  pageSub: APP_TYPO.pageSub,
  identityName: 'text-sm font-bold',
  identityMeta: APP_TYPO.rowMeta,
  identityBio: APP_TYPO.cardBody,
  kpiLabel: APP_TYPO.sectionLabel,
  /** Stat numerals sit in cards — cap at pageSub (12px), never 13/14. */
  kpiValue: 'text-sm font-bold tabular-nums leading-none',
  kpiValueSecondary: 'text-sm font-bold tabular-nums leading-none',
  kpiHint: APP_TYPO.kpiHint,
  sectionTitle: APP_TYPO.sectionLabel,
  rowTitle: APP_TYPO.rowTitle,
  rowMeta: APP_TYPO.rowMeta,
  micro: 'text-2xs font-medium',
  microBold: 'text-2xs font-bold',
  bannerTitle: APP_TYPO.bannerTitle,
  bannerBody: APP_TYPO.bannerBody,
  fieldLabel: 'text-xs font-bold',
  fieldControl: 'text-xs font-medium',
  fieldHelp: 'text-xs font-medium leading-relaxed',
  nestedCardTitle: APP_TYPO.rowTitle,
  statusNote: APP_TYPO.bodyMedium,
} as const;

/** Popup chat window density */
export const CHAT_TYPO = {
  title: 'text-sm font-bold',
  subtitle: 'text-xs text-ink-muted',
  badge: 'text-2xs text-brand font-bold',
  menu: 'text-2xs',
  lockNotice: 'text-xs text-amber-700 dark:text-amber-200',
  /**
   * Inbox lock/status line — gold-orange mixed with black for contrast on white
   * (~8:1 vs white), same weight/size as the preview body.
   */
  lockHint: 'text-[#7c4a0d] dark:text-amber-200',
  sender: 'text-2xs text-ink-muted mb-0.5',
  bubble: 'text-sm leading-relaxed break-words',
  systemBubble: 'text-xs text-center',
  input: 'text-xs',
  sendBtn: 'text-xs font-bold',
  footer: 'text-xs text-ink-muted',
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
  pageTitle: 'text-lg md:text-xl font-bold tracking-tight leading-tight',
  pageSub: 'text-sm font-medium',
  tab: 'text-xs font-bold',
  badge: 'text-2xs font-bold',
  search: 'text-xs font-medium',
  filter: 'text-2xs font-bold',
  rowTitle: 'text-sm truncate',
  rowMeta: 'text-xs font-medium',
  rowPreview: 'text-xs truncate',
  unread: 'text-2xs font-bold',
  cta: 'text-xs font-bold',
} as const;

/** Plans page density */
export const PLANS_TYPO = {
  pageTitle: 'text-lg md:text-xl font-bold tracking-tight leading-tight',
  pageSub: 'text-sm font-medium',
  statLabel: 'text-2xs font-semibold',
  nextLabel: 'text-2xs font-bold tracking-wide',
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
  sectionLabel: 'text-xs font-semibold tracking-wide',
  dashboard: 'text-xs font-semibold tracking-wide',
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
  badge: 'card-badge font-bold tracking-wide leading-none',
  chip: 'card-badge font-semibold capitalize tracking-wide',
  dateBadge: 'text-2xs sm:text-xs font-bold tracking-tight',
  dateSub: 'text-2xs leading-none font-bold',
  title: 'card-heading font-bold leading-snug',
  matchScore: 'text-xs font-bold leading-none',
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
  pageTitle: 'text-lg md:text-xl font-bold tracking-tight leading-tight',
  pageSub: 'text-sm font-medium',
  dayLabel: 'text-2xs font-bold',
  dayNumber: 'text-xs font-bold',
  eventTitle: 'text-xs font-bold leading-snug',
  eventMeta: 'text-xs font-medium',
  hourLabel: 'text-2xs font-semibold',
  modalTitle: 'text-sm md:text-base font-bold',
  modalSub: 'text-sm font-medium',
  chip: 'text-2xs font-bold',
  cta: 'text-xs font-bold',
} as const;

/** Home feed density — canonical scale for every other page */
export const HOME_TYPO = {
  heroBadge: 'text-xs font-bold tracking-wide',
  heroTitle: 'text-lg md:text-xl font-bold tracking-tight leading-tight',
  heroSub: 'text-sm font-medium',
  heroSubtitle: 'text-sm font-medium leading-relaxed',
  heroStats: 'text-2xs font-bold tracking-wide',
  heroMapBtn: 'text-xs font-bold',
  stepTitle: 'text-xs font-bold',
  stepBody: 'text-xs leading-relaxed font-medium',
  feedTab: 'text-xs font-bold',
  sectionLabel: 'text-xs font-semibold tracking-wide',
  /** Category / tag / feed / filter chips — same type + height as «Όλα» */
  filterChip: 'filter-chip text-xs font-semibold',
  /** Mood chips with icons («Χαλαρά»…) — same type, slightly taller */
  filterChipMood: 'filter-chip filter-chip--mood text-xs font-semibold',
  /** Native filter / sort dropdowns — same height as «Όλα» */
  filterSelect: 'filter-select',
  /** Full-width cells in the home meta-filter 2-column grid */
  filterControlEqual: 'filter-control-equal',
  /** Compact inline stats (not the QuickStatsBar numerals) */
  statValue: 'text-xs font-bold',
  statLabel: 'text-2xs font-medium',
  cardTitle: 'card-heading font-bold',
  cardMeta: 'card-meta font-medium',
  hint: 'card-copy-micro font-medium',
  cta: 'card-cta',
} as const;

/** Report / trust issue flow */
export const REPORT_TYPO = {
  pageTitle: 'text-lg md:text-xl font-bold tracking-tight leading-tight',
  pageSub: 'text-sm font-medium',
  sectionLabel: 'text-xs font-semibold tracking-wide',
  fieldLabel: 'text-xs font-bold',
  fieldHint: 'text-xs font-medium leading-relaxed',
  option: 'text-xs font-medium',
  chip: 'text-2xs font-bold',
  cta: 'text-xs font-bold',
} as const;

/** Onboarding wizard density — same title scale as Home */
export const ONBOARDING_TYPO = {
  stepLabel: 'text-2xs font-bold tracking-wide',
  title: 'text-lg md:text-xl font-bold leading-tight',
  subtitle: 'text-sm font-medium leading-relaxed',
  optionTitle: 'text-xs font-bold',
  optionBody: 'text-xs font-medium leading-relaxed',
  chip: 'text-2xs font-semibold',
  cta: 'text-xs font-bold',
  skip: 'text-2xs font-bold',
} as const;
