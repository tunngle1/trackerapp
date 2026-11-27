import { activeDays, useStore } from '../store';
import { stageImage, scenes } from '../data/assets';
import { Card, ProgressBar } from '../components/ui';

const STAGES = [
  { stage: 1, name: 'Старт', active: 0, text: 'Герой появляется рядом с первой привычкой.' },
  { stage: 2, name: 'Первый ритм', active: 15, text: 'Открывается после 15 уникальных дней с F или M.' },
  { stage: 3, name: 'Закрепление', active: 30, text: 'Считаются дни, а не количество привычек за один день.' },
  { stage: 4, name: 'Устойчивость', active: 60, text: 'Герой меняется вместе с регулярностью.' },
  { stage: 5, name: 'Маршрут', active: 90, text: 'Финальная стадия по активным дням.' },
];

export default function Path() {
  const { state, stage, dayNumber } = useStore();
  const habit = state.onboarding!.habit;
  const kind = state.onboarding!.character;
  const days = activeDays(state.entries, habit.id);
  const nextStage = STAGES.find(s => s.stage > stage);
  const nextProgress = nextStage ? Math.min(100, Math.round((days / nextStage.active) * 100)) : 100;

  return (
    <div className="px-5 pt-8 pb-2 space-y-4">
      <div className="relative rounded-3xl overflow-hidden h-52">
        <img src={scenes.workshopSunset} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="text-white/80 text-sm font-semibold">90-дневный маршрут · день {dayNumber}/90</div>
          <div className="text-white text-xl min-[390px]:text-2xl font-black leading-tight">Стадия {stage} — {STAGES[stage - 1].name}</div>
        </div>
        <img src={stageImage(kind, stage)} alt="" className="absolute -right-6 min-[390px]:-right-4 -top-2 min-[390px]:-top-6 h-48 min-[390px]:h-56 object-contain drop-shadow-2xl" />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm font-semibold mb-2">
          <span>Активные дни с F или M</span>
          <span className="text-ink/50">{days}/90</span>
        </div>
        <ProgressBar value={days} max={90} barClass="bg-teal-600" />
        <div className="text-xs text-ink/50 mt-2">Один день засчитывается один раз, независимо от количества действий. P и S сохраняются как факты без XP.</div>
      </Card>

      {nextStage && (
        <Card className="p-4">
          <div className="font-bold">Следующая стадия: {nextStage.active} активных дней</div>
          <div className="text-sm text-ink/60 mt-1">До стадии «{nextStage.name}» осталось {Math.max(0, nextStage.active - days)}.</div>
          <ProgressBar value={nextProgress} max={100} barClass="bg-orange-500" className="mt-3" />
        </Card>
      )}

      <div className="space-y-3">
        {STAGES.map(s => {
          const reached = stage >= s.stage;
          const current = stage === s.stage;
          return (
            <Card key={s.stage} className={`p-3 min-[390px]:p-4 flex items-center gap-3 min-[390px]:gap-4 ${current ? 'ring-2 ring-teal-600' : ''} ${!reached ? 'opacity-70' : ''}`}>
              <img src={stageImage(kind, reached ? s.stage : Math.max(1, stage))} alt="" className={`w-16 h-16 min-[390px]:w-20 min-[390px]:h-20 object-contain shrink-0 ${current && state.settings.animations ? 'animate-floaty' : ''}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap justify-between items-baseline gap-x-2 gap-y-1">
                  <span className="font-black">Стадия {s.stage} · {s.name}</span>
                  <span className="text-xs text-ink/50">{s.active} дней</span>
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
