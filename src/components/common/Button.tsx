import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { isDarkTheme, isActiveBuddiesTheme } from '../../lib/themes';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const theme = useStore((state) => state.theme);
    const isDark = isDarkTheme(theme);
    const isABDark = theme === 'activebuddies-dark';
    const isABLight = isActiveBuddiesTheme(theme) && !isDark;

    const baseClass = "inline-flex items-center justify-center font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50";

    const focusRing = isDark || isABDark
      ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
      : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#18D8DB]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

    const getVariants = (): Record<string, string> => {
      if (isABDark) return {
        primary: "bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] hover:bg-white rounded-full shadow-soft hover:shadow-soft-md hover:-translate-y-[0.5px]",
        secondary: "bg-[hsl(220_16%_16%)] text-[hsl(210_20%_92%)] hover:bg-[hsl(220_16%_20%)] rounded-xl shadow-soft",
        outline: "border-2 border-[hsl(220_13%_18%)] text-[hsl(210_20%_92%)] bg-transparent hover:bg-[hsl(220_16%_14%)] rounded-full",
        ghost: "bg-transparent text-[hsl(220_12%_55%)] hover:bg-[hsl(220_16%_14%)] rounded-xl",
        danger: "bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded-xl",
        gradient: "btn-gradient"
      };
      if (isABLight) return {
        primary: "bg-[hsl(220_14%_12%)] text-white hover:bg-black rounded-full shadow-soft hover:shadow-soft-md hover:-translate-y-[0.5px]",
        secondary: "bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)] hover:bg-[hsl(220_13%_92%)] rounded-xl shadow-soft",
        outline: "border-2 border-[hsl(220_13%_92%)] text-[hsl(220_14%_12%)] bg-transparent hover:bg-[hsl(220_14%_96%)] rounded-full",
        ghost: "bg-transparent text-[hsl(220_11%_34%)] hover:bg-[hsl(220_14%_96%)] rounded-xl",
        danger: "bg-red-50 text-red-700 hover:bg-red-100 rounded-xl",
        gradient: "btn-gradient"
      };
      if (isDark) {
        const accent = theme === 'vibrant-dark'
          ? { primary: "bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-soft", outline: "border-2 border-fuchsia-500/40 text-fuchsia-400 bg-transparent hover:bg-fuchsia-900/20 rounded-full" }
          : { primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-soft", outline: "border-2 border-emerald-500/40 text-emerald-400 bg-transparent hover:bg-emerald-900/20 rounded-full" };
        return {
          primary: `${accent.primary} rounded-xl`,
          secondary: "bg-gray-700/50 text-white hover:bg-gray-600/60 rounded-xl shadow-soft",
          outline: accent.outline,
          ghost: "bg-transparent text-gray-300 hover:bg-gray-700/40 rounded-xl",
          danger: "bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded-xl",
          gradient: "btn-gradient"
        };
      }
      const accent = theme === 'vibrant'
        ? { primary: "bg-fuchsia-600 text-white hover:bg-fuchsia-700", outline: "border-2 border-fuchsia-600 text-fuchsia-600 bg-transparent hover:bg-fuchsia-50" }
        : theme === 'bento'
        ? { primary: "bg-indigo-600 text-white hover:bg-indigo-700", outline: "border-2 border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50" }
        : theme === 'neon'
        ? { primary: "bg-emerald-600 text-white hover:bg-emerald-700", outline: "border-2 border-emerald-600 text-emerald-600 bg-transparent hover:bg-emerald-50" }
        : { primary: "bg-[#0E8B8D] text-white hover:bg-[#0b6d6f]", outline: "border-2 border-[#18D8DB] text-[#0E8B8D] bg-[#18D8DB]/[0.04] hover:bg-[#18D8DB]/10" };
      return {
        primary: `${accent.primary} rounded-xl shadow-soft hover:shadow-soft-md hover:-translate-y-[0.5px]`,
        secondary: "bg-[#111827] text-white hover:bg-gray-900 rounded-xl shadow-soft",
        outline: `${accent.outline} rounded-full`,
        ghost: "bg-transparent text-gray-700 hover:bg-gray-50 rounded-xl",
        danger: "bg-red-50 text-red-700 hover:bg-red-100 rounded-xl",
        gradient: "btn-gradient"
      };
    };

    const variants = getVariants();

    const sizes = {
      sm: "h-8 px-4 text-[12.5px] gap-1.5",
      md: "h-9 px-5 text-[13.8px] gap-2",
      lg: "h-11 px-6 text-[15px] gap-2"
    };

    return (
      <button
        ref={ref}
        className={cn(baseClass, focusRing, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
