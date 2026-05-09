import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseClass = "inline-flex items-center justify-center rounded font-bold transition-colors shadow-sm disabled:pointer-events-none disabled:opacity-50";
    
    const variants = {
      primary: "bg-indigo-600 text-white hover:bg-indigo-700",
      secondary: "bg-[#111827] text-white hover:bg-gray-900",
      outline: "border border-indigo-600 text-indigo-600 bg-transparent hover:bg-indigo-50",
      ghost: "bg-transparent text-gray-700 hover:bg-gray-100 shadow-none",
      danger: "bg-red-50 text-red-700 hover:bg-red-100 shadow-none"
    };

    const sizes = {
      sm: "h-7 px-3 text-[10px]",
      md: "h-8 px-4 py-1 text-xs",
      lg: "h-10 px-5 text-sm"
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
