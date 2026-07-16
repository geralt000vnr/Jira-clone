import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Shared field styling so every text input/select/textarea in the app looks and
// behaves the same (focus ring, transition, hover) without a full Input component.
export const fieldClass =
  'border border-slate-200 rounded-lg bg-white transition-colors duration-150 ' +
  'placeholder:text-slate-400 hover:border-slate-300 ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400';

export function getInitials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

// WorkflowStatus.color -> Tailwind classes. Kept as static literals (not template strings) so
// Tailwind's build-time class scanner actually generates these.
export const STATUS_DOT_CLASS = {
  slate: 'bg-slate-400',
  blue: 'bg-blue-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  violet: 'bg-violet-500',
  rose: 'bg-rose-500',
};

export const STATUS_BADGE_CLASS = {
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-100 text-blue-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  amber: 'bg-amber-100 text-amber-700',
  violet: 'bg-violet-100 text-violet-700',
  rose: 'bg-rose-100 text-rose-700',
};
