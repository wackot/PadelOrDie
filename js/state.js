// ═══════════════════════════════════════════
// PEDAL OR DIE — state.js
// Central game state — single source of truth
// ALL game data lives here. Never duplicate state.
// ═══════════════════════════════════════════

const State = {

  // ── Default / initial state ──────────────
  defaults: {
    player: {
      hunger:  100,   // 0-100, drops over time
      thirst:  100,   // 0-100, drops faster than hunger
      energy:  100,   // 0-100, drops when active
      equipment: {
        weapon:   null,
        armour:   null,
        tool:     null,
        light:    null,
        bikeUpgrade: null
      }
    },

    base: {
      defenceRating:   10,
      hasLight:        false,
      hasPower:        false,
      waterPerDraw:    5,
      passiveFood:     0,
      passiveWater:    0,  // from greenhouse upgrades
      cropYield:       0,  // from field upgrades
      raidReduction:   0,
      storageMult:     1,
      bikeEfficiency:  1,
      cargoBonus:      1,
      energyCostMult:  1,
      armourBonus:     0,
      shelterLevel:    1,
      // Storage caps per resource tier
      storageCapA:     50,    // Tier A: wood, metal, food, water, cloth, rope
      storageCapB:     0,     // Tier B: electronics, chemicals, gasoline, medicine (unlocks storage lv3)
      storageCapC:     0,     // Tier C: rare/unique location materials (unlocks storage lv5)
      storageCapD:     0,     // Tier D: electrical bench parts (unlocks storage lv8)
      // Bike
      bikeLvl:         1,
      bikeHasLight:    false,
      bikeCargoBonus:  1.0,   // cargo multiplier from bike upgrades
      bikeNightMult:   1.0,   // night loot multiplier
      buildings: {
        // Core — always available
        house:        { level: 1, name: 'Shelter',        emoji: '🏚️' },
        fridge:       { level: 1, name: 'Food Store',     emoji: '🧊' },
        well:         { level: 1, name: 'Well',           emoji: '🪣' },
        table:        { level: 1, name: 'Crafting Table', emoji: '🪚' },
        fence:        { level: 1, name: 'Defences',       emoji: '🚧' },
        storage:      { level: 1, name: 'Storage',        emoji: '🗃️' },
        bike:         { level: 1, name: 'Bike',            emoji: '🚴' },
        // Unlocked by shelter upgrades (level 0 = not yet built/unlocked)
        greenhouse:   { level: 0, name: 'Greenhouse',     emoji: '🌿' },
        field:        { level: 0, name: 'Crop Field',     emoji: '🌾' },
        rain_collector:{ level: 0, name: 'Rain Collector',emoji: '🌧️' },
        compost_bin:  { level: 0, name: 'Compost Bin',    emoji: '♻️' },
        watchtower:   { level: 0, name: 'Watchtower',     emoji: '🗼' },
        workshop:     { level: 0, name: 'Workshop',       emoji: '🔧' },
        smokehouse:   { level: 0, name: 'Smokehouse',     emoji: '🏭' },
        powerhouse:   { level: 0, name: 'Power House',    emoji: '⚡' },
        dynamo_bike:  { level: 0, name: 'Dynamo Bike',    emoji: '🚴' },
        woodburner:   { level: 0, name: 'Wood Burner',    emoji: '🪵' },
        coal_plant:   { level: 0, name: 'Coal Plant',     emoji: '⛏️' },
        solar_array:  { level: 0, name: 'Solar Array',    emoji: '☀️' },
        battery_bank: { level: 0, name: 'Battery Bank',   emoji: '🔋' },
        elecbench:    { level: 0, name: 'Electric Bench', emoji: '🔬' },
        radio_tower:  { level: 0, name: 'Radio Tower',    emoji: '📡' },
        alarm_system: { level: 0, name: 'Alarm System',   emoji: '🔔' },
        medkit_station:{ level: 0, name: 'Medical Station',emoji: '🏥' },
        solar_station:{ level: 0, name: 'Solar Station',  emoji: '☀️' },
        bunker:       { level: 0, name: 'Bunker',         emoji: '🏗️' },
        baselights:   { level: 0, name: 'Base Lighting',  emoji: '💡' }
      }
    },

    power: {
      // Each generator: level 0 = not built, 1-10 = upgrade level
      generators: {
        bike:       { level: 0 },   // Bike Dynamo — pedal to generate
        woodburner: { level: 0 },   // Wood Burner — burns wood/day
        coal:       { level: 0 },   // Coal Plant  — burns coal/day
        solar:      { level: 0 }    // Solar Array — free daytime power
      },
      // Battery bank
      battery: { level: 0 },       // 0 = not built, 1-10 levels
      stored:   0,                  // current watt-hours stored
      // Fuel status (reset each dawn)
      woodburnerFuelled: false,
      coalFuelled:       false,
      // Active consumers (each draws power/hr when ON)
      consumers: {
        lights:    false,
        elecFence: false,
        waterPump: false,
        elecBench: false
      },
      // Which consumers have been unlocked (built)
      unlockedConsumers: {
        lights:    false,
        elecFence: false,
        waterPump: false,
        elecBench: false
      }
    },

    inventory: {
      // Raw resources
      wood:        0,
      metal:       0,
      gasoline:    0,
      food:        0,
      water:       0,
      medicine:    0,
      cloth:       0,
      electronics: 0,
      rope:        0,
      chemicals:   0,
      // Location-unique materials (only found at specific locations)
      spores:         0,  // Forest
      wild_seeds:     0,  // Abandoned Farm
      // Farming seeds (start with a few wheat/potato/carrot to get going)
      seeds_wheat:    3,
      seeds_potato:   2,
      seeds_carrot:   2,
      seeds_beans:    0,
      seeds_herb:     0,
      seeds_sunflower:0,
      seeds_mushroom: 0,
      seeds_mutant:   0,
      engine_parts:   0,  // Gas Station
      scrap_wire:     0,  // City Ruins
      circuit_board:  0,  // Junkyard
      antiseptic:     0,  // Hospital
      cave_crystal:   0,  // Cave
      military_chip:  0,  // Military Base
      // Industrial / power resources
      coal:           0,  // Coal for Coal Plant generator
      glass:          0,  // Glass for Solar panels (found at junkyard/city)
      // Electrical bench crafted parts (for battery construction)
      battery_cell:   0,
      copper_wire:    0,
      steel_casing:   0,
      capacitor:      0,
      power_core:     0,
      // Crafted items (array of {id, name, emoji, quantity, type})
      items: []
    },

    // Resource tier definitions (for storage cap enforcement)
    resourceTiers: {
      A: ['wood','metal','food','water','cloth','rope'],
      B: ['electronics','chemicals','gasoline','medicine','coal','glass'],
      C: ['spores','wild_seeds','engine_parts','scrap_wire','circuit_board','antiseptic','cave_crystal','military_chip'],
      // Farming seeds use tier B storage (accessible early)
      // (seeds_* are added dynamically by Farming._ensureState)
      D: ['battery_cell','copper_wire','steel_casing','capacitor','power_core']
    },

    worldMapData: null,  // Generated procedural map (null = not yet created)

    world: {
      day:                1,
      hour:               8,
      isNight:            false,
      currentScreen:      'base',
      unlockedLocations:  ['forest'],
      discoveredResources: [],
      activeRaid:         false,
      raidStrength:       0,
      daysSinceLastRaid:  0,
      playerAway:         false   // true when foraging or travelling — set by Foraging/WorldMap
    },

    // Active building construction (one at a time)
    activeBuild: null,
    // { key, stateKey, newLevel, upg, secsLeft, secsTotal, onComplete }

    cadence: {
      clicksPerMinute:  0,
      targetCPM:        60,       // normal foraging target
      raidTargetCPM:    90,       // target during raid
      clickBuffer:      [],       // timestamps of recent clicks
      sessionClicks:    0
    },

    stats: {
      // Survival
      totalSessions:          0,
      totalClicksAllTime:     0,
      totalExpeditions:       0,
      totalResourcesGathered: 0,
      highestDay:             1,
      raidsRepelled:          0,
      raidsFailed:            0,
      animalsDefeated:        0,
      animalsFled:            0,
      // Fitness
      totalPedalMinutes:      0,   // cumulative pedalling time in minutes
      totalCaloriesBurned:    0,   // estimated calories
      totalDistanceKm:        0,   // estimated km ridden
      bestCPM:                0,   // all-time peak CPM in any session
      avgCPM:                 0,   // running average CPM across all sessions
      sessionCPMSum:          0,   // sum of session avg CPMs (for rolling avg)
      sessionCount:           0,   // sessions with actual pedalling
      // This session
      sessionStartTime:       0,   // timestamp when current session began
      sessionPedalSecs:       0,   // pedalling seconds this session
      sessionBestCPM:         0,   // best CPM this session
      // Milestones (day first achieved)
      milestones: {},
      // Achievement tracking counters
      totalBuilds:          0,   // cumulative build/upgrade completions
      totalCrafted:         0,   // cumulative items crafted
      nightExpeditions:     0,   // expeditions started at night
      everStarved:          false, // hunger ever reached 0
      bossKilled:           false,
      titanKilled:          false,
      craftedCircuitBoard:  0,
      craftedMilitaryChip:  0,
      craftedPowerCore:     0
    },

    meta: {
      version:    '0.16',
      savedAt:    null,
      newGame:    true
    }
  },

  // ── Live state (populated on init) ───────
  data: null,

  // ── Init ─────────────────────────────────
  init() {
    this.data = Utils.clone(this.defaults);
    console.log('[State] Initialized with defaults');
  },

  // Load external data into state
  load(savedData) {
    // Merge saved data with defaults so new fields don't break old saves
    this.data = this._deepMerge(Utils.clone(this.defaults), savedData);
    console.log('[State] Loaded save data');
  },

  // ── Accessors ─────────────────────────────
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.data);
  },

  set(path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const obj  = keys.reduce((o, k) => o[k], this.data);
    if (obj) obj[last] = value;
  },

  // ── Helpers ───────────────────────────────

  // Add resources to inventory
  // Get storage cap for a resource type
  getStorageCap(type) {
    const tiers = this.defaults.resourceTiers;
    const b = this.data.base;
    if (tiers.D.includes(type)) return b.storageCapD > 0 ? b.storageCapD : 0;
    if (tiers.C.includes(type)) return b.storageCapC > 0 ? b.storageCapC : 0;
    if (tiers.B.includes(type)) return b.storageCapB > 0 ? b.storageCapB : 0;
    if (tiers.A.includes(type)) return b.storageCapA > 0 ? b.storageCapA : 50;
    return Infinity; // unknown / seed resources: no cap
  },

  addResource(type, amount) {
    if (this.data.inventory[type] === undefined) {
      this.data.inventory[type] = 0;
    }
    const cap = this.getStorageCap(type);
    const current = this.data.inventory[type] || 0;
    const canAdd = Math.max(0, Math.min(amount, cap - current));
    this.data.inventory[type] = current + canAdd;
    return canAdd > 0;
  },

  // Check if player has enough of a resource
  hasResource(type, amount) {
    return (this.data.inventory[type] || 0) >= amount;
  },

  // Consume resources (returns false if not enough)
  consumeResource(type, amount) {
    if (!this.hasResource(type, amount)) return false;
    this.data.inventory[type] -= amount;
    return true;
  },

  // Add item to inventory
  addItem(item) {
    const existing = this.data.inventory.items.find(i => i.id === item.id);
    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      this.data.inventory.items.push({ ...item, quantity: 1 });
    }
  },

  // Advance game time (1 unit = 1 game hour)
  advanceTime(hours = 1) {
    this.data.world.hour += hours;
    while (this.data.world.hour >= 24) {
      this.data.world.hour -= 24;
      this.data.world.day += 1;
      this.data.world.daysSinceLastRaid += 1;
      this.data.stats.highestDay = Math.max(
        this.data.stats.highestDay,
        this.data.world.day
      );
    }
    this.data.world.isNight = (
      this.data.world.hour >= 20 || this.data.world.hour < 6
    );
  },

  // Hook for DevMode to override survival drain (god mode / no drain).
  // devmode.js sets this: State.survivalMultiplierFn = () => DevMode.survivalMultiplier()
  // State never imports DevMode directly.
  survivalMultiplierFn: null,

  // Hook for DevMode to override build duration (instant build = 1s).
  buildSecsFn: null,

  // Hook for DevMode click-mode (mouse clicks count as pedalling).
  clickModeActiveFn: null,

  // Hook for DevMode.tick() — called each build timer tick.
  devTickFn: null,

  // Hook for DevMode.raidsBlocked() — lets raids.js check dev flags without importing DevMode.
  raidsBlockedFn: null,

  // Hook for Foraging._monsterSVG() — lets raids.js render monster art without importing Foraging.
  monsterSvgFn: null,

  // Hook for DevMode.forageDuration() — lets foraging.js check dev flags without importing DevMode.
  forageDurationFn: null,

  // Hook for DevMode.travelSpeedMultiplier() — lets worldmap.js check dev flags without importing DevMode.
  travelSpeedMultFn: null,

  // Adjust survival stats (hunger/thirst/energy)
  tickSurvival(deltaHours = 1) {
    const p = this.data.player;
    const mult = this.survivalMultiplierFn ? this.survivalMultiplierFn() : 1;
    p.hunger = Utils.clamp(p.hunger - (5  * deltaHours * mult), 0, 100);
    p.thirst = Utils.clamp(p.thirst - (8  * deltaHours * mult), 0, 100);
    p.energy = Utils.clamp(p.energy - (3  * deltaHours * mult), 0, 100);
  },

  // Serialise for saving
  serialise() {
    const copy = Utils.clone(this.data);
    copy.meta.savedAt = new Date().toISOString();
    copy.meta.newGame = false;
    return copy;
  },

  // Check whether the player's current inventory covers a cost object.
  // Used by Base (upgrade UI) and Crafting — keeps the check in one place.
  canAfford(cost) {
    if (!cost || !this.data) return false;
    return Object.entries(cost).every(([res, amt]) =>
      amt === 0 || (this.data.inventory[res] || 0) >= amt
    );
  },

  // Returns defence rating, minus electric fence bonus if power is out
  getEffectiveDefence() {
    const base = this.data.base.defenceRating || 0;
    const p    = this.data.power;
    // If elecFence consumer is active but stored power + generation == 0, fence is dark
    if (p?.consumers?.elecFence) {
      const stored = p.stored || 0;
      const gen    = (typeof Power !== 'undefined') ? Power.getGenerationRate() : 0;
      if (stored <= 0 && gen <= 0) {
        return Math.max(0, base - 60);  // remove the electric fence bonus
      }
    }
    return base;
  },


  // ── Private ───────────────────────────────
  _deepMerge(target, source) {
    for (const key of Object.keys(source)) {
      if (
        source[key] !== null &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key]) &&
        target.hasOwnProperty(key) &&
        typeof target[key] === 'object'
      ) {
        this._deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
    return target;
  }

};
