export type CharacterKind = 'robot' | 'cat';
export type CharacterState = 'wait' | 'sleep' | 'celebrate' | 'return';
export type Sphere = 'Дело' | 'Тело' | 'Жизнь';
export type UnitKind = 'minutes' | 'hours' | 'pages' | 'km' | 'reps' | 'times' | 'custom' | 'none';
export type EntryStatus = 'attempt' | 'minimum' | 'full';
export type CheckStatus = 'F' | 'M' | 'P' | 'S';
export type BarrierKind = 'time' | 'forget' | 'start' | 'conflict' | 'energy' | 'other';

export interface Habit {
  id: string;
  name: string;
  sphere: Sphere;
  /** Обычная планка. Для качественной привычки без числа равна 1. */
  targetGoal: number;
  /** Минимальная зачитываемая планка. Для качественной привычки равна 1. */
  targetMin: number;
  unit: string;
  unitKind: UnitKind;
  noQuantity: boolean;
  /** Дни недели 0=Вс … 6=Сб, в которые привычка активна */
  days: number[];
  reminderTime: string | null;
  reminderOn: boolean;
  startDate: string; // YYYY-MM-DD
  anchorEvent: string;
  cycleDays: number;
  version: number;
}

export interface OnboardingData {
  referralCode: string;
  source: string;
  codeWord: string;
  character: CharacterKind;
  heroName: string;
  heroEnabled: boolean;
  trackName: string;
  habit: Habit;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD — локальная дата обязательства
  habitId: string;
  obligationId: string;
  planVersion: number;
  value: number;
  status: EntryStatus;
  check: CheckStatus;
  done: boolean; // F или M
  full: boolean; // F
  xpAwarded: number;
  coinsAwarded: number;
  occurredAt?: string;
  recordedAt: string;
  note?: string;
  transferredTo?: string;
  linkedFrom?: string;
  updatedAt: string;
}

export interface ReflectionEntry {
  date: string;
  gratitude?: string;
  contribution?: string;
  barrier?: BarrierKind;
  note?: string;
  updatedAt: string;
}

export interface UserSettings {
  characterReplies: boolean;
  animations: boolean;
  telegramMessages: boolean;
  reflections: boolean;
  analytics: boolean;
}

export interface AppState {
  onboarded: boolean;
  onboarding: OnboardingData | null;
  characterState: CharacterState;
  xp: number;
  coins: number;
  streak: number;
  energy: number; // 0..100 энергия дня
  entries: Record<string, DayEntry>;
  reflections: Record<string, ReflectionEntry>;
  transfers: Record<string, string>;
  pausedUntil: string | null;
  pro: boolean;
  founderLetterRead: boolean;
  lastResultMessage: string | null;
  dismissedHelpAt: string | null;
  settings: UserSettings;
}
