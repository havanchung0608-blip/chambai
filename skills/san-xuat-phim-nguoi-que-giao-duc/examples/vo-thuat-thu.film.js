// Cảnh thử: đấu võ giữa hai người que — kiểm tra chuyển động, hiệu ứng va chạm, âm thanh thật (TiengDong.com)
window.FILM = {
  title: "Đấu võ người que",
  subtitle: "Cảnh thử chuyển động và âm thanh",
  file: "dau-vo-nguoi-que",
  watermark: "Thầy Hà Văn Chung",
  cast: {
    hung: { name: "Hùng", voice: "nam", scale: 1.3, shirt: "#fafafa", belt: "#212121", band: "#e53935", hair: "short", fists: true },
    long: { name: "Long", voice: "nu", pitch: 0.9, scale: 1.3, shirt: "#1e88e5", belt: "#212121", band: "#ffb300", hair: "spiky", fists: true }
  },
  scenes: [
    { bg: "dojo", beats: [
      { title: { text: "ĐẤU VÕ NGƯỜI QUE", sub: "Cảnh thử chuyển động và âm thanh", dur: 3.2 }, sfx: [{ name: "tension" }] }
    ]},
    { bg: "dojo",
      cast: { hung: { x: -220, pose: "idle", face: "happy" }, long: { x: 2140, pose: "idle", face: "happy", flip: true } },
      beats: [
        { move: [{ who: "hung", to: 640, dur: 2.8 }, { who: "long", to: 1280, dur: 2.8 }], sfx: [{ name: "crowd", vol: 0.35, len: 4 }], gap: 0.2 },
        { who: "hung", say: "Xin chỉ giáo!", pose: "fistbow", act: { long: { pose: "fistbow", delay: 0.3 } } },
        { who: "long", say: "Mời huynh!", pose: "guard", face: "angry" },
        { act: { hung: { pose: "guard", face: "angry" } }, sfx: [{ name: "bell", len: 2.5 }], fx: { type: "text", x: 960, y: 520, text: "BẮT ĐẦU!", dur: 1.2, color: "#ffca28" }, wait: 1.3, gap: 0 },
        // Hùng lao tới, đấm thẳng — Long đỡ
        { move: { who: "hung", to: 1010, dur: 0.55, style: "run" }, gap: 0 },
        { act: { hung: { pose: "punch", snap: 0.1 } }, sfx: [{ name: "swish" }], wait: 0.14, gap: 0 },
        { act: { long: { pose: "block", snap: 0.08 } }, sfx: [{ name: "punch2", vol: 0.7 }], fx: { type: "hit", on: "long", part: "chest", dx: -60, dur: 0.3 }, wait: 0.35, gap: 0 },
        // đấm tay sau — trúng mặt
        { act: { hung: { pose: "punch2", snap: 0.1 } }, sfx: [{ name: "swish2" }], wait: 0.13, gap: 0 },
        { act: { long: { pose: "hit", snap: 0.07, face: "surprised" } }, sfx: [{ name: "punch" }], fx: { type: "hit", on: "long", part: "head", dx: -40, text: "BỐP!" }, shake: { amp: 24, dur: 0.3 },
          move: { who: "long", to: 1430, dur: 0.45, style: "slide" }, wait: 0.6, gap: 0 },
        { act: { long: { pose: "guard", face: "angry" }, hung: { pose: "guard" } }, wait: 0.7, gap: 0 },
        // Long phản công: áp sát, đá ngang
        { move: { who: "long", to: 1230, dur: 0.45, style: "run" }, gap: 0 },
        { act: { long: { pose: "kick", snap: 0.13 } }, sfx: [{ name: "swish" }], wait: 0.15, gap: 0 },
        { act: { hung: { pose: "hitlow", snap: 0.07, face: "sad" } }, sfx: [{ name: "kickhit" }], fx: { type: "hit", on: "hung", part: "belly", dx: 50, text: "BỊCH!", color: "#ff7043" }, shake: { amp: 20, dur: 0.3 },
          move: { who: "hung", to: 800, dur: 0.5, style: "slide" }, wait: 0.7, gap: 0 },
        { act: { long: { pose: "guard" } }, who: "hung", say: "Khá lắm!", pose: "guard", face: "angry" },
        // Hùng tung cước bay — Long ngã
        { move: { who: "hung", to: 1000, dur: 1.3, style: "flykick", height: 170 }, fx: [{ type: "speed", on: "hung", at: 0.35, dur: 0.5, dir: 1 }, { type: "hit", on: "long", part: "head", dx: -30, at: 0.78, text: "HỰ!" }],
          act: { long: { pose: "hit", delay: 0.78, snap: 0.07, face: "surprised" } }, sfx: [{ name: "punch", at: 0.78 }], shake: { at: 0.78, amp: 30, dur: 0.4 }, gap: 0 },
        { move: { who: "long", to: 1260, dur: 0.6, style: "slide" }, act: { long: { pose: "lie", delay: 0.15, snap: 0.3, face: "sad" }, hung: { pose: "guard" } },
          sfx: [{ name: "fall", at: 0.45 }, { name: "crowd", at: 0.5, vol: 0.8, len: 5 }], fx: { type: "dust", on: "long", part: "legs", dy: 110, at: 0.45, dur: 0.8 }, wait: 1.6, gap: 0 },
        // tinh thần võ đạo
        { move: { who: "hung", to: 880, dur: 0.6, face: "right" }, gap: 0.1 },
        { who: "hung", say: "Bạn có sao không? Đứng dậy nào!", pose: "give", face: "happy" },
        { act: { long: { pose: "idle", snap: 0.7, face: "happy" } }, wait: 0.9, gap: 0 },
        { who: "long", say: "Cảm ơn huynh! Huynh đánh hay quá.", pose: "fistbow", face: "happy", act: { hung: { pose: "fistbow", delay: 0.3 } } },
        { say: "Thắng không kiêu, bại không nản. Học võ để rèn thân, giữ lẽ phải.", act: { hung: { pose: "idle" }, long: { pose: "idle" } }, sfx: [{ name: "victory", at: 0.3 }] }
      ] },
    { bg: "dojo", beats: [
      { title: { text: "Thắng không kiêu, bại không nản", sub: "Âm thanh: TiengDong.com", dur: 3.6 } }
    ]}
  ]
};
