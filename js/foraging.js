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
//   • CPM ≥ target+20%:   light damage per second + click damage
//   • CPM ≥ target+40%:   heavy damage per second + click damage
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
    const loc = MapScreen.locations[locationId];
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
    this._encounterActive = false;
    this._currentEncounter = null;
    this._encounterLoseTimer = 0;
    this._log             = [];
    this._duration        = Math.round((loc.duration || 60) * (this._intensityCfg.durationMult || 1));

    this._buildScreen(loc);
    Game.goTo('foraging');
    Cadence.start();
    Audio.play(Audio.trackForLocation(locationId));
    this._timer = setInterval(() => this._tick(), 1000);

    State.data.stats.totalExpeditions++;
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
    const loc = MapScreen.locations[this._locationId];
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
    const cpm    = Cadence.getCPM();
    const target = Cadence.getTargetCPM() || 60;
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
    const loc = MapScreen.locations[this._locationId];
    if (!loc?.animals?.length) return;
    const scale  = 1 + (State.data.world.day - 1) * 0.05;
    const intMul = this._intensityCfg?.encounterMult || 1;
    if (Math.random() < loc.encounterChance * scale * intMul * (10/60)) {
      const animal = Animals.randomEncounterAnimal(this._locationId);
      if (animal) this._startEncounter(animal);
    }
  },

  _startEncounter(animal) {
    this._encounterActive    = true;
    this._currentEncounter   = animal;
    this._encounterHP        = animal.strength * 2;
    this._encounterMaxHP     = this._encounterHP;
    this._encounterLoseTimer = 0;

    this._log_(`⚠ ${animal.emoji} ${animal.name} appears! Pedal +20% faster to fight!`, 'danger');
    Audio.sfxEncounter();

    const popup = document.getElementById('encounter-popup');
    if (popup) {
      popup.classList.remove('hidden');
      popup.innerHTML = `
        <div class="enc-animal">${animal.emoji}</div>
        <div class="enc-name">${animal.name}</div>
        <div class="enc-hp-wrap"><div class="enc-hp-bar" id="enc-hp-bar" style="width:100%"></div></div>
        <div class="enc-instruction" id="enc-instr">PEDAL +20% FASTER TO FIGHT!</div>
        <div class="enc-lose-wrap"><div class="enc-lose-bar" id="enc-lose-bar" style="width:0%;background:var(--col-red)"></div></div>
        <div style="font-family:var(--font-pixel);font-size:0.26rem;color:var(--col-text-dim);text-align:center">
          ⏱ retreat in <span id="enc-lose-secs">15</span>s if too slow
        </div>
      `;
    }

    const btn = document.getElementById('btn-pedal');
    if (btn) {
      btn.innerHTML = `⚔️ FIGHT ${animal.emoji}! <span class="pedal-sub">+20% speed to damage, +40% to destroy</span>`;
      btn.style.background = 'var(--col-red)';
    }
    Utils.toast(`⚠ ${animal.emoji} ${animal.name}!`, 'bad', 3000);
  },

  // Called every second while encounter is active
  _encounterTick() {
    const animal = this._currentEncounter;
    if (!animal) return;

    const cpm    = Cadence.getCPM();
    const target = Cadence.getTargetCPM() || 60;
    const ratio  = cpm / target;
    const def    = State.data.base.defenceRating;
    const instrEl = document.getElementById('enc-instr');
    const loseBar = document.getElementById('enc-lose-bar');
    const loseSecs = document.getElementById('enc-lose-secs');

    if (ratio >= 1.40) {
      // Heavy attack: 2–4 dmg/sec
      const dmg = Utils.randFloat(2, 4) * (1 + def / 150);
      this._encounterHP = Math.max(0, this._encounterHP - dmg);
      this._encounterLoseTimer = Math.max(0, this._encounterLoseTimer - 1);
      if (instrEl) instrEl.textContent = `💥 FULL ATTACK! Keep hammering!`;
    } else if (ratio >= 1.20) {
      // Light attack: 0.5–1.5 dmg/sec
      const dmg = Utils.randFloat(0.5, 1.5) * (1 + def / 200);
      this._encounterHP = Math.max(0, this._encounterHP - dmg);
      this._encounterLoseTimer = Math.max(0, this._encounterLoseTimer - 0.5);
      if (instrEl) instrEl.textContent = `⚔️ Dealing damage! Pedal harder for +40%!`;
    } else {
      // Too slow: lose timer climbs
      this._encounterLoseTimer++;
      if (instrEl) instrEl.textContent = `😰 TOO SLOW! Need +20% speed! (${15 - Math.floor(this._encounterLoseTimer)}s left)`;
    }

    // Update HP bar
    const hpPct = (this._encounterHP / this._encounterMaxHP) * 100;
    const hpBar = document.getElementById('enc-hp-bar');
    if (hpBar) {
      hpBar.style.width = `${hpPct}%`;
      hpBar.style.background = hpPct > 50 ? 'var(--col-red)' : hpPct > 20 ? '#ff6d00' : '#ffd600';
    }

    // Lose bar
    if (loseBar) loseBar.style.width = `${Math.min(100, (this._encounterLoseTimer/15)*100)}%`;
    if (loseSecs) loseSecs.textContent = Math.max(0, 15 - Math.floor(this._encounterLoseTimer));

    // Flee threshold
    const hpRatio = this._encounterHP / this._encounterMaxHP;
    if (hpRatio <= (animal.fleeThreshold || 0) || this._encounterHP <= 0) {
      this._endEncounter(true); return;
    }
    if (this._encounterLoseTimer >= 15) {
      this._endEncounter(false);
    }
  },

  // Extra click damage (only when going fast enough)
  _clickDamage() {
    if (!this._encounterActive) return;
    const cpm = Cadence.getCPM(), target = Cadence.getTargetCPM() || 60;
    if (cpm / target < 1.0) return;
    const def = State.data.base.defenceRating;
    const dmg = Utils.randFloat(0.2, 0.6) * (cpm / target) * (1 + def / 200);
    this._encounterHP = Math.max(0, this._encounterHP - dmg);
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

    document.getElementById('encounter-popup')?.classList.add('hidden');
    const btn = document.getElementById('btn-pedal');
    if (btn) {
      btn.innerHTML = `🚴 PEDAL! <span class="pedal-sub">Pedal faster = more resources + slower hunger</span>`;
      btn.style.background = '';
    }

    if (playerWon) {
      const drops = Animals.rollDrops(animal.id);
      Audio.sfxVictory();
      const cargo = State.data.base.cargoBonus || 1;
      let dropStr = '';
      Object.entries(drops).forEach(([res, amt]) => {
        const actual = Math.round(amt * cargo);
        this._addGathered(res, actual);
        dropStr += ` ${this.emojiMap[res]||'📦'}+${actual}`;
      });
      this._log_(`✅ ${animal.emoji} defeated!${dropStr}`, 'good');
      State.data.stats.raidsRepelled = (State.data.stats.raidsRepelled || 0) + 1;
    } else {
      Audio.sfxDefeat();
      // Lose 25% gathered on forced retreat
      Object.keys(this._gathered).forEach(r => {
        this._gathered[r] = Math.floor(this._gathered[r] * 0.75);
      });
      this._log_(`💀 Forced to retreat! Lost 25% of gathered loot.`, 'danger');
    }
    this._renderResources();
  },

  // ── Location events ───────────────────────
  _checkEvent() {
    const loc = MapScreen.locations[this._locationId];
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
        HUD.update();
        break;
      }
    }
  },

  // ── Complete expedition ───────────────────
  _complete() {
    clearInterval(this._timer);
    this._active = false;

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
    HUD.update();
    // Don't navigate or change audio if a raid is now active — raid screen is in control
    if (!State.data.world.activeRaid) {
      Audio.play('base');
      setTimeout(() => Game.goTo('base'), 500);
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
    const ratio = Utils.clamp(Cadence.getCPM() / (Cadence.getTargetCPM()||60), 0, 1.5);
    emoji.style.animationDuration = `${Utils.lerp(0.6, 0.1, ratio)}s`;
    emoji.textContent = this._encounterActive ? (ratio>=1.2 ? '⚔️' : '😰') : '🚴';
  },

  // ── Unlock progression ────────────────────
  _checkUnlocks() {
    const prev = State.data.world.unlockedLocations.length;
    const n = State.data.stats.totalExpeditions;
    if (n>=2)  MapScreen.unlock('abandoned_farm');
    if (n>=3)  MapScreen.unlock('gas_station');
    if (n>=5)  MapScreen.unlock('city_ruins');
    if (n>=8)  MapScreen.unlock('junkyard');
    if (n>=12) MapScreen.unlock('hospital');
    if (n>=18) MapScreen.unlock('cave');
    if (n>=25) MapScreen.unlock('military_base');
    if (State.data.world.unlockedLocations.length > prev) Audio.sfxUnlock();
  }
};
