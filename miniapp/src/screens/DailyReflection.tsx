import { useState } from 'react';
import { useStore } from '../store';
import { reflectionQuestions } from '../data/content';
import { Card, GhostButton, PrimaryButton } from '../components/ui';

export default function DailyReflection() {
  const { state, today, dispatch } = useStore();
  const saved = state.reflections[today];
  const questions = reflectionQuestions(today);
  const [gratitude, setGratitude] = useState(saved?.gratitude ?? '');
  const [contribution, setContribution] = useState(saved?.contribution ?? '');
  const [open, setOpen] = useState(Boolean(saved?.gratitude || saved?.contribution));
  if (!state.settings.reflections) return null;

  return (
    <Card className="p-4 animate-fade-up">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-black">Заметки дня</div>
          <div className="text-sm text-ink/60 mt-1">Добровольно. Можно ответить на один вопрос или пропустить оба.</div>
        </div>
        <button onClick={() => setOpen(v => !v)} className="text-sm font-bold text-teal-700 shrink-0">{open ? 'Скрыть' : 'Открыть'}</button>
      </div>
      {open && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-ink/50 uppercase">{questions.gratitude}</span>
            <textarea value={gratitude} onChange={e => setGratitude(e.target.value)} rows={2} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/75 p-3 text-sm outline-none focus:border-teal-600" placeholder="Можно оставить пустым" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-ink/50 uppercase">{questions.contribution}</span>
            <textarea value={contribution} onChange={e => setContribution(e.target.value)} rows={2} className="mt-2 w-full rounded-2xl border border-ink/10 bg-white/75 p-3 text-sm outline-none focus:border-teal-600" placeholder="Можно оставить пустым" />
          </label>
          <div className="grid grid-cols-2 gap-2 max-[340px]:grid-cols-1">
            <PrimaryButton onClick={() => dispatch({ type: 'SAVE_REFLECTION', date: today, patch: { gratitude: gratitude.trim() || undefined, contribution: contribution.trim() || undefined } })}>Сохранить</PrimaryButton>
            <GhostButton onClick={() => setOpen(false)}>Не сейчас</GhostButton>
          </div>
          {(saved?.gratitude || saved?.contribution) && <div className="text-xs text-teal-700 font-semibold">Сохранено в личной истории на {today}.</div>}
        </div>
      )}
    </Card>
  );
}
