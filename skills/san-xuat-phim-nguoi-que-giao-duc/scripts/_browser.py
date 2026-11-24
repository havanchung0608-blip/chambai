"""Mở Chromium cho Playwright (Python); nếu bản Playwright chưa tải trình duyệt
thì dùng Chromium/Chrome/Edge có sẵn trên máy."""
import glob
import os
import shutil


def launch(p):
    try:
        return p.chromium.launch()
    except Exception as first:  # noqa: BLE001
        cands = [os.environ.get("CHROME_PATH", "")]
        cands += sorted(glob.glob("/opt/pw-browsers/chromium-*/chrome-linux*/chrome"), reverse=True)
        cands += ["/opt/pw-browsers/chromium", shutil.which("chromium") or "", shutil.which("google-chrome") or "",
                  r"C:\Program Files\Google\Chrome\Application\chrome.exe",
                  r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
        for c in cands:
            if c and os.path.isfile(c):
                return p.chromium.launch(executable_path=c, args=["--headless=new", "--no-sandbox"])
        raise first
