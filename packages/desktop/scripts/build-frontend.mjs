import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const desktopRoot = path.resolve(__dirname, '..');
const frontendRoot = path.resolve(desktopRoot, '../frontend');
const distTarget = path.resolve(desktopRoot, 'dist');
const bridgeSrc = path.resolve(desktopRoot, 'src/desktop-bridge.js');

console.log('[build-frontend] Preparing frontend for MoneyMatter Desktop...');

// Ensure dist target directory exists
if (!fs.existsSync(distTarget)) {
  fs.mkdirSync(distTarget, { recursive: true });
}

const frontendDist = path.resolve(frontendRoot, 'dist');

// Check if frontend is built
let useFrontendBuild = false;
if (fs.existsSync(path.resolve(frontendDist, 'index.html'))) {
  useFrontendBuild = true;
} else {
  console.log('[build-frontend] Building frontend assets from packages/frontend...');
  try {
    execSync('npm run build', { cwd: frontendRoot, stdio: 'inherit' });
    if (fs.existsSync(path.resolve(frontendDist, 'index.html'))) {
      useFrontendBuild = true;
    }
  } catch (err) {
    console.warn('[build-frontend] Note: Frontend npm build skipped or encountered error. Using desktop standalone shell mode.');
  }
}

if (useFrontendBuild) {
  console.log(`[build-frontend] Copying built assets from ${frontendDist} to ${distTarget}...`);
  fs.cpSync(frontendDist, distTarget, { recursive: true });

  // Copy desktop-bridge.js
  fs.copyFileSync(bridgeSrc, path.resolve(distTarget, 'desktop-bridge.js'));

  // Inject desktop-bridge.js into index.html
  const indexPath = path.resolve(distTarget, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');
  if (!html.includes('desktop-bridge.js')) {
    html = html.replace('</body>', '  <script src="/desktop-bridge.js"></script>\n  </body>');
    fs.writeFileSync(indexPath, html, 'utf-8');
  }
} else {
  // Provide standalone desktop launcher HTML shell
  console.log('[build-frontend] Generating desktop standalone shell in dist/index.html...');
  
  // Copy icons and assets
  const logoSrc = path.resolve(desktopRoot, '../landing/public/img/logo.svg');
  if (fs.existsSync(logoSrc)) {
    fs.copyFileSync(logoSrc, path.resolve(distTarget, 'logo.svg'));
  }

  fs.copyFileSync(bridgeSrc, path.resolve(distTarget, 'desktop-bridge.js'));

  const shellHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>MoneyMatter Desktop</title>
  <style>
    :root {
      color-scheme: dark;
    }
    body {
      margin: 0;
      padding: 0;
      background: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      user-select: none;
      -webkit-user-select: none;
    }
    .titlebar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 38px;
      -webkit-app-region: drag;
      z-index: 100;
    }
    .card {
      background: #18181b;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 40px;
      max-width: 520px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .logo {
      width: 72px;
      height: 72px;
      margin-bottom: 20px;
      border-radius: 16px;
      box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      margin: 0 0 10px 0;
      letter-spacing: -0.5px;
    }
    p {
      color: #a1a1aa;
      font-size: 15px;
      line-height: 1.5;
      margin: 0 0 28px 0;
    }
    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #8b5cf6, #a855f7);
      color: white;
    }
    .btn-primary:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #27272a;
      color: #e4e4e7;
      border: 1px solid #3f3f46;
    }
    .btn-secondary:hover {
      background: #3f3f46;
    }
    .hint {
      margin-top: 20px;
      font-size: 12px;
      color: #71717a;
    }
  </style>
</head>
<body>
  <div class="titlebar" data-tauri-drag-region></div>
  <div class="card">
    <img src="/logo.svg" alt="MoneyMatter Logo" class="logo">
    <h1>MoneyMatter Desktop</h1>
    <p>Standalone Mac Apple Silicon client for MoneyMatter. Connect to your cloud or self-hosted personal finance server.</p>
    <div class="actions">
      <button class="btn btn-primary" onclick="window.MoneyMatterDesktop && window.MoneyMatterDesktop.showServerSettings()">
        Connect to MoneyMatter Server
      </button>
      <button class="btn btn-secondary" onclick="window.location.href = 'https://moneymatter.app'">
        Open Cloud App
      </button>
    </div>
    <div class="hint">Press <kbd style="background:#27272a;padding:2px 6px;border-radius:4px;border:1px solid #3f3f46;">⌘ ,</kbd> anytime to open Server Preferences</div>
  </div>
  <script src="/desktop-bridge.js"></script>
</body>
</html>`;
  fs.writeFileSync(path.resolve(distTarget, 'index.html'), shellHtml, 'utf-8');
}

console.log('[build-frontend] Frontend bundle ready in packages/desktop/dist.');
