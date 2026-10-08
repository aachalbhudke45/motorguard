import { useEffect, useState } from 'react';
import { levelHex } from '../utils/format';

/** Animated circular health meter. */
export default function HealthGauge({ value, label, size = 220, stroke = 16 }) {
  const [shown, setShown] = useState(0);

  // Count-up animation whenever value changes.
  useEffect(() => {
    let raf;
    const start = shown;
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 800);
      const eased = 1 - (1 - p) ** 3;
      setShown(Math.round(start + (value - start) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = 0.75; // 270° gauge
  const color = levelHex(label);
  const ticks = Array.from({ length: 28 }, (_, i) => i);

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[135deg]">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1c2a3d" strokeWidth={stroke} strokeDasharray={`${c * arc} ${c}`} strokeLinecap="round" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * arc * (shown / 100)} ${c}`}
          style={{ filter: `drop-shadow(0 0 8px ${color}88)`, transition: 'stroke 0.5s' }}
        />
        {ticks.map((i) => {
          const a = (i / (ticks.length - 1)) * arc * 2 * Math.PI;
          const r1 = r - stroke / 2 - 6;
          const r2 = r1 - (i % 3 === 0 ? 8 : 4);
          return (
            <line
              key={i}
              x1={size / 2 + r1 * Math.cos(a)}
              y1={size / 2 + r1 * Math.sin(a)}
              x2={size / 2 + r2 * Math.cos(a)}
              y2={size / 2 + r2 * Math.sin(a)}
              stroke="#334155"
              strokeWidth={i % 3 === 0 ? 2 : 1}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="metric text-white" style={{ fontSize: size * 0.24 }}>
          {shown}
          <span className="text-slate-400" style={{ fontSize: size * 0.11 }}>%</span>
        </div>
        <div className="mt-1 text-sm font-extrabold tracking-[0.25em]" style={{ color }}>{label}</div>
      </div>
    </div>
  );
}
