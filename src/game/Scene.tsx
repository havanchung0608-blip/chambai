import React, { useMemo } from 'react';
import { LevelInfo } from './levels';

type Props = {
  steps: number;
  monkStep: number;
  level: LevelInfo;
  bubble: string;
  anim: { kind: 'hop' | 'shake'; n: number };
};

/** Cảnh núi chùa: bậc đá, chú tiểu, chùa trên đỉnh. Bầu trời đổi theo mức độ. */
export default function Scene({ steps, monkStep, level, bubble, anim }: Props) {
  const pos = useMemo(() => {
    const p: [number, number][] = [[80, 655]];
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      p.push([80 + 395 * t + 48 * Math.sin(t * Math.PI * 2), 655 - 393 * t]);
    }
    return p;
  }, [steps]);
  const [mx, my] = pos[Math.min(monkStep, steps)];
  const night = level.id === 4;
  const gid = `sky${level.id}`;

  return (
    <svg viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`Chú tiểu đang ở bậc ${monkStep} trên đường lên ${level.place}`}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={level.sky[0]} /><stop offset=".55" stopColor={level.sky[1]} /><stop offset="1" stopColor={level.sky[2]} />
        </linearGradient>
        <radialGradient id="ctgMoon"><stop offset="0" stopColor="#fff4cf" /><stop offset="1" stopColor="#fff4cf" stopOpacity="0" /></radialGradient>
        <linearGradient id="ctgStone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c2b7ab" /><stop offset="1" stopColor="#8d8178" /></linearGradient>
        <radialGradient id="ctgLantern"><stop offset="0" stopColor="#ffcf6b" /><stop offset="1" stopColor="#ffcf6b" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="600" height="700" fill={`url(#${gid})`} />
      {night && (
        <g fill="#fff">
          {[[40, 60], [200, 40], [320, 120], [560, 50], [420, 30], [260, 200], [90, 180], [500, 120]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 ? 1.4 : 2.2} opacity=".8" className="ctg-glow" />
          ))}
        </g>
      )}
      <circle cx="130" cy="115" r="80" fill="url(#ctgMoon)" opacity={level.id === 2 ? 0.9 : 0.5} />
      <circle cx="130" cy="115" r="34" fill={level.id === 2 ? '#fff6d6' : '#f8eac0'} />
      <g fill="#fff" opacity=".14">
        <ellipse cx="250" cy="90" rx="70" ry="12" /><ellipse cx="300" cy="80" rx="40" ry="10" /><ellipse cx="60" cy="230" rx="60" ry="9" />
      </g>
      <path d="M0 380 L90 260 L170 330 L260 210 L360 310 L430 250 L600 360 L600 700 L0 700Z" fill="#3b2b52" opacity=".9" />
      <path d="M0 470 L120 360 L220 420 L330 330 L600 300 L600 700 L0 700Z" fill="#2c2a48" />
      <path d="M0 560 Q150 470 300 520 T600 440 L600 700 L0 700Z" fill="#23383a" />
      <ellipse cx="300" cy="470" rx="320" ry="26" fill="#fff" opacity=".07" />
      <g fill="#1a2c2b">
        <path d="M30 600 L55 520 L80 600Z" /><path d="M36 560 L55 495 L74 560Z" />
        <path d="M530 360 L552 300 L574 360Z" /><path d="M548 330 L566 280 L584 330Z" />
        <path d="M150 640 L170 585 L190 640Z" />
      </g>

      {/* Chùa */}
      <g>
        <rect x="365" y="262" width="230" height="18" rx="3" fill="#8a6d5a" />
        <rect x="360" y="278" width="240" height="10" rx="3" fill="#6d5546" />
        <rect x="395" y="190" width="170" height="72" fill="#a9342c" />
        <g fill="#7a231d"><rect x="403" y="196" width="8" height="66" /><rect x="549" y="196" width="8" height="66" /><rect x="438" y="196" width="7" height="66" /><rect x="515" y="196" width="7" height="66" /></g>
        <path d="M458 262 L458 232 Q480 210 502 232 L502 262Z" fill="#3b1d14" />
        <rect x="422" y="197" width="116" height="18" rx="3" fill="#f4c95d" />
        <text x="480" y="210.5" textAnchor="middle" fontFamily="Lora, Times New Roman, serif" fontWeight="700" fontSize="11.5" fill="#5a1d15">{level.place.toUpperCase()}</text>
        <path d="M366 194 Q398 192 410 166 L550 166 Q562 192 594 194 Q590 202 578 200 L382 200 Q370 202 366 194Z" fill="#2f3b5c" stroke="#f4c95d" strokeWidth="2" />
        <rect x="430" y="132" width="100" height="36" fill="#a9342c" />
        <circle cx="480" cy="150" r="10" fill="#f4c95d" />
        <text x="480" y="155" textAnchor="middle" fontSize="13" fontWeight="700" fill="#7a231d" fontFamily="Times New Roman, serif">π</text>
        <path d="M406 136 Q432 134 442 108 L518 108 Q528 134 554 136 Q550 144 540 142 L420 142 Q410 144 406 136Z" fill="#2f3b5c" stroke="#f4c95d" strokeWidth="2" />
        <rect x="476" y="86" width="8" height="24" fill="#f4c95d" /><circle cx="480" cy="84" r="7" fill="#f4c95d" />
        {[384, 576].map(x => (
          <g key={x}>
            <line x1={x} y1="200" x2={x} y2="214" stroke="#3b1d14" strokeWidth="1.5" />
            <circle cx={x} cy="224" r="22" fill="url(#ctgLantern)" className="ctg-glow" />
            <ellipse cx={x} cy="224" rx="8" ry="10" fill="#d4402f" />
          </g>
        ))}
      </g>

      {/* Bậc đá */}
      <g>
        {Array.from({ length: Math.max(0, steps - 1) }, (_, i) => i).reverse().map(idx => {
          const [x, y] = pos[idx + 1];
          return (
            <g key={idx}>
              <rect x={x - 36} y={y} width="72" height="11" rx="4" fill="#6f655e" />
              <rect x={x - 36} y={y - 4} width="72" height="9" rx="4" fill="url(#ctgStone)" />
              <text x={x} y={y + 22} textAnchor="middle" fontSize="12" fontWeight="700" fill="#f4c95d" opacity=".75">{idx + 1}</text>
            </g>
          );
        })}
      </g>

      {/* Chú tiểu */}
      <g className="ctg-monk" style={{ transform: `translate(${mx}px, ${my}px) scale(1.2)` }}>
        <g key={anim.kind + anim.n} className={anim.n ? (anim.kind === 'hop' ? 'ctg-hop' : 'ctg-shake') : ''}>
          <ellipse cx="0" cy="0" rx="20" ry="4" fill="#000" opacity=".3" />
          <g className="ctg-breath">
            <ellipse cx="-7" cy="-2" rx="6" ry="3" fill="#3b1d14" /><ellipse cx="7" cy="-2" rx="6" ry="3" fill="#3b1d14" />
            <path d="M-18 -3 Q-21 -30 -11 -43 L11 -43 Q21 -30 18 -3Z" fill="#e8902e" />
            <path d="M-11 -43 L7 -43 L-15 -6Z" fill="#c76f1c" />
            <ellipse cx="0" cy="-27" rx="7" ry="5" fill="#f3c89b" />
            <circle cx="-15" cy="-57" r="3.5" fill="#f3c89b" /><circle cx="15" cy="-57" r="3.5" fill="#f3c89b" />
            <circle cx="0" cy="-57" r="15" fill="#f3c89b" />
            <path d="M-7 -59 q2.5 2.5 5 0 M2 -59 q2.5 2.5 5 0" stroke="#4a2c1a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
            <path d="M-3.5 -51 q3.5 3 7 0" stroke="#4a2c1a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <circle cx="-9" cy="-53" r="2.4" fill="#f29b8f" opacity=".6" /><circle cx="9" cy="-53" r="2.4" fill="#f29b8f" opacity=".6" />
          </g>
        </g>
        <g className="ctg-bubble" opacity={bubble ? 1 : 0}>
          <rect x="-24" y="-112" width="214" height="32" rx="12" fill="#fbf3e2" />
          <path d="M-2 -81 L4 -72 L10 -81Z" fill="#fbf3e2" />
          <text x="83" y="-91" textAnchor="middle" fontWeight="700" fontSize="14" fill="#2a1b12">{bubble}</text>
        </g>
      </g>
    </svg>
  );
}
