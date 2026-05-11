import React, { ReactNode, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Compass, CalendarCheck, ShieldCheck, Bell, MessageSquare, Menu, X, Search,
  Grid, Bookmark, History, Flag, Trophy,
  Users, Settings, HelpCircle, Plus, User, MapPin, Calendar, CreditCard, Globe,
  LayoutDashboard, BadgeCheck, PlusSquare, TrendingUp
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { currentUser } from '../../data/mockUsers';
import { unreadNotificationCount } from '../../data/mockNotifications';
import { useLanguage } from '../../lib/i18n';
import type { LucideIcon } from 'lucide-react';

function NakamasLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-baseline font-bold tracking-tight text-[#18D8DB] font-['Poppins']", className)}>
      <div className="relative inline-block">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 90"
          className="absolute -top-[0.65em] -left-[0.55em] w-[1.8em] h-[1.8em] origin-center -rotate-[8deg] z-10 pointer-events-none drop-shadow-sm"
        >
          <path d="M 35 60 C 20 65, 15 75, 25 80" fill="none" stroke="#3F2A1B" strokeWidth="2" strokeLinecap="round" />
          <ellipse cx="60" cy="62" rx="55" ry="14" fill="#E4BD70" stroke="#3F2A1B" strokeWidth="3" />
          <path d="M 15 62 Q 60 76 105 62 M 25 67 Q 60 80 95 67" fill="none" stroke="#C49B50" strokeWidth="1.5" />
          <path d="M 32 60 C 32 20, 42 16, 60 16 C 78 16, 88 20, 88 60 Z" fill="#E4BD70" stroke="#3F2A1B" strokeWidth="3" strokeLinejoin="round" />
          <path d="M 45 25 L 45 48 M 60 20 L 60 52 M 75 25 L 75 48" fill="none" stroke="#C49B50" strokeWidth="2" strokeLinecap="round" />
          <path d="M 38 32 C 50 35, 70 35, 82 32 M 36 42 Q 60 48 84 42" fill="none" stroke="#C49B50" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 31.5 54 C 50 63, 70 63, 88.5 54 L 88.5 60 C 70 70, 50 70, 31.5 60 Z" fill="#D84539" stroke="#3F2A1B" strokeWidth="3" strokeLinejoin="round" />
          <path d="M 32 62 C 25 58, 20 62, 22 66" fill="none" stroke="#3F2A1B" strokeWidth="2" strokeLinecap="round" />
          <path d="M 22 66 Q 16 75 20 85" fill="none" stroke="#3F2A1B" strokeWidth="2.5" strokeLinecap="round" />
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

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  compact?: boolean;
}

function NavItem({ to, icon: Icon, label, disabled = false, compact = false }: NavItemProps) {
  const containerClass = compact
    ? 'justify-center px-0 py-2.5 lg:justify-start lg:px-3 lg:py-1.5'
    : 'justify-start px-3 py-1.5';
  const iconClass = compact
    ? 'h-[18px] w-[18px] lg:h-3.5 lg:w-3.5 shrink-0'
    : 'h-3.5 w-3.5 shrink-0';
  const textClass = compact ? 'hidden lg:block' : 'block';

  if (disabled) {
    return (
      <div className={cn('flex items-center gap-2.5 text-[14.2457535px] font-medium text-gray-400 rounded-lg cursor-not-allowed', containerClass)} title={label}>
        <Icon className={iconClass} />
        <span className={textClass}>{label}</span>
        <span className={cn('text-[12.1125px] uppercase tracking-wider font-bold bg-gray-100 px-1 py-0.5 rounded text-gray-400', textClass)}>Soon</span>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      title={label}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-2.5 rounded-lg text-[14.2457535px] font-medium transition-colors',
          containerClass,
          isActive
            ? 'bg-cyan-50 text-[#0E8B8D] font-bold'
            : 'text-gray-500 hover:bg-gray-50 hover:text-[#111827]'
        )
      }
    >
      <Icon className={iconClass} />
      <span className={textClass}>{label}</span>
    </NavLink>
  );
}

interface NavSectionProps {
  title: string;
  children: ReactNode;
  compact?: boolean;
}

function NavSection({ title, children, compact = false }: NavSectionProps) {
  return (
    <div className="mb-3">
      {compact && <div className="block lg:hidden h-px bg-gray-200 my-3 mx-3" />}
      <h3 className={cn('px-3 text-[11.2px] font-bold uppercase tracking-widest text-gray-400 mb-1.5', compact ? 'hidden lg:block' : 'block')}>
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavLinks({ compact = false, t }: { compact?: boolean; t: (greek: string, english: string) => string }) {
  return (
    <>
      <NavSection title={t(`Εξερεύνηση & Ανακάλυψη`, `Explore & Discover`)} compact={compact}>
        <NavItem to="/" icon={Compass} label={t(`Ανακάλυψη Εκδηλώσεων`, `Discover Events`)} compact={compact} />
        <NavItem to="/categories" icon={Grid} label={t(`Κατηγορίες`, `Categories`)} compact={compact} />
        <NavItem to="/nearby" icon={MapPin} label={t(`Τοπικές Ομάδες`, `Nearby Groups`)} compact={compact} />
      </NavSection>

      <NavSection title={t(`Η Εμπειρία μου`, `My Experience`)} compact={compact}>
        <NavItem to="/agenda" icon={Calendar} label={t(`Το Ημερολόγιό μου`, `My Calendar`)} compact={compact} />
        <NavItem to="/plans" icon={CalendarCheck} label={t(`Τα Σχέδιά μου`, `My Plans`)} compact={compact} />
        <NavItem to="/saved" icon={Bookmark} label={t(`Αποθηκευμένες`, `Saved`)} compact={compact} />
        <NavItem to="/history" icon={History} label={t(`Ιστορικό`, `History`)} compact={compact} />
      </NavSection>

      <NavSection title={t(`Κοινότητα`, `Community`)} compact={compact}>
        <NavItem to="/connections" icon={Users} label={t(`Οι Nakamas μου`, `My Nakamas`)} compact={compact} />
        <NavItem to="/chats" icon={MessageSquare} label={t(`Ομαδικές Συνομιλίες`, `Group Chats`)} compact={compact} />
      </NavSection>

      <NavSection title={t(`Διοργάνωση`, `Organize`)} compact={compact}>
        <NavItem to="/manage" icon={TrendingUp} label={t(`Πίνακας Διοργανωτή`, `Organizer Panel`)} compact={compact} />
        <NavItem to="/create" icon={PlusSquare} label={t(`Δημιουργία Εκδήλωσης`, `Create Event`)} compact={compact} />
        <NavItem to="/wallet" icon={CreditCard} label={t(`Πορτοφόλι & Κέρδη`, `Wallet & Earnings`)} compact={compact} />
      </NavSection>

      <NavSection title={t(`Εμπιστοσύνη & Ασφάλεια`, `Trust & Safety`)} compact={compact}>
        <NavItem to="/verification" icon={BadgeCheck} label={t(`Επαλήθευση Ταυτότητας`, `Identity Verification`)} compact={compact} />
        <NavItem to="/trust" icon={ShieldCheck} label={t(`Κέντρο Εμπιστοσύνης`, `Trust Center`)} compact={compact} />
        <NavItem to="/report" icon={Flag} label={t(`Αναφορά Προβλήματος`, `Report Issue`)} compact={compact} />
      </NavSection>

      <NavSection title={t(`Λογαριασμός & Ρυθμίσεις`, `Account & Settings`)} compact={compact}>
        <NavItem to="/profile" icon={User} label={t(`Το Προφίλ μου`, `My Profile`)} compact={compact} />
        <NavItem to="/achievements" icon={Trophy} label={t(`Επιτεύγματα`, `Achievements`)} compact={compact} />
        <NavItem to="/notifications" icon={Bell} label={t(`Ειδοποιήσεις`, `Notifications`)} compact={compact} />
        <NavItem to="/settings" icon={Settings} label={t(`Ρυθμίσεις & Απόρρητο`, `Settings & Privacy`)} compact={compact} />
        <NavItem to="/help" icon={HelpCircle} label={t(`Κέντρο Βοήθειας`, `Help Center`)} compact={compact} />
      </NavSection>
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] text-[#111827] font-sans antialiased overflow-hidden">
      {/* Desktop Sidebar — collapsible: icon-only on md, full on lg */}
      <aside className="bg-white border-r border-gray-200 h-full flex-col shrink-0 hidden md:flex w-[72px] lg:w-60 transition-all duration-300 z-30">
        <div className="h-14 flex items-center justify-center lg:justify-start lg:px-5 border-b border-gray-100 shrink-0">
          <NakamasLogo className="text-[25px] lg:text-[27.5px]" compact />
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-1.5 lg:px-2.5">
          <NavLinks compact t={t} />
        </div>
        <div className="p-2 border-t border-gray-100 hidden lg:block">
          <button
            onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
            className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] font-bold text-gray-500 hover:text-[#0E8B8D] w-full rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            {language === 'el' ? 'English' : 'Ελληνικά'}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-[80vw] bg-white h-full shadow-xl flex flex-col z-50">
            <div className="h-14 flex items-center justify-between px-5 border-b border-gray-100 shrink-0">
              <NakamasLogo className="text-[25px]" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-[#111827]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4 px-2" onClick={() => setIsMobileMenuOpen(false)}>
              <NavLinks t={t} />
            </div>
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
                className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] font-bold text-gray-500 hover:text-[#0E8B8D] w-full rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                {language === 'el' ? 'English' : 'Ελληνικά'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Right side: TopNav + Main + Footer + BottomNav */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* TopNav */}
        <nav className="flex items-center justify-between px-4 lg:px-6 py-2.5 bg-white border-b border-gray-200 h-14 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <NakamasLogo className="text-[25px]" />
            </div>
            <div className="hidden md:block">
              <span className="text-[11.2px] font-bold text-gray-400 uppercase tracking-widest">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Search (desktop) */}
            <div className="relative hidden lg:block">
              <input
                type="text"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={t(`Αναζήτηση εκδηλώσεων...`, `Search events...`)}
                className="w-52 py-1.5 pl-7 pr-3 text-[13.8px] bg-gray-100 border-transparent rounded-lg focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none font-medium"
              />
              <Search className="absolute w-3.5 h-3.5 text-gray-400 left-2 top-2" />
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
              className="flex items-center gap-1 text-[12.5px] font-bold text-gray-500 hover:text-[#0E8B8D] transition-colors bg-gray-100 hover:bg-cyan-50 px-2 py-1.5 rounded-lg"
            >
              <Globe className="w-3 h-3" />
              {language === 'el' ? 'EN' : 'EL'}
            </button>

            {/* Notifications */}
            <NavLink to="/notifications" className="relative text-gray-500 hover:text-[#0E8B8D] transition-colors p-1.5">
              <Bell className="h-[16px] w-[16px]" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#18D8DB] text-[10px] text-white font-bold border border-white">
                  {unreadNotificationCount}
                </span>
              )}
            </NavLink>

            {/* User avatar */}
            <NavLink to="/profile" className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-[11.2px] font-bold text-[#0E8B8D] uppercase tracking-wider">{t(`Αξιόπιστο Μέλος`, `Trusted Member`)}</span>
                <span className="text-[12.5px] font-bold text-[#111827]">{currentUser.name}</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center text-[#0E8B8D] font-bold text-[11.2px] uppercase">
                {currentUser.name.substring(0, 2)}
              </div>
            </NavLink>

            {/* Mobile menu button */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-500 hover:text-[#111827] md:hidden p-1">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>

        {/* Main Content — full width, no max-w constraint */}
        <main className="flex-1 overflow-y-auto relative flex flex-col">
          <div className="mx-auto w-full max-w-full p-4 lg:px-8 lg:py-6 flex-1 pb-24 md:pb-6">
            {children}
          </div>
        </main>

        {/* Footer (desktop only) */}
        <footer className="hidden md:flex h-7 px-6 bg-[#111827] text-[11.2px] text-gray-400 items-center justify-between shrink-0">
          <div className="flex space-x-4">
            <span>Nakamas v1.0.5-beta</span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
              {t(`Σύστημα Λειτουργικό`, `System Operational`)}
            </span>
          </div>
          <div className="hidden sm:flex space-x-4">
            <a href="#" className="hover:text-white transition-colors">{t(`Πολιτική Απορρήτου`, `Privacy Policy`)}</a>
            <a href="#" className="hover:text-white transition-colors">{t(`Αναφορά Προβλημάτων`, `Report Issues`)}</a>
          </div>
        </footer>

        {/* Mobile Bottom Nav with FAB */}
        <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 pb-[env(safe-area-inset-bottom)] pt-2 flex items-center justify-around shadow-[0_-2px_12px_rgba(0,0,0,0.04)] z-50">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn('flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[52px]', isActive ? 'text-[#0E8B8D]' : 'text-gray-400')
            }
          >
            <Compass className="h-[17px] w-[17px]" strokeWidth={2.2} />
            <span className="text-[10px] font-medium leading-none">{t(`Ανακάλυψη`, `Discover`)}</span>
          </NavLink>
          <NavLink
            to="/plans"
            className={({ isActive }) =>
              cn('flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[52px]', isActive ? 'text-[#0E8B8D]' : 'text-gray-400')
            }
          >
            <CalendarCheck className="h-[17px] w-[17px]" strokeWidth={2.2} />
            <span className="text-[10px] font-medium leading-none">{t(`Σχέδια`, `Plans`)}</span>
          </NavLink>
          {/* FAB — Create */}
          <div className="flex flex-col items-center justify-center -mt-5">
            <NavLink
              to="/create"
              className="bg-[#111827] text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg hover:bg-black transition-colors border-[3px] border-white"
            >
              <Plus className="h-[18px] w-[18px]" strokeWidth={2.5} />
            </NavLink>
            <span className="text-[8.8px] font-medium mt-0.5 text-gray-500">{t(`Δημιουργία`, `Create`)}</span>
          </div>
          <NavLink
            to="/trust"
            className={({ isActive }) =>
              cn('flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[52px]', isActive ? 'text-[#0E8B8D]' : 'text-gray-400')
            }
          >
            <ShieldCheck className="h-[17px] w-[17px]" strokeWidth={2.2} />
            <span className="text-[10px] font-medium leading-none">{t(`Εμπιστοσύνη`, `Trust`)}</span>
          </NavLink>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn('flex flex-col items-center justify-center gap-0.5 transition-colors min-w-[52px]', isActive ? 'text-[#0E8B8D]' : 'text-gray-400')
            }
          >
            <User className="h-[17px] w-[17px]" strokeWidth={2.2} />
            <span className="text-[10px] font-medium leading-none">{t(`Προφίλ`, `Profile`)}</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}
