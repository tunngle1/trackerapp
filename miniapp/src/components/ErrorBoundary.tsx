import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App error boundary', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="app-shell">
        <div className="scroll-area px-5 pt-10">
          <div className="card p-5">
            <div className="font-black text-lg">Что-то пошло не так</div>
            <div className="text-sm text-ink/60 mt-2 break-words">{this.state.error.message}</div>
            <button
              className="mt-4 w-full min-h-12 rounded-2xl bg-teal-700 text-white font-bold"
              onClick={() => { localStorage.removeItem('mewego-state-v1'); location.reload(); }}
            >
              Сбросить локальные данные и открыть заново
            </button>
          </div>
        </div>
      </div>
    );
  }
}
