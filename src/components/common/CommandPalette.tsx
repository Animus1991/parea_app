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
  Sparkles,
} from 'lucide-react';
import { openCopilot } from '../../ai/copilot';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../lib/i18n';
import { trackEvent } from '../../lib/analytics';
import { useStore } from '../../store';
import { useOverlayBehavior } from '../../hooks/useOverlayBehavior';

interface CommandItem {
  id: string;
  labelEl: string;
  labelEn: string;
  icon: React.ElementType;
  path: string;
  sectionEl: string;
  sectionEn: string;
  keywords?: string[];
  adminOnly?: boolean;
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

  const isAdmin = Boolean(currentUser?.isOrganizer);

  const commands: CommandItem[] = useMemo(
    () => [
      { id: 'home', labelEl: 'Αρχική', labelEn: 'Home', icon: Home, path: '/', sectionEl: 'Πλοήγηση', sectionEn: 'Navigation', keywords: ['feed'] },
      { id: 'categories', labelEl: 'Κατηγορίες', labelEn: 'Categories', icon: Grid, path: '/categories', sectionEl: 'Πλοήγηση', sectionEn: 'Navigation' },
      { id: 'nearby', labelEl: 'Κοντά μου', labelEn: 'Nearby', icon: MapPin, path: '/nearby', sectionEl: 'Πλοήγηση', sectionEn: 'Navigation', keywords: ['map'] },
      { id: 'agenda', labelEl: 'Ημερολόγιο', labelEn: 'Calendar', icon: CalendarCheck, path: '/agenda', sectionEl: 'Πλοήγηση', sectionEn: 'Navigation' },
      { id: 'plans', labelEl: 'Τα Σχέδιά μου', labelEn: 'My Plans', icon: Calendar, path: '/plans', sectionEl: 'Πλοήγηση', sectionEn: 'Navigation' },
      { id: 'buddy-seek', labelEl: 'Βρες Nakamas', labelEn: 'Find Nakamas', icon: UserPlus, path: '/buddy-seek', sectionEl: 'Πλοήγηση', sectionEn: 'Navigation', keywords: ['parea', 'company', 'buddy'] },
      { id: 'chats', labelEl: 'Μηνύματα', labelEn: 'Messages', icon: MessageSquare, path: '/chats', sectionEl: 'Πλοήγηση', sectionEn: 'Navigation', keywords: ['inbox', 'chat'] },
      { id: 'ai', labelEl: 'Nakamas AI — ο βοηθός σου', labelEn: 'Nakamas AI — your assistant', icon: Sparkles, path: '#ai', sectionEl: 'Ενέργειες', sectionEn: 'Actions', keywords: ['ai', 'assistant', 'copilot', 'βοηθ', 'gemini'] },
      { id: 'create', labelEl: 'Δημιουργία εκδήλωσης', labelEn: 'Create event', icon: PlusSquare, path: '/create', sectionEl: 'Ενέργειες', sectionEn: 'Actions' },
      { id: 'saved', labelEl: 'Αποθηκευμένα', labelEn: 'Saved', icon: Bookmark, path: '/saved', sectionEl: 'Ενέργειες', sectionEn: 'Actions' },
      { id: 'history', labelEl: 'Ιστορικό', labelEn: 'History', icon: History, path: '/history', sectionEl: 'Ενέργειες', sectionEn: 'Actions' },
      { id: 'notifications', labelEl: 'Ειδοποιήσεις', labelEn: 'Notifications', icon: Bell, path: '/notifications', sectionEl: 'Λογαριασμός', sectionEn: 'Account' },
      { id: 'profile', labelEl: 'Προφίλ', labelEn: 'Profile', icon: User, path: '/profile', sectionEl: 'Λογαριασμός', sectionEn: 'Account' },
      { id: 'settings', labelEl: 'Ρυθμίσεις', labelEn: 'Settings', icon: Settings, path: '/settings', sectionEl: 'Λογαριασμός', sectionEn: 'Account' },
      { id: 'achievements', labelEl: 'Επιτεύγματα', labelEn: 'Achievements', icon: Trophy, path: '/achievements', sectionEl: 'Λογαριασμός', sectionEn: 'Account' },
      { id: 'admin', labelEl: 'Admin', labelEn: 'Admin', icon: ShieldCheck, path: '/admin', sectionEl: 'Admin', sectionEn: 'Admin', adminOnly: true },
    ],
    [],
  );

  const visible = useMemo(() => {
    const base = commands.filter((c) => !c.adminOnly || isAdmin);
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (c) =>
        c.labelEl.toLowerCase().includes(q) ||
        c.labelEn.toLowerCase().includes(q) ||
        c.keywords?.some((k) => k.includes(q)) ||
        c.path.includes(q),
    );
  }, [commands, query, isAdmin]);

  const run = useCallback(
    (path: string) => {
      if (path === '#ai') openCopilot();
      else navigate(path);
      setOpen(false);
      setQuery('');
    },
    [navigate],
  );

  /** Φ24 — free-text queries that are not pages go to Nakamas AI. */
  const askAi = useCallback(() => {
    const q = query.trim();
    setOpen(false);
    setQuery('');
    openCopilot(q || undefined);
  }, [query]);
  const hasAiRow = query.trim().length > 0;
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
        setSelectedIndex((i) => Math.min(i + 1, totalRows - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter') {
        if (visible[selectedIndex]) {
          e.preventDefault();
          run(visible[selectedIndex].path);
        } else if (hasAiRow && selectedIndex === visible.length) {
          e.preventDefault();
          askAi();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, visible, selectedIndex, run, askAi, hasAiRow, totalRows]);

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
                placeholder={t('Αναζήτηση σελίδας ή ερώτηση στο AI…', 'Search pages or ask the AI…')}
                className="flex-1 h-9 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-2xs font-medium text-gray-500">
                <Command className="w-3 h-3" />K
              </kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {visible.length === 0 && !hasAiRow ? (
                <p className="text-sm text-gray-500 text-center py-8">
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
                          onClick={() => run(item.path)}
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
                  <Sparkles className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" aria-hidden />
                  <span className="flex-1 font-medium truncate">
                    {t('Ρώτα το Nakamas AI:', 'Ask Nakamas AI:')} <span className="font-semibold">«{query.trim()}»</span>
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
