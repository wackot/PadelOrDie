# 🧟 PEDAL OR DIE — Game Architecture

## File Structure

```
PedalOrDie/
│
├── index.html              ← Main entry point, loads everything
│
├── css/
│   ├── main.css            ← Global styles, pixel art fonts, CSS variables
│   ├── base.css            ← Base/home screen styles
│   ├── foraging.css        ← Expedition/biking screen styles
│   ├── crafting.css        ← Crafting menu styles
│   └── ui.css              ← HUD, inventory, notifications
│
├── js/
│   ├── main.js             ← Game loop, init, screen manager
│   ├── state.js            ← Central game state (single source of truth)
│   ├── save.js             ← Save/load (local + Google Drive + export/import)
│   ├── player.js           ← Player stats, hunger, thirst, sleep
│   ├── base.js             ← Base management, upgrades, defence rating
│   ├── foraging.js         ← Expedition logic, resource gathering, cadence
│   ├── crafting.js         ← Crafting recipes, inventory management
│   ├── raids.js            ← Raid system, night attacks, animal spawning
│   ├── animals.js          ← Animal types, stats, behaviours
│   ├── map.js              ← World map, location unlocking
│   ├── cadence.js          ← Click/cadence engine (mouse now, sensor later)
│   └── utils.js            ← Helper functions, random, timers
│
├── assets/
│   ├── images/
│   │   ├── base/           ← Base buildings (house, fridge, well, table, fence)
│   │   ├── locations/      ← Map location thumbnails (forest, city, etc)
│   │   ├── animals/        ← Animal sprites (wolves, bears, insects, etc)
│   │   ├── items/          ← Crafted items, resources, equipment
│   │   ├── player/         ← Player character sprites
│   │   └── ui/             ← Buttons, icons, HUD elements
│   │
│   ├── animations/         ← GIF animations
│   │   ├── biking/         ← Biking animations per location
│   │   ├── raids/          ← Attack animations
│   │   ├── crafting/       ← Crafting animations
│   │   └── effects/        ← Weather, day/night, fire effects
│   │
│   └── sounds/             ← Sound effects and music (future)
│
├── config/
│   ├── animals.json        ← All animal stats, drop rates, behaviours
│   ├── locations.json      ← Location data, resources, danger levels
│   ├── recipes.json        ← All crafting recipes
│   ├── upgrades.json       ← Base upgrade trees and costs
│   └── balance.json        ← Game balance numbers (easy to tweak)
│
└── ARCHITECTURE.md         ← This file

```

---

## Core Game Screens

```
1. BASE VIEW (top down pixel art)
   └── Clickable buildings: House | Fridge | Well | Crafting Table | Map

2. SLEEP SCREEN
   └── Time passes, possible night raid

3. EAT/DRINK SCREEN  
   └── Consume food/water from inventory

4. WORLD MAP SCREEN
   └── Choose expedition location

5. FORAGING SCREEN (side scroll animation)
   └── Bike animation + cadence clicking + resource counter
   └── Raid alert overlay if attacked while away

6. CRAFTING SCREEN
   └── Recipe list + inventory + craft button

7. NIGHT RAID SCREEN
   └── Top down base + bike harder to defend mechanic
```

---

## Central State Object (state.js)

```javascript
GameState = {
  player: {
    hunger: 100,       // 0-100
    thirst: 100,       // 0-100  
    energy: 100,       // 0-100
    equipment: {}      // worn items
  },
  base: {
    defenceRating: 10, // determines raid survival
    buildings: {},     // upgrade levels per building
    hasLight: false    // night foraging unlocked
  },
  inventory: {
    // resources
    wood: 0, metal: 0, gasoline: 0, food: 0, water: 0,
    medicine: 0, cloth: 0, electronics: 0,
    // crafted items
    items: []
  },
  world: {
    day: 1,
    isNight: false,
    unlockedLocations: ['forest'],  // more unlock as you progress
    currentScreen: 'base'
  },
  cadence: {
    clicksPerMinute: 0,
    targetCPM: 60,     // base target
    raidTargetCPM: 90  // higher target during raid
  },
  session: {
    totalClicks: 0,
    totalMinutes: 0,
    expeditionsCompleted: 0
  }
}
```

---

## Key Design Principles

### 1. Images/GIFs are ALWAYS swappable
- All image paths defined in ONE place: `config/` JSON files
- Never hardcoded in JS logic
- Just drop new image in folder, update path in JSON — done!

### 2. Cadence engine is isolated
- `cadence.js` handles ALL input (clicks now, Bluetooth sensor later)
- Everything else just reads `cadence.clicksPerMinute`
- Swap cadence source = change ONE file only

### 3. Balance is separated from logic
- All numbers (raid frequency, resource amounts, crafting costs) in `balance.json`
- Tweak the game feel without touching code

### 4. Save system is modular
- Local save always works as fallback
- Google Drive is optional layer on top
- Export/Import always available

---

## Development Phases

**Phase 1 — Core Loop (Start here)**
- Base view with clickable buildings
- Basic foraging with click mechanic
- Simple inventory
- Local save

**Phase 2 — Survival**
- Hunger/thirst/sleep mechanics
- Day/night cycle
- Basic raids

**Phase 3 — Crafting & Progression**
- Full crafting system
- Base upgrades
- Equipment system

**Phase 4 — World**
- All 8 locations
- All 7 animal types
- Boss creatures

**Phase 5 — Polish**
- Google Drive saves
- Cadence sensor support
- Sound effects
- More animations
