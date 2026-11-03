import React from 'react';

export const ROBES = ['#e8902e', '#d4573b', '#4f8f5b', '#3f7cc4', '#8a5bb8', '#c9a227', '#2f8f8a', '#b8577e'];

/** Chú tiểu nhỏ ngồi thiền: dùng làm hình đại diện người chơi. */
export default function Avatar({ color = 0, size = 56, glow = false, incense = false }: { color?: number; size?: number; glow?: boolean; incense?: boolean }) {
  const robe = ROBES[color % ROBES.length];
  return (
    <svg width={size} height={size * 1.15} viewBox="-30 -78 60 69" aria-hidden="true" style={{ overflow: 'visible' }}>
      {glow && <circle cx="0" cy="-40" r="34" fill="#ffd36b" opacity=".35" className="lv-glow" />}
      {incense && (
        <g>
          <path d="M22 -66 q-3 -4 0 -8 q3 -4 0 -8" stroke="#eee" strokeWidth="1.2" fill="none" className="lv-smoke" />
          <rect x="21" y="-66" width="2" height="16" fill="#c1563c" />
          <circle cx="22" cy="-66" r="1.6" fill="#ffb347" />
        </g>
      )}
      <ellipse cx="0" cy="-10" rx="24" ry="5" fill="#000" opacity=".25" />
      {/* thân ngồi xếp bằng */}
      <path d="M-24 -10 Q-26 -26 -12 -38 L12 -38 Q26 -26 24 -10 Q0 -4 -24 -10Z" fill={robe} />
      <path d="M-12 -38 L6 -38 L-16 -12Z" fill="#000" opacity=".15" />
      <ellipse cx="0" cy="-22" rx="7" ry="4.5" fill="#f3c89b" />
      {/* đầu */}
      <circle cx="-14.5" cy="-52" r="3.2" fill="#f3c89b" /><circle cx="14.5" cy="-52" r="3.2" fill="#f3c89b" />
      <circle cx="0" cy="-52" r="14" fill="#f3c89b" />
      <path d="M-6.5 -54 q2.3 2.3 4.6 0 M2 -54 q2.3 2.3 4.6 0" stroke="#4a2c1a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M-3 -46.5 q3 2.6 6 0" stroke="#4a2c1a" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <circle cx="-8.5" cy="-48.5" r="2.2" fill="#f29b8f" opacity=".55" /><circle cx="8.5" cy="-48.5" r="2.2" fill="#f29b8f" opacity=".55" />
    </svg>
  );
}
