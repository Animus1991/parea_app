import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
  key?: string | number;
  variant?: 'default' | 'outline' | 'success' | 'warning' | 'neutral' | 'blue';
  className?: string;
  icon?: ReactNode;
  onClick?: (e: any) => void;
}

export function Badge({ children, variant = 'default', className, icon, ...props }: BadgeProps) {
  const theme = useStore((state) => state.theme);
  const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';

  const baseClasses = "inline-flex items-center gap-1.5 rounded tracking-wide px-2 py-0.5 text-[12.5px] font-bold transition-colors";

  const lightVariants = {
    default: "bg-gray-100 text-[#111827]",
    outline: "border border-gray-200 text-gray-800 bg-white",
    success: theme === 'vibrant' ? "bg-fuchsia-50 text-fuchsia-700" : theme === 'neon' ? "bg-emerald-50 text-emerald-700" : theme === 'bento' ? "bg-indigo-50 text-indigo-700" : "bg-cyan-50 text-cyan-700",
    warning: "bg-gray-800 text-white",
    neutral: "bg-gray-100 text-gray-600",
    blue: theme === 'vibrant' ? "bg-fuchsia-50 text-fuchsia-700" : theme === 'bento' ? "bg-indigo-50 text-indigo-700" : "bg-indigo-50 text-indigo-700",
  };

  const darkVariants = {
    default: "bg-gray-700 text-gray-200",
    outline: "border border-gray-600 text-gray-300 bg-transparent",
    success: theme === 'vibrant-dark' ? "bg-fuchsia-900/30 text-fuchsia-300" : "bg-emerald-900/30 text-emerald-300",
    warning: "bg-gray-700 text-white",
    neutral: "bg-gray-700 text-gray-300",
    blue: theme === 'vibrant-dark' ? "bg-fuchsia-900/30 text-fuchsia-300" : "bg-emerald-900/30 text-emerald-300",
  };

  const variants = isDark ? darkVariants : lightVariants;

  return (
    <span className={cn(baseClasses, variants[variant], className)} {...props}>
      {icon && <span className="h-3 w-3">{icon}</span>}
      {children}
    </span>
  );
}
