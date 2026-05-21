import { cn } from '../../lib/utils';

export function NakamasLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
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
