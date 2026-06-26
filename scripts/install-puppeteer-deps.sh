#!/usr/bin/env bash
# Install OS libraries required by Puppeteer bundled Chrome (Ubuntu/Debian).
# Safe to re-run; skips if libatk is already present.
set -euo pipefail

if ldconfig -p 2>/dev/null | grep -q 'libatk-1.0.so.0'; then
  echo "Puppeteer Chrome deps already installed."
  exit 0
fi

echo "Installing Puppeteer Chrome dependencies..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
  ca-certificates fonts-liberation \
  libasound2t64 libatk-bridge2.0-0t64 libatk1.0-0t64 \
  libcairo2 libcups2t64 libdbus-1-3 libdrm2 libexpat1 libfontconfig1 libgbm1 \
  libglib2.0-0t64 libgtk-3-0t64 libnspr4 libnss3 \
  libpango-1.0-0 libpangocairo-1.0-0 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 xdg-utils \
  || apt-get install -y -qq \
  ca-certificates fonts-liberation \
  libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libcairo2 libcups2 libdbus-1-3 libdrm2 libexpat1 libfontconfig1 libgbm1 \
  libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
  libpango-1.0-0 libpangocairo-1.0-0 \
  libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 \
  libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 xdg-utils

echo "Puppeteer Chrome deps installed."
