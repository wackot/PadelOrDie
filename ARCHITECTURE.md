# PEDAL OR DIE — Architecture Master Document
**Version 0.31 | Event-Driven Modular Architecture**
**Authoritative reference for all future development**

> Any AI model reading this must read it completely before making any change to the codebase.

---

## Recent Changes (v0.28 → v0.31)

### v0.31
- **Issue 11 — World scenery:** `SceneryCanvas.js` (new module) draws a 2200×2200 world layer behind the base. Shows dense forest, distant mountains, abandoned road, ruins, wrecked vehicles. Loaded before `GroundCanvas.js`. CSS: `#scenery-canvas` positioned at `top:-350px; left:-350px`. Called from `base.js` alongside `BuildingGroundCanvas.draw()`.
- **Issue 13 — Building spread:** All building X/Y positions in `base.js._buildSVG()` updated to use the full ±0.44 fw/fh range. Buildings now clearly occupy different quadrants.
- **Issue 15 — Back button bug:** `worldmap.js` back button handler had a broken no-op `State.data.world.playerAway = (State.data.world.playerAway)`. Fixed to `= false`.
- **Issue 16 — Raid loot:** On victory, `raids.js._endRaid()` now calls `Animals.rollDrops(animal.id)` and applies loot via `State.addResource()`. Result overlay shows loot. `.raid-result-loot` CSS class added to `raids.css`.

### v0.30
- Base ground 1500×1500. Canvas, SVG, pan/zoom all at 1500. `#base-world-inner`, `#base-canvas`, `#base-svg` all 1500px CSS.
- Phantom dynamo idle power fixed: `if (ratio > 0)` instead of `Math.max(0.2, ratio)`.

### v0.29
- `_hitZone()` uses `data-label` only — no `aria-label` (prevented browser native tooltip).

### v0.28
- `BuildingHouse.svg(cx, cy, level, isNight, lightsOn)` — windows glow yellow when lights on + powered.
- Electric fence: Fence Lv9 `elecFenceBoost: true` in upgrades.js, `Power.unlockConsumer('elecFence')` in crafting.js.

### v0.31 (lighting, elecbench, power, sleep)
- `BuildingLights.js` (new): SVG lamp posts unlock from Shelter Lv2→10 (2–18 lamps). Ground glow via `BuildingLights.drawGlowPools()` in `GroundCanvas.js`. `toggleConsumer('lights')` emits `map:changed`.
- `GroundCanvas` `cx/cy` corrected to 750,750 (was 500,500, wrong after 1500px resize).
- **Electric bench moved from crafting recipe to building:** `elecbench` entry added to `BuildingUpgrades` (upgrades.js). `elec_bench` craft recipe removed from `crafting.js`. Effect applied via `_applyBuildingUpgrade('elecbench', 1)` → `Power.unlockConsumer('elecBench')`.
- **Power panel live refresh:** `power:render` event now starts a 1s `setInterval` (`Power._panelRefreshTimer`) that stops when `#screen-power` is hidden.
- **Sleep power drain:** `DayNight.skipToMorning()` calculates hours skipped and calls `Power._calcDrain()` to drain battery for missed hours.

---

## 1. Project Overview

Pedal or Die is a survival browser game. Player pedals to power their post-apocalyptic base. No server, no bundler, no npm, no framework. Every module is a plain JS `const` object in global scope. Scripts loaded via `<script>` tags in `index.html`.

**Tech stack:** Browser JS (ES2020+), SVG rendering, Canvas 2D, `localStorage` saves, Web Audio API.

---

## 2. Core Architecture

### Load Order (critical — never reorder)

```
utils.js → state.js → save.js → audio.js → upgrades.js →
cadence.js → player.js → daynight.js → animals.js →
SceneryCanvas.js → GroundCanvas.js → Lights.js → BuildPrompt.js →
InlineBuildings.js → dynamo_bike.js → [other buildings/*.js] →
base.js → power.js → achievements.js → ... → devmode.js → main.js
```

### Boot Sequence (critical order)

```js
// main.js Game.init():
State.init();          // MUST be first — before _fakeLoad and before game:boot
Utils.showScreen('loading');
this._fakeLoad(() => {
  SaveSystem.initUI();
  Events.emit('base:init');
});
// Then bottom of DOMContentLoaded:
Events.emit('game:boot'); // State.data is ready
```

`State.init()` MUST run before `Events.emit('game:boot')`. Any module subscribing to `game:boot` that immediately accesses `State.data` will get undefined if State hasn't initialised.

### Module Table

| File | Role | Layer |
|------|------|-------|
| `utils.js` | Helpers, Events bus | 1 |
| `state.js` | All game data, serialisation | 1 |
| `upgrades.js` | BuildingUpgrades registry (pure data) | 1 |
| `audio.js` | Web Audio sounds and music | 1 |
| `save.js` | localStorage save/load/import/export | 1 |
| `cadence.js` | Pedalling input, CPM measurement | 2 |
| `player.js` | Hunger/thirst/energy, eat/drink/sleep | 2 |
| `daynight.js` | Time, sky, raid triggers, skipToMorning | 2 |
| `animals.js` | Animal definitions + `rollDrops()` | 2 |
| `raids.js` | Combat screen, loot on victory | 3 |
| `base.js` | Base SVG, pan/zoom, building dispatch | 3 |
| `worldmap.js` | World travel UI, procedural map | 3 |
| `foraging.js` | Expedition gameplay, encounter combat | 3 |
| `crafting.js` | Crafting UI, build timer, `_upgradeBuilding` | 3 |
| `power.js` | Generator/battery/consumer system | 3 |
| `buildings/SceneryCanvas.js` | World scenery drawn on 2200×2200 canvas | 3 |
| `buildings/GroundCanvas.js` | Base terrain on 1500×1500 canvas | 3 |
| `buildings/Lights.js` | Lamp posts progressive Lv2–10, glow pools | 3 |
| `buildings/dynamo_bike.js` | Dynamo bike pedalling session + SVG | 3 |
| `buildings/*.js` | SVG art and screen data per building | 3 |
| `devmode.js` | Debug panel, State hook wiring | 4 |
| `main.js` | Game bootstrap, HUD, navigation | 5 |

---

## 3. Event Bus

Lives ONLY in `utils.js`. The `events.js` file's `<script>` tag was PERMANENTLY REMOVED from `index.html` — never re-add it (causes duplicate `const Events` parse error).

### All Active Events

| Event | Emitter | Subscribers |
|-------|---------|-------------|
| `game:boot` | `main.js` | `base.js`, `power.js`, others |
| `tick:hour` | `daynight.js` | `power.js` (drain/charge) |
| `tick:dawn:power` | `daynight.js` | `power.js` (pump, grow lights) |
| `map:changed` | multiple | `base.js` (rebuilds SVG+canvas) |
| `hud:update` | multiple | `main.js` HUD.update() |
| `navigate` | multiple | `main.js` Game.goTo() |
| `power:render` | `base.js`, `main.js` | `power.js` renderPanel + start live refresh timer |
| `power:gen:render` | `main.js` | `power.js` renderGeneratorScreen |
| `power:bat:render` | `main.js` | `power.js` renderBatteryScreen |
| `power:dynamo:tick` | `dynamo_bike.js` | — |
| `power:dynamo:stop` | `dynamo_bike.js` | — |
| `raid:trigger` | `daynight.js` | `raids.js` triggerRaid |
| `achievements:check` | multiple | `achievements.js` |
| `crafting:upgrade-building` | `base.js` | `crafting.js` _upgradeBuilding |
| `player:check-critical` | `daynight.js` | `player.js` |
| `daynight:skip-to-morning` | `player.js` | `daynight.js` skipToMorning |
| `worldmap:render` | `base.js` | `worldmap.js` render() |
| `worldmap:player:returned` | `foraging.js` | `worldmap.js` resets _playerWX/WY |
| `base:init` | `main.js` | `base.js` init() |

---

## 4. State System

All game data lives in `State.data`. No module hides state in its own properties if that state must survive save/load or is shared between modules.

### Key State Paths

```js
State.data.base.buildings[key].level   // building level on map
State.data.power.generators.bike.level  // dynamo generator level
State.data.power.consumers             // { lights, elecFence, waterPump, elecBench }
State.data.power.stored                // current Wh in battery
State.data.world.hour                  // 0–23
State.data.world.isNight               // bool
State.data.world.playerAway            // bool — set false when returning from map/foraging
State.data.cadence.clicksPerMinute     // live CPM
```

### Dual State Sync (generators)

Each generator has two parallel level values that must always match:
1. `State.data.base.buildings[buildingKey].level` — SVG visibility
2. `State.data.power.generators[generatorKey].level` — watt output

`Power.upgradeGenerator(key)` is the **sole writer** of both. Never update one without the other.

---

## 5. Building System

### Building Click → Screen Navigation

`Base._onBuildingClick(id)` dispatches to `Base.goToBuilding(id)` which emits navigate + render events. Pattern:
```js
case 'powerhouse':
  Events.emit('navigate', { screen: 'power' });
  Events.emit('power:render');
  break;
```

### Electric Bench (as of v0.31)

**Not a craft recipe.** Built via `BuildingUpgrades.elecbench` in `upgrades.js` (requires Shelter Lv8). Effect applied in `Crafting._applyBuildingUpgrade('elecbench', 1)` → `Power.unlockConsumer('elecBench')`. State: `State.data.base.buildings.elecbench.level`.

### Lamp Posts (BuildingLights)

Progressive unlock from Shelter Lv2 to Lv10 (2 to 18 lamps). SVG rendered in `_buildSVG()` before hit zones. Ground glow rendered in `GroundCanvas` when `lights` consumer is on and powered. Toggling lights fires `map:changed`.

### Lamp Position System

`BuildingLights.getLampPositions(hLvl, cx, cy, fw, fh)` returns array of `{x, y, id}`. Ids starting with `'ep'` are grand entrance pillars. Used by both SVG render and Canvas glow pool render.

---

## 6. Canvas Layers

Three canvas layers in `#base-world-inner`, bottom to top:

1. `#scenery-canvas` (2200×2200, CSS `top:-350px; left:-350px`) — outer world scenery
2. `#base-canvas` (1500×1500) — base terrain (GroundCanvas)
3. `#base-svg` (1500×1500) — buildings and hit zones (SVG)

`SceneryCanvas.BASE_OFF = 350` — offset at which the base fence starts within the scenery canvas coordinates.

The base world coordinate system: `cx = cy = 750` (centre), fence pad = 60px, fw = fh = 1380px.

---

## 7. Power System

### Generation Rates (`Power._genOutput`)

| Generator | Base Rate | Notes |
|-----------|-----------|-------|
| `bike` | 2.0W | × level × CPM ratio (0–2). **Only generates when ratio > 0** (no idle floor). |
| `woodburner` | 3.5W | × level, only when `woodburnerFuelled = true` |
| `coal` | 5.0W | × level, only when `coalFuelled = true` |
| `solar` | 4.5W | × level × `_solarMultiplier(hour)`. Zero at night. |

### Sleep Power Drain

`DayNight.skipToMorning()` calculates `hoursSkipped = prevHour < 8 ? (24 - prevHour) + 8 : prevHour - 8` and calls `Power._calcDrain(consumers)` to drain battery for missed hours.

### Live Panel Refresh

`power:render` starts `Power._panelRefreshTimer` — a 1s `setInterval` that calls `renderPanel()` while `#screen-power` is visible. Auto-clears when screen is hidden.

### Consumer Drain (per hour)

| Consumer | Drain |
|----------|-------|
| `lights` | 0.5 Wh/hr |
| `elecFence` | 1.0 Wh/hr |
| `waterPump` | 0.8 Wh/hr |
| `elecBench` | 1.2 Wh/hr |

---

## 8. Raid System (v0.31)

### Victory Loot

On raid victory, `Raids._endRaid(true)` calls:
```js
const loot = Animals.rollDrops(this._currentAnimal.id);
Object.entries(loot).forEach(([res, amt]) => State.addResource(res, amt));
```
Then shows loot in result overlay with `.raid-result-loot` CSS class (defined in `raids.css`).

### Animal Drop Tables

Each animal in `animals.js` has a `drops` array:
```js
drops: [
  { resource: 'rope', amount: [1, 2], chance: 0.6 },
  { resource: 'cloth', amount: [1, 2], chance: 0.4 }
]
```
`Animals.rollDrops(id)` rolls each drop and returns a `{ resource: amount }` map.

---

## 9. Critical Known-Good Rules

| Rule | Detail |
|------|--------|
| `events.js` tag | NEVER re-add to `index.html` — causes duplicate `const Events` |
| `State.init()` order | Must run before `_fakeLoad` and before `game:boot` |
| `dynamo_bike.js` path | Only at `js/buildings/dynamo_bike.js` — root-level copy must not exist |
| Solar screen ID | `gen-solar_array` not `gen-solar`. Use explicit mapping in `renderGeneratorScreen()` |
| WorldMap canvas | Use `requestAnimationFrame` + `ResizeObserver` pattern for sizing |
| `aria-label` on SVG `<g>` | Never use — causes browser native tooltip. Use `data-label` |
| ZIP output | Always zip directly to `/mnt/user-data/outputs/PadelOrDie-vX.XX.zip` |
| Dynamo idle floor | Never use `Math.max(0.2, ratio)` — causes phantom power. Use `if (ratio > 0)` |
| `playerAway` on back | Must set `State.data.world.playerAway = false` on worldmap back button |
| `GroundCanvas` centre | `cx = cy = 750` (not 500 — that was pre-1500px) |

---

*Version 0.31. Architecture reflects decoupled event-driven design across 40+ JS modules. When in doubt: does this module need to know about that module? If no — use an event.*

---

## v0.33 Changes

### Issue 18 — All buildings use bld-screen upgrade system
- `BuildingShelterScreen` added to `House.js` — `getScreenData()` shows sleep bonus, raid reduction, sleep button
- `BuildingWellScreen` added to `Well.js` — `getScreenData()` shows water/draw, passive water, pump status, draw button
- `BuildingFridgeScreen` added to `Barn.js` — `getScreenData()` shows food stored, hunger rate, eat button
- All three route through `base.js` default handler → `screen-bld-{id}` + `renderBuildingScreen(id)`
- Old `action:'shelter'`, `action:'well'`, `action:'fridge'` routing no longer needed (fall through to default)

### Issue 19 — Electric water pump is an upgrade on the Well (not a toggle)
- `waterPump` removed from manual consumer toggle panel in `power.js._consumersPanel()`
- `waterPump` auto-enables via `Power.unlockConsumer('waterPump')` when well reaches Lv8 (`electricPump:true`)
- Shown in consumer panel as "AUTO ⚡" badge — not togglable
- Drain scales: Lv8=0.8W, Lv9=1.2W, Lv10=1.5W per hour

### Issue 20 — Electric fence is an upgrade on the Wall (not a toggle)
- `elecFence` removed from manual consumer toggle panel
- Auto-enables via `Power.unlockConsumer('elecFence')` when fence reaches Lv9 (`elecFenceBoost:true`)
- Shown in consumer panel as "AUTO ⚡" badge — not togglable
- Drain: Lv9=1.0W, Lv10=1.5W per hour

### Issues 21+22 — Base Lighting is a standalone building with daylight glow spheres
- `baselights` entry added to `base.js` buildings registry
- `blLvl` level variable added in `_buildSVG()`
- `BuildingBaseLights.svg()` renders fixtures on base map; hit zone at `(cx + fw*0.20, cy + fh*0.08)`
- Build prompt shown when not yet built
- `drawGlowPools()` upgraded: radius scales with `lvMult = 0.7 + blLvl * 0.08`
- High-level (Lv7+) lights use near-white `rgba(255,250,220,0.80)` inner to simulate daylight
- Extra "hot centre" gradient added for Lv6+ fixtures

### Issue 23 — Power status in HUD
- `Power._updateHUDIndicator()` rewritten: shows `⚡{gen}W ▼{drain}W {net}W [bar]{pct}%`
- Only visible once any generator is built (`anyGen` check)
- Inline battery bar rendered with colour coding: green≥60%, yellow≥25%, red<25%
- Net wattage coloured green (positive) / red (negative)
- Subscribed to `hud:update` and `map:changed` events for refresh
- Old static `color` rule removed; inline styles handle per-value colour

### CSS additions (power.css)
- `.consumer-row.auto` — auto-active consumer row styling
- `.consumer-auto-badge` — "⚡ AUTO" / "🔒" badge
- `#hud-power` — flex layout for multi-segment HUD display


---

## v0.34 Changes

### Issue 14 — Pause now actually pauses the game
- `Base.togglePause()` implemented in `base.js`
- Sets `DayNight._paused = true/false` — the tick guard at line 56 of `daynight.js` was already present but the function was never defined
- `Cadence._decayCPM()` guards against running while `Base._paused` — CPM no longer drains during pause
- `Cadence.registerClick()` guards against pedal input being registered during pause
- Pause overlay HTML added to `index.html` (`#pause-overlay`, class `pause-overlay hidden`)
- CSS for pause overlay was already present in `base.css` — just needed the HTML and the function
- `btn-pause` icon toggles ⏸/▶ to reflect state

### Issue 15 — Back to base button from world map
- Root cause: `btn-abort-travel` handler had broken self-assignment `playerAway = (playerAway)` — now fixed to `= false`
- `btn-back-from-map` changed from `btn-secondary` to `btn-primary` and label expanded to `← BACK TO BASE` for visibility
- `btn-abort-travel` relabelled to `← BACK TO BASE` and changed to `btn-primary` so it's clearly visible during travel
- Note: during active travel `wm-travel-active` (z-index:30, inset:0) covers the header — `← BACK TO BASE` inside the travel panel is the correct back path during travel

### Issue 17 — Base graphics grow with shelter upgrade
- Root cause: `GroundCanvas.js` had `yardW = 920, yardH = 920` hardcoded regardless of `hLvl`
- Also had swapped `ix/iy` variable names in inner yard fill loop (now `xMin/yMin`)
- Fix: `yardGrow = (hLvl-1)/9 * (1380-620)` — yard expands from 620×620 at Lv1 to 1380×1380 at Lv10 (full fence interior)
- `yardX = (W - yardW) / 2` — yard is always centred in the 1500×1500 canvas
- Brick walls (Lv8+), inner yard fill, and all `yardX/yardY/yardW/yardH` references now use the scaled values automatically
- Every `map:changed` event (fired after building upgrades) already triggers `Base.updateNight() → BuildingGroundCanvas.draw()` — no new event wiring needed


---

## v0.35 Changes

### Issues 24 & 25 — Shelter / Well upgrade buttons missing
- Root cause: `upgKey` was set to the building's `id` (e.g. `'house'`), but `BuildingUpgrades` uses `'shelter'`
- Fix: `const upgKey = id === 'house' ? 'shelter' : id;` in `renderBuildingScreen()`
- `stKey` already correctly remapped `'shelter'` → `'house'` for state lookup
- `showUpgradeConfirm()` also fixed to use `stKey = upgKey === 'shelter' ? 'house' : upgKey`

### Issue 26 — Dynamo Bike needs upgrade window
- `goToBuilding('dynamo_bike')` previously navigated to `screen-dynamo-bike` (pedal screen), bypassing the bld-screen
- Now routes to `renderBuildingScreen('dynamo_bike')` → `navigate bld-dynamo_bike`
- Added `BuildingDynamoBikeScreen.getScreenData(s)` in `dynamo_bike.js` — shows level, max output, current CPM, live generation, + "PEDAL DYNAMO" action button
- Added `<div id="screen-bld-dynamo_bike">` to `index.html`

### Issue 27 — Power House needs upgrade window
- Same routing fix as dynamo_bike — now goes through bld-screen
- Added `BuildingPowerhouseScreen.getScreenData(s)` in `PowerHouse.js` — shows level, generation rate, battery %, + "POWER PANEL" action button  
- Added `<div id="screen-bld-powerhouse">` to `index.html`

### Issue 28 — Farm building needs upgrade window
- `goToBuilding('field')` previously emitted `farming:open`, bypassing bld-screen
- Now routes to `renderBuildingScreen('field')` → `navigate bld-field`
- `BuildingField.getScreenData(s)` already had a "MANAGE FARM" action button
- `BuildingUpgrades.field` already exists — upgrade section now renders correctly

### Issue 29 — Bunker relocated
- Moved from `cx, cy + fh*0.44` (lower centre gate area) to `cx - fw*0.20, cy + fh*0.44` (lower-left)

### Issue 30 — Compost Bin relocated  
- Moved from `cx + fw*0.04, cy + fh*0.44` (lower centre) to `cx + fw*0.44, cy - fh*0.18` (upper far-right near field)

### Issue 31 — Construction site on base map
- When `State.data.activeBuild` is set, `_buildSVG()` renders a `🏗 BUILDING` overlay panel at the building's map position
- Overlay shows progress bar and percentage; clicking calls `Base.goToConstruction()`
- `goToConstruction()` navigates to `screen-construction` — starts Cadence, shows pedal bar + live countdown
- `_constructionRefreshTimer` updates bar + speed label every 500ms; auto-returns to base when complete
- Position lookup map `_posMap` covers all 30+ buildings
- Construction screen added to `index.html` with cadence bar wired to existing `#cadence-bar` / `#cadence-cpm` elements

### Issue 32 — Electric fence loses defence when unpowered
- Added `State.getEffectiveDefence()` helper in `state.js`
- Returns `defenceRating - 60` when `consumers.elecFence` is active but `stored <= 0` AND `generationRate <= 0`
- Both `raids.js` defence reads updated to use `State.getEffectiveDefence()`
- Fence hit zone label in `_buildSVG` shows `⚠️ FENCE (NO POWER: X DEF)` when unpowered

### Issue 33 — Greenhouse, radio tower, storage expansion, solar panel removed from crafting menu
- Removed four recipe objects from `crafting.js`: `solar_panel`, `storage_upgrade`, `greenhouse`, `radio_tower`
- These are standalone buildings — managed exclusively through the base map building upgrade system
- "🏚 Base" craft category now contains only `reinforced_door` (a genuine craftable item)
- No change to `BuildingUpgrades` — all four still upgrade correctly from the base map


---

## v0.36 Changes

### Issue 34 — Shelter sleep/rest inline (no sub-window)
- `BuildingShelterScreen.getScreenData()` now returns two inline buttons in `actionBtn`: "😴 SLEEP TILL DAWN" (`Player.sleep(8)`) and "💤 SHORT REST (2h)" (`Player.sleep(2)`)
- No more `data-goto="shelter"` navigation — the entire shelter interaction is on the bld-screen
- Fixed stale field references: `sleepBonus` → `sleepEnergyBonus`, `raidDamageMult` → `shelterRaidReduction`

### Issue 35 — Dynamo bike CHARGE button, no upgrade in pedal screen
- `DynamoBike.renderScreen()` (the pedal screen): removed BUILD/UPGRADE section and pips, replaced with "CHARGING SESSION" label
- "▶ START PEDALLING" button renamed to "⚡ CHARGE"
- "← BACK TO BASE" button changed to "← BACK TO DYNAMO" (returns to bld-screen not base map)
- `BuildingDynamoBikeScreen` action button label changed from "🚴 PEDAL DYNAMO" to "⚡ CHARGE"

### Issue 36 — Battery bank uses bld-screen layout
- `goToBuilding('battery_bank')` now routes to `renderBuildingScreen('battery_bank')` + `bld-battery_bank` screen
- Added `BuildingBatteryBankScreen.getScreenData(s)` in power.js — shows level, capacity, stored Wh with colour-coded bar
- Added `<div id="screen-bld-battery_bank">` to index.html
- Upgrade section: `BuildingUpgrades.battery_bank` doesn't exist → upgrade section gracefully absent (power system handles it)

### Issue 37 — BaseLights fixtures visible + glow spheres working
- `fixtureSVG()`: unlit colour changed from `#3a3a4a` (near-black/invisible) to `#5a5040` (visible warm dim grey)
- `GroundCanvas.draw()`: now calls `BuildingBaseLights.drawGlowPools(ctx, blLvl, cx, cy, fw, fh)` when `blLit` (lights consumer on + powered + baselights built)
- Glow pools previously existed in `BaseLights.js` but were never called from the canvas — now wired

### Issue 38 — Solar array uses bld-screen layout
- `goToBuilding('solar_array')` now routes to `renderBuildingScreen('solar_array')` + `bld-solar_array` screen
- Added `BuildingSolarArrayScreen.getScreenData(s)` in power.js — shows level, max output, day/night current output
- Added `<div id="screen-bld-solar_array">` to index.html

### Issue 39 — Electric fence instant-defeat mechanic
- At start of `triggerRaid()`: checks `consumers.elecFence && hasPower && (hasZap || fLv >= 10)`
- If true: consumes 1× `elec_fence_upgrade` from inventory (unless Lv10), increments `raidsRepelled`, shows toast, returns early — no raid screen shown
- At Lv10: no zap item required; fence defeats all attacks while powered

### Issue 40 — Well passive water only when electric pump is on
- `daynight.js _tickDawn()`: split `passiveWater` into two independent sources:
  - `rainPassiveWater` (rain collector/greenhouse) → always ticks, no power needed
  - `wellPassiveWater` → only ticks when `consumers.waterPump === true` AND power is available
- Manual well (Lv1-7) no longer silently drips water each dawn

### Issue 41 — Radio tower requires power, on/off toggle
- Added `radio` to power consumer list (toggleable, 0.5W/hr drain)
- `_calcDrain()`: adds 0.5W when `consumers.radio` is true
- `_maybeRaid()`: raid reduction only applies when `consumers.radio && hasPower`; otherwise 0% reduction
- `crafting.js radio_tower case`: calls `Power.unlockConsumer('radio')` at Lv1
- `RadioTower.getScreenData()`: shows scanner ON/OFF status, "no power" warning, toggle button
- `state.js`: added `radio: false` to initial `consumers` and `unlockedConsumers`

### Issue 42 — Raid crash / double-screen fix
- `_openRaidScreen()`: clears any existing `_raidTimer` before creating new one; removes stale `.raid-result` overlays
- `_raidTick()`: new guard at top — if `!State.data.world.activeRaid`, clears timer and returns
- `_endRaid()`: sets `_raidTimer = null` after clearing; captures loot array before nulling `_currentAnimal`
- `_showResult(victory, lootGained)`: accepts pre-rolled loot array (no re-roll on null animal); purges existing `.raid-result` overlays before appending new one

### Issue 43 — Finer mouse wheel zoom on base map
- Wheel zoom factors changed from `0.88 / 1.14` (12-16% per tick) to `0.95 / 1.05` (5% per tick)
- Zoom range unchanged: 0.25× to 3.0×


---

## v0.37 Changes

### Issue 44 — Settings panel (⚙️ button next to pause)
- New `js/settings.js` module — fully decoupled, loaded before `devmode.js`
- `css/settings.css` — slides in from **LEFT** (devmode slides from right), blue accent colour
- `Settings._prefs`: persisted to `localStorage` as `pod_settings` — masterVol, musicVol, sfxVol, monsterVol, brightness
- `Settings.init()` called from `main.js` after UI binding — loads prefs and applies immediately
- `Settings._apply()` sets `document.documentElement.style.filter = brightness(x)` and calls Audio setters
- Sliders: `oninput` calls `Settings._onSlider(id, value)` — applies live with no debounce
- `Settings.toggle()` injects panel on first open; `_refresh()` re-renders content in-place

### Issue 45 — Bluetooth cadence sensor search
- `Settings.bleSearch()` — uses `navigator.bluetooth.requestDevice()` with CSC service filter (`cycling_speed_and_cadence` / `0x1816`)
- `Settings._onBLEData(event)` — parses CSC Measurement characteristic (`0x2A5B`), reads crank revolution delta + crank event time delta (1/1024s units), computes CPM, injects synthetic timestamps into `Cadence._clickTimes` so the existing cadence engine processes it natively
- Handles 16-bit rollover on both crank revs and event time counters
- `gattserverdisconnected` listener auto-updates status; `Settings.bleDisconnect()` for manual disconnect
- Status icon: 🟢 Connected / 🟡 Paired / ⚫ Not connected; log line shows scan/connect/error feedback
- `Settings._ble.enabled` flag — gates BLE data injection; toggled by Dev Mode

### Issue 46 — Dev mode cadence sensor ON/OFF toggle
- Added `cadenceSensor: true` flag to `DevMode.flags` (default ON)
- Added to ⌨️ INPUT section of dev panel: "Cadence Sensor" toggle
- `toggle_flag('cadenceSensor')` ON → `Settings.setBleEnabled(true)` + toast
- `toggle_flag('cadenceSensor')` OFF → `Settings.setBleEnabled(false)` + toast + shows "⚠ Disabled by Dev Mode" in settings panel
- `Settings.setBleEnabled(v)` refreshes settings panel UI when visible

### Audio additions (supporting issue 44)
- `Audio._monsterGain` — new GainNode wired directly to `_masterGain` (parallel to `_sfxGain`)
- `Audio._monsterVol = 0.70` — default, independently controllable
- `Audio._monsterSfx(fn)` — like `_sfx()` but routes through `_monsterGain`
- `Audio.sfxRaidAlert/sfxVictory/sfxDefeat` now use `_monsterSfx` instead of `_sfx`
- `Audio.setMonsterVol(v)` — called by settings slider
- `Audio.setMasterVol(v)` — new method to adjust `_masterGain` (skips when muted)

### New file: js/settings.js
- Fully decoupled global `const Settings = { … }` object
- No events subscribed — all interactions via inline onclick handlers and direct method calls
- `Settings.setBleEnabled(v)` is the only cross-module API surface (called by DevMode)

### KNOWN ARCHITECTURE NOTE
- `Settings.init()` MUST be called after `Audio.init()` is available but Audio doesn't need to be running yet — `setMasterVol/setMusicVol/setSfxVol/setMonsterVol` guard against null `_ctx` via optional chaining


---

## v0.38 Changes

### New module: js/bluetooth.js

**Load order:** after `cadence.js`, before `settings.js`

#### Responsibilities
- All BLE hardware interaction (scan, connect, parse, disconnect)
- Never writes to `State` — all output via `Events.emit`
- `settings.js` owns the UI; `bluetooth.js` owns the protocol

#### Protocol detection order (tries each, uses first that responds)
1. **iConsole+ / Abilica** — `0000fff0-0000-1000-8000-00805f9b34fb`
   - Notify char: `0000fff1-...` · Write char: `0000fff2-...`
   - Sends start-stream command `[0xF0, 0xA0, 0x01, 0x01, 0x92]`
   - Parses 16-byte proprietary packets: header `0xF0`, type `0xD1`, XOR checksum
   - Fields: byte[8]=RPM, byte[6]/10=km/h, byte[14]=HR
2. **FTMS** — `fitness_machine` (0x1826)
   - Indoor Bike Data char `0x2AD2` — variable-length, flag-driven layout
   - Decodes: speed (bit0), instantaneous cadence (bit2), power (bit6), HR (bit9)
   - Writes reset op-code `0x00` to control point `0x2AD9` on connect
3. **CSC** — `cycling_speed_and_cadence` (0x1816)
   - `csc_measurement` (0x2A5B) — derives RPM from delta crank revs / delta event time
   - 16-bit rollover-safe delta computation; sanity clamp 5–300 RPM
4. **Heart Rate** (supplementary, non-fatal) — `heart_rate` (0x180D)

#### Scan strategy
```js
navigator.bluetooth.requestDevice({
  acceptAllDevices: true,      // user sees ALL nearby devices
  optionalServices: [
    '0000fff0-0000-1000-8000-00805f9b34fb',  // iConsole
    'fitness_machine', 0x1826,               // FTMS
    'cycling_speed_and_cadence', 0x1816,     // CSC
    'heart_rate', 0x180D,                    // HR
  ]
})
```
`acceptAllDevices: true` is required because Abilica devices may advertise
under generic names. Without listing services in `optionalServices`, Chrome
blocks GATT service access even after pairing.

#### Events emitted
| Event | Payload | When |
|---|---|---|
| `bike:pedal` | `{ rpm, source }` | Each data packet with RPM > 0 |
| `bike:speed` | `{ kmh, source }` | Each packet with speed > 0 |
| `bike:hr` | `{ bpm }` | Heart rate packets |
| `bike:connected` | `{ name, protocol }` | Successful connection |
| `bike:disconnected` | `{ name }` | GATT disconnect |
| `bike:error` | `{ message }` | Scan/connect failure |

#### Cadence bridge (bottom of bluetooth.js)
```js
Events.on('bike:pedal', ({ rpm }) => {
  // converts RPM → synthetic click timestamps → Cadence._clickTimes
  // Cadence._recalcCPM() picks them up in the rolling 5s window
})
```
This is the ONLY place that translates BLE RPM into the cadence engine.
`cadence.js` itself is unchanged — it still runs on `_clickTimes`.

#### Public API
- `Bluetooth.connect(logFn)` — async, returns `true` on success
- `Bluetooth.disconnect()` — graceful GATT disconnect
- `Bluetooth.setEnabled(bool)` — called by DevMode; `false` stops all data injection and disconnects
- `Bluetooth.state` — live read-only snapshot: `{ connected, protocol, deviceName, rpm, kmh, bpm, power, enabled }`
- `Bluetooth.isAvailable()` — checks `navigator.bluetooth`

### settings.js changes
- `_buildHTML()`: BLE section now reads from `Bluetooth.state` instead of `this._ble`
- Connect button calls `Bluetooth.connect(Settings._bleLog.bind(Settings))`
- Disconnect button calls `Bluetooth.disconnect()`
- Removed: `_ble` property, `bleSearch()`, `bleDisconnect()`, `_onBLEData()`, `setBleEnabled()` — all replaced by `Bluetooth.*`
- `_bleLog(msg, cls)` retained — passed as `logFn` to `Bluetooth.connect()` so scan progress appears in the settings panel

### devmode.js changes
- `cadenceSensor` toggle ON → `Bluetooth.setEnabled(true)`
- `cadenceSensor` toggle OFF → `Bluetooth.setEnabled(false)` (was `Settings.setBleEnabled`)

