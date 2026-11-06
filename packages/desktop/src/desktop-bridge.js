// MoneyMatter Desktop Bridge for macOS Apple Silicon
// Connects the web frontend to Tauri v2 Rust runtime and provides
// server configuration, connection diagnostics, and native window controls.

(function () {
  const isTauri = typeof window !== 'undefined' && (!!window.__TAURI__ || !!window.__TAURI_INTERNALS__);

  let currentConfig = {
    server_url: 'https://moneymatter.app',
    auto_connect: true,
    theme: 'system',
    remember_server: true,
  };

  // Helper to call Tauri IPC
  async function invoke(cmd, args = {}) {
    if (window.__TAURI__ && window.__TAURI__.core && window.__TAURI__.core.invoke) {
      return await window.__TAURI__.core.invoke(cmd, args);
    }
    console.warn(`[DesktopBridge] invoke called outside Tauri: ${cmd}`);
    return null;
  }

  // Setup macOS top drag bar for titleBarStyle: Overlay
  function injectMacOSTitlebar() {
    if (document.getElementById('mm-macos-drag-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'mm-macos-drag-bar';
    bar.setAttribute('data-tauri-drag-region', 'true');
    bar.style.position = 'fixed';
    bar.style.top = '0';
    bar.style.left = '0';
    bar.style.right = '0';
    bar.style.height = '36px';
    bar.style.zIndex = '9998';
    bar.style.pointerEvents = 'auto';
    bar.style.userSelect = 'none';
    bar.style.webkitUserSelect = 'none';
    bar.style.webkitAppRegion = 'drag';
    document.body.appendChild(bar);
  }

  // Create or toggle server settings modal
  function showServerSettingsModal(initialError = null) {
    let modal = document.getElementById('mm-server-modal');
    if (modal) {
      modal.style.display = 'flex';
      return;
    }

    modal = document.createElement('div');
    modal.id = 'mm-server-modal';
    modal.innerHTML = `
      <div class="mm-modal-backdrop">
        <div class="mm-modal-card">
          <div class="mm-modal-header">
            <div class="mm-logo-circle">
              <svg width="40" height="40" viewBox="0 0 1024 1024" fill="none">
                <rect width="1024" height="1024" rx="192" fill="url(#modal-mm-bg)"/>
                <defs>
                  <linearGradient id="modal-mm-bg" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stop-color="#8b5cf6"/>
                    <stop offset=".5" stop-color="#a855f7"/>
                    <stop offset="1" stop-color="#9333ea"/>
                  </linearGradient>
                </defs>
                <path fill="white" d="M236.0 248.9A22 22 0 0 1 268.5 229.5L501.5 355.4A22 22 0 0 0 522.5 355.4L755.5 229.5A22 22 0 0 1 788.0 248.9L788.0 790.0A22 22 0 0 1 766.0 812.0L674.0 812.0A22 22 0 0 1 652.0 790.0L652.0 440.0L514.9 514.1A6 6 0 0 1 509.1 514.1L247.5 372.8A22 22 0 0 1 236.0 353.4ZM236.0 473.9A22 22 0 0 1 268.5 454.5L360.5 504.2A22 22 0 0 1 372.0 523.6L372.0 790.0A22 22 0 0 1 350.0 812.0L258.0 812.0A22 22 0 0 1 236.0 790.0ZM444.0 559.4A6 6 0 0 1 452.9 554.1L512.0 586.1L571.1 554.1A6 6 0 0 1 580.0 559.4L580.0 790.0A22 22 0 0 1 558.0 812.0L466.0 812.0A22 22 0 0 1 444.0 790.0Z"/>
              </svg>
            </div>
            <h2>MoneyMatter Desktop</h2>
            <p class="mm-subtitle">Select which MoneyMatter instance to connect to</p>
          </div>

          <div class="mm-options">
            <label class="mm-radio-card" data-target="cloud">
              <input type="radio" name="mm_server_choice" value="cloud" checked>
              <div class="mm-radio-body">
                <div class="mm-radio-title">MoneyMatter Cloud</div>
                <div class="mm-radio-desc">Hosted at https://moneymatter.app</div>
              </div>
            </label>

            <label class="mm-radio-card" data-target="local">
              <input type="radio" name="mm_server_choice" value="local">
              <div class="mm-radio-body">
                <div class="mm-radio-title">Local Self-Hosted</div>
                <div class="mm-radio-desc">Running on http://localhost:8080 (Docker)</div>
              </div>
            </label>

            <label class="mm-radio-card" data-target="custom">
              <input type="radio" name="mm_server_choice" value="custom">
              <div class="mm-radio-body">
                <div class="mm-radio-title">Custom Server URL</div>
                <div class="mm-radio-desc">Connect to your private server or VPS</div>
              </div>
            </label>
          </div>

          <div id="mm-custom-input-group" style="display: none; margin-top: 12px;">
            <input type="url" id="mm-custom-url-input" placeholder="https://money.yourdomain.com" class="mm-input" />
          </div>

          <div id="mm-status-box" class="mm-status-box" style="display: none;"></div>

          <div class="mm-modal-actions">
            <button id="mm-btn-test" class="mm-btn mm-btn-secondary">Test Connection</button>
            <button id="mm-btn-save" class="mm-btn mm-btn-primary">Connect & Launch</button>
          </div>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #mm-server-modal {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 10, 15, 0.7);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .mm-modal-card {
        background: #18181b;
        color: #f4f4f5;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 18px;
        width: 480px;
        padding: 32px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
      }
      .mm-modal-header {
        text-align: center;
        margin-bottom: 24px;
      }
      .mm-modal-header h2 {
        font-size: 22px;
        font-weight: 700;
        margin: 12px 0 4px 0;
      }
      .mm-subtitle {
        color: #a1a1aa;
        font-size: 14px;
        margin: 0;
      }
      .mm-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .mm-radio-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .mm-radio-card:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(168, 85, 247, 0.4);
      }
      .mm-radio-title {
        font-weight: 600;
        font-size: 14px;
      }
      .mm-radio-desc {
        color: #71717a;
        font-size: 12px;
        margin-top: 2px;
      }
      .mm-input {
        width: 100%;
        box-sizing: border-box;
        padding: 10px 14px;
        background: #27272a;
        border: 1px solid #3f3f46;
        border-radius: 8px;
        color: #fff;
        font-size: 14px;
        outline: none;
      }
      .mm-input:focus {
        border-color: #a855f7;
      }
      .mm-status-box {
        margin-top: 14px;
        padding: 10px 14px;
        border-radius: 8px;
        font-size: 13px;
      }
      .mm-status-success {
        background: rgba(34, 197, 94, 0.15);
        color: #4ade80;
        border: 1px solid rgba(34, 197, 94, 0.3);
      }
      .mm-status-error {
        background: rgba(239, 68, 68, 0.15);
        color: #f87171;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
      .mm-status-loading {
        background: rgba(168, 85, 247, 0.15);
        color: #c084fc;
        border: 1px solid rgba(168, 85, 247, 0.3);
      }
      .mm-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
      }
      .mm-btn {
        padding: 9px 18px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: none;
        transition: opacity 0.15s ease;
      }
      .mm-btn:hover {
        opacity: 0.9;
      }
      .mm-btn-secondary {
        background: #27272a;
        color: #e4e4e7;
      }
      .mm-btn-primary {
        background: linear-gradient(135deg, #8b5cf6, #a855f7);
        color: #ffffff;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(modal);

    // Setup interactive handlers
    const radioCards = modal.querySelectorAll('.mm-radio-card');
    const customInputGroup = document.getElementById('mm-custom-input-group');
    const customUrlInput = document.getElementById('mm-custom-url-input');
    const statusBox = document.getElementById('mm-status-box');
    const testBtn = document.getElementById('mm-btn-test');
    const saveBtn = document.getElementById('mm-btn-save');

    function getSelectedUrl() {
      const selected = modal.querySelector('input[name="mm_server_choice"]:checked').value;
      if (selected === 'cloud') return 'https://moneymatter.app';
      if (selected === 'local') return 'http://localhost:8080';
      return customUrlInput.value.trim() || 'http://localhost:8080';
    }

    radioCards.forEach((card) => {
      card.addEventListener('click', () => {
        const input = card.querySelector('input');
        input.checked = true;
        customInputGroup.style.display = input.value === 'custom' ? 'block' : 'none';
        statusBox.style.display = 'none';
      });
    });

    // Populate current config
    if (currentConfig.server_url.includes('moneymatter.app')) {
      modal.querySelector('input[value="cloud"]').checked = true;
    } else if (currentConfig.server_url.includes('localhost')) {
      modal.querySelector('input[value="local"]').checked = true;
    } else {
      modal.querySelector('input[value="custom"]').checked = true;
      customInputGroup.style.display = 'block';
      customUrlInput.value = currentConfig.server_url;
    }

    if (initialError) {
      statusBox.className = 'mm-status-box mm-status-error';
      statusBox.textContent = `Server check: ${initialError}`;
      statusBox.style.display = 'block';
    }

    testBtn.addEventListener('click', async () => {
      const url = getSelectedUrl();
      statusBox.className = 'mm-status-box mm-status-loading';
      statusBox.textContent = `Testing connection to ${url}...`;
      statusBox.style.display = 'block';

      try {
        const result = await invoke('test_server_connection', { url });
        if (result && result.ok) {
          statusBox.className = 'mm-status-box mm-status-success';
          statusBox.textContent = `Connected successfully! Latency: ${result.latency_ms}ms (Status: ${result.status_code})`;
        } else {
          statusBox.className = 'mm-status-box mm-status-error';
          statusBox.textContent = `Could not connect to ${url}. ${result?.error || 'Make sure the server is running.'}`;
        }
      } catch (err) {
        statusBox.className = 'mm-status-box mm-status-error';
        statusBox.textContent = `Connection error: ${err}`;
      }
    });

    saveBtn.addEventListener('click', async () => {
      const url = getSelectedUrl();
      currentConfig.server_url = url;
      currentConfig.remember_server = true;

      try {
        await invoke('save_desktop_config', { config: currentConfig });
      } catch (e) {
        console.error('Failed to save desktop config:', e);
      }

      // Configure window.__APP_CONFIG__ and reload
      window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
      window.__APP_CONFIG__.API_HTTP = url;
      modal.style.display = 'none';
      window.location.reload();
    });
  }

  // Initialize Desktop bridge
  async function init() {
    if (!isTauri) return;

    injectMacOSTitlebar();

    try {
      const config = await invoke('get_desktop_config');
      if (config && config.server_url) {
        currentConfig = config;
        window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
        window.__APP_CONFIG__.API_HTTP = config.server_url;
      }
    } catch (e) {
      console.warn('Failed to fetch initial desktop config:', e);
    }

    // Listen to Tauri events (e.g. from macOS App Menu / Tray)
    if (window.__TAURI__ && window.__TAURI__.event) {
      window.__TAURI__.event.listen('open-server-settings', () => {
        showServerSettingsModal();
      });
    }

    // Hotkey CmdOrCtrl+, / CmdOrCtrl+Shift+S fallback in browser
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        showServerSettingsModal();
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        showServerSettingsModal();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.MoneyMatterDesktop = {
    showServerSettings: showServerSettingsModal,
    invoke,
  };
})();
