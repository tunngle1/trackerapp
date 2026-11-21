import { useStore } from '../store';
import { Card, ProgressBar } from '../components/ui';
import { icons, scenes } from '../data/assets';

function weekStats(entries: Record<string, { done: boolean }>) {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const monday = new Date(now); monday.setDate(now.getDate() - dow);
  const prevMonday = new Date(monday); prevMonday.setDate(monday.getDate() - 7);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const count = (from: Date) => {
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(from); d.setDate(from.getDate() + i);
      if (entries[fmt(d)]?.done) n++;
    }
    return n;
  };
  return { thisWeek: count(monday), lastWeek: count(prevMonday) };
}

export default function Progress() {
  const { state, stage } = useStore();
  const { thisWeek, lastWeek } = weekStats(state.entries);
  const habit = state.onboarding?.habit;
  const totalDone = Object.values(state.entries).filter(e => e.done).length;
  const totalFull = Object.values(state.entries).filter(e => e.full).length;

  // карточка-доказательство для сторис
  const shareCard = () => {
    // TODO: сгенерировать PNG на canvas и отправить в Telegram
    alert(`День ${totalDone} · серия ${state.streak} дн. · ${totalFull} полных целей\nСкоро: генерация картинки для сторис`);
  };

  return (
    <div className="px-5 pt-8 pb-6 space-y-4">
      {/* Заголовок с доказательством */}
      <div className="relative rounded-3xl overflow-hidden">
        <img src={scenes.nightCity} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-ink/20" />
        <div className="relative p-6 text-white">
          <div className="text-white/70 text-sm font-semibold">Мои доказательства</div>
          <div className="text-4xl font-black mt-1">{totalDone}</div>
          <div className="text-white/80">дней с {habit?.name ?? 'привычкой'}</div>
          <div className="mt-3 flex gap-2">
            <button onClick={shareCard} className="rounded-xl bg-white text-teal-800 font-bold px-4 py-2 text-sm active:scale-95">
              Поделиться в сторис
            </button>
          </div>
        </div>
      </div>

      {/* Сравнение недель */}
      <Card className="p-5">
        <div className="font-bold mb-4">Динамика недель</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-ink/50 mb-1">Эта неделя</div>
            <div className="text-3xl font-black text-teal-700">{thisWeek}/7</div>
            <ProgressBar value={thisWeek} max={7} barClass="bg-teal-600" className="mt-2" />
          </div>
          <div>
            <div className="text-xs text-ink/50 mb-1">Прошлая неделя</div>
            <div className="text-3xl font-black text-ink/40">{lastWeek}/7</div>
            <ProgressBar value={lastWeek} max={7} barClass="bg-ink/20" className="mt-2" />
          </div>
        </div>
        {thisWeek > lastWeek && (
          <div className="mt-3 text-sm font-semibold text-teal-700">
            ▲ +{thisWeek - lastWeek} {thisWeek - lastWeek === 1 ? 'день' : 'дней'} к прошлой неделе
          </div>
        )}
      </Card>

      {/* Общая статистика */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: icons.gear, v: state.xp, l: 'XP' },
          { icon: icons.chip, v: state.coins, l: 'монет' },
          { icon: icons.battery, v: state.energy, l: 'энергия' },
        ].map(s => (
          <Card key={s.l} className="p-3 flex flex-col items-center">
            <img src={s.icon} alt="" className="w-8 h-8 object-contain" />
            <div className="text-xl font-black mt-1">{s.v}</div>
            <div className="text-xs text-ink/50">{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Рекомендации */}
      <Card className="p-4">
        <div className="font-bold mb-2">Рекомендации</div>
        <ul className="text-sm text-ink/70 space-y-2">
          {state.streak >= 7 && <li>• Серия {state.streak} дней — не допускай пропусков, заморозка серии доступна в Pro.</li>}
          {totalDone < 7 && <li>• До первой недельной отметки осталось {7 - totalDone} дн. Цель — минимум, не перфекционизм.</li>}
          <li>• Делай привычку в одно и то же время — так она закрепляется быстрее.</li>
          {stage < 5 && <li>• До стадии {stage + 1} ещё {([80, 250, 500, 900][stage] ?? 900) - state.xp} XP — ежедневные отметки ускорят рост.</li>}
        </ul>
      </Card>
    </div>
  );
}
