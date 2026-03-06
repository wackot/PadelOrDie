// ═══════════════════════════════════════════
// PEDAL OR DIE — dynamo_bike.js
// Standalone Dynamo Bike building
//
// SCREEN: Click the Dynamo Bike on base → building screen
//   • Shows upgrade levels (via BuildingUpgrades.dynamo_bike)
//   • PEDAL button → starts a charging session
//   • Session runs until player stops pedalling (CPM drops to 0 for 3s)
//   • Faster pedalling = more watts generated
//   • If battery exists, surplus charges it
//   • Emits power:dynamo:tick each second with watts generated
//
// ARCHITECTURE: Layer 3 — Domain Module
//   Reads:  State.data.power, State.data.cadence, State.data.base.buildings
//   Writes: State.data.power.stored (via event only)
//   Emits:  power:dynamo:tick  { watts }
//           power:dynamo:stop  { totalWh }
//           hud:update
//   Never calls: Power.js directly
// ═══════════════════════════════════════════

const DynamoBike = {

  _active:      false,
  _sessionWh:   0,       // watt-hours generated this session
  _idleSecs:    0,       // seconds without pedalling
  _ticker:      null,
  _IDLE_CUTOFF: 3,       // seconds of no pedalling before session ends

  // ── Watts per level per CPM-ratio ────────
  // Level 1: up to 8W at full pace. Level 5: 40W. Level 10: 80W.
  _wattsPerLevel: 8,

  // ── Building screen ───────────────────────
  renderScreen() {
    const screen = document.getElementById('screen-dynamo-bike');
    if (!screen) return;

    const bldLvl  = State.data.base.buildings?.dynamo_bike?.level || 0;
    const upg     = BuildingUpgrades.dynamo_bike;
    const p       = State.data.power;
    const batMax  = typeof Power !== 'undefined' ? Power.getMaxStorage() : 0;
    const batNow  = p?.stored || 0;
    const batPct  = batMax > 0 ? Math.round((batNow / batMax) * 100) : 0;
    const dynLvl  = p?.generators?.bike?.level || 0;

    // Upgrade levels list
    const upgRows = upg.levels.map((lv, i) => {
      const lvNum = i + 1;
      if (lvNum <= bldLvl) return ''; // already built
      const canAfford = Object.entries(lv.cost).every(([r,v]) => (State.data.inventory[r]||0) >= v);
      const costStr   = Object.entries(lv.cost)
        .map(([r,v]) => `${Utils.emojiMap[r]||'📦'}${v} ${r}`).join('  ') || 'Free';
      const isCurrent = lvNum === bldLvl + 1;
      return `
        <div class="db-upgrade-row ${isCurrent ? 'next' : 'future'} ${!isCurrent ? 'dim' : ''}">
          <div class="db-upg-title">Lv${lvNum} — ${lv.desc}</div>
          <div class="db-upg-cost">${costStr}</div>
          ${isCurrent ? `<button class="btn-pixel btn-primary db-build-btn"
            onclick="DynamoBike.build()" ${canAfford?'':'disabled'}>
            ${bldLvl===0?'🔧 BUILD':'▲ UPGRADE'}
          </button>` : ''}
        </div>`;
    }).join('');

    // Session section — only show if built
    const sessionHtml = bldLvl > 0 ? `
      <div class="db-session-wrap" id="db-session-wrap">
        <div class="db-session-stats">
          <div class="db-stat-row">
            <span class="db-stat-label">⚡ Max output this level</span>
            <span class="db-stat-val">${bldLvl * this._wattsPerLevel}W</span>
          </div>
          <div class="db-stat-row">
            <span class="db-stat-label">🔋 Battery</span>
            <span class="db-stat-val">${batMax > 0 ? `${Math.round(batNow)}/${batMax} Wh (${batPct}%)` : 'No battery built'}</span>
          </div>
          <div class="db-stat-row">
            <span class="db-stat-label">📊 Dynamo level</span>
            <span class="db-stat-val">Lv${dynLvl}/10</span>
          </div>
        </div>

        <div id="db-active-panel" class="hidden">
          <div class="db-live-watts" id="db-live-watts">0W</div>
          <div class="db-session-wh">Session total: <span id="db-session-wh">0.0</span> Wh</div>
          <div class="db-bat-bar-wrap">
            <div class="db-bat-bar" id="db-bat-bar" style="width:${batPct}%"></div>
          </div>
          <div class="db-bat-label" id="db-bat-label">${batMax > 0 ? `🔋 ${Math.round(batNow)}/${batMax} Wh` : 'No battery'}</div>
          <div class="db-idle-warn hidden" id="db-idle-warn">⚠ Pedal faster or session ends!</div>
          <!-- Cadence bar injected here -->
          <div class="cadence-section" style="padding:0 12px;margin-top:8px">
            <p class="cadence-label">PEDAL SPEED</p>
            <div class="cadence-bar-wrap">
              <div class="cadence-bar" id="cadence-bar"></div>
              <div class="cadence-target" id="cadence-target-line"></div>
            </div>
            <p class="cadence-cpm" id="cadence-cpm">0 CPM</p>
          </div>
          <button class="btn-pixel btn-secondary" style="width:100%;margin-top:10px"
            onclick="DynamoBike.stopSession()">⏹ STOP PEDALLING</button>
        </div>

        <div id="db-idle-panel">
          <p class="db-hint">Pedal the dynamo bike to charge your battery.<br>
            Faster pedalling = more watts. Stop pedalling and the session ends.</p>
          <button class="btn-pixel btn-primary" style="width:100%;margin-top:10px"
            id="btn-dynamo-pedal" onclick="DynamoBike.startSession()">
            🚴 START PEDALLING
          </button>
        </div>
      </div>` : `
      <div class="db-locked-msg">🔧 Build the Dynamo Bike first to use it.</div>`;

    screen.innerHTML = `
      <div class="db-screen">
        <div class="db-header">
          <span class="db-title">⚡ DYNAMO BIKE</span>
          <span class="db-level">Lv ${bldLvl}/5</span>
        </div>
        <div class="db-desc">Pedal to generate electricity. Charges your battery bank directly.</div>

        ${bldLvl < upg.levels.length ? `
        <div class="db-section-title">UPGRADES</div>
        <div class="db-upgrades">${upgRows}</div>` : '<div class="db-maxed">✨ FULLY UPGRADED</div>'}

        ${sessionHtml}

        <button class="btn-pixel btn-secondary" data-goto="base"
          style="margin-top:14px;max-width:180px">← BACK TO BASE</button>
      </div>
    `;

    // Bind pedal button for touch + click (same pattern as travel HUD)
    const btn = document.getElementById('btn-dynamo-pedal');
    if (btn) {
      let lastTouch = 0;
      btn.addEventListener('touchstart', e => {
        e.preventDefault(); lastTouch = Date.now();
        this.startSession();
      }, { passive: false });
      btn.addEventListener('click', () => {
        if (Date.now() - lastTouch > 300) this.startSession();
      });
    }
  },

  // ── Build / upgrade ───────────────────────
  build() {
    const bldLvl = State.data.base.buildings?.dynamo_bike?.level || 0;
    const upg    = BuildingUpgrades.dynamo_bike;
    const nextLv = bldLvl + 1;
    if (nextLv > upg.levels.length) return;

    const lv = upg.levels[nextLv - 1];
    const canAfford = Object.entries(lv.cost).every(([r,v]) => (State.data.inventory[r]||0) >= v);
    if (!canAfford) { Utils.toast('❌ Not enough resources!', 'bad'); return; }

    Object.entries(lv.cost).forEach(([r,v]) => State.consumeResource(r, v));

    if (!State.data.base.buildings.dynamo_bike) {
      State.data.base.buildings.dynamo_bike = { level: 0, name:'Dynamo Bike', emoji:'⚡' };
    }
    State.data.base.buildings.dynamo_bike.level = nextLv;

    // Sync generator level in power state
    if (!State.data.power.generators.bike) State.data.power.generators.bike = { level: 0 };
    State.data.power.generators.bike.level = nextLv;

    Utils.toast(`⚡ Dynamo Bike ${nextLv === 1 ? 'built' : 'upgraded to Lv' + nextLv}! Max output: ${nextLv * this._wattsPerLevel}W`, 'good', 3500);
    Audio.sfxCraft?.();
    Events.emit('map:changed');
    this.renderScreen();
  },

  // ── Start a pedalling session ─────────────
  startSession() {
    if (this._active) return;
    const bldLvl = State.data.base.buildings?.dynamo_bike?.level || 0;
    if (bldLvl === 0) return;

    this._active    = true;
    this._sessionWh = 0;
    this._idleSecs  = 0;

    Cadence.start();
    Audio.play?.('power');

    // Show active panel
    document.getElementById('db-idle-panel')?.classList.add('hidden');
    document.getElementById('db-active-panel')?.classList.remove('hidden');

    this._ticker = setInterval(() => this._tick(), 1000);
  },

  // ── Per-second tick ───────────────────────
  _tick() {
    if (!this._active) return;

    const bldLvl = State.data.base.buildings?.dynamo_bike?.level || 0;
    const cpm    = State.data.cadence?.clicksPerMinute ?? 0;
    const target = State.data.cadence?.targetCPM || 60;
    const ratio  = Utils.clamp(cpm / target, 0, 2);

    // Watts this second (as Wh since 1 second = 1/3600 hour, but we simplify to game scale)
    // At ratio=1 (target CPM), output = level * wattsPerLevel * 1.0
    // We accumulate in "game Wh" — each second at full output = 1 game Wh
    const watts = bldLvl * this._wattsPerLevel * Math.max(0, ratio);
    const whThisTick = watts / 60; // divide by 60 so a minute of full pedalling = level*wattsPerLevel Wh

    if (ratio < 0.1) {
      this._idleSecs++;
      document.getElementById('db-idle-warn')?.classList.remove('hidden');
    } else {
      this._idleSecs = 0;
      document.getElementById('db-idle-warn')?.classList.add('hidden');
    }

    // Add to battery if one exists
    const p      = State.data.power;
    const batMax = typeof Power !== 'undefined' ? Power.getMaxStorage() : 0;
    if (batMax > 0 && whThisTick > 0) {
      p.stored = Math.min(batMax, (p.stored || 0) + whThisTick);
    }

    this._sessionWh += whThisTick;

    // Emit so power module / HUD can react
    Events.emit('power:dynamo:tick', { watts, whThisTick });
    Events.emit('hud:update');

    // Update live UI
    this._updateLiveUI(watts, p, batMax);

    // End session if idle too long
    if (this._idleSecs >= this._IDLE_CUTOFF) {
      this.stopSession();
    }
  },

  // ── Update live display ───────────────────
  _updateLiveUI(watts, p, batMax) {
    const wattsEl = document.getElementById('db-live-watts');
    const whEl    = document.getElementById('db-session-wh');
    const barEl   = document.getElementById('db-bat-bar');
    const lblEl   = document.getElementById('db-bat-label');

    if (wattsEl) {
      wattsEl.textContent = `${watts.toFixed(1)}W`;
      wattsEl.style.color = watts > 0 ? '#ffd600' : '#666';
    }
    if (whEl) whEl.textContent = this._sessionWh.toFixed(2);

    if (batMax > 0) {
      const pct = Math.round(((p.stored || 0) / batMax) * 100);
      if (barEl) {
        barEl.style.width = `${pct}%`;
        barEl.style.background = pct > 60 ? '#4caf50' : pct > 25 ? '#ffd600' : '#e53935';
      }
      if (lblEl) lblEl.textContent = `🔋 ${Math.round(p.stored||0)}/${batMax} Wh (${pct}%)`;
    } else {
      if (lblEl) lblEl.textContent = '⚠ No battery — build one to store charge!';
    }
  },

  // ── Stop session ──────────────────────────
  stopSession() {
    if (!this._active) return;
    this._active = false;
    clearInterval(this._ticker);
    this._ticker = null;

    Cadence.stop?.();

    const total = this._sessionWh.toFixed(2);
    Events.emit('power:dynamo:stop', { totalWh: parseFloat(total) });
    Events.emit('hud:update');

    if (parseFloat(total) > 0) {
      Utils.toast(`⚡ Dynamo session complete! +${total} Wh generated.`, 'good', 3500);
    } else {
      Utils.toast('⚡ Dynamo session ended — no power generated.', 'info', 2000);
    }

    // Return to idle UI
    document.getElementById('db-active-panel')?.classList.add('hidden');
    document.getElementById('db-idle-panel')?.classList.remove('hidden');
    document.getElementById('db-idle-warn')?.classList.add('hidden');

    this._sessionWh = 0;
    this._idleSecs  = 0;

    // Refresh battery display
    this.renderScreen();
  },
};

// ── Event subscriptions ────────────────────────────────────────────────────

// Base emits this when player clicks the dynamo bike building
Events.on('dynamo_bike:render', () => {
  setTimeout(() => DynamoBike.renderScreen(), 50);
});

// ── SVG art for base map ───────────────────────────────────────────────────
DynamoBike.svg = function(x, y, level) {
  const glow = level >= 3 ? 'filter="url(#glow-electric)"' : '';
  const col  = level >= 4 ? '#ffd600' : level >= 2 ? '#ff9800' : '#888';
  // Simple dynamo bike silhouette: frame + wheel + generator coil
  return `
    <g transform="translate(${x},${y})" ${glow} style="cursor:pointer">
      <!-- Stand/frame -->
      <rect x="-22" y="10" width="44" height="6" rx="2" fill="#444" stroke="#222" stroke-width="1"/>
      <!-- Rear wheel -->
      <circle cx="-14" cy="10" r="13" fill="none" stroke="${col}" stroke-width="3"/>
      <circle cx="-14" cy="10" r="4"  fill="${col}" opacity="0.6"/>
      <!-- Frame tube -->
      <line x1="-14" y1="-3" x2="8" y2="-3" stroke="${col}" stroke-width="3" stroke-linecap="round"/>
      <line x1="-14" y1="-3" x2="-14" y2="10" stroke="${col}" stroke-width="2"/>
      <!-- Generator box -->
      <rect x="4" y="-12" width="18" height="14" rx="3" fill="#1a2a1a" stroke="${col}" stroke-width="2"/>
      <text x="13" y="-2" text-anchor="middle" font-size="8" fill="${col}">⚡</text>
      <!-- Level indicator -->
      <text x="0" y="30" text-anchor="middle" font-size="9"
        fill="${col}" font-family="monospace">Lv${level}</text>
      ${level >= 3 ? `<!-- Sparks -->
        <circle cx="22" cy="-12" r="3" fill="#ffd600" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="0.6s" repeatCount="indefinite"/>
        </circle>` : ''}
    </g>`;
};
