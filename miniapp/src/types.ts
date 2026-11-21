export type CharacterKind = 'robot' | 'cat';
export type CharacterState = 'wait' | 'sleep' | 'celebrate' | 'return';

export interface Habit {
  name: string;
  /** Цель — полный объём (вторая планка) */
  targetGoal: number;
  /** Минимум — зачитываемый объём (первая планка) */
  targetMin: number;
  unit: string;
  /** Дни недели 0=Вс … 6=Сб, в которые привычка активна */
  days: number[];
  reminderTime: string | null; // "HH:MM"
  reminderOn: boolean;
}

export interface OnboardingData {
  referralCode: string;
  source: string;
  codeWord: string;
  character: CharacterKind;
  trackName: string;
  habit: Habit;
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  value: number; // выполненный объём
  done: boolean; // достигнут минимум
  full: boolean; // достигнута цель
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
}
