// ═══════════════════════════════════════════
// PEDAL OR DIE — dynamo_bike.js
// Dynamo Bike building screen + pedalling session
//
// The Dynamo Bike is a special generator:
//   — Player opens the screen and actively pedals
//   — CPM drives watt generation in real time
//   — Session ends after _IDLE_CUTOFF seconds with no clicks
//   — Emits power:dynamo:tick each second during a session
//   — Emits power:dynamo:stop when session ends
//
// Level lives in BOTH:
//   State.data.base.buildings.dynamo_bike.level  (building)
//   State.data.power.generators.bike.level       (generator)
//   DynamoBike.build() keeps them in sync.
// ═══════════════════════════════════════════

const DynamoBike = {

  _IDLE_CUTOFF: 3,      // seconds of zero clicks before session auto-ends
  _tickInterval: null,  // setInterval handle for live session tick
  _sessionWh:    0,     // watt-hours generated this session
  _idleSecs:     0,     // consecutive seconds with no new clicks

  // ── SVG art for the base map ──────────────
  svg(x, y, level) {
    const col = level >= 3 ? '#00e5ff' : '#0288d1';
    return `<g transform="translate(${x},${y})" style="cursor:pointer">
      <!-- Frame -->
      <ellipse cx="0" cy="8" rx="18" ry="5" fill="rgba(0,0,0,0.3)"/>
      <line x1="-12" y1="0" x2="0"   y2="-14" stroke="${col}" stroke-width="3" stroke-linecap="round"/>
      <line x1="0"   y1="-14" x2="14" y2="0"  stroke="${col}" stroke-width="3" stroke-linecap="round"/>
      <line x1="-12" y1="0"  x2="14"  y2="0"  stroke="${col}" stroke-width="2" stroke-linecap="round"/>
      <!-- Wheels -->
      <circle cx="-12" cy="2" r="8" fill="none" stroke="${col}" stroke-width="2.5"/>
      <circle cx="14"  cy="2" r="8" fill="none" stroke="${col}" stroke-width="2.5"/>
      <circle cx="-12" cy="2" r="2" fill="${col}"/>
      <circle cx="14"  cy="2" r="2" fill="${col}"/>
      <!-- Saddle -->
      <rect x="-4" y="-18" width="10" height="3" rx="1" fill="${col}"/>
      <!-- Lightning bolt (power indicator) -->
      <text x="0" y="-24" text-anchor="middle" font-size="10" fill="#ffd600">⚡</text>
      <!-- Level label -->
      <text x="0" y="22" text-anchor="middle" font-size="9" fill="${col}" font-family="monospace">Lv${level}</text>
    </g>`;
  },

  // ── Render the building screen ────────────
  renderScreen() {
    const screen = document.getElementById('screen-dynamo-bike');
    if (!screen) return;

    const bldLvl = State.data.base.buildings?.dynamo_bike?.level || 0;
    const genLvl = State.data.power?.generators?.bike?.level     || 0;
    const level  = Math.max(bldLvl, genLvl);
    const stored = State.data.power?.stored   || 0;
    const maxStor = Power.getMaxStorage();
    const batPct  = maxStor > 0 ? Math.round((stored / maxStor) * 100) : 0;

    // Pip bar
    const pips = Array.from({length: 10}, (_, i) =>
      `<div class="pow-pip ${i < level ? 'on' : ''}"></div>`
    ).join('');

    // Upgrade cost for next level
    const nextLvl  = level + 1;
    const canBuild = nextLvl <= 10;
    const cost     = canBuild ? this._upgradeCost(nextLvl) : null;
    const canAfford = cost ? State.canAfford(cost) : false;
    const costStr  = cost
      ? Object.entries(cost).map(([r, v]) =>
          `<span class="${(State.data.inventory[r]||0) >= v ? 'ok' : 'short'}">${Utils.emojiMap?.[r] || '📦'}${v}</span>`
        ).join(' ')
      : '';

    const sessionActive = !!this._tickInterval;

    screen.innerHTML = `
      <div class="power-panel">
        <div class="power-header">
          <div class="power-title">🚴 DYNAMO BIKE</div>
          <div class="power-summary">
            <span style="color:#00e5ff">Lv ${level}/10</span>
            <span style="color:#ffd600">⚡ ${this._liveWatts(level)} W now</span>
            ${maxStor > 0 ? `<span style="color:#29b6f6">🔋 ${batPct}%</span>` : '<span style="color:#888">No battery</span>'}
          </div>
        </div>

        <div class="dynamo-desc">
          Pedal to generate electricity. The harder you pedal (higher CPM), the more power you produce.
          Power flows directly to your battery — or is wasted if you have none built.
        </div>

        <!-- Live session panel -->
        <div class="dynamo-session-panel">
          <div class="dynamo-cpm-display" id="dynamo-cpm-display">
            ${sessionActive ? this._cpmDisplay() : '<span style="color:#555">— not pedalling —</span>'}
          </div>
          <div class="dynamo-wh-display" id="dynamo-wh-display">
            ${sessionActive ? `+${this._sessionWh.toFixed(2)} Wh this session` : ''}
          </div>

          ${level > 0
            ? `<button class="btn-pixel ${sessionActive ? 'btn-danger' : 'btn-primary'} dynamo-session-btn"
                id="btn-dynamo-session"
                onclick="DynamoBike.${sessionActive ? 'stopSession' : 'startSession'}()">
                ${sessionActive ? '⏹ STOP PEDALLING' : '▶ START PEDALLING'}
              </button>`
            : `<p style="color:#888;text-align:center">Build the dynamo first to start pedalling.</p>`
          }
        </div>

        <!-- Build / upgrade -->
        <div class="power-section-title">
          ${level === 0 ? 'BUILD DYNAMO BIKE' : 'UPGRADE'}
        </div>
        <div class="gen-pips" style="margin: 8px 0">${pips}</div>
        ${canBuild ? `
          <div class="gen-upg-row next">
            <span class="gen-upg-lv">Lv ${nextLvl}</span>
            <span class="gen-upg-out">+${(nextLvl * 2).toFixed(0)}W max</span>
            <span class="gen-upg-cost">${costStr}</span>
            <button class="btn-gen-upgrade"
              onclick="DynamoBike.build()"
              ${canAfford ? '' : 'disabled'}>
              ${level === 0 ? '▲ BUILD' : '▲ UPGRADE'}
            </button>
          </div>
        ` : '<div class="gen-maxed">✨ MAX LEVEL</div>'}

        <button class="btn-pixel btn-secondary" data-goto="base" style="margin-top:14px;max-width:180px">← BACK TO BASE</button>
      </div>
    `;
  },

  // ── Start a pedalling session ─────────────
  startSession() {
    if (this._tickInterval) return;
    this._sessionWh  = 0;
    this._idleSecs   = 0;
    this._tickInterval = setInterval(() => this._tick(), 1000);
    this.renderScreen();
    Utils.toast('🚴 Pedalling session started!', 'info', 2000);
  },

  // ── Stop the session ──────────────────────
  stopSession() {
    if (!this._tickInterval) return;
    clearInterval(this._tickInterval);
    this._tickInterval = null;
    const total = parseFloat(this._sessionWh.toFixed(2));
    Events.emit('power:dynamo:stop', { totalWh: total });
    Utils.toast(`⚡ Session ended. Generated ${total} Wh.`, 'good', 3000);
    this._sessionWh = 0;
    this._idleSecs  = 0;
    this.renderScreen();
  },

  // ── Per-second session tick ───────────────
  _tick() {
    const level  = Math.max(
      State.data.base.buildings?.dynamo_bike?.level || 0,
      State.data.power?.generators?.bike?.level     || 0
    );
    if (level === 0) { this.stopSession(); return; }

    const cpm    = State.data.cadence?.clicksPerMinute || 0;
    const tgt    = State.data.cadence?.targetCPM       || 60;
    const ratio  = Utils.clamp(cpm / tgt, 0, 2);
    const watts  = level * 2.0 * Math.max(0.2, ratio);
    const wh     = watts / 3600; // 1 second worth of generation

    // Track idle
    if (cpm < 5) {
      this._idleSecs++;
    } else {
      this._idleSecs = 0;
    }

    // Add to battery if available
    const p = State.data.power;
    if (p) {
      const maxStor = Power.getMaxStorage();
      if (maxStor > 0) {
        p.stored = Utils.clamp((p.stored || 0) + wh, 0, maxStor);
      }
    }

    this._sessionWh += wh;
    Events.emit('power:dynamo:tick', { watts, whThisTick: wh });

    // Update live display without full re-render
    const cpmEl = document.getElementById('dynamo-cpm-display');
    const whEl  = document.getElementById('dynamo-wh-display');
    if (cpmEl) cpmEl.innerHTML = this._cpmDisplay();
    if (whEl)  whEl.textContent = `+${this._sessionWh.toFixed(2)} Wh this session`;

    // Auto-stop on idle
    if (this._idleSecs >= this._IDLE_CUTOFF) {
      this.stopSession();
    }
  },

  // ── Build / upgrade ───────────────────────
  build() {
    const bldLvl  = State.data.base.buildings?.dynamo_bike?.level || 0;
    const nextLvl = bldLvl + 1;
    if (nextLvl > 10) return;

    const cost = this._upgradeCost(nextLvl);
    if (!State.canAfford(cost)) {
      Utils.toast('❌ Cannot afford this!', 'bad');
      return;
    }

    Object.entries(cost).forEach(([r, v]) => State.consumeResource(r, v));

    // Sync both state locations
    if (!State.data.base.buildings.dynamo_bike) {
      State.data.base.buildings.dynamo_bike = { level: 0, name: 'Dynamo Bike', emoji: '🚴' };
    }
    State.data.base.buildings.dynamo_bike.level = nextLvl;
    State.data.power.generators.bike.level      = nextLvl;

    Utils.toast(`🚴 Dynamo Bike ${nextLvl === 1 ? 'built' : 'upgraded to Lv' + nextLvl}!`, 'good', 3000);
    Audio.sfxCraft?.();
    Events.emit('map:changed');
    Events.emit('hud:update');
    this.renderScreen();
  },

  // ── Helpers ───────────────────────────────
  _liveWatts(level) {
    const cpm   = State.data.cadence?.clicksPerMinute || 0;
    const tgt   = State.data.cadence?.targetCPM       || 60;
    const ratio = Utils.clamp(cpm / tgt, 0, 2);
    return (level * 2.0 * Math.max(0.2, ratio)).toFixed(1);
  },

  _cpmDisplay() {
    const cpm = State.data.cadence?.clicksPerMinute || 0;
    const tgt = State.data.cadence?.targetCPM       || 60;
    const pct = Utils.clamp(Math.round((cpm / tgt) * 100), 0, 200);
    const col = cpm >= tgt ? '#4caf50' : cpm > tgt * 0.5 ? '#ffd600' : '#e53935';
    return `<span style="color:${col};font-size:1.4em">${cpm} CPM</span>
            <span style="color:#888;font-size:0.85em"> / ${tgt} target (${pct}%)</span>`;
  },

  _upgradeCost(level) {
    return {
      metal:       Math.ceil(3 * (0.8 + level * 0.4)),
      rope:        Math.ceil(2 * (0.8 + level * 0.4)),
      electronics: Math.ceil(1 * (0.8 + level * 0.4)),
    };
  },
};

// ── Event subscriptions ───────────────────
Events.on('dynamo_bike:render', () => {
  DynamoBike.renderScreen?.();
});
