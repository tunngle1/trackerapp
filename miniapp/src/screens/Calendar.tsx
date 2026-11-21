import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { Card } from '../components/ui';
import { icons } from '../data/assets';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

export default function CalendarScreen() {
  const { state } = useStore();
  const now = new Date();
  const [offset, setOffset] = useState(0);
  const view = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const y = view.getFullYear();
  const m = view.getMonth();

  const days = useMemo(() => {
    const total = daysInMonth(y, m);
    const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // Пн=0
    const cells: (string | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= total; d++) {
      cells.push(`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
    }
    return cells;
  }, [y, m]);

  const monthName = view.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  const habit = state.onboarding?.habit;

  return (
    <div className="px-5 pt-8 pb-6">
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
            const e = state.entries[date];
            const isToday = date === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            return (
              <div
                key={date}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm relative ${isToday ? 'ring-2 ring-teal-600' : ''}`}
              >
                <span className={e?.done ? 'text-ink/40' : 'text-ink/80'}>{parseInt(date.slice(-2))}</span>
                {e?.full && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-0.5" />}
                {e?.done && !e.full && <div className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-0.5" />}
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-4 text-xs text-ink/60">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500" /> минимум</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> цель</span>
        </div>
      </Card>

      {/* Сводка месяца */}
      <Card className="p-4 mt-4 flex items-center gap-4">
        <img src={icons.cone} alt="" className="w-14 h-14 object-contain" />
        <div className="flex-1">
          <div className="font-bold">{habit?.name ?? 'Привычка'}</div>
          <div className="text-sm text-ink/60">
            Выполнено: {Object.values(state.entries).filter(e => e.done).length} дней ·
            Текущая серия: {state.streak} дн.
          </div>
        </div>
      </Card>
    </div>
  );
}
