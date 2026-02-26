// ═══════════════════════════════════════════
// PEDAL OR DIE — power.js
// Complete power generation + storage system
//
// GENERATORS (all stackable, each Lv0-10):
//   🚴 Bike Dynamo  — pedalling charges battery, scales with CPM
//   🪵 Wood Burner  — burns wood each day, steady output
//   ⛏ Coal Plant    — burns coal, highest output
//   ☀ Solar Array   — free daytime generation, 0 at night
//
// BATTERY (Lv0 = no battery, Lv1-10):
//   — Parts crafted at Electric Bench
//   — Stores power for use when generation is low
//
// POWER USE:
//   — Passive: lights, electric fence, water pump (drain/hr)
//   — Crafting: electric recipes need available power
//   — Surplus drains to 0 if no battery
//
// SCREEN: Power Panel — accessible from base via power building
// ═══════════════════════════════════════════

const Power = {

  // ── Generator output per level per game-hour ──
  // BASE values. Bike scales with CPM ratio too.
  _genOutput: {
    bike:       2.0,   // × level × CPM ratio (0.5-2.0×)
    woodburner: 3.5,   // × level, uses 1 wood/day
    coal:       6.0,   // × level, uses 1 coal/day
    solar:      4.5    // × level, ×0 at night, ×0.5 at dawn/dusk
  },

  // Max storage per battery level (watt-hours)
  _batteryCapacity: [0, 20, 45, 80, 125, 180, 250, 330, 425, 535, 660],

  // ── Get current generation rate (watts/game-hr) ──
  getGenerationRate() {
    const p   = State.data?.power;
    if (!p) return 0;
    const gen = p.generators;
    let total = 0;

    // Bike dynamo — scales with how hard you're pedalling
    if (gen.bike.level > 0) {
      const ratio = Utils.clamp(Cadence.getCPM() / (Cadence.getTargetCPM() || 60), 0, 2);
      total += this._genOutput.bike * gen.bike.level * Math.max(0.2, ratio);
    }

    // Wood burner
    if (gen.woodburner.level > 0 && p.woodburnerFuelled) {
      total += this._genOutput.woodburner * gen.woodburner.level;
    }

    // Coal plant
    if (gen.coal.level > 0 && p.coalFuelled) {
      total += this._genOutput.coal * gen.coal.level;
    }

    // Solar — depends on time of day
    if (gen.solar.level > 0) {
      const hour = State.data.world.hour;
      const solarMult = this._solarMultiplier(hour);
      total += this._genOutput.solar * gen.solar.level * solarMult;
    }

    return Math.round(total * 10) / 10;
  },

  _solarMultiplier(hour) {
    if (hour >= 10 && hour < 16) return 1.0;   // peak sun
    if (hour >= 7  && hour < 10) return Utils.lerp(0, 1.0, (hour-7)/3);
    if (hour >= 16 && hour < 20) return Utils.lerp(1.0, 0, (hour-16)/4);
    return 0;
  },

  // ── Max battery storage ───────────────────
  getMaxStorage() {
    const lvl = State.data?.power?.battery?.level || 0;
    return this._batteryCapacity[Math.min(lvl, 10)] || 0;
  },

  // ── Current stored power ──────────────────
  getStored() {
    return State.data?.power?.stored || 0;
  },

  // ── Is power available for crafting? ─────
  hasPowerForCrafting(cost = 1) {
    const p = State.data?.power;
    if (!p) return false;
    const gen = this.getGenerationRate();
    // Can use live generation OR stored battery
    return gen >= cost || (p.stored || 0) >= cost;
  },

  // ── Consume power (returns true if OK) ────
  consumePower(amount) {
    const p = State.data?.power;
    if (!p) return false;
    // Try live generation first, then battery
    const gen = this.getGenerationRate();
    if (gen >= amount) return true; // live power covers it
    if ((p.stored || 0) >= amount) {
      p.stored = Math.max(0, p.stored - amount);
      return true;
    }
    return false;
  },

  // ── Hourly power tick (called from daynight) ──
  hourlyTick() {
    const p = State.data?.power;
    if (!p) return;

    const gen     = this.getGenerationRate();
    const maxStor = this.getMaxStorage();
    const current = p.stored || 0;
    const hour    = State.data.world.hour;

    // Passive consumers
    let drain = 0;
    if (p.consumers.lights)    drain += 0.5;
    if (p.consumers.elecFence) drain += 1.0;
    if (p.consumers.waterPump) drain += 0.8;
    if (p.consumers.elecBench) drain += 0.3;

    const net = gen - drain;

    if (maxStor > 0) {
      // With battery: clamp stored between 0 and max
      p.stored = Utils.clamp(current + net, 0, maxStor);
    } else {
      // No battery: surplus just vanishes, deficit cuts from 0
      p.stored = 0;
    }

    // Daily fuel consumption at dawn (hour === 6)
    if (hour === 6) {
      if (p.generators.woodburner.level > 0) {
        if (State.consumeResource('wood', p.generators.woodburner.level)) {
          p.woodburnerFuelled = true;
        } else {
          p.woodburnerFuelled = false;
          Utils.toast('🪵 Wood burner out of fuel!', 'warn', 4000);
        }
      }
      if (p.generators.coal.level > 0) {
        if (State.consumeResource('coal', p.generators.coal.level)) {
          p.coalFuelled = true;
        } else {
          p.coalFuelled = false;
          Utils.toast('⛏ Coal plant out of fuel!', 'warn', 4000);
        }
      }
    }

    // Update HUD power indicator
    this._updateHUDIndicator();
  },

  // ── Update small power indicator on HUD ───
  _updateHUDIndicator() {
    const el = document.getElementById('hud-power');
    if (!el) return;
    const p   = State.data?.power;
    if (!p || this.getGenerationRate() === 0) {
      el.textContent = '';
      return;
    }
    const gen   = this.getGenerationRate();
    const stor  = Math.round(p.stored || 0);
    const max   = this.getMaxStorage();
    const pct   = max > 0 ? Math.round((stor / max) * 100) : 0;
    const icon  = gen > 0 ? '⚡' : '🔋';
    el.textContent = max > 0 ? `${icon}${gen}W 🔋${pct}%` : `${icon}${gen}W`;
    el.style.color = gen > 2 ? '#ffd600' : '#ff6d00';
  },

  // ══════════════════════════════════════════
  // POWER PANEL SCREEN
  // ══════════════════════════════════════════
  renderPanel() {
    const screen = document.getElementById('screen-power');
    if (!screen) return;

    const p   = State.data.power;
    const gen = this.getGenerationRate();
    const max = this.getMaxStorage();
    const inv = State.data.inventory;

    // Generator cards
    const genCards = [
      {
        key: 'bike', icon: '🚴', name: 'Bike Dynamo',
        desc: 'Converts pedalling into electricity. Scales with your riding speed.',
        fuel: 'none', fuelNote: 'Free — powered by YOU',
        output: this._genOutput.bike
      },
      {
        key: 'woodburner', icon: '🪵', name: 'Wood Burner',
        desc: 'Burns wood to generate steady power. Reliable base load.',
        fuel: 'wood', fuelNote: `1 wood/day per level. Have: ${inv.wood || 0}`,
        fuelled: p.woodburnerFuelled,
        output: this._genOutput.woodburner
      },
      {
        key: 'coal', icon: '⛏', name: 'Coal Plant',
        desc: 'High-output coal generator. Best raw power per level.',
        fuel: 'coal', fuelNote: `1 coal/day per level. Have: ${inv.coal || 0}`,
        fuelled: p.coalFuelled,
        output: this._genOutput.coal
      },
      {
        key: 'solar', icon: '☀', name: 'Solar Array',
        desc: 'Free daytime power. Zero output at night. Best combined with battery.',
        fuel: 'none', fuelNote: 'Free — sunlight (daytime only)',
        output: this._genOutput.solar
      }
    ].map(g => this._genCard(g, p.generators[g.key].level)).join('');

    // Battery card
    const batLvl  = p.battery.level;
    const batCard = this._batteryCard(batLvl, max, p.stored || 0);

    // Consumer toggles
    const consumers = this._consumersPanel(p.consumers, gen);

    // Power flow summary
    const drain = this._calcDrain(p.consumers);
    const netCol = gen - drain >= 0 ? '#4caf50' : '#e53935';

    screen.innerHTML = `
      <div class="power-panel">
        <div class="power-header">
          <div class="power-title">⚡ POWER MANAGEMENT</div>
          <div class="power-summary">
            <span style="color:#ffd600">⚡ ${gen}W generating</span>
            <span style="color:#ff6d00">▼ ${drain.toFixed(1)}W consuming</span>
            <span style="color:${netCol}">${gen - drain >= 0 ? '↑' : '↓'} ${Math.abs(gen - drain).toFixed(1)}W net</span>
            ${max > 0 ? `<span style="color:#29b6f6">🔋 ${Math.round(p.stored||0)}/${max} Wh</span>` : ''}
          </div>
        </div>

        <div class="power-section-title">⚡ GENERATORS</div>
        <div class="power-generators">${genCards}</div>

        <div class="power-section-title">🔋 BATTERY BANK</div>
        ${batCard}

        <div class="power-section-title">🔌 ACTIVE CONSUMERS</div>
        ${consumers}

        <button class="btn-pixel btn-secondary" onclick="Game.goTo('base')" style="margin-top:12px;max-width:200px">← BACK TO BASE</button>
      </div>
    `;
  },

  _genCard(g, level) {
    const isBuilt     = level > 0;
    const outputNow   = isBuilt
      ? (g.key === 'bike'
          ? (this._genOutput.bike * level * Math.max(0.2, Utils.clamp(Cadence.getCPM() / (Cadence.getTargetCPM()||60), 0.2, 2))).toFixed(1)
          : g.key === 'solar'
            ? (this._genOutput.solar * level * this._solarMultiplier(State.data.world.hour)).toFixed(1)
            : (g.output * level).toFixed(1))
      : '—';

    const maxOutput  = isBuilt ? (g.output * level).toFixed(1) : '—';
    const fuelStatus = g.fuel === 'none' ? '' :
      `<span class="gen-fuel ${g.fuelled === false ? 'out' : 'ok'}">${g.fuelled === false ? '⚠ OUT OF FUEL' : '✓ Fuelled'}</span>`;

    const upgradeInfo = level < 10
      ? `<span class="gen-upgrade-cost">Next Lv: ${this._genUpgradeCost(g.key, level+1)}</span>`
      : '<span class="gen-upgrade-cost" style="color:#ffd600">MAX LV10</span>';

    // Pip bar (10 pips)
    const pips = Array.from({length:10}, (_,i) =>
      `<div class="pow-pip ${i < level ? 'on' : ''}"></div>`
    ).join('');

    return `
      <div class="gen-card ${isBuilt ? 'built' : 'unbuilt'}">
        <div class="gen-icon">${g.icon}</div>
        <div class="gen-body">
          <div class="gen-name">${g.name} <span class="gen-lv">Lv ${level}/10</span></div>
          <div class="gen-desc">${g.desc}</div>
          <div class="gen-pips">${pips}</div>
          <div class="gen-stats">
            <span>⚡ Now: ${outputNow}W</span>
            <span>Max: ${maxOutput}W</span>
            ${fuelStatus}
          </div>
          <div class="gen-footer">
            <span class="gen-fuel-note">${g.fuelNote}</span>
            ${upgradeInfo}
          </div>
        </div>
        ${level < 10 ? `<button class="btn-gen-upgrade" onclick="Power.upgradeGenerator('${g.key}')"
          ${this._canAffordGenUpgrade(g.key, level+1) ? '' : 'disabled'}>
          ${isBuilt ? '▲ UPGRADE' : '▲ BUILD'}
        </button>` : ''}
      </div>
    `;
  },

  _batteryCard(level, max, stored) {
    const pct    = max > 0 ? Math.round((stored/max)*100) : 0;
    const pips   = Array.from({length:10}, (_,i) =>
      `<div class="pow-pip bat ${i < level ? 'on' : ''}"></div>`
    ).join('');
    const hasAllParts = this._hasAllBatteryParts(level + 1);
    const chargePct   = max > 0 ? pct : 0;
    const barCol      = chargePct > 60 ? '#4caf50' : chargePct > 25 ? '#ffd600' : '#e53935';

    if (level === 0) {
      return `
        <div class="battery-card unbuilt">
          <div class="bat-icon">🔋</div>
          <div class="bat-body">
            <div class="bat-name">Battery Bank <span class="gen-lv">Not Built</span></div>
            <div class="bat-desc">Stores surplus power for night use and peak demand. 
              Build by crafting battery parts at the Electric Bench, then assembling here.</div>
            <div class="gen-pips">${pips}</div>
            <div class="bat-parts">${this._batteryPartsStatus(1)}</div>
          </div>
          <button class="btn-gen-upgrade" onclick="Power.buildBattery()"
            ${hasAllParts ? '' : 'disabled'}>⚡ BUILD</button>
        </div>`;
    }

    return `
      <div class="battery-card built">
        <div class="bat-icon">🔋</div>
        <div class="bat-body">
          <div class="bat-name">Battery Bank <span class="gen-lv">Lv ${level}/10</span></div>
          <div class="bat-charge-wrap">
            <div class="bat-charge-bar" style="width:${chargePct}%;background:${barCol}"></div>
          </div>
          <div class="bat-stats">
            <span>🔋 ${Math.round(stored)} / ${max} Wh (${pct}%)</span>
          </div>
          <div class="gen-pips">${pips}</div>
          ${level < 10 ? `<div class="bat-parts">${this._batteryPartsStatus(level+1)}</div>` : ''}
        </div>
        ${level < 10 ? `<button class="btn-gen-upgrade" onclick="Power.buildBattery()"
          ${hasAllParts ? '' : 'disabled'}>▲ UPGRADE BANK</button>` : ''}
      </div>`;
  },

  _batteryPartsStatus(targetLevel) {
    const parts = this._batteryParts(targetLevel);
    return '<div class="bat-parts-list">' +
      Object.entries(parts).map(([res, need]) => {
        const have = State.data.inventory[res] || 0;
        const ok   = have >= need;
        return `<span class="bat-part ${ok?'have':'missing'}">${Crafting.emojiMap[res]||'📦'} ${res} ${have}/${need} ${ok?'✓':'✗'}</span>`;
      }).join('') +
    '</div>';
  },

  _batteryParts(level) {
    // Parts needed to build/upgrade battery to this level
    // Requires parts crafted at the electric bench
    const base = {
      battery_cell:   level * 2,       // crafted at electric bench
      copper_wire:    level * 3,       // crafted at electric bench
      steel_casing:   level,           // crafted at electric bench
    };
    if (level >= 5) base.capacitor = level - 4;   // advanced part
    if (level >= 8) base.power_core = level - 7;  // rare part
    return base;
  },

  _hasAllBatteryParts(level) {
    const parts = this._batteryParts(level);
    return Object.entries(parts).every(([res, need]) =>
      (State.data.inventory[res] || 0) >= need
    );
  },

  buildBattery() {
    const p         = State.data.power;
    const curLevel  = p.battery.level;
    const nextLevel = curLevel + 1;
    if (nextLevel > 10) return;

    if (!this._hasAllBatteryParts(nextLevel)) {
      Utils.toast('❌ Missing battery parts! Craft them at the Electric Bench.', 'bad');
      return;
    }

    // Consume parts
    const parts = this._batteryParts(nextLevel);
    Object.entries(parts).forEach(([res, amt]) => State.consumeResource(res, amt));

    p.battery.level = nextLevel;
    const newMax    = this.getMaxStorage();

    Utils.toast(`🔋 Battery Bank upgraded to Level ${nextLevel}! Stores ${newMax} Wh.`, 'good', 4000);
    Audio.sfxCraft();
    Base.updateNight();
    this.renderPanel();
  },

  _consumersPanel(consumers, gen) {
    const items = [
      { key:'lights',    icon:'💡', name:'Base Lighting',     cost:0.5,  req:'hut Lv2+',        unlock: 'lights' },
      { key:'elecFence', icon:'⚡', name:'Electric Fence',    cost:1.0,  req:'fence upgrade',   unlock: 'elecFence' },
      { key:'waterPump', icon:'💧', name:'Electric Pump',     cost:0.8,  req:'well Lv3',        unlock: 'waterPump' },
      { key:'elecBench', icon:'🔬', name:'Electric Bench',    cost:0.3,  req:'built',           unlock: 'elecBench' },
    ].map(c => {
      const isUnlocked = State.data.power.unlockedConsumers?.[c.unlock] || false;
      const isOn       = consumers[c.key] || false;
      const canAfford  = gen >= c.cost || this.getStored() > 0;
      return `
        <div class="consumer-row ${isUnlocked ? '' : 'locked'}">
          <span class="consumer-icon">${c.icon}</span>
          <div class="consumer-info">
            <span class="consumer-name">${c.name}</span>
            <span class="consumer-cost">▼ ${c.cost}W/hr</span>
            ${!isUnlocked ? `<span class="consumer-req">Requires: ${c.req}</span>` : ''}
          </div>
          ${isUnlocked ? `<button class="btn-consumer-toggle ${isOn?'on':''}"
            onclick="Power.toggleConsumer('${c.key}')"
            ${!canAfford && !isOn ? 'disabled' : ''}>
            ${isOn ? 'ON ✓' : 'OFF'}
          </button>` : '<span class="consumer-locked">🔒</span>'}
        </div>
      `;
    }).join('');
    return `<div class="consumers-list">${items}</div>`;
  },

  _calcDrain(consumers) {
    let d = 0;
    if (consumers.lights)    d += 0.5;
    if (consumers.elecFence) d += 1.0;
    if (consumers.waterPump) d += 0.8;
    if (consumers.elecBench) d += 0.3;
    return d;
  },

  toggleConsumer(key) {
    const p = State.data.power;
    p.consumers[key] = !p.consumers[key];
    if (p.consumers[key]) {
      const names = {lights:'💡 Lights on!',elecFence:'⚡ Electric fence active!',waterPump:'💧 Pump running!',elecBench:'🔬 Bench powered!'};
      Utils.toast(names[key] || 'Consumer on', 'good');
    }
    this.renderPanel();
  },

  // ── Generator upgrade ─────────────────────
  upgradeGenerator(key) {
    const p        = State.data.power;
    const curLevel = p.generators[key].level;
    const newLevel = curLevel + 1;
    if (newLevel > 10) return;

    if (!this._canAffordGenUpgrade(key, newLevel)) {
      Utils.toast('❌ Cannot afford this upgrade!', 'bad');
      return;
    }

    const cost = this._genUpgradeCostObj(key, newLevel);
    Object.entries(cost).forEach(([res, amt]) => State.consumeResource(res, amt));

    p.generators[key].level = newLevel;

    // Fuel woodburner/coal on first build
    if (newLevel === 1) {
      if (key === 'woodburner') p.woodburnerFuelled = State.consumeResource('wood', 1);
      if (key === 'coal')       p.coalFuelled       = State.consumeResource('coal', 1);
    }

    const names = { bike:'🚴 Bike Dynamo', woodburner:'🪵 Wood Burner', coal:'⛏ Coal Plant', solar:'☀ Solar Array' };
    Utils.toast(`${names[key]} upgraded to Lv${newLevel}! +${this._genOutput[key]}W max`, 'good', 3000);
    Audio.sfxCraft();
    Base.updateNight();
    this.renderPanel();
  },

  // Cost to build/upgrade a generator to targetLevel
  _genUpgradeCostObj(key, level) {
    const baseCosts = {
      bike:       { metal:3,       rope:2,         electronics:1 },
      woodburner: { metal:4,       wood:5 },
      coal:       { metal:6,       chemicals:2,    rope:2 },
      solar:      { electronics:4, metal:3,        glass:2 }
    };
    const base = baseCosts[key];
    // Each level costs ~level× the base
    const result = {};
    Object.entries(base).forEach(([r, v]) => {
      result[r] = Math.ceil(v * (0.8 + level * 0.4));
    });
    return result;
  },

  _genUpgradeCost(key, level) {
    const c = this._genUpgradeCostObj(key, level);
    return Object.entries(c)
      .map(([r,v]) => `${Crafting.emojiMap[r]||'📦'}${v}`)
      .join(' ');
  },

  _canAffordGenUpgrade(key, level) {
    return Object.entries(this._genUpgradeCostObj(key, level))
      .every(([r, v]) => (State.data.inventory[r] || 0) >= v);
  },

  // ── Unlock a consumer (called when craft is applied) ──
  unlockConsumer(key) {
    const p = State.data.power;
    if (!p.unlockedConsumers) p.unlockedConsumers = {};
    p.unlockedConsumers[key] = true;
    Utils.toast(`🔌 ${key} unlocked as power consumer!`, 'good', 3000);
  }
};
