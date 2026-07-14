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
