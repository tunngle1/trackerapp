import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { AppState, BarrierKind, CheckStatus, DayEntry, Habit, OnboardingData, ReflectionEntry, UserSettings } from './types';

const KEY = 'mewego-state-v1';
const XP_CREDIT = 10;
const COIN_CREDIT = 1;

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

function nowIso() { return new Date().toISOString(); }

export function formatUnit(value: number, habit: Habit): string {
  if (habit.noQuantity) return 'выполнено';
  return `${value} ${habit.unit}`;
}

export function isScheduled(habit: Habit, date: string, pausedUntil?: string | null, transfers?: Record<string, string>): boolean {
  if (date < habit.startDate) return false;
  if (pausedUntil && date <= pausedUntil) return false;
  if (transfers && Object.values(transfers).includes(date)) return true;
  const d = parseDate(date);
  return habit.days.includes(d.getDay()) && transfers?.[date] == null;
}

export function statusForValue(habit: Habit, value: number): DayEntry['status'] {
  if (value >= habit.targetGoal) return 'full';
  if (value >= habit.targetMin) return 'minimum';
  return 'attempt';
}

export function checkForStatus(status: DayEntry['status'], skipped = false): CheckStatus {
  if (skipped) return 'S';
  if (status === 'full') return 'F';
  if (status === 'minimum') return 'M';
  return 'P';
}

export function entryReward(check: CheckStatus) {
  return check === 'F' || check === 'M' ? { xp: XP_CREDIT, coins: COIN_CREDIT } : { xp: 0, coins: 0 };
}

function defaultSettings(): UserSettings {
  return { characterReplies: true, animations: true, telegramMessages: true, reflections: true, analytics: true };
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
    version: 1,
  };
}

function defaultOnboarding(): OnboardingData {
  return {
    referralCode: '', source: '', codeWord: '', character: 'robot', heroName: 'МиВиГо', heroEnabled: true, trackName: 'Мой путь', habit: defaultHabit(),
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function migrateEntry(date: string, input: unknown, habitId: string, planVersion: number): DayEntry {
  const raw = asRecord(input) as Partial<DayEntry>;
  const status = raw.status === 'full' || raw.status === 'minimum' || raw.status === 'attempt' ? raw.status : (raw.full ? 'full' : raw.done ? 'minimum' : 'attempt');
  const check = raw.check === 'F' || raw.check === 'M' || raw.check === 'P' || raw.check === 'S' ? raw.check : checkForStatus(status);
  const reward = entryReward(check);
  return {
    date,
    habitId: raw.habitId ?? habitId,
    obligationId: raw.obligationId ?? `${habitId}:${date}`,
    planVersion: raw.planVersion ?? planVersion,
    value: raw.value ?? 0,
    status,
    check,
    done: check === 'F' || check === 'M',
    full: check === 'F',
    xpAwarded: raw.xpAwarded ?? reward.xp,
    coinsAwarded: raw.coinsAwarded ?? reward.coins,
    occurredAt: raw.occurredAt,
    recordedAt: raw.recordedAt ?? raw.updatedAt ?? nowIso(),
    note: raw.note,
    transferredTo: raw.transferredTo,
    linkedFrom: raw.linkedFrom,
    updatedAt: raw.updatedAt ?? nowIso(),
  };
}

function migrateState(input: Partial<AppState>): AppState {
  const base = defaultState();
  const rawInput = asRecord(input) as Partial<AppState>;
  const rawOnboarding = asRecord(rawInput.onboarding) as Partial<OnboardingData>;
  const rawHabit = asRecord(rawOnboarding.habit) as Partial<Habit>;
  const hasOnboarding = Boolean(rawInput.onboarding);
  const rawDays = Array.isArray(rawHabit.days) ? rawHabit.days : null;
  const days = rawDays?.map(Number).filter(d => d >= 0 && d <= 6) ?? defaultHabit().days;
  const startDate = typeof rawHabit.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawHabit.startDate) ? rawHabit.startDate : todayStr();
  const character = rawOnboarding.character === 'cat' ? 'cat' : 'robot';
  const habit: Habit = {
    ...defaultHabit(),
    ...rawHabit,
    id: typeof rawHabit.id === 'string' && rawHabit.id ? rawHabit.id : 'main-habit',
    name: typeof rawHabit.name === 'string' && rawHabit.name.trim() ? rawHabit.name : 'Моя привычка',
    sphere: rawHabit.sphere === 'Тело' || rawHabit.sphere === 'Жизнь' ? rawHabit.sphere : 'Дело',
    targetMin: Math.max(1, Number(rawHabit.targetMin) || 1),
    targetGoal: Math.max(1, Number(rawHabit.targetGoal) || Number(rawHabit.targetMin) || 1),
    unit: typeof rawHabit.unit === 'string' && rawHabit.unit ? rawHabit.unit : 'раз',
    unitKind: rawHabit.unitKind ?? 'none',
    noQuantity: Boolean(rawHabit.noQuantity),
    days: days.length ? days : defaultHabit().days,
    reminderOn: rawHabit.reminderOn !== false,
    reminderTime: typeof rawHabit.reminderTime === 'string' ? rawHabit.reminderTime : null,
    startDate,
    anchorEvent: typeof rawHabit.anchorEvent === 'string' ? rawHabit.anchorEvent : '',
    cycleDays: Number(rawHabit.cycleDays) || 90,
    version: Math.max(1, Number(rawHabit.version) || 1),
  };
  habit.targetMin = Math.min(habit.targetMin, habit.targetGoal);
  const onboarding = hasOnboarding ? {
    ...defaultOnboarding(),
    ...rawOnboarding,
    character,
    heroName: typeof rawOnboarding.heroName === 'string' && rawOnboarding.heroName ? rawOnboarding.heroName : (character === 'cat' ? 'Пушок' : 'МиВиГо'),
    heroEnabled: rawOnboarding.heroEnabled !== false,
    trackName: typeof rawOnboarding.trackName === 'string' && rawOnboarding.trackName ? rawOnboarding.trackName : 'Мой путь',
    habit,
  } satisfies OnboardingData : null;

  const habitId = onboarding?.habit.id ?? 'main-habit';
  const planVersion = onboarding?.habit.version ?? 1;
  const entries = Object.fromEntries(Object.entries(asRecord(rawInput.entries)).map(([date, raw]) => [date, migrateEntry(date, raw, habitId, planVersion)]));
  const reflections = Object.fromEntries(Object.entries(asRecord(rawInput.reflections)).map(([date, value]) => {
    const raw = asRecord(value) as Partial<ReflectionEntry>;
    return [date, { ...raw, date, updatedAt: raw.updatedAt ?? nowIso() } satisfies ReflectionEntry];
  }));
  const transfers = Object.fromEntries(Object.entries(asRecord(rawInput.transfers)).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));

  return {
    ...base,
    ...rawInput,
    onboarded: Boolean(rawInput.onboarded),
    onboarding,
    entries,
    reflections,
    transfers,
    pro: true,
    energy: Math.min(3, Math.max(0, Number(rawInput.energy) || base.energy)),
    settings: { ...defaultSettings(), ...asRecord(rawInput.settings) },
    lastResultMessage: typeof rawInput.lastResultMessage === 'string' ? rawInput.lastResultMessage : null,
    dismissedHelpAt: typeof rawInput.dismissedHelpAt === 'string' ? rawInput.dismissedHelpAt : null,
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
    energy: 1,
    entries: {},
    reflections: {},
    transfers: {},
    pausedUntil: null,
    pro: true,
    founderLetterRead: false,
    lastResultMessage: null,
    dismissedHelpAt: null,
    settings: defaultSettings(),
  };
}

type Action =
  | { type: 'COMPLETE_ONBOARDING'; payload: OnboardingData }
  | { type: 'LOG_ENTRY'; date: string; value: number; note?: string }
  | { type: 'LOG_CHECK'; date: string; check: CheckStatus; value?: number; note?: string; occurredAt?: string }
  | { type: 'CLEAR_ENTRY'; date: string }
  | { type: 'TRANSFER'; from: string; to: string }
  | { type: 'SAVE_REFLECTION'; date: string; patch: Partial<Omit<ReflectionEntry, 'date' | 'updatedAt'>> }
  | { type: 'RECORD_BARRIER'; date: string; barrier: BarrierKind }
  | { type: 'UPDATE_HABIT'; patch: Partial<Habit> }
  | { type: 'SET_SETTING'; key: keyof UserSettings; value: boolean }
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

export function planStats(habit: Habit, entries: Record<string, DayEntry>, from: string, to: string, pausedUntil?: string | null, transfers?: Record<string, string>) {
  let planned = 0;
  let elapsedPlanned = 0;
  let done = 0;
  let min = 0;
  let full = 0;
  let attempts = 0;
  let skipped = 0;
  let unknown = 0;
  const today = todayStr();
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const scheduled = isScheduled(habit, d, pausedUntil, transfers);
    if (!scheduled) continue;
    planned++;
    if (d <= today) elapsedPlanned++;
    const e = entries[d];
    if (e?.check === 'P' || e?.status === 'attempt') attempts++;
    if (e?.check === 'S') skipped++;
    if (!e && d <= today) unknown++;
    if (e?.done) done++;
    if (e?.check === 'M') min++;
    if (e?.check === 'F') full++;
  }
  const n = full + min + attempts + skipped + unknown;
  return { planned, elapsedPlanned, done, min, full, attempts, skipped, unknown, n, percent: planned ? Math.round((done / planned) * 100) : 0 };
}

export function currentWeekBounds() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { from: todayStr(monday), to: todayStr(sunday) };
}

function computeStreak(habit: Habit, entries: Record<string, DayEntry>, today: string, pausedUntil?: string | null, transfers?: Record<string, string>): number {
  let streak = 0;
  for (let d = today; d >= habit.startDate; d = addDays(d, -1)) {
    if (!isScheduled(habit, d, pausedUntil, transfers)) continue;
    const e = entries[d];
    if (!e?.done) break;
    streak++;
  }
  return streak;
}

export function missedScheduledCount(habit: Habit, entries: Record<string, DayEntry>, pausedUntil?: string | null, transfers?: Record<string, string>): number {
  let misses = 0;
  const today = todayStr();
  for (let d = habit.startDate; d < today; d = addDays(d, 1)) {
    if (isScheduled(habit, d, pausedUntil, transfers) && !entries[d]?.done) misses++;
  }
  return misses;
}

export function activeDays(entries: Record<string, DayEntry>, habitId: string): number {
  return new Set(entriesForHabit(entries, habitId).filter(e => e.done).map(e => e.date)).size;
}

export function stageFromPlan(habit: Habit, entries: Record<string, DayEntry>, date = todayStr(), pausedUntil?: string | null, transfers?: Record<string, string>): number {
  const days = activeDays(entries, habit.id);
  if (days >= 90) return 5;
  if (days >= 60) return 4;
  if (days >= 30) return 3;
  if (days >= 15) return 2;
  return 1;
}

function resultMessage(habit: Habit, entries: Record<string, DayEntry>, date: string, entry: DayEntry): string {
  const completed = entriesForHabit(entries, habit.id).filter(e => e.done).length;
  const { from, to } = currentWeekBounds();
  const week = planStats(habit, entries, from, to);
  if (entry.check === 'S') return 'Отсутствие действия сохранено как честная отметка. Завтра можно выбрать минимум или изменить план.';
  if (entry.check === 'P') return `Сегодня записано ${formatUnit(entry.value, habit)}. Объём сохранён, но минимум не засчитан.`;
  if (entry.check === 'F') return `Полная цель готова. Это ${completed}-й зачётный день в твоём маршруте.`;
  return `Минимум готов. На этой неделе выполнено ${week.done} из ${week.elapsedPlanned} наступивших запланированных дней.`;
}

function upsertEntry(state: AppState, habit: Habit, action: { date: string; check: CheckStatus; value: number; note?: string; occurredAt?: string }): AppState {
  const status = action.check === 'F' ? 'full' : action.check === 'M' ? 'minimum' : 'attempt';
  const reward = entryReward(action.check);
  const prev = state.entries[action.date];
  const sourceDate = Object.entries(state.transfers).find(([, to]) => to === action.date)?.[0];
  const entry: DayEntry = {
    date: action.date,
    habitId: habit.id,
    obligationId: prev?.obligationId ?? `${habit.id}:${sourceDate ?? action.date}`,
    planVersion: habit.version,
    value: action.value,
    status,
    check: action.check,
    done: action.check === 'F' || action.check === 'M',
    full: action.check === 'F',
    xpAwarded: reward.xp,
    coinsAwarded: reward.coins,
    occurredAt: action.occurredAt ?? nowIso(),
    recordedAt: nowIso(),
    note: action.note,
    linkedFrom: sourceDate,
    updatedAt: nowIso(),
  };
  const entries = { ...state.entries, [action.date]: entry };
  return {
    ...state,
    entries,
    xp: Math.max(0, state.xp - (prev?.xpAwarded ?? 0) + reward.xp),
    coins: Math.max(0, state.coins - (prev?.coinsAwarded ?? 0) + reward.coins),
    streak: computeStreak(habit, entries, todayStr(), state.pausedUntil, state.transfers),
    energy: Math.min(3, state.energy + (entry.done && state.energy < 3 ? 1 : 0)),
    characterState: entry.done ? 'celebrate' : 'wait',
    lastResultMessage: resultMessage(habit, entries, action.date, entry),
  };
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboarded: true, onboarding: action.payload, characterState: action.payload.heroEnabled ? 'wait' : 'sleep', lastResultMessage: null };
    case 'LOG_ENTRY': {
      const habit = state.onboarding?.habit;
      if (!habit) return state;
      return upsertEntry(state, habit, { date: action.date, value: Math.max(0, action.value), check: checkForStatus(statusForValue(habit, Math.max(0, action.value))), note: action.note });
    }
    case 'LOG_CHECK': {
      const habit = state.onboarding?.habit;
      if (!habit) return state;
      const value = Math.max(0, action.value ?? (action.check === 'F' ? habit.targetGoal : action.check === 'M' ? habit.targetMin : 0));
      return upsertEntry(state, habit, { date: action.date, value, check: action.check, note: action.note, occurredAt: action.occurredAt });
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
        streak: computeStreak(habit, entries, todayStr(), state.pausedUntil, state.transfers),
        lastResultMessage: 'Отметка исправлена. Статистика пересчитана.',
      };
    }
    case 'TRANSFER': {
      if (!state.onboarding?.habit || state.entries[action.from] || !/^\d{4}-\d{2}-\d{2}$/.test(action.to) || !isScheduled(state.onboarding.habit, action.from, state.pausedUntil, state.transfers) || action.to <= action.from) return state;
      const entries = { ...state.entries };
      if (entries[action.from]) {
        entries[action.from] = { ...entries[action.from], transferredTo: action.to, updatedAt: nowIso() };
      }
      return { ...state, entries, transfers: { ...state.transfers, [action.from]: action.to }, lastResultMessage: `Действие перенесено на ${action.to}. Это то же обязательство, а не пропуск.` };
    }
    case 'SAVE_REFLECTION': {
      const current = state.reflections[action.date] ?? { date: action.date, updatedAt: nowIso() };
      return { ...state, reflections: { ...state.reflections, [action.date]: { ...current, ...action.patch, updatedAt: nowIso() } } };
    }
    case 'RECORD_BARRIER': {
      const current = state.reflections[action.date] ?? { date: action.date, updatedAt: nowIso() };
      return { ...state, reflections: { ...state.reflections, [action.date]: { ...current, barrier: action.barrier, updatedAt: nowIso() } } };
    }
    case 'UPDATE_HABIT': {
      const ob = state.onboarding;
      if (!ob) return state;
      const habit = { ...ob.habit, ...action.patch, version: ob.habit.version + 1 };
      return { ...state, onboarding: { ...ob, habit }, lastResultMessage: 'План обновлён. История и прежние отметки сохранены.' };
    }
    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
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
  const stage = habit ? stageFromPlan(habit, state.entries, today, state.pausedUntil, state.transfers) : 1;
  const dayNumber = habit ? cycleDay(habit, today) : 1;
  const isPaused = state.pausedUntil ? state.pausedUntil >= today : false;
  const habitActiveToday = habit ? isScheduled(habit, today, state.pausedUntil, state.transfers) : true;
  const bounds = currentWeekBounds();
  const weekStats = habit ? planStats(habit, state.entries, bounds.from, bounds.to, state.pausedUntil, state.transfers) : { planned: 0, elapsedPlanned: 0, done: 0, min: 0, full: 0, attempts: 0, skipped: 0, unknown: 0, n: 0, percent: 0 };
  const misses = habit ? missedScheduledCount(habit, state.entries, state.pausedUntil, state.transfers) : 0;

  const value = useMemo<StoreCtx>(() => ({ state, dispatch, today, todayEntry, stage, dayNumber, isPaused, habitActiveToday, weekStats, misses }), [state, today, todayEntry, stage, dayNumber, isPaused, habitActiveToday, weekStats, misses]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
