// ═══════════════════════════════════════════
// PEDAL OR DIE — DynamoBike.js
// Dynamo Bike building: SVG art + screen rendering
//
// Called by:
//   base.js  → DynamoBike.svg(x, y, level)       — SVG on base map
//   base.js  → Events.emit('dynamo_bike:render')  — open building screen
//
// Level is synced across:
//   State.data.base.buildings.dynamo_bike.level   (building tier)
//   State.data.power.generators.bike.level        (generator output)
//   DynamoBike.build() keeps both in sync.
//
// Emits:
//   power:dynamo:tick  { watts, whThisTick }  — each second while pedalling
//   power:dynamo:stop  { totalWh }            — when session ends
// ═══════════════════════════════════════════

const DynamoBike = {

  // ── Session state ─────────────────────────
  _tickInterval: null,
  _sessionWh:    0,
  _idleSecs:     0,
  _IDLE_CUTOFF:  3,
  _keyHandler:   null,

  // ── SVG art for the base map ──────────────
  svg(x, y, level) {
    const col  = level >= 5 ? '#00e5ff' : level >= 3 ? '#29b6f6' : '#0288d1';
    const glow = level >= 3
      ? `<circle cx="0" cy="-10" r="${10 + level}" fill="${col}" opacity="0.08"/>`
      : '';
    return `<g transform="translate(${x},${y})" style="cursor:pointer">
      ${glow}
      <ellipse cx="2" cy="14" rx="20" ry="5" fill="rgba(0,0,0,0.25)"/>
      <line x1="-14" y1="4"  x2="0"   y2="-12" stroke="${col}" stroke-width="3" stroke-linecap="round"/>
      <line x1="0"   y1="-12" x2="16" y2="4"   stroke="${col}" stroke-width="3" stroke-linecap="round"/>
      <line x1="-14" y1="4"  x2="16"  y2="4"   stroke="${col}" stroke-width="2" stroke-linecap="round"/>
      <line x1="2"   y1="-12" x2="2"  y2="-18" stroke="${col}" stroke-width="2"/>
      <rect x="-4"  y="-20" width="12" height="3" rx="1.5" fill="${col}"/>
      <line x1="16"  y1="4"  x2="16"  y2="-4"  stroke="${col}" stroke-width="2"/>
      <line x1="13"  y1="-4" x2="19"  y2="-4"  stroke="${col}" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="-14" cy="4" r="9" fill="none" stroke="${col}" stroke-width="2.5"/>
      <circle cx="16"  cy="4" r="9" fill="none" stroke="${col}" stroke-width="2.5"/>
      <circle cx="-14" cy="4" r="2" fill="${col}"/>
      <circle cx="16"  cy="4" r="2" fill="${col}"/>
      ${level >= 2 ? `
        <line x1="-14" y1="-5" x2="-14" y2="13" stroke="${col}" stroke-width="1" opacity="0.5"/>
        <line x1="-23" y1="4"  x2="-5"  y2="4"  stroke="${col}" stroke-width="1" opacity="0.5"/>` : ''}
      <text x="0" y="-26" text-anchor="middle" font-size="11" fill="#ffd600">⚡</text>
      <text x="1" y="28"  text-anchor="middle" font-size="9"  fill="${col}" font-family="monospace">Lv${level}</text>
    </g>`;
  },

  // ── Render the building screen ────────────
  renderScreen() {
    const screen = document.getElementById('screen-dynamo-bike');
    if (!screen) return;

    const bldLvl  = State.data.base.buildings?.dynamo_bike?.level || 0;
    const genLvl  = State.data.power?.generators?.bike?.level     || 0;
    const level   = Math.max(bldLvl, genLvl);
    const stored  = State.data.power?.stored || 0;
    const maxStor = Power.getMaxStorage();
    const batPct  = maxStor > 0 ? Math.round((stored / maxStor) * 100) : 0;
    const active  = !!this._tickInterval;
    const cpm     = State.data.cadence?.clicksPerMinute || 0;
    const tgt     = State.data.cadence?.targetCPM       || 60;
    const watts   = level > 0
      ? (level * 2.0 * Math.max(0.2, Utils.clamp(cpm / tgt, 0, 2))).toFixed(1)
      : '0';

    const nextLvl   = level + 1;
    const canUpgrade = nextLvl <= 10;
    const cost       = canUpgrade ? this._upgradeCost(nextLvl) : null;
    const canAfford  = cost ? State.canAfford(cost) : false;
    const costHtml   = cost
      ? Object.entries(cost).map(([r, v]) => {
          const have = State.data.inventory[r] || 0;
          return `<span class="${have >= v ? 'ok' : 'short'}">${Utils.emojiMap?.[r] || '📦'}${v}</span>`;
        }).join(' ')
      : '';

    const pips = Array.from({length: 10}, (_, i) =>
      `<div class="pow-pip ${i < level ? 'on' : ''}"></div>`
    ).join('');

    screen.innerHTML = `
      <div class="power-panel">
        <div class="power-header">
          <div class="power-title">🚴 DYNAMO BIKE</div>
          <div class="power-summary">
            <span style="color:#29b6f6">Lv ${level}/10</span>
            <span style="color:#ffd600">⚡ ${watts}W</span>
            ${maxStor > 0
              ? `<span style="color:#29b6f6">🔋 ${batPct}%</span>`
              : `<span style="color:#555">No battery built</span>`}
          </div>
        </div>

        <p class="dynamo-desc">
          Pedal to generate electricity. Higher CPM = more watts.
          Power flows to your battery — surplus is wasted without one.
        </p>

        <div class="dynamo-session-panel">
          <div class="dynamo-cpm-display" id="dynamo-cpm-display">
            ${active ? this._cpmHtml() : '<span style="color:#555">— not pedalling —</span>'}
          </div>
          <div class="dynamo-wh-display" id="dynamo-wh-display">
            ${active ? `+${this._sessionWh.toFixed(2)} Wh this session` : ''}
          </div>
          ${active
            ? `<button class="dynamo-pedal-btn" onclick="Cadence.registerClick(); Audio.sfxPedal?.();"
                style="display:block;width:100%;padding:28px 0;font-size:2em;cursor:pointer;
                       background:#1a1a2e;border:3px solid #ffd600;border-radius:8px;
                       color:#ffd600;margin:12px 0;letter-spacing:2px;user-select:none;
                       transition:background 0.08s;"
                onmousedown="this.style.background='#2a2a1e'"
                onmouseup="this.style.background='#1a1a2e'"
                onmouseleave="this.style.background='#1a1a2e'">
                🚴 PEDAL
              </button>`
            : ''
          }
          ${level > 0
            ? (active
                ? `<div id="dynamo-pedal-zone"
                      onmousedown="DynamoBike._onPedalInput(event)"
                      style="cursor:pointer;user-select:none;background:#1a1a2e;border:2px solid #ffd600;
                             border-radius:12px;padding:28px 16px;text-align:center;margin:8px 0;
                             font-size:1.8em;letter-spacing:2px;color:#ffd600;">
                     🚴 PEDAL!
                     <div style="font-size:0.5em;color:#888;margin-top:4px">click here · or tap Space / Enter</div>
                   </div>
                   <button class="btn-pixel btn-danger dynamo-session-btn"
                     onclick="DynamoBike.stopSession()">⏹ STOP</button>`
                : `<button class="btn-pixel btn-primary dynamo-session-btn"
                    onclick="DynamoBike.startSession()">▶ START PEDALLING</button>`)
            : `<p style="color:#888;text-align:center;margin-top:12px">Build the dynamo first to start pedalling.</p>`
          }
        </div>

        <div class="power-section-title">${level === 0 ? 'BUILD' : 'UPGRADE'}</div>
        <div class="gen-pips" style="margin:8px 0">${pips}</div>
        ${canUpgrade
          ? `<div class="gen-upg-row next">
              <span class="gen-upg-lv">Lv ${nextLvl}</span>
              <span class="gen-upg-out">+${nextLvl * 2}W max</span>
              <span class="gen-upg-cost">${costHtml}</span>
              <button class="btn-gen-upgrade"
                onclick="DynamoBike.build()"
                ${canAfford ? '' : 'disabled'}>
                ${level === 0 ? '▲ BUILD' : '▲ UPGRADE'}
              </button>
            </div>`
          : '<div class="gen-maxed">✨ MAX LEVEL</div>'
        }

        <button class="btn-pixel btn-secondary" data-goto="base"
          style="margin-top:16px;max-width:180px">← BACK TO BASE</button>
      </div>
    `;
  },

  // ── Start pedalling session ───────────────
  startSession() {
    if (this._tickInterval) return;
    this._sessionWh = 0;
    this._idleSecs  = 0;
    this._tickInterval = setInterval(() => this._tick(), 1000);
    Cadence.start();
    // Keyboard: Space / Enter fires a pedal click
    this._keyHandler = (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this._onPedalInput();
      }
    };
    document.addEventListener('keydown', this._keyHandler);
    this.renderScreen();
    Utils.toast('🚴 Session started! Click the pedal zone or tap Space to generate power.', 'info', 3000);
  },

  // ── Stop pedalling session ────────────────
  stopSession() {
    if (!this._tickInterval) return;
    clearInterval(this._tickInterval);
    this._tickInterval = null;
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    Cadence.stop();
    const total = parseFloat(this._sessionWh.toFixed(2));
    Events.emit('power:dynamo:stop', { totalWh: total });
    if (total > 0) Utils.toast(`⚡ Session ended — generated ${total} Wh.`, 'good', 3000);
    this._sessionWh = 0;
    this._idleSecs  = 0;
    this.renderScreen();
  },

  // ── Register one pedal input (mouse or keyboard) ──
  _onPedalInput(e) {
    if (!this._tickInterval) return;   // session must be active
    Cadence.registerClick();
    Audio.sfxPedal?.();
    // Brief visual flash on the pedal zone
    const zone = document.getElementById('dynamo-pedal-zone');
    if (zone) {
      zone.style.background = '#2a2a1e';
      setTimeout(() => { zone.style.background = '#1a1a2e'; }, 80);
    }
  },

  // ── Per-second tick ───────────────────────
  _tick() {
    const level = Math.max(
      State.data.base.buildings?.dynamo_bike?.level || 0,
      State.data.power?.generators?.bike?.level     || 0
    );
    if (level === 0) { this.stopSession(); return; }

    const cpm   = State.data.cadence?.clicksPerMinute || 0;
    const tgt   = State.data.cadence?.targetCPM       || 60;
    const ratio = Utils.clamp(cpm / tgt, 0, 2);
    const watts = level * 2.0 * Math.max(0.2, ratio);
    const wh    = watts / 3600;

    this._idleSecs = cpm < 5 ? this._idleSecs + 1 : 0;

    const p = State.data.power;
    if (p) {
      const maxStor = Power.getMaxStorage();
      if (maxStor > 0) {
        p.stored = Utils.clamp((p.stored || 0) + wh, 0, maxStor);
      }
    }

    this._sessionWh += wh;
    Events.emit('power:dynamo:tick', { watts, whThisTick: wh });

    const cpmEl = document.getElementById('dynamo-cpm-display');
    const whEl  = document.getElementById('dynamo-wh-display');
    if (cpmEl) cpmEl.innerHTML = this._cpmHtml();
    if (whEl)  whEl.textContent = `+${this._sessionWh.toFixed(2)} Wh this session`;

    if (this._idleSecs >= this._IDLE_CUTOFF) this.stopSession();
  },

  // ── Build / upgrade the building ─────────
  build() {
    const bldLvl  = State.data.base.buildings?.dynamo_bike?.level || 0;
    const nextLvl = bldLvl + 1;
    if (nextLvl > 10) return;

    const cost = this._upgradeCost(nextLvl);
    if (!State.canAfford(cost)) {
      Utils.toast('❌ Cannot afford this upgrade!', 'bad');
      return;
    }

    Object.entries(cost).forEach(([r, v]) => State.consumeResource(r, v));

    if (!State.data.base.buildings.dynamo_bike) {
      State.data.base.buildings.dynamo_bike = { level: 0, name: 'Dynamo Bike', emoji: '🚴' };
    }
    State.data.base.buildings.dynamo_bike.level = nextLvl;
    if (State.data.power?.generators?.bike) {
      State.data.power.generators.bike.level = nextLvl;
    }

    Utils.toast(
      `🚴 Dynamo Bike ${nextLvl === 1 ? 'built' : 'upgraded to Lv' + nextLvl}!`,
      'good', 3000
    );
    Audio.sfxCraft?.();
    Events.emit('map:changed');
    Events.emit('hud:update');
    this.renderScreen();
  },

  // ── Private helpers ───────────────────────
  _cpmHtml() {
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

// ── Dynamo Bike building screen ──────────────────────────────────────────
const BuildingDynamoBikeScreen = {
  getScreenData(s) {
    const lv   = s.base.buildings.dynamo_bike?.level || 0;
    const gen  = s.power?.generators?.bike;
    const maxW = [0, 8, 16, 24, 32, 40][lv] || 0;
    const cpm  = s.cadence?.clicksPerMinute || 0;
    const tgt  = s.cadence?.targetCPM || 60;
    const ratio = Math.min(cpm / tgt, 2);
    const actual = lv > 0 ? Math.round(maxW * ratio * 10) / 10 : 0;

    const visual = `<div style="font-size:2.8em;text-align:center;padding:12px">🚴⚡</div>`;
    const statsRows = lv === 0
      ? `<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>`
      : `<div class="bsc-row"><span>Level</span><span>${lv} / 5</span></div>
         <div class="bsc-row ok"><span>Max output</span><span>${maxW}W</span></div>
         <div class="bsc-row"><span>Current CPM</span><span>${cpm}</span></div>
         <div class="bsc-row ok"><span>Generating now</span><span>${actual}W</span></div>`;
    const actionBtn = lv > 0
      ? `<button class="bsc-action-btn" onclick="Events.emit('navigate',{screen:'dynamo-bike'});Events.emit('dynamo_bike:render')">🚴 PEDAL DYNAMO</button>`
      : '';
    return { title: '⚡ DYNAMO BIKE', visual, statsRows, actionBtn };
  }
};
