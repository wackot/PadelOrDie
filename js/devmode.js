// ═══════════════════════════════════════════════════════
// PEDAL OR DIE — devmode.js
// Development mode panel — temporary cheat/debug tools
// Toggled via a hidden button in the HUD
// ═══════════════════════════════════════════════════════

const DevMode = {

  // ── State: which toggles are ON ──────────────────────
  flags: {
    clickMode:     false,   // true = mouse clicks count as pedalling (no bike needed)
    instantBuild:  false,   // true = build time capped at 10s
    instantTravel: false,   // true = travel speed ×20 (arrives in ~5s)
    instantForage: false,   // true = foraging duration 15s instead of real time
    noDrain:       false,   // true = hunger/thirst/energy don't drain
    noRaids:       false,   // true = raids never trigger
    richInventory: false,   // true = start with 999 of every resource
    daySkip:       false,   // pulse: advance 1 day when clicked
    godMode:       false,   // true = all vitals capped at 100 each tick
    unlockAll:     false,   // true = unlock all map locations immediately
  },

  _panel: null,
  _visible: false,

  // ── Toggle the panel open/closed ────────────────────
  toggle() {
    this._visible = !this._visible;
    const p = document.getElementById('devmode-panel');
    if (p) {
      p.classList.toggle('devmode-open', this._visible);
    } else {
      this._injectPanel();
    }
  },

  // ── Build & inject the panel DOM ────────────────────
  _injectPanel() {
    const panel = document.createElement('div');
    panel.id = 'devmode-panel';
    panel.className = 'devmode-panel devmode-open';
    panel.innerHTML = this._buildHTML();
    document.body.appendChild(panel);
    this._panel = panel;
  },

  _buildHTML() {
    const sections = [
      {
        label: '⌨️ INPUT',
        items: [
          { key: 'clickMode', label: 'Click Mode', desc: 'Mouse clicks = pedal strokes (no bike cadence needed)' },
        ]
      },
      {
        label: '⏱ TIMERS',
        items: [
          { key: 'instantBuild',  label: 'Fast Build',   desc: 'All builds complete in ≤10 seconds' },
          { key: 'instantTravel', label: 'Fast Travel',  desc: 'World map travel takes ~5 seconds' },
          { key: 'instantForage', label: 'Fast Forage',  desc: 'Foraging runs last only 15 seconds' },
        ]
      },
      {
        label: '❤️ SURVIVAL',
        items: [
          { key: 'noDrain',  label: 'No Drain',   desc: 'Hunger / thirst / energy never decrease' },
          { key: 'godMode',  label: 'God Mode',   desc: 'All vitals constantly restored to 100%' },
          { key: 'noRaids',  label: 'No Raids',   desc: 'Raids never trigger' },
        ]
      },
      {
        label: '🏆 UNLOCKS',
        items: [
          { key: 'richInventory', label: 'Rich Inventory', desc: 'Fill every resource to 999 (one-shot)' },
          { key: 'unlockAll',     label: 'Unlock All Locs', desc: 'Unlock every map location immediately' },
        ]
      },
    ];

    const sectionsHTML = sections.map(sec => `
      <div class="dev-section">
        <div class="dev-section-label">${sec.label}</div>
        ${sec.items.map(item => this._buildToggle(item)).join('')}
      </div>
    `).join('');

    const actionsHTML = `
      <div class="dev-section">
        <div class="dev-section-label">⚡ ACTIONS</div>
        <button class="dev-action-btn" onclick="DevMode.doAction('skipDay')">+1 Day</button>
        <button class="dev-action-btn" onclick="DevMode.doAction('skip7Days')">+7 Days</button>
        <button class="dev-action-btn" onclick="DevMode.doAction('fillVitals')">Fill Vitals</button>
        <button class="dev-action-btn" onclick="DevMode.doAction('triggerRaid')">Force Raid</button>
        <button class="dev-action-btn" onclick="DevMode.doAction('richNow')">Give Resources</button>
        <button class="dev-action-btn" onclick="DevMode.doAction('completeBuild')">Finish Build</button>
        <button class="dev-action-btn" onclick="DevMode.doAction('unlockLocsNow')">Unlock Locations</button>
        <button class="dev-action-btn dev-action-danger" onclick="DevMode.doAction('resetGame')">Reset Save</button>
      </div>
    `;

    return `
      <div class="dev-header">
        <span class="dev-title">🛠 DEV MODE</span>
        <span class="dev-warning">⚠ NOT FOR PRODUCTION</span>
        <button class="dev-close" onclick="DevMode.toggle()">✕</button>
      </div>
      <div class="dev-body">
        ${sectionsHTML}
        ${actionsHTML}
      </div>
      <div class="dev-footer">
        <span class="dev-footer-note">Changes apply immediately. Flags persist this session only.</span>
      </div>
    `;
  },

  _buildToggle(item) {
    const on = this.flags[item.key];
    return `
      <div class="dev-row" title="${item.desc}">
        <div class="dev-row-info">
          <span class="dev-row-label">${item.label}</span>
          <span class="dev-row-desc">${item.desc}</span>
        </div>
        <button
          id="devbtn-${item.key}"
          class="dev-toggle ${on ? 'dev-toggle-on' : 'dev-toggle-off'}"
          onclick="DevMode.toggle_flag('${item.key}')"
        >${on ? 'ON' : 'OFF'}</button>
      </div>
    `;
  },

  // ── Toggle a flag and handle immediate side effects ──
  toggle_flag(key) {
    this.flags[key] = !this.flags[key];
    const btn = document.getElementById('devbtn-' + key);
    if (btn) {
      btn.textContent = this.flags[key] ? 'ON' : 'OFF';
      btn.className   = 'dev-toggle ' + (this.flags[key] ? 'dev-toggle-on' : 'dev-toggle-off');
    }

    this._updateHUDIndicator();

    // Immediate effects on enable
    if (this.flags[key]) {
      switch (key) {
        case 'unlockAll':  this.doAction('unlockLocsNow'); break;
        case 'richInventory': this.doAction('richNow');   break;
        case 'godMode':
          Utils.toast('😇 God Mode ON — vitals stay full', 'good', 3000);
          break;
        case 'clickMode':
          Utils.toast('🖱 Click Mode ON — click anywhere to pedal', 'good', 3000);
          break;
        case 'noRaids':
          Utils.toast('🛡 No Raids ON', 'good', 2000);
          break;
        case 'noDrain':
          Utils.toast('❤️ No Drain ON — survival frozen', 'good', 2000);
          break;
        case 'instantBuild':
          // Cap the current active build immediately
          if (State.data?.activeBuild) {
            State.data.activeBuild.secsLeft = Math.min(State.data.activeBuild.secsLeft, 10);
            Utils.toast('🏗 Fast Build ON — current build capped at 10s', 'good', 2500);
          } else {
            Utils.toast('🏗 Fast Build ON — next build will be fast', 'good', 2500);
          }
          break;
        case 'instantForage':
          if (Foraging.isActive()) {
            Foraging._duration = Math.min(Foraging._duration, Foraging._elapsed + 15);
            Utils.toast('🏃 Fast Forage ON — current run ends in 15s', 'good', 2500);
          } else {
            Utils.toast('🏃 Fast Forage ON — next foraging run is 15s', 'good', 2500);
          }
          break;
        case 'instantTravel':
          Utils.toast('🚀 Fast Travel ON — world map travel ~5s', 'good', 2500);
          break;
      }
    } else {
      Utils.toast(`🛠 ${key} OFF`, 'info', 1500);
    }
  },

  // ── One-shot actions ─────────────────────────────────
  doAction(action) {
    switch (action) {

      case 'skipDay':
        State.advanceTime(24);
        DayNight._applyHour?.(State.data.world.hour, false);
        Events.emit('hud:update');
        Utils.toast(`📅 Skipped to Day ${State.data.world.day}`, 'good', 2000);
        break;

      case 'skip7Days':
        for (let i = 0; i < 7; i++) State.advanceTime(24);
        DayNight._applyHour?.(State.data.world.hour, false);
        Events.emit('hud:update');
        Utils.toast(`📅 Skipped to Day ${State.data.world.day}`, 'good', 2000);
        break;

      case 'fillVitals':
        State.data.player.hunger = 100;
        State.data.player.thirst = 100;
        State.data.player.energy = 100;
        Events.emit('hud:update');
        Utils.toast('❤️ All vitals filled to 100%', 'good', 2000);
        break;

      case 'triggerRaid':
        if (typeof Raids !== 'undefined') {
          Raids.triggerRaid('dev');
          Utils.toast('⚠ Raid forced!', 'bad', 2000);
        }
        break;

      case 'richNow': {
        const inv = State.data.inventory;
        const allRes = [
          'wood','metal','food','water','cloth','rope',
          'electronics','chemicals','gasoline','medicine','coal','glass',
          'spores','wild_seeds','engine_parts','scrap_wire','circuit_board',
          'antiseptic','cave_crystal','military_chip',
          'battery_cell','copper_wire','steel_casing','capacitor','power_core'
        ];
        allRes.forEach(r => { inv[r] = 999; });
        Events.emit('hud:update');
        Utils.toast('📦 Inventory filled with 999 of everything!', 'good', 2500);
        break;
      }

      case 'completeBuild':
        if (State.data?.activeBuild) {
          State.data.activeBuild.secsLeft = 0;
          Utils.toast('🏗 Build instantly completed!', 'good', 2000);
        } else {
          Utils.toast('No active build to complete.', 'warn', 2000);
        }
        break;

      case 'unlockLocsNow': {
        const allLocs = [
          'forest','abandoned_farm','gas_station','city_ruins',
          'junkyard','hospital','cave','military_base',
          'endgame_transmission','command_bunker','signal_drop','rescue_beacon','black_market'
        ];
        const unlocked = State.data.world.unlockedLocations || [];
        allLocs.forEach(l => { if (!unlocked.includes(l)) unlocked.push(l); });
        State.data.world.unlockedLocations = unlocked;
        // Also unlock missions
        State.data.world.unlockedMissions = [
          'endgame_transmission','command_bunker','signal_drop','rescue_beacon','black_market'
        ];
        Events.emit('hud:update');
        Utils.toast('🗺 All locations unlocked!', 'good', 2000);
        break;
      }

      case 'resetGame':
        if (confirm('⚠ RESET SAVE — delete all progress and restart?')) {
          localStorage.removeItem('pedalOrDie_save');
          location.reload();
        }
        break;
    }
  },

  // ── Update HUD button to reflect active flags ────────
  _updateHUDIndicator() {
    const btn = document.getElementById('btn-devmode');
    if (!btn) return;
    const anyOn = Object.values(this.flags).some(v => v);
    btn.classList.toggle('dev-flags-active', anyOn);
    btn.title = anyOn
      ? '🛠 Dev Mode ACTIVE — ' + Object.entries(this.flags).filter(([,v])=>v).map(([k])=>k).join(', ')
      : '🛠 Dev Mode';
  },

  // ── Called every game tick (from DayNight & Foraging) ─
  tick() {
    if (!State.data) return;

    // God mode — keep all vitals at 100
    if (this.flags.godMode) {
      State.data.player.hunger = 100;
      State.data.player.thirst = 100;
      State.data.player.energy = 100;
    }

    // Instant build — keep secsLeft ≤ 10
    if (this.flags.instantBuild && State.data.activeBuild) {
      if (State.data.activeBuild.secsLeft > 10) {
        State.data.activeBuild.secsLeft = 10;
      }
    }
  },

  // ── Intercept survival drain ─────────────────────────
  // Called from State.tickSurvival — returns modified deltaHours
  survivalMultiplier() {
    if (this.flags.noDrain || this.flags.godMode) return 0;
    return 1;
  },

  // ── Intercept raid trigger ───────────────────────────
  raidsBlocked() {
    return this.flags.noRaids;
  },

  // ── Intercept foraging duration ──────────────────────
  forageDuration(real) {
    if (this.flags.instantForage) return Math.min(real, 15);
    return real;
  },

  // ── Intercept build seconds ──────────────────────────
  buildSecs(real) {
    if (this.flags.instantBuild) return Math.min(real, 10);
    return real;
  },

  // ── Intercept travel speed ───────────────────────────
  travelSpeedMultiplier() {
    if (this.flags.instantTravel) return 20;
    return 1;
  },

  // ── Intercept CPM ratio for click mode ───────────────
  // If clickMode, treat each click as a full target CPM pulse
  clickModeActive() {
    return this.flags.clickMode;
  },
};
