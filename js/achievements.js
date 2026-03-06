// ═══════════════════════════════════════════════════════
// PEDAL OR DIE — achievements.js
// Full achievement system: 7 categories, 56 achievements,
// tiered bronze/silver/gold/platinum, progress bars,
// animated unlock toasts, dedicated screen
// ═══════════════════════════════════════════════════════

const Achievements = {

  // ── All achievement definitions ─────────────────────────────────────────
  // id       : unique key stored in state
  // cat      : category key
  // tier     : 'bronze'|'silver'|'gold'|'platinum'
  // icon     : emoji shown in card
  // title    : short name
  // desc     : how to unlock
  // progress : fn(s) → [current, max] for progress bar (null = binary)
  // test     : fn(s) → bool — true = unlocked

  defs: [

    // ════════════════ SURVIVAL ════════════════
    {
      id:'alive_3',       cat:'survival', tier:'bronze',
      icon:'📅', title:'Still Breathing',    desc:'Survive 3 days',
      progress: s => [s.w.day, 3],
      test: s => s.w.day >= 3
    },
    {
      id:'alive_7',       cat:'survival', tier:'bronze',
      icon:'📅', title:'One Week',           desc:'Survive 7 days',
      progress: s => [s.w.day, 7],
      test: s => s.w.day >= 7
    },
    {
      id:'alive_30',      cat:'survival', tier:'silver',
      icon:'📆', title:'Month Survivor',     desc:'Survive 30 days',
      progress: s => [s.w.day, 30],
      test: s => s.w.day >= 30
    },
    {
      id:'alive_100',     cat:'survival', tier:'gold',
      icon:'🏆', title:'Century Survivor',   desc:'Survive 100 days',
      progress: s => [s.w.day, 100],
      test: s => s.w.day >= 100
    },
    {
      id:'alive_365',     cat:'survival', tier:'platinum',
      icon:'🌟', title:'Year of Hell',       desc:'Survive 365 days',
      progress: s => [s.w.day, 365],
      test: s => s.w.day >= 365
    },
    {
      id:'never_starved', cat:'survival', tier:'silver',
      icon:'🍖', title:'Never Hungry',       desc:'Reach day 20 without hunger dropping to 0',
      progress: null,
      test: s => s.w.day >= 20 && !(s.st.everStarved)
    },
    {
      id:'full_vitals',   cat:'survival', tier:'bronze',
      icon:'❤️', title:'Full Tank',          desc:'Have hunger, thirst and energy all above 80%',
      progress: null,
      test: s => s.p.hunger >= 80 && s.p.thirst >= 80 && s.p.energy >= 80
    },
    {
      id:'night_owl',     cat:'survival', tier:'silver',
      icon:'🌙', title:'Night Owl',          desc:'Complete 10 night foraging runs',
      progress: s => [s.st.nightExpeditions||0, 10],
      test: s => (s.st.nightExpeditions||0) >= 10
    },

    // ════════════════ FITNESS ════════════════
    {
      id:'km_1',          cat:'fitness', tier:'bronze',
      icon:'🚴', title:'First Kilometre',    desc:'Pedal 1 km total',
      progress: s => [Math.min(s.st.totalDistanceKm||0, 1), 1],
      test: s => (s.st.totalDistanceKm||0) >= 1
    },
    {
      id:'km_10',         cat:'fitness', tier:'bronze',
      icon:'💪', title:'10km Club',          desc:'Pedal 10 km total',
      progress: s => [Math.min(s.st.totalDistanceKm||0, 10), 10],
      test: s => (s.st.totalDistanceKm||0) >= 10
    },
    {
      id:'km_50',         cat:'fitness', tier:'silver',
      icon:'🏅', title:'Half Century',       desc:'Pedal 50 km total',
      progress: s => [Math.min(s.st.totalDistanceKm||0, 50), 50],
      test: s => (s.st.totalDistanceKm||0) >= 50
    },
    {
      id:'km_100',        cat:'fitness', tier:'gold',
      icon:'⚡', title:'Iron Legs',          desc:'Pedal 100 km total',
      progress: s => [Math.min(s.st.totalDistanceKm||0, 100), 100],
      test: s => (s.st.totalDistanceKm||0) >= 100
    },
    {
      id:'km_500',        cat:'fitness', tier:'platinum',
      icon:'🌟', title:'Road Legend',        desc:'Pedal 500 km total',
      progress: s => [Math.min(s.st.totalDistanceKm||0, 500), 500],
      test: s => (s.st.totalDistanceKm||0) >= 500
    },
    {
      id:'cpm_60',        cat:'fitness', tier:'bronze',
      icon:'🔥', title:'Up to Speed',        desc:'Reach 60 CPM',
      progress: s => [Math.min(s.st.bestCPM||0, 60), 60],
      test: s => (s.st.bestCPM||0) >= 60
    },
    {
      id:'cpm_90',        cat:'fitness', tier:'silver',
      icon:'🔥', title:'Hot Legs',           desc:'Reach 90 CPM',
      progress: s => [Math.min(s.st.bestCPM||0, 90), 90],
      test: s => (s.st.bestCPM||0) >= 90
    },
    {
      id:'cpm_120',       cat:'fitness', tier:'gold',
      icon:'⚡', title:'Sprint Machine',     desc:'Reach 120 CPM',
      progress: s => [Math.min(s.st.bestCPM||0, 120), 120],
      test: s => (s.st.bestCPM||0) >= 120
    },
    {
      id:'cpm_150',       cat:'fitness', tier:'platinum',
      icon:'🌪️', title:'APEX Rider',        desc:'Reach 150 CPM — superhuman!',
      progress: s => [Math.min(s.st.bestCPM||0, 150), 150],
      test: s => (s.st.bestCPM||0) >= 150
    },
    {
      id:'sweat_30',      cat:'fitness', tier:'bronze',
      icon:'💦', title:'Warmed Up',          desc:'Pedal for 30 minutes total',
      progress: s => [Math.min(s.st.totalPedalMinutes||0, 30), 30],
      test: s => (s.st.totalPedalMinutes||0) >= 30
    },
    {
      id:'sweat_120',     cat:'fitness', tier:'silver',
      icon:'🏋️', title:'Sweat Session',      desc:'Pedal for 2 hours total',
      progress: s => [Math.min(s.st.totalPedalMinutes||0, 120), 120],
      test: s => (s.st.totalPedalMinutes||0) >= 120
    },
    {
      id:'sweat_600',     cat:'fitness', tier:'gold',
      icon:'🏆', title:'Endurance Beast',    desc:'Pedal for 10 hours total',
      progress: s => [Math.min(s.st.totalPedalMinutes||0, 600), 600],
      test: s => (s.st.totalPedalMinutes||0) >= 600
    },
    {
      id:'cal_1000',      cat:'fitness', tier:'silver',
      icon:'🔥', title:'Calorie Furnace',    desc:'Burn 1,000 calories',
      progress: s => [Math.min(s.st.totalCaloriesBurned||0, 1000), 1000],
      test: s => (s.st.totalCaloriesBurned||0) >= 1000
    },

    // ════════════════ COMBAT ════════════════
    {
      id:'first_blood',   cat:'combat', tier:'bronze',
      icon:'🗡️', title:'First Blood',       desc:'Defeat your first monster',
      progress: null,
      test: s => (s.st.animalsDefeated||0) >= 1
    },
    {
      id:'kills_10',      cat:'combat', tier:'bronze',
      icon:'🐺', title:'Monster Slayer',     desc:'Defeat 10 monsters',
      progress: s => [Math.min(s.st.animalsDefeated||0, 10), 10],
      test: s => (s.st.animalsDefeated||0) >= 10
    },
    {
      id:'kills_50',      cat:'combat', tier:'silver',
      icon:'🏹', title:'Veteran Hunter',     desc:'Defeat 50 monsters',
      progress: s => [Math.min(s.st.animalsDefeated||0, 50), 50],
      test: s => (s.st.animalsDefeated||0) >= 50
    },
    {
      id:'kills_200',     cat:'combat', tier:'gold',
      icon:'⚔️', title:'Apex Hunter',       desc:'Defeat 200 monsters',
      progress: s => [Math.min(s.st.animalsDefeated||0, 200), 200],
      test: s => (s.st.animalsDefeated||0) >= 200
    },
    {
      id:'raid_first',    cat:'combat', tier:'bronze',
      icon:'🛡️', title:'Home Defender',     desc:'Repel your first raid',
      progress: null,
      test: s => (s.st.raidsRepelled||0) >= 1
    },
    {
      id:'raids_10',      cat:'combat', tier:'silver',
      icon:'🏰', title:'Fortress Mind',      desc:'Repel 10 raids',
      progress: s => [Math.min(s.st.raidsRepelled||0, 10), 10],
      test: s => (s.st.raidsRepelled||0) >= 10
    },
    {
      id:'raids_50',      cat:'combat', tier:'gold',
      icon:'🏯', title:'Unbreakable',        desc:'Repel 50 raids',
      progress: s => [Math.min(s.st.raidsRepelled||0, 50), 50],
      test: s => (s.st.raidsRepelled||0) >= 50
    },
    {
      id:'boss_kill',     cat:'combat', tier:'gold',
      icon:'👾', title:'Boss Slayer',        desc:'Defeat the Boss Mutant',
      progress: null,
      test: s => !!(s.st.bossKilled)
    },
    {
      id:'titan_kill',    cat:'combat', tier:'platinum',
      icon:'👹', title:'Titan Slayer',       desc:'Defeat the APEX Titan',
      progress: null,
      test: s => !!(s.st.titanKilled)
    },

    // ════════════════ EXPLORATION ════════════
    {
      id:'first_trip',    cat:'explore', tier:'bronze',
      icon:'🗺️', title:'Into the Wild',     desc:'Complete your first expedition',
      progress: null,
      test: s => (s.st.totalExpeditions||0) >= 1
    },
    {
      id:'trips_10',      cat:'explore', tier:'bronze',
      icon:'🌲', title:'Regular Rider',      desc:'Complete 10 expeditions',
      progress: s => [Math.min(s.st.totalExpeditions||0, 10), 10],
      test: s => (s.st.totalExpeditions||0) >= 10
    },
    {
      id:'trips_50',      cat:'explore', tier:'silver',
      icon:'🌍', title:'Wanderer',           desc:'Complete 50 expeditions',
      progress: s => [Math.min(s.st.totalExpeditions||0, 50), 50],
      test: s => (s.st.totalExpeditions||0) >= 50
    },
    {
      id:'trips_200',     cat:'explore', tier:'gold',
      icon:'🌐', title:'World Rider',        desc:'Complete 200 expeditions',
      progress: s => [Math.min(s.st.totalExpeditions||0, 200), 200],
      test: s => (s.st.totalExpeditions||0) >= 200
    },
    {
      id:'map_5',         cat:'explore', tier:'silver',
      icon:'📍', title:'Scout',              desc:'Unlock 5 locations',
      progress: s => [Math.min((s.w.unlockedLocations||[]).length, 5), 5],
      test: s => (s.w.unlockedLocations||[]).length >= 5
    },
    {
      id:'map_all',       cat:'explore', tier:'gold',
      icon:'🗺️', title:'Cartographer',      desc:'Unlock all base locations',
      progress: s => [Math.min((s.w.unlockedLocations||[]).length, 8), 8],
      test: s => (s.w.unlockedLocations||[]).length >= 8
    },
    {
      id:'mission_first', cat:'explore', tier:'silver',
      icon:'📡', title:'Signal Received',    desc:'Unlock a radio tower mission location',
      progress: null,
      test: s => (s.w.unlockedMissions||[]).length >= 1
    },
    {
      id:'mission_all',   cat:'explore', tier:'platinum',
      icon:'🌐', title:'Transmission',       desc:'Unlock all 5 mission locations',
      progress: s => [(s.w.unlockedMissions||[]).length, 5],
      test: s => (s.w.unlockedMissions||[]).length >= 5
    },
    {
      id:'resources_100', cat:'explore', tier:'bronze',
      icon:'📦', title:'Hoarder',            desc:'Gather 100 resources total',
      progress: s => [Math.min(s.st.totalResourcesGathered||0, 100), 100],
      test: s => (s.st.totalResourcesGathered||0) >= 100
    },
    {
      id:'resources_1k',  cat:'explore', tier:'silver',
      icon:'📦', title:'Stockpiler',         desc:'Gather 1,000 resources total',
      progress: s => [Math.min(s.st.totalResourcesGathered||0, 1000), 1000],
      test: s => (s.st.totalResourcesGathered||0) >= 1000
    },
    {
      id:'resources_10k', cat:'explore', tier:'gold',
      icon:'🏭', title:'Supply Depot',       desc:'Gather 10,000 resources total',
      progress: s => [Math.min(s.st.totalResourcesGathered||0, 10000), 10000],
      test: s => (s.st.totalResourcesGathered||0) >= 10000
    },

    // ════════════════ BUILDING ════════════════
    {
      id:'build_first',   cat:'building', tier:'bronze',
      icon:'🔨', title:'First Nail',         desc:'Build or upgrade any structure',
      progress: null,
      test: s => (s.st.totalBuilds||0) >= 1
    },
    {
      id:'build_5',       cat:'building', tier:'bronze',
      icon:'🏗️', title:'Under Construction', desc:'Build or upgrade 5 times',
      progress: s => [Math.min(s.st.totalBuilds||0, 5), 5],
      test: s => (s.st.totalBuilds||0) >= 5
    },
    {
      id:'build_25',      cat:'building', tier:'silver',
      icon:'🏘️', title:'Town Planner',       desc:'Build or upgrade 25 times',
      progress: s => [Math.min(s.st.totalBuilds||0, 25), 25],
      test: s => (s.st.totalBuilds||0) >= 25
    },
    {
      id:'max_house',     cat:'building', tier:'gold',
      icon:'🏠', title:'Dream Home',         desc:'Upgrade shelter to level 10',
      progress: s => [s.b.buildings?.house?.level||0, 10],
      test: s => (s.b.buildings?.house?.level||0) >= 10
    },
    {
      id:'max_fence',     cat:'building', tier:'gold',
      icon:'🏰', title:'Fortress',           desc:'Upgrade defences to level 10',
      progress: s => [s.b.buildings?.fence?.level||0, 10],
      test: s => (s.b.buildings?.fence?.level||0) >= 10
    },
    {
      id:'powered_up',    cat:'building', tier:'silver',
      icon:'⚡', title:'Off the Grid',       desc:'Build the power house and a generator',
      progress: null,
      test: s => (s.b.buildings?.powerhouse?.level||0) >= 1 && !!(s.pw?.generators)
    },
    {
      id:'radio_built',   cat:'building', tier:'silver',
      icon:'📡', title:'On the Air',         desc:'Build the radio tower',
      progress: s => [s.b.buildings?.radio_tower?.level||0, 1],
      test: s => (s.b.buildings?.radio_tower?.level||0) >= 1
    },
    {
      id:'all_built',     cat:'building', tier:'platinum',
      icon:'🏙️', title:'City Builder',      desc:'Have every building constructed (level ≥ 1)',
      progress: s => {
        const blds = Object.values(s.b.buildings||{});
        const built = blds.filter(b=>b.level>=1).length;
        return [built, blds.length];
      },
      test: s => {
        const blds = Object.values(s.b.buildings||{});
        return blds.length > 0 && blds.every(b=>b.level>=1);
      }
    },

    // ════════════════ CRAFTING ════════════════
    {
      id:'craft_first',   cat:'crafting', tier:'bronze',
      icon:'🔧', title:'Crafty',             desc:'Craft your first item',
      progress: null,
      test: s => (s.st.totalCrafted||0) >= 1
    },
    {
      id:'craft_25',      cat:'crafting', tier:'silver',
      icon:'⚙️', title:'Workshop Regular',  desc:'Craft 25 items',
      progress: s => [Math.min(s.st.totalCrafted||0, 25), 25],
      test: s => (s.st.totalCrafted||0) >= 25
    },
    {
      id:'craft_100',     cat:'crafting', tier:'gold',
      icon:'🏭', title:'Mass Producer',      desc:'Craft 100 items',
      progress: s => [Math.min(s.st.totalCrafted||0, 100), 100],
      test: s => (s.st.totalCrafted||0) >= 100
    },
    {
      id:'circuit_made',  cat:'crafting', tier:'silver',
      icon:'🔬', title:'Electrician',        desc:'Craft a circuit board',
      progress: null,
      test: s => (s.st.craftedCircuitBoard||0) >= 1
    },
    {
      id:'chip_made',     cat:'crafting', tier:'gold',
      icon:'💾', title:'Silicon Dreams',     desc:'Craft a military chip',
      progress: null,
      test: s => (s.st.craftedMilitaryChip||0) >= 1
    },
    {
      id:'power_core',    cat:'crafting', tier:'platinum',
      icon:'⚛️', title:'Power Core Forged', desc:'Craft a power core',
      progress: null,
      test: s => (s.st.craftedPowerCore||0) >= 1
    },

  ],

  // ── Category metadata ────────────────────────────────────────────────────
  categories: {
    survival:  { label: 'SURVIVAL',    icon: '❤️'  },
    fitness:   { label: 'FITNESS',     icon: '🚴'  },
    combat:    { label: 'COMBAT',      icon: '⚔️'  },
    explore:   { label: 'EXPLORE',     icon: '🌍'  },
    building:  { label: 'BUILDING',    icon: '🏗️'  },
    crafting:  { label: 'CRAFTING',    icon: '🔧'  },
  },

  // ── Tier colours & labels ────────────────────────────────────────────────
  tiers: {
    bronze:   { color: '#cd7f32', bg: 'rgba(205,127,50,0.15)',  label: 'BRONZE',   points: 10  },
    silver:   { color: '#c0c0c0', bg: 'rgba(192,192,192,0.15)', label: 'SILVER',   points: 25  },
    gold:     { color: '#ffd700', bg: 'rgba(255,215,0,0.18)',   label: 'GOLD',     points: 50  },
    platinum: { color: '#e0f0ff', bg: 'rgba(200,230,255,0.18)', label: 'PLATINUM', points: 100 },
  },

  // ── Init: called at game start ────────────────────────────────────────────
  init() {
    if (!State.data.achievements) State.data.achievements = {};
  },

  // ── Check all achievements, fire unlocks for newly earned ones ───────────
  check() {
    if (!State.data.achievements) State.data.achievements = {};
    const earned = State.data.achievements;

    const ctx = {
      w:  State.data.world,
      p:  State.data.player,
      st: State.data.stats,
      b:  State.data.base,
      inv:State.data.inventory,
      pw: State.data.power,
    };

    const newlyUnlocked = [];
    for (const def of this.defs) {
      if (earned[def.id]) continue;
      try {
        if (def.test(ctx)) {
          earned[def.id] = State.data.world.day;
          newlyUnlocked.push(def);
        }
      } catch(e) { /* safe skip */ }
    }

    newlyUnlocked.forEach((def, i) => {
      setTimeout(() => this._showUnlockToast(def), i * 900);
    });

    // Persist
    if (newlyUnlocked.length) Save.save?.();

    return newlyUnlocked;
  },

  // ── Animated unlock toast ────────────────────────────────────────────────
  _showUnlockToast(def) {
    const tier   = this.tiers[def.tier];
    const toast  = document.createElement('div');
    toast.className = 'ach-toast ach-toast-' + def.tier;
    toast.innerHTML =
      '<div class="ach-toast-icon">' + def.icon + '</div>' +
      '<div class="ach-toast-body">' +
        '<div class="ach-toast-headline">🏆 ACHIEVEMENT UNLOCKED</div>' +
        '<div class="ach-toast-title">' + def.title + '</div>' +
        '<div class="ach-toast-tier" style="color:' + tier.color + '">' + tier.label + ' · +' + tier.points + ' pts</div>' +
      '</div>';
    document.body.appendChild(toast);
    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('ach-toast-visible'));
    });
    setTimeout(() => {
      toast.classList.remove('ach-toast-visible');
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  },

  // ── Get total points earned ───────────────────────────────────────────────
  getTotalPoints() {
    const earned = State.data.achievements || {};
    return this.defs
      .filter(d => earned[d.id])
      .reduce((sum, d) => sum + this.tiers[d.tier].points, 0);
  },

  // ── Get counts ───────────────────────────────────────────────────────────
  getCount() {
    const earned = State.data.achievements || {};
    return {
      unlocked: this.defs.filter(d => earned[d.id]).length,
      total:    this.defs.length,
    };
  },

  // ── Open achievements screen ─────────────────────────────────────────────
  _prevScreen: 'base',
  open() {
    this._prevScreen = State.data?.world?.currentScreen || 'base';
    this.render();
    Events.emit('navigate', { screen: 'achievements' });
  },

  close() {
    Events.emit('navigate', { screen: this._prevScreen });
  },

  // ── Active category filter ────────────────────────────────────────────────
  _activeCat: 'all',

  // ── Render full achievements screen ──────────────────────────────────────
  render(cat) {
    if (cat !== undefined) this._activeCat = cat;
    const el = document.getElementById('achievements-content');
    if (!el) return;

    const earned  = State.data.achievements || {};
    const ctx     = {
      w:  State.data.world,
      p:  State.data.player,
      st: State.data.stats,
      b:  State.data.base,
      inv:State.data.inventory,
      pw: State.data.power,
    };

    const totalPts  = this.getTotalPoints();
    const { unlocked, total } = this.getCount();
    const pct = Math.round((unlocked / total) * 100);

    // ── Category tabs ────────────────────────────────────────────────────
    const catTabs = ['all', ...Object.keys(this.categories)].map(cid => {
      const active  = this._activeCat === cid;
      const catDefs = cid === 'all' ? this.defs : this.defs.filter(d=>d.cat===cid);
      const catEarned = catDefs.filter(d=>earned[d.id]).length;
      const label   = cid === 'all' ? '🏆 ALL' : (this.categories[cid].icon + ' ' + this.categories[cid].label);
      return '<button class="ach-tab' + (active?' ach-tab-active':'') + '" onclick="Achievements.render(\'' + cid + '\')">' +
        label + ' <span class="ach-tab-count">' + catEarned + '/' + catDefs.length + '</span>' +
      '</button>';
    }).join('');

    // ── Filter defs by active cat ─────────────────────────────────────────
    const visibleDefs = this._activeCat === 'all'
      ? this.defs
      : this.defs.filter(d => d.cat === this._activeCat);

    // Sort: unlocked first (desc by day), then locked (by tier value)
    const tierOrder = { platinum:0, gold:1, silver:2, bronze:3 };
    const sorted = [...visibleDefs].sort((a, b) => {
      const aE = earned[a.id], bE = earned[b.id];
      if (aE && !bE) return -1;
      if (!aE && bE) return 1;
      if (aE && bE) return aE - bE; // earlier day first
      return tierOrder[a.tier] - tierOrder[b.tier]; // locked: highest tier first
    });

    // ── Render achievement cards ──────────────────────────────────────────
    const cards = sorted.map(def => {
      const tier      = this.tiers[def.tier];
      const isEarned  = !!earned[def.id];
      const earnedDay = earned[def.id];

      // Progress bar
      let progressHTML = '';
      if (!isEarned && def.progress) {
        try {
          const [cur, max] = def.progress(ctx);
          const prog = Math.min(100, (cur / max) * 100);
          const pLabel = typeof cur === 'number' ? (Number.isInteger(cur) ? cur : cur.toFixed(1)) : cur;
          progressHTML =
            '<div class="ach-progress-row">' +
              '<div class="ach-progress-wrap">' +
                '<div class="ach-progress-fill" style="width:' + prog.toFixed(1) + '%;background:' + tier.color + '"></div>' +
              '</div>' +
              '<span class="ach-progress-label">' + pLabel + ' / ' + max + '</span>' +
            '</div>';
        } catch(e) {}
      }

      return '<div class="ach-card' + (isEarned ? ' ach-earned' : ' ach-locked') + '" ' +
          'style="' + (isEarned ? 'border-color:' + tier.color + ';background:' + tier.bg : '') + '">' +
        '<div class="ach-card-icon' + (isEarned ? '' : ' ach-icon-dim') + '">' + (isEarned ? def.icon : '🔒') + '</div>' +
        '<div class="ach-card-body">' +
          '<div class="ach-card-title" style="' + (isEarned ? 'color:' + tier.color : '') + '">' + def.title + '</div>' +
          '<div class="ach-card-desc">' + def.desc + '</div>' +
          (isEarned
            ? '<div class="ach-card-earned-row">' +
                '<span class="ach-tier-badge" style="color:' + tier.color + '">' + tier.label + '</span>' +
                '<span class="ach-points-badge" style="color:' + tier.color + '">+' + tier.points + ' pts</span>' +
                '<span class="ach-day-badge">Day ' + earnedDay + '</span>' +
              '</div>'
            : progressHTML +
              '<div class="ach-card-earned-row">' +
                '<span class="ach-tier-badge ach-tier-dim">' + tier.label + '</span>' +
                '<span class="ach-points-dim">+' + tier.points + ' pts</span>' +
              '</div>'
          ) +
        '</div>' +
      '</div>';
    }).join('');

    // ── Tier summary strip ─────────────────────────────────────────────────
    const tierSummary = Object.entries(this.tiers).reverse().map(([tid, t]) => {
      const count = this.defs.filter(d => d.tier === tid && earned[d.id]).length;
      const total2 = this.defs.filter(d => d.tier === tid).length;
      return '<div class="ach-tier-sum">' +
        '<span class="ach-tier-sum-dot" style="background:' + t.color + '"></span>' +
        '<span style="color:' + t.color + '">' + t.label + '</span>' +
        '<span class="ach-tier-sum-count">' + count + '/' + total2 + '</span>' +
      '</div>';
    }).join('');

    el.innerHTML =
      '<div class="ach-screen">' +
        '<div class="ach-header">' +
          '<div class="ach-header-left">' +
            '<div class="ach-title">🏆 ACHIEVEMENTS</div>' +
            '<div class="ach-subtitle">' + unlocked + ' / ' + total + ' unlocked · ' + totalPts + ' pts</div>' +
          '</div>' +
          '<button class="ach-close-btn" onclick="Achievements.close()">✕</button>' +
        '</div>' +

        '<div class="ach-overall-bar-wrap">' +
          '<div class="ach-overall-bar-fill" style="width:' + pct + '%"></div>' +
          '<span class="ach-overall-pct">' + pct + '%</span>' +
        '</div>' +

        '<div class="ach-tier-strip">' + tierSummary + '</div>' +

        '<div class="ach-tabs">' + catTabs + '</div>' +

        '<div class="ach-grid">' + (cards || '<div class="ach-empty">No achievements in this category yet.</div>') + '</div>' +

        '<button class="ach-back-btn btn-pixel btn-secondary" onclick="Achievements.close()">← BACK</button>' +
      '</div>';
  },

};

// Subscribe: dayNight emits at dusk; foraging/raids can also emit as needed
Events.on('achievements:check', () => {
  if (typeof Achievements !== 'undefined') Achievements.check();
});

// Subscribe: game boot — init achievements without main.js importing Achievements
Events.on('game:boot', () => {
  if (typeof Achievements !== 'undefined') Achievements.init();
});
