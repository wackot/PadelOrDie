// ═══════════════════════════════════════════
// PEDAL OR DIE — playerstats.js
// Dedicated full-screen Player Stats dashboard
// ═══════════════════════════════════════════

const PlayerStats = {

  _prevScreen: 'base',

  open() {
    this._prevScreen = State.data?.world?.currentScreen || 'base';
    this.render();
    Game.goTo('screen-player-stats');
  },

  close() {
    Game.goTo(this._prevScreen);
  },

  // ── Check and award milestones ────────────
  checkMilestones() {
    const s = State.data.stats;
    const w = State.data.world;
    if (!s.milestones) s.milestones = {};

    const checks = [
      { key:'first_blood',    label:'First Expedition',   test: s.totalExpeditions >= 1 },
      { key:'survivor_7',     label:'7 Days Survived',    test: w.day >= 7 },
      { key:'survivor_30',    label:'30 Days Survived',   test: w.day >= 30 },
      { key:'survivor_100',   label:'100 Days Survived',  test: w.day >= 100 },
      { key:'pedaller',       label:'1km Pedalled',       test: (s.totalDistanceKm||0) >= 1 },
      { key:'cyclist',        label:'10km Pedalled',      test: (s.totalDistanceKm||0) >= 10 },
      { key:'ironman',        label:'100km Pedalled',     test: (s.totalDistanceKm||0) >= 100 },
      { key:'first_kill',     label:'First Animal Defeated', test: (s.animalsDefeated||0) >= 1 },
      { key:'hunter10',       label:'10 Animals Defeated',   test: (s.animalsDefeated||0) >= 10 },
      { key:'hunter50',       label:'50 Animals Defeated',   test: (s.animalsDefeated||0) >= 50 },
      { key:'defender',       label:'First Raid Repelled', test: (s.raidsRepelled||0) >= 1 },
      { key:'fortress',       label:'10 Raids Repelled',  test: (s.raidsRepelled||0) >= 10 },
      { key:'hoarder',        label:'1000 Resources Found', test: (s.totalResourcesGathered||0) >= 1000 },
      { key:'expeditioner10', label:'10 Expeditions',     test: s.totalExpeditions >= 10 },
      { key:'expeditioner50', label:'50 Expeditions',     test: s.totalExpeditions >= 50 },
      { key:'cpm_80',         label:'80+ CPM Achieved',   test: (s.bestCPM||0) >= 80 },
      { key:'cpm_120',        label:'120+ CPM — Sprinter!', test: (s.bestCPM||0) >= 120 },
      { key:'sweat_30',       label:'30 Min Pedalled',    test: (s.totalPedalMinutes||0) >= 30 },
      { key:'sweat_120',      label:'2 Hours Pedalled',   test: (s.totalPedalMinutes||0) >= 120 },
      { key:'sweat_600',      label:'10 Hours Pedalled',  test: (s.totalPedalMinutes||0) >= 600 },
    ];

    let newUnlocks = [];
    checks.forEach(({ key, label, test }) => {
      if (test && !s.milestones[key]) {
        s.milestones[key] = w.day;
        newUnlocks.push(label);
      }
    });

    newUnlocks.forEach(label => {
      Utils.toast('🏆 Milestone: ' + label, 'good', 4000);
    });
  },

  // ── Main render ───────────────────────────
  render() {
    const el = document.getElementById('player-stats-content');
    if (!el) return;

    const s  = State.data.stats;
    const p  = State.data.player;
    const w  = State.data.world;
    const b  = State.data.base;
    const bld = b.buildings || {};
    const inv = State.data.inventory;
    const cpm = (typeof Cadence !== 'undefined') ? Cadence.getCPM() : 0;

    // ── Fitness numbers ──
    const km       = (s.totalDistanceKm   || 0).toFixed(1);
    const cal      = Math.round(s.totalCaloriesBurned || 0);
    const pedalMin = Math.round(s.totalPedalMinutes   || 0);
    const pedalHr  = (pedalMin / 60).toFixed(1);
    const bestCPM  = s.bestCPM  || 0;
    const sessCount = s.sessionCount || s.totalSessions || 0;

    // Fitness level (based on km)
    const fitnessLevels = [
      { km:  0,   label:'Couch Potato',    color:'#888',    emoji:'🛋️' },
      { km:  2,   label:'First Steps',     color:'#8bc34a', emoji:'🚶' },
      { km:  10,  label:'Getting Moving',  color:'#66bb6a', emoji:'🏃' },
      { km:  25,  label:'Weekend Warrior', color:'#26a69a', emoji:'🚴' },
      { km:  50,  label:'Fitness Fan',     color:'#42a5f5', emoji:'💪' },
      { km: 100,  label:'Endurance Rider', color:'#7e57c2', emoji:'🏅' },
      { km: 250,  label:'Iron Legs',       color:'#ef5350', emoji:'⚡' },
      { km: 500,  label:'Road Warrior',    color:'#ffd600', emoji:'🏆' },
      { km:1000,  label:'PEDAL LEGEND',    color:'#ff6d00', emoji:'🌟' },
    ];
    let fitnessLv = fitnessLevels[0];
    for (const lv of fitnessLevels) {
      if (parseFloat(km) >= lv.km) fitnessLv = lv;
    }
    const nextFit = fitnessLevels[fitnessLevels.indexOf(fitnessLv) + 1];
    const fitPct = nextFit
      ? Math.min(100, ((parseFloat(km) - fitnessLv.km) / (nextFit.km - fitnessLv.km)) * 100)
      : 100;

    // ── Survival bars ──
    const bars = [
      { label:'🍖 Hunger', val: p.hunger, color:'#ff8f00' },
      { label:'💧 Thirst', val: p.thirst, color:'#29b6f6' },
      { label:'⚡ Energy', val: p.energy, color:'#ffd600' },
    ];
    const survivalBarsHtml = bars.map(b2 => {
      const cls = b2.val < 25 ? 'crit' : b2.val < 50 ? 'warn' : 'ok';
      return '<div class="ps-bar-row">' +
        '<span class="ps-bar-label">' + b2.label + '</span>' +
        '<div class="ps-bar-wrap">' +
          '<div class="ps-bar-fill ps-bar-' + cls + '" style="width:' + b2.val + '%;background:' + b2.color + '"></div>' +
        '</div>' +
        '<span class="ps-bar-pct">' + Math.round(b2.val) + '%</span>' +
      '</div>';
    }).join('');

    // ── Equipment slots ──
    const eq = p.equipment || {};
    const eqSlots = [
      { key:'weapon', label:'⚔️ Weapon', },
      { key:'armour', label:'🛡 Armour', },
      { key:'tool',   label:'🔧 Tool',   },
      { key:'light',  label:'🔦 Light',  },
    ];
    const eqHtml = eqSlots.map(slot => {
      const item = eq[slot.key];
      return '<div class="ps-eq-slot ' + (item ? 'equipped' : 'empty') + '">' +
        '<span class="ps-eq-label">' + slot.label + '</span>' +
        '<span class="ps-eq-item">' + (item ? (item.emoji || '?') + ' ' + (item.name || item) : '—') + '</span>' +
      '</div>';
    }).join('');

    // ── Buildings unlocked ──
    const bldList = Object.entries(bld);
    const builtCount  = bldList.filter(([,b2]) => b2.level > 0).length;
    const totalBuilds = bldList.length;
    const bldHtml = bldList.map(([id, b2]) => {
      const built = b2.level > 0;
      return '<div class="ps-bld-chip ' + (built ? 'built' : 'unbuilt') + '" title="' + b2.name + ' Lv' + b2.level + '">' +
        b2.emoji + (built ? '<span>' + b2.level + '</span>' : '') +
      '</div>';
    }).join('');

    // ── Milestones ──
    if (!s.milestones) s.milestones = {};
    const mileDefs = [
      { key:'first_blood',    emoji:'🗺️', label:'First Expedition' },
      { key:'survivor_7',     emoji:'📅', label:'7 Days' },
      { key:'survivor_30',    emoji:'📆', label:'30 Days' },
      { key:'survivor_100',   emoji:'🏆', label:'100 Days' },
      { key:'pedaller',       emoji:'🚴', label:'1km' },
      { key:'cyclist',        emoji:'💪', label:'10km' },
      { key:'ironman',        emoji:'⚡', label:'100km' },
      { key:'first_kill',     emoji:'🐺', label:'First Kill' },
      { key:'hunter10',       emoji:'🏹', label:'10 Kills' },
      { key:'hunter50',       emoji:'🎯', label:'50 Kills' },
      { key:'defender',       emoji:'🛡', label:'Raid Repelled' },
      { key:'fortress',       emoji:'🏰', label:'10 Raids Won' },
      { key:'hoarder',        emoji:'📦', label:'1k Resources' },
      { key:'expeditioner10', emoji:'🗺️', label:'10 Trips' },
      { key:'expeditioner50', emoji:'🌍', label:'50 Trips' },
      { key:'cpm_80',         emoji:'🔥', label:'80 CPM' },
      { key:'cpm_120',        emoji:'⚡', label:'120 CPM' },
      { key:'sweat_30',       emoji:'💦', label:'30 Min' },
      { key:'sweat_120',      emoji:'🏅', label:'2 Hours' },
      { key:'sweat_600',      emoji:'🌟', label:'10 Hours' },
    ];
    const milesHtml = mileDefs.map(m => {
      const day = s.milestones[m.key];
      const unlocked = !!day;
      return '<div class="ps-mile ' + (unlocked ? 'unlocked' : 'locked') + '" title="' + m.label + (unlocked ? ' — Day '+day : '') + '">' +
        '<span class="ps-mile-icon">' + (unlocked ? m.emoji : '🔒') + '</span>' +
        '<span class="ps-mile-label">' + m.label + '</span>' +
        (unlocked ? '<span class="ps-mile-day">Day ' + day + '</span>' : '') +
      '</div>';
    }).join('');

    // ── Locations discovered ──
    const allLocs = ['forest','abandoned_farm','gas_station','city_ruins','junkyard','hospital','cave','military_base'];
    const discovered = w.unlockedLocations || [];
    const locEmojis  = { forest:'🌲', abandoned_farm:'🚜', gas_station:'⛽', city_ruins:'🏙️', junkyard:'🗑️', hospital:'🏥', cave:'🕳️', military_base:'🪖' };
    const locHtml = allLocs.map(id => {
      const found = discovered.includes(id);
      return '<div class="ps-loc ' + (found ? 'found' : 'hidden-loc') + '">' +
        (found ? locEmojis[id] : '❓') +
      '</div>';
    }).join('');

    // ── Current CPM gauge ──
    const cpmPct = Math.min(100, (cpm / 150) * 100);
    const cpmColor = cpm >= 100 ? '#ffd600' : cpm >= 70 ? '#4caf50' : cpm >= 40 ? '#42a5f5' : '#888';

    el.innerHTML =
      '<div class="ps-screen">' +

        // ── Header ──
        '<div class="ps-header">' +
          '<div class="ps-avatar">👤</div>' +
          '<div class="ps-header-info">' +
            '<div class="ps-survivor-title">SURVIVOR</div>' +
            '<div class="ps-day-badge">DAY ' + w.day + '</div>' +
            '<div class="ps-fitness-rank" style="color:' + fitnessLv.color + '">' + fitnessLv.emoji + ' ' + fitnessLv.label + '</div>' +
          '</div>' +
          '<button class="ps-close-btn" onclick="PlayerStats.close()">✕</button>' +
        '</div>' +

        // ── Fitness level progress bar ──
        '<div class="ps-section">' +
          '<div class="ps-section-title">FITNESS LEVEL</div>' +
          '<div class="ps-fit-bar-wrap">' +
            '<div class="ps-fit-bar-fill" style="width:' + fitPct.toFixed(1) + '%;background:' + fitnessLv.color + '"></div>' +
          '</div>' +
          (nextFit ? '<div class="ps-fit-next">Next: ' + nextFit.emoji + ' ' + nextFit.label + ' at ' + nextFit.km + 'km</div>' : '<div class="ps-fit-next">🌟 MAX RANK</div>') +
        '</div>' +

        // ── Live CPM ──
        '<div class="ps-section">' +
          '<div class="ps-section-title">⚡ CURRENT INTENSITY</div>' +
          '<div class="ps-cpm-wrap">' +
            '<div class="ps-cpm-bar-wrap">' +
              '<div class="ps-cpm-bar-fill" style="width:' + cpmPct.toFixed(1) + '%;background:' + cpmColor + '"></div>' +
            '</div>' +
            '<span class="ps-cpm-label" style="color:' + cpmColor + '">' + Math.round(cpm) + ' CPM</span>' +
          '</div>' +
        '</div>' +

        // ── Fitness stats ──
        '<div class="ps-section">' +
          '<div class="ps-section-title">🚴 FITNESS STATS</div>' +
          '<div class="ps-stat-grid">' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">📏</span>' +
              '<span class="ps-stat-val">' + km + ' km</span>' +
              '<span class="ps-stat-lbl">Total Distance</span>' +
            '</div>' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">🔥</span>' +
              '<span class="ps-stat-val">' + cal.toLocaleString() + '</span>' +
              '<span class="ps-stat-lbl">Calories Burned</span>' +
            '</div>' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">⏱️</span>' +
              '<span class="ps-stat-val">' + pedalHr + ' hr</span>' +
              '<span class="ps-stat-lbl">Time Pedalling</span>' +
            '</div>' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">⚡</span>' +
              '<span class="ps-stat-val">' + bestCPM + ' CPM</span>' +
              '<span class="ps-stat-lbl">Best CPM Ever</span>' +
            '</div>' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">🖱️</span>' +
              '<span class="ps-stat-val">' + (s.totalClicksAllTime||0).toLocaleString() + '</span>' +
              '<span class="ps-stat-lbl">Pedal Strokes</span>' +
            '</div>' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">🏋️</span>' +
              '<span class="ps-stat-val">' + pedalMin + ' min</span>' +
              '<span class="ps-stat-lbl">Active Minutes</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // ── Survival bars ──
        '<div class="ps-section">' +
          '<div class="ps-section-title">❤️ SURVIVAL STATUS</div>' +
          '<div class="ps-survival">' + survivalBarsHtml + '</div>' +
        '</div>' +

        // ── Survival stats ──
        '<div class="ps-section">' +
          '<div class="ps-section-title">📊 SURVIVOR RECORD</div>' +
          '<div class="ps-stat-grid">' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">📅</span>' +
              '<span class="ps-stat-val">' + w.day + '</span>' +
              '<span class="ps-stat-lbl">Days Survived</span>' +
            '</div>' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">🗺️</span>' +
              '<span class="ps-stat-val">' + (s.totalExpeditions||0) + '</span>' +
              '<span class="ps-stat-lbl">Expeditions</span>' +
            '</div>' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">📦</span>' +
              '<span class="ps-stat-val">' + (s.totalResourcesGathered||0).toLocaleString() + '</span>' +
              '<span class="ps-stat-lbl">Resources Found</span>' +
            '</div>' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">🐺</span>' +
              '<span class="ps-stat-val">' + (s.animalsDefeated||0) + '</span>' +
              '<span class="ps-stat-lbl">Animals Defeated</span>' +
            '</div>' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">✅</span>' +
              '<span class="ps-stat-val">' + (s.raidsRepelled||0) + '</span>' +
              '<span class="ps-stat-lbl">Raids Repelled</span>' +
            '</div>' +
            '<div class="ps-stat-card">' +
              '<span class="ps-stat-icon">💀</span>' +
              '<span class="ps-stat-val">' + (s.raidsFailed||0) + '</span>' +
              '<span class="ps-stat-lbl">Raids Failed</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // ── Equipment ──
        '<div class="ps-section">' +
          '<div class="ps-section-title">🎒 EQUIPMENT</div>' +
          '<div class="ps-equipment">' + eqHtml + '</div>' +
        '</div>' +

        // ── Buildings ──
        '<div class="ps-section">' +
          '<div class="ps-section-title">🏘️ BASE BUILDINGS (' + builtCount + '/' + totalBuilds + ')</div>' +
          '<div class="ps-buildings">' + bldHtml + '</div>' +
        '</div>' +

        // ── Locations ──
        '<div class="ps-section">' +
          '<div class="ps-section-title">🌍 LOCATIONS (' + discovered.length + '/' + allLocs.length + ')</div>' +
          '<div class="ps-locations">' + locHtml + '</div>' +
        '</div>' +

        // ── Milestones ──
        '<div class="ps-section">' +
          '<div class="ps-section-title">🏆 MILESTONES</div>' +
          '<div class="ps-milestones">' + milesHtml + '</div>' +
        '</div>' +

        // ── Back button ──
        '<button class="ps-back-btn btn-pixel btn-secondary" onclick="PlayerStats.close()">← BACK</button>' +

      '</div>';
  }

};
