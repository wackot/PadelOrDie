# PEDAL OR DIE — Architecture Master Document
**Version 0.17 | Event-Driven Modular Architecture**
**Authoritative reference for all future development**

> This document was written from direct analysis of every source file in the project.
> Any future AI model — Claude, Gemini, Qwen, or otherwise — should read this document
> completely before making any change to the codebase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Architecture](#2-core-architecture)
3. [Event Bus System](#3-event-bus-system)
4. [State System](#4-state-system)
5. [Module System](#5-module-system)
6. [Building Module Rules](#6-building-module-rules)
7. [UI and Overlay System](#7-ui-and-overlay-system)
8. [Dependency Rules](#8-dependency-rules)
9. [Safe Extension Guidelines](#9-safe-extension-guidelines)
10. [Coding Principles](#10-coding-principles)

---

## 1. Project Overview

### What This Is

Pedal or Die is a survival browser game where the player pedals a real or simulated exercise bike to power their post-apocalyptic base. The core mechanic — pedalling — drives nearly every system in the game: it gathers resources during expeditions, speeds up construction timers, generates electricity, and determines combat performance during raids.

The game runs entirely in a browser as a single HTML page. There is no server, no bundler, no npm, no framework, no import/export system. Every module is a plain JavaScript `const` object attached to global scope. All scripts are loaded via `<script src="...">` tags in `index.html`.

### Technology Stack

- **Runtime:** Browser JavaScript (ES2020+), no transpilation
- **Rendering:** SVG for the base map and buildings; HTML/CSS for all screens
- **Storage:** `localStorage` for save data; JSON import/export for portability
- **Audio:** Web Audio API wrapped in `audio.js`
- **No dependencies:** No jQuery, no React, no libraries of any kind

### High-Level System Structure

The game has five conceptual layers that never violate one another:

```
┌─────────────────────────────────────────────────────┐
│  LAYER 5 — main.js (Orchestrator)                   │
│  Starts systems at boot. Wires DOM events once.     │
├─────────────────────────────────────────────────────┤
│  LAYER 4 — devmode.js (Debug Overlay)               │
│  Intercepts hooks. Never imported by others.        │
├─────────────────────────────────────────────────────┤
│  LAYER 3 — Domain Modules                           │
│  base.js, crafting.js, foraging.js, worldmap.js,   │
│  raids.js, power.js, dynamo_bike.js, farming.js,   │
│  achievements.js, playerstats.js, map.js            │
│  + all building/*.js files                          │
├─────────────────────────────────────────────────────┤
│  LAYER 2 — Core Systems                             │
│  cadence.js, player.js, daynight.js, animals.js    │
├─────────────────────────────────────────────────────┤
│  LAYER 1 — Foundation                               │
│  utils.js (Events bus + helpers), state.js,        │
│  upgrades.js, audio.js, save.js                    │
└─────────────────────────────────────────────────────┘
```

Lower layers never call upper layers. Upper layers call lower layers only at startup or through the Event Bus.

---

## 2. Core Architecture

### 2.1 Modular Architecture

Each JavaScript file owns exactly one domain of the game. It reads from `State.data`, writes to `State.data`, renders its own HTML, and operates without direct knowledge of most other modules. Modules are structured as plain `const` objects with methods.

Every module follows the same template:

```js
const ModuleName = {
  // Private state (prefixed with _)
  _timer: null,
  _active: false,

  // Public API
  start() { ... },
  stop() { ... },

  // Private methods (prefixed with _)
  _tick() { ... },
};

// Event subscriptions — always at the bottom of the file
Events.on('some:event', () => ModuleName.handleIt());
```

**The module inventory:**

| File | Role | Layer |
|------|------|-------|
| `utils.js` | Helpers, Events bus, `Utils.emojiMap` | 1 |
| `state.js` | All game data, State hooks, serialisation | 1 |
| `upgrades.js` | Building upgrade registry (pure data) | 1 |
| `audio.js` | Web Audio sound effects and music | 1 |
| `save.js` | localStorage save/load, import/export | 1 |
| `cadence.js` | Pedalling input, CPM measurement | 2 |
| `player.js` | Hunger/thirst/energy, eat/drink/sleep | 2 |
| `daynight.js` | Time progression, sky, raid triggers | 2 |
| `animals.js` | Animal definitions (pure data) | 2 |
| `raids.js` | Combat screen, raid logic | 3 |
| `base.js` | Base SVG, building dispatch, pan/zoom | 3 |
| `map.js` | Location data, `State.locations` alias | 3 |
| `worldmap.js` | World travel UI, procedural map | 3 |
| `foraging.js` | Expedition gameplay, encounter combat | 3 |
| `crafting.js` | Crafting UI, build timer, recipes | 3 |
| `power.js` | Generator and battery system, individual generator screens | 3 |
| `dynamo_bike.js` | Dynamo bike pedalling session, building screen, SVG art | 3 |
| `farming.js` | Crop plot system, seed management | 3 |
| `achievements.js` | Achievement tracking and display | 3 |
| `playerstats.js` | Stats dashboard, milestones | 3 |
| `buildings/*.js` | SVG art and screen data per building | 3 |
| `devmode.js` | Debug panel, State hook wiring | 4 |
| `main.js` | Game bootstrap, HUD, navigation | 5 |

### 2.2 Event-Driven Architecture

Modules communicate exclusively through the `Events` pub/sub bus rather than direct method calls. When Module A needs to tell Module B something happened, A emits a named event. B subscribes to that event at the bottom of its own file. Neither module knows the other exists.

**Why this matters:** It means you can add a new module that reacts to existing events — say, a new `analytics.js` that listens to `achievements:check` — without touching a single existing file. It also means you can remove a module without causing errors in unrelated modules.

**The pattern in practice:**

```js
// OLD way — creates tight coupling
Achievements.check();      // crafting.js must import Achievements
Raids.triggerRaid('night'); // daynight.js must import Raids

// NEW way — loose coupling through events
Events.emit('achievements:check');
Events.emit('raid:trigger', { type: 'night' });
```

The subscriber in `achievements.js` handles `achievements:check`. The subscriber in `raids.js` handles `raid:trigger`. Neither emitter knows or cares who is listening.

---

## 3. Event Bus System

### 3.1 Implementation

The Event Bus lives in `utils.js` and is a lightweight pub/sub system with three methods:

```js
const Events = {
  _handlers: {},

  // Subscribe: fn is called every time event fires
  on(event, fn) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(fn);
  },

  // Unsubscribe: remove a specific handler
  off(event, fn) {
    if (!this._handlers[event]) return;
    this._handlers[event] = this._handlers[event].filter(f => f !== fn);
  },

  // Publish: fire all subscribers, catch individual errors
  emit(event, data) {
    (this._handlers[event] || []).forEach(fn => {
      try { fn(data); } catch(e) { console.error(`[Events] ${event}:`, e); }
    });
  }
};
```

Key properties of this implementation:

- **Fire-and-forget.** `emit` returns nothing. The emitter never gets a response.
- **Error isolation.** If one subscriber throws, the others still run. The error is logged, not propagated.
- **No ordering guarantees.** Subscribers fire in the order they were registered, which is load-order. Do not write code that depends on subscriber execution order.
- **Multiple subscribers are normal.** `achievements:check`, for example, is subscribed to by `achievements.js` only, but it is *emitted* by `crafting.js`, `farming.js`, and `daynight.js`. This is correct — many emitters, one owner.
- **Available globally.** `Events` is defined before any module, so all modules can use it at load time.

### 3.2 Why the Event Bus Exists

The alternative to the Event Bus is direct module references: `Achievements.check()` called from `crafting.js`. This creates an invisible dependency graph where:

- Modules must be loaded in a specific order
- Removing or renaming a module breaks every module that referenced it
- Testing a module in isolation is impossible
- Adding a new module that reacts to an existing event requires editing the emitting file

The Event Bus breaks all of these constraints. Any module can emit events. Any module can subscribe. Neither needs to know about the other.

### 3.3 How to Subscribe

Subscriptions are always registered at the **bottom of the file that owns the reaction**, after the module's `const` declaration. This is a strict convention:

```js
// Bottom of farming.js — Farming owns the response to 'tick:dawn'
Events.on('tick:dawn', () => {
  if (typeof Farming !== 'undefined') Farming.dailyTick();
});

// Bottom of achievements.js — Achievements owns achievement checking
Events.on('achievements:check', () => {
  if (typeof Achievements !== 'undefined') Achievements.check();
});

// Bottom of raids.js — Raids owns raid triggering
Events.on('raid:trigger', ({ type }) => {
  Raids.triggerRaid(type);
});
```

The `typeof` guard is used when there is a risk the subscriber file might be loaded before the module it references. For same-file subscriptions it can be omitted.

### 3.4 How to Emit

Any module can emit any event at any time. The emitter does not need to know who, if anyone, is listening:

```js
// Correct — after updating inventory
Events.emit('hud:update');

// Correct — trigger navigation from any module
Events.emit('navigate', { screen: 'crafting' });

// Correct — signal that the SVG map needs redrawing
Events.emit('map:changed');

// Correct — fire raid from night check, player sleep, or devmode
Events.emit('raid:trigger', { type: 'night' });
```

### 3.5 Best Practices for Events

**DO:**
- Name events as `domain:verb` — e.g. `tick:dawn`, `raid:trigger`, `map:changed`
- Keep payloads as plain objects — e.g. `{ screen: 'base' }`, `{ type: 'dev' }`
- Subscribe at the bottom of the file that owns the response
- Emit instead of calling another module's methods

**DO NOT:**
- Create circular event chains — if A emits X and the handler for X emits A, you have an infinite loop
- Use events to fetch/return data — events are one-way signals, not function calls
- Emit events from constructors or module-level code (outside of functions/subscriptions)
- Pass class instances or complex objects as event payload

### 3.6 Complete Event Channel Registry

The following table documents every event currently used in the system. When adding a new event, append it to this table.

#### Routing & Lifecycle

| Event | Payload | Who emits | Who handles | Purpose |
|-------|---------|-----------|-------------|---------|
| `navigate` | `{ screen: string }` | Any module | `main.js` → `Game.goTo()` | Navigate to any screen |
| `game:boot` | — | `main.js` DOMContentLoaded | `achievements.js`, `farming.js` | Module self-init at startup |
| `game:refresh-all` | — | `save.js` after import | `main.js` → `Game.refreshAll()` | Full UI rebuild after load |
| `base:init` | — | `main.js` init sequence | `base.js` → `Base.init()` | Decouple base startup from main |

#### HUD & Rendering

| Event | Payload | Who emits | Who handles | Purpose |
|-------|---------|-----------|-------------|---------|
| `hud:update` | — | Any module that mutates player/inventory data | `main.js` → `HUD.update()` | Refresh all HUD bars and resource counts |
| `map:changed` | — | `daynight.js`, `worldmap.js`, `power.js`, `crafting.js` | `base.js` → `Base.updateNight()` | Rebuild base SVG and apply night overlay |
| `power:render` | — | `base.js`, `main.js` on navigate | `power.js` → `Power.renderPanel()` | Render the power overview panel (consumers + generator summary links) |
| `power:gen:render` | `{ key: string }` | `base.js` on generator building click | `power.js` → `Power.renderGeneratorScreen(key)` | Render individual generator building screen (`woodburner`, `coal`, `solar`) |
| `power:bat:render` | — | `base.js` on battery bank click | `power.js` → `Power.renderBatteryScreen()` | Render the battery bank building screen |
| `dynamo_bike:render` | — | `base.js` on dynamo bike building click | `dynamo_bike.js` → `DynamoBike.renderScreen()` | Render the dynamo bike pedalling screen |
| `power:dynamo:tick` | `{ watts, whThisTick }` | `dynamo_bike.js` each second during session | Any subscriber (HUD, logging) | Live watt output during a pedalling session |
| `power:dynamo:stop` | `{ totalWh }` | `dynamo_bike.js` when session ends | Any subscriber | Pedalling session ended, total energy generated |
| `worldmap:render` | — | `base.js` on map tile click, `main.js` | `worldmap.js` → `WorldMap.render()` | Render the procedural world map |

#### Crafting System

| Event | Payload | Who emits | Who handles | Purpose |
|-------|---------|-----------|-------------|---------|
| `crafting:render` | — | `base.js`, `main.js` on navigate | `crafting.js` → `Crafting.render()` | Re-render the crafting screen |
| `crafting:resume-build` | — | `main.js` after `loadGame()` | `crafting.js` → `Crafting._startBuildTimer()` | Resume interrupted build after save/load |
| `crafting:open-tab` | `{ tab: string }` | `main.js` via `data-crafting-tab` attribute | `crafting.js` → tab switch | Open a specific crafting tab programmatically |
| `crafting:upgrade-building` | `{ upgKey: string }` | `base.js` after upgrade confirmation | `crafting.js` → `Crafting._upgradeBuilding()` | Initiate a building construction |

#### Time and Tick Events

| Event | Payload | Who emits | Who handles | Purpose |
|-------|---------|-----------|-------------|---------|
| `tick:hour` | — | `daynight.js` every game-hour | `power.js` → `Power.hourlyTick()` | Advance power generation and consumption |
| `tick:dawn` | — | `daynight.js` at hour 6 | `farming.js` → `Farming.dailyTick()` | Grow crops, trigger farming production |
| `tick:dawn:power` | — | `daynight.js` at hour 6 | `power.js` → dawn pump/lights logic | Fire power-specific dawn effects |
| `daynight:skip-to-morning` | — | `player.js` after sleep | `daynight.js` → `DayNight.skipToMorning()` | Fast-forward time when sleeping |
| `daynight:apply-hour` | `{ hour: number }` | `devmode.js` when skipping days | `daynight.js` → `DayNight._applyHour()` | Re-apply visual state for given hour |

#### Player and Combat

| Event | Payload | Who emits | Who handles | Purpose |
|-------|---------|-----------|-------------|---------|
| `player:check-critical` | — | `daynight.js` every game-hour | `player.js` → `Player.checkCritical()` | Check for starvation, dehydration, exhaustion |
| `player:check-milestones` | — | `daynight.js` at dusk each day | `playerstats.js` → `PlayerStats.checkMilestones()` | Award milestone badges |
| `raid:trigger` | `{ type: string }` | `daynight.js` (night), `player.js` (after sleep), `devmode.js` (forced) | `raids.js` → `Raids.triggerRaid()` | Trigger an incoming raid |

#### World and Farming

| Event | Payload | Who emits | Who handles | Purpose |
|-------|---------|-----------|-------------|---------|
| `map:unlock` | `{ id: string }` | `foraging.js` on expedition milestone | `worldmap.js` → `WorldMap._checkUnlocks()` | Unlock a new world map location |
| `farming:open` | — | `base.js` when field tile is tapped | `farming.js` → `Farming.open()` | Open the farming screen |
| `farming:field-unlocked` | `{ level: number }` | `crafting.js` when field is upgraded | `farming.js` → `Farming._ensureState()` | Notify farming that more plots are available |
| `foraging:cap-duration` | `{ secs: number }` | `devmode.js` when instantForage is enabled | `foraging.js` → caps `_duration` | DevMode fast-foraging hook |
| `achievements:check` | — | `crafting.js`, `farming.js`, `foraging.js`, `daynight.js` | `achievements.js` → `Achievements.check()` | Re-evaluate all achievement conditions |

---

## 4. State System

### 4.1 Overview

`state.js` is the single source of truth for all game data. No module stores persistent game data on itself. Everything that needs to survive a save/load cycle lives in `State.data`. This is a strict rule with no exceptions.

`State` is a plain object, available globally. It is defined in `state.js` which loads second (after `utils.js`). All other modules may read and write `State.data` at any time.

### 4.2 State Initialisation and Loading

```js
// New game: fill State.data with defaults
State.init();

// Load game: merge saved JSON onto defaults (new fields survive old saves)
State.load(savedData);
```

`State.init()` deep-clones `State.defaults` into `State.data`. `State.load()` uses a `_deepMerge` to overlay saved data onto a fresh defaults clone. This merge pattern means adding a new field to `State.defaults` does not break existing save files — the default value is used if the field is absent from the save.

### 4.3 The Shape of State.data

```js
State.data = {

  meta: {
    version: '0.16',      // Game version string
    savedAt: null,        // ISO timestamp of last save
    newGame: true         // False after first play
  },

  player: {
    hunger: 100,          // 0–100, drops ~5 per game-hour
    thirst: 100,          // 0–100, drops ~8 per game-hour (faster)
    energy: 100,          // 0–100, drops ~3 per game-hour
    equipment: {
      weapon: null,       // Equipped item object or null
      armour: null,
      tool: null,
      light: null,
      bikeUpgrade: null
    }
  },

  base: {
    defenceRating: 10,    // Combined defence score (fence + upgrades)
    hasLight: false,      // True when bike light is crafted
    hasPower: false,      // True when powerhouse is built and active
    waterPerDraw: 5,      // Litres from one well use
    passiveFood: 0,       // Food added each dawn (greenhouse)
    passiveWater: 0,      // Water added each dawn (greenhouse + well)
    cropYield: 0,         // Farming yield multiplier
    shelterLevel: 1,      // Current shelter upgrade level
    storageCapA: 50,      // Tier A resource cap (wood, metal, food, water, cloth, rope)
    storageCapB: 0,       // Tier B cap (electronics, chemicals, gasoline, medicine)
    storageCapC: 0,       // Tier C cap (rare location materials)
    storageCapD: 0,       // Tier D cap (electrical bench parts)
    bikeLvl: 1,           // Current bike upgrade level
    bikeHasLight: false,
    bikeCargoBonus: 1.0,  // Cargo multiplier from bike upgrades
    bikeNightMult: 1.0,   // Night loot multiplier
    buildings: {
      // Every building entry: { level: number, name: string, emoji: string }
      // level 0 = not yet built/unlocked
      // level 1+ = built, upgrade level
      house:         { level: 1, name: 'Shelter',        emoji: '🏚️' },
      fridge:        { level: 1, name: 'Food Store',     emoji: '🧊' },
      well:          { level: 1, name: 'Well',           emoji: '🪣' },
      table:         { level: 1, name: 'Crafting Table', emoji: '🪚' },
      fence:         { level: 1, name: 'Defences',       emoji: '🚧' },
      storage:       { level: 1, name: 'Storage',        emoji: '🗃️' },
      bike:          { level: 1, name: 'Bike',           emoji: '🚴' },
      // Unlockable (level 0 until shelter upgrade fires)
      greenhouse:    { level: 0, name: 'Greenhouse',     emoji: '🌿' },
      field:         { level: 0, name: 'Crop Field',     emoji: '🌾' },
      powerhouse:    { level: 0, name: 'Power House',    emoji: '⚡' },
      // Power generator buildings — each is a standalone building on the base map.
      // Level mirrors State.data.power.generators[key].level.
      // upgradeGenerator() and buildBattery() in power.js keep both in sync.
      dynamo_bike:   { level: 0, name: 'Dynamo Bike',   emoji: '🚴' },   // pedal-powered generator
      woodburner:    { level: 0, name: 'Wood Burner',   emoji: '🪵' },   // burns wood/day
      coal_plant:    { level: 0, name: 'Coal Plant',    emoji: '⛏️' },   // burns coal/day
      solar_array:   { level: 0, name: 'Solar Array',   emoji: '☀️' },   // free daytime power
      battery_bank:  { level: 0, name: 'Battery Bank',  emoji: '🔋' },   // stores surplus power
      // ... (all other unlockable buildings follow same pattern)
    }
  },

  power: {
    generators: {
      bike:       { level: 0 },  // Bike Dynamo — pedal to generate
      woodburner: { level: 0 },  // Wood Burner — burns wood/day
      coal:       { level: 0 },  // Coal Plant — burns coal/day
      solar:      { level: 0 }   // Solar Array — free daytime power
    },
    battery:   { level: 0 },     // 0 = not built, 1-10 = capacity
    stored:    0,                 // Current watt-hours stored
    woodburnerFuelled: false,
    coalFuelled:       false,
    consumers: {
      lights: false, elecFence: false, waterPump: false, elecBench: false
    },
    unlockedConsumers: {
      lights: false, elecFence: false, waterPump: false, elecBench: false
    }
  },

  inventory: {
    // Tier A resources
    wood: 0, metal: 0, food: 0, water: 0, cloth: 0, rope: 0,
    // Tier B resources
    electronics: 0, chemicals: 0, gasoline: 0, medicine: 0, coal: 0, glass: 0,
    // Tier C: location-unique materials
    spores: 0, wild_seeds: 0, engine_parts: 0, scrap_wire: 0,
    circuit_board: 0, antiseptic: 0, cave_crystal: 0, military_chip: 0,
    // Farming seeds
    seeds_wheat: 3, seeds_potato: 2, seeds_carrot: 2,
    seeds_beans: 0, seeds_herb: 0, seeds_sunflower: 0,
    seeds_mushroom: 0, seeds_mutant: 0,
    // Tier D: electrical bench crafted parts
    battery_cell: 0, copper_wire: 0, steel_casing: 0, capacitor: 0, power_core: 0,
    // Crafted items
    items: []  // Array of { id, name, emoji, quantity, type }
  },

  world: {
    day: 1,
    hour: 8,
    isNight: false,
    currentScreen: 'base',        // Tracks navigation for save/restore
    unlockedLocations: ['forest'], // Location IDs visible on world map
    discoveredResources: [],
    activeRaid: false,
    raidStrength: 0,
    daysSinceLastRaid: 0,
    playerAway: false             // True while foraging or travelling (blocks raids)
  },

  activeBuild: null,
  // When a build is running:
  // { key, stateKey, newLevel, upg, secsLeft, secsTotal }

  cadence: {
    clicksPerMinute: 0,    // The live CPM — READ THIS, don't call Cadence.getCPM()
    targetCPM: 60,         // Normal activity target
    raidTargetCPM: 90,     // Target during raid combat
    clickBuffer: [],       // Recent click timestamps (managed by cadence.js)
    sessionClicks: 0
  },

  stats: {
    totalSessions: 0,
    totalClicksAllTime: 0,
    totalExpeditions: 0,
    totalResourcesGathered: 0,
    highestDay: 1,
    raidsRepelled: 0, raidsFailed: 0,
    animalsDefeated: 0, animalsFled: 0,
    totalPedalMinutes: 0,
    totalCaloriesBurned: 0,
    totalDistanceKm: 0,
    bestCPM: 0, avgCPM: 0,
    milestones: {},        // { milestone_key: dayFirstAchieved }
    totalBuilds: 0,
    totalCrafted: 0,
    // ... additional tracking fields
  },

  resourceTiers: {
    A: ['wood','metal','food','water','cloth','rope'],
    B: ['electronics','chemicals','gasoline','medicine','coal','glass'],
    C: ['spores','wild_seeds','engine_parts','scrap_wire', ...],
    D: ['battery_cell','copper_wire','steel_casing','capacitor','power_core']
  },

  meta: { version: '0.16', savedAt: null, newGame: true }
};
```

### 4.4 State Helper Methods

`State` provides helper methods that all modules should prefer over raw array manipulation:

```js
// Add a resource, respecting storage tier caps. Returns true if any was added.
State.addResource('wood', 10);

// Check quantity without side effects
State.hasResource('metal', 5);  // → boolean

// Consume resources. Returns false if insufficient (does NOT consume partial).
State.consumeResource('food', 1);  // → boolean

// Add a crafted item to inventory (handles stacking)
State.addItem({ id: 'bike_light', name: 'Bike Light', emoji: '🔦', type: 'bike' });

// Check if inventory covers a cost object
State.canAfford({ wood: 10, metal: 5 });  // → boolean

// Advance time, handle midnight rollover, update isNight flag
State.advanceTime(1);  // 1 game hour

// Get current storage cap for a resource type
State.getStorageCap('electronics');  // → number

// Path-based get/set (use sparingly — direct access is clearer)
State.get('base.buildings.well.level');  // → number
State.set('world.currentScreen', 'base');
```

### 4.5 How State Updates Propagate

State does not have automatic reactivity (no Vue, no Signals). Updates propagate through an explicit chain:

1. **Module mutates `State.data`** — e.g. `State.data.inventory.wood += 5`
2. **Module emits `hud:update`** — `Events.emit('hud:update')`
3. **`main.js` subscriber fires** — `HUD.update()` reads `State.data` and refreshes bars
4. **If SVG needs updating** — module also emits `Events.emit('map:changed')` which triggers `Base.updateNight()` to rebuild the SVG

This is the full update cycle. It is always explicit. There is no magic.

### 4.6 State Serialisation and Save Compatibility

`State.serialise()` returns a deep clone of `State.data` with `savedAt` set. Only this serialised object is ever written to `localStorage`.

`State.load(savedData)` merges the saved object *onto* a fresh clone of `State.defaults` using a deep merge. This means:

- Fields that exist in `defaults` but not in the saved data get their default values
- Fields that exist in the saved data override the defaults
- New fields added to `defaults` in a future version are automatically available after load

**When you add a new field to `State.defaults`, existing saves will still load correctly.** The new field will simply use its default value. This is the only safe save migration strategy — always define sensible defaults.

### 4.7 State Hooks — The DevMode Interception Pattern

State Hooks are function slots on the `State` object that allow `devmode.js` to intercept computations in lower-layer modules without those modules importing `DevMode`. This is the solution to a specific layering problem: `devmode.js` loads last, so no earlier module can import it.

**The three-step pattern:**

**Step 1 — Lower module declares a null slot in `state.js`:**
```js
// In state.js, as a top-level property of State:
buildSecsFn: null,
```

**Step 2 — Lower module calls the hook with a fallback:**
```js
// In crafting.js, when computing build duration:
let buildSecs = levelDef.buildSecs || Math.max(10, 10 + currentLevel * 8);
if (State.buildSecsFn) buildSecs = State.buildSecsFn(buildSecs);
// If DevMode hasn't wired the hook, buildSecs stays unchanged.
// If DevMode is active and instantBuild is on, buildSecs becomes 1.
```

**Step 3 — `devmode.js` wires the hook at load time (bottom of its file):**
```js
// In devmode.js, after all modules have loaded:
State.buildSecsFn = (real) => DevMode.buildSecs(real);
```

**All 8 currently wired State Hooks:**

| Hook on `State` | Wired by | Used by | Purpose |
|-----------------|----------|---------|---------|
| `survivalMultiplierFn` | `devmode.js` | `state.js` `tickSurvival()` | Returns 0 in noDrain/godMode |
| `buildSecsFn` | `devmode.js` | `crafting.js` `_upgradeBuilding()` | Returns 1 when instantBuild is on |
| `clickModeActiveFn` | `devmode.js` | `cadence.js` `registerClick()` | Returns true when mouse = pedal |
| `devTickFn` | `devmode.js` | `crafting.js` `_tickBuild()` | Calls `DevMode.tick()` each build second |
| `raidsBlockedFn` | `devmode.js` | `raids.js` `_maybeRaid()` | Returns true when noRaids flag is on |
| `monsterSvgFn` | `foraging.js` | `raids.js` render | Returns monster SVG art without importing Foraging |
| `forageDurationFn` | `devmode.js` | `foraging.js` `start()` | Returns 15 when instantForage is on |
| `travelSpeedMultFn` | `devmode.js` | `worldmap.js` travel tick | Returns 20 when instantTravel is on |

**The pattern for adding a new hook:**

```js
// 1. Declare in state.js:
myNewHookFn: null,

// 2. Use in the consuming module with a fallback:
const result = State.myNewHookFn ? State.myNewHookFn(rawValue) : rawValue;

// 3. Wire in devmode.js or whichever module owns the behaviour:
State.myNewHookFn = (raw) => SomeModule.interceptMethod(raw);
```

### 4.8 Rules for Reading and Modifying State

**Reading — always safe, always direct:**
```js
// Correct — direct property access
const lv = State.data.base.buildings.well.level;
const cpm = State.data.cadence.clicksPerMinute;  // NOT Cadence.getCPM()
const away = State.data.world.playerAway;         // NOT Foraging.isActive()

// Correct — use helpers for complex queries
const canBuild = State.canAfford({ wood: 10, metal: 5 });
const cap = State.getStorageCap('electronics');
```

**Writing — always through State helpers when available:**
```js
// Correct — helpers enforce storage caps
State.addResource('wood', 5);
State.consumeResource('food', 1);

// Acceptable — direct write when no helper exists
State.data.player.hunger = Utils.clamp(newHunger, 0, 100);
State.data.world.playerAway = true;

// After writing, emit to propagate the change to UI:
Events.emit('hud:update');
Events.emit('map:changed');  // Only if the SVG base needs rebuilding
```

**Never:**
```js
// Never store game data on a module object
Crafting._woodCount = 42;  // Wrong — will be lost on save/load

// Never bypass storage caps
State.data.inventory.wood += 999;  // Wrong — use State.addResource()

// Never mutate inside a render/getScreenData function
BuildingMyBuilding.getScreenData = function(s) {
  s.inventory.wood++;  // Wrong — renders must be read-only
};
```

---

## 5. Module System

### 5.1 Module Structure Rules

Every module must follow this template:

```js
// ═══════════════════════════════════════════
// PEDAL OR DIE — mymodule.js
// One-line description of what this module owns
// ═══════════════════════════════════════════

const MyModule = {

  // Private state (underscore prefix)
  _timer: null,
  _active: false,

  // Public init (called via event or main.js at startup)
  init() { ... },

  // Public API methods
  start() { ... },
  stop() { ... },
  someAction() { ... },

  // Private helpers (underscore prefix)
  _tick() { ... },
  _render() { ... },
};

// Event subscriptions — ALWAYS at the bottom, AFTER the const declaration
Events.on('some:event', () => MyModule.handleIt());
Events.on('game:boot',  () => MyModule.init());
```

**Rules:**
- One module per file
- One `const ModuleName = { }` per file
- Private members use underscore prefix `_memberName`
- Event subscriptions live at the bottom of the file
- A module never calls another module unless it is a documented functional dependency (see Section 8)

### 5.2 Adding a New Gameplay System

A new gameplay system — for example, a weather system — follows this process:

1. **Create `js/weather.js`** with the module structure above
2. **Add its state to `State.defaults`** under a new top-level key (e.g. `State.defaults.weather = { ...}`)
3. **Subscribe to relevant tick events** — `tick:dawn`, `tick:hour`, or `map:changed`
4. **Emit events** when weather changes that other systems should react to — e.g. `Events.emit('weather:changed', { type: 'rain' })`
5. **Add a `<script>` tag** to `index.html` in the correct load order (before `devmode.js`, after any dependencies)
6. **Never call the new module from existing files** — let events bridge the gap

### 5.3 Adding a New UI Module

A UI-only module (like `playerstats.js`) that renders a full screen:

1. Add a `<div id="screen-myscreen" class="screen">` to `index.html`
2. Create `js/myscreenmodule.js` with `open()` and `close()` methods
3. `open()` calls `this.render()` then `Events.emit('navigate', { screen: 'myscreen' })`
4. `close()` calls `Events.emit('navigate', { screen: this._prevScreen })`
5. Add the script tag to `index.html`
6. Wire the trigger button to call `MyScreenModule.open()` — or wire it via an event

### 5.4 Module Coupling Rules

A module may directly call another module's methods only if it is a **genuine functional dependency** — meaning the relationship is inherent to the game mechanic, not a convenience. Documented functional dependencies are:

| From | To | Reason |
|------|----|--------|
| `raids.js` | `Cadence` | Raids require pedalling — inseparable from combat |
| `foraging.js` | `Cadence` | Expeditions run on cadence — pedalling is the mechanic |
| `worldmap.js` | `Cadence` | Travel speed scales with cadence — pedalling is travel |
| `crafting.js` | `Power` | Electric recipes genuinely need live power state |
| `main.js` | `Player`, `Raids`, `DayNight`, `Base`, `SaveSystem` | Startup orchestration is main.js's role |
| `base.js` | Building modules (e.g. `BuildingWell.onOpen()`) | base.js owns the dispatch switch |

All other cross-module communication must use the Event Bus.

---

## 6. Building Module Rules

### 6.1 What a Building Module Is

Each building in the game has a corresponding module in `js/buildings/`. These modules are responsible for:

- Rendering the building's SVG art on the base map (`svg()` method)
- Providing data for the building's detail screen (`getScreenData()` method) or handling their own screen (`onOpen()` method)

Building modules do **not** manage their own upgrade logic — that belongs to `crafting.js` and `base.js`. They do not manage their own data — that belongs to `State.data.base.buildings`.

### 6.2 State Storage for Buildings

Every building must have an entry in `State.defaults.base.buildings`:

```js
// In state.js, inside State.defaults.base.buildings:
my_building: { level: 0, name: 'My Building', emoji: '🏗️' }
```

- `level: 0` means the building has not been built yet
- `level: 1` means the building is built at its initial level
- `level: N` (N > 1) means the building has been upgraded N times

The building module **never** reads or writes its own `level` outside of this path. Always read from `State.data.base.buildings.my_building.level`.

### 6.3 Upgrade Data

All upgrade data — costs, descriptions, build times, stat effects — lives in `upgrades.js` inside the `BuildingUpgrades` object:

```js
const BuildingUpgrades = {
  my_building: {
    name: 'My Building',
    icon: '🏗️',
    maxLevel: 5,
    unlockReq: 3,  // Optional: requires shelter level N to unlock upgrade UI
    stateKey: 'my_building',  // Must match State.data.base.buildings key
    levels: [
      { desc: 'Lv0 — Not built.',
        cost: { wood: 0 } },
      { desc: 'Lv1 — Basic structure. +5 defence.',
        cost: { wood: 10, metal: 5 },
        buildSecs: 30 },
      { desc: 'Lv2 — Reinforced. +12 defence.',
        cost: { wood: 20, metal: 12, rope: 4 },
        buildSecs: 60 },
      // ... up to maxLevel entries
    ]
  }
};
```

The `levels` array is indexed by current level. `levels[0]` is the cost to build from nothing to level 1. `levels[1]` is the cost to upgrade from level 1 to level 2, and so on.

**Important:** `buildSecs` is the *real* build time in seconds. When DevMode's `instantBuild` flag is on, `State.buildSecsFn` overrides this to 1 second. Your building module does not need to handle this — it is automatic.

### 6.4 The Build Timer

The build timer is entirely managed by `crafting.js`. When `_upgradeBuilding()` starts a build, it sets:

```js
State.data.activeBuild = {
  key: 'my_building',          // Building key (matches upgrades.js)
  stateKey: 'my_building',     // Buildings state key (matches State.data.base.buildings)
  newLevel: currentLevel + 1,  // Target level when complete
  secsLeft: buildSecs,         // Countdown
  secsTotal: buildSecs,        // For progress bar percentage
  upg: upgradeDef,             // Reference to the BuildingUpgrades entry
};
```

Only one build can be active at a time (`State.data.activeBuild` is either an object or `null`). The timer counts down at 1 second per real second, with a bonus based on current CPM:

```js
// Extra seconds shaved per tick based on cadence
const bonus = Math.max(0, (cpm - 60) / 10) * 0.5;
ab.secsLeft = Math.max(0, ab.secsLeft - 1 - bonus);
```

When `secsLeft` reaches zero, `crafting._completeBuild()` fires, which sets `State.data.base.buildings[stateKey].level = newLevel`, calls `_applyBuildingUpgrade()` to apply stat effects, emits `achievements:check`, `hud:update`, and `map:changed`.

**Your building module does not need to manage any of this.** The infrastructure handles it. You only need to handle the *effects* of the level change inside `_applyBuildingUpgrade()` in `crafting.js`.

### 6.5 How UI Is Triggered

When the player taps a building tile on the SVG base map, `Base._onBuildingClick(id)` fires. The dispatch is handled by `Base.goToBuilding(id)`:

```js
goToBuilding(id) {
  switch (id) {
    // Special-case buildings with complex own screens:
    case 'house':      BuildingHouse.onOpen();  break;
    case 'table':
      Events.emit('navigate', { screen: 'crafting' });
      Events.emit('crafting:render');
      break;
    // ... other special cases

    // Generic buildings use the standard screen template:
    case 'radio_tower':
    case 'rain_collector':
      this.renderBuildingScreen(id);
      Events.emit('navigate', { screen: 'bld-' + id });
      break;

    // Default: any building with a matching screen div works automatically
    default:
      if (document.getElementById('screen-bld-' + id)) {
        this.renderBuildingScreen(id);
        Events.emit('navigate', { screen: 'bld-' + id });
      }
      break;
  }
}
```

Most new buildings should use the **default path**. This means:

1. Add `<div id="screen-bld-my_building" class="screen bld-screen"><div class="bld-container" id="bld-my_building-content"></div></div>` to `index.html`
2. Register in `Base.renderBuildingScreen`'s `screenMap` object
3. The default branch handles the navigation automatically — no `switch` case needed

### 6.6 The getScreenData Contract

Buildings that use the standard template implement:

```js
BuildingMyBuilding.getScreenData = function(s) {
  // s = State.data (read-only snapshot — do NOT mutate s)
  const lv = s.base.buildings.my_building?.level || 0;

  return {
    title:     '🏗 MY BUILDING',              // Title for the screen header
    visual:    BuildingMyBuilding.svg(65, 58, lv),  // Mini SVG preview
    statsRows: `
      <div class="bsc-row">
        <span>Level</span>
        <span>${lv} / 5</span>
      </div>
      <div class="bsc-row ok">
        <span>Defence bonus</span>
        <span>+${lv * 5}</span>
      </div>
    `,
    actionBtn: ''  // Optional action button HTML, or empty string
  };
};
```

`base.js renderBuildingScreen()` then wraps this in the standard template which automatically adds the upgrade section (costs, build progress, confirm button) and the back button.

**Critical rule: `getScreenData` must be pure/read-only.** It receives `State.data` and returns HTML strings. It must never mutate `s` or call `Events.emit`. If the screen needs a button that triggers an action, the button's `onclick` should call a public method on the module.

### 6.7 SVG Art Rules

Every building module exposes an `svg(cx, cy, lv)` method:

```js
svg(cx, cy, lv = 1) {
  // cx, cy: centre coordinates on the 1000×1000 base canvas
  // lv: current level (1–maxLevel)
  // Returns: SVG string wrapped in a <g> element

  return `<g filter="url(#shadow)">
    <!-- Your SVG elements, visually scaled to reflect level lv -->
    <rect x="${cx - 20}" y="${cy - 20}" width="40" height="40" fill="#5a4a30"/>
    ${lv >= 2 ? `<rect x="${cx - 25}" y="${cy - 30}" width="50" height="10" fill="#4a3a20"/>` : ''}
  </g>`;
}
```

The SVG is composited with other buildings inside `base._buildSVG()`. The standard SVG filters available are:
- `filter="url(#shadow)"` — drop shadow (use on all buildings for depth)
- `filter="url(#glow-yellow)"` — warm glow (for power/fire elements)
- `filter="url(#glow-blue)"` — cool glow (for electric/water elements)
- `filter="url(#glow-electric)"` — electric arc effect

Buildings at level 0 render as `BuildingBuildPrompt.svg(cx, cy, 'my_building')` — a placeholder ghost that shows "build me" — handled automatically by `base._buildSVG()`.

### 6.8 Production Timers

Some buildings produce resources passively — greenhouses produce food, rain collectors produce water. These effects are applied at dawn via the `tick:dawn` event, but the *values* come from `State.data.base` properties set during `_applyBuildingUpgrade`.

The pattern:
1. Add a property to `State.defaults.base` (e.g. `passiveMyResource: 0`)
2. In `crafting._applyBuildingUpgrade()`, set that property based on new level
3. In `daynight._onDawn()` or a `tick:dawn` subscriber, read the property and call `State.addResource()`

Do not use `setInterval` inside building modules for production. Always hook into existing tick events.

---

## 7. UI and Overlay System

### 7.1 Screen Architecture

All screens are `<div id="screen-NAME" class="screen">` elements in `index.html`. Only one screen is visible at a time. The active screen has the CSS class `active`. `Utils.showScreen()` manages this:

```js
showScreen(screenId) {
  // Remove 'active' from all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  // Add 'active' to the target — note: prepends 'screen-' automatically
  document.getElementById(`screen-${screenId}`)?.classList.add('active');
}
```

**Critical:** `showScreen` prepends `screen-` to its argument. You pass the bare name, not the full ID:

```js
Utils.showScreen('crafting');   // Activates #screen-crafting   ✓
Utils.showScreen('base');       // Activates #screen-base       ✓

// Never do this:
Utils.showScreen('screen-crafting');  // Would look for #screen-screen-crafting ✗
```

All navigation goes through `Game.goTo(screenName)` in `main.js`, which calls `Utils.showScreen()`. All modules navigate by emitting `Events.emit('navigate', { screen: 'name' })`, never by calling `Game.goTo()` directly.

### 7.2 Navigation Flow

The complete navigation chain for any user action:

```
User taps building tile
  → base._onBuildingClick(id)
    → base.goToBuilding(id)
      → Events.emit('navigate', { screen: 'crafting' })
        → main.js subscriber: Game.goTo('crafting')
          → State.data.world.currentScreen = 'crafting'
          → Utils.showScreen('crafting')
          → HUD shown/hidden based on screen
          → Audio track changed if needed
          → Events.emit('map:changed') if returning to base
          → Events.emit('power:render') if navigating to power
          → HUD.update()
```

This chain means every navigation is auditable and consistent. All music, HUD visibility, and SVG rebuild logic lives in `Game.goTo()`.

### 7.3 The data-goto Attribute

HTML rendered dynamically by JS modules (building screens, stats screens, etc.) must never use `onclick="Game.goTo('base')"`. This would create a direct dependency on `Game`. Instead, use the `data-goto` attribute:

```html
<!-- In any HTML string rendered by a module: -->
<button data-goto="base">← BACK TO BASE</button>

<!-- With an optional crafting tab argument: -->
<button data-goto="crafting" data-crafting-tab="electric">Open Electric Bench</button>
```

`main.js._bindBackButtons()` sets up a delegated event listener on `document.body` that catches all `data-goto` clicks and calls `Game.goTo()` correctly. This means your module's HTML buttons work without importing anything.

### 7.4 Building Screens — The Standard Template

When `base.renderBuildingScreen(id)` renders a building screen, it uses a uniform template. The building module provides data via `getScreenData(s)`, and the template automatically renders:

- **Title** from `result.title`
- **Visual** (mini SVG) from `result.visual`
- **Stats rows** from `result.statsRows` (use class `bsc-row` for each row)
- **Action button** from `result.actionBtn` (optional)
- **Upgrade section** — auto-generated from `BuildingUpgrades[id]`
  - Shows current level pips
  - Shows next level cost and description
  - Checks `State.canAfford()` and disables button if insufficient resources
  - Handles in-progress build progress bar
  - Triggers `Base.showUpgradeConfirm()` on click
- **Back button** — auto-generated with `data-goto="base"`

The building module only needs to provide the data object. All layout, styling, upgrade logic, and navigation is handled by the template.

### 7.5 Overlays and Modals

The upgrade confirmation modal is managed entirely by `base.js`:

```js
// Show the confirm overlay
Base.showUpgradeConfirm(screenId, upgKey);

// Called by the "Yes, Build It" button:
Base.confirmUpgrade(screenId, upgKey);
  // → Events.emit('crafting:upgrade-building', { upgKey })
  // → setTimeout: Base.renderBuildingScreen(screenId)

// Close without action
Base.closeUpgradeConfirm();
```

The HTML for the modal is static in `index.html` (`id="upgrade-confirm-modal"` and `id="upgrade-confirm-backdrop"`). Its content is populated by `Base.showUpgradeConfirm()`.

Do not create new modal elements dynamically. If a new modal is needed, add its static HTML to `index.html` and manage show/hide with `Utils.show()` / `Utils.hide()`.

### 7.6 The HUD

The HUD (Heads-Up Display) is the persistent status bar visible during all in-game screens. It is managed by the `HUD` object in `main.js`:

```js
const HUD = {
  update() {
    // Reads State.data.player (hunger/thirst/energy)
    // Reads State.data.world (day, hour, isNight)
    // Reads State.data.inventory (wood, metal, gasoline, food, water)
    // Updates all bar widths and text elements directly
  }
};
```

Any module that changes player stats or inventory should emit `Events.emit('hud:update')` immediately after. This is the only way to refresh the HUD — there is no automatic polling.

### 7.7 Event-Driven UI Refresh

The pattern for refreshing any part of the UI after a state change:

| What changed | Emit this event | Effect |
|-------------|-----------------|--------|
| Player vitals (hunger/thirst/energy) | `hud:update` | HUD bars refresh |
| Inventory counts | `hud:update` | HUD resource counts refresh |
| Day/time | `hud:update` | Day counter and time display refresh |
| Buildings built/upgraded | `map:changed` | Base SVG rebuilds |
| Night/day transition | `map:changed` | Night overlay toggled, SVG rebuilds |
| Power overview panel | `power:render` | Power overview (consumers + generator list) refreshes |
| Individual generator screen | `power:gen:render` with `{ key }` | That generator's building screen refreshes |
| Battery bank screen | `power:bat:render` | Battery bank building screen refreshes |
| Dynamo bike screen | `dynamo_bike:render` | Dynamo bike pedalling screen refreshes |
| Crafting screen data | `crafting:render` | Crafting tab HTML refreshes |
| World map data | `worldmap:render` | World map renders |

### 7.8 Adding a New UI Panel

To add a new full-screen panel (like `screen-player-stats`):

1. **In `index.html`:** Add `<div id="screen-my-panel" class="screen">` with an inner content div
2. **In your module:** Implement `open()` and `close()` methods:
   ```js
   open() {
     this._prevScreen = State.data?.world?.currentScreen || 'base';
     this.render();
     Events.emit('navigate', { screen: 'my-panel' });
   },
   close() {
     Events.emit('navigate', { screen: this._prevScreen });
   }
   ```
3. **Wire the trigger:** From a HUD button or building, call `MyPanel.open()` or use a `data-goto` attribute
4. **Back button in your render:** Use `data-goto="${this._prevScreen}"` or have a button call `MyPanel.close()`

---

## 8. Dependency Rules

### 8.1 The Dependency Map

The file `dependency-map-v0.15.html` is a living document generated from static analysis of the codebase. It visualises the matrix of cross-module references. Every cell in the matrix shows how many times Module A calls something on Module B.

The map is used to:
- Identify new circular dependencies before they are committed
- Track whether the system is growing cleaner or dirtier over time
- Confirm that refactoring work has actually reduced coupling
- Provide a visual audit trail for architecture decisions

### 8.2 The Load Order Is the Dependency Order

Because there is no bundler, modules must be loaded in dependency order via `<script>` tags. The rule is: if Module A references Module B, then B's `<script>` tag must appear before A's in `index.html`.

**Current load order:**
```
audio.js → utils.js → state.js → save.js → playerstats.js
→ cadence.js → daynight.js → player.js → animals.js → raids.js
→ buildings/*.js → base.js → map.js → worldmap.js → foraging.js
→ upgrades.js → crafting.js → power.js → dynamo_bike.js → achievements.js → farming.js
→ devmode.js → main.js
```

`devmode.js` loads last (before `main.js`) because it wires State hooks that reference all previously loaded modules. `main.js` loads last because it starts game systems after all modules are defined.

### 8.3 Layering Constraints

| Layer | May directly call | Must not call |
|-------|------------------|---------------|
| Layer 1 (utils, state, upgrades, audio, save) | Only other Layer 1 | Nothing higher |
| Layer 2 (cadence, player, daynight, animals) | Layer 1 | Layers 3–5 |
| Layer 3 (domain modules) | Layers 1–2 + documented deps | Layer 4 (devmode), Layer 5 (main) |
| Layer 4 (devmode) | Layers 1–3 via hooks/events | Layer 5 (main) |
| Layer 5 (main) | All layers for startup wiring only | — |

### 8.4 Forbidden Dependency Patterns

The following patterns are explicitly forbidden regardless of how convenient they might seem:

```js
// ❌ A module calling DevMode directly
if (DevMode.flags.instantBuild) { ... }
// Use a State hook instead: State.buildSecsFn ? State.buildSecsFn(x) : x

// ❌ A module calling Game.goTo() directly (except main.js internals)
Game.goTo('base');
// Emit instead: Events.emit('navigate', { screen: 'base' })

// ❌ Two Layer-3 modules calling each other at runtime
Foraging.isActive()      // from raids.js — read State.data.world.playerAway instead
MapScreen.locations      // from foraging.js — use State.locations instead
Cadence.getCPM()         // from crafting.js — read State.data.cadence.clicksPerMinute instead

// ❌ onclick="Game.goTo(...)" in HTML strings
'<button onclick="Game.goTo(\'base\')">Back</button>'
// Use: '<button data-goto="base">Back</button>'

// ❌ Storing game state on a module object
Raids._savedHealth = 80;  // Lost on save/load
// Store in: State.data.raids.playerHealth = 80;

// ❌ A building module's getScreenData mutating state
BuildingFarm.getScreenData = function(s) {
  s.inventory.food++;  // Never mutate in a render function
};
```

### 8.5 Circular Dependency Prevention

Circular dependencies in this codebase are impossible if the layering rules are followed — lower layers cannot reference higher layers. The Event Bus is specifically designed to break cycles: if Module A needs to trigger Module B, and Module B needs to trigger Module A, both use events and there is no circular import.

The only circular *event* pattern to avoid is event-triggered events that loop:

```js
// ❌ Circular event chain
Events.on('a:happened', () => Events.emit('b:happened'));
Events.on('b:happened', () => Events.emit('a:happened'));
// This loops forever.

// ✓ Instead, use a single event with multiple subscribers:
Events.on('something:happened', () => ModuleA.react());
Events.on('something:happened', () => ModuleB.react());
```

### 8.6 Acceptable vs. Unacceptable Cross-Module References

**Acceptable (documented functional dependencies):**

| Caller | Callee | Reason |
|--------|--------|--------|
| `raids.js` | `Cadence.start/stop/registerClick` | The entire raid mechanic *is* pedalling — inseparable |
| `foraging.js` | `Cadence.start/stop/registerClick` | Expeditions run on pedalling — inseparable |
| `worldmap.js` | `Cadence.start/stop` | Travel speed is cadence-based |
| `crafting.js` | `Power.hasPowerForCrafting` | Electric recipes require live power state |
| `crafting.js` | `Power.getStoredWh` | Electric recipes consume stored power |
| `base.js` | `BuildingX.onOpen()` | base.js owns the dispatch switch |
| `main.js` | `Player.startTick`, `Raids.startChecks`, `DayNight.start` | Startup orchestration |

**Unacceptable (must be replaced with events or State reads):**

| Instead of | Use |
|------------|-----|
| `Achievements.check()` | `Events.emit('achievements:check')` |
| `HUD.update()` | `Events.emit('hud:update')` |
| `Base.updateNight()` | `Events.emit('map:changed')` |
| `Farming.open()` | `Events.emit('farming:open')` |
| `Foraging.isActive()` | `State.data.world.playerAway` |
| `Cadence.getCPM()` | `State.data.cadence.clicksPerMinute` |
| `MapScreen.locations` | `State.locations` |

---

## 9. Safe Extension Guidelines

This section is written as a direct guide for future AI developers — Claude, Gemini, Qwen, or any other model. Read every step before touching any file.

### 9.1 How to Add a New Building

Follow all nine steps in order. Skipping any step will cause silent failures.

**Step 1 — Create the building module file `js/buildings/MyBuilding.js`:**
```js
const BuildingMyBuilding = {
  id:    'my_building',
  title: 'My Building',
  desc:  'What this building does.',

  // svg(cx, cy, lv): called by base._buildSVG() to draw on the map
  svg(cx, cy, lv = 1) {
    return `<g filter="url(#shadow)">
      <rect x="${cx-20}" y="${cy-20}" width="40" height="${20 + lv * 4}" fill="#5a4a30"/>
    </g>`;
  },
};

// getScreenData(s): called by base.renderBuildingScreen() — MUST be read-only
BuildingMyBuilding.getScreenData = function(s) {
  const lv = s.base.buildings.my_building?.level || 0;
  return {
    title:     '🏗 MY BUILDING',
    visual:    BuildingMyBuilding.svg(65, 58, lv),
    statsRows: `<div class="bsc-row"><span>Level</span><span>${lv} / 5</span></div>`,
    actionBtn: ''
  };
};
```

**Step 2 — Add to `State.defaults.base.buildings` in `state.js`:**
```js
my_building: { level: 0, name: 'My Building', emoji: '🏗️' },
```

**Step 3 — Add upgrade definition to `upgrades.js`:**
```js
// Inside BuildingUpgrades:
my_building: {
  name: 'My Building', icon: '🏗️', maxLevel: 5,
  stateKey: 'my_building',
  levels: [
    { desc: 'Lv0 — Not built.', cost: { wood: 0 } },
    { desc: 'Lv1 — Basic structure.', cost: { wood: 10, metal: 5 }, buildSecs: 30 },
    { desc: 'Lv2 — Reinforced.',      cost: { wood: 20, metal: 12 }, buildSecs: 60 },
    { desc: 'Lv3 — Advanced.',        cost: { metal: 20, electronics: 4 }, buildSecs: 120 },
    { desc: 'Lv4 — Expert.',          cost: { metal: 30, electronics: 8 }, buildSecs: 200 },
    { desc: 'Lv5 — Master.',          cost: { metal: 45, electronics: 16 }, buildSecs: 300 },
  ]
},
```

**Step 4 — Register in `Base.buildings` in `base.js`:**
```js
// Inside Base.buildings = { ... }
my_building: {
  id:     'my_building',
  title:  'My Building',
  desc:   'What this building does.',
  action: 'upgrades'
},
```

**Step 5 — Register in `renderBuildingScreen`'s screenMap in `base.js`:**
```js
// Inside the screenMap object in renderBuildingScreen():
my_building: () => BuildingMyBuilding.getScreenData(s),
```

**Step 6 — Add the screen div to `index.html`:**
```html
<div id="screen-bld-my_building" class="screen bld-screen">
  <div class="bld-container" id="bld-my_building-content"></div>
</div>
```

**Step 7 — Add the `<script>` tag to `index.html` in the correct load order:**
```html
<script src="js/buildings/MyBuilding.js"></script>
<!-- Add before base.js loads -->
```

**Step 8 — Draw the SVG in `base._buildSVG()` in `base.js`:**
```js
// Read the level at the top of _buildSVG() with other level reads:
const mbLvl = State.data?.base?.buildings?.my_building?.level || 0;

// Add to the svg.innerHTML template at the correct visual z-order:
${mbLvl > 0
  ? BuildingMyBuilding.svg(myBuildingX, myBuildingY, mbLvl)
  : BuildingBuildPrompt.svg(myBuildingX, myBuildingY, 'my_building')}

// Add a hit zone:
${this._hitZone('my_building', myBuildingX, myBuildingY, 70, 70, '🏗️ MY BUILDING Lv' + mbLvl)}
```

**Step 9 — Apply stat effects in `crafting._applyBuildingUpgrade()` in `crafting.js`:**
```js
case 'my_building': {
  // Apply per-level effects to State.data.base
  const effects = [
    null, // lv0 placeholder
    { myEffect: 5 },   // lv1
    { myEffect: 12 },  // lv2
    // ...
  ];
  const eff = effects[newLevel];
  if (eff) State.data.base.myEffect = eff.myEffect;
  break;
}
```

**Step 10 — If unlocked by shelter, add to shelter's `unlocks` array in `upgrades.js`:**
```js
// Find the shelter level that should unlock it:
{ desc: 'Lv5 — ...',
  cost: { wood: 30, metal: 4, rope: 4 },
  unlocks: ['watchtower', 'workshop', 'my_building'] }  // Add here
```

### 9.2 How to Add a New Resource

**Step 1 — Add to `State.defaults.inventory` in `state.js`:**
```js
my_resource: 0,
```

**Step 2 — Assign it to a storage tier in `State.defaults.resourceTiers`:**
```js
resourceTiers: {
  A: ['wood', 'metal', 'food', 'water', 'cloth', 'rope'],
  B: ['electronics', 'chemicals', 'gasoline', 'medicine', 'coal', 'glass', 'my_resource'],
  // ...
}
```

**Step 3 — Add an emoji to `Utils.emojiMap` in `utils.js`:**
```js
Utils.emojiMap = {
  // ... existing entries ...
  my_resource: '⚗️',
};
```

**Step 4 — Add it to the `richNow` action in `devmode.js`:**
```js
const allRes = [
  'wood', 'metal', 'food', 'water', /* ... */ 'my_resource'
];
```

**Step 5 — Add as a loot drop in `foraging.js` or as a recipe ingredient in `crafting.js`** — wherever it enters the game world.

**Step 6 — Add to the HUD display in `main.js` `HUD.update()`** if it is a primary resource that should show in the top bar. If it is a secondary resource, it will appear in the crafting inventory display automatically.

### 9.3 How to Add a New Gameplay System

Example: a new "Radiation" system.

1. **Create `js/radiation.js`** with the module structure from Section 5.1
2. **Add `State.defaults.radiation = { level: 0, exposure: 0, ... }`** in `state.js`
3. **Subscribe to existing tick events** — `Events.on('tick:hour', () => Radiation.hourlyTick())`
4. **Emit new events** when radiation state changes — `Events.emit('radiation:warning', { level: 3 })`
5. **Other systems react** by subscribing to `radiation:warning` in their own files without editing `radiation.js`
6. **Add a DevMode State hook** if DevMode should be able to override radiation behaviour:
   - `State.radiationMultFn: null` in `state.js`
   - `State.radiationMultFn = () => DevMode.radiationMultiplier()` in `devmode.js`
   - `const mult = State.radiationMultFn ? State.radiationMultFn() : 1` in `radiation.js`
7. **Add `<script src="js/radiation.js"></script>`** before `devmode.js` in `index.html`

### 9.4 How to Extend the UI

To add a new panel or modify an existing one:

1. **Never edit `main.js` for screen-specific logic.** `main.js` is the orchestrator. Screen-specific rendering belongs in the module that owns that screen.
2. **Add static screen containers to `index.html`.** Do not create screen divs dynamically.
3. **Navigate with events.** Never call `Game.goTo()` from a module — emit `navigate`.
4. **Use `data-goto` for back buttons** in HTML strings. Never use `onclick="Game.goTo(...)"`.
5. **Emit `hud:update` after state changes.** The HUD never polls — it only updates when told to.
6. **Emit `map:changed` after building/visual changes.** The SVG only rebuilds on this event.
7. **Use `Utils.toast(message, type, duration)`** for in-game notifications. Never use `alert()`.

### 9.5 What to Check Before Committing Any Change

Before committing any change to the codebase, verify:

- [ ] Did I read every file I touched completely, not just the sections I changed?
- [ ] Does my new code emit `hud:update` after any change to player or inventory state?
- [ ] Does my new code emit `map:changed` after any change to buildings?
- [ ] Does my new state have a default value in `State.defaults`?
- [ ] Does my new `getScreenData` function mutate nothing?
- [ ] Are event subscriptions at the bottom of the file, after the module declaration?
- [ ] Am I using `Events.emit('navigate', ...)` instead of `Game.goTo()` directly?
- [ ] Am I using `data-goto` attributes instead of `onclick="Game.goTo(...)"` in HTML strings?
- [ ] Am I reading `State.data.cadence.clicksPerMinute` instead of calling `Cadence.getCPM()`?
- [ ] Am I reading `State.data.world.playerAway` instead of calling `Foraging.isActive()`?
- [ ] Did I add a `<script>` tag in the correct load order?
- [ ] Did I add the building to all five required locations (state, upgrades, Base.buildings, screenMap, index.html screen div)?
- [ ] If the building is a power generator: did I sync `State.data.base.buildings[key].level` inside `Power.upgradeGenerator()` or `Power.buildBattery()`?
- [ ] If the building has its own full screen (not the standard bld- template): did I add a dedicated `<div id="screen-X">` to index.html, a click handler in `Base.goToBuilding()`, and a render event subscription?

---

## 9.6 The Power System — Standalone Generator Buildings

> **Added in v0.17.** This replaces the previous design where all generators lived inside a single Power Management panel.

### Design Intent

Each power source is a **standalone building on the base map**, clickable independently. The Power House is now purely an overview panel — it shows a summary list of all generators (each row navigates to that building) plus the consumer toggles. It does not host upgrades.

### Buildings and Their Screens

| Building key | State path | Screen ID | Render method | Unlock condition |
|---|---|---|---|---|
| `powerhouse` | `base.buildings.powerhouse` | `screen-power` | `Power.renderPanel()` | Shelter Lv6 |
| `dynamo_bike` | `base.buildings.dynamo_bike` | `screen-dynamo-bike` | `DynamoBike.renderScreen()` | Shelter Lv6 (independent build) |
| `woodburner` | `base.buildings.woodburner` | `screen-gen-woodburner` | `Power.renderGeneratorScreen('woodburner')` | Power House built |
| `coal_plant` | `base.buildings.coal_plant` | `screen-gen-coal_plant` | `Power.renderGeneratorScreen('coal')` | Power House built |
| `solar_array` | `base.buildings.solar_array` | `screen-gen-solar_array` | `Power.renderGeneratorScreen('solar')` | Power House built |
| `battery_bank` | `base.buildings.battery_bank` | `screen-gen-battery_bank` | `Power.renderBatteryScreen()` | Power House built |

### Dual State Sync Rule

Each generator building has **two parallel level values** that must always match:

1. `State.data.base.buildings[buildingKey].level` — controls whether the building SVG appears on the base map and what the hit zone label shows.
2. `State.data.power.generators[generatorKey].level` — controls watt output in `Power.getGenerationRate()`.

`Power.upgradeGenerator(key)` is the **sole writer** of both. It updates `p.generators[key].level` and then immediately syncs `State.data.base.buildings[buildingKey].level`. The mapping is:

```js
// Inside Power.upgradeGenerator(key):
const buildingKey = key === 'coal' ? 'coal_plant' : key === 'solar' ? 'solar_array' : key;
State.data.base.buildings[buildingKey].level = newLevel;
```

`Power.buildBattery()` does the same for `battery_bank`. Never update one without the other.

### Navigation Pattern

When the player taps a generator building on the base map, `Base.goToBuilding(id)` emits two events:

```js
case 'woodburner':
  Events.emit('navigate', { screen: 'gen-woodburner' });
  Events.emit('power:gen:render', { key: 'woodburner' });
  break;
```

The `power:gen:render` subscription in `power.js` then calls `Power.renderGeneratorScreen(key)`. Note that `coal_plant` maps to generator key `'coal'` (the state key uses `coal`, the building key uses `coal_plant`).

### Dynamo Bike — Special Case

The dynamo bike is different from the other generators:

- It has its **own module** (`dynamo_bike.js`) rather than being rendered by `power.js`
- Its level lives in **both** `State.data.base.buildings.dynamo_bike.level` (building) and `State.data.power.generators.bike.level` (generator). `DynamoBike.build()` syncs both.
- It runs an **interactive pedalling session** (start/stop, live CPM feedback, battery fill bar) rather than a simple upgrade UI
- It emits `power:dynamo:tick` and `power:dynamo:stop` — other modules can subscribe to these without importing `DynamoBike`
- The session ends automatically after `_IDLE_CUTOFF` (3) seconds of zero pedalling

### Power House — Overview Only

`Power.renderPanel()` renders:
1. A net generation/drain summary (watts in, watts out, net, battery %)
2. A clickable list of all generator buildings (tap any row → navigate to that building's screen)
3. The consumer toggles (lights, electric fence, water pump, electric bench)

It no longer contains upgrade cards. If you need to upgrade a generator, go to that building on the map.

---

## 10. Coding Principles

### 10.1 Modularity

**Each file owns exactly one domain.** This is the foundation of the architecture. `farming.js` owns farming. `raids.js` owns raids. `daynight.js` owns time. No file reaches into another file's domain.

Ownership means:
- The module contains all the logic for its domain
- The module contains all the rendering for its domain's UI
- The module is the sole writer of its domain's portion of `State.data`
- Other modules read that state directly but never write it

When you catch yourself writing logic about farming inside `crafting.js`, stop and move it to `farming.js`. When you catch yourself rendering power UI from `base.js`, stop and emit `power:render` instead.

### 10.2 Loose Coupling

**Modules communicate through events and shared state, not through direct references.**

Tight coupling means: "Module A holds a reference to Module B and calls B.doThing()". This creates a requirement that B exists, is loaded, and has that method. Changing B breaks A.

Loose coupling means: "Module A emits `'b:do-thing'` and doesn't care if anyone is listening." Module B subscribes to that event. If B is removed, A continues to work. If B's method is renamed internally, A is unaffected.

The only direct method calls allowed between modules are the documented functional dependencies in Section 8.6. Everything else uses the Event Bus or reads State.

### 10.3 Event-Driven Updates

**The UI never polls. It only updates when events say to.**

There are no `setInterval(() => HUD.update(), ...)` calls. The HUD updates exactly when a module emits `hud:update`. The SVG rebuilds exactly when a module emits `map:changed`. The power panel renders exactly when `power:render` is emitted.

This means:
- UI is always up to date — it updates immediately after state changes
- There is no wasted CPU from polling unchanged state
- The update chain is fully auditable — find who emits `hud:update` and you know what triggers each refresh
- Adding a new reaction to a game event never requires editing the emitter

### 10.4 Centralised State

**All game data that must survive between sessions lives in `State.data`. All game data that matters to more than one module lives in `State.data`.**

No module hides game state inside its own properties. If you write `Raids._savedHealth = 80`, that value disappears on save/load. If you write `State.data.raids.playerHealth = 80`, it is saved, loaded, and accessible from any module with confidence.

This principle has an important corollary: **before reading a value in Module A, ask whether Module B might also need it.** If yes, it belongs in `State.data`, not in A's local properties. The `State.data.world.playerAway` flag exists precisely because both `raids.js` and `daynight.js` need to know whether the player is away — keeping it in `Foraging._active` would require both to import `Foraging`.

### 10.5 Explicit Over Implicit

**State changes are always explicit. UI updates are always explicit. Dependencies are always declared.**

The codebase deliberately avoids:
- Reactive/observable state that auto-updates UI when changed
- Implicit component lifecycles
- Magic auto-wiring

Every state change is a direct property assignment. Every UI update is a named method call triggered by an explicit event. Every module dependency is either visible in the load order or documented as a functional dependency.

This makes the system easier to debug: if the HUD is not updating, search for who should be emitting `hud:update`. If a building is not appearing on the map, search for who should be emitting `map:changed`. The cause is always traceable.

### 10.6 Defence Against Save Format Changes

**Always add new fields with default values. Never remove or rename existing fields.**

When a new field is added to `State.defaults`, `State.load()`'s deep merge ensures existing saves still work — the default value fills the missing field. When a field is removed, existing saves that have that field simply have an unused extra key in memory, which causes no harm.

If a field must be fundamentally restructured, a migration function is required:
```js
// In State.load():
load(savedData) {
  this.data = this._deepMerge(Utils.clone(this.defaults), savedData);
  this._migrate(); // Run after merge
},
_migrate() {
  // Example: old field 'base.raidChance' renamed to 'world.raidStrength'
  if (this.data.base.raidChance !== undefined && !this.data.world.raidStrength) {
    this.data.world.raidStrength = this.data.base.raidChance;
    delete this.data.base.raidChance;
  }
}
```

### 10.7 The DevMode Contract

**DevMode is never imported. It only wires hooks outward.**

`devmode.js` is the single module that breaks the "lower layers know nothing about higher layers" rule — but it does so in a controlled way. It loads last, reads all modules, and pushes function references into `State` hook slots. From that point on, lower modules call `State.xyzFn()` and never know that `DevMode` is on the other end.

This means:
- DevMode can be deleted entirely and the game runs without it — just without debug tools
- DevMode can be extended without touching any other file
- No module ever has `if (DevMode...)` checks — they have `if (State.hookFn...)` checks

When adding a new DevMode interception, always follow the three-step hook pattern described in Section 4.7. Never call `DevMode.anyMethod()` from outside `devmode.js`.

---

*This document reflects the codebase at version 0.17 after the full event-driven refactor across 37+ JavaScript modules, plus the power system redesign that splits each generator into a standalone base map building. The architecture described here is the result of deliberate engineering decisions made to reduce inter-module coupling from 100+ direct cross-references to a controlled set of ~22 documented functional dependencies, with all other communication flowing through the Event Bus.*

*When in doubt, ask: "Does this module need to know about that module?" If the answer is no — and it almost always is — use an event.*
