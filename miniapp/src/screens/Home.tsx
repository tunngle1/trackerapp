import { useStore } from '../store';
import { useTelegram } from '../telegram';
import { homeScene, icons, stateImage } from '../data/assets';
import { Card, ProgressBar, StatChip, PrimaryButton } from '../components/ui';
import { messageForDay } from '../data/messages';

export default function Home() {
  const { state, todayEntry, stage, dayNumber, isPaused, habitActiveToday, dispatch, today } = useStore();
  const { haptic } = useTelegram();
  const ob = state.onboarding!;
  const habit = ob.habit;
  const kind = ob.character;
  const entry = todayEntry;
  const done = entry?.done ?? false;
  const msg = messageForDay(dayNumber);
  const hour = new Date().getHours();

  const logToday = (value: number) => {
    haptic('medium');
    dispatch({ type: 'LOG_ENTRY', date: today, value });
    dispatch({ type: 'SET_STATE', state: 'celebrate' });
    setTimeout(() => dispatch({ type: 'SET_STATE', state: value >= habit.targetMin ? 'wait' : 'wait' }), 2500);
  };

  const evening = hour >= 18;

  return (
    <div className="relative">
      {/* Шапка-сцена */}
      <div className="relative h-64 overflow-hidden">
        <img src={homeScene(kind)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/0 via-transparent to-cream" />
        <div className="absolute top-4 left-4 right-4 flex gap-2 flex-wrap">
          <StatChip icon={icons.crystal} value={state.xp} label="XP" />
          <StatChip icon={icons.chip} value={state.coins} label="монет" />
          <StatChip value={`⚡${state.energy}`} label="энергия" />
        </div>
        <div className="absolute bottom-2 left-0 right-0 flex justify-center">
          <img
            src={stateImage(kind, isPaused ? 'sleep' : done ? 'celebrate' : evening ? 'sleep' : 'wait', stage)}
            alt={kind === 'robot' ? 'МейВиГо' : 'Пушок'}
            className={`h-44 object-contain drop-shadow-xl ${done ? 'animate-pop' : 'animate-floaty'}`}
          />
        </div>
      </div>

      <div className="px-5 -mt-6 relative space-y-4 pb-6">
        {/* Приветствие дня */}
        <Card className="p-4 animate-fade-up">
          <div className="text-xs font-bold text-teal-700 uppercase tracking-wide">День {dayNumber} · серия {state.streak}🔥</div>
          <p className="mt-1 text-sm text-ink/80">{evening ? msg.evening : msg.morning}</p>
        </Card>

        {/* Карточка привычки */}
        <Card className="p-5 animate-fade-up">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-ink/50 font-semibold">{ob.trackName}</div>
              <div className="text-xl font-black">{habit.name}</div>
            </div>
            {state.streak > 0 && (
              <div className="rounded-full bg-orange-100 text-orange-600 font-bold px-3 py-1 text-sm">
                {state.streak} дн.
              </div>
            )}
          </div>

          {isPaused ? (
            <div className="mt-4 text-center text-ink/60 py-6">
              Привычка на паузе{state.pausedUntil ? ` до ${state.pausedUntil}` : ''}
            </div>
          ) : !habitActiveToday ? (
            <div className="mt-4 text-center text-ink/60 py-6">
              Сегодня выходной по расписанию 🎉
            </div>
          ) : (
            <>
              {/* Две планки */}
              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-teal-700">Минимум · {habit.targetMin} {habit.unit}</span>
                    <span className="text-ink/50">{entry?.value ?? 0}</span>
                  </div>
                  <ProgressBar
                    value={Math.min(entry?.value ?? 0, habit.targetMin)}
                    max={habit.targetMin}
                    barClass={done ? 'bg-teal-600' : 'bg-teal-400'}
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-orange-600">Цель · {habit.targetGoal} {habit.unit}</span>
                    <span className="text-ink/50">{entry?.value ?? 0}</span>
                  </div>
                  <ProgressBar
                    value={Math.min(entry?.value ?? 0, habit.targetGoal)}
                    max={habit.targetGoal}
                    barClass={entry?.full ? 'bg-orange-500' : 'bg-orange-300'}
                  />
                </div>
              </div>

              {/* Отметка в одно касание */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                <button
                  onClick={() => logToday(habit.targetMin)}
                  className="rounded-2xl bg-teal-600 text-white font-bold py-4 active:scale-95 transition shadow-lg shadow-teal-900/20"
                >
                  ✓ Сделал
                </button>
                <button
                  onClick={() => logToday(Math.round((habit.targetMin + habit.targetGoal) / 2))}
                  className="rounded-2xl bg-orange-500 text-white font-bold py-4 active:scale-95 transition shadow-lg shadow-orange-900/20"
                >
                  ★ Больше
                </button>
                <button
                  onClick={() => {
                    const v = prompt(`Сколько ${habit.unit}? (0–${habit.targetGoal})`, String(entry?.value ?? habit.targetMin));
                    if (v != null) logToday(Math.max(0, Math.min(habit.targetGoal, parseInt(v) || 0)));
                  }}
                  className="rounded-2xl border border-ink/15 bg-white/80 font-bold py-4 active:scale-95 transition"
                >
                  ✎ Свой
                </button>
              </div>
            </>
          )}
        </Card>

        {/* Вечерняя вылазка */}
        <Card className="p-4 flex items-center gap-4 animate-fade-up">
          <img src={icons.battery} alt="" className="w-14 h-14 object-contain" />
          <div className="flex-1">
            <div className="font-bold">Вечерняя вылазка</div>
            <div className="text-sm text-ink/60">
              {done ? 'Выполнено — +энергия и монеты' : 'Сделай привычку и получи бонус'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-black text-teal-700">+15⚡</div>
            <div className="text-xs text-ink/50">+5 монет</div>
          </div>
        </Card>

        {/* Энергия дня */}
        <Card className="p-4 animate-fade-up">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span>Энергия дня</span>
            <span className="text-ink/50">{state.energy}/100</span>
          </div>
          <ProgressBar value={state.energy} max={100} barClass="bg-gradient-to-r from-amber-400 to-orange-500" />
        </Card>
      </div>
    </div>
  );
}
