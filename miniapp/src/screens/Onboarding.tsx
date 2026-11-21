import { useState } from 'react';
import { useStore } from '../store';
import { useTelegram } from '../telegram';
import { botImgs, cat, icons, robot, scenes } from '../data/assets';
import { PrimaryButton, GhostButton } from '../components/ui';
import type { CharacterKind, Habit } from '../types';

const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const SOURCES = ['Друг/подруга', 'TikTok / Reels', 'Telegram-канал', 'Реклама', 'Другое'];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { dispatch } = useStore();
  const { haptic } = useTelegram();
  const [step, setStep] = useState(0);
  const [referral, setReferral] = useState('');
  const [source, setSource] = useState('');
  const [codeWord, setCodeWord] = useState('');
  const [character, setCharacter] = useState<CharacterKind>('robot');
  const [trackName, setTrackName] = useState('');
  const [habitName, setHabitName] = useState('');
  const [minVal, setMinVal] = useState('10');
  const [goalVal, setGoalVal] = useState('30');
  const [unit, setUnit] = useState('мин');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [reminderOn, setReminderOn] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');

  const totalSteps = 5;

  const finish = () => {
    const habit: Habit = {
      name: habitName || trackName || 'Моя привычка',
      targetMin: Math.max(1, parseInt(minVal) || 10),
      targetGoal: Math.max(parseInt(goalVal) || 30, parseInt(minVal) || 10),
      unit,
      days: days.length ? days : [1, 2, 3, 4, 5, 6],
      reminderOn,
      reminderTime: reminderOn ? reminderTime : null,
    };
    dispatch({
      type: 'COMPLETE_ONBOARDING',
      payload: {
        referralCode: referral.trim(),
        source,
        codeWord: codeWord.trim(),
        character,
        trackName: trackName.trim() || 'Мой путь',
        habit,
      },
    });
    haptic('heavy');
    onDone();
  };

  const next = () => { haptic('light'); setStep(s => Math.min(s + 1, totalSteps)); };
  const back = () => { haptic('light'); setStep(s => Math.max(s - 1, 0)); };

  return (
    <div className="app-shell">
      <div className="scroll-area relative">
        {/* Шаг 0 — приветствие */}
        {step === 0 && (
          <div className="relative min-h-[100dvh] flex flex-col">
            <img src={scenes.nightCity} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-transparent to-cream" />
            <div className="relative flex-1 flex flex-col items-center justify-end px-6 pb-10">
              <img src={botImgs.duoGreeting} alt="MeWeGo" className="w-56 h-56 object-contain animate-floaty drop-shadow-2xl" />
              <h1 className="text-4xl font-black text-white drop-shadow-lg mt-2">MeWeGo</h1>
              <p className="text-white/90 text-center mt-2 mb-6 text-lg">
                Трекер привычек с питомцем-компаньоном.<br />Маленькие шаги — большой путь.
              </p>
              <PrimaryButton onClick={next} className="!bg-white !text-teal-800">Начать путь</PrimaryButton>
              <p className="text-white/60 text-xs mt-4">2 минуты · без регистрации</p>
            </div>
          </div>
        )}

        {/* Шаг 1 — обращение: кодовое слово, источник, реферал */}
        {step === 1 && (
          <div className="px-6 pt-10 pb-8 animate-fade-up">
            <h2 className="text-2xl font-black">Как ты о нас узнал?</h2>
            <p className="text-ink/60 mt-1 mb-6">Это поможет нам стать лучше</p>

            <label className="block text-sm font-semibold mb-1.5">Кодовое слово <span className="text-ink/40 font-normal">(если есть)</span></label>
            <input
              value={codeWord}
              onChange={e => setCodeWord(e.target.value)}
              placeholder="Например: КОТ"
              className="w-full rounded-2xl border border-ink/15 bg-white/80 px-4 py-3 mb-5 outline-none focus:border-teal-600"
            />

            <label className="block text-sm font-semibold mb-1.5">Откуда пришёл?</label>
            <div className="flex flex-wrap gap-2 mb-5">
              {SOURCES.map(s => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${source === s ? 'bg-teal-700 text-white border-teal-700' : 'bg-white/70 border-ink/15'}`}
                >
                  {s}
                </button>
              ))}
            </div>

            <label className="block text-sm font-semibold mb-1.5">Код друга / ссылка-приглашение</label>
            <input
              value={referral}
              onChange={e => setReferral(e.target.value)}
              placeholder="Необязательно"
              className="w-full rounded-2xl border border-ink/15 bg-white/80 px-4 py-3 outline-none focus:border-teal-600"
            />

            <div className="flex gap-3 mt-8">
              <GhostButton onClick={back} className="flex-1">Назад</GhostButton>
              <PrimaryButton onClick={next} className="flex-[2]">Дальше</PrimaryButton>
            </div>
          </div>
        )}

        {/* Шаг 2 — выбор персонажа */}
        {step === 2 && (
          <div className="px-6 pt-10 pb-8 animate-fade-up">
            <h2 className="text-2xl font-black">Выбери компаньона</h2>
            <p className="text-ink/60 mt-1 mb-6">Он будет расти вместе с твоими привычками — 5 стадий</p>
            <div className="grid grid-cols-2 gap-4">
              {([
                { kind: 'robot' as CharacterKind, name: 'МейВиГо', desc: 'Робот-исследователь', img: robot.stage1 },
                { kind: 'cat' as CharacterKind, name: 'Пушок', desc: 'Кот-путешественник', img: cat.stage1 },
              ]).map(c => (
                <button
                  key={c.kind}
                  onClick={() => { setCharacter(c.kind); haptic('light'); }}
                  className={`card p-4 flex flex-col items-center transition active:scale-95 ${character === c.kind ? 'ring-4 ring-teal-600' : 'opacity-80'}`}
                >
                  <img src={c.img} alt={c.name} className="w-32 h-32 object-contain" />
                  <div className="font-black text-lg">{c.name}</div>
                  <div className="text-xs text-ink/50">{c.desc}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <GhostButton onClick={back} className="flex-1">Назад</GhostButton>
              <PrimaryButton onClick={next} className="flex-[2]">Дальше</PrimaryButton>
            </div>
          </div>
        )}

        {/* Шаг 3 — трек и привычка с двумя планками */}
        {step === 3 && (
          <div className="px-6 pt-10 pb-8 animate-fade-up">
            <h2 className="text-2xl font-black">Твой трек и привычка</h2>
            <p className="text-ink/60 mt-1 mb-6">Одна привычка. Две планки: минимум и цель.</p>

            <label className="block text-sm font-semibold mb-1.5">Название трека</label>
            <input
              value={trackName}
              onChange={e => setTrackName(e.target.value)}
              placeholder="Например: Здоровье / Продуктивность"
              className="w-full rounded-2xl border border-ink/15 bg-white/80 px-4 py-3 mb-4 outline-none focus:border-teal-600"
            />

            <label className="block text-sm font-semibold mb-1.5">Привычка</label>
            <input
              value={habitName}
              onChange={e => setHabitName(e.target.value)}
              placeholder="Например: Зарядка"
              className="w-full rounded-2xl border border-ink/15 bg-white/80 px-4 py-3 mb-4 outline-none focus:border-teal-600"
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Планка-минимум</label>
                <input
                  type="number" min={1} value={minVal}
                  onChange={e => setMinVal(e.target.value)}
                  className="w-full rounded-2xl border border-ink/15 bg-white/80 px-4 py-3 outline-none focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Цель</label>
                <input
                  type="number" min={1} value={goalVal}
                  onChange={e => setGoalVal(e.target.value)}
                  className="w-full rounded-2xl border border-ink/15 bg-white/80 px-4 py-3 outline-none focus:border-teal-600"
                />
              </div>
            </div>

            <label className="block text-sm font-semibold mb-1.5">Единица измерения</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {['мин', 'страниц', 'км', 'стаканов', 'раз', 'ккал', 'часов'].map(u => (
                <button
                  key={u}
                  onClick={() => setUnit(u)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold border transition ${unit === u ? 'bg-orange-500 text-white border-orange-500' : 'bg-white/70 border-ink/15'}`}
                >
                  {u}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-4">
              <GhostButton onClick={back} className="flex-1">Назад</GhostButton>
              <PrimaryButton onClick={next} className="flex-[2]">Дальше</PrimaryButton>
            </div>
          </div>
        )}

        {/* Шаг 4 — расписание и напоминания */}
        {step === 4 && (
          <div className="px-6 pt-10 pb-8 animate-fade-up">
            <h2 className="text-2xl font-black">Когда тренируемся?</h2>
            <p className="text-ink/60 mt-1 mb-6">Выбери дни и время напоминания</p>

            <label className="block text-sm font-semibold mb-2">Дни недели</label>
            <div className="flex gap-2 mb-6">
              {WEEKDAYS.map((w, i) => {
                const active = days.includes(i);
                return (
                  <button
                    key={w}
                    onClick={() => {
                      haptic('light');
                      setDays(ds => active ? ds.filter(d => d !== i) : [...ds, i].sort());
                    }}
                    className={`flex-1 rounded-xl py-2.5 font-bold text-sm border transition ${active ? 'bg-teal-700 text-white border-teal-700' : 'bg-white/70 border-ink/15'}`}
                  >
                    {w}
                  </button>
                );
              })}
            </div>

            <label className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">Напоминание в боте</span>
              <button
                onClick={() => setReminderOn(v => !v)}
                className={`w-12 h-7 rounded-full transition relative ${reminderOn ? 'bg-teal-600' : 'bg-ink/20'}`}
              >
                <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${reminderOn ? 'left-6' : 'left-1'}`} />
              </button>
            </label>
            {reminderOn && (
              <input
                type="time"
                value={reminderTime}
                onChange={e => setReminderTime(e.target.value)}
                className="w-full rounded-2xl border border-ink/15 bg-white/80 px-4 py-3 mb-6 outline-none focus:border-teal-600"
              />
            )}

            <div className="flex items-center gap-2 text-xs text-ink/50 mb-6">
              <img src={icons.gear} alt="" className="w-5 h-5" />
              <span>Персонаж получит имя и первую стадию сразу после старта</span>
            </div>

            <div className="flex gap-3">
              <GhostButton onClick={back} className="flex-1">Назад</GhostButton>
              <PrimaryButton onClick={finish} className="flex-[2]">Начать путь</PrimaryButton>
            </div>
          </div>
        )}

        {/* Финал — появление персонажа */}
        {step === totalSteps && (
          <div className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center">
            <img src={character === 'robot' ? scenes.workshopSunset : scenes.catCorner} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-cream/60" />
            <div className="relative animate-pop">
              <img
                src={character === 'robot' ? robot.celebrateCompanion : cat.celebrateMeWeGo}
                alt=""
                className="w-52 h-52 object-contain drop-shadow-2xl"
              />
            </div>
            <h2 className="relative text-3xl font-black mt-4">
              {character === 'robot' ? 'МейВиГо' : 'Пушок'} уже с тобой!
            </h2>
            <p className="relative text-ink/70 mt-2 mb-8">
              Трек «{trackName || 'Мой путь'}» создан.<br />
              Первый шаг сделан — иди в главное меню.
            </p>
            <PrimaryButton onClick={onDone} className="relative">В путь!</PrimaryButton>
          </div>
        )}

        {step > 0 && step < totalSteps && (
          <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-teal-600' : 'w-1.5 bg-ink/20'}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
