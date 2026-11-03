import React from 'react';
import { LEVELS } from './levels';
import { isIOS, isStandalone } from './install';

/** Bảng luật chơi. */
export default function Rules({ passScore, total, onClose }: { passScore: number; total: number; onClose: () => void }) {
  const allowWrong = total - passScore;
  return (
    <div className="ctg-overlay" onClick={onClose}>
      <div className="ctg-panel ctg-rules" role="dialog" aria-label="Luật chơi" onClick={e => e.stopPropagation()}>
        <h2>Luật chơi</h2>
        <p className="ctg-rules-lead">Giúp chú tiểu leo bậc đá lên chùa. Mỗi bậc đá là một câu đố Toán.</p>

        <ol className="ctg-rules-list">
          <li><b>Chọn lớp</b> của em (Mầm non đến Lớp 9), rồi chọn <b>mức</b> muốn chơi.</li>
          <li>Mỗi lượt có <b>{total} câu</b>. Đọc đề, bấm vào đáp án em cho là đúng, rồi bấm <b>Câu tiếp</b>.</li>
          <li><b>Đúng</b>: chú tiểu bước lên một bậc, em được thêm <b>công đức</b>. Mức càng cao, công đức càng nhiều.</li>
          <li><b>Sai</b> hoặc <b>hết giờ</b>: một nén nhang tắt. Em có <b>{allowWrong + 1} nén nhang</b>, tức là được sai tối đa {allowWrong} câu. Tắt hết nhang thì lượt chơi dừng.</li>
          <li>Đúng từ <b>{passScore}/{total} câu</b> trở lên là <b>vượt mức</b>, mở khóa mức tiếp theo và nhận danh hiệu mới.</li>
          <li>Sau mỗi câu đều có <b>lời giải</b>. Đọc kĩ để lần sau làm đúng nhé!</li>
        </ol>

        <div className="ctg-rules-grid">
          {LEVELS.map(L => (
            <div key={L.id}>
              <span className="n">Mức {L.id}</span>
              <b>{L.place}</b>
              <span>{L.degree}</span>
              <span className="t">→ {L.title}</span>
            </div>
          ))}
        </div>

        <div className="ctg-rules-row">
          <div><b>Sao</b>Không sai câu nào: 3 sao. Sai 1 câu: 2 sao. Vượt mức: 1 sao.</div>
          <div><b>Thời gian</b>Mỗi câu có đồng hồ đếm ngược. Các bạn nhỏ được thêm thời gian.</div>
          <div><b>Đọc đề</b>Bấm nút loa để nghe đọc câu hỏi. Mầm non, lớp 1 và lớp 2 được đọc tự động.</div>
          <div><b>Gõ mõ</b>Bấm cái mõ cho vui và để tâm tĩnh. Không cộng điểm.</div>
        </div>

        {!isStandalone() && (
          <p className="ctg-rules-tip">
            <b>Cài app lên điện thoại:</b>{' '}
            {isIOS()
              ? <>trên iPhone, mở bằng Safari, bấm nút <b>Chia sẻ</b> rồi chọn <b>Thêm vào MH chính</b>.</>
              : <>bấm nút <b>Cài app</b> ở sân chùa, hoặc mở menu ⋮ của Chrome và chọn <b>Cài đặt ứng dụng</b> (hoặc <b>Thêm vào màn hình chính</b>).</>}
          </p>
        )}
        <p className="ctg-rules-tip">Bàn phím (máy tính): 1–4 chọn đáp án · Space câu tiếp · R đọc đề · M tắt tiếng · F toàn màn hình.</p>

        <div className="ctg-actions"><button className="ctg-btn" onClick={onClose}>Em hiểu rồi, vào chơi!</button></div>
      </div>
    </div>
  );
}
