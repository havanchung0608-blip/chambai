"""tts_engine — tạo giọng đọc tiếng Việt cho từng câu thoại, mỗi nhân vật một giọng.

Ưu tiên (miễn phí, không giới hạn số video):
  1. VieNeu-TTS (offline, CPU, 25 giọng Bắc/Trung/Nam, nhân bản giọng từ 3–5 s ghi âm) — Apache-2.0 (mô hình),
     giọng mẫu CC BY-NC 4.0 → dùng cho giáo dục phi thương mại, ghi nguồn "VieNeu-TTS (pnnbao-ump)".
  2. edge-tts (Microsoft HoaiMy/NamMinh, cần mạng tới speech.platform.bing.com).
  3. Piper vi_VN-vais1000 (offline, 1 giọng nữ).
Chạy:  <python có vieneu> tts_engine.py jobs.json outdir
jobs.json: [{"id": "L1", "text": "...", "voice": "Ngọc Huyền", "ref_audio": null, "speed": 1.0}]
"""
import json
import os
import subprocess
import sys


def _shape(fp, speed=None, pitch=None):
    """Tốc độ (giữ cao độ) và cao độ (bán cung) riêng cho từng vai: hải tặc trầm khàn, trẻ con trong, người kể chậm rãi."""
    speed, pitch = float(speed or 1), float(pitch or 0)
    if abs(speed - 1) < 1e-3 and abs(pitch) < 1e-3:
        return
    sr = 24000
    try:
        import soundfile as sf
        sr = sf.info(fp).samplerate
    except Exception:
        pass
    r = 2 ** (pitch / 12.0)
    tempo = speed / r                      # asetrate đổi cả tốc độ → bù bằng atempo
    chain = []
    while tempo > 2.0:
        chain.append("atempo=2.0"); tempo /= 2.0
    while tempo < 0.5:
        chain.append("atempo=0.5"); tempo /= 0.5
    chain.append(f"atempo={tempo:.4f}")
    flt = f"asetrate={int(sr * r)},aresample={sr}," + ",".join(chain)
    tmp = fp + ".tmp.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", fp, "-af", flt, tmp], check=True)
    os.replace(tmp, fp)


def run_vieneu(jobs, outdir):
    from vieneu import Vieneu
    tts = Vieneu()
    names = [n for _, n in tts.list_preset_voices()]
    cache = {}
    done = {}
    for j in jobs:
        v = j.get("voice") or "Ngọc Huyền"
        if j.get("ref_audio"):
            key = "ref:" + j["ref_audio"]
            if key not in cache:
                cache[key] = tts.encode_reference(j["ref_audio"]) if hasattr(tts, "encode_reference") else None
            voice = cache[key]
        else:
            if v not in names:
                v = names[0]
            if v not in cache:
                cache[v] = tts.get_preset_voice(v)
            voice = cache[v]
        audio = tts.infer(text=j["text"], voice=voice)
        fp = os.path.join(outdir, f"{j['id']}.wav")
        tts.save(audio, fp)
        _shape(fp, j.get("speed"), j.get("pitch"))
        done[j["id"]] = fp
        print("TTS", j["id"], v, flush=True)
    return done


def run_edge(jobs, outdir):
    import asyncio
    import edge_tts
    vmap = {"nu": "vi-VN-HoaiMyNeural", "nam": "vi-VN-NamMinhNeural"}

    async def go():
        done = {}
        for j in jobs:
            fp = os.path.join(outdir, f"{j['id']}.mp3")
            await edge_tts.Communicate(j["text"], vmap.get(j.get("gender", "nu"), vmap["nu"])).save(fp)
            done[j["id"]] = fp
        return done
    return asyncio.run(go())


def run_piper(jobs, outdir):
    model = os.path.expanduser("~/.cache/stickfilm/vi_VN-vais1000-medium.onnx")
    done = {}
    for j in jobs:
        fp = os.path.join(outdir, f"{j['id']}.wav")
        subprocess.run([sys.executable, "-m", "piper", "-m", model, "-f", fp], input=j["text"], text=True, check=True)
        done[j["id"]] = fp
    return done


if __name__ == "__main__":
    jobs = json.load(open(sys.argv[1], encoding="utf-8"))
    outdir = sys.argv[2]
    engine = sys.argv[3] if len(sys.argv) > 3 else "vieneu"
    os.makedirs(outdir, exist_ok=True)
    fn = {"vieneu": run_vieneu, "edge": run_edge, "piper": run_piper}[engine]
    res = fn(jobs, outdir)
    json.dump(res, open(os.path.join(outdir, "tts_result.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print("TTS_OK", len(res))
