import type { AppState, DayEntry, Habit } from './types';
import { ANALYTICS_RULES } from './data/content';
import { addDaysLocal, countScheduled, todayStr } from './analytics-utils';

export interface IntervalStats {
  n: number;
  f: number;
  m: number;
  p: number;
  s: number;
  u: number;
  lower: number | null;
  upper: number | null;
  completeness: number | null;
  fact: number | null;
}

export function intervalStats(habit: Habit, state: AppState, from: string, to: string): IntervalStats {
  let f = 0, m = 0, p = 0, s = 0, u = 0;
  const today = todayStr();
  for (let d = from; d <= to; d = addDaysLocal(d, 1)) {
    if (!countScheduled(habit, d, state.pausedUntil, state.transfers) || d > today) continue;
    const e: DayEntry | undefined = state.entries[d];
    if (!e) u++;
    else if (e.check === 'F') f++;
    else if (e.check === 'M') m++;
    else if (e.check === 'P') p++;
    else if (e.check === 'S') s++;
  }
  const n = f + m + p + s + u;
  if (!n) return { n: 0, f, m, p, s, u, lower: null, upper: null, completeness: null, fact: null };
  return { n, f, m, p, s, u, lower: (f + m) / n, upper: (f + m + u) / n, completeness: (n - u) / n, fact: (f + m + p) / n };
}

export interface Insight {
  ruleId: string;
  kind: string;
  text: string;
  action: string;
}

export function localInsights(habit: Habit, state: AppState): Insight[] {
  if (!state.settings.analytics) return [];
  const insights: Insight[] = [];
  const to = todayStr();
  const currentFrom = addDaysLocal(to, -27);
  const previousTo = addDaysLocal(currentFrom, -1);
  const previousFrom = addDaysLocal(previousTo, -27);
  const current = intervalStats(habit, state, currentFrom, to);
  const previous = intervalStats(habit, state, previousFrom, previousTo);
  const comparable = current.n >= 6 && previous.n >= 6 && (current.completeness ?? 0) >= 0.8 && (previous.completeness ?? 0) >= 0.8;
  if (comparable && (current.lower ?? 0) - (previous.upper ?? 0) >= 0.1) insights.push(rule('A01'));
  if (comparable && (previous.lower ?? 0) - (current.upper ?? 0) >= 0.1) insights.push(rule('A02'));
  if ((current.f + current.m) >= 6 && current.m / Math.max(1, current.f + current.m) >= 0.5) insights.push(rule('A04'));

  const barriers = Object.values(state.reflections).map(r => r.barrier).filter(Boolean);
  const count = (kind: string) => barriers.filter(b => b === kind).length;
  if (count('time') >= 2) insights.push(rule('A23'));
  if (count('forget') >= 2) insights.push(rule('A24'));
  if (count('start') >= 2) insights.push(rule('A25'));
  if (count('conflict') >= 2) insights.push(rule('A26'));
  if (count('energy') >= 1) insights.push(rule('A30'));
  if (insights.length === 0 && current.n > 0) insights.push({ ruleId: 'LOCAL', kind: 'fact', text: `За последние 28 дней записано ${current.f + current.m + current.p + current.s} из ${current.n} известных отметок.`, action: 'Посмотреть записи' });
  return insights.slice(0, 3);
}

function rule(id: string): Insight {
  const r = ANALYTICS_RULES.find(x => x.id === id);
  return { ruleId: id, kind: r?.kind ?? 'fact', text: r?.text ?? 'Есть новое наблюдение по записям.', action: r?.action ?? 'Посмотреть записи' };
}
