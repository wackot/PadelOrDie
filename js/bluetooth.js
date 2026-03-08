// ═══════════════════════════════════════════════════════════════════
// PEDAL OR DIE — bluetooth.js  (v2 — verified against hardware)
//
// Supports three protocols, tried in order on every connect:
//   1. iConsole+ / Abilica  (fff0 service, fff1 notify char)
//   2. FTMS Indoor Bike     (fitness_machine service, 0x2AD2 char)
//   3. CSC Cadence          (cycling_speed_and_cadence, 0x2A5B char)
//   + Heart Rate            (heart_rate service, passive add-on)
//
// KEY RULE: optionalServices must contain SERVICE UUIDs only.
//   Characteristic UUIDs live in CHAR.* and are used only in
//   getCharacteristic() calls — never in optionalServices.
//
// OUTPUT — never writes State directly, always via Events bus:
//   Events.emit('bike:pedal',       { rpm, source })
//   Events.emit('bike:speed',       { kmh, source })
//   Events.emit('bike:hr',          { bpm })
//   Events.emit('bike:connected',   { name, displayName, protocol })
//   Events.emit('bike:disconnected',{ name, reason })
//   Events.emit('bike:reconnecting',{ attempt, max })
//   Events.emit('bike:renamed',     { displayName })
//   Events.emit('bike:error',       { message })
//
// SAVED CONNECTION — device id + user display name persisted in
//   localStorage 'pod_ble_device'. On init, tries silent reconnect
//   via navigator.bluetooth.getDevices() without showing the picker.
//
// AUTO-RECONNECT — on unexpected disconnect retries up to MAX_RETRIES
//   times with RETRY_INTERVAL_MS gaps. User disconnect skips retry.
// ════════════════════════════════════════════════════════════════════

const Bluetooth = {

  // ── SERVICE UUIDs — the ONLY kind valid in optionalServices ───────
  SVC: {
    ICONSOLE:  '0000fff0-0000-1000-8000-00805f9b34fb',  // iConsole+ / Abilica
    ICONSOLE2: '0000ffe0-0000-1000-8000-00805f9b34fb',  // iConsole variant-B
    FTMS:      'fitness_machine',                        // 0x1826
    CSC:       'cycling_speed_and_cadence',              // 0x1816
    HR:        'heart_rate',                             // 0x180D
    BATT:      'battery_service',                        // 0x180F
    DEVINFO:   'device_information',                     // 0x180A
    UART:      '6e400001-b5a3-f393-e0a9-e50e24dcca9e',  // Nordic UART
  },

  // ── CHARACTERISTIC UUIDs — NOT for optionalServices ──────────────
  CHAR: {
    ICO_NOTIFY:   '0000fff1-0000-1000-8000-00805f9b34fb',
    ICO_WRITE:    '0000fff2-0000-1000-8000-00805f9b34fb',
    ICO2_NOTIFY:  '0000ffe1-0000-1000-8000-00805f9b34fb',
    FTMS_DATA:    '00002ad2-0000-1000-8000-00805f9b34fb',
    FTMS_CTRL:    '00002ad9-0000-1000-8000-00805f9b34fb',
    CSC_MEAS:     '00002a5b-0000-1000-8000-00805f9b34fb',
    HR_MEAS:      '00002a37-0000-1000-8000-00805f9b34fb',
    UART_TX:      '6e400003-b5a3-f393-e0a9-e50e24dcca9e',
  },

  MAX_RETRIES:       5,
  RETRY_INTERVAL_MS: 5000,

  // ── Live state ────────────────────────────────────────────────────
  state: {
    device:      null,
    server:      null,
    protocol:    null,
    connected:   false,
    enabled:     true,
    deviceName:  '',
    displayName: '',
    rpm:   0,
    kmh:   0,
    bpm:   0,
    power: 0,
  },

  _saved:          null,   // persisted: { id, name, displayName, protocol }
  _csc:            { lastRevs: null, lastTime: null },
  _retryCount:     0,
  _retryTimer:     null,
  _userDisconnect: false,
  _onGattDisconnected: null,

  // ═════════════════════════════════════════════════════════════════
  // INIT — called from main.js after DOM ready
  // ═════════════════════════════════════════════════════════════════
  init() {
    try {
      const raw = localStorage.getItem('pod_ble_device');
      if (raw) this._saved = JSON.parse(raw);
    } catch (_) {}
    if (this._saved) {
      console.log('[BLE] Saved device:', this._saved.displayName || this._saved.name);
      this._trySilentReconnect();
    }
  },

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC — show picker and connect
  // ═════════════════════════════════════════════════════════════════
  async connect(logFn) {
    const log = logFn || (() => {});
    if (!navigator.bluetooth) {
      const msg = 'Web Bluetooth not available. Use Chrome or Edge on desktop.';
      log(msg, 'error');
      Events.emit('bike:error', { message: msg });
      return false;
    }
    if (!this.state.enabled) { log('Disabled by Dev Mode.', 'warn'); return false; }
    if (this.state.connected) { log('Already connected.', 'warn'); return false; }

    this._cancelRetry();
    this._userDisconnect = false;
    log('Opening Bluetooth scanner…', 'info');

    let device;
    try {
      device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        // SERVICE UUIDs only — Chrome rejects characteristic aliases here
        optionalServices: [
          this.SVC.ICONSOLE, this.SVC.ICONSOLE2,
          this.SVC.FTMS, this.SVC.CSC, this.SVC.HR,
          this.SVC.BATT, this.SVC.DEVINFO, this.SVC.UART,
          0x1816, 0x1826, 0x180D, 0x180F, 0x180A,
          0xFFF0, 0xFFE0,
        ],
      });
    } catch (err) {
      if (err.name === 'NotFoundError') log('No device selected.', 'warn');
      else { log('Scan error: ' + err.message, 'error'); Events.emit('bike:error', { message: err.message }); }
      return false;
    }

    return this._doConnect(device, log);
  },

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC — user-initiated disconnect (no retry)
  // ═════════════════════════════════════════════════════════════════
  disconnect() {
    this._userDisconnect = true;
    this._cancelRetry();
    if (this.state.device?.gatt?.connected) this.state.device.gatt.disconnect();
    else this._onDisconnected('user');
  },

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC — rename the connected device
  // ═════════════════════════════════════════════════════════════════
  rename(newName) {
    const name = (newName || '').trim();
    if (!name) return;
    this.state.displayName = name;
    if (this._saved) { this._saved.displayName = name; this._persist(); }
    Events.emit('bike:renamed', { displayName: name });
    Utils.toast('🚴 Bike renamed: "' + name + '"', 'good', 2000);
  },

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC — forget saved device record
  // ═════════════════════════════════════════════════════════════════
  forget() {
    this.disconnect();
    this._saved = null;
    try { localStorage.removeItem('pod_ble_device'); } catch (_) {}
    Utils.toast('🔌 Saved bike forgotten.', 'info', 2000);
  },

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC — Dev Mode enable/disable
  // ═════════════════════════════════════════════════════════════════
  setEnabled(v) {
    this.state.enabled = v;
    if (!v && this.state.connected) this.disconnect();
    console.log('[BLE] Enabled:', v);
  },

  isAvailable() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
  },

  // ═════════════════════════════════════════════════════════════════
  // CORE GATT CONNECT
  // ═════════════════════════════════════════════════════════════════
  async _doConnect(device, log = () => {}) {
    this.state.device     = device;
    this.state.deviceName = device.name || 'Unknown device';
    this.state.displayName = (this._saved?.id === device.id && this._saved?.displayName)
      ? this._saved.displayName
      : (device.name || 'Unknown device');

    log('Found: "' + this.state.deviceName + '". Connecting GATT…', 'info');

    // Bind disconnect listener (remove previous to avoid duplicates)
    if (this._onGattDisconnected) {
      device.removeEventListener('gattserverdisconnected', this._onGattDisconnected);
    }
    this._onGattDisconnected = () => this._onDisconnected('signal');
    device.addEventListener('gattserverdisconnected', this._onGattDisconnected);

    let server;
    try {
      server = await device.gatt.connect();
    } catch (err) {
      log('GATT connect failed: ' + err.message, 'error');
      Events.emit('bike:error', { message: err.message });
      this._scheduleRetry(device, log);
      return false;
    }

    this.state.server = server;
    log('GATT connected. Detecting protocol…', 'info');

    const proto = await this._detectProtocol(server, log);
    if (!proto) {
      log('No recognised bike service on this device.', 'error');
      Events.emit('bike:error', { message: 'No supported service found.' });
      device.gatt.disconnect();
      return false;
    }

    this.state.protocol  = proto;
    this.state.connected = true;
    this._retryCount     = 0;

    this._subscribeHR(server, log).catch(() => {});

    this._saved = {
      id:          device.id,
      name:        device.name || '',
      displayName: this.state.displayName,
      protocol:    proto,
    };
    this._persist();

    log('Connected! Protocol: ' + proto.toUpperCase(), 'ok');
    Events.emit('bike:connected', {
      name:        this.state.deviceName,
      displayName: this.state.displayName,
      protocol:    proto,
    });
    Utils.toast('🚴 ' + this.state.displayName + ' connected (' + proto.toUpperCase() + ')', 'good', 4000);
    return true;
  },

  // ═════════════════════════════════════════════════════════════════
  // PROTOCOL DETECTION
  // ═════════════════════════════════════════════════════════════════
  async _detectProtocol(server, log) {
    for (const svcUUID of [this.SVC.ICONSOLE, this.SVC.ICONSOLE2]) {
      try {
        const svc = await server.getPrimaryService(svcUUID);
        log('iConsole+ service found. Subscribing…', 'info');
        await this._subscribeIConsole(svc, log);
        return 'iconsole';
      } catch (_) {}
    }
    try {
      const svc = await server.getPrimaryService(this.SVC.FTMS);
      log('FTMS service found. Subscribing…', 'info');
      await this._subscribeFTMS(svc, log);
      return 'ftms';
    } catch (_) {}
    try {
      const svc = await server.getPrimaryService(this.SVC.CSC);
      log('CSC service found. Subscribing…', 'info');
      await this._subscribeCSC(svc, log);
      return 'csc';
    } catch (_) {}
    return null;
  },

  // ═════════════════════════════════════════════════════════════════
  // iCONSOLE+ — 16-byte packet, header 0xF0, type 0xD1, XOR checksum
  //   [6] speed ÷10 = km/h  [8] RPM  [14] HR  [15] checksum
  // ═════════════════════════════════════════════════════════════════
  async _subscribeIConsole(svc, log) {
    let notifyChar = null;
    for (const uuid of [this.CHAR.ICO_NOTIFY, this.CHAR.ICO2_NOTIFY]) {
      try { notifyChar = await svc.getCharacteristic(uuid); break; } catch (_) {}
    }
    if (!notifyChar) throw new Error('iConsole notify char not found');
    await notifyChar.startNotifications();
    notifyChar.addEventListener('characteristicvaluechanged', e => this._parseIConsole(e.target.value));
    try {
      const w = await svc.getCharacteristic(this.CHAR.ICO_WRITE);
      await w.writeValue(new Uint8Array([0xF0, 0xA0, 0x01, 0x01, 0x92]));
      log('iConsole start command sent.', 'info');
    } catch (_) {}
  },

  _parseIConsole(dv) {
    if (!this.state.enabled || dv.byteLength < 16) return;
    if (dv.getUint8(0) !== 0xF0) return;
    let xor = 0;
    for (let i = 1; i < 15; i++) xor ^= dv.getUint8(i);
    if (xor !== dv.getUint8(15) || dv.getUint8(1) !== 0xD1) return;
    const rpm = dv.getUint8(8);
    const kmh = dv.getUint8(6) / 10;
    const hr  = dv.getUint8(14);
    this.state.rpm = rpm; this.state.kmh = kmh;
    if (hr > 0) this.state.bpm = hr;
    if (rpm > 0) Events.emit('bike:pedal', { rpm, source: 'iconsole' });
    if (kmh > 0) Events.emit('bike:speed', { kmh, source: 'iconsole' });
    if (hr > 30 && hr < 250) Events.emit('bike:hr', { bpm: hr });
  },

  // ═════════════════════════════════════════════════════════════════
  // FTMS — Indoor Bike Data 0x2AD2, flag-driven variable-length
  // ═════════════════════════════════════════════════════════════════
  async _subscribeFTMS(svc, log) {
    const char = await svc.getCharacteristic(this.CHAR.FTMS_DATA);
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', e => this._parseFTMS(e.target.value));
    try {
      const ctrl = await svc.getCharacteristic(this.CHAR.FTMS_CTRL);
      await ctrl.writeValue(new Uint8Array([0x00]));
    } catch (_) {}
  },

  _parseFTMS(dv) {
    if (!this.state.enabled || dv.byteLength < 2) return;
    const flags = dv.getUint16(0, true);
    let off = 2, rpm = 0, kmh = 0, power = 0, hr = 0;
    if (!(flags & 0x0001) && dv.byteLength >= off+2) { kmh   = dv.getUint16(off, true) / 100; off += 2; }
    if (flags & 0x0002) off += 2;
    if ((flags & 0x0004) && dv.byteLength >= off+2)  { rpm   = dv.getUint16(off, true) / 2;   off += 2; }
    if (flags & 0x0008) off += 2;
    if (flags & 0x0010) off += 3;
    if (flags & 0x0020) off += 2;
    if ((flags & 0x0040) && dv.byteLength >= off+2)  { power = dv.getInt16(off, true);         off += 2; }
    if (flags & 0x0080) off += 2;
    if (flags & 0x0100) off += 5;
    if ((flags & 0x0200) && dv.byteLength >= off+1)  { hr    = dv.getUint8(off);               off += 1; }
    if (rpm > 0)   { this.state.rpm = rpm;   Events.emit('bike:pedal', { rpm, source: 'ftms' }); }
    if (kmh > 0)   { this.state.kmh = kmh;   Events.emit('bike:speed', { kmh, source: 'ftms' }); }
    if (power)     { this.state.power = power; }
    if (hr > 30 && hr < 250) { this.state.bpm = hr; Events.emit('bike:hr', { bpm: hr }); }
  },

  // ═════════════════════════════════════════════════════════════════
  // CSC — delta crank revs / delta event time → RPM
  // ═════════════════════════════════════════════════════════════════
  async _subscribeCSC(svc, log) {
    const char = await svc.getCharacteristic(this.CHAR.CSC_MEAS);
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', e => this._parseCSC(e.target.value));
  },

  _parseCSC(dv) {
    if (!this.state.enabled) return;
    const flags = dv.getUint8(0);
    if (!(flags & 0x02)) return;
    const off = (flags & 0x01) ? 5 : 1;
    if (dv.byteLength < off + 4) return;
    const revs = dv.getUint16(off, true);
    const time = dv.getUint16(off + 2, true);
    const p = this._csc;
    if (p.lastRevs === null) { p.lastRevs = revs; p.lastTime = time; return; }
    const dR = (revs - p.lastRevs + 65536) % 65536;
    const dT = (time - p.lastTime + 65536) % 65536;
    p.lastRevs = revs; p.lastTime = time;
    if (!dT || !dR) return;
    const rpm = Math.round((dR / (dT / 1024)) * 60);
    if (rpm < 5 || rpm > 300) return;
    this.state.rpm = rpm;
    Events.emit('bike:pedal', { rpm, source: 'csc' });
  },

  // ═════════════════════════════════════════════════════════════════
  // HEART RATE — supplementary, non-fatal if absent
  // ═════════════════════════════════════════════════════════════════
  async _subscribeHR(server, log) {
    const svc  = await server.getPrimaryService(this.SVC.HR);
    const char = await svc.getCharacteristic(this.CHAR.HR_MEAS);
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', e => {
      const dv  = e.target.value;
      const bpm = (dv.getUint8(0) & 0x01) ? dv.getUint16(1, true) : dv.getUint8(1);
      if (bpm > 30 && bpm < 250) { this.state.bpm = bpm; Events.emit('bike:hr', { bpm }); }
    });
  },

  // ═════════════════════════════════════════════════════════════════
  // DISCONNECT + AUTO-RECONNECT (5 attempts × 5s)
  // ═════════════════════════════════════════════════════════════════
  _onDisconnected(reason) {
    const wasConnected   = this.state.connected;
    const name           = this.state.displayName || this.state.deviceName;
    this.state.connected = false;
    this.state.server    = null;
    this.state.rpm = 0; this.state.kmh = 0;

    Events.emit('bike:disconnected', { name, reason });
    if (!wasConnected) return;

    if (this._userDisconnect) {
      this._reset();
      Utils.toast('🔌 ' + name + ' disconnected.', 'info', 3000);
      return;
    }

    Utils.toast('📡 ' + name + ' lost. Reconnecting…', 'warn', 3000);
    this._scheduleRetry(this.state.device);
  },

  _scheduleRetry(device) {
    if (!device) return;
    if (this._retryCount >= this.MAX_RETRIES) {
      Utils.toast('📡 Could not reconnect after ' + this.MAX_RETRIES + ' attempts.', 'bad', 5000);
      Events.emit('bike:error', { message: 'Reconnect failed after max retries.' });
      this._reset();
      return;
    }
    this._retryCount++;
    const attempt = this._retryCount;
    const max     = this.MAX_RETRIES;
    Events.emit('bike:reconnecting', { attempt, max });
    Utils.toast('📡 Reconnect ' + attempt + '/' + max + '…', 'info', 4000);
    console.log('[BLE] Retry ' + attempt + '/' + max + ' in 5s…');

    this._retryTimer = setTimeout(async () => {
      if (!this.state.enabled || this._userDisconnect) return;
      try {
        const server = await device.gatt.connect();
        this.state.server = server;
        const proto = await this._detectProtocol(server, () => {});
        if (proto) {
          this.state.protocol  = proto;
          this.state.connected = true;
          this._retryCount     = 0;
          this._subscribeHR(server, null).catch(() => {});
          const name = this.state.displayName || this.state.deviceName;
          Utils.toast('🚴 ' + name + ' reconnected!', 'good', 4000);
          Events.emit('bike:connected', {
            name:        this.state.deviceName,
            displayName: this.state.displayName,
            protocol:    proto,
          });
        } else {
          this._scheduleRetry(device);
        }
      } catch (err) {
        console.warn('[BLE] Retry ' + attempt + ' failed:', err.message);
        this._scheduleRetry(device);
      }
    }, this.RETRY_INTERVAL_MS);
  },

  _cancelRetry() {
    if (this._retryTimer) { clearTimeout(this._retryTimer); this._retryTimer = null; }
    this._retryCount = 0;
  },

  // ─── Silent reconnect on page load (no picker) ───────────────────
  async _trySilentReconnect() {
    if (!navigator.bluetooth.getDevices) return;
    try {
      const devices = await navigator.bluetooth.getDevices();
      const saved   = devices.find(d => d.id === this._saved?.id);
      if (!saved) return;
      console.log('[BLE] Silent reconnect to: ' + (saved.name || saved.id));
      await this._doConnect(saved);
    } catch (err) {
      console.log('[BLE] Silent reconnect skipped:', err.message);
    }
  },

  _persist() {
    try { localStorage.setItem('pod_ble_device', JSON.stringify(this._saved)); } catch (_) {}
  },

  _reset() {
    this.state.device = null; this.state.server = null;
    this.state.protocol = null; this.state.connected = false;
    this.state.deviceName = ''; this.state.displayName = '';
    this.state.rpm = 0; this.state.kmh = 0; this.state.bpm = 0; this.state.power = 0;
    this._csc.lastRevs = null; this._csc.lastTime = null;
    this._userDisconnect = false;
  },
};

// ═══════════════════════════════════════════════════════════════════
// CADENCE BRIDGE — RPM → Cadence rolling window
// The only place where BLE RPM is translated to cadence engine input.
// cadence.js itself is unchanged.
// ═══════════════════════════════════════════════════════════════════
Events.on('bike:pedal', ({ rpm }) => {
  if (typeof Cadence === 'undefined' || !Cadence._active) return;
  if (!Bluetooth.state.enabled) return;
  const revsPerSec = Math.max(1, Math.round(rpm / 60));
  const now = Date.now();
  for (let i = 0; i < revsPerSec; i++) {
    Cadence._clickTimes.push(now - Math.round((revsPerSec - i) * (1000 / revsPerSec)));
  }
  Cadence._recalcCPM();
});
