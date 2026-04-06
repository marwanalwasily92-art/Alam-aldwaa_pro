import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: unknown): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date === 'string') return new Date(date);
  if (date && typeof date === 'object') {
    const d = date as Record<string, unknown>;
    if (typeof d.toDate === 'function') return d.toDate() as Date;
    if (typeof d.seconds === 'number') return new Date(d.seconds * 1000);
  }
  return new Date();
}
