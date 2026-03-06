// ═══════════════════════════════════════════
// PEDAL OR DIE — map.js  (Phase 4)
// All 8 locations with unique events, loot tiers,
// danger scaling, and location preview screen
// ═══════════════════════════════════════════

const MapScreen = {

  _previewLocationId: null,

  // ── Location definitions ──────────────────
  locations: {
    forest: {
      id: 'forest', name: 'FOREST', emoji: '🌲',
      danger: 'LOW', dangerLevel: 1, dangerCol: '#4caf50',
      desc: 'Dense mutated woodland. Good for basic materials.',
      flavour: 'The trees here have grown wrong — twisted bark, glowing fungi.',
      bgEmoji: '🌲🌲🌳🌲🌳🌲🌲🌲',
      bgColor: '#0d1a08',
      energyCost: 10, duration: 60,
      animals: ['wolf', 'boar', 'insect', 'bear'],
      encounterChance: 0.20,
      loot: {
        common:    { resources: ['wood','rope','food'],      weight: 70 },
        rare:      { resources: ['wood','food','rope'],      weight: 25 },
        legendary: { resources: ['rope','food'],             weight: 5  }
      },
      events: [
        { id:'mushroom_patch', text:'🍄 Found a patch of edible fungi!', reward:{ food:3 }, chance:0.15 },
        { id:'fallen_tree',    text:'🪵 Large fallen tree — easy pickings!', reward:{ wood:5 }, chance:0.12 },
        { id:'vine_rope',      text:'🪢 Thick vines — good rope material!', reward:{ rope:4 }, chance:0.10 },
        { id:'survivors_note', text:'📝 Found a note: "They come at dusk. Stay moving."', reward:{}, chance:0.05 },
        { id:'berry_bush',     text:'🫐 Wild berries — safe to eat.', reward:{ food:2 }, chance:0.18 }
      ],
      uniqueMaterial: { key:'spores',       name:'Glowing Spores',   emoji:'🍄' },
      unlocked: true
    },

    abandoned_farm: {
      id: 'abandoned_farm', name: 'ABANDONED FARM', emoji: '🚜',
      danger: 'LOW', dangerLevel: 1, dangerCol: '#4caf50',
      desc: 'Overgrown farmland with wild crops and rusted tools.',
      flavour: 'Crops still grow here — mutated but edible. Something moved the tractor.',
      bgEmoji: '🌾🚜🌾🌾🐄🌾🌾🚜',
      bgColor: '#1a1500',
      energyCost: 12, duration: 60,
      animals: ['wolf', 'boar', 'insect'],
      encounterChance: 0.18,
      loot: {
        common:    { resources: ['food','wood','rope'],      weight: 65 },
        rare:      { resources: ['food','food','cloth'],     weight: 28 },
        legendary: { resources: ['food','food','food'],      weight: 7  }
      },
      events: [
        { id:'crop_field',   text:'🌾 Field of wild grain — harvesting some!', reward:{ food:5 }, chance:0.20 },
        { id:'tool_shed',    text:'🔧 Old tool shed — some rope and wood inside.', reward:{ rope:3, wood:2 }, chance:0.15 },
        { id:'water_trough', text:'🪣 Water trough still has clean water!', reward:{ water:4 }, chance:0.12 },
        { id:'old_silo',     text:'🏚 Silo door flaps open — food stores inside!', reward:{ food:6 }, chance:0.08 },
        { id:'fence_wire',   text:'🔩 Barbed wire on fences — carefully removed.', reward:{ metal:2, rope:1 }, chance:0.10 }
      ],
      uniqueMaterial: { key:'wild_seeds',   name:'Wild Seeds',        emoji:'🌱' },
      unlocked: false
    },

    gas_station: {
      id: 'gas_station', name: 'GAS STATION', emoji: '⛽',
      danger: 'MEDIUM', dangerLevel: 2, dangerCol: '#ffd600',
      desc: 'Abandoned fuel stop. Potentially explosive — be careful.',
      flavour: 'The pumps have been dry for years. But the storeroom might still have something.',
      bgEmoji: '⛽🏪⛽🛢️⛽🏚️⛽',
      bgColor: '#1a1000',
      energyCost: 15, duration: 65,
      animals: ['rat', 'bird'],
      encounterChance: 0.22,
      loot: {
        common:    { resources: ['gasoline','metal'],            weight: 60 },
        rare:      { resources: ['gasoline','chemicals','metal'], weight: 30 },
        legendary: { resources: ['electronics','gasoline'],      weight: 10 }
      },
      events: [
        { id:'fuel_drum',   text:'🛢 Found a sealed fuel drum — jackpot!', reward:{ gasoline:6 }, chance:0.15 },
        { id:'car_battery', text:'🔋 Old car battery — still some charge!', reward:{ electronics:2 }, chance:0.12 },
        { id:'storeroom',   text:'🏪 Back storeroom has supplies!', reward:{ gasoline:3, chemicals:2 }, chance:0.10 },
        { id:'motor_oil',   text:'🔩 Cans of motor oil and spare parts.', reward:{ metal:3, chemicals:1 }, chance:0.14 },
        { id:'gas_leak',    text:'⚠ Gas leak! Had to leave quickly. Lost some energy.', reward:{ energy:-15 }, chance:0.08 }
      ],
      uniqueMaterial: { key:'engine_parts', name:'Engine Parts',      emoji:'⚙️' },
      unlocked: false
    },

    city_ruins: {
      id: 'city_ruins', name: 'CITY RUINS', emoji: '🏙️',
      danger: 'MEDIUM', dangerLevel: 2, dangerCol: '#ffd600',
      desc: 'Collapsed buildings, scavengers lurk in every shadow.',
      flavour: 'The city fell fast. Skyscrapers became tombs. There\'s still so much left behind.',
      bgEmoji: '🏚️🧱🏗️🏚️🧱🏙️🏚️🧱',
      bgColor: '#0d0d12',
      energyCost: 20, duration: 70,
      animals: ['rat', 'bird', 'zombie_dog'],
      encounterChance: 0.28,
      loot: {
        common:    { resources: ['metal','cloth','electronics'],  weight: 55 },
        rare:      { resources: ['electronics','medicine','metal'], weight: 33 },
        legendary: { resources: ['electronics','electronics'],     weight: 12 }
      },
      events: [
        { id:'apartment',    text:'🏢 Searched an apartment — clothes and supplies!', reward:{ cloth:4, medicine:1 }, chance:0.15 },
        { id:'shop',         text:'🏪 Old electronics store — still some parts!', reward:{ electronics:3 }, chance:0.12 },
        { id:'car_wreck',    text:'🚗 Stripped a wrecked car for metal!', reward:{ metal:5 }, chance:0.14 },
        { id:'glass_panes',  text:'🪟 Found intact window panes — useful for solar!', reward:{ glass:3 }, chance:0.10 },
        { id:'pharmacy',     text:'💊 Found an intact pharmacy!', reward:{ medicine:4 }, chance:0.08 },
        { id:'collapsed_floor', text:'⚠ Floor collapsed! Barely escaped. Lost energy.', reward:{ energy:-20 }, chance:0.07 },
        { id:'survivor_cache', text:'🎒 Hidden cache from another survivor!', reward:{ food:3, medicine:2, rope:2 }, chance:0.06 }
      ],
      uniqueMaterial: { key:'scrap_wire',   name:'Scrap Wire',        emoji:'🔌' },
      unlocked: false
    },

    junkyard: {
      id: 'junkyard', name: 'JUNKYARD', emoji: '♻️',
      danger: 'MEDIUM', dangerLevel: 2, dangerCol: '#ffd600',
      desc: 'Mountains of scrap. If it\'s made of metal, it\'s here.',
      flavour: 'Pre-collapse people threw away so much. Now those "worthless" things are survival.',
      bgEmoji: '🔩🗑️♻️🚗💀🔩🗑️♻️',
      bgColor: '#100d0d',
      energyCost: 18, duration: 65,
      animals: ['rat', 'bird', 'insect'],
      encounterChance: 0.25,
      loot: {
        common:    { resources: ['metal','rope','electronics','coal'],    weight: 58 },
        rare:      { resources: ['electronics','metal','metal','glass'],  weight: 30 },
        legendary: { resources: ['electronics','electronics','coal'],     weight: 12 }
      },
      events: [
        { id:'scrap_pile',   text:'🔩 Massive scrap pile — good metal haul!', reward:{ metal:6 }, chance:0.18 },
        { id:'electronics',  text:'📟 Old circuit boards in a bin!', reward:{ electronics:4 }, chance:0.12 },
        { id:'cable_wire',   text:'🪢 Coils of steel cable — good rope!', reward:{ rope:4 }, chance:0.15 },
        { id:'diesel_tank',  text:'⛽ Small diesel tank — still has fuel!', reward:{ gasoline:3 }, chance:0.10 },
        { id:'crushing_machine', text:'⚠ Crusher activated! Barely dodged it.', reward:{ energy:-10 }, chance:0.06 }
      ],
      uniqueMaterial: { key:'circuit_board', name:'Circuit Board',    emoji:'💾' },
      unlocked: false
    },

    hospital: {
      id: 'hospital', name: 'HOSPITAL', emoji: '🏥',
      danger: 'HIGH', dangerLevel: 3, dangerCol: '#ff6d00',
      desc: 'Medical goldmine — if you can survive the infected inside.',
      flavour: 'The sick came here first. Most never left. The medicine is still here though.',
      bgEmoji: '🏥🚑🏥🩺🏥🚑🏥',
      bgColor: '#100d0d',
      energyCost: 30, duration: 75,
      animals: ['zombie_dog', 'rat', 'insect'],
      encounterChance: 0.35,
      loot: {
        common:    { resources: ['medicine','cloth'],               weight: 50 },
        rare:      { resources: ['medicine','medicine','chemicals'], weight: 35 },
        legendary: { resources: ['medicine','medicine','electronics'], weight: 15 }
      },
      events: [
        { id:'pharmacy',     text:'💊 Hospital pharmacy — medicine everywhere!', reward:{ medicine:6 }, chance:0.18 },
        { id:'supply_closet',text:'🧴 Supply closet full of bandages and chemicals.', reward:{ cloth:4, chemicals:3 }, chance:0.15 },
        { id:'lab',          text:'🔬 Research lab — experimental supplies!', reward:{ chemicals:4, medicine:2 }, chance:0.10 },
        { id:'blood_trail',  text:'🩸 Fresh blood trail... you are not alone here.', reward:{}, chance:0.08 },
        { id:'biohazard',    text:'☣ Biohazard spill! Took damage avoiding it.', reward:{ energy:-25 }, chance:0.07 },
        { id:'doctor_notes', text:'📋 Doctor\'s notes: "Day 14 — the mutation is accelerating."', reward:{}, chance:0.05 }
      ],
      uniqueMaterial: { key:'antiseptic',   name:'Antiseptic',        emoji:'🧫' },
      unlocked: false
    },

    cave: {
      id: 'cave', name: 'CAVE SYSTEM', emoji: '🕳️',
      danger: 'EXTREME', dangerLevel: 4, dangerCol: '#e53935',
      desc: 'Dark, deep, and something ancient lives here.',
      flavour: 'The caves go deeper than any map shows. The sounds from below are not natural.',
      bgEmoji: '🦇🕳️🪨🕳️🦇🪨🕳️',
      bgColor: '#050508',
      energyCost: 35, duration: 80,
      animals: ['bear', 'insect', 'boss_mutant'],
      encounterChance: 0.40,
      loot: {
        common:    { resources: ['metal','chemicals','rope','coal'],       weight: 45 },
        rare:      { resources: ['chemicals','electronics','metal','coal'], weight: 35 },
        legendary: { resources: ['electronics','chemicals','coal'],        weight: 20 }
      },
      events: [
        { id:'crystal_vein',  text:'💎 Crystal vein — embedded with rare minerals!', reward:{ chemicals:5, metal:3 }, chance:0.12 },
        { id:'coal_seam',     text:'⛏ Coal seam exposed! Rich fuel source.', reward:{ coal:6 }, chance:0.14 },
        { id:'underground_stream', text:'💧 Underground stream — fresh water source!', reward:{ water:8 }, chance:0.10 },
        { id:'old_bunker',    text:'🪖 Military bunker built into the cave!', reward:{ metal:5, electronics:3 }, chance:0.08 },
        { id:'ancient_markings', text:'⚠ Strange markings on the walls. Something was worshipped here.', reward:{}, chance:0.06 },
        { id:'cave_collapse', text:'💥 Minor collapse! Took damage and lost some resources.', reward:{ energy:-30 }, chance:0.10 },
        { id:'bioluminescence', text:'🌟 Glowing fungi — useful for light!', reward:{ chemicals:4 }, chance:0.08 }
      ],
      uniqueMaterial: { key:'cave_crystal', name:'Cave Crystal',      emoji:'💎' },
      unlocked: false
    },

    military_base: {
      id: 'military_base', name: 'MILITARY BASE', emoji: '🪖',
      danger: 'EXTREME', dangerLevel: 4, dangerCol: '#e53935',
      desc: 'The last government stronghold. Now overrun.',
      flavour: 'Armoured vehicles. Ammunition crates. And whatever the military was experimenting with.',
      bgEmoji: '🪖🔫🏗️🚧🪖🔫🏗️',
      bgColor: '#0a0a05',
      energyCost: 40, duration: 90,
      animals: ['zombie_dog', 'bird', 'boss_mutant'],
      encounterChance: 0.45,
      loot: {
        common:    { resources: ['metal','electronics','medicine'],          weight: 40 },
        rare:      { resources: ['electronics','electronics','medicine'],     weight: 35 },
        legendary: { resources: ['electronics','medicine','chemicals','metal'], weight: 25 }
      },
      events: [
        { id:'armoury',       text:'🔫 Armoury door open — weapon parts and metal!', reward:{ metal:8, electronics:3 }, chance:0.14 },
        { id:'med_bay',       text:'🏥 Military med bay — top grade supplies!', reward:{ medicine:6, chemicals:3 }, chance:0.12 },
        { id:'lab_research',  text:'🔬 Research lab — unknown experiments left running.', reward:{ chemicals:5, electronics:4 }, chance:0.10 },
        { id:'radio_room',    text:'📡 Radio room — salvaged some electronics.', reward:{ electronics:6 }, chance:0.10 },
        { id:'tripwire',      text:'⚠ Tripwire! Triggered an alarm. Lost energy fleeing.', reward:{ energy:-25 }, chance:0.08 },
        { id:'classified_doc', text:'📁 CLASSIFIED: "Project MUTAGEN — Phase 3 complete."', reward:{}, chance:0.05 },
        { id:'weapons_cache', text:'💣 Hidden weapons cache — incredible haul!', reward:{ metal:10, electronics:6, chemicals:4 }, chance:0.04 }
      ],
      uniqueMaterial: { key:'military_chip', name:'Military Chip', emoji:'🎖️' },
      unlocked: false
    }
  },

  // ── Render world map ──────────────────────
  render() {
    const grid = document.getElementById('map-grid');
    if (!grid) return;

    const unlocked = State.data.world.unlockedLocations;

    grid.innerHTML = Object.values(this.locations).map(loc => {
      const isUnlocked = unlocked.includes(loc.id);
      const isNight    = State.data.world.isNight;
      const hasLight   = State.data.base.hasLight;
      const nightBlock = isNight && !hasLight && loc.dangerLevel > 2;

      return `
        <div class="map-location
          ${isUnlocked ? '' : 'locked'}
          ${nightBlock ? 'night-blocked' : ''}"
          onclick="${isUnlocked && !nightBlock ? `MapScreen._showPreview('${loc.id}')` : ''}">
          <div class="map-loc-icon">${loc.emoji}</div>
          <div class="map-loc-name">${loc.name}</div>
          <div class="map-loc-danger" style="color:${loc.dangerCol}">
            ${'⚠'.repeat(loc.dangerLevel)} ${loc.danger}
          </div>
          <div class="map-loc-yields">
            ${loc.loot.common.resources.slice(0,2).map(r => Foraging.emojiMap[r]||'📦').join('')}
            ${loc.loot.rare.resources.slice(0,1).map(r => `<span style="color:#ffd600">${Foraging.emojiMap[r]||'📦'}</span>`).join('')}
          </div>
          <div class="map-loc-energy">⚡${loc.energyCost}</div>
          ${!isUnlocked ? '<div class="map-loc-lock">🔒 LOCKED</div>' : ''}
          ${nightBlock  ? '<div class="map-loc-lock" style="color:#7986cb">🌙 NEED LIGHT</div>' : ''}
        </div>
      `;
    }).join('');
  },

  // ── Intensity multipliers ────────────────
  _intensity: 'normal',  // 'easy' | 'normal' | 'hard'

  _intensityConfig: {
    easy:   { label:'🟢 EASY',   energyMult:0.6, durationMult:0.7, lootMult:0.6, encounterMult:0.4, targetCPMMult:0.7, desc:'Less energy, shorter trip\nFewer resources & encounters' },
    normal: { label:'🟡 NORMAL', energyMult:1.0, durationMult:1.0, lootMult:1.0, encounterMult:1.0, targetCPMMult:1.0, desc:'Standard expedition' },
    hard:   { label:'🔴 HARD',   energyMult:1.4, durationMult:1.4, lootMult:1.8, encounterMult:1.7, targetCPMMult:1.3, desc:'More energy needed, longer\n2× loot but brutal encounters' },
  },

  // ── Show location preview before committing ─
  _showPreview(locationId) {
    const loc = this.locations[locationId];
    if (!loc) return;

    this._previewLocationId = locationId;
    const container = document.getElementById('map-preview');
    if (!container) return;

    const animalList = loc.animals.map(id => {
      const a = Animals.types[id];
      return a ? `${a.emoji} ${a.name}` : '';
    }).join(' · ');

    this._renderPreview(loc, animalList);
    Utils.show('map-preview');
  },

  _renderPreview(loc, animalList) {
    const container = document.getElementById('map-preview');
    if (!container) return;
    const cfg       = this._intensityConfig[this._intensity];
    const cost      = Math.round(loc.energyCost * cfg.energyMult);
    const dur       = Math.round(loc.duration   * cfg.durationMult);
    const energyOk  = State.data.player.energy >= cost;
    const energyCol = energyOk ? 'var(--col-green)' : 'var(--col-red)';

    container.innerHTML = `
      <div class="preview-header">
        <span class="preview-icon">${loc.emoji}</span>
        <div>
          <div class="preview-name">${loc.name}</div>
          <div class="preview-danger" style="color:${loc.dangerCol}">
            ${'⚠'.repeat(loc.dangerLevel)} ${loc.danger}
          </div>
        </div>
      </div>
      <div class="preview-flavour">"${loc.flavour}"</div>
      <div class="preview-row">
        <span class="preview-label">⚡ ENERGY</span>
        <span style="color:${energyCol};font-family:var(--font-pixel);font-size:0.45rem">
          ${cost}${energyOk ? ' ✓' : ` (need ${cost - Math.round(State.data.player.energy)} more)`}
        </span>
      </div>
      <div class="preview-row">
        <span class="preview-label">⏱ DURATION</span>
        <span class="preview-val">${dur}s</span>
      </div>
      <div class="preview-row">
        <span class="preview-label">🎲 ENCOUNTERS</span>
        <span class="preview-val">${Math.round(loc.encounterChance * cfg.encounterMult * 100)}%/min</span>
      </div>
      <div class="preview-section-title">🎒 LOOT TIERS</div>
      <div class="preview-loot">
        <div class="loot-tier common">
          <span class="tier-label">COMMON</span>
          <span class="tier-items">${loc.loot.common.resources.map(r=>Foraging.emojiMap[r]||'📦').join(' ')}</span>
        </div>
        <div class="loot-tier rare">
          <span class="tier-label">RARE</span>
          <span class="tier-items">${loc.loot.rare.resources.map(r=>Foraging.emojiMap[r]||'📦').join(' ')}</span>
        </div>
        <div class="loot-tier legendary">
          <span class="tier-label">LEGENDARY</span>
          <span class="tier-items">${loc.loot.legendary.resources.map(r=>Foraging.emojiMap[r]||'📦').join(' ')}</span>
        </div>
      </div>
      <div class="preview-section-title">🦟 KNOWN THREATS</div>
      <div class="preview-animals">${animalList}</div>

      <!-- ── Intensity picker ── -->
      <div class="intensity-section">
        <div class="intensity-title">🎯 EXPEDITION INTENSITY</div>
        <div class="intensity-row">
          <button class="intensity-btn ${this._intensity==='easy'   ? 'sel-easy'   : ''}" data-int="easy">
            🟢 EASY<br/>Less energy<br/>Less loot
          </button>
          <button class="intensity-btn ${this._intensity==='normal' ? 'sel-normal' : ''}" data-int="normal">
            🟡 NORMAL<br/>Standard<br/>trip
          </button>
          <button class="intensity-btn ${this._intensity==='hard'   ? 'sel-hard'   : ''}" data-int="hard">
            🔴 HARD<br/>More energy<br/>2× loot
          </button>
        </div>
      </div>

      <div class="preview-actions">
        <button class="btn-pixel btn-primary" id="btn-go-expedition"
          ${energyOk ? '' : 'disabled style="opacity:0.4;cursor:not-allowed"'}>
          🚴 GO — ${cost}⚡
        </button>
        <button class="btn-pixel btn-secondary" id="btn-cancel-preview">✕ CANCEL</button>
      </div>
    `;

    // Intensity buttons
    container.querySelectorAll('.intensity-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this._intensity = btn.dataset.int;
        const al = loc.animals.map(id => { const a=Animals.types[id]; return a?`${a.emoji} ${a.name}`:''; }).join(' · ');
        this._renderPreview(loc, al);
      });
    });

    document.getElementById('btn-go-expedition')?.addEventListener('click', () => {
      if (energyOk) this._goExpedition(loc.id);
    });
    document.getElementById('btn-cancel-preview')?.addEventListener('click', () => {
      Utils.hide('map-preview');
      this._previewLocationId = null;
    });
  },

  // ── Start expedition with intensity applied ──
  _goExpedition(locationId) {
    const loc = this.locations[locationId];
    if (!loc) return;
    const cfg = this._intensityConfig[this._intensity];

    Utils.hide('map-preview');

    // Deduct scaled energy cost
    const cost = Math.round(loc.energyCost * cfg.energyMult);
    State.data.player.energy = Utils.clamp(State.data.player.energy - cost, 0, 100);

    // Pass intensity config to Foraging so it can scale gathering/encounters
    Foraging.start(locationId, cfg);
  },

  // ── Unlock location ───────────────────────
  unlock(locationId) {
    if (!State.data.world.unlockedLocations.includes(locationId)) {
      State.data.world.unlockedLocations.push(locationId);
      const loc = this.locations[locationId];
      Utils.toast(`🗺 New location unlocked: ${loc?.emoji} ${loc?.name}!`, 'good', 4000);
    }
  }
};

// Expose location data on State so foraging.js and worldmap.js
// can read locations without importing MapScreen directly.
// This is a reference alias — no data is copied.
State.locations = MapScreen.locations;
