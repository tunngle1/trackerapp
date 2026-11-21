import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function ProgressBar({ value, max, className = '', barClass = 'bg-teal-600' }: {
  value: number; max: number; className?: string; barClass?: string;
}) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className={`h-2.5 w-full rounded-full bg-ink/10 overflow-hidden ${className}`}>
      <div className={`h-full rounded-full transition-all duration-500 ${barClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function StatChip({ icon, value, label }: { icon?: string; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/80 border border-ink/10 px-3 py-1.5 shadow-sm">
      {icon && <img src={icon} alt="" className="w-5 h-5 object-contain" />}
      <span className="font-bold text-sm">{value}</span>
      <span className="text-xs text-ink/60">{label}</span>
    </div>
  );
}

export function PrimaryButton({ children, onClick, disabled, className = '' }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full rounded-2xl bg-gradient-to-r from-teal-700 to-teal-600 text-white font-bold py-3.5 px-6 shadow-lg shadow-teal-900/20 active:scale-[0.98] transition disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, className = '' }: {
  children: ReactNode; onClick?: () => void; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border border-ink/15 bg-white/70 font-semibold py-3 px-6 active:scale-[0.98] transition ${className}`}
    >
      {children}
    </button>
  );
}
