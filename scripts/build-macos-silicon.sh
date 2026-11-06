#!/usr/bin/env bash
set -euo pipefail

# MoneyMatter - Build Standalone Rust Desktop App for Mac Apple Silicon (aarch64)

echo "=========================================================="
echo " MoneyMatter - Standalone macOS Apple Silicon Build"
echo "=========================================================="

ARCH=$(uname -m)
OS=$(uname -s)

if [ "$OS" != "Darwin" ]; then
  echo "⚠️  Notice: You are running this script on $OS, not macOS."
  echo "    To build the native macOS .app and .dmg directly, run this script"
  echo "    on a Mac with Apple Silicon (M1/M2/M3/M4) or trigger the automated"
  echo "    GitHub Actions workflow in .github/workflows/build-mac-silicon.yml."
fi

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Error: Node.js is required. Please install Node.js 20 or 24."
  exit 1
fi
echo "✓ Node.js $(node --version)"

# Check Rust / Cargo
if ! command -v cargo >/dev/null 2>&1; then
  echo "❌ Error: Rust toolchain is required. Install via https://rustup.rs"
  exit 1
fi
echo "✓ $(rustc --version)"

# Ensure aarch64-apple-darwin target is installed in rustup
if command -v rustup >/dev/null 2>&1; then
  echo "→ Ensuring aarch64-apple-darwin target is installed..."
  rustup target add aarch64-apple-darwin || true
fi

# Install dependencies if needed
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [ ! -d "node_modules" ]; then
  echo "→ Installing project dependencies..."
  npm install
fi

# Build frontend and desktop assets
echo "→ Building MoneyMatter frontend & desktop bridge..."
npm -w packages/frontend run build || true
node packages/desktop/scripts/build-frontend.mjs

# Build Tauri native Rust application for Apple Silicon
echo "→ Compiling standalone native Rust desktop application (aarch64-apple-darwin)..."
cd packages/desktop
npx @tauri-apps/cli build --target aarch64-apple-darwin

BUNDLE_DIR="$ROOT_DIR/packages/desktop/src-tauri/target/aarch64-apple-darwin/release/bundle"

echo ""
echo "=========================================================="
echo "🎉 Build completed successfully!"
echo "=========================================================="
echo ""
echo "macOS Application Bundle (.app):"
echo "  $BUNDLE_DIR/macos/MoneyMatter.app"
echo ""
echo "macOS Installer Disk Image (.dmg):"
echo "  $BUNDLE_DIR/dmg/"
echo ""
echo "To launch immediately on your Mac:"
echo "  open \"$BUNDLE_DIR/macos/MoneyMatter.app\""
echo "=========================================================="
