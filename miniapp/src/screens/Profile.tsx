import { useState } from 'react';
import { useStore } from '../store';
import { botImgs, icons, stageImage } from '../data/assets';
import { Card, PrimaryButton, GhostButton } from '../components/ui';
import { useTelegram } from '../telegram';

export default function Profile() {
  const { state, dispatch, stage } = useStore();
  const { haptic } = useTelegram();
  const ob = state.onboarding!;
  const [showLetter, setShowLetter] = useState(!state.founderLetterRead);
  const [showPay, setShowPay] = useState(false);

  const daysLeft = state.pro ? 7 : 0;

  return (
    <div className="px-5 pt-8 pb-6 space-y-4">
      {/* Профиль */}
      <Card className="p-5 flex items-center gap-4">
        <img src={stageImage(ob.character, stage)} alt="" className="w-20 h-20 object-contain" />
        <div className="flex-1">
          <div className="font-black text-lg">
            {ob.character === 'robot' ? 'МейВиГо' : 'Пушок'} · стадия {stage}
          </div>
          <div className="text-sm text-ink/60">Трек «{ob.trackName}»</div>
          <div className="text-xs text-ink/40 mt-1">
            {ob.source && `Источник: ${ob.source}`}
            {ob.codeWord && ` · код: ${ob.codeWord}`}
          </div>
        </div>
        <div className="text-right">
          <div className="font-black text-teal-700">{state.xp} XP</div>
          <div className="text-xs text-ink/50">{state.coins} монет</div>
        </div>
      </Card>

      {/* Подписка Pro */}
      <Card className="p-5 relative overflow-hidden">
        <img src={icons.battery} alt="" className="absolute -right-4 -top-4 w-28 h-28 opacity-20 object-contain" />
        <div className="font-black text-lg">MeWeGo Pro</div>
        <div className="text-sm text-ink/60 mt-1">
          {state.pro ? `Активна · ${daysLeft} дн. доступа` : '199 ₽/мес · 7 дней пробного доступа'}
        </div>
        <ul className="text-sm text-ink/70 mt-3 space-y-1">
          <li>• Безлимит привычек и треков</li>
          <li>• Аналитика и карточки для сторис</li>
          <li>• Заморозка серии, расширенная комната</li>
          <li>• Бадди и клубы</li>
        </ul>
        {state.pro ? (
          <GhostButton onClick={() => { dispatch({ type: 'SET_PRO', pro: false }); haptic('light'); }} className="mt-4 w-full">
            Отменить подписку
          </GhostButton>
        ) : showPay ? (
          <div className="mt-4 space-y-2">
            <PrimaryButton onClick={() => { dispatch({ type: 'SET_PRO', pro: true }); setShowPay(false); haptic('heavy'); }}>
              Оплатить 199 ₽ (демо)
            </PrimaryButton>
            <GhostButton onClick={() => setShowPay(false)} className="w-full">Назад</GhostButton>
          </div>
        ) : (
          <PrimaryButton onClick={() => setShowPay(true)} className="mt-4">Попробовать 7 дней бесплатно</PrimaryButton>
        )}
      </Card>

      {/* Письмо основателя */}
      <Card className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <img src={botImgs.duo} alt="" className="w-14 h-14 object-contain" />
          <div className="font-bold">Письмо основателя</div>
        </div>
        {showLetter ? (
          <div className="text-sm text-ink/80 space-y-2">
            <p>Привет! Спасибо, что начал(а) этот путь.</p>
            <p>Спасибо, что попробовал(а) MeWeGo.</p>
            <p>Здесь не нужно каждый день делать идеально. Если день сложный — достаточно минимума. Если план неудобен, его можно менять.</p>
            <p>Сначала отметь одно действие. Остальное приложение покажет по фактам: сколько получилось, где были перерывы и какой ритм тебе подходит.</p>
            <GhostButton onClick={() => { setShowLetter(false); dispatch({ type: 'READ_LETTER' }); }} className="mt-2 w-full">Понятно</GhostButton>
          </div>
        ) : (
          <GhostButton onClick={() => setShowLetter(true)} className="w-full">Прочитать снова</GhostButton>
        )}
      </Card>

      {/* Настройки привычки */}
      <Card className="p-5">
        <div className="font-bold mb-3">Привычка и напоминания</div>
        <div className="text-sm space-y-2 text-ink/70">
          <div className="flex justify-between"><span>Название</span><span className="font-semibold text-ink">{ob.habit.name}</span></div>
          <div className="flex justify-between"><span>Минимум / Цель</span><span className="font-semibold text-ink">{ob.habit.targetMin} / {ob.habit.targetGoal} {ob.habit.unit}</span></div>
          <div className="flex justify-between"><span>Дни</span><span className="font-semibold text-ink">{ob.habit.days.map(d => ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d]).join(', ')}</span></div>
          <div className="flex justify-between"><span>Напоминание</span><span className="font-semibold text-ink">{ob.habit.reminderOn ? (ob.habit.reminderTime ?? 'вкл') : 'выкл'}</span></div>
        </div>
        <div className="flex gap-2 mt-4">
          <GhostButton
            onClick={() => {
              const until = prompt('Пауза до даты (ГГГГ-ММ-ДД), пусто — снять', state.pausedUntil ?? '');
              if (until === null) return;
              dispatch({ type: 'PAUSE', until: until.trim() || null });
              haptic('light');
            }}
            className="flex-1"
          >
            {state.pausedUntil ? 'Пауза активна' : 'Пауза'}
          </GhostButton>
          <GhostButton
            onClick={() => { if (confirm('Сбросить все данные?')) dispatch({ type: 'RESET' }); }}
            className="flex-1 text-red-500 border-red-200"
          >
            Сбросить
          </GhostButton>
        </div>
      </Card>
    </div>
  );
}
