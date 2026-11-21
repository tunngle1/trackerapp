import { useState } from 'react';
import { StoreProvider, useStore } from './store';
import { useTelegram } from './telegram';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Path from './screens/Path';
import CalendarScreen from './screens/Calendar';
import Pet from './screens/Pet';
import Progress from './screens/Progress';
import Profile from './screens/Profile';
import { icons } from './data/assets';

type Tab = 'home' | 'path' | 'calendar' | 'pet' | 'progress' | 'profile';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Сегодня', icon: icons.bolt },
  { id: 'path', label: 'Путь', icon: icons.crystal },
  { id: 'calendar', label: 'Календарь', icon: icons.cone },
  { id: 'pet', label: 'Питомец', icon: icons.gear },
  { id: 'progress', label: 'Прогресс', icon: icons.shell },
  { id: 'profile', label: 'Ещё', icon: icons.chip },
];

function Shell() {
  const { state } = useStore();
  const { inTelegram } = useTelegram();
  const [tab, setTab] = useState<Tab>('home');

  if (!state.onboarded) {
    return (
      <div className="app-shell">
        <Onboarding onDone={() => setTab('home')} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {!inTelegram && (
        <div className="bg-amber-100 text-amber-800 text-xs text-center py-1.5 font-semibold">
          Демо-режим: открой через Telegram-бота для полной версии
        </div>
      )}
      <div className="scroll-area">
        {tab === 'home' && <Home />}
        {tab === 'path' && <Path />}
        {tab === 'calendar' && <CalendarScreen />}
        {tab === 'pet' && <Pet />}
        {tab === 'progress' && <Progress />}
        {tab === 'profile' && <Profile />}
      </div>
      <nav className="bottom-nav">
        <div className="grid grid-cols-6 max-w-[480px] mx-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center py-2.5 gap-0.5 transition ${tab === t.id ? 'text-teal-700' : 'text-ink/40'}`}
            >
              <img src={t.icon} alt="" className={`w-6 h-6 object-contain ${tab === t.id ? '' : 'opacity-60'}`} />
              <span className="text-[10px] font-semibold">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
