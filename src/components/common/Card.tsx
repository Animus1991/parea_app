import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';

export function Card({ children, className, onClick, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';

  const hoverAccent = onClick
    ? isDark
      ? theme === 'vibrant-dark' ? 'hover:border-fuchsia-700' : 'hover:border-emerald-700'
      : theme === 'vibrant' ? 'hover:border-fuchsia-300' : theme === 'bento' ? 'hover:border-indigo-300' : theme === 'neon' ? 'hover:border-emerald-300' : 'hover:border-cyan-300'
    : '';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "rounded-xl border shadow-sm",
        isDark ? "bg-gray-800/80 border-gray-700" : "bg-white border-gray-200",
        onClick && cn("cursor-pointer transition-colors", hoverAccent),
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
