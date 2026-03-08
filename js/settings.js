// ═══════════════════════════════════════════════════════
// PEDAL OR DIE — settings.js
// In-game settings panel: volume sliders, brightness,
// and Bluetooth cadence sensor management.
// ═══════════════════════════════════════════════════════

const Settings = {

  _visible: false,
  _panel:   null,

  // ── Persisted settings ─────────────────────────────
  _prefs: {
    masterVol:   1.0,
    musicVol:    0.35,
    sfxVol:      0.55,
    monsterVol:  0.70,
    brightness:  1.0,    // CSS filter brightness multiplier
  },

  // ─────────────────────────────────────────────────────
  // Init — load persisted prefs and apply them
  // ─────────────────────────────────────────────────────
  init() {
    try {
      const saved = localStorage.getItem('pod_settings');
      if (saved) Object.assign(this._prefs, JSON.parse(saved));
    } catch (e) { /* ignore */ }
    this._apply();
  },

  _apply() {
    // Apply brightness to root element
    document.documentElement.style.filter = `brightness(${this._prefs.brightness})`;
    // Apply audio volumes (Audio may not be init'd yet — it guards internally)
    if (typeof Audio !== 'undefined') {
      Audio.setMasterVol?.(this._prefs.masterVol);
      Audio.setMusicVol?.(this._prefs.musicVol);
      Audio.setSfxVol?.(this._prefs.sfxVol);
      Audio.setMonsterVol?.(this._prefs.monsterVol);
    }
  },

  _save() {
    try { localStorage.setItem('pod_settings', JSON.stringify(this._prefs)); } catch (e) {}
  },

  // ─────────────────────────────────────────────────────
  // Toggle panel open/closed
  // ─────────────────────────────────────────────────────
  toggle() {
    this._visible = !this._visible;
    const p = document.getElementById('settings-panel');
    if (p) {
      p.classList.toggle('settings-open', this._visible);
      if (this._visible) this._refresh();
    } else {
      this._inject();
    }
  },

  _inject() {
    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.className = 'settings-panel settings-open';
    panel.innerHTML = this._buildHTML();
    document.body.appendChild(panel);
    this._panel = panel;
  },

  _refresh() {
    const p = document.getElementById('settings-panel');
    if (p) p.innerHTML = this._buildHTML();
  },

  // ─────────────────────────────────────────────────────
  // Build panel HTML
  // ─────────────────────────────────────────────────────
  _buildHTML() {
    const s   = this._prefs;
    // BLE state lives in Bluetooth module — settings only owns the UI
    const ble          = typeof Bluetooth !== 'undefined' ? Bluetooth.state : null;
    const bleSaved     = typeof Bluetooth !== 'undefined' ? Bluetooth._saved : null;
    const bleConnected = ble?.connected   || false;
    const bleEnabled   = ble?.enabled     ?? true;
    const bleProto     = ble?.protocol    || '';
    const bleRpm       = ble?.rpm         || 0;
    const bleName      = ble?.displayName || ble?.deviceName || '';
    const bleReconnect = (typeof Bluetooth !== 'undefined') && !bleConnected && !!bleSaved;

    // Status icon: green=connected, yellow=reconnecting, grey=idle/saved
    const bleIcon = bleConnected ? '🟢'
                  : bleReconnect ? '🟡'
                  : '⚫';
    const bleStatusLine = bleConnected
      ? `${bleName} · ${bleProto.toUpperCase()} · ${bleRpm} RPM`
      : bleReconnect
        ? `Last: ${bleSaved.displayName || bleSaved.name} · reconnecting…`
        : 'No bike connected';

    const slider = (id, label, icon, value, min=0, max=1, step=0.05) => `
      <div class="sett-row">
        <span class="sett-row-icon">${icon}</span>
        <div class="sett-row-info">
          <span class="sett-row-label">${label}</span>
          <input type="range" class="sett-slider" id="sett-${id}"
            min="${min}" max="${max}" step="${step}" value="${value}"
            oninput="Settings._onSlider('${id}', this.value)">
          <span class="sett-value" id="sett-val-${id}">${Math.round(value * 100)}%</span>
        </div>
      </div>`;

    return `
      <div class="sett-header">
        <span class="sett-title">⚙️ SETTINGS</span>
        <button class="sett-close" onclick="Settings.toggle()">✕</button>
      </div>
      <div class="sett-body">

        <div class="sett-section">
          <div class="sett-section-label">🖥 DISPLAY</div>
          ${slider('brightness', 'Brightness', '☀️', s.brightness, 0.3, 1.5, 0.05)}
        </div>

        <div class="sett-section">
          <div class="sett-section-label">🔊 AUDIO</div>
          ${slider('masterVol',  'Master Volume',  '🔊', s.masterVol)}
          ${slider('musicVol',   'Background Music','🎵', s.musicVol)}
          ${slider('sfxVol',     'Sound Effects',  '💥', s.sfxVol)}
          ${slider('monsterVol', 'Monster Sounds', '👾', s.monsterVol)}
        </div>

        <div class="sett-section">
          <div class="sett-section-label">🚴 BIKE SENSOR</div>
          <div class="sett-ble-status">
            <span class="sett-ble-icon">${bleIcon}</span>
            <span class="sett-ble-text">${bleStatusLine}</span>
            ${!bleEnabled ? '<span class="sett-ble-disabled">⚠ Disabled by Dev Mode</span>' : ''}
          </div>

          ${bleConnected ? `
            <div class="sett-ble-rename">
              <input type="text" id="sett-ble-name-input"
                class="sett-ble-name-input"
                placeholder="Rename bike…"
                value="${bleName}"
                onkeydown="if(event.key==='Enter')Settings._bleRename()">
              <button class="sett-btn sett-btn-small" onclick="Settings._bleRename()">✔</button>
            </div>
            <div class="sett-ble-buttons">
              <button class="sett-btn sett-btn-danger"
                onclick="Bluetooth.disconnect();setTimeout(()=>Settings._refresh(),400)">
                🔌 DISCONNECT
              </button>
              <button class="sett-btn sett-btn-ghost"
                onclick="BikeConfig.open()">
                ⚙ CONFIGURE
              </button>
              <button class="sett-btn sett-btn-ghost"
                onclick="if(confirm('Forget saved bike?')){Bluetooth.forget();Settings._refresh();}">
                🗑 FORGET
              </button>
            </div>
          ` : `
            <div class="sett-ble-buttons">
              <button class="sett-btn sett-btn-primary"
                onclick="Bluetooth.connect(Settings._bleLog.bind(Settings)).then(ok=>ok&&Settings._refresh())"
                ${!bleEnabled ? 'disabled title="Disabled by Dev Mode"' : ''}>
                🔍 SEARCH FOR BIKE
              </button>
              ${bleSaved ? `
                <button class="sett-btn sett-btn-ghost"
                  onclick="if(confirm('Forget saved bike?')){Bluetooth.forget();Settings._refresh();}">
                  🗑 FORGET
                </button>` : ''}
            </div>
          `}

          <div class="sett-ble-log" id="sett-ble-log"></div>
          <div class="sett-ble-hint">
            Abilica / iConsole+ · FTMS · CSC (Magene, Garmin, Wahoo)<br>
            ${bleSaved ? 'Last connected device saved — auto-reconnects on load.' : 'Connects and saves device for future sessions.'}
          </div>
        </div>

      </div>
      <div class="sett-footer">
        <span class="sett-footer-note">Settings auto-saved.</span>
      </div>
    `;
  },

  // ── Rename handler called by the ✔ button ──────────────────────
  _bleRename() {
    const input = document.getElementById('sett-ble-name-input');
    if (input && typeof Bluetooth !== 'undefined') {
      Bluetooth.rename(input.value);
      this._refresh();
    }
  },

  // ─────────────────────────────────────────────────────
  // Slider handler
  // ─────────────────────────────────────────────────────
  _onSlider(id, raw) {
    const v = parseFloat(raw);
    this._prefs[id] = v;

    // Update value display
    const valEl = document.getElementById('sett-val-' + id);
    if (valEl) valEl.textContent = Math.round(v * 100) + '%';

    // Apply immediately
    if (typeof Audio !== 'undefined') {
      if (id === 'masterVol')  Audio.setMasterVol?.(v);
      if (id === 'musicVol')   Audio.setMusicVol?.(v);
      if (id === 'sfxVol')     Audio.setSfxVol?.(v);
      if (id === 'monsterVol') Audio.setMonsterVol?.(v);
    }
    if (id === 'brightness') {
      document.documentElement.style.filter = `brightness(${v})`;
    }
    this._save();
  },

  // ─────────────────────────────────────────────────────
  _bleLog(msg, cls = '') {
    const el = document.getElementById('sett-ble-log');
    if (!el) return;
    el.innerHTML = `<span class="${cls}">${msg}</span>`;
  },

};

// Settings.init() is called from main.js after DOM is ready
