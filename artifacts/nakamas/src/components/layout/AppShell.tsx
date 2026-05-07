import React, { ReactNode, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Compass, CalendarCheck, ShieldCheck, Menu, Bell, MessageSquare, 
  Grid, TrendingUp, Bookmark, History, Flag, 
  Users, Settings, HelpCircle, Plus, User, X, MapPin, Calendar, PlusSquare, CreditCard, BadgeCheck, Terminal, Search
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { currentUser } from '../../data/mockUsers';
import { unreadNotificationCount } from '../../data/mockNotifications';

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
        <span className={cn('text-[9px] uppercase tracking-wider font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-400', textClass)}>
          Soon
        </span>
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
            ? 'bg-indigo-50 text-indigo-700 font-bold'
            : 'text-gray-500 lg:text-gray-600 hover:bg-gray-100 lg:hover:bg-gray-50 hover:text-[#111827]'
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

function NavLinks({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <NavSection title="Explore & Discover" compact={compact}>
        <NavItem to="/" icon={Compass} label="Discover Events" compact={compact} />
        <NavItem to="/categories" icon={Grid} label="Categories" compact={compact} />
        <NavItem to="/nearby" icon={MapPin} label="Local Groups" compact={compact} />
      </NavSection>

      <NavSection title="My Experience" compact={compact}>
        <NavItem to="/agenda" icon={Calendar} label="My Calendar" compact={compact} />
        <NavItem to="/plans" icon={CalendarCheck} label="My Plans" compact={compact} />
        <NavItem to="/saved" icon={Bookmark} label="Saved Events" compact={compact} />
        <NavItem to="/history" icon={History} label="Past Memories" compact={compact} />
      </NavSection>

      <NavSection title="Community" compact={compact}>
        <NavItem to="/connections" icon={Users} label="My Nakamas" compact={compact} />
        <NavItem to="/chats" icon={MessageSquare} label="Group Chats" compact={compact} />
      </NavSection>

      <NavSection title="Host & Organize" compact={compact}>
        <NavItem to="/manage" icon={TrendingUp} label="Host Dashboard" compact={compact} />
        <NavItem to="/create" icon={PlusSquare} label="Create Experience" compact={compact} />
        <NavItem to="/wallet" icon={CreditCard} label="Wallet & Earnings" compact={compact} />
      </NavSection>

      <NavSection title="Trust & Safety" compact={compact}>
        <NavItem to="/verification" icon={BadgeCheck} label="Identity Verification" compact={compact} />
        <NavItem to="/trust" icon={ShieldCheck} label="Trust Center" compact={compact} />
        <NavItem to="/report" icon={Flag} label="Report an Issue" compact={compact} />
      </NavSection>

      <NavSection title="Account & Settings" compact={compact}>
        <NavItem to="/profile" icon={User} label="My Profile" compact={compact} />
        <NavItem to="/notifications" icon={Bell} label="Notifications" compact={compact} />
        <NavItem to="/settings" icon={Settings} label="Settings & Privacy" compact={compact} />
        <NavItem to="/help" icon={HelpCircle} label="Help Center" compact={compact} />
        <NavItem to="/admin" icon={Terminal} label="Admin & Mod" compact={compact} />
      </NavSection>
    </>
  );
}

export function SideNav() {
  return (
    <aside className="bg-white border-r border-[#E5E7EB] h-full flex-col shrink-0 hidden md:flex w-[88px] lg:w-64 transition-all duration-300 z-30">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center text-[39px] lg:text-[31px] font-bold tracking-tight text-[#18D8DB] font-['Poppins']">
          <span className="lg:hidden">N</span>
          <span className="hidden lg:block">Nakamas</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4 lg:py-6 px-2 lg:px-3">
        <NavLinks compact />
      </div>
    </aside>
  );
}

export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      navigate(`/?search=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#E5E7EB] h-16 shrink-0">
      <div className="flex items-center space-x-8">
        <div className="flex items-center text-[25px] font-bold tracking-tight text-[#18D8DB] md:hidden font-['Poppins']">
          Nakamas
        </div>
        <div className="hidden md:block">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dashboard</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative hidden lg:block">
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search events, interests..."
            className="w-64 py-1.5 pl-8 pr-3 text-sm bg-gray-100 border-transparent rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none"
          />
          <Search className="absolute w-4 h-4 text-gray-400 left-2.5 top-2" />
        </div>

        <NavLink to="/notifications" className="relative text-gray-500 hover:text-indigo-600 transition-colors">
          <Bell className="h-[18px] w-[18px]" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-[9px] text-white font-bold border border-white">
              {unreadNotificationCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/profile" className="flex items-center space-x-2">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Reliable Member</span>
            <span className="text-[11px] font-bold text-[#111827]">{currentUser.name}</span>
          </div>
          <div className="w-[28px] h-[28px] rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-[10px] uppercase">
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

export function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 pb-4 pt-3 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
      <NavLink
        to="/"
        className={({ isActive }) =>
          cn('flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]', isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600')
        }
      >
        <Compass className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="text-[8px] font-medium leading-none">Discover</span>
      </NavLink>
      <NavLink
        to="/plans"
        className={({ isActive }) =>
          cn('flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]', isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600')
        }
      >
        <CalendarCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="text-[8px] font-medium leading-none">Plans</span>
      </NavLink>
      <div className="flex flex-col items-center justify-center -mt-6">
        {/* FAB correctly points to Create Experience, not Host Dashboard */}
        <NavLink
          to="/create"
          className="bg-[#111827] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-black transition-colors border-[3px] border-white"
        >
          <Plus className="h-[20px] w-[20px]" strokeWidth={2.5} />
        </NavLink>
        <span className="text-[8px] font-medium mt-1 text-gray-500">Create</span>
      </div>
      <NavLink
        to="/trust"
        className={({ isActive }) =>
          cn('flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]', isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600')
        }
      >
        <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="text-[8px] font-medium leading-none">Trust</span>
      </NavLink>
      <NavLink
        to="/profile"
        className={({ isActive }) =>
          cn('flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]', isActive ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-600')
        }
      >
        <User className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="text-[8px] font-medium leading-none">Profile</span>
      </NavLink>
    </div>
  );
}

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
              <div className="text-[25px] font-bold tracking-tight text-[#18D8DB] font-['Poppins']">
                Nakamas
              </div>
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
            <span>Parea v1.0.5-beta</span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2" />
              System Healthy
            </span>
          </div>
          {/* Fixed: was "flex space-x-4 hidden sm:flex" — conflicting classes */}
          <div className="hidden sm:flex space-x-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Reporting Safety Issues</a>
            <a href="#" className="hover:text-white transition-colors">How Trust Works</a>
          </div>
        </footer>
        <BottomNav />
      </div>
    </div>
  );
}
