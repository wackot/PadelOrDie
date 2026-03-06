// ═══════════════════════════════════════════
// PEDAL OR DIE — cadence.js
// Click / cadence engine
// This is the ONLY file that handles input.
// Everything else just reads State.data.cadence.clicksPerMinute
// Future: swap clicks for Bluetooth bike sensor here only.
// ═══════════════════════════════════════════

const Cadence = {

  _active:       false,
  _clickTimes:   [],   // rolling window of recent click timestamps
  _windowMs:     5000, // measure CPM over last 5 seconds
  _decayTimer:   null,
  _uiTimer:      null,

  // ── Start listening ───────────────────────
  start() {
    this._active = true;
    this._clickTimes = [];
    State.data.cadence.clicksPerMinute = 0;

    // Decay CPM when no clicks coming in
    this._decayTimer = setInterval(() => this._decayCPM(), 500);

    // Update UI every 200ms
    this._uiTimer = setInterval(() => this._updateUI(), 200);

    console.log('[Cadence] Started');
  },

  // ── Stop listening ────────────────────────
  stop() {
    this._active = false;
    clearInterval(this._decayTimer);
    clearInterval(this._uiTimer);
    State.data.cadence.clicksPerMinute = 0;
    this._updateUI();
    console.log('[Cadence] Stopped');
  },

  // ── Register a click/pedal ────────────────
  registerClick() {
    if (!this._active) return;
    // Dev click mode: inject synthetic clicks to simulate full-speed pedalling
    if (State.clickModeActiveFn && State.clickModeActiveFn()) {
      const target = this.getTargetCPM() || 60;
      const injectCount = Math.round(target / 10); // inject burst matching target CPM
      for (let i = 0; i < injectCount; i++) this._clickTimes.push(Date.now());
      this._recalcCPM();
    }

    const now = Date.now();
    this._clickTimes.push(now);
    State.data.cadence.sessionClicks++;
    State.data.stats.totalClicksAllTime++;
    // Fitness: estimate stats from clicks
    // 1 click ≈ 1 pedal stroke; at 60 CPM = 1 rev/sec; ~0.003 km/click at 18km/h
    const st = State.data.stats;
    const cpm = State.data.cadence.clicksPerMinute || 60;
    st.bestCPM = Math.max(st.bestCPM || 0, cpm);
    st.sessionBestCPM = Math.max(st.sessionBestCPM || 0, cpm);
    // 1 pedal click ≈ 3.5 cal/min ÷ 60 CPM ≈ 0.058 cal per click (scaled by intensity)
    const calPerClick = (3.5 + (cpm - 60) * 0.04) / 60;
    st.totalCaloriesBurned = (st.totalCaloriesBurned || 0) + Math.max(0.04, calPerClick);
    // distance: ~18km/h at 60CPM, scales with CPM
    const kmPerClick = (18 + (cpm - 60) * 0.1) / 60 / 60;
    st.totalDistanceKm = (st.totalDistanceKm || 0) + kmPerClick;

    // Prune old clicks outside the window
    this._prune();

    // Calculate CPM from rolling window
    this._recalcCPM();
  },

  // ── Get current CPM ───────────────────────
  getCPM() {
    return State.data.cadence.clicksPerMinute;
  },

  // ── Get target CPM (normal or raid) ───────
  getTargetCPM() {
    if (State.data.world.activeRaid) {
      return State.data.cadence.raidTargetCPM;
    }
    return State.data.cadence.targetCPM;
  },

  // ── Ratio 0.0 → 1.0+ vs target ───────────
  getRatio() {
    const target = this.getTargetCPM();
    if (target === 0) return 0;
    return Utils.clamp(this.getCPM() / target, 0, 1.5);
  },

  // ── Is player meeting target? ─────────────
  isOnTarget() {
    return this.getRatio() >= 0.8;
  },

  // ── Private: prune old timestamps ─────────
  _prune() {
    const cutoff = Date.now() - this._windowMs;
    this._clickTimes = this._clickTimes.filter(t => t > cutoff);
  },

  // ── Private: recalculate CPM ──────────────
  _recalcCPM() {
    this._prune();
    const count = this._clickTimes.length;
    // Scale to per-minute from the window size
    const cpm = (count / this._windowMs) * 60000;
    State.data.cadence.clicksPerMinute = Math.round(cpm);
  },

  // ── Private: decay CPM when idle ──────────
  _decayCPM() {
    this._prune();
    this._recalcCPM();
  },

  // ── Private: update UI elements ───────────
  _updateUI() {
    const cpm    = this.getCPM();
    const target = this.getTargetCPM();
    const ratio  = this.getRatio();

    // CPM text
    const cpmEl = document.getElementById('cadence-cpm');
    if (cpmEl) cpmEl.textContent = `${cpm} CPM`;

    // Bar width
    const barEl = document.getElementById('cadence-bar');
    if (barEl) {
      barEl.style.width = `${Utils.clamp(ratio * 100, 0, 100)}%`;
      barEl.classList.toggle('danger', ratio < 0.5 && cpm > 0);
    }

    // Target line position
    const targetEl = document.getElementById('cadence-target-line');
    if (targetEl) {
      // Target line at 80% of bar (where "on target" begins)
      targetEl.style.left = '80%';
    }
  }

};
