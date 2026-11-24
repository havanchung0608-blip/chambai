#!/usr/bin/env bash
# Cài công cụ cho Stickman 3D Movie Studio (Ubuntu/Debian). Cần quyền root/sudo.
set -e
SUDO=$([ "$(id -u)" = 0 ] && echo "" || echo sudo)
$SUDO apt-get update -qq
$SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq blender python3-numpy python3-pil fonts-liberation xvfb ffmpeg python3-venv
if [ ! -x /opt/vieneu/bin/python ]; then
  $SUDO python3 -m venv /opt/vieneu
  $SUDO /opt/vieneu/bin/pip install -q --upgrade pip
  $SUDO /opt/vieneu/bin/pip install -q vieneu
fi
python3 "$(dirname "$0")/audio/fetch_tiengdong.py" || true
python3 "$(dirname "$0")/scripts/studio.py" check
