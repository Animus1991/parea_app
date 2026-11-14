import React, { ReactNode, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '../../store/uiStore';
import { Toaster } from 'sonner';
import {
  Compass, CalendarCheck, ShieldCheck, Menu, Bell,
  Grid, TrendingUp, Bookmark, History, Flag,
  Users, UserPlus, Settings, HelpCircle, Plus, User, X, MapPin, Calendar, PlusSquare, CreditCard, BadgeCheck, Terminal, Search, Globe, MessageSquare,
  Trophy, Zap, ChevronsLeft, ChevronsRight, ChevronDown, BookOpen
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { ThemePicker } from '../common/ThemePicker';
import { PlansFormingSidebar } from '../buddySeek/PlansFormingSidebar';
import { PlansFormingSidebarReopenTab } from '../buddySeek/PlansFormingSidebar';
import { isPlansRailRoute } from '../../lib/plansFormingRail';
import { pageTitleForPath } from '../../lib/pageTitle';
import { tierLabelEl, tierLabelEn } from '../../lib/trust';
import { PlansFormingBottomSheet } from '../buddySeek/PlansFormingBottomSheet';
import { PlansFormingMobileFab } from '../buddySeek/PlansFormingMobileFab';
import { PopupChatRoot } from '../chat/PopupChatRoot';
import { DemoModeBanner } from '../common/DemoModeBanner';
import { useRealtimeChat } from '../../hooks/useRealtimeChat';
import { useFirebaseAuth } from '../../hooks/useFirebaseAuth';
import { CopilotLauncher } from '../copilot/CopilotLauncher';
import { CopilotPanel } from '../copilot/CopilotPanel';
import { useCopilotStore } from '../../store/copilotStore';
import { isPlatformAdmin } from '../../lib/roles';
import { DESKTOP_DOCK_QUERY, useMediaQuery } from '../../hooks/useMediaQuery';

function useUnreadCount() {
  const notifications = useStore(state => state.notifications);
  return notifications.filter(n => !n.read).length;
}
import { useLanguage } from '../../lib/i18n';

// ─────────────────────────────────────────────
// NakamasLogo — SVG ψάθινο καπέλο με αχυρωτό στέλεχος
// ─────────────────────────────────────────────
function NakamasLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const theme = useStore((state) => state.theme);
  const logoTextColor = theme === 'activebuddies' ? 'text-[hsl(220_14%_12%)]' : theme === 'activebuddies-dark' ? 'text-[hsl(210_20%_92%)]' : theme === 'vibrant' ? 'text-fuchsia-700' : theme === 'vibrant-dark' ? 'text-fuchsia-500' : 'text-accent';
  return (
    <div className={cn("nakamas-logo flex items-baseline font-extrabold tracking-tight font-['Poppins']", logoTextColor, className)}>
      <div className="relative inline-block">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 90"
          className="absolute -top-[0.83em] -left-[0.55em] w-[1.8em] h-[1.8em] origin-center -rotate-[8deg] z-10 pointer-events-none drop-shadow"
        >
          {/* Chin strap back */}
          <path d="M 35 60 C 20 65, 15 75, 25 80" fill="none" stroke="#3F2A1B" strokeWidth="2" strokeLinecap="round" />
          {/* Brim */}
          <ellipse cx="60" cy="62" rx="55" ry="14" fill="#E4BD70" stroke="#3F2A1B" strokeWidth="3" />
          {/* Brim texture */}
          <path d="M 15 62 Q 60 76 105 62 M 25 67 Q 60 80 95 67" fill="none" stroke="#C49B50" strokeWidth="1.5" />
          {/* Dome */}
          <path d="M 32 60 C 32 20, 42 16, 60 16 C 78 16, 88 20, 88 60 Z" fill="#E4BD70" stroke="#3F2A1B" strokeWidth="3" strokeLinejoin="round" />
          {/* Dome texture lines */}
          <path d="M 45 25 L 45 48 M 60 20 L 60 52 M 75 25 L 75 48" fill="none" stroke="#C49B50" strokeWidth="2" strokeLinecap="round" />
          <path d="M 38 32 C 50 35, 70 35, 82 32 M 36 42 Q 60 48 84 42" fill="none" stroke="#C49B50" strokeWidth="1.5" strokeLinecap="round" />
          {/* Red Band */}
          <path d="M 31.5 54 C 50 63, 70 63, 88.5 54 L 88.5 60 C 70 70, 50 70, 31.5 60 Z" fill="#D84539" stroke="#3F2A1B" strokeWidth="3" strokeLinejoin="round" />
          {/* Chin strap front */}
          <path d="M 32 62 C 25 58, 20 62, 22 66" fill="none" stroke="#3F2A1B" strokeWidth="2" strokeLinecap="round" />
          <path d="M 22 66 Q 16 75 20 85" fill="none" stroke="#3F2A1B" strokeWidth="2.5" strokeLinecap="round" />
          {/* Wheat Straw */}
          <g transform="translate(62, 79) rotate(-12)">
            <path d="M 0 0 Q 34 12 68 -2" fill="none" stroke="#E4BD70" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 46 4.8 Q 57 2 66 -1.2" fill="none" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 48 4.3 L 56 -1.5 M 52 3.3 L 60 -2.5 M 56 2.3 L 64 -3.5 M 60 1.3 L 68 -4.5 M 64 0.3 L 72 -5.5" fill="none" stroke="#E4BD70" strokeWidth="1" strokeLinecap="round" />
            <path d="M 48 4.3 L 56 10 M 52 3.3 L 60 9 M 56 2.3 L 64 8 M 60 1.3 L 68 7 M 64 0.3 L 72 6" fill="none" stroke="#E4BD70" strokeWidth="1" strokeLinecap="round" />
          </g>
        </svg>
        <span className="relative z-0 leading-none">N</span>
      </div>
      <span className={cn("leading-none", compact && "hidden")}>akamas</span>
    </div>
  );
}

// ─────────────────────────────────────────────
// NavItem
// ─────────────────────────────────────────────
interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  compact?: boolean;
  /** Icon-only rail σε όλα τα widths (collapsed sidebar). */
  rail?: boolean;
}

function NavItem({ to, icon: Icon, label, compact = false, rail = false }: NavItemProps) {
  const tok = useThemeStyles();
  const containerClass = rail
    ? 'justify-center px-0 py-3'
    : compact
      ? 'justify-center px-0 py-3 lg:justify-start lg:px-3 lg:py-2'
      : 'justify-start px-3 py-2';
  const iconClass = rail
    ? 'h-[22px] w-[22px] shrink-0'
    : compact
      ? 'h-[22px] w-[22px] lg:h-4 lg:w-4 shrink-0'
      : 'h-4 w-4 shrink-0';
  const textClass = rail ? 'hidden' : compact ? 'hidden lg:block' : 'block';

  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl lg:rounded-lg text-sm font-medium transition-colors group min-h-11',
          containerClass,
          isActive ? tok.navActive : tok.navInactive
        )
      }
    >
      <Icon className={iconClass} />
      <span className={textClass}>{label}</span>
    </NavLink>
  );
}

// ─────────────────────────────────────────────
// NavSection
// ─────────────────────────────────────────────
interface NavSectionProps {
  /** Stable id (persisted collapse state). */
  id: string;
  title: string;
  /** Routes inside the section — the section auto-opens when one is active. */
  paths: string[];
  children: ReactNode;
  compact?: boolean;
  rail?: boolean;
}

function NavSection({ id, title, paths, children, compact = false, rail = false }: NavSectionProps) {
  const theme = useStore((state) => state.theme);
  const { pathname } = useLocation();
  const collapsedIds = useUIStore((s) => s.navCollapsed);
  const toggle = useUIStore((s) => s.toggleNavSection);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark' || theme === 'activebuddies-dark';
  const isAB = theme === 'activebuddies' || theme === 'activebuddies-dark';
  const containsActive = paths.some((p) => (p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(`${p}/`)));
  const collapsed = collapsedIds.includes(id) && !containsActive;
  const listId = `nav-section-${id}`;
  const count = Array.isArray(children) ? children.filter(Boolean).length : 1;
  // Collapsing only applies where titles are visible (full drawer, or lg+ when not a rail).
  const listHidden = rail ? '' : compact ? (collapsed ? 'lg:hidden' : '') : collapsed ? 'hidden' : '';
  return (
    <div className="mb-2 lg:mb-4">
      {(compact || rail) && <div className={cn("h-px my-4 mx-4", rail ? "block" : "block lg:hidden", isDark ? "bg-gray-700" : "bg-gray-200")} />}
      <h3 className={cn('mb-1', rail ? 'hidden' : compact ? 'hidden lg:block' : 'block')}>
        <button
          type="button"
          onClick={() => toggle(id)}
          aria-expanded={!collapsed}
          aria-controls={listId}
          disabled={containsActive}
          title={containsActive ? undefined : collapsed ? title : undefined}
          className={cn(
            'w-full flex items-center justify-between gap-2 px-3 py-1.5 min-h-9 rounded-lg text-sm font-bold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-default',
            isDark ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5' : isAB ? 'text-[hsl(220_11%_34%)] hover:bg-gray-100/70' : 'text-[#6B7280] hover:text-gray-900 hover:bg-gray-50',
          )}
        >
          <span className="truncate text-left">{title}</span>
          <span className="flex items-center gap-1.5 shrink-0">
            {collapsed && <span className="text-2xs font-semibold tabular-nums opacity-70">{count}</span>}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200 motion-reduce:transition-none', collapsed ? '-rotate-90' : 'rotate-0', containsActive && 'opacity-40')} aria-hidden />
          </span>
        </button>
      </h3>
      <div id={listId} className={cn("space-y-1.5 lg:space-y-0.5", listHidden)}>{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NavLinks
// ─────────────────────────────────────────────
function NavLinks({ compact = false, rail = false }: { compact?: boolean; rail?: boolean }) {
  const { t } = useLanguage();
  const currentUser = useStore((s) => s.currentUser);
  // Same predicate as CommandPalette and the copilot (lib/roles.ts).
  const isAdmin = isPlatformAdmin(currentUser);

  return (
    <>
      <NavSection id="explore" paths={['/', '/categories', '/nearby']} title={t('Εξερεύνηση & Ανακάλυψη', 'Explore & Discover')} compact={compact} rail={rail}>
        <NavItem to="/" icon={Compass} label={t('Ανακάλυψη Εκδηλώσεων', 'Discover Events')} compact={compact} rail={rail} />
        <NavItem to="/categories" icon={Grid} label={t('Κατηγορίες', 'Categories')} compact={compact} rail={rail} />
        <NavItem to="/nearby" icon={MapPin} label={t('Τοπικές Ομάδες', 'Local Groups')} compact={compact} rail={rail} />
      </NavSection>

      <NavSection id="experience" paths={['/agenda', '/plans', '/buddy-seek', '/saved', '/history']} title={t('Η Εμπειρία μου', 'My Experience')} compact={compact} rail={rail}>
        <NavItem to="/agenda" icon={Calendar} label={t('Το Ημερολόγιό μου', 'My Calendar')} compact={compact} rail={rail} />
        <NavItem to="/plans" icon={CalendarCheck} label={t('Τα Σχέδιά μου', 'My Plans')} compact={compact} rail={rail} />
        <NavItem to="/buddy-seek" icon={UserPlus} label={t('Βρες Nakamas', 'Find Nakamas')} compact={compact} rail={rail} />
        <NavItem to="/saved" icon={Bookmark} label={t('Αποθηκευμένες', 'Saved')} compact={compact} rail={rail} />
        <NavItem to="/history" icon={History} label={t('Ιστορικό', 'History')} compact={compact} rail={rail} />
      </NavSection>

      <NavSection id="community" paths={['/connections', '/chats', '/chat', '/leaderboard', '/challenges', '/achievements']} title={t('Κοινότητα', 'Community')} compact={compact} rail={rail}>
        <NavItem to="/connections" icon={Users} label={t('Οι Nakamas μου', 'My Nakamas')} compact={compact} rail={rail} />
        <NavItem to="/chats" icon={MessageSquare} label={t('Ομαδικές Συνομιλίες', 'Group Chats')} compact={compact} rail={rail} />
        <NavItem to="/leaderboard" icon={Trophy} label={t('Κατάταξη', 'Leaderboard')} compact={compact} rail={rail} />
        <NavItem to="/challenges" icon={Zap} label={t('Προκλήσεις', 'Challenges')} compact={compact} rail={rail} />
      </NavSection>

      <NavSection id="host" paths={['/manage', '/create', '/wallet']} title={t('Διοργάνωση', 'Host')} compact={compact} rail={rail}>
        <NavItem to="/manage" icon={TrendingUp} label={t('Πίνακας Διοργανωτή', 'Organizer Dashboard')} compact={compact} rail={rail} />
        <NavItem to="/create" icon={PlusSquare} label={t('Δημιουργία Εκδήλωσης', 'Create Event')} compact={compact} rail={rail} />
        <NavItem to="/wallet" icon={CreditCard} label={t('Πορτοφόλι & Κέρδη', 'Wallet & Earnings')} compact={compact} rail={rail} />
      </NavSection>

      <NavSection id="trust" paths={['/verification', '/trust', '/report']} title={t('Εμπιστοσύνη & Ασφάλεια', 'Trust & Safety')} compact={compact} rail={rail}>
        <NavItem to="/verification" icon={BadgeCheck} label={t('Επαλήθευση Ταυτότητας', 'Identity Verification')} compact={compact} rail={rail} />
        <NavItem to="/trust" icon={ShieldCheck} label={t('Κέντρο Εμπιστοσύνης', 'Trust Center')} compact={compact} rail={rail} />
        <NavItem to="/report" icon={Flag} label={t('Αναφορά Προβλήματος', 'Report Issue')} compact={compact} rail={rail} />
      </NavSection>

      <NavSection id="account" paths={['/profile', '/notifications', '/settings', '/admin']} title={t('Λογαριασμός & Ρυθμίσεις', 'Account & Settings')} compact={compact} rail={rail}>
        <NavItem to="/profile" icon={User} label={t('Το Προφίλ μου', 'My Profile')} compact={compact} rail={rail} />
        <NavItem to="/notifications" icon={Bell} label={t('Ειδοποιήσεις', 'Notifications')} compact={compact} rail={rail} />
        <NavItem to="/settings" icon={Settings} label={t('Ρυθμίσεις & Απόρρητο', 'Settings & Privacy')} compact={compact} rail={rail} />
        {isAdmin && (
          <NavItem to="/admin" icon={Terminal} label={t('Διαχείριση & Έλεγχος', 'Admin & Moderation')} compact={compact} rail={rail} />
        )}
      </NavSection>

      <NavSection id="support" paths={['/help', '/onboarding']} title={t('Υποστήριξη', 'Support')} compact={compact} rail={rail}>
        <NavItem to="/help" icon={HelpCircle} label={t('Κέντρο Βοήθειας', 'Help Center')} compact={compact} rail={rail} />
        <NavItem to="/onboarding" icon={BookOpen} label={t('Οδηγός Εισαγωγής', 'Onboarding')} compact={compact} rail={rail} />
      </NavSection>
    </>
  );
}

// ─────────────────────────────────────────────
// SideNav
// ─────────────────────────────────────────────
export function SideNav() {
  const tok = useThemeStyles();
  const { t } = useLanguage();
  const collapsed = useStore((s) => s.sidebarCollapsed);
  const setCollapsed = useStore((s) => s.setSidebarCollapsed);
  return (
    <aside className={cn("h-full flex-col shrink-0 hidden md:flex transition-all duration-300 z-sidenav border-r", collapsed ? "w-[88px]" : "w-[88px] lg:w-64", tok.sideNav)}>
      <div className={cn("h-header flex items-center border-b shrink-0", collapsed ? "justify-center" : "justify-center lg:justify-start lg:px-4", tok.sideNavBorder)}>
        <NakamasLogo compact={collapsed} className={collapsed ? undefined : "nakamas-logo--lg"} />
      </div>
      <div className="flex-1 overflow-y-auto py-4 lg:py-4 px-2 lg:px-3">
        <NavLinks compact={!collapsed} rail={collapsed} />
      </div>
      {/* Collapse toggle — ορατό μόνο σε lg+ (σε md το sidebar είναι ήδη rail) */}
      <div className={cn("hidden lg:flex border-t p-3 shrink-0", collapsed ? "justify-center" : "justify-end", tok.sideNavBorder)}>
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t('Επέκταση πλοήγησης', 'Expand sidebar') : t('Σύμπτυξη πλοήγησης', 'Collapse sidebar')}
          title={collapsed ? t('Επέκταση πλοήγησης', 'Expand sidebar') : t('Σύμπτυξη πλοήγησης', 'Collapse sidebar')}
          className={cn("p-2 rounded-lg transition-colors min-h-10 min-w-10 flex items-center justify-center", tok.chipButton)}
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// TopNav
// ─────────────────────────────────────────────
export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const isDesktopDock = useMediaQuery(DESKTOP_DOCK_QUERY);
  const navigate = useNavigate();
  const { pathname: currentPath } = useLocation();
  const pageTitle = pageTitleForPath(currentPath);
  const { language, setLanguage, t } = useLanguage();
  const currentUser = useStore((state) => state.currentUser);
  const theme = useStore((state) => state.theme);
  const tok = useThemeStyles();
  const unreadNotificationCount = useUnreadCount();
  const [searchValue, setSearchValue] = useState('');
  // While Nakamas AI is docked the main column is narrower: secondary chrome waits for 2xl.
  const copilotDocked = useCopilotStore((s) => s.open) && isDesktopDock;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <nav className={cn("relative z-topnav flex items-center justify-between px-4 lg:px-4 py-[10px] border-b h-header shrink-0 overflow-visible", tok.topNav)}>
      <div className="flex items-center space-x-5">
        <div className="md:hidden">
          <NakamasLogo />
        </div>
        <div className={cn("hidden whitespace-nowrap", copilotDocked ? "2xl:block" : "md:block")}>
          <span className={cn("text-sm font-bold tracking-wide", tok.isDark ? "text-white" : tok.isAB ? "text-[hsl(220_14%_12%)] tracking-tight" : "text-gray-400")}>{t(pageTitle.el, pageTitle.en)}</span>
        </div>
      </div>
      <div className="flex items-center space-x-3 relative z-raised overflow-visible">
        <div className={cn("relative hidden", copilotDocked ? "2xl:block" : "lg:block")}>
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('Αναζήτηση εκδηλώσεων...', 'Search events...')}
            className={cn("search-control w-64 h-9 py-1.5 pl-8 pr-7 border outline-none transition-colors", tok.searchInput)}
          />
          <Search className={cn("absolute w-3.5 h-3.5 left-2.5 top-1/2 -translate-y-1/2", tok.isDark ? "text-gray-400" : "text-gray-400")} />
          {searchValue && (
            <button
              type="button"
              onClick={() => setSearchValue('')}
              aria-label={t('Καθαρισμός αναζήτησης', 'Clear search')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-9 min-w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          )}
        </div>

        {/* Nakamas AI — the copilot that can act anywhere in the app (Φ24) */}
        <CopilotLauncher />

        {/* Quick action — create an event */}
        <button
          onClick={() => navigate('/create')}
          aria-label={t('Δημιουργία εκδήλωσης', 'Create event')}
          title={t('Δημιουργία εκδήλωσης', 'Create event')}
          className={cn(
            "hidden sm:inline-flex items-center gap-1.5 text-sm font-bold rounded-full transition-all duration-200 px-3 py-2 min-h-10 shadow-soft hover:shadow-soft-md hover:-translate-y-[0.5px]",
            theme === 'activebuddies' ? 'bg-[hsl(220_14%_12%)] text-white hover:bg-black'
              : theme === 'activebuddies-dark' ? 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] hover:bg-white'
              : theme === 'vibrant' || theme === 'vibrant-dark' ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-700'
              : theme === 'bento' || theme === 'bento-dark' ? 'bg-indigo-600 text-white hover:bg-indigo-700'
              : theme === 'neon' || theme === 'neon-dark' ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-brand text-white hover:bg-[#0b6d6f]',
          )}
        >
          <Plus className="w-4 h-4" strokeWidth={2.6} />
          <span className="hidden lg:inline">{t('Δημιουργία', 'Create')}</span>
        </button>

        <ThemePicker variant="compact" />

        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
          className={cn("flex items-center gap-1 text-xs font-bold transition-colors px-2.5 py-2 rounded-lg min-h-10 min-w-10", tok.chipButton)}
          aria-label={language === 'el' ? t('Αλλαγή σε Αγγλικά','Switch to English') : t('Αλλαγή σε Ελληνικά','Switch to Greek')} title={language === 'el' ? t('Αλλαγή σε Αγγλικά','Switch to English') : t('Αλλαγή σε Ελληνικά','Switch to Greek')}
        >
          <Globe className="w-3.5 h-3.5" />
          {language === 'el' ? 'EN' : 'EL'}
        </button>

        <NavLink aria-label={unreadNotificationCount > 0 ? `${t('Ειδοποιήσεις','Notifications')} (${unreadNotificationCount})` : t('Ειδοποιήσεις','Notifications')} to="/notifications" className={cn("relative transition-colors", theme === "activebuddies-dark" ? "text-white hover:text-gray-300" : theme === "activebuddies" ? "text-[hsl(220_11%_34%)] hover:text-[hsl(220_14%_12%)]" : theme === "bento-dark" || theme === "neon-dark" ? "text-white hover:text-emerald-400" : theme === "vibrant-dark" ? "text-white hover:text-fuchsia-400" : theme === "vibrant" ? "text-gray-500 hover:text-fuchsia-600" : theme === "bento" ? "text-gray-500 hover:text-indigo-600" : theme === "neon" ? "text-gray-500 hover:text-emerald-600" : "text-gray-500 hover:text-brand")}>
          <Bell className="h-[18px] w-[18px]" />
          {unreadNotificationCount > 0 && (
            <span className={cn("absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-xs font-bold border", theme === 'activebuddies' ? 'bg-[hsl(220_14%_12%)] text-white border-white' : theme === 'activebuddies-dark' ? 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] border-[hsl(220_16%_8%)]' : 'bg-accent text-white border-white')}>
              {unreadNotificationCount}
            </span>
          )}
        </NavLink>

        <div className="flex items-center space-x-2">
          {currentUser ? (
            <NavLink to="/profile" className="flex items-center space-x-2 relative group">
              <div className={cn("hidden flex-col items-end", copilotDocked ? "2xl:flex" : "sm:flex")}>
                <span className={cn("text-xs font-bold tracking-wide", theme === "activebuddies" ? "text-[hsl(220_11%_34%)]" : theme === "activebuddies-dark" ? "text-[hsl(220_13%_72%)]" : theme === "vibrant-dark" ? "text-gray-400" : theme === "vibrant" ? "text-gray-500" : theme === "bento-dark" || theme === "neon-dark" ? "text-emerald-400" : "text-brand")}>{t(tierLabelEl(currentUser.trustTier), tierLabelEn(currentUser.trustTier))}</span>
                <span className={cn("text-xs font-bold", theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" || theme === "activebuddies-dark" ? "text-white" : "text-ink")}>{currentUser.name}</span>
              </div>
              <div className={cn("w-[28px] h-[28px] rounded-full flex items-center justify-center font-bold text-xs overflow-hidden border", theme === "activebuddies-dark" ? "bg-gray-700/50 border-gray-600 text-gray-200" : theme === "activebuddies" ? "bg-[hsl(220_14%_96%)] border-[hsl(220_13%_92%)] text-[hsl(220_14%_12%)]" : theme === "vibrant-dark" ? "bg-white/10 border-white/15 text-gray-300" : theme === "bento-dark" || theme === "neon-dark" ? "bg-emerald-900/30 border-emerald-700 text-emerald-400" : theme === "vibrant" ? "bg-gray-100 border-gray-200 text-gray-600" : theme === "bento" ? "bg-indigo-100 border-indigo-200 text-indigo-700" : theme === "neon" ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "bg-cyan-100 border-cyan-200 text-brand")}>
                {currentUser.photoUrl ? (
                  <img src={currentUser.photoUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.substring(0, 2)
                )}
              </div>
            </NavLink>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className={cn("text-xs font-bold text-white px-3 py-1.5 rounded-full transition-colors", theme === 'activebuddies' ? 'bg-[hsl(220_14%_12%)] hover:bg-black' : theme === 'activebuddies-dark' ? 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] hover:bg-white' : 'bg-cyan-600 hover:bg-cyan-700')}
            >
              {t('Σύνδεση', 'Login')}
            </button>
          )}
        </div>

        <button onClick={onMenuClick} aria-label={t('Άνοιγμα μενού','Open menu')} className={cn("md:hidden", theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" || theme === "activebuddies-dark" ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-ink")}>
          <Menu className="h-[22px] w-[22px]" />
        </button>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────
// BottomNav
// ─────────────────────────────────────────────
export function BottomNav() {
  const tok = useThemeStyles();
  const { t } = useLanguage();
  return (
    <div className={cn("md:hidden fixed bottom-0 left-0 w-full backdrop-blur-md border-t px-2 pb-4 pt-3 flex items-center justify-around shadow-soft-up-lg z-bottomnav", tok.bottomNav)}>
      {([
        { to: "/", icon: Compass, labelGr: 'Ανακάλυψη', labelEn: 'Discover' },
        { to: "/plans", icon: CalendarCheck, labelGr: 'Σχέδια', labelEn: 'Plans' },
      ] as const).map(({ to, icon: Icon, labelGr, labelEn }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) =>
            cn("flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px] min-h-11",
              isActive ? tok.navActive : tok.navInactive)
          }
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          <span className="text-xs font-medium leading-none">{t(labelGr, labelEn)}</span>
        </NavLink>
      ))}
      <div className="flex flex-col items-center justify-center -mt-4">
        <NavLink
          to="/create"
          className={cn("w-11 h-11 rounded-full flex items-center justify-center shadow-soft-lg transition-colors border-[3px] border-white", tok.fab)}
        >
          <Plus className="h-[20px] w-[20px]" strokeWidth={2.5} />
        </NavLink>
        <span className={cn("text-xs font-medium mt-1", tok.muted)}>{t('Δημιουργία', 'Create')}</span>
      </div>
      {([
        { to: "/trust", icon: ShieldCheck, labelGr: 'Εμπιστοσύνη', labelEn: 'Trust' },
        { to: "/profile", icon: User, labelGr: 'Προφίλ', labelEn: 'Profile' },
      ] as const).map(({ to, icon: Icon, labelGr, labelEn }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) =>
            cn("flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px] min-h-11",
              isActive ? tok.navActive : tok.navInactive)
          }
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          <span className="text-xs font-medium leading-none">{t(labelGr, labelEn)}</span>
        </NavLink>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// AppShell
// ─────────────────────────────────────────────
export function AppShell({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();
  const theme = useStore((s) => s.theme);
  const currentUser = useStore((s) => s.currentUser);
  const tok = useThemeStyles();
  const copilotOpen = useCopilotStore((s) => s.open);
  const maintenanceMode = useStore((s) => s.adminSafeguards.maintenanceMode);
  const { pathname } = useLocation();
  // The plans rail is contextual to discovery screens (lib/plansFormingRail.ts).
  const showPlansRail = !copilotOpen && isPlansRailRoute(pathname);

  useRealtimeChat(currentUser?.id);
  useFirebaseAuth();

  return (
    <div
      data-theme={theme}
      className={cn("flex flex-col h-screen w-full font-sans antialiased overflow-hidden", tok.shell)}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-toast focus:px-4 focus:py-2.5 focus:min-h-10 focus:bg-brand focus:text-brand-fg focus:rounded-xl focus:text-sm focus:font-semibold focus:shadow-soft"
      >
        {t('Μετάβαση στο περιεχόμενο', 'Skip to content')}
      </a>
      {/* In the layout flow (not fixed), so it never covers the logo, header or rails. */}
      <DemoModeBanner />
      <div className="flex flex-1 min-h-0 w-full">
      <SideNav />
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-modal flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className={cn("relative w-64 max-w-sm h-full shadow-soft-lg flex flex-col z-modal", tok.sideNav)}>
            <div className="h-header flex items-center justify-between px-4 border-b border-[#E5E7EB] shrink-0">
              <NakamasLogo />
              <button onClick={() => setIsMobileMenuOpen(false)} aria-label={t('Κλείσιμο μενού', 'Close menu')} className={cn(tok.isDark ? "text-white hover:text-white" : "text-gray-500 hover:text-ink")}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-3" onClick={() => setIsMobileMenuOpen(false)}>
              <NavLinks />
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-1 h-full overflow-hidden min-w-0">
        <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
          <TopNav onMenuClick={() => setIsMobileMenuOpen(true)} />
          <main id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto relative flex flex-col min-w-0 outline-none">
            <div className="mx-auto w-full max-w-full p-4 lg:px-5 lg:py-4 flex-1 pb-safe md:pb-4">
              {maintenanceMode && (
                <p role="status" className="mb-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <Settings className="h-4 w-4 shrink-0" aria-hidden />
                  {t('Γίνεται προγραμματισμένη συντήρηση — κάποιες λειτουργίες μπορεί να καθυστερούν.', 'Scheduled maintenance in progress — some features may be slower.')}
                </p>
              )}
              {children}
            </div>
          </main>
        <footer className="hidden md:flex h-8 px-4 border-t border-border bg-surface text-xs text-ink-muted items-center justify-between shrink-0">
          <div className="flex space-x-4">
            <span>Nakamas v1.0.5-beta</span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
              {t('Σύστημα Λειτουργικό', 'System Operational')}
            </span>
          </div>
          <div className="hidden sm:flex space-x-4">
            <Link to="/settings" className="hover:text-ink transition-colors">{t('Πολιτική Απορρήτου', 'Privacy Policy')}</Link>
            <Link to="/report" className="hover:text-ink transition-colors">{t('Αναφορά Προβλημάτων', 'Report Issues')}</Link>
            <Link to="/trust" className="hover:text-ink transition-colors">{t('Πώς λειτουργεί η αξιοπιστία', 'How trust works')}</Link>
          </div>
        </footer>
          <BottomNav />
          <PlansFormingMobileFab />
        </div>
        {/* The docked copilot replaces the plans-forming rail while open (both live on the right edge). */}
        {showPlansRail && <PlansFormingSidebar />}
        {showPlansRail && <PlansFormingSidebarReopenTab />}
        <CopilotPanel />
      </div>
      </div>
      <PlansFormingBottomSheet />
      <PopupChatRoot />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}


