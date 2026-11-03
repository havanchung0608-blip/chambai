import React, { useEffect, useMemo, useState } from 'react';
import './live.css';
import Avatar from './Avatar';
import { Player as P, Room, cleanCode, joinRoom, ms, myAnswer, sendAnswer, watchPlayer, watchPlayers, watchRoom } from './liveApi';
import { LEVELS, gradeLabel } from '../game/levels';
import { SND, stopMusic } from '../game/sound';

const LET = ['A', 'B', 'C', 'D'];
const OPT_COLORS = ['#d9534f', '#3f7cc4', '#e0a12a', '#2f8a5f'];
const NAME_KEY = 'lv-name';
const savedName = () => { try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; } };

function Html({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Màn hình nhập mã phòng và tên. ensureUser: đăng nhập (khách) nếu cần, trả về uid. */
export function JoinForm({ initCode, initName, ensureUser, onJoined, onBack }: {
  initCode: string; initName: string; ensureUser: () => Promise<string>; onJoined: (code: string, uid: string) => void; onBack?: () => void;
}) {
  const [code, setCode] = useState(initCode);
  const [name, setName] = useState(initName || savedName());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="lv-phone">
      <form className="lv-pcard" onSubmit={async e => {
        e.preventDefault();
        const c = cleanCode(code), nm = name.trim();
        if (!c) { setErr('Em nhập mã phòng thầy cô cho nhé.'); return; }
        if (!nm) { setErr('Em nhập tên để mọi người thấy em trong chùa nhé.'); return; }
        setBusy(true); setErr('');
        try {
          const uid = await ensureUser();
          const r = await joinRoom(c, uid, nm.slice(0, 24));
          if (r === 'missing') { setErr(`Không tìm thấy phòng ${c}. Em kiểm tra lại mã.`); setBusy(false); return; }
          if (r === 'ended') { setErr('Phòng này đã kết thúc.'); setBusy(false); return; }
          try { localStorage.setItem(NAME_KEY, nm); } catch { /* bỏ qua */ }
          SND.mo();
          onJoined(c, uid);
        } catch (e2) {
          console.error(e2);
          setErr(e2 instanceof Error && e2.name === 'LiveError' ? e2.message : 'Chưa vào được phòng. Kiểm tra mạng rồi thử lại.');
          setBusy(false);
        }
      }}>
        <Avatar color={0} size={84} />
        <h1>Vào Chùa Toán Online</h1>
        <label htmlFor="lv-code">Mã phòng<input id="lv-code" value={code} onChange={e => setCode(cleanCode(e.target.value))} placeholder="VD: K7M2Q" autoCapitalize="characters" inputMode="text" /></label>
        <label htmlFor="lv-name">Tên của em<input id="lv-name" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Minh An 6A" maxLength={24} /></label>
        {err && <p className="lv-err">{err}</p>}
        <button className="lv-btn big" type="submit" disabled={busy}>{busy ? 'Đang vào…' : 'Vào chùa'}</button>
        {onBack && <button className="lv-btn ghost" type="button" onClick={onBack}>Quay lại</button>}
      </form>
    </div>
  );
}

/** Màn hình chơi trên điện thoại. */
export function PlayerScreen({ code, uid, onExit }: { code: string; uid: string; onExit: () => void }) {
  const [room, setRoom] = useState<Room | null | undefined>(undefined);
  const [me, setMe] = useState<P | null>(null);
  const [players, setPlayers] = useState<P[]>([]);
  const [choice, setChoice] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { stopMusic(); }, []); // điện thoại học sinh: không phát nhạc nền để lớp đỡ ồn
  useEffect(() => watchRoom(code, setRoom), [code]);
  useEffect(() => watchPlayer(code, uid, setMe), [code, uid]);
  useEffect(() => watchPlayers(code, setPlayers), [code]);
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 300); return () => clearInterval(id); }, []);

  // Câu mới: xóa lựa chọn cũ, kiểm tra xem đã trả lời chưa (khi tải lại trang)
  useEffect(() => {
    if (!room || room.qIndex < 0) return;
    setChoice(null);
    myAnswer(code, uid, room.qIndex).then(c => { if (c !== null) setChoice(c); }).catch(() => {});
  }, [room?.qIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Âm thanh khi có kết quả
  useEffect(() => {
    if (room?.status !== 'reveal' || !me || me.lastQ !== room.qIndex) return;
    if (me.lastCorrect) { SND.ok(); if (me.streak >= 3) setTimeout(SND.streak, 600); } else SND.bad();
  }, [room?.status, me?.lastQ]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tiếng báo câu mới và tích tắc 3 giây cuối trên điện thoại
  const pSec = room && room.status === 'question' ? Math.ceil(Math.max(0, room.timeLimit - (now - ms(room.startedAt)) / 1000)) : -1;
  useEffect(() => { if (room?.status === 'question') SND.gong(); }, [room?.qIndex, room?.status]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (pSec > 0 && pSec <= 3 && choice === null) SND.tickHot(); }, [pSec]); // eslint-disable-line react-hooks/exhaustive-deps

  const rank = useMemo(() => {
    const sorted = [...players].sort((a, b) => b.score - a.score);
    return sorted.findIndex(p => p.uid === uid) + 1;
  }, [players, uid]);

  if (room === undefined) return <div className="lv-phone"><div className="lv-pcard">Đang vào chùa…</div></div>;
  if (room === null) return <div className="lv-phone"><div className="lv-pcard"><h1>Phòng không còn</h1><button className="lv-btn" onClick={onExit}>Thoát</button></div></div>;

  const left = room.status === 'question' ? Math.max(0, room.timeLimit - (now - ms(room.startedAt)) / 1000) : 0;
  const pick = async (i: number) => {
    if (choice !== null || sending || room.status !== 'question' || left <= 0) return;
    setSending(true); setChoice(i); SND.tap(); SND.mo(0.05);
    try { await sendAnswer(code, uid, room.qIndex, i); }
    catch (e) { console.error(e); setChoice(null); alert('Chưa gửi được. Em bấm lại nhé.'); }
    finally { setSending(false); }
  };
  const L = LEVELS[room.level - 1];
  const judged = room.status === 'reveal' && me && me.lastQ === room.qIndex;

  return (
    <div className="lv-phone">
      <header className="lv-phead">
        <Avatar color={me?.color ?? 0} size={44} glow={!!judged && me!.lastCorrect} />
        <div className="who"><b>{me?.name || '…'}</b><small>Phòng {code} · {gradeLabel(room.grade)} · {L.degree}</small></div>
        <div className="sc"><b>{me?.score ?? 0}</b><small>{rank ? `Hạng ${rank}/${players.length}` : 'công đức'}</small></div>
      </header>

      {room.status === 'lobby' && (
        <div className="lv-pcard">
          <h1>Em đã vào chùa!</h1>
          <p>Nhìn lên màn hình lớn để thấy chú tiểu của em. Chờ thầy cô bắt đầu nhé.</p>
          <p className="lv-muted">{players.length} người đang ngồi trong chánh điện</p>
        </div>
      )}

      {room.status === 'question' && (
        <div className="lv-pq">
          <div className="lv-pqtop"><span>Câu {room.qIndex + 1}/{room.total}</span><span className={`lv-timer ${left <= 5 ? 'hot' : ''}`}>{Math.ceil(left)}</span></div>
          <div className="lv-pqtext"><Html html={room.q} /></div>
          <div className="lv-pbtns">
            {room.options.map((o, i) => (
              <button key={i} className={`lv-pbtn ${choice === i ? 'sel' : choice !== null ? 'dim' : ''}`} style={{ ['--c' as string]: OPT_COLORS[i] }}
                disabled={choice !== null || left <= 0} onClick={() => pick(i)}>
                <span className="L">{LET[i]}</span><Html html={o} />
              </button>
            ))}
          </div>
          {choice !== null && <p className="lv-wait">Em đã chọn {LET[choice]}. Chờ thầy cô hiện đáp án…</p>}
          {choice === null && left <= 0 && <p className="lv-wait">Hết giờ rồi!</p>}
        </div>
      )}

      {room.status === 'reveal' && (
        <div className={`lv-pcard ${judged && me!.lastCorrect ? 'ok' : 'no'}`}>
          <h1>{!judged ? 'Đang chấm…' : me!.lastCorrect ? `Đúng rồi! +${me!.lastPoints}` : choice === null ? 'Em chưa chọn đáp án' : 'Chưa đúng rồi'}</h1>
          <p>Đáp án đúng: <b>{LET[room.revealIdx]}. <Html html={room.options[room.revealIdx] || ''} /></b></p>
          {room.g && <p className="lv-sol-p"><Html html={room.g} /></p>}
          {judged && me!.streak >= 2 && <p className="lv-streak">Em đúng {me!.streak} câu liên tiếp!</p>}
          <p className="lv-muted">Chờ câu tiếp theo…</p>
        </div>
      )}

      {room.status === 'ended' && (
        <div className="lv-pcard ok">
          <h1>Hết buổi rồi!</h1>
          <p>Em đứng <b>hạng {rank}/{players.length}</b> với <b>{me?.score ?? 0} công đức</b>, đúng {me?.correct ?? 0}/{room.total} câu.</p>
          <button className="lv-btn" onClick={onExit}>Về trang chủ</button>
        </div>
      )}
    </div>
  );
}
