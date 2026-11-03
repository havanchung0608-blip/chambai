// Đọc câu hỏi bằng giọng tiếng Việt (Web Speech API của trình duyệt).
import { duckMusic, isMuted } from './sound';

/** Chuyển nội dung câu hỏi (HTML) thành lời đọc tiếng Việt. */
export function toSpeech(html: string) {
  return html
    .replace(/<span class="fr"><i>(.*?)<\/i><i>(.*?)<\/i><\/span>/g, ' $1 phần $2 ')
    .replace(/<sup>2<\/sup>/g, ' bình phương ')
    .replace(/<sup>3<\/sup>/g, ' lập phương ')
    .replace(/<sup>(.*?)<\/sup>/g, ' mũ $1 ')
    .replace(/<br\s*\/?>/g, '. ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/cm²/g, ' xăng-ti-mét vuông').replace(/cm³/g, ' xăng-ti-mét khối').replace(/m²/g, ' mét vuông')
    .replace(/km\/giờ/g, ' ki-lô-mét một giờ')
    .replace(/√/g, ' căn ').replace(/×|·/g, ' nhân ').replace(/ : /g, ' chia ')
    .replace(/−/g, ' trừ ').replace(/\+/g, ' cộng ').replace(/≠/g, ' khác ').replace(/≥/g, ' lớn hơn hoặc bằng ').replace(/≤/g, ' nhỏ hơn hoặc bằng ')
    .replace(/=/g, ' bằng ').replace(/%/g, ' phần trăm').replace(/°/g, ' độ').replace(/π/g, ' pi').replace(/Δ/g, ' đen-ta')
    .replace(/\s+/g, ' ').trim();
}

export function speak(text: string) {
  if (isMuted()) return;
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'vi-VN';
    const v = synth.getVoices().find(x => x.lang?.toLowerCase().startsWith('vi'));
    if (v) u.voice = v;
    u.rate = 0.9;
    duckMusic(true);
    u.onend = () => duckMusic(false);
    u.onerror = () => duckMusic(false);
    synth.speak(u);
  } catch { /* trình duyệt không hỗ trợ đọc */ }
}

