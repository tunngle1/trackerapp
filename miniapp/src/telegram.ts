import { useEffect } from 'react';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: { user?: { id: number; first_name?: string; username?: string } };
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        ready: () => void;
        expand: () => void;
        close: () => void;
        HapticFeedback?: { impactOccurred: (s: 'light' | 'medium' | 'heavy') => void };
      };
    };
  }
}

export function useTelegram() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready();
    tg?.expand();
  }, []);

  const wa = window.Telegram?.WebApp;
  const inTelegram = Boolean(wa?.initData);
  const user = wa?.initDataUnsafe?.user;

  return {
    inTelegram,
    user,
    haptic: (style: 'light' | 'medium' | 'heavy' = 'light') =>
      wa?.HapticFeedback?.impactOccurred(style),
  };
}
