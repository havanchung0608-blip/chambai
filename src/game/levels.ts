// Bốn mức độ của trò chơi "Lên Chùa Học Toán"
export type LevelInfo = {
  id: number;
  place: string;      // địa điểm trong chùa
  degree: string;     // mức độ nhận thức
  title: string;      // danh hiệu khi vượt qua
  sky: [string, string, string];
  defaultTime: number; // giây mỗi câu
};

export const LEVELS: LevelInfo[] = [
  { id: 1, place: 'Cổng Tam Quan', degree: 'Nhận biết', title: 'Chú tiểu nhập môn', sky: ['#3b4a7a', '#8e6fa3', '#f6b56b'], defaultTime: 20 },
  { id: 2, place: 'Sân Chùa', degree: 'Thông hiểu', title: 'Chú tiểu chăm chỉ', sky: ['#4f7fb8', '#8db6d9', '#f3dca2'], defaultTime: 30 },
  { id: 3, place: 'Chánh Điện', degree: 'Vận dụng', title: 'Sư huynh tinh tấn', sky: ['#211a3c', '#553660', '#d9825b'], defaultTime: 45 },
  { id: 4, place: 'Tháp Chuông', degree: 'Vận dụng cao', title: 'Đại sư Toán học', sky: ['#0f1530', '#1f2a55', '#46407a'], defaultTime: 60 },
];

export const GRADES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Tên hiển thị của khối: 0 = Mầm non (lớp Bé). */
export const gradeLabel = (g: number) => (g === 0 ? 'Mầm non' : `Lớp ${g}`);
export const NEWCOMER = 'Khách mới vào chùa';

/** Danh hiệu theo mức cao nhất đã vượt qua (0 = chưa vượt mức nào). */
export const titleOf = (passed: number) => (passed > 0 ? LEVELS[passed - 1].title : NEWCOMER);

/** Khối lớp đọc từ tên lớp, ví dụ "9A1" → 9, "3B" → 3. */
export const gradeFromClass = (className?: string) => {
  const c = (className || '').toLowerCase();
  if (/bé|mầm|chồi|lá|mẫu giáo|mau giao|mam non|mầm non/.test(c)) return 0;
  const m = c.match(/[1-9]/);
  return m ? +m[0] : 1;
};

/** Hệ số thời gian: các em nhỏ được thêm thời gian suy nghĩ. */
export const timeFactor = (grade: number) => (grade === 0 ? 3 : grade <= 2 ? 2 : grade <= 5 ? 1.5 : 1);
