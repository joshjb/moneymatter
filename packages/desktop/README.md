# MoneyMatter for macOS (Apple Silicon)

A high-performance, standalone native desktop application of [MoneyMatter](https://github.com/letehaha/moneymatter) built with **Rust** and **Tauri v2** specifically optimized for **Mac Apple Silicon (M1/M2/M3/M4, `aarch64-apple-darwin`)**.

---

## 🌟 Highlights & Native macOS Features

- **Blazing Fast Native Performance**: Powered by a native Rust backend and Apple's native WebKit engine. Launches in under 0.5s with minimal memory consumption (~30MB RAM vs ~250MB+ in Electron).
- **Apple Silicon Native (`aarch64-apple-darwin`)**: Compiled directly for ARM64 with full hardware acceleration.
- **Modern macOS Design**: Seamless frameless window with native macOS traffic lights (`titleBarStyle: Overlay`), translucent header blur, and full drag region support.
- **Native macOS Application Menu & Shortcuts**:
  - `⌘ ,` : Preferences & Server Configuration
  - `⌘ ⇧ S` : Quick Server Switcher
  - `⌘ R` / `⌘ ⇧ R` : Reload / Force Reload
  - `⌘ W` : Close Window
  - `⌘ Q` : Quit MoneyMatter
  - Full Edit (Undo, Redo, Cut, Copy, Paste, Select All) and Window controls.
- **macOS Menu Bar / System Tray**: Status item with quick access to show window, switch server, or quit.
- **Flexible Server Connection Manager**:
  - 🟣 **MoneyMatter Cloud** (`https://moneymatter.app`)
  - 🐳 **Local Docker / Self-Hosted** (`http://localhost:8080`)
  - 🌐 **Custom Remote Server** (`https://money.yourdomain.com`)
  - Built-in live latency & health check directly via Rust `reqwest`
- **Persistent Preferences**: Settings securely saved in macOS native standard directory: `~/Library/Application Support/app.moneymatter.desktop/config.json`.

---

## 🚀 Quick Start & Building on Mac Apple Silicon

### Prerequisites

1. **Mac with Apple Silicon** (M1, M2, M3, or M4 chip)
2. **Node.js** 20 or 24 (`node -v`)
3. **Rust** toolchain:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   rustup target add aarch64-apple-darwin
   ```

### 1-Step Build Script

Run the automated build script from the repository root:

```bash
./scripts/build-macos-silicon.sh
```

### Or using npm scripts:

```bash
# Install dependencies
npm install

# Build frontend and compile macOS Apple Silicon desktop app
npm run desktop:build:mac
```

The resulting artifacts will be in:
- **macOS App Bundle**: `packages/desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/MoneyMatter.app`
- **macOS Installer DMG**: `packages/desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/MoneyMatter_0.33.11_aarch64.dmg`

To launch:
```bash
open packages/desktop/src-tauri/target/aarch64-apple-darwin/release/bundle/macos/MoneyMatter.app
```

---

## ☁️ Automated GitHub Actions CI/CD (No Local Build Required)

If you don't want to build locally, an automated GitHub Actions workflow is provided at [`.github/workflows/build-mac-silicon.yml`](../../.github/workflows/build-mac-silicon.yml):

1. Go to your repository's **Actions** tab on GitHub.
2. Select **Build macOS Apple Silicon Desktop App**.
3. Click **Run workflow**.
4. The workflow runs on an Apple Silicon runner (`macos-14`), builds the native `.dmg` and `.app.tar.gz`, and attaches them to the workflow run artifacts for instant download!

---

## 🛠️ Project Structure

```text
packages/desktop/
├── package.json                   # Desktop workspace scripts & Tauri CLI
├── README.md                      # This documentation
├── scripts/
│   └── build-frontend.mjs         # Builds frontend and injects desktop bridge
├── src/
│   └── desktop-bridge.js          # JavaScript bridge for IPC and Server switcher UI
└── src-tauri/                     # Rust native application
    ├── Cargo.toml                 # Rust dependencies (tauri, reqwest, tokio, etc.)
    ├── tauri.conf.json            # Tauri v2 Apple Silicon & macOS bundle config
    ├── build.rs                   # Tauri build script
    ├── entitlements.mac.plist     # macOS network & sandbox entitlements
    ├── Info.plist                 # macOS bundle metadata
    ├── capabilities/
    │   └── default.json           # Tauri v2 security capabilities & permissions
    ├── icons/                     # macOS icon.icns and PNG icon assets
    └── src/
        ├── main.rs                # App entrypoint
        ├── lib.rs                 # Tauri application builder & plugins
        ├── config.rs              # App Support persistent settings store
        ├── commands.rs            # IPC commands (latency test, config, sysinfo)
        ├── menu.rs                # Native macOS application menu
        └── tray.rs                # macOS status bar / tray icon
```

---

## ⌨️ Shortcuts Reference

| Shortcut | Action |
|---|---|
| `⌘ ,` | Open Preferences / Server Settings |
| `⌘ ⇧ S` | Quick Switch Server |
| `⌘ R` | Reload Webview |
| `⌘ ⇧ R` | Hard Reload |
| `⌘ W` | Close Window |
| `⌘ M` | Minimize Window |
| `⌘ Q` | Quit MoneyMatter |
