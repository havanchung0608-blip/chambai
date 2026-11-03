import React, { useEffect, useRef, useState } from 'react';
import Scene from './Scene';
import { LEVELS, timeFactor } from './levels';
import { makeRound, shuffle } from './questions';
import { GameConfig, RoundResult, WrongItem } from './progress';
import { SND, isMuted, setMuted } from './sound';

type Props = {
  grade: number;
  level: number;
  cfg: GameConfig;
  onFinish: (r: RoundResult) => Promise<void>;
  onReplay: () => void;
  onNextLevel: () => void;
  onExit: () => void;
};

const LET = ['A', 'B', 'C', 'D'];
const CHEER = ['Tâm an, tính đúng!', 'Lên một bậc rồi!', 'Giỏi quá đi!', 'Công đức tăng rồi!'];
const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Chuyển nội dung câu hỏi (HTML) thành lời đọc tiếng Việt. */
function toSpeech(html: string) {
  return html
    .replace(/<span class="fr"><i>(.*?)<\/i><i>(.*?)<\/i><\/span>/g, ' $1 phần $2 ')
    .replace(/<sup>2<\/sup>/g, ' bình phương ')
    .replace(/<sup>3<\/sup>/g, ' lập phương ')
    .replace(/<sup>(.*?)<\/sup>/g, ' mũ $1 ')
    .replace(/<br\s*\/?>/g, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/cm²/g, ' xăng-ti-mét vuông').replace(/cm³/g, ' xăng-ti-mét khối').replace(/m²/g, ' mét vuông')
    .replace(/km\/giờ/g, ' ki-lô-mét một giờ')
    .replace(/√/g, ' căn ').replace(/×|·/g, ' nhân ').replace(/ : /g, ' chia ')
    .replace(/−/g, ' trừ ').replace(/\+/g, ' cộng ').replace(/≠/g, ' khác ').replace(/≥/g, ' lớn hơn hoặc bằng ').replace(/≤/g, ' nhỏ hơn hoặc bằng ')
    .replace(/=/g, ' bằng ').replace(/%/g, ' phần trăm').replace(/°/g, ' độ').replace(/π/g, ' pi').replace(/Δ/g, ' đen-ta')
    .replace(/\s+/g, ' ').trim();
}

function speak(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    const v = synth.getVoices().find(x => x.lang?.toLowerCase().startsWith('vi'));
    if (v) u.voice = v;
    u.rate = 0.9;
    synth.speak(u);
  } catch { /* trình duyệt không hỗ trợ đọc */ }
}

function Html({ html, as = 'span', className }: { html: string; as?: 'span' | 'div'; className?: string }) {
  const Tag = as;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Incense({ lit, total }: { lit: number; total: number }) {
  return (
    <span className="ctg-incense" aria-label={`Còn ${lit} nén nhang`}>
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} viewBox="0 0 16 30" className={i < lit ? '' : 'out'}>
          <path className="smoke" d="M8 6 q-3 -3 0 -6" stroke="#ddd" strokeWidth="1.4" fill="none" />
          <rect x="6.5" y="7" width="3" height="17" fill="#c1563c" /><circle cx="8" cy="7" r="1.8" fill="#ffb347" />
          <rect x="3" y="24" width="10" height="5" rx="1.5" fill="#b8892f" />
        </svg>
      ))}
    </span>
  );
}

function Petals() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || reduceMotion()) return;
    const x = c.getContext('2d');
    if (!x) return;
    c.width = window.innerWidth; c.height = window.innerHeight;
    const P = Array.from({ length: 90 }, () => ({
      x: Math.random() * c.width, y: -Math.random() * c.height, r: 6 + Math.random() * 8,
      vy: 1.2 + Math.random() * 2, vx: -1 + Math.random() * 2, a: Math.random() * 6, va: -0.05 + Math.random() * 0.1,
      col: ['#f7a8c4', '#f4c95d', '#fbd3e0', '#ffffff'][Math.floor(Math.random() * 4)],
    }));
    const t0 = performance.now(); let raf = 0;
    const f = (now: number) => {
      x.clearRect(0, 0, c.width, c.height);
      P.forEach(p => {
        p.x += p.vx + Math.sin(p.y / 40) * 0.6; p.y += p.vy; p.a += p.va;
        x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.col;
        x.beginPath(); x.ellipse(0, 0, p.r, p.r / 2.2, 0, 0, 7); x.fill(); x.restore();
      });
      if (now - t0 < 7000) raf = requestAnimationFrame(f); else x.clearRect(0, 0, c.width, c.height);
    };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="ctg-petals" />;
}

export default function GamePlay({ grade, level, cfg, onFinish, onReplay, onNextLevel, onExit }: Props) {
  const L = LEVELS[level - 1];
  const total = Math.max(1, cfg.questionsPerRound);
  const passScore = Math.min(total, Math.max(1, cfg.passScore));
  const allowedWrong = total - passScore;
  const maxLives = allowedWrong + 1;           // sai quá số câu cho phép thì hết nhang
  const limit = Math.round((cfg.timeLimits?.[level - 1] ?? L.defaultTime) * timeFactor(grade));

  const [qs] = useState(() => makeRound(grade, level, total));
  const [order, setOrder] = useState<number[]>(() => shuffle([0, 1, 2, 3]));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null); // 0 = đúng, 1–3 = sai, −1 = hết giờ
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [merit, setMerit] = useState(0);
  const [wrongs, setWrongs] = useState<WrongItem[]>([]);
  const [step, setStep] = useState(0);
  const [left, setLeft] = useState(limit);
  const [bubble, setBubble] = useState('Con xin lên chùa học toán!');
  const [anim, setAnim] = useState<{ kind: 'hop' | 'shake'; n: number }>({ kind: 'hop', n: 0 });
  const [result, setResult] = useState<RoundResult | null>(null);
  const [saveState, setSaveState] = useState<'saving' | 'saved' | 'error'>('saving');
  const [muted, setMutedState] = useState(isMuted());
  const [moHit, setMoHit] = useState(0);
  const [autoRead, setAutoRead] = useState(grade <= 2);
  const t0 = useRef(performance.now());
  const nextBtn = useRef<HTMLButtonElement>(null);

  const q = qs[i];
  const lives = maxLives - wrong;
  const answeredCount = i + (picked !== null ? 1 : 0);
  const isLast = i === total - 1 || lives <= 0;

  function readQuestion() {
    if (!q) return;
    speak(`${toSpeech(q.q)}. ${order.map((k, j) => `${LET[j]}: ${toSpeech(q.a[k])}`).join('. ')}`);
  }
  // Các em nhỏ: tự đọc đề khi sang câu mới
  useEffect(() => { if (autoRead && !result) readQuestion(); }, [i, autoRead]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* bỏ qua */ } }, []);

  // Lời nói của chú tiểu tự ẩn sau 2,4 giây
  useEffect(() => {
    if (!bubble) return;
    const id = setTimeout(() => setBubble(''), 2400);
    return () => clearTimeout(id);
  }, [bubble]);

  function say(t: string) { setBubble(''); setTimeout(() => setBubble(t), 0); }

  function answer(k: number) {
    if (picked !== null || result || !q) return;
    setPicked(k);
    if (k === 0) {
      setCorrect(c => c + 1);
      setMerit(m => m + 10 * level);
      setStep(s => s + 1);
      setAnim(a => ({ kind: 'hop', n: a.n + 1 }));
      SND.ok();
      say(CHEER[Math.floor(Math.random() * CHEER.length)]);
    } else {
      setWrong(w => w + 1);
      setWrongs(ws => [...ws, { q: q.q, chosen: k === -1 ? '(hết giờ)' : q.a[k], correct: q.a[0] }]);
      setAnim(a => ({ kind: 'shake', n: a.n + 1 }));
      SND.bad();
      say(k === -1 ? 'Ối, hết giờ mất rồi!' : 'Bình tĩnh, tu tiếp!');
    }
    setTimeout(() => nextBtn.current?.focus({ preventScroll: true }), 50);
  }
  const answerRef = useRef(answer);
  answerRef.current = answer;

  // Đồng hồ đếm ngược cho từng câu
  useEffect(() => {
    if (picked !== null || result || !limit) return;
    const start = performance.now();
    let last = limit;
    setLeft(limit);
    const id = setInterval(() => {
      const l = limit - (performance.now() - start) / 1000;
      setLeft(Math.max(0, l));
      const s = Math.ceil(l);
      if (s !== last) { last = s; if (s <= 5 && s > 0) SND.tick(); }
      if (l <= 0) { clearInterval(id); answerRef.current(-1); }
    }, 100);
    return () => clearInterval(id);
  }, [i, picked, result, limit]);

  function finish() {
    const passed = wrong <= allowedWrong && answeredCount === total;
    const stars = passed ? (wrong === 0 ? 3 : wrong === 1 ? 2 : 1) : 0;
    const r: RoundResult = {
      grade, level, correct, answered: answeredCount, total, passed, stars,
      merit: merit + (passed ? stars * 5 * level : 0),
      durationSec: Math.round((performance.now() - t0.current) / 1000),
      wrong: wrongs,
    };
    setResult(r);
    if (passed) { SND.bell(); if (level < 4) setTimeout(SND.levelUp, 600); } else SND.bad();
    setSaveState('saving');
    onFinish(r).then(() => setSaveState('saved')).catch(err => { console.error(err); setSaveState('error'); });
  }

  function next() {
    if (picked === null || result) return;
    if (isLast) { finish(); return; }
    setI(n => n + 1);
    setPicked(null);
    setOrder(shuffle([0, 1, 2, 3]));
  }
  const nextRef = useRef(next);
  nextRef.current = next;

  // Phím tắt
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'm') { toggleMute(); return; }
      if (k === 'r') { readRef.current(); return; }
      if (k === 'f') { toggleFull(); return; }
      const idx = ['1', '2', '3', '4'].includes(k) ? +k - 1 : ['a', 'b', 'c', 'd'].indexOf(k);
      if (idx >= 0) { answerRef.current(orderRef.current[idx]); return; }
      if (k === ' ' || k === 'arrowright') { e.preventDefault(); nextRef.current(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const readRef = useRef(readQuestion);
  readRef.current = readQuestion;
  const orderRef = useRef(order);
  orderRef.current = order;

  function toggleMute() { const m = !isMuted(); setMuted(m); setMutedState(m); }
  function toggleFull() {
    try {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.().catch(() => {});
    } catch { /* bỏ qua */ }
  }
  function goMo(e: React.MouseEvent<HTMLButtonElement>) {
    SND.mo();
    setMoHit(n => n + 1);
    const r = e.currentTarget.getBoundingClientRect();
    const f = document.createElement('div');
    f.className = 'ctg-float';
    f.textContent = 'Tâm tĩnh';
    f.style.left = `${r.left + r.width / 2 - 36 + (Math.random() * 30 - 15)}px`;
    f.style.top = `${r.top - 10}px`;
    document.body.appendChild(f);
    setTimeout(() => f.remove(), 1000);
  }

  if (!q) return <div className="ctg-gate">Không có câu hỏi cho mức này.</div>;
  const p = limit ? left / limit : 1;
  const barColor = p > 0.5 ? 'var(--jade)' : p > 0.25 ? 'var(--saffron)' : 'var(--cinnabar)';
  const nextLabel = isLast ? 'Xem kết quả →' : 'Câu tiếp →';

  return (
    <div className="ctg-play">
      <header className="ctg-head">
        <div className="ctg-brand">Lên Chùa Học Toán<small>Lớp {grade} · Mức {level}: {L.place} ({L.degree})</small></div>
        <div className="ctg-chip">Câu <b>{i + 1}/{total}</b></div>
        <div className="ctg-chip">Bậc <b>{step}/{total}</b></div>
        <div className="ctg-chip">Nhang <Incense lit={Math.max(0, lives)} total={maxLives} /></div>
        <div className="ctg-chip">Công đức <b>+{merit}</b></div>
        <button className="ctg-ibtn" onClick={toggleMute}>Âm thanh: {muted ? 'tắt' : 'bật'}</button>
        <button className="ctg-ibtn" onClick={toggleFull}>Toàn màn hình</button>
        <button className="ctg-ibtn" onClick={onExit}>Về sân chùa</button>
      </header>

      <div className="ctg-main">
        <div className="ctg-scene"><Scene steps={total} monkStep={step} level={L} bubble={bubble} anim={anim} /></div>

        <section className="ctg-card" aria-live="polite">
          <div className="ctg-qtop">
            <span className="ctg-tag">Câu {i + 1}</span>
            <div className="ctg-timer"><i style={{ width: `${p * 100}%`, background: barColor }} /></div>
            <span className="ctg-tnum">{limit ? Math.ceil(left) : '∞'}</span>
          </div>
          <Html as="div" className="ctg-q" html={q.q} />
          <div className="ctg-read">
            <button className="ctg-readbtn" onClick={readQuestion} title="Phím R">
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" /><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
              Đọc đề
            </button>
            <label className="ctg-auto"><input type="checkbox" checked={autoRead} onChange={e => setAutoRead(e.target.checked)} /> Tự đọc mỗi câu</label>
          </div>
          <div className="ctg-answers">
            {order.map((k, j) => {
              const cls = picked === null ? '' : k === 0 ? 'right' : k === picked ? 'wrong' : 'dim';
              return (
                <button key={`${i}-${k}`} className={`ctg-ans ${cls}`} disabled={picked !== null} onClick={() => answer(k)}>
                  <span className="L">{LET[j]}</span><Html html={q.a[k]} />
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div className={`ctg-fb ${picked === 0 ? 'ok' : 'no'}`}>
              <strong>
                {picked === 0 ? <>Đúng rồi! Công đức +{10 * level}</> : <>{picked === -1 ? 'Hết giờ!' : 'Chưa đúng.'} Đáp án: <Html html={q.a[0]} /></>}
              </strong>
              <Html html={q.g} />
            </div>
          )}
          <div className="ctg-row">
            <button ref={nextBtn} className="ctg-btn" disabled={picked === null} onClick={next}>{nextLabel}</button>
            <button className={`ctg-mo ${moHit ? 'hit' : ''}`} key={moHit} onClick={goMo} title="Gõ mõ cho tâm tĩnh">
              <svg viewBox="0 0 70 48" aria-hidden="true">
                <ellipse cx="30" cy="30" rx="26" ry="16" fill="#8a4b22" /><ellipse cx="30" cy="27" rx="22" ry="11" fill="#a85e2c" />
                <path d="M12 30 Q30 38 48 30" stroke="#3b1d14" strokeWidth="3" fill="none" strokeLinecap="round" />
                <g className="stick"><line x1="58" y1="6" x2="40" y2="18" stroke="#6b3f22" strokeWidth="4" strokeLinecap="round" /><circle cx="39" cy="19" r="4" fill="#4a2c1a" /></g>
              </svg>
              Gõ mõ
            </button>
          </div>
        </section>
      </div>

      {result && (
        <div className="ctg-overlay">
          {result.passed && <Petals />}
          <div className="ctg-panel" role="dialog" aria-label="Kết quả">
            <h2>{result.passed ? (level < 4 ? `Vượt qua ${L.place}!` : 'Đắc đạo Toán học!') : 'Nhang đã tàn, tu thêm nhé'}</h2>
            <div className="ctg-stars" aria-label={`${result.stars} sao`}>
              {[1, 2, 3].map(s => <span key={s} className={s <= result.stars ? 'on' : ''}>★</span>)}
            </div>
            <p>
              {result.passed
                ? level < 4
                  ? <>Em nhận danh hiệu <b>{L.title}</b> và mở khóa <b>{LEVELS[level].place}</b> ({LEVELS[level].degree}).</>
                  : <>Em đã chinh phục cả bốn mức của lớp {grade}. Danh hiệu: <b>{L.title}</b>.</>
                : <>Cần đúng ít nhất {passScore}/{total} câu để vượt mức. Xem lại lời giải các câu sai rồi thử lại nhé!</>}
            </p>
            <div className="ctg-stats">
              <div><b>{result.correct}/{total}</b>câu đúng</div>
              <div><b>{step}</b>bậc đã leo</div>
              <div><b>+{result.merit}</b>công đức</div>
              <div><b>{Math.floor(result.durationSec / 60)}:{String(result.durationSec % 60).padStart(2, '0')}</b>thời gian</div>
            </div>
            <div className="ctg-actions">
              {result.passed && level < 4 && <button className="ctg-btn jade" onClick={onNextLevel}>Lên {LEVELS[level].place} →</button>}
              <button className="ctg-btn" onClick={onReplay}>{result.passed ? 'Chơi lại mức này' : 'Thử lại'}</button>
              <button className="ctg-btn ghost" onClick={onExit}>Về sân chùa</button>
            </div>
            <div className="ctg-save">
              {saveState === 'saving' ? 'Đang lưu kết quả…' : saveState === 'saved' ? 'Đã lưu kết quả cho thầy cô.' : 'Chưa lưu được kết quả. Kiểm tra mạng rồi chơi lại.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
