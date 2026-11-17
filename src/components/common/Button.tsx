import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store';
import { isDarkTheme, isActiveBuddiesTheme } from '../../lib/themes';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const theme = useStore((state) => state.theme);
    const isDark = isDarkTheme(theme);
    const isABDark = theme === 'activebuddies-dark';
    const isABLight = isActiveBuddiesTheme(theme) && !isDark;

    const baseClass = "inline-flex items-center justify-center font-bold transition-all duration-200 active:scale-[0.97] active:duration-75 disabled:pointer-events-none disabled:opacity-50 disabled:scale-100";

    const focusRing = isDark || isABDark
      ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
      : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

    const getVariants = (): Record<string, string> => {
      if (isABDark) return {
        primary: "bg-[hsl(0_0%_95%)] text-[hsl(220_14%_12%)] hover:bg-white rounded-full shadow-soft hover:shadow-soft-md hover:-translate-y-[0.5px]",
        secondary: "bg-[hsl(220_16%_16%)] text-[hsl(210_20%_92%)] hover:bg-[hsl(220_16%_20%)] rounded-full shadow-soft",
        outline: "border border-[hsl(220_13%_24%)] text-[hsl(210_20%_92%)] bg-transparent hover:bg-[hsl(220_16%_14%)] rounded-full",
        ghost: "bg-transparent text-[hsl(220_12%_55%)] hover:bg-[hsl(220_16%_14%)] rounded-full",
        danger: "bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded-full",
        gradient: "btn-gradient"
      };
      if (isABLight) return {
        primary: "bg-[hsl(220_14%_12%)] text-white hover:bg-black rounded-full shadow-soft hover:shadow-soft-md hover:-translate-y-[0.5px]",
        secondary: "bg-[hsl(220_14%_96%)] text-[hsl(220_14%_12%)] hover:bg-[hsl(220_13%_92%)] rounded-full shadow-soft",
        outline: "border border-[hsl(220_13%_82%)] text-[hsl(220_14%_12%)] bg-transparent hover:bg-[hsl(220_14%_96%)] rounded-full",
        ghost: "bg-transparent text-[hsl(220_11%_34%)] hover:bg-[hsl(220_14%_96%)] rounded-full",
        danger: "bg-red-50 text-red-700 hover:bg-red-100 rounded-full",
        gradient: "btn-gradient"
      };
      if (isDark) {
        const accent = theme === 'vibrant-dark'
          ? { primary: "bg-fuchsia-600 text-white hover:bg-fuchsia-700 shadow-soft", outline: "border border-fuchsia-500/40 text-fuchsia-400 bg-transparent hover:bg-fuchsia-900/20 rounded-full" }
          : { primary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-soft", outline: "border border-emerald-500/40 text-emerald-400 bg-transparent hover:bg-emerald-900/20 rounded-full" };
        return {
          primary: `${accent.primary} rounded-full`,
          secondary: "bg-gray-700/50 text-white hover:bg-gray-600/60 rounded-full shadow-soft",
          outline: accent.outline,
          ghost: "bg-transparent text-gray-300 hover:bg-gray-700/40 rounded-full",
          danger: "bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded-full",
          gradient: "btn-gradient"
        };
      }
      const accent = theme === 'vibrant'
        ? { primary: "bg-fuchsia-700 text-white hover:bg-fuchsia-800", outline: "border border-fuchsia-700/60 text-fuchsia-700 bg-transparent hover:bg-fuchsia-50" }
        : theme === 'bento'
        ? { primary: "bg-indigo-700 text-white hover:bg-indigo-800", outline: "border border-indigo-700/60 text-indigo-700 bg-transparent hover:bg-indigo-50" }
        : theme === 'neon'
        ? { primary: "bg-emerald-700 text-white hover:bg-emerald-800", outline: "border border-emerald-700/60 text-emerald-700 bg-transparent hover:bg-emerald-50" }
        : { primary: "bg-brand text-brand-fg hover:bg-brand-strong", outline: "border border-accent/60 text-brand bg-accent/[0.04] hover:bg-accent/10" };
      return {
        primary: `${accent.primary} rounded-full shadow-soft hover:shadow-soft-md hover:-translate-y-[0.5px]`,
        secondary: "bg-ink text-white hover:bg-gray-900 rounded-full shadow-soft",
        outline: `${accent.outline} rounded-full`,
        ghost: "bg-transparent text-gray-700 hover:bg-gray-50 rounded-full",
        danger: "bg-red-50 text-red-700 hover:bg-red-100 rounded-full",
        gradient: "btn-gradient"
      };
    };

    const variants = getVariants();

    // Font size locked to Αξιολόγηση / .btn-gradient canonical (text-xs) across all sizes.
    // Size variants only change height and padding.
    const sizes = {
      sm: "min-h-8 h-8 px-3 text-xs gap-1.5",
      md: "min-h-9 h-9 px-4 text-xs gap-2",
      lg: "min-h-10 h-10 px-4 text-xs gap-2"
    };

    return (
      <button
        ref={ref}
        className={cn(baseClass, focusRing, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
