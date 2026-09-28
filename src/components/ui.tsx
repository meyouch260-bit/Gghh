import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-flame text-night hover:bg-flame-strong shadow-lg shadow-flame/20',
  secondary: 'bg-coal text-cream hover:bg-coal/80 border border-cream/10',
  ghost: 'bg-transparent text-muted hover:text-cream',
  danger: 'bg-berry/15 text-berry hover:bg-berry/25 border border-berry/30',
};

export function Button({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`min-h-14 rounded-2xl px-5 py-3 text-lg font-extrabold transition active:scale-[0.98] disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Chip({
  selected,
  onClick,
  children,
  className = '',
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-12 rounded-full border-2 px-4 py-2 text-base font-bold transition ${
        selected ? 'border-flame bg-flame/20 text-cream' : 'border-cream/15 bg-ember text-muted hover:text-cream'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl bg-ember p-4 text-left"
    >
      <span>
        <span className="block text-lg font-bold">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <span
        className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? 'bg-flame' : 'bg-coal'}`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-cream transition-all ${checked ? 'left-7' : 'left-1'}`}
        />
      </span>
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl bg-ember p-5 ${className}`}>{children}</div>;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-extrabold uppercase tracking-wider text-flame">{title}</h2>
      {children}
    </section>
  );
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v: number) => String(v),
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  label: string;
}) {
  const btn = 'h-14 w-14 rounded-2xl bg-coal text-3xl font-black disabled:opacity-30';
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-ember p-2">
      <button type="button" className={btn} aria-label={`Moins de ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>
        −
      </button>
      <span className="text-2xl font-black tabular-nums" aria-live="polite">
        {format(value)}
      </span>
      <button type="button" className={btn} aria-label={`Plus de ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
        +
      </button>
    </div>
  );
}

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 -mx-4 mb-4 flex items-center gap-2 bg-night/95 px-4 py-3 backdrop-blur">
      {onBack && (
        <button onClick={onBack} aria-label="Retour" className="h-12 w-12 shrink-0 rounded-full bg-ember text-2xl">
          ←
        </button>
      )}
      <h1 className="flex-1 truncate text-2xl font-black">{title}</h1>
      {right}
    </header>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center" role="status">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-coal border-t-flame" />
      <p className="text-lg font-bold text-muted">{label}</p>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="space-y-3 rounded-2xl border border-berry/40 bg-berry/10 p-4" role="alert">
      <p className="font-bold text-berry">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
