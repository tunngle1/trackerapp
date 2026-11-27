import { useState } from 'react';
import { useStore } from '../store';
import { botImgs, icons, stageImage } from '../data/assets';
import { Card, GhostButton } from '../components/ui';
import { useTelegram } from '../telegram';
import type { UserSettings } from '../types';

const SETTING_LABELS: { key: keyof UserSettings; label: string; hint: string }[] = [
  { key: 'characterReplies', label: 'Реплики героя', hint: 'Можно выключить, трекер продолжит работать.' },
  { key: 'animations', label: 'Анимации', hint: 'Отдельная настройка движения.' },
  { key: 'telegramMessages', label: 'Telegram-напоминания', hint: 'Локальный флаг до подключения бота.' },
  { key: 'reflections', label: 'Вопросы дня', hint: 'Благодарность и вклад остаются добровольными.' },
  { key: 'analytics', label: 'Наблюдения', hint: 'Показывать только осторожные факты по записям.' },
];

export default function Profile() {
  const { state, dispatch, stage } = useStore();
  const { haptic } = useTelegram();
  const ob = state.onboarding!;
  const [showLetter, setShowLetter] = useState(!state.founderLetterRead);

  const editHabit = () => {
    const name = prompt('Название привычки', ob.habit.name);
    if (name === null) return;
    const min = prompt(`Минимум (${ob.habit.unit})`, String(ob.habit.targetMin));
    if (min === null) return;
    const goal = prompt(`Обычная цель (${ob.habit.unit})`, String(ob.habit.targetGoal));
    if (goal === null) return;
    const daysInput = prompt('Дни недели: 0=Вс, 1=Пн … 6=Сб. Через запятую.', ob.habit.days.join(','));
    if (daysInput === null) return;
    const anchor = prompt('После какого события удобно делать действие?', ob.habit.anchorEvent);
    if (anchor === null) return;
    const reminder = prompt('Время напоминания ЧЧ:ММ, пусто — выключить', ob.habit.reminderTime ?? '');
    if (reminder === null) return;
    const minValue = Math.max(1, parseInt(min) || ob.habit.targetMin);
    const goalValue = Math.max(minValue, parseInt(goal) || ob.habit.targetGoal);
    const nextDays = daysInput.split(',').map(v => parseInt(v.trim())).filter(v => v >= 0 && v <= 6);
    dispatch({ type: 'UPDATE_HABIT', patch: { name: name.trim() || ob.habit.name, targetMin: minValue, targetGoal: goalValue, days: nextDays.length ? nextDays : ob.habit.days, anchorEvent: anchor.trim(), reminderTime: reminder.trim() || null, reminderOn: Boolean(reminder.trim()) } });
  };

  return (
    <div className="px-5 pt-8 pb-6 space-y-4">
      <Card className="p-4 min-[390px]:p-5 flex items-center gap-3 min-[390px]:gap-4">
        <img src={stageImage(ob.character, stage)} alt="" className="w-16 h-16 min-[390px]:w-20 min-[390px]:h-20 object-contain shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-black text-lg">{ob.heroName} · стадия {stage}</div>
          <div className="text-sm text-ink/60">Трек «{ob.trackName}»</div>
          <div className="text-xs text-ink/40 mt-1">{ob.source && `Источник: ${ob.source}`}{ob.codeWord && ` · код: ${ob.codeWord}`}</div>
        </div>
        <div className="text-right shrink-0"><div className="font-black text-teal-700">{state.xp} XP</div><div className="text-xs text-ink/50">{state.coins} монет</div></div>
      </Card>

      <Card className="p-5 relative overflow-hidden">
        <img src={icons.battery} alt="" className="absolute -right-4 -top-4 w-28 h-28 opacity-20 object-contain" />
        <div className="font-black text-lg">Полный тестовый доступ</div>
        <div className="text-sm text-ink/60 mt-1">Все платные ограничения временно отключены для проверки приложения. Документы и реальная оплата будут подключаться отдельно.</div>
        <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">Тестовый режим включён</div>
      </Card>

      <Card className="p-5">
        <div className="font-bold mb-3">Привычка и план</div>
        <div className="text-sm space-y-2 text-ink/70">
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1"><span>Название</span><span className="font-semibold text-ink text-right break-words">{ob.habit.name}</span></div>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1"><span>Минимум / Цель</span><span className="font-semibold text-ink text-right">{ob.habit.targetMin} / {ob.habit.targetGoal} {ob.habit.unit}</span></div>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1"><span>Дни</span><span className="font-semibold text-ink text-right">{ob.habit.days.map(d => ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d]).join(', ')}</span></div>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1"><span>Опора</span><span className="font-semibold text-ink text-right">{ob.habit.anchorEvent || 'не выбрана'}</span></div>
          <div className="flex flex-wrap justify-between gap-x-3 gap-y-1"><span>Версия плана</span><span className="font-semibold text-ink text-right">v{ob.habit.version}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4 max-[340px]:grid-cols-1">
          <GhostButton onClick={editHabit}>Изменить план</GhostButton>
          <GhostButton onClick={() => { const until = prompt('Пауза до даты (ГГГГ-ММ-ДД), пусто — снять', state.pausedUntil ?? ''); if (until !== null) { dispatch({ type: 'PAUSE', until: until.trim() || null }); haptic('light'); } }}>{state.pausedUntil ? 'Пауза активна' : 'Пауза'}</GhostButton>
        </div>
      </Card>

      <Card className="p-5">
        <div className="font-bold mb-1">Независимые настройки</div>
        <div className="text-sm text-ink/60 mb-3">Реплики, движение и Telegram выключаются отдельно.</div>
        <div className="space-y-2">
          {SETTING_LABELS.map(s => (
            <button key={s.key} onClick={() => dispatch({ type: 'SET_SETTING', key: s.key, value: !state.settings[s.key] })} className="w-full rounded-2xl border border-ink/10 bg-white/70 p-3 text-left flex items-center justify-between gap-3">
              <span className="min-w-0"><span className="block font-semibold">{s.label}</span><span className="block text-xs text-ink/50">{s.hint}</span></span>
              <span className={`w-12 h-7 rounded-full p-1 transition ${state.settings[s.key] ? 'bg-teal-600' : 'bg-ink/15'}`}><span className={`block w-5 h-5 rounded-full bg-white transition ${state.settings[s.key] ? 'translate-x-5' : ''}`} /></span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3"><img src={botImgs.duo} alt="" className="w-14 h-14 object-contain" /><div className="font-bold">Письмо основателя</div></div>
        {showLetter ? (
          <div className="text-sm text-ink/80 space-y-2">
            <p>Привет! Спасибо, что начал(а) этот путь.</p>
            <p>Здесь не нужно каждый день делать идеально. Если день сложный — достаточно минимума. Если план неудобен, его можно менять.</p>
            <p>Сначала отметь одно действие. Остальное приложение покажет по фактам.</p>
            <GhostButton onClick={() => { setShowLetter(false); dispatch({ type: 'READ_LETTER' }); }} className="mt-2 w-full">Понятно</GhostButton>
          </div>
        ) : <GhostButton onClick={() => setShowLetter(true)} className="w-full">Прочитать снова</GhostButton>}
      </Card>

      <Card className="p-5">
        <div className="font-bold mb-2">Данные и поддержка</div>
        <div className="text-sm text-ink/60">Локальная версия хранит данные на этом устройстве. История отличается от удаления; серверная синхронизация будет следующим этапом.</div>
        <GhostButton onClick={() => { if (confirm('Сбросить все локальные данные?')) dispatch({ type: 'RESET' }); }} className="w-full mt-4 text-red-500 border-red-200">Сбросить</GhostButton>
      </Card>
    </div>
  );
}
