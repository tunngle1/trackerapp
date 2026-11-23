export type CharacterKind = 'robot' | 'cat';
export type CharacterState = 'wait' | 'sleep' | 'celebrate' | 'return';
export type Sphere = 'Дело' | 'Тело' | 'Жизнь';
export type UnitKind = 'minutes' | 'hours' | 'pages' | 'km' | 'reps' | 'times' | 'custom' | 'none';
export type EntryStatus = 'attempt' | 'minimum' | 'full';

export interface Habit {
  id: string;
  name: string;
  sphere: Sphere;
  /** Цель — полный объём. Для привычки без числа равно 1. */
  targetGoal: number;
  /** Минимум — зачитываемый объём. Для привычки без числа равно 1. */
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
  date: string; // YYYY-MM-DD
  habitId: string;
  value: number; // выполненный объём, для noQuantity = 1
  status: EntryStatus;
  done: boolean; // достигнут минимум
  full: boolean; // достигнута цель
  xpAwarded: number;
  coinsAwarded: number;
  note?: string;
  updatedAt: string;
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
  pausedUntil: string | null;
  pro: boolean;
  founderLetterRead: boolean;
  lastResultMessage: string | null;
  dismissedHelpAt: string | null;
}
