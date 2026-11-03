import React, { useEffect, useState } from 'react';
import './game.css';
import { useAuth } from '../components/AuthProvider';
import GamePlay from './GamePlay';
import { GRADES, LEVELS, gradeFromClass, gradeLabel, titleOf } from './levels';
import {
  GameConfig, Progress, RoundResult, Session, classAllowed, loadConfig, loadProgress, listSessions,
  maxPassed, recordRound, bestPassedAll, savePlayer,
} from './progress';
import { SND } from './sound';

const DEG_COLORS = ['#3f7cc4', '#2f8a5f', '#d0782a', '#b0342c'];

type Props = {
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onOpenGrader?: () => void;  // không có khi chơi khách trên máy
  onLogout: () => void;
  localUid?: string;          // chế độ khách lưu trên máy
};

function Gate({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="ctg ctg-gate">
      <div className="ctg-panel">
        <h2>{title}</h2>
        <p>{text}</p>
        <div className="ctg-actions">{children}</div>
      </div>
    </div>
  );
}

/** Màn hình khai báo tên và lớp (lần đầu vào chơi hoặc khi sửa). */
function PlayerForm({ initName, initClass, onSave, onCancel }: {
  initName: string; initClass: string; onSave: (name: string, cls: string) => Promise<void>; onCancel?: () => void;
}) {
  const [name, setName] = useState(initName);
  const [cls, setCls] = useState(initClass);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="ctg ctg-gate">
      <form className="ctg-panel" onSubmit={async e => {
        e.preventDefault();
        if (!name.trim()) { setErr('Em nhập tên để thầy cô biết em là ai nhé.'); return; }
        setBusy(true); setErr('');
        try { await onSave(name.trim(), cls.trim()); } catch (e2) { console.error(e2); setErr('Chưa lưu được. Kiểm tra mạng rồi thử lại.'); setBusy(false); }
      }}>
        <h2>Chào mừng em đến chùa!</h2>
        <p>Cho chú tiểu biết tên và lớp của em nhé.</p>
        <div className="ctg-form">
          <label htmlFor="ctg-name">Tên của em
            <input id="ctg-name" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Nguyễn Minh An" maxLength={60} />
          </label>
          <label htmlFor="ctg-class">Lớp (không bắt buộc)
            <input id="ctg-class" value={cls} onChange={e => setCls(e.target.value)} placeholder="VD: 3A, 6B, 9A1" maxLength={20} />
          </label>
        </div>
        {err && <p style={{ color: 'var(--cinnabar)' }}>{err}</p>}
        <div className="ctg-actions">
          <button className="ctg-btn" type="submit" disabled={busy}>{busy ? 'Đang lưu…' : 'Vào sân chùa'}</button>
          {onCancel && <button className="ctg-btn ghost" type="button" onClick={onCancel}>Hủy</button>}
        </div>
      </form>
    </div>
  );
}

/** Trò chơi cho mọi người đăng nhập: sân chùa (chọn lớp, mức) và màn chơi. */
export default function StudentGame({ isAdmin, onOpenAdmin, onOpenGrader, onLogout, localUid }: Props) {
  const { profile } = useAuth();
  const [cfg, setCfg] = useState<GameConfig | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [grade, setGrade] = useState(gradeFromClass(profile?.className));
  const [playing, setPlaying] = useState<{ level: number; key: number } | null>(null);
  const [editing, setEditing] = useState(false);

  const uid = localUid || profile?.uid || '';
  const isGuest = !!localUid || !profile?.email;
  const email = profile?.email || '';
  const who = {
    uid,
    name: progress?.name || profile?.fullName || profile?.displayName || '',
    className: progress?.className ?? profile?.className ?? '',
    email,
  };

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const [c, p, s] = await Promise.all([loadConfig(), loadProgress(uid), listSessions(uid).catch(() => [])]);
        setCfg(c); setProgress(p); setSessions(s);
        if (p?.lastGrade) setGrade(p.lastGrade);
        else if (p?.className) setGrade(gradeFromClass(p.className));
      } catch (e) {
        console.error(e);
        setLoadError('Không tải được dữ liệu trò chơi. Kiểm tra mạng rồi thử lại.');
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  const adminLinks = (
    <div className="ctg-links">
      {isAdmin && <button onClick={onOpenAdmin}>Quản lý trò chơi</button>}
      {onOpenGrader && !isGuest && <button onClick={onOpenGrader}>Công cụ chấm bài tự luận</button>}
      <button onClick={onLogout}>{isGuest ? 'Thoát' : 'Đăng xuất'}</button>
    </div>
  );

  if (loading) return <div className="ctg ctg-gate"><div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" /></div>;
  if (loadError || !cfg) return <Gate title="Chưa vào được chùa" text={loadError || 'Có lỗi xảy ra.'}>{adminLinks}</Gate>;
  if (progress?.blocked && !isAdmin) return <Gate title="Tài khoản đang tạm khóa" text="Người quản lý đã tạm khóa quyền chơi của em. Em hãy liên hệ thầy cô để được mở lại.">{adminLinks}</Gate>;
  if (!cfg.isOpen && !isAdmin) return <Gate title="Cổng chùa đang đóng" text="Trò chơi đang tạm đóng. Em quay lại sau nhé!">{adminLinks}</Gate>;

  if (!progress || editing) {
    return (
      <PlayerForm
        initName={who.name}
        initClass={who.className}
        onCancel={progress ? () => setEditing(false) : undefined}
        onSave={async (name, cls) => {
          const p = await savePlayer(progress, { uid, name, className: cls, email });
          setProgress(p);
          if (cls) setGrade(gradeFromClass(cls));
          setEditing(false);
        }}
      />
    );
  }

  if (!classAllowed(cfg, who.className) && !isAdmin) {
    return (
      <Gate title="Lớp em chưa được mở" text={`Trò chơi hiện chỉ mở cho các lớp: ${cfg.allowedClasses}. Nếu em ghi nhầm lớp, hãy sửa lại.`}>
        <button className="ctg-btn" onClick={() => setEditing(true)}>Sửa tên, lớp</button>
        {adminLinks}
      </Gate>
    );
  }

  const handleFinish = async (r: RoundResult) => {
    const np = await recordRound(who, progress, r);
    setProgress(np);
    setSessions(s => [...s, { ...r, uid, name: who.name, className: who.className, playedAt: np.lastPlayedAt }]);
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

  const gp = progress.grades?.[String(grade)];
  const unlocked = Math.max(1, gp?.unlocked || 1);
  const passedHere = maxPassed(gp);
  const best = bestPassedAll(progress);
  const rate = progress.answered ? Math.round((progress.correct / progress.answered) * 100) : 0;
  const recent = sessions.slice(-6).reverse();

  return (
    <div className="ctg">
      <div className="ctg-hub">
        <div className="ctg-hub-head">
          <div className="ctg-brand">Lên Chùa Học Toán<small>{who.name}{who.className ? ` · Lớp ${who.className}` : ''}</small></div>
          <div className="ctg-chip">Công đức <b>{progress.merit || 0}</b></div>
          <div className="ctg-chip">Lượt chơi <b>{progress.plays || 0}</b></div>
          <div className="ctg-chip">Tỉ lệ đúng <b>{rate}%</b></div>
          <button className="ctg-ibtn" onClick={() => setEditing(true)}>Sửa tên, lớp</button>
          {isAdmin && <button className="ctg-ibtn" onClick={onOpenAdmin}>Quản lý</button>}
          <button className="ctg-ibtn" onClick={onLogout}>{isGuest ? 'Thoát' : 'Đăng xuất'}</button>
        </div>

        {localUid && (
          <div className="ctg-box">Em đang chơi không cần tài khoản. Kết quả được lưu trên máy này.</div>
        )}

        {!cfg.isOpen && isAdmin && (
          <div className="ctg-box" style={{ borderColor: 'var(--cinnabar)' }}>Trò chơi đang đóng với người chơi. Thầy vẫn vào được vì là người quản lý.</div>
        )}

        <div className="ctg-hero">
          <div className="ctg-box">
            <h1>Mỗi bậc đá là một câu đố</h1>
            <p>Chọn lớp của em, rồi đi từ <b>Cổng Tam Quan</b> lên <b>Tháp Chuông</b> qua bốn mức: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao.
              Đúng ít nhất <b>{cfg.passScore}/{cfg.questionsPerRound}</b> câu để mở khóa mức tiếp theo. Bấm <b>Đọc đề</b> để nghe câu hỏi.</p>
          </div>
          <div className="ctg-box ctg-rank">
            <span className="ctg-label">Danh hiệu cao nhất</span>
            <span className="t">{titleOf(best)}</span>
            <span className="ctg-label">Tiến độ {gradeLabel(grade).toLowerCase()}: {passedHere}/4 mức</span>
            <div className="ctg-bar"><i style={{ width: `${(passedHere / 4) * 100}%` }} /></div>
          </div>
        </div>

        <div className="ctg-grades" role="group" aria-label="Chọn lớp">
          <span className="ctg-label" style={{ marginRight: 6 }}>Chọn lớp</span>
          {GRADES.map(g => (
            <button key={g} className="ctg-gbtn" aria-pressed={g === grade} onClick={() => setGrade(g)}>{gradeLabel(g)}</button>
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
              <thead><tr><th>Thời gian</th><th>Lớp</th><th>Mức</th><th>Kết quả</th><th>Công đức</th></tr></thead>
              <tbody>
                {recent.map((s, k) => (
                  <tr key={s.id || k}>
                    <td>{new Date(s.playedAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                    <td>{gradeLabel(s.grade)}</td>
                    <td>{LEVELS[s.level - 1]?.place}</td>
                    <td className={s.passed ? 'ctg-ok' : 'ctg-no'}>{s.correct}/{s.total} · {s.passed ? 'Vượt mức' : 'Chưa đạt'}</td>
                    <td>+{s.merit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {adminLinks}
      </div>
    </div>
  );
}
