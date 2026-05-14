import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const theme = useStore((state) => state.theme);
    const isDark = theme === 'bento-dark' || theme === 'vibrant-dark' || theme === 'neon-dark';

    const baseClass = "inline-flex items-center justify-center rounded font-bold transition-colors shadow-sm disabled:pointer-events-none disabled:opacity-50";

    const getVariants = (): Record<string, string> => {
      if (isDark) {
        const accent = theme === 'vibrant-dark'
          ? { primary: "bg-fuchsia-600 text-white hover:bg-fuchsia-700", outline: "border border-fuchsia-500/40 text-fuchsia-400 bg-transparent hover:bg-fuchsia-900/20" }
          : { primary: "bg-emerald-600 text-white hover:bg-emerald-700", outline: "border border-emerald-500/40 text-emerald-400 bg-transparent hover:bg-emerald-900/20" };
        return {
          primary: accent.primary,
          secondary: "bg-gray-700 text-white hover:bg-gray-600",
          outline: accent.outline,
          ghost: "bg-transparent text-gray-300 hover:bg-gray-700 shadow-none",
          danger: "bg-red-900/30 text-red-400 hover:bg-red-900/50 shadow-none"
        };
      }
      const accent = theme === 'vibrant'
        ? { primary: "bg-fuchsia-600 text-white hover:bg-fuchsia-700", outline: "border border-fuchsia-600 text-fuchsia-600 bg-transparent hover:bg-fuchsia-50" }
        : theme === 'bento'
        ? { primary: "bg-indigo-600 text-white hover:bg-indigo-700", outline: "border border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50" }
        : theme === 'neon'
        ? { primary: "bg-emerald-600 text-white hover:bg-emerald-700", outline: "border border-emerald-600 text-emerald-600 bg-transparent hover:bg-emerald-50" }
        : { primary: "bg-cyan-600 text-white hover:bg-cyan-700", outline: "border border-cyan-600 text-cyan-600 bg-transparent hover:bg-cyan-50" };
      return {
        primary: accent.primary,
        secondary: "bg-[#111827] text-white hover:bg-gray-900",
        outline: accent.outline,
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100 shadow-none",
        danger: "bg-red-50 text-red-700 hover:bg-red-100 shadow-none"
      };
    };

    const variants = getVariants();

    const sizes = {
      sm: "h-7 px-3 text-[12.5px]",
      md: "h-8 px-3.5 py-1 text-[13.8px]",
      lg: "h-[38px] px-4 text-[16.2px]"
    };

    return (
      <button
        ref={ref}
        className={cn(baseClass, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
