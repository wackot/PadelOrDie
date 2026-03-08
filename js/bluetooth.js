// ═══════════════════════════════════════════════════════════════════
// PEDAL OR DIE — bluetooth.js
//
// Bluetooth bike sensor module.
// Supports three hardware protocols in priority order:
//
//  1. iConsole+ / Abilica proprietary
//     Service:  0000fff0-0000-1000-8000-00805f9b34fb
//     Notify:   0000fff1-0000-1000-8000-00805f9b34fb
//     Write:    0000fff2-0000-1000-8000-00805f9b34fb
//
//  2. FTMS — Fitness Machine Service (standard BLE)
//     Service:  fitness_machine  (0x1826)
//     Notify:   indoor_bike_data (0x2AD2)
//
//  3. CSC — Cycling Speed & Cadence (legacy standard)
//     Service:  cycling_speed_and_cadence (0x1816)
//     Notify:   csc_measurement           (0x2A5B)
//
//  4. Heart Rate (passive, alongside any of the above)
//     Service:  heart_rate          (0x180D)
//     Notify:   heart_rate_measurement (0x2A37)
//
// ── OUTPUT ──────────────────────────────────────────────────────────
//  This module NEVER writes to State directly.
//  All data is dispatched via the Events bus:
//    Events.emit('bike:pedal', { rpm, source })
//    Events.emit('bike:speed', { kmh, source })
//    Events.emit('bike:hr',    { bpm })
//    Events.emit('bike:connected',    { name, protocol })
//    Events.emit('bike:disconnected', { name })
//    Events.emit('bike:error',        { message })
//
// cadence.js subscribes to 'bike:pedal' and feeds rpm into its
// rolling window without any changes to its existing click-based logic.
// ════════════════════════════════════════════════════════════════════

const Bluetooth = {

  // ── UUIDs ─────────────────────────────────────────────────────────
  UUID: {
    // iConsole+ / Abilica proprietary
    ICONSOLE_SVC:    '0000fff0-0000-1000-8000-00805f9b34fb',
    ICONSOLE_NOTIFY: '0000fff1-0000-1000-8000-00805f9b34fb',
    ICONSOLE_WRITE:  '0000fff2-0000-1000-8000-00805f9b34fb',
    ICONSOLE_CMD_START: new Uint8Array([0xF0, 0xA0, 0x01, 0x01, 0x92]), // start data stream

    // FTMS (standard Fitness Machine Service)
    FTMS_SVC:        'fitness_machine',          // 0x1826
    FTMS_FEATURE:    'fitness_machine_feature',  // 0x2ACC
    FTMS_BIKE_DATA:  'indoor_bike_data',         // 0x2AD2
    FTMS_CONTROL:    'fitness_machine_control_point', // 0x2AD9

    // CSC (legacy standard)
    CSC_SVC:         'cycling_speed_and_cadence', // 0x1816
    CSC_MEASUREMENT: 'csc_measurement',           // 0x2A5B

    // Heart rate
    HR_SVC:          'heart_rate',               // 0x180D
    HR_MEASUREMENT:  'heart_rate_measurement',   // 0x2A37
  },

  // ── Connection state ──────────────────────────────────────────────
  state: {
    device:      null,
    server:      null,
    protocol:    null,    // 'iconsole' | 'ftms' | 'csc' | null
    connected:   false,
    enabled:     true,    // false = disabled by dev mode
    deviceName:  '',

    // Live readings (updated each packet)
    rpm:    0,
    kmh:    0,
    bpm:    0,
    power:  0,
  },

  // ── CSC rolling-window state ──────────────────────────────────────
  _csc: { lastRevs: null, lastTime: null },

  // ── iConsole rolling data state ───────────────────────────────────
  _ico: { lastRpm: 0, _writeChar: null },

  // ═════════════════════════════════════════════════════════════════
  // PUBLIC API
  // ═════════════════════════════════════════════════════════════════

  // ── Check Web Bluetooth availability ─────────────────────────────
  isAvailable() {
    return typeof navigator !== 'undefined' && !!navigator.bluetooth;
  },

  // ── Main connect entry point ──────────────────────────────────────
  // Hybrid scan: shows all BLE devices, attempts each known service in turn.
  async connect(logFn) {
    const log = logFn || (() => {});

    if (!this.isAvailable()) {
      const msg = 'Web Bluetooth not available. Use Chrome or Edge on desktop.';
      log(msg, 'error');
      Events.emit('bike:error', { message: msg });
      return false;
    }
    if (!this.state.enabled) {
      log('Sensor input is disabled by Dev Mode.', 'warn');
      return false;
    }
    if (this.state.connected) {
      log('Already connected. Disconnect first.', 'warn');
      return false;
    }

    log('Opening Bluetooth scanner…', 'info');

    let device;
    try {
      device = await navigator.bluetooth.requestDevice({
        // acceptAllDevices lets the user pick ANY nearby device.
        // optionalServices lists every service we might need — without this
        // Chrome blocks access to the service even after pairing.
        acceptAllDevices: true,
        optionalServices: [
          // iConsole / Abilica proprietary
          this.UUID.ICONSOLE_SVC,
          // Standard FTMS
          'fitness_machine',
          0x1826,
          // CSC
          'cycling_speed_and_cadence',
          0x1816,
          // Heart rate (bonus)
          'heart_rate',
          0x180D,
        ],
      });
    } catch (err) {
      if (err.name === 'NotFoundError') {
        log('No device selected.', 'warn');
      } else {
        log(`Scan error: ${err.message}`, 'error');
        Events.emit('bike:error', { message: err.message });
      }
      return false;
    }

    this.state.device     = device;
    this.state.deviceName = device.name || 'Unknown device';
    log(`Found: ${this.state.deviceName}. Connecting…`, 'info');

    // Auto-reconnect on unexpected disconnect
    device.addEventListener('gattserverdisconnected', () => {
      this._onDisconnected(log);
    });

    try {
      const server = await device.gatt.connect();
      this.state.server = server;
      log('GATT connected. Detecting protocol…', 'info');

      // Try protocols in priority order: iConsole > FTMS > CSC
      const proto = await this._detectAndSubscribe(server, log);
      if (!proto) {
        log('No recognised bike service found on this device.', 'error');
        Events.emit('bike:error', { message: 'No supported service found.' });
        device.gatt.disconnect();
        return false;
      }

      this.state.protocol  = proto;
      this.state.connected = true;

      // Also try heart rate if available (non-fatal if absent)
      this._subscribeHR(server, log).catch(() => {});

      log(`✅ Connected via ${proto.toUpperCase()}!`, 'ok');
      Events.emit('bike:connected', { name: this.state.deviceName, protocol: proto });
      Utils.toast(`🚴 Bike connected: ${this.state.deviceName} (${proto})`, 'good', 4000);
      return true;

    } catch (err) {
      log(`Connection failed: ${err.message}`, 'error');
      Events.emit('bike:error', { message: err.message });
      this._reset();
      return false;
    }
  },

  // ── Disconnect ────────────────────────────────────────────────────
  disconnect() {
    if (this.state.device?.gatt?.connected) {
      this.state.device.gatt.disconnect(); // triggers gattserverdisconnected
    } else {
      this._onDisconnected();
    }
  },

  // ── Enable / disable (called by DevMode) ─────────────────────────
  setEnabled(v) {
    this.state.enabled = v;
    if (!v && this.state.connected) {
      this.disconnect();
    }
    console.log('[Bluetooth] Enabled:', v);
  },

  // ═════════════════════════════════════════════════════════════════
  // PROTOCOL DETECTION
  // ═════════════════════════════════════════════════════════════════

  async _detectAndSubscribe(server, log) {
    // 1. iConsole+ / Abilica proprietary
    try {
      const svc = await server.getPrimaryService(this.UUID.ICONSOLE_SVC);
      log('iConsole+ service found. Subscribing…', 'info');
      await this._subscribeIConsole(svc, log);
      return 'iconsole';
    } catch (_) { /* not found, try next */ }

    // 2. FTMS (Fitness Machine Service)
    try {
      const svc = await server.getPrimaryService(this.UUID.FTMS_SVC);
      log('FTMS service found. Subscribing…', 'info');
      await this._subscribeFTMS(svc, log);
      return 'ftms';
    } catch (_) { /* not found, try next */ }

    // 3. CSC (Cycling Speed & Cadence)
    try {
      const svc = await server.getPrimaryService(this.UUID.CSC_SVC);
      log('CSC service found. Subscribing…', 'info');
      await this._subscribeCSC(svc, log);
      return 'csc';
    } catch (_) { /* not found */ }

    return null;
  },

  // ═════════════════════════════════════════════════════════════════
  // iCONSOLE+ PROTOCOL
  // ─────────────────────────────────────────────────────────────────
  // Abilica / iConsole+ sends 16-byte proprietary packets:
  //   [0]  0xF0  — header
  //   [1]  type  — 0xD1 = workout data
  //   [2]  ?
  //   [3]  ?
  //   [4-5] time (seconds, little-endian)
  //   [6]  speed (tenths of km/h)
  //   [7]  ?
  //   [8]  RPM   (direct byte value)
  //   [9]  resistance level
  //   [10-11] distance (metres, little-endian)
  //   [12-13] calories
  //   [14] heart rate
  //   [15] checksum (XOR of bytes 1..14)
  // ═════════════════════════════════════════════════════════════════

  async _subscribeIConsole(svc, log) {
    const notifyChar = await svc.getCharacteristic(this.UUID.ICONSOLE_NOTIFY);

    // Optionally grab the write characteristic to send start command
    try {
      this._ico._writeChar = await svc.getCharacteristic(this.UUID.ICONSOLE_WRITE);
    } catch (_) { this._ico._writeChar = null; }

    await notifyChar.startNotifications();
    notifyChar.addEventListener('characteristicvaluechanged', e => {
      this._parseIConsole(e.target.value);
    });

    // Send start-data-stream command if writable
    if (this._ico._writeChar) {
      try {
        await this._ico._writeChar.writeValue(this.UUID.ICONSOLE_CMD_START);
        log('iConsole start command sent.', 'info');
      } catch (_) { /* not fatal */ }
    }
  },

  _parseIConsole(dv) {
    if (!this.state.enabled) return;
    if (dv.byteLength < 16) return;

    const header = dv.getUint8(0);
    if (header !== 0xF0) return;  // not a valid packet

    // Verify checksum (XOR of bytes 1..14 should equal byte 15)
    let xor = 0;
    for (let i = 1; i < 15; i++) xor ^= dv.getUint8(i);
    if (xor !== dv.getUint8(15)) return; // corrupted packet

    const type = dv.getUint8(1);
    if (type !== 0xD1) return; // only handle workout-data packets

    const rpm  = dv.getUint8(8);
    const kmh  = dv.getUint8(6) / 10;   // tenths of km/h
    const hr   = dv.getUint8(14);

    this.state.rpm = rpm;
    this.state.kmh = kmh;
    if (hr > 0) this.state.bpm = hr;

    if (rpm > 0) {
      Events.emit('bike:pedal', { rpm, source: 'iconsole' });
    }
    if (kmh > 0) {
      Events.emit('bike:speed', { kmh, source: 'iconsole' });
    }
    if (hr > 30 && hr < 250) {
      Events.emit('bike:hr', { bpm: hr });
    }
  },

  // ═════════════════════════════════════════════════════════════════
  // FTMS PROTOCOL — Indoor Bike Data (0x2AD2)
  // ─────────────────────────────────────────────────────────────────
  // FTMS Indoor Bike Data is a variable-length packet.
  // First 2 bytes are flags indicating which fields are present.
  //
  // Flags (bit positions):
  //   Bit  0: More Data (if 1, speed present in bytes 2-3 as uint16, km/h * 100)
  //   Bit  1: Average Speed present
  //   Bit  2: Instantaneous Cadence present (2 bytes, rpm * 2)
  //   Bit  3: Average Cadence present
  //   Bit  4: Total Distance present (3 bytes)
  //   Bit  5: Resistance Level present (2 bytes)
  //   Bit  6: Instantaneous Power present (2 bytes)
  //   Bit  7: Average Power present
  //   Bit  8: Expended Energy present (5 bytes)
  //   Bit  9: Heart Rate present
  //   Bit 10: Metabolic Equivalent present
  //   Bit 11: Elapsed Time present
  //   Bit 12: Remaining Time present
  // ═════════════════════════════════════════════════════════════════

  async _subscribeFTMS(svc, log) {
    const char = await svc.getCharacteristic(this.UUID.FTMS_BIKE_DATA);
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', e => {
      this._parseFTMS(e.target.value);
    });

    // Optionally write to control point to request data (0x07 = start, 0x00 = op reset)
    try {
      const ctrl = await svc.getCharacteristic(this.UUID.FTMS_CONTROL);
      await ctrl.writeValue(new Uint8Array([0x00])); // reset op code
      log('FTMS control point initialised.', 'info');
    } catch (_) { /* not fatal */ }
  },

  _parseFTMS(dv) {
    if (!this.state.enabled) return;
    if (dv.byteLength < 2) return;

    const flags = dv.getUint16(0, true);
    let offset  = 2;

    // Bit 0 clear → speed field is present (confusingly 0 = MORE DATA = includes speed)
    let kmh = 0;
    const hasSpeed = !(flags & 0x0001);
    if (hasSpeed && dv.byteLength >= offset + 2) {
      kmh = dv.getUint16(offset, true) / 100;
      offset += 2;
    }

    // Bit 1: average speed
    if (flags & 0x0002) offset += 2;

    // Bit 2: instantaneous cadence (rpm * 2 → divide by 2 for actual RPM)
    let rpm = 0;
    if (flags & 0x0004) {
      if (dv.byteLength >= offset + 2) {
        rpm = dv.getUint16(offset, true) / 2;
        offset += 2;
      }
    }

    // Bit 3: average cadence
    if (flags & 0x0008) offset += 2;

    // Bit 4: total distance (3 bytes)
    if (flags & 0x0010) offset += 3;

    // Bit 5: resistance level
    if (flags & 0x0020) offset += 2;

    // Bit 6: instantaneous power
    let power = 0;
    if (flags & 0x0040) {
      if (dv.byteLength >= offset + 2) {
        power = dv.getInt16(offset, true); // signed — can be negative on some devices
        offset += 2;
      }
    }

    // Bit 7: average power
    if (flags & 0x0080) offset += 2;

    // Bit 8: expended energy (5 bytes: total energy uint16, per hour uint16, per minute uint8)
    if (flags & 0x0100) offset += 5;

    // Bit 9: heart rate
    let hr = 0;
    if (flags & 0x0200) {
      if (dv.byteLength >= offset + 1) {
        hr = dv.getUint8(offset);
        offset += 1;
      }
    }

    // Update state and emit
    if (rpm > 0) this.state.rpm = rpm;
    if (kmh > 0) this.state.kmh = kmh;
    if (power !== 0) this.state.power = power;
    if (hr > 0) this.state.bpm = hr;

    if (rpm > 0) {
      Events.emit('bike:pedal', { rpm, source: 'ftms' });
    }
    if (kmh > 0) {
      Events.emit('bike:speed', { kmh, source: 'ftms' });
    }
    if (hr > 30 && hr < 250) {
      Events.emit('bike:hr', { bpm: hr });
    }
  },

  // ═════════════════════════════════════════════════════════════════
  // CSC PROTOCOL — Cycling Speed & Cadence (0x1816)
  // ─────────────────────────────────────────────────────────────────
  // Byte 0: flags
  //   bit 0 = wheel revolution data present
  //   bit 1 = crank revolution data present
  // If crank present (after any wheel data):
  //   uint16 cumulative crank revolutions
  //   uint16 last crank event time (1/1024 s)
  // Derives RPM from delta revs / delta time between packets.
  // ═════════════════════════════════════════════════════════════════

  async _subscribeCSC(svc, log) {
    const char = await svc.getCharacteristic(this.UUID.CSC_MEASUREMENT);
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', e => {
      this._parseCSC(e.target.value);
    });
  },

  _parseCSC(dv) {
    if (!this.state.enabled) return;
    const flags    = dv.getUint8(0);
    const hasCrank = (flags & 0x02) !== 0;
    if (!hasCrank) return;

    // Crank data offset: 5 if wheel data present (4 bytes), else 1
    const hasWheel = (flags & 0x01) !== 0;
    const off      = hasWheel ? 5 : 1;
    if (dv.byteLength < off + 4) return;

    const revs    = dv.getUint16(off,     true);
    const rawTime = dv.getUint16(off + 2, true);

    const p = this._csc;
    if (p.lastRevs === null) {
      p.lastRevs = revs;
      p.lastTime = rawTime;
      return;
    }

    // 16-bit rollover safe delta
    const dRevs = (revs    - p.lastRevs + 65536) % 65536;
    const dTime = (rawTime - p.lastTime + 65536) % 65536;
    p.lastRevs = revs;
    p.lastTime = rawTime;

    if (dTime === 0 || dRevs === 0) return;

    // dTime is in 1/1024 s units → RPM = (dRevs / (dTime/1024)) * 60
    const rpm = Math.round((dRevs / (dTime / 1024)) * 60);
    if (rpm < 5 || rpm > 300) return; // sanity clamp

    this.state.rpm = rpm;
    Events.emit('bike:pedal', { rpm, source: 'csc' });
  },

  // ═════════════════════════════════════════════════════════════════
  // HEART RATE (supplementary — non-fatal if absent)
  // ═════════════════════════════════════════════════════════════════

  async _subscribeHR(server, log) {
    const svc  = await server.getPrimaryService(this.UUID.HR_SVC);
    const char = await svc.getCharacteristic(this.UUID.HR_MEASUREMENT);
    await char.startNotifications();
    char.addEventListener('characteristicvaluechanged', e => {
      this._parseHR(e.target.value);
    });
    log('Heart rate monitor active.', 'info');
  },

  _parseHR(dv) {
    if (!this.state.enabled) return;
    if (dv.byteLength < 2) return;
    const flags = dv.getUint8(0);
    // bit 0: 0 = uint8 format, 1 = uint16 format
    const bpm = (flags & 0x01) ? dv.getUint16(1, true) : dv.getUint8(1);
    if (bpm < 30 || bpm > 250) return;
    this.state.bpm = bpm;
    Events.emit('bike:hr', { bpm });
  },

  // ═════════════════════════════════════════════════════════════════
  // DISCONNECT HANDLING
  // ═════════════════════════════════════════════════════════════════

  _onDisconnected(log) {
    const name = this.state.deviceName;
    this._reset();
    const msg = `📡 ${name || 'Bike'} disconnected.`;
    Utils.toast(msg, 'info', 3000);
    Events.emit('bike:disconnected', { name });
    if (log) log('Disconnected.', 'warn');
    console.log('[Bluetooth] Disconnected:', name);
  },

  _reset() {
    this.state.device     = null;
    this.state.server     = null;
    this.state.protocol   = null;
    this.state.connected  = false;
    this.state.deviceName = '';
    this.state.rpm        = 0;
    this.state.kmh        = 0;
    this.state.bpm        = 0;
    this.state.power      = 0;
    this._csc.lastRevs    = null;
    this._csc.lastTime    = null;
    this._ico._writeChar  = null;
  },
};

// ═══════════════════════════════════════════════════════════════════
// CADENCE BRIDGE
// ─────────────────────────────────────────────────────────────────
// Listens for bike:pedal events and injects RPM into Cadence's
// rolling-window as synthetic timestamps — the ONLY place that
// translates RPM → cadence engine input.
//
// Architecture note: Cadence._active must be true for injection
// to work (DynamoBike.startSession() calls Cadence.start()).
// ═══════════════════════════════════════════════════════════════════

Events.on('bike:pedal', ({ rpm, source }) => {
  if (typeof Cadence === 'undefined' || !Cadence._active) return;
  if (!Bluetooth.state.enabled) return;

  // Convert RPM to a burst of timestamps spread over the last second.
  // RPM = revolutions per minute → revsPerSecond = rpm / 60
  // We inject that many click-timestamps into the last 1000ms window.
  const revsThisSec = Math.max(1, Math.round(rpm / 60));
  const nowMs       = Date.now();

  for (let i = 0; i < revsThisSec; i++) {
    // Spread evenly over the past second
    const ts = nowMs - Math.round((revsThisSec - i) * (1000 / revsThisSec));
    Cadence._clickTimes.push(ts);
  }
  Cadence._recalcCPM();
});
