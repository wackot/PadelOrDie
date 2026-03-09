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
  // Canonical definition lives in Utils.emojiMap (shared with Power and others).
  // This getter keeps any existing Crafting.emojiMap references working.
  get emojiMap() { return Utils.emojiMap; },

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

    // NOTE: Electric Bench is now built via the base map building system (not crafted here)
    // STEP 1: Craft battery parts AT the electric bench (requires power)
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
    // NOTE: electric_pump removed — now built by upgrading Well to Lv8
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

  // ── Building upgrade registry ───────────────────────────────
  // Canonical definition lives in upgrades.js (BuildingUpgrades).
  // This getter keeps any existing Crafting.baseUpgrades references working.
  get baseUpgrades() { return BuildingUpgrades; },

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
      Events.emit('hud:update');
      this._renderDetail();
      this._renderRecipes();
      State.data.stats.totalCrafted = (State.data.stats.totalCrafted||0) + qty;
      // Track special crafted items for achievements
      if (recipe.id === 'circuit_board')  State.data.stats.craftedCircuitBoard  = (State.data.stats.craftedCircuitBoard ||0) + qty;
      if (recipe.id === 'military_chip')  State.data.stats.craftedMilitaryChip  = (State.data.stats.craftedMilitaryChip ||0) + qty;
      if (recipe.id === 'power_core')     State.data.stats.craftedPowerCore     = (State.data.stats.craftedPowerCore    ||0) + qty;
      Events.emit('achievements:check');
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
        <button class="btn-pixel btn-secondary" data-goto="power" style="padding:4px 8px;font-size:0.3rem">⚡ POWER PANEL</button>
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
      const cpm  = State.data.cadence?.clicksPerMinute ?? 0;
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
    let buildSecs = levelDef.buildSecs
      ? levelDef.buildSecs
      : Math.max(10, 10 + (currentLevel * 8));
    if (State.buildSecsFn) buildSecs = State.buildSecsFn(buildSecs);

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
    Events.emit('hud:update');
  },

  // ── Build timer ───────────────────────────
  _buildTimer: null,

  _startBuildTimer() {
    if (this._buildTimer) clearInterval(this._buildTimer);
    this._buildTimer = setInterval(() => this._tickBuild(), 1000);
  },

  _tickBuild() {
    if (State.devTickFn) State.devTickFn();
    const ab = State.data.activeBuild;
    if (!ab) { clearInterval(this._buildTimer); this._buildTimer = null; return; }

    // CPM bonus: pedalling speeds up construction.
    // At target CPM (90), build speed is 2× base (2s off per tick).
    // At 110+ CPM (fast), build speed is up to 3× base (3s per tick).
    // Idle (0 CPM) = 1s per tick (normal real-time build).
    const cpm   = State.data.cadence?.clicksPerMinute ?? 0;
    const tgt   = State.data.cadence?.targetCPM || 90;
    const ratio = Utils.clamp(cpm / tgt, 0, 2);
    // 1s base + up to 2s bonus at ratio=1.0+ (total 3s/tick at fast pedalling)
    const bonus = ratio * 2.0;
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
    State.data.stats.totalBuilds = (State.data.stats.totalBuilds||0) + 1;
    Events.emit('achievements:check');
    Utils.toast(`✅ ${ab.upg.name} upgraded to Lv${ab.newLevel}!`, 'good', 4000);
    Audio.sfxVictory?.();
    this._renderUpgradesTab();
    Events.emit('hud:update');
    Events.emit('map:changed');
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
        // Lv8 unlocks the electric pump consumer
        if (wDef.electricPump && typeof Power !== 'undefined') {
          Power.unlockConsumer('waterPump');
          Utils.toast('💧 Electric pump fitted! Auto-pumps water when powered.', 'good', 4000);
        }
        if (newLevel === 9) Utils.toast('⚡ Hydro plant generates 1Wh bonus power!','good',4000);
        break;
      }
      case 'baselights': {
        const blDef = this.baseUpgrades.baselights.levels[newLevel - 1] || {};
        // Register baselights drain in power system
        if (typeof Power !== 'undefined') {
          Power.setLightsDrain(blDef.drainW || 0);
          Power.unlockConsumer('lights');
        }
        Utils.toast(`💡 Base Lighting Lv${newLevel} installed! ${blDef.drainW}W drain when on.`, 'good', 4000);
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
        // Farming system handles yields per-plot — just record level
        b.cropYield = 0; // legacy: farming.js handles all yields now
        Events.emit('farming:field-unlocked', { level: newLevel });
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
        // Unlock radio power consumer at Lv1
        if (newLevel >= 1 && typeof Power !== 'undefined') Power.unlockConsumer('radio');
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
      case 'elecbench':
        // Unlock elecBench consumer and mark building as active
        if (typeof Power !== 'undefined') Power.unlockConsumer('elecBench');
        Utils.toast('🔬 Electric Bench online! Electrical crafting unlocked.', 'good', 4000);
        break;
    }
    Events.emit('map:changed'); // Rebuild SVG to show new buildings
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

// ── Event subscriptions ────────────────────────────────────────────────────
// Resume an in-progress build after load — main.js emits, Crafting handles.
Events.on('crafting:resume-build', () => {
  Crafting._startBuildTimer?.();
});

// Open a specific crafting tab — triggered by data-crafting-tab buttons.
Events.on('crafting:open-tab', ({ tab }) => {
  setTimeout(() => {
    Crafting.render?.();
    Crafting._selectCat?.(tab);
    Crafting._switchTab?.('craft');
  }, 120);
});

// Render the crafting screen — base.js navigates to 'crafting' then emits this.
Events.on('crafting:render', () => {
  Crafting.render?.();
});

// Trigger a building upgrade — base.js confirms, then emits this.
Events.on('crafting:upgrade-building', ({ upgKey }) => {
  Crafting._upgradeBuilding?.(upgKey);
});
