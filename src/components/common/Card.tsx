import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';

export function Card({ children, className, onClick, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';
  const isAB = theme === 'activebuddies' || theme === 'activebuddies-dark';
  const isABDark = theme === 'activebuddies-dark';

  const hoverAccent = onClick
    ? isABDark ? 'hover:border-gray-500/60'
    : isAB ? 'hover:border-[hsl(220_13%_82%)]'
    : isDark
      ? theme === 'vibrant-dark' ? 'hover:border-fuchsia-700/60' : 'hover:border-emerald-700/60'
      : theme === 'vibrant' ? 'hover:border-fuchsia-200' : theme === 'bento' ? 'hover:border-indigo-200' : theme === 'neon' ? 'hover:border-emerald-200' : 'hover:border-[#a5f3fc]'
    : '';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-2xl border",
        isABDark ? "bg-[hsl(220_16%_11%)] border-[hsl(220_13%_18%)] shadow-sm"
        : isAB ? "bg-white border-[hsl(220_13%_92%)]/60 shadow-sm"
        : isDark ? "bg-gray-800/60 border-gray-700/50 shadow-soft" : "bg-white border-gray-100 shadow-soft",
        onClick && cn("cursor-pointer transition-all duration-200 hover:-translate-y-[0.5px]", isAB || isABDark ? "hover:shadow-[0_4px_12px_-3px_rgba(0,0,0,0.09)]" : "hover:shadow-soft-md", hoverAccent),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
