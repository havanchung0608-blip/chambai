// Lưu cấu hình trò chơi, tiến độ và lịch sử chơi của học sinh trên Firestore.
import { collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

export type GameConfig = {
  isOpen: boolean;          // mở/khóa trò chơi cho học sinh
  allowedClasses: string;   // danh sách lớp được chơi, cách nhau bởi dấu phẩy; để trống = tất cả
  questionsPerRound: number;
  passScore: number;        // số câu đúng tối thiểu để vượt mức
  timeLimits: number[];     // giây mỗi câu cho mức 1..4 (0 = không giới hạn)
  updatedAt?: string;
  updatedBy?: string;
};

export const DEFAULT_CONFIG: GameConfig = {
  isOpen: true,
  allowedClasses: '',
  questionsPerRound: 10,
  passScore: 7,
  timeLimits: [20, 30, 45, 60],
};

export type LevelStat = { best: number; total: number; stars: number; plays: number; passed: boolean; lastScore: number };
export type GradeProgress = { unlocked: number; levels: Record<string, LevelStat> };

export type Progress = {
  uid: string;
  name: string;
  className: string;
  email: string;
  grades: Record<string, GradeProgress>;
  merit: number;
  plays: number;
  correct: number;
  answered: number;
  blocked: boolean;
  lastGrade: number;
  lastLevel: number;
  lastPlayedAt: string;
  createdAt: string;
};

export type WrongItem = { q: string; chosen: string; correct: string };

export type Session = {
  id?: string;
  uid: string;
  name: string;
  className: string;
  grade: number;
  level: number;
  correct: number;
  answered: number;
  total: number;
  passed: boolean;
  stars: number;
  merit: number;
  durationSec: number;
  wrong: WrongItem[];
  playedAt: string;
};

export type RoundResult = Omit<Session, 'id' | 'uid' | 'name' | 'className' | 'playedAt'>;

const CONFIG_REF = () => doc(db, 'gameConfig', 'main');

export async function loadConfig(): Promise<GameConfig> {
  try {
    const snap = await getDoc(CONFIG_REF());
    if (snap.exists()) return { ...DEFAULT_CONFIG, ...(snap.data() as Partial<GameConfig>) };
  } catch (e) {
    console.warn('Không đọc được cấu hình trò chơi, dùng mặc định.', e);
  }
  return { ...DEFAULT_CONFIG };
}

export async function saveConfig(cfg: GameConfig, uid: string) {
  await setDoc(CONFIG_REF(), { ...cfg, updatedAt: new Date().toISOString(), updatedBy: uid });
}

/** Học sinh có thuộc danh sách lớp được phép chơi không. */
export function classAllowed(cfg: GameConfig, className: string) {
  const list = cfg.allowedClasses.split(/[,;]/).map(s => s.trim().toUpperCase()).filter(Boolean);
  return list.length === 0 || list.includes((className || '').trim().toUpperCase());
}

export function emptyProgress(p: { uid: string; name: string; className: string; email: string }): Progress {
  return {
    ...p, grades: {}, merit: 0, plays: 0, correct: 0, answered: 0, blocked: false,
    lastGrade: 0, lastLevel: 0, lastPlayedAt: '', createdAt: new Date().toISOString(),
  };
}

export async function loadProgress(uid: string): Promise<Progress | null> {
  const snap = await getDoc(doc(db, 'gameProgress', uid));
  return snap.exists() ? (snap.data() as Progress) : null;
}

/** Lưu tên và lớp người chơi tự khai báo. */
export async function savePlayer(prev: Progress | null, who: { uid: string; name: string; className: string; email: string }): Promise<Progress> {
  const ref = doc(db, 'gameProgress', who.uid);
  if (!prev) {
    const p = emptyProgress(who);
    await setDoc(ref, p);
    return p;
  }
  await setDoc(ref, { uid: who.uid, name: who.name, className: who.className, email: who.email }, { merge: true });
  return { ...prev, name: who.name, className: who.className, email: who.email };
}

/** Mức cao nhất đã vượt qua của một khối. */
export const maxPassed = (gp?: GradeProgress) =>
  gp ? Math.max(0, ...Object.entries(gp.levels || {}).filter(([, s]) => s.passed).map(([k]) => +k)) : 0;

/** Mức cao nhất đã vượt qua trên mọi khối. */
export const bestPassedAll = (p: Progress) => Math.max(0, ...Object.values(p.grades || {}).map(maxPassed));

/** Ghi kết quả một vòng chơi: cập nhật tiến độ + thêm lịch sử. Trả về tiến độ mới. */
export async function recordRound(
  who: { uid: string; name: string; className: string; email: string },
  prev: Progress | null,
  r: RoundResult,
): Promise<Progress> {
  const now = new Date().toISOString();
  const base = prev ?? emptyProgress(who);
  const gKey = String(r.grade), lKey = String(r.level);
  const gp: GradeProgress = base.grades?.[gKey] ?? { unlocked: 1, levels: {} };
  const old = gp.levels?.[lKey];
  const stat: LevelStat = {
    best: Math.max(old?.best ?? 0, r.correct),
    total: r.total,
    stars: Math.max(old?.stars ?? 0, r.stars),
    plays: (old?.plays ?? 0) + 1,
    passed: (old?.passed ?? false) || r.passed,
    lastScore: r.correct,
  };
  const unlocked = Math.max(gp.unlocked || 1, r.passed ? Math.min(4, r.level + 1) : 1);
  const next: Progress = {
    ...base,
    name: who.name, className: who.className, email: who.email,
    grades: { ...base.grades, [gKey]: { unlocked, levels: { ...gp.levels, [lKey]: stat } } },
    merit: (base.merit || 0) + r.merit,
    plays: (base.plays || 0) + 1,
    correct: (base.correct || 0) + r.correct,
    answered: (base.answered || 0) + r.answered,
    lastGrade: r.grade,
    lastLevel: r.level,
    lastPlayedAt: now,
  };
  const ref = doc(db, 'gameProgress', who.uid);
  if (prev) {
    // Không gửi trường "blocked": chỉ giáo viên mới được đổi trường này.
    const { blocked: _omit, ...rest } = next;
    await setDoc(ref, rest, { merge: true });
  } else {
    await setDoc(ref, next);
  }
  await addDoc(collection(db, 'gameSessions'), {
    ...r, uid: who.uid, name: who.name, className: who.className, playedAt: now,
  });
  return next;
}

// ---------- Dành cho giáo viên ----------
export async function listProgress(): Promise<Progress[]> {
  const snap = await getDocs(collection(db, 'gameProgress'));
  return snap.docs.map(d => d.data() as Progress);
}

export async function listSessions(uid: string): Promise<Session[]> {
  const snap = await getDocs(query(collection(db, 'gameSessions'), where('uid', '==', uid)));
  return snap.docs
    .map(d => ({ id: d.id, ...(d.data() as Session) }))
    .sort((a, b) => a.playedAt.localeCompare(b.playedAt));
}

export async function setBlocked(uid: string, blocked: boolean) {
  await updateDoc(doc(db, 'gameProgress', uid), { blocked });
}

export async function setUnlocked(uid: string, grade: number, unlocked: number) {
  await updateDoc(doc(db, 'gameProgress', uid), { [`grades.${grade}.unlocked`]: unlocked });
}

export async function resetProgress(p: Progress) {
  await setDoc(doc(db, 'gameProgress', p.uid), {
    ...emptyProgress({ uid: p.uid, name: p.name, className: p.className, email: p.email }),
    blocked: p.blocked,
  });
}
