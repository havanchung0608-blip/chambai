// Âm thanh tạo bằng Web Audio, không cần file.
let ctx: AudioContext | null = null;
let muted = false;

export const isMuted = () => muted;
export const setMuted = (m: boolean) => { muted = m; };

function ac() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(f: number, dur: number, type: OscillatorType = 'sine', vol = 0.3, when = 0, f2?: number) {
  const a = ac();
  if (!a || muted) return;
  const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const SND = {
  unlock: () => ac(),
  mo: (w = 0) => { tone(780, 0.16, 'sine', 0.55, w, 560); tone(1560, 0.06, 'triangle', 0.12, w); },
  bell: () => [1, 2, 2.76, 4.07, 5.4].forEach((m, i) => tone(196 * m, 3.4 - i * 0.45, 'sine', 0.25 / (i + 1))),
  ok: () => { SND.mo(0); SND.mo(0.17); [523, 659, 784].forEach((f, i) => tone(f, 0.4, 'triangle', 0.14, 0.34 + i * 0.09)); },
  bad: () => { tone(240, 0.35, 'sawtooth', 0.1, 0, 190); tone(170, 0.5, 'sawtooth', 0.09, 0.22, 130); },
  tick: () => tone(1300, 0.05, 'square', 0.05),
  levelUp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, 'triangle', 0.16, i * 0.12)),
};
