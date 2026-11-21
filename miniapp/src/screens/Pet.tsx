import { useStore } from '../store';
import { roomScene, stateImage, icons, cat, robot } from '../data/assets';
import { Card, PrimaryButton } from '../components/ui';
import { useTelegram } from '../telegram';

const SHOP_ITEMS = [
  { icon: icons.shell, name: 'Ракушка друга', price: 50, desc: 'Украшение для комнаты' },
  { icon: icons.spring, name: 'Пружина энергии', price: 80, desc: '+10 энергии разово' },
  { icon: icons.maple, name: 'Осенний лист', price: 120, desc: 'Редкий декор' },
  { icon: icons.crystal, name: 'Кристалл пути', price: 200, desc: 'Особый предмет' },
];

export default function Pet() {
  const { state, stage, dispatch } = useStore();
  const { haptic } = useTelegram();
  const kind = state.onboarding!.character;
  const hour = new Date().getHours();
  const scene = roomScene(kind, hour);
  const asleep = hour >= 22 || hour < 7;

  return (
    <div className="px-5 pt-8 pb-6 space-y-4">
      {/* Комната персонажа */}
      <div className="relative rounded-3xl overflow-hidden h-80">
        <img src={scene} alt="Комната" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <img
            src={stateImage(kind, asleep ? 'sleep' : 'wait', stage)}
            alt=""
            className={`h-52 object-contain drop-shadow-2xl ${asleep ? '' : 'animate-floaty'}`}
          />
        </div>
        <div className="absolute top-3 left-3 rounded-full bg-ink/50 text-white text-xs font-bold px-3 py-1.5 backdrop-blur">
          {asleep ? 'Спит 😴' : kind === 'robot' ? 'Мастерская' : 'Комната кота'}
        </div>
      </div>

      {/* Декор — все иконки задействованы */}
      <Card className="p-4">
        <div className="font-bold mb-3">Комната · декор</div>
        <div className="grid grid-cols-4 gap-3">
          {[icons.quill, icons.flower, icons.bolt, icons.chip, icons.shell, icons.stone, icons.cone, icons.gear, icons.crystal, icons.spring, icons.battery, icons.maple].map((ic, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <img src={ic} alt="" className="w-12 h-12 object-contain" />
              <span className="text-[10px] text-ink/40">#{i + 1}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Магазин за монеты */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold">Магазин</div>
          <div className="text-sm font-bold text-amber-600">{state.coins} монет</div>
        </div>
        <div className="space-y-2">
          {SHOP_ITEMS.map(item => (
            <div key={item.name} className="flex items-center gap-3 rounded-2xl bg-white/70 border border-ink/10 p-3">
              <img src={item.icon} alt="" className="w-11 h-11 object-contain" />
              <div className="flex-1">
                <div className="font-semibold text-sm">{item.name}</div>
                <div className="text-xs text-ink/50">{item.desc}</div>
              </div>
              <button
                onClick={() => {
                  if (state.coins >= item.price) {
                    dispatch({ type: 'ADD_COINS', amount: -item.price });
                    haptic('medium');
                  }
                }}
                className={`rounded-xl px-3 py-1.5 text-sm font-bold ${state.coins >= item.price ? 'bg-amber-500 text-white' : 'bg-ink/10 text-ink/40'}`}
              >
                {item.price}¢
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Альбом персонажа — все варианты */}
      <Card className="p-4">
        <div className="font-bold mb-3">Альбом {kind === 'robot' ? 'МейВиГо' : 'Пушка'}</div>
        <div className="grid grid-cols-3 gap-2">
          {(kind === 'robot'
            ? [robot.stage1, robot.stage2, robot.stage3, robot.stage3Alt, robot.stage4, robot.stage4Alt, robot.stage5, robot.stage5Alt, robot.sportRoute]
            : [cat.stage1, cat.stage1Alt, cat.stage2, cat.stage3, cat.stage3Alt, cat.stage4, cat.stage4Alt, cat.stage5, cat.stage5Alt]
          ).map((src, i) => (
            <div key={i} className="rounded-2xl bg-cream-dark/60 aspect-square flex items-center justify-center overflow-hidden">
              <img src={src} alt="" className="w-full h-full object-contain p-1" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
