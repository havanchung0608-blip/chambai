import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import './live.css';
import Avatar from './Avatar';
import {
  demoCorrectIndex, joinRoom, sendAnswer,
  Player, Room, createRoom, endRoom, joinUrl, ms, revealQuestion, showQuestion, watchAnswered, watchPlayers, watchRoom,
} from './liveApi';
import { GRADES, LEVELS, gradeLabel, timeFactor } from '../game/levels';
import { SND, isMuted, setMuted, isMusicOn, setMusicOn, startMusic } from '../game/sound';
import { speak, toSpeech } from '../game/speech';

// Bản chơi thử (không có Firebase): có nút thêm người chơi ảo tự trả lời.
const DEMO = import.meta.env.VITE_DEMO === '1';
const BOT_NAMES = ['Minh An', 'Bảo Ngọc', 'Gia Huy', 'Thu Trang', 'Đức Anh', 'Khánh Linh', 'Quốc Bảo', 'Hà My', 'Tuấn Kiệt', 'Ngọc Hân',
  'Phúc Lâm', 'Diệu Linh', 'Hoàng Nam', 'Mai Chi', 'Trọng Nhân', 'Thảo Vy', 'Đăng Khoa', 'Yến Nhi', 'Minh Khôi', 'Bích Ngân'];

const LET = ['A', 'B', 'C', 'D'];
const OPT_COLORS = ['#d9534f', '#3f7cc4', '#e0a12a', '#2f8a5f'];

function Html({ html, className }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Nền chánh điện: cột son, bàn thờ hoa sen, đèn lồng, sàn gỗ. */
function TempleHall() {
  return (
    <svg className="lv-hall" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="lvWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a0f0c" /><stop offset="1" stopColor="#7a2a17" /></linearGradient>
        <linearGradient id="lvFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8a4a22" /><stop offset="1" stopColor="#4a2410" /></linearGradient>
        <radialGradient id="lvHalo" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffe7a3" stopOpacity=".9" /><stop offset="1" stopColor="#ffb84d" stopOpacity="0" /></radialGradient>
        <linearGradient id="lvGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe08a" /><stop offset="1" stopColor="#c8901f" /></linearGradient>
        <radialGradient id="lvLamp"><stop offset="0" stopColor="#ffcf6b" /><stop offset="1" stopColor="#ffcf6b" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#lvWall)" />
      {/* hoa văn mái */}
      <rect width="1600" height="70" fill="#2a0906" />
      {Array.from({ length: 33 }, (_, i) => <path key={i} d={`M${i * 50} 70 q25 26 50 0`} fill="none" stroke="#c8901f" strokeWidth="3" opacity=".7" />)}
      {/* hào quang và bàn thờ */}
      <circle cx="800" cy="330" r="260" fill="url(#lvHalo)" className="lv-glow" />
      <g transform="translate(800 330)">
        {/* hoa sen vàng lớn */}
        {[-70, -35, 0, 35, 70].map((a, i) => (
          <path key={i} transform={`rotate(${a})`} d="M0 40 Q-38 -30 0 -120 Q38 -30 0 40Z" fill="url(#lvGold)" stroke="#a8741a" strokeWidth="2" />
        ))}
        <circle cx="0" cy="-10" r="34" fill="#fff4cf" stroke="#c8901f" strokeWidth="4" />
        <text x="0" y="6" textAnchor="middle" fontFamily="Times New Roman, serif" fontSize="48" fontWeight="700" fill="#8a2a17">π</text>
      </g>
      <rect x="560" y="400" width="480" height="70" rx="8" fill="#5a1a0e" stroke="#c8901f" strokeWidth="4" />
      <rect x="600" y="470" width="400" height="90" fill="#3d1209" />
      {/* lư hương, nến, hoa */}
      <g transform="translate(800 395)">
        <path d="M-40 0 Q-40 -30 0 -30 Q40 -30 40 0Z" fill="url(#lvGold)" />
        {[-14, 0, 14].map(x => <g key={x}><rect x={x - 1.5} y="-70" width="3" height="40" fill="#c1563c" /><circle cx={x} cy="-70" r="2.5" fill="#ffb347" /></g>)}
        <path d="M0 -74 q-8 -14 0 -28 q8 -14 0 -30" stroke="#f2e6d0" strokeWidth="2" fill="none" opacity=".6" className="lv-smoke" />
      </g>
      {[640, 960].map(x => (
        <g key={x}><rect x={x - 6} y="345" width="12" height="55" fill="#f7efe0" /><path d={`M${x} 345 q-6 -10 0 -20 q6 10 0 20Z`} fill="#ffb347" className="lv-glow" /></g>
      ))}
      {[590, 1010].map(x => (
        <g key={x} transform={`translate(${x} 400)`}>
          <rect x="-14" y="-40" width="28" height="40" fill="#c8901f" />
          {[-14, 0, 14].map((dx, i) => <circle key={i} cx={dx} cy={-52 - (i % 2) * 8} r="13" fill={i % 2 ? '#f7a8c4' : '#f48fb1'} />)}
        </g>
      ))}
      {/* cột son và câu đối */}
      {[150, 420, 1180, 1450].map((x, i) => (
        <g key={x}>
          <rect x={x - 34} y="70" width="68" height="560" fill="#9a2416" />
          <rect x={x - 34} y="70" width="14" height="560" fill="#000" opacity=".18" />
          <path d={`M${x - 30} 140 q30 30 60 0 M${x - 30} 260 q30 30 60 0 M${x - 30} 380 q30 30 60 0 M${x - 30} 500 q30 30 60 0`} stroke="#d9a63a" strokeWidth="4" fill="none" opacity=".75" />
          {i === 1 || i === 2 ? <rect x={x + 50 * (i === 1 ? 1 : -1) - 22} y="110" width="44" height="300" rx="4" fill="#b8301e" stroke="#d9a63a" strokeWidth="3" /> : null}
        </g>
      ))}
      <text x="492" y="150" fontFamily="Times New Roman, serif" fontSize="30" fill="#f4c95d" textAnchor="middle" style={{ writingMode: 'vertical-rl' as const }}>Học hành chăm chỉ</text>
      <text x="1108" y="150" fontFamily="Times New Roman, serif" fontSize="30" fill="#f4c95d" textAnchor="middle" style={{ writingMode: 'vertical-rl' as const }}>Tâm sáng tính hay</text>
      {/* đèn lồng */}
      {[290, 560, 1040, 1310].map((x, i) => (
        <g key={x} className={i % 2 ? 'lv-sway' : 'lv-sway2'} style={{ transformOrigin: `${x}px 70px` }}>
          <line x1={x} y1="70" x2={x} y2="140" stroke="#2a0906" strokeWidth="3" />
          <circle cx={x} cy="175" r="70" fill="url(#lvLamp)" opacity=".7" />
          <ellipse cx={x} cy="175" rx="30" ry="38" fill="#d4402f" stroke="#f4c95d" strokeWidth="3" />
          <rect x={x - 14} y="132" width="28" height="8" fill="#f4c95d" /><rect x={x - 14} y="210" width="28" height="8" fill="#f4c95d" />
        </g>
      ))}
      {/* sàn gỗ và thảm đỏ */}
      <path d="M0 560 L1600 560 L1600 900 L0 900Z" fill="url(#lvFloor)" />
      {Array.from({ length: 9 }, (_, i) => <line key={i} x1="0" y1={590 + i * 36} x2="1600" y2={590 + i * 36} stroke="#000" opacity=".12" strokeWidth="2" />)}
      <path d="M730 560 L870 560 L1000 900 L600 900Z" fill="#a8261b" />
      <path d="M745 560 L855 560 L975 900 L625 900Z" fill="none" stroke="#f4c95d" strokeWidth="3" opacity=".7" />
    </svg>
  );
}

/** Ô cài đặt trước khi mở phòng. */
export function HostSetup({ host, onCreated, onBack }: { host: { uid: string; name: string }; onCreated: (code: string) => void; onBack: () => void }) {
  const [grade, setGrade] = useState(6);
  const [level, setLevel] = useState(1);
  const [total, setTotal] = useState(10);
  const [time, setTime] = useState(20);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="lv-setup">
      <form className="lv-setup-card" onSubmit={async e => {
        e.preventDefault(); setBusy(true); setErr('');
        try { onCreated(await createRoom(host, grade, level, total, time)); }
        catch (e2) { console.error(e2); setErr('Chưa mở được phòng. Kiểm tra mạng, đăng nhập và luật Firestore.'); setBusy(false); }
      }}>
        <h1>Mở phòng Chùa Toán Online</h1>
        <p>Chiếu màn hình này lên TV hoặc livestream. Người chơi quét mã QR để vào chùa và trả lời bằng điện thoại.</p>
        <div className="lv-label">Lớp</div>
        <div className="lv-pills">{GRADES.map(g => <button type="button" key={g} aria-pressed={g === grade} onClick={() => { setGrade(g); setTime(Math.round(20 * timeFactor(g))); }}>{gradeLabel(g)}</button>)}</div>
        <div className="lv-label">Mức độ</div>
        <div className="lv-pills">{LEVELS.map(L => <button type="button" key={L.id} aria-pressed={L.id === level} onClick={() => setLevel(L.id)}>{L.id}. {L.degree}</button>)}</div>
        <div className="lv-row2">
          <label>Số câu<input type="number" min={3} max={30} value={total} onChange={e => setTotal(Math.max(3, Math.min(30, +e.target.value)))} /></label>
          <label>Giây mỗi câu<input type="number" min={5} max={180} value={time} onChange={e => setTime(Math.max(5, Math.min(180, +e.target.value)))} /></label>
        </div>
        {err && <p className="lv-err">{err}</p>}
        <div className="lv-actions">
          <button className="lv-btn" type="submit" disabled={busy}>{busy ? 'Đang mở…' : 'Mở cửa chùa'}</button>
          <button className="lv-btn ghost" type="button" onClick={onBack}>Quay lại</button>
        </div>
      </form>
    </div>
  );
}

type Floating = { id: number; uid: string; text: string };

/** Màn hình lớn của chủ phòng. */
export function HostScreen({ code, onExit }: { code: string; onExit: () => void }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [answered, setAnswered] = useState<string[]>([]);
  const [qr, setQr] = useState('');
  const [now, setNow] = useState(Date.now());
  const [ticker, setTicker] = useState<string[]>(['Cửa chùa đã mở. Mời các con quét mã để vào.']);
  const [floats, setFloats] = useState<Floating[]>([]);
  const [busy, setBusy] = useState(false);
  const [muted, setM] = useState(isMuted());
  const [music, setMusicState] = useState(isMusicOn());
  const [voice, setVoice] = useState(true);
  useEffect(() => { startMusic('live'); }, []);
  const known = useRef<Set<string>>(new Set());
  const revealing = useRef(false);
  const url = joinUrl(code);

  useEffect(() => { QRCode.toDataURL(url, { margin: 1, width: 360, color: { dark: '#2a1b12', light: '#fbf3e2' } }).then(setQr).catch(() => {}); }, [url]);
  useEffect(() => watchRoom(code, setRoom), [code]);
  useEffect(() => watchPlayers(code, ps => {
    const fresh = ps.filter(p => !known.current.has(p.uid));
    if (known.current.size && fresh.length) {
      SND.join();
      setTicker(t => [...fresh.map(p => `${p.name} vừa vào chùa · Chúc con học giỏi`), ...t].slice(0, 6));
    }
    fresh.forEach(p => known.current.add(p.uid));
    setPlayers(ps);
  }), [code]);
  useEffect(() => {
    if (!room || room.qIndex < 0) return;
    return watchAnswered(code, room.qIndex, setAnswered);
  }, [code, room?.qIndex]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 250); return () => clearInterval(id); }, []);

  // Người chơi ảo (chỉ bản thử): tự chọn đáp án sau vài giây, đúng khoảng 70%.
  async function addBots(k = 8) {
    const used = new Set(players.map(p => p.name));
    const pool = BOT_NAMES.filter(nm => !used.has(nm));
    for (let i = 0; i < k; i++) {
      const nm = pool[i] || `Bạn số ${players.length + i + 1}`;
      await joinRoom(code, `bot${Date.now().toString(36)}${i}`, nm);
    }
  }
  useEffect(() => {
    if (!DEMO || room?.status !== 'question') return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const qi = room.qIndex, limit = room.timeLimit;
    demoCorrectIndex(code, qi).then(ci => {
      players.filter(p => p.uid.startsWith('bot') && !answered.includes(p.uid)).forEach(p => {
        const delay = 1500 + Math.random() * Math.max(1000, limit * 700);
        const choice = Math.random() < 0.7 ? ci : (ci + 1 + Math.floor(Math.random() * 3)) % 4;
        timers.push(setTimeout(() => { sendAnswer(code, p.uid, qi, choice).catch(() => {}); }, delay));
      });
    }).catch(() => {});
    return () => timers.forEach(clearTimeout);
  }, [room?.status, room?.qIndex, players.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const left = room?.status === 'question' ? Math.max(0, room.timeLimit - (now - ms(room.startedAt)) / 1000) : 0;
  const secLeft = Math.ceil(left);

  // Đọc câu hỏi khi chiếu câu mới
  useEffect(() => {
    if (!voice || room?.status !== 'question') return;
    const id = setTimeout(() => speak(`Câu ${room.qIndex + 1}. ${toSpeech(room.q)}`), 1200);
    return () => clearTimeout(id);
  }, [room?.qIndex, room?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  // Tích tắc 5 giây cuối
  useEffect(() => {
    if (room?.status !== 'question' || secLeft <= 0 || secLeft > 5) return;
    if (secLeft <= 3) SND.tickHot(); else SND.tick();
  }, [secLeft]); // eslint-disable-line react-hooks/exhaustive-deps
  const ranked = useMemo(() => [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)), [players]);

  async function doReveal() {
    if (!room || room.status !== 'question' || revealing.current) return;
    revealing.current = true; setBusy(true);
    try {
      SND.drumRoll(0.9);
      const [gains] = await Promise.all([revealQuestion(room, players), new Promise(r => setTimeout(r, 950))]);
      SND.ok();
      if (gains.length && gains.length === players.length) setTimeout(SND.streak, 600);
      const names = new Map(players.map(p => [p.uid, p.name]));
      const best = gains.sort((a, b) => b.points - a.points)[0];
      setTicker(t => [
        gains.length ? `${gains.length} người trả lời đúng câu ${room.qIndex + 1}${best ? ` · Nhanh nhất: ${names.get(best.uid)}` : ''}` : `Câu ${room.qIndex + 1}: chưa ai trả lời đúng`,
        ...t].slice(0, 6));
      const base = Date.now();
      setFloats(gains.map((g, i) => ({ id: base + i, uid: g.uid, text: `+${g.points}` })));
      setTimeout(() => setFloats([]), 2200);
    } catch (e) { console.error(e); alert('Chưa chấm được câu này. Kiểm tra mạng rồi bấm lại.'); }
    finally { revealing.current = false; setBusy(false); }
  }

  // Tự hiện đáp án khi hết giờ hoặc khi mọi người đã trả lời
  useEffect(() => {
    if (room?.status !== 'question') return;
    if (left <= 0 || (players.length > 0 && answered.length >= players.length)) doReveal();
  }, [left <= 0, answered.length, players.length, room?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function next() {
    if (!room) return;
    setBusy(true);
    try {
      if (room.qIndex + 1 >= room.total) { await endRoom(code); SND.fanfare(); setTimeout(SND.bell, 1400); }
      else { await showQuestion(code, room.qIndex + 1); SND.gong(); }
    } catch (e) { console.error(e); alert('Không chuyển được câu. Kiểm tra mạng rồi thử lại.'); }
    finally { setBusy(false); }
  }

  function toggleFull() {
    try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => {}); } catch { /* bỏ qua */ }
  }

  if (!room) return <div className="lv-stage"><TempleHall /><div className="lv-center-msg">Đang mở cửa chùa…</div></div>;

  const L = LEVELS[room.level - 1];
  const n = players.length;
  const seat = n <= 16 ? 78 : n <= 32 ? 62 : n <= 60 ? 50 : 40;
  const shown = ranked.slice(0, 90);
  const correctSet = new Set(room.status === 'reveal' ? players.filter(p => p.lastQ === room.qIndex && p.lastCorrect).map(p => p.uid) : []);
  const answeredSet = new Set(answered);
  const totalAns = room.stats.reduce((s, x) => s + x, 0) || 1;

  return (
    <div className="lv-stage">
      <TempleHall />

      <header className="lv-top">
        <div className="lv-title">Chùa Toán Online<small>{gradeLabel(room.grade)} · Mức {room.level}: {L.place} ({L.degree})</small></div>
        <div className="lv-ticker" aria-live="polite"><span key={ticker[0]}>{ticker[0]}</span></div>
        <div className="lv-chips">
          <div><b>{n}</b>đang ngồi</div>
          <div><b>{Math.max(0, room.qIndex + 1)}/{room.total}</b>câu</div>
          {room.status === 'question' && <div><b>{answered.length}</b>đã chọn</div>}
        </div>
      </header>

      <aside className="lv-join">
        <span className="lv-label">Quét để vào chùa</span>
        {qr ? <img src={qr} alt={`Mã QR vào phòng ${code}`} /> : <div className="lv-qr-ph" />}
        <span className="lv-code">{code}</span>
        {DEMO
          ? <span className="lv-url">Bản chơi thử: bấm “+ 8 người chơi ảo” ở góc dưới để có bạn chơi cùng.</span>
          : <span className="lv-url">{url.replace(/^https?:\/\//, '')}</span>}
      </aside>

      <aside className="lv-board">
        <div className="lv-board-title">Bảng công đức</div>
        {ranked.length === 0 ? <p className="lv-muted">Chưa có ai vào chùa.</p> : ranked.slice(0, 6).map((p, i) => (
          <div key={p.uid} className="lv-board-row">
            <span className={`lv-rank r${i + 1}`}>{i + 1}</span>
            <Avatar color={p.color} size={26} />
            <span className="nm">{p.name}</span>
            <b>{p.score}</b>
          </div>
        ))}
      </aside>

      <section className="lv-center">
        {room.status === 'lobby' && (
          <div className="lv-card lv-welcome">
            <h2>Mời các con vào chùa</h2>
            <p>Mở camera điện thoại quét mã QR, hoặc vào trang game và nhập mã phòng <b>{code}</b>. Nhập tên là có chỗ ngồi trong chánh điện.</p>
            <p className="lv-muted">Mỗi câu đúng được 100 công đức, trả lời càng nhanh càng được thêm (tối đa +50).</p>
          </div>
        )}
        {(room.status === 'question' || room.status === 'reveal') && (
          <div className="lv-card lv-qcard">
            <div className="lv-qhead">
              <span className="lv-qtag">Câu {room.qIndex + 1}/{room.total}</span>
              {room.status === 'question'
                ? <span className={`lv-timer ${left <= 5 ? 'hot' : ''}`}>{Math.ceil(left)}</span>
                : <span className="lv-qtag ok">Đáp án</span>}
            </div>
            <Html className="lv-q" html={room.q} />
            <div className="lv-opts">
              {room.options.map((o, i) => {
                const st = room.status === 'reveal' ? (i === room.revealIdx ? 'right' : 'dim') : '';
                return (
                  <div key={i} className={`lv-opt ${st}`} style={{ ['--c' as string]: OPT_COLORS[i] }}>
                    <span className="L">{LET[i]}</span><Html html={o} />
                    {room.status === 'reveal' && <span className="cnt"><i style={{ width: `${(room.stats[i] / totalAns) * 100}%` }} />{room.stats[i]}</span>}
                  </div>
                );
              })}
            </div>
            {room.status === 'reveal' && room.g && <div className="lv-sol"><b>Lời giải: </b><Html html={room.g} /></div>}
          </div>
        )}
        {room.status === 'ended' && (
          <div className="lv-card lv-podium">
            <h2>Lễ vinh danh</h2>
            <div className="lv-pod">
              {[1, 0, 2].map(i => ranked[i] && (
                <div key={ranked[i].uid} className={`pod p${i + 1}`}>
                  <Avatar color={ranked[i].color} size={i === 0 ? 96 : 72} glow />
                  <span className="nm">{ranked[i].name}</span>
                  <span className="sc">{ranked[i].score} công đức</span>
                  <div className="step">{i + 1}</div>
                </div>
              ))}
            </div>
            {ranked.length === 0 && <p>Chưa có người chơi.</p>}
          </div>
        )}
      </section>

      <section className="lv-floor" aria-label="Người chơi trong chánh điện">
        {shown.map(p => (
          <div key={p.uid} className={`lv-seat ${correctSet.has(p.uid) ? 'ok' : ''}`} style={{ width: seat + 14 }}>
            {answeredSet.has(p.uid) && room.status === 'question' && <span className="lv-done">✓</span>}
            {floats.filter(f => f.uid === p.uid).map(f => <span key={f.id} className="lv-float">{f.text}</span>)}
            <Avatar color={p.color} size={seat} glow={correctSet.has(p.uid)} incense={correctSet.has(p.uid)} />
            <span className="lv-name">{p.name}</span>
          </div>
        ))}
        {n > shown.length && <div className="lv-more">+{n - shown.length} người nữa</div>}
      </section>

      <nav className="lv-host-ctrl">
        {DEMO && room.status !== 'ended' && <button className="lv-btn ghost" onClick={() => addBots(8)}>+ 8 người chơi ảo</button>}
        {room.status === 'lobby' && <button className="lv-btn" disabled={busy} onClick={next}>Bắt đầu ({n} người)</button>}
        {room.status === 'question' && <button className="lv-btn" disabled={busy} onClick={doReveal}>Hiện đáp án</button>}
        {room.status === 'reveal' && <button className="lv-btn" disabled={busy} onClick={next}>{room.qIndex + 1 >= room.total ? 'Vinh danh' : 'Câu tiếp →'}</button>}
        {room.status !== 'ended' && room.status !== 'lobby' && <button className="lv-btn ghost" disabled={busy} onClick={() => endRoom(code)}>Kết thúc</button>}
        <button className="lv-btn ghost" onClick={() => { const m = !music; setMusicOn(m); setMusicState(m); if (m) startMusic('live'); }}>{music ? 'Nhạc: bật' : 'Nhạc: tắt'}</button>
        <button className="lv-btn ghost" onClick={() => setVoice(v => !v)}>{voice ? 'Đọc đề: bật' : 'Đọc đề: tắt'}</button>
        <button className="lv-btn ghost" onClick={() => { const m = !isMuted(); setMuted(m); setM(m); }}>{muted ? 'Bật tiếng' : 'Tắt tiếng'}</button>
        <button className="lv-btn ghost" onClick={toggleFull}>Toàn màn hình</button>
        <button className="lv-btn ghost" onClick={onExit}>Thoát</button>
      </nav>
    </div>
  );
}
