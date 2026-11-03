import React from 'react';
import { ChevronLeft } from 'lucide-react';
import TeacherGamePanel from './TeacherGamePanel';

/** Trang quản lý trò chơi (chỉ người có email trong danh sách quản lý). */
export default function GameAdminPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">π</div>
            <h1 className="text-xl font-extrabold text-indigo-950">Quản lý trò chơi Lên Chùa Học Toán</h1>
          </div>
          <button onClick={onBack} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <ChevronLeft className="w-4 h-4" /> Về trò chơi
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <TeacherGamePanel />
      </main>
    </div>
  );
}
