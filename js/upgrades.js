// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — upgrades.js
// Building upgrade registry — shared between Crafting (recipe costs)
// and Base (upgrade UI). Previously embedded in Crafting.baseUpgrades.
//
// Access via:  BuildingUpgrades.shelter   etc.
// ═══════════════════════════════════════════════════════════════

const BuildingUpgrades = {
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
        { desc:'Lv8 — Electric pump fitted. Auto-pumps 8 water/hr when powered. +5 water/day.',
          cost:{ metal:30, electronics:8, copper_wire:4, chemicals:4 }, waterPerUse:70, passiveWater:5, electricPump:true },
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
          cost:{ metal:40, electronics:15, chemicals:6 }, elecFenceBoost: true },
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
      name:'Greenhouse', icon:'🌿', maxLevel:10,
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
      name:'Crop Field', icon:'🌾', maxLevel:10,
      levels: [
        { desc:'Lv0 — Not built. Requires Wild Seeds to plant.',
          cost:{ wood:0 }, buildSecs:0 },
        { desc:'Lv1 — 2 plots. Plant Wheat, Potato, Carrot. Basic yields.',
          cost:{ wild_seeds:5, wood:8, rope:2 }, buildSecs:30 },
        { desc:'Lv2 — 4 plots. Unlocks Beans + Herb. Build a trellis system.',
          cost:{ wild_seeds:10, wood:15, metal:4, rope:4 }, buildSecs:60 },
        { desc:'Lv3 — 6 plots. Unlocks Sunflower. +25% all yields. Irrigation channels.',
          cost:{ wild_seeds:15, wood:20, metal:8, chemicals:2 }, buildSecs:90 },
        { desc:'Lv4 — 8 plots. Unlocks Cave Shroom. Automated watering system.',
          cost:{ wild_seeds:20, metal:15, electronics:4, rope:6 }, buildSecs:120 },
        { desc:'Lv5 — 10 plots. Unlocks Mutant Crop. +50% all yields. Full agri-lab.',
          cost:{ wild_seeds:30, metal:25, electronics:8, chemicals:6, circuit_board:2 }, buildSecs:180 },
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
      name:'Compost Bin', icon:'♻️', maxLevel:10, unlockReq:4,
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
      name:'Watchtower', icon:'🗼', maxLevel:10, unlockReq:5,
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
      name:'Smokehouse', icon:'🏭', maxLevel:10, unlockReq:6,
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
      name:'Alarm System', icon:'🔔', maxLevel:10, unlockReq:8,
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
      name:'Medical Station', icon:'🏥', maxLevel:10, unlockReq:9,
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
      name:'Bunker', icon:'🏗️', maxLevel:10, unlockReq:10,
      levels:[
        { desc:'Lv0 — Not built. Ultimate protection against raids.',
          cost:{ wood:0 } },
        { desc:'Lv1 — Underground bunker. Raid damage -40%. +50 defence.',
          cost:{ metal:40, electronics:15, chemicals:12, rope:10 } },
        { desc:'Lv2 — Fortified bunker. Raid damage -60%. +80 defence. Raid chance -20%.',
          cost:{ metal:60, electronics:25, chemicals:20, military_chip:6 } }
      ]
    },

    woodburner: {
      name:'Wood Burner', icon:'🪵', maxLevel:10, unlockReq:3,
      levels:[
        { desc:'Lv0 — Not built yet.',                                           cost:{ wood:0 } },
        { desc:'Lv1 — Small wood stove. 3.5W. Burns 1 wood/day.',               cost:{ metal:4, wood:5 } },
        { desc:'Lv2 — Insulated stove. 7W. Burns 2 wood/day.',                  cost:{ metal:8, wood:8 } },
        { desc:'Lv3 — Double-burn chamber. 10.5W. Burns 3 wood/day.',           cost:{ metal:14, wood:10, rope:2 } },
        { desc:'Lv4 — Forced-draft burner. 14W. Burns 4 wood/day.',             cost:{ metal:20, wood:14, chemicals:2 } },
        { desc:'Lv5 — Gasifier burner. 17.5W. Burns 5 wood/day.',              cost:{ metal:28, wood:18, chemicals:3 } },
        { desc:'Lv6 — Recuperative system. 21W. Burns 6 wood/day.',             cost:{ metal:38, wood:24, chemicals:4 } },
        { desc:'Lv7 — High-temp ceramics. 24.5W. Burns 7 wood/day.',           cost:{ metal:50, wood:30, chemicals:5, electronics:4 } },
        { desc:'Lv8 — Waste-heat recovery. 28W. Burns 8 wood/day.',             cost:{ metal:64, wood:38, chemicals:7, electronics:6 } },
        { desc:'Lv9 — Plasma igniter. 31.5W. Burns 9 wood/day.',               cost:{ metal:80, wood:48, chemicals:10, electronics:10 } },
        { desc:'Lv10 — Micro-fusion burner. 35W. Burns 10 wood/day.',           cost:{ metal:100, wood:60, chemicals:14, electronics:15, circuit_board:3 } },
      ]
    },

    coal_plant: {
      name:'Coal Plant', icon:'⛏️', maxLevel:10, unlockReq:5,
      levels:[
        { desc:'Lv0 — Not built yet.',                                           cost:{ wood:0 } },
        { desc:'Lv1 — Basic coal furnace. 4W. Burns 1 coal/day.',               cost:{ metal:6, chemicals:2, rope:2 } },
        { desc:'Lv2 — Draft chimney. 8W. Burns 2 coal/day.',                    cost:{ metal:10, chemicals:3, rope:3 } },
        { desc:'Lv3 — Grated firebox. 12W. Burns 3 coal/day.',                  cost:{ metal:16, chemicals:4, rope:4 } },
        { desc:'Lv4 — Pressurised steam. 16W. Burns 4 coal/day.',               cost:{ metal:24, chemicals:5, electronics:2 } },
        { desc:'Lv5 — Turbine assist. 20W. Burns 5 coal/day.',                  cost:{ metal:34, chemicals:7, electronics:4 } },
        { desc:'Lv6 — Superheated steam. 24W. Burns 6 coal/day.',               cost:{ metal:46, chemicals:9, electronics:6 } },
        { desc:'Lv7 — Combined cycle. 28W. Burns 7 coal/day.',                  cost:{ metal:60, chemicals:12, electronics:8, circuit_board:2 } },
        { desc:'Lv8 — Heat exchanger. 32W. Burns 8 coal/day.',                  cost:{ metal:76, chemicals:16, electronics:12, circuit_board:3 } },
        { desc:'Lv9 — Plasma combustion. 36W. Burns 9 coal/day.',              cost:{ metal:95, chemicals:20, electronics:16, circuit_board:5 } },
        { desc:'Lv10 — Fusion-coal hybrid. 40W. Burns 10 coal/day.',            cost:{ metal:118, chemicals:26, electronics:22, circuit_board:8, military_chip:2 } },
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
      name:'Power House', icon:'⚡', maxLevel:10, unlockReq:6,
      levels: [
        { desc:'Lv0 — Not built. Build to access the Power Management panel.',
          cost:{ wood:0 } },
        { desc:'Lv1 — Power house built. Houses all generators. Access Power Panel to upgrade.',
          cost:{ wood:15, metal:10, rope:4 } }
      ]
    },

    // ── ELECTRIC BENCH — builds from base map (not crafting menu) ───────
    elecbench: {
      name:'Electric Bench', icon:'🔬', maxLevel:1, unlockReq:8,
      levels: [
        { desc:'Lv0 — Not built yet. Requires Shelter Lv8 + Power House.',
          cost:{ wood:0 } },
        { desc:'Lv1 — Electric bench built. Unlocks all electrical crafting and battery construction. Requires power to operate.',
          cost:{ metal:12, electronics:6, rope:4, circuit_board:2 },
          elecBench: true }
      ]
    },

    // ── DYNAMO BIKE — standalone pedal-to-charge building ───────────────
    dynamo_bike: {
      name:'Dynamo Bike', icon:'⚡', maxLevel:5, unlockReq:6,
      levels: [
        { desc:'Rickety dynamo rig. Generates up to 8W while pedalling. Chain drive, basic coil.',
          cost:{ metal:8, rope:4, electronics:2 },
          maxWatts: 8 },
        { desc:'Reinforced frame + better coil. Up to 16W. More efficient at low cadence.',
          cost:{ metal:14, rope:6, electronics:4 },
          maxWatts: 16 },
        { desc:'Dual-coil dynamo. Up to 24W. Voltage regulator fitted — no power waste.',
          cost:{ metal:22, electronics:8, rope:6, chemicals:2 },
          maxWatts: 24 },
        { desc:'High-output alternator. Up to 32W. Charges battery 50% faster.',
          cost:{ metal:32, electronics:14, chemicals:4, circuit_board:2 },
          maxWatts: 32 },
        { desc:'Military-spec dynamo. Up to 40W. Peak output rivals a small solar array.',
          cost:{ metal:45, electronics:22, chemicals:8, circuit_board:4, military_chip:2 },
          maxWatts: 40 }
      ]
    },

    // ── BASE LIGHTING — standalone building, 10 levels ───────────────────
    baselights: {
      name:'Base Lighting', icon:'💡', maxLevel:10, unlockReq:4,
      levels: [
        { desc:'Lv1 — 2 gate torches. Flickering light at the entrance. Uses 0.3W.',   cost:{ wood:8, rope:4 },                       drainW:0.3 },
        { desc:'Lv2 — 4 path lanterns. Lights the main path. Uses 0.5W.',              cost:{ wood:12, metal:4, rope:3 },             drainW:0.5 },
        { desc:'Lv3 — 6 pole lamps. Side of the path lit. Uses 0.8W.',                cost:{ metal:8, electronics:2, rope:4 },       drainW:0.8 },
        { desc:'Lv4 — 8 perimeter torches. Fence corners lit. Uses 1.2W.',            cost:{ metal:12, electronics:4, rope:4 },      drainW:1.2 },
        { desc:'Lv5 — 10 electric wall lamps. Bright zones around buildings. Uses 1.8W.',cost:{ metal:18, electronics:6, copper_wire:3 }, drainW:1.8 },
        { desc:'Lv6 — 12 floodlights. Wide coverage over work zones. Uses 2.5W.',      cost:{ metal:22, electronics:10, copper_wire:5 }, drainW:2.5 },
        { desc:'Lv7 — 14 high-mast lights. Illuminates full compound. Uses 3.5W.',     cost:{ metal:30, electronics:14, copper_wire:6, chemicals:2 }, drainW:3.5 },
        { desc:'Lv8 — 16 stadium lights. Near-daylight brightness. Uses 5W.',          cost:{ metal:40, electronics:20, copper_wire:8, circuit_board:2 }, drainW:5.0 },
        { desc:'Lv9 — 18 arc lamps. Base is fully daylit at night. Uses 7W.',          cost:{ metal:50, electronics:28, copper_wire:10, circuit_board:4 }, drainW:7.0 },
        { desc:'Lv10 — 20 solar arc towers. Zero-power daytime, full night coverage. Uses 10W or 0W in day.', cost:{ metal:65, electronics:38, copper_wire:14, circuit_board:6, military_chip:2 }, drainW:10.0 }
      ]
    }
};
