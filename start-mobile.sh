#!/bin/bash
cd "$(dirname "$0")/mobile"

echo "========================================"
echo " EcoGuard Technologies — Mobile App"
echo "========================================"
echo ""
echo "[INFO] Installing npm packages..."
npm install

echo ""
echo "[INFO] Starting Expo development server..."
echo "[INFO] Scan QR code with Expo Go app, or press 'a' for Android emulator"
echo ""

npx expo start
