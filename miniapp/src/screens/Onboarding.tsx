import { useMemo, useState } from 'react';
import { useStore, todayStr } from '../store';
import { useTelegram } from '../telegram';
import { botImgs, cat, icons, robot, scenes } from '../data/assets';
import { PrimaryButton, GhostButton } from '../components/ui';
import type { CharacterKind, Habit, Sphere, UnitKind } from '../types';

const WEEKDAYS = [
  { d: 1, label: 'Пн' }, { d: 2, label: 'Вт' }, { d: 3, label: 'Ср' }, { d: 4, label: 'Чт' },
  { d: 5, label: 'Пт' }, { d: 6, label: 'Сб' }, { d: 0, label: 'Вс' },
];
const SPHERES: { id: Sphere; title: string; text: string; icon: string }[] = [
  { id: 'Дело', title: 'Дело', text: 'работа, обучение, проекты, деньги', icon: icons.chip },
  { id: 'Тело', title: 'Тело', text: 'движение, сон, питание, здоровье', icon: icons.battery },
  { id: 'Жизнь', title: 'Жизнь', text: 'отношения, дом, личное время, увлечения', icon: icons.flower },
];
const UNITS: { kind: UnitKind; label: string; unit: string; helper: string }[] = [
  { kind: 'minutes', label: 'Минуты', unit: 'мин', helper: '5 и 20 минут' },
  { kind: 'hours', label: 'Часы', unit: 'ч', helper: '1 и 2 часа' },
  { kind: 'pages', label: 'Страницы', unit: 'стр.', helper: '5 и 15 страниц' },
  { kind: 'km', label: 'Километры', unit: 'км', helper: '1 и 3 км' },
  { kind: 'reps', label: 'Повторения', unit: 'повт.', helper: '10 и 30 повторений' },
  { kind: 'times', label: 'Количество раз', unit: 'раз', helper: '1 и 3 раза' },
  { kind: 'none', label: 'Без числа', unit: 'раз', helper: 'достаточно факта выполнения' },
  { kind: 'custom', label: 'Другая', unit: '', helper: 'своя единица' },
];

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const { dispatch } = useStore();
  const { haptic } = useTelegram();
  const [step, setStep] = useState(0);
  const [sphere, setSphere] = useState<Sphere>('Дело');
  const [habitName, setHabitName] = useState('');
  const [minVal, setMinVal] = useState('5');
  const [goalVal, setGoalVal] = useState('20');
  const [unitKind, setUnitKind] = useState<UnitKind>('minutes');
  const [customUnit, setCustomUnit] = useState('');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [reminderOn, setReminderOn] = useState(true);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [startDate, setStartDate] = useState(todayStr());
  const [anchorEvent, setAnchorEvent] = useState('');
  const [character, setCharacter] = useState<CharacterKind>('robot');
  const [heroName, setHeroName] = useState('МиВиГо');
  const [heroEnabled, setHeroEnabled] = useState(true);

  const totalSteps = 7;
  const selectedUnit = UNITS.find(u => u.kind === unitKind) ?? UNITS[0];
  const noQuantity = unitKind === 'none';
  const unit = unitKind === 'custom' ? (customUnit.trim() || 'раз') : selectedUnit.unit;
  const minNum = noQuantity ? 1 : Math.max(1, parseInt(minVal) || 1);
  const goalNum = noQuantity ? 1 : Math.max(minNum, parseInt(goalVal) || minNum);
  const canContinue = useMemo(() => {
    if (step === 2) return habitName.trim().length >= 2;
    if (step === 3 && !noQuantity) return minNum <= goalNum;
    if (step === 4 && unitKind === 'custom') return customUnit.trim().length > 0;
    if (step === 5) return days.length > 0 && Boolean(startDate);
    return true;
  }, [step, habitName, noQuantity, minNum, goalNum, unitKind, customUnit, days.length, startDate]);

  const next = () => { if (!canContinue) return; haptic('light'); setStep(s => Math.min(s + 1, totalSteps)); };
  const back = () => { haptic('light'); setStep(s => Math.max(s - 1, 0)); };

  const finish = () => {
    const id = crypto.randomUUID?.() ?? `habit-${Date.now()}`;
    const habit: Habit = {
      id,
      name: habitName.trim(),
      sphere,
      targetMin: minNum,
      targetGoal: goalNum,
      unit,
      unitKind,
      noQuantity,
      days: days.length ? days : [1, 2, 3, 4, 5],
      reminderOn,
      reminderTime: reminderOn ? reminderTime : null,
      startDate,
      anchorEvent: anchorEvent.trim(),
      cycleDays: 90,
    };
    dispatch({
      type: 'COMPLETE_ONBOARDING',
      payload: {
        referralCode: '',
        source: '',
        codeWord: '',
        character,
        heroName: heroName.trim() || (character === 'cat' ? 'Пушок' : 'МиВиГо'),
        heroEnabled,
        trackName: sphere,
        habit,
      },
    });
    haptic('heavy');
    onDone();
  };

  return (
    <div className="app-shell">
      <div className="scroll-area relative">
        {step === 0 && (
          <div className="relative min-h-[100dvh] flex flex-col">
            <img src={scenes.nightCity} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/10 to-cream" />
            <div className="relative flex-1 flex flex-col justify-end px-5 pb-8 min-[390px]:px-6 min-[390px]:pb-9">
              <div className="relative h-52 min-[390px]:h-64 mb-3">
                <img src={botImgs.duoGreeting} alt="" className="absolute inset-x-0 bottom-0 mx-auto w-64 h-64 min-[390px]:w-72 min-[390px]:h-72 object-contain animate-floaty drop-shadow-2xl mix-blend-normal" />
              </div>
              <h1 className="text-3xl font-black text-white drop-shadow-lg leading-tight">Что ты давно хочешь начать, но всё откладываешь?</h1>
              <p className="text-white/90 mt-3 mb-6 text-base leading-relaxed">
                Выбери одно действие. Отмечай, когда сделал. Смотри, как меняется твой результат.
              </p>
              <PrimaryButton onClick={next} className="!bg-teal-700 !text-white shadow-2xl">Начать бесплатно</PrimaryButton>
              <p className="text-white/75 text-xs mt-4 text-center">Тестовый доступ открыт: все функции доступны бесплатно.</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <StepFrame title="Что хочешь привести в порядок?" step={step} total={totalSteps} onBack={back} onNext={next}>
            <div className="space-y-3">
              {SPHERES.map(s => (
                <button key={s.id} onClick={() => { setSphere(s.id); haptic('light'); }} className={`card w-full p-4 flex items-center gap-4 text-left transition border-2 ${sphere === s.id ? 'border-teal-600 bg-teal-50 shadow-teal-900/10' : 'border-transparent'}`}>
                  <img src={s.icon} alt="" className="w-14 h-14 object-contain" />
                  <span className="flex-1"><b className="block text-lg uppercase">{s.title}</b><span className="text-sm text-ink/60">{s.text}</span></span>
                  {sphere === s.id && <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white text-sm font-black">✓</span>}
                </button>
              ))}
            </div>
          </StepFrame>
        )}

        {step === 2 && (
          <StepFrame title="Что именно хочешь делать?" subtitle="Напиши своими словами. Мы не будем заменять формулировку." step={step} total={totalSteps} onBack={back} onNext={next} disabled={!canContinue}>
            <textarea value={habitName} onChange={e => setHabitName(e.target.value)} placeholder="Например: учить английский каждый день" rows={4} className="w-full rounded-3xl border border-ink/15 bg-white/85 px-4 py-4 outline-none focus:border-teal-600 text-lg" />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-ink/55 max-[360px]:grid-cols-1">
              <Example text="Читать перед сном" onPick={setHabitName} />
              <Example text="Гулять после работы" onPick={setHabitName} />
              <Example text="Работать над проектом" onPick={setHabitName} />
              <Example text="Делать зарядку" onPick={setHabitName} />
            </div>
          </StepFrame>
        )}

        {step === 3 && (
          <StepFrame title="Две планки" subtitle="Минимум — на сложный день. Цель — когда всё идёт по плану." step={step} total={totalSteps} onBack={back} onNext={next} disabled={!canContinue}>
            {noQuantity ? (
              <div className="card p-4 text-sm text-ink/70">Для этой привычки достаточно факта выполнения. На главном экране будет одна кнопка «Сделано».</div>
            ) : (
              <div className="space-y-4">
                <label className="block"><span className="text-sm font-semibold">Сколько готов делать даже в сложный день?</span><input type="number" min={1} value={minVal} onChange={e => setMinVal(e.target.value)} className="mt-1 w-full rounded-2xl border border-ink/15 bg-white/85 px-4 py-3 outline-none focus:border-teal-600" /></label>
                <label className="block"><span className="text-sm font-semibold">А сколько хочешь делать, когда всё идёт по плану?</span><input type="number" min={minNum} value={goalVal} onChange={e => setGoalVal(e.target.value)} className="mt-1 w-full rounded-2xl border border-ink/15 bg-white/85 px-4 py-3 outline-none focus:border-teal-600" /></label>
                {minNum > goalNum && <div className="text-sm text-red-600">Минимум должен быть меньше или равен цели.</div>}
              </div>
            )}
          </StepFrame>
        )}

        {step === 4 && (
          <StepFrame title="Как это измерять?" subtitle="Единица будет одинаковой для минимума и полной цели." step={step} total={totalSteps} onBack={back} onNext={next} disabled={!canContinue}>
            <div className="grid grid-cols-2 gap-2 max-[360px]:grid-cols-1">
              {UNITS.map(u => (
                <button key={u.kind} onClick={() => { setUnitKind(u.kind); haptic('light'); }} className={`rounded-2xl border p-3 text-left transition ${unitKind === u.kind ? 'bg-teal-700 text-white border-teal-700' : 'bg-white/80 border-ink/15'}`}>
                  <b className="block">{u.label}</b><span className="text-xs opacity-70">{u.helper}</span>
                </button>
              ))}
            </div>
            {unitKind === 'custom' && <input value={customUnit} onChange={e => setCustomUnit(e.target.value)} placeholder="Например: задач" className="mt-4 w-full rounded-2xl border border-ink/15 bg-white/85 px-4 py-3 outline-none focus:border-teal-600" />}
          </StepFrame>
        )}

        {step === 5 && (
          <StepFrame title="Когда будем это делать?" step={step} total={totalSteps} onBack={back} onNext={next} disabled={!canContinue}>
            <label className="block text-sm font-semibold mb-2">Дни недели</label>
            <div className="grid grid-cols-7 gap-1.5 min-[390px]:gap-2 mb-5">
              {WEEKDAYS.map(w => {
                const active = days.includes(w.d);
                return <button key={w.d} onClick={() => setDays(ds => active ? ds.filter(d => d !== w.d) : [...ds, w.d].sort())} className={`min-h-10 rounded-xl px-0.5 py-2 font-bold text-xs min-[390px]:text-sm border transition ${active ? 'bg-teal-700 text-white border-teal-700' : 'bg-white/80 border-ink/15'}`}>{w.label}</button>;
              })}
            </div>
            <label className="block text-sm font-semibold mb-1.5">Дата начала</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-2xl border border-ink/15 bg-white/85 px-4 py-3 mb-4 outline-none focus:border-teal-600" />
            <label className="block text-sm font-semibold mb-1.5">После какого события удобно делать?</label>
            <input value={anchorEvent} onChange={e => setAnchorEvent(e.target.value)} placeholder="Например: после завтрака" className="w-full rounded-2xl border border-ink/15 bg-white/85 px-4 py-3 mb-4 outline-none focus:border-teal-600" />
            <label className="flex items-center justify-between mb-2"><span className="text-sm font-semibold">Напоминание</span><button onClick={() => setReminderOn(v => !v)} className={`w-12 h-7 rounded-full transition relative ${reminderOn ? 'bg-teal-600' : 'bg-ink/20'}`}><span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${reminderOn ? 'left-6' : 'left-1'}`} /></button></label>
            {reminderOn && <input type="time" value={reminderTime} onChange={e => setReminderTime(e.target.value)} className="w-full rounded-2xl border border-ink/15 bg-white/85 px-4 py-3 outline-none focus:border-teal-600" />}
          </StepFrame>
        )}

        {step === 6 && (
          <StepFrame title="Хочешь героя рядом?" subtitle="Кошечка или робот помогают сделать путь заметнее. Можно продолжить без активного сопровождения." step={step} total={totalSteps} onBack={back} onNext={next}>
            <div className="grid grid-cols-2 gap-3 min-[390px]:gap-4 mb-4">
              {[{ kind: 'robot' as CharacterKind, img: robot.stage1, name: 'Робот' }, { kind: 'cat' as CharacterKind, img: cat.stage1, name: 'Кошечка' }].map(c => (
                <button key={c.kind} onClick={() => { setCharacter(c.kind); if (!heroName || heroName === 'Пушок' || heroName === 'МиВиГо') setHeroName(c.kind === 'cat' ? 'Пушок' : 'МиВиГо'); }} className={`card p-4 ${character === c.kind ? 'ring-4 ring-teal-600' : ''}`}>
                  <img src={c.img} alt="" className="w-24 h-24 min-[390px]:w-32 min-[390px]:h-32 object-contain mx-auto" /><b>{c.name}</b>
                </button>
              ))}
            </div>
            <label className="block text-sm font-semibold mb-1.5">Имя героя</label>
            <input value={heroName} onChange={e => setHeroName(e.target.value)} className="w-full rounded-2xl border border-ink/15 bg-white/85 px-4 py-3 mb-4 outline-none focus:border-teal-600" />
            <label className="flex gap-3 items-center text-sm"><input type="checkbox" checked={heroEnabled} onChange={e => setHeroEnabled(e.target.checked)} className="w-5 h-5" /> Показывать героя и игровые реакции</label>
          </StepFrame>
        )}

        {step === 7 && (
          <div className="relative min-h-[100dvh] px-6 pt-10 pb-8 flex flex-col">
            <img src={character === 'robot' ? scenes.workshopSunset : scenes.catCorner} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-cream/75" />
            <div className="relative flex-1 flex flex-col justify-center">
              {heroEnabled && <img src={character === 'robot' ? robot.celebrateCompanion : cat.celebrateMeWeGo} alt="" className="w-44 h-44 object-contain mx-auto drop-shadow-2xl animate-pop" />}
              <h2 className="text-3xl font-black mt-3">План готов</h2>
              <div className="card p-4 mt-4 space-y-2 text-sm">
                <div><b>Привычка:</b> {habitName || 'Моя привычка'}</div>
                <div><b>Минимум:</b> {noQuantity ? 'факт выполнения' : `${minNum} ${unit}`}</div>
                {!noQuantity && <div><b>Полная цель:</b> {goalNum} {unit}</div>}
                <div><b>Расписание:</b> {days.map(d => WEEKDAYS.find(w => w.d === d)?.label).filter(Boolean).join(', ')}</div>
                {anchorEvent.trim() && <div><b>Удобный момент:</b> {anchorEvent.trim()}</div>}
              </div>
              <PrimaryButton onClick={finish} className="mt-6">Начать</PrimaryButton>
              <GhostButton onClick={back} className="mt-3 w-full">Назад</GhostButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StepFrame({ title, subtitle, step, total, children, onBack, onNext, disabled }: {
  title: string; subtitle?: string; step: number; total: number; children: React.ReactNode; onBack: () => void; onNext: () => void; disabled?: boolean;
}) {
  return (
    <div className="px-5 min-[390px]:px-6 pt-12 pb-8 animate-fade-up">
      <div className="absolute top-4 left-0 right-0 flex justify-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i + 1 === step ? 'w-6 bg-teal-600' : 'w-1.5 bg-ink/20'}`} />)}
      </div>
      <h2 className="text-[1.35rem] min-[390px]:text-2xl font-black leading-tight">{title}</h2>
      {subtitle && <p className="text-ink/60 mt-1 mb-6">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}
      {children}
      <div className="grid grid-cols-[1fr_2fr] gap-3 mt-8 max-[340px]:grid-cols-1">
        <GhostButton onClick={onBack} className="flex-1">Назад</GhostButton>
        <PrimaryButton onClick={onNext} disabled={disabled} className="flex-[2]">Дальше</PrimaryButton>
      </div>
    </div>
  );
}

function Example({ text, onPick }: { text: string; onPick: (value: string) => void }) {
  return <button onClick={() => onPick(text)} className="rounded-2xl border border-ink/10 bg-white/70 px-3 py-2 text-left active:scale-[0.98]">{text}</button>;
}
