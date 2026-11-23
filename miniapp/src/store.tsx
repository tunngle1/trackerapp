import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { AppState, DayEntry, Habit, OnboardingData } from './types';

const KEY = 'mewego-state-v1';
const XP_MIN = 20;
const XP_FULL = 35;
const COINS_MIN = 5;
const COINS_FULL = 9;

export function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(date: string, days: number): string {
  const d = parseDate(date);
  d.setDate(d.getDate() + days);
  return todayStr(d);
}

function parseDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function diffDays(a: string, b: string): number {
  const one = 24 * 60 * 60 * 1000;
  return Math.floor((parseDate(a).getTime() - parseDate(b).getTime()) / one);
}

export function formatUnit(value: number, habit: Habit): string {
  if (habit.noQuantity) return 'выполнено';
  return `${value} ${habit.unit}`;
}

export function isScheduled(habit: Habit, date: string, pausedUntil?: string | null): boolean {
  if (date < habit.startDate) return false;
  if (pausedUntil && date <= pausedUntil) return false;
  const d = parseDate(date);
  return habit.days.includes(d.getDay());
}

export function statusForValue(habit: Habit, value: number): DayEntry['status'] {
  if (value >= habit.targetGoal) return 'full';
  if (value >= habit.targetMin) return 'minimum';
  return 'attempt';
}

export function entryReward(status: DayEntry['status']) {
  if (status === 'full') return { xp: XP_FULL, coins: COINS_FULL };
  if (status === 'minimum') return { xp: XP_MIN, coins: COINS_MIN };
  return { xp: 0, coins: 0 };
}

function defaultHabit(): Habit {
  return {
    id: crypto.randomUUID?.() ?? `habit-${Date.now()}`,
    name: 'Моя привычка',
    sphere: 'Дело',
    targetMin: 1,
    targetGoal: 1,
    unit: 'раз',
    unitKind: 'none',
    noQuantity: true,
    days: [1, 2, 3, 4, 5],
    reminderOn: true,
    reminderTime: '09:00',
    startDate: todayStr(),
    anchorEvent: '',
    cycleDays: 90,
  };
}

function defaultOnboarding(): OnboardingData {
  return {
    referralCode: '',
    source: '',
    codeWord: '',
    character: 'robot',
    heroName: 'МейВиГо',
    heroEnabled: true,
    trackName: 'Мой путь',
    habit: defaultHabit(),
  };
}

function migrateState(input: Partial<AppState>): AppState {
  const base = defaultState();
  const onboarding = input.onboarding ? {
    ...defaultOnboarding(),
    ...input.onboarding,
    heroName: input.onboarding.heroName ?? (input.onboarding.character === 'cat' ? 'Пушок' : 'МейВиГо'),
    heroEnabled: input.onboarding.heroEnabled ?? true,
    habit: {
      ...defaultHabit(),
      ...input.onboarding.habit,
      id: input.onboarding.habit?.id ?? 'main-habit',
      sphere: input.onboarding.habit?.sphere ?? 'Дело',
      unitKind: input.onboarding.habit?.unitKind ?? (input.onboarding.habit?.unit === 'мин' ? 'minutes' : 'custom'),
      noQuantity: input.onboarding.habit?.noQuantity ?? false,
      startDate: input.onboarding.habit?.startDate ?? todayStr(),
      anchorEvent: input.onboarding.habit?.anchorEvent ?? '',
      cycleDays: input.onboarding.habit?.cycleDays ?? 90,
    },
  } satisfies OnboardingData : null;

  const habitId = onboarding?.habit.id ?? 'main-habit';
  const entries = Object.fromEntries(Object.entries(input.entries ?? {}).map(([date, raw]) => {
    const e = raw as Partial<DayEntry>;
    const status = e.status ?? (e.full ? 'full' : e.done ? 'minimum' : 'attempt');
    const reward = entryReward(status);
    return [date, {
      date,
      habitId: e.habitId ?? habitId,
      value: e.value ?? 0,
      status,
      done: status === 'minimum' || status === 'full',
      full: status === 'full',
      xpAwarded: e.xpAwarded ?? reward.xp,
      coinsAwarded: e.coinsAwarded ?? reward.coins,
      note: e.note,
      updatedAt: e.updatedAt ?? new Date().toISOString(),
    } satisfies DayEntry];
  }));

  return {
    ...base,
    ...input,
    onboarding,
    entries,
    lastResultMessage: input.lastResultMessage ?? null,
    dismissedHelpAt: input.dismissedHelpAt ?? null,
  };
}

function initialState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrateState(JSON.parse(raw));
  } catch { /* ignore */ }
  return defaultState();
}

function defaultState(): AppState {
  return {
    onboarded: false,
    onboarding: null,
    characterState: 'wait',
    xp: 0,
    coins: 0,
    streak: 0,
    energy: 85,
    entries: {},
    pausedUntil: null,
    pro: false,
    founderLetterRead: false,
    lastResultMessage: null,
    dismissedHelpAt: null,
  };
}

type Action =
  | { type: 'COMPLETE_ONBOARDING'; payload: OnboardingData }
  | { type: 'LOG_ENTRY'; date: string; value: number; note?: string }
  | { type: 'CLEAR_ENTRY'; date: string }
  | { type: 'SET_STATE'; state: AppState['characterState'] }
  | { type: 'CONSUME_ENERGY'; amount: number }
  | { type: 'ADD_XP'; amount: number }
  | { type: 'ADD_COINS'; amount: number }
  | { type: 'SET_PRO'; pro: boolean }
  | { type: 'READ_LETTER' }
  | { type: 'PAUSE'; until: string | null }
  | { type: 'DISMISS_HELP' }
  | { type: 'RESET' };

export function cycleDay(habit: Habit, date = todayStr()): number {
  return Math.min(habit.cycleDays, Math.max(1, diffDays(date, habit.startDate) + 1));
}

export function entriesForHabit(entries: Record<string, DayEntry>, habitId: string) {
  return Object.values(entries).filter(e => e.habitId === habitId);
}

export function planStats(habit: Habit, entries: Record<string, DayEntry>, from: string, to: string, pausedUntil?: string | null) {
  let planned = 0;
  let elapsedPlanned = 0;
  let done = 0;
  let min = 0;
  let full = 0;
  let attempts = 0;
  const today = todayStr();
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const scheduled = isScheduled(habit, d, pausedUntil);
    if (!scheduled) continue;
    planned++;
    if (d <= today) elapsedPlanned++;
    const e = entries[d];
    if (e?.status === 'attempt') attempts++;
    if (e?.done) { done++; min++; }
    if (e?.full) full++;
  }
  return { planned, elapsedPlanned, done, min, full, attempts, percent: planned ? Math.round((done / planned) * 100) : 0 };
}

export function currentWeekBounds() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: todayStr(monday), to: todayStr(sunday) };
}

function computeStreak(habit: Habit, entries: Record<string, DayEntry>, today: string, pausedUntil?: string | null): number {
  let streak = 0;
  for (let d = today; d >= habit.startDate; d = addDays(d, -1)) {
    if (!isScheduled(habit, d, pausedUntil)) continue;
    const e = entries[d];
    if (!e?.done) break;
    streak++;
  }
  return streak;
}

export function missedScheduledCount(habit: Habit, entries: Record<string, DayEntry>, pausedUntil?: string | null): number {
  let misses = 0;
  const today = todayStr();
  for (let d = habit.startDate; d < today; d = addDays(d, 1)) {
    if (isScheduled(habit, d, pausedUntil) && !entries[d]?.done) misses++;
  }
  return misses;
}

export function stageFromPlan(habit: Habit, entries: Record<string, DayEntry>, date = todayStr(), pausedUntil?: string | null): number {
  const cd = cycleDay(habit, date);
  const statsToDate = planStats(habit, entries, habit.startDate, date, pausedUntil);
  const compliance = statsToDate.elapsedPlanned ? statsToDate.done / statsToDate.elapsedPlanned : 0;
  let stage = 1;
  if (cd >= 7 && compliance >= 0.6) stage = 2;
  if (cd >= 21 && compliance >= 0.6) stage = 3;
  if (cd >= 45 && compliance >= 0.6) stage = 4;
  if (cd >= 75 && compliance >= 0.6) stage = 5;
  return stage;
}

function resultMessage(habit: Habit, entries: Record<string, DayEntry>, date: string, entry: DayEntry): string {
  const completed = entriesForHabit(entries, habit.id).filter(e => e.done).length;
  const { from, to } = currentWeekBounds();
  const week = planStats(habit, entries, from, to);
  if (entry.status === 'attempt') {
    return `Сегодня получилось ${formatUnit(entry.value, habit)}. Это тоже действие. Завтра можно начать с минимума.`;
  }
  if (entry.status === 'full') {
    return `Полная цель готова. Это ${completed}-й выполненный день в твоём маршруте.`;
  }
  return `Минимум готов. На этой неделе выполнено ${week.done} из ${week.elapsedPlanned} наступивших запланированных дней.`;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboarded: true, onboarding: action.payload, characterState: action.payload.heroEnabled ? 'wait' : 'sleep', lastResultMessage: null };
    case 'LOG_ENTRY': {
      const habit = state.onboarding?.habit;
      if (!habit) return state;
      const status = statusForValue(habit, action.value);
      const reward = entryReward(status);
      const prev = state.entries[action.date];
      const prevXp = prev?.xpAwarded ?? 0;
      const prevCoins = prev?.coinsAwarded ?? 0;
      const entry: DayEntry = {
        date: action.date,
        habitId: habit.id,
        value: action.value,
        status,
        done: status === 'minimum' || status === 'full',
        full: status === 'full',
        xpAwarded: reward.xp,
        coinsAwarded: reward.coins,
        note: action.note,
        updatedAt: new Date().toISOString(),
      };
      const entries = { ...state.entries, [action.date]: entry };
      return {
        ...state,
        entries,
        xp: Math.max(0, state.xp - prevXp + reward.xp),
        coins: Math.max(0, state.coins - prevCoins + reward.coins),
        streak: computeStreak(habit, entries, todayStr(), state.pausedUntil),
        energy: Math.min(100, state.energy + (entry.done ? 10 : 0)),
        characterState: entry.done ? 'celebrate' : 'wait',
        lastResultMessage: resultMessage(habit, entries, action.date, entry),
      };
    }
    case 'CLEAR_ENTRY': {
      const habit = state.onboarding?.habit;
      if (!habit) return state;
      const prev = state.entries[action.date];
      if (!prev) return state;
      const { [action.date]: _, ...entries } = state.entries;
      return {
        ...state,
        entries,
        xp: Math.max(0, state.xp - (prev.xpAwarded ?? 0)),
        coins: Math.max(0, state.coins - (prev.coinsAwarded ?? 0)),
        streak: computeStreak(habit, entries, todayStr(), state.pausedUntil),
        lastResultMessage: 'Отметка исправлена. Статистика пересчитана.',
      };
    }
    case 'SET_STATE':
      return { ...state, characterState: action.state };
    case 'CONSUME_ENERGY':
      return { ...state, energy: Math.max(0, state.energy - action.amount) };
    case 'ADD_XP':
      return { ...state, xp: Math.max(0, state.xp + action.amount) };
    case 'ADD_COINS':
      return { ...state, coins: Math.max(0, state.coins + action.amount) };
    case 'SET_PRO':
      return { ...state, pro: action.pro };
    case 'READ_LETTER':
      return { ...state, founderLetterRead: true };
    case 'PAUSE':
      return { ...state, pausedUntil: action.until };
    case 'DISMISS_HELP':
      return { ...state, dismissedHelpAt: todayStr() };
    case 'RESET':
      return defaultState();
    default:
      return state;
  }
}

interface StoreCtx {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  today: string;
  todayEntry?: DayEntry;
  stage: number;
  dayNumber: number;
  isPaused: boolean;
  habitActiveToday: boolean;
  weekStats: ReturnType<typeof planStats>;
  misses: number;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const today = todayStr();
  const habit = state.onboarding?.habit;
  const todayEntry = habit ? state.entries[today] : undefined;
  const stage = habit ? stageFromPlan(habit, state.entries, today, state.pausedUntil) : 1;
  const dayNumber = habit ? cycleDay(habit, today) : 1;
  const isPaused = state.pausedUntil ? state.pausedUntil >= today : false;
  const habitActiveToday = habit ? isScheduled(habit, today, state.pausedUntil) : true;
  const bounds = currentWeekBounds();
  const weekStats = habit ? planStats(habit, state.entries, bounds.from, bounds.to, state.pausedUntil) : { planned: 0, elapsedPlanned: 0, done: 0, min: 0, full: 0, attempts: 0, percent: 0 };
  const misses = habit ? missedScheduledCount(habit, state.entries, state.pausedUntil) : 0;

  const value = useMemo<StoreCtx>(() => ({ state, dispatch, today, todayEntry, stage, dayNumber, isPaused, habitActiveToday, weekStats, misses }), [state, today, todayEntry, stage, dayNumber, isPaused, habitActiveToday, weekStats, misses]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
