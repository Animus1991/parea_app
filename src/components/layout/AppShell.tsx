import { ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Compass, CalendarCheck, ShieldCheck, Menu, Bell, MessageSquare, 
  Grid, Star, TrendingUp, Bookmark, History, Flag, 
  Users, Settings, HelpCircle, Search, Plus, User, X, MapPin, Calendar, PlusSquare, CreditCard, BadgeCheck, Terminal
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { currentUser } from '../../data/mockUsers';

function NavSection({ title, children }: { title: string, children: ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#6B7280] mb-2">{title}</h3>
      <div className="space-y-0.5">
        {children}
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, disabled = false }: { to: string, icon: any, label: string, disabled?: boolean }) {
  if (disabled) {
    return (
      <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-400 rounded-lg cursor-not-allowed">
        <div className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </div>
        <span className="text-[9px] uppercase tracking-wider font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">Soon</span>
      </div>
    );
  }
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-indigo-50 text-indigo-700 font-bold"
            : "text-gray-600 hover:bg-gray-50 hover:text-[#111827]"
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </NavLink>
  );
}

function NavLinks() {
  return (
    <>
      <NavSection title="Explore & Discover">
        <NavItem to="/" icon={Compass} label="Discover Events" />
        <NavItem to="/categories" icon={Grid} label="Categories" />
        <NavItem to="/nearby" icon={MapPin} label="Local Groups" />
      </NavSection>

      <NavSection title="My Experience">
        <NavItem to="/agenda" icon={Calendar} label="My Calendar" />
        <NavItem to="/plans" icon={CalendarCheck} label="My Plans" />
        <NavItem to="/saved" icon={Bookmark} label="Saved Events" />
        <NavItem to="/history" icon={History} label="Past Memories" />
      </NavSection>

      <NavSection title="Community">
        <NavItem to="/connections" icon={Users} label="My Nakamas" />
        <NavItem to="/chats" icon={MessageSquare} label="Group Chats" />
      </NavSection>

      <NavSection title="Host & Organize">
        <NavItem to="/manage" icon={TrendingUp} label="Host Dashboard" />
        <NavItem to="/create" icon={PlusSquare} label="Create Experience" />
        <NavItem to="/wallet" icon={CreditCard} label="Wallet & Earnings" />
      </NavSection>

      <NavSection title="Trust & Safety">
        <NavItem to="/verification" icon={BadgeCheck} label="Identity Verification" />
        <NavItem to="/trust" icon={ShieldCheck} label="Trust Center" />
        <NavItem to="/report" icon={Flag} label="Report an Issue" />
      </NavSection>

      <NavSection title="Account & Settings">
        <NavItem to="/profile" icon={User} label="My Profile" />
        <NavItem to="/notifications" icon={Bell} label="Notifications" />
        <NavItem to="/settings" icon={Settings} label="Settings & Privacy" />
        <NavItem to="/help" icon={HelpCircle} label="Help Center" />
        <NavItem to="/admin" icon={Terminal} label="Admin & Mod" />
      </NavSection>
    </>
  );
}

export function SideNav() {
  return (
    <aside className="w-64 bg-white border-r border-[#E5E7EB] h-full flex-col shrink-0 hidden md:flex">
      <div className="h-14 flex items-center px-6 border-b border-[#E5E7EB] shrink-0">
        <div className="text-base font-bold tracking-tight text-[#111827]">
          Nakamas<span className="text-indigo-600">.</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3 noscrollbar">
        <NavLinks />
      </div>
    </aside>
  );
}

export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <nav className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#E5E7EB] h-14 shrink-0">
      <div className="flex items-center space-x-8">
        <div className="text-base font-bold tracking-tight text-[#111827] md:hidden">
          Nakamas<span className="text-indigo-600">.</span>
        </div>
        <div className="hidden md:block">
           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dashboard</span>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative hidden lg:block">
          <input type="text" placeholder="Search events, interests..." className="w-64 py-1.5 pl-8 pr-3 text-sm bg-gray-100 border-transparent rounded-md focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none" />
          <svg className="absolute w-4 h-4 text-gray-400 left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        
        <NavLink to="/notifications" className="relative text-gray-500 hover:text-indigo-600 transition-colors">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-indigo-600 text-[9px] text-white font-bold border border-white">2</span>
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
      <NavLink to="/" className={({isActive}) => cn("flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]", isActive ? "text-indigo-600" : "text-gray-400 hover:text-indigo-600")}>
        <Compass className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="text-[8px] font-medium leading-none">Discover</span>
      </NavLink>
      <NavLink to="/plans" className={({isActive}) => cn("flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]", isActive ? "text-indigo-600" : "text-gray-400 hover:text-indigo-600")}>
        <CalendarCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="text-[8px] font-medium leading-none">Plans</span>
      </NavLink>
      <div className="flex flex-col items-center justify-center -mt-6">
        <NavLink to="/manage" className="bg-[#111827] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:bg-black transition-colors border-[3px] border-white">
          <Plus className="h-[20px] w-[20px]" strokeWidth={2.5} />
        </NavLink>
        <span className="text-[8px] font-medium mt-1 text-gray-500">Create</span>
      </div>
      <NavLink to="/trust" className={({isActive}) => cn("flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]", isActive ? "text-indigo-600" : "text-gray-400 hover:text-indigo-600")}>
        <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="text-[8px] font-medium leading-none">Trust</span>
      </NavLink>
      <NavLink to="/profile" className={({isActive}) => cn("flex flex-col items-center justify-center gap-1 transition-colors min-w-[60px]", isActive ? "text-indigo-600" : "text-gray-400 hover:text-indigo-600")}>
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
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative w-64 max-w-sm bg-white h-full shadow-xl flex flex-col z-50">
            <div className="h-14 flex items-center justify-between px-6 border-b border-[#E5E7EB] shrink-0">
              <div className="text-base font-bold tracking-tight text-[#111827]">
                Parea<span className="text-indigo-600">.</span>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 hover:text-[#111827]">
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-6 px-3 noscrollbar" onClick={() => setIsMobileMenuOpen(false)}>
               <NavLinks />
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        <TopNav onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl p-6 lg:p-8">
            {children}
          </div>
        </main>
        <footer className="hidden md:flex h-8 px-6 bg-[#111827] text-[10px] text-gray-400 items-center justify-between shrink-0">
          <div className="flex space-x-4">
            <span>Parea v1.0.5-beta</span>
            <span className="flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span> System Healthy</span>
          </div>
          <div className="flex space-x-4 hidden sm:flex">
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
