import { useStore, currentWeekBounds, planStats } from '../store';
import { Card, ProgressBar } from '../components/ui';
import { icons, scenes, stageImage } from '../data/assets';

function previousPeriod(from: string, days: number) {
  const start = new Date(from);
  start.setDate(start.getDate() - days);
  const end = new Date(start);
  end.setDate(start.getDate() + days - 1);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: fmt(start), to: fmt(end) };
}

export default function Progress() {
  const { state, stage } = useStore();
  const habit = state.onboarding!.habit;
  const kind = state.onboarding!.character;
  const week = currentWeekBounds();
  const weekData = planStats(habit, state.entries, week.from, week.to, state.pausedUntil);
  const prev = previousPeriod(week.from, 7);
  const prevWeek = planStats(habit, state.entries, prev.from, prev.to, state.pausedUntil);
  const totalDone = Object.values(state.entries).filter(e => e.habitId === habit.id && e.done).length;
  const totalFull = Object.values(state.entries).filter(e => e.habitId === habit.id && e.full).length;

  const createStoryCard = async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#0f766e');
    gradient.addColorStop(0.55, '#fdf6ec');
    gradient.addColorStop(1, '#fdba74');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);
    ctx.fillStyle = 'rgba(255,255,255,0.82)';
    roundRect(ctx, 90, 210, 900, 1220, 64);
    ctx.fill();

    ctx.fillStyle = '#2b2118';
    ctx.font = '700 54px Segoe UI, Arial';
    ctx.fillText('Мои доказательства', 150, 330);
    ctx.font = '900 140px Segoe UI, Arial';
    ctx.fillStyle = '#0f766e';
    ctx.fillText(String(totalDone), 150, 520);
    ctx.font = '600 44px Segoe UI, Arial';
    ctx.fillStyle = '#2b2118';
    wrapText(ctx, `раз(а) я выполнил(а): ${habit.name}`, 150, 610, 760, 58);
    ctx.font = '500 38px Segoe UI, Arial';
    ctx.fillStyle = 'rgba(43,33,24,0.72)';
    wrapText(ctx, `За эту неделю: ${weekData.done} из ${weekData.elapsedPlanned || weekData.planned} наступивших запланированных дней. Полная цель — ${weekData.full} раз(а).`, 150, 800, 760, 52);

    const hero = await loadImage(stageImage(kind, stage));
    ctx.drawImage(hero, 300, 1040, 480, 480);
    ctx.fillStyle = '#2b2118';
    ctx.font = '700 36px Segoe UI, Arial';
    ctx.fillText('MeWeGo', 150, 1640);
    ctx.font = '400 30px Segoe UI, Arial';
    ctx.fillStyle = 'rgba(43,33,24,0.65)';
    ctx.fillText('Сохраняю ритм по своему расписанию', 150, 1690);

    const link = document.createElement('a');
    link.download = `mewego-story-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="px-5 pt-4 pb-6 space-y-4">
      <div className="relative rounded-3xl overflow-hidden">
        <img src={scenes.nightCity} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/20" />
        <div className="relative p-5 min-[390px]:p-6 text-white">
          <div className="text-white/70 text-sm font-semibold">Мои доказательства</div>
          <div className="text-4xl font-black mt-1">{totalDone}</div>
          <div className="text-white/80">выполненных дней с привычкой</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={createStoryCard} className="min-h-10 rounded-xl bg-white text-teal-800 font-bold leading-tight px-4 py-2 text-sm active:scale-95">
              Сохранить карточку
            </button>
          </div>
        </div>
      </div>

      <Card className="p-5">
        <div className="font-bold mb-4">Неделя по твоему расписанию</div>
        <div className="grid grid-cols-2 gap-3 min-[390px]:gap-4 max-[340px]:grid-cols-1">
          <div>
            <div className="text-xs text-ink/50 mb-1">Эта неделя</div>
            <div className="text-2xl min-[390px]:text-3xl font-black text-teal-700">{weekData.done}/{weekData.elapsedPlanned || weekData.planned}</div>
            <ProgressBar value={weekData.done} max={Math.max(1, weekData.elapsedPlanned || weekData.planned)} barClass="bg-teal-600" className="mt-2" />
          </div>
          <div>
            <div className="text-xs text-ink/50 mb-1">Прошлая неделя</div>
            <div className="text-2xl min-[390px]:text-3xl font-black text-ink/40">{prevWeek.planned ? `${prevWeek.done}/${prevWeek.planned}` : 'нет данных'}</div>
            <ProgressBar value={prevWeek.done} max={Math.max(1, prevWeek.planned)} barClass="bg-ink/20" className="mt-2" />
          </div>
        </div>
        {prevWeek.planned > 0 && weekData.done !== prevWeek.done && (
          <div className="mt-3 text-sm font-semibold text-teal-700">
            {weekData.done > prevWeek.done ? `На ${weekData.done - prevWeek.done} больше, чем на прошлой неделе.` : `На ${prevWeek.done - weekData.done} меньше, чем на прошлой неделе.`}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-2 min-[390px]:gap-3">
        {[
          { icon: icons.gear, v: state.xp, l: 'XP' },
          { icon: icons.chip, v: state.coins, l: 'монет' },
          { icon: icons.battery, v: `${state.energy}/100`, l: 'энергия' },
        ].map(s => (
          <Card key={s.l} className="p-3 flex flex-col items-center">
            <img src={s.icon} alt="" className="w-8 h-8 object-contain" />
            <div className="text-xl font-black mt-1">{s.v}</div>
            <div className="text-xs text-ink/50">{s.l}</div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="font-bold mb-2">Что видно сейчас</div>
        <ul className="text-sm text-ink/70 space-y-2">
          <li>• Всего выполнено: {totalDone}. Полная цель — {totalFull}.</li>
          {weekData.elapsedPlanned > 0 && <li>• На этой неделе выполнено {weekData.done} из {weekData.elapsedPlanned} наступивших запланированных дней.</li>}
          {weekData.done === 0 && <li>• Сегодня можно начать с минимума. Этого достаточно, чтобы маршрут продолжился.</li>}
          {weekData.done > 0 && <li>• План можно оставить как есть, если такой ритм тебе подходит.</li>}
        </ul>
      </Card>
    </div>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  for (const word of words) {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = `${word} `;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}
