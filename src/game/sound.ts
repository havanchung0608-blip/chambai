// =====================================================================
//  ÂM THANH "LÊN CHÙA HỌC TOÁN" – tạo hoàn toàn bằng Web Audio, không cần file.
//  - Hiệu ứng: mõ, chuông, chiêng, trống, tiếng bấm, tích tắc, kèn mừng…
//  - Nhạc nền ngũ cung (đàn tranh + sáo + trống/mõ), tự sinh, phát lặp vô hạn.
//  - Đọc tiếng Việt: xem speech.ts.
// =====================================================================
let ctx: AudioContext | null = null;
let master: GainNode | null = null;   // tổng (tắt tiếng)
let sfxBus: GainNode | null = null;   // hiệu ứng
let musicBus: GainNode | null = null; // nhạc nền
let muted = false;
let musicOn = true;

const LS_MUTE = 'ctg-muted', LS_MUSIC = 'ctg-music';
try { muted = localStorage.getItem(LS_MUTE) === '1'; musicOn = localStorage.getItem(LS_MUSIC) !== '0'; } catch { /* bỏ qua */ }

function ac() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
      musicBus = ctx.createGain(); musicBus.gain.value = 0.32; musicBus.connect(master);
    } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

// Trình duyệt chỉ cho phát âm thanh sau khi người dùng chạm/bấm lần đầu.
if (typeof window !== 'undefined') {
  const unlock = () => { ac(); if (pendingMood) startMusic(pendingMood); };
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => window.addEventListener(ev, unlock, { passive: true }));
}

export const isMuted = () => muted;
export function setMuted(m: boolean) {
  muted = m;
  try { localStorage.setItem(LS_MUTE, m ? '1' : '0'); } catch { /* bỏ qua */ }
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
  if (m) { try { window.speechSynthesis?.cancel(); } catch { /* bỏ qua */ } }
}
export const isMusicOn = () => musicOn;
export function setMusicOn(on: boolean) {
  musicOn = on;
  try { localStorage.setItem(LS_MUSIC, on ? '1' : '0'); } catch { /* bỏ qua */ }
  if (on) { if (pendingMood || currentMood) startMusic((pendingMood || currentMood)!); }
  else stopMusic(true);
}

// ---------- Khối tạo âm cơ bản ----------
type ToneOpt = { type?: OscillatorType; vol?: number; when?: number; to?: number; bus?: 'sfx' | 'music'; attack?: number; filter?: number; vibrato?: number };
function tone(f: number, dur: number, o: ToneOpt = {}) {
  const a = ac();
  if (!a) return;
  const bus = o.bus === 'music' ? musicBus : sfxBus;
  if (!bus) return;
  const t = a.currentTime + (o.when ?? 0);
  const osc = a.createOscillator(), g = a.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(f, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  if (o.vibrato) {
    const lfo = a.createOscillator(), lg = a.createGain();
    lfo.frequency.value = 5.5; lg.gain.value = f * o.vibrato;
    lfo.connect(lg).connect(osc.frequency); lfo.start(t + 0.15); lfo.stop(t + dur + 0.05);
  }
  const vol = o.vol ?? 0.3, att = o.attack ?? 0.006;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  let node: AudioNode = osc;
  if (o.filter) { const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = o.filter; osc.connect(lp); node = lp; }
  node.connect(g).connect(bus);
  osc.start(t); osc.stop(t + dur + 0.05);
}

/** Tiếng ồn ngắn (trống, tiếng gõ). */
function noise(dur: number, o: { when?: number; vol?: number; freq?: number; q?: number; bus?: 'sfx' | 'music' } = {}) {
  const a = ac();
  const bus = o.bus === 'music' ? musicBus : sfxBus;
  if (!a || !bus) return;
  const t = a.currentTime + (o.when ?? 0);
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource(); src.buffer = buf;
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = o.freq ?? 800; bp.Q.value = o.q ?? 1;
  const g = a.createGain(); g.gain.value = o.vol ?? 0.3;
  src.connect(bp).connect(g).connect(bus);
  src.start(t);
}

// ---------- Nhạc cụ ----------
const mo = (when = 0, vol = 0.5, bus: 'sfx' | 'music' = 'sfx') => {
  tone(820, 0.14, { vol, when, to: 560, bus });
  tone(1640, 0.05, { type: 'triangle', vol: vol * 0.25, when, bus });
};
const bellAt = (base: number, when = 0, vol = 0.22, bus: 'sfx' | 'music' = 'sfx', len = 3.2) =>
  [1, 2, 2.76, 4.07, 5.4].forEach((m, i) => tone(base * m, len - i * 0.45, { vol: vol / (i + 1), when, bus }));
const gong = (when = 0, vol = 0.35) => {
  [1, 1.48, 2.15, 2.9].forEach((m, i) => tone(98 * m, 2.6 - i * 0.4, { vol: vol / (i + 1.2), when, attack: 0.02, vibrato: 0.004 }));
  noise(0.35, { when, vol: vol * 0.4, freq: 300, q: 0.7 });
};
const drum = (when = 0, vol = 0.45, bus: 'sfx' | 'music' = 'sfx') => {
  tone(130, 0.28, { vol, when, to: 55, bus });
  noise(0.08, { when, vol: vol * 0.3, freq: 200, bus });
};
/** Đàn tranh: gảy dây, tắt nhanh, hơi lọc. */
const zither = (f: number, when = 0, vol = 0.16) => {
  tone(f, 1.4, { type: 'triangle', vol, when, filter: 2600, bus: 'music', attack: 0.003 });
  tone(f * 2, 0.5, { type: 'sine', vol: vol * 0.25, when, bus: 'music', attack: 0.003 });
};
/** Sáo: êm, có rung. */
const flute = (f: number, dur: number, when = 0, vol = 0.07) =>
  tone(f, dur, { type: 'sine', vol, when, bus: 'music', attack: 0.08, vibrato: 0.012 });

// ---------- Hiệu ứng công khai ----------
export const SND = {
  unlock: () => ac(),
  /** Tiếng bấm nhẹ (chọn đáp án, nút). */
  tap: () => { tone(1250, 0.05, { type: 'triangle', vol: 0.18 }); tone(1900, 0.03, { vol: 0.06 }); },
  mo: (w = 0) => mo(w),
  bell: () => bellAt(196, 0, 0.25),
  /** Chuông nhỏ: có người vào chùa. */
  join: () => { bellAt(523, 0, 0.12, 'sfx', 1.6); bellAt(784, 0.12, 0.08, 'sfx', 1.4); },
  /** Chiêng: bắt đầu câu hỏi. */
  gong: () => gong(0, 0.32),
  /** Trả lời đúng: hai tiếng mõ + nốt ngũ cung đi lên. */
  ok: () => { mo(0); mo(0.17); [523, 587, 698, 784].forEach((f, i) => tone(f, 0.45, { type: 'triangle', vol: 0.13, when: 0.32 + i * 0.08 })); },
  /** Trả lời sai: tiếng trầm đi xuống. */
  bad: () => { tone(240, 0.35, { type: 'sawtooth', vol: 0.09, to: 190, filter: 900 }); tone(170, 0.5, { type: 'sawtooth', vol: 0.08, when: 0.22, to: 130, filter: 700 }); },
  tick: () => tone(1300, 0.05, { type: 'square', vol: 0.05 }),
  /** Tích tắc gấp hơn ở 3 giây cuối. */
  tickHot: () => { tone(1600, 0.06, { type: 'square', vol: 0.07 }); tone(800, 0.06, { type: 'square', vol: 0.04, when: 0.12 }); },
  /** Hết giờ. */
  timeUp: () => { drum(0, 0.5); bellAt(330, 0.05, 0.14, 'sfx', 1.8); },
  /** Trống dồn trước khi hiện đáp án. */
  drumRoll: (len = 1.1) => { const n = Math.floor(len / 0.07); for (let i = 0; i < n; i++) drum(i * 0.07, 0.12 + 0.25 * (i / n)); drum(len, 0.6); },
  /** Câu đúng liên tiếp. */
  streak: () => [784, 880, 1047, 1175].forEach((f, i) => tone(f, 0.25, { type: 'triangle', vol: 0.12, when: i * 0.06 })),
  levelUp: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.5, { type: 'triangle', vol: 0.16, when: i * 0.12 })),
  /** Kèn trống mừng: vượt mức, vinh danh. */
  fanfare: () => {
    [0, 0.18, 0.36].forEach(w => drum(w, 0.45));
    [[523, 0], [659, 0.18], [784, 0.36], [1047, 0.6], [880, 0.84], [1047, 1.02]].forEach(([f, w]) => {
      tone(f, 0.5, { type: 'sawtooth', vol: 0.07, when: w, filter: 2400 }); tone(f, 0.5, { type: 'triangle', vol: 0.1, when: w });
    });
    bellAt(262, 1.1, 0.2);
  },
};

// =====================================================================
//  NHẠC NỀN NGŨ CUNG (tự sinh)
//  Thang âm: C D F G A (giống Hò – Xự – Xang – Xê – Cống).
// =====================================================================
export type Mood = 'calm' | 'live';
const SCALE = [261.63, 293.66, 349.23, 392.0, 440.0]; // C4 D4 F4 G4 A4
const note = (deg: number) => {
  const oct = Math.floor(deg / 5), i = ((deg % 5) + 5) % 5;
  return SCALE[i] * 2 ** oct;
};

let timer: ReturnType<typeof setInterval> | null = null;
let nextT = 0, beat = 0, melDeg = 5;
let currentMood: Mood | null = null, pendingMood: Mood | null = null;

function scheduleBeat(t: number, mood: Mood) {
  const a = ctx!;
  const when = t - a.currentTime;
  const bar = Math.floor(beat / 4), inBar = beat % 4;
  // nền: dây trầm C–G mỗi nhịp đầu ô nhịp
  if (inBar === 0) { tone(65.4, mood === 'live' ? 1.8 : 3.4, { vol: 0.12, when, bus: 'music', attack: 0.2 }); tone(98, 3, { vol: 0.06, when, bus: 'music', attack: 0.3 }); }
  // giai điệu đàn tranh: bước nhỏ trong ngũ cung, có nghỉ
  const restChance = mood === 'live' ? 0.25 : 0.4;
  if (Math.random() > restChance) {
    melDeg = Math.max(3, Math.min(11, melDeg + [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)]));
    zither(note(melDeg), when, mood === 'live' ? 0.13 : 0.11);
    if (mood === 'live' && Math.random() < 0.35) zither(note(melDeg + 2), when + 0.5 * (60 / 100), 0.08);
  }
  // sáo: câu dài thỉnh thoảng
  if (inBar === 0 && bar % 4 === 2 && Math.random() < 0.7) flute(note(melDeg + 5), mood === 'live' ? 1.6 : 3.0, when, 0.06);
  // nhịp mõ, trống (sôi động hơn ở phòng thi đấu)
  if (mood === 'live') {
    mo(when, 0.16, 'music');
    if (inBar === 0) drum(when, 0.22, 'music');
    if (inBar === 2) noise(0.05, { when, vol: 0.05, freq: 3000, bus: 'music' });
  } else if (inBar === 0) {
    mo(when, 0.1, 'music');
  }
  // chuông chùa mỗi 8 ô nhịp
  if (inBar === 0 && bar % 8 === 0) bellAt(mood === 'live' ? 262 : 196, when, 0.08, 'music', 4);
  beat++;
}

/** Bật nhạc nền (gọi nhiều lần cũng được; đổi tâm trạng nếu khác). */
export function startMusic(mood: Mood) {
  pendingMood = mood;
  if (!musicOn) return;
  const a = ac();
  if (!a || a.state !== 'running') return; // chờ người dùng chạm lần đầu
  if (timer && currentMood === mood) return;
  stopMusic(false);
  currentMood = mood; pendingMood = null;
  const spb = 60 / (mood === 'live' ? 100 : 72);
  nextT = a.currentTime + 0.1; beat = 0;
  if (musicBus) musicBus.gain.setTargetAtTime(mood === 'live' ? 0.3 : 0.34, a.currentTime, 0.4);
  timer = setInterval(() => {
    if (!ctx) return;
    while (nextT < ctx.currentTime + 0.6) { scheduleBeat(nextT, mood); nextT += spb; }
  }, 120);
}

/** Tắt nhạc nền. keepMood = true: nhớ để bật lại khi người dùng mở nhạc. */
export function stopMusic(keepMood = false) {
  if (timer) { clearInterval(timer); timer = null; }
  if (!keepMood) { currentMood = null; }
  else if (currentMood) { pendingMood = currentMood; currentMood = null; }
}

/** Hạ nhỏ nhạc nền tạm thời (khi đọc đề). */
export function duckMusic(on: boolean) {
  if (musicBus && ctx) musicBus.gain.setTargetAtTime(on ? 0.08 : 0.32, ctx.currentTime, 0.2);
}
