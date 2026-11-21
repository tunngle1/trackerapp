import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import type { AppState, DayEntry } from './types';

const KEY = 'mewego-state-v1';

const XP_GOAL = 50;
const XP_MIN = 25;
const COINS_GOAL = 10;
const COINS_MIN = 5;

function todayStr(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function initialState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaultState(), ...JSON.parse(raw) };
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
    energy: 100,
    entries: {},
    pausedUntil: null,
    pro: false,
    founderLetterRead: false,
  };
}

type Action =
  | { type: 'COMPLETE_ONBOARDING'; payload: AppState['onboarding'] }
  | { type: 'LOG_ENTRY'; date: string; value: number }
  | { type: 'SET_STATE'; state: AppState['characterState'] }
  | { type: 'CONSUME_ENERGY'; amount: number }
  | { type: 'ADD_XP'; amount: number }
  | { type: 'ADD_COINS'; amount: number }
  | { type: 'SET_PRO'; pro: boolean }
  | { type: 'READ_LETTER' }
  | { type: 'PAUSE'; until: string | null }
  | { type: 'RESET' };

function stageFromXp(xp: number): number {
  if (xp >= 900) return 5;
  if (xp >= 500) return 4;
  if (xp >= 250) return 3;
  if (xp >= 80) return 2;
  return 1;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'COMPLETE_ONBOARDING':
      return { ...state, onboarded: true, onboarding: action.payload, characterState: 'wait' };
    case 'LOG_ENTRY': {
      const { date, value } = action;
      const habit = state.onboarding?.habit;
      if (!habit) return state;
      const prev = state.entries[date];
      const done = value >= habit.targetMin;
      const full = value >= habit.targetGoal;
      const entries = { ...state.entries, [date]: { date, value, done, full } satisfies DayEntry };
      let { xp, coins, streak } = state;
      if (done && !prev?.done) {
        xp += full ? XP_GOAL : XP_MIN;
        coins += full ? COINS_GOAL : COINS_MIN;
      }
      // пересчёт серии
      let s = 0;
      const d = new Date();
      if (!entries[todayStr(d)]?.done) d.setDate(d.getDate() - 1);
      while (entries[todayStr(d)]?.done) { s++; d.setDate(d.getDate() - 1); }
      return { ...state, entries, xp, coins, streak: Math.max(s, streak > 0 && s === 0 ? streak : s) };
    }
    case 'SET_STATE':
      return { ...state, characterState: action.state };
    case 'CONSUME_ENERGY':
      return { ...state, energy: Math.max(0, state.energy - action.amount) };
    case 'ADD_XP':
      return { ...state, xp: state.xp + action.amount };
    case 'ADD_COINS':
      return { ...state, coins: state.coins + action.amount };
    case 'SET_PRO':
      return { ...state, pro: action.pro };
    case 'READ_LETTER':
      return { ...state, founderLetterRead: true };
    case 'PAUSE':
      return { ...state, pausedUntil: action.until };
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
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const today = todayStr();
  const todayEntry = state.entries[today];
  const stage = stageFromXp(state.xp);
  const dayNumber = useMemo(() => {
    // день привычки = число отмеченных дней + 1
    return Object.values(state.entries).filter(e => e.done).length + 1;
  }, [state.entries]);
  const isPaused = state.pausedUntil ? state.pausedUntil > today : false;
  const habitActiveToday = state.onboarding
    ? state.onboarding.habit.days.includes(new Date().getDay())
    : true;

  const value: StoreCtx = { state, dispatch, today, todayEntry, stage, dayNumber, isPaused, habitActiveToday };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore outside provider');
  return ctx;
}
