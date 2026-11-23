import { useStore, planStats } from '../store';
import { stageImage, scenes } from '../data/assets';
import { Card, ProgressBar } from '../components/ui';

const STAGES = [
  { stage: 1, name: 'Старт', day: 1, text: 'Герой появляется рядом с первой привычкой.' },
  { stage: 2, name: 'Первый ритм', day: 7, text: 'Открывается после первой контрольной недели при выполнении хотя бы 60% плана.' },
  { stage: 3, name: 'Закрепление', day: 21, text: 'Проверяем, что расписание реально подходит.' },
  { stage: 4, name: 'Устойчивость', day: 45, text: 'Герой меняется вместе с твоей регулярностью.' },
  { stage: 5, name: 'Маршрут', day: 75, text: 'Финальная стадия 90-дневного цикла.' },
];

export default function Path() {
  const { state, stage, dayNumber } = useStore();
  const habit = state.onboarding!.habit;
  const kind = state.onboarding!.character;
  const stats = planStats(habit, state.entries, habit.startDate, new Date().toISOString().slice(0, 10), state.pausedUntil);
  const compliance = stats.elapsedPlanned ? Math.round((stats.done / stats.elapsedPlanned) * 100) : 0;
  const nextStage = STAGES.find(s => s.stage > stage);
  const nextProgress = nextStage ? Math.min(100, Math.round((dayNumber / nextStage.day) * 100)) : 100;

  return (
    <div className="px-5 pt-8 pb-2 space-y-4">
      <div className="relative rounded-3xl overflow-hidden h-52">
        <img src={scenes.workshopSunset} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="text-white/80 text-sm font-semibold">90-дневный маршрут · день {dayNumber}/90</div>
          <div className="text-white text-2xl font-black">Стадия {stage} — {STAGES[stage - 1].name}</div>
        </div>
        <img src={stageImage(kind, stage)} alt="" className="absolute -right-4 -top-6 h-56 object-contain drop-shadow-2xl" />
      </div>

      <Card className="p-4">
        <div className="flex justify-between text-sm font-semibold mb-2">
          <span>Соблюдение личного плана</span>
          <span className="text-ink/50">{stats.done}/{stats.elapsedPlanned || 0}</span>
        </div>
        <ProgressBar value={stats.done} max={Math.max(1, stats.elapsedPlanned)} barClass="bg-teal-600" />
        <div className="text-xs text-ink/50 mt-2">Текущий результат — {compliance}%. Для новых стадий ориентир — 60% запланированных действий.</div>
      </Card>

      {nextStage && (
        <Card className="p-4">
          <div className="font-bold">Следующая контрольная точка: день {nextStage.day}</div>
          <div className="text-sm text-ink/60 mt-1">Если к этому моменту выполнено не меньше 60% плана, откроется стадия «{nextStage.name}».</div>
          <ProgressBar value={nextProgress} max={100} barClass="bg-orange-500" className="mt-3" />
        </Card>
      )}

      <div className="space-y-3">
        {STAGES.map(s => {
          const reached = stage >= s.stage;
          const current = stage === s.stage;
          return (
            <Card key={s.stage} className={`p-4 flex items-center gap-4 ${current ? 'ring-2 ring-teal-600' : ''} ${!reached ? 'opacity-70' : ''}`}>
              <img src={stageImage(kind, reached ? s.stage : Math.max(1, stage))} alt="" className={`w-20 h-20 object-contain ${current ? 'animate-floaty' : ''}`} />
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-black">Стадия {s.stage} · {s.name}</span>
                  <span className="text-xs text-ink/50">день {s.day}</span>
                </div>
                <div className="text-xs text-ink/60 mt-1">{s.text}</div>
                {reached && <div className="text-xs text-teal-700 font-semibold mt-1">Открыта</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
