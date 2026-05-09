import React, { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Compass, CalendarCheck, ShieldCheck, Menu, Bell,
  Grid, TrendingUp, Bookmark, History, Flag,
  Users, Settings, HelpCircle, Plus, User, X, MapPin, Calendar, PlusSquare, CreditCard, BadgeCheck, Terminal, Search, Globe, MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { currentUser } from '../../data/mockUsers';
import { unreadNotificationCount } from '../../data/mockNotifications';
import { useLanguage } from '../../lib/i18n';

// ─────────────────────────────────────────────
// NakamasLogo — SVG ψάθινο καπέλο με αχυρωτό στέλεχος
// ─────────────────────────────────────────────
function NakamasLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-baseline font-bold tracking-tight text-[#18D8DB] font-['Poppins']", className)}>
      <div className="relative inline-block">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 120 90"
          className="absolute -top-[0.65em] -left-[0.55em] w-[1.8em] h-[1.8em] origin-center -rotate-[8deg] z-10 pointer-events-none drop-shadow-sm"
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
        className={cn('flex items-center gap-3 text-sm font-medium text-gray-400 rounded-lg cursor-not-allowed', containerClass)}
        title={label}
      >
        <Icon className={iconClass} />
        <span className={textClass}>{label}</span>
        <span className={cn('text-[9px] uppercase tracking-wider font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-400', textClass)}>Soon</span>
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
          isActive
            ? 'bg-cyan-50 text-[#0E8B8D] font-bold'
            : 'text-gray-500 lg:text-gray-600 hover:bg-gray-100 lg:hover:bg-gray-50 hover:text-[#111827]'
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
  return (
    <div className="mb-2 lg:mb-6">
      {compact && <div className="block lg:hidden h-px bg-gray-200 my-4 mx-4" />}
      <h3
        className={cn(
          'px-3 text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-2',
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
  return (
    <>
      <NavSection title="Εξερεύνηση & Ανακάλυψη" compact={compact}>
        <NavItem to="/" icon={Compass} label="Ανακάλυψη Εκδηλώσεων" compact={compact} />
        <NavItem to="/categories" icon={Grid} label="Κατηγορίες" compact={compact} />
        <NavItem to="/nearby" icon={MapPin} label="Τοπικές Ομάδες" compact={compact} />
      </NavSection>

      <NavSection title="Η Εμπειρία μου" compact={compact}>
        <NavItem to="/agenda" icon={Calendar} label="Το Ημερολόγιό μου" compact={compact} />
        <NavItem to="/plans" icon={CalendarCheck} label="Τα Σχέδιά μου" compact={compact} />
        <NavItem to="/saved" icon={Bookmark} label="Αποθηκευμένες" compact={compact} />
        <NavItem to="/history" icon={History} label="Ιστορικό" compact={compact} />
      </NavSection>

      <NavSection title="Κοινότητα" compact={compact}>
        <NavItem to="/connections" icon={Users} label="Οι Nakamas μου" compact={compact} />
        <NavItem to="/chats" icon={MessageSquare} label="Ομαδικές Συνομιλίες" compact={compact} />
      </NavSection>

      <NavSection title="Διοργάνωση" compact={compact}>
        <NavItem to="/manage" icon={TrendingUp} label="Πίνακας Διοργανωτή" compact={compact} />
        <NavItem to="/create" icon={PlusSquare} label="Δημιουργία Εκδήλωσης" compact={compact} />
        <NavItem to="/wallet" icon={CreditCard} label="Πορτοφόλι & Κέρδη" compact={compact} />
      </NavSection>

      <NavSection title="Εμπιστοσύνη & Ασφάλεια" compact={compact}>
        <NavItem to="/verification" icon={BadgeCheck} label="Επαλήθευση Ταυτότητας" compact={compact} />
        <NavItem to="/trust" icon={ShieldCheck} label="Κέντρο Εμπιστοσύνης" compact={compact} />
        <NavItem to="/report" icon={Flag} label="Αναφορά Προβλήματος" compact={compact} />
      </NavSection>

      <NavSection title="Λογαριασμός & Ρυθμίσεις" compact={compact}>
        <NavItem to="/profile" icon={User} label="Το Προφίλ μου" compact={compact} />
        <NavItem to="/notifications" icon={Bell} label="Ειδοποιήσεις" compact={compact} />
        <NavItem to="/settings" icon={Settings} label="Ρυθμίσεις & Απόρρητο" compact={compact} />
        <NavItem to="/help" icon={HelpCircle} label="Κέντρο Βοήθειας" compact={compact} />
        <NavItem to="/admin" icon={Terminal} label="Διαχείριση & Έλεγχος" compact={compact} />
      </NavSection>
    </>
  );
}

// ─────────────────────────────────────────────
// SideNav
// ─────────────────────────────────────────────
export function SideNav() {
  return (
    <aside className="bg-white border-r border-[#E5E7EB] h-full flex-col shrink-0 hidden md:flex w-[88px] lg:w-64 transition-all duration-300 z-30">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-[#E5E7EB] shrink-0">
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
  const { language, setLanguage } = useLanguage();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <nav className="flex items-center justify-between px-4 lg:px-6 py-3 bg-white border-b border-[#E5E7EB] h-16 shrink-0">
      <div className="flex items-center space-x-8">
        <div className="md:hidden">
          <NakamasLogo className="text-[22px]" />
        </div>
        <div className="hidden md:block">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dashboard</span>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="relative hidden lg:block">
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Αναζήτηση εκδηλώσεων..."
            className="w-64 py-1.5 pl-8 pr-3 text-sm bg-gray-100 border-transparent rounded-md focus:bg-white focus:ring-1 focus:ring-cyan-500 outline-none"
          />
          <Search className="absolute w-4 h-4 text-gray-400 left-2.5 top-2" />
        </div>

        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
          className="flex items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-[#0E8B8D] transition-colors bg-gray-100 hover:bg-cyan-50 px-2.5 py-1.5 rounded-lg"
          title={language === 'el' ? 'Switch to English' : 'Αλλαγή σε Ελληνικά'}
        >
          <Globe className="w-3.5 h-3.5" />
          {language === 'el' ? 'EN' : 'EL'}
        </button>

        <NavLink to="/notifications" className="relative text-gray-500 hover:text-[#0E8B8D] transition-colors">
          <Bell className="h-[18px] w-[18px]" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#18D8DB] text-[9px] text-white font-bold border border-white">
              {unreadNotificationCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/profile" className="flex items-center space-x-2">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-[#0E8B8D] uppercase tracking-wider">Αξιόπιστο Μέλος</span>
            <span className="text-[11px] font-bold text-[#111827]">{currentUser.name}</span>
          </div>
          <div className="w-[28px] h-[28px] rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center text-[#0E8B8D] font-bold text-[10px] uppercase">
            {currentUser.name.substring(0, 2)}
          </div>
        </NavLink>

        <button onClick={onMenuClick} className="text-gray-500 hover:text-[#111827] md:hidden">
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
  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 pb-4 pt-3 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <NavLink
        to="/"
        className={({ isActive }) =>
          cn('flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]', isActive ? 'text-[#0E8B8D]' : 'text-gray-400 hover:text-[#0E8B8D]')
        }
      >
        <Compass className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="text-[8px] font-medium leading-none">Ανακάλυψη</span>
      </NavLink>
      <NavLink
        to="/plans"
        className={({ isActive }) =>
          cn('flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]', isActive ? 'text-[#0E8B8D]' : 'text-gray-400 hover:text-[#0E8B8D]')
        }
      >
        <CalendarCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="text-[8px] font-medium leading-none">Σχέδια</span>
      </NavLink>
      <div className="flex flex-col items-center justify-center -mt-6">
        <NavLink
          to="/create"
          className="bg-[#111827] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-black transition-colors border-[3px] border-white"
        >
          <Plus className="h-[20px] w-[20px]" strokeWidth={2.5} />
        </NavLink>
        <span className="text-[8px] font-medium mt-1 text-gray-500">Δημιουργία</span>
      </div>
      <NavLink
        to="/trust"
        className={({ isActive }) =>
          cn('flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]', isActive ? 'text-[#0E8B8D]' : 'text-gray-400 hover:text-[#0E8B8D]')
        }
      >
        <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="text-[8px] font-medium leading-none">Εμπιστοσύνη</span>
      </NavLink>
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          cn('flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]', isActive ? 'text-[#0E8B8D]' : 'text-gray-400 hover:text-[#0E8B8D]')
        }
      >
        <User className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="text-[8px] font-medium leading-none">Προφίλ</span>
      </NavLink>
    </div>
  );
}

// ─────────────────────────────────────────────
// AppShell
// ─────────────────────────────────────────────
export function AppShell({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#F3F4F6] text-[#111827] font-sans antialiased overflow-hidden select-none">
      <SideNav />
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative w-64 max-w-sm bg-white h-full shadow-xl flex flex-col z-50">
            <div className="h-14 flex items-center justify-between px-6 border-b border-[#E5E7EB] shrink-0">
              <NakamasLogo className="text-[22px]" />
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-[#111827]">
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
          <div className="mx-auto w-full max-w-full p-4 lg:px-12 lg:py-8 flex-1 flex flex-col">
            {children}
          </div>
        </main>
        <footer className="hidden md:flex h-8 px-6 bg-[#111827] text-[10px] text-gray-400 items-center justify-between shrink-0">
          <div className="flex space-x-4">
            <span>Nakamas v1.0.5-beta</span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
              Σύστημα Λειτουργικό
            </span>
          </div>
          <div className="hidden sm:flex space-x-4">
            <a href="#" className="hover:text-white transition-colors">Πολιτική Απορρήτου</a>
            <a href="#" className="hover:text-white transition-colors">Αναφορά Προβλημάτων</a>
            <a href="#" className="hover:text-white transition-colors">Πώς λειτουργεί η αξιοπιστία</a>
          </div>
        </footer>
        <BottomNav />
      </div>
    </div>
  );
}
