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
  WORLD_W: 32000,
  WORLD_H: 32000,
  TILE:    20,      // pixels per world-unit on canvas

  // ── Location zone definitions ─────────────
  // Positions in world-units from centre (0,0)
  // Distance ~100–900 units; 1000 = edge of world
  locationDefs: [
    { id:'forest',        name:'FOREST',        emoji:'🌲', dangerLevel:1, dangerCol:'#4caf50',
      desc:'Dense mutated woodland.',
      wx: -1580, wy: -1020, radius: 160,
      bgColor:'#0d1a08', bgEmoji:'🌲🌲🌳🌲🌳🌲🌲',
      tileColor:'#1a3010', fogReveal:'#3d7a22',
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
      wx: 1240,  wy: -1420, radius: 145,
      bgColor:'#1a1500', bgEmoji:'🌾🚜🌾🌾🐄🌾',
      tileColor:'#2a2010', fogReveal:'#52481e',
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
      wx: 2260,  wy: 450,  radius: 125,
      bgColor:'#1a1000', bgEmoji:'⛽🏪⛽🛢️⛽🏚️',
      tileColor:'#2a1a00', fogReveal:'#4a3c18',
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
      wx: -1020, wy: 2150, radius: 195,
      bgColor:'#0d0d12', bgEmoji:'🏚️🧱🏗️🏚️🧱🏙️',
      tileColor:'#141418', fogReveal:'#363650',
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
      wx: 3170,  wy: -1980, radius: 145,
      bgColor:'#100d0d', bgEmoji:'🔩🗑️♻️🚗💀🔩',
      tileColor:'#1a1010', fogReveal:'#442828',
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
      wx: -2940, wy: 1580, radius: 135,
      bgColor:'#100d0d', bgEmoji:'🏥🚑🏥🩺🏥🚑',
      tileColor:'#1a0d0d', fogReveal:'#401a1a',
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
      wx: -3960, wy: -2380, radius: 150,
      bgColor:'#050508', bgEmoji:'🪨🕯️🪨💎🪨🕯️',
      tileColor:'#0a0a0f', fogReveal:'#222238',
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
      wx: 3850,  wy: 2830, radius: 160,
      bgColor:'#0a0a05', bgEmoji:'🪖🔫🏗️🚧🪖🔫',
      tileColor:'#0f0f08', fogReveal:'#323218',
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
      wx: 850,  wy: 680, radius: 110, isMission:true, missionKey:'signal_drop',
      bgColor:'#0a0d14', bgEmoji:'📦🪂📦🌫️📦🪂',
      tileColor:'#111820', fogReveal:'#2a3e5c',
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
      wx: -1980, wy: 1020, radius: 115, isMission:true, missionKey:'rescue_beacon',
      bgColor:'#140808', bgEmoji:'🆘🩸🚑🔦🆘🩸',
      tileColor:'#1e0e0e', fogReveal:'#4c2020',
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
      wx: 1700,  wy: -2720, radius: 125, isMission:true, missionKey:'black_market',
      bgColor:'#0d0814', bgEmoji:'🏴🕯️💀🏴🗡️💀',
      tileColor:'#130d1c', fogReveal:'#32204e',
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
      wx: -3510, wy: 3510, radius: 145, isMission:true, missionKey:'command_bunker',
      bgColor:'#050508', bgEmoji:'🎖️🔐💣🎖️🔐💣',
      tileColor:'#080810', fogReveal:'#1e1e3c',
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
      wx: 0,    wy: -4810, radius: 170, isMission:true, missionKey:'endgame_transmission',
      bgColor:'#02020a', bgEmoji:'🌐📡💫🌐📡✨',
      tileColor:'#050510', fogReveal:'#181840',
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
  _scale:        0.06,   // world-units → screen pixels (doubled world)
  _travelling:   false,
  _travelTimer:  null,
  _travelPath:   [],
  _travelStep:   0,
  _travelTarget: null,   // { wx, wy, locationId or null }
  _passedNodes:  null,   // Set of node ids already prompted this trip
  _playerWX:     0,      // current player world position
  _playerWY:     0,
  _pendingTravel: null,  // { wx, wy, distUnits, locationId }

  // ── Initialise / generate world ───────────
  init() {
    // Load or generate map data
    const saved = State.data.worldMapData;
    if (saved && saved.seed) {
      this._mapData = saved;
      // Migrate old saves: add resource nodes if missing
      if (!this._mapData.resourceNodes) {
        const rng = this._makeRng(this._mapData.seed);
        this._mapData.resourceNodes = this._generateResourceNodes(rng);
      }
    } else {
      this._mapData = this._generate();
      State.data.worldMapData = this._mapData;
    }
    this._playerWX = this._mapData.playerWX;
    this._playerWY = this._mapData.playerWY;

    // Regen depleted nodes: +1 stock per 4 real-world hours
    const now = Date.now();
    (this._mapData.resourceNodes || []).forEach(n => {
      if (n.isPond || n.qty >= n.maxQty) return;
      const hoursElapsed = (now - (n.lastRegen || 0)) / 3600000;
      const refill = Math.floor(hoursElapsed / 4);
      if (refill > 0) {
        n.qty = Math.min(n.maxQty, n.qty + refill);
        n.lastRegen = now;
      }
    });
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

    // Fog grid: 400×400 cells covering the world, 0=fogged, 1=revealed
    // 32000 world-units / 400 cells = 80 units/cell (same as original 16000/200)
    const fogW = 400, fogH = 400;
    const fog  = new Array(fogW * fogH).fill(0);
    // Reveal small area around base start (±3 cells = ±240 world-units)
    const baseFogX = Math.floor(fogW/2);
    const baseFogY = Math.floor(fogH/2);
    for (let dy = -3; dy <= 3; dy++)
      for (let dx = -3; dx <= 3; dx++)
        fog[(baseFogY+dy)*fogW + (baseFogX+dx)] = 1;

    return { seed, zones, roads, fog, fogW, fogH,
      playerWX: 0, playerWY: 0,
      resourceNodes: this._generateResourceNodes(rng) };
  },

  // ── Resource node definitions (issue 62) ──
  // count: fewer = rarer. minDist/maxDist from base (world units, radius 5000)
  _resourceNodeDefs: [
    { key:'wood',        emoji:'🪵', count:18, minDist:100,  maxDist:1200, color:'#2d5a1a',
      name:'Woodland', bgColor:'#0d1a08', bgEmoji:'🌲🌿🌲🍄🌲🌿🌳',
      animals:['wolf','boar','insect'], encounterChance:0.18,
      loot:{ common:{resources:['wood','rope'],weight:70}, rare:{resources:['wood','food'],weight:25}, legendary:{resources:['rope','wild_seeds'],weight:5} },
      uniqueMaterial:{key:'spores',name:'Glowing Spores',emoji:'🍄'} },
    { key:'food',        emoji:'🌾', count:16, minDist:150,  maxDist:1400, color:'#4a6a10',
      name:'Crop Field', bgColor:'#1a1500', bgEmoji:'🌾🚜🌾🌱🌾🐄🌾',
      animals:['boar','insect','rat'], encounterChance:0.14,
      loot:{ common:{resources:['food','water'],weight:70}, rare:{resources:['food','rope','cloth'],weight:25}, legendary:{resources:['food','food','wild_seeds'],weight:5} },
      uniqueMaterial:{key:'wild_seeds',name:'Wild Seeds',emoji:'🌱'} },
    { key:'rope',        emoji:'🪢', count:14, minDist:200,  maxDist:1600, color:'#6a5020',
      name:'Overgrown Lot', bgColor:'#181008', bgEmoji:'🪢🌿🌾🪴🌿🪢🌿',
      animals:['insect','rat','bird'], encounterChance:0.12,
      loot:{ common:{resources:['rope','cloth'],weight:65}, rare:{resources:['rope','wood','food'],weight:28}, legendary:{resources:['rope','cloth'],weight:7} },
      uniqueMaterial:{key:'wild_seeds',name:'Wild Seeds',emoji:'🌱'} },
    { key:'metal',       emoji:'⚙️', count:12, minDist:400,  maxDist:2200, color:'#505050',
      name:'Scrap Yard', bgColor:'#100d0d', bgEmoji:'🔩🗑️♻️🚗💀🔩',
      animals:['rat','zombie_dog','insect'], encounterChance:0.22,
      loot:{ common:{resources:['metal','rope'],weight:60}, rare:{resources:['metal','electronics','glass'],weight:30}, legendary:{resources:['electronics','engine_parts'],weight:10} },
      uniqueMaterial:{key:'scrap_wire',name:'Scrap Wire',emoji:'🔌'} },
    { key:'cloth',       emoji:'🧵', count:10, minDist:500,  maxDist:2400, color:'#5a3060',
      name:'Textile Ruin', bgColor:'#180d18', bgEmoji:'🧵🏚️🧶🏚️🧵🏚️🧶',
      animals:['rat','insect','bird'], encounterChance:0.16,
      loot:{ common:{resources:['cloth','rope'],weight:65}, rare:{resources:['cloth','medicine','food'],weight:25}, legendary:{resources:['cloth','cloth'],weight:10} },
      uniqueMaterial:{key:'scrap_wire',name:'Scrap Wire',emoji:'🔌'} },
    { key:'coal',        emoji:'⛏️', count:8,  minDist:800,  maxDist:3000, color:'#282828',
      name:'Coal Seam', bgColor:'#060608', bgEmoji:'⛏️🪨💎⛏️🪨🕯️🪨',
      animals:['insect','rat','bear'], encounterChance:0.26,
      loot:{ common:{resources:['coal','metal'],weight:55}, rare:{resources:['coal','chemicals'],weight:35}, legendary:{resources:['coal','coal','cave_crystal'],weight:10} },
      uniqueMaterial:{key:'cave_crystal',name:'Cave Crystal',emoji:'💎'} },
    { key:'medicine',    emoji:'💊', count:7,  minDist:1000, maxDist:3200, color:'#1a4a1a',
      name:'Medical Cache', bgColor:'#100d0d', bgEmoji:'🏥💊🩺🧪💉🏥💊',
      animals:['zombie_dog','rat','insect'], encounterChance:0.30,
      loot:{ common:{resources:['medicine','cloth'],weight:55}, rare:{resources:['medicine','chemicals'],weight:35}, legendary:{resources:['medicine','antiseptic'],weight:10} },
      uniqueMaterial:{key:'antiseptic',name:'Antiseptic',emoji:'🧫'} },
    { key:'chemicals',   emoji:'⚗️', count:6,  minDist:1200, maxDist:3800, color:'#1a3060',
      name:'Chemical Plant', bgColor:'#0a0d14', bgEmoji:'⚗️🏭⚗️🧪🏭💀⚗️',
      animals:['rat','zombie_dog','insect'], encounterChance:0.28,
      loot:{ common:{resources:['chemicals','metal'],weight:50}, rare:{resources:['chemicals','electronics'],weight:35}, legendary:{resources:['chemicals','circuit_board'],weight:15} },
      uniqueMaterial:{key:'circuit_board',name:'Circuit Board',emoji:'💾'} },
    { key:'electronics', emoji:'💡', count:5,  minDist:1500, maxDist:4200, color:'#1a2a4a',
      name:'Tech Ruins', bgColor:'#080c14', bgEmoji:'💡🖥️📟💡🔌📡💡',
      animals:['zombie_dog','rat','bird'], encounterChance:0.32,
      loot:{ common:{resources:['electronics','metal'],weight:50}, rare:{resources:['electronics','circuit_board'],weight:35}, legendary:{resources:['circuit_board','military_chip'],weight:15} },
      uniqueMaterial:{key:'circuit_board',name:'Circuit Board',emoji:'💾'} },
    { key:'gasoline',    emoji:'⛽', count:5,  minDist:1400, maxDist:4000, color:'#3a2200',
      name:'Fuel Depot', bgColor:'#100a00', bgEmoji:'⛽🛢️🔧⛽🏪⛽🛢️',
      animals:['rat','bird','zombie_dog'], encounterChance:0.24,
      loot:{ common:{resources:['gasoline','metal'],weight:55}, rare:{resources:['gasoline','chemicals','electronics'],weight:32}, legendary:{resources:['electronics','engine_parts'],weight:13} },
      uniqueMaterial:{key:'engine_parts',name:'Engine Parts',emoji:'⚙️'} },
    { key:'circuit_board',emoji:'🖥️',count:3, minDist:3000, maxDist:4800, color:'#002a2a',
      name:'Circuit Dump', bgColor:'#030d0d', bgEmoji:'🖥️💾🔌📡🖥️💾🔌',
      animals:['zombie_dog','rat','boss_mutant'], encounterChance:0.38,
      loot:{ common:{resources:['circuit_board','electronics'],weight:45}, rare:{resources:['circuit_board','military_chip'],weight:38}, legendary:{resources:['military_chip','circuit_board','circuit_board'],weight:17} },
      uniqueMaterial:{key:'military_chip',name:'Military Chip',emoji:'🎖️'} },
    { key:'military_chip',emoji:'🎖️',count:2, minDist:4000, maxDist:5000, color:'#2a1a00',
      name:'Military Cache', bgColor:'#050504', bgEmoji:'🎖️🔐💣🔫🎖️🔐💣',
      animals:['zombie_dog','boss_mutant'], encounterChance:0.45,
      loot:{ common:{resources:['military_chip','electronics'],weight:40}, rare:{resources:['military_chip','circuit_board'],weight:38}, legendary:{resources:['military_chip','military_chip'],weight:22} },
      uniqueMaterial:{key:'military_chip',name:'Military Chip',emoji:'🎖️'} },
    // Ponds — fishing only, no harvest session
    { key:'pond', emoji:'🎣', count:8, minDist:200, maxDist:3000, color:'#0a2a4a', isPond:true },
  ],

  _generateResourceNodes(rng) {
    const nodes = [];
    for (const def of this._resourceNodeDefs) {
      for (let i = 0; i < def.count; i++) {
        // Place at random angle, distance in [minDist, maxDist], inside circle
        const angle = rng() * Math.PI * 2;
        const dist  = def.minDist + rng() * (def.maxDist - def.minDist);
        const wx = Math.cos(angle) * dist;
        const wy = Math.sin(angle) * dist;
        const maxQty = def.isPond ? 0 : (3 + Math.floor(rng() * 5)); // ponds: unlimited fish
        nodes.push({
          id:       `${def.key}_${i}_${Math.floor(rng()*9999)}`,
          key:      def.key,
          wx, wy,
          qty:      maxQty,   // current stock (0 = depleted)
          maxQty,
          isPond:   !!def.isPond,
          // Regen: refills 1 unit per real-world day (checked on map open)
          lastRegen: 0,
        });
      }
    }
    return nodes;
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
            <button class="btn-pixel btn-primary" id="btn-back-from-map" style="padding:8px 16px;font-size:clamp(0.28rem,1.2vw,0.45rem)">← BACK TO BASE</button>
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
        if (State.data?.world) State.data.world.playerAway = false;
        this._roadEncounterActive = false;
        // Reset to base so next trip always starts from home
        this._playerWX = 0; this._playerWY = 0;
        this._mapData.playerWX = 0; this._mapData.playerWY = 0;
        Events.emit('navigate', { screen: 'base' });
      });

    // World map zoom buttons
    document.getElementById('wm-zoom-in') ?.addEventListener('click', () => {
      this._scale = Utils.clamp(this._scale * 1.3, 0.05, 0.40);
      this._centreOnPlayer(); this._drawMap();
    });
    document.getElementById('wm-zoom-out')?.addEventListener('click', () => {
      this._scale = Utils.clamp(this._scale * 0.77, 0.05, 0.40);
      this._centreOnPlayer(); this._drawMap();
    });
    document.getElementById('wm-zoom-fit')?.addEventListener('click', () => {
      this._scale = 0.06; this._centreOnPlayer(); this._drawMap();
    });

    this._setupCanvas();
    this._drawMap();
    this._bindCanvasInput();

    // Re-setup canvas once the DOM has actually painted and the wrap has real dimensions.
    // This fixes the "tiny black box" issue where clientWidth/Height was 0 on first render.
    requestAnimationFrame(() => {
      const wrap = document.getElementById('wm-canvas-wrap');
      if (wrap && wrap.clientHeight > 10) {
        this._setupCanvas();
        this._drawMap();
      }
    });

    // Also handle window resize
    if (this._resizeObserver) this._resizeObserver.disconnect();
    const wrapEl = document.getElementById('wm-canvas-wrap');
    if (wrapEl && window.ResizeObserver) {
      this._resizeObserver = new ResizeObserver(() => {
        this._setupCanvas();
        this._drawMap();
      });
      this._resizeObserver.observe(wrapEl);
    }
  },

  // ── Canvas setup ──────────────────────────
  _setupCanvas() {
    const wrap = document.getElementById('wm-canvas-wrap');
    const canvas = document.getElementById('wm-canvas');
    if (!wrap || !canvas) return;
    this._canvas = canvas;
    this._ctx    = canvas.getContext('2d');

    const dpr  = window.devicePixelRatio || 1;
    const cssW = wrap.clientWidth  > 10 ? wrap.clientWidth  : window.innerWidth;
    const cssH = wrap.clientHeight > 10 ? wrap.clientHeight : window.innerHeight - 120;

    canvas.width  = cssW * dpr;
    canvas.height = cssH * dpr;
    canvas.style.width  = cssW + 'px';
    canvas.style.height = cssH + 'px';
    this._ctx.scale(dpr, dpr);
    this._cssW = cssW;
    this._cssH = cssH;

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

  // World radius (world units) — defines the circle boundary
  WORLD_R: 5000,

  // ── Draw the full map ─────────────────────
  _drawMap() {
    const c = this._ctx;
    if (!c || !this._mapData) return;
    const W = this._cssW || this._canvas.width;
    const H = this._cssH || this._canvas.height;

    // Background void outside the circle
    c.fillStyle = '#02020a';
    c.fillRect(0, 0, W, H);

    // Clip everything to the circular world boundary
    const { sx: cx, sy: cy } = this._toScreen(0, 0);
    const rPx = this.WORLD_R * this._scale;
    c.save();
    c.beginPath();
    c.arc(cx, cy, rPx, 0, Math.PI * 2);
    c.clip();

    // Revealed terrain base (biome colours + noise)
    this._drawTerrain(c);

    // Roads + zone glows on top of terrain
    this._drawRoads(c);
    this._drawZones(c);

    // Resource nodes
    this._drawResourceNodes(c);

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

    c.restore();

    // Circle world border ring (drawn outside clip so it shows over fog edge)
    c.beginPath();
    c.arc(cx, cy, rPx, 0, Math.PI * 2);
    c.strokeStyle = '#1a1a40';
    c.lineWidth = 3;
    c.stroke();
    // Outer glow
    c.beginPath();
    c.arc(cx, cy, rPx + 2, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(60,60,120,0.4)';
    c.lineWidth = 6;
    c.stroke();
  },

  _drawRoads(c) {
    const md = this._mapData;
    md.roads.forEach((road, i) => {
      const zone = md.zones[i];
      const def  = zone && this.locationDefs.find(d => d.id === zone.id);
      const danger = def?.dangerLevel || 1;

      // Road surface — wide dark base
      c.beginPath();
      road.forEach((pt, idx) => {
        const { sx, sy } = this._toScreen(pt.x, pt.y);
        idx === 0 ? c.moveTo(sx, sy) : c.lineTo(sx, sy);
      });
      c.strokeStyle = danger >= 4 ? '#2a0a04' : danger >= 3 ? '#24100a' : danger >= 2 ? '#221808' : '#1e1a10';
      c.lineWidth = 5 + danger * 1.5;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      c.stroke();

      // Road centre stripe — colour indicates danger
      c.beginPath();
      road.forEach((pt, idx) => {
        const { sx, sy } = this._toScreen(pt.x, pt.y);
        idx === 0 ? c.moveTo(sx, sy) : c.lineTo(sx, sy);
      });
      c.strokeStyle = danger >= 4 ? '#6a1a06' : danger >= 3 ? '#5a2808' : danger >= 2 ? '#3a3010' : '#2e2a18';
      c.lineWidth = 1.5;
      c.setLineDash(danger >= 3 ? [4, 10] : [10, 8]);
      c.stroke();
      c.setLineDash([]);

      // Shoulder edge glow for dangerous roads
      if (danger >= 3) {
        c.beginPath();
        road.forEach((pt, idx) => {
          const { sx, sy } = this._toScreen(pt.x, pt.y);
          idx === 0 ? c.moveTo(sx, sy) : c.lineTo(sx, sy);
        });
        c.strokeStyle = danger >= 4 ? 'rgba(180,20,5,0.25)' : 'rgba(140,60,10,0.2)';
        c.lineWidth = 9 + danger * 2;
        c.stroke();
      }
    });
  },

  _drawZones(c) {
    const md  = this._mapData;
    const t   = Date.now() / 1000;
    md.zones.forEach(zone => {
      const def = this.locationDefs.find(d => d.id === zone.id);
      if (!def) return;
      const { sx, sy } = this._toScreen(zone.wx, zone.wy);
      const r = zone.radius * this._scale;
      const pal = this._biomePalette[def.id] || this._biomePalette._default;

      // Outer ambient glow (large, soft)
      const outer = c.createRadialGradient(sx, sy, r * 0.5, sx, sy, r * 2.8);
      outer.addColorStop(0,   pal.mid + 'aa');
      outer.addColorStop(0.4, pal.base + '66');
      outer.addColorStop(0.8, pal.detail + '22');
      outer.addColorStop(1,   'transparent');
      c.beginPath(); c.arc(sx, sy, r * 2.8, 0, Math.PI*2);
      c.fillStyle = outer; c.fill();

      // Zone boundary ring with pulse
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + zone.wx);
      c.beginPath(); c.arc(sx, sy, r, 0, Math.PI*2);
      c.strokeStyle = def.dangerCol + Math.floor(60 + pulse * 60).toString(16).padStart(2,'0');
      c.lineWidth = 1 + pulse;
      c.stroke();

      // Biome-specific zone fill patterns (drawn as small sprites over the zone)
      this._drawZoneDetails(c, def, sx, sy, r, t);
    });
  },

  // ── Zone-interior decorative details ─────────────────────────────────
  _drawZoneDetails(c, def, sx, sy, r, t) {
    const rng = this._makeRng(def.wx ? Math.abs(def.wx * 31 + def.wy) : 12345);
    const count = 6 + Math.floor(r / 8);
    c.save();
    c.beginPath(); c.arc(sx, sy, r * 1.1, 0, Math.PI*2); c.clip();

    for (let i = 0; i < count; i++) {
      const ang = rng() * Math.PI * 2;
      const dist = rng() * r * 0.9;
      const ex = sx + Math.cos(ang) * dist;
      const ey = sy + Math.sin(ang) * dist;
      const sz = 3 + rng() * 5;

      switch (def.id) {
        case 'forest':
          // Tree crowns — dark green circles
          c.fillStyle = rng() > 0.5 ? '#1a5010' : '#0d3508';
          c.beginPath(); c.arc(ex, ey, sz, 0, Math.PI*2); c.fill();
          if (rng() > 0.6) { c.fillStyle = '#2a6a18'; c.beginPath(); c.arc(ex - sz*0.3, ey - sz*0.3, sz*0.5, 0, Math.PI*2); c.fill(); }
          break;
        case 'city_ruins': case 'abandoned_farm':
          // Ruined building footprints
          c.strokeStyle = def.id === 'city_ruins' ? '#303050' : '#403820';
          c.lineWidth = 1;
          c.strokeRect(ex - sz, ey - sz, sz * 2, sz * 2);
          if (rng() > 0.5) { c.strokeRect(ex - sz*0.3, ey - sz*0.3, sz*0.6, sz*0.6); }
          break;
        case 'junkyard':
          // Scrap piles — angular shapes
          c.fillStyle = '#3a1a10';
          c.fillRect(ex - sz*0.4, ey - sz*0.8, sz*0.8, sz*1.6);
          c.fillRect(ex - sz*0.8, ey - sz*0.4, sz*1.6, sz*0.8);
          break;
        case 'hospital':
          // Red cross motif
          c.fillStyle = 'rgba(80,10,10,0.5)';
          c.fillRect(ex - sz*0.25, ey - sz*0.75, sz*0.5, sz*1.5);
          c.fillRect(ex - sz*0.75, ey - sz*0.25, sz*1.5, sz*0.5);
          break;
        case 'cave':
          // Stalactite triangles
          c.fillStyle = '#0a0a18';
          c.beginPath(); c.moveTo(ex, ey + sz); c.lineTo(ex - sz*0.4, ey - sz*0.2); c.lineTo(ex + sz*0.4, ey - sz*0.2); c.closePath(); c.fill();
          if (rng() > 0.6) { c.fillStyle = 'rgba(60,60,150,0.4)'; c.beginPath(); c.arc(ex, ey, 1.5, 0, Math.PI*2); c.fill(); }
          break;
        case 'military_base':
          // Sandbag bunkers and watchtower shapes
          c.fillStyle = '#1e1e08';
          c.fillRect(ex - sz, ey - sz*0.4, sz*2, sz*0.8);
          c.fillStyle = '#2a2a10';
          c.fillRect(ex - sz*0.3, ey - sz*0.8, sz*0.6, sz*0.8);
          break;
        case 'gas_station':
          // Fuel tanks and pipes
          c.fillStyle = '#2a1808';
          c.beginPath(); c.ellipse(ex, ey, sz*0.6, sz*0.4, 0, 0, Math.PI*2); c.fill();
          c.strokeStyle = '#3a2810'; c.lineWidth = 0.5;
          c.strokeRect(ex - sz*0.8, ey - sz*0.8, sz*1.6, sz*1.6);
          break;
        default:
          // Wasteland rocks
          c.fillStyle = 'rgba(50,45,35,0.6)';
          c.beginPath(); c.arc(ex, ey, sz*0.5, 0, Math.PI*2); c.fill();
          break;
      }
    }
    c.restore();
  },

  // ── Biome colour maps — rich terrain per zone type ──────────────────
  _biomePalette: {
    forest:        { base:'#1a3a10', mid:'#2a5a18', accent:'#3d7a22', detail:'#0d2008', type:'forest' },
    abandoned_farm:{ base:'#2a2008', mid:'#3a3010', accent:'#524818', detail:'#1a1204', type:'farm' },
    gas_station:   { base:'#1e1408', mid:'#2e2010', accent:'#4a3c18', detail:'#120c04', type:'industrial' },
    city_ruins:    { base:'#141418', mid:'#1e1e28', accent:'#363650', detail:'#0a0a10', type:'ruins' },
    junkyard:      { base:'#1a1010', mid:'#281818', accent:'#442828', detail:'#100808', type:'junk' },
    hospital:      { base:'#1a0d0d', mid:'#2a1414', accent:'#401a1a', detail:'#0f0808', type:'medical' },
    cave:          { base:'#080810', mid:'#0f0f1a', accent:'#222238', detail:'#040408', type:'cave' },
    military_base: { base:'#0f0f08', mid:'#1a1a0c', accent:'#323218', detail:'#080804', type:'military' },
    _default:      { base:'#2a2418', mid:'#343020', accent:'#403c2c', detail:'#1c1810', type:'wasteland' },
  },

  // ── Terrain base for revealed cells — biome-specific ──────────────
  _drawTerrain(c) {
    const md   = this._mapData;
    const fw   = md.fogW, fh = md.fogH;
    const cellWX = this.WORLD_W / fw;
    const cellWY = this.WORLD_H / fh;

    // Pre-build influence map: for each world-unit position → nearest zone + distance
    // (computed lazily per-cell using zone list)
    for (let fy = 0; fy < fh; fy++) {
      for (let fx = 0; fx < fw; fx++) {
        if (md.fog[fy * fw + fx] !== 1) continue;

        const wx = (fx - fw/2 + 0.5) * cellWX;
        const wy = (fy - fh/2 + 0.5) * cellWY;
        const { sx, sy } = this._toScreen(wx, wy);
        const pw = cellWX * this._scale + 1;
        const ph = cellWY * this._scale + 1;

        // Find nearest zone and how deep inside its biome we are (0=outside, 1=centre)
        let nearestDef = null, nearestDist = Infinity;
        for (const zone of md.zones) {
          const def = this.locationDefs.find(d => d.id === zone.id);
          if (!def) continue;
          const dx = wx - zone.wx, dy = wy - zone.wy;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < nearestDist) { nearestDist = d; nearestDef = def; }
        }

        const pal = (nearestDef && this._biomePalette[nearestDef.id]) || this._biomePalette._default;
        // Blend depth: 0 far from zone, 1 at zone centre
        const maxR = nearestDef ? nearestDef.radius * 3 : 800;
        const depth = Math.max(0, 1 - nearestDist / maxR);

        const n   = this._cellNoise(fx, fy);
        const n2  = this._cellNoise(fx * 3 + 7, fy * 5 + 11);
        const n3  = this._cellNoise(fx * 7 + 31, fy * 2 + 53);

        // Base ground colour interpolated by depth
        const col = depth > 0.6 ? pal.mid : depth > 0.25 ? pal.base : pal.detail;
        c.fillStyle = col;
        c.fillRect(sx - pw/2, sy - ph/2, pw, ph);

        // Biome-specific overlays
        this._drawBiomeDetail(c, pal.type, sx, sy, pw, ph, depth, n, n2, n3);
      }
    }
  },

  // ── Per-cell biome texture detail ────────────────────────────────────
  _drawBiomeDetail(c, type, sx, sy, pw, ph, depth, n, n2, n3) {
    switch (type) {
      case 'forest':
        // Dense canopy patches — dark green dabs
        if (n > 0.55) { c.fillStyle = 'rgba(20,70,10,0.7)'; c.beginPath(); c.arc(sx, sy, pw*0.6, 0, Math.PI*2); c.fill(); }
        if (n2 > 0.7 && depth > 0.3) { c.fillStyle = 'rgba(60,130,20,0.4)'; c.fillRect(sx-pw*0.3, sy-ph*0.3, pw*0.6, ph*0.6); }
        if (n3 > 0.85) { c.fillStyle = 'rgba(10,40,5,0.9)'; c.beginPath(); c.arc(sx+pw*0.2, sy-ph*0.1, pw*0.35, 0, Math.PI*2); c.fill(); }
        break;
      case 'farm':
        // Row crops — horizontal stripes
        if (Math.floor(sy / (ph * 2)) % 2 === 0 && depth > 0.2) { c.fillStyle = 'rgba(80,70,10,0.35)'; c.fillRect(sx-pw, sy-ph*0.2, pw*2, ph*0.4); }
        if (n > 0.75) { c.fillStyle = 'rgba(100,90,20,0.4)'; c.fillRect(sx-pw*0.2, sy-ph*0.2, pw*0.4, ph*0.4); }
        break;
      case 'industrial':
        // Oil stains + metal scraps
        if (n > 0.6) { c.fillStyle = 'rgba(20,10,0,0.6)'; c.fillRect(sx-pw*0.4, sy-ph*0.3, pw*0.8, ph*0.6); }
        if (n2 > 0.8) { c.fillStyle = 'rgba(60,50,20,0.5)'; c.fillRect(sx-pw*0.1, sy-ph*0.1, pw*0.2, ph*0.2); }
        if (n3 > 0.88) { c.strokeStyle = 'rgba(80,60,10,0.4)'; c.lineWidth = 0.5; c.strokeRect(sx-pw*0.4, sy-ph*0.4, pw*0.8, ph*0.8); }
        break;
      case 'ruins':
        // Crumbled concrete blocks + rubble
        if (n > 0.5) { c.fillStyle = 'rgba(30,30,40,0.7)'; c.fillRect(sx-pw*0.45, sy-ph*0.45, pw*0.4, ph*0.4); }
        if (n2 > 0.6) { c.fillStyle = 'rgba(20,20,35,0.5)'; c.fillRect(sx, sy, pw*0.4, ph*0.4); }
        if (n3 > 0.78) { c.fillStyle = 'rgba(50,50,70,0.3)'; c.beginPath(); c.arc(sx, sy, pw*0.5, 0, Math.PI*2); c.fill(); }
        // Cracks
        if (n > 0.82) { c.strokeStyle = 'rgba(60,60,80,0.4)'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(sx-pw*0.3, sy-ph*0.3); c.lineTo(sx+pw*0.2, sy+ph*0.3); c.stroke(); }
        break;
      case 'junk':
        // Scattered scrap metal — orange-red rust patches
        if (n > 0.45) { c.fillStyle = 'rgba(60,20,10,0.55)'; c.fillRect(sx-pw*0.3, sy-ph*0.2, pw*0.6, ph*0.4); }
        if (n2 > 0.7) { c.fillStyle = 'rgba(80,30,10,0.4)'; c.beginPath(); c.arc(sx, sy, pw*0.4, 0, Math.PI*2); c.fill(); }
        if (n3 > 0.85) { c.strokeStyle = 'rgba(100,40,20,0.5)'; c.lineWidth = 0.8; c.strokeRect(sx-pw*0.25, sy-ph*0.25, pw*0.5, ph*0.5); }
        break;
      case 'medical':
        // Sterile tile pattern + bio-hazard stains
        if (n > 0.72) { c.fillStyle = 'rgba(40,10,10,0.6)'; c.fillRect(sx-pw*0.5, sy-ph*0.5, pw, ph); }
        if (n2 > 0.6 && depth > 0.3) { c.fillStyle = 'rgba(20,0,0,0.3)'; c.fillRect(sx-pw*0.1, sy-ph*0.1, pw*0.2, ph*0.2); }
        // Tile grid
        c.strokeStyle = 'rgba(60,20,20,0.2)'; c.lineWidth = 0.3;
        c.strokeRect(sx-pw*0.5, sy-ph*0.5, pw, ph);
        break;
      case 'cave':
        // Stalactite shadow patches + crystal glints
        if (n > 0.6) { c.fillStyle = 'rgba(5,5,20,0.8)'; c.beginPath(); c.arc(sx, sy, pw*0.6, 0, Math.PI*2); c.fill(); }
        if (n2 > 0.82 && depth > 0.4) { c.fillStyle = 'rgba(80,80,180,0.3)'; c.beginPath(); c.arc(sx, sy, pw*0.25, 0, Math.PI*2); c.fill(); }
        if (n3 > 0.90) { c.fillStyle = 'rgba(140,140,255,0.5)'; c.fillRect(sx-1, sy-1, 2, 2); } // crystal glint
        break;
      case 'military':
        // Camo pattern — dark olive blotches
        if (n > 0.5) { c.fillStyle = 'rgba(20,20,8,0.6)'; c.fillRect(sx-pw*0.4, sy-ph*0.3, pw*0.7, ph*0.5); }
        if (n2 > 0.65) { c.fillStyle = 'rgba(35,35,12,0.4)'; c.fillRect(sx-pw*0.2, sy, pw*0.5, ph*0.4); }
        // Barbed wire cross pattern near centre
        if (depth > 0.5 && n3 > 0.7) { c.strokeStyle = 'rgba(60,50,10,0.4)'; c.lineWidth = 0.6; c.beginPath(); c.moveTo(sx-pw*0.4, sy-ph*0.4); c.lineTo(sx+pw*0.4, sy+ph*0.4); c.moveTo(sx+pw*0.4, sy-ph*0.4); c.lineTo(sx-pw*0.4, sy+ph*0.4); c.stroke(); }
        break;
      default: // wasteland
        // Cracked dry earth
        if (n > 0.65) { c.fillStyle = 'rgba(255,230,150,0.05)'; c.fillRect(sx-pw*0.3, sy-ph*0.3, pw*0.6, ph*0.6); }
        if (n2 > 0.8)  { c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(sx-pw*0.5, sy-ph*0.5, pw, ph); }
        if (n3 > 0.88) { c.strokeStyle = 'rgba(255,200,100,0.06)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(sx-pw*0.4, sy); c.lineTo(sx+pw*0.4, sy+ph*0.3); c.stroke(); }
        break;
    }
  },

  _cellNoise(fx, fy) {
    let n = fx * 1619 + fy * 31337;
    n = (n ^ (n >> 13)) * (n * n * 60493 + 19990303) + 1376312589;
    return ((n & 0x7fffffff) / 0x7fffffff);
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

    // Fog edge vignette — only darkens the outermost screen border, not centre
    const vx = c.createRadialGradient(W/2, H/2, Math.min(W,H)*0.55, W/2, H/2, Math.max(W,H)*0.75);
    vx.addColorStop(0, 'transparent');
    vx.addColorStop(1, 'rgba(0,0,0,0.35)');
    c.fillStyle = vx;
    c.fillRect(0, 0, W, H);
  },

  _isEdgeFog(fx, fy) {
    const md = this._mapData;
    const fw = md.fogW, fh = md.fogH;
    const neighbors = [[-1,0],[1,0],[0,-1],[0,1]];
    return neighbors.some(([dx,dy]) => {
      const nx = fx+dx, ny = fy+dy;
      if (nx<0||nx>=fw||ny<0||ny>=fh) return false;
      return md.fog[ny*fw+nx] === 1;
    });
  },

  // ── Draw resource nodes on map (issues 61/62/63) ──────────────────────
  _drawResourceNodes(c) {
    const nodes = this._mapData?.resourceNodes;
    if (!nodes) return;
    const fog = this._mapData.fog;
    const fw = this._mapData.fogW, fh = this._mapData.fogH;
    const now = Date.now() / 1000;

    nodes.forEach(n => {
      // Only show if fog is revealed at this position
      const fx = Math.floor((n.wx / this.WORLD_W + 0.5) * fw);
      const fy = Math.floor((n.wy / this.WORLD_H + 0.5) * fh);
      const revealed = fog[fy * fw + fx] === 1;
      if (!revealed) return;

      const { sx, sy } = this._toScreen(n.wx, n.wy);
      const def = this._resourceNodeDefs.find(d => d.key === n.key);
      const depleted = !n.isPond && n.qty <= 0;

      // Node circle
      c.beginPath();
      c.arc(sx, sy, 7, 0, Math.PI * 2);
      c.fillStyle = depleted ? '#1a1a1a' : (def?.color || '#333');
      c.fill();
      c.strokeStyle = depleted ? '#333' : (n.isPond ? '#4af' : '#888');
      c.lineWidth = depleted ? 1 : 1.5;
      c.stroke();

      // Pulse ring for ponds
      if (n.isPond) {
        const pulse = 0.5 + 0.5 * Math.sin(now * 2);
        c.beginPath();
        c.arc(sx, sy, 8 + pulse * 3, 0, Math.PI * 2);
        c.strokeStyle = `rgba(60,170,255,${0.3 + pulse * 0.3})`;
        c.lineWidth = 1;
        c.stroke();
      }

      // Emoji label (small, only if not too zoomed out)
      if (this._scale > 0.05) {
        c.font = '9px serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.globalAlpha = depleted ? 0.3 : 1;
        c.fillText(depleted ? '✗' : (def?.emoji || '📦'), sx, sy);
        c.globalAlpha = 1;
      }

      // Stock indicator bar (not for ponds)
      if (!n.isPond && !depleted && this._scale > 0.07) {
        const pct = n.qty / n.maxQty;
        c.fillStyle = 'rgba(0,0,0,0.5)';
        c.fillRect(sx - 6, sy + 9, 12, 3);
        c.fillStyle = pct > 0.5 ? '#4f4' : pct > 0.25 ? '#fa0' : '#f44';
        c.fillRect(sx - 6, sy + 9, 12 * pct, 3);
      }
    });
  },

  // ── Forage / fish a resource node (called on map tap near node) ─────────
  _tryInteractNode(wx, wy) {
    const nodes = this._mapData?.resourceNodes;
    if (!nodes) return false;

    // Find nearest node within 200 world units
    let best = null, bestDist = 200;
    nodes.forEach(n => {
      const d = Math.sqrt((n.wx - wx) ** 2 + (n.wy - wy) ** 2);
      if (d < bestDist) { bestDist = d; best = n; }
    });
    if (!best) return false;

    const def = this._resourceNodeDefs.find(d => d.key === best.key);
    const depleted = !best.isPond && best.qty <= 0;

    // Show travel panel to bike there — same UX as biking to a location
    const panel  = document.getElementById('wm-travel-panel');
    const hint   = document.getElementById('wm-travel-hint');
    if (!panel) return false;

    const distUnits = Math.sqrt(best.wx ** 2 + best.wy ** 2);
    const maxDist   = 5000;
    const normDist  = Utils.clamp(distUnits / maxDist, 0, 1);
    const normalTime = Math.max(15, Math.round(normDist * 1200));
    const slowTime   = Math.round(normalTime * 1.5);
    const fastTime   = Math.round(normalTime * 0.6);

    if (hint) hint.classList.add('hidden');
    this._pendingTravel = { wx: best.wx, wy: best.wy, distUnits, nodeId: best.id };

    const statusLine = depleted
      ? `<div style="color:#e53935;font-size:0.85rem">⚠️ DEPLETED — refills over time. You can still travel to scout the area.</div>`
      : best.isPond
        ? `<div style="color:#4af;font-size:0.85rem">🎣 Cast your line and pedal hard when a fish bites!</div>`
        : `<div style="color:#4caf50;font-size:0.85rem">📦 Stock: ${best.qty} / ${best.maxQty} — bike there to collect</div>`;

    panel.innerHTML = `
      <div class="wm-panel-title">${def?.emoji || '📦'} ${best.isPond ? 'FISHING POND' : (best.key.replace(/_/g,' ').toUpperCase())}</div>
      ${statusLine}
      <div class="wm-dist-label">${Math.round(distUnits)} units from base</div>
      <div class="wm-speed-options">
        <div class="wm-speed-card slow">
          <div class="wm-speed-icon">🐌</div><div class="wm-speed-name">SLOW</div>
          <div class="wm-speed-time">~${Math.round(slowTime/60)}m ${slowTime%60}s</div>
          <div class="wm-speed-note">Risky — monsters may catch you</div>
        </div>
        <div class="wm-speed-card normal">
          <div class="wm-speed-icon">🚴</div><div class="wm-speed-name">NORMAL</div>
          <div class="wm-speed-time">~${Math.round(normalTime/60)}m ${normalTime%60}s</div>
          <div class="wm-speed-note">Safe passage</div>
        </div>
        <div class="wm-speed-card fast">
          <div class="wm-speed-icon">💨</div><div class="wm-speed-name">FAST</div>
          <div class="wm-speed-time">~${Math.round(fastTime/60)}m ${fastTime%60}s</div>
          <div class="wm-speed-note">Rare loot on encounters!</div>
        </div>
      </div>
      <div class="wm-panel-actions">
        <button class="btn-pixel btn-primary" id="btn-start-travel">🚴 BIKE THERE</button>
        <button class="btn-pixel btn-secondary" id="btn-cancel-travel">✕ CANCEL</button>
      </div>
    `;
    panel.classList.remove('hidden');
    panel.classList.add('slide-in');
    this._drawMap();

    document.getElementById('btn-start-travel').onclick =
      () => this._startTravel(best.wx, best.wy, distUnits, null, slowTime, normalTime, fastTime, best.id);
    document.getElementById('btn-cancel-travel').onclick = () => {
      this._pendingTravel = null;
      panel.classList.add('hidden');
      if (hint) hint.classList.remove('hidden');
      this._drawMap();
    };
    return true;
  },

  _forageNode(node, def) {
    const amount = 1 + Math.floor(Math.random() * 3);
    const gained = Math.min(amount, node.qty);
    node.qty -= gained;
    State.addResource(node.key, gained);
    const deplStr = node.qty <= 0 ? ' — DEPLETED!' : ` (${node.qty} left)`;
    Utils.toast(`${def?.emoji || '📦'} Collected ${gained}× ${node.key.replace(/_/g,' ')}${deplStr}`, 'good', 2500);
    this._drawMap();
    Events.emit('hud:update');
  },

  // ── FISHING minigame (issue 63) ───────────────────────────────────────
  // Phase 1 — waiting: random bite after 5-20s  
  // Phase 2 — on the line: player must pedal hard to reel in before timer expires
  _fishingNode: null,
  _fishingState: null, // 'waiting' | 'biting' | null
  _fishingTimer: null,
  _fishingBiteTimer: 0,
  _fishingReelTimer: 0,
  _fishingReelNeeded: 0,

  _startFishing(pondNode) {
    if (this._fishingState) return;
    this._fishingNode = pondNode;
    this._fishingState = 'waiting';
    this._fishingBiteTimer = 5 + Math.floor(Math.random() * 16); // 5-20s wait

    // Show fishing UI panel
    const panel = document.getElementById('wm-travel-active');
    if (panel) {
      panel.classList.remove('hidden');
      panel.innerHTML = `
        <div class="wm-fish-panel">
          <div class="wm-fish-title">🎣 FISHING — keep pedalling…</div>
          <div class="wm-fish-status" id="fish-status">🌊 Line in water… waiting for a bite…</div>
          <div class="wm-fish-bars">
            <div class="wm-fish-bar-wrap"><div class="wm-fish-bar" id="fish-bite-bar" style="width:100%;background:#1a4a6a"></div></div>
          </div>
          <button class="btn-pixel btn-secondary" id="btn-stop-fishing" style="margin-top:8px;padding:6px 14px">🚪 Stop Fishing</button>
        </div>`;
      document.getElementById('btn-stop-fishing')?.addEventListener('click', () => this._stopFishing());
    }

    clearInterval(this._fishingTimer);
    this._fishingTimer = setInterval(() => this._fishingTick(), 1000);
  },

  _fishingTick() {
    const cpm   = State.data.cadence?.clicksPerMinute ?? 0;
    const target = State.data.cadence?.targetCPM || 90;
    const ratio  = Utils.clamp(cpm / target, 0, 2);
    const statusEl  = document.getElementById('fish-status');
    const barEl     = document.getElementById('fish-bite-bar');

    if (this._fishingState === 'waiting') {
      this._fishingBiteTimer -= (0.5 + ratio * 0.5); // pedalling speeds up bite
      const pct = Utils.clamp(this._fishingBiteTimer / 20, 0, 1);
      if (barEl) { barEl.style.width = `${pct * 100}%`; barEl.style.background = '#1a4a6a'; }
      if (statusEl) statusEl.textContent = '🌊 Line in water… keep pedalling…';

      if (this._fishingBiteTimer <= 0) {
        // BITE!
        this._fishingState = 'biting';
        this._fishingReelNeeded = 6 + Math.floor(Math.random() * 6); // 6-11s to reel in
        this._fishingReelTimer = this._fishingReelNeeded;
        if (statusEl) statusEl.textContent = '🐟 FISH ON THE LINE! PEDAL HARD TO REEL IN!';
        Audio.sfx?.('ping');
        Utils.toast('🐟 FISH ON THE LINE! PEDAL FAST!', 'good', 3000);
      }
    } else if (this._fishingState === 'biting') {
      // Reel progress: fast pedalling drains timer quickly
      if (ratio >= 0.8) {
        this._fishingReelTimer -= ratio * 1.5;  // fast pedal reels in faster
      } else {
        this._fishingReelTimer -= ratio * 0.5;  // slow pedal barely reels
        this._fishingReelTimer += (1 - ratio) * 0.8; // fish fights back
      }
      this._fishingReelTimer = Math.max(0, this._fishingReelTimer);
      const pct = this._fishingReelTimer / this._fishingReelNeeded;
      if (barEl) {
        barEl.style.width = `${(1 - pct) * 100}%`;
        barEl.style.background = pct < 0.3 ? '#4f4' : pct < 0.6 ? '#fa0' : '#f44';
      }
      if (statusEl) {
        const rateStr = ratio >= 0.8 ? '💪 Reeling fast!' : ratio >= 0.4 ? '⚠️ Pedal harder!' : '🐟 Fish escaping!';
        statusEl.textContent = `🐟 ${rateStr}`;
      }

      if (this._fishingReelTimer <= 0) {
        // CAUGHT!
        const fishTypes = ['🐟 Bass','🐠 Carp','🦈 Mutant Fish','🐡 Bloatfish','🫧 Glowfish'];
        const fishName  = fishTypes[Math.floor(Math.random() * fishTypes.length)];
        State.addResource('food', 3);
        Utils.toast(`🎣 Caught a ${fishName}! +3 food`, 'good', 4000);
        this._stopFishing();
        // Reset for next cast
        setTimeout(() => this._startFishing(this._fishingNode), 2000);
      } else if (this._fishingReelTimer >= this._fishingReelNeeded) {
        // Fish got away
        Utils.toast('🐟 The fish got away! Cast again…', 'warn', 2500);
        this._fishingState = 'waiting';
        this._fishingBiteTimer = 5 + Math.floor(Math.random() * 10);
      }
    }
  },

  _stopFishing() {
    clearInterval(this._fishingTimer);
    this._fishingTimer = null;
    this._fishingState = null;
    this._fishingNode  = null;
    const panel = document.getElementById('wm-travel-active');
    if (panel) panel.classList.add('hidden');
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
    let tapStart = 0, tapX = 0, tapY = 0;
    let lastTouchX = 0, lastTouchY = 0;

    // ── Touch events (mobile) ─────────────────
    // Use touch events directly — more reliable than pointer events on mobile
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const t = e.touches[0];
      lastTouchX = t.clientX;
      lastTouchY = t.clientY;
      tapStart = Date.now(); tapX = t.clientX; tapY = t.clientY;
      if (e.touches.length === 2) {
        const t2 = e.touches[1];
        const dx = t.clientX - t2.clientX, dy = t.clientY - t2.clientY;
        lastPinchDist = Math.sqrt(dx*dx + dy*dy);
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      if (e.touches.length === 2) {
        // Pinch zoom
        const t1 = e.touches[0], t2 = e.touches[1];
        const dx = t1.clientX - t2.clientX, dy = t1.clientY - t2.clientY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (lastPinchDist > 0) {
          const ratio = dist / lastPinchDist;
          const midX = (t1.clientX + t2.clientX) / 2;
          const midY = (t1.clientY + t2.clientY) / 2;
          const rect = canvas.getBoundingClientRect();
          const sx = midX - rect.left, sy = midY - rect.top;
          const wx = sx / this._scale + this._viewX;
          const wy = sy / this._scale + this._viewY;
          this._scale = Utils.clamp(this._scale * ratio, 0.15, 0.80);
          this._viewX = wx - sx / this._scale;
          this._viewY = wy - sy / this._scale;
          this._drawMap();
        }
        lastPinchDist = dist;
        lastTouchX = (t1.clientX + t2.clientX) / 2;
        lastTouchY = (t1.clientY + t2.clientY) / 2;
      } else {
        // Single finger pan
        const t = e.touches[0];
        const ddx = t.clientX - lastTouchX;
        const ddy = t.clientY - lastTouchY;
        this._viewX -= ddx / this._scale;
        this._viewY -= ddy / this._scale;
        lastTouchX = t.clientX;
        lastTouchY = t.clientY;
        this._drawMap();
      }
    }, { passive: false });

    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      if (e.changedTouches.length > 0) {
        const t = e.changedTouches[0];
        const elapsed = Date.now() - tapStart;
        const movedX = Math.abs(t.clientX - tapX);
        const movedY = Math.abs(t.clientY - tapY);
        if (elapsed < 350 && movedX < 12 && movedY < 12 && !this._travelling) {
          const rect = canvas.getBoundingClientRect();
          this._onTap(t.clientX - rect.left, t.clientY - rect.top);
        }
      }
      lastPinchDist = 0;
    }, { passive: false });

    // ── Mouse events (desktop) ─────────────────
    let mouseDown = false, mousePrevX = 0, mousePrevY = 0;
    let mouseDownX = 0, mouseDownY = 0, mouseDownTime = 0;

    canvas.addEventListener('mousedown', e => {
      mouseDown = true;
      mousePrevX = e.clientX; mousePrevY = e.clientY;
      mouseDownX = e.clientX; mouseDownY = e.clientY;
      mouseDownTime = Date.now();
      e.preventDefault();
    });

    canvas.addEventListener('mousemove', e => {
      if (!mouseDown) return;
      const ddx = e.clientX - mousePrevX;
      const ddy = e.clientY - mousePrevY;
      this._viewX -= ddx / this._scale;
      this._viewY -= ddy / this._scale;
      mousePrevX = e.clientX;
      mousePrevY = e.clientY;
      this._drawMap();
    });

    canvas.addEventListener('mouseup', e => {
      if (!mouseDown) return;
      mouseDown = false;
      const elapsed = Date.now() - mouseDownTime;
      const movedX = Math.abs(e.clientX - mouseDownX);
      const movedY = Math.abs(e.clientY - mouseDownY);
      if (elapsed < 350 && movedX < 8 && movedY < 8 && !this._travelling) {
        const rect = canvas.getBoundingClientRect();
        this._onTap(e.clientX - rect.left, e.clientY - rect.top);
      }
    });

    canvas.addEventListener('mouseleave', () => { mouseDown = false; });

    // Mouse wheel zoom
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const wx = sx / this._scale + this._viewX;
      const wy = sy / this._scale + this._viewY;
      this._scale = Utils.clamp(this._scale * (e.deltaY > 0 ? 0.88 : 1.14), 0.15, 0.80);
      this._viewX = wx - sx / this._scale;
      this._viewY = wy - sy / this._scale;
      this._drawMap();
    }, { passive: false });
  },

  // ── Tap on map ────────────────────────────
  _onTap(sx, sy) {
    const { wx, wy } = this._toWorld(sx, sy);

    // Issue 64: clamp taps to circle world boundary
    const dist = Math.sqrt(wx*wx + wy*wy);
    if (dist > this.WORLD_R) return; // outside world circle — ignore

    const distUnits = dist;

    // Issue 72: tapping anywhere on the map starts travel to that spot.
    // Resource node interaction happens EN ROUTE (proximity check in travel tick).

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

    // Max world distance — farthest zone is ~5000 units (doubled world)
    const maxDist  = 5000;
    const normDist = Utils.clamp(distUnits / maxDist, 0, 1);

    // Travel times scale linearly with distance.
    // At normal speed, farthest zone ≈ 20 min (1200s).
    // Slow = 1.5× normal.  Fast = 0.6× normal (cycling hard cuts 40%).
    const normalTime = Math.max(30, Math.round(normDist * 1200));
    const slowTime   = Math.round(normalTime * 1.5);
    const fastTime   = Math.round(normalTime * 0.6);

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
          <div class="wm-speed-time">~${Math.round(slowTime/60)}m ${slowTime%60}s</div>
          <div class="wm-speed-note">CPM &lt; 60<br/>⚠ Monsters CATCH you<br/>You'll LOSE all loot</div>
        </div>
        <div class="wm-speed-card normal">
          <div class="wm-speed-icon">🚴</div>
          <div class="wm-speed-name">NORMAL</div>
          <div class="wm-speed-time">~${Math.round(normalTime/60)}m ${normalTime%60}s</div>
          <div class="wm-speed-note">CPM 60–100<br/>Monsters scared away<br/>Safe passage</div>
        </div>
        <div class="wm-speed-card fast">
          <div class="wm-speed-icon">💨</div>
          <div class="wm-speed-name">FAST</div>
          <div class="wm-speed-time">~${Math.round(fastTime/60)}m ${fastTime%60}s</div>
          <div class="wm-speed-note">CPM &gt; 100<br/>Defeat monsters<br/>Earn rare loot!</div>
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

    // Use onclick= (not addEventListener) so re-tapping the map replaces the handler,
    // never stacks multiple listeners that would fire with stale normalTime values.
    const _btnGo  = document.getElementById('btn-start-travel');
    const _btnCan = document.getElementById('btn-cancel-travel');
    if (_btnGo)  _btnGo.onclick  = () => this._startTravel(wx, wy, distUnits, locationId, slowTime, normalTime, fastTime, null);
    if (_btnCan) _btnCan.onclick = () => {
      this._pendingTravel = null;
      panel.classList.add('hidden');
      if (hint) hint.classList.remove('hidden');
      this._drawMap();
    };
  },

  // ── Start travel ──────────────────────────
  _startTravel(wx, wy, distUnits, locationId, slowTime, normalTime, fastTime, nodeId = null) {
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
    this._travelTarget = { wx, wy, locationId, nodeId };
    this._passedNodes  = new Set(); // reset for each new trip

    // Start Cadence
    Cadence.start();

    this._renderTravelHUD(active, slowTime, normalTime, fastTime);
    this._runTravelStep(wx, wy, locationId, slowTime, normalTime, fastTime, nodeId);
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
            <span id="travel-eta" style="color:#29b6f6;font-size:0.75rem">— ETA</span>
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
        <button class="btn-pixel btn-primary" id="btn-abort-travel" style="width:100%;margin-top:6px;padding:12px">
          ← BACK TO BASE
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
      if (State.data?.world) State.data.world.playerAway = false;
      this._roadEncounterActive = false;
      // Always reset to base position so next travel starts from home
      this._playerWX = 0; this._playerWY = 0;
      this._mapData.playerWX = 0; this._mapData.playerWY = 0;
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
    const ratio = Utils.clamp((State.data.cadence?.clicksPerMinute ?? 0) / ((State.data.world.activeRaid ? State.data.cadence?.raidTargetCPM : State.data.cadence?.targetCPM) || 90), 0, 2);
    this._travelClickBonus = (this._travelClickBonus || 0) + ratio * 0.003;
  },

  _runTravelStep(targetWX, targetWY, locationId, slowTime, normalTime, fastTime, nodeId = null) {
    // Kill any leftover timer — prevents stacked tick loops from multiple travel starts
    if (this._travelTimer) { clearTimeout(this._travelTimer); this._travelTimer = null; }

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
    const target = (State.data.world.activeRaid ? State.data.cadence?.raidTargetCPM : State.data.cadence?.targetCPM) || 90;
      const ratio  = Utils.clamp(cpm / target, 0, 2);

      // Speed calibrated so ratio=1.0 arrives in exactly normalTime seconds.
      // At ratio=1: speed = baseSpeed * (0.3 + 0.85) = baseSpeed * 1.15 = 1/normalTime
      const baseSpeed = 1 / (normalTime * 1.15);
      const _devSpeedMult = State.travelSpeedMultFn ? State.travelSpeedMultFn() : 1;
      const speed = this._roadEncounterActive ? 0 : baseSpeed * (0.3 + ratio * 0.85) * _devSpeedMult + this._travelClickBonus;
      this._travelClickBonus = 0;

      if (!this._roadEncounterActive) progress = Math.min(1, progress + speed);

      // Update player world position
      this._playerWX = startWX + (targetWX - startWX) * progress;
      this._playerWY = startWY + (targetWY - startWY) * progress;
      this._mapData.playerWX = this._playerWX;
      this._mapData.playerWY = this._playerWY;

      // Reveal a solid corridor — steps spaced close enough that circles overlap
      // Fog cell = 20 world units wide; radius 80 = 4 cells, steps every 15 units = guaranteed solid
      const pathSteps = Math.max(30, Math.ceil(totalDist / 15));
      for (let i = 0; i <= pathSteps; i++) {
        const t = (i / pathSteps) * progress;
        const rx = startWX + (targetWX - startWX) * t;
        const ry = startWY + (targetWY - startWY) * t;
        this._revealAround(rx, ry, 60);
      }

      // Redraw map (partial — just reposition, don't full rebuild)
      this._drawMap();

      // Issue 72: check if player is passing near a resource node
      if (!this._roadEncounterActive) {
        this._checkNodeProximity();
      }

      // Update travel HUD
      this._updateTravelHUD(progress, cpm, ratio, speed, normalTime);

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
        this._arriveAtDestination(locationId, nodeId);
        return;
      }

      this._travelTimer = setTimeout(tick, 1000);
    };

    this._travelTimer = setTimeout(tick, 1000);
  },

  // ── Issue 72: node proximity check during travel ─────────────────────────
  // Called every tick. Looks for any resource node within 150 world units of
  // the player's current travel position. Shows a non-blocking inline prompt.
  _checkNodeProximity() {
    const nodes = this._mapData?.resourceNodes;
    if (!nodes) return;
    if (!this._passedNodes) this._passedNodes = new Set();

    // Only show one prompt at a time — check if one is already visible
    if (document.getElementById('node-pass-prompt')) return;

    for (const node of nodes) {
      if (this._passedNodes.has(node.id)) continue;
      const d = Math.sqrt(
        (node.wx - this._playerWX) ** 2 + (node.wy - this._playerWY) ** 2
      );
      if (d < 150) {
        this._passedNodes.add(node.id); // mark so we don't re-prompt on next tick
        const def = this._resourceNodeDefs.find(r => r.key === node.key);
        this._showNodePassPrompt(node, def);
        return; // one at a time
      }
    }
  },

  // Non-blocking inline prompt that appears inside the travel HUD.
  // Player can harvest or keep going without stopping the route.
  _showNodePassPrompt(node, def) {
    const container = document.getElementById('wm-travel-active');
    if (!container) return;

    const depleted  = !node.isPond && node.qty <= 0;
    const em        = def?.emoji || '📦';
    const nm        = (def?.name || node.key.replace(/_/g,' ')).toUpperCase();

    const prompt = document.createElement('div');
    prompt.id = 'node-pass-prompt';
    prompt.style.cssText = `
      position:absolute;bottom:8px;left:8px;right:8px;
      background:rgba(10,14,8,0.97);border:1px solid #3a5a2a;
      border-radius:6px;padding:10px 12px;z-index:20;
      font-family:var(--font-pixel,monospace);
      animation:node-pass-slidein 0.25s ease-out;
    `;

    const stockLine = depleted
      ? `<span style="color:#e53935">⛔ DEPLETED</span>`
      : node.isPond
        ? `<span style="color:#4af">🎣 pond nearby</span>`
        : `<span style="color:#4caf50">${node.qty} runs left</span>`;

    prompt.innerHTML = `
      <div style="font-size:0.7rem;color:#8a9a7a;margin-bottom:6px">
        📍 PASSING: ${em} ${nm} &nbsp;${stockLine}
      </div>
      <div style="display:flex;gap:8px;">
        ${depleted
          ? `<button id="npp-skip" class="btn-pixel btn-secondary" style="flex:1;padding:7px 4px;font-size:0.65rem">→ KEEP GOING</button>`
          : `<button id="npp-harvest" class="btn-pixel btn-primary"   style="flex:1;padding:7px 4px;font-size:0.65rem">⛏ STOP &amp; HARVEST</button>
             <button id="npp-skip"    class="btn-pixel btn-secondary" style="flex:1;padding:7px 4px;font-size:0.65rem">→ KEEP GOING</button>`
        }
      </div>
      <style>
        @keyframes node-pass-slidein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
      </style>
    `;

    // Make position relative on container so absolute child positions correctly
    container.style.position = 'relative';
    container.appendChild(prompt);

    const dismiss = () => prompt.remove();

    document.getElementById('npp-harvest')?.addEventListener('click', () => {
      dismiss();
      // Stop travel cleanly — save position, don't reset to base yet
      if (this._travelTimer) { clearTimeout(this._travelTimer); this._travelTimer = null; }
      this._travelling = false;
      // Snap player to the node position
      this._playerWX = node.wx;
      this._playerWY = node.wy;
      this._mapData.playerWX = node.wx;
      this._mapData.playerWY = node.wy;
      if (node.isPond) {
        Utils.toast(`🎣 Stopped at ${em} ${nm} — starting fishing!`, 'good', 2000);
        setTimeout(() => this._startFishing(node), 400);
      } else {
        this._showNodeArrival(node, def);
      }
    });

    document.getElementById('npp-skip')?.addEventListener('click', () => {
      dismiss();
      // nothing — travel tick continues normally
    });

    // Auto-dismiss after 8 seconds if player ignores it
    setTimeout(() => { if (document.getElementById('node-pass-prompt')) dismiss(); }, 8000);
  },

  _updateTravelHUD(progress, cpm, ratio, speed, normalTime) {
    const pct = Math.round(progress * 100);
    const barEl  = document.getElementById('travel-prog-bar');
    const pctEl  = document.getElementById('travel-pct');
    const spdEl  = document.getElementById('travel-speed-label');
    const riderEl = document.getElementById('travel-rider');

    if (barEl) barEl.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;

    // ETA: remaining progress / current speed = seconds left
    const etaEl = document.getElementById('travel-eta');
    if (etaEl && speed > 0 && progress < 1) {
      const secsLeft = Math.round((1 - progress) / speed);
      const m = Math.floor(secsLeft / 60);
      const s = secsLeft % 60;
      etaEl.textContent = m > 0 ? `${m}m ${s}s left` : `${s}s left`;
      etaEl.style.color = speed > (1/(normalTime*1.15)) * 1.1 ? '#4caf50' : '#29b6f6';
    } else if (etaEl) {
      etaEl.textContent = '';
    }
    if (spdEl) {
      const label = cpm < 60 ? '🐌 SLOW — monsters may catch you!' :
                    cpm < 100 ? '🚴 NORMAL — safe speed' :
                               '💨 FAST — monsters flee!';
      spdEl.textContent = label;
      spdEl.style.color = cpm < 60 ? '#e53935' : cpm < 100 ? '#ffd600' : '#4caf50';
    }
    if (riderEl) {
      riderEl.style.animationDuration = `${Utils.lerp(0.6, 0.1, ratio)}s`;
      riderEl.textContent = this._roadEncounterActive ? '⚔️' : ratio > 1.2 ? '💨' : '🚴';
    }

    // Cadence bar updates via its own 200ms interval (started by Cadence.start())
  },

  // ── Road encounter ────────────────────────
  _triggerRoadEncounter(currentRatio) {
    // Issue 60: scale monster pool and HP by distance from base
    const dist = Math.sqrt(this._playerWX ** 2 + this._playerWY ** 2);
    const distRatio = Utils.clamp(dist / this.WORLD_R, 0, 1); // 0=base, 1=edge

    // Closer to base: only weak animals. Further: rarer and stronger.
    let animalPool;
    if (distRatio < 0.25)      animalPool = ['rat','insect','bird','boar'];
    else if (distRatio < 0.50) animalPool = ['wolf','boar','rat','zombie_dog'];
    else if (distRatio < 0.75) animalPool = ['wolf','bear','zombie_dog','mutant_hound'];
    else                        animalPool = ['bear','zombie_dog','mutant_hound','boss_mutant'];

    // Filter to only animal keys that exist in Animals.types
    const validPool = animalPool.filter(k => Animals.types[k]);
    const id = validPool[Math.floor(Math.random() * validPool.length)] || 'wolf';
    const animal = Animals.types[id];
    if (!animal) return;

    // Issue 60: distance danger multiplier (1× near base → 3× at edge)
    const dangerMult = 1 + distRatio * 2;

    this._roadEncounterActive = true;
    this._roadEncounterAnimal = animal;
    this._roadEncounterHP = (animal.baseStrength || 20) * 3 * dangerMult;
    this._roadEncounterMaxHP = this._roadEncounterHP;
    this._roadEncounterLoseTimer = 0;
    this._atkAccum = 0; // reset attack accumulator
    this._encounterGrace = 3; // 3-tick grace: lose timer frozen while cadence builds up

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

    const hpEl    = document.getElementById('road-enc-hp');
    const instrEl = document.getElementById('road-enc-instr');
    const loseEl  = document.getElementById('road-enc-lose');
    const loseSecs= document.getElementById('road-enc-lose-secs');

    // ── Constant DPS combat: dmg/sec = baseDmg * speedRatio ─────────────
    // No accumulator, no button needed. Every second of pedalling deals damage.
    // baseDmg scales with defence. speedRatio = cpm/target (1.0 at 90 CPM).
    const baseDmg = 1.0 * (1 + def / 200);  // ~1.0 dmg/sec at target CPM → ~30-45s per wolf
    const dps     = baseDmg * Math.max(0, ratio); // 0 dps at 0 CPM, scales linearly

    if (dps > 0) {
      this._roadEncounterHP = Math.max(0, this._roadEncounterHP - dps);
      this._roadEncounterLoseTimer = Math.max(0, this._roadEncounterLoseTimer - ratio * 0.5);
      const colour = ratio >= 1.1 ? '💥' : ratio >= 0.6 ? '⚔️' : '🗡️';
      if (instrEl) instrEl.textContent =
        `${colour} ${dps.toFixed(1)} dmg/s — pedal ${ratio < 1 ? 'harder' : 'faster'} for more!`;
    } else {
      // Not pedalling — lose timer advances (grace period for first 3 ticks)
      if (this._encounterGrace === undefined) this._encounterGrace = 3;
      if (this._encounterGrace > 0) { this._encounterGrace--; }
      else { this._roadEncounterLoseTimer++; }
      const maxLose = 8;
      const secsLeft = Math.max(0, maxLose - Math.floor(this._roadEncounterLoseTimer));
      if (instrEl) instrEl.textContent = `⚠️ PEDAL TO FIGHT! Monster takes loot in ${secsLeft}s!`;
    }

    const maxLose = 8;
    if (hpEl)    { hpEl.style.width = `${(this._roadEncounterHP/this._roadEncounterMaxHP)*100}%`; }
    if (loseEl)  { loseEl.style.width = `${Math.min(100,(this._roadEncounterLoseTimer/maxLose)*100)}%`; }
    if (loseSecs){ loseSecs.textContent = Math.max(0, maxLose - Math.floor(this._roadEncounterLoseTimer)); }

    // Resolution
    if (this._roadEncounterHP <= 0 || this._roadEncounterHP / this._roadEncounterMaxHP <= (animal.fleeThreshold || 0.15)) {
      this._resolveRoadEncounter('win');
    } else if (this._roadEncounterLoseTimer >= maxLose) {
      this._resolveRoadEncounter('lose');
    }
  },

  _roadEncounterClick() {
    if (!this._roadEncounterActive) return;
    const ratio = Utils.clamp((State.data.cadence?.clicksPerMinute ?? 0) / ((State.data.world.activeRaid ? State.data.cadence?.raidTargetCPM : State.data.cadence?.targetCPM) || 90), 0, 2);
    // Button click = instant bonus hit (adds to the CPM-driven auto-attack)
    const dmg = Utils.randFloat(3, 7) * Math.max(0.5, ratio);
    this._roadEncounterHP = Math.max(0, this._roadEncounterHP - dmg);
    this._roadEncounterLoseTimer = Math.max(0, this._roadEncounterLoseTimer - 0.5);
    // Boost the accumulator so next auto-attack fires sooner
    if (this._atkAccum !== undefined) this._atkAccum += 0.4;
    const hpEl = document.getElementById('road-enc-hp');
    if (hpEl && this._roadEncounterMaxHP > 0) {
      hpEl.style.width = `${(this._roadEncounterHP / this._roadEncounterMaxHP) * 100}%`;
    }
    const instrEl = document.getElementById('road-enc-instr');
    if (instrEl) instrEl.textContent = `💥 BONUS HIT! (${dmg.toFixed(1)} dmg)`;
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
  _arriveAtDestination(locationId, nodeId = null) {
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
    this._revealAround(this._playerWX, this._playerWY, 180);
    this._drawMap();

    const active = document.getElementById('wm-travel-active');
    if (active) active.classList.add('hidden');

    // ── Arrived at a resource node (bike-to-resource / bike-to-forage) ──
    if (nodeId) {
      const node = (this._mapData.resourceNodes || []).find(n => n.id === nodeId);
      const def  = node && this._resourceNodeDefs.find(d => d.key === node.key);
      if (node) {
        if (node.isPond) {
          Utils.toast(`🎣 Arrived at pond! Starting fishing…`, 'good', 2000);
          setTimeout(() => this._startFishing(node), 500);
        } else if (node.qty <= 0) {
          Utils.toast(`${def?.emoji || '📦'} ${node.key.replace(/_/g,' ')} is depleted here. Area revealed.`, 'warn', 3000);
          this._returnToBase();
        } else {
          this._showNodeArrival(node, def);
        }
      } else {
        this._returnToBase();
      }
      return;
    }

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

  // ── Arrived at resource node — harvest or keep biking ────────────────
  _showNodeArrival(node, def) {
    const screen = document.getElementById('screen-map');
    if (!screen) { this._returnToBase(); return; }

    const em      = def?.emoji || '📦';
    const nm      = (def?.name || node.key).toUpperCase();
    const depleted = node.qty <= 0;

    const overlay = document.createElement('div');
    overlay.className = 'wm-arrival-overlay';
    overlay.innerHTML = `
      <div class="wm-arrival-card">
        <div class="wm-arrival-icon">${em}</div>
        <div class="wm-arrival-name">${nm}</div>
        <div class="wm-arrival-desc">
          ${depleted
            ? '<span style="color:#e53935">⛔ DEPLETED — nothing left to harvest here</span>'
            : `Stock: <strong>${node.qty}</strong> harvest runs remaining`}
        </div>
        <div class="wm-arrival-loot" style="color:#aaa;font-size:0.8rem">
          ${depleted ? 'This node will slowly refill over time.' : '⏱ 2-minute harvest — pedal fast for more loot!'}
        </div>
        <div class="wm-arrival-actions">
          ${depleted
            ? `<button class="btn-pixel btn-secondary" id="btn-skip-node">→ KEEP BIKING</button>`
            : `<button class="btn-pixel btn-primary"   id="btn-harvest-node">⛏ HARVEST (2 min)</button>
               <button class="btn-pixel btn-secondary" id="btn-skip-node">→ KEEP BIKING</button>`}
        </div>
      </div>
    `;
    screen.appendChild(overlay);

    document.getElementById('btn-harvest-node')?.addEventListener('click', () => {
      overlay.remove();
      this._startNodeHarvest(node, def);
    });
    document.getElementById('btn-skip-node')?.addEventListener('click', () => {
      overlay.remove();
      this._returnToBase();
    });
  },

  // ── Launch a Foraging session for a resource node ─────────────────────
  // Costs 1 node stock. Speed-based loot via existing Foraging system.
  // After session ends → player is returned to base map automatically.
  _startNodeHarvest(node, def) {
    if (node.qty <= 0) {
      Utils.toast('⛔ Node depleted — nothing to harvest.', 'warn', 3000);
      this._returnToBase();
      return;
    }

    // Deduct 1 stock for this harvest run
    node.qty = Math.max(0, node.qty - 1);

    // Build a State.locations entry from the node def
    const locId = `node_${node.id}`;
    State.locations[locId] = {
      id:             locId,
      name:           def.name || node.key,
      emoji:          def.emoji || '📦',
      bgColor:        def.bgColor || '#0d0d0d',
      bgEmoji:        def.bgEmoji || '🌿🌿🌿',
      animals:        def.animals || ['rat','insect'],
      encounterChance: def.encounterChance ?? 0.15,
      loot:           def.loot || {
        common:    { resources:[node.key], weight:80 },
        rare:      { resources:[node.key, node.key], weight:18 },
        legendary: { resources:[node.key, node.key, node.key], weight:2 }
      },
      events:         [],
      uniqueMaterial: def.uniqueMaterial || { key:node.key, name:node.key, emoji:def.emoji||'📦' },
      duration:       120,   // fixed 2-minute harvest
      energyCost:     0,
    };

    // Primary resource override so _gatherTick drips the right resource
    // (_getPrimaryResource in foraging.js reads _nodePrimaryRes from State.locations)
    State.locations[locId]._nodePrimaryRes = node.key;

    const intensityCfg = { lootMult: 1.2, durationMult: 1, encounterMult: 1 };
    Foraging.start(locId, intensityCfg);

    // When foraging session ends → return to base map
    const onEnd = (e) => {
      if (e?.screen === 'foraging') return; // entering, not leaving
      Events.off('navigate', onEnd);
      setTimeout(() => {
        if (node.qty <= 0) {
          Utils.toast(`${def?.emoji || '📦'} ${def?.name || node.key} node is now depleted!`, 'warn', 3500);
        }
      }, 500);
    };
    Events.on('navigate', onEnd);
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

// Subscribe: foraging ended — reset player position back to base (0,0) on the world map
Events.on('worldmap:player:returned', () => {
  WorldMap._playerWX = 0;
  WorldMap._playerWY = 0;
  if (WorldMap._mapData) {
    WorldMap._mapData.playerWX = 0;
    WorldMap._mapData.playerWY = 0;
  }
});
