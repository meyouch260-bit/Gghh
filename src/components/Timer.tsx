import { useEffect, useRef, useState } from 'react';

const PRESETS = [30, 45, 60, 120];

/** Bip court via Web Audio (le contexte est créé sur un clic, sinon le son est bloqué). */
function beep(ctx: AudioContext | null) {
  if (!ctx) return;
  const t = ctx.currentTime;
  for (const [i, f] of [880, 660, 880].entries()) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.25, t + i * 0.22);
    gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.22 + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t + i * 0.22);
    osc.stop(t + i * 0.22 + 0.2);
  }
}

/** Chrono de manche : préréglages, gros chiffres, bip + vibration à la fin. */
export function Timer() {
  const [duration, setDuration] = useState(60);
  const [left, setLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);
  const audio = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        setRunning(false);
        beep(audio.current);
        try {
          navigator.vibrate?.([300, 120, 300]);
        } catch {
          /* vibration indisponible */
        }
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  const start = () => {
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume();
    } catch {
      audio.current = null;
    }
    endAt.current = Date.now() + (left === 0 ? duration : left) * 1000;
    if (left === 0) setLeft(duration);
    setRunning(true);
  };

  const pick = (d: number) => {
    setRunning(false);
    setDuration(d);
    setLeft(d);
  };

  const mm = Math.floor(left / 60);
  const ss = String(left % 60).padStart(2, '0');
  const urgent = running && left <= 10;
  const done = left === 0;

  return (
    <div className="space-y-3 rounded-3xl bg-ember p-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((d) => (
          <button
            key={d}
            onClick={() => pick(d)}
            aria-pressed={duration === d}
            className={`min-h-11 flex-1 rounded-xl px-3 font-bold ${duration === d ? 'bg-flame/25 text-cream ring-2 ring-flame' : 'bg-coal text-muted'}`}
          >
            {d < 60 ? `${d} s` : `${d / 60} min`}
          </button>
        ))}
      </div>
      <div
        role="timer"
        aria-live={done ? 'assertive' : 'off'}
        className={`text-center text-7xl font-black tabular-nums transition-colors ${done ? 'text-berry' : urgent ? 'text-flame' : 'text-cream'}`}
      >
        {done ? 'Temps écoulé !' : `${mm}:${ss}`}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {running ? (
          <button className="min-h-14 rounded-2xl bg-coal text-lg font-extrabold" onClick={() => setRunning(false)}>
            ⏸ Pause
          </button>
        ) : (
          <button className="min-h-14 rounded-2xl bg-flame text-lg font-extrabold text-night" onClick={start}>
            ▶ {left === duration || done ? 'Démarrer' : 'Reprendre'}
          </button>
        )}
        <button className="min-h-14 rounded-2xl bg-coal text-lg font-extrabold" onClick={() => pick(duration)}>
          ↺ Remettre à zéro
        </button>
      </div>
    </div>
  );
}
