import React, { useEffect, useState } from 'react';
import './game.css';
import { useAuth } from '../components/AuthProvider';
import GamePlay from './GamePlay';
import { GRADES, LEVELS, gradeFromClass, titleOf } from './levels';
import {
  GameConfig, Progress, RoundResult, Session, classAllowed, loadConfig, loadProgress, listSessions,
  maxPassed, recordRound, bestPassedAll,
} from './progress';
import { SND } from './sound';

const DEG_COLORS = ['#3f7cc4', '#2f8a5f', '#d0782a', '#b0342c'];

function Gate({ title, text, onExit }: { title: string; text: string; onExit: () => void }) {
  return (
    <div className="ctg ctg-gate">
      <div className="ctg-panel">
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="ctg-actions"><button className="ctg-btn" onClick={onExit}>Quay lại</button></div>
      </div>
    </div>
  );
}

/** Khu trò chơi của học sinh: sân chùa (chọn khối, mức) và màn chơi. */
export default function StudentGame({ onExit }: { onExit: () => void }) {
  const { profile } = useAuth();
  const [cfg, setCfg] = useState<GameConfig | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [grade, setGrade] = useState(gradeFromClass(profile?.className));
  const [playing, setPlaying] = useState<{ level: number; key: number } | null>(null);

  const who = {
    uid: profile?.uid || '',
    name: profile?.fullName || profile?.displayName || '',
    className: profile?.className || '',
    email: profile?.email || '',
  };

  useEffect(() => {
    if (!who.uid) return;
    (async () => {
      try {
        const [c, p, s] = await Promise.all([loadConfig(), loadProgress(who.uid), listSessions(who.uid).catch(() => [])]);
        setCfg(c); setProgress(p); setSessions(s);
        if (p?.lastGrade) setGrade(p.lastGrade);
      } catch (e) {
        console.error(e);
        setLoadError('Không tải được dữ liệu trò chơi. Kiểm tra mạng rồi thử lại.');
      } finally {
        setLoading(false);
      }
    })();
  }, [who.uid]);

  if (loading) return <div className="ctg ctg-gate"><div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" /></div>;
  if (loadError || !cfg) return <Gate title="Chưa vào được chùa" text={loadError || 'Có lỗi xảy ra.'} onExit={onExit} />;
  if (progress?.blocked) return <Gate title="Tài khoản đang tạm khóa" text="Thầy cô đã tạm khóa quyền chơi của em. Em hãy gặp thầy cô để được mở lại." onExit={onExit} />;
  if (!cfg.isOpen) return <Gate title="Cổng chùa đang đóng" text="Thầy cô chưa mở trò chơi lúc này. Em quay lại sau nhé!" onExit={onExit} />;
  if (!classAllowed(cfg, who.className)) return <Gate title="Lớp em chưa được mở" text={`Trò chơi hiện chỉ mở cho các lớp: ${cfg.allowedClasses}.`} onExit={onExit} />;

  const handleFinish = async (r: RoundResult) => {
    const np = await recordRound(who, progress, r);
    setProgress(np);
    setSessions(s => [...s, { ...r, uid: who.uid, name: who.name, className: who.className, playedAt: np.lastPlayedAt }]);
  };

  if (playing) {
    return (
      <div className="ctg">
        <GamePlay
          key={playing.key}
          grade={grade}
          level={playing.level}
          cfg={cfg}
          onFinish={handleFinish}
          onReplay={() => setPlaying(p => p && { level: p.level, key: p.key + 1 })}
          onNextLevel={() => setPlaying(p => p && { level: Math.min(4, p.level + 1), key: p.key + 1 })}
          onExit={() => setPlaying(null)}
        />
      </div>
    );
  }

  const gp = progress?.grades?.[String(grade)];
  const unlocked = Math.max(1, gp?.unlocked || 1);
  const passedHere = maxPassed(gp);
  const best = progress ? bestPassedAll(progress) : 0;
  const rate = progress?.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
  const recent = sessions.slice(-6).reverse();

  return (
    <div className="ctg">
      <div className="ctg-hub">
        <div className="ctg-hub-head">
          <div className="ctg-brand">Lên Chùa Học Toán<small>{who.name} · Lớp {who.className}</small></div>
          <div className="ctg-chip">Công đức <b>{progress?.merit || 0}</b></div>
          <div className="ctg-chip">Lượt chơi <b>{progress?.plays || 0}</b></div>
          <div className="ctg-chip">Tỉ lệ đúng <b>{rate}%</b></div>
          <button className="ctg-ibtn" onClick={onExit}>Thoát</button>
        </div>

        <div className="ctg-hero">
          <div className="ctg-box">
            <h1>Mỗi bậc đá là một câu đố</h1>
            <p>Đi từ <b>Cổng Tam Quan</b> lên <b>Tháp Chuông</b> qua bốn mức: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao.
              Đúng ít nhất <b>{cfg.passScore}/{cfg.questionsPerRound}</b> câu để vượt mức và mở khóa mức tiếp theo. Mỗi câu đúng được thêm công đức.</p>
          </div>
          <div className="ctg-box ctg-rank">
            <span className="ctg-label">Danh hiệu cao nhất</span>
            <span className="t">{titleOf(best)}</span>
            <span className="ctg-label">Tiến độ lớp {grade}: {passedHere}/4 mức</span>
            <div className="ctg-bar"><i style={{ width: `${(passedHere / 4) * 100}%` }} /></div>
          </div>
        </div>

        <div className="ctg-grades" role="group" aria-label="Chọn khối">
          <span className="ctg-label" style={{ marginRight: 6 }}>Chọn khối</span>
          {GRADES.map(g => (
            <button key={g} className="ctg-gbtn" aria-pressed={g === grade} onClick={() => setGrade(g)}>Lớp {g}</button>
          ))}
        </div>

        <div className="ctg-levels">
          {LEVELS.map((L, idx) => {
            const st = gp?.levels?.[String(L.id)];
            const locked = L.id > unlocked;
            return (
              <div key={L.id} className={`ctg-lv ${locked ? 'locked' : ''}`} style={{ marginBottom: idx * 18 }}>
                <span className="n">Mức {L.id}{st?.passed ? ' · Đã vượt' : ''}</span>
                <h3>{L.place}</h3>
                <span className="deg" style={{ background: DEG_COLORS[idx] }}>{L.degree}</span>
                <span className="st" aria-label={`${st?.stars || 0} sao`}>
                  {[1, 2, 3].map(s => <span key={s} className={s <= (st?.stars || 0) ? 'on' : ''}>★</span>)}
                </span>
                <span className="meta">
                  {locked ? `Vượt mức ${L.id - 1} để mở khóa` : st ? `Cao nhất ${st.best}/${st.total} · ${st.plays} lượt` : 'Chưa chơi'}
                </span>
                <button className="ctg-btn" disabled={locked} onClick={() => { SND.unlock(); setPlaying({ level: L.id, key: Date.now() }); }}>
                  {locked ? 'Đang khóa' : st ? 'Chơi lại' : 'Vào chơi'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="ctg-box" style={{ overflowX: 'auto' }}>
          <span className="ctg-label">Các lượt chơi gần đây</span>
          {recent.length === 0 ? (
            <p style={{ margin: '10px 0 0', color: '#e9def5' }}>Em chưa chơi lượt nào. Bắt đầu từ Cổng Tam Quan nhé!</p>
          ) : (
            <table className="ctg-hist">
              <thead><tr><th>Thời gian</th><th>Khối</th><th>Mức</th><th>Kết quả</th><th>Công đức</th></tr></thead>
              <tbody>
                {recent.map((s, k) => (
                  <tr key={s.id || k}>
                    <td>{new Date(s.playedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{s.grade}</td>
                    <td>{LEVELS[s.level - 1]?.place}</td>
                    <td className={s.passed ? 'ctg-ok' : 'ctg-no'}>{s.correct}/{s.total} · {s.passed ? 'Vượt mức' : 'Chưa đạt'}</td>
                    <td>+{s.merit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
