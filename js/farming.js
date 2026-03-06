// ═══════════════════════════════════════════════════════════
// PEDAL OR DIE — farming.js  (v2 — Advanced Farming)
// ─────────────────────────────────────────────────────────
// • 10 individual plots, unlocked 2 at a time per field level
// • 8 crop types: unique grow times, water needs, yields
// • Per-plot state machine: empty → growing → ready
// • Passive water drain each dawn; manual water top-up
// • Dedicated full-screen UI with SVG plot art
// ═══════════════════════════════════════════════════════════

const Farming = {

  // ── Crop definitions ──────────────────────────────────────
  crops: {
    wheat: {
      id:'wheat', name:'Wild Wheat', emoji:'🌾',
      rarity:'common', rarityColor:'#8bc34a',
      stemColor:'#7a6a15', topColor:'#d4b020',
      growDays:2, waterPerDay:1,
      seedItem:'seeds_wheat',
      seedSource:'Abandoned Farm foraging',
      desc:'Fast-growing staple. Reliable food every 2 days.',
      yield:{ food:[3,6] }, minFieldLevel:1,
    },
    potato: {
      id:'potato', name:'Mutant Potato', emoji:'🥔',
      rarity:'common', rarityColor:'#8bc34a',
      stemColor:'#5a4a20', topColor:'#9a7a35',
      growDays:3, waterPerDay:2,
      seedItem:'seeds_potato',
      seedSource:'Abandoned Farm (rare drop)',
      desc:'High calorie root. Thirsty crop — keep it watered.',
      yield:{ food:[5,10] }, minFieldLevel:1,
    },
    carrot: {
      id:'carrot', name:'Orange Root', emoji:'🥕',
      rarity:'common', rarityColor:'#8bc34a',
      stemColor:'#2a6a18', topColor:'#ff8c00',
      growDays:3, waterPerDay:1,
      seedItem:'seeds_carrot',
      seedSource:'Abandoned Farm or craft: wild_seeds×3 + food×2',
      desc:'Dual-purpose: food and medicine. Low water needs.',
      yield:{ food:[3,6], medicine:[0,1] }, minFieldLevel:1,
    },
    beans: {
      id:'beans', name:'Climbing Beans', emoji:'🫘',
      rarity:'uncommon', rarityColor:'#ffd740',
      stemColor:'#1a5a10', topColor:'#3a9020',
      growDays:4, waterPerDay:2,
      seedItem:'seeds_beans',
      seedSource:'Craft: wild_seeds×5 + wood×4 + rope×2',
      desc:'Protein-rich legume. Needs a trellis (Field Lv2+).',
      yield:{ food:[7,13] }, minFieldLevel:2,
    },
    herb: {
      id:'herb', name:'Medicinal Herb', emoji:'🌿',
      rarity:'uncommon', rarityColor:'#ffd740',
      stemColor:'#0a4a10', topColor:'#20a030',
      growDays:4, waterPerDay:1,
      seedItem:'seeds_herb',
      seedSource:'Forest (rare) or craft: spores×3 + wild_seeds×2',
      desc:'Heals and crafts. Slow but medicine is precious.',
      yield:{ medicine:[2,5], food:[1,2] }, minFieldLevel:2,
    },
    sunflower: {
      id:'sunflower', name:'Giant Sunflower', emoji:'🌻',
      rarity:'uncommon', rarityColor:'#ffd740',
      stemColor:'#5a7010', topColor:'#ffd700',
      growDays:5, waterPerDay:2,
      seedItem:'seeds_sunflower',
      seedSource:'Craft: wild_seeds×4 + chemicals×2',
      desc:'Yields chemicals and food. Tall — requires Field Lv3+.',
      yield:{ food:[4,8], chemicals:[1,3] }, minFieldLevel:3,
    },
    mushroom: {
      id:'mushroom', name:'Cave Shroom', emoji:'🍄',
      rarity:'rare', rarityColor:'#ff6e40',
      stemColor:'#5a2a18', topColor:'#b04828',
      growDays:6, waterPerDay:0, noWater:true,
      seedItem:'seeds_mushroom',
      seedSource:'Cave foraging or craft: spores×5 + chemicals×1',
      desc:'Thrives in darkness. No water needed. Rare drops.',
      yield:{ food:[4,8], spores:[1,3], medicine:[0,2] }, minFieldLevel:4,
    },
    mutant: {
      id:'mutant', name:'MUTANT CROP', emoji:'☣️',
      rarity:'legendary', rarityColor:'#e040fb',
      stemColor:'#1a3a08', topColor:'#30ff30',
      growDays:7, waterPerDay:3,
      seedItem:'seeds_mutant',
      seedSource:'Military Base or craft: wild_seeds×10 + chemicals×5 + medicine×3',
      desc:'Irradiated. Dangerous. Legendary yields. Field Lv5+ only.',
      yield:{ food:[12,22], chemicals:[3,7], medicine:[2,5], wild_seeds:[1,3] }, minFieldLevel:5,
    },
  },

  _plotsForLevel(lv) { return Math.min(10, Math.max(0, lv * 2)); },

  _ensureState() {
    if (!State.data.farming) State.data.farming = { plots:[] };
    const f = State.data.farming;
    while (f.plots.length < 10) f.plots.push({ state:'empty', crop:null, daysLeft:0, waterDebt:0 });
    Object.values(this.crops).forEach(c => {
      if (!(c.seedItem in State.data.inventory)) State.data.inventory[c.seedItem] = 0;
    });
  },

  // ── Daily growth tick ─────────────────────────────────────
  dailyTick() {
    this._ensureState();
    const plots    = State.data.farming.plots;
    const fieldLv  = State.data.base.buildings?.field?.level || 0;
    const maxPlots = this._plotsForLevel(fieldLv);
    const readyNow = [], needWater = [];

    for (let i = 0; i < maxPlots; i++) {
      const p = plots[i];
      if (p.state !== 'growing') continue;
      const crop = this.crops[p.crop];
      if (!crop) { p.state = 'empty'; continue; }

      if ((crop.waterPerDay || 0) > 0) {
        const w    = State.data.inventory.water || 0;
        const take = Math.min(crop.waterPerDay, w);
        State.data.inventory.water = Math.max(0, w - take);
        if (take < crop.waterPerDay) {
          p.waterDebt = (p.waterDebt || 0) + (crop.waterPerDay - take);
          needWater.push(i + 1);
        }
      }

      p.daysLeft = Math.max(0, (p.daysLeft || 1) - 1);
      if (p.daysLeft === 0) { p.state = 'ready'; readyNow.push(crop); }
    }

    if (readyNow.length) {
      const names = [...new Set(readyNow.map(c => c.emoji + ' ' + c.name))].join(', ');
      Utils.toast('🌾 Ready to harvest: ' + names, 'good', 5000);
    }
    if (needWater.length) Utils.toast('💧 Plots ' + needWater.join(', ') + ' ran dry — yield reduced!', 'warn', 4000);
    Events.emit('achievements:check');
  },

  // ── Plant ─────────────────────────────────────────────────
  plant(idx, cropId) {
    this._ensureState();
    const plot    = State.data.farming.plots[idx];
    const crop    = this.crops[cropId];
    const fieldLv = State.data.base.buildings?.field?.level || 0;
    if (!plot || plot.state !== 'empty' || !crop) return;
    if (fieldLv < crop.minFieldLevel) { Utils.toast('🔒 ' + crop.name + ' needs Field Lv' + crop.minFieldLevel, 'bad', 3000); return; }
    if ((State.data.inventory[crop.seedItem] || 0) < 1) { Utils.toast('No ' + crop.name + ' seeds! ' + crop.seedSource, 'bad', 3500); return; }
    State.data.inventory[crop.seedItem]--;
    plot.state = 'growing'; plot.crop = cropId; plot.daysLeft = crop.growDays; plot.waterDebt = 0;
    Utils.toast('🌱 Plot ' + (idx+1) + ': ' + crop.emoji + ' ' + crop.name + ' planted. ' + crop.growDays + 'd to grow.', 'good', 3000);
    this._plantingIdx = null;
    this.render();
  },

  // ── Harvest ───────────────────────────────────────────────
  harvest(idx) {
    this._ensureState();
    const plot   = State.data.farming.plots[idx];
    const crop   = this.crops[plot && plot.crop];
    if (!plot || plot.state !== 'ready' || !crop) return;
    const fieldLv = State.data.base.buildings?.field?.level || 0;
    const penalty = Math.max(0.4, 1 - (plot.waterDebt || 0) * 0.08);
    const bonus   = fieldLv >= 5 ? 1.5 : fieldLv >= 3 ? 1.25 : 1.0;
    let log = '';
    Object.entries(crop.yield).forEach(function(entry) {
      var res = entry[0], range = entry[1];
      var mn = range[0], mx = range[1];
      var amt = mn > 0
        ? Math.max(1, Math.round(Utils.randInt(mn, mx) * penalty * bonus))
        : Math.round(Utils.randInt(mn, mx) * penalty * bonus);
      State.addResource(res, amt);
      log += ' ' + _farmResEmoji(res) + '+' + amt;
    });
    if (Math.random() < 0.3) { State.data.inventory[crop.seedItem]++; log += ' 🌱+1'; }
    Utils.toast('✅ ' + crop.emoji + ' ' + crop.name + ' harvested!' + log, 'good', 4000);
    plot.state = 'empty'; plot.crop = null; plot.daysLeft = 0; plot.waterDebt = 0;
    Events.emit('achievements:check');
    Events.emit('hud:update');
    this.render();
  },

  harvestAll() {
    this._ensureState();
    const max = this._plotsForLevel(State.data.base.buildings?.field?.level || 0);
    for (let i = 0; i < max; i++) {
      if (State.data.farming.plots[i] && State.data.farming.plots[i].state === 'ready') this.harvest(i);
    }
  },

  water(idx) {
    var plot = State.data.farming.plots[idx];
    if (!plot || plot.state !== 'growing') return;
    if ((State.data.inventory.water || 0) < 1) { Utils.toast('💧 No water!', 'bad', 2000); return; }
    State.data.inventory.water--;
    plot.waterDebt = Math.max(0, (plot.waterDebt || 0) - 2);
    Utils.toast('💧 Plot ' + (idx+1) + ' watered.', 'good', 1500);
    Events.emit('hud:update'); this.render();
  },

  uproot(idx) {
    var plot = State.data.farming.plots[idx];
    if (!plot || plot.state === 'empty') return;
    plot.state = 'empty'; plot.crop = null; plot.daysLeft = 0; plot.waterDebt = 0;
    this._plantingIdx = null;
    Utils.toast('Plot ' + (idx+1) + ' cleared.', 'info', 1500);
    this.render();
  },

  // ── Navigation ────────────────────────────────────────────
  _prevScreen: 'base', _tab: 'plots', _plantingIdx: null,

  open() {
    this._ensureState();
    this._prevScreen = (State.data && State.data.world && State.data.world.currentScreen) || 'base';
    this._plantingIdx = null;
    Events.emit('navigate', { screen: 'farming' });
    this.render();
  },
  close()         { this._plantingIdx = null; Events.emit('navigate', { screen: this._prevScreen }); },
  setTab(t)       { this._tab = t; this._plantingIdx = null; this.render(); },
  startPlanting(i){ this._plantingIdx = i; this._tab = 'plots'; this.render(); },
  cancelPlanting(){ this._plantingIdx = null; this.render(); },

  // ════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════
  render() {
    var el = document.getElementById('farming-content');
    if (!el) return;
    this._ensureState();

    var fieldLv  = (State.data.base.buildings && State.data.base.buildings.field && State.data.base.buildings.field.level) || 0;
    var maxPlots = this._plotsForLevel(fieldLv);
    var plots    = State.data.farming.plots;

    if (fieldLv === 0) {
      el.innerHTML = '<div class="fm-screen fm-locked-screen">' +
        '<div class="fm-header"><span class="fm-title">🌾 CROP FIELD</span>' +
        '<button class="fm-close" onclick="Farming.close()">✕</button></div>' +
        '<div class="fm-locked-body">' +
        '<div class="fm-lock-icon">🌾</div>' +
        '<div class="fm-lock-heading">FIELD NOT BUILT</div>' +
        '<div class="fm-lock-sub">Upgrade your Shelter to unlock the Crop Field, then build it at the Crafting Table.</div>' +
        '<button class="fm-back btn-pixel btn-secondary" onclick="Farming.close()">← BACK</button>' +
        '</div></div>';
      return;
    }

    var ready   = plots.slice(0,maxPlots).filter(function(p){return p.state==='ready';}).length;
    var growing = plots.slice(0,maxPlots).filter(function(p){return p.state==='growing';}).length;
    var empty   = plots.slice(0,maxPlots).filter(function(p){return p.state==='empty';}).length;
    var water   = State.data.inventory.water || 0;

    el.innerHTML =
      '<div class="fm-screen">' +
        '<div class="fm-header">' +
          '<div class="fm-header-left">' +
            '<span class="fm-title">🌾 CROP FIELD</span>' +
            '<span class="fm-subtitle">Level ' + fieldLv + ' &nbsp;·&nbsp; ' + maxPlots + ' plots unlocked</span>' +
          '</div>' +
          '<button class="fm-close" onclick="Farming.close()">✕</button>' +
        '</div>' +
        '<div class="fm-stats-strip">' +
          '<div class="fm-stat"><span class="fm-stat-n" style="color:#ffd700">' + ready + '</span><span class="fm-stat-l">READY</span></div>' +
          '<div class="fm-stat"><span class="fm-stat-n" style="color:#66bb6a">' + growing + '</span><span class="fm-stat-l">GROWING</span></div>' +
          '<div class="fm-stat"><span class="fm-stat-n" style="color:#555">' + empty + '</span><span class="fm-stat-l">EMPTY</span></div>' +
          '<div class="fm-stat"><span class="fm-stat-n" style="color:#42a5f5">' + water + '</span><span class="fm-stat-l">💧 WATER</span></div>' +
        '</div>' +
        '<div class="fm-tabs">' +
          '<button class="fm-tab' + (this._tab==='plots'?' fm-tab-on':'') + '" onclick="Farming.setTab(\'plots\')">🌱 PLOTS</button>' +
          '<button class="fm-tab' + (this._tab==='seeds'?' fm-tab-on':'') + '" onclick="Farming.setTab(\'seeds\')">🗄 SEEDS</button>' +
          '<button class="fm-tab' + (this._tab==='guide'?' fm-tab-on':'') + '" onclick="Farming.setTab(\'guide\')">📖 GUIDE</button>' +
        '</div>' +
        '<div class="fm-body">' +
          (this._tab==='plots' ? this._renderPlots(plots, maxPlots, fieldLv)
           : this._tab==='seeds' ? this._renderSeeds(fieldLv)
           : this._renderGuide(fieldLv)) +
        '</div>' +
        '<button class="fm-back btn-pixel btn-secondary" onclick="Farming.close()">← BACK</button>' +
      '</div>';
  },

  // ── Plots tab ─────────────────────────────────────────────
  _renderPlots: function(plots, maxPlots, fieldLv) {
    if (this._plantingIdx !== null) return this._renderPicker(this._plantingIdx, fieldLv);
    var anyReady = plots.slice(0,maxPlots).some(function(p){return p.state==='ready';});
    var html = '<div class="fm-grid">';
    for (var i=0; i<10; i++) {
      html += i < maxPlots ? this._renderPlot(i, plots[i], fieldLv) : this._renderLockedPlot(i);
    }
    html += '</div>';
    if (anyReady) html += '<button class="fm-harvest-all" onclick="Farming.harvestAll()">🌾 HARVEST ALL READY PLOTS</button>';
    return html;
  },

  _renderPlot: function(i, p, fieldLv) {
    var crop    = p.crop ? this.crops[p.crop] : null;
    var pct     = (crop && p.state==='growing') ? Math.round((1 - p.daysLeft/crop.growDays)*100) : 0;
    var thirsty = (p.waterDebt||0) >= 2;
    var stCls   = p.state==='ready' ? 'fm-plot-ready' : p.state==='growing' ? 'fm-plot-growing' : 'fm-plot-empty';
    var barColor= thirsty ? '#ef5350' : '#66bb6a';

    return '<div class="fm-plot ' + stCls + '">' +
      '<div class="fm-plot-num">#' + (i+1) + '</div>' +
      '<div class="fm-plot-art">' + this._plotArt(p, crop) + '</div>' +
      '<div class="fm-plot-info">' +
        (p.state==='empty' ? '<span class="fm-plot-empty-lbl">— empty —</span>' : '') +
        (crop ? '<span class="fm-plot-crop-name">' + crop.emoji + ' ' + crop.name + '</span>' : '') +
        (p.state==='growing' ?
          '<div class="fm-plot-bar-wrap"><div class="fm-plot-bar" style="width:' + pct + '%;background:' + barColor + '"></div></div>' +
          '<span class="fm-plot-days' + (thirsty?' fm-thirsty':'') + '">' + p.daysLeft + 'd left' + (thirsty?' 💧':'') + '</span>'
         : '') +
        (p.state==='ready' ? '<span class="fm-plot-ready-lbl">✨ HARVEST!</span>' : '') +
      '</div>' +
      '<div class="fm-plot-btns">' +
        (p.state==='empty'   ? '<button class="fm-btn fm-btn-plant" onclick="Farming.startPlanting(' + i + ')">🌱 Plant</button>' : '') +
        (p.state==='growing' ? '<button class="fm-btn fm-btn-water" onclick="Farming.water(' + i + ')">💧</button>' : '') +
        (p.state==='growing' ? '<button class="fm-btn fm-btn-uproot" onclick="Farming.uproot(' + i + ')">✕</button>' : '') +
        (p.state==='ready'   ? '<button class="fm-btn fm-btn-harvest" onclick="Farming.harvest(' + i + ')">🌾 Harvest</button>' : '') +
      '</div>' +
    '</div>';
  },

  _renderLockedPlot: function(i) {
    var neededLv = Math.ceil((i+1)/2);
    return '<div class="fm-plot fm-plot-locked">' +
      '<div class="fm-plot-num">#' + (i+1) + '</div>' +
      '<div class="fm-plot-lock-body"><span class="fm-lock-key">🔒</span><span class="fm-lock-need">Field Lv' + neededLv + '</span></div>' +
    '</div>';
  },

  // ── Seed picker overlay ───────────────────────────────────
  _renderPicker: function(idx, fieldLv) {
    var self = this;
    var rows = '';
    Object.values(this.crops).forEach(function(crop) {
      var have   = State.data.inventory[crop.seedItem] || 0;
      var locked = fieldLv < crop.minFieldLevel;
      var ok     = have > 0 && !locked;
      var yStr   = Object.entries(crop.yield).map(function(e){ return _farmResEmoji(e[0]) + e[1][0] + '–' + e[1][1]; }).join(' ');
      rows +=
        '<div class="fm-pick-row ' + (ok?'fm-pick-ok':locked?'fm-pick-locked':'fm-pick-none') + '">' +
          '<span class="fm-pick-emoji">' + crop.emoji + '</span>' +
          '<div class="fm-pick-info">' +
            '<span class="fm-pick-name" style="color:' + crop.rarityColor + '">' + crop.name +
              ' <span class="fm-pick-badge">' + crop.rarity + '</span></span>' +
            '<span class="fm-pick-desc">' + crop.desc + '</span>' +
            '<span class="fm-pick-stats">⏳' + crop.growDays + 'd · 💧' + (crop.noWater ? 'none' : crop.waterPerDay + '/day') + ' · ' + yStr +
              (locked ? ' · 🔒 needs Lv' + crop.minFieldLevel : '') + '</span>' +
          '</div>' +
          '<div class="fm-pick-right">' +
            '<span class="fm-pick-have' + (have===0?' fm-pick-zero':'') + '">' + have + '</span>' +
            '<span class="fm-pick-unit">seeds</span>' +
            (ok ? '<button class="fm-btn fm-btn-plant-ok" onclick="Farming.plant(' + idx + ',\'' + crop.id + '\')">Plant!</button>' : '') +
          '</div>' +
        '</div>';
    });
    return '<div class="fm-picker">' +
      '<div class="fm-picker-header">' +
        '<span class="fm-picker-title">Choose a seed for Plot #' + (idx+1) + '</span>' +
        '<button class="fm-picker-cancel" onclick="Farming.cancelPlanting()">← Cancel</button>' +
      '</div>' +
      '<div class="fm-pick-list">' + rows + '</div>' +
    '</div>';
  },

  // ── Seeds tab ─────────────────────────────────────────────
  _renderSeeds: function(fieldLv) {
    var cards = '';
    Object.values(this.crops).forEach(function(crop) {
      var have   = State.data.inventory[crop.seedItem] || 0;
      var locked = fieldLv < crop.minFieldLevel;
      var yStr   = Object.entries(crop.yield).map(function(e){ return _farmResEmoji(e[0]) + ' ' + e[1][0] + '–' + e[1][1]; }).join('  ');
      cards +=
        '<div class="fm-seed-card' + (locked?' fm-seed-locked':'') + '">' +
          '<span class="fm-seed-emoji">' + crop.emoji + '</span>' +
          '<div class="fm-seed-body">' +
            '<span class="fm-seed-name" style="color:' + crop.rarityColor + '">' + crop.name + '</span>' +
            '<span class="fm-seed-rarity">' + crop.rarity + (locked ? ' · 🔒 Field Lv' + crop.minFieldLevel + '+' : '') + '</span>' +
            '<span class="fm-seed-stat">⏳ ' + crop.growDays + ' days &nbsp;·&nbsp; 💧 ' + (crop.noWater ? 'no water needed' : crop.waterPerDay + '/day') + '</span>' +
            '<span class="fm-seed-yield">' + yStr + '</span>' +
            '<span class="fm-seed-source">📍 ' + crop.seedSource + '</span>' +
          '</div>' +
          '<div class="fm-seed-stock' + (have===0?' fm-seed-zero':'') + '">' +
            '<span class="fm-seed-count">' + have + '</span>' +
            '<span class="fm-seed-lbl">seeds</span>' +
          '</div>' +
        '</div>';
    });
    return '<div class="fm-seeds-tab">' +
      '<div class="fm-seeds-hint">💡 Seeds are found foraging or crafted at the Workshop.</div>' +
      '<div class="fm-seed-list">' + cards + '</div>' +
    '</div>';
  },

  // ── Guide tab ─────────────────────────────────────────────
  _renderGuide: function(fieldLv) {
    var rows = [
      [1,'2 plots','Wheat, Potato, Carrot'],
      [2,'4 plots','+ Beans, Herb'],
      [3,'6 plots','+ Sunflower'],
      [4,'8 plots','+ Cave Shroom'],
      [5,'10 plots','+ Mutant Crop'],
    ];
    var tableRows = rows.map(function(r) {
      return '<tr class="' + (fieldLv>=r[0]?'fm-guide-active':'fm-guide-locked') + '">' +
        '<td>Lv' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td></tr>';
    }).join('');
    var seedRows = Object.values(this.crops).map(function(c) {
      return '<div class="fm-guide-seed-row">' +
        '<span>' + c.emoji + '</span>' +
        '<span style="color:' + c.rarityColor + '">' + c.name + '</span>' +
        '<span>' + c.seedSource + '</span>' +
      '</div>';
    }).join('');
    return '<div class="fm-guide">' +
      '<div class="fm-guide-section">' +
        '<div class="fm-guide-heading">HOW FARMING WORKS</div>' +
        '<div class="fm-guide-body">' +
          '<p>Each plot cycles: <strong>empty → growing → ready</strong>. Plant a seed and wait the listed number of game days, then harvest.</p>' +
          '<p><strong>Water</strong> is consumed automatically at dawn. Unwatered plots accumulate a water debt that reduces harvest yield (up to −60%). Tap 💧 to water a plot manually.</p>' +
          '<p><strong>Cave Shroom</strong> needs zero water — plant it and forget.</p>' +
          '<p><strong>Field level bonus:</strong> Lv3 = +25% yield, Lv5 = +50% yield.</p>' +
          '<p><strong>Seed recovery:</strong> 30% chance to get 1 seed back on every harvest.</p>' +
        '</div>' +
      '</div>' +
      '<div class="fm-guide-section">' +
        '<div class="fm-guide-heading">PLOT UNLOCKS</div>' +
        '<table class="fm-guide-table"><thead><tr><th>Level</th><th>Plots</th><th>New crops</th></tr></thead>' +
        '<tbody>' + tableRows + '</tbody></table>' +
      '</div>' +
      '<div class="fm-guide-section">' +
        '<div class="fm-guide-heading">WHERE TO FIND SEEDS</div>' +
        '<div class="fm-guide-body">' + seedRows + '</div>' +
      '</div>' +
    '</div>';
  },

  // ── Plot SVG art ─────────────────────────────────────────
  _plotArt: function(p, crop) {
    var W=76, H=50, soil=H-14;
    var s = '<rect width="' + W + '" height="' + H + '" fill="#100c08" rx="3"/>';
    s += '<rect x="0" y="' + soil + '" width="' + W + '" height="' + (H-soil) + '" fill="#3a2010" rx="2"/>';
    for (var f=0;f<3;f++) s += '<line x1="4" y1="' + (soil+3+f*3.5) + '" x2="' + (W-4) + '" y2="' + (soil+3+f*3.5) + '" stroke="#28140a" stroke-width="1.2" opacity="0.8"/>';

    if (p.state === 'empty') {
      s += '<text x="' + (W/2) + '" y="' + (soil-5) + '" text-anchor="middle" font-size="7" fill="#3a2212" font-family="monospace">empty soil</text>';
    } else if (crop) {
      var growPct = p.state === 'ready' ? 1 : Math.max(0.1, 1 - p.daysLeft / crop.growDays);
      var stemH   = Math.round(9 + growPct * 22);
      var xs      = [11, 23, 38, 53, 65];
      var show    = p.state === 'ready' ? 5 : Math.max(1, Math.round(growPct * 5));
      var tr      = Math.round(3 + growPct * 5);

      for (var k = 0; k < show; k++) {
        var x = xs[k], sy = soil;
        s += '<rect x="' + (x-1.5) + '" y="' + (sy-stemH) + '" width="3" height="' + stemH + '" fill="' + crop.stemColor + '" rx="1"/>';

        if (crop.id === 'wheat') {
          for (var g=0;g<3;g++) s += '<ellipse cx="' + (x+(g-1)*2.5) + '" cy="' + (sy-stemH-3-(g%2)*2) + '" rx="1.8" ry="' + (2+g) + '" fill="' + crop.topColor + '" opacity="' + (0.7+g*0.1) + '"/>';
        } else if (crop.id === 'mushroom') {
          s += '<ellipse cx="' + x + '" cy="' + (sy-stemH) + '" rx="' + (tr+4) + '" ry="' + tr + '" fill="' + crop.topColor + '"/>';
          s += '<ellipse cx="' + x + '" cy="' + (sy-stemH+2) + '" rx="' + (tr+2) + '" ry="2" fill="' + crop.stemColor + '" opacity="0.5"/>';
          s += '<circle cx="' + (x-2) + '" cy="' + (sy-stemH-1) + '" r="1" fill="#fff" opacity="0.3"/>';
          s += '<circle cx="' + (x+2) + '" cy="' + (sy-stemH) + '" r="0.8" fill="#fff" opacity="0.25"/>';
        } else if (crop.id === 'sunflower') {
          for (var pt=0;pt<8;pt++) {
            var a=(pt/8)*Math.PI*2;
            s += '<ellipse cx="' + (x+Math.cos(a)*(tr+2.5)) + '" cy="' + (sy-stemH+Math.sin(a)*(tr+2.5)) + '" rx="2.5" ry="1.5" fill="' + crop.topColor + '" transform="rotate(' + (pt*45) + ' ' + x + ' ' + (sy-stemH) + ')"/>';
          }
          s += '<circle cx="' + x + '" cy="' + (sy-stemH) + '" r="' + Math.max(2,tr-2) + '" fill="#4a2808"/>';
        } else if (crop.id === 'mutant') {
          s += '<ellipse cx="' + x + '" cy="' + (sy-stemH) + '" rx="' + (tr+1) + '" ry="' + tr + '" fill="' + crop.topColor + '" opacity="0.85"/>';
          s += '<circle cx="' + x + '" cy="' + (sy-stemH) + '" r="' + Math.max(1,tr-3) + '" fill="#fff" opacity="0.25"/>';
          if (p.state === 'ready') s += '<circle cx="' + x + '" cy="' + (sy-stemH) + '" r="' + (tr+4) + '" fill="' + crop.topColor + '" opacity="0.12"/>';
        } else if (crop.id === 'carrot') {
          s += '<line x1="' + x + '" y1="' + (sy-stemH) + '" x2="' + (x-3) + '" y2="' + (sy-stemH-5) + '" stroke="#20a030" stroke-width="1.5"/>';
          s += '<line x1="' + x + '" y1="' + (sy-stemH) + '" x2="' + (x+3) + '" y2="' + (sy-stemH-6) + '" stroke="#20a030" stroke-width="1.5"/>';
          s += '<ellipse cx="' + x + '" cy="' + (sy-3) + '" rx="2" ry="4" fill="' + crop.topColor + '" opacity="0.9"/>';
        } else {
          s += '<ellipse cx="' + x + '" cy="' + (sy-stemH) + '" rx="' + tr + '" ry="' + Math.max(2,tr-1) + '" fill="' + crop.topColor + '"/>';
        }
      }
      if ((p.waterDebt||0) >= 2) s += '<text x="' + (W-7) + '" y="12" font-size="11">💧</text>';
      if (p.state === 'ready')   s += '<text x="7" y="12" font-size="11">✨</text>';
    }
    return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" style="overflow:visible">' + s + '</svg>';
  },
};

function _farmResEmoji(r) {
  return {food:'🍖',water:'💧',medicine:'💊',chemicals:'⚗️',spores:'🍄',wild_seeds:'🌱',cloth:'🧵',metal:'⚙️',wood:'🪵'}[r]||'📦';
}

// ── Event subscriptions ────────────────────────────────────────────────────
// Farming owns its own daily tick — dayNight just emits the signal.
Events.on('tick:dawn', () => {
  if (typeof Farming !== 'undefined') Farming.dailyTick();
});

// Subscribe: base emits when player opens a farm/field building screen
Events.on('farming:open', () => { if (typeof Farming !== 'undefined') Farming.open(); });

// Subscribe: crafting emits when the field building is upgraded
Events.on('farming:field-unlocked', ({ level }) => {
  if (typeof Farming !== 'undefined') {
    Farming._ensureState?.();
    const plots = Farming._plotsForLevel?.(level) ?? level * 2;
    Utils.toast(`🌾 Field Lv${level} unlocked — ${plots} plots now available!`, 'good', 4000);
  }
});

// Subscribe: game boot — ensure farming state without main.js importing Farming
Events.on('game:boot', () => {
  if (typeof Farming !== 'undefined') Farming._ensureState?.();
});
