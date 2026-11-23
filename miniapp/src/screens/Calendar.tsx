import { useMemo, useState } from 'react';
import { currentWeekBounds, isScheduled, planStats, todayStr } from '../store';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { icons } from '../data/assets';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function prevWeek(from: string) {
  const d = new Date(from);
  d.setDate(d.getDate() - 7);
  const to = new Date(d);
  to.setDate(d.getDate() + 6);
  return { from: todayStr(d), to: todayStr(to) };
}

export default function CalendarScreen() {
  const { state } = useStore();
  const habit = state.onboarding!.habit;
  const now = new Date();
  const today = todayStr(now);
  const [offset, setOffset] = useState(0);
  const view = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const y = view.getFullYear();
  const m = view.getMonth();

  const days = useMemo(() => {
    const total = daysInMonth(y, m);
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7;
    const cells: (string | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= total; d++) cells.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    return cells;
  }, [y, m]);

  const monthName = view.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const monthFrom = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const monthTo = `${y}-${String(m + 1).padStart(2, '0')}-${String(daysInMonth(y, m)).padStart(2, '0')}`;
  const monthStats = planStats(habit, state.entries, monthFrom, monthTo, state.pausedUntil);
  const week = currentWeekBounds();
  const weekStats = planStats(habit, state.entries, week.from, week.to, state.pausedUntil);
  const last = prevWeek(week.from);
  const lastStats = planStats(habit, state.entries, last.from, last.to, state.pausedUntil);

  const dayClass = (date: string) => {
    const e = state.entries[date];
    const scheduled = isScheduled(habit, date, state.pausedUntil);
    const future = date > today;
    const paused = state.pausedUntil && date <= state.pausedUntil && date >= today;
    if (e?.full) return 'bg-orange-500 text-white';
    if (e?.done) return 'bg-teal-600 text-white';
    if (e?.status === 'attempt') return 'bg-amber-100 text-amber-700';
    if (paused) return 'bg-sky-100 text-sky-700';
    if (!scheduled) return 'bg-ink/5 text-ink/30';
    if (future) return 'bg-white/80 text-ink/60 border border-ink/10';
    return 'bg-red-50 text-red-500 border border-red-100';
  };

  return (
    <div className="px-5 pt-8 pb-2">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setOffset(o => o - 1)} className="w-10 h-10 rounded-full bg-white/80 border border-ink/10 font-black">‹</button>
        <div className="font-black text-lg capitalize">{monthName}</div>
        <button onClick={() => setOffset(o => o + 1)} className="w-10 h-10 rounded-full bg-white/80 border border-ink/10 font-black">›</button>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-ink/40 mb-2">
          {WEEKDAYS.map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, i) => {
            if (!date) return <div key={i} />;
            return (
              <div key={date} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative ${dayClass(date)} ${date === today ? 'ring-2 ring-teal-900' : ''}`}>
                <span className="font-bold">{parseInt(date.slice(-2))}</span>
              </div>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 text-[11px] text-ink/60">
          <Legend color="bg-teal-600" text="минимум" />
          <Legend color="bg-orange-500" text="полная цель" />
          <Legend color="bg-red-50 border border-red-100" text="пропуск" />
          <Legend color="bg-ink/5" text="отдых" />
          <Legend color="bg-white border border-ink/10" text="ещё не наступило" />
          <Legend color="bg-sky-100" text="пауза" />
        </div>
      </Card>

      <Card className="p-4 mt-4">
        <div className="font-bold">Текущая неделя</div>
        <div className="text-sm text-ink/60 mt-1">
          Запланировано до конца недели — {weekStats.planned}. Уже наступило — {weekStats.elapsedPlanned}. Выполнено — {weekStats.done}.
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <Metric value={weekStats.min} label="минимум" />
          <Metric value={weekStats.full} label="полная цель" />
          <Metric value={weekStats.elapsedPlanned ? `${Math.round((weekStats.done / weekStats.elapsedPlanned) * 100)}%` : '—'} label="ритм" />
        </div>
      </Card>

      <Card className="p-4 mt-4 flex items-center gap-4">
        <img src={icons.cone} alt="" className="w-14 h-14 object-contain" />
        <div className="flex-1">
          <div className="font-bold">{habit.name}</div>
          <div className="text-sm text-ink/60">
            За месяц: {monthStats.done} из {monthStats.planned} запланированных дней.
            {lastStats.planned ? ` Прошлая неделя: ${lastStats.done}/${lastStats.planned}.` : ' За прошлую неделю пока нет данных.'}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Legend({ color, text }: { color: string; text: string }) {
  return <span className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded-full ${color}`} /> {text}</span>;
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return <div className="rounded-2xl bg-white/70 border border-ink/10 p-3"><div className="text-xl font-black">{value}</div><div className="text-xs text-ink/50">{label}</div></div>;
}
