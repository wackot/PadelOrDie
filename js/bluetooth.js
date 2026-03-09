// ═══════════════════════════════════════════════════════════════════
// PEDAL OR DIE — bluetooth.js  (v3)
//
// Protocols (tried in order): iConsole+ → FTMS → CSC  +  Heart Rate
//
// KEY RULES:
//  - optionalServices: SERVICE UUIDs only. Char UUIDs live in CHAR.*
//  - Never writes State directly — all output via Events bus
//  - Cadence bridge is ALWAYS-ON when BLE is connected, not just
//    inside the dynamo session (fixes "no RPM in game" bug)
//
// MAPPING CONFIG (saved in localStorage 'pod_ble_device'):
//  mapping.rpmSource — which channel drives Cadence:
//    'auto'            = use whatever the protocol naturally provides
//    'iconsole_rpm'    = iConsole byte[8]
//    'iconsole_speed'  = iConsole byte[6]/10 km/h → derived RPM
//    'ftms_cadence'    = FTMS 0x2AD2 cadence field
//    'ftms_speed'      = FTMS speed field → derived RPM
//    'csc'             = CSC crank revolution delta
//
// EVENTS EMITTED:
//   bike:pedal        { rpm, source }      — drives Cadence
//   bike:speed        { kmh, source }
//   bike:hr           { bpm }
//   bike:data         { channels }         — raw decoded values, every packet
//   bike:connected    { name, displayName, protocol }
//   bike:disconnected { name, reason }
//   bike:reconnecting { attempt, max }
//   bike:renamed      { displayName }
//   bike:error        { message }
// ════════════════════════════════════════════════════════════════════

const Bluetooth = {

  // ── SERVICE UUIDs — the ONLY kind valid in optionalServices ───────
  SVC: {
    ICONSOLE:  '0000fff0-0000-1000-8000-00805f9b34fb',
    ICONSOLE2: '0000ffe0-0000-1000-8000-00805f9b34fb',
    FTMS:      'fitness_machine',
    CSC:       'cycling_speed_and_cadence',
    HR:        'heart_rate',
    BATT:      'battery_service',
    DEVINFO:   'device_information',
    UART:      '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  },

  // ── CHARACTERISTIC UUIDs — NOT for optionalServices ──────────────
  CHAR: {
    ICO_NOTIFY:  '0000fff1-0000-1000-8000-00805f9b34fb',
    // ICO_WRITE: fff2 — not used (read-only mode)
    ICO2_NOTIFY: '0000ffe1-0000-1000-8000-00805f9b34fb',
    FTMS_DATA:   '00002ad2-0000-1000-8000-00805f9b34fb',
    FTMS_CTRL:   '00002ad9-0000-1000-8000-00805f9b34fb',
    CSC_MEAS:    '00002a5b-0000-1000-8000-00805f9b34fb',
    HR_MEAS:     '00002a37-0000-1000-8000-00805f9b34fb',
    // UART_TX: not used
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

  // ── Last decoded channels — used by BikeConfig panel ─────────────
  // Updated every packet regardless of mapping. Shape:
  //   { iconsole_rpm, iconsole_speed, iconsole_hr,
  //     ftms_cadence, ftms_speed, ftms_power, ftms_hr,
  //     csc_rpm, hr_bpm }
  channels: {},

  // ── Persisted: { id, name, displayName, protocol, mapping } ──────
  _saved:          null,

  // Default mapping — 'auto' = use whatever the protocol gives
  _defaultMapping: { rpmSource: 'auto' },

  _csc:            { lastRevs: null, lastTime: null },
  _retryCount:     0,
  _retryTimer:     null,
  _userDisconnect: false,
  _onGattDisconnected: null,

  // Always-on Cadence keepalive — runs even outside dynamo screen
  _cadenceTimer: null,

  // ═════════════════════════════════════════════════════════════════
  // INIT
  // ═════════════════════════════════════════════════════════════════
  init() {
    try {
      const raw = localStorage.getItem('pod_ble_device');
      if (raw) this._saved = JSON.parse(raw);
    } catch (_) {}
    if (this._saved) {
      console.log('[BLE] Saved device:', this._saved.displayName || this._saved.name,
        '| mapping:', JSON.stringify(this._saved.mapping || this._defaultMapping));
      this._trySilentReconnect();
    }
  },

  // ── Get current mapping (falls back to saved, then default) ──────
  getMapping() {
    return this._saved?.mapping || this._defaultMapping;
  },

  // ── Save mapping ──────────────────────────────────────────────────
  saveMapping(mapping) {
    if (!this._saved) return;
    this._saved.mapping = Object.assign({}, this._defaultMapping, mapping);
    this._persist();
    console.log('[BLE] Mapping saved:', this._saved.mapping);
  },

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC — connect
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
  // PUBLIC — disconnect (user-initiated, no retry)
  // ═════════════════════════════════════════════════════════════════
  disconnect() {
    this._userDisconnect = true;
    this._cancelRetry();
    this._stopCadenceKeepAlive();
    if (this.state.device?.gatt?.connected) this.state.device.gatt.disconnect();
    else this._onDisconnected('user');
  },

  rename(newName) {
    const name = (newName || '').trim();
    if (!name) return;
    this.state.displayName = name;
    if (this._saved) { this._saved.displayName = name; this._persist(); }
    Events.emit('bike:renamed', { displayName: name });
    Utils.toast('🚴 Bike renamed: "' + name + '"', 'good', 2000);
  },

  forget() {
    this.disconnect();
    this._saved = null;
    try { localStorage.removeItem('pod_ble_device'); } catch (_) {}
    Utils.toast('🔌 Saved bike forgotten.', 'info', 2000);
  },

  setEnabled(v) {
    this.state.enabled = v;
    if (!v && this.state.connected) this.disconnect();
    console.log('[BLE] Enabled:', v);
  },

  isAvailable() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
  },

  // ═════════════════════════════════════════════════════════════════
  // ALWAYS-ON CADENCE KEEPALIVE
  // When BLE is connected we keep Cadence running at all times so
  // bike:pedal events drive the game even outside the dynamo screen.
  // ═════════════════════════════════════════════════════════════════
  _startCadenceKeepAlive() {
    this._stopCadenceKeepAlive();
    // Ensure Cadence is started (idempotent — checking _active)
    if (typeof Cadence !== 'undefined' && !Cadence._active) {
      Cadence.start();
    }
    // Every 2s, if Cadence stopped externally (e.g. dynamo stopSession),
    // restart it so BLE data keeps flowing into the window
    this._cadenceTimer = setInterval(() => {
      if (!this.state.connected) { this._stopCadenceKeepAlive(); return; }
      if (typeof Cadence !== 'undefined' && !Cadence._active) {
        Cadence.start();
      }
    }, 2000);
    console.log('[BLE] Cadence keepalive started');
  },

  _stopCadenceKeepAlive() {
    if (this._cadenceTimer) { clearInterval(this._cadenceTimer); this._cadenceTimer = null; }
    // Don't stop Cadence here — dynamo session manages that
    console.log('[BLE] Cadence keepalive stopped');
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
    this.channels        = {};

    this._subscribeHR(server, log).catch(() => {});
    this._startCadenceKeepAlive();

    this._saved = {
      id:          device.id,
      name:        device.name || '',
      displayName: this.state.displayName,
      protocol:    proto,
      mapping:     this._saved?.id === device.id
                     ? (this._saved.mapping || this._defaultMapping)
                     : this._defaultMapping,
    };
    this._persist();

    log('Connected! Protocol: ' + proto.toUpperCase(), 'ok');
    Events.emit('bike:connected', {
      name:        this.state.deviceName,
      displayName: this.state.displayName,
      protocol:    proto,
      // flag: does this device already have a saved mapping?
      hasMapping:  !!(this._saved.mapping && this._saved.mapping.rpmSource !== 'auto'),
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
  // iCONSOLE+ PARSER
  // 16-byte packet: [0]=0xF0 [1]=0xD1 [6]=speed/10 [8]=RPM [14]=HR
  // [15] = XOR checksum of bytes 1..14
  // ═════════════════════════════════════════════════════════════════
  async _subscribeIConsole(svc, log) {
    // READ-ONLY mode — we never write to the bike.
    // Just subscribe to the notify characteristic and parse whatever arrives.
    // This avoids taking over the bike's screen or interrupting its session.
    let notifyChar = null;
    for (const uuid of [this.CHAR.ICO_NOTIFY, this.CHAR.ICO2_NOTIFY]) {
      try { notifyChar = await svc.getCharacteristic(uuid); break; } catch (_) {}
    }
    if (!notifyChar) throw new Error('iConsole notify char not found');
    await notifyChar.startNotifications();
    notifyChar.addEventListener('characteristicvaluechanged', e => this._parseIConsole(e.target.value));
    log('iConsole: subscribed (read-only, no writes).', 'info');
  },

  _parseIConsole(dv) {
    if (!this.state.enabled) return;
    const len = dv.byteLength;
    if (len < 4) return;
    if (dv.getUint8(0) !== 0xF0) return;

    const type = dv.getUint8(1);

    // 0xD1 — main workout data, 16 bytes, XOR checksum
    // [0]=0xF0 [1]=0xD1 [6]=speed×10 [8]=RPM [9]=level
    // [10-11]=dist [12-13]=cal [14]=HR [15]=checksum
    if (type === 0xD1 && len >= 16) {
      let xor = 0;
      for (let i = 1; i < 15; i++) xor ^= dv.getUint8(i);
      if (xor !== dv.getUint8(15)) return; // bad checksum, skip
      this._applyIConsoleData(
        dv.getUint8(8),         // RPM
        dv.getUint8(6) / 10,   // km/h
        dv.getUint8(14),        // HR
        dv.getUint8(9),         // resistance level
        dv.getUint16(10, true), // distance m
        dv.getUint16(12, true)  // calories
      );
      return;
    }

    // 0xE0 / 0xE1 — OEM variant, same byte layout, no checksum field
    if ((type === 0xE0 || type === 0xE1) && len >= 9) {
      const rpm = dv.getUint8(8);
      const kmh = dv.getUint8(6) / 10;
      if (rpm > 0 || kmh > 0) {
        this._applyIConsoleData(
          rpm, kmh,
          len >= 15 ? dv.getUint8(14) : 0,
          len >= 10 ? dv.getUint8(9) : 0,
          len >= 12 ? dv.getUint16(10, true) : 0,
          len >= 14 ? dv.getUint16(12, true) : 0
        );
      }
      return;
    }

    // 0xA0 — bike status / idle broadcast. No data to extract.
    // Just emit bike:data so BikeConfig panel stays updated.
    if (type === 0xA0) {
      this.channels.iconsole_rpm   = 0;
      this.channels.iconsole_speed = 0;
      Events.emit('bike:data', { channels: Object.assign({}, this.channels) });
      return;
    }

    // Any other type — log raw hex once for diagnostics
    if (!this._unknownTypes) this._unknownTypes = {};
    if (!this._unknownTypes[type]) {
      this._unknownTypes[type] = true;
      const hex = Array.from(new Uint8Array(dv.buffer))
        .map(b => b.toString(16).padStart(2,'0').toUpperCase()).join(' ');
      console.log('[BLE] iConsole type=0x' + type.toString(16).toUpperCase()
        + ' len=' + len + ' | ' + hex);
    }
  },

  // Shared data application for all iConsole packet types
  _applyIConsoleData(rpm, kmh, hr, level, dist, cal) {
    this.channels.iconsole_rpm   = rpm;
    this.channels.iconsole_speed = kmh;
    this.channels.iconsole_hr    = hr;
    this.channels.iconsole_level = level;
    this.channels.iconsole_dist  = dist;
    this.channels.iconsole_cal   = cal;

    this.state.kmh = kmh;
    if (hr > 0) this.state.bpm = hr;

    Events.emit('bike:data', { channels: Object.assign({}, this.channels) });
    if (hr > 30 && hr < 250) Events.emit('bike:hr', { bpm: hr });
    if (kmh > 0) Events.emit('bike:speed', { kmh, source: 'iconsole' });

    const src = this.getMapping().rpmSource;
    const effectiveRpm = (src === 'iconsole_speed')
      ? Math.round(kmh * 3)
      : rpm;

    this.state.rpm = effectiveRpm;
    if (effectiveRpm > 0) Events.emit('bike:pedal', { rpm: effectiveRpm, source: 'iconsole' });
  },

  // ═════════════════════════════════════════════════════════════════
  // FTMS PARSER — variable-length, flag-driven
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
    let off = 2;
    let kmh = 0, rpm = 0, power = 0, hr = 0;

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

    this.channels.ftms_cadence = rpm;
    this.channels.ftms_speed   = kmh;
    this.channels.ftms_power   = power;
    this.channels.ftms_hr      = hr;

    this.state.power = power;
    if (kmh > 0) this.state.kmh = kmh;
    if (hr > 30 && hr < 250) this.state.bpm = hr;

    Events.emit('bike:data', { channels: Object.assign({}, this.channels) });
    if (kmh > 0) Events.emit('bike:speed', { kmh, source: 'ftms' });
    if (hr > 30 && hr < 250) Events.emit('bike:hr', { bpm: hr });

    const src = this.getMapping().rpmSource;
    let effectiveRpm = 0;
    if (src === 'ftms_speed') {
      effectiveRpm = Math.round(kmh * 3);
    } else {
      effectiveRpm = rpm; // 'auto' or 'ftms_cadence'
    }

    this.state.rpm = effectiveRpm;
    if (effectiveRpm > 0) Events.emit('bike:pedal', { rpm: effectiveRpm, source: 'ftms' });
  },

  // ═════════════════════════════════════════════════════════════════
  // CSC PARSER
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

    this.channels.csc_rpm = rpm;
    this.state.rpm = rpm;

    Events.emit('bike:data', { channels: Object.assign({}, this.channels) });
    Events.emit('bike:pedal', { rpm, source: 'csc' });
  },

  // ═════════════════════════════════════════════════════════════════
  // HEART RATE
  // ═════════════════════════════════════════════════════════════════
  async _subscribeHR(server, log) {
    const svc  = await server.getPrimaryService(this.SVC.HR);
    const char = await svc.getCharacteristic(this.CHAR.HR_MEAS);
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', e => {
      const dv  = e.target.value;
      const bpm = (dv.getUint8(0) & 0x01) ? dv.getUint16(1, true) : dv.getUint8(1);
      if (bpm > 30 && bpm < 250) {
        this.state.bpm = bpm;
        this.channels.hr_bpm = bpm;
        Events.emit('bike:hr', { bpm });
      }
    });
  },

  // ═════════════════════════════════════════════════════════════════
  // DISCONNECT + AUTO-RECONNECT
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
      this._stopCadenceKeepAlive();
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
      this._stopCadenceKeepAlive();
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
          this._startCadenceKeepAlive();
          const name = this.state.displayName || this.state.deviceName;
          Utils.toast('🚴 ' + name + ' reconnected!', 'good', 4000);
          Events.emit('bike:connected', {
            name:        this.state.deviceName,
            displayName: this.state.displayName,
            protocol:    proto,
            hasMapping:  !!(this._saved?.mapping?.rpmSource && this._saved.mapping.rpmSource !== 'auto'),
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
    this.channels = {};
  },
};

// ═══════════════════════════════════════════════════════════════════
// CADENCE BRIDGE — bike:pedal → Cadence CPM (direct injection)
//
// WHY direct injection instead of click simulation:
//   CSC sensors (Magene S3) fire once per crank revolution (~1s at 60rpm).
//   Simulating that as a single click in a 5s rolling window gives noisy
//   CPM that spikes and drops with each packet. Instead we directly write
//   the smoothed RPM as CPM into State and reset the hold timer.
//
// HOW it works:
//   - Each bike:pedal event writes rpm→CPM into State immediately
//   - A 3-second hold timer keeps CPM stable between slow CSC packets
//   - After 3s with no new pedal event, CPM decays naturally via cadence.js
// ═══════════════════════════════════════════════════════════════════

(function() {
  const ALPHA   = 0.35;   // EMA weight — lower = smoother but slower to respond
  const HOLD_MS = 2500;   // hold last reading this long before zeroing (CSC ~1 packet/sec)
  let smoothRpm = 0;
  let holdTimer = null;

  function zeroOut() {
    holdTimer  = null;
    smoothRpm  = 0;
    // Directly zero State — this is what cadence.js reads everywhere
    if (typeof State !== 'undefined' && State.data?.cadence) {
      State.data.cadence.clicksPerMinute = 0;
    }
    // Clear the click window too so natural decay also sees 0
    if (typeof Cadence !== 'undefined' && Cadence._clickTimes) {
      Cadence._clickTimes = [];
    }
    if (typeof Cadence !== 'undefined' && Cadence._updateUI) {
      Cadence._updateUI();
    }
  }

  Events.on('bike:pedal', ({ rpm }) => {
    if (typeof Cadence === 'undefined') return;
    if (!Bluetooth.state.enabled) return;
    if (!Cadence._active) Cadence.start();

    // EMA smoothing — softens single-packet jitter from CSC sensors
    smoothRpm = smoothRpm === 0
      ? rpm
      : Math.round(ALPHA * rpm + (1 - ALPHA) * smoothRpm);

    // Write directly into State (bypasses 5s click window)
    State.data.cadence.clicksPerMinute = smoothRpm;
    if (Cadence._updateUI) Cadence._updateUI();

    // Restart the hold timer — when it fires, zero everything
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = setTimeout(zeroOut, HOLD_MS);
  });

  // Also zero out when bike disconnects
  Events.on('bike:disconnected', () => {
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    zeroOut();
  });
})();
