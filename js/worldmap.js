// ═══════════════════════════════════════════
// PEDAL OR DIE — worldmap.js  (Phase 7)
//
// PROCEDURAL WORLD MAP
// • 2000×2000 world, base in centre
// • Fog of war — black smoke reveals as you ride
// • 8 location zones placed at realistic distances
// • Click anywhere → travel time shown (speed-dependent)
// • Biking animation on map, fog clears as you move
// • Road encounters: slow=lose loot, medium=scare, fast=fight+rare
// • One-way trips — no need to bike back
// • Enter location zones for side-view foraging
//
// TRAVEL TIME:
//   Slow  (CPM < 40):  20 min real-world → 120s in-game
//   Normal (CPM 40–70): 15 min → 90s
//   Fast  (CPM > 70):  10 min → 60s
//   (scaled by distance — farthest zone = max time)
//
// REPLACES: map.js entirely
// ═══════════════════════════════════════════

const WorldMap = {

  // ── World dimensions ──────────────────────
  WORLD_W: 2000,
  WORLD_H: 2000,
  TILE:    20,      // pixels per world-unit on canvas

  // ── Location zone definitions ─────────────
  // Positions in world-units from centre (0,0)
  // Distance ~100–900 units; 1000 = edge of world
  locationDefs: [
    { id:'forest',        name:'FOREST',        emoji:'🌲', dangerLevel:1, dangerCol:'#4caf50',
      desc:'Dense mutated woodland.',
      wx: -280, wy: -180, radius: 90,
      bgColor:'#0d1a08', bgEmoji:'🌲🌲🌳🌲🌳🌲🌲',
      tileColor:'#1a3010', fogReveal:'#1a3a10',
      animals:['wolf','boar','insect','bear'], encounterChance:0.20,
      loot:{ common:{resources:['wood','rope','food'],weight:70}, rare:{resources:['wood','food','rope'],weight:25}, legendary:{resources:['rope','food'],weight:5} },
      events:[
        {id:'mushroom',text:'🍄 Found edible fungi!',reward:{food:3},chance:0.15},
        {id:'fallen',text:'🪵 Fallen tree — easy wood!',reward:{wood:5},chance:0.12},
        {id:'vines',text:'🪢 Thick vines for rope.',reward:{rope:4},chance:0.10},
        {id:'berries',text:'🫐 Wild berries — safe to eat.',reward:{food:2},chance:0.18}
      ],
      uniqueMaterial:{key:'spores',name:'Glowing Spores',emoji:'🍄'},
      foragingScene:'🌲🌿🌲🍄🌲🌿🌳🌲🍃', sceneAction:'🪓 Chopping wood',
      unlockAfterExpeditions: 0 },

    { id:'abandoned_farm', name:'ABANDONED FARM', emoji:'🚜', dangerLevel:1, dangerCol:'#4caf50',
      desc:'Overgrown farmland with wild crops.',
      wx: 220,  wy: -250, radius: 80,
      bgColor:'#1a1500', bgEmoji:'🌾🚜🌾🌾🐄🌾',
      tileColor:'#2a2010', fogReveal:'#2a2810',
      animals:['wolf','boar','insect'], encounterChance:0.18,
      loot:{ common:{resources:['food','wood','rope'],weight:65}, rare:{resources:['food','food','cloth'],weight:28}, legendary:{resources:['food','food','food'],weight:7} },
      events:[
        {id:'crops',text:'🌾 Wild grain field — harvesting!',reward:{food:5},chance:0.20},
        {id:'shed',text:'🔧 Tool shed — rope and wood.',reward:{rope:3,wood:2},chance:0.15},
        {id:'trough',text:'🪣 Clean water in trough!',reward:{water:4},chance:0.12},
        {id:'silo',text:'🏚 Old silo — food stores!',reward:{food:6},chance:0.08}
      ],
      uniqueMaterial:{key:'wild_seeds',name:'Wild Seeds',emoji:'🌱'},
      foragingScene:'🌾🌾🚜🌾🌱🌾🌾🐄🌾', sceneAction:'🌾 Harvesting crops',
      unlockAfterExpeditions: 2 },

    { id:'gas_station', name:'GAS STATION', emoji:'⛽', dangerLevel:2, dangerCol:'#ffd600',
      desc:'Abandoned fuel stop. Potentially explosive.',
      wx: 400,  wy: 80,  radius: 70,
      bgColor:'#1a1000', bgEmoji:'⛽🏪⛽🛢️⛽🏚️',
      tileColor:'#2a1a00', fogReveal:'#2a2000',
      animals:['rat','bird'], encounterChance:0.22,
      loot:{ common:{resources:['gasoline','metal'],weight:60}, rare:{resources:['gasoline','chemicals','metal'],weight:30}, legendary:{resources:['electronics','gasoline'],weight:10} },
      events:[
        {id:'drum',text:'🛢 Sealed fuel drum — jackpot!',reward:{gasoline:6},chance:0.15},
        {id:'battery',text:'🔋 Old car battery still charged!',reward:{electronics:2},chance:0.12},
        {id:'storeroom',text:'🏪 Back storeroom has supplies!',reward:{gasoline:3,chemicals:2},chance:0.10},
        {id:'gasleak',text:'⚠ Gas leak! Lost energy fleeing.',reward:{energy:-15},chance:0.08}
      ],
      uniqueMaterial:{key:'engine_parts',name:'Engine Parts',emoji:'⚙️'},
      foragingScene:'⛽🔧🛢️⛽🏪🔩⛽🔧🛢️', sceneAction:'🔧 Scavenging fuel & parts',
      unlockAfterExpeditions: 3 },

    { id:'city_ruins', name:'CITY RUINS', emoji:'🏙️', dangerLevel:2, dangerCol:'#ffd600',
      desc:'Collapsed buildings, scavengers everywhere.',
      wx: -180, wy: 380, radius: 110,
      bgColor:'#0d0d12', bgEmoji:'🏚️🧱🏗️🏚️🧱🏙️',
      tileColor:'#141418', fogReveal:'#1a1a24',
      animals:['rat','bird','zombie_dog'], encounterChance:0.28,
      loot:{ common:{resources:['metal','cloth','electronics'],weight:55}, rare:{resources:['electronics','medicine','metal'],weight:33}, legendary:{resources:['electronics','electronics'],weight:12} },
      events:[
        {id:'apartment',text:'🏢 Apartment — clothes and supplies!',reward:{cloth:4,medicine:1},chance:0.15},
        {id:'shop',text:'🏪 Electronics store — parts!',reward:{electronics:3},chance:0.12},
        {id:'carwreck',text:'🚗 Stripped wrecked car for metal!',reward:{metal:5},chance:0.14},
        {id:'glass',text:'🪟 Found intact glass panes!',reward:{glass:3},chance:0.10},
        {id:'pharmacy',text:'💊 Found an intact pharmacy!',reward:{medicine:4},chance:0.08},
        {id:'cache',text:'🎒 Hidden cache from a survivor!',reward:{food:3,medicine:2,rope:2},chance:0.06}
      ],
      uniqueMaterial:{key:'scrap_wire',name:'Scrap Wire',emoji:'🔌'},
      foragingScene:'🏚️🧱🔩🏗️🧱💡🔌🏚️🧱', sceneAction:'🔍 Scavenging ruins',
      unlockAfterExpeditions: 5 },

    { id:'junkyard', name:'JUNKYARD', emoji:'♻️', dangerLevel:2, dangerCol:'#ffd600',
      desc:'Mountains of scrap. Metal heaven.',
      wx: 560,  wy: -350, radius: 80,
      bgColor:'#100d0d', bgEmoji:'🔩🗑️♻️🚗💀🔩',
      tileColor:'#1a1010', fogReveal:'#241818',
      animals:['rat','bird','insect'], encounterChance:0.25,
      loot:{ common:{resources:['metal','rope','electronics','coal'],weight:58}, rare:{resources:['electronics','metal','metal','glass'],weight:30}, legendary:{resources:['electronics','electronics','coal'],weight:12} },
      events:[
        {id:'scrap',text:'🔩 Massive scrap pile — great haul!',reward:{metal:6},chance:0.18},
        {id:'elec',text:'📟 Old circuit boards in a bin!',reward:{electronics:4},chance:0.12},
        {id:'cable',text:'🪢 Steel cable coils — rope!',reward:{rope:4},chance:0.15},
        {id:'diesel',text:'⛽ Diesel tank — still has fuel!',reward:{gasoline:3},chance:0.10}
      ],
      uniqueMaterial:{key:'circuit_board',name:'Circuit Board',emoji:'💾'},
      foragingScene:'🔩♻️🚗🔩🛠️⚙️🔩♻️🚗', sceneAction:'⚙️ Digging through junk',
      unlockAfterExpeditions: 8 },

    { id:'hospital', name:'HOSPITAL', emoji:'🏥', dangerLevel:3, dangerCol:'#ff6d00',
      desc:'Medical goldmine — if you survive the infected.',
      wx: -520, wy: 280, radius: 75,
      bgColor:'#100d0d', bgEmoji:'🏥🚑🏥🩺🏥🚑',
      tileColor:'#1a0d0d', fogReveal:'#200f0f',
      animals:['zombie_dog','rat','insect'], encounterChance:0.35,
      loot:{ common:{resources:['medicine','cloth'],weight:50}, rare:{resources:['medicine','medicine','chemicals'],weight:35}, legendary:{resources:['medicine','medicine','electronics'],weight:15} },
      events:[
        {id:'pharmacy',text:'💊 Hospital pharmacy — medicine everywhere!',reward:{medicine:6},chance:0.18},
        {id:'supply',text:'🧴 Supply closet — bandages and chemicals.',reward:{cloth:4,chemicals:3},chance:0.15},
        {id:'lab',text:'🔬 Research lab — experimental supplies!',reward:{chemicals:4,medicine:2},chance:0.10},
        {id:'blood',text:'🩸 Fresh blood trail... you are not alone.',reward:{},chance:0.08}
      ],
      uniqueMaterial:{key:'antiseptic',name:'Antiseptic',emoji:'🧫'},
      foragingScene:'🏥💊🩺🧪🏥💉🩻💊🧴', sceneAction:'💊 Raiding medicine cabinets',
      unlockAfterExpeditions: 12 },

    { id:'cave', name:'DEEP CAVE', emoji:'🪨', dangerLevel:3, dangerCol:'#ff6d00',
      desc:'Dark cave system rich in minerals.',
      wx: -700, wy: -420, radius: 85,
      bgColor:'#050508', bgEmoji:'🪨🕯️🪨💎🪨🕯️',
      tileColor:'#0a0a0f', fogReveal:'#0f0f18',
      animals:['insect','rat','bear'], encounterChance:0.30,
      loot:{ common:{resources:['metal','chemicals','rope','coal'],weight:45}, rare:{resources:['chemicals','electronics','metal','coal'],weight:35}, legendary:{resources:['electronics','chemicals','coal'],weight:20} },
      events:[
        {id:'vein',text:'💎 Crystal vein! Rare minerals.',reward:{chemicals:5,metal:3},chance:0.12},
        {id:'coalseam',text:'⛏ Coal seam exposed! Rich fuel.',reward:{coal:6},chance:0.14},
        {id:'underground',text:'💧 Underground spring — clean water!',reward:{water:5},chance:0.10},
        {id:'collapse',text:'⚠ Partial collapse! Lost energy.',reward:{energy:-20},chance:0.08}
      ],
      uniqueMaterial:{key:'cave_crystal',name:'Cave Crystals',emoji:'💎'},
      foragingScene:'🪨⛏️🪨💎🕯️🪨⛏️💎🪨', sceneAction:'⛏ Mining deep rock',
      unlockAfterExpeditions: 18 },

    { id:'military_base', name:'MILITARY BASE', emoji:'🪖', dangerLevel:4, dangerCol:'#e53935',
      desc:'The last government stronghold. Now overrun.',
      wx: 680,  wy: 500, radius: 90,
      bgColor:'#0a0a05', bgEmoji:'🪖🔫🏗️🚧🪖🔫',
      tileColor:'#0f0f08', fogReveal:'#181808',
      animals:['zombie_dog','bird','boss_mutant'], encounterChance:0.45,
      loot:{ common:{resources:['metal','electronics','medicine'],weight:40}, rare:{resources:['electronics','electronics','medicine'],weight:35}, legendary:{resources:['electronics','medicine','chemicals','metal'],weight:25} },
      events:[
        {id:'armoury',text:'🔫 Armoury open — weapon parts!',reward:{metal:8,electronics:3},chance:0.14},
        {id:'medbay',text:'🏥 Military med bay — top supplies!',reward:{medicine:6,chemicals:3},chance:0.12},
        {id:'lab',text:'🔬 Research lab — unknown experiments.',reward:{chemicals:5,electronics:4},chance:0.10},
        {id:'radio',text:'📡 Radio room — salvaged electronics.',reward:{electronics:6},chance:0.10},
        {id:'tripwire',text:'⚠ Tripwire! Triggered an alarm.',reward:{energy:-25},chance:0.08},
        {id:'cache',text:'💣 Hidden weapons cache — incredible haul!',reward:{metal:10,electronics:6,chemicals:4},chance:0.04}
      ],
      uniqueMaterial:{key:'military_chip',name:'Military Chip',emoji:'🎖️'},
      foragingScene:'🪖🔫🏗️🚧⚙️🪖🔫🏗️🚧', sceneAction:'🪖 Raiding military stores',
      unlockAfterExpeditions: 25 },

    // ── SPECIAL MISSIONS — unlocked by Radio Tower ──────────────────────────
    { id:'signal_drop', name:'SIGNAL DROP', emoji:'📦', dangerLevel:2, dangerCol:'#42a5f5',
      desc:'A supply crate was broadcast. Find it before raiders do.',
      wx: 150,  wy: 120, radius: 60, isMission:true, missionKey:'signal_drop',
      bgColor:'#0a0d14', bgEmoji:'📦🪂📦🌫️📦🪂',
      tileColor:'#111820', fogReveal:'#182030',
      animals:['bird','rat'], encounterChance:0.20,
      loot:{ common:{resources:['food','medicine','cloth'],weight:40}, rare:{resources:['electronics','food','medicine'],weight:38}, legendary:{resources:['electronics','medicine','chemicals','circuit_board'],weight:22} },
      events:[
        {id:'crate',   text:'📦 Supply crate found! Military rations and kit.',    reward:{food:8, medicine:4},        chance:0.30},
        {id:'drone',   text:'🚁 Automated drone still circling — parts inside!',   reward:{electronics:6, metal:4},    chance:0.18},
        {id:'trap',    text:'⚠️ Crate rigged! Blast knocked you back.',            reward:{energy:-20},                chance:0.10},
        {id:'beacon',  text:'📡 Secondary beacon — more loot at the source!',      reward:{electronics:4, rope:3},     chance:0.15}
      ],
      uniqueMaterial:{key:'military_chip',name:'Military Chip',emoji:'🎖️'},
      foragingScene:'📦🪂🌫️📦🔍🪂📦🎖️🌫️', sceneAction:'📡 Tracking signal',
      unlockAfterExpeditions: 99999 },

    { id:'rescue_beacon', name:'RESCUE BEACON', emoji:'🆘', dangerLevel:3, dangerCol:'#ff6d00',
      desc:'A survivor beacon. Rescue them and share their supplies.',
      wx: -350, wy: 180, radius: 65, isMission:true, missionKey:'rescue_beacon',
      bgColor:'#140808', bgEmoji:'🆘🩸🚑🔦🆘🩸',
      tileColor:'#1e0e0e', fogReveal:'#280f0f',
      animals:['zombie_dog','rat'], encounterChance:0.35,
      loot:{ common:{resources:['medicine','food','cloth'],weight:35}, rare:{resources:['medicine','chemicals','electronics'],weight:40}, legendary:{resources:['antiseptic','medicine','military_chip'],weight:25} },
      events:[
        {id:'survivor', text:'🧟 Found a survivor! They share their remaining supplies.',  reward:{food:6, medicine:5, rope:4}, chance:0.25},
        {id:'medkit',   text:'🩺 Survivor field medkit — stocked!',                    reward:{medicine:8, antiseptic:2},   chance:0.20},
        {id:'ambush',   text:'🔫 Ambush — raiders waiting!',                        reward:{energy:-25},                 chance:0.12},
        {id:'cache',    text:'💼 Survivor had a cache buried nearby.',               reward:{food:5, electronics:3},      chance:0.15}
      ],
      uniqueMaterial:{key:'antiseptic',name:'Antiseptic',emoji:'🧫'},
      foragingScene:'🆘🩸🔦🚑🆘🧟🔦🩺🚑', sceneAction:'🔦 Searching for beacon',
      unlockAfterExpeditions: 99999 },

    { id:'black_market', name:'BLACK MARKET', emoji:'🏴', dangerLevel:3, dangerCol:'#ab47bc',
      desc:'A hidden trading post. Dangerous — but the rarest goods.',
      wx: 300,  wy: -480, radius: 70, isMission:true, missionKey:'black_market',
      bgColor:'#0d0814', bgEmoji:'🏴🕯️💀🏴🗡️💀',
      tileColor:'#130d1c', fogReveal:'#1a1030',
      animals:['bird','zombie_dog'], encounterChance:0.30,
      loot:{ common:{resources:['electronics','chemicals','medicine'],weight:30}, rare:{resources:['circuit_board','military_chip','electronics'],weight:42}, legendary:{resources:['military_chip','circuit_board','chemicals','electronics'],weight:28} },
      events:[
        {id:'trade',    text:'🤝 Trader accepted resources — rare parts!',               reward:{circuit_board:3, military_chip:1}, chance:0.22},
        {id:'weapons',  text:'🗡️ Illegal weapons parts — metal and more.',                reward:{metal:10, rope:5},                 chance:0.18},
        {id:'raid',     text:'🚨 Market raided mid-trade! Run!',                           reward:{energy:-20},                       chance:0.12},
        {id:'black',    text:'🏴 Found the back room — the real stock.',                   reward:{military_chip:2, circuit_board:4}, chance:0.10}
      ],
      uniqueMaterial:{key:'military_chip',name:'Military Chip',emoji:'🎖️'},
      foragingScene:'🏴💀🕯️🗡️🏴💀🕯️🤝🏴', sceneAction:'🏴 Negotiating trades',
      unlockAfterExpeditions: 99999 },

    { id:'command_bunker', name:'COMMAND BUNKER', emoji:'🎖️', dangerLevel:4, dangerCol:'#e53935',
      desc:'Last known command post. Hardened intel and mil-spec supplies.',
      wx: -620, wy: 620, radius: 80, isMission:true, missionKey:'command_bunker',
      bgColor:'#050508', bgEmoji:'🎖️🔐💣🎖️🔐💣',
      tileColor:'#080810', fogReveal:'#0e0e1a',
      animals:['zombie_dog','boss_mutant'], encounterChance:0.50,
      loot:{ common:{resources:['metal','electronics','chemicals'],weight:30}, rare:{resources:['military_chip','electronics','chemicals'],weight:40}, legendary:{resources:['military_chip','military_chip','circuit_board','electronics'],weight:30} },
      events:[
        {id:'vault',    text:'🔐 Vault cracked — military ration stockpile!',              reward:{food:10, medicine:6, chemicals:4}, chance:0.18},
        {id:'intel',    text:'📋 Intel on future raids — warning time +60s (this run).',   reward:{energy:10},                         chance:0.20},
        {id:'mutant',   text:'☣️ Command mutant — massive, powerful!',                     reward:{energy:-30},                        chance:0.15},
        {id:'chips',    text:'💾 Row of military CPUs still in packaging!',                reward:{military_chip:4, circuit_board:3},   chance:0.12}
      ],
      uniqueMaterial:{key:'military_chip',name:'Military Chip',emoji:'🎖️'},
      foragingScene:'🎖️🔐💣🎖️🔫🔐💣🎖️💾', sceneAction:'🎖️ Breaching command post',
      unlockAfterExpeditions: 99999 },

    { id:'endgame_transmission', name:'THE TRANSMISSION', emoji:'🌐', dangerLevel:4, dangerCol:'#ffd600',
      desc:'A signal from beyond the collapse. What is still out there?',
      wx: 0,    wy: -850, radius: 95, isMission:true, missionKey:'endgame_transmission',
      bgColor:'#02020a', bgEmoji:'🌐📡💫🌐📡✨',
      tileColor:'#050510', fogReveal:'#0a0a20',
      animals:['boss_mutant','bird','zombie_dog'], encounterChance:0.55,
      loot:{ common:{resources:['electronics','chemicals','military_chip'],weight:25}, rare:{resources:['military_chip','circuit_board','electronics'],weight:38}, legendary:{resources:['military_chip','military_chip','circuit_board','power_core'],weight:37} },
      events:[
        {id:'source',   text:'📡 Found the transmission source — alien tech?',              reward:{circuit_board:6, military_chip:3, power_core:2}, chance:0.15},
        {id:'survivor', text:'📻 Voice on the radio — someone else survived!',             reward:{food:8, medicine:8},                              chance:0.20},
        {id:'anomaly',  text:'💫 Strange energy field — your gear charges up!',            reward:{energy:40},                                       chance:0.12},
        {id:'core',     text:'⚡ Power core still active. Incredible!',                    reward:{power_core:3, electronics:6},                     chance:0.10}
      ],
      uniqueMaterial:{key:'power_core',name:'Power Core',emoji:'⚡'},
      foragingScene:'🌐📡💫🌐✨📡💫🌐📡', sceneAction:'🌐 Decoding the transmission',
      unlockAfterExpeditions: 99999 }
  ],

  // ── State ─────────────────────────────────
  _canvas:       null,
  _ctx:          null,
  _mapData:      null,   // generated world data (stored in save)
  _viewX:        0,      // camera top-left in world-units
  _viewY:        0,
  _scale:        0.18,   // world-units → screen pixels
  _travelling:   false,
  _travelTimer:  null,
  _travelPath:   [],
  _travelStep:   0,
  _travelTarget: null,   // { wx, wy, locationId or null }
  _playerWX:     0,      // current player world position
  _playerWY:     0,
  _pendingTravel: null,  // { wx, wy, distUnits, locationId }

  // ── Initialise / generate world ───────────
  init() {
    // Load or generate map data
    const saved = State.data.worldMapData;
    if (saved && saved.seed) {
      this._mapData = saved;
    } else {
      this._mapData = this._generate();
      State.data.worldMapData = this._mapData;
    }
    this._playerWX = this._mapData.playerWX;
    this._playerWY = this._mapData.playerWY;
  },

  // ── Generate procedural world ─────────────
  _generate() {
    const seed = Date.now();
    const rng  = this._makeRng(seed);

    // Place locations based on their definitions + some random wobble
    const zones = this.locationDefs.map(def => ({
      id:     def.id,
      wx:     def.wx + (rng() - 0.5) * 60,
      wy:     def.wy + (rng() - 0.5) * 60,
      radius: def.radius
    }));

    // Generate road network — winding paths from base to each zone
    const roads = zones.map(z => this._generateRoad(0, 0, z.wx, z.wy, rng));

    // Fog grid: 100×100 cells covering the world, 0=fogged, 1=revealed
    const fogW = 100, fogH = 100;
    const fog  = new Array(fogW * fogH).fill(0);
    // Reveal small area around base start
    const baseFogX = Math.floor(fogW/2);
    const baseFogY = Math.floor(fogH/2);
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++)
        fog[(baseFogY+dy)*fogW + (baseFogX+dx)] = 1;

    return { seed, zones, roads, fog, fogW, fogH,
      playerWX: 0, playerWY: 0 };
  },

  // Seeded RNG (simple mulberry32)
  _makeRng(seed) {
    let s = seed >>> 0;
    return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t^(t>>>15), 1|t); t ^= t + Math.imul(t^(t>>>7), 61|t); return ((t^(t>>>14))>>>0)/4294967296; };
  },

  // Generate a winding road path from (x1,y1) to (x2,y2)
  _generateRoad(x1, y1, x2, y2, rng) {
    const pts = [{ x:x1, y:y1 }];
    const steps = 5 + Math.floor(rng() * 4);
    for (let i = 1; i < steps; i++) {
      const t  = i / steps;
      const mx = x1 + (x2-x1)*t + (rng()-0.5) * 120;
      const my = y1 + (y2-y1)*t + (rng()-0.5) * 120;
      pts.push({ x:mx, y:my });
    }
    pts.push({ x:x2, y:y2 });
    return pts;
  },

  // ── Render ────────────────────────────────
  render() {
    this.init(); // ensure map exists
    const screen = document.getElementById('screen-map');
    if (!screen) return;

    screen.innerHTML = `
      <div class="wm-container">
        <div class="wm-header">
          <span class="wm-title">🗺 WORLD MAP</span>
          <div class="wm-header-right">
            <span class="wm-coords" id="wm-coords">📍 BASE</span>
            <div class="map-zoom-controls" style="position:static;flex-direction:row;gap:4px;">
              <button class="map-zoom-btn" id="wm-zoom-in">＋</button>
              <button class="map-zoom-btn" id="wm-zoom-fit">⊡</button>
              <button class="map-zoom-btn" id="wm-zoom-out">－</button>
            </div>
            <button class="btn-pixel btn-secondary" id="btn-back-from-map" style="padding:6px 12px">← BASE</button>
          </div>
        </div>
        <div class="wm-canvas-wrap" id="wm-canvas-wrap">
          <canvas id="wm-canvas"></canvas>
          <div class="wm-travel-hint" id="wm-travel-hint">TAP THE MAP TO EXPLORE</div>
        </div>
        <div class="wm-travel-panel hidden" id="wm-travel-panel">
          <!-- filled by _showTravelPanel -->
        </div>
        <div class="wm-travel-active hidden" id="wm-travel-active">
          <!-- filled during travel animation -->
        </div>
      </div>
    `;

    document.getElementById('btn-back-from-map')
      ?.addEventListener('click', () => {
        // Cancel any in-progress travel
        if (this._travelTimer) { clearTimeout(this._travelTimer); this._travelTimer = null; }
        this._travelling = false;

        if (State.data?.world) State.data.world.playerAway =

          (State.data?.world?.playerAway);
        this._roadEncounterActive = false;
        Events.emit('navigate', { screen: 'base' });
      });

    // World map zoom buttons
    document.getElementById('wm-zoom-in') ?.addEventListener('click', () => {
      this._scale = Utils.clamp(this._scale * 1.3, 0.05, 0.50);
      this._centreOnPlayer(); this._drawMap();
    });
    document.getElementById('wm-zoom-out')?.addEventListener('click', () => {
      this._scale = Utils.clamp(this._scale * 0.77, 0.05, 0.50);
      this._centreOnPlayer(); this._drawMap();
    });
    document.getElementById('wm-zoom-fit')?.addEventListener('click', () => {
      this._scale = 0.18; this._centreOnPlayer(); this._drawMap();
    });

    this._setupCanvas();
    this._drawMap();
    this._bindCanvasInput();
  },

  // ── Canvas setup ──────────────────────────
  _setupCanvas() {
    const wrap = document.getElementById('wm-canvas-wrap');
    const canvas = document.getElementById('wm-canvas');
    if (!wrap || !canvas) return;
    this._canvas = canvas;
    this._ctx    = canvas.getContext('2d');

    const dpr  = window.devicePixelRatio || 1;
    const cssW = wrap.clientWidth  || window.innerWidth;
    const cssH = wrap.clientHeight || window.innerHeight - 120;

    // Set buffer at full device resolution so pointer coords stay correct
    canvas.width  = cssW * dpr;
    canvas.height = cssH * dpr;

    // Keep CSS display size unchanged
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';

    // Scale context — all drawing uses CSS pixel units from here on
    this._ctx.scale(dpr, dpr);

    // Store CSS dimensions for pan/draw math
    this._cssW = cssW;
    this._cssH = cssH;

    // Centre view on player
    this._centreOnPlayer();
  },

  _centreOnPlayer() {
    if (!this._canvas) return;
    const sw = this._cssW || this._canvas.width;
    const sh = this._cssH || this._canvas.height;
    this._viewX = this._playerWX - sw / (2 * this._scale);
    this._viewY = this._playerWY - sh / (2 * this._scale);
  },

  // ── World → screen conversion ─────────────
  _toScreen(wx, wy) {
    return {
      sx: (wx - this._viewX) * this._scale,
      sy: (wy - this._viewY) * this._scale
    };
  },

  _toWorld(sx, sy) {
    return {
      wx: sx / this._scale + this._viewX,
      wy: sy / this._scale + this._viewY
    };
  },

  // ── Draw the full map ─────────────────────
  _drawMap() {
    const c = this._ctx;
    if (!c || !this._mapData) return;
    const W = this._cssW || this._canvas.width;
    const H = this._cssH || this._canvas.height;

    // Background — deep dark (only visible in fogged/unrevealed areas)
    c.fillStyle = '#050508';
    c.fillRect(0, 0, W, H);

    // Terrain base — revealed cells get biome colour + noise stipple
    this._drawTerrain(c);

    // Draw terrain patches (roads + zones) in revealed areas
    this._drawRoads(c);
    this._drawZones(c);

    // Fog of war overlay
    this._drawFog(c, W, H);

    // Location icons (only if revealed)
    this._drawLocationIcons(c);

    // Player marker
    this._drawPlayer(c);

    // Travel path preview (if pending)
    if (this._pendingTravel) {
      this._drawTravelPreview(c);
    }
  },

  // ── Terrain base (revealed cells only) ───
  _drawTerrain(c) {
    const md = this._mapData;
    const fw = md.fogW, fh = md.fogH;
    const cellWX = this.WORLD_W / fw;
    const cellWY = this.WORLD_H / fh;

    for (let fy = 0; fy < fh; fy++) {
      for (let fx = 0; fx < fw; fx++) {
        if (md.fog[fy * fw + fx] !== 1) continue; // only paint revealed cells

        const wx = (fx - fw/2 + 0.5) * cellWX;
        const wy = (fy - fh/2 + 0.5) * cellWY;
        const { sx, sy } = this._toScreen(wx, wy);
        const cellPxW = cellWX * this._scale + 1;
        const cellPxH = cellWY * this._scale + 1;

        // Find nearest zone to tint cell with biome fogReveal colour
        let baseColor = '#2a2618'; // default wasteland — warmer than before
        let minDist = Infinity;
        md.zones.forEach(zone => {
          const def = this.locationDefs.find(d => d.id === zone.id);
          if (!def) return;
          const dx = wx - zone.wx, dy = wy - zone.wy;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < zone.radius * 2.5 && dist < minDist) {
            minDist = dist;
            baseColor = def.fogReveal;
          }
        });

        c.fillStyle = baseColor;
        c.fillRect(sx - cellPxW/2, sy - cellPxH/2, cellPxW, cellPxH);

        // Noise stipple for visual texture variation
        const n = this._cellNoise(fx, fy);
        if (n > 0.72) {
          // Bright highlight patch
          c.fillStyle = 'rgba(255,245,200,0.06)';
          c.fillRect(sx - cellPxW/2, sy - cellPxH/2, cellPxW * 0.55, cellPxH * 0.55);
        } else if (n < 0.28) {
          // Dark shadow patch
          c.fillStyle = 'rgba(0,0,0,0.18)';
          c.fillRect(sx - cellPxW/2, sy - cellPxH/2, cellPxW, cellPxH);
        } else if (n > 0.55 && n < 0.60) {
          // Subtle mid scatter dot
          c.fillStyle = 'rgba(180,160,120,0.05)';
          c.fillRect(sx, sy, cellPxW * 0.4, cellPxH * 0.4);
        }
      }
    }
  },

  // Fast deterministic per-cell noise — no external lib needed
  _cellNoise(fx, fy) {
    let n = fx * 1619 + fy * 31337;
    n = (n ^ (n >> 13)) * (n * n * 60493 + 19990303) + 1376312589;
    return ((n & 0x7fffffff) / 0x7fffffff);
  },

  _drawRoads(c) {
    const md = this._mapData;
    md.roads.forEach((road, i) => {
      const zone = md.zones[i];
      const def  = zone && this.locationDefs.find(d => d.id === zone.id);
      const danger = def?.dangerLevel || 1;

      // Road colour gets redder/darker with danger level
      const roadCol   = danger >= 4 ? '#3a1a0a' :
                        danger >= 3 ? '#2e1c0a' :
                        danger >= 2 ? '#2a2010' : '#2a2418';
      const centerCol = danger >= 3 ? '#5a3010' : '#3a3020';

      c.beginPath();
      road.forEach((pt, idx) => {
        const { sx, sy } = this._toScreen(pt.x, pt.y);
        idx === 0 ? c.moveTo(sx, sy) : c.lineTo(sx, sy);
      });
      c.strokeStyle = roadCol;
      c.lineWidth = 3 + danger;
      c.stroke();

      // Centre dash — spacing varies by danger (more erratic = more dangerous)
      c.strokeStyle = centerCol;
      c.lineWidth = 1.5;
      c.setLineDash(danger >= 3 ? [3, 9] : [8, 6]);
      c.stroke();
      c.setLineDash([]);
    });
  },

  _drawZones(c) {
    const md = this._mapData;
    md.zones.forEach(zone => {
      const def = this.locationDefs.find(d => d.id === zone.id);
      if (!def) return;
      const { sx, sy } = this._toScreen(zone.wx, zone.wy);
      const r = zone.radius * this._scale;

      // Wide soft outer biome glow — extends further than before
      const grad = c.createRadialGradient(sx, sy, 0, sx, sy, r * 1.5);
      grad.addColorStop(0,    def.tileColor + 'ee');
      grad.addColorStop(0.45, def.tileColor + 'bb');
      grad.addColorStop(0.75, def.tileColor + '55');
      grad.addColorStop(1,    def.tileColor + '00');
      c.beginPath();
      c.arc(sx, sy, r * 1.5, 0, Math.PI*2);
      c.fillStyle = grad;
      c.fill();

      // Hard inner ring — gives zones a defined boundary
      c.beginPath();
      c.arc(sx, sy, r * 0.55, 0, Math.PI*2);
      c.strokeStyle = def.dangerCol + '60';
      c.lineWidth = 1.5;
      c.stroke();
    });
  },

  _drawFog(c, W, H) {
    const md = this._mapData;
    const fw = md.fogW, fh = md.fogH;
    // Each fog cell covers (WORLD_W/fw) world-units
    const cellWX = this.WORLD_W / fw;
    const cellWY = this.WORLD_H / fh;

    for (let fy = 0; fy < fh; fy++) {
      for (let fx = 0; fx < fw; fx++) {
        if (md.fog[fy * fw + fx] === 1) continue; // revealed

        // World position of this fog cell (centred on cell)
        const wx = (fx - fw/2 + 0.5) * cellWX;
        const wy = (fy - fh/2 + 0.5) * cellWY;
        const { sx, sy } = this._toScreen(wx, wy);
        const cellPxW = cellWX * this._scale + 1;
        const cellPxH = cellWY * this._scale + 1;

        c.fillStyle = 'rgba(4,4,8,0.94)';
        c.fillRect(sx - cellPxW/2, sy - cellPxH/2, cellPxW, cellPxH);

        // Smoke swirl effect on edge cells
        if (this._isEdgeFog(fx, fy)) {
          c.fillStyle = 'rgba(30,25,40,0.5)';
          c.fillRect(sx - cellPxW/2, sy - cellPxH/2, cellPxW, cellPxH);
        }
      }
    }

    // Fog border vignette
    const vx = c.createRadialGradient(W/2, H/2, Math.min(W,H)*0.35, W/2, H/2, Math.max(W,H)*0.7);
    vx.addColorStop(0, 'transparent');
    vx.addColorStop(1, 'rgba(0,0,0,0.6)');
    c.fillStyle = vx;
    c.fillRect(0, 0, W, H);
  },(fx, fy) {
    const md = this._mapData;
    const fw = md.fogW, fh = md.fogH;
    const neighbors = [[-1,0],[1,0],[0,-1],[0,1]];
    return neighbors.some(([dx,dy]) => {
      const nx = fx+dx, ny = fy+dy;
      if (nx<0||nx>=fw||ny<0||ny>=fh) return false;
      return md.fog[ny*fw+nx] === 1;
    });
  },

  _drawLocationIcons(c) {
    const md = this._mapData;
    const unlocked = State.data.world.unlockedLocations || [];
    const t = Date.now() / 1000;

    md.zones.forEach(zone => {
      const def = this.locationDefs.find(d => d.id === zone.id);
      if (!def) return;

      // Only show if this fog cell is revealed
      if (!this._isRevealed(zone.wx, zone.wy)) return;

      const { sx, sy } = this._toScreen(zone.wx, zone.wy);
      const isUnlocked = unlocked.includes(zone.id);
      const isMission  = !!def.isMission;
      const scaleFactor = this._scale / 0.18;

      // Mission locations: animated pulsing ring + distinctive look
      if (isMission && isUnlocked) {
        // Outer slow-pulse aura
        const pulse = 0.4 + 0.35 * Math.sin(t * 2.5);
        c.beginPath();
        c.arc(sx, sy, 28 * scaleFactor, 0, Math.PI*2);
        c.strokeStyle = def.dangerCol;
        c.lineWidth = 3;
        c.globalAlpha = pulse;
        c.stroke();
        c.globalAlpha = 1;
        // Diamond marker
        const dm = 14 * scaleFactor;
        c.save();
        c.translate(sx, sy - dm * 1.8);
        c.rotate(Math.PI / 4);
        c.fillStyle = def.dangerCol;
        c.globalAlpha = 0.85;
        c.fillRect(-5 * scaleFactor, -5 * scaleFactor, 10 * scaleFactor, 10 * scaleFactor);
        c.globalAlpha = 1;
        c.restore();
      }

      // Glow ring
      const glowCol = isUnlocked ? def.dangerCol : '#555';
      c.beginPath();
      c.arc(sx, sy, 18 * scaleFactor, 0, Math.PI*2);
      c.strokeStyle = glowCol;
      c.lineWidth = isMission && isUnlocked ? 3 : 2;
      c.globalAlpha = isMission && isUnlocked ? 0.8 : 0.5;
      c.stroke();
      c.globalAlpha = 1;

      // Icon
      c.font = Math.max(14, 22 * scaleFactor) + 'px serif';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(isUnlocked ? def.emoji : '❓', sx, sy);

      // Name label below
      if (this._scale > 0.12) {
        c.font = 'bold ' + Math.max(8, 10 * scaleFactor) + "px 'VT323', monospace";
        c.fillStyle = isUnlocked ? (isMission ? def.dangerCol : '#d4d4a0') : '#555';
        c.fillText(def.name, sx, sy + 20 * scaleFactor);

        if (isMission && isUnlocked) {
          c.fillStyle = def.dangerCol;
          c.font = Math.max(7, 8 * scaleFactor) + "px 'VT323', monospace";
          c.fillText('◆ MISSION ◆', sx, sy + 30 * scaleFactor);
        } else if (!isUnlocked) {
          c.fillStyle = isMission ? '#555' : '#e53935';
          c.font = Math.max(8, 9 * scaleFactor) + "px 'VT323', monospace";
          c.fillText(isMission ? '📡 Radio Tower needed' : '🔒 LOCKED', sx, sy + 30 * scaleFactor);
        }
      }
    });
  },

  _drawPlayer(c) {
    const { sx, sy } = this._toScreen(this._playerWX, this._playerWY);
    const r = 8;

    // Pulse ring
    c.beginPath();
    c.arc(sx, sy, r + 4, 0, Math.PI*2);
    c.strokeStyle = 'rgba(255,214,0,0.3)';
    c.lineWidth = 3;
    c.stroke();

    // Player dot
    c.beginPath();
    c.arc(sx, sy, r, 0, Math.PI*2);
    c.fillStyle = '#ffd600';
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 2;
    c.stroke();

    // Bike icon
    c.font = `${r * 1.6}px serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('🚴', sx, sy - r - 10);

    // BASE label
    c.font = '10px VT323, monospace';
    c.fillStyle = '#ffd600';
    c.textBaseline = 'middle';
    if (this._playerWX === 0 && this._playerWY === 0) {
      c.fillText('BASE', sx, sy + r + 10);
    }
  },

  _drawTravelPreview(c) {
    if (!this._pendingTravel) return;
    const { wx, wy } = this._pendingTravel;
    const start = this._toScreen(this._playerWX, this._playerWY);
    const end   = this._toScreen(wx, wy);

    // Dashed line to target
    c.beginPath();
    c.moveTo(start.sx, start.sy);
    c.lineTo(end.sx, end.sy);
    c.strokeStyle = '#ffd600';
    c.lineWidth = 2;
    c.setLineDash([6,4]);
    c.globalAlpha = 0.7;
    c.stroke();
    c.setLineDash([]);
    c.globalAlpha = 1;

    // Target marker
    c.beginPath();
    c.arc(end.sx, end.sy, 6, 0, Math.PI*2);
    c.fillStyle = '#ffd600';
    c.fill();
  },

  // ── Fog helpers ───────────────────────────
  _isRevealed(wx, wy) {
    const md = this._mapData;
    if (!md) return false;
    const fw = md.fogW, fh = md.fogH;
    const cellWX = this.WORLD_W / fw;
    const cellWY = this.WORLD_H / fh;
    const fx = Math.floor(wx / cellWX + fw/2);
    const fy = Math.floor(wy / cellWY + fh/2);
    if (fx<0||fx>=fw||fy<0||fy>=fh) return false;
    return md.fog[fy*fw+fx] === 1;
  },

  _revealAround(wx, wy, radiusUnits) {
    const md = this._mapData;
    if (!md) return;
    const fw = md.fogW, fh = md.fogH;
    const cellWX = this.WORLD_W / fw;
    const cellWY = this.WORLD_H / fh;
    const cx = wx / cellWX + fw/2;
    const cy = wy / cellWY + fh/2;
    const cr = radiusUnits / cellWX;

    for (let dy = -Math.ceil(cr); dy <= Math.ceil(cr); dy++) {
      for (let dx = -Math.ceil(cr); dx <= Math.ceil(cr); dx++) {
        if (dx*dx + dy*dy <= cr*cr) {
          const fx = Math.floor(cx+dx);
          const fy = Math.floor(cy+dy);
          if (fx>=0&&fx<fw&&fy>=0&&fy<fh) {
            md.fog[fy*fw+fx] = 1;
          }
        }
      }
    }
  },

  // ── Canvas input ──────────────────────────
  _bindCanvasInput() {
    const canvas = this._canvas;
    if (!canvas) return;

    let ptrs = {};
    let lastPinchDist = 0;
    let panStart = null;
    let tapStart = 0, tapX = 0, tapY = 0;

    const getPinchDist = () => {
      const pts = Object.values(ptrs);
      if (pts.length < 2) return 0;
      const dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
      return Math.sqrt(dx*dx + dy*dy);
    };
    const getMid = () => {
      const pts = Object.values(ptrs);
      return pts.length < 2
        ? { x: pts[0].x, y: pts[0].y }
        : { x: (pts[0].x+pts[1].x)/2, y: (pts[0].y+pts[1].y)/2 };
    };

    canvas.addEventListener('pointerdown', e => {
      canvas.setPointerCapture(e.pointerId);
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      const mid = getMid();
      panStart = { vx: this._viewX, vy: this._viewY, mx: mid.x, my: mid.y };
      lastPinchDist = getPinchDist();
      if (Object.keys(ptrs).length === 1) {
        tapStart = Date.now(); tapX = e.clientX; tapY = e.clientY;
      }
      e.preventDefault();
    }, { passive: false });

    canvas.addEventListener('pointermove', e => {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };

      if (Object.keys(ptrs).length === 2) {
        // Pinch zoom — zoom towards pinch midpoint
        const dist = getPinchDist();
        if (lastPinchDist > 0) {
          const ratio = dist / lastPinchDist;
          const mid   = getMid();
          const rect  = canvas.getBoundingClientRect();
          // World coord at midpoint before zoom
          const wx = (mid.x - rect.left) / this._scale + this._viewX;
          const wy = (mid.y - rect.top)  / this._scale + this._viewY;
          this._scale = Utils.clamp(this._scale * ratio, 0.05, 0.50);
          // Re-anchor so midpoint stays fixed
          this._viewX = wx - (mid.x - rect.left) / this._scale;
          this._viewY = wy - (mid.y - rect.top)  / this._scale;
          this._drawMap();
        }
        lastPinchDist = dist;
      } else if (panStart) {
        // Pan
        const mid = getMid();
        const dx  = (mid.x - panStart.mx) / this._scale;
        const dy  = (mid.y - panStart.my) / this._scale;
        this._viewX = panStart.vx - dx;
        this._viewY = panStart.vy - dy;
        this._drawMap();
      }
      e.preventDefault();
    }, { passive: false });

    const endPtr = e => {
      const wasSingle = Object.keys(ptrs).length === 1;
      delete ptrs[e.pointerId];
      if (wasSingle && !this._travelling) {
        const elapsed = Date.now() - tapStart;
        const movedX  = Math.abs(e.clientX - tapX);
        const movedY  = Math.abs(e.clientY - tapY);
        if (elapsed < 350 && movedX < 12 && movedY < 12) {
          const rect = canvas.getBoundingClientRect();
          this._onTap(e.clientX - rect.left, e.clientY - rect.top);
        }
      }
      if (Object.keys(ptrs).length > 0) {
        const mid = getMid();
        panStart = { vx: this._viewX, vy: this._viewY, mx: mid.x, my: mid.y };
        lastPinchDist = getPinchDist();
      } else {
        panStart = null;
      }
    };
    canvas.addEventListener('pointerup',     endPtr);
    canvas.addEventListener('pointercancel', e => { delete ptrs[e.pointerId]; });

    // Mouse wheel zoom — zoom towards cursor
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const rect   = canvas.getBoundingClientRect();
      const sx     = e.clientX - rect.left;
      const sy     = e.clientY - rect.top;
      const wx     = sx / this._scale + this._viewX;
      const wy     = sy / this._scale + this._viewY;
      this._scale  = Utils.clamp(this._scale * (e.deltaY > 0 ? 0.88 : 1.14), 0.05, 0.50);
      this._viewX  = wx - sx / this._scale;
      this._viewY  = wy - sy / this._scale;
      this._drawMap();
    }, { passive: false });
  },

  // ── Tap on map ────────────────────────────
  _onTap(sx, sy) {
    const { wx, wy } = this._toWorld(sx, sy);
    const distUnits  = Math.sqrt(wx*wx + wy*wy); // distance from base (0,0)

    // Check if tapped near a location zone
    let tappedLocation = null;
    for (const zone of this._mapData.zones) {
      const dx = wx - zone.wx, dy = wy - zone.wy;
      if (Math.sqrt(dx*dx+dy*dy) < zone.radius * 1.5) {
        tappedLocation = zone.id;
        break;
      }
    }

    this._pendingTravel = { wx, wy, distUnits, locationId: tappedLocation };
    this._drawMap();
    this._showTravelPanel(wx, wy, distUnits, tappedLocation);
  },

  // ── Travel panel ──────────────────────────
  _showTravelPanel(wx, wy, distUnits, locationId) {
    const panel = document.getElementById('wm-travel-panel');
    const hint  = document.getElementById('wm-travel-hint');
    if (!panel) return;
    if (hint) hint.classList.add('hidden');

    // Max world distance is ~sqrt(700²+500²) ≈ 860 units
    const maxDist = 900;
    const normDist = Utils.clamp(distUnits / maxDist, 0, 1);

    // Travel times: slow=120s, normal=90s, fast=60s — scaled by distance
    const slowTime   = Math.round(6 * normDist + 4);   // DEV: fast travel (4–10s)
    const normalTime = Math.round(4 * normDist + 3);
    const fastTime   = Math.round(3 * normDist + 2);

    const def = locationId ? this.locationDefs.find(d => d.id === locationId) : null;
    const unlocked = State.data.world.unlockedLocations || [];
    const isUnlocked = def && unlocked.includes(locationId);
    const isRevealed = this._isRevealed(wx, wy);

    let locationInfo = '';
    if (def) {
      if (!isRevealed) {
        locationInfo = `<div class="wm-loc-info mystery">❓ UNKNOWN LOCATION — Bike there to discover!</div>`;
      } else if (!isUnlocked) {
        locationInfo = `<div class="wm-loc-info locked">
          <span>${def.emoji} ${def.name}</span>
          <span style="color:#e53935">🔒 LOCKED — Complete more expeditions to unlock</span>
        </div>`;
      } else {
        locationInfo = `<div class="wm-loc-info">
          <span class="wm-loc-icon">${def.emoji}</span>
          <div>
            <div class="wm-loc-name">${def.name}</div>
            <div style="color:${def.dangerCol}">⚠ ${def.dangerLevel === 1 ? 'LOW' : def.dangerLevel === 2 ? 'MEDIUM' : def.dangerLevel === 3 ? 'HIGH' : 'EXTREME'} DANGER</div>
            <div style="color:#7a7a5a;font-size:0.85rem">${def.desc}</div>
          </div>
        </div>`;
      }
    }

    const distLabel = distUnits < 50 ? 'NEARBY' :
                      distUnits < 250 ? 'CLOSE' :
                      distUnits < 500 ? 'MODERATE DISTANCE' :
                      distUnits < 750 ? 'FAR AWAY' : 'VERY FAR';

    panel.innerHTML = `
      <div class="wm-panel-title">🗺 TRAVEL OPTIONS</div>
      ${locationInfo}
      <div class="wm-dist-label">${distLabel} — ${Math.round(distUnits)} units from base</div>

      <div class="wm-speed-options">
        <div class="wm-speed-card slow">
          <div class="wm-speed-icon">🐌</div>
          <div class="wm-speed-name">SLOW</div>
          <div class="wm-speed-time">~${slowTime}s</div>
          <div class="wm-speed-note">CPM &lt; 40<br/>⚠ Monsters CATCH you<br/>You'll LOSE all loot</div>
        </div>
        <div class="wm-speed-card normal">
          <div class="wm-speed-icon">🚴</div>
          <div class="wm-speed-name">NORMAL</div>
          <div class="wm-speed-time">~${normalTime}s</div>
          <div class="wm-speed-note">CPM 40–70<br/>Monsters scared away<br/>Safe passage</div>
        </div>
        <div class="wm-speed-card fast">
          <div class="wm-speed-icon">💨</div>
          <div class="wm-speed-name">FAST</div>
          <div class="wm-speed-time">~${fastTime}s</div>
          <div class="wm-speed-note">CPM &gt; 70<br/>Defeat monsters<br/>Earn rare loot!</div>
        </div>
      </div>

      <div class="wm-panel-note">⚡ You won't need to bike back — just return when done.</div>

      <div class="wm-panel-actions">
        <button class="btn-pixel btn-primary" id="btn-start-travel">🚴 GO!</button>
        <button class="btn-pixel btn-secondary" id="btn-cancel-travel">✕ CANCEL</button>
      </div>
    `;

    panel.classList.remove('hidden');
    panel.classList.add('slide-in');

    document.getElementById('btn-start-travel')?.addEventListener('click', () => {
      this._startTravel(wx, wy, distUnits, locationId, slowTime, normalTime, fastTime);
    });
    document.getElementById('btn-cancel-travel')?.addEventListener('click', () => {
      this._pendingTravel = null;
      panel.classList.add('hidden');
      if (hint) hint.classList.remove('hidden');
      this._drawMap();
    });
  },

  // ── Start travel ──────────────────────────
  _startTravel(wx, wy, distUnits, locationId, slowTime, normalTime, fastTime) {
    const panel = document.getElementById('wm-travel-panel');
    const active = document.getElementById('wm-travel-active');
    if (panel) panel.classList.add('hidden');
    if (active) active.classList.remove('hidden');

    this._travelling   = true;
    if (State.data?.world) State.data.world.playerAway = true;
    this._pendingTravel = null;

    // Build travel path: linear interpolation from player to target, many steps
    const steps = 60; // one step per second-ish
    this._travelPath = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      this._travelPath.push({
        wx: this._playerWX + (wx - this._playerWX) * t,
        wy: this._playerWY + (wy - this._playerWY) * t
      });
    }
    this._travelStep   = 0;
    this._travelTarget = { wx, wy, locationId };

    // Start Cadence
    Cadence.start();

    this._renderTravelHUD(active, slowTime, normalTime, fastTime);
    this._runTravelStep(wx, wy, locationId, slowTime, normalTime, fastTime);
  },

  _renderTravelHUD(container, slowTime, normalTime, fastTime) {
    if (!container) return;
    // Build terrain from destination zone or generic wasteland
    const destId = this._travelTarget?.locationId;
    const destDef = destId ? this.locationDefs.find(d => d.id === destId) : null;
    const terrainEmoji = destDef ? (destDef.foragingScene || destDef.bgEmoji || '🌑🌿🪨🌑') + ' '.repeat(3) + (destDef.foragingScene || destDef.bgEmoji || '') : '🌑🌿🪨🌲🌑🪨🌿🌑🌿🪨';
    container.innerHTML = `
      <div class="travel-hud">
        <div class="travel-scene" id="travel-scene">
          <div class="travel-road"></div>
          <div class="travel-rider" id="travel-rider">🚴</div>
          <div class="travel-terrain" id="travel-terrain">${terrainEmoji} ${terrainEmoji}</div>
        </div>
        <div class="travel-info">
          <div class="travel-progress-wrap">
            <div class="travel-progress-bar" id="travel-prog-bar" style="width:0%"></div>
          </div>
          <div class="travel-stats">
            <span id="travel-pct">0%</span>
            <span id="travel-enc-status" style="color:#ffd600">🚴 Pedalling...</span>
          </div>
        </div>
        <div class="cadence-section" style="padding:0 12px">
          <p class="cadence-label">PEDAL SPEED — <span id="travel-speed-label">slow</span></p>
          <div class="cadence-bar-wrap">
            <div class="cadence-bar" id="cadence-bar"></div>
            <div class="cadence-target" id="cadence-target-line"></div>
          </div>
          <p class="cadence-cpm" id="cadence-cpm">0 CPM</p>
        </div>
        <button class="btn-pedal" id="btn-pedal">
          🚴 PEDAL!
          <span class="pedal-sub">Faster = quicker travel + fight off monsters!</span>
        </button>
        <button class="btn-pixel btn-secondary" id="btn-abort-travel" style="width:100%;margin-top:6px;padding:10px;opacity:0.7">
          ← TURN BACK
        </button>
        <div class="travel-encounter hidden" id="travel-encounter"></div>
      </div>
    `;

    const btn = document.getElementById('btn-pedal');
    if (btn) {
      let lastTouch = 0;
      btn.addEventListener('touchstart', e => {
        e.preventDefault(); lastTouch = Date.now();
        Cadence.registerClick(); Audio.sfxPedal();
        this._onTravelClick();
      }, { passive: false });
      btn.addEventListener('click', () => {
        if (Date.now() - lastTouch > 300) { Cadence.registerClick(); Audio.sfxPedal(); this._onTravelClick(); }
      });
    }

    document.getElementById('btn-abort-travel')?.addEventListener('click', () => {
      if (this._travelTimer) { clearTimeout(this._travelTimer); this._travelTimer = null; }
      this._travelling = false;

      if (State.data?.world) State.data.world.playerAway =

        (State.data?.world?.playerAway);
      this._roadEncounterActive = false;
      Utils.toast('↩ Turned back.', 'info');
      Events.emit('navigate', { screen: 'base' });
    });
  },

  // Travel click — extra progress + encounter damage
  _onTravelClick() {
    if (!this._travelling) return;
    if (this._roadEncounterActive) {
      this._roadEncounterClick();
    }
    // Extra progress per click — scales with CPM
    const ratio = Utils.clamp((State.data.cadence?.clicksPerMinute ?? 0) / ((State.data.world.activeRaid ? State.data.cadence?.raidTargetCPM : State.data.cadence?.targetCPM) || 60), 0, 2);
    this._travelClickBonus = (this._travelClickBonus || 0) + ratio * 0.003;
  },

  _runTravelStep(targetWX, targetWY, locationId, slowTime, normalTime, fastTime) {
    let progress = 0;
    this._travelClickBonus = 0;
    this._roadEncounterActive = false;
    this._roadEncounterHP = 0;
    this._gathered = {};

    const totalDist = Math.sqrt(
      (targetWX - this._playerWX)**2 + (targetWY - this._playerWY)**2
    );
    const startWX = this._playerWX;
    const startWY = this._playerWY;

    let nextEncounterAt = 0.15 + Math.random() * 0.25; // first encounter at 15–40% progress
    let encounterCount  = 0;
    const maxEncounters = 2 + Math.floor(totalDist / 400);

    const tick = () => {
      if (!this._travelling) return;

      const cpm    = State.data.cadence?.clicksPerMinute ?? 0;
    const target = (State.data.world.activeRaid ? State.data.cadence?.raidTargetCPM : State.data.cadence?.targetCPM) || 60;
      const ratio  = Utils.clamp(cpm / target, 0, 2);

      // DEV: fast travel — completes in ~10 real seconds
      const baseSpeed = Utils.lerp(0.08, 0.12, Math.min(totalDist / 900, 1));
      const _devSpeedMult = State.travelSpeedMultFn ? State.travelSpeedMultFn() : 1;
      const speed = this._roadEncounterActive ? 0 : baseSpeed * (0.3 + ratio * 0.85) * _devSpeedMult + this._travelClickBonus;
      this._travelClickBonus = 0;

      if (!this._roadEncounterActive) progress = Math.min(1, progress + speed);

      // Update player world position
      this._playerWX = startWX + (targetWX - startWX) * progress;
      this._playerWY = startWY + (targetWY - startWY) * progress;
      this._mapData.playerWX = this._playerWX;
      this._mapData.playerWY = this._playerWY;

      // Reveal fog along travel path
      this._revealAround(this._playerWX, this._playerWY, 80);

      // Redraw map (partial — just reposition, don't full rebuild)
      this._drawMap();

      // Update travel HUD
      this._updateTravelHUD(progress, cpm, ratio);

      // Road encounter tick (runs every second when active)
      if (this._roadEncounterActive) {
        this._roadEncounterTick(ratio);
      }

      // Road encounter trigger (new encounter when not already in one)
      if (!this._roadEncounterActive && encounterCount < maxEncounters && progress >= nextEncounterAt) {
        encounterCount++;
        nextEncounterAt = progress + 0.2 + Math.random() * 0.3;
        this._triggerRoadEncounter(ratio);
      }

      if (progress >= 1) {
        this._arriveAtDestination(locationId);
        return;
      }

      this._travelTimer = setTimeout(tick, 1000);
    };

    this._travelTimer = setTimeout(tick, 1000);
  },

  _updateTravelHUD(progress, cpm, ratio) {
    const pct = Math.round(progress * 100);
    const barEl  = document.getElementById('travel-prog-bar');
    const pctEl  = document.getElementById('travel-pct');
    const spdEl  = document.getElementById('travel-speed-label');
    const riderEl = document.getElementById('travel-rider');

    if (barEl) barEl.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (spdEl) {
      const label = cpm < 40 ? '🐌 SLOW — monsters may catch you!' :
                    cpm < 70 ? '🚴 NORMAL — safe speed' :
                               '💨 FAST — monsters flee!';
      spdEl.textContent = label;
      spdEl.style.color = cpm < 40 ? '#e53935' : cpm < 70 ? '#ffd600' : '#4caf50';
    }
    if (riderEl) {
      riderEl.style.animationDuration = `${Utils.lerp(0.6, 0.1, ratio)}s`;
      riderEl.textContent = this._roadEncounterActive ? '⚔️' : ratio > 1.2 ? '💨' : '🚴';
    }

    // Cadence bar updates via its own 200ms interval (started by Cadence.start())
  },

  // ── Road encounter ────────────────────────
  _triggerRoadEncounter(currentRatio) {
    const animalKeys = ['wolf','boar','rat','insect','bear','zombie_dog','bird'];
    const id = animalKeys[Math.floor(Math.random() * animalKeys.length)];
    const animal = Animals.types[id];
    if (!animal) return;

    this._roadEncounterActive = true;
    this._roadEncounterAnimal = animal;
    this._roadEncounterHP = (animal.baseStrength || 20) * 0.7; // road encounters are slightly easier
    this._roadEncounterMaxHP = this._roadEncounterHP;
    this._roadEncounterLoseTimer = 0;
    this._lastEncounterClick = 0; // reset so timer starts fresh

    const encEl = document.getElementById('travel-encounter');
    const statusEl = document.getElementById('travel-enc-status');
    if (statusEl) statusEl.textContent = `${animal.emoji} ${animal.name} blocks the road!`;

    if (encEl) {
      encEl.classList.remove('hidden');
      encEl.innerHTML = `
        <div class="road-enc-header">
          <span class="road-enc-icon">${animal.emoji}</span>
          <div class="road-enc-info">
            <div class="road-enc-name">${animal.name} BLOCKING THE ROAD!</div>
            <div class="road-enc-hp-wrap">
              <div class="road-enc-hp-bar" id="road-enc-hp" style="width:100%"></div>
            </div>
          </div>
        </div>
        <div class="road-enc-instr" id="road-enc-instr">⚠ Bike FAST to fight! Slow = lose your loot!</div>
        <div class="road-enc-lose-wrap">
          <div class="road-enc-lose-bar" id="road-enc-lose" style="width:0%"></div>
          <span id="road-enc-lose-secs">15</span>s before you flee
        </div>
      `;
    }

    Audio.sfxEncounter?.();
    Utils.toast(`${animal.emoji} ${animal.name} spotted on the road!`, 'warn', 3000);
  },

  _roadEncounterTick(ratio) {
    if (!this._roadEncounterActive) return;
    const animal = this._roadEncounterAnimal;
    const def    = State.data.base.defenceRating || 10;

    const hpEl     = document.getElementById('road-enc-hp');
    const instrEl  = document.getElementById('road-enc-instr');
    const loseEl   = document.getElementById('road-enc-lose');
    const loseSecs = document.getElementById('road-enc-lose-secs');

    // Lose timer driven by time since last click (not CPM — works for phone tapping)
    const msSinceClick = Date.now() - (this._lastEncounterClick || 0);
    const isActive = msSinceClick < 1500; // clicked within last 1.5s = "fighting"

    if (isActive) {
      // Pedalling bonus on top of clicking
      if (ratio >= 1.40) {
        const dmg = Utils.randFloat(1, 3) * (1 + def/200);
        this._roadEncounterHP = Math.max(0, this._roadEncounterHP - dmg);
        this._roadEncounterLoseTimer = Math.max(0, this._roadEncounterLoseTimer - 0.5);
        if (instrEl) instrEl.textContent = '💥 FULL ATTACK! Keep hammering!';
      } else {
        if (instrEl) instrEl.textContent = '⚔️ Keep clicking/tapping to fight!';
      }
    } else {
      // Not clicking — lose timer counts up
      this._roadEncounterLoseTimer++;
      if (instrEl) instrEl.textContent = `🐌 CLICK/TAP TO FIGHT! Monster takes loot in ${Math.max(0, 5 - Math.floor(this._roadEncounterLoseTimer))}s!`;
    }

    if (hpEl) { hpEl.style.width = `${(this._roadEncounterHP/this._roadEncounterMaxHP)*100}%`; }
    if (loseEl) { loseEl.style.width = `${Math.min(100,(this._roadEncounterLoseTimer/5)*100)}%`; }
    if (loseSecs) { loseSecs.textContent = Math.max(0, 5 - Math.floor(this._roadEncounterLoseTimer)); }

    // Resolution
    if (this._roadEncounterHP <= 0 || this._roadEncounterHP / this._roadEncounterMaxHP <= (animal.fleeThreshold || 0.15)) {
      this._resolveRoadEncounter('win');
    } else if (this._roadEncounterLoseTimer >= 5) {
      this._resolveRoadEncounter('lose');
    }
  },

  _roadEncounterClick() {
    if (!this._roadEncounterActive) return;
    const ratio = Utils.clamp((State.data.cadence?.clicksPerMinute ?? 0) / ((State.data.world.activeRaid ? State.data.cadence?.raidTargetCPM : State.data.cadence?.targetCPM) || 60), 0, 2);
    // Clicking always does damage — base + pedal bonus
    const baseDmg = Utils.randFloat(3, 6);
    const speedBonus = ratio >= 1.2 ? ratio * 2 : ratio >= 0.8 ? 1.0 : 0.5;
    const dmg = baseDmg * speedBonus;
    this._roadEncounterHP = Math.max(0, this._roadEncounterHP - dmg);
    this._roadEncounterLoseTimer = Math.max(0, this._roadEncounterLoseTimer - 1);
    this._lastEncounterClick = Date.now();
    // Update HP bar immediately on click — don't wait for 1s tick
    const hpEl = document.getElementById('road-enc-hp');
    if (hpEl && this._roadEncounterMaxHP > 0) {
      hpEl.style.width = `${(this._roadEncounterHP / this._roadEncounterMaxHP) * 100}%`;
    }
    const instrEl = document.getElementById('road-enc-instr');
    if (instrEl) instrEl.textContent = ratio >= 1.2 ? '💥 DIRECT HIT!' : '⚔️ Hit! Keep clicking!';
    if (this._roadEncounterHP <= 0 || this._roadEncounterHP / this._roadEncounterMaxHP <= (this._roadEncounterAnimal?.fleeThreshold || 0.15)) {
      this._resolveRoadEncounter('win');
    }
  },

  _resolveRoadEncounter(result) {
    this._roadEncounterActive = false;
    const animal = this._roadEncounterAnimal;
    const encEl  = document.getElementById('travel-encounter');
    if (encEl) encEl.classList.add('hidden');

    if (result === 'win') {
      // Rare drops
      const drops = Animals.rollDrops(animal.id);
      // Bonus: road encounter drops are 1.5× rarer
      const statusEl = document.getElementById('travel-enc-status');
      let dropStr = '';
      Object.entries(drops).forEach(([res, amt]) => {
        const actual = Math.round(amt * 1.5);
        this._gathered = this._gathered || {};
        this._gathered[res] = (this._gathered[res] || 0) + actual;
        dropStr += ` ${Utils.emojiMap[res]||'📦'}+${actual}`;
      });
      if (statusEl) statusEl.textContent = `✅ ${animal.emoji} defeated!${dropStr}`;
      Audio.sfxVictory?.();
      Utils.toast(`✅ Defeated ${animal.name}!${dropStr}`, 'good', 3000);
    } else {
      // Lost — forfeit 40% of gathered resources
      this._gathered = this._gathered || {};
      Object.keys(this._gathered).forEach(r => {
        this._gathered[r] = Math.floor((this._gathered[r] || 0) * 0.6);
      });
      const statusEl = document.getElementById('travel-enc-status');
      if (statusEl) statusEl.textContent = `💀 ${animal.emoji} took your stuff! Lost 40% loot.`;
      Audio.sfxDefeat?.();
      Utils.toast(`💀 ${animal.name} robbed you — lost 40% of gathered loot!`, 'bad', 4000);
    }
  },

  // ── Arrive at destination ─────────────────
  _arriveAtDestination(locationId) {
    clearTimeout(this._travelTimer);
    this._travelling = false;

    if (State.data?.world) State.data.world.playerAway =

      (State.data?.world?.playerAway);
    Cadence.stop();

    // Save gathered road loot
    if (this._gathered) {
      Object.entries(this._gathered).forEach(([res, amt]) => {
        if (amt > 0) State.addResource(res, amt);
      });
    }

    // Reveal large area at destination
    this._revealAround(this._playerWX, this._playerWY, 200);
    this._drawMap();

    const active = document.getElementById('wm-travel-active');
    if (active) active.classList.add('hidden');

    // Check if this is a known location
    if (locationId) {
      const def = this.locationDefs.find(d => d.id === locationId);
      const unlocked = State.data.world.unlockedLocations || [];

      // Auto-unlock based on expeditions
      this._checkUnlocks();

      if (def && unlocked.includes(locationId)) {
        this._showLocationArrival(locationId, def);
      } else if (def) {
        Utils.toast(`🔍 Discovered ${def.emoji} ${def.name}! Keep exploring to unlock it.`, 'info', 4000);
        this._returnToBase();
      } else {
        this._returnToBase();
      }
    } else {
      Utils.toast('🗺 Area explored! Fog revealed.', 'info', 2000);
      this._returnToBase();
    }
  },

  // ── Location arrival popup ─────────────────
  _showLocationArrival(locationId, def) {
    const screen = document.getElementById('screen-map');
    if (!screen) return;

    const overlay = document.createElement('div');
    overlay.className = 'wm-arrival-overlay';
    overlay.innerHTML = `
      <div class="wm-arrival-card">
        <div class="wm-arrival-icon">${def.emoji}</div>
        <div class="wm-arrival-name">${def.name}</div>
        <div class="wm-arrival-desc">${def.desc}</div>
        <div class="wm-arrival-loot">
          Common: ${def.loot.common.resources.map(r=>Utils.emojiMap[r]||'📦').join(' ')}
          <span style="color:#ffd600"> · Rare: ${def.loot.rare.resources.map(r=>Utils.emojiMap[r]||'📦').join(' ')}</span>
        </div>
        <div style="color:#7a7a9a;font-size:0.85rem;margin-top:4px">
          ✨ Unique: ${def.uniqueMaterial.emoji} ${def.uniqueMaterial.name}
        </div>
        <div class="wm-arrival-actions">
          <button class="btn-pixel btn-primary" id="btn-enter-location">⛏ FORAGE HERE (2 min)</button>
          <button class="btn-pixel btn-secondary" id="btn-skip-location">→ PASS THROUGH</button>
        </div>
      </div>
    `;
    screen.appendChild(overlay);

    document.getElementById('btn-enter-location')?.addEventListener('click', () => {
      overlay.remove();
      this._enterLocation(locationId);
    });
    document.getElementById('btn-skip-location')?.addEventListener('click', () => {
      overlay.remove();
      this._returnToBase();
    });
  },

  // ── Enter location for foraging ───────────
  _enterLocation(locationId) {
    const def = this.locationDefs.find(d => d.id === locationId);
    if (!def) { this._returnToBase(); return; }

    // Convert WorldMap locationDef to State.locations format for Foraging.start()
    const locData = {
      id:             locationId,
      name:           def.name,
      emoji:          def.emoji,
      bgColor:        def.bgColor,
      bgEmoji:        def.foragingScene || def.bgEmoji,
      animals:        def.animals,
      encounterChance: def.encounterChance,
      loot:           def.loot,
      events:         def.events,
      uniqueMaterial: def.uniqueMaterial,
      duration:       120, // 2 min foraging window
      energyCost:     0    // already paid with travel
    };

    // Temporarily register in State.locations for Foraging to use
    State.locations[locationId] = locData;

    const intensityCfg = { lootMult: 1.5, durationMult: 1, encounterMult: 1.2 };
    Foraging.start(locationId, intensityCfg);
  },

  // ── Return to base ─────────────────────────
  _returnToBase() {
    this._playerWX = 0;
    this._playerWY = 0;
    this._mapData.playerWX = 0;
    this._mapData.playerWY = 0;
    Events.emit('hud:update');
    Audio.play('base');
    setTimeout(() => Events.emit('navigate', { screen: 'base' }), 300);
  },

  // ── Unlock progression ────────────────────
  _checkUnlocks() {
    const n = State.data.stats.totalExpeditions;
    const unlockedMissions = State.data.world.unlockedMissions || [];
    const unlock = (id) => {
      if (!State.data.world.unlockedLocations.includes(id)) {
        State.data.world.unlockedLocations.push(id);
        const def = this.locationDefs.find(d => d.id === id);
        if (def) Utils.toast('🗺 ' + def.emoji + ' ' + def.name + ' unlocked!', 'good', 4000);
        Audio.sfxUnlock?.();
      }
    };
    this.locationDefs.forEach(def => {
      // Regular locations: unlock by expedition count
      if (!def.isMission && n >= def.unlockAfterExpeditions) unlock(def.id);
      // Special missions: unlock by radio tower level
      if (def.isMission && def.missionKey && unlockedMissions.includes(def.missionKey)) {
        unlock(def.id);
      }
    });
  },

  // Check and show mission count badge on world map icon
  getMissionCount() {
    const missions = State.data.world.unlockedMissions || [];
    return missions.length;
  },

  // Returns true if id is a special mission location
  isMission(id) {
    const def = this.locationDefs.find(d => d.id === id);
    return !!(def && def.isMission);
  }
};

// Subscribe: base emits when player opens the world map
Events.on('worldmap:render', () => { setTimeout(() => WorldMap.render(), 50); });

// Subscribe: foraging/other modules emit map:unlock instead of calling MapScreen.unlock()
Events.on('map:unlock', () => WorldMap._checkUnlocks());
