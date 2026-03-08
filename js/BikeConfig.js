// ═══════════════════════════════════════════════════════════════════
// PEDAL OR DIE — BikeConfig.js
//
// Post-connect instrument configuration overlay.
// Opens automatically after a new bike connects (or manually via
// Settings panel "⚙ Configure" button).
//
// Shows live raw channel values from Bluetooth.channels so the user
// can verify what the device actually sends, then pick which channel
// drives the game's RPM input. The mapping is saved via
// Bluetooth.saveMapping() to localStorage so it persists across loads.
//
// Architecture: reads Bluetooth.channels (updated by parsers via
// bike:data event), writes mapping via Bluetooth.saveMapping().
// Does NOT touch State or Cadence directly.
// ═══════════════════════════════════════════════════════════════════

const BikeConfig = {

  _visible:  false,
  _panel:    null,
  _liveTimer: null,
  _lastData:  {},

  // ── Channel definitions ──────────────────────────────────────────
  // Each entry: { key, label, unit, protocols, hint }
  CHANNELS: [
    {
      key:       'iconsole_rpm',
      label:     'iConsole RPM',
      unit:      'RPM',
      protocols: ['iconsole'],
      hint:      'Direct cadence byte from Abilica / iConsole+ bike',
    },
    {
      key:       'iconsole_speed',
      label:     'iConsole Speed',
      unit:      'km/h',
      protocols: ['iconsole'],
      hint:      'Speed from Abilica / iConsole+ — game converts to RPM',
    },
    {
      key:       'ftms_cadence',
      label:     'FTMS Cadence',
      unit:      'RPM',
      protocols: ['ftms'],
      hint:      'Standard FTMS cadence field (Indoor Bike Data 0x2AD2)',
    },
    {
      key:       'ftms_speed',
      label:     'FTMS Speed',
      unit:      'km/h',
      protocols: ['ftms'],
      hint:      'Standard FTMS speed field — game converts to RPM',
    },
    {
      key:       'csc_rpm',
      label:     'CSC Cadence',
      unit:      'RPM',
      protocols: ['csc'],
      hint:      'Computed from crank revolution delta (Magene S3, Garmin, Wahoo)',
    },
  ],

  // ═════════════════════════════════════════════════════════════════
  // OPEN — creates overlay, starts live refresh
  // ═════════════════════════════════════════════════════════════════
  open() {
    if (this._visible) { this._refresh(); return; }
    this._visible = true;

    const overlay = document.createElement('div');
    overlay.id = 'bike-config-overlay';
    overlay.innerHTML = this._buildHTML();
    document.body.appendChild(overlay);
    this._panel = overlay;

    // Start live data updates (200ms — fast enough to see needle move)
    this._liveTimer = setInterval(() => this._updateLive(), 200);

    // Listen for incoming data packets
    Events.on('bike:data', this._onData.bind(this));
  },

  close() {
    if (!this._visible) return;
    this._visible = false;
    if (this._liveTimer) { clearInterval(this._liveTimer); this._liveTimer = null; }
    Events.off('bike:data', this._onData.bind(this));
    const el = document.getElementById('bike-config-overlay');
    if (el) el.remove();
    this._panel = null;
  },

  // ═════════════════════════════════════════════════════════════════
  // HTML
  // ═════════════════════════════════════════════════════════════════
  _buildHTML() {
    const ble      = Bluetooth.state;
    const proto    = ble.protocol || '?';
    const name     = ble.displayName || ble.deviceName || 'Unknown bike';
    const mapping  = Bluetooth.getMapping();
    const current  = mapping.rpmSource || 'auto';

    // Only show channels relevant to this protocol (plus 'auto')
    const relevantChannels = this.CHANNELS.filter(c =>
      c.protocols.includes(proto)
    );

    const channelRows = relevantChannels.map(c => {
      const val     = Bluetooth.channels[c.key];
      const hasData = val !== undefined && val !== null;
      const isSelected = current === c.key;
      return `
        <div class="bkcfg-channel ${isSelected ? 'selected' : ''}" data-key="${c.key}"
             onclick="BikeConfig._selectSource('${c.key}')">
          <div class="bkcfg-ch-left">
            <div class="bkcfg-ch-radio ${isSelected ? 'active' : ''}"></div>
            <div class="bkcfg-ch-info">
              <div class="bkcfg-ch-name">${c.label}</div>
              <div class="bkcfg-ch-hint">${c.hint}</div>
            </div>
          </div>
          <div class="bkcfg-ch-right">
            <div class="bkcfg-ch-val ${hasData ? 'live' : 'waiting'}" id="bkcfg-val-${c.key}">
              ${hasData ? val.toFixed(1) : '…'}
            </div>
            <div class="bkcfg-ch-unit">${c.unit}</div>
          </div>
        </div>`;
    }).join('');

    // Auto option always shown
    const autoSelected = current === 'auto';

    return `
      <div class="bkcfg-box">
        <div class="bkcfg-header">
          <div class="bkcfg-title">🚴 BIKE SETUP</div>
          <div class="bkcfg-device">${name} · ${proto.toUpperCase()}</div>
        </div>

        <div class="bkcfg-body">
          <div class="bkcfg-section-label">LIVE SENSOR READINGS</div>
          <p class="bkcfg-desc">
            Pedal your bike to see live values. Select which channel should
            control your in-game speed. Your choice is saved automatically.
          </p>

          <div class="bkcfg-channels">

            <div class="bkcfg-channel ${autoSelected ? 'selected' : ''}" data-key="auto"
                 onclick="BikeConfig._selectSource('auto')">
              <div class="bkcfg-ch-left">
                <div class="bkcfg-ch-radio ${autoSelected ? 'active' : ''}"></div>
                <div class="bkcfg-ch-info">
                  <div class="bkcfg-ch-name">AUTO</div>
                  <div class="bkcfg-ch-hint">Use default channel for this protocol</div>
                </div>
              </div>
              <div class="bkcfg-ch-right">
                <div class="bkcfg-ch-val live" id="bkcfg-val-auto">${ble.rpm || '…'}</div>
                <div class="bkcfg-ch-unit">RPM</div>
              </div>
            </div>

            ${channelRows || '<div class="bkcfg-no-channels">No channels detected yet. Start pedalling.</div>'}

          </div>

          <div class="bkcfg-current-label">
            Active RPM: <span id="bkcfg-active-rpm" class="bkcfg-active-val">${ble.rpm || 0}</span>
            &nbsp;·&nbsp;
            Speed: <span id="bkcfg-active-kmh" class="bkcfg-active-val">${ble.kmh ? ble.kmh.toFixed(1) : '0'}</span> km/h
            &nbsp;·&nbsp;
            HR: <span id="bkcfg-active-hr" class="bkcfg-active-val">${ble.bpm || '—'}</span> bpm
          </div>
        </div>

        <div class="bkcfg-footer">
          <div class="bkcfg-saved-note" id="bkcfg-saved-note"></div>
          <button class="bkcfg-btn bkcfg-btn-primary" onclick="BikeConfig._saveAndClose()">
            ✔ SAVE &amp; CLOSE
          </button>
          <button class="bkcfg-btn bkcfg-btn-ghost" onclick="BikeConfig.close()">
            SKIP
          </button>
        </div>
      </div>`;
  },

  // ═════════════════════════════════════════════════════════════════
  // LIVE UPDATE — called every 200ms
  // ═════════════════════════════════════════════════════════════════
  _onData({ channels }) {
    this._lastData = channels;
  },

  _updateLive() {
    if (!this._visible) return;
    const ch  = Bluetooth.channels;
    const ble = Bluetooth.state;

    // Update each channel value element
    this.CHANNELS.forEach(c => {
      const el = document.getElementById('bkcfg-val-' + c.key);
      if (!el) return;
      const val = ch[c.key];
      if (val !== undefined && val !== null) {
        el.textContent = typeof val === 'number' ? val.toFixed(c.unit === 'RPM' ? 0 : 1) : val;
        el.classList.add('live');
        el.classList.remove('waiting');
      }
    });

    // Auto option shows current effective RPM
    const autoEl = document.getElementById('bkcfg-val-auto');
    if (autoEl) autoEl.textContent = ble.rpm || '…';

    // Bottom status bar
    const rpmEl = document.getElementById('bkcfg-active-rpm');
    const kmhEl = document.getElementById('bkcfg-active-kmh');
    const hrEl  = document.getElementById('bkcfg-active-hr');
    if (rpmEl) rpmEl.textContent = ble.rpm || 0;
    if (kmhEl) kmhEl.textContent = ble.kmh ? ble.kmh.toFixed(1) : '0';
    if (hrEl)  hrEl.textContent  = ble.bpm || '—';
  },

  // ═════════════════════════════════════════════════════════════════
  // INTERACTION
  // ═════════════════════════════════════════════════════════════════
  _selectSource(key) {
    // Update radio UI
    document.querySelectorAll('.bkcfg-channel').forEach(el => {
      const isThis = el.dataset.key === key;
      el.classList.toggle('selected', isThis);
      const radio = el.querySelector('.bkcfg-ch-radio');
      if (radio) radio.classList.toggle('active', isThis);
    });

    // Apply mapping immediately so user can feel it work
    Bluetooth.saveMapping({ rpmSource: key });

    const note = document.getElementById('bkcfg-saved-note');
    if (note) {
      note.textContent = '✓ Source set to: ' + (key === 'auto' ? 'AUTO' : key);
      note.style.color = '#4caf50';
    }
  },

  _saveAndClose() {
    const selected = document.querySelector('.bkcfg-channel.selected');
    if (selected) Bluetooth.saveMapping({ rpmSource: selected.dataset.key });
    Utils.toast('🚴 Bike mapping saved!', 'good', 2000);
    this.close();
  },

  _refresh() {
    const el = document.getElementById('bike-config-overlay');
    if (el) el.innerHTML = this._buildHTML();
  },
};
