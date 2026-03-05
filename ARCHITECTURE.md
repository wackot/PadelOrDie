# 🧟 PEDAL OR DIE — Architecture & Dependency Map
> **Last updated: v11** — All buildings at 10 levels with distinct visuals

---

## 📦 Version History (AI Sessions)
| Version | Change |
|---|---|
| v0.1–v0.4 | Initial game loop, core mechanics |
| v0.5 | Visual base map, Android fixes |
| Phases 1–7 | Core systems built: state, save, player, raids, crafting, power, farming |
| Phases 8–10 | `base.js` modularisation: 3,577 → 632 lines (−82%) |
| **v11** | All buildings expanded to 10 levels; crafting maxLevels corrected |

---

## 📁 File Structure (Current)

```
PedalOrDie/
│
├── index.html                  ← Entry point; loads 36 JS + 11 CSS files
├── ARCHITECTURE.md             ← This file
│
├── css/                        (11 files, ~5,060 lines total)
│   ├── main.css          327   Global styles, pixel font, CSS vars, screen wrappers
│   ├── base.css          874   Base map, building tiles, upgrade modals, night overlay
│   ├── crafting.css      795   Crafting menu, recipe cards, ingredient pills
│   ├── world.css         573   World map, location cards, mission overlays
│   ├── achievements.css  464   Achievement toasts, gallery screen
│   ├── power.css         453   Power panel, generator slots, battery meters
│   ├── raids.css         418   Raid overlay, defence bar, attack animations
│   ├── farming.css       359   Plot grid, crop cards, harvest UI
│   ├── devmode.css       301   Dev console overlay
│   ├── foraging.css      285   Expedition screen, cadence bar, resource counters
│   └── ui.css            202   HUD vitals, inventory bar, toast notifications
│
├── js/                         (20 core files, ~9,370 lines total)
│   ├── [01] audio.js       815   Sound engine; Web Audio API; sfx + ambient tracks
│   ├── [02] utils.js           Helper functions: random, clamp, toast, timers, DOM
│   ├── [03] state.js       356   SINGLE SOURCE OF TRUTH — all game state
│   ├── [04] save.js        150   Local storage save/load; export/import JSON
│   ├── [05] playerstats.js 341   Hunger/thirst/energy tick; status effects
│   ├── [06] cadence.js         Click/cadence engine (mouse now, BT sensor later)
│   ├── [07] daynight.js    286   Day/night cycle; sleep/wake transitions
│   ├── [08] player.js      201   Player actions: eat, drink, sleep, loot
│   ├── [09] animals.js     414   18 animal types; stats, drops, behaviours
│   ├── [10] raids.js       473   Raid scheduler; night attack logic; defence calc
│   │
│   ├── [11–26] js/buildings/  ← 16 building modules
│   │
│   ├── [27] base.js        632   Base orchestrator: pan/zoom, SVG layout, screen routing
│   ├── [28] map.js         410   World map screen renderer and navigation
│   ├── [29] worldmap.js   1438   13 locations; mission definitions; unlock conditions
│   ├── [30] foraging.js   1574   Expedition engine: biking, resources, events, cadence
│   ├── [31] crafting.js   1659   42 recipes across 6 categories; upgrade system
│   ├── [32] power.js       520   Generator/battery system; power level calculations
│   ├── [33] achievements.js 613  55 achievements; tracking; notification system
│   ├── [34] farming.js     498   8 crop types; plot management; grow cycles
│   ├── [35] devmode.js     337   Dev console; cheat commands; state inspector
│   └── [36] main.js        335   Game init; screen manager; global Game object
│
└── js/buildings/               (16 files, ~3,046 lines total)
    ├── Well.js              75   Water well — 10 levels
    ├── Workbench.js        129   Workshop/crafting table + World Map Board
    ├── House.js            350   Shelter/house — 10 levels
    ├── Barn.js              47   Static decorative barn (no levels)
    ├── Storage.js          234   Storage room — 10 levels
    ├── Bike.js             156   Bike upgrade station — 10 levels
    ├── Fence.js            414   Perimeter fence — 10 levels (most complex SVG)
    ├── PowerHouse.js       127   Power House + Electric Bench — 10 levels each
    ├── RadioTower.js       203   Radio tower — 10 levels
    ├── RainCollector.js    139   Rain collector — 10 levels
    ├── SolarStation.js     159   Solar station — 10 levels
    ├── UtilityBuildings.js 357   6 buildings × 10 levels:
    │                               Watchtower, CompostBin, Smokehouse,
    │                               AlarmSystem, MedkitStation, Bunker
    ├── GroundDecor.js      194   Decorative ground elements (trees, rocks, etc)
    ├── GroundCanvas.js     232   Canvas 2D terrain painter (grass/paths/pond)
    ├── BuildPrompt.js       35   Ghost placeholder for unbuilt buildings
    └── InlineBuildings.js  195   Greenhouse + Field (10 lvls); Workshop + ElecBench screens
```

---

## 🏗 Building Registry (All 22 Buildings)

| Building | Module | Levels | Upgradeable | Screen |
|---|---|---|---|---|
| House (Shelter) | House.js | 1–10 | ✅ | house |
| Well | Well.js | 1–10 | ✅ | well |
| Fence (Perimeter) | Fence.js | 1–10 | ✅ | — |
| Storage Room | Storage.js | 1–10 | ✅ | storage |
| Greenhouse | InlineBuildings.js | 1–10 | ✅ | greenhouse |
| Crop Field | InlineBuildings.js | 1–10 | ✅ | field |
| Rain Collector | RainCollector.js | 1–10 | ✅ | rain_collector |
| Compost Bin | UtilityBuildings.js | 1–10 | ✅ | — |
| Watchtower | UtilityBuildings.js | 1–10 | ✅ | — |
| Workshop | Workbench.js | 1–10 | ✅ | crafting |
| Smokehouse | UtilityBuildings.js | 1–10 | ✅ | — |
| Radio Tower | RadioTower.js | 1–10 | ✅ | radio_tower |
| Alarm System | UtilityBuildings.js | 1–10 | ✅ | — |
| Medical Station | UtilityBuildings.js | 1–10 | ✅ | — |
| Solar Station | SolarStation.js | 1–10 | ✅ | solar_station |
| Bunker | UtilityBuildings.js | 1–10 | ✅ | — |
| Bike Upgrade | Bike.js | 1–10 | ✅ | bike |
| Power House | PowerHouse.js | 1–10 | ✅ | power |
| Electric Bench | PowerHouse.js | 0/1 (one-time craft) | ✅ | elecbench |
| Barn | Barn.js | Static prop | ⛔ | — |
| World Map Board | Workbench.js | Static prop | ⛔ | map |
| Ground / Terrain | GroundCanvas.js | Scales w/ house lv | — | — |

---

## 🔗 Dependency Graph

```
index.html
  │
  ├── audio.js              (no deps)
  ├── utils.js              (no deps)
  ├── state.js              (no deps)
  ├── save.js               ← State
  ├── playerstats.js        ← State, Utils
  ├── cadence.js            ← State, Utils
  ├── daynight.js           ← State, Utils
  ├── player.js             ← State, Utils, PlayerStats
  ├── animals.js            ← State, Utils
  ├── raids.js              ← State, Utils, Animals, Base (circular — resolved at runtime)
  │
  ├── js/buildings/         (all use State for reading, Utils for helpers)
  │   ├── Well.js           ← Game.goTo('well')
  │   ├── Workbench.js      ← Game.goTo, Crafting.render
  │   ├── House.js          ← State.data.base.buildings.house
  │   ├── Barn.js           (no deps — static prop)
  │   ├── Storage.js        ← State.data.inventory
  │   ├── Bike.js           ← State.data.base.buildings.bike
  │   ├── Fence.js          ← State.data.base.buildings.fence
  │   ├── PowerHouse.js     ← Power.hasPowerForCrafting()
  │   ├── RadioTower.js     ← State.data.world.unlockedMissions
  │   ├── RainCollector.js  ← State.data.base.passiveWater
  │   ├── SolarStation.js   ← State.data.base.solarBoost
  │   ├── UtilityBuildings.js ← State.data.base.*
  │   ├── GroundDecor.js    (no runtime deps)
  │   ├── GroundCanvas.js   (no runtime deps — Canvas 2D)
  │   ├── BuildPrompt.js    (no runtime deps)
  │   └── InlineBuildings.js ← State.data.farming.plots
  │
  ├── base.js               ← State, Utils, ALL Building* modules
  ├── map.js                ← State, Utils, WorldMap
  ├── worldmap.js           ← State, Utils, Map
  ├── foraging.js           ← State, Utils, Cadence, Player, Animals, Audio
  ├── crafting.js           ← State, Utils, Power, Base
  ├── power.js              ← State, Utils
  ├── achievements.js       ← State, Utils
  ├── farming.js            ← State, Utils
  ├── devmode.js            ← State, Utils, * (all systems for console commands)
  └── main.js               ← ALL modules (orchestrator)
```

---

## 🌍 World Locations (13)

| ID | Name | Unlock Condition |
|---|---|---|
| forest | FOREST | Start |
| abandoned_farm | ABANDONED FARM | Day 3 |
| gas_station | GAS STATION | House Lv 2 |
| city_ruins | CITY RUINS | House Lv 3 |
| junkyard | JUNKYARD | House Lv 4 |
| hospital | HOSPITAL | House Lv 5 |
| cave | DEEP CAVE | House Lv 6 |
| military_base | MILITARY BASE | House Lv 7 |
| signal_drop | SIGNAL DROP | Radio Tower Lv 5 |
| rescue_beacon | RESCUE BEACON | Radio Tower Lv 8 |
| black_market | BLACK MARKET | Special mission |
| command_bunker | COMMAND BUNKER | Late game |
| endgame_transmission | THE TRANSMISSION | Endgame |

---

## ⚗️ Crafting System

**42 recipes across 6 categories:**

| Category | Purpose |
|---|---|
| `base` | Buildings, one-time unlocks (Electric Bench, etc.) |
| `defence` | Weapons, armour, traps |
| `bike` | Bike parts, motors, cadence upgrades |
| `food` | Preserves, rations, medicines |
| `electric` | Batteries, circuits, electronic components |
| `unique` | Special / endgame items |

**18 upgradeable buildings** — all `maxLevel: 10` as of v11.

---

## 🐾 Animals (18)

```
Tier 1 (Forest/Farm):    Mutated Wolf, Wild Boar, Giant Rat, Giant Insect
Tier 2 (City/Junk):      Mutated Bear, Mutated Bird, Zombie Hound, Tick Swarm
Tier 3 (Hospital/Cave):  Venom Serpent, Acid Scorpion, Mutant Crab, Acid Blob
Tier 4 (Military):       Shadow Phantom, Scrap Golem, Sewer Hydra, Cyber Wraith
Boss:                    APEX TITAN, ??? UNKNOWN
```

---

## 🌱 Farming (8 Crops)

```
Wild Wheat, Mutant Potato, Orange Root, Climbing Beans,
Medicinal Herb, Giant Sunflower, Cave Shroom, MUTANT CROP
```

---

## 🔋 Power System

- **Power House** (Lv 1–10) manages the base electrical grid
- Generators installed at Power House provide wattage
- **Electric Bench** (one-time craft) unlocks electrical crafting
- Power-gated recipes: Electric Bike Motor, Electric Fence Zap, Electric Water Pump, all `electric` category items
- Solar Station provides passive generation; night power boost at higher levels

---

## 🏆 Achievements (55)

| Group | Examples |
|---|---|
| Survival | alive_3, alive_7, alive_30, alive_100, alive_365 |
| Nutrition | never_starved, full_vitals |
| Expedition | km_1, km_10, km_50, km_100, km_500 |
| Cadence | cpm_60, cpm_90 + more |
| Building / Crafting / Raids / Special | ~45 additional |

---

## 🗂 Central State Shape (`state.js`)

```javascript
State.data = {
  player: {
    hunger, thirst, energy,       // 0–100 vitals
    health, maxHealth,
    equipment: {},                 // worn items
    statusEffects: []
  },
  base: {
    defenceRating,
    buildings: {                   // each: { level: 0–10 }
      house, well, fence, storage,
      greenhouse, field, rain_collector,
      compost_bin, watchtower, workshop,
      smokehouse, radio_tower, alarm_system,
      medkit_station, solar_station, bunker,
      bike, powerhouse, elecbench
    },
    passiveWater, passiveFood,
    raidChanceReduction, raidDamageReduction,
    raidWarningBonus, radioSignalRange,
    solarBoost, solarNightPower,
    craftCostMult, bikeEfficiency,
    medEfficiency, waterNeverEmpty
  },
  power: {
    generators: [],               // installed generator slots
    batteryLevel, maxBattery,
    wattsUsed, wattsAvailable
  },
  inventory: {
    water, food, wood, metal,
    gasoline, medicine, cloth,
    electronics, rope, chemicals,
    circuit_board, battery_cell,
    items: []                      // crafted items array
  },
  resourceTiers: {},               // per-location tier unlock state
  worldMapData: {},                // location progress, mission states
  world: {
    day, isNight, hour,
    unlockedLocations: [],
    unlockedMissions: [],
    currentScreen
  },
  activeBuild: null,
  cadence: {
    clicksPerMinute, targetCPM,
    raidTargetCPM, sessionClicks
  },
  stats: {                         // lifetime counters (achievements)
    totalKm, totalClicks, totalDays,
    totalRaids, totalCrafts, ...
  },
  meta: { version, saveDate, playTime }
}
```

---

## 🔧 base.js — Post-Modularisation (v8–v10)

```
Before:  3,577 lines — monolithic, all building SVG inline
After:     632 lines — pure orchestration

base.js contains:
  init()                ← Bootstrap, registry lookup
  _renderBase()         ← Calls GroundCanvas.draw() + _buildSVG()
  _initPanZoom()        ← Touch/mouse drag + pinch-zoom handlers
  _applyTransform()     ← CSS transform helper
  _buildSVG()           ← Calls all Building*.svg() to compose compound SVG
  _hitZone()            ← Invisible tap target generator
  _onBuildingClick()    ← Dispatch to goToBuilding()
  goToBuilding()        ← Route to correct screen
  renderBuildingScreen()← Screen dispatcher (calls Building*.getScreenData())
  showUpgradeConfirm()  ← Upgrade modal trigger
  confirmUpgrade()      ← Apply upgrade, deduct resources
  updateNight()         ← Night overlay toggle
  _startScreenRefresh() ← Auto-refresh timer
```

Each building module owns:
- `svg(cx, cy, lv)` → SVG string (10 visually distinct stages)
- `getScreenData(state)` → `{ title, visual, statsRows, actionBtn }`
- `onOpen()` → navigation (where applicable)

---

## 🚦 Boot Sequence

```
main.js → Game.init()
  → State.load()            restore save or init defaults
  → Base.init()             render compound map SVG
  → PlayerStats.startTick() hunger/thirst/energy ticking
  → DayNight.start()        day/night cycle running
  → Achievements.check()    check on-load achievements
  → goTo('base')            show home screen
```

---

## ✅ Complete (v11)

- [x] Full game loop: base → forage → craft → sleep → raid → repeat
- [x] 13 world locations with unlock progression
- [x] 18 animal types across 4 tiers + 2 bosses
- [x] 42 crafting recipes across 6 categories
- [x] **All 18 upgradeable buildings: Lv 1–10, visually distinct at every level**
- [x] **All crafting maxLevel caps correctly set to 10**
- [x] Power grid (generators + batteries + power-gated recipes)
- [x] 8-crop farming with plot management
- [x] 55 achievements
- [x] Full day/night cycle
- [x] Raid system with defence rating
- [x] Player vitals (hunger, thirst, energy, health)
- [x] Save/load (local storage + export/import JSON)
- [x] Dev mode console
- [x] base.js modularised (82% reduction)
- [x] Pure SVG rendering — zero external image assets required

## 🔲 Future Work

- [ ] Audio — `audio.js` (815 lines) exists but sound events not fully wired
- [ ] Bluetooth cadence sensor (`cadence.js` is stubbed and ready)
- [ ] Google Drive cloud save (hooks exist in `save.js`, not implemented)
- [ ] Endgame sequence (`endgame_transmission` location exists, logic TBD)
- [ ] Black Market / Command Bunker full content
- [ ] Boss encounters (APEX TITAN, ??? UNKNOWN) fully scripted
- [ ] Android WebView performance tuning (touch latency)
- [ ] Equipment system (state exists, not fully UI-wired)
- [ ] Status effects (array exists in state, partial implementation)
