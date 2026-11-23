import { useState } from 'react';
import { useStore, formatUnit } from '../store';
import { useTelegram } from '../telegram';
import { homeScene, icons, stateImage } from '../data/assets';
import { Card, ProgressBar, StatChip } from '../components/ui';

const REASONS = [
  { key: 'forget', title: 'Забываю', advice: 'Можно изменить время напоминания или привязать действие к событию: после завтрака, после работы, перед сном.' },
  { key: 'time', title: 'Не хватает времени', advice: 'Попробуй уменьшить минимальную планку. Главное — сохранить действие в расписании.' },
  { key: 'hard', title: 'Слишком сложно', advice: 'Сделай действие проще: меньше объём, проще место, меньше подготовки.' },
  { key: 'schedule', title: 'Неудобное расписание', advice: 'Выбери другие дни или время. Прошлые результаты сохранятся.' },
  { key: 'want', title: 'Не хочется', advice: 'Проверь, зачем тебе эта привычка. Если ответ не находится, привычку можно заменить.' },
  { key: 'other', title: 'Другое', advice: 'Запиши коротко, что мешает. Часто уже это помогает выбрать следующий шаг.' },
];

export default function Home() {
  const { state, todayEntry, stage, dayNumber, isPaused, habitActiveToday, dispatch, today, weekStats, misses } = useStore();
  const { haptic } = useTelegram();
  const [reason, setReason] = useState<string | null>(null);
  const ob = state.onboarding!;
  const habit = ob.habit;
  const kind = ob.character;
  const done = todayEntry?.done ?? false;
  const full = todayEntry?.full ?? false;
  const status = isPaused ? 'Пауза. Прогресс сохранён.' : done ? 'Сегодня получилось.' : habitActiveToday ? 'Можно начать с минимума.' : 'Сегодня день отдыха по расписанию.';
  const progressText = `День ${dayNumber}/90 · выполнено ${weekStats.done} из ${weekStats.elapsedPlanned || 0} наступивших дней недели`;
  const selectedReason = REASONS.find(r => r.key === reason);

  const logToday = (value: number, note?: string) => {
    haptic('medium');
    dispatch({ type: 'LOG_ENTRY', date: today, value, note });
    setTimeout(() => dispatch({ type: 'SET_STATE', state: 'wait' }), 2200);
  };

  const askCustomResult = () => {
    if (habit.noQuantity) return logToday(1);
    const v = prompt(`Сколько получилось? Укажи число в ${habit.unit}.`, String(todayEntry?.value ?? habit.targetMin));
    if (v == null) return;
    logToday(Math.max(0, parseInt(v) || 0));
  };

  return (
    <div className="relative pb-6">
      <div className="relative h-44 overflow-hidden">
        <img src={homeScene(kind)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/80 via-cream/45 to-cream" />
        <div className="absolute left-4 top-4 right-4 flex items-center gap-3 rounded-3xl border border-white/70 bg-white/78 p-3 shadow-lg shadow-ink/10 backdrop-blur-md">
          {ob.heroEnabled && <img src={stateImage(kind, state.characterState, stage)} alt={ob.heroName} className={`w-24 h-24 object-contain drop-shadow-xl ${done ? 'animate-pop' : 'animate-floaty'}`} />}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-teal-800 uppercase tracking-wide">{ob.heroEnabled ? ob.heroName : 'Сегодня'}</div>
            <div className="font-black text-xl leading-tight text-ink">{status}</div>
            <div className="text-sm font-semibold text-ink/70 mt-1">{progressText}</div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-3 relative space-y-4">
        <Card className="p-5 animate-fade-up">
          <div className="text-xs font-bold text-ink/45 uppercase tracking-wide">{habit.sphere} · 90-дневный маршрут</div>
          <h1 className="text-2xl font-black leading-tight mt-1">Сегодня: {habit.name}</h1>
          {habit.anchorEvent && <div className="mt-2 text-sm text-ink/60">Удобный момент: {habit.anchorEvent}</div>}

          {isPaused ? (
            <div className="mt-5 rounded-2xl bg-white/70 border border-ink/10 p-4 text-sm text-ink/70">
              Привычка на паузе{state.pausedUntil ? ` до ${state.pausedUntil}` : ''}. Календарный маршрут продолжается, но дни паузы не считаются выполнением.
            </div>
          ) : !habitActiveToday ? (
            <div className="mt-5 rounded-2xl bg-white/70 border border-ink/10 p-4 text-sm text-ink/70">
              По твоему расписанию сегодня отдых. Он не считается пропуском.
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
                <div className="rounded-2xl bg-teal-50 border border-teal-100 p-3">
                  <div className="text-xs font-bold text-teal-700">Минимум</div>
                  <div className="text-lg font-black">{habit.noQuantity ? 'Сделано' : formatUnit(habit.targetMin, habit)}</div>
                </div>
                {!habit.noQuantity && <div className="rounded-2xl bg-orange-50 border border-orange-100 p-3">
                  <div className="text-xs font-bold text-orange-600">Полная цель</div>
                  <div className="text-lg font-black">{formatUnit(habit.targetGoal, habit)}</div>
                </div>}
              </div>

              {todayEntry && (
                <div className="mt-4 rounded-2xl bg-white/75 border border-ink/10 p-3 text-sm">
                  <b>Сегодня сохранено:</b> {habit.noQuantity ? 'сделано' : formatUnit(todayEntry.value, habit)}
                  {todayEntry.status === 'attempt' && <div className="text-ink/60 mt-1">Это попытка. Минимум пока не засчитан.</div>}
                </div>
              )}

              <div className={`mt-5 grid gap-2 ${habit.noQuantity ? 'grid-cols-1' : 'grid-cols-2 max-[380px]:grid-cols-1'}`}>
                <button onClick={() => logToday(habit.targetMin)} className="min-h-14 rounded-2xl bg-teal-700 px-3 py-3 text-white font-bold leading-tight active:scale-95 transition shadow-lg shadow-teal-900/20">
                  {habit.noQuantity ? 'Сделано' : 'Сделал минимум'}
                </button>
                {!habit.noQuantity && <button onClick={() => logToday(habit.targetGoal)} className="min-h-14 rounded-2xl bg-orange-500 px-3 py-3 text-white font-bold leading-tight active:scale-95 transition shadow-lg shadow-orange-900/20">Сделал полностью</button>}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {!habit.noQuantity && <button onClick={askCustomResult} className="text-sm font-semibold text-teal-800 underline underline-offset-4">Указать свой результат</button>}
                {todayEntry && <button onClick={() => dispatch({ type: 'CLEAR_ENTRY', date: today })} className="text-sm font-semibold text-ink/50 underline underline-offset-4">Исправить отметку</button>}
              </div>
            </>
          )}
        </Card>

        {state.lastResultMessage && (
          <Card className="p-4 border-teal-100 bg-teal-50/80 animate-pop">
            <div className="font-bold text-teal-800">{state.lastResultMessage}</div>
          </Card>
        )}

        {misses >= 2 && state.dismissedHelpAt !== today && (
          <Card className="p-4 animate-fade-up">
            <div className="font-black">Что сейчас мешает?</div>
            <div className="text-sm text-ink/60 mt-1">Ответ необязательный. Поможем подстроить план, если он неудобен.</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {REASONS.map(r => <button key={r.key} onClick={() => setReason(r.key)} className={`rounded-full px-3 py-2 text-sm font-semibold border ${reason === r.key ? 'bg-teal-700 text-white border-teal-700' : 'bg-white/80 border-ink/10'}`}>{r.title}</button>)}
            </div>
            {selectedReason && <div className="mt-3 rounded-2xl bg-white/75 border border-ink/10 p-3 text-sm text-ink/75">{selectedReason.advice}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => dispatch({ type: 'DISMISS_HELP' })} className="rounded-xl bg-white/80 border border-ink/10 px-3 py-2 text-sm font-semibold">Не сейчас</button>
              <button onClick={() => alert('Изменение плана будет доступно в настройках привычки на следующем шаге.')} className="rounded-xl bg-teal-700 text-white px-3 py-2 text-sm font-semibold">Изменить план</button>
            </div>
          </Card>
        )}

        <Card className="p-4 animate-fade-up">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span>Эта неделя</span>
            <span className="text-ink/50">{weekStats.done}/{weekStats.elapsedPlanned || weekStats.planned}</span>
          </div>
          <ProgressBar value={weekStats.done} max={Math.max(1, weekStats.elapsedPlanned || weekStats.planned)} barClass="bg-teal-600" />
          <div className="text-xs text-ink/50 mt-2">Запланировано до конца недели: {weekStats.planned}. Будущие дни не считаются пропусками.</div>
        </Card>

        <Card className="p-4 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatChip icon={icons.crystal} value={state.xp} label="XP" />
            <StatChip icon={icons.chip} value={state.coins} label="монет" />
            <StatChip icon={icons.battery} value={`${state.energy}/100`} label="энергия" />
          </div>
          <div className="mt-3 text-xs text-ink/55">Игровые награды — дополнение. Основной результат считается по твоему расписанию.</div>
        </Card>
      </div>
    </div>
  );
}
