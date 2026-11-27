import { useState } from 'react';
import { useStore, formatUnit } from '../store';
import { useTelegram } from '../telegram';
import { homeScene, icons, stateImage } from '../data/assets';
import { Card, ProgressBar, StatChip } from '../components/ui';
import DailyReflection from './DailyReflection';
import { characterLine, contextForBarrier } from '../data/content';
import type { BarrierKind } from '../types';

const REASONS: { key: BarrierKind; title: string; advice: string }[] = [
  { key: 'time', title: 'Не хватает времени', advice: 'Проверь реальное окно и при необходимости уменьши объём.' },
  { key: 'forget', title: 'Забываю', advice: 'Выбери напоминание или опору после знакомого события.' },
  { key: 'start', title: 'Сложно начать', advice: 'Сделай первый шаг настолько простым, чтобы он занял пару минут.' },
  { key: 'conflict', title: 'Конфликт планов', advice: 'Выбери приоритет или перенеси действие до наступления срока.' },
  { key: 'energy', title: 'Мало сил', advice: 'Можно оставить минимум, сделать паузу или пересмотреть план.' },
  { key: 'other', title: 'Другое', advice: 'Запиши, что именно мешает. Это поможет выбрать следующий шаг.' },
];

export default function Home() {
  const { state, todayEntry, stage, dayNumber, isPaused, habitActiveToday, dispatch, today, weekStats, misses } = useStore();
  const { haptic } = useTelegram();
  const [reason, setReason] = useState<BarrierKind | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(todayEntry?.note ?? '');
  const ob = state.onboarding!;
  const habit = ob.habit;
  const kind = ob.character;
  const check = todayEntry?.check;
  const status = isPaused ? 'Пауза. Прогресс сохранён.' : check === 'F' || check === 'M' ? 'Сегодня получилось.' : check === 'P' ? 'Попытка сохранена.' : check === 'S' ? 'Отсутствие отмечено честно.' : habitActiveToday ? 'Можно начать с минимума.' : 'Сегодня день отдыха по расписанию.';
  const progressText = `День ${dayNumber}/90 · выполнено ${weekStats.done} из ${weekStats.elapsedPlanned || 0} наступивших дней недели`;
  const selectedReason = REASONS.find(r => r.key === reason);
  const context = reason ? contextForBarrier(reason) : null;

  const logToday = (value: number, noteText?: string) => {
    haptic('medium');
    dispatch({ type: 'LOG_ENTRY', date: today, value, note: noteText });
    setTimeout(() => dispatch({ type: 'SET_STATE', state: 'wait' }), 2200);
  };

  const askCustomResult = () => {
    if (habit.noQuantity) return logToday(1, note.trim() || undefined);
    const v = prompt(`Сколько получилось? Укажи число в ${habit.unit}.`, String(todayEntry?.value ?? habit.targetMin));
    if (v == null) return;
    logToday(Math.max(0, parseInt(v) || 0), note.trim() || undefined);
  };

  const transferToday = () => {
    const target = prompt('На какую дату перенести? Формат ГГГГ-ММ-ДД', today);
    if (!target) return;
    dispatch({ type: 'TRANSFER', from: today, to: target.trim() });
  };

  return (
    <div className="relative pb-6">
      <div className="relative h-44 overflow-hidden">
        <img src={homeScene(kind)} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/80 via-cream/45 to-cream" />
        <div className="absolute left-4 top-4 right-4 flex items-center gap-3 rounded-3xl border border-white/70 bg-white/78 p-3 shadow-lg shadow-ink/10 backdrop-blur-md">
          {ob.heroEnabled && <img src={stateImage(kind, state.characterState, stage)} alt={ob.heroName} className={`w-24 h-24 object-contain drop-shadow-xl ${check === 'F' || check === 'M' ? 'animate-pop' : 'animate-floaty'}`} />}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black text-teal-800 uppercase tracking-wide">{ob.heroEnabled ? ob.heroName : 'Сегодня'}</div>
            <div className="font-black text-xl leading-tight text-ink">{status}</div>
            <div className="text-sm font-semibold text-ink/70 mt-1">{progressText}</div>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-3 relative space-y-4">
        <Card className="p-5 animate-fade-up">
          <div className="text-xs font-bold text-ink/45 uppercase tracking-wide">{habit.sphere} · версия плана {habit.version}</div>
          <h1 className="text-2xl font-black leading-tight mt-1">Сегодня: {habit.name}</h1>
          {habit.anchorEvent && <div className="mt-2 text-sm text-ink/60">Удобный момент: {habit.anchorEvent}</div>}

          {isPaused ? (
            <div className="mt-5 rounded-2xl bg-white/70 border border-ink/10 p-4 text-sm text-ink/70">
              Привычка на паузе{state.pausedUntil ? ` до ${state.pausedUntil}` : ''}. Пауза исключается из действующего плана, а история сохраняется.
            </div>
          ) : !habitActiveToday ? (
            <div className="mt-5 rounded-2xl bg-white/70 border border-ink/10 p-4 text-sm text-ink/70">
              По действующему плану сегодня нет обязательства. Отдых и перенос не считаются пропуском.
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 max-[380px]:grid-cols-1">
                <div className="rounded-2xl bg-teal-50 border border-teal-100 p-3">
                  <div className="text-xs font-bold text-teal-700">Минимум · M</div>
                  <div className="text-lg font-black">{habit.noQuantity ? 'Сделано' : formatUnit(habit.targetMin, habit)}</div>
                </div>
                {!habit.noQuantity && <div className="rounded-2xl bg-orange-50 border border-orange-100 p-3">
                  <div className="text-xs font-bold text-orange-600">Обычная цель · F</div>
                  <div className="text-lg font-black">{formatUnit(habit.targetGoal, habit)}</div>
                </div>}
              </div>

              {todayEntry && (
                <div className="mt-4 rounded-2xl bg-white/75 border border-ink/10 p-3 text-sm">
                  <b>Сохранено:</b> {todayEntry.check === 'S' ? 'действия не было' : habit.noQuantity ? 'сделано' : formatUnit(todayEntry.value, habit)}
                  {todayEntry.check === 'P' && <div className="text-ink/60 mt-1">Факт ниже минимума учтён отдельно, без игрового зачёта.</div>}
                  {todayEntry.note && <div className="text-ink/60 mt-1">Заметка: {todayEntry.note}</div>}
                </div>
              )}

              <div className={`mt-5 grid gap-2 ${habit.noQuantity ? 'grid-cols-1' : 'grid-cols-2 max-[380px]:grid-cols-1'}`}>
                <button onClick={() => logToday(habit.targetMin, note.trim() || undefined)} className="min-h-14 rounded-2xl bg-teal-700 px-3 py-3 text-white font-bold leading-tight active:scale-95 transition shadow-lg shadow-teal-900/20">
                  {habit.noQuantity ? 'Сделано' : 'M · минимум'}
                </button>
                {!habit.noQuantity && <button onClick={() => logToday(habit.targetGoal, note.trim() || undefined)} className="min-h-14 rounded-2xl bg-orange-500 px-3 py-3 text-white font-bold leading-tight active:scale-95 transition shadow-lg shadow-orange-900/20">F · полностью</button>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 max-[380px]:grid-cols-1">
                {!habit.noQuantity && <button onClick={askCustomResult} className="min-h-11 rounded-2xl border border-ink/10 bg-white/75 px-3 py-2 text-sm font-bold text-teal-800">Свой результат / P</button>}
                <button onClick={() => dispatch({ type: 'LOG_CHECK', date: today, check: 'S', note: note.trim() || undefined })} className="min-h-11 rounded-2xl border border-ink/10 bg-white/75 px-3 py-2 text-sm font-bold text-ink/70">S · не было</button>
                {!todayEntry && <button onClick={transferToday} className="min-h-11 rounded-2xl border border-ink/10 bg-white/75 px-3 py-2 text-sm font-bold text-ink/70">Перенести</button>}
                <button onClick={() => setNoteOpen(v => !v)} className="min-h-11 rounded-2xl border border-ink/10 bg-white/75 px-3 py-2 text-sm font-bold text-ink/70">Заметка</button>
              </div>
              {noteOpen && <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="mt-3 w-full rounded-2xl border border-ink/10 bg-white/75 p-3 text-sm outline-none focus:border-teal-600" placeholder="Что важно сохранить об этом дне?" />}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {todayEntry && <button onClick={() => dispatch({ type: 'CLEAR_ENTRY', date: today })} className="text-sm font-semibold text-ink/50 underline underline-offset-4">Исправить отметку</button>}
                <button onClick={() => setReason('other')} className="text-sm font-semibold text-teal-800 underline underline-offset-4">Что мешает?</button>
              </div>
            </>
          )}
        </Card>

        {state.lastResultMessage && (
          <Card className="p-4 border-teal-100 bg-teal-50/80 animate-pop">
            <div className="font-bold text-teal-800">{state.lastResultMessage}</div>
          </Card>
        )}

        {(misses >= 2 || reason) && state.dismissedHelpAt !== today && (
          <Card className="p-4 animate-fade-up">
            <div className="font-black">Что сейчас мешает?</div>
            <div className="text-sm text-ink/60 mt-1">Ответ необязательный. Это факт для подстройки плана, а не оценка тебя.</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {REASONS.map(r => <button key={r.key} onClick={() => { setReason(r.key); dispatch({ type: 'RECORD_BARRIER', date: today, barrier: r.key }); }} className={`rounded-full px-3 py-2 text-sm font-semibold border ${reason === r.key ? 'bg-teal-700 text-white border-teal-700' : 'bg-white/80 border-ink/10'}`}>{r.title}</button>)}
            </div>
            {selectedReason && context && <div className="mt-3 rounded-2xl bg-white/75 border border-ink/10 p-3 text-sm text-ink/75"><b>{context.text}</b><br />{selectedReason.advice}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => dispatch({ type: 'DISMISS_HELP' })} className="rounded-xl bg-white/80 border border-ink/10 px-3 py-2 text-sm font-semibold">Не сейчас</button>
            </div>
          </Card>
        )}

        <DailyReflection />

        <Card className="p-4 animate-fade-up">
          <div className="flex justify-between text-sm font-semibold mb-2">
            <span>Эта неделя</span>
            <span className="text-ink/50">{weekStats.done}/{weekStats.elapsedPlanned || weekStats.planned}</span>
          </div>
          <ProgressBar value={weekStats.done} max={Math.max(1, weekStats.elapsedPlanned || weekStats.planned)} barClass="bg-teal-600" />
          <div className="text-xs text-ink/50 mt-2">F={weekStats.full}, M={weekStats.min}, P={weekStats.attempts}, S={weekStats.skipped}, U={weekStats.unknown}. Будущие дни не считаются пропусками.</div>
        </Card>

        <Card className="p-4 animate-fade-up">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatChip icon={icons.crystal} value={state.xp} label="XP" />
            <StatChip icon={icons.chip} value={state.coins} label="монет" />
            <StatChip icon={icons.battery} value={`${state.energy}/3`} label="энергия" />
          </div>
          <div className="mt-3 text-xs text-ink/55">Зачёт: 10 XP и 1 монета за уникальный день с F или M. P, S и внеплановые действия сохраняются без игровой награды.</div>
          {state.settings.characterReplies && <div className="mt-3 rounded-2xl bg-cream-dark/50 p-3 text-sm text-ink/70"><b>{ob.heroName}:</b> {characterLine(kind, today, 'today_opened')}</div>}
        </Card>
      </div>
    </div>
  );
}
