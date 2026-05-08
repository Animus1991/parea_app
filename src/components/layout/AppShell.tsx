import React, { ReactNode, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Compass, CalendarCheck, ShieldCheck, Menu, Bell, MessageSquare, 
  Grid, Star, TrendingUp, Bookmark, History, Flag, 
  Users, Settings, HelpCircle, Search, Plus, User, X, MapPin, Calendar, PlusSquare, CreditCard, BadgeCheck, Terminal, Globe
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { currentUser } from '../../data/mockUsers';
import { useLanguage } from '../../lib/i18n';

function NakamasLogo({ 
  className,
  responsive = false
}: { 
  className?: string, 
  responsive?: boolean 
}) {
    const { t } = useLanguage();
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
          
          {/* Chin strap front knot & hang */}
          <path d="M 32 62 C 25 58, 20 62, 22 66" fill="none" stroke="#3F2A1B" strokeWidth="2" strokeLinecap="round" />
          <path d="M 22 66 Q 16 75 20 85" fill="none" stroke="#3F2A1B" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Wheat Straw (Άχυρο) */}
          <g className="wheat-straw" transform="translate(62, 79) rotate(-12)">
            {/* Main stem (curved and longer) */}
            <path d="M 0 0 Q 34 12 68 -2" fill="none" stroke="#E4BD70" strokeWidth="1.5" strokeLinecap="round" />
            {/* Grain head main body */}
            <path d="M 46 4.8 Q 57 2 66 -1.2" fill="none" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
            {/* Upper Awns */}
            <path d="M 48 4.3 L 56 -1.5 M 52 3.3 L 60 -2.5 M 56 2.3 L 64 -3.5 M 60 1.3 L 68 -4.5 M 64 0.3 L 72 -5.5" fill="none" stroke="#E4BD70" strokeWidth="1" strokeLinecap="round" />
            {/* Lower Awns */}
            <path d="M 48 4.3 L 56 10 M 52 3.3 L 60 9 M 56 2.3 L 64 8 M 60 1.3 L 68 7 M 64 0.3 L 72 6" fill="none" stroke="#E4BD70" strokeWidth="1" strokeLinecap="round" />
          </g>
        </svg>
        <span className="relative z-0 leading-none">N</span>
      </div>
      <span className={cn("leading-none", responsive ? "hidden lg:inline" : "")}>akamas</span>
    </div>
  );
}

function NavSection({ title, children, isDesktopSidebar }: { title: string, children: ReactNode, isDesktopSidebar?: boolean }) {
    
  const titleClass = isDesktopSidebar ? "hidden lg:block px-3 text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2" : "px-3 text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-2";
  const dividerClass = isDesktopSidebar ? "block lg:hidden h-px bg-gray-200 my-4 mx-4" : "hidden";
  
  return (
    <div className="mb-2 lg:mb-6">
      <div className={dividerClass}></div>
      <h3 className={titleClass}>{title}</h3>
      <div className="space-y-1.5 lg:space-y-0.5">
        {children}
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, disabled = false, isDesktopSidebar }: { to: string, icon: any, label: string, disabled?: boolean, isDesktopSidebar?: boolean }) {
    
  const textClass = isDesktopSidebar ? "hidden lg:block" : "block";
  const iconClass = isDesktopSidebar ? "h-[22px] w-[22px] lg:h-4 lg:w-4 shrink-0" : "h-4 w-4 shrink-0";
  const containerClass = isDesktopSidebar ? "justify-center lg:justify-start px-0 py-2.5 lg:px-3 lg:py-2" : "justify-start px-3 py-2";

  if (disabled) {
    return (
      <div className={cn("flex items-center justify-between text-sm font-medium text-gray-400 rounded-lg cursor-not-allowed group", containerClass)} title={label}>
        <div className={cn("flex items-center gap-3 w-full", isDesktopSidebar ? "justify-center lg:justify-start" : "justify-start")}>
          <Icon className={iconClass} />
          <span className={textClass}>{label}</span>
        </div>
        <span className={cn("text-[9px] uppercase tracking-wider font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-400", textClass)}>
</span>
</div>
  );
}

}