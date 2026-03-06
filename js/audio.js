// ═══════════════════════════════════════════
// PEDAL OR DIE — audio.js
// Procedural audio engine — no files needed!
// Web Audio API: generative music per location,
// ambient layers, sound effects, cross-fades
// ═══════════════════════════════════════════

const Audio = {

  _ctx:          null,
  _masterGain:   null,
  _musicGain:    null,
  _sfxGain:      null,
  _currentTrack: null,
  _trackNodes:   [],    // all nodes for current track (stop them all)
  _muted:        false,
  _musicVol:     0.35,
  _sfxVol:       0.55,
  _fadeTimer:    null,

  // ── Init Web Audio context ─────────────────
  init() {
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();

      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 1;
      this._masterGain.connect(this._ctx.destination);

      this._musicGain = this._ctx.createGain();
      this._musicGain.gain.value = this._musicVol;
      this._musicGain.connect(this._masterGain);

      this._sfxGain = this._ctx.createGain();
      this._sfxGain.gain.value = this._sfxVol;
      this._sfxGain.connect(this._masterGain);

      // Load mute prefs
      const saved = localStorage.getItem('pod_muted');
      if (saved === 'true') this.setMuted(true);

      console.log('[Audio] Web Audio API ready');
      return true;
    } catch (e) {
      console.warn('[Audio] Web Audio not available:', e);
      return false;
    }
  },

  // ── Resume context (required after user gesture) ──
  _resume() {
    if (this._ctx?.state === 'suspended') {
      this._ctx.resume();
    }
  },

  // ── Play music for a game screen/location ──
  play(trackId) {
    if (!this._ctx) return;
    this._resume();
    if (this._currentTrack === trackId) return;

    this._fadeOut(() => {
      this._currentTrack = trackId;
      this._startTrack(trackId);
    });
  },

  // ── Stop all music ─────────────────────────
  stop() {
    this._fadeOut(() => {
      this._currentTrack = null;
    });
  },

  // ── Fade out then callback ──────────────────
  _fadeOut(cb) {
    clearTimeout(this._fadeTimer);
    if (!this._ctx || this._trackNodes.length === 0) {
      this._killNodes();
      cb();
      return;
    }
    const g = this._ctx.createGain();
    g.gain.setValueAtTime(1, this._ctx.currentTime);
    g.gain.linearRampToValueAtTime(0, this._ctx.currentTime + 0.8);
    this._trackNodes.forEach(n => {
      try {
        if (n.gain) n.gain.connect(g);
      } catch (_) {}
    });
    this._fadeTimer = setTimeout(() => {
      this._killNodes();
      cb();
    }, 850);
  },

  _killNodes() {
    this._trackNodes.forEach(n => {
      try { n.stop?.(); } catch (_) {}
      try { n.disconnect?.(); } catch (_) {}
    });
    this._trackNodes = [];
  },

  // ── Route new oscillator/source through music gain ──
  _node(node) {
    this._trackNodes.push(node);
    return node;
  },

  // ── Track dispatcher ──────────────────────
  _startTrack(id) {
    switch (id) {
      case 'menu':       return this._trackMenu();
      case 'base':       return this._trackBase();
      case 'forest':     return this._trackForest();
      case 'farm':       return this._trackFarm();
      case 'gas_station':return this._trackGasStation();
      case 'city_ruins': return this._trackCityRuins();
      case 'junkyard':   return this._trackJunkyard();
      case 'hospital':   return this._trackHospital();
      case 'cave':       return this._trackCave();
      case 'military':   return this._trackMilitary();
      case 'raid':       return this._trackRaid();
      case 'craft':      return this._trackCraft();
      default:           return this._trackBase();
    }
  },

  // ═══════════════════════════════════════════
  // TRACKS
  // ═══════════════════════════════════════════

  // ── Main Menu: slow haunting piano-like melody ──
  _trackMenu() {
    const ctx = this._ctx;
    // Pad drone
    this._pad([130.81, 164.81, 196.00], 0.08, 'sine');
    // Melody sequence
    const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66];
    this._arpSequence(melody, 1.2, 0.06, 'triangle');
  },

  // ── Base camp: low eerie ambient ──────────
  _trackBase() {
    const ctx = this._ctx;
    // Low drone — post-apocalyptic atmosphere
    this._drone(55, 0.06, 'sawtooth', 0.3);
    this._drone(82.41, 0.04, 'sine', 0.5);
    // Wind-like filtered noise
    this._wind(0.04);
    // Distant metallic ping occasionally
    this._sparsePings([220, 277.18, 329.63], 4000, 8000, 0.05);
  },

  // ── Forest: flowing nature arpeggios ──────
  _trackForest() {
    // Gentle, organic — flowing major pentatonic
    this._pad([164.81, 220.00, 261.63], 0.06, 'sine');
    this._wind(0.03);
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 392.00, 329.63, 293.66];
    this._arpSequence(notes, 0.5, 0.05, 'sine', true);
    // High bird-like chirps
    this._sparsePings([880, 1046.50, 1174.66], 2000, 5000, 0.03);
  },

  // ── Abandoned Farm: melancholy, quiet ─────
  _trackFarm() {
    // Slow, sad — minor key
    this._pad([110, 130.81, 155.56], 0.05, 'triangle');
    this._wind(0.04);
    const melody = [220.00, 246.94, 261.63, 220.00, 196.00, 174.61, 196.00, 220.00];
    this._arpSequence(melody, 0.9, 0.04, 'triangle', false);
    this._sparsePings([440, 493.88], 5000, 9000, 0.04);
  },

  // ── Gas Station: tension, industrial hum ──
  _trackGasStation() {
    this._drone(55, 0.07, 'sawtooth', 0.15);
    this._drone(110, 0.04, 'square', 0.3);
    // Mechanical ticking
    this._pulse(4, 0.05);
    // High tension string-like
    const notes = [246.94, 261.63, 246.94, 220.00, 246.94, 261.63];
    this._arpSequence(notes, 0.7, 0.04, 'sawtooth', false);
  },

  // ── City Ruins: dark, industrial, ominous ─
  _trackCityRuins() {
    // Deep bass drone
    this._drone(41.20, 0.09, 'sawtooth', 0.2);
    this._drone(61.74, 0.06, 'square', 0.25);
    // Distant percussion
    this._pulse(2, 0.07);
    // Eerie high shimmer
    this._pad([523.25, 587.33], 0.03, 'sine');
    this._sparsePings([311.13, 349.23, 369.99], 3000, 6000, 0.04);
  },

  // ── Junkyard: metallic clangs, gritty ────
  _trackJunkyard() {
    this._drone(55, 0.08, 'square', 0.1);
    // Metallic rhythmic hits
    this._metalPulse(2.5, 0.06);
    this._metalPulse(3.7, 0.04);
    // Gritty melody
    const notes = [138.59, 155.56, 138.59, 123.47, 138.59];
    this._arpSequence(notes, 0.6, 0.05, 'square', false);
    this._wind(0.025);
  },

  // ── Hospital: creepy, dissonant, quiet ────
  _trackHospital() {
    // Dissonant interval (minor 2nd)
    this._drone(220, 0.04, 'sine', 0.4);
    this._drone(233.08, 0.04, 'sine', 0.42);  // dissonance!
    // EKG-like beep pattern
    this._ekgBeep();
    // Sparse creepy notes
    this._sparsePings([415.30, 466.16, 369.99], 3500, 7000, 0.035);
    this._wind(0.02);
  },

  // ── Cave: deep, primal, reverberant ───────
  _trackCave() {
    // Sub-bass rumble
    this._drone(27.50, 0.1, 'sine', 0.6);
    this._drone(36.71, 0.07, 'sawtooth', 0.8);
    // Deep dripping/pinging
    this._sparsePings([55, 65.41, 73.42], 2000, 6000, 0.08);
    // Low rhythmic pulse
    this._pulse(1.5, 0.09);
    // Eerie choir-like pad
    this._pad([82.41, 98.00, 110.00], 0.04, 'sine');
  },

  // ── Military Base: tense, percussion-driven ──
  _trackMilitary() {
    this._drone(41.20, 0.07, 'sawtooth', 0.15);
    // Military snare-like tick
    this._pulse(4, 0.06);
    this._pulse(4, 0.04); // offset
    // Tense brass-like stabs
    const notes = [146.83, 164.81, 155.56, 146.83, 138.59];
    this._arpSequence(notes, 0.4, 0.06, 'sawtooth', false);
    this._sparsePings([196.00, 220.00], 2500, 5000, 0.05);
  },

  // ── Raid: urgent, fast, combat energy ─────
  _trackRaid() {
    // Fast aggressive bass
    this._drone(41.20, 0.12, 'sawtooth', 0.08);
    this._drone(55.00, 0.08, 'square', 0.1);
    // Rapid pulse
    this._pulse(8, 0.08);
    // Fast alarm arpeggios
    const notes = [440, 493.88, 523.25, 587.33, 523.25, 493.88];
    this._arpSequence(notes, 0.15, 0.06, 'square', false);
    // Stab chords
    this._sparsePings([220, 261.63, 329.63], 500, 1500, 0.07);
  },

  // ── Crafting: focused, satisfying hum ─────
  _trackCraft() {
    this._drone(110, 0.05, 'triangle', 0.2);
    const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63];
    this._arpSequence(notes, 0.35, 0.04, 'triangle', true);
  },

  // ═══════════════════════════════════════════
  // BUILDING BLOCKS (generative primitives)
  // ═══════════════════════════════════════════

  // ── Sustained drone with LFO vibrato ──────
  _drone(freq, vol, type = 'sine', vibratoRate = 0.3) {
    const ctx  = this._ctx;
    const osc  = this._node(ctx.createOscillator());
    const gain = ctx.createGain();
    const lfo  = this._node(ctx.createOscillator());
    const lfog = ctx.createGain();
    const filt = ctx.createBiquadFilter();

    osc.type      = type;
    osc.frequency.value = freq;

    lfo.frequency.value = vibratoRate;
    lfo.type = 'sine';
    lfog.gain.value = freq * 0.015;

    filt.type            = 'lowpass';
    filt.frequency.value = freq * 4;
    filt.Q.value         = 1;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2);

    lfo.connect(lfog);
    lfog.connect(osc.frequency);
    osc.connect(filt);
    filt.connect(gain);
    gain.connect(this._musicGain);

    osc.start();
    lfo.start();
  },

  // ── Pad chord ─────────────────────────────
  _pad(freqs, vol, type = 'sine') {
    freqs.forEach((f, i) => {
      const ctx  = this._ctx;
      const osc  = this._node(ctx.createOscillator());
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.value = f;
      // Detune each voice slightly for richness
      osc.detune.value = (i - freqs.length / 2) * 8;

      filt.type = 'lowpass';
      filt.frequency.value = f * 3;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 3);

      osc.connect(filt);
      filt.connect(gain);
      gain.connect(this._musicGain);
      osc.start();
    });
  },

  // ── Arpeggio sequence (loops) ─────────────
  _arpSequence(notes, speed, vol, type = 'triangle', loop = true) {
    const ctx    = this._ctx;
    let   step   = 0;
    let   active = true;

    const playNext = () => {
      if (!active || !this._ctx) return;
      if (step >= notes.length && !loop) return;

      const freq = notes[step % notes.length];
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const filt = ctx.createBiquadFilter();
      const t    = ctx.currentTime;

      osc.type = type;
      osc.frequency.value = freq;
      filt.type = 'bandpass';
      filt.frequency.value = freq * 2;
      filt.Q.value = 2;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.02);
      gain.gain.linearRampToValueAtTime(vol * 0.6, t + speed * 0.6);
      gain.gain.linearRampToValueAtTime(0, t + speed);

      osc.connect(filt);
      filt.connect(gain);
      gain.connect(this._musicGain);
      osc.start(t);
      osc.stop(t + speed);

      step++;
      const id = setTimeout(playNext, speed * 1000);
      // Store cancel handle on the gain node so _killNodes can reach it
      gain._stopId = id;
      this._trackNodes.push({ stop: () => { clearTimeout(id); active = false; }, disconnect: () => {} });
    };

    playNext();
  },

  // ── Filtered noise (wind) ─────────────────
  _wind(vol) {
    const ctx      = this._ctx;
    const bufSize  = ctx.sampleRate * 2;
    const buffer   = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data     = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const source = this._node(ctx.createBufferSource());
    source.buffer = buffer;
    source.loop   = true;

    const filt = ctx.createBiquadFilter();
    filt.type            = 'bandpass';
    filt.frequency.value = 400;
    filt.Q.value         = 0.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 2);

    // Slow LFO on filter to make it swirl
    const lfo  = this._node(ctx.createOscillator());
    const lfog = ctx.createGain();
    lfo.frequency.value = 0.1;
    lfog.gain.value     = 300;
    lfo.connect(lfog);
    lfog.connect(filt.frequency);
    lfo.start();

    source.connect(filt);
    filt.connect(gain);
    gain.connect(this._musicGain);
    source.start();
  },

  // ── Rhythmic bass pulse ────────────────────
  _pulse(bpm, vol) {
    const ctx  = this._ctx;
    let active = true;
    const interval = 60000 / bpm / 2;

    const tick = () => {
      if (!active || !this._ctx) return;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const t    = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.value = 55;

      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);

      osc.connect(gain);
      gain.connect(this._musicGain);
      osc.start(t);
      osc.stop(t + 0.12);
    };

    tick();
    const id = setInterval(tick, interval);
    this._trackNodes.push({ stop: () => { clearInterval(id); active = false; }, disconnect: () => {} });
  },

  // ── Metallic pulse (junkyard) ─────────────
  _metalPulse(bpm, vol) {
    const ctx  = this._ctx;
    let active = true;
    const interval = 60000 / bpm;

    const tick = () => {
      if (!active || !this._ctx) return;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const t    = ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(200, t + 0.15);

      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);

      osc.connect(gain);
      gain.connect(this._musicGain);
      osc.start(t);
      osc.stop(t + 0.22);
    };

    tick();
    const id = setInterval(tick, interval);
    this._trackNodes.push({ stop: () => { clearInterval(id); active = false; }, disconnect: () => {} });
  },

  // ── Sparse random pings ────────────────────
  _sparsePings(freqs, minMs, maxMs, vol) {
    const ctx  = this._ctx;
    let active = true;

    const ping = () => {
      if (!active || !this._ctx) return;
      const freq = freqs[Utils.randInt(0, freqs.length - 1)];
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const t    = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);

      osc.connect(gain);
      gain.connect(this._musicGain);
      osc.start(t);
      osc.stop(t + 0.9);

      const delay = Utils.randInt(minMs, maxMs);
      const id    = setTimeout(ping, delay);
      this._trackNodes.push({ stop: () => { clearTimeout(id); active = false; }, disconnect: () => {} });
    };

    const id = setTimeout(ping, Utils.randInt(minMs / 2, minMs));
    this._trackNodes.push({ stop: () => { clearTimeout(id); active = false; }, disconnect: () => {} });
  },

  // ── Hospital EKG beep ─────────────────────
  _ekgBeep() {
    const ctx  = this._ctx;
    let active = true;

    const beep = () => {
      if (!active || !this._ctx) return;
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const t    = ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.value = 880;

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);

      osc.connect(gain);
      gain.connect(this._musicGain);
      osc.start(t);
      osc.stop(t + 0.08);
    };

    // BPM 60 heartbeat pattern: two beeps close together then pause
    const pattern = () => {
      if (!active) return;
      beep();
      const id1 = setTimeout(() => beep(), 200);
      const id2 = setTimeout(pattern, 1100);
      this._trackNodes.push(
        { stop: () => { clearTimeout(id1); clearTimeout(id2); active = false; }, disconnect: () => {} }
      );
    };
    pattern();
  },

  // ═══════════════════════════════════════════
  // SOUND EFFECTS
  // ═══════════════════════════════════════════

  // ── Play a one-shot SFX ────────────────────
  _sfx(fn) {
    if (!this._ctx || this._muted) return;
    this._resume();
    fn(this._ctx, this._sfxGain);
  },

  // Pedal click — quick mechanical click
  sfxPedal() {
    this._sfx((ctx, out) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const t    = ctx.currentTime;
      osc.type = 'square';
      osc.frequency.setValueAtTime(120, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.04);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
      osc.connect(gain); gain.connect(out);
      osc.start(t); osc.stop(t + 0.06);
    });
  },

  // Resource pickup — bright ascending tick
  sfxPickup() {
    this._sfx((ctx, out) => {
      [523.25, 659.25].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const t    = ctx.currentTime + i * 0.06;
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        osc.connect(gain); gain.connect(out);
        osc.start(t); osc.stop(t + 0.18);
      });
    });
  },

  // Rare/legendary find — shimmery chord
  sfxLegendary() {
    this._sfx((ctx, out) => {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const t    = ctx.currentTime + i * 0.04;
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.6);
        osc.connect(gain); gain.connect(out);
        osc.start(t); osc.stop(t + 0.65);
      });
    });
  },

  // Craft success — satisfying hammer hit
  sfxCraft() {
    this._sfx((ctx, out) => {
      // Thud
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const t    = ctx.currentTime;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      osc.connect(gain); gain.connect(out);
      osc.start(t); osc.stop(t + 0.18);
      // Ding
      const osc2  = ctx.createOscillator();
      const gain2 = ctx.createGain();
      const t2    = t + 0.12;
      osc2.type = 'sine';
      osc2.frequency.value = 880;
      gain2.gain.setValueAtTime(0.1, t2);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t2 + 0.3);
      osc2.connect(gain2); gain2.connect(out);
      osc2.start(t2); osc2.stop(t2 + 0.35);
    });
  },

  // Encounter / animal alert — harsh stab
  sfxEncounter() {
    this._sfx((ctx, out) => {
      [220, 233.08].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const t    = ctx.currentTime + i * 0.03;
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        osc.connect(gain); gain.connect(out);
        osc.start(t); osc.stop(t + 0.25);
      });
    });
  },

  // Raid alarm — pulsing siren
  sfxRaidAlert() {
    this._sfx((ctx, out) => {
      [440, 523.25, 440, 523.25].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const t    = ctx.currentTime + i * 0.12;
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.14, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
        osc.connect(gain); gain.connect(out);
        osc.start(t); osc.stop(t + 0.12);
      });
    });
  },

  // Victory / raid repelled
  sfxVictory() {
    this._sfx((ctx, out) => {
      [392, 523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const t    = ctx.currentTime + i * 0.08;
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.4);
        osc.connect(gain); gain.connect(out);
        osc.start(t); osc.stop(t + 0.45);
      });
    });
  },

  // Defeat / resource loss
  sfxDefeat() {
    this._sfx((ctx, out) => {
      [392, 349.23, 311.13, 261.63].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const t    = ctx.currentTime + i * 0.1;
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.3);
        osc.connect(gain); gain.connect(out);
        osc.start(t); osc.stop(t + 0.35);
      });
    });
  },

  // Building enter — wooden creak + open
  sfxDoorOpen() {
    this._sfx((ctx, out) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      const t    = ctx.currentTime;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.linearRampToValueAtTime(180, t + 0.25);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.linearRampToValueAtTime(0.0001, t + 0.3);
      osc.connect(gain); gain.connect(out);
      osc.start(t); osc.stop(t + 0.32);
    });
  },

  // Sleep / rest — soft lullaby chime
  sfxSleep() {
    this._sfx((ctx, out) => {
      [523.25, 659.25, 783.99, 1046.50, 783.99].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const t    = ctx.currentTime + i * 0.18;
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.07, t);
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.5);
        osc.connect(gain); gain.connect(out);
        osc.start(t); osc.stop(t + 0.55);
      });
    });
  },

  // Unlock new location
  sfxUnlock() {
    this._sfx((ctx, out) => {
      [392, 523.25, 659.25, 880, 1046.50].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const t    = ctx.currentTime + i * 0.07;
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0.0001, t + 0.35);
        osc.connect(gain); gain.connect(out);
        osc.start(t); osc.stop(t + 0.4);
      });
    });
  },

  // Water draw — bubbly gurgle
  sfxWater() {
    this._sfx((ctx, out) => {
      [523.25, 783.99, 659.25].forEach((freq, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        const t    = ctx.currentTime + i * 0.05;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.linearRampToValueAtTime(freq * 1.2, t + 0.07);
        osc.frequency.linearRampToValueAtTime(freq, t + 0.14);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        osc.connect(gain); gain.connect(out);
        osc.start(t); osc.stop(t + 0.2);
      });
    });
  },

  // ═══════════════════════════════════════════
  // CONTROLS
  // ═══════════════════════════════════════════

  setMuted(muted) {
    this._muted = muted;
    if (this._masterGain) {
      this._masterGain.gain.setTargetAtTime(
        muted ? 0 : 1,
        this._ctx.currentTime,
        0.1
      );
    }
    localStorage.setItem('pod_muted', muted);
    this._updateMuteBtn();
  },

  toggleMute() {
    this.setMuted(!this._muted);
  },

  setMusicVol(v) {
    this._musicVol = Utils.clamp(v, 0, 1);
    if (this._musicGain) this._musicGain.gain.value = this._musicVol;
  },

  setSfxVol(v) {
    this._sfxVol = Utils.clamp(v, 0, 1);
    if (this._sfxGain) this._sfxGain.gain.value = this._sfxVol;
  },

  _updateMuteBtn() {
    const btn = document.getElementById('btn-audio-toggle');
    if (btn) btn.textContent = this._muted ? '🔇' : '🔊';
  },

  // ── Map location ID → track ID ─────────────
  trackForLocation(locationId) {
    const map = {
      forest:         'forest',
      abandoned_farm: 'farm',
      gas_station:    'gas_station',
      city_ruins:     'city_ruins',
      junkyard:       'junkyard',
      hospital:       'hospital',
      cave:           'cave',
      military_base:  'military'
    };
    return map[locationId] || 'base';
  }
};
