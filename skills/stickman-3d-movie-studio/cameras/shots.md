# 33 mẫu góc quay điện ảnh (sm_cine.SHOTS)

| Preset | Mô tả | Thông số |
|---|---|---|
| `establishing_wide` | toàn cảnh mở đầu, giới thiệu không gian | `dist=8.5, h=2.2, az=25, lens=24, aim=1.2, fstop=8.0` |
| `wide` | toàn cảnh | `dist=6.0, h=1.2, az=15, lens=28, aim=1.1, fstop=5.6` |
| `full_body` | toàn thân | `dist=3.6, h=0.4, az=12, lens=35, aim=1.0, fstop=4.0` |
| `full_three_quarter` | toàn thân góc 3/4 | `dist=3.4, h=0.5, az=40, lens=35, aim=1.0, fstop=4.0` |
| `medium` | trung cảnh (đến hông) | `dist=3.0, h=0.15, az=15, lens=42, aim=1.38, fstop=2.8` |
| `medium_close` | cận trung (đến ngực) | `dist=2.3, h=0.08, az=14, lens=50, aim=1.55, fstop=2.2` |
| `close_up` | cận mặt — cảm xúc | `dist=1.7, h=0.04, az=10, lens=60, aim=1.68, fstop=1.8` |
| `extreme_close` | đặc tả mắt | `dist=0.9, h=0.0, az=5, lens=85, aim=1.73, fstop=1.6` |
| `profile` | nghiêng (profile) | `dist=2.0, h=0.1, az=90, lens=50, aim=1.4, fstop=2.8` |
| `back_follow` | sau lưng nhân vật | `dist=2.4, h=0.45, az=180, lens=35, aim=1.3, fstop=4.0` |
| `over_shoulder` | qua vai nhìn về phía trước nhân vật | `dist=1.4, h=0.25, az=165, lens=40, aim=1.45, fstop=2.8, look_ahead=1.8` |
| `low_angle_hero` | góc thấp: oai, mạnh mẽ | `dist=2.2, h=-0.95, az=20, lens=28, aim=1.35, fstop=4.0` |
| `high_angle` | góc cao: nhỏ bé, yếu thế | `dist=2.6, h=2.0, az=15, lens=35, aim=1.2, fstop=4.0` |
| `birds_eye` | nhìn thẳng từ trên xuống | `dist=0.6, h=5.0, az=0, lens=24, aim=0.8, fstop=8.0` |
| `worms_eye` | sát đất nhìn lên | `dist=1.2, h=-1.25, az=10, lens=20, aim=1.5, fstop=5.6` |
| `dutch` | nghiêng máy: căng thẳng | `dist=2.2, h=0.2, az=25, lens=40, aim=1.35, fstop=2.8, roll=12` |
| `insert_hand` | cận bàn tay / đạo cụ | `dist=1.8, h=0.5, az=25, lens=40, aim="hand", fstop=3.2` |
| `insert_board` | cận bảng (chính diện bảng) | `dist=3.0, h=0.0, az=0, lens=40, aim="board", fstop=5.6, absolute=True` |
| `board_three_quarter` | bảng góc 3/4 có nhân vật | `dist=3.0, h=0.25, az=42, lens=35, aim="board", fstop=4.0, absolute=True` |
| `dolly_in` | tiến máy vào chậm | `dist=3.6, h=0.2, az=12, lens=45, aim=1.4, fstop=2.8, move=("dolly", -1.4)` |
| `dolly_out` | lùi máy ra mở không gian | `dist=1.8, h=0.2, az=12, lens=45, aim=1.4, fstop=2.8, move=("dolly", 1.8)` |
| `push_in_emotion` | đẩy chậm vào mặt khi cảm xúc dâng | `dist=3.0, h=0.05, az=8, lens=50, aim=1.6, fstop=2.0, move=("dolly", -0.9)` |
| `pull_back_reveal` | kéo lùi lộ toàn cảnh | `dist=1.2, h=0.2, az=0, lens=35, aim=1.4, fstop=4.0, move=("dolly", 5.0)` |
| `truck_follow` | đi ngang theo nhân vật (tracking) | `dist=3.0, h=0.25, az=70, lens=40, aim=1.2, fstop=3.2, follow=True` |
| `lead_front` | máy đi lùi trước mặt nhân vật | `dist=2.6, h=0.2, az=0, lens=40, aim=1.35, fstop=3.2, follow=True` |
| `orbit` | xoay vòng quanh nhân vật | `dist=2.6, h=0.4, az=-40, lens=40, aim=1.3, fstop=3.2, move=("orbit", 80)` |
| `crane_up` | cẩu máy lên cao | `dist=3.2, h=-0.2, az=15, lens=32, aim=1.2, fstop=4.0, move=("crane", 2.4)` |
| `crane_down` | hạ máy xuống | `dist=3.2, h=2.6, az=15, lens=32, aim=1.2, fstop=4.0, move=("crane", -2.4)` |
| `handheld` | máy cầm tay (hồi hộp, phóng sự) | `dist=2.0, h=0.1, az=20, lens=40, aim=1.4, fstop=2.8, handheld=1.0` |
| `whip_pan` | lia nhanh sang chủ thể (nhoè chuyển động) | `dist=2.4, h=0.2, az=15, lens=40, aim=1.35, fstop=3.2, whip=True` |
| `dolly_zoom` | dolly zoom (Hitchcock): nền giãn ra, mặt giữ nguyên | `dist=2.0, h=0.1, az=5, lens=35, aim=1.6, fstop=2.8, move=("vertigo", 2.0)` |
| `rack_focus` | chuyển tiêu điểm từ tiền cảnh sang hậu cảnh | `dist=1.6, h=0.2, az=150, lens=55, aim=1.5, fstop=1.4, rack=True` |
| `two_shot` | hai nhân vật cùng khung | `dist=3.0, h=0.25, az=0, lens=35, aim=1.3, fstop=4.0, two=True` |
