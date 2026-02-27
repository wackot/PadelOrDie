// ═══════════════════════════════════════════
// PEDAL OR DIE — crafting.js  (Phase 3)
// Full crafting system: 4-tab UI, animations,
// recipe unlocks, base upgrades, inventory, stats
// ═══════════════════════════════════════════

const Crafting = {

  _activeTab:      'craft',
  _selectedCat:    'defence',
  _selectedRecipe: null,
  _craftQty:       1,

  // ── Emoji map ─────────────────────────────
  emojiMap: {
    wood:'🪵', metal:'🔩', gasoline:'⛽', food:'🥫', water:'💧',
    medicine:'💊', cloth:'🧶', electronics:'📟', rope:'🪢', chemicals:'🧪',
    spores:'🍄', wild_seeds:'🌱', engine_parts:'⚙️', scrap_wire:'🔌',
    circuit_board:'💾', antiseptic:'🧫', cave_crystal:'💎', military_chip:'🎖️',
    coal:'⛏', glass:'🪟',
    battery_cell:'🔋', copper_wire:'🔌', steel_casing:'🧊', capacitor:'💡', power_core:'⚡',
    solar_glass:'☀'
  },

  // ── Recipe definitions ────────────────────
  recipes: {

    // DEFENCE
    sharpened_stick: {
      id:'sharpened_stick', category:'defence', name:'Sharpened Stick', emoji:'🥢',
      desc:'Basic melee weapon. Better than bare hands.',
      type:'weapon', ingredients:{ wood:2 }, effect:{ defenceRating:5 },
      unlockCondition: null
    },
    wooden_club: {
      id:'wooden_club', category:'defence', name:'Wooden Club', emoji:'🏏',
      desc:'A hefty hardwood club. Deals solid damage.',
      type:'weapon', ingredients:{ wood:5 }, effect:{ defenceRating:10 },
      unlockCondition: null
    },
    metal_spear: {
      id:'metal_spear', category:'defence', name:'Metal Spear', emoji:'🗡️',
      desc:'Sharpened metal rod. Effective against large creatures.',
      type:'weapon', ingredients:{ metal:3, wood:2 }, effect:{ defenceRating:20 },
      unlockCondition: { resource:'metal', amount:3 }
    },
    barbed_fence: {
      id:'barbed_fence', category:'defence', name:'Barbed Wire Upgrade', emoji:'🚧',
      desc:'Reinforces your perimeter with razor wire.',
      type:'base_upgrade', ingredients:{ metal:4, rope:2 }, effect:{ defenceRating:15 },
      unlockCondition: { resource:'rope', amount:1 }
    },
    wooden_shield: {
      id:'wooden_shield', category:'defence', name:'Wooden Shield', emoji:'🛡️',
      desc:'Reduces incoming raid damage by 15%.',
      type:'armour', ingredients:{ wood:8, rope:2 }, effect:{ defenceRating:12, armourBonus:0.15 },
      unlockCondition: { resource:'rope', amount:2 }
    },
    watchtower: {
      id:'watchtower', category:'defence', name:'Watchtower', emoji:'🗼',
      desc:'Provides early raid warning. Extends response time.',
      type:'base_upgrade', ingredients:{ wood:15, metal:5, rope:3 }, effect:{ defenceRating:25 },
      unlockCondition: { resource:'metal', amount:5 }
    },
    metal_armour: {
      id:'metal_armour', category:'defence', name:'Metal Armour', emoji:'🦺',
      desc:'Heavy protection. Reduces damage by 30%.',
      type:'armour', ingredients:{ metal:8, cloth:4 }, effect:{ defenceRating:25, armourBonus:0.30 },
      unlockCondition: { resource:'cloth', amount:4 }
    },

    // BIKE
    bike_repair: {
      id:'bike_repair', category:'bike', name:'Bike Repair Kit', emoji:'🔧',
      desc:'Tune up your bike. Faster resource gathering.',
      type:'bike', ingredients:{ metal:2, cloth:1 }, effect:{ bikeEfficiency:1.2 },
      unlockCondition: null
    },
    bike_light: {
      id:'bike_light', category:'bike', name:'Bike Light', emoji:'🔦',
      desc:'Enables night expeditions! Risky but rewarding.',
      type:'bike', ingredients:{ electronics:2, metal:1 }, effect:{ hasLight:true },
      unlockCondition: { resource:'electronics', amount:1 }
    },
    cargo_rack: {
      id:'cargo_rack', category:'bike', name:'Cargo Rack', emoji:'📦',
      desc:'Carry 50% more resources per expedition.',
      type:'bike', ingredients:{ metal:4, rope:2 }, effect:{ cargoBonus:1.5 },
      unlockCondition: { resource:'rope', amount:2 }
    },
    reinforced_tyres: {
      id:'reinforced_tyres', category:'bike', name:'Reinforced Tyres', emoji:'🛞',
      desc:'Go further. Reduces energy cost of expeditions.',
      type:'bike', ingredients:{ rubber:0, cloth:3, chemicals:1 }, effect:{ energyCostMult:0.7 },
      unlockCondition: { resource:'chemicals', amount:1 }
    },
    bike_engine: {
      id:'bike_engine', category:'bike', name:'Motor Assist', emoji:'⚙️',
      desc:'Attach a small motor. Massive expedition efficiency boost.',
      type:'bike', ingredients:{ electronics:3, gasoline:2, metal:5 }, effect:{ bikeEfficiency:2.0 },
      unlockCondition: { resource:'gasoline', amount:2 }
    },

    // FOOD & MEDICINE
    cooked_meal: {
      id:'cooked_meal', category:'food', name:'Cooked Meal', emoji:'🍲',
      desc:'Slow-cooked rations. Restores 60 hunger.',
      type:'consumable', ingredients:{ food:2, wood:1 }, effect:{ hunger:60 },
      unlockCondition: null
    },
    water_filter: {
      id:'water_filter', category:'food', name:'Water Filter', emoji:'🪣',
      desc:'Purify water. Well yields +5 per draw.',
      type:'base_upgrade', ingredients:{ cloth:2, chemicals:1 }, effect:{ waterPerDraw:5 },
      unlockCondition: { resource:'chemicals', amount:1 }
    },
    med_kit: {
      id:'med_kit', category:'food', name:'Med Kit', emoji:'🩺',
      desc:'Bandages and antiseptic. Restores all stats.',
      type:'consumable', ingredients:{ medicine:3, cloth:2 }, effect:{ fullHeal:true },
      unlockCondition: { resource:'medicine', amount:3 }
    },
    energy_drink: {
      id:'energy_drink', category:'food', name:'Energy Brew', emoji:'⚡',
      desc:'Crude stimulant. +50 energy instantly.',
      type:'consumable', ingredients:{ food:1, chemicals:1 }, effect:{ energy:50 },
      unlockCondition: { resource:'chemicals', amount:1 }
    },
    preserved_food: {
      id:'preserved_food', category:'food', name:'Preserved Rations', emoji:'🥡',
      desc:'Long-lasting food supply. 3x value.',
      type:'consumable', ingredients:{ food:3, chemicals:1, cloth:1 }, effect:{ hunger:100 },
      unlockCondition: { resource:'chemicals', amount:1 }
    },

    // BASE
    reinforced_door: {
      id:'reinforced_door', category:'base', name:'Reinforced Door', emoji:'🚪',
      desc:'Stronger shelter entry. +10 defence.',
      type:'base_upgrade', ingredients:{ wood:8, metal:3 }, effect:{ defenceRating:10 },
      unlockCondition: { resource:'metal', amount:3 }
    },
    solar_panel: {
      id:'solar_panel', category:'base', name:'Solar Panel', emoji:'☀️',
      desc:'Free power. Unlocks electronics crafting.',
      type:'base_upgrade', ingredients:{ electronics:5, metal:4 }, effect:{ hasPower:true },
      unlockCondition: { resource:'electronics', amount:5 }
    },
    storage_upgrade: {
      id:'storage_upgrade', category:'base', name:'Storage Expansion', emoji:'🗃️',
      desc:'More room for resources.',
      type:'base_upgrade', ingredients:{ wood:10, metal:2 }, effect:{ storageMult:2 },
      unlockCondition: { resource:'wood', amount:10 }
    },
    greenhouse: {
      id:'greenhouse', category:'base', name:'Greenhouse', emoji:'🌿',
      desc:'Grow food at base. Passive +1 food per day.',
      type:'base_upgrade', ingredients:{ wood:12, cloth:4, rope:3 }, effect:{ passiveFood:1 },
      unlockCondition: { resource:'cloth', amount:4 }
    },
    radio_tower: {
      id:'radio_tower', category:'base', name:'Radio Tower', emoji:'📡',
      desc:'Scan for threats. Reduces raid frequency by 30%.',
      type:'base_upgrade', ingredients:{ electronics:6, metal:8, rope:4 }, effect:{ raidReduction:0.3 },
      unlockCondition: { resource:'electronics', amount:6 }
    },

    // UNIQUE MATERIAL RECIPES — require location-specific drops
    spore_extract: {
      id:'spore_extract', category:'unique', name:'Spore Extract', emoji:'🧪',
      desc:'Brewed from Forest spores. Restores 40 energy.',
      type:'consumable', ingredients:{ spores:3, water:2 }, effect:{ energy:40 },
      unlockCondition: { resource:'spores', amount:1 }
    },
    crop_seeds: {
      id:'crop_seeds', category:'unique', name:'Crop Planting Kit', emoji:'🌱',
      desc:'Wild Seeds from the Farm. Boosts Field yield by +1 food/day.',
      type:'base_upgrade', ingredients:{ wild_seeds:5, wood:3 }, effect:{ cropYield:1 },
      unlockCondition: { resource:'wild_seeds', amount:3 }
    },
    engine_kit: {
      id:'engine_kit', category:'unique', name:'Engine Upgrade Kit', emoji:'⚙️',
      desc:'Gas Station engine parts. Boosts bike efficiency by 30%.',
      type:'bike', ingredients:{ engine_parts:4, gasoline:2, metal:3 }, effect:{ bikeEfficiency:1.3 },
      unlockCondition: { resource:'engine_parts', amount:2 }
    },
    wire_mesh: {
      id:'wire_mesh', category:'unique', name:'Wire Mesh Armour', emoji:'🔌',
      desc:'Scrap wire from City Ruins. +20 defence.',
      type:'armour', ingredients:{ scrap_wire:6, cloth:2 }, effect:{ defenceRating:20, armourBonus:0.1 },
      unlockCondition: { resource:'scrap_wire', amount:3 }
    },
    circuit_radio: {
      id:'circuit_radio', category:'unique', name:'Signal Booster', emoji:'💾',
      desc:'Junkyard circuit boards. Halves raid frequency.',
      type:'base_upgrade', ingredients:{ circuit_board:4, electronics:3, metal:2 }, effect:{ raidReduction:0.5 },
      unlockCondition: { resource:'circuit_board', amount:2 }
    },
    antiseptic_kit: {
      id:'antiseptic_kit', category:'unique', name:'Antiseptic Kit', emoji:'🧫',
      desc:'Hospital antiseptic. Full heal all stats.',
      type:'consumable', ingredients:{ antiseptic:3, cloth:2 }, effect:{ fullHeal:true },
      unlockCondition: { resource:'antiseptic', amount:2 }
    },
    crystal_battery: {
      id:'crystal_battery', category:'unique', name:'Crystal Power Cell', emoji:'💎',
      desc:'Cave crystals. Removes energy cost from expeditions.',
      type:'bike', ingredients:{ cave_crystal:5, electronics:3, metal:2 }, effect:{ energyCostMult:0.0 },
      unlockCondition: { resource:'cave_crystal', amount:3 }
    },
    mil_processor: {
      id:'mil_processor', category:'unique', name:'Military Processor', emoji:'🎖️',
      desc:'Military chips. Provides permanent +50 defence.',
      type:'base_upgrade', ingredients:{ military_chip:5, electronics:4 }, effect:{ defenceRating:50 },
      unlockCondition: { resource:'military_chip', amount:3 }
    },

    // ══════════════════════════════════════════
    // ELECTRIC BENCH RECIPES
    // requiresPower: true — only craftable when power is available
    // ══════════════════════════════════════════

    // STEP 1: Build the Electric Bench first (at crafting table, no power needed)
    elec_bench: {
      id:'elec_bench', category:'base', name:'Electric Bench', emoji:'🔬',
      desc:'Upgrade your crafting table with electric tools. Unlocks all electrical crafting. Requires power to operate.',
      type:'base_upgrade', requiresPower: false,
      ingredients:{ metal:12, electronics:6, rope:4, circuit_board:2 },
      effect:{ elecBench:true },
      unlockCondition:{ resource:'electronics', amount:6 }
    },

    // STEP 2: Craft battery parts AT the electric bench (requires power)
    battery_cell: {
      id:'battery_cell', category:'electric', name:'Battery Cell', emoji:'🔋',
      desc:'Core energy cell. Stack 2+ per battery level. Requires powered electric bench.',
      type:'component', requiresPower: true,
      ingredients:{ metal:3, chemicals:2, electronics:1 },
      effect:{ giveItem:'battery_cell' },
      unlockCondition:{ resource:'circuit_board', amount:1 }
    },
    copper_wire: {
      id:'copper_wire', category:'electric', name:'Copper Wire', emoji:'🔌',
      desc:'Wiring for battery connections and electric components.',
      type:'component', requiresPower: true,
      ingredients:{ metal:2, rope:1 },
      effect:{ giveItem:'copper_wire' },
      unlockCondition:{ resource:'electronics', amount:1 }
    },
    steel_casing: {
      id:'steel_casing', category:'electric', name:'Steel Casing', emoji:'🧊',
      desc:'Protective housing for battery cells.',
      type:'component', requiresPower: true,
      ingredients:{ metal:4 },
      effect:{ giveItem:'steel_casing' },
      unlockCondition:{ resource:'metal', amount:4 }
    },
    capacitor: {
      id:'capacitor', category:'electric', name:'Capacitor', emoji:'💡',
      desc:'High-capacity component for Lv5+ battery banks.',
      type:'component', requiresPower: true,
      ingredients:{ electronics:3, metal:2, chemicals:1 },
      effect:{ giveItem:'capacitor' },
      unlockCondition:{ resource:'circuit_board', amount:2 }
    },
    power_core: {
      id:'power_core', category:'electric', name:'Power Core', emoji:'⚡',
      desc:'Advanced power regulation core for Lv8+ batteries.',
      type:'component', requiresPower: true,
      ingredients:{ electronics:5, metal:3, cave_crystal:2, chemicals:2 },
      effect:{ giveItem:'power_core' },
      unlockCondition:{ resource:'cave_crystal', amount:2 }
    },

    // ELECTRIC UPGRADES (require power + electric bench)
    led_lights: {
      id:'led_lights', category:'electric', name:'LED Lighting', emoji:'💡',
      desc:'Bright base lighting. Uses 0.5W/hr. Improves morale and early raid warnings.',
      type:'base_upgrade', requiresPower: true,
      ingredients:{ electronics:3, glass:2, copper_wire:2 },
      effect:{ lights:true },
      unlockCondition:{ resource:'copper_wire', amount:1 }
    },
    elec_fence_upgrade: {
      id:'elec_fence_upgrade', category:'electric', name:'Electric Fence Zap', emoji:'⚡',
      desc:'Electrify your fence. Uses 1W/hr. Repels raids automatically, massive defence boost.',
      type:'base_upgrade', requiresPower: true,
      ingredients:{ copper_wire:4, metal:6, electronics:3 },
      effect:{ elecFenceBoost:true },
      unlockCondition:{ resource:'copper_wire', amount:2 }
    },
    electric_pump: {
      id:'electric_pump', category:'electric', name:'Electric Water Pump', emoji:'💧',
      desc:'Auto-pumps 5 water/hour when powered. No more manual drawing.',
      type:'base_upgrade', requiresPower: true,
      ingredients:{ metal:8, electronics:4, rope:3, copper_wire:3 },
      effect:{ electricPump:true },
      unlockCondition:{ resource:'copper_wire', amount:3 }
    },
    elec_bike_motor: {
      id:'elec_bike_motor', category:'electric', name:'Electric Bike Motor', emoji:'🏍',
      desc:'Motorised bike. Reduces expedition energy cost by 50%. Uses battery to charge.',
      type:'bike', requiresPower: true,
      ingredients:{ electronics:6, metal:8, copper_wire:4, battery_cell:3 },
      effect:{ energyCostMult:0.5, bikeEfficiency:1.5 },
      unlockCondition:{ resource:'battery_cell', amount:2 }
    },
    elec_grow_light: {
      id:'elec_grow_light', category:'electric', name:'Grow Lights', emoji:'🌱',
      desc:'Supercharges the greenhouse. Food production ×2, works at night.',
      type:'base_upgrade', requiresPower: true,
      ingredients:{ electronics:4, glass:3, copper_wire:3 },
      effect:{ growLight:true },
      unlockCondition:{ resource:'copper_wire', amount:2 }
    },
    solar_glass: {
      id:'solar_glass', category:'electric', name:'Solar Panel Glass', emoji:'🪟',
      desc:'Tempered glass panes for solar array construction. Craft before building Solar Array.',
      type:'component', requiresPower: false,
      ingredients:{ glass:4, metal:2, chemicals:1 },
      effect:{ giveItem:'solar_glass' },
      unlockCondition:{ resource:'glass', amount:4 }
    }
  },

  categories: [
    { id:'defence', label:'🛡 Defence' },
    { id:'bike',    label:'🚴 Bike'    },
    { id:'food',    label:'🍲 Food'    },
    { id:'base',    label:'🏚 Base'    },
    { id:'unique',  label:'✨ Unique'  },
    { id:'electric', label:'⚡ Electric' }
  ],

  // ── Base upgrades tracker ─────────────────
  baseUpgrades: {
    shelter: {
      name:'Shelter', icon:'🏚️', maxLevel:10,
      levels: [
        { desc:'Lv1 — Hay pile. Basic rest. +0 bonus.',
          cost:{ wood:0 }, unlocks:[] },
        { desc:'Lv2 — Mattress on ground. Sleep restores +10% energy. Unlocks: Greenhouse.',
          cost:{ cloth:4, rope:2 }, unlocks:['greenhouse'] },
        { desc:'Lv3 — Stick lean-to. Some shelter from rain. Unlocks: Crop Field, Rain Collector.',
          cost:{ wood:8, rope:4 }, unlocks:['field','rain_collector'] },
        { desc:'Lv4 — Open hut. +15% sleep energy. Unlocks: Compost Bin, Food Storage.',
          cost:{ wood:20, rope:6 }, unlocks:['compost_bin','storage'] },
        { desc:'Lv5 — Closed shack. Raid damage -10%. Unlocks: Watchtower, Workshop.',
          cost:{ wood:30, metal:4, rope:4 }, unlocks:['watchtower','workshop'] },
        { desc:'Lv6 — Wooden house. Sleep +25% energy. Unlocks: Smokehouse, Powerhouse.',
          cost:{ wood:45, metal:8, cloth:6 }, unlocks:['smokehouse','powerhouse'] },
        { desc:'Lv7 — Glass house. Raid -20%. Unlocks: Electric Bench, Radio Tower.',
          cost:{ wood:40, metal:15, electronics:4 }, unlocks:['elecbench','radio_tower'] },
        { desc:'Lv8 — Brick house. Sleep +40%. Unlocks: Alarm System, Well Upgrade.',
          cost:{ metal:20, chemicals:6, electronics:4 }, unlocks:['alarm_system','well'] },
        { desc:'Lv9 — Fancy house. Hunger/thirst drain -20%. Unlocks: Medical Station, Solar Station.',
          cost:{ metal:30, electronics:8, cloth:10 }, unlocks:['medkit_station','solar_station'] },
        { desc:'Lv10 — Metal fortress. Raid -50%. Unlocks: Bunker (ultimate protection).',
          cost:{ metal:50, electronics:20, military_chip:4, chemicals:10 }, unlocks:['bunker'] }
      ]
    },
    well: {
      name:'Well', icon:'🪣', maxLevel:10,
      levels: [
        { desc:'Lv1 — Stone well. Draws 5 water per use.',
          cost:{ wood:0 }, waterPerUse:5 },
        { desc:'Lv2 — Lined well. Draws 8 water per use.',
          cost:{ wood:6, rope:3 }, waterPerUse:8 },
        { desc:'Lv3 — Filtered well. Draws 12 water + removes toxins.',
          cost:{ wood:10, chemicals:3, rope:2 }, waterPerUse:12 },
        { desc:'Lv4 — Deep well. Draws 18 water. Never runs dry.',
          cost:{ wood:15, metal:4, rope:4 }, waterPerUse:18 },
        { desc:'Lv5 — Hand-pump well. Draws 25 water per use. +1 water/day passively.',
          cost:{ metal:10, wood:12, rope:4 }, waterPerUse:25, passiveWater:1 },
        { desc:'Lv6 — Brick well with pump. Draws 35 water. +2 water/day.',
          cost:{ metal:16, chemicals:4, rope:5 }, waterPerUse:35, passiveWater:2 },
        { desc:'Lv7 — Pressurised well. Draws 50 water. +3 water/day.',
          cost:{ metal:22, electronics:4, chemicals:5 }, waterPerUse:50, passiveWater:3 },
        { desc:'Lv8 — Purification tower. Draws 70 water. +5 water/day. Water heals +2 health.',
          cost:{ metal:30, electronics:8, chemicals:8 }, waterPerUse:70, passiveWater:5 },
        { desc:'Lv9 — Hydro plant. Draws 100 water. +8 water/day. Also generates 1Wh power.',
          cost:{ metal:40, electronics:15, chemicals:10, power_core:2 }, waterPerUse:100, passiveWater:8 },
        { desc:'Lv10 — Infinite aquifer tap. Draws 150 water. +15 water/day. Unlimited supply.',
          cost:{ metal:55, electronics:22, chemicals:15, power_core:4, military_chip:2 }, waterPerUse:150, passiveWater:15 }
      ]
    },
    fence: {
      name:'Perimeter', icon:'🚧', maxLevel:10,
      levels: [
        { desc:'Lv1 — Open perimeter. No fence yet. Defence: 10.',
          cost:{ wood:0 } },
        { desc:'Lv2 — Rope & poles. +8 def. Slows raiders.',
          cost:{ wood:4, rope:4 } },
        { desc:'Lv3 — Alarm line. Rope + cans alert you to raids. +12 def.',
          cost:{ wood:6, rope:6, metal:2 } },
        { desc:'Lv4 — Wooden fence. +18 def. Stops basic animal raids.',
          cost:{ wood:20, rope:4 } },
        { desc:'Lv5 — Spiked fence. +25 def. Spikes damage attackers.',
          cost:{ wood:30, rope:6, metal:4 } },
        { desc:'Lv6 — Barbed wire perimeter. +35 def. Wire in front slows raiders.',
          cost:{ wood:20, metal:10, rope:8 } },
        { desc:'Lv7 — Metal fence. +50 def. Welded steel panels.',
          cost:{ metal:25, rope:5, electronics:2 } },
        { desc:'Lv8 — Metal + barbed wire on top. +65 def. Climbing is suicide.',
          cost:{ metal:35, rope:10, chemicals:4 } },
        { desc:'Lv9 — Electrified fence. +80 def. Sparks fly. Needs power for full effect.',
          cost:{ metal:40, electronics:15, chemicals:6 } },
        { desc:'Lv10 — Concrete + electric wire + auto-turrets. +100 def. Maximum security.',
          cost:{ metal:50, electronics:25, chemicals:10, military_chip:3 } }
      ]
    },
    storage: {
      name:'Storage Room', icon:'🗃️', maxLevel:10,
      levels: [
        { desc:'Lv1 — Crate pile outside. Max 50 of each basic resource.',
          cost:{ wood:0 },
          storeCapA:50, storeCapB:0, storeCapC:0, storeCapD:0 },
        { desc:'Lv2 — Wooden shelf shed. Max 100 basics.',
          cost:{ wood:12, rope:4 },
          storeCapA:100 },
        { desc:'Lv3 — Locked shed + metal shelf. Max 150 basics. Unlocks Tier B storage (electronics, meds, chemicals).',
          cost:{ wood:20, metal:6, rope:4 },
          storeCapA:150, storeCapB:30 },
        { desc:'Lv4 — Double shed. Max 200 basics, 60 Tier B.',
          cost:{ wood:30, metal:10, rope:6 },
          storeCapA:200, storeCapB:60 },
        { desc:'Lv5 — Reinforced storage. Max 300 basics, 100 Tier B. Unlocks Tier C (rare materials).',
          cost:{ wood:40, metal:16, rope:8, electronics:3 },
          storeCapA:300, storeCapB:100, storeCapC:30 },
        { desc:'Lv6 — Underground room. Max 400 basics, 150 Tier B, 60 Tier C.',
          cost:{ wood:30, metal:24, electronics:6, chemicals:4 },
          storeCapA:400, storeCapB:150, storeCapC:60 },
        { desc:'Lv7 — Climate-controlled vault. Max 500, 200, 100.',
          cost:{ metal:30, electronics:10, chemicals:8, rope:8 },
          storeCapA:500, storeCapB:200, storeCapC:100 },
        { desc:'Lv8 — Industrial shelving. Max 750, 300, 150. Unlocks Tier D (electrical parts).',
          cost:{ metal:40, electronics:15, chemicals:10, military_chip:2 },
          storeCapA:750, storeCapB:300, storeCapC:150, storeCapD:60 },
        { desc:'Lv9 — Hardened bunker store. Max 1000, 400, 200, 100.',
          cost:{ metal:60, electronics:20, chemicals:15, military_chip:4 },
          storeCapA:1000, storeCapB:400, storeCapC:200, storeCapD:100 },
        { desc:'Lv10 — Apocalypse warehouse. Max 2000, 600, 300, 200. Unlimited basics.',
          cost:{ metal:80, electronics:30, chemicals:20, military_chip:8 },
          storeCapA:2000, storeCapB:600, storeCapC:300, storeCapD:200 }
      ]
    },
    greenhouse: {
      name:'Greenhouse', icon:'🌿', maxLevel:3,
      levels: [
        { desc:'Lv0 — Not built. Build to grow food passively.',
          cost:{ wood:0 } },
        { desc:'Lv1 — Small greenhouse. +1 food every game day, passively.',
          cost:{ wood:12, cloth:4, rope:3 } },
        { desc:'Lv2 — Expanded greenhouse. +2 food/day + 1 water/day.',
          cost:{ wood:20, cloth:6, metal:4 } },
        { desc:'Lv3 — Full greenhouse. +3 food/day + 2 water/day + slows hunger 10%.',
          cost:{ wood:30, metal:8, electronics:2, rope:5 } }
      ]
    },
    field: {
      name:'Crop Field', icon:'🌾', maxLevel:3,
      levels: [
        { desc:'Lv0 — Not built. Requires Wild Seeds to plant.',
          cost:{ wood:0 } },
        { desc:'Lv1 — Planted field. +2 food every 2 days. Needs Wild Seeds.',
          cost:{ wild_seeds:5, wood:8, rope:2 } },
        { desc:'Lv2 — Cultivated field. +3 food/day. Reduces hunger drain 15%.',
          cost:{ wild_seeds:10, wood:15, metal:3, rope:4 } },
        { desc:'Lv3 — Full harvest. +5 food/day. Hunger barely drains at base.',
          cost:{ wild_seeds:20, wood:20, metal:8, chemicals:3 } }
      ]
    },
    // ── NEW BUILDINGS (unlocked by shelter level) ──────
    rain_collector: {
      name:'Rain Collector', icon:'🌧️', maxLevel:10, unlockReq:3,
      levels:[
        { desc:'Lv0 — Not built yet.',                                                    cost:{ wood:0 },                                        passiveWater:0  },
        { desc:'Lv1 — Wooden barrel with funnel. +1 water/day.',                          cost:{ wood:10, rope:4, metal:2 },                      passiveWater:1  },
        { desc:'Lv2 — Two barrels and a roof gutter. +2 water/day.',                      cost:{ wood:14, metal:4, rope:4 },                      passiveWater:2  },
        { desc:'Lv3 — Barrel row with downspouts. +3 water/day.',                         cost:{ wood:20, metal:8, rope:5 },                      passiveWater:3  },
        { desc:'Lv4 — Metal tank with filter. +5 water/day. Water never runs out.',       cost:{ metal:14, rope:5, chemicals:2 },                  passiveWater:5  },
        { desc:'Lv5 — Twin tanks and a pump. +7 water/day.',                              cost:{ metal:22, chemicals:3, rope:6 },                  passiveWater:7  },
        { desc:'Lv6 — Elevated cistern. +10 water/day. Gravity-fed to well.',             cost:{ metal:30, electronics:4, chemicals:4 },           passiveWater:10 },
        { desc:'Lv7 — Underground reservoir. +13 water/day. Raid-proof storage.',         cost:{ metal:40, electronics:8, chemicals:6 },           passiveWater:13 },
        { desc:'Lv8 — Purification tower. +16 water/day. Clean water bonus.',             cost:{ metal:50, electronics:12, chemicals:8 },          passiveWater:16 },
        { desc:'Lv9 — Full water plant. +20 water/day. Effectively unlimited.',           cost:{ metal:62, electronics:16, chemicals:12 },         passiveWater:20 },
        { desc:'Lv10 — Pressurised hydro system. +25 water/day. Feeds all buildings.',   cost:{ metal:78, electronics:22, chemicals:16, circuit_board:4 }, passiveWater:25 },
      ]
    },
    compost_bin: {
      name:'Compost Bin', icon:'♻️', maxLevel:2, unlockReq:4,
      levels:[
        { desc:'Lv0 — Not built. Converts waste to soil nutrients.',
          cost:{ wood:0 } },
        { desc:'Lv1 — Compost bin. +1 food/day from scraps.',
          cost:{ wood:12, rope:3, chemicals:2 } },
        { desc:'Lv2 — Full compost system. +2 food/day. Reduces hunger drain 5%.',
          cost:{ wood:18, chemicals:5, rope:5 } }
      ]
    },
    watchtower: {
      name:'Watchtower', icon:'🗼', maxLevel:3, unlockReq:5,
      levels:[
        { desc:'Lv0 — Not built. Spot raiders before they arrive.',
          cost:{ wood:0 } },
        { desc:'Lv1 — Wooden tower. Raid warning time +5s. +10 defence.',
          cost:{ wood:20, rope:6, metal:4 } },
        { desc:'Lv2 — Reinforced tower. Raid warning +10s. +20 defence.',
          cost:{ wood:30, metal:10, rope:8 } },
        { desc:'Lv3 — Armoured tower. Raid warning +20s. +35 defence.',
          cost:{ metal:20, electronics:6, rope:8 } }
      ]
    },
    workshop: {
      name:'Workshop', icon:'🔧', maxLevel:10, unlockReq:5,
      levels:[
        { desc:'Lv0 — Not built. Improves crafting efficiency.',
          cost:{ wood:0 }, craftDiscount:0, bikeBonus:0 },
        { desc:'Lv1 — Tool bench. Crafting costs -10%.',
          cost:{ wood:18, metal:6, rope:4 }, craftDiscount:0.10, bikeBonus:0 },
        { desc:'Lv2 — Equipped bench. Crafting -15%. Bike efficiency +10%.',
          cost:{ wood:24, metal:10, rope:4 }, craftDiscount:0.15, bikeBonus:0.10 },
        { desc:'Lv3 — Full workshop. Crafting -20%. Bike +15%.',
          cost:{ wood:30, metal:14, electronics:3 }, craftDiscount:0.20, bikeBonus:0.15 },
        { desc:'Lv4 — Power tools. Crafting -25%. Bike +20%.',
          cost:{ metal:20, electronics:6, chemicals:3 }, craftDiscount:0.25, bikeBonus:0.20 },
        { desc:'Lv5 — Machine shop. Crafting -30%. Bike +25%. Unlocks fast-craft mode.',
          cost:{ metal:28, electronics:8, chemicals:4 }, craftDiscount:0.30, bikeBonus:0.25 },
        { desc:'Lv6 — Advanced shop. Crafting -35%. Bike +30%.',
          cost:{ metal:36, electronics:12, chemicals:6 }, craftDiscount:0.35, bikeBonus:0.30 },
        { desc:'Lv7 — Precision workshop. Crafting -40%. Bike +35%. Rare drop chance +10%.',
          cost:{ metal:44, electronics:16, chemicals:8, rope:8 }, craftDiscount:0.40, bikeBonus:0.35 },
        { desc:'Lv8 — Industrial workshop. Crafting -45%. Bike +40%.',
          cost:{ metal:54, electronics:20, chemicals:12, circuit_board:3 }, craftDiscount:0.45, bikeBonus:0.40 },
        { desc:'Lv9 — High-tech lab. Crafting -50%. Bike +50%. Electric recipes unlocked.',
          cost:{ metal:65, electronics:26, chemicals:15, circuit_board:6, military_chip:2 }, craftDiscount:0.50, bikeBonus:0.50 },
        { desc:'Lv10 — Master forge. Crafting -60%. Bike +60%. All recipes available.',
          cost:{ metal:80, electronics:35, chemicals:20, circuit_board:10, military_chip:4 }, craftDiscount:0.60, bikeBonus:0.60 }
      ]
    },
    smokehouse: {
      name:'Smokehouse', icon:'🏭', maxLevel:2, unlockReq:6,
      levels:[
        { desc:'Lv0 — Not built. Preserve food to reduce spoilage.',
          cost:{ wood:0 } },
        { desc:'Lv1 — Smokehouse. Food stores last 2× longer.',
          cost:{ wood:20, metal:4, rope:6 } },
        { desc:'Lv2 — Curing house. Food 3× longer + +2 food/day.',
          cost:{ wood:28, metal:10, chemicals:4 } }
      ]
    },
    radio_tower: {
      name:'Radio Tower', icon:'📡', maxLevel:10, unlockReq:7,
      levels:[
        { desc:'Lv0 — Not built. Intercept raids, unlock special missions.',           cost:{ wood:0 },                                                              buildSecs:0,   raidReduce:0,    signalRange:0   },
        { desc:'Lv1 — Wooden mast + antenna. Raid chance -10%.',                       cost:{ wood:20, metal:10, rope:8 },                                           buildSecs:30,  raidReduce:0.10, signalRange:1   },
        { desc:'Lv2 — Signal dish. Raid chance -18%. Unlocks Signal Drop missions.',   cost:{ metal:18, electronics:8, rope:6 },                                     buildSecs:55,  raidReduce:0.18, signalRange:2   },
        { desc:'Lv3 — Repeater array. Raid chance -25%. Signal range increased.',      cost:{ metal:26, electronics:12, rope:6 },                                    buildSecs:85,  raidReduce:0.25, signalRange:3   },
        { desc:'Lv4 — Encrypted channel. Raid chance -32%. Unlocks Rescue Beacon.',    cost:{ metal:36, electronics:18, chemicals:4 },                               buildSecs:120, raidReduce:0.32, signalRange:4   },
        { desc:'Lv5 — Directional array. Raid chance -38%. Rare drops +15%.',          cost:{ metal:48, electronics:24, chemicals:6, circuit_board:2 },               buildSecs:165, raidReduce:0.38, signalRange:5   },
        { desc:'Lv6 — Hardened broadcast. Raid chance -44%. Unlocks Black Market.',    cost:{ metal:62, electronics:32, chemicals:8, circuit_board:4 },               buildSecs:220, raidReduce:0.44, signalRange:6   },
        { desc:'Lv7 — Spectrum scanner. Raid chance -50%. Enemy alerts +30s.',         cost:{ metal:78, electronics:42, chemicals:10, circuit_board:6, military_chip:2 }, buildSecs:285, raidReduce:0.50, signalRange:7   },
        { desc:'Lv8 — Military band. Raid chance -55%. Unlocks Command Bunker mission.',cost:{ metal:96, electronics:54, chemicals:14, circuit_board:8, military_chip:4 }, buildSecs:360, raidReduce:0.55, signalRange:8   },
        { desc:'Lv9 — Quantum antenna. Raid chance -60%. All raid types pre-warned.',   cost:{ metal:120, electronics:68, chemicals:18, circuit_board:12, military_chip:6 },buildSecs:450, raidReduce:0.60, signalRange:9   },
        { desc:'Lv10 — Global array. Raid chance -65%. Unlocks Endgame Transmission.', cost:{ metal:150, electronics:88, chemicals:24, circuit_board:18, military_chip:10},buildSecs:560, raidReduce:0.65, signalRange:10  },
      ]
    },
    alarm_system: {
      name:'Alarm System', icon:'🔔', maxLevel:2, unlockReq:8,
      levels:[
        { desc:'Lv0 — Not built. Trigger alarms on breach.',
          cost:{ wood:0 } },
        { desc:'Lv1 — Trip wire alarms. Raid damage -15%.',
          cost:{ metal:10, electronics:6, rope:8 } },
        { desc:'Lv2 — Auto-alarm grid. Raid damage -30%. Auto-activates fence.',
          cost:{ metal:18, electronics:12, chemicals:4 } }
      ]
    },
    medkit_station: {
      name:'Medical Station', icon:'🏥', maxLevel:3, unlockReq:9,
      levels:[
        { desc:'Lv0 — Not built. Heal faster and use meds more efficiently.',
          cost:{ wood:0 } },
        { desc:'Lv1 — First aid post. Medicine 25% more effective.',
          cost:{ metal:10, medicine:8, cloth:6 } },
        { desc:'Lv2 — Medical bay. Medicine 50% more effective. +1 medicine/day.',
          cost:{ metal:18, medicine:15, electronics:6 } },
        { desc:'Lv3 — Full clinic. Medicine 2× effective. Passively heal 1 energy/hour.',
          cost:{ metal:25, medicine:20, electronics:12, chemicals:8 } }
      ]
    },
    solar_station: {
      name:'Solar Station', icon:'☀️', maxLevel:10, unlockReq:9,
      levels:[
        { desc:'Lv0 — Not built yet.',                                                          cost:{ wood:0 },                                                        solarMult:1.0, nightPower:0  },
        { desc:'Lv1 — Single panel on stand. Solar output +20%.',                               cost:{ electronics:10, metal:8, rope:4 },                               solarMult:1.2, nightPower:1  },
        { desc:'Lv2 — Two panels and tracker. Solar +35%. +2 Wh stored overnight.',             cost:{ electronics:14, metal:12, rope:4 },                              solarMult:1.35,nightPower:2  },
        { desc:'Lv3 — Four-panel array. Solar +50%. +3 Wh overnight.',                          cost:{ electronics:18, metal:16, chemicals:2 },                         solarMult:1.5, nightPower:3  },
        { desc:'Lv4 — Tracking array. Solar +65%. +4 Wh overnight.',                            cost:{ electronics:25, metal:22, chemicals:3 },                         solarMult:1.65,nightPower:4  },
        { desc:'Lv5 — Eight-panel grid. Solar +80%. +6 Wh overnight. Powers fence.',            cost:{ electronics:33, metal:28, chemicals:5, circuit_board:2 },         solarMult:1.8, nightPower:6  },
        { desc:'Lv6 — High-efficiency cells. Solar x2.0. +8 Wh overnight.',                     cost:{ electronics:43, metal:35, chemicals:6, circuit_board:3 },         solarMult:2.0, nightPower:8  },
        { desc:'Lv7 — Concentrator array. Solar x2.5. +12 Wh overnight.',                       cost:{ electronics:55, metal:44, chemicals:8, circuit_board:5, military_chip:2 }, solarMult:2.5, nightPower:12 },
        { desc:'Lv8 — Bifacial panels. Solar x3.0. +16 Wh overnight.',                          cost:{ electronics:70, metal:55, chemicals:10, circuit_board:8, military_chip:3 }, solarMult:3.0, nightPower:16 },
        { desc:'Lv9 — Thermal-hybrid system. Solar x4.0. +22 Wh overnight.',                    cost:{ electronics:88, metal:68, chemicals:14, circuit_board:12, military_chip:5 },solarMult:4.0, nightPower:22 },
        { desc:'Lv10 — Micro power station. Solar x5.0. +30 Wh overnight. Always powered.',     cost:{ electronics:110, metal:85, chemicals:20, circuit_board:18, military_chip:8 },solarMult:5.0, nightPower:30 },
      ]
    },
    bunker: {
      name:'Bunker', icon:'🏗️', maxLevel:2, unlockReq:10,
      levels:[
        { desc:'Lv0 — Not built. Ultimate protection against raids.',
          cost:{ wood:0 } },
        { desc:'Lv1 — Underground bunker. Raid damage -40%. +50 defence.',
          cost:{ metal:40, electronics:15, chemicals:12, rope:10 } },
        { desc:'Lv2 — Fortified bunker. Raid damage -60%. +80 defence. Raid chance -20%.',
          cost:{ metal:60, electronics:25, chemicals:20, military_chip:6 } }
      ]
    },

    // ── BIKE UPGRADES — 10 levels ────────────────────────
    bike: {
      name:'Bike Upgrade', icon:'🚴', maxLevel:10,
      levels: [
        { desc:'Lv1 — Basic ride. Standard cargo. No light. Night riding risky.',
          cost:{ wood:0 },
          cargoBonus:1.0, hasLight:false, nightMult:1.0 },
        { desc:'Lv2 — Better tires + pannier bags. +25% cargo capacity.',
          cost:{ metal:4, cloth:3, rope:2 },
          cargoBonus:1.25, hasLight:false, nightMult:1.0 },
        { desc:'Lv3 — Front headlight. Craft Bike Light to mount. Can ride at night safely (+20% rewards).',
          cost:{ metal:6, electronics:2, rope:2 },
          cargoBonus:1.25, hasLight:true, nightMult:1.2 },
        { desc:'Lv4 — Reinforced frame. +50% cargo. Night rewards +25%.',
          cost:{ metal:10, rope:4, electronics:2 },
          cargoBonus:1.50, hasLight:true, nightMult:1.25 },
        { desc:'Lv5 — Cargo trailer. +75% cargo. Night +30% rewards.',
          cost:{ metal:14, rope:6, wood:8 },
          cargoBonus:1.75, hasLight:true, nightMult:1.30 },
        { desc:'Lv6 — Upgraded headlights + saddlebags. 2× cargo. Night +40% rewards.',
          cost:{ metal:18, electronics:6, rope:6 },
          cargoBonus:2.0, hasLight:true, nightMult:1.40 },
        { desc:'Lv7 — Heavy-duty frame + large trailer. 2.5× cargo. Night +50% rewards.',
          cost:{ metal:24, electronics:8, rope:8, chemicals:4 },
          cargoBonus:2.5, hasLight:true, nightMult:1.50 },
        { desc:'Lv8 — Night vision lights. 3× cargo. Night +65% rewards. Night encounter chance -10%.',
          cost:{ metal:30, electronics:14, chemicals:6, military_chip:1 },
          cargoBonus:3.0, hasLight:true, nightMult:1.65, nightEncounterReduction:0.10 },
        { desc:'Lv9 — Armoured cargo crates. 4× cargo. Night +80% rewards. Night encounter -20%.',
          cost:{ metal:40, electronics:18, chemicals:10, military_chip:3 },
          cargoBonus:4.0, hasLight:true, nightMult:1.80, nightEncounterReduction:0.20 },
        { desc:'Lv10 — Military cargo beast. 5× cargo. Night +100% rewards. Night encounter -30%.',
          cost:{ metal:55, electronics:25, chemicals:15, military_chip:6 },
          cargoBonus:5.0, hasLight:true, nightMult:2.0, nightEncounterReduction:0.30 }
      ]
    },
    powerhouse: {
      name:'Power House', icon:'⚡', maxLevel:1, unlockReq:6,
      levels: [
        { desc:'Lv0 — Not built. Build to access the Power Management panel.',
          cost:{ wood:0 } },
        { desc:'Lv1 — Power house built. Houses all generators. Access Power Panel to upgrade.',
          cost:{ wood:15, metal:10, rope:4 } }
      ]
    }
  },

  // ── Main render entry ─────────────────────
  render() {
    this._buildUI();
    this._switchTab(this._activeTab);
  },

  // ── Build the full tabbed UI ──────────────
  _buildUI() {
    const container = document.getElementById('crafting-container');
    if (!container) return;

    container.innerHTML = `
      <div class="crafting-tabs">
        <button class="craft-tab" data-tab="craft"    onclick="Crafting._switchTab('craft')">🔨 CRAFT</button>
        <button class="craft-tab" data-tab="inventory" onclick="Crafting._switchTab('inventory')">🎒 INVENTORY</button>
        <button class="craft-tab" data-tab="upgrades"  onclick="Crafting._switchTab('upgrades')">🏗 UPGRADES</button>
        <button class="craft-tab" data-tab="stats"     onclick="Crafting._switchTab('stats')">📊 STATS</button>
      </div>

      <!-- CRAFT panel -->
      <div class="crafting-panel" id="panel-craft">
        <div class="craft-layout">
          <div class="craft-categories" id="craft-categories"></div>
          <div class="craft-recipes"    id="craft-recipes"></div>
          <div class="craft-detail"     id="craft-detail">
            <p class="crafting-hint">← Select a recipe</p>
          </div>
        </div>
      </div>

      <!-- INVENTORY panel -->
      <div class="crafting-panel" id="panel-inventory">
        <div class="inventory-panel" id="inventory-content"></div>
      </div>

      <!-- UPGRADES panel -->
      <div class="crafting-panel" id="panel-upgrades">
        <div class="upgrades-panel" id="upgrades-content"></div>
      </div>

      <!-- STATS panel -->
      <div class="crafting-panel" id="panel-stats">
        <div class="stats-panel" id="stats-content"></div>
      </div>

      <div class="crafting-footer">
        <button class="btn-pixel btn-secondary" id="btn-back-from-crafting" style="max-width:200px">← BACK TO BASE</button>
      </div>
    `;

    // Re-bind back button
    document.getElementById('btn-back-from-crafting')
      ?.addEventListener('click', () => Game.goTo('base'));
  },

  // ── Switch active tab ─────────────────────
  _switchTab(tabId) {
    this._activeTab = tabId;

    document.querySelectorAll('.craft-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tabId);
    });
    document.querySelectorAll('.crafting-panel').forEach(p => {
      p.classList.toggle('active', p.id === `panel-${tabId}`);
    });

    switch (tabId) {
      case 'craft':     this._renderCraftTab();     break;
      case 'inventory': this._renderInventoryTab(); break;
      case 'upgrades':  this._renderUpgradesTab();  break;
      case 'stats':     this._renderStatsTab();     break;
    }
  },

  // ══════════════════════════════════════════
  // CRAFT TAB
  // ══════════════════════════════════════════
  _renderCraftTab() {
    this._renderCategories();
    this._renderRecipes();
  },

  _renderCategories() {
    const el = document.getElementById('craft-categories');
    if (!el) return;
    el.innerHTML = this.categories.map(cat => `
      <button class="craft-cat-btn ${cat.id === this._selectedCat ? 'active' : ''}"
              onclick="Crafting._selectCat('${cat.id}')">
        ${cat.label}
      </button>
    `).join('');
  },

  _selectCat(catId) {
    this._selectedCat    = catId;
    this._selectedRecipe = null;
    this._craftQty       = 1;
    this._renderCategories();
    this._renderRecipes();
    const detail = document.getElementById('craft-detail');
    if (detail) detail.innerHTML = '<p class="crafting-hint">← Select a recipe</p>';
  },

  _renderRecipes() {
    const el = document.getElementById('craft-recipes');
    if (!el) return;

    const list = Object.values(this.recipes)
      .filter(r => r.category === this._selectedCat);

    el.innerHTML = list.map(r => {
      const unlocked   = this._isUnlocked(r);
      const hasPwr     = r.requiresPower ? Power.hasPowerForCrafting(1) : true;
      const hasBench   = r.requiresPower ? (State.data.base.buildings.elecbench?.level||0) > 0 : true;
      const canCraft   = unlocked && this._canCraft(r, 1) && hasPwr && hasBench;
      const isSelected = this._selectedRecipe?.id === r.id;
      const needPwr    = r.requiresPower && !hasPwr;
      const needBench  = r.requiresPower && !hasBench;
      return `
        <div class="recipe-item
          ${canCraft ? 'craftable' : ''}
          ${isSelected ? 'selected' : ''}
          ${!unlocked ? 'locked' : ''}
          ${needPwr || needBench ? 'needs-power' : ''}"
          onclick="${unlocked ? `Crafting._selectRecipe('${r.id}')` : ''}">
          <span class="recipe-icon">${r.emoji}</span>
          <div class="recipe-info">
            <span class="recipe-name">${r.name}</span>
            <span class="recipe-type-tag">${needBench ? '🔬 NEED BENCH' : needPwr ? '⚡ NEED POWER' : r.type}</span>
          </div>
          <span class="recipe-status">${!unlocked ? '🔒' : canCraft ? '✓' : '✗'}</span>
        </div>
      `;
    }).join('') || '<p class="crafting-hint">No recipes yet</p>';
  },

  _selectRecipe(recipeId) {
    this._selectedRecipe = this.recipes[recipeId] || null;
    this._craftQty       = 1;
    this._renderRecipes();
    this._renderDetail();
  },

  _renderDetail() {
    const el     = document.getElementById('craft-detail');
    const recipe = this._selectedRecipe;
    if (!el || !recipe) return;

    const inv  = State.data.inventory;
    const qty  = this._craftQty;
    const can  = this._canCraft(recipe, qty);

    const ingsHTML = Object.entries(recipe.ingredients).map(([res, amt]) => {
      const need = amt * qty;
      const have = inv[res] || 0;
      const ok   = have >= need;
      return `
        <div class="ingredient-row ${ok ? 'have' : 'missing'}">
          <span>${this.emojiMap[res]||'📦'} ${res}</span>
          <span>${have} / ${need} ${ok ? '✓' : '✗'}</span>
        </div>
      `;
    }).join('');

    const effectStr = this._effectDescription(recipe);

    el.innerHTML = `
      <div class="detail-header">
        <div class="detail-big-icon">${recipe.emoji}</div>
        <div>
          <div class="detail-title">${recipe.name}</div>
          <div class="detail-type-badge">${recipe.type.toUpperCase()}</div>
        </div>
      </div>
      <div class="detail-desc">${recipe.desc}</div>
      ${effectStr ? `<div class="detail-effect">✨ ${effectStr}</div>` : ''}
      <div class="detail-ing-title">INGREDIENTS × ${qty}</div>
      <div class="detail-ingredients">${ingsHTML}</div>
      <div class="craft-qty-row">
        <span class="craft-qty-label">QUANTITY</span>
        <button class="qty-btn" onclick="Crafting._changeQty(-1)">-</button>
        <span class="qty-display" id="craft-qty-display">${qty}</span>
        <button class="qty-btn" onclick="Crafting._changeQty(1)">+</button>
      </div>
      <button class="btn-craft ${can ? 'can-craft' : 'cannot-craft'}"
              onclick="Crafting.craft('${recipe.id}')"
              ${can ? '' : 'disabled'}>
        ${can ? `🔨 CRAFT × ${qty}` : '❌ MISSING MATERIALS'}
      </button>
    `;
  },

  _changeQty(delta) {
    this._craftQty = Math.max(1, Math.min(10, this._craftQty + delta));
    this._renderDetail();
  },

  _effectDescription(recipe) {
    const e = recipe.effect;
    if (!e) return '';
    const parts = [];
    if (e.defenceRating)  parts.push(`🛡 Defence +${e.defenceRating}`);
    if (e.hasLight)       parts.push('🔦 Night expeditions unlocked');
    if (e.bikeEfficiency) parts.push(`🚴 Bike efficiency ×${e.bikeEfficiency}`);
    if (e.cargoBonus)     parts.push(`📦 Cargo ×${e.cargoBonus}`);
    if (e.hunger)         parts.push(`🍖 Hunger +${e.hunger}`);
    if (e.energy)         parts.push(`⚡ Energy +${e.energy}`);
    if (e.fullHeal)       parts.push('💊 Full stat restore');
    if (e.waterPerDraw)   parts.push(`💧 Well +${e.waterPerDraw} water/draw`);
    if (e.hasPower)       parts.push('⚡ Base power unlocked');
    if (e.passiveFood)    parts.push(`🌿 +${e.passiveFood} food/day`);
    if (e.raidReduction)  parts.push(`📡 Raid chance -${Math.round(e.raidReduction*100)}%`);
    if (e.armourBonus)    parts.push(`🦺 Damage reduced ${Math.round(e.armourBonus*100)}%`);
    if (e.elecBench)      parts.push('🔬 Unlocks Electric Bench + electric crafting');
    if (e.lights)         parts.push('💡 Base lighting (0.5W/hr drain)');
    if (e.elecFenceBoost) parts.push('⚡ Electric fence active (+60 def, 1W/hr)');
    if (e.electricPump)   parts.push('💧 Auto-pump 5 water/hr when powered');
    if (e.growLight)      parts.push('🌱 Greenhouse ×2 food production');
    if (e.giveItem)       parts.push(`📦 Produces 1× ${e.giveItem.replace('_',' ')}`);
    return parts.join(' | ');
  },

  // ── Check recipe unlocked ─────────────────
  _isUnlocked(recipe) {
    const cond = recipe.unlockCondition;
    if (!cond) return true;
    // Unlocked once player has ever had this resource (check discovered list)
    const discovered = State.data.world.discoveredResources || [];
    return discovered.includes(cond.resource) ||
           (State.data.inventory[cond.resource] || 0) >= cond.amount;
  },

  // ── Check craftability ────────────────────
  _canCraft(recipe, qty = 1) {
    return Object.entries(recipe.ingredients).every(([res, amt]) =>
      (State.data.inventory[res] || 0) >= amt * qty
    );
  },

  // ── Craft! ────────────────────────────────
  craft(recipeId) {
    const recipe = this.recipes[recipeId];
    const qty    = this._craftQty;
    if (!recipe || !this._canCraft(recipe, qty)) return;

    // Check electric bench requirement
    if (recipe.requiresPower) {
      const benchBuilt = (State.data.base.buildings.elecbench?.level || 0) > 0;
      if (!benchBuilt) {
        Utils.toast('🔬 Requires Electric Bench! Build it first at the Crafting Table.', 'bad', 4000);
        return;
      }
      if (!Power.hasPowerForCrafting(1)) {
        Utils.toast('⚡ No power! Build a generator first.', 'bad', 4000);
        return;
      }
      Power.consumePower(qty * 2); // Each electric craft costs 2W
    }

    // Consume ingredients × qty
    Object.entries(recipe.ingredients).forEach(([res, amt]) => {
      State.consumeResource(res, amt * qty);
    });

    // Show animation
    this._playCraftAnimation(recipe, () => {
      // Apply effects × qty
      Audio.sfxCraft();
      for (let i = 0; i < qty; i++) this._applyEffect(recipe);
      HUD.update();
      this._renderDetail();
      this._renderRecipes();
      Utils.toast(`🔨 Crafted ${qty}× ${recipe.emoji} ${recipe.name}!`, 'good');
      console.log('[Crafting] Crafted:', recipe.name, '×', qty);
    });
  },

  // ── Craft animation ───────────────────────
  _playCraftAnimation(recipe, onComplete) {
    const overlay = document.createElement('div');
    overlay.className = 'craft-anim-overlay';
    overlay.innerHTML = `
      <div class="craft-sparks" id="craft-sparks-container"></div>
      <div class="craft-anim-icon">${recipe.emoji}</div>
      <div class="craft-anim-label">CRAFTING ${recipe.name.toUpperCase()}...</div>
    `;
    document.body.appendChild(overlay);

    // Generate sparks
    const sparksContainer = document.getElementById('craft-sparks-container');
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const spark = document.createElement('div');
        spark.className = 'spark';
        const angle = Math.random() * Math.PI * 2;
        const dist  = Utils.randInt(60, 200);
        spark.style.cssText = `
          left: calc(50% + ${Math.cos(angle) * 10}px);
          top:  calc(45% + ${Math.sin(angle) * 10}px);
          --tx: ${Math.cos(angle) * dist}px;
          --ty: ${Math.sin(angle) * dist - 40}px;
          --dur: ${Utils.randFloat(0.5, 1.2)}s;
          background: ${['#ffd600','#ff6d00','#4caf50','#fff'][Utils.randInt(0,3)]};
        `;
        sparksContainer?.appendChild(spark);
      }, i * 40);
    }

    // Dismiss after animation
    setTimeout(() => {
      overlay.remove();
      onComplete();
    }, 1200);
  },

  // ── Apply effect ──────────────────────────
  _applyEffect(recipe) {
    const e = recipe.effect;
    if (!e) return;
    const p = State.data.player;
    const b = State.data.base;

    if (e.defenceRating)  b.defenceRating += e.defenceRating;
    if (e.hasLight)       b.hasLight = true;
    if (e.hasPower)       b.hasPower = true;
    if (e.waterPerDraw)   b.waterPerDraw = (b.waterPerDraw || 5) + e.waterPerDraw;
    if (e.passiveFood)    b.passiveFood  = (b.passiveFood  || 0) + e.passiveFood;
    if (e.raidReduction)  b.raidReduction = (b.raidReduction || 0) + e.raidReduction;
    if (e.storageMult)    b.storageMult   = (b.storageMult  || 1) * e.storageMult;
    if (e.bikeEfficiency) b.bikeEfficiency = (b.bikeEfficiency || 1) * e.bikeEfficiency;
    if (e.cargoBonus)     b.cargoBonus    = (b.cargoBonus   || 1) * e.cargoBonus;
    if (e.energyCostMult) b.energyCostMult = (b.energyCostMult || 1) * e.energyCostMult;
    if (e.armourBonus)    b.armourBonus   = (b.armourBonus  || 0) + e.armourBonus;

    if (e.hunger)    p.hunger = Utils.clamp(p.hunger + e.hunger, 0, 100);
    if (e.energy)    p.energy = Utils.clamp(p.energy + e.energy, 0, 100);
    if (e.fullHeal)  { p.hunger = 100; p.thirst = 100; p.energy = 100; }

    // Power system effects
    if (e.elecBench)     {
      if (!State.data.base.buildings.elecbench) State.data.base.buildings.elecbench = { level: 0 };
      State.data.base.buildings.elecbench.level = 1;
      Power.unlockConsumer('elecBench');
    }
    if (e.lights)        Power.unlockConsumer('lights');
    if (e.elecFenceBoost) {
      b.defenceRating += 60;
      Power.unlockConsumer('elecFence');
    }
    if (e.electricPump)  Power.unlockConsumer('waterPump');
    if (e.growLight)     b.passiveFood = (b.passiveFood || 0) + 3;
    if (e.giveItem) {
      // Component recipes give the crafted part to inventory
      State.addResource(e.giveItem, 1);
    }

    // Add to inventory if equippable
    if (['weapon','armour','bike'].includes(recipe.type)) {
      State.addItem(recipe);
    }
  },

  // ══════════════════════════════════════════
  // INVENTORY TAB
  // ══════════════════════════════════════════
  _renderInventoryTab() {
    const el = document.getElementById('inventory-content');
    if (!el) return;

    const inv = State.data.inventory;

    // Resources
    const resHTML = Object.entries(this.emojiMap).map(([res, emoji]) => {
      const qty = inv[res] || 0;
      return `
        <div class="inv-res-item ${qty === 0 ? 'zero' : ''}">
          <span class="inv-res-icon">${emoji}</span>
          <div class="inv-res-info">
            <span class="inv-res-name">${res}</span>
            <span class="inv-res-count">${qty}</span>
          </div>
        </div>
      `;
    }).join('');

    // Crafted items
    const itemsHTML = inv.items.length === 0
      ? '<p class="inv-empty">No crafted items yet. Get to the crafting table!</p>'
      : inv.items.map(item => {
          const equipped = State.data.player.equipment[item.type] === item.id;
          return `
            <div class="inv-item-row">
              <span class="inv-item-icon">${item.emoji || '📦'}</span>
              <div class="inv-item-info">
                <span class="inv-item-name">${item.name}</span>
                <span class="inv-item-qty">Qty: ${item.quantity || 1} · ${item.type}</span>
              </div>
              ${['weapon','armour'].includes(item.type) ? `
                <button class="inv-item-equip ${equipped ? 'equipped' : ''}"
                        onclick="Crafting._toggleEquip('${item.id}','${item.type}')">
                  ${equipped ? '✓ EQUIPPED' : 'EQUIP'}
                </button>
              ` : ''}
            </div>
          `;
        }).join('');

    el.innerHTML = `
      <div class="inv-section-title">📦 RESOURCES</div>
      <div class="inv-resources">${resHTML}</div>
      <div class="inv-section-title" style="margin-top:8px">🎒 CRAFTED ITEMS</div>
      <div class="inv-items">${itemsHTML}</div>
    `;
  },

  _toggleEquip(itemId, itemType) {
    const eq = State.data.player.equipment;
    if (eq[itemType] === itemId) {
      eq[itemType] = null;
      Utils.toast('Item unequipped', 'info');
    } else {
      eq[itemType] = itemId;
      const item = State.data.inventory.items.find(i => i.id === itemId);
      Utils.toast(`${item?.emoji||''} ${item?.name||itemId} equipped!`, 'good');
    }
    this._renderInventoryTab();
  },

  // ══════════════════════════════════════════
  // UPGRADES TAB
  // ══════════════════════════════════════════
  _renderUpgradesTab() {
    const el = document.getElementById('upgrades-content');
    if (!el) return;

    const shelterLv = State.data.base.buildings.house?.level || 1;

    // Power status bar
    const phLvl = State.data.base.buildings.powerhouse?.level || 0;
    const powerBar = phLvl > 0 ? (() => {
      const gen  = Power.getGenerationRate();
      const stor = Math.round(Power.getStored());
      const max  = Power.getMaxStorage();
      return `<div class="power-status-bar">
        <span>⚡ ${gen}W</span>
        ${max > 0 ? `<div class="bat-charge-wrap" style="width:80px;display:inline-block">
          <div class="bat-charge-bar" style="width:${max>0?Math.round((stor/max)*100):0}%;background:#ffd600"></div>
        </div> ${stor}/${max}Wh` : '<span style="color:#666">No battery</span>'}
        <button class="btn-pixel btn-secondary" onclick="Game.goTo('power')" style="padding:4px 8px;font-size:0.3rem">⚡ POWER PANEL</button>
      </div>`;
    })() : '';

    const allKeys = [
      'shelter','fence','well','storage','bike',
      'greenhouse','field','compost_bin','smokehouse',
      'workshop','rain_collector','watchtower','radio_tower',
      'powerhouse','elecbench','alarm_system','solar_station',
      'medkit_station','bunker',
    ];

    const tiles = allKeys.map(key => {
      const upg = this.baseUpgrades[key];
      if (!upg) return '';
      const reqLv     = upg.unlockReq || 0;
      const isLocked  = reqLv > shelterLv;
      const stKey     = key === 'shelter' ? 'house' : key;
      const curLv     = State.data.base.buildings[stKey]?.level || 0;
      const isMax     = curLv >= upg.maxLevel;
      const isNew     = reqLv > 0 && curLv === 0 && !isLocked;
      const nextCost  = !isMax && !isLocked ? this.baseUpgrades[key].levels[curLv] : null;
      const canAfford = nextCost ? this._canAffordUpgrade(nextCost.cost) : false;

      let statusDot = '';
      if (isLocked)      statusDot = '<span class="bld-dot bld-dot-locked">🔒</span>';
      else if (isMax)    statusDot = '<span class="bld-dot bld-dot-max">✓</span>';
      else if (isNew)    statusDot = '<span class="bld-dot bld-dot-new">NEW</span>';
      else if (canAfford)statusDot = '<span class="bld-dot bld-dot-ready">▲</span>';

      return `<button class="bld-tile ${isLocked?'bld-locked':''} ${isMax?'bld-maxed':''} ${isNew?'bld-new':''}"
        onclick="Crafting._openBuildingModal('${key}')"
        ${isLocked ? 'title="Locked — upgrade Shelter"' : ''}>
        <span class="bld-tile-icon">${upg.icon}</span>
        <span class="bld-tile-name">${upg.name}</span>
        <span class="bld-tile-lv">Lv ${curLv}/${upg.maxLevel}</span>
        ${statusDot}
      </button>`;
    }).join('');

    el.innerHTML = powerBar +
      `<div class="shelter-unlock-banner">🏠 SHELTER Lv${shelterLv} — tap a building to upgrade</div>` +
      `<div class="bld-grid">${tiles}</div>` +
      `<div class="bld-modal-backdrop hidden" id="bld-modal-backdrop" onclick="Crafting._closeBuildingModal()"></div>` +
      `<div class="bld-modal hidden" id="bld-modal"></div>`;
  },

  _openBuildingModal(key) {
    const upg      = this.baseUpgrades[key];
    const modal    = document.getElementById('bld-modal');
    const backdrop = document.getElementById('bld-modal-backdrop');
    if (!upg || !modal) return;

    const shelterLv  = State.data.base.buildings.house?.level || 1;
    const reqLv      = upg.unlockReq || 0;
    const isLocked   = reqLv > shelterLv;
    const stKey      = key === 'shelter' ? 'house' : key;
    const curLv      = State.data.base.buildings[stKey]?.level || 0;
    const isMax      = curLv >= upg.maxLevel;
    const nextDef    = !isMax ? upg.levels[curLv] : null;
    const canAfford  = nextDef ? this._canAffordUpgrade(nextDef.cost) : false;

    // Is THIS building currently under construction?
    const ab         = State.data.activeBuild;
    const isBuilding = ab && ab.key === key;
    const otherBuilding = ab && ab.key !== key;

    // Level pips
    const pips = Array.from({length: upg.maxLevel}, (_,i) =>
      `<div class="level-pip ${i < curLv ? 'filled' : ''}"></div>`
    ).join('');

    // Construction progress bar (shown when actively building)
    const buildProgressHTML = isBuilding ? (() => {
      const pct  = Math.round(((ab.secsTotal - ab.secsLeft) / ab.secsTotal) * 100);
      const secs = Math.ceil(ab.secsLeft);
      const cpm  = Cadence.getCPM();
      const bonus = Math.max(0, (cpm - 60) / 10) * 0.5;
      const speedStr = bonus > 0 ? ` ⚡ +${bonus.toFixed(1)}s/tick from biking!` : ' Bike faster to speed up!';
      return `<div class="bld-build-progress">
        <div class="bld-build-header">🏗 UNDER CONSTRUCTION — ${secs}s remaining${speedStr}</div>
        <div class="bld-build-bar-wrap">
          <div class="bld-build-bar" style="width:${pct}%"></div>
        </div>
      </div>`;
    })() : '';

    // Cost breakdown (only show if not currently building this)
    const buildTimeStr = `⏱ Build time: 10s (bike to reduce)`;
    const costHTML = isBuilding
      ? ''  // replaced by progress bar above
      : isLocked
        ? `<div class="bld-modal-cost locked">🔒 Requires Shelter Lv${reqLv}</div>`
        : isMax
          ? `<div class="bld-modal-cost maxed">✅ MAX LEVEL REACHED</div>`
          : (() => {
              const rows = Object.entries(nextDef.cost)
                .filter(([,v]) => v > 0)
                .map(([r,v]) => {
                  const have = State.data.inventory[r] || 0;
                  const ok   = have >= v;
                  const em   = this.emojiMap[r] || '📦';
                  return `<div class="bld-cost-row ${ok?'ok':'short'}">
                    <span>${em} ${r}</span>
                    <span>${have}/${v} ${ok?'✓':'✗'}</span>
                  </div>`;
                }).join('');
              return (rows
                ? `<div class="bld-modal-cost"><div class="bld-cost-header">Cost to upgrade:</div>${rows}</div>`
                : `<div class="bld-modal-cost ok">Free upgrade!</div>`)
                + `<div class="bld-build-time">${buildTimeStr}</div>`;
            })();

    // All levels list
    const levelsHTML = upg.levels.map((lv, i) => {
      const done = i < curLv;
      const curr = i === curLv - 1;
      return `<div class="bld-lv-row ${curr?'current':''} ${done&&!curr?'done':''}">
        <span class="bld-lv-num">${done||curr?'✓':i+1}</span>
        <span class="bld-lv-desc">${lv.desc}</span>
      </div>`;
    }).join('');

    let btnLabel, btnDisabled;
    if (isBuilding) {
      btnLabel = '🏗 BUILDING…'; btnDisabled = true;
    } else if (isLocked) {
      btnLabel = '🔒 LOCKED'; btnDisabled = true;
    } else if (isMax) {
      btnLabel = '✓ MAXED'; btnDisabled = true;
    } else if (otherBuilding) {
      btnLabel = `🚧 BUSY: ${ab.upg.name}`; btnDisabled = true;
    } else if (!canAfford) {
      btnLabel = '❌ NEED RESOURCES'; btnDisabled = true;
    } else {
      btnLabel = curLv === 0 ? '🔨 BUILD' : '▲ UPGRADE'; btnDisabled = false;
    }

    modal.innerHTML = `
      <div class="bld-modal-header">
        <span class="bld-modal-icon">${upg.icon}</span>
        <div class="bld-modal-title-block">
          <span class="bld-modal-name">${upg.name}</span>
          <span class="bld-modal-sublv">Level ${curLv} / ${upg.maxLevel}</span>
        </div>
        <button class="bld-modal-close" onclick="Crafting._closeBuildingModal()">✕</button>
      </div>
      <div class="bld-modal-pips">${pips}</div>
      <div class="bld-modal-scroll">
        ${buildProgressHTML}
        ${costHTML}
        <div class="bld-lv-list">${levelsHTML}</div>
      </div>
      <button class="btn-upgrade bld-modal-btn ${isMax?'maxed':''} ${isBuilding?'building':''}"
        onclick="Crafting._upgradeBuilding('${key}')"
        ${btnDisabled ? 'disabled' : ''}>
        ${btnLabel}
      </button>
    `;

    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
  },

  _closeBuildingModal() {
    document.getElementById('bld-modal')?.classList.add('hidden');
    document.getElementById('bld-modal-backdrop')?.classList.add('hidden');
  },


  _canAffordUpgrade(cost) {
    return Object.entries(cost).every(([res, amt]) =>
      amt === 0 || (State.data.inventory[res] || 0) >= amt
    );
  },

  _upgradeBuilding(buildingKey) {
    const upg  = this.baseUpgrades[buildingKey];
    if (!upg) return;
    const b    = State.data.base.buildings;

    const stateKey = buildingKey === 'shelter' ? 'house' : buildingKey;
    if (!b[stateKey]) b[stateKey] = { level: buildingKey === 'shelter' ? 1 : 0 };

    const currentLevel = b[stateKey].level;
    if (currentLevel >= upg.maxLevel) return;

    const nextLevel = upg.levels[currentLevel];
    if (!nextLevel || !this._canAffordUpgrade(nextLevel.cost)) return;

    // Block if another build is already running
    if (State.data.activeBuild) {
      Utils.toast('🚧 Already constructing! Bike to finish faster.', 'warn');
      return;
    }

    // Consume resources immediately
    Object.entries(nextLevel.cost).forEach(([res, amt]) => {
      if (amt > 0) State.consumeResource(res, amt);
    });

    // Build time: use per-level buildSecs if defined, else scale by level
    const levelDef = upg.levels ? (upg.levels[currentLevel] || {}) : {};
    const buildSecs = levelDef.buildSecs
      ? levelDef.buildSecs
      : Math.max(10, 10 + (currentLevel * 8));

    State.data.activeBuild = {
      key:       buildingKey,
      stateKey:  stateKey,
      newLevel:  currentLevel + 1,
      secsLeft:  buildSecs,
      secsTotal: buildSecs,
      upg:       upg,
    };

    Utils.toast(`🏗 Building ${upg.name}… pedal to speed it up!`, 'info', 3000);
    Audio.sfxCraft();
    this._closeBuildingModal();
    this._renderUpgradesTab();
    this._startBuildTimer();
    HUD.update();
  },

  // ── Build timer ───────────────────────────
  _buildTimer: null,

  _startBuildTimer() {
    if (this._buildTimer) clearInterval(this._buildTimer);
    this._buildTimer = setInterval(() => this._tickBuild(), 1000);
  },

  _tickBuild() {
    const ab = State.data.activeBuild;
    if (!ab) { clearInterval(this._buildTimer); this._buildTimer = null; return; }

    // CPM bonus: every 10 CPM above 60 shaves 0.5 extra seconds per tick
    const cpm   = Cadence.getCPM();
    const bonus = Math.max(0, (cpm - 60) / 10) * 0.5;
    ab.secsLeft = Math.max(0, ab.secsLeft - 1 - bonus);

    // Update tile countdown display
    this._refreshBuildTile(ab.key);

    // If modal is open for this building, refresh it
    const modal = document.getElementById('bld-modal');
    if (modal && !modal.classList.contains('hidden')) {
      this._openBuildingModal(ab.key);
    }

    if (ab.secsLeft <= 0) this._completeBuild();
  },

  _refreshBuildTile(key) {
    const ab = State.data.activeBuild;
    document.querySelectorAll('.bld-tile').forEach(t => {
      if (t.getAttribute('onclick')?.includes(`'${key}'`)) {
        const lvEl = t.querySelector('.bld-tile-lv');
        if (lvEl && ab) lvEl.textContent = `🏗 ${Math.ceil(ab.secsLeft)}s`;
      }
    });
  },

  _completeBuild() {
    clearInterval(this._buildTimer);
    this._buildTimer = null;

    const ab = State.data.activeBuild;
    if (!ab) return;
    State.data.activeBuild = null;

    const b = State.data.base.buildings;
    b[ab.stateKey].level = ab.newLevel;

    // Shelter unlocks
    if (ab.key === 'shelter') {
      const unlocks = ab.upg.levels[ab.newLevel - 1]?.unlocks || [];
      unlocks.forEach(bldKey => {
        if (!b[bldKey]) b[bldKey] = { level: 0 };
        Utils.toast(`🔓 ${this.baseUpgrades[bldKey]?.name || bldKey} UNLOCKED!`, 'good');
      });
      if (unlocks.length > 0) setTimeout(() => Audio.sfxUnlock?.(), 300);
    }

    this._applyBuildingUpgrade(ab.key, ab.newLevel);
    Utils.toast(`✅ ${ab.upg.name} upgraded to Lv${ab.newLevel}!`, 'good', 4000);
    Audio.sfxVictory?.();
    this._renderUpgradesTab();
    HUD.update();
    Base.updateNight();
  },

  _applyBuildingUpgrade(buildingKey, newLevel) {
    const b = State.data.base;
    switch (buildingKey) {
      case 'fence': {
        // Defence bonuses per level (cumulative on upgrade, not absolute)
        const fBonuses = [0, 8, 12, 18, 25, 35, 50, 65, 80, 100];
        // We store the fence's contribution separately so we can recalc
        const prevBonus = [0, 0, 8, 20, 38, 63, 98, 148, 213, 293][newLevel - 1] || 0;
        const curBonus  = [0, 0, 8, 20, 38, 63, 98, 148, 213, 293][newLevel] || 0;
        b.defenceRating += (curBonus - prevBonus);
        // Level 9 extra bonus when powered
        if (newLevel >= 9) {
          const pw = State.data.power;
          const hasPowerNow = pw && (pw.stored > 0 || typeof Power !== 'undefined' && Power.getGenerationRate() > 0);
          if (hasPowerNow) b.defenceRating += 20; // extra electric bonus
        }
        break;
      }
      case 'well': {
        const wDef = this.baseUpgrades.well.levels[newLevel - 1] || {};
        b.waterPerDraw  = wDef.waterPerUse   || 5;
        if (wDef.passiveWater) {
          b.wellPassiveWater = wDef.passiveWater;
          b.passiveWater = (b.wellPassiveWater || 0) + (b.rainPassiveWater || 0);
        }
        if (newLevel >= 8) Utils.toast('💧 Purified water now restores +2 health per drink!','good',4000);
        if (newLevel === 9) Utils.toast('⚡ Hydro plant generates 1Wh bonus power!','good',4000);
        break;
      }
      case 'shelter':
        b.shelterLevel = newLevel;
        // Apply sleep energy bonuses
        const sleepBonus = [0, 0.10, 0.10, 0.15, 0.15, 0.25, 0.25, 0.40, 0.40, 0.50];
        b.sleepEnergyBonus = sleepBonus[newLevel - 1] || 0;
        // Raid reduction from shelter
        const raidRed = [0, 0, 0, 0, 0.10, 0.10, 0.20, 0.20, 0.20, 0.50];
        b.shelterRaidReduction = raidRed[newLevel - 1] || 0;
        // Hunger/thirst drain reduction (lv9+)
        b.shelterStatDrainMult = newLevel >= 9 ? 0.80 : 1.0;
        break;
      case 'storage': {
        const sLvl  = this.baseUpgrades.storage.levels[newLevel - 1] || {};
        if (sLvl.storeCapA !== undefined) b.storageCapA = sLvl.storeCapA;
        if (sLvl.storeCapB !== undefined) b.storageCapB = sLvl.storeCapB;
        if (sLvl.storeCapC !== undefined) b.storageCapC = sLvl.storeCapC;
        if (sLvl.storeCapD !== undefined) b.storageCapD = sLvl.storeCapD;
        b.cargoBonus = (b.cargoBonus || 1) * 1.15; // small carry bonus per storage level
        if (newLevel === 3)  Utils.toast('🔓 Tier B storage unlocked! Electronics, meds, chemicals can now be stored!','good',4000);
        if (newLevel === 5)  Utils.toast('🔓 Tier C storage unlocked! Rare location materials can now be stored!','good',4000);
        if (newLevel === 8)  Utils.toast('🔓 Tier D storage unlocked! Electrical bench parts can now be stored!','good',4000);
        break;
      }
      case 'bike': {
        const bkDef = this.baseUpgrades.bike.levels[newLevel - 1] || {};
        b.bikeLvl         = newLevel;
        b.bikeCargoBonus  = bkDef.cargoBonus  || 1.0;
        b.bikeHasLight    = bkDef.hasLight     || false;
        b.bikeNightMult   = bkDef.nightMult    || 1.0;
        b.bikeNightEncounterReduction = bkDef.nightEncounterReduction || 0;
        // Update cargoBonus — combine base cargo + bike cargo
        b.cargoBonus = b.bikeCargoBonus; // bike is primary cargo source
        if (bkDef.hasLight && !State.data.base.bikeHasLight) {
          Utils.toast('💡 Bike light unlocked! You can now forage at night for higher rewards!','good',5000);
        }
        break;
      }
      case 'greenhouse':
        b.passiveFood  = [0, 1, 2, 3][newLevel - 1] || 0;
        b.passiveWater = [0, 0, 1, 2][newLevel - 1] || 0;
        break;
      case 'field':
        b.cropYield = [0, 2, 3, 5][newLevel - 1] || 0;
        break;
      case 'powerhouse':
        break;
      case 'rain_collector': {
        const rcDef = this.baseUpgrades.rain_collector.levels[newLevel] || {};
        b.passiveWater = rcDef.passiveWater || 0;
        if (newLevel === 4)  Utils.toast('💧 Water never runs out!', 'good', 3500);
        if (newLevel === 6)  Utils.toast('🌊 Cistern now gravity-feeds the well!', 'good', 3500);
        if (newLevel === 10) Utils.toast('🏭 Pressurised hydro system online!', 'good', 4000);
        break;
      }
      case 'compost_bin':
        b.passiveFood = (b.passiveFood || 0) + [1, 2][newLevel - 1] || 0;
        break;
      case 'watchtower':
        b.defenceRating += [10, 20, 35][newLevel - 1] || 0;
        b.raidWarningBonus = (b.raidWarningBonus || 0) + [5, 10, 20][newLevel - 1] || 0;
        break;
      case 'workshop': {
        const wsDef = this.baseUpgrades.workshop.levels[newLevel - 1] || {};
        b.craftCostMult  = 1 - (wsDef.craftDiscount || 0);
        b.bikeEfficiency = 1 + (wsDef.bikeBonus     || 0);
        if (newLevel === 5)  Utils.toast('🔧 Fast-craft mode unlocked!','good',3000);
        if (newLevel === 9)  Utils.toast('⚡ All electric recipes now available in workshop!','good',4000);
        if (newLevel === 10) Utils.toast('🏆 Master Forge! Crafting costs reduced by 60%!','good',5000);
        break;
      }
      case 'smokehouse':
        b.foodPreserveMult = [2, 3][newLevel - 1] || 1;
        b.passiveFood = (b.passiveFood || 0) + (newLevel >= 2 ? 2 : 0);
        break;
      case 'radio_tower': {
        const rtDef = this.baseUpgrades.radio_tower.levels[newLevel] || {};
        b.raidChanceReduction = rtDef.raidReduce || 0;
        b.radioSignalRange    = rtDef.signalRange || 0;
        if (newLevel >= 5)  b.radioRareDropBonus  = 0.15;
        if (newLevel >= 7)  b.radioAlertBonus     = 30;
        if (newLevel >= 9)  b.radioPrewarnAll     = true;
        // Unlock special missions at key levels
        const missionUnlocks = { 2:'signal_drop', 4:'rescue_beacon', 6:'black_market', 8:'command_bunker', 10:'endgame_transmission' };
        if (missionUnlocks[newLevel]) {
          if (!State.data.world.unlockedMissions) State.data.world.unlockedMissions = [];
          if (!State.data.world.unlockedMissions.includes(missionUnlocks[newLevel])) {
            State.data.world.unlockedMissions.push(missionUnlocks[newLevel]);
            const mNames = { signal_drop:'Signal Drop', rescue_beacon:'Rescue Beacon', black_market:'Black Market', command_bunker:'Command Bunker', endgame_transmission:'Endgame Transmission' };
            Utils.toast('📡 Mission unlocked: ' + mNames[missionUnlocks[newLevel]] + '!', 'good', 5000);
          }
        }
        const toasts = { 3:'📡 Signal range extended!', 7:'⚠️ Enemy alerts now 30s earlier!', 9:'🔊 ALL raid types pre-warned!', 10:'🌍 Global array online — 65% raid reduction!' };
        if (toasts[newLevel]) Utils.toast(toasts[newLevel], 'good', 4000);
        break;
      }
      case 'alarm_system':
        b.raidDamageReduction = (b.raidDamageReduction || 0) + [0.15, 0.30][newLevel - 1] || 0;
        break;
      case 'medkit_station':
        b.medEfficiency = [1.25, 1.50, 2.0][newLevel - 1] || 1;
        if (newLevel >= 2) b.passiveMed = (b.passiveMed || 0) + 1;
        break;
      case 'solar_station': {
        const ssDef = this.baseUpgrades.solar_station.levels[newLevel] || {};
        b.solarBoost      = ssDef.solarMult   || 1.0;
        b.solarNightPower = ssDef.nightPower  || 0;
        if (newLevel === 5)  Utils.toast('⚡ Solar now powers your electric fence!', 'good', 3500);
        if (newLevel === 10) Utils.toast('☀️ Micro power station — you are always powered!', 'good', 4000);
        break;
      }
      case 'bunker':
        b.defenceRating += [50, 80][newLevel - 1] || 0;
        b.raidDamageReduction = (b.raidDamageReduction || 0) + [0.40, 0.60][newLevel - 1] || 0;
        break;
    }
    Base.updateNight(); // Rebuild SVG to show new buildings
  },

  // ══════════════════════════════════════════
  // STATS TAB
  // ══════════════════════════════════════════
  _renderStatsTab() {
    const el = document.getElementById('stats-content');
    if (!el) return;

    const s = State.data.stats;
    const p = State.data.player;
    const w = State.data.world;
    const b = State.data.base;

    const survivalBars = [
      { label:'🍖 Hunger', val: p.hunger, color:'#ff8f00' },
      { label:'💧 Thirst', val: p.thirst, color:'#29b6f6' },
      { label:'⚡ Energy', val: p.energy, color:'#ffd600' }
    ].map(({ label, val, color }) => `
      <div class="stats-bar-row">
        <span class="stats-bar-label">${label}</span>
        <div class="stats-bar-wrap">
          <div class="stats-bar-fill" style="width:${val}%;background:${color}"></div>
        </div>
        <span class="stats-bar-pct">${Math.round(val)}%</span>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="stats-title">🧟 SURVIVOR STATS</div>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-card-icon">📅</span>
          <span class="stat-card-val">DAY ${w.day}</span>
          <span class="stat-card-label">Days Survived</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-icon">🛡</span>
          <span class="stat-card-val">${b.defenceRating}</span>
          <span class="stat-card-label">Defence Rating</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-icon">🗺️</span>
          <span class="stat-card-val">${s.totalExpeditions}</span>
          <span class="stat-card-label">Expeditions</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-icon">📦</span>
          <span class="stat-card-val">${s.totalResourcesGathered}</span>
          <span class="stat-card-label">Resources Found</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-icon">✅</span>
          <span class="stat-card-val">${s.raidsRepelled}</span>
          <span class="stat-card-label">Raids Repelled</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-icon">💀</span>
          <span class="stat-card-val">${s.raidsFailed}</span>
          <span class="stat-card-label">Raids Failed</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-icon">🖱️</span>
          <span class="stat-card-val">${s.totalClicksAllTime}</span>
          <span class="stat-card-label">Total Pedal Clicks</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-icon">🌙</span>
          <span class="stat-card-val">${w.unlockedLocations.length} / 8</span>
          <span class="stat-card-label">Locations Found</span>
        </div>
      </div>
      <div class="stats-title">❤️ SURVIVAL STATUS</div>
      <div class="stats-survival">${survivalBars}</div>
      <div class="stats-title">🏚 BASE STATUS</div>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-card-icon">${b.hasLight ? '🔦' : '🕯️'}</span>
          <span class="stat-card-val">${b.hasLight ? 'YES' : 'NO'}</span>
          <span class="stat-card-label">Night Expeditions</span>
        </div>
        <div class="stat-card">
          <span class="stat-card-icon">💧</span>
          <span class="stat-card-val">${b.waterPerDraw || 5}/draw</span>
          <span class="stat-card-label">Well Output</span>
        </div>
      </div>
    `;
  }

};
