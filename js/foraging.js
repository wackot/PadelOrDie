// ═══════════════════════════════════════════
// PEDAL OR DIE — foraging.js
//
// RESOURCE GATHERING (the real rules):
//   • 1 resource GUARANTEED every second, always
//   • Speed multiplier: ratio 0→1.5× (idle=0.5×, target=1×, max=2×)
//   • Gathering PAUSES only during active encounter combat
//   • Monster win = loot drop ADDED to gathered
//
// ENCOUNTER COMBAT:
//   • CPM < target:       lose timer ticks (+1/sec), 15s = forced retreat
//   • CPM ≥ target×0.8:   light damage per second + click damage  (72+ CPM)
//   • CPM ≥ target×1.1:   heavy damage per second + click damage  (99+ CPM)
//
// SURVIVAL DRAIN:
//   • Pedalling slows hunger/thirst drain (handled in daynight.js)
// ═══════════════════════════════════════════

const Foraging = {

  _locationId:       null,
  _duration:         60,
  _elapsed:          0,
  _timer:            null,
  _gathered:         {},
  _active:           false,
  _encounterActive:  false,
  _currentEncounter: null,
  _encounterHP:      0,
  _encounterMaxHP:   0,
  _encounterLoseTimer: 0,
  _log:              [],

  // Public API — use this instead of reading Foraging._active directly
  isActive() { return this._active; },
  _intensityCfg:     null,

  // Emoji map covers all resource keys including unique materials
  emojiMap: {
    wood:'🪵', metal:'🔩', gasoline:'⛽', food:'🥫', water:'💧',
    medicine:'💊', cloth:'🧶', electronics:'📟', rope:'🪢', chemicals:'🧪',
    spores:'🍄', wild_seeds:'🌱', engine_parts:'⚙️', scrap_wire:'🔌',
    circuit_board:'💾', antiseptic:'🧫', cave_crystal:'💎', military_chip:'🎖️'
  },

  // ── Start expedition ──────────────────────
  start(locationId, intensityCfg) {
    const loc = State.locations[locationId];
    if (!loc) return;

    // Night foraging check
    const isNight   = State.data.world.isNight;
    const hasLight  = State.data.base.bikeHasLight || false;
    if (isNight && !hasLight) {
      Utils.toast('🌙 Too dark to forage safely! Upgrade bike to Lv3 for a headlight.', 'warn', 4000);
      return;
    }
    if (isNight && hasLight) {
      const nightMult = State.data.base.bikeNightMult || 1.0;
      const nightEncReduction = State.data.base.bikeNightEncounterReduction || 0;
      Utils.toast(`🌙 Night run! Rewards ×${nightMult.toFixed(1)}. Watch out — raiders are angrier!`, 'warn', 4000);
    }

    this._intensityCfg    = intensityCfg || { lootMult:1, durationMult:1, encounterMult:1 };
    this._locationId      = locationId;
    this._elapsed         = 0;
    this._gathered        = {};
    this._active          = true;
    if (State.data?.world) State.data.world.playerAway = true;
    this._encounterActive = false;
    this._currentEncounter = null;
    this._encounterLoseTimer = 0;
    this._log             = [];
    this._duration        = Math.round((loc.duration || 90) * (this._intensityCfg.durationMult || 1));
    if (State.forageDurationFn) this._duration = State.forageDurationFn(this._duration);

    this._buildScreen(loc);
    Events.emit('navigate', { screen: 'foraging' });
    Cadence.start();
    Audio.play(Audio.trackForLocation(locationId));
    this._timer = setInterval(() => this._tick(), 1000);

    State.data.stats.totalExpeditions++;
    if (State.data.world.isNight) State.data.stats.nightExpeditions = (State.data.stats.nightExpeditions||0) + 1;
    Events.emit('achievements:check');
    this._log_(`🚴 Headed out to ${loc.name}`, 'info');
    this._log_(`📦 Gathering ${this._getPrimaryResource()} constantly. Pedal to multiply!`, 'good');
    console.log('[Foraging] Started:', locationId, 'duration:', this._duration, 's');
  },

  // ── Build foraging screen HTML ────────────
  _buildScreen(loc) {
    const screen = document.getElementById('screen-foraging');
    if (!screen) return;
    const nightTint = State.data.world.isNight ? 'rgba(0,0,40,0.5)' : 'transparent';
    const um = loc.uniqueMaterial;

    screen.innerHTML = `
      <div class="foraging-container">
        <div class="foraging-scene" style="background:${loc.bgColor||'#0d1a08'}">
          <div class="foraging-bg-overlay" style="background:${nightTint}"></div>
          <div class="foraging-bg-emoji">${loc.bgEmoji} ${loc.bgEmoji}</div>
          <div class="foraging-character"><div class="char-emoji" id="char-emoji">🚴</div></div>
          <div class="encounter-popup hidden" id="encounter-popup"></div>
          <div class="combat-arena hidden" id="combat-arena"></div>
        </div>

        <div class="forage-progress-wrap">
          <div class="forage-progress-bar" id="forage-progress-bar" style="width:0%"></div>
          <div class="forage-progress-label" id="forage-progress-label">🚴 HEADING OUT...</div>
        </div>

        <div class="foraging-hud">
          <div class="foraging-info">
            <span style="font-family:var(--font-pixel);font-size:clamp(0.38rem,1.5vw,0.55rem);color:var(--col-yellow)">
              ${loc.emoji} ${loc.name}
            </span>
            <span id="forage-time-left" style="font-family:var(--font-mono);font-size:1rem;color:var(--col-text-dim)">
              ⏱ ${this._duration}s
            </span>
            ${um ? `<span style="font-family:var(--font-mono);font-size:0.85rem;color:var(--col-blue)">
              ✨ Unique: ${um.emoji} ${um.name}</span>` : ''}
          </div>

          <div class="cadence-section">
            <p class="cadence-label">PEDAL SPEED — <span id="gather-rate-label" style="color:var(--col-green)">gathering 1/s</span></p>
            <div class="cadence-bar-wrap">
              <div class="cadence-bar" id="cadence-bar"></div>
              <div class="cadence-target" id="cadence-target-line"></div>
            </div>
            <p class="cadence-cpm" id="cadence-cpm">0 CPM</p>
          </div>

          <button class="btn-pedal" id="btn-pedal">
            🚴 PEDAL!
            <span class="pedal-sub" id="pedal-sub">Pedal faster = more resources + slower hunger</span>
          </button>

          <div class="foraging-resources" id="foraging-resources"></div>
          <div id="forage-raid-overlay" class="forage-raid hidden">⚠️ BASE UNDER ATTACK!<br/><small>Pedal faster!</small></div>
        </div>

        <div class="forage-log" id="forage-log"></div>
      </div>
    `;

    // Touch-first for Android, click as fallback
    const btn = document.getElementById('btn-pedal');
    if (btn) {
      let lastTouch = 0;
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        lastTouch = Date.now();
        this._onPedal();
      }, { passive: false });
      btn.addEventListener('click', () => {
        if (Date.now() - lastTouch > 300) this._onPedal();
      });
    }
  },

  // ── Pedal button pressed ──────────────────
  _onPedal() {
    if (!this._active) return;
    Cadence.registerClick();
    Audio.sfxPedal();
    // During encounter, clicks add burst damage ON TOP of per-second damage
    if (this._encounterActive) {
      this._clickDamage();
    }
  },

  // ═══════════════════════════════════════════
  // GUARANTEED RESOURCE DRIP — runs every second
  //
  // ALWAYS gives resources. Pauses ONLY during encounter.
  // Base: 1 unit/sec of location's primary resource
  // Speed multiplier: 0.5× (idle) → 1.0× (on target) → 2.0× (max)
  // ═══════════════════════════════════════════
  // Total resources gathered this trip (for carry cap)
  _totalGathered() {
    return Object.values(this._gathered).reduce((s,v) => s + v, 0);
  },

  // Max resources bike can carry per trip
  _bikeCarryCap() {
    const bikeLvl = State.data.base.buildings?.bike?.level || 1;
    // Each level adds carry capacity: lv1=30, lv10=150
    return 20 + bikeLvl * 13;
  },

  _gatherTick() {
    // NOTE: gathering continues even during encounters - you're still at the location
    const loc = State.locations[this._locationId];
    if (!loc) return;

    // Carry cap — stop gathering if bike is full
    if (this._totalGathered() >= this._bikeCarryCap()) return;

    const cargo     = State.data.base.bikeCargoBonus || State.data.base.cargoBonus || 1;
    const bike      = State.data.base.bikeEfficiency || 1;
    const isNight   = State.data.world.isNight;
    const hasLight  = State.data.base.bikeHasLight || false;
    const nightMult = (isNight && hasLight) ? (State.data.base.bikeNightMult || 1.0) : 1.0;
    const lootMult  = (this._intensityCfg?.lootMult || 1) * nightMult;

    // Primary resource for this location
    const primary = {
      forest:         { res:'wood',        base:1 },
      abandoned_farm: { res:'food',        base:1 },
      gas_station:    { res:'gasoline',    base:1 },
      city_ruins:     { res:'metal',       base:1 },
      junkyard:       { res:'metal',       base:2 },
      hospital:       { res:'medicine',    base:1 },
      cave:           { res:'chemicals',   base:1 },
      military_base:  { res:'electronics', base:1 }
    }[this._locationId] || { res:'wood', base:1 };

    // Speed multiplier: idle=0.5×, on-target=1.0×, hammering=2.0×
    const cpm    = State.data.cadence?.clicksPerMinute ?? 0;
    const target = (State.data.world.activeRaid ? State.data.cadence?.raidTargetCPM : State.data.cadence?.targetCPM) || 90;
    const ratio  = Utils.clamp(cpm / target, 0, 1.5);
    const speedMult = Utils.clamp(0.5 + ratio, 0.5, 2.0);

    // Guaranteed primary resource every second
    const amount = Math.max(1, Math.round(primary.base * speedMult * bike * lootMult * cargo));
    this._addGathered(primary.res, amount);

    // Update the gather rate label
    const rateEl = document.getElementById('gather-rate-label');
    if (rateEl) rateEl.textContent = `gathering ${amount}/s × ${speedMult.toFixed(1)}`;

    // Bonus loot roll (15–30% chance/sec depending on speed)
    const bonusChance = Utils.clamp(0.08 + ratio * 0.15, 0.08, 0.30);
    if (Math.random() < bonusChance) {
      const { resource, amount: bonusBase, tier } = this._rollLoot(loc);
      const bonusAmt = Math.max(1, Math.round(bonusBase * speedMult * lootMult * cargo));
      this._addGathered(resource, bonusAmt);
      if (tier === 'legendary') {
        Audio.sfxLegendary();
        this._log_(`🌟 LEGENDARY: ${this.emojiMap[resource]||'📦'} +${bonusAmt} ${resource}!`, 'legendary');
      } else if (tier === 'rare') {
        Audio.sfxPickup();
        this._log_(`⭐ Rare: ${this.emojiMap[resource]||'📦'} +${bonusAmt} ${resource}`, 'rare');
      }
    }

    // Unique material: 5% base chance per second, scales with speed
    const um = loc.uniqueMaterial;
    if (um && Math.random() < 0.03 + ratio * 0.04) {
      this._addGathered(um.key, 1);
      this._log_(`✨ ${um.emoji} Found 1× ${um.name}!`, 'rare');
    }

    this._renderResources();
  },

  // Helper: get primary resource name for this location
  _getPrimaryResource() {
    return {
      forest:'wood', abandoned_farm:'food', gas_station:'gasoline',
      city_ruins:'metal', junkyard:'metal', hospital:'medicine',
      cave:'chemicals', military_base:'electronics'
    }[this._locationId] || 'resources';
  },

  // Safely add to _gathered and track discoveries
  _addGathered(resource, amount) {
    // Check if resource tier is unlocked by storage building
    const tiers = State.defaults?.resourceTiers || {};
    const stCap = State.getStorageCap ? State.getStorageCap(resource) : Infinity;

    if ((tiers.B||[]).includes(resource) && (State.data.base.storageCapB||0) === 0) {
      this._log_(`🔒 ${resource} needs Storage Lv3 to collect!`, 'warn');
      return;
    }
    if ((tiers.C||[]).includes(resource) && (State.data.base.storageCapC||0) === 0) {
      this._log_(`🔒 ${resource} needs Storage Lv5 to collect!`, 'warn');
      return;
    }
    if ((tiers.D||[]).includes(resource) && (State.data.base.storageCapD||0) === 0) {
      this._log_(`🔒 ${resource} needs Storage Lv8 to collect!`, 'warn');
      return;
    }

    // Respect carry cap
    const space = this._bikeCarryCap() - this._totalGathered();
    const actual = Math.max(0, Math.min(amount, space));
    if (actual <= 0) return;

    this._gathered[resource] = (this._gathered[resource] || 0) + actual;
    State.data.stats.totalResourcesGathered += actual;
    const disc = State.data.world.discoveredResources;
    if (!disc.includes(resource)) {
      disc.push(resource);
      this._log_(`🔍 First time finding: ${resource}!`, 'good');
    }
  },

  // ── Roll location loot table ──────────────
  _rollLoot(loc) {
    const pool = [
      { tier:'common',    weight: loc.loot.common.weight    },
      { tier:'rare',      weight: loc.loot.rare.weight      },
      { tier:'legendary', weight: loc.loot.legendary.weight }
    ];
    const { tier }  = Utils.weightedRandom(pool);
    const tierData  = loc.loot[tier];
    const resource  = tierData.resources[Utils.randInt(0, tierData.resources.length - 1)];
    const amounts   = { common:[1,3], rare:[2,5], legendary:[4,8] };
    const [mn,mx]   = amounts[tier];
    return { resource, amount: Utils.randInt(mn, mx), tier };
  },

  // ═══════════════════════════════════════════
  // MAIN TICK — every 1 second
  // ═══════════════════════════════════════════
  _tick() {
    this._elapsed++;
    const remaining = this._duration - this._elapsed;

    // Timer
    const timerEl = document.getElementById('forage-time-left');
    if (timerEl) timerEl.textContent = `⏱ ${remaining}s`;

    // Progress bar
    const pct = (this._elapsed / this._duration) * 100;
    const bar = document.getElementById('forage-progress-bar');
    if (bar) bar.style.width = `${pct}%`;
    const label = document.getElementById('forage-progress-label');
    if (label) {
      const phases = [[0.2,'🚴 Heading out...'],[0.4,'🗺 Exploring...'],[0.6,'🔍 Searching...'],[0.8,'📦 Gathering...'],[1.0,'🏠 Heading back...']];
      const phase = phases.find(([t]) => pct/100 <= t);
      if (phase) label.textContent = phase[1];
    }

    this._updateCharAnim();

    // GUARANTEED resource drip every second
    this._gatherTick();

    // Encounter: per-second damage/lose-timer logic
    if (this._encounterActive) {
      this._encounterTick();
    }

    // Random encounter check every 10s
    if (this._elapsed % 10 === 0 && !this._encounterActive) {
      this._checkEncounter();
    }

    // Location event every 15s
    if (this._elapsed % 15 === 0) {
      this._checkEvent();
    }

    if (remaining <= 0) this._complete();
  },

  // ═══════════════════════════════════════════
  // ENCOUNTER SYSTEM
  // ─────────────────────────────────────────
  // Gating: need CPM ≥ target × 1.20 to deal damage
  //         CPM ≥ target × 1.40 = bonus damage
  //         CPM < target        = lose timer +1/s (15s = retreat)
  // Click damage is extra on top, only when CPM ≥ target
  // ═══════════════════════════════════════════
  _checkEncounter() {
    const loc = State.locations[this._locationId];
    if (!loc?.animals?.length) return;
    const scale  = Math.min(3.0, 1 + (State.data.world.day - 1) * 0.05);
    const intMul = this._intensityCfg?.encounterMult || 1;
    if (Math.random() < loc.encounterChance * scale * intMul * (10/60)) {
      const animal = Animals.randomEncounterAnimal(this._locationId);
      if (animal) this._startEncounter(animal);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMBAT ARENA — Animated SVG battle scene
  // _startEncounter  : builds arena, hides foraging scene, shows combat
  // _arenaUpdate     : called every tick to drive animations + HP bars
  // _arenaHit        : called on each click damage — triggers hit effects
  // _arenaEnd        : cleans up, restores foraging scene
  // _monsterSVG      : returns SVG markup for each monster type
  // _playerSVG       : returns SVG markup for the player character
  // _spawnDmgFloat   : spawns a floating damage number
  // _arenaShake      : brief screen shake
  // ─────────────────────────────────────────────────────────────────────────

  _buildArenaHTML(animal) {
    const locId  = this._locationId || 'forest';
    const isNight= State.data.world.isNight;
    const bgColors = {
      forest:'#0d1a08', abandoned_farm:'#1a1500', gas_station:'#1a1000',
      city_ruins:'#0d0d12', junkyard:'#100d0d', hospital:'#100d0d',
      cave:'#050508', military_base:'#0a0a05',
      signal_drop:'#0a0d14', rescue_beacon:'#140808', black_market:'#0d0814',
      command_bunker:'#050508', endgame_transmission:'#02020a'
    };
    const bgCol = bgColors[locId] || '#0d1208';
    const groundCol = isNight ? '#0a0810' : (bgCol);

    return '<div class="ca-overlay">' +
      '<!-- HP bars row -->' +
      '<div class="ca-hpbars">' +
        '<div class="ca-hp-side player-side">' +
          '<span class="ca-hp-label">🚴 YOU</span>' +
          '<div class="ca-hp-wrap"><div class="ca-hp-fill player-hp" id="ca-player-hp" style="width:' + this._getPlayerHPPct() + '%"></div></div>' +
        '</div>' +
        '<div class="ca-vs">VS</div>' +
        '<div class="ca-hp-side monster-side">' +
          '<div class="ca-hp-wrap"><div class="ca-hp-fill monster-hp" id="ca-enemy-hp" style="width:100%"></div></div>' +
          '<span class="ca-hp-label">' + animal.name + '</span>' +
        '</div>' +
      '</div>' +
      '<!-- Arena SVG -->' +
      '<svg class="ca-svg" id="ca-svg" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid meet">' +
        '<defs>' +
          '<filter id="ca-glow-red"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
          '<filter id="ca-glow-hit"><feGaussianBlur stdDeviation="5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
          '<filter id="ca-shadow"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.6)"/></filter>' +
        '</defs>' +
        '<!-- Sky -->' +
        '<rect width="320" height="100" fill="' + (isNight?'#050510':'#0d1510') + '"/>' +
        (isNight ? '<circle cx="280" cy="20" r="10" fill="#d4d0c0" opacity="0.6"/>' +
          '<circle cx="40" cy="15" r="2" fill="white" opacity="0.7"/>' +
          '<circle cx="90" cy="25" r="1.5" fill="white" opacity="0.5"/>' +
          '<circle cx="180" cy="10" r="2" fill="white" opacity="0.6"/>' : '') +
        '<!-- Ground -->' +
        '<rect y="100" width="320" height="60" fill="' + groundCol + '"/>' +
        '<rect y="100" width="320" height="4" fill="rgba(0,0,0,0.4)"/>' +
        '<!-- Ground texture -->' +
        '<line x1="0" y1="108" x2="320" y2="108" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>' +
        '<line x1="0" y1="120" x2="320" y2="120" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>' +
        '<!-- Player character (left side) -->' +
        '<g id="ca-player" filter="url(#ca-shadow)">' +
          this._playerSVG(80, 88) +
        '</g>' +
        '<!-- Monster (right side) -->' +
        '<g id="ca-monster" filter="url(#ca-shadow)">' +
          this._monsterSVG(animal.id, 240, 88) +
        '</g>' +
        '<!-- Hit effects container -->' +
        '<g id="ca-effects"></g>' +
      '</svg>' +
      '<!-- Status text -->' +
      '<div class="ca-status" id="ca-status">⚔️ PEDAL +20% FASTER TO ATTACK!</div>' +
      '<!-- Lose timer bar -->' +
      '<div class="ca-lose-row">' +
        '<span class="ca-lose-label">⏱ <span id="ca-lose-secs">15</span>s</span>' +
        '<div class="ca-lose-wrap"><div class="ca-lose-bar" id="ca-lose-bar" style="width:0%"></div></div>' +
      '</div>' +
    '</div>';
  },

  _getPlayerHPPct() {
    const p = State.data.player;
    return Math.round((Math.min(p.hunger, p.thirst, p.energy)));
  },

  // ── Player SVG: cyclist silhouette ──────────────────────────────────────
  _playerSVG(cx, cy) {
    // Pixel-art style cycling figure, facing right
    return (
      // Shadow
      '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="18" ry="4" fill="rgba(0,0,0,0.3)"/>' +
      // Wheels
      '<circle cx="' + (cx-14) + '" cy="' + cy + '" r="12" fill="none" stroke="#555" stroke-width="3"/>' +
      '<circle cx="' + (cx-14) + '" cy="' + cy + '" r="4"  fill="#444"/>' +
      '<circle cx="' + (cx+14) + '" cy="' + cy + '" r="12" fill="none" stroke="#555" stroke-width="3"/>' +
      '<circle cx="' + (cx+14) + '" cy="' + cy + '" r="4"  fill="#444"/>' +
      // Spokes
      '<line x1="' + (cx-14) + '" y1="' + (cy-12) + '" x2="' + (cx-14) + '" y2="' + (cy+12) + '" stroke="#444" stroke-width="1"/>' +
      '<line x1="' + (cx-26) + '" y1="' + cy + '" x2="' + (cx-2) + '" y2="' + cy + '" stroke="#444" stroke-width="1"/>' +
      '<line x1="' + (cx+14) + '" y1="' + (cy-12) + '" x2="' + (cx+14) + '" y2="' + (cy+12) + '" stroke="#444" stroke-width="1"/>' +
      '<line x1="' + (cx+2) + '" y1="' + cy + '" x2="' + (cx+26) + '" y2="' + cy + '" stroke="#444" stroke-width="1"/>' +
      // Frame
      '<line x1="' + (cx-14) + '" y1="' + cy + '" x2="' + (cx+3) + '" y2="' + (cy-16) + '" stroke="#4a8a4a" stroke-width="3"/>' +
      '<line x1="' + (cx+3) + '" y1="' + (cy-16) + '" x2="' + (cx+14) + '" y2="' + cy + '" stroke="#4a8a4a" stroke-width="3"/>' +
      '<line x1="' + (cx-14) + '" y1="' + cy + '" x2="' + (cx+3) + '" y2="' + (cy-16) + '" stroke="#5aaa5a" stroke-width="1.5"/>' +
      // Seat post + seat
      '<line x1="' + (cx+3) + '" y1="' + (cy-16) + '" x2="' + (cx-2) + '" y2="' + (cy-26) + '" stroke="#3a7a3a" stroke-width="2.5"/>' +
      '<rect x="' + (cx-8) + '" y="' + (cy-29) + '" width="14" height="4" fill="#666" rx="2"/>' +
      // Handlebar stem
      '<line x1="' + (cx+3) + '" y1="' + (cy-16) + '" x2="' + (cx+12) + '" y2="' + (cy-22) + '" stroke="#3a7a3a" stroke-width="2.5"/>' +
      '<line x1="' + (cx+10) + '" y1="' + (cy-18) + '" x2="' + (cx+14) + '" y2="' + (cy-26) + '" stroke="#666" stroke-width="2"/>' +
      // Rider body (leaning forward, aggressive)
      '<line x1="' + (cx-2) + '" y1="' + (cy-25) + '" x2="' + (cx+10) + '" y2="' + (cy-38) + '" stroke="#c0a060" stroke-width="5"/>' + // torso
      // Arms
      '<line x1="' + (cx+10) + '" y1="' + (cy-38) + '" x2="' + (cx+14) + '" y2="' + (cy-26) + '" stroke="#c0a060" stroke-width="3.5"/>' +
      // Head
      '<circle cx="' + (cx+12) + '" cy="' + (cy-43) + '" r="8" fill="#c0a060"/>' +
      '<circle cx="' + (cx+12) + '" cy="' + (cy-43) + '" r="9" fill="none" stroke="#4a7a4a" stroke-width="2"/>' + // helmet
      // Legs (pedalling)
      '<line x1="' + (cx-2) + '" y1="' + (cy-25) + '" x2="' + (cx-8) + '" y2="' + (cy-10) + '" stroke="#c0a060" stroke-width="4"/>' + // thigh down
      '<line x1="' + (cx-8) + '" y1="' + (cy-10) + '" x2="' + (cx-4) + '" y2="' + cy + '" stroke="#c0a060" stroke-width="3.5"/>' + // shin
      '<line x1="' + (cx-2) + '" y1="' + (cy-25) + '" x2="' + (cx+8) + '" y2="' + (cy-12) + '" stroke="#c0a060" stroke-width="4"/>' + // thigh up
      '<line x1="' + (cx+8) + '" y1="' + (cy-12) + '" x2="' + (cx+5) + '" y2="' + cy + '" stroke="#c0a060" stroke-width="3.5"/>' + // shin back
      // Weapon (improvised — wrench in fist)
      '<line x1="' + (cx+14) + '" y1="' + (cy-26) + '" x2="' + (cx+28) + '" y2="' + (cy-38) + '" stroke="#8a8a8a" stroke-width="4"/>' +
      '<rect x="' + (cx+24) + '" y="' + (cy-44) + '" width="8" height="5" fill="#7a7a7a" rx="1"/>' +
      '<rect x="' + (cx+25) + '" y="' + (cy-48) + '" width="6" height="4" fill="#7a7a7a" rx="1"/>'
    );
  },

  // ── Monster SVG: unique pixel-art per animal type ───────────────────────
  _monsterSVG(animalId, cx, cy) {
    // All monsters face LEFT (toward player)
    const s = (parts) => '<g>' + parts + '</g>';
    switch(animalId) {

      case 'wolf': {
        // Quadruped wolf, snarling, low to ground
        return (
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="22" ry="4" fill="rgba(0,0,0,0.3)"/>' +
          // Body
          '<ellipse cx="' + cx + '" cy="' + (cy-10) + '" rx="22" ry="12" fill="#5a5050" transform="rotate(-5 ' + cx + ' ' + (cy-10) + ')"/>' +
          // Head (pushed forward left)
          '<ellipse cx="' + (cx-22) + '" cy="' + (cy-14) + '" rx="13" ry="10" fill="#5a5050"/>' +
          // Snout
          '<ellipse cx="' + (cx-32) + '" cy="' + (cy-11) + '" rx="8" ry="6" fill="#4a4040"/>' +
          // Mouth open with teeth
          '<line x1="' + (cx-40) + '" y1="' + (cy-9) + '" x2="' + (cx-24) + '" y2="' + (cy-9) + '" stroke="#e53935" stroke-width="2"/>' +
          '<polygon points="' + (cx-38) + ',' + (cy-9) + ' ' + (cx-36) + ',' + (cy-5) + ' ' + (cx-34) + ',' + (cy-9) + '" fill="white"/>' +
          '<polygon points="' + (cx-32) + ',' + (cy-9) + ' ' + (cx-30) + ',' + (cy-5) + ' ' + (cx-28) + ',' + (cy-9) + '" fill="white"/>' +
          // Eye (angry red)
          '<circle cx="' + (cx-24) + '" cy="' + (cy-17) + '" r="3" fill="#e53935"/>' +
          '<circle cx="' + (cx-24) + '" cy="' + (cy-17) + '" r="1.5" fill="#600"/>' +
          // Ears
          '<polygon points="' + (cx-18) + ',' + (cy-24) + ' ' + (cx-14) + ',' + (cy-36) + ' ' + (cx-10) + ',' + (cy-24) + '" fill="#5a5050"/>' +
          '<polygon points="' + (cx-6) + ',' + (cy-22) + ' ' + (cx-2) + ',' + (cy-33) + ' ' + (cx+2) + ',' + (cy-22) + '" fill="#5a5050"/>' +
          // Tail (up and curled)
          '<path d="M' + (cx+22) + ',' + (cy-8) + ' Q' + (cx+36) + ',' + (cy-30) + ' ' + (cx+28) + ',' + (cy-38) + '" fill="none" stroke="#5a5050" stroke-width="5" stroke-linecap="round"/>' +
          // Legs
          '<line x1="' + (cx-16) + '" y1="' + (cy-2) + '" x2="' + (cx-20) + '" y2="' + (cy+4) + '" stroke="#4a4040" stroke-width="4"/>' +
          '<line x1="' + (cx-8) + '" y1="' + (cy-2) + '" x2="' + (cx-10) + '" y2="' + (cy+4) + '" stroke="#4a4040" stroke-width="4"/>' +
          '<line x1="' + (cx+8) + '" y1="' + (cy-2) + '" x2="' + (cx+10) + '" y2="' + (cy+4) + '" stroke="#4a4040" stroke-width="4"/>' +
          '<line x1="' + (cx+16) + '" y1="' + (cy-2) + '" x2="' + (cx+18) + '" y2="' + (cy+4) + '" stroke="#4a4040" stroke-width="4"/>' +
          // Mutation: extra eyes
          '<circle cx="' + (cx-20) + '" cy="' + (cy-16) + '" r="2" fill="#ef5350" opacity="0.7"/>'
        );
      }

      case 'boar': {
        return (
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="24" ry="4" fill="rgba(0,0,0,0.3)"/>' +
          // Massive body
          '<ellipse cx="' + (cx+2) + '" cy="' + (cy-10) + '" rx="24" ry="15" fill="#5a4a3a"/>' +
          // Neck/head
          '<ellipse cx="' + (cx-20) + '" cy="' + (cy-10) + '" rx="14" ry="12" fill="#5a4a3a"/>' +
          // Snout (big)
          '<ellipse cx="' + (cx-32) + '" cy="' + (cy-7) + '" rx="9" ry="7" fill="#4a3a2a"/>' +
          // Tusks (curving up)
          '<path d="M' + (cx-38) + ',' + (cy-6) + ' Q' + (cx-44) + ',' + (cy-2) + ' ' + (cx-42) + ',' + (cy-14) + '" fill="none" stroke="#e8d080" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M' + (cx-34) + ',' + (cy-6) + ' Q' + (cx-38) + ',' + (cy-2) + ' ' + (cx-36) + ',' + (cy-14) + '" fill="none" stroke="#e8d080" stroke-width="3" stroke-linecap="round"/>' +
          // Nostrils
          '<circle cx="' + (cx-34) + '" cy="' + (cy-8) + '" r="2" fill="#3a2a1a"/>' +
          '<circle cx="' + (cx-30) + '" cy="' + (cy-7) + '" r="2" fill="#3a2a1a"/>' +
          // Eye
          '<circle cx="' + (cx-22) + '" cy="' + (cy-14) + '" r="3" fill="#cc2200"/>' +
          // Mohawk spine
          '<path d="M' + (cx-10) + ',' + (cy-22) + ' Q' + (cx+5) + ',' + (cy-30) + ' ' + (cx+20) + ',' + (cy-24) + '" fill="none" stroke="#7a5a3a" stroke-width="4" stroke-linecap="round"/>' +
          // Legs
          '<rect x="' + (cx-20) + '" y="' + (cy-2) + '" width="7" height="8" fill="#4a3a2a" rx="1"/>' +
          '<rect x="' + (cx-8) + '" y="' + (cy-2) + '" width="7" height="8" fill="#4a3a2a" rx="1"/>' +
          '<rect x="' + (cx+6) + '" y="' + (cy-2) + '" width="7" height="8" fill="#4a3a2a" rx="1"/>' +
          '<rect x="' + (cx+18) + '" y="' + (cy-2) + '" width="7" height="8" fill="#4a3a2a" rx="1"/>' +
          // Tail (curly)
          '<path d="M' + (cx+24) + ',' + (cy-12) + ' Q' + (cx+34) + ',' + (cy-20) + ' ' + (cx+30) + ',' + (cy-28) + ' Q' + (cx+24) + ',' + (cy-32) + ' ' + (cx+26) + ',' + (cy-24) + '" fill="none" stroke="#5a4a3a" stroke-width="3"/>'
        );
      }

      case 'rat': {
        return (
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="16" ry="3" fill="rgba(0,0,0,0.25)"/>' +
          // Long body
          '<ellipse cx="' + (cx+2) + '" cy="' + (cy-8) + '" rx="18" ry="9" fill="#6a5a5a"/>' +
          // Head
          '<ellipse cx="' + (cx-17) + '" cy="' + (cy-10) + '" rx="10" ry="8" fill="#6a5a5a"/>' +
          // Pointy snout
          '<polygon points="' + (cx-27) + ',' + (cy-13) + ' ' + (cx-38) + ',' + (cy-8) + ' ' + (cx-27) + ',' + (cy-5) + '" fill="#5a4a4a"/>' +
          // Whiskers
          '<line x1="' + (cx-28) + '" y1="' + (cy-10) + '" x2="' + (cx-44) + '" y2="' + (cy-13) + '" stroke="#aaa" stroke-width="1"/>' +
          '<line x1="' + (cx-28) + '" y1="' + (cy-8) + '" x2="' + (cx-44) + '" y2="' + (cy-8) + '" stroke="#aaa" stroke-width="1"/>' +
          '<line x1="' + (cx-28) + '" y1="' + (cy-6) + '" x2="' + (cx-44) + '" y2="' + (cy-4) + '" stroke="#aaa" stroke-width="1"/>' +
          // Eye (beady red)
          '<circle cx="' + (cx-20) + '" cy="' + (cy-13) + '" r="3" fill="#cc0000"/>' +
          '<circle cx="' + (cx-20) + '" cy="' + (cy-13) + '" r="1.5" fill="#000"/>' +
          // Ears
          '<circle cx="' + (cx-12) + '" cy="' + (cy-18) + '" r="5" fill="#8a6a6a"/>' +
          '<circle cx="' + (cx-4) + '" cy="' + (cy-17) + '" r="4" fill="#8a6a6a"/>' +
          // Legs
          '<line x1="' + (cx-10) + '" y1="' + (cy-4) + '" x2="' + (cx-14) + '" y2="' + (cy+4) + '" stroke="#5a4a4a" stroke-width="3"/>' +
          '<line x1="' + (cx) + '" y1="' + (cy-4) + '" x2="' + (cx-2) + '" y2="' + (cy+4) + '" stroke="#5a4a4a" stroke-width="3"/>' +
          '<line x1="' + (cx+10) + '" y1="' + (cy-4) + '" x2="' + (cx+8) + '" y2="' + (cy+4) + '" stroke="#5a4a4a" stroke-width="3"/>' +
          // Long tail
          '<path d="M' + (cx+18) + ',' + (cy-6) + ' Q' + (cx+32) + ',' + (cy-2) + ' ' + (cx+36) + ',' + (cy-14) + ' Q' + (cx+40) + ',' + (cy-24) + ' ' + (cx+34) + ',' + (cy-28) + '" fill="none" stroke="#7a5a5a" stroke-width="2.5"/>' +
          // Mutation: oversized claws on forepaws
          '<polygon points="' + (cx-36) + ',' + (cy-6) + ' ' + (cx-40) + ',' + (cy-2) + ' ' + (cx-38) + ',' + (cy-8) + '" fill="#c0a0a0"/>' +
          '<polygon points="' + (cx-33) + ',' + (cy-5) + ' ' + (cx-37) + ',' + (cy-1) + ' ' + (cx-35) + ',' + (cy-7) + '" fill="#c0a0a0"/>'
        );
      }

      case 'insect': {
        return (
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="18" ry="3" fill="rgba(0,0,0,0.3)"/>' +
          // Abdomen
          '<ellipse cx="' + (cx+14) + '" cy="' + (cy-6) + '" rx="14" ry="9" fill="#3a5a2a"/>' +
          // Thorax
          '<ellipse cx="' + (cx-2) + '" cy="' + (cy-12) + '" rx="10" ry="9" fill="#4a6a3a"/>' +
          // Head
          '<circle cx="' + (cx-16) + '" cy="' + (cy-12) + '" r="9" fill="#3a5a2a"/>' +
          // Compound eyes (big)
          '<ellipse cx="' + (cx-22) + '" cy="' + (cy-14) + '" rx="6" ry="5" fill="#8a2a00"/>' +
          '<ellipse cx="' + (cx-14) + '" cy="' + (cy-16) + '" rx="5" ry="4" fill="#8a2a00"/>' +
          // Eye glints
          '<circle cx="' + (cx-22) + '" cy="' + (cy-15) + '" r="2" fill="#ff4400" opacity="0.8"/>' +
          // Mandibles
          '<path d="M' + (cx-24) + ',' + (cy-9) + ' Q' + (cx-34) + ',' + (cy-6) + ' ' + (cx-32) + ',' + (cy-14) + '" fill="none" stroke="#2a4a1a" stroke-width="3" stroke-linecap="round"/>' +
          '<path d="M' + (cx-24) + ',' + (cy-11) + ' Q' + (cx-34) + ',' + (cy-15) + ' ' + (cx-30) + ',' + (cy-20) + '" fill="none" stroke="#2a4a1a" stroke-width="3" stroke-linecap="round"/>' +
          // Antennae
          '<path d="M' + (cx-18) + ',' + (cy-20) + ' Q' + (cx-22) + ',' + (cy-34) + ' ' + (cx-16) + ',' + (cy-40) + '" fill="none" stroke="#4a7a3a" stroke-width="1.5"/>' +
          '<path d="M' + (cx-12) + ',' + (cy-20) + ' Q' + (cx-10) + ',' + (cy-33) + ' ' + (cx-4) + ',' + (cy-38) + '" fill="none" stroke="#4a7a3a" stroke-width="1.5"/>' +
          // Wings (translucent)
          '<ellipse cx="' + (cx+2) + '" cy="' + (cy-22) + '" rx="16" ry="10" fill="rgba(180,220,180,0.2)" stroke="#6a8a5a" stroke-width="1" transform="rotate(-20 ' + (cx+2) + ' ' + (cy-22) + ')"/>' +
          '<ellipse cx="' + (cx+6) + '" cy="' + (cy-20) + '" rx="12" ry="7" fill="rgba(180,220,180,0.15)" stroke="#6a8a5a" stroke-width="1" transform="rotate(-15 ' + (cx+6) + ' ' + (cy-20) + ')"/>' +
          // 6 legs
          '<line x1="' + (cx-8) + '" y1="' + (cy-6) + '" x2="' + (cx-18) + '" y2="' + (cy+4) + '" stroke="#2a4a1a" stroke-width="2"/>' +
          '<line x1="' + (cx-4) + '" y1="' + (cy-4) + '" x2="' + (cx-8) + '" y2="' + (cy+4) + '" stroke="#2a4a1a" stroke-width="2"/>' +
          '<line x1="' + (cx+2) + '" y1="' + (cy-4) + '" x2="' + (cx+4) + '" y2="' + (cy+4) + '" stroke="#2a4a1a" stroke-width="2"/>' +
          '<line x1="' + (cx+8) + '" y1="' + (cy-4) + '" x2="' + (cx+12) + '" y2="' + (cy+4) + '" stroke="#2a4a1a" stroke-width="2"/>' +
          '<line x1="' + (cx+14) + '" y1="' + (cy-4) + '" x2="' + (cx+20) + '" y2="' + (cy+4) + '" stroke="#2a4a1a" stroke-width="2"/>' +
          '<line x1="' + (cx+18) + '" y1="' + (cy-6) + '" x2="' + (cx+26) + '" y2="' + (cy+2) + '" stroke="#2a4a1a" stroke-width="2"/>'
        );
      }

      case 'bear': {
        // Large, rearing up on hind legs
        return (
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="28" ry="5" fill="rgba(0,0,0,0.35)"/>' +
          // Lower body / hips
          '<ellipse cx="' + (cx+2) + '" cy="' + (cy-8) + '" rx="22" ry="16" fill="#5a3a20"/>' +
          // Upper body (rearing up)
          '<ellipse cx="' + (cx-4) + '" cy="' + (cy-28) + '" rx="18" ry="20" fill="#6a4a28"/>' +
          // Head
          '<circle cx="' + (cx-10) + '" cy="' + (cy-48) + '" r="16" fill="#6a4a28"/>' +
          // Muzzle
          '<ellipse cx="' + (cx-18) + '" cy="' + (cy-44) + '" rx="9" ry="7" fill="#8a6a40"/>' +
          // Nose (big)
          '<ellipse cx="' + (cx-22) + '" cy="' + (cy-46) + '" rx="4" ry="3" fill="#3a2010"/>' +
          // Open mouth
          '<path d="M' + (cx-28) + ',' + (cy-41) + ' Q' + (cx-22) + ',' + (cy-36) + ' ' + (cx-12) + ',' + (cy-41) + '" fill="#8a1010" stroke="#5a0808" stroke-width="1"/>' +
          '<line x1="' + (cx-26) + '" y1="' + (cy-39) + '" x2="' + (cx-22) + '" y2="' + (cy-34) + '" stroke="#ddd" stroke-width="2.5"/>' +
          '<line x1="' + (cx-20) + '" y1="' + (cy-39) + '" x2="' + (cx-18) + '" y2="' + (cy-34) + '" stroke="#ddd" stroke-width="2.5"/>' +
          // Eyes
          '<circle cx="' + (cx-6) + '" cy="' + (cy-51) + '" r="4" fill="#cc1100"/>' +
          '<circle cx="' + (cx-6) + '" cy="' + (cy-51) + '" r="2" fill="#000"/>' +
          '<circle cx="' + (cx-20) + '" cy="' + (cy-51) + '" r="4" fill="#cc1100"/>' +
          // Ears
          '<circle cx="' + (cx-2) + '" cy="' + (cy-61) + '" r="6" fill="#5a3a20"/>' +
          '<circle cx="' + (cx-18) + '" cy="' + (cy-61) + '" r="6" fill="#5a3a20"/>' +
          // Raised arms with claws
          '<path d="M' + (cx-4) + ',' + (cy-38) + ' Q' + (cx-26) + ',' + (cy-40) + ' ' + (cx-36) + ',' + (cy-30) + '" fill="none" stroke="#6a4a28" stroke-width="9" stroke-linecap="round"/>' +
          '<polygon points="' + (cx-38) + ',' + (cy-26) + ' ' + (cx-44) + ',' + (cy-20) + ' ' + (cx-34) + ',' + (cy-22) + '" fill="#c0a080"/>' +
          '<polygon points="' + (cx-40) + ',' + (cy-28) + ' ' + (cx-46) + ',' + (cy-26) + ' ' + (cx-38) + ',' + (cy-22) + '" fill="#c0a080"/>' +
          // Hind legs
          '<line x1="' + (cx-14) + '" y1="' + (cy-2) + '" x2="' + (cx-18) + '" y2="' + (cy+4) + '" stroke="#5a3a20" stroke-width="8"/>' +
          '<line x1="' + (cx+10) + '" y1="' + (cy-2) + '" x2="' + (cx+12) + '" y2="' + (cy+4) + '" stroke="#5a3a20" stroke-width="8"/>' +
          // Mutation scar on chest
          '<path d="M' + (cx-2) + ',' + (cy-40) + ' Q' + (cx-8) + ',' + (cy-35) + ' ' + (cx-4) + ',' + (cy-28) + '" fill="none" stroke="#cc3300" stroke-width="2" opacity="0.7"/>'
        );
      }

      case 'bird': {
        return (
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="20" ry="3" fill="rgba(0,0,0,0.25)"/>' +
          // Body
          '<ellipse cx="' + (cx+4) + '" cy="' + (cy-14) + '" rx="18" ry="10" fill="#4a3a20"/>' +
          // Neck
          '<ellipse cx="' + (cx-10) + '" cy="' + (cy-20) + '" rx="7" ry="8" fill="#5a4a28"/>' +
          // Head
          '<circle cx="' + (cx-16) + '" cy="' + (cy-28) + '" r="9" fill="#5a4a28"/>' +
          // Beak (hooked raptor beak)
          '<path d="M' + (cx-24) + ',' + (cy-28) + ' L' + (cx-36) + ',' + (cy-26) + ' L' + (cx-30) + ',' + (cy-22) + ' Z" fill="#c0a020"/>' +
          // Eyes (fierce yellow)
          '<circle cx="' + (cx-19) + '" cy="' + (cy-30) + '" r="4" fill="#e0c020"/>' +
          '<circle cx="' + (cx-19) + '" cy="' + (cy-30) + '" r="2" fill="#000"/>' +
          // Crest feathers
          '<path d="M' + (cx-14) + ',' + (cy-36) + ' Q' + (cx-10) + ',' + (cy-46) + ' ' + (cx-8) + ',' + (cy-44) + '" fill="none" stroke="#6a5a30" stroke-width="3"/>' +
          '<path d="M' + (cx-10) + ',' + (cy-36) + ' Q' + (cx-6) + ',' + (cy-44) + ' ' + (cx-4) + ',' + (cy-42) + '" fill="none" stroke="#6a5a30" stroke-width="3"/>' +
          // Wings spread (menacing)
          '<path d="M' + (cx+8) + ',' + (cy-16) + ' Q' + (cx+30) + ',' + (cy-36) + ' ' + (cx+38) + ',' + (cy-18) + ' Q' + (cx+30) + ',' + (cy-12) + ' ' + (cx+8) + ',' + (cy-14) + '" fill="#3a2a14" stroke="#5a4a28" stroke-width="1"/>' +
          '<path d="M' + (cx+6) + ',' + (cy-14) + ' Q' + (cx-6) + ',' + (cy-28) + ' ' + (cx-10) + ',' + (cy-22) + '" fill="#3a2a14" stroke="#5a4a28" stroke-width="1"/>' +
          // Talons
          '<line x1="' + (cx-8) + '" y1="' + (cy-8) + '" x2="' + (cx-12) + '" y2="' + (cy+2) + '" stroke="#6a5a20" stroke-width="4"/>' +
          '<line x1="' + (cx+2) + '" y1="' + (cy-6) + '" x2="' + (cx) + '" y2="' + (cy+2) + '" stroke="#6a5a20" stroke-width="4"/>' +
          '<polygon points="' + (cx-14) + ',' + (cy+2) + ' ' + (cx-18) + ',' + (cy+8) + ' ' + (cx-12) + ',' + (cy+5) + '" fill="#8a7a30"/>' +
          '<polygon points="' + (cx-12) + ',' + (cy+2) + ' ' + (cx-14) + ',' + (cy+8) + ' ' + (cx-8) + ',' + (cy+5) + '" fill="#8a7a30"/>' +
          // Mutation: three eyes
          '<circle cx="' + (cx-22) + '" cy="' + (cy-26) + '" r="2.5" fill="#e0c020" opacity="0.8"/>'
        );
      }

      case 'zombie_dog': {
        return (
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="20" ry="3" fill="rgba(0,0,0,0.3)"/>' +
          // Body (mangy, patchy)
          '<ellipse cx="' + (cx+2) + '" cy="' + (cy-8) + '" rx="20" ry="11" fill="#3a4a2a"/>' +
          // Exposed ribs (visible through patchy fur)
          '<line x1="' + (cx+4) + '" y1="' + (cy-16) + '" x2="' + (cx+8) + '" y2="' + (cy-4) + '" stroke="#6a7a5a" stroke-width="1.5" opacity="0.6"/>' +
          '<line x1="' + (cx+10) + '" y1="' + (cy-16) + '" x2="' + (cx+14) + '" y2="' + (cy-4) + '" stroke="#6a7a5a" stroke-width="1.5" opacity="0.6"/>' +
          // Head
          '<ellipse cx="' + (cx-18) + '" cy="' + (cy-10) + '" rx="13" ry="10" fill="#3a4a2a"/>' +
          // Snout
          '<ellipse cx="' + (cx-28) + '" cy="' + (cy-8) + '" rx="8" ry="6" fill="#2a3a1a"/>' +
          // Gaping mouth
          '<path d="M' + (cx-36) + ',' + (cy-7) + ' Q' + (cx-28) + ',' + (cy-2) + ' ' + (cx-20) + ',' + (cy-7) + '" fill="#8a1010"/>' +
          '<line x1="' + (cx-34) + '" y1="' + (cy-7) + '" x2="' + (cx-32) + '" y2="' + (cy-3) + '" stroke="#ddd" stroke-width="2"/>' +
          '<line x1="' + (cx-28) + '" y1="' + (cy-5) + '" x2="' + (cx-26) + '" y2="' + (cy-1) + '" stroke="#ddd" stroke-width="2"/>' +
          // Glowing zombie eyes
          '<circle cx="' + (cx-20) + '" cy="' + (cy-14) + '" r="4" fill="#80ff00" filter="url(#ca-glow-red)"/>' +
          '<circle cx="' + (cx-20) + '" cy="' + (cy-14) + '" r="2" fill="#fff"/>' +
          '<circle cx="' + (cx-12) + '" cy="' + (cy-14) + '" r="3" fill="#80ff00" filter="url(#ca-glow-red)"/>' +
          // Torn ears
          '<path d="M' + (cx-14) + ',' + (cy-19) + ' L' + (cx-10) + ',' + (cy-30) + ' L' + (cx-6) + ',' + (cy-20) + '" fill="#2a3a1a" stroke="#3a4a2a" stroke-width="1"/>' +
          // Dripping ichor from mouth
          '<line x1="' + (cx-30) + '" y1="' + (cy-4) + '" x2="' + (cx-32) + '" y2="' + (cy+2) + '" stroke="#004400" stroke-width="2" opacity="0.8"/>' +
          // Legs
          '<line x1="' + (cx-14) + '" y1="' + (cy-2) + '" x2="' + (cx-18) + '" y2="' + (cy+4) + '" stroke="#2a3a1a" stroke-width="4"/>' +
          '<line x1="' + (cx-4) + '" y1="' + (cy-2) + '" x2="' + (cx-6) + '" y2="' + (cy+4) + '" stroke="#2a3a1a" stroke-width="4"/>' +
          '<line x1="' + (cx+8) + '" y1="' + (cy-2) + '" x2="' + (cx+10) + '" y2="' + (cy+4) + '" stroke="#2a3a1a" stroke-width="4"/>' +
          '<line x1="' + (cx+18) + '" y1="' + (cy-2) + '" x2="' + (cx+16) + '" y2="' + (cy+4) + '" stroke="#2a3a1a" stroke-width="4"/>' +
          // Tail (mangled stump)
          '<path d="M' + (cx+20) + ',' + (cy-10) + ' Q' + (cx+26) + ',' + (cy-18) + ' ' + (cx+22) + ',' + (cy-22) + '" fill="none" stroke="#2a3a1a" stroke-width="4" stroke-linecap="round"/>'
        );
      }

      case 'swarm': {
        // Hundreds of tiny ticks — rendered as a writhing cloud of dots
        // Idle: whole mass undulates up/down (ca-idle-float)
        const dots = [];
        const cols = ['#4a2a0a','#6a3a10','#3a2008','#5a3010','#8a5020'];
        for (let i = 0; i < 38; i++) {
          const ang = (i / 38) * Math.PI * 2 + (i * 0.4);
          const r   = 6 + (i % 5) * 5 + Math.sin(i * 1.3) * 8;
          const dx  = Math.cos(ang) * r;
          const dy  = Math.sin(ang) * r * 0.55;
          const dotR = 2 + (i % 3);
          dots.push('<circle cx="' + (cx + dx) + '" cy="' + (cy - 8 + dy) + '" r="' + dotR + '" fill="' + cols[i%cols.length] + '"/>');
          // Legs on larger ones
          if (dotR > 3) {
            for (let l = 0; l < 4; l++) {
              const la = l * Math.PI/2 + Math.PI/4;
              dots.push('<line x1="' + (cx+dx) + '" y1="' + (cy-8+dy) + '" x2="' + (cx+dx+Math.cos(la)*4) + '" y2="' + (cy-8+dy+Math.sin(la)*3) + '" stroke="#3a2008" stroke-width="0.8"/>');
            }
          }
        }
        return '<g class="ca-idle-float">' +
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="28" ry="4" fill="rgba(0,0,0,0.3)"/>' +
          dots.join('') +
          // Core mass
          '<ellipse cx="' + cx + '" cy="' + (cy-8) + '" rx="18" ry="10" fill="rgba(60,30,5,0.55)"/>' +
          // Eyes — lots of them
          '<circle cx="' + (cx-14) + '" cy="' + (cy-12) + '" r="2.5" fill="#ff4400" opacity="0.9"/>' +
          '<circle cx="' + (cx-8) + '"  cy="' + (cy-16) + '" r="2"   fill="#ff4400" opacity="0.8"/>' +
          '<circle cx="' + (cx-18) + '" cy="' + (cy-8)  + '" r="2"   fill="#ff4400" opacity="0.7"/>' +
          '<circle cx="' + (cx-4) + '"  cy="' + (cy-10) + '" r="1.5" fill="#ff6600" opacity="0.9"/>' +
          '</g>';
      }

      case 'serpent': {
        // Long sinuous body in S-curve, triangular head, forked tongue
        // Idle: whole body sways side to side (ca-idle-sway)
        return '<g class="ca-idle-sway">' +
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="20" ry="3" fill="rgba(0,0,0,0.25)"/>' +
          // Body — thick S-curve made of overlapping ellipses
          '<ellipse cx="' + (cx+20) + '" cy="' + (cy+2) + '"  rx="12" ry="7" fill="#3a5a20" transform="rotate(-15 ' + (cx+20) + ' ' + (cy+2) + ')"/>' +
          '<ellipse cx="' + (cx+8) + '"  cy="' + (cy-6) + '"  rx="11" ry="7" fill="#4a6a28" transform="rotate(10 ' + (cx+8) + ' ' + (cy-6) + ')"/>' +
          '<ellipse cx="' + (cx-4) + '"  cy="' + (cy-14) + '" rx="10" ry="6" fill="#3a5a20" transform="rotate(-5 ' + (cx-4) + ' ' + (cy-14) + ')"/>' +
          '<ellipse cx="' + (cx-14) + '" cy="' + (cy-20) + '" rx="9"  ry="6" fill="#4a6a28" transform="rotate(8 ' + (cx-14) + ' ' + (cy-20) + ')"/>' +
          '<ellipse cx="' + (cx-22) + '" cy="' + (cy-24) + '" rx="8"  ry="5" fill="#3a5a20"/>' +
          // Scale pattern
          '<line x1="' + (cx+14) + '" y1="' + (cy-2)  + '" x2="' + (cx+20) + '" y2="' + (cy+2)  + '" stroke="#2a4a18" stroke-width="1" opacity="0.5"/>' +
          '<line x1="' + (cx+2)  + '" y1="' + (cy-10) + '" x2="' + (cx+8)  + '" y2="' + (cy-6)  + '" stroke="#2a4a18" stroke-width="1" opacity="0.5"/>' +
          // Head (triangular — scary)
          '<polygon points="' + (cx-32) + ',' + (cy-22) + ' ' + (cx-22) + ',' + (cy-30) + ' ' + (cx-16) + ',' + (cy-18) + '" fill="#5a7a28"/>' +
          // Jaw (open slightly)
          '<path d="M' + (cx-32) + ',' + (cy-22) + ' Q' + (cx-36) + ',' + (cy-18) + ' ' + (cx-28) + ',' + (cy-16) + '" fill="#6a3a20" stroke="#4a2a18" stroke-width="1"/>' +
          // Fangs
          '<line x1="' + (cx-30) + '" y1="' + (cy-22) + '" x2="' + (cx-32) + '" y2="' + (cy-16) + '" stroke="#e0e0a0" stroke-width="2"/>' +
          '<line x1="' + (cx-26) + '" y1="' + (cy-21) + '" x2="' + (cx-27) + '" y2="' + (cy-16) + '" stroke="#e0e0a0" stroke-width="1.5"/>' +
          // Venom drip
          '<circle cx="' + (cx-32) + '" cy="' + (cy-14) + '" r="2" fill="#80ff40" opacity="0.8" filter="url(#ca-glow-red)"/>' +
          // Forked tongue
          '<line x1="' + (cx-32) + '" y1="' + (cy-18) + '" x2="' + (cx-42) + '" y2="' + (cy-16) + '" stroke="#e53935" stroke-width="1.5"/>' +
          '<line x1="' + (cx-42) + '" y1="' + (cy-16) + '" x2="' + (cx-46) + '" y2="' + (cy-13) + '" stroke="#e53935" stroke-width="1.2"/>' +
          '<line x1="' + (cx-42) + '" y1="' + (cy-16) + '" x2="' + (cx-46) + '" y2="' + (cy-18) + '" stroke="#e53935" stroke-width="1.2"/>' +
          // Eye (slit pupil)
          '<circle cx="' + (cx-24) + '" cy="' + (cy-25) + '" r="4" fill="#c0d000"/>' +
          '<ellipse cx="' + (cx-24) + '" cy="' + (cy-25) + '" rx="1.5" ry="4" fill="#000"/>' +
          // Rattle tail tip
          '<ellipse cx="' + (cx+28) + '" cy="' + (cy+4) + '" rx="5" ry="3" fill="#8a7a40"/>' +
          '<ellipse cx="' + (cx+34) + '" cy="' + (cy+4) + '" rx="4" ry="2.5" fill="#7a6a38"/>' +
          '<ellipse cx="' + (cx+39) + '" cy="' + (cy+4) + '" rx="3" ry="2" fill="#8a7a40"/>' +
          '</g>';
      }

      case 'scorpion': {
        // Top-down-ish side view, 8 legs, pincer claws, curled stinger tail above
        // Idle: tail bobs up and down (ca-idle-sting)
        return '<g>' +
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="26" ry="4" fill="rgba(0,0,0,0.3)"/>' +
          // Carapace segments (abdomen)
          '<rect x="' + (cx+2) + '"  y="' + (cy-14) + '" width="26" height="12" fill="#4a3a18" rx="3"/>' +
          '<rect x="' + (cx+8) + '"  y="' + (cy-12) + '" width="14" height="3"  fill="#6a5a28" rx="1"/>' +
          '<rect x="' + (cx+8) + '"  y="' + (cy-8)  + '" width="14" height="3"  fill="#6a5a28" rx="1"/>' +
          // Thorax
          '<ellipse cx="' + (cx-8) + '" cy="' + (cy-10) + '" rx="16" ry="12" fill="#5a4a20"/>' +
          // Head
          '<ellipse cx="' + (cx-22) + '" cy="' + (cy-10) + '" rx="10" ry="9" fill="#4a3a18"/>' +
          // Eyes (4 beady ones)
          '<circle cx="' + (cx-28) + '" cy="' + (cy-13) + '" r="2" fill="#ff8800"/>' +
          '<circle cx="' + (cx-24) + '" cy="' + (cy-14) + '" r="2" fill="#ff8800"/>' +
          '<circle cx="' + (cx-28) + '" cy="' + (cy-9)  + '" r="1.5" fill="#ff8800"/>' +
          '<circle cx="' + (cx-24) + '" cy="' + (cy-8)  + '" r="1.5" fill="#ff8800"/>' +
          // Pincer claws (left / threatening)
          '<line x1="' + (cx-30) + '" y1="' + (cy-10) + '" x2="' + (cx-44) + '" y2="' + (cy-18) + '" stroke="#4a3a18" stroke-width="5" stroke-linecap="round"/>' +
          '<line x1="' + (cx-44) + '" y1="' + (cy-18) + '" x2="' + (cx-52) + '" y2="' + (cy-12) + '" stroke="#5a4a20" stroke-width="4" stroke-linecap="round"/>' +
          '<line x1="' + (cx-44) + '" y1="' + (cy-18) + '" x2="' + (cx-52) + '" y2="' + (cy-22) + '" stroke="#5a4a20" stroke-width="4" stroke-linecap="round"/>' +
          // Second claw
          '<line x1="' + (cx-30) + '" y1="' + (cy-8) + '" x2="' + (cx-44) + '" y2="' + (cy-2) + '" stroke="#4a3a18" stroke-width="5" stroke-linecap="round"/>' +
          '<line x1="' + (cx-44) + '" y1="' + (cy-2) + '" x2="' + (cx-52) + '" y2="' + cy + '" stroke="#5a4a20" stroke-width="4" stroke-linecap="round"/>' +
          '<line x1="' + (cx-44) + '" y1="' + (cy-2) + '" x2="' + (cx-50) + '" y2="' + (cy-8) + '" stroke="#5a4a20" stroke-width="4" stroke-linecap="round"/>' +
          // 8 legs
          ['','-6','+6','+12','+18'].slice(1).map((_,i) => {
            const lx = cx - 16 + i * 12;
            return '<line x1="' + lx + '" y1="' + (cy-4) + '" x2="' + (lx-8) + '" y2="' + (cy+4) + '" stroke="#3a2a10" stroke-width="2.5"/>' +
                   '<line x1="' + lx + '" y1="' + (cy-4) + '" x2="' + (lx+4) + '" y2="' + (cy+6) + '" stroke="#3a2a10" stroke-width="2.5"/>';
          }).join('') +
          // Tail segments curling up and over (animated group)
          '<g class="ca-idle-sting">' +
            '<line x1="' + (cx+28) + '" y1="' + (cy-12) + '" x2="' + (cx+36) + '" y2="' + (cy-24) + '" stroke="#4a3a18" stroke-width="7" stroke-linecap="round"/>' +
            '<line x1="' + (cx+36) + '" y1="' + (cy-24) + '" x2="' + (cx+40) + '" y2="' + (cy-36) + '" stroke="#4a3a18" stroke-width="6" stroke-linecap="round"/>' +
            '<line x1="' + (cx+40) + '" y1="' + (cy-36) + '" x2="' + (cx+34) + '" y2="' + (cy-48) + '" stroke="#4a3a18" stroke-width="5" stroke-linecap="round"/>' +
            '<line x1="' + (cx+34) + '" y1="' + (cy-48) + '" x2="' + (cx+20) + '" y2="' + (cy-52) + '" stroke="#4a3a18" stroke-width="4" stroke-linecap="round"/>' +
            // Stinger tip with acid drop
            '<polygon points="' + (cx+16) + ',' + (cy-48) + ' ' + (cx+20) + ',' + (cy-56) + ' ' + (cx+24) + ',' + (cy-48) + '" fill="#6a5a20"/>' +
            '<circle cx="' + (cx+20) + '" cy="' + (cy-58) + '" r="4" fill="#80ff20" opacity="0.9" filter="url(#ca-glow-red)"/>' +
          '</g>' +
          '</g>';
      }

      case 'crab': {
        // Big armoured crab facing left, scrap-plated shell, huge claws raised
        // Idle: sideways shuffle + claws open/close (ca-idle-clack)
        return '<g class="ca-idle-clack">' +
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="30" ry="5" fill="rgba(0,0,0,0.35)"/>' +
          // Main shell (hexagonal-ish)
          '<polygon points="' + (cx-20) + ',' + (cy-2) + ' ' + (cx-12) + ',' + (cy-22) + ' ' + (cx+12) + ',' + (cy-22) + ' ' + (cx+20) + ',' + (cy-2) + ' ' + (cx+12) + ',' + (cy+10) + ' ' + (cx-12) + ',' + (cy+10) + '" fill="#6a4a30"/>' +
          // Shell armour plates (scrap metal look)
          '<line x1="' + (cx-20) + '" y1="' + (cy-2)  + '" x2="' + (cx+20) + '" y2="' + (cy-2)  + '" stroke="#8a6a40" stroke-width="1.5" opacity="0.6"/>' +
          '<line x1="' + (cx-14) + '" y1="' + (cy-12) + '" x2="' + (cx+14) + '" y2="' + (cy-12) + '" stroke="#8a6a40" stroke-width="1.5" opacity="0.6"/>' +
          '<line x1="' + cx + '" y1="' + (cy-22) + '" x2="' + cx + '" y2="' + (cy+10) + '" stroke="#5a3a20" stroke-width="1.5" opacity="0.5"/>' +
          // Eyes on stalks (comically positioned)
          '<line x1="' + (cx-10) + '" y1="' + (cy-22) + '" x2="' + (cx-14) + '" y2="' + (cy-30) + '" stroke="#4a3a20" stroke-width="2"/>' +
          '<circle cx="' + (cx-14) + '" cy="' + (cy-32) + '" r="4" fill="#ff8800"/>' +
          '<circle cx="' + (cx-14) + '" cy="' + (cy-32) + '" r="2" fill="#000"/>' +
          '<line x1="' + (cx-2) + '" y1="' + (cy-22) + '" x2="' + (cx-2) + '" y2="' + (cy-32) + '" stroke="#4a3a20" stroke-width="2"/>' +
          '<circle cx="' + (cx-2) + '" cy="' + (cy-34) + '" r="4" fill="#ff8800"/>' +
          '<circle cx="' + (cx-2) + '" cy="' + (cy-34) + '" r="2" fill="#000"/>' +
          // Big left claw (menacing, raised)
          '<line x1="' + (cx-20) + '" y1="' + (cy-6)  + '" x2="' + (cx-36) + '" y2="' + (cy-18) + '" stroke="#5a4a28" stroke-width="8" stroke-linecap="round"/>' +
          '<line x1="' + (cx-36) + '" y1="' + (cy-18) + '" x2="' + (cx-50) + '" y2="' + (cy-10) + '" stroke="#6a5a30" stroke-width="6" stroke-linecap="round"/>' +
          '<line x1="' + (cx-36) + '" y1="' + (cy-18) + '" x2="' + (cx-50) + '" y2="' + (cy-26) + '" stroke="#6a5a30" stroke-width="6" stroke-linecap="round"/>' +
          // Right claw (smaller, defensive)
          '<line x1="' + (cx+20) + '" y1="' + (cy-6) + '" x2="' + (cx+32) + '" y2="' + (cy-14) + '" stroke="#5a4a28" stroke-width="6" stroke-linecap="round"/>' +
          '<line x1="' + (cx+32) + '" y1="' + (cy-14) + '" x2="' + (cx+40) + '" y2="' + (cy-8)  + '" stroke="#6a5a30" stroke-width="5" stroke-linecap="round"/>' +
          '<line x1="' + (cx+32) + '" y1="' + (cy-14) + '" x2="' + (cx+40) + '" y2="' + (cy-20) + '" stroke="#6a5a30" stroke-width="5" stroke-linecap="round"/>' +
          // 8 walking legs (4 per side)
          [cx-16, cx-8, cx+4, cx+14].map(lx =>
            '<line x1="' + lx + '" y1="' + (cy+8) + '" x2="' + (lx-6) + '" y2="' + (cy+18) + '" stroke="#4a3a20" stroke-width="3.5"/>'
          ).join('') +
          [cx-16, cx-8, cx+4, cx+14].map(lx =>
            '<line x1="' + lx + '" y1="' + (cy+8) + '" x2="' + (lx+6) + '" y2="' + (cy+18) + '" stroke="#4a3a20" stroke-width="3"/>'
          ).join('') +
          '</g>';
      }

      case 'blob': {
        // Amorphous gelatinous shape, pulsing with inner light, bubbles
        // Idle: whole body pulses/breathes (ca-idle-pulse)
        const blobPts = [];
        for (let i = 0; i < 10; i++) {
          const ang = (i / 10) * Math.PI * 2;
          const r = 22 + Math.sin(i * 1.7) * 8;
          blobPts.push((cx + Math.cos(ang) * r) + ',' + (cy - 10 + Math.sin(ang) * r * 0.55));
        }
        return '<g class="ca-idle-pulse">' +
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="24" ry="5" fill="rgba(0,100,0,0.25)"/>' +
          // Outer translucent body
          '<polygon points="' + blobPts.join(' ') + '" fill="rgba(40,180,60,0.35)" stroke="#40c050" stroke-width="2"/>' +
          // Inner glow core
          '<ellipse cx="' + (cx-4) + '" cy="' + (cy-10) + '" rx="14" ry="12" fill="rgba(80,220,100,0.45)"/>' +
          // Floating nuclei/organelles
          '<circle cx="' + (cx-8) + '"  cy="' + (cy-14) + '" r="4" fill="rgba(120,255,140,0.6)"/>' +
          '<circle cx="' + (cx+4) + '"  cy="' + (cy-8)  + '" r="3" fill="rgba(120,255,140,0.5)"/>' +
          '<circle cx="' + (cx-2) + '"  cy="' + (cy-20) + '" r="2" fill="rgba(180,255,200,0.5)"/>' +
          // Eyes (just two dark voids floating inside)
          '<circle cx="' + (cx-12) + '" cy="' + (cy-12) + '" r="4" fill="rgba(0,0,0,0.7)"/>' +
          '<circle cx="' + (cx+2) + '"  cy="' + (cy-12) + '" r="4" fill="rgba(0,0,0,0.7)"/>' +
          // Acid drips from bottom
          '<line x1="' + (cx-8) + '" y1="' + (cy+4) + '" x2="' + (cx-8) + '" y2="' + (cy+14) + '" stroke="#40c050" stroke-width="2" opacity="0.7"/>' +
          '<circle cx="' + (cx-8) + '" cy="' + (cy+15) + '" r="3" fill="#40c050" opacity="0.6"/>' +
          '<line x1="' + (cx+4) + '"  y1="' + (cy+4) + '" x2="' + (cx+4) + '" y2="' + (cy+10) + '" stroke="#40c050" stroke-width="1.5" opacity="0.5"/>' +
          // Dissolving ground beneath
          '<ellipse cx="' + cx + '" cy="' + (cy+6) + '" rx="20" ry="3" fill="rgba(40,180,60,0.15)"/>' +
          '</g>';
      }

      case 'phantom': {
        // Semi-transparent floating ghost shape — wispy tendrils, hollow eye sockets
        // Idle: drifts up/down and flickers opacity (ca-idle-drift)
        return '<g class="ca-idle-drift">' +
          // Outer wispy glow
          '<ellipse cx="' + cx + '" cy="' + (cy-20) + '" rx="28" ry="36" fill="rgba(140,100,200,0.08)" filter="url(#ca-glow-red)"/>' +
          // Main body (shroud-like)
          '<path d="M' + (cx-22) + ',' + (cy+8) + ' Q' + (cx-24) + ',' + (cy-30) + ' ' + (cx-10) + ',' + (cy-46) + ' Q' + cx + ',' + (cy-52) + ' ' + (cx+10) + ',' + (cy-46) + ' Q' + (cx+24) + ',' + (cy-30) + ' ' + (cx+22) + ',' + (cy+8) + ' Q' + (cx+14) + ',' + (cy+14) + ' ' + (cx+6) + ',' + (cy+6) + ' Q' + (cx-4) + ',' + (cy+18) + ' ' + (cx-12) + ',' + (cy+6) + ' Q' + (cx-18) + ',' + (cy+14) + ' ' + (cx-22) + ',' + (cy+8) + ' Z" fill="rgba(120,80,180,0.45)" stroke="rgba(180,130,255,0.4)" stroke-width="1.5"/>' +
          // Torn ragged bottom tendrils
          '<path d="M' + (cx-16) + ',' + (cy+6) + ' Q' + (cx-20) + ',' + (cy+22) + ' ' + (cx-14) + ',' + (cy+26) + '" fill="none" stroke="rgba(180,130,255,0.4)" stroke-width="2.5" stroke-linecap="round"/>' +
          '<path d="M' + (cx-4) + ',' + (cy+12) + ' Q' + (cx-6) + ',' + (cy+28) + ' ' + (cx-2) + ',' + (cy+30) + '" fill="none" stroke="rgba(180,130,255,0.35)" stroke-width="2" stroke-linecap="round"/>' +
          '<path d="M' + (cx+8) + ',' + (cy+8) + ' Q' + (cx+12) + ',' + (cy+24) + ' ' + (cx+8) + ',' + (cy+28) + '" fill="none" stroke="rgba(180,130,255,0.4)" stroke-width="2.5" stroke-linecap="round"/>' +
          '<path d="M' + (cx+18) + ',' + (cy+4) + ' Q' + (cx+24) + ',' + (cy+18) + ' ' + (cx+18) + ',' + (cy+22) + '" fill="none" stroke="rgba(180,130,255,0.3)" stroke-width="2" stroke-linecap="round"/>' +
          // Hollow eye sockets (pitch black, terrifying)
          '<ellipse cx="' + (cx-10) + '" cy="' + (cy-28) + '" rx="7" ry="9" fill="rgba(0,0,0,0.85)"/>' +
          '<ellipse cx="' + (cx+8) + '"  cy="' + (cy-28) + '" rx="7" ry="9" fill="rgba(0,0,0,0.85)"/>' +
          // Purple glow from eyes
          '<ellipse cx="' + (cx-10) + '" cy="' + (cy-30) + '" rx="5" ry="6" fill="rgba(150,0,220,0.5)" filter="url(#ca-glow-red)"/>' +
          '<ellipse cx="' + (cx+8)  + '" cy="' + (cy-30) + '" rx="5" ry="6" fill="rgba(150,0,220,0.5)" filter="url(#ca-glow-red)"/>' +
          // No mouth — just a scream-shaped void
          '<path d="M' + (cx-6) + ',' + (cy-16) + ' Q' + (cx-2) + ',' + (cy-12) + ' ' + (cx+2) + ',' + (cy-16) + '" fill="rgba(0,0,0,0.8)" stroke="none"/>' +
          // Floating debris particles
          '<circle cx="' + (cx-30) + '" cy="' + (cy-10) + '" r="2" fill="rgba(180,130,255,0.4)"/>' +
          '<circle cx="' + (cx+26) + '" cy="' + (cy-18) + '" r="1.5" fill="rgba(180,130,255,0.35)"/>' +
          '<circle cx="' + (cx-26) + '" cy="' + (cy-32) + '" r="1.5" fill="rgba(180,130,255,0.3)"/>' +
          '</g>';
      }

      case 'golem': {
        // Hunched biped assembled from scrap: barrel torso, piston arms, rivet-plate head
        // Idle: stomps slightly, steam vents (ca-idle-stomp)
        return '<g class="ca-idle-stomp">' +
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="28" ry="5" fill="rgba(0,0,0,0.4)"/>' +
          // Legs (thick I-beam shaped)
          '<rect x="' + (cx-16) + '" y="' + (cy-10) + '" width="12" height="18" fill="#3a3a3a" rx="2"/>' +
          '<rect x="' + (cx+4)  + '" y="' + (cy-10) + '" width="12" height="18" fill="#3a3a3a" rx="2"/>' +
          // Rivet accents on legs
          '<circle cx="' + (cx-10) + '" cy="' + (cy-4) + '" r="2" fill="#888"/>' +
          '<circle cx="' + (cx+10) + '" cy="' + (cy-4) + '" r="2" fill="#888"/>' +
          // Torso (barrel / boiler shape)
          '<ellipse cx="' + (cx-2) + '" cy="' + (cy-28) + '" rx="22" ry="20" fill="#2a2a2a"/>' +
          // Boiler plates + rivets
          '<line x1="' + (cx-22) + '" y1="' + (cy-28) + '" x2="' + (cx+18) + '" y2="' + (cy-28) + '" stroke="#555" stroke-width="2"/>' +
          '<circle cx="' + (cx-20) + '" cy="' + (cy-36) + '" r="2.5" fill="#888"/>' +
          '<circle cx="' + (cx-20) + '" cy="' + (cy-20) + '" r="2.5" fill="#888"/>' +
          '<circle cx="' + (cx+16) + '" cy="' + (cy-36) + '" r="2.5" fill="#888"/>' +
          '<circle cx="' + (cx+16) + '" cy="' + (cy-20) + '" r="2.5" fill="#888"/>' +
          // Pressure gauge
          '<circle cx="' + (cx-2) + '" cy="' + (cy-32) + '" r="6" fill="#1a1a1a" stroke="#666" stroke-width="1.5"/>' +
          '<line x1="' + (cx-2) + '" y1="' + (cy-32) + '" x2="' + (cx+2) + '" y2="' + (cy-36) + '" stroke="#e53935" stroke-width="1.5"/>' +
          // Steam vents
          '<rect x="' + (cx-14) + '" y="' + (cy-46) + '" width="6" height="8" fill="#3a3a3a" rx="1"/>' +
          '<rect x="' + (cx+8)  + '" y="' + (cy-46) + '" width="6" height="8" fill="#3a3a3a" rx="1"/>' +
          '<ellipse cx="' + (cx-11) + '" cy="' + (cy-48) + '" rx="5" ry="6" fill="rgba(200,200,200,0.25)"/>' +
          '<ellipse cx="' + (cx+11) + '" cy="' + (cy-48) + '" rx="5" ry="6" fill="rgba(200,200,200,0.25)"/>' +
          // Arms (piston style — huge)
          '<rect x="' + (cx-40) + '" y="' + (cy-38) + '" width="20" height="14" fill="#333" rx="3"/>' +
          '<rect x="' + (cx-24) + '" y="' + (cy-34) + '" width="6"  height="6"  fill="#555" rx="1"/>' +
          '<rect x="' + (cx+16) + '" y="' + (cy-36) + '" width="16" height="12" fill="#333" rx="3"/>' +
          // Knuckle claws
          '<polygon points="' + (cx-40) + ',' + (cy-38) + ' ' + (cx-46) + ',' + (cy-32) + ' ' + (cx-40) + ',' + (cy-26) + '" fill="#4a4a3a"/>' +
          '<polygon points="' + (cx-44) + ',' + (cy-40) + ' ' + (cx-50) + ',' + (cy-36) + ' ' + (cx-44) + ',' + (cy-30) + '" fill="#4a4a3a"/>' +
          // Head (rectangular industrial)
          '<rect x="' + (cx-14) + '" y="' + (cy-60) + '" width="24" height="18" fill="#252525" rx="2"/>' +
          // Optical sensors (eyes)
          '<circle cx="' + (cx-6) + '" cy="' + (cy-52) + '" r="5" fill="#e53935" filter="url(#ca-glow-red)"/>' +
          '<circle cx="' + (cx+8) + '" cy="' + (cy-52) + '" r="5" fill="#e53935" filter="url(#ca-glow-red)"/>' +
          '<circle cx="' + (cx-6) + '" cy="' + (cy-52) + '" r="2" fill="#fff"/>' +
          '<circle cx="' + (cx+8) + '" cy="' + (cy-52) + '" r="2" fill="#fff"/>' +
          // Speaker grill (mouth)
          '<rect x="' + (cx-8) + '" y="' + (cy-45) + '" width="14" height="4" fill="#1a1a1a" rx="1"/>' +
          '<line x1="' + (cx-6) + '" y1="' + (cy-45) + '" x2="' + (cx-6) + '" y2="' + (cy-41) + '" stroke="#555" stroke-width="1"/>' +
          '<line x1="' + (cx-2) + '" y1="' + (cy-45) + '" x2="' + (cx-2) + '" y2="' + (cy-41) + '" stroke="#555" stroke-width="1"/>' +
          '<line x1="' + (cx+2) + '" y1="' + (cy-45) + '" x2="' + (cx+2) + '" y2="' + (cy-41) + '" stroke="#555" stroke-width="1"/>' +
          '</g>';
      }

      case 'hydra': {
        // Three-headed serpentine body rising from below — heads fan out at different angles
        // Idle: three heads weave independently (ca-idle-weave)
        const makeHead = (hx, hy, ang, col) =>
          '<g transform="rotate(' + ang + ' ' + hx + ' ' + (hy+20) + ')">' +
            '<ellipse cx="' + hx + '" cy="' + hy + '" rx="11" ry="9" fill="' + col + '"/>' +
            '<ellipse cx="' + (hx-10) + '" cy="' + (hy+2) + '" rx="7" ry="5" fill="' + col + '" opacity="0.9"/>' +
            // Mouth
            '<path d="M' + (hx-16) + ',' + (hy+2) + ' Q' + (hx-12) + ',' + (hy+7) + ' ' + (hx-4) + ',' + (hy+2) + '" fill="#8a1010"/>' +
            '<line x1="' + (hx-14) + '" y1="' + (hy+2) + '" x2="' + (hx-12) + '" y2="' + (hy+6) + '" stroke="#ddd" stroke-width="2"/>' +
            // Eye
            '<circle cx="' + (hx-3) + '" cy="' + (hy-3) + '" r="3.5" fill="#ff8800"/>' +
            '<ellipse cx="' + (hx-3) + '" cy="' + (hy-3) + '" rx="1.2" ry="3.5" fill="#000"/>' +
            // Frills
            '<path d="M' + hx + ',' + (hy-8) + ' Q' + (hx+8) + ',' + (hy-14) + ' ' + (hx+6) + ',' + (hy-4) + '" fill="#cc2200" opacity="0.8"/>' +
            '<path d="M' + hx + ',' + (hy-8) + ' Q' + (hx+6) + ',' + (hy-18) + ' ' + (hx+2) + ',' + (hy-6) + '" fill="#cc2200" opacity="0.6"/>' +
          '</g>';
        return '<g class="ca-idle-weave">' +
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="26" ry="5" fill="rgba(0,0,0,0.3)"/>' +
          // Central body mass rising from below
          '<ellipse cx="' + (cx+2) + '" cy="' + (cy-4) + '" rx="20" ry="14" fill="#2a4a2a"/>' +
          // Three neck stalks
          '<path d="M' + (cx-8) + ',' + (cy-14) + ' Q' + (cx-18) + ',' + (cy-28) + ' ' + (cx-22) + ',' + (cy-44) + '" fill="none" stroke="#3a5a2a" stroke-width="10" stroke-linecap="round"/>' +
          '<path d="M' + cx + ',' + (cy-16) + ' Q' + (cx-4) + ',' + (cy-32) + ' ' + cx + ',' + (cy-50) + '" fill="none" stroke="#2a4a2a" stroke-width="10" stroke-linecap="round"/>' +
          '<path d="M' + (cx+8) + ',' + (cy-14) + ' Q' + (cx+18) + ',' + (cy-26) + ' ' + (cx+20) + ',' + (cy-40) + '" fill="none" stroke="#3a5a2a" stroke-width="10" stroke-linecap="round"/>' +
          // Three heads
          makeHead(cx-22, cy-52, -15, '#3a6a2a') +
          makeHead(cx,    cy-58, 0,   '#4a7a3a') +
          makeHead(cx+20, cy-48, 12,  '#3a6a2a') +
          // Scales on body
          '<circle cx="' + (cx-8) + '" cy="' + (cy-6)  + '" r="3" fill="#3a6a2a" opacity="0.5"/>' +
          '<circle cx="' + (cx+6) + '" cy="' + (cy-4)  + '" r="3" fill="#3a6a2a" opacity="0.5"/>' +
          '<circle cx="' + (cx-2) + '" cy="' + (cy-10) + '" r="2.5" fill="#3a6a2a" opacity="0.5"/>' +
          '</g>';
      }

      case 'wraith': {
        // Skeletal military figure, half-digital — cybernetic implants, weapon arm
        // Idle: flickers opacity and jitters (ca-idle-glitch)
        return '<g class="ca-idle-glitch">' +
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="18" ry="3" fill="rgba(200,0,0,0.2)"/>' +
          // Legs (skeletal)
          '<line x1="' + (cx-6)  + '" y1="' + (cy-6) + '" x2="' + (cx-8)  + '" y2="' + (cy+4) + '" stroke="#888" stroke-width="3.5"/>' +
          '<line x1="' + (cx+6)  + '" y1="' + (cy-6) + '" x2="' + (cx+8)  + '" y2="' + (cy+4) + '" stroke="#888" stroke-width="3.5"/>' +
          '<line x1="' + (cx-8)  + '" y1="' + (cy+4) + '" x2="' + (cx-12) + '" y2="' + (cy+4) + '" stroke="#888" stroke-width="3.5"/>' +
          '<line x1="' + (cx+8)  + '" y1="' + (cy+4) + '" x2="' + (cx+12) + '" y2="' + (cy+4) + '" stroke="#888" stroke-width="3.5"/>' +
          // Pelvis/spine
          '<line x1="' + cx + '" y1="' + (cy-6) + '" x2="' + cx + '" y2="' + (cy-40) + '" stroke="#888" stroke-width="4"/>' +
          // Ribs (5 pairs)
          [0,1,2,3,4].map(i =>
            '<line x1="' + cx + '" y1="' + (cy-10-i*6) + '" x2="' + (cx-14) + '" y2="' + (cy-8-i*6) + '" stroke="#7a7a7a" stroke-width="2"/>' +
            '<line x1="' + cx + '" y1="' + (cy-10-i*6) + '" x2="' + (cx+14) + '" y2="' + (cy-8-i*6) + '" stroke="#7a7a7a" stroke-width="2"/>'
          ).join('') +
          // Cybernetic chest plate (glowing)
          '<rect x="' + (cx-10) + '" y="' + (cy-36) + '" width="20" height="18" fill="#0a0a1a" rx="2" stroke="#e53935" stroke-width="1.5"/>' +
          '<circle cx="' + cx + '" cy="' + (cy-28) + '" r="5" fill="#e53935" opacity="0.8" filter="url(#ca-glow-red)"/>' +
          // Arms
          '<line x1="' + cx + '" y1="' + (cy-36) + '" x2="' + (cx-20) + '" y2="' + (cy-26) + '" stroke="#888" stroke-width="4"/>' +
          // Weapon arm (right — cybernetic gun)
          '<line x1="' + cx + '" y1="' + (cy-36) + '" x2="' + (cx+18) + '" y2="' + (cy-28) + '" stroke="#888" stroke-width="5"/>' +
          '<rect x="' + (cx+16) + '" y="' + (cy-32) + '" width="16" height="8" fill="#1a1a2a" rx="2"/>' +
          '<circle cx="' + (cx+32) + '" cy="' + (cy-28) + '" r="3" fill="#e53935" filter="url(#ca-glow-red)"/>' +
          // Digital skull head
          '<circle cx="' + cx + '" cy="' + (cy-46) + '" r="12" fill="#1a1a1a" stroke="#888" stroke-width="1.5"/>' +
          // Glowing red eye sockets
          '<ellipse cx="' + (cx-5) + '" cy="' + (cy-48) + '" rx="4" ry="5" fill="#e53935" filter="url(#ca-glow-red)"/>' +
          '<ellipse cx="' + (cx+5) + '" cy="' + (cy-48) + '" rx="4" ry="5" fill="#e53935" filter="url(#ca-glow-red)"/>' +
          // Digital corruption artefacts
          '<rect x="' + (cx-20) + '" y="' + (cy-52) + '" width="8" height="3" fill="rgba(229,57,53,0.4)"/>' +
          '<rect x="' + (cx+14) + '" y="' + (cy-42) + '" width="6" height="2" fill="rgba(229,57,53,0.3)"/>' +
          '</g>';
      }

      case 'titan': {
        // Colossal biped, fills the entire right side, multiple heads implied
        // Idle: slow breathing, ground quake (ca-idle-quake)
        return '<g class="ca-idle-quake">' +
          '<ellipse cx="' + cx + '" cy="' + (cy+6) + '" rx="38" ry="7" fill="rgba(0,0,0,0.5)"/>' +
          // Legs (pillar-thick)
          '<rect x="' + (cx-22) + '" y="' + (cy-16) + '" width="16" height="24" fill="#1a2a10" rx="3"/>' +
          '<rect x="' + (cx+6) + '"  y="' + (cy-16) + '" width="16" height="24" fill="#1a2a10" rx="3"/>' +
          // Feet
          '<ellipse cx="' + (cx-14) + '" cy="' + (cy+8) + '" rx="10" ry="4" fill="#0f1a0a"/>' +
          '<ellipse cx="' + (cx+14) + '" cy="' + (cy+8) + '" rx="10" ry="4" fill="#0f1a0a"/>' +
          // Lower body
          '<ellipse cx="' + (cx-2) + '" cy="' + (cy-20) + '" rx="28" ry="16" fill="#223018"/>' +
          // Torso (massive, textured)
          '<ellipse cx="' + (cx-4) + '" cy="' + (cy-44) + '" rx="30" ry="26" fill="#2a3820"/>' +
          // Armour plates / thick hide segments
          '<path d="M' + (cx-32) + ',' + (cy-44) + ' Q' + (cx-24) + ',' + (cy-52) + ' ' + (cx-16) + ',' + (cy-44) + '" fill="#344528" stroke="#1a2a10" stroke-width="1.5"/>' +
          '<path d="M' + (cx-16) + ',' + (cy-44) + ' Q' + (cx-8) + ',' + (cy-52) + ' ' + cx + ',' + (cy-44) + '" fill="#2a3820" stroke="#1a2a10" stroke-width="1.5"/>' +
          '<path d="M' + cx + ',' + (cy-44) + ' Q' + (cx+8) + ',' + (cy-52) + ' ' + (cx+16) + ',' + (cy-44) + '" fill="#344528" stroke="#1a2a10" stroke-width="1.5"/>' +
          // Two massive arms
          '<path d="M' + (cx-4) + ',' + (cy-60) + ' Q' + (cx-40) + ',' + (cy-64) + ' ' + (cx-52) + ',' + (cy-44) + ' Q' + (cx-56) + ',' + (cy-30) + ' ' + (cx-44) + ',' + (cy-22) + '" fill="none" stroke="#223018" stroke-width="16" stroke-linecap="round"/>' +
          // Fist claws
          '<polygon points="' + (cx-44) + ',' + (cy-20) + ' ' + (cx-52) + ',' + (cy-12) + ' ' + (cx-44) + ',' + (cy-10) + '" fill="#3a4a28"/>' +
          '<polygon points="' + (cx-46) + ',' + (cy-22) + ' ' + (cx-56) + ',' + (cy-20) + ' ' + (cx-48) + ',' + (cy-14) + '" fill="#3a4a28"/>' +
          // Right arm less raised
          '<path d="M' + (cx+20) + ',' + (cy-58) + ' Q' + (cx+40) + ',' + (cy-52) + ' ' + (cx+44) + ',' + (cy-36) + '" fill="none" stroke="#223018" stroke-width="14" stroke-linecap="round"/>' +
          // Spine bones on back
          '<line x1="' + (cx+24) + '" y1="' + (cy-66) + '" x2="' + (cx+36) + '" y2="' + (cy-72) + '" stroke="#3a4a28" stroke-width="4"/>' +
          '<line x1="' + (cx+24) + '" y1="' + (cy-56) + '" x2="' + (cx+38) + '" y2="' + (cy-60) + '" stroke="#3a4a28" stroke-width="4"/>' +
          '<line x1="' + (cx+24) + '" y1="' + (cy-46) + '" x2="' + (cx+36) + '" y2="' + (cy-48) + '" stroke="#3a4a28" stroke-width="4"/>' +
          // Head (three-faced — centre dominant)
          '<ellipse cx="' + (cx-6) + '" cy="' + (cy-78) + '" rx="20" ry="16" fill="#1a2a10"/>' +
          // Central maw
          '<path d="M' + (cx-22) + ',' + (cy-74) + ' Q' + (cx-12) + ',' + (cy-68) + ' ' + (cx+2) + ',' + (cy-74) + '" fill="#8a0000" stroke="#600" stroke-width="1"/>' +
          '<line x1="' + (cx-18) + '" y1="' + (cy-74) + '" x2="' + (cx-14) + '" y2="' + (cy-68) + '" stroke="#ddd" stroke-width="3"/>' +
          '<line x1="' + (cx-10) + '" y1="' + (cy-72) + '" x2="' + (cx-8) + '"  y2="' + (cy-67) + '" stroke="#ddd" stroke-width="2.5"/>' +
          '<line x1="' + (cx-4) + '"  y1="' + (cy-74) + '" x2="' + (cx-2) + '"  y2="' + (cy-68) + '" stroke="#ddd" stroke-width="2.5"/>' +
          // 4 glowing eyes
          '<circle cx="' + (cx-14) + '" cy="' + (cy-84) + '" r="5" fill="#ff2200" filter="url(#ca-glow-red)"/>' +
          '<circle cx="' + (cx-2) + '"  cy="' + (cy-84) + '" r="5" fill="#ff2200" filter="url(#ca-glow-red)"/>' +
          '<circle cx="' + (cx-20) + '" cy="' + (cy-78) + '" r="3" fill="#ff6600" filter="url(#ca-glow-red)"/>' +
          '<circle cx="' + (cx+4)  + '" cy="' + (cy-78) + '" r="3" fill="#ff6600" filter="url(#ca-glow-red)"/>' +
          // Eye shine
          '<circle cx="' + (cx-14) + '" cy="' + (cy-86) + '" r="2" fill="#fff" opacity="0.7"/>' +
          '<circle cx="' + (cx-2) + '"  cy="' + (cy-86) + '" r="2" fill="#fff" opacity="0.7"/>' +
          // Aura glow
          '<ellipse cx="' + (cx-4) + '" cy="' + (cy-50) + '" rx="36" ry="50" fill="rgba(50,120,0,0.06)" filter="url(#ca-glow-red)"/>' +
          '</g>';
      }

      case 'boss_mutant':
      default: {
        // Hulking biped, asymmetric mutations, glowing eyes
        return (
          '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="30" ry="6" fill="rgba(0,0,0,0.4)"/>' +
          // Lower body
          '<ellipse cx="' + (cx+2) + '" cy="' + (cy-10) + '" rx="26" ry="16" fill="#1a2a1a"/>' +
          // Upper body
          '<ellipse cx="' + (cx-2) + '" cy="' + (cy-32) + '" rx="24" ry="20" fill="#243024"/>' +
          // Asymmetric huge left arm
          '<path d="M' + (cx-4) + ',' + (cy-42) + ' Q' + (cx-36) + ',' + (cy-46) + ' ' + (cx-44) + ',' + (cy-28) + ' Q' + (cx-48) + ',' + (cy-14) + ' ' + (cx-38) + ',' + (cy-8) + '" fill="none" stroke="#1a2a1a" stroke-width="14" stroke-linecap="round"/>' +
          // Claws on big arm
          '<polygon points="' + (cx-38) + ',' + (cy-6) + ' ' + (cx-46) + ',' + (cy-2) + ' ' + (cx-40) + ',' + (cy-12) + '" fill="#8aaа8a"/>' +
          '<polygon points="' + (cx-35) + ',' + (cy-4) + ' ' + (cx-42) + ',' + (cy-0) + ' ' + (cx-36) + ',' + (cy-12) + '" fill="#8aaa8a"/>' +
          // Smaller right arm with spines
          '<path d="M' + (cx+16) + ',' + (cy-40) + ' Q' + (cx+30) + ',' + (cy-42) + ' ' + (cx+32) + ',' + (cy-26) + '" fill="none" stroke="#2a3a2a" stroke-width="8" stroke-linecap="round"/>' +
          '<line x1="' + (cx+28) + '" y1="' + (cy-40) + '" x2="' + (cx+38) + '" y2="' + (cy-44) + '" stroke="#4a6a4a" stroke-width="2.5"/>' +
          '<line x1="' + (cx+30) + '" y1="' + (cy-34) + '" x2="' + (cx+40) + '" y2="' + (cy-36) + '" stroke="#4a6a4a" stroke-width="2.5"/>' +
          // Head (alien-mutant)
          '<ellipse cx="' + (cx-6) + '" cy="' + (cy-54) + '" rx="18" ry="15" fill="#1a2a1a"/>' +
          // Multiple glowing eyes
          '<circle cx="' + (cx-14) + '" cy="' + (cy-56) + '" r="5" fill="#ff0000" filter="url(#ca-glow-red)"/>' +
          '<circle cx="' + (cx-2) + '" cy="' + (cy-56) + '" r="5" fill="#ff0000" filter="url(#ca-glow-red)"/>' +
          '<circle cx="' + (cx-8) + '" cy="' + (cy-49) + '" r="3" fill="#ff6600" filter="url(#ca-glow-red)"/>' +
          // No visible mouth — just a horrifying gash
          '<path d="M' + (cx-18) + ',' + (cy-46) + ' Q' + (cx-8) + ',' + (cy-42) + ' ' + (cx+2) + ',' + (cy-46) + '" fill="#8a0000" stroke="#600000" stroke-width="1"/>' +
          // Spine protrusions on back
          '<line x1="' + (cx+18) + '" y1="' + (cy-50) + '" x2="' + (cx+28) + '" y2="' + (cy-56) + '" stroke="#4a6a4a" stroke-width="3"/>' +
          '<line x1="' + (cx+18) + '" y1="' + (cy-42) + '" x2="' + (cx+30) + '" y2="' + (cy-46) + '" stroke="#4a6a4a" stroke-width="3"/>' +
          '<line x1="' + (cx+18) + '" y1="' + (cy-34) + '" x2="' + (cx+28) + '" y2="' + (cy-36) + '" stroke="#4a6a4a" stroke-width="3"/>' +
          // Legs
          '<rect x="' + (cx-20) + '" y="' + (cy-2) + '" width="12" height="10" fill="#162016" rx="2"/>' +
          '<rect x="' + (cx+8) + '" y="' + (cy-2) + '" width="12" height="10" fill="#162016" rx="2"/>' +
          // Ground ichor drip
          '<ellipse cx="' + (cx-6) + '" cy="' + (cy+6) + '" rx="16" ry="4" fill="#002200" opacity="0.5"/>'
        );
      }
    }
  },

  _startEncounter(animal) {
    this._encounterActive    = true;
    this._currentEncounter   = animal;
    this._encounterHP        = animal.strength * 2;
    this._encounterMaxHP     = this._encounterHP;
    this._encounterLoseTimer = 0;
    this._comboCount         = 0;
    this._lastHitTime        = 0;
    this._playerHurtFlash    = 0;

    this._log_('⚠ ' + animal.emoji + ' ' + animal.name + ' appears! Pedal +20% faster to fight!', 'danger');
    Audio.sfxEncounter();

    // Hide normal scene, show arena
    const charEl = document.getElementById('char-emoji');
    if (charEl) charEl.style.opacity = '0';
    const bgEmoji = document.querySelector('.foraging-bg-emoji');
    if (bgEmoji) bgEmoji.style.opacity = '0.15';

    const arena = document.getElementById('combat-arena');
    if (arena) {
      arena.classList.remove('hidden');
      arena.innerHTML = this._buildArenaHTML(animal);
    }

    const btn = document.getElementById('btn-pedal');
    if (btn) {
      btn.innerHTML = '⚔️ FIGHT ' + animal.emoji + '! <span class="pedal-sub">+20% speed to damage, +40% to destroy</span>';
      btn.style.background = 'linear-gradient(135deg,#3a0808,#6a1010)';
      btn.style.borderColor = '#e53935';
    }
    Utils.toast('⚠ ' + animal.emoji + ' ' + animal.name + '!', 'bad', 3000);

    // Entry animation: monster slides in from right
    setTimeout(() => {
      const mon = document.getElementById('ca-monster');
      if (mon) mon.style.animation = 'ca-monster-enter 0.4s ease-out forwards';
    }, 50);
  },

  // Called every second while encounter is active
  _encounterTick() {
    const animal = this._currentEncounter;
    if (!animal) return;

    const cpm    = State.data.cadence?.clicksPerMinute ?? 0;
    const target = (State.data.world.activeRaid ? State.data.cadence?.raidTargetCPM : State.data.cadence?.targetCPM) || 90;
    const ratio  = cpm / target;
    const def    = State.data.base.defenceRating;

    if (ratio >= 1.1) {
      // Heavy attack: 99+ CPM (pushing past target)
      const dmg = Utils.randFloat(2, 4) * (1 + def / 150) * ratio;
      this._encounterHP = Math.max(0, this._encounterHP - dmg);
      this._encounterLoseTimer = Math.max(0, this._encounterLoseTimer - 1);
      this._arenaUpdate('heavy', dmg);
    } else if (ratio >= 0.8) {
      // Light attack: 72+ CPM (normal riding)
      const dmg = Utils.randFloat(0.5, 1.5) * (1 + def / 200) * ratio;
      this._encounterHP = Math.max(0, this._encounterHP - dmg);
      this._encounterLoseTimer = Math.max(0, this._encounterLoseTimer - 0.5);
      this._arenaUpdate('light', dmg);
    } else if (ratio >= 0.5) {
      // Holding on: 45+ CPM — no damage dealt, no progress lost
      this._arenaUpdate('hold', 0);
    } else {
      // Too slow — lose timer ticks up
      this._encounterLoseTimer++;
      this._arenaUpdate('slow', 0);
    }

    const hpRatio = this._encounterHP / this._encounterMaxHP;
    if (hpRatio <= (animal.fleeThreshold || 0) || this._encounterHP <= 0) {
      this._endEncounter(true); return;
    }
    if (this._encounterLoseTimer >= 15) {
      this._endEncounter(false);
    }
  },

  // Called per tick to update arena visuals
  _arenaUpdate(phase, dmg) {
    const hpPct  = Math.max(0, (this._encounterHP / this._encounterMaxHP) * 100);
    const losePct= Math.min(100, (this._encounterLoseTimer / 15) * 100);

    // Update enemy HP bar colour
    const enemyBar = document.getElementById('ca-enemy-hp');
    if (enemyBar) {
      enemyBar.style.width = hpPct + '%';
      enemyBar.style.background = hpPct > 60 ? '#e53935'
                                : hpPct > 25 ? '#ff6d00'
                                : '#ffd600';
    }

    const loseBar  = document.getElementById('ca-lose-bar');
    const loseSecs = document.getElementById('ca-lose-secs');
    if (loseBar)  loseBar.style.width = losePct + '%';
    if (loseSecs) loseSecs.textContent = Math.max(0, 15 - Math.floor(this._encounterLoseTimer));

    const status = document.getElementById('ca-status');
    const mon    = document.getElementById('ca-monster');
    const player = document.getElementById('ca-player');

    if (phase === 'hold') {
      if (status) { status.textContent = '⚔️ Holding — pedal to 90+ CPM to attack!'; status.className = 'ca-status ca-status-hold'; }
    } else if (phase === 'heavy') {
      if (status) { status.textContent = '💥 FULL ATTACK! Keep hammering!'; status.className = 'ca-status ca-status-heavy'; }
      // Player lunges forward — translate right
      if (player) { player.style.transition = 'transform 0.1s ease-out'; player.style.transform = 'translateX(18px) rotate(5deg)'; }
      // Monster recoils back
      if (mon)    { mon.style.transition = 'transform 0.15s ease-out'; mon.style.transform = 'translateX(12px) rotate(4deg) scaleX(0.95)'; }
      setTimeout(() => {
        if (player) player.style.transform = '';
        if (mon)    mon.style.transform = '';
      }, 220);
      this._spawnHitEffect(true, dmg);
      this._arenaShake(4);
    } else if (phase === 'light') {
      if (status) { status.textContent = '⚔️ Dealing damage! Pedal harder!'; status.className = 'ca-status ca-status-light'; }
      if (player) { player.style.transition = 'transform 0.12s ease-out'; player.style.transform = 'translateX(8px)'; }
      if (mon)    { mon.style.transition = 'transform 0.15s ease-out'; mon.style.transform = 'translateX(6px) rotate(2deg)'; }
      setTimeout(() => {
        if (player) player.style.transform = '';
        if (mon)    mon.style.transform = '';
      }, 200);
      this._spawnHitEffect(false, dmg);
    } else {
      // Monster attacks — player recoils left, monster lunges
      if (status) { status.textContent = '😰 TOO SLOW — monster attacking!'; status.className = 'ca-status ca-status-danger'; }
      if (mon)    { mon.style.transition = 'transform 0.1s ease-out'; mon.style.transform = 'translateX(-16px) scaleX(1.06)'; }
      if (player) { player.style.transition = 'transform 0.12s ease-out'; player.style.transform = 'translateX(-10px) rotate(-4deg)'; }
      setTimeout(() => {
        if (mon)    mon.style.transform = '';
        if (player) player.style.transform = '';
      }, 220);
      this._spawnPlayerHurt();
      this._arenaShake(3);
    }
  },

  _spawnHitEffect(heavy, dmg) {
    const svg = document.getElementById('ca-svg');
    const fx  = document.getElementById('ca-effects');
    if (!svg || !fx) return;

    // Impact point: between player weapon tip and monster
    const ix = 185 + (Math.random() * 20 - 10);
    const iy = 60  + (Math.random() * 20 - 10);

    // Starburst sparks
    const sparkCount = heavy ? 8 : 5;
    const baseCol    = heavy ? '#ffd600' : '#ff8800';
    let sparksHTML = '';
    for (let i = 0; i < sparkCount; i++) {
      const ang = (i / sparkCount) * Math.PI * 2;
      const len = heavy ? (10 + Math.random() * 14) : (6 + Math.random() * 8);
      const x2  = ix + Math.cos(ang) * len;
      const y2  = iy + Math.sin(ang) * len;
      const col = i % 2 === 0 ? baseCol : '#ffffff';
      sparksHTML += '<line x1="' + ix + '" y1="' + iy + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col + '" stroke-width="' + (heavy ? 2.5 : 1.8) + '" stroke-linecap="round" class="ca-spark"/>';
    }

    // Impact circle flash
    const flashR = heavy ? 16 : 10;
    sparksHTML += '<circle cx="' + ix + '" cy="' + iy + '" r="' + flashR + '" fill="' + baseCol + '" opacity="0.5" class="ca-flash"/>';

    // Floating damage number
    if (dmg > 0) {
      const dispDmg = heavy ? Math.round(dmg * 10) / 10 : Math.round(dmg * 10) / 10;
      const col = heavy ? '#ffd600' : '#ff8800';
      sparksHTML += '<text x="' + (ix + 6) + '" y="' + (iy - 8) + '" font-family="monospace" font-size="' + (heavy ? 12 : 9) + '" font-weight="bold" fill="' + col + '" class="ca-dmg-float" filter="url(#ca-glow-red)">' + dispDmg.toFixed(1) + '</text>';
    }

    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = sparksHTML;
    fx.appendChild(g);
    setTimeout(() => { if (g.parentNode) g.parentNode.removeChild(g); }, 450);
  },

  _spawnPlayerHurt() {
    const svg = document.getElementById('ca-svg');
    const fx  = document.getElementById('ca-effects');
    if (!svg || !fx) return;

    // Red damage flash on player side
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.innerHTML = '<rect x="30" y="30" width="100" height="80" fill="rgba(229,57,53,0.22)" rx="4" class="ca-hurt-flash"/>' +
                  '<text x="80" y="90" font-family="monospace" font-size="10" font-weight="bold" fill="#ef5350" text-anchor="middle" class="ca-dmg-float">OUCH!</text>';
    fx.appendChild(g);
    setTimeout(() => { if (g.parentNode) g.parentNode.removeChild(g); }, 400);
  },

  _arenaShake(intensity) {
    const arena = document.getElementById('combat-arena');
    if (!arena) return;
    const kf = [
      { transform: 'translate(0,0)' },
      { transform: 'translate(' + intensity + 'px,' + (-intensity/2) + 'px)' },
      { transform: 'translate(' + (-intensity) + 'px,' + (intensity/2) + 'px)' },
      { transform: 'translate(' + (intensity/2) + 'px,' + intensity + 'px)' },
      { transform: 'translate(0,0)' },
    ];
    if (arena.animate) arena.animate(kf, { duration: 200, easing: 'ease-out' });
  },

  // Extra click damage (only when going fast enough)
  _clickDamage() {
    if (!this._encounterActive) return;
    const cpm = State.data.cadence?.clicksPerMinute ?? 0, target = (State.data.world.activeRaid ? State.data.cadence?.raidTargetCPM : State.data.cadence?.targetCPM) || 90;
    if (cpm / target < 0.7) return;  // 63+ CPM = clicks deal damage
    const def = State.data.base.defenceRating;
    const dmg = Utils.randFloat(0.2, 0.6) * (cpm / target) * (1 + def / 200);
    this._encounterHP = Math.max(0, this._encounterHP - dmg);
    // Snap punch animation on click
    const player = document.getElementById('ca-player');
    if (player) {
      player.style.transition = 'transform 0.06s ease-out';
      player.style.transform = 'translateX(14px) rotate(3deg)';
      setTimeout(() => { player.style.transform = ''; }, 130);
    }
    this._spawnHitEffect(false, dmg);
    const hpRatio = this._encounterHP / this._encounterMaxHP;
    if (hpRatio <= (this._currentEncounter?.fleeThreshold || 0) || this._encounterHP <= 0) {
      this._endEncounter(true);
    }
  },

  _endEncounter(playerWon) {
    const animal = this._currentEncounter;
    this._encounterActive    = false;
    this._currentEncounter   = null;
    this._encounterLoseTimer = 0;

    // Restore scene
    const charEl = document.getElementById('char-emoji');
    if (charEl) charEl.style.opacity = '';
    const bgEmoji = document.querySelector('.foraging-bg-emoji');
    if (bgEmoji) bgEmoji.style.opacity = '';

    const arena = document.getElementById('combat-arena');
    if (arena) {
      // Win / lose flash before hiding
      if (playerWon) {
        const mon = document.getElementById('ca-monster');
        if (mon) {
          mon.style.transition = 'transform 0.3s ease-out, opacity 0.4s ease-out';
          mon.style.transform  = 'translateX(60px) rotate(30deg) scaleY(0.3)';
          mon.style.opacity    = '0';
        }
      } else {
        const player = document.getElementById('ca-player');
        if (player) {
          player.style.transition = 'transform 0.3s ease-out, opacity 0.4s ease-out';
          player.style.transform  = 'translateX(-40px) rotate(-20deg)';
          player.style.opacity    = '0.2';
        }
      }
      setTimeout(() => { arena.classList.add('hidden'); arena.innerHTML = ''; }, 420);
    }

    document.getElementById('encounter-popup')?.classList.add('hidden');
    const btn = document.getElementById('btn-pedal');
    if (btn) {
      btn.innerHTML = '🚴 PEDAL! <span class="pedal-sub">Pedal faster = more resources + slower hunger</span>';
      btn.style.background = '';
      btn.style.borderColor = '';
    }

    if (playerWon) {
      const drops = Animals.rollDrops(animal.id);
      Audio.sfxVictory();
      const cargo = State.data.base.cargoBonus || 1;
      let dropStr = '';
      Object.entries(drops).forEach(([res, amt]) => {
        const actual = Math.round(amt * cargo);
        this._addGathered(res, actual);
        dropStr += ' ' + (this.emojiMap[res] || '📦') + '+' + actual;
      });
      this._log_('✅ ' + animal.emoji + ' defeated!' + dropStr, 'good');
      State.data.stats.raidsRepelled  = (State.data.stats.raidsRepelled  || 0) + 1;
      State.data.stats.animalsDefeated= (State.data.stats.animalsDefeated|| 0) + 1;
      if (animal.id === 'boss_mutant') State.data.stats.bossKilled  = true;
      if (animal.id === 'titan')       State.data.stats.titanKilled = true;
      Events.emit('achievements:check');
    } else {
      Audio.sfxDefeat();
      Object.keys(this._gathered).forEach(r => { this._gathered[r] = Math.floor(this._gathered[r] * 0.75); });
      this._log_('💀 Forced to retreat! Lost 25% of gathered loot.', 'danger');
      State.data.stats.animalsFled = (State.data.stats.animalsFled || 0) + 1;
    }
    Events.emit('achievements:check');
    this._renderResources();
  },

  // ── Location events ───────────────────────
  _checkEvent() {
    const loc = State.locations[this._locationId];
    if (!loc?.events?.length) return;
    for (const ev of loc.events) {
      if (Math.random() < ev.chance * 0.4) {
        this._log_(`📍 ${ev.text}`, 'event');
        const cargo = State.data.base.cargoBonus || 1;
        Object.entries(ev.reward || {}).forEach(([key, val]) => {
          if (key === 'energy') {
            State.data.player.energy = Utils.clamp(State.data.player.energy + val, 0, 100);
            if (val < 0) Utils.toast(`💔 Lost ${Math.abs(val)} energy!`, 'bad');
          } else if (val > 0) {
            this._addGathered(key, Math.round(val * cargo));
          }
        });
        this._renderResources();
        Events.emit('hud:update');
        break;
      }
    }
  },

  // ── Complete expedition ───────────────────
  _complete() {
    clearInterval(this._timer);
    this._active = false;
    if (State.data?.world) State.data.world.playerAway =
      State.data?.world?.playerAway ?? false;

    if (this._encounterActive) this._endEncounter(false);

    // If a raid started while foraging, don't stop Cadence or navigate away —
    // the raid screen takes over both Cadence and navigation.
    const raidActive = State.data.world.activeRaid;
    if (!raidActive) Cadence.stop();

    if (raidActive && !Cadence.isOnTarget()) {
      Utils.toast('💀 Raid overwhelmed you! Lost haul!', 'bad', 4000);
      this._gathered = {};
    } else {
      const overflowWarned = {};
      Object.entries(this._gathered).forEach(([res, amt]) => {
        if (amt <= 0) return;
        const added = State.addResource(res, amt);
        // Warn if storage was full (cap hit)
        if (!added && !overflowWarned[res]) {
          overflowWarned[res] = true;
          this._log_(`⚠ Storage full! Lost some ${res}. Build Storage Room!`, 'warn');
        }
        console.log('[Foraging] Added to inventory:', res, amt);
      });
      const total = Object.values(this._gathered).reduce((s,v)=>s+v,0);
      const summary = Object.entries(this._gathered)
        .filter(([,v])=>v>0)
        .map(([r,a])=>`${this.emojiMap[r]||'📦'}${a}`)
        .join(' ');
      Utils.toast(
        total > 0 ? `✅ Returned! ${summary}` : '😔 Came back empty handed.',
        total > 0 ? 'good' : 'warn', 4000
      );
    }

    this._checkUnlocks();
    Events.emit('hud:update');
    Events.emit('worldmap:player:returned'); // signal worldmap to reset player position to base
    // Don't navigate or change audio if a raid is now active — raid screen is in control
    if (!State.data.world.activeRaid) {
      Audio.play('base');
      setTimeout(() => Events.emit('navigate', { screen: 'base' }), 500);
    }
  },

  // ── Render gathered display ───────────────
  _renderResources() {
    const container = document.getElementById('foraging-resources');
    if (!container) return;
    const total   = this._totalGathered();
    const cap     = this._bikeCarryCap();
    const pct     = Math.min(100, Math.round((total / cap) * 100));
    const capColor = pct >= 90 ? '#e53935' : pct >= 70 ? '#ff8a00' : '#4caf50';
    const capBar  = `<div style="margin-bottom:6px">
      <div style="font-family:var(--font-pixel);font-size:0.28rem;color:#9a9a60;margin-bottom:3px">
        🚴 BIKE CAP: ${total}/${cap} (${pct}%)
      </div>
      <div style="height:6px;background:#1a1a2a;border:1px solid #3a3a4a;border-radius:2px">
        <div style="height:100%;width:${pct}%;background:${capColor};border-radius:2px;transition:width 0.3s"></div>
      </div>
    </div>`;
    const resourceRows = Object.entries(this._gathered)
      .filter(([,v]) => v > 0)
      .map(([res,amt]) => `
        <div class="forage-res-item">${this.emojiMap[res]||'📦'} <strong>${amt}</strong></div>
      `).join('');
    container.innerHTML = capBar + resourceRows;
  },

  // ── Log helper ────────────────────────────
  _log_(text, type = 'info') {
    const container = document.getElementById('forage-log');
    if (!container) return;
    const colors = { info:'var(--col-text-dim)', good:'var(--col-green)',
      danger:'var(--col-red)', rare:'var(--col-yellow)', legendary:'var(--col-orange)', event:'var(--col-blue)' };
    const el = document.createElement('div');
    el.className = 'log-entry';
    el.style.color = colors[type] || colors.info;
    el.textContent = text;
    container.insertBefore(el, container.firstChild);
    while (container.children.length > 8) container.removeChild(container.lastChild);
  },

  // ── Character animation ───────────────────
  _updateCharAnim() {
    const emoji = document.getElementById('char-emoji');
    if (!emoji) return;
    const ratio = Utils.clamp((State.data.cadence?.clicksPerMinute ?? 0) / ((State.data.world.activeRaid ? State.data.cadence?.raidTargetCPM : State.data.cadence?.targetCPM) || 90), 0, 1.5);
    emoji.style.animationDuration = `${Utils.lerp(0.6, 0.1, ratio)}s`;
    emoji.textContent = this._encounterActive ? (ratio>=1.2 ? '⚔️' : '😰') : '🚴';
  },

  // ── Unlock progression ────────────────────
  _checkUnlocks() {
    const prev = State.data.world.unlockedLocations.length;
    const n = State.data.stats.totalExpeditions;
    if (n>=2)  Events.emit('map:unlock', { id: 'abandoned_farm' });
    if (n>=3)  Events.emit('map:unlock', { id: 'gas_station' });
    if (n>=5)  Events.emit('map:unlock', { id: 'city_ruins' });
    if (n>=8)  Events.emit('map:unlock', { id: 'junkyard' });
    if (n>=12)  Events.emit('map:unlock', { id: 'hospital' });
    if (n>=18)  Events.emit('map:unlock', { id: 'cave' });
    if (n>=25)  Events.emit('map:unlock', { id: 'military_base' });
    if (State.data.world.unlockedLocations.length > prev) Audio.sfxUnlock();
  }
};

// Wire monster SVG hook so raids.js can render encounter art without importing Foraging
State.monsterSvgFn = (id, w, h) => Foraging._monsterSVG(id, w, h);

// Subscribe: devMode fast-forage — caps current expedition duration
Events.on('foraging:cap-duration', ({ secs }) => {
  if (typeof Foraging !== 'undefined' && Foraging.isActive()) {
    Foraging._duration = Math.min(Foraging._duration, Foraging._elapsed + secs);
  }
});
