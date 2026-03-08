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

  // ── Bluetooth sensor state ─────────────────────────
  _ble: {
    device:         null,
    characteristic: null,
    connected:      false,
    enabled:        true,    // can be disabled by dev mode
    _lastRevs:      null,
    _lastTime:      null,
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
    const s = this._prefs;
    const ble = this._ble;

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

    const bleStatusIcon = ble.connected ? '🟢' : ble.device ? '🟡' : '⚫';
    const bleStatusText = ble.connected ? 'Connected' : ble.device ? 'Paired (not active)' : 'Not connected';
    const bleSensorEnabled = ble.enabled;

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
          <div class="sett-section-label">🚴 CADENCE SENSOR</div>
          <div class="sett-ble-status">
            <span class="sett-ble-icon">${bleStatusIcon}</span>
            <span class="sett-ble-text">${bleStatusText}</span>
            ${ble.enabled ? '' : '<span class="sett-ble-disabled">⚠ Disabled by Dev Mode</span>'}
          </div>
          ${ble.connected
            ? `<button class="sett-btn sett-btn-danger" onclick="Settings.bleDisconnect()">🔌 DISCONNECT</button>`
            : `<button class="sett-btn sett-btn-primary" onclick="Settings.bleSearch()"
                ${!ble.enabled ? 'disabled title="Disabled by Dev Mode"' : ''}>
                🔍 SEARCH FOR SENSOR
              </button>`
          }
          <div class="sett-ble-log" id="sett-ble-log"></div>
          <div class="sett-ble-hint">
            Pair a Bluetooth CSC (Cycling Speed &amp; Cadence) sensor.<br>
            Supported: Garmin, Wahoo, Polar, most ANT+/BLE sensors.
          </div>
        </div>

      </div>
      <div class="sett-footer">
        <span class="sett-footer-note">Settings auto-saved.</span>
      </div>
    `;
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
  // BLE Cadence Sensor — Web Bluetooth API
  // CSC Service: 0x1816  |  CSC Measurement char: 0x2A5B
  // ─────────────────────────────────────────────────────
  _bleLog(msg, cls = '') {
    const el = document.getElementById('sett-ble-log');
    if (!el) return;
    el.innerHTML = `<span class="${cls}">${msg}</span>`;
  },

  async bleSearch() {
    if (!navigator.bluetooth) {
      this._bleLog('❌ Web Bluetooth not available in this browser. Use Chrome/Edge on desktop.', 'ble-error');
      return;
    }
    if (!this._ble.enabled) {
      this._bleLog('⚠ Sensor input disabled by Dev Mode.', 'ble-warn');
      return;
    }

    this._bleLog('🔍 Scanning… allow Bluetooth in your browser popup.', 'ble-info');

    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['cycling_speed_and_cadence'] },
          { services: [0x1816] },
        ],
        optionalServices: ['cycling_speed_and_cadence', 0x1816],
      });

      this._bleLog(`📡 Found: ${device.name || 'Unnamed device'}. Connecting…`, 'ble-info');
      this._ble.device = device;

      device.addEventListener('gattserverdisconnected', () => {
        this._ble.connected = false;
        this._ble.characteristic = null;
        Utils.toast('📡 Cadence sensor disconnected.', 'info', 3000);
        this._refresh();
      });

      const server  = await device.gatt.connect();
      const service = await server.getPrimaryService('cycling_speed_and_cadence');
      const char    = await service.getCharacteristic('csc_measurement');

      this._ble.characteristic = char;
      this._ble.connected      = true;
      this._ble._lastRevs      = null;
      this._ble._lastTime      = null;

      await char.startNotifications();
      char.addEventListener('characteristicvaluechanged', e => this._onBLEData(e));

      this._bleLog(`✅ Connected to ${device.name || 'sensor'}! Pedal to start generating.`, 'ble-ok');
      Utils.toast(`🚴 BLE sensor connected: ${device.name || 'cadence sensor'}`, 'good', 4000);
      this._refresh();

    } catch (err) {
      if (err.name === 'NotFoundError') {
        this._bleLog('🔎 No sensor selected (search cancelled).', 'ble-warn');
      } else {
        this._bleLog(`❌ ${err.message || err}`, 'ble-error');
        console.warn('[BLE] Error:', err);
      }
    }
  },

  bleDisconnect() {
    if (this._ble.device?.gatt?.connected) {
      this._ble.device.gatt.disconnect();
    }
    this._ble.connected      = false;
    this._ble.device         = null;
    this._ble.characteristic = null;
    this._bleLog('Disconnected.', 'ble-info');
    Utils.toast('📡 Cadence sensor disconnected.', 'info', 2000);
    this._refresh();
  },

  // ── Parse CSC Measurement packet ─────────────────────
  // Byte 0: flags (bit 0 = wheel present, bit 1 = crank present)
  // If crank present (bit 1): bytes 1-2 = crank revs (uint16), bytes 3-4 = last crank event time (uint16, 1/1024s)
  _onBLEData(event) {
    if (!this._ble.enabled) return;
    const val   = event.target.value;
    const flags = val.getUint8(0);
    const hasCrank = (flags & 0x02) !== 0;
    if (!hasCrank) return;

    // Crank data starts at offset 1 if no wheel data, or offset 5 if wheel data present
    const hasWheel = (flags & 0x01) !== 0;
    const off      = hasWheel ? 5 : 1;
    if (val.byteLength < off + 4) return;

    const revs    = val.getUint16(off,     true);  // cumulative crank revolutions
    const rawTime = val.getUint16(off + 2, true);  // last crank event time (1/1024 sec units)

    const prev = this._ble;
    if (prev._lastRevs === null) {
      prev._lastRevs = revs;
      prev._lastTime = rawTime;
      return;
    }

    // Handle 16-bit rollover
    const dRevs = (revs - prev._lastRevs + 65536) % 65536;
    const dTime = (rawTime - prev._lastTime + 65536) % 65536;

    prev._lastRevs = revs;
    prev._lastTime = rawTime;

    if (dTime === 0 || dRevs === 0) return;

    // Convert to CPM: dRevs / (dTime / 1024) * 60
    const cpm = Math.round((dRevs / (dTime / 1024)) * 60);
    if (cpm < 10 || cpm > 300) return; // sanity check

    // Inject synthetic click timestamps into Cadence to match the measured CPM
    // We push `dRevs` clicks spread over dTime/1024 seconds
    const nowMs       = Date.now();
    const dSecs       = dTime / 1024;
    const timestamps  = Array.from({ length: dRevs }, (_, i) =>
      nowMs - Math.round((dSecs * 1000 * (dRevs - i) / dRevs))
    );
    if (typeof Cadence !== 'undefined' && Cadence._active) {
      timestamps.forEach(ts => Cadence._clickTimes.push(ts));
      Cadence._recalcCPM();
    }
  },

  // ── Called by DevMode to enable/disable sensor input ──
  setBleEnabled(v) {
    this._ble.enabled = v;
    if (!v && this._ble.connected) {
      this._bleLog('⚠ Sensor input paused by Dev Mode.', 'ble-warn');
    }
    // Refresh panel if open
    if (this._visible) this._refresh();
  },
};

// Settings.init() is called from main.js after DOM is ready
