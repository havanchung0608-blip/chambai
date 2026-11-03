// Phòng chơi trực tiếp "Chùa Toán Online": dữ liệu thời gian thực trên Firestore.
//
//  rooms/{code}                      thông tin phòng + câu hỏi đang chiếu (không có đáp án)
//  rooms/{code}/private/key          bộ câu hỏi + đáp án (chỉ chủ phòng đọc được)
//  rooms/{code}/players/{uid}        người chơi: tên, màu áo, công đức (chỉ chủ phòng cộng điểm)
//  rooms/{code}/answers/{q}_{uid}    lựa chọn của từng người cho từng câu (ghi một lần)
import {
  collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Question, makeRound, shuffle } from '../game/questions';

export type RoomStatus = 'lobby' | 'question' | 'reveal' | 'ended';

export type Room = {
  code: string;
  hostUid: string;
  hostName: string;
  grade: number;
  level: number;
  total: number;
  timeLimit: number;
  status: RoomStatus;
  qIndex: number;           // câu đang chiếu (0-based), −1 khi chưa bắt đầu
  q: string;                // nội dung câu hỏi (HTML)
  options: string[];        // 4 phương án đã xáo
  g: string;                // lời giải (chỉ điền khi hiện đáp án)
  revealIdx: number;        // −1 khi chưa hiện đáp án
  stats: number[];          // số người chọn mỗi phương án (khi hiện đáp án)
  startedAt: unknown;       // thời điểm bắt đầu câu (serverTimestamp)
  createdAt: unknown;
};

export type Player = {
  uid: string;
  name: string;
  color: number;
  score: number;
  correct: number;
  streak: number;
  lastQ: number;            // câu gần nhất đã chấm
  lastPoints: number;
  lastCorrect: boolean;
  joinedAt: unknown;
};

export type Answer = { uid: string; qIndex: number; choice: number; at: unknown };

type Key = { questions: Question[]; orders: number[][] };

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const newCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
export const cleanCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);

/** Đổi dấu thời gian Firestore (hoặc số) sang mili giây. */
export const ms = (t: unknown): number => {
  if (typeof t === 'number') return t;
  const anyT = t as { toMillis?: () => number } | null;
  return anyT?.toMillis ? anyT.toMillis() : Date.now();
};

const roomRef = (code: string) => doc(db, 'rooms', code);
const keyRef = (code: string) => doc(db, 'rooms', code, 'private', 'key');
const playersCol = (code: string) => collection(db, 'rooms', code, 'players');
const answersCol = (code: string) => collection(db, 'rooms', code, 'answers');

// ---------- Chủ phòng ----------
export async function createRoom(host: { uid: string; name: string }, grade: number, level: number, total: number, timeLimit: number): Promise<string> {
  let code = newCode();
  for (let i = 0; i < 5 && (await getDoc(roomRef(code))).exists(); i++) code = newCode();
  const questions = makeRound(grade, level, total);
  const orders = questions.map(() => shuffle([0, 1, 2, 3]));
  const room: Room = {
    code, hostUid: host.uid, hostName: host.name, grade, level, total: questions.length, timeLimit,
    status: 'lobby', qIndex: -1, q: '', options: [], g: '', revealIdx: -1, stats: [0, 0, 0, 0],
    startedAt: serverTimestamp(), createdAt: serverTimestamp(),
  };
  await setDoc(roomRef(code), room);
  await setDoc(keyRef(code), { questions, orders } as Key);
  return code;
}

export async function showQuestion(code: string, i: number) {
  const key = (await getDoc(keyRef(code))).data() as Key;
  const q = key.questions[i], order = key.orders[i];
  await updateDoc(roomRef(code), {
    status: 'question', qIndex: i, q: q.q, options: order.map(k => q.a[k]), g: '', revealIdx: -1, stats: [0, 0, 0, 0],
    startedAt: serverTimestamp(),
  });
}

/** Chấm câu i: cộng công đức cho người đúng (100 điểm + tối đa 50 điểm nhanh tay), rồi hiện đáp án. */
export async function revealQuestion(room: Room, players: Player[]): Promise<{ uid: string; points: number }[]> {
  const key = (await getDoc(keyRef(room.code))).data() as Key;
  const i = room.qIndex, order = key.orders[i];
  const correctIdx = order.indexOf(0);
  const snap = await getDocs(query(answersCol(room.code), where('qIndex', '==', i)));
  const answers = snap.docs.map(d => d.data({ serverTimestamps: 'estimate' }) as Answer);
  const stats = [0, 0, 0, 0];
  answers.forEach(a => { if (a.choice >= 0 && a.choice < 4) stats[a.choice]++; });
  const start = ms(room.startedAt), limitMs = room.timeLimit * 1000;
  const byUid = new Map(answers.map(a => [a.uid, a]));
  const batch = writeBatch(db);
  const gains: { uid: string; points: number }[] = [];
  players.forEach(p => {
    const a = byUid.get(p.uid);
    const ok = !!a && a.choice === correctIdx;
    const speed = a && limitMs ? Math.max(0, Math.min(1, 1 - (ms(a.at) - start) / limitMs)) : 0;
    const points = ok ? 100 + Math.round(50 * speed) : 0;
    if (ok) gains.push({ uid: p.uid, points });
    batch.update(doc(db, 'rooms', room.code, 'players', p.uid), {
      score: (p.score || 0) + points, correct: (p.correct || 0) + (ok ? 1 : 0), streak: ok ? (p.streak || 0) + 1 : 0,
      lastQ: i, lastPoints: points, lastCorrect: ok,
    });
  });
  batch.update(roomRef(room.code), { status: 'reveal', revealIdx: correctIdx, stats, g: key.questions[i].g });
  await batch.commit();
  return gains;
}

export const endRoom = (code: string) => updateDoc(roomRef(code), { status: 'ended' });

/** Bản chơi thử: vị trí đáp án đúng của câu i (để người chơi ảo trả lời). */
export async function demoCorrectIndex(code: string, i: number): Promise<number> {
  const key = (await getDoc(keyRef(code))).data() as Key;
  return key.orders[i].indexOf(0);
}

// ---------- Người chơi ----------
export async function joinRoom(code: string, uid: string, name: string): Promise<'ok' | 'missing' | 'ended'> {
  const r = await getDoc(roomRef(code));
  if (!r.exists()) return 'missing';
  if ((r.data() as Room).status === 'ended') return 'ended';
  const ref = doc(db, 'rooms', code, 'players', uid);
  const me = await getDoc(ref);
  if (me.exists()) { await updateDoc(ref, { name }); return 'ok'; }
  const p: Player = {
    uid, name, color: Math.floor(Math.random() * 8), score: 0, correct: 0, streak: 0,
    lastQ: -1, lastPoints: 0, lastCorrect: false, joinedAt: serverTimestamp(),
  };
  await setDoc(ref, p);
  return 'ok';
}

export async function sendAnswer(code: string, uid: string, qIndex: number, choice: number) {
  await setDoc(doc(db, 'rooms', code, 'answers', `${qIndex}_${uid}`), { uid, qIndex, choice, at: serverTimestamp() });
}

export async function myAnswer(code: string, uid: string, qIndex: number): Promise<number | null> {
  const s = await getDoc(doc(db, 'rooms', code, 'answers', `${qIndex}_${uid}`));
  return s.exists() ? (s.data() as Answer).choice : null;
}

// ---------- Theo dõi thời gian thực ----------
export const watchRoom = (code: string, cb: (r: Room | null) => void) =>
  onSnapshot(roomRef(code), s => cb(s.exists() ? (s.data({ serverTimestamps: 'estimate' }) as Room) : null));

export const watchPlayers = (code: string, cb: (p: Player[]) => void) =>
  onSnapshot(playersCol(code), s => cb(s.docs.map(d => d.data({ serverTimestamps: 'estimate' }) as Player)));

export const watchPlayer = (code: string, uid: string, cb: (p: Player | null) => void) =>
  onSnapshot(doc(db, 'rooms', code, 'players', uid), s => cb(s.exists() ? (s.data() as Player) : null));

/** Danh sách uid đã trả lời câu qIndex (chủ phòng dùng để đếm và hiện dấu "đã chọn"). */
export const watchAnswered = (code: string, qIndex: number, cb: (uids: string[]) => void) =>
  onSnapshot(query(answersCol(code), where('qIndex', '==', qIndex)), s => cb(s.docs.map(d => (d.data() as Answer).uid)));

/** Liên kết vào phòng (để tạo mã QR). */
export const joinUrl = (code: string) => `${window.location.origin}${import.meta.env.BASE_URL}?phong=${code}`;
