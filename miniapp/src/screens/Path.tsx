import { useStore } from '../store';
import { stageImage, scenes } from '../data/assets';
import { Card, ProgressBar } from '../components/ui';

const STAGE_XP = [0, 80, 250, 500, 900];
const STAGE_NAMES = ['Эскиз', 'Контур', 'Форма', 'Характер', 'Легенда'];

export default function Path() {
  const { state, stage } = useStore();
  const kind = state.onboarding!.character;
  const xp = state.xp;

  return (
    <div className="px-5 pt-8 pb-6 space-y-4">
      <div className="relative rounded-3xl overflow-hidden h-52">
        <img src={scenes.workshopSunset} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="text-white/80 text-sm font-semibold">Мой путь · {state.onboarding!.trackName}</div>
          <div className="text-white text-2xl font-black">Стадия {stage} — {STAGE_NAMES[stage - 1]}</div>
        </div>
        <img src={stageImage(kind, stage)} alt="" className="absolute -right-4 -top-6 h-56 object-contain drop-shadow-2xl" />
      </div>

      {/* Лестница стадий */}
      <div className="space-y-3">
        {STAGE_NAMES.map((name, i) => {
          const s = i + 1;
          const reached = stage >= s;
          const isCurrent = stage === s;
          return (
            <Card key={s} className={`p-4 flex items-center gap-4 ${isCurrent ? 'ring-2 ring-teal-600' : ''} ${!reached ? 'opacity-60' : ''}`}>
              <img
                src={stageImage(kind, reached ? s : 1)}
                alt=""
                className={`w-20 h-20 object-contain ${isCurrent ? 'animate-floaty' : ''}`}
              />
              <div className="flex-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-black">Стадия {s} · {name}</span>
                  <span className="text-xs text-ink/50">{STAGE_XP[i]} XP</span>
                </div>
                {isCurrent && (
                  <div className="mt-2">
                    <ProgressBar
                      value={xp - STAGE_XP[i]}
                      max={STAGE_XP[i + 1] ? STAGE_XP[i + 1] - STAGE_XP[i] : 200}
                      barClass="bg-teal-600"
                    />
                    <div className="text-xs text-ink/50 mt-1">
                      до след. стадии: {(STAGE_XP[i + 1] ?? STAGE_XP[i] + 200) - xp} XP
                    </div>
                  </div>
                )}
                {stage > s && <div className="text-xs text-teal-700 font-semibold mt-1">✓ Пройдено</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
