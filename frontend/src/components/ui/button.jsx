import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:bg-indigo-800 focus-visible:ring-indigo-500/50',
  secondary:
    'bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-400/50',
  ghost: 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 focus-visible:ring-slate-400/50',
  danger: 'text-red-500 hover:text-red-600 hover:bg-red-50 focus-visible:ring-red-400/50',
};

const SIZES = {
  sm: 'text-xs px-2.5 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2 gap-2',
};

export function Button({ variant = 'primary', size = 'md', loading, disabled, className, children, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-3.5 animate-spin" />}
      {children}
    </button>
  );
}
