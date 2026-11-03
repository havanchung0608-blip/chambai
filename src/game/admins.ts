// Email của người quản lý trò chơi (xem tiến độ, khóa/mở người chơi, đổi cài đặt).
// Muốn thêm người quản lý: thêm email vào danh sách này VÀ vào hàm isGameAdmin() trong firestore.rules.
export const ADMIN_EMAILS = ['havanchung0608@gmail.com'];

export const isAdminEmail = (email?: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase());
