import type { Habit } from './types';

export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDaysLocal(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const value = new Date(y, (m ?? 1) - 1, d ?? 1);
  value.setDate(value.getDate() + days);
  return todayStr(value);
}

export function countScheduled(habit: Habit, date: string, pausedUntil?: string | null, transfers?: Record<string, string>): boolean {
  if (date < habit.startDate) return false;
  if (pausedUntil && date <= pausedUntil) return false;
  if (transfers && Object.values(transfers).includes(date)) return true;
  const day = new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))).getDay();
  return habit.days.includes(day) && transfers?.[date] == null;
}
