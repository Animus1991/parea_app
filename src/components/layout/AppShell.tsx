import React, { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import {
  Compass, CalendarCheck, ShieldCheck, Menu, Bell,
  Grid, TrendingUp, Bookmark, History, Flag,
  Users, Settings, HelpCircle, Plus, User, X, MapPin, Calendar, PlusSquare, CreditCard, BadgeCheck, Terminal, Search, Globe, MessageSquare, Palette,
  Trophy, Zap, Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';

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
  const logoTextColor = theme === 'activebuddies' ? 'text-[hsl(220_14%_12%)]' : theme === 'activebuddies-dark' ? 'text-[hsl(210_20%_92%)]' : 'text-[#18D8DB]';
  return (
    <div className={cn("flex items-baseline font-bold tracking-tight font-['Poppins']", logoTextColor, className)}>
      <div className="relative inline-block">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 90"
          className="absolute -top-[0.65em] -left-[0.55em] w-[1.8em] h-[1.8em] origin-center -rotate-[8deg] z-10 pointer-events-none drop-shadow"
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
      <span className={cn("leading-none", compact && "hidden lg:inline")}>akamas</span>
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
  disabled?: boolean;
  compact?: boolean;
}

function NavItem({ to, icon: Icon, label, disabled = false, compact = false }: NavItemProps) {
  const { t } = useLanguage();
  const theme = useStore((state) => state.theme);
  const containerClass = compact
    ? 'justify-center px-0 py-3 lg:justify-start lg:px-3 lg:py-2'
    : 'justify-start px-3 py-2';
  const iconClass = compact
    ? 'h-[22px] w-[22px] lg:h-4 lg:w-4 shrink-0'
    : 'h-4 w-4 shrink-0';
  const textClass = compact ? 'hidden lg:block' : 'block';

  if (disabled) {
    return (
      <div
        className={cn(`${theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" || theme === "activebuddies-dark" ? "text-gray-500" : "text-gray-400"} flex items-center gap-3 text-sm`, containerClass)}
        title={label}
      >
        <Icon className={iconClass} />
        <span className={textClass}>{label}</span>
      <span className={cn(`text-[9px] tracking-wide font-bold px-1.5 py-0.5 rounded ${theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" || theme === "activebuddies-dark" ? "bg-gray-700/40 text-gray-500" : "bg-gray-100 text-gray-500"}`, textClass)}>{t('Σύντομα', 'Soon')}</span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl lg:rounded-lg text-sm font-medium transition-colors group',
          containerClass,
          isActive ? (theme === "activebuddies-dark" ? "bg-gray-700/40 text-white font-bold" : theme === "activebuddies" ? "bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)] font-bold" : theme === "bento-dark" || theme === "neon-dark" ? "bg-gray-700/40 text-emerald-400 font-bold" : theme === "vibrant-dark" ? "bg-gray-700/40 text-fuchsia-400 font-bold" : theme === "vibrant" ? "bg-fuchsia-50 text-fuchsia-700 font-bold" : theme === "bento" ? "bg-indigo-50 text-indigo-700 font-bold" : theme === "neon" ? "bg-emerald-50 text-emerald-700 font-bold" : "bg-cyan-50 text-[#0E8B8D] font-bold") : (theme === "activebuddies-dark" ? "text-gray-300 hover:bg-gray-700/40 hover:text-white" : theme === "activebuddies" ? "text-[hsl(220_9%_46%)] hover:bg-[hsl(220_14%_96%)] hover:text-[hsl(220_14%_12%)]" : theme === "bento-dark" || theme === "neon-dark" ? "text-gray-300 hover:bg-gray-700/40 hover:text-white" : theme === "vibrant-dark" ? "text-gray-300 hover:bg-gray-700/40 hover:text-white" : theme === "vibrant" ? "text-gray-500 lg:text-gray-600 hover:bg-fuchsia-50/50 lg:hover:bg-fuchsia-50/30 hover:text-fuchsia-700" : theme === "bento" ? "text-gray-500 lg:text-gray-600 hover:bg-indigo-50/50 lg:hover:bg-indigo-50/30 hover:text-indigo-700" : theme === "neon" ? "text-gray-500 lg:text-gray-600 hover:bg-emerald-50/50 lg:hover:bg-emerald-50/30 hover:text-emerald-700" : "text-gray-500 lg:text-gray-600 hover:bg-gray-100 lg:hover:bg-gray-50 hover:text-[#111827]")
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
  title: string;
  children: ReactNode;
  compact?: boolean;
}

function NavSection({ title, children, compact = false }: NavSectionProps) {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark' || theme === 'activebuddies-dark';
  const isAB = theme === 'activebuddies' || theme === 'activebuddies-dark';
  return (
    <div className="mb-2 lg:mb-6">
      {compact && <div className={cn("block lg:hidden h-px my-4 mx-4", isDark ? "bg-gray-700" : "bg-gray-200")} />}
      <h3
        className={cn(
          'px-3 text-[13.35px] font-bold tracking-wide mb-2',
          isDark ? 'text-gray-400' : isAB ? 'text-[hsl(220_9%_46%)]' : 'text-[#6B7280]',
          compact ? 'hidden lg:block' : 'block'
        )}
      >
        {title}
      </h3>
      <div className="space-y-1.5 lg:space-y-0.5">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// NavLinks
// ─────────────────────────────────────────────
function NavLinks({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage();
  return (
    <>
      <NavSection title={t('Εξερεύνηση & Ανακάλυψη', 'Explore & Discover')} compact={compact}>
        <NavItem to="/" icon={Compass} label={t('Ανακάλυψη Εκδηλώσεων', 'Discover Events')} compact={compact} />
        <NavItem to="/categories" icon={Grid} label={t('Κατηγορίες', 'Categories')} compact={compact} />
        <NavItem to="/nearby" icon={MapPin} label={t('Τοπικές Ομάδες', 'Local Groups')} compact={compact} />
      </NavSection>

      <NavSection title={t('Η Εμπειρία μου', 'My Experience')} compact={compact}>
        <NavItem to="/agenda" icon={Calendar} label={t('Το Ημερολόγιό μου', 'My Calendar')} compact={compact} />
        <NavItem to="/plans" icon={CalendarCheck} label={t('Τα Σχέδιά μου', 'My Plans')} compact={compact} />
        <NavItem to="/saved" icon={Bookmark} label={t('Αποθηκευμένες', 'Saved')} compact={compact} />
        <NavItem to="/history" icon={History} label={t('Ιστορικό', 'History')} compact={compact} />
      </NavSection>

      <NavSection title={t('Κοινότητα', 'Community')} compact={compact}>
        <NavItem to="/connections" icon={Users} label={t('Οι Nakamas μου', 'My Nakamas')} compact={compact} />
        <NavItem to="/chats" icon={MessageSquare} label={t('Ομαδικές Συνομιλίες', 'Group Chats')} compact={compact} />
        <NavItem to="/leaderboard" icon={Trophy} label={t('Κατάταξη', 'Leaderboard')} compact={compact} />
        <NavItem to="/challenges" icon={Zap} label={t('Προκλήσεις', 'Challenges')} compact={compact} />
      </NavSection>

      <NavSection title={t('Διοργάνωση', 'Host')} compact={compact}>
        <NavItem to="/manage" icon={TrendingUp} label={t('Πίνακας Διοργανωτή', 'Organizer Dashboard')} compact={compact} />
        <NavItem to="/create" icon={PlusSquare} label={t('Δημιουργία Εκδήλωσης', 'Create Event')} compact={compact} />
        <NavItem to="/wallet" icon={CreditCard} label={t('Πορτοφόλι & Κέρδη', 'Wallet & Earnings')} compact={compact} />
      </NavSection>

      <NavSection title={t('Εμπιστοσύνη & Ασφάλεια', 'Trust & Safety')} compact={compact}>
        <NavItem to="/verification" icon={BadgeCheck} label={t('Επαλήθευση Ταυτότητας', 'Identity Verification')} compact={compact} />
        <NavItem to="/trust" icon={ShieldCheck} label={t('Κέντρο Εμπιστοσύνης', 'Trust Center')} compact={compact} />
        <NavItem to="/report" icon={Flag} label={t('Αναφορά Προβλήματος', 'Report Issue')} compact={compact} />
      </NavSection>

      <NavSection title={t('Λογαριασμός & Ρυθμίσεις', 'Account & Settings')} compact={compact}>
        <NavItem to="/profile" icon={User} label={t('Το Προφίλ μου', 'My Profile')} compact={compact} />
        <NavItem to="/notifications" icon={Bell} label={t('Ειδοποιήσεις', 'Notifications')} compact={compact} />
        <NavItem to="/settings" icon={Settings} label={t('Ρυθμίσεις & Απόρρητο', 'Settings & Privacy')} compact={compact} />
        <NavItem to="/help" icon={HelpCircle} label={t('Κέντρο Βοήθειας', 'Help Center')} compact={compact} />
        <NavItem to="/admin" icon={Terminal} label={t('Διαχείριση & Έλεγχος', 'Admin & Moderation')} compact={compact} />
        <NavItem to="/onboarding" icon={Sparkles} label={t('Οδηγός Εισαγωγής', 'Onboarding')} compact={compact} />
      </NavSection>
    </>
  );
}

// ─────────────────────────────────────────────
// SideNav
// ─────────────────────────────────────────────
export function SideNav() {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark' || theme === 'activebuddies-dark';
  const isAB = theme === 'activebuddies' || theme === 'activebuddies-dark';
  return (
    <aside className={cn("h-full flex-col shrink-0 hidden md:flex w-[88px] lg:w-64 transition-all duration-300 z-30 border-r", isDark ? (isAB ? "bg-[hsl(220_16%_8%)] border-[hsl(220_13%_18%)]" : "bg-gray-900/80 border-gray-700/50") : isAB ? "bg-white/50 backdrop-blur-xl border-[hsl(220_13%_92%)]/60" : "bg-white border-[#E5E7EB]")}>
      <div className={cn("h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b shrink-0", isDark ? (isAB ? "border-[hsl(220_13%_18%)]" : "border-gray-700/50") : isAB ? "border-[hsl(220_13%_92%)]/60" : "border-[#E5E7EB]")}>
        <NakamasLogo className="text-[22px] lg:text-[26px]" />
      </div>
      <div className="flex-1 overflow-y-auto py-4 lg:py-6 px-2 lg:px-3">
        <NavLinks compact />
      </div>
    </aside>
  );
}

// ─────────────────────────────────────────────
// TopNav
// ─────────────────────────────────────────────
export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const currentUser = useStore((state) => state.currentUser);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const cycleTheme = () => { const themes = ['classic', 'vibrant', 'bento', 'neon', 'vibrant-dark', 'bento-dark', 'neon-dark', 'activebuddies', 'activebuddies-dark']; const next = themes[(themes.indexOf(theme) + 1) % themes.length]; setTheme(next); };
  const unreadNotificationCount = useUnreadCount();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <nav className={cn("flex items-center justify-between px-4 lg:px-6 py-3 border-b h-16 shrink-0", theme === "activebuddies" ? "bg-white/80 backdrop-blur-xl border-[hsl(220_13%_92%)]/60" : theme === "activebuddies-dark" ? "border-gray-700/50" : theme === "bento-dark" || theme === "neon-dark" ? "bg-gray-900/80 border-gray-700/50" : theme === "vibrant-dark" ? "bg-gray-900/80 border-gray-700/50" : theme === "vibrant" ? "bg-white border-fuchsia-100" : theme === "bento" ? "bg-white border-indigo-100" : theme === "neon" ? "bg-white border-emerald-100" : "bg-white border-[#E5E7EB]")}>
      <div className="flex items-center space-x-8">
        <div className="md:hidden">
          <NakamasLogo className="text-[22px]" />
        </div>
        <div className="hidden md:block">
          <span className={`text-[14.58px] font-bold tracking-wide ${theme === "activebuddies" ? "text-[hsl(220_14%_12%)] tracking-tight" : theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" || theme === "activebuddies-dark" ? "text-white" : "text-gray-400"}`}>{t('Πίνακας Ελέγχου', 'Dashboard')}</span>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="relative hidden lg:block">
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={t('Αναζήτηση εκδηλώσεων...', 'Search events...')}
            className={cn("w-64 py-1.5 pl-8 pr-7 text-[14.42px] border outline-none transition-colors", theme === "activebuddies" ? "h-9 rounded-full border-[hsl(220_13%_92%)] bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)] placeholder:text-[hsl(220_9%_60%)] focus:bg-white focus:border-[hsl(220_13%_72%)]" : theme === "activebuddies-dark" ? "rounded-md border-transparent bg-gray-800/50 text-white placeholder-gray-500 focus:bg-gray-700/60 focus:ring-1 focus:ring-gray-400" : theme === "bento-dark" || theme === "neon-dark" ? "rounded-md border-transparent bg-gray-800/50 text-white placeholder-gray-500 focus:bg-gray-700/60 focus:ring-1 focus:ring-emerald-500" : theme === "vibrant-dark" ? "rounded-md border-transparent bg-gray-800/50 text-white placeholder-gray-500 focus:bg-gray-700/60 focus:ring-1 focus:ring-fuchsia-500" : theme === "vibrant" ? "rounded-md border-transparent bg-fuchsia-50 focus:bg-white text-gray-900 focus:ring-1 focus:ring-fuchsia-400" : theme === "bento" ? "rounded-md border-transparent bg-indigo-50 focus:bg-white text-gray-900 focus:ring-1 focus:ring-indigo-400" : theme === "neon" ? "rounded-md border-transparent bg-emerald-50 focus:bg-white text-gray-900 focus:ring-1 focus:ring-emerald-400" : "rounded-md border-transparent bg-gray-100 focus:bg-white text-gray-900 focus:ring-1 focus:ring-cyan-500")}
          />
          <Search className={`absolute w-4 h-4 ${theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" || theme === "activebuddies-dark" ? "text-white" : "text-gray-400"} left-2.5 top-2`} />
          {searchValue && (
            <button onClick={() => setSearchValue('')} className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Theme Toggle */}
        <button onClick={cycleTheme} className={cn("flex items-center gap-1 text-[11.33px] font-bold transition-colors px-2.5 py-1.5 rounded-lg", theme === "activebuddies-dark" ? "bg-gray-800/40 text-gray-300 hover:text-gray-100 hover:bg-gray-700/50" : theme === "activebuddies" ? "bg-[hsl(220_14%_96%)] text-[hsl(220_9%_46%)] hover:text-[hsl(220_14%_12%)] hover:bg-[hsl(220_13%_92%)]" : theme === "bento-dark" || theme === "neon-dark" ? "bg-gray-800/40 text-gray-300 hover:text-emerald-400 hover:bg-gray-700/50" : theme === "vibrant-dark" ? "bg-gray-800/40 text-gray-300 hover:text-fuchsia-400 hover:bg-gray-700/50" : theme === "vibrant" ? "bg-fuchsia-50 text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-100" : theme === "bento" ? "bg-indigo-50 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100" : theme === "neon" ? "bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:text-[#0E8B8D] hover:bg-cyan-50")} title={t('Αλλαγή θέματος','Toggle theme')} aria-label={t('Αλλαγή θέματος','Toggle theme')}>
          <Palette className="w-4 h-4" />
          <span className="hidden sm:inline capitalize">{theme}</span>
        </button>

        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
          className={cn("flex items-center gap-1 text-[11.33px] font-bold transition-colors px-2.5 py-1.5 rounded-lg", theme === "activebuddies-dark" ? "bg-gray-800/40 text-gray-300 hover:text-gray-100 hover:bg-gray-700/50" : theme === "activebuddies" ? "bg-[hsl(220_14%_96%)] text-[hsl(220_9%_46%)] hover:text-[hsl(220_14%_12%)] hover:bg-[hsl(220_13%_92%)]" : theme === "bento-dark" || theme === "neon-dark" ? "bg-gray-800/40 text-gray-300 hover:text-emerald-400 hover:bg-gray-700/50" : theme === "vibrant-dark" ? "bg-gray-800/40 text-gray-300 hover:text-fuchsia-400 hover:bg-gray-700/50" : theme === "vibrant" ? "bg-fuchsia-50 text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-100" : theme === "bento" ? "bg-indigo-50 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100" : theme === "neon" ? "bg-emerald-50 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:text-[#0E8B8D] hover:bg-cyan-50")}
          aria-label={language === 'el' ? t('Αλλαγή σε Αγγλικά','Switch to English') : t('Αλλαγή σε Ελληνικά','Switch to Greek')} title={language === 'el' ? t('Αλλαγή σε Αγγλικά','Switch to English') : t('Αλλαγή σε Ελληνικά','Switch to Greek')}
        >
          <Globe className="w-3.5 h-3.5" />
          {language === 'el' ? 'EN' : 'EL'}
        </button>

        <NavLink aria-label={unreadNotificationCount > 0 ? `${t('Ειδοποιήσεις','Notifications')} (${unreadNotificationCount})` : t('Ειδοποιήσεις','Notifications')} to="/notifications" className={cn("relative transition-colors", theme === "activebuddies-dark" ? "text-white hover:text-gray-300" : theme === "activebuddies" ? "text-[hsl(220_9%_46%)] hover:text-[hsl(220_14%_12%)]" : theme === "bento-dark" || theme === "neon-dark" ? "text-white hover:text-emerald-400" : theme === "vibrant-dark" ? "text-white hover:text-fuchsia-400" : theme === "vibrant" ? "text-gray-500 hover:text-fuchsia-600" : theme === "bento" ? "text-gray-500 hover:text-indigo-600" : theme === "neon" ? "text-gray-500 hover:text-emerald-600" : "text-gray-500 hover:text-[#0E8B8D]")}>
          <Bell className="h-[18px] w-[18px]" />
          {unreadNotificationCount > 0 && (
            <span className={cn("absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9.27px] font-bold border", theme === 'activebuddies' ? 'bg-[hsl(220_14%_12%)] text-white border-white' : theme === 'activebuddies-dark' ? 'bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] border-[hsl(220_16%_8%)]' : 'bg-[#18D8DB] text-white border-white')}>
              {unreadNotificationCount}
            </span>
          )}
        </NavLink>

        <div className="flex items-center space-x-2">
          {currentUser ? (
            <NavLink to="/profile" className="flex items-center space-x-2 relative group">
              <div className="hidden sm:flex flex-col items-end">
                <span className={cn("text-[10.3px] font-bold tracking-wide", theme === "activebuddies" || theme === "activebuddies-dark" ? "text-[hsl(220_9%_46%)]" : theme === "vibrant-dark" ? "text-fuchsia-400" : theme === "bento-dark" || theme === "neon-dark" ? "text-emerald-400" : "text-[#0E8B8D]")}>{t('Αξιόπιστο Μέλος', 'Trusted Member')}</span>
                <span className={cn("text-[11.33px] font-bold", theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" || theme === "activebuddies-dark" ? "text-white" : "text-[#111827]")}>{currentUser.name}</span>
              </div>
              <div className={cn("w-[28px] h-[28px] rounded-full flex items-center justify-center font-bold text-[10px] overflow-hidden border", theme === "activebuddies-dark" ? "bg-gray-700/50 border-gray-600 text-gray-200" : theme === "activebuddies" ? "bg-[hsl(220_14%_96%)] border-[hsl(220_13%_92%)] text-[hsl(220_14%_12%)]" : theme === "vibrant-dark" ? "bg-fuchsia-900/30 border-fuchsia-700 text-fuchsia-400" : theme === "bento-dark" || theme === "neon-dark" ? "bg-emerald-900/30 border-emerald-700 text-emerald-400" : theme === "vibrant" ? "bg-fuchsia-100 border-fuchsia-200 text-fuchsia-700" : theme === "bento" ? "bg-indigo-100 border-indigo-200 text-indigo-700" : theme === "neon" ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "bg-cyan-100 border-cyan-200 text-[#0E8B8D]")}>
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

        <button onClick={onMenuClick} aria-label={t('Άνοιγμα μενού','Open menu')} className={cn("md:hidden", theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" || theme === "activebuddies-dark" ? "text-gray-300 hover:text-white" : "text-gray-500 hover:text-[#111827]")}>
          <Menu className="h-[22px] w-[22px]" />
        </button>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────
// BottomNav
// ─────────────────────────────────────────────
export function BottomNav() { const theme = useStore(s=>s.theme);
  const { t } = useLanguage();
  return (
    <div className={cn("md:hidden fixed bottom-0 left-0 w-full backdrop-blur-md border-t px-2 pb-4 pt-3 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50", theme === "activebuddies-dark" ? "bg-[hsl(220_16%_11%)]/90 border-[hsl(220_13%_18%)]" : theme === "activebuddies" ? "bg-white/95 border-[hsl(220_13%_92%)]" : theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" ? "bg-gray-900/85 border-gray-700/50" : "bg-white/95 border-gray-200")}>
      {([
        { to: "/", icon: Compass, labelGr: 'Ανακάλυψη', labelEn: 'Discover' },
        { to: "/plans", icon: CalendarCheck, labelGr: 'Σχέδια', labelEn: 'Plans' },
      ] as const).map(({ to, icon: Icon, labelGr, labelEn }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) =>
            cn("flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]",
              isActive
                ? theme === "activebuddies-dark" || theme === "activebuddies" ? "text-[hsl(220_14%_12%)] dark:text-white font-bold" : theme === "bento-dark" || theme === "neon-dark" ? "text-emerald-400" : theme === "vibrant-dark" ? "text-fuchsia-400" : theme === "vibrant" ? "text-fuchsia-600" : theme === "bento" ? "text-indigo-600" : theme === "neon" ? "text-emerald-600" : "text-[#0E8B8D]"
                : theme === "activebuddies-dark" ? "text-gray-400 hover:text-white" : theme === "activebuddies" ? "text-[hsl(220_9%_46%)] hover:text-[hsl(220_14%_12%)]" : theme === "bento-dark" || theme === "neon-dark" ? "text-gray-400 hover:text-emerald-400" : theme === "vibrant-dark" ? "text-gray-400 hover:text-fuchsia-400" : theme === "vibrant" ? "text-gray-400 hover:text-fuchsia-600" : theme === "bento" ? "text-gray-400 hover:text-indigo-600" : theme === "neon" ? "text-gray-400 hover:text-emerald-600" : "text-gray-400 hover:text-[#0E8B8D]")
          }
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          <span className="text-[8px] font-medium leading-none">{t(labelGr, labelEn)}</span>
        </NavLink>
      ))}
      <div className="flex flex-col items-center justify-center -mt-6">
        <NavLink
          to="/create"
          className={cn("w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors border-[3px] border-white", theme === "activebuddies" || theme === "activebuddies-dark" ? "bg-[hsl(220_14%_12%)] text-white hover:bg-black" : theme === "vibrant" || theme === "vibrant-dark" ? "bg-gradient-to-br from-fuchsia-600 to-orange-500 text-white hover:opacity-90" : theme === "bento" ? "bg-gradient-to-br from-indigo-600 to-violet-500 text-white hover:opacity-90" : theme === "neon" || theme === "neon-dark" ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white hover:opacity-90" : "bg-[#111827] text-white hover:bg-black")}
        >
          <Plus className="h-[20px] w-[20px]" strokeWidth={2.5} />
        </NavLink>
        <span className={`text-[8px] font-medium mt-1 ${theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" || theme === "activebuddies-dark" ? "text-gray-400" : "text-gray-500"}`}>{t('Δημιουργία', 'Create')}</span>
      </div>
      {([
        { to: "/trust", icon: ShieldCheck, labelGr: 'Εμπιστοσύνη', labelEn: 'Trust' },
        { to: "/profile", icon: User, labelGr: 'Προφίλ', labelEn: 'Profile' },
      ] as const).map(({ to, icon: Icon, labelGr, labelEn }) => (
        <NavLink key={to} to={to}
          className={({ isActive }) =>
            cn("flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]",
              isActive
                ? theme === "activebuddies-dark" ? "text-white font-bold" : theme === "activebuddies" ? "text-[hsl(220_14%_12%)] font-bold" : theme === "bento-dark" || theme === "neon-dark" ? "text-emerald-400" : theme === "vibrant-dark" ? "text-fuchsia-400" : theme === "vibrant" ? "text-fuchsia-600" : theme === "bento" ? "text-indigo-600" : theme === "neon" ? "text-emerald-600" : "text-[#0E8B8D]"
                : theme === "activebuddies-dark" ? "text-gray-400 hover:text-white" : theme === "activebuddies" ? "text-[hsl(220_9%_46%)] hover:text-[hsl(220_14%_12%)]" : theme === "bento-dark" || theme === "neon-dark" ? "text-gray-400 hover:text-emerald-400" : theme === "vibrant-dark" ? "text-gray-400 hover:text-fuchsia-400" : theme === "vibrant" ? "text-gray-400 hover:text-fuchsia-600" : theme === "bento" ? "text-gray-400 hover:text-indigo-600" : theme === "neon" ? "text-gray-400 hover:text-emerald-600" : "text-gray-400 hover:text-[#0E8B8D]")
          }
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
          <span className="text-[8px] font-medium leading-none">{t(labelGr, labelEn)}</span>
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
  const theme = useStore((state) => state.theme);

  return (
    <div className={cn("flex h-screen w-full font-sans antialiased overflow-hidden", theme === 'activebuddies-dark' ? 'theme-ab-dark bg-[hsl(220_16%_8%)] text-[hsl(210_20%_92%)]' : theme === 'activebuddies' ? 'theme-ab bg-[hsl(0_0%_99%)] text-[hsl(220_14%_12%)]' : theme === 'bento-dark' ? 'bg-[#131318] text-white' : theme === 'neon-dark' ? 'bg-[#101e17] text-white' : theme === 'vibrant-dark' ? 'bg-[#1a1020] text-white' : theme === 'vibrant' ? 'bg-[#FDF2F8] text-[#111827]' : theme === 'bento' ? 'bg-[#F5F3FF] text-[#111827]' : theme === 'neon' ? 'bg-[#ECFDF5] text-[#111827]' : 'bg-[#F3F4F6] text-[#111827]')}>
      <SideNav />
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className={cn("relative w-64 max-w-sm h-full shadow-xl flex flex-col z-50", theme === "activebuddies-dark" ? "bg-[hsl(220_16%_8%)] border-r border-[hsl(220_13%_18%)]" : theme === "activebuddies" ? "bg-white border-r border-[hsl(220_13%_92%)]" : theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" ? "bg-gray-900/90 border-r border-gray-700/50" : "bg-white")}>
            <div className="h-14 flex items-center justify-between px-6 border-b border-[#E5E7EB] shrink-0">
              <NakamasLogo className="text-[22px]" />
              <button onClick={() => setIsMobileMenuOpen(false)} aria-label={t('Κλείσιμο μενού', 'Close menu')} className={cn(theme === "bento-dark" || theme === "vibrant-dark" || theme === "neon-dark" || theme === "activebuddies-dark" ? "text-white hover:text-white" : "text-gray-500 hover:text-[#111827]")}>
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-6 px-3" onClick={() => setIsMobileMenuOpen(false)}>
              <NavLinks />
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <TopNav onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto relative flex flex-col">
          <div className="mx-auto w-full max-w-full p-4 lg:px-8 lg:py-6 flex-1 pb-24 md:pb-6">
            {children}
          </div>
        </main>
        <footer className="hidden md:flex h-8 px-6 bg-[#111827] text-[10px] text-gray-400 items-center justify-between shrink-0">
          <div className="flex space-x-4">
            <span>Nakamas v1.0.5-beta</span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
              {t('Σύστημα Λειτουργικό', 'System Operational')}
            </span>
          </div>
          <div className="hidden sm:flex space-x-4">
            <a href="#" className="hover:text-white transition-colors">{t('Πολιτική Απορρήτου', 'Privacy Policy')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('Αναφορά Προβλημάτων', 'Report Issues')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('Πώς λειτουργεί η αξιοπιστία', 'How trust works')}</a>
          </div>
        </footer>
        <BottomNav />
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}


