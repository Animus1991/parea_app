import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Home,
  Grid,
  MapPin,
  CalendarCheck,
  Calendar,
  UserPlus,
  MessageSquare,
  PlusSquare,
  Bell,
  Settings,
  ShieldCheck,
  Trophy,
  Bookmark,
  History,
  User,
  Command,
  ArrowRight,
  Bot,
  Compass,
  Newspaper,
  Wallet,
  HelpCircle,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { openCopilot } from '../../ai/launcher';
import { APP_ROUTES } from '../../ai/routes';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { trackEvent } from '../../lib/analytics';
import { useStore } from '../../store';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';
import { isOrganizerUser, isPlatformAdmin } from '../../lib/roles';

type PaletteMode = 'mixed' | 'pages' | 'actions';

interface CommandItem {
  id: string;
  labelEl: string;
  labelEn: string;
  icon: React.ElementType;
  path?: string;
  /** Free-text prompt for Nakamas AI (action mode). */
  promptEl?: string;
  promptEn?: string;
  sectionEl: string;
  sectionEn: string;
  keywords?: string[];
  adminOnly?: boolean;
  kind: 'page' | 'action';
}

function detectMode(raw: string): { mode: PaletteMode; q: string } {
  const t = raw.trimStart();
  if (t.startsWith('/')) return { mode: 'pages', q: t.slice(1).trim() };
  if (t.startsWith('>')) return { mode: 'actions', q: t.slice(1).trim() };
  return { mode: 'mixed', q: raw.trim() };
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const currentUser = useStore((s) => s.currentUser);
  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);
  useOverlayBehavior(open, closePalette, panelRef);

  const isAdmin = isPlatformAdmin(currentUser);
  const isOrganizer = isOrganizerUser(currentUser);
  const { mode, q } = detectMode(query);

  const pageItems: CommandItem[] = useMemo(
    () =>
      APP_ROUTES.filter((r) => (!r.adminOnly || isAdmin) && (!r.organizerOnly || isOrganizer)).map((r) => {
        const iconMap: Record<string, React.ElementType> = {
          home: Home,
          categories: Grid,
          nearby: MapPin,
          agenda: CalendarCheck,
          plans: Calendar,
          'buddy-seek': UserPlus,
          chats: MessageSquare,
          create: PlusSquare,
          saved: Bookmark,
          history: History,
          notifications: Bell,
          profile: User,
          settings: Settings,
          achievements: Trophy,
          admin: ShieldCheck,
          wallet: Wallet,
          help: HelpCircle,
          trust: Shield,
          verification: ShieldCheck,
          manage: TrendingUp,
          connections: UserPlus,
          report: HelpCircle,
          challenges: Trophy,
          leaderboard: Trophy,
        };
        return {
          id: r.id,
          labelEl: r.labelEl,
          labelEn: r.labelEn,
          icon: iconMap[r.id] ?? Search,
          path: r.path,
          sectionEl: 'Σελίδες',
          sectionEn: 'Pages',
          keywords: r.stems,
          adminOnly: r.adminOnly,
          kind: 'page' as const,
        };
      }),
    [isAdmin, isOrganizer],
  );

  const actionItems: CommandItem[] = useMemo(
    () => [
      {
        id: 'act-whats-new',
        labelEl: 'Τι νέο υπάρχει;',
        labelEn: "What's new?",
        icon: Newspaper,
        promptEl: 'Τι νέο υπάρχει;',
        promptEn: "What's new?",
        sectionEl: 'Ενέργειες AI',
        sectionEn: 'AI actions',
        keywords: ['news', 'νεο'],
        kind: 'action',
      },
      {
        id: 'act-recommend',
        labelEl: 'Πρότεινέ μου κάτι',
        labelEn: 'Recommend something',
        icon: Compass,
        promptEl: 'Πρότεινέ μου κάτι για μένα',
        promptEn: 'Recommend something for me',
        sectionEl: 'Ενέργειες AI',
        sectionEn: 'AI actions',
        keywords: ['recommend'],
        kind: 'action',
      },
      {
        id: 'act-export',
        labelEl: 'Εξαγωγή ημερολογίου',
        labelEn: 'Export calendar',
        icon: CalendarCheck,
        promptEl: 'Εξήγαγε το ημερολόγιό μου',
        promptEn: 'Export my calendar',
        sectionEl: 'Ενέργειες AI',
        sectionEn: 'AI actions',
        keywords: ['ics', 'export'],
        kind: 'action',
      },
      {
        id: 'act-verify',
        labelEl: 'Ξεκίνα επαλήθευση',
        labelEn: 'Start verification',
        icon: ShieldCheck,
        promptEl: 'Ξεκίνα επαλήθευση',
        promptEn: 'Start verification',
        sectionEl: 'Ενέργειες AI',
        sectionEn: 'AI actions',
        keywords: ['verify'],
        kind: 'action',
      },
      {
        id: 'act-wallet',
        labelEl: 'Σύνοψη πορτοφολιού',
        labelEn: 'Summarise wallet',
        icon: Wallet,
        promptEl: 'Σύνοψη πορτοφολιού',
        promptEn: 'Summarise my wallet',
        sectionEl: 'Ενέργειες AI',
        sectionEn: 'AI actions',
        keywords: ['wallet'],
        kind: 'action',
      },
      {
        id: 'act-dark',
        labelEl: 'Σκοτεινό θέμα',
        labelEn: 'Dark theme',
        icon: Settings,
        promptEl: 'Βάλε σκοτεινό θέμα',
        promptEn: 'Switch to dark mode',
        sectionEl: 'Ενέργειες AI',
        sectionEn: 'AI actions',
        keywords: ['dark', 'theme'],
        kind: 'action',
      },
      {
        id: 'act-where',
        labelEl: 'Πού βρίσκω…',
        labelEn: 'Where do I…',
        icon: HelpCircle,
        promptEl: 'Πού βρίσκω τις ρυθμίσεις απορρήτου;',
        promptEn: 'Where do I find privacy settings?',
        sectionEl: 'Ενέργειες AI',
        sectionEn: 'AI actions',
        keywords: ['where', 'που'],
        kind: 'action',
      },
      {
        id: 'act-ai',
        labelEl: 'Άνοιγμα Nakamas AI',
        labelEn: 'Open Nakamas AI',
        icon: Bot,
        path: '#ai',
        sectionEl: 'Ενέργειες AI',
        sectionEn: 'AI actions',
        keywords: ['ai', 'assistant', 'copilot'],
        kind: 'action',
      },
    ],
    [],
  );

  const pool = useMemo(() => {
    if (mode === 'pages') return pageItems;
    if (mode === 'actions') return actionItems;
    // Mixed: classic short list + AI entry (legacy) + pages from registry subset for discoverability
    const classicIds = new Set([
      'home', 'categories', 'nearby', 'agenda', 'plans', 'buddy-seek', 'chats', 'create', 'saved', 'history',
      'notifications', 'profile', 'settings', 'achievements', 'admin', 'wallet', 'help', 'trust',
    ]);
    return [
      ...pageItems.filter((p) => classicIds.has(p.id)),
      ...actionItems.filter((a) => a.id === 'act-ai'),
    ];
  }, [mode, pageItems, actionItems]);

  const visible = useMemo(() => {
    if (!q) return pool;
    const needle = q.toLowerCase();
    return pool.filter(
      (c) =>
        c.labelEl.toLowerCase().includes(needle) ||
        c.labelEn.toLowerCase().includes(needle) ||
        c.keywords?.some((k) => k.includes(needle)) ||
        (c.path && c.path.includes(needle)),
    );
  }, [pool, q]);

  const runItem = useCallback(
    (item: CommandItem) => {
      if (item.path === '#ai') openCopilot();
      else if (item.kind === 'action' && (item.promptEl || item.promptEn)) {
        openCopilot(language === 'el' ? item.promptEl : item.promptEn);
      } else if (item.path) navigate(item.path);
      setOpen(false);
      setQuery('');
    },
    [navigate, language],
  );

  /** Free-text that is not a page → Ask AI (mixed mode). */
  const askAi = useCallback(() => {
    const text = q.trim();
    setOpen(false);
    setQuery('');
    openCopilot(text || undefined);
  }, [q]);

  const hasAiRow = mode === 'mixed' && q.length > 0;
  const totalRows = visible.length + (hasAiRow ? 1 : 0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => {
          const next = !v;
          if (next) trackEvent({ name: 'command_palette_open' });
          return next;
        });
      }
      if (!open) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(totalRows - 1, 0)));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        if (visible[selectedIndex]) {
          e.preventDefault();
          runItem(visible[selectedIndex]);
        } else if (hasAiRow && selectedIndex === visible.length) {
          e.preventDefault();
          askAi();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, visible, selectedIndex, runItem, askAi, hasAiRow, totalRows]);

  useEffect(() => {
    if (open) setSelectedIndex(0);
  }, [open, query]);

  const sections = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of visible) {
      const key = language === 'el' ? item.sectionEl : item.sectionEn;
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return map;
  }, [visible, language]);

  let flatIndex = -1;
  const modeHint =
    mode === 'pages'
      ? t('Λειτουργία σελίδων (/)', 'Pages mode (/)')
      : mode === 'actions'
        ? t('Λειτουργία ενεργειών (>)', 'Actions mode (>)')
        : t('Γράψε / για σελίδες · > για ενέργειες', 'Type / for pages · > for actions');

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-palette"
            onClick={closePalette}
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            className="fixed top-[15vh] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-soft-lg border border-gray-200 dark:border-gray-700 z-palette overflow-hidden outline-none"
            role="dialog"
            aria-modal="true"
            aria-label={t('Γρήγορη πλοήγηση', 'Quick navigation')}
          >
            <div className="flex items-center gap-2 px-4 border-b border-gray-100 dark:border-gray-800">
              <Search className="w-4 h-4 text-gray-400 shrink-0" aria-hidden />
              <input
                ref={inputRef}
                data-autofocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('Αναζήτηση · / σελίδες · > ενέργειες · ή ρώτα το AI…', 'Search · / pages · > actions · or ask AI…')}
                className="flex-1 h-12 bg-transparent text-xs outline-none placeholder:text-gray-400"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-2xs font-medium text-gray-500">
                <Command className="w-3 h-3" />K
              </kbd>
            </div>
            <p className="px-4 py-1.5 text-2xs font-semibold text-gray-400 border-b border-gray-50 dark:border-gray-800">
              {modeHint}
            </p>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {visible.length === 0 && !hasAiRow ? (
                <p className="text-sm text-gray-500 text-center py-5">
                  {t('Δεν βρέθηκαν αποτελέσματα', 'No results found')}
                </p>
              ) : (
                Array.from(sections.entries()).map(([section, items]) => (
                  <div key={section} className="mb-2">
                    <p className="px-2 py-1.5 text-2xs font-bold uppercase tracking-wider text-gray-400">
                      {section}
                    </p>
                    {items.map((item) => {
                      flatIndex += 1;
                      const idx = flatIndex;
                      const Icon = item.icon;
                      const label = language === 'el' ? item.labelEl : item.labelEn;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => runItem(item)}
                          className={cn(
                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors',
                            idx === selectedIndex
                              ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-900 dark:text-cyan-100'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200',
                          )}
                        >
                          <Icon className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
                          <span className="flex-1 font-medium">{label}</span>
                          <ArrowRight className="w-3.5 h-3.5 opacity-40" aria-hidden />
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
              {hasAiRow && (
                <button
                  type="button"
                  onClick={askAi}
                  className={cn(
                    'mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors border border-dashed',
                    selectedIndex === visible.length
                      ? 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-900 dark:text-cyan-100 border-cyan-200 dark:border-cyan-800'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700',
                  )}
                >
                  <Bot className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" aria-hidden />
                  <span className="flex-1 font-medium truncate">
                    {t('Ρώτα το Nakamas AI:', 'Ask Nakamas AI:')} <span className="font-semibold">«{q}»</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-40" aria-hidden />
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}
