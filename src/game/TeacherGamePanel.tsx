import React, { useEffect, useMemo, useState } from 'react';
import './game.css';
import { Lock, Unlock, RotateCcw, Eye, X, Save, FileDown, Search, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../components/AuthProvider';
import { GRADES, LEVELS, NEWCOMER, titleOf } from './levels';
import {
  DEFAULT_CONFIG, GameConfig, Progress, Session, bestPassedAll, listProgress, listSessions, loadConfig,
  maxPassed, resetProgress, saveConfig, setBlocked, setUnlocked,
} from './progress';

const LV_BADGE = ['bg-gray-100 text-gray-500', 'bg-sky-100 text-sky-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-rose-100 text-rose-700'];
const fmtDate = (s?: string) => (s ? new Date(s).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
const pct = (p: Progress) => (p.answered ? Math.round((p.correct / p.answered) * 100) : 0);

function Html({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

function Stars({ n }: { n: number }) {
  return <span className="tracking-widest">{[1, 2, 3].map(s => <span key={s} className={s <= n ? 'text-amber-400' : 'text-gray-200'}>★</span>)}</span>;
}

/** Ô tiến độ 4 mức của một khối: xanh = đã vượt, vàng = đang mở, xám = khóa. */
function LevelDots({ p, grade }: { p: Progress; grade: number }) {
  const gp = p.grades?.[String(grade)];
  if (!gp) return null;
  return (
    <span className="inline-flex items-center gap-1 mr-3 whitespace-nowrap">
      <span className="text-[11px] font-bold text-gray-400">L{grade}</span>
      {LEVELS.map(L => {
        const st = gp.levels?.[String(L.id)];
        const cls = st?.passed ? 'bg-emerald-500' : L.id <= (gp.unlocked || 1) ? 'bg-amber-300' : 'bg-gray-200';
        return <span key={L.id} title={`${L.place}: ${st ? `${st.best}/${st.total}` : 'chưa chơi'}`} className={`w-3 h-3 rounded-full ${cls}`} />;
      })}
    </span>
  );
}

function ConfigCard() {
  const { profile } = useAuth();
  const [cfg, setCfg] = useState<GameConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => { loadConfig().then(setCfg); }, []);
  const upd = (patch: Partial<GameConfig>) => { setCfg(c => ({ ...c, ...patch })); setState('idle'); };
  const save = async () => {
    setState('saving');
    try {
      const q = Math.min(20, Math.max(5, Math.round(cfg.questionsPerRound)));
      const fixed = { ...cfg, questionsPerRound: q, passScore: Math.min(q, Math.max(1, Math.round(cfg.passScore))) };
      await saveConfig(fixed, profile?.uid || '');
      setCfg(fixed);
      setState('saved');
    } catch (e) {
      console.error(e);
      setState('error');
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div>
          <h3 className="text-lg font-extrabold text-indigo-950">Cài đặt trò chơi</h3>
          <p className="text-sm text-gray-500">Áp dụng cho mọi học sinh khi bắt đầu lượt chơi mới.</p>
        </div>
        <button
          onClick={() => upd({ isOpen: !cfg.isOpen })}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${cfg.isOpen ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}
        >
          {cfg.isOpen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {cfg.isOpen ? 'Đang mở cho học sinh' : 'Đang đóng trò chơi'}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="space-y-1.5 md:col-span-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lớp được chơi (để trống = tất cả)</span>
          <input value={cfg.allowedClasses} onChange={e => upd({ allowedClasses: e.target.value })} placeholder="VD: 9A1, 9A2, 8A3"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Số câu mỗi lượt (5–20)</span>
          <input type="number" min={5} max={20} value={cfg.questionsPerRound} onChange={e => upd({ questionsPerRound: +e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Số câu đúng để vượt mức</span>
          <input type="number" min={1} max={cfg.questionsPerRound} value={cfg.passScore} onChange={e => upd({ passScore: +e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {LEVELS.map((L, idx) => (
          <label key={L.id} className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giây/câu · Mức {L.id} ({L.degree})</span>
            <input type="number" min={0} max={300} value={cfg.timeLimits[idx] ?? L.defaultTime}
              onChange={e => { const t = [...cfg.timeLimits]; t[idx] = Math.max(0, +e.target.value); upd({ timeLimits: t }); }}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm" />
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={save} disabled={state === 'saving'} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
          <Save className="w-4 h-4" /> {state === 'saving' ? 'Đang lưu…' : 'Lưu cài đặt'}
        </button>
        <span className="text-sm text-gray-500">
          {state === 'saved' && 'Đã lưu. Học sinh nhận cài đặt mới ở lượt chơi kế tiếp.'}
          {state === 'error' && <span className="text-red-600">Chưa lưu được. Kiểm tra quyền giáo viên và luật Firestore.</span>}
          {state === 'idle' && 'Giới hạn giây = 0 nghĩa là không giới hạn thời gian.'}
        </span>
      </div>
    </div>
  );
}

function StudentDetail({ p, onClose, onChanged }: { p: Progress; onClose: () => void; onChanged: () => void }) {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => { listSessions(p.uid).then(setSessions).catch(() => setSessions([])); }, [p.uid]);

  const chart = (sessions || []).map((s, i) => ({
    lan: i + 1, phanTram: Math.round((s.correct / s.total) * 100), muc: s.level, label: `Lớp ${s.grade} · ${LEVELS[s.level - 1]?.place}`,
  }));
  const grades = GRADES.filter(g => p.grades?.[String(g)]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try { await fn(); onChanged(); } catch (e) { console.error(e); alert('Không thực hiện được. Kiểm tra quyền giáo viên và luật Firestore.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-3xl w-full max-w-5xl my-8 shadow-2xl">
        <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-100">
          <div>
            <h3 className="text-2xl font-extrabold text-indigo-950">{p.name}</h3>
            <p className="text-sm text-gray-500">Lớp {p.className} · {p.email}</p>
            <p className="text-sm mt-1"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${LV_BADGE[bestPassedAll(p)]}`}>{titleOf(bestPassedAll(p))}</span>
              <span className="ml-3 text-gray-600">Công đức <b>{p.merit}</b> · {p.plays} lượt · đúng {pct(p)}%</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-8">
          <div className="flex flex-wrap gap-3">
            <button disabled={busy} onClick={() => run(() => setBlocked(p.uid, !p.blocked))}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${p.blocked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              {p.blocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}{p.blocked ? 'Mở khóa cho em này' : 'Tạm khóa quyền chơi'}
            </button>
            {!confirmReset ? (
              <button disabled={busy} onClick={() => setConfirmReset(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50">
                <RotateCcw className="w-4 h-4" /> Đặt lại tiến độ
              </button>
            ) : (
              <span className="flex items-center gap-2 text-sm">
                Xóa toàn bộ mức đã vượt và công đức của em này?
                <button disabled={busy} onClick={() => run(async () => { await resetProgress(p); setConfirmReset(false); })} className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold">Đặt lại</button>
                <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 rounded-lg border border-gray-200">Hủy</button>
              </span>
            )}
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Tiến độ theo mức độ</h4>
            {grades.length === 0 ? <p className="text-sm text-gray-500">Chưa chơi lượt nào.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-[11px] uppercase tracking-widest text-gray-400">
                    <th className="py-2 pr-4">Khối</th>
                    {LEVELS.map(L => <th key={L.id} className="py-2 pr-4">Mức {L.id} · {L.degree}</th>)}
                    <th className="py-2">Mở đến mức</th>
                  </tr></thead>
                  <tbody>
                    {grades.map(g => {
                      const gp = p.grades[String(g)];
                      return (
                        <tr key={g} className="border-t border-gray-100">
                          <td className="py-3 pr-4 font-bold">Lớp {g}</td>
                          {LEVELS.map(L => {
                            const st = gp.levels?.[String(L.id)];
                            return (
                              <td key={L.id} className="py-3 pr-4">
                                {st ? (
                                  <div>
                                    <Stars n={st.stars} />
                                    <div className={st.passed ? 'text-emerald-600 font-semibold' : 'text-gray-600'}>{st.best}/{st.total}{st.passed ? ' · đã vượt' : ''}</div>
                                    <div className="text-xs text-gray-400">{st.plays} lượt · lần cuối {st.lastScore}/{st.total}</div>
                                  </div>
                                ) : <span className="text-gray-300">{L.id <= (gp.unlocked || 1) ? 'Đã mở, chưa chơi' : 'Khóa'}</span>}
                              </td>
                            );
                          })}
                          <td className="py-3">
                            <select disabled={busy} value={gp.unlocked || 1} onChange={e => run(() => setUnlocked(p.uid, g, +e.target.value))}
                              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                              {[1, 2, 3, 4].map(n => <option key={n} value={n}>Mức {n}</option>)}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-1">Tỉ lệ đúng qua các lượt chơi</h4>
            <p className="text-xs text-gray-500 mb-3">Mỗi điểm là một lượt; di chuột để xem khối và mức của lượt đó.</p>
            {sessions === null ? <p className="text-sm text-gray-400">Đang tải…</p> : chart.length === 0 ? <p className="text-sm text-gray-500">Chưa có dữ liệu.</p> : (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chart} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                    <CartesianGrid stroke="#eef0f4" vertical={false} />
                    <XAxis dataKey="lan" tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip formatter={(v: number) => [`${v}%`, 'Đúng']} labelFormatter={(l, pl) => `Lượt ${l} · ${pl?.[0]?.payload?.label ?? ''}`} />
                    <Line type="monotone" dataKey="phanTram" stroke="#4f46e5" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3">Lịch sử chơi</h4>
            {(sessions || []).length === 0 ? <p className="text-sm text-gray-500">Chưa có lượt chơi.</p> : (
              <div className="space-y-2">
                {[...(sessions || [])].reverse().map((s, k) => {
                  const id = s.id || String(k);
                  return (
                    <div key={id} className="border border-gray-100 rounded-2xl">
                      <button onClick={() => setOpen(open === id ? null : id)} className="w-full flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-sm text-left hover:bg-gray-50 rounded-2xl">
                        <span className="text-gray-500 w-32">{fmtDate(s.playedAt)}</span>
                        <span className="font-semibold">Lớp {s.grade} · Mức {s.level}: {LEVELS[s.level - 1]?.place}</span>
                        <span className={s.passed ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold'}>{s.correct}/{s.total} {s.passed ? '· vượt mức' : '· chưa đạt'}</span>
                        <Stars n={s.stars} />
                        <span className="text-gray-400">{Math.floor(s.durationSec / 60)} phút {s.durationSec % 60} giây</span>
                        <span className="ml-auto text-indigo-600 text-xs font-bold">{s.wrong?.length ? `${s.wrong.length} câu sai ▾` : 'Không sai câu nào'}</span>
                      </button>
                      {open === id && s.wrong?.length > 0 && (
                        <div className="px-4 pb-4 space-y-3">
                          {s.wrong.map((w, j) => (
                            <div key={j} className="bg-gray-50 rounded-xl p-3 text-[15px] leading-relaxed">
                              <div className="font-medium text-gray-900"><Html html={w.q} /></div>
                              <div className="mt-1"><span className="text-red-600 font-semibold">Em chọn:</span> <Html html={w.chosen} />
                                <span className="ml-4 text-emerald-700 font-semibold">Đáp án:</span> <Html html={w.correct} /></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Tab "Trò chơi Lên chùa" trong trang giáo viên. */
export default function TeacherGamePanel() {
  const [rows, setRows] = useState<Progress[] | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [cls, setCls] = useState('');
  const [sort, setSort] = useState<'level' | 'merit' | 'recent' | 'name'>('level');
  const [detailUid, setDetailUid] = useState<string | null>(null);

  const refresh = async () => {
    setError('');
    try { setRows(await listProgress()); }
    catch (e) { console.error(e); setError('Không tải được dữ liệu. Thầy cô kiểm tra đã cập nhật luật Firestore cho trò chơi chưa.'); setRows([]); }
  };
  useEffect(() => { refresh(); }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase(), c = cls.trim().toLowerCase();
    const list = (rows || []).filter(p =>
      (!s || p.name?.toLowerCase().includes(s) || p.email?.toLowerCase().includes(s)) &&
      (!c || p.className?.toLowerCase().includes(c)));
    const by = {
      level: (a: Progress, b: Progress) => bestPassedAll(b) - bestPassedAll(a) || b.merit - a.merit,
      merit: (a: Progress, b: Progress) => b.merit - a.merit,
      recent: (a: Progress, b: Progress) => (b.lastPlayedAt || '').localeCompare(a.lastPlayedAt || ''),
      name: (a: Progress, b: Progress) => (a.name || '').localeCompare(b.name || '', 'vi'),
    }[sort];
    return [...list].sort(by);
  }, [rows, search, cls, sort]);

  const counts = [0, 1, 2, 3, 4].map(n => filtered.filter(p => bestPassedAll(p) === n).length);
  const detail = rows?.find(p => p.uid === detailUid) || null;

  const exportCSV = () => {
    const head = ['Họ tên', 'Email', 'Lớp', 'Danh hiệu', ...GRADES.map(g => `Lớp ${g}: mức đã vượt`), 'Công đức', 'Lượt chơi', 'Tỉ lệ đúng (%)', 'Lần chơi cuối', 'Trạng thái'];
    const body = filtered.map(p => [
      p.name, p.email, p.className, titleOf(bestPassedAll(p)),
      ...GRADES.map(g => String(maxPassed(p.grades?.[String(g)]))),
      String(p.merit), String(p.plays), String(pct(p)), fmtDate(p.lastPlayedAt), p.blocked ? 'Đang khóa' : 'Được chơi',
    ]);
    const csv = [head, ...body].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `tien-do-len-chua-hoc-toan.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ConfigCard />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[NEWCOMER, ...LEVELS.map(L => L.title)].map((t, n) => (
          <div key={t} className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${LV_BADGE[n]}`}>{n === 0 ? 'Chưa vượt mức' : `Vượt mức ${n}`}</div>
            <div className="text-3xl font-extrabold text-indigo-950 mt-2 tabular-nums">{counts[n]}</div>
            <div className="text-xs text-gray-500">{t}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm flex flex-wrap gap-4 items-end">
        <label className="space-y-1.5 flex-1 min-w-[200px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Tìm học sinh</span>
          <span className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tên hoặc email…"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm" />
          </span>
        </label>
        <label className="space-y-1.5 w-[150px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Lớp</span>
          <input value={cls} onChange={e => setCls(e.target.value)} placeholder="Lọc lớp…"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/10 text-sm" />
        </label>
        <label className="space-y-1.5 w-[170px]">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Sắp xếp</span>
          <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl outline-none text-sm">
            <option value="level">Mức cao nhất</option>
            <option value="merit">Công đức</option>
            <option value="recent">Chơi gần đây</option>
            <option value="name">Tên A–Z</option>
          </select>
        </label>
        <button onClick={refresh} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"><RefreshCw className="w-4 h-4" /> Làm mới</button>
        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"><FileDown className="w-4 h-4" /> Xuất CSV</button>
      </div>

      {error && <div className="bg-red-50 text-red-700 border border-red-100 rounded-2xl p-4 text-sm">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] uppercase tracking-widest text-gray-400">
              <tr>
                <th className="px-6 py-4">Học sinh</th><th className="px-4 py-4">Lớp</th><th className="px-4 py-4">Danh hiệu</th>
                <th className="px-4 py-4">Tiến độ theo khối</th><th className="px-4 py-4 text-right">Công đức</th>
                <th className="px-4 py-4 text-right">Lượt</th><th className="px-4 py-4 text-right">Đúng</th>
                <th className="px-4 py-4">Lần cuối</th><th className="px-4 py-4">Trạng thái</th><th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows === null ? (
                <tr><td colSpan={10} className="px-6 py-10 text-center text-gray-400">Đang tải…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-10 text-center text-gray-400">Chưa có học sinh nào chơi. Khi học sinh đăng nhập và chơi, tiến độ sẽ hiện ở đây.</td></tr>
              ) : filtered.map(p => {
                const b = bestPassedAll(p);
                return (
                  <tr key={p.uid} className="border-t border-gray-100 hover:bg-gray-50/60">
                    <td className="px-6 py-3"><div className="font-semibold text-gray-900">{p.name}</div><div className="text-xs text-gray-400">{p.email}</div></td>
                    <td className="px-4 py-3">{p.className}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${LV_BADGE[b]}`}>{titleOf(b)}</span></td>
                    <td className="px-4 py-3">{GRADES.map(g => <LevelDots key={g} p={p} grade={g} />)}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{p.merit}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.plays}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{pct(p)}%</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{fmtDate(p.lastPlayedAt)}</td>
                    <td className="px-4 py-3">{p.blocked
                      ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600">Đang khóa</span>
                      : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">Được chơi</span>}</td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setDetailUid(p.uid)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:border-indigo-200"><Eye className="w-3.5 h-3.5" /> Chi tiết</button>
                        <button onClick={async () => { try { await setBlocked(p.uid, !p.blocked); refresh(); } catch { alert('Không đổi được trạng thái. Kiểm tra luật Firestore.'); } }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold hover:border-indigo-200">
                          {p.blocked ? <><Unlock className="w-3.5 h-3.5" /> Mở</> : <><Lock className="w-3.5 h-3.5" /> Khóa</>}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 text-xs text-gray-400 border-t border-gray-100 flex flex-wrap gap-4">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Đã vượt mức</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-300" /> Đã mở, chưa vượt</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-gray-200" /> Còn khóa</span>
        </div>
      </div>

      {detail && <StudentDetail p={detail} onClose={() => setDetailUid(null)} onChanged={refresh} />}
    </div>
  );
}
