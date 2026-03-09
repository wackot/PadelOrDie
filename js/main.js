// ═══════════════════════════════════════════
// PEDAL OR DIE — main.js
// Main game controller & HUD
// Entry point — runs after all other scripts
// ═══════════════════════════════════════════

// ── NightSky module ───────────────────────
// Manages star field on base screen at night
const NightSky = {
  _stars: null,

  init() {
    // Add star container to base world if not present
    const world = document.getElementById('base-world');
    if (!world || document.getElementById('base-stars')) return;
    this._stars = document.createElement('div');
    this._stars.id = 'base-stars';
    this._stars.className = 'night-stars hidden';
    world.appendChild(this._stars);
    this._populate();
  },

  _populate() {
    if (!this._stars) return;
    for (let i = 0; i < 50; i++) {
      const s = document.createElement('div');
      s.className = 'star';
      s.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*55}%;
        --twinkle-dur:${Utils.randFloat(1.5,4)}s;opacity:${Utils.randFloat(0.3,1)};
        width:${Utils.randInt(1,3)}px;height:${Utils.randInt(1,3)}px;
        animation-delay:${Utils.randFloat(0,4)}s;`;
      this._stars.appendChild(s);
    }
  },

  update() {
    if (!this._stars) return;
    this._stars.classList.toggle('hidden', !State.data?.world?.isNight);
  }
};

// ── HUD module ────────────────────────────
const HUD = {
  update() {
    if (!State.data) return;
    const p   = State.data.player;
    const inv = State.data.inventory;
    const w   = State.data.world;

    // Survival bars
    this._setBar('hud-hunger', p.hunger);
    this._setBar('hud-thirst', p.thirst);
    this._setBar('hud-energy', p.energy);

    // Day/time
    const dayEl = document.getElementById('hud-day');
    if (dayEl) dayEl.textContent = `DAY ${w.day}`;

    const timeEl = document.getElementById('hud-time');
    if (timeEl) {
      timeEl.textContent = w.isNight
        ? `🌙 NIGHT (${Utils.pad(w.hour)}:00)`
        : `☀ DAY (${Utils.pad(w.hour)}:00)`;
    }

    // Resources
    this._setRes('res-wood',      inv.wood);
    this._setRes('res-metal',     inv.metal);
    this._setRes('res-gasoline',  inv.gasoline);
    this._setRes('res-food',      inv.food);
    this._setRes('res-water',     inv.water);
  },

  _setBar(id, value) {
    const el = document.getElementById(id);
    if (el) el.style.width = `${Utils.clamp(value, 0, 100)}%`;
  },

  _setRes(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
};

// Subscribe: any module can emit 'hud:update' instead of calling HUD.update() directly
Events.on('hud:update', () => HUD.update());

// Subscribe: any module can navigate without importing Game
Events.on('navigate', ({ screen }) => Game.goTo(screen));

// Subscribe: save/import triggers a full UI refresh
Events.on('game:refresh-all', () => Game.refreshAll());

// ── Main Game controller ──────────────────
const Game = {

  // ── Navigate to a screen ─────────────────
  goTo(screenName) {
    State.data.world.currentScreen = screenName;
    Utils.showScreen(screenName);

    // Show/hide HUD and save button
    const inGame = !['loading', 'menu'].includes(screenName);
    const hud    = document.getElementById('hud');
    const savBtn = document.getElementById('btn-open-save');
    if (hud)    hud.classList.toggle('hidden', !inGame);
    if (savBtn) savBtn.classList.toggle('hidden', !inGame);

    // Screen-specific music
    if (Audio._ctx) {
      switch (screenName) {
        case 'base':     Audio.play('base');  break;
        case 'map':      Audio.play('base');  break;
        case 'crafting': Audio.play('craft'); break;
        case 'power':    Audio.play('craft'); break;
        case 'shelter':  Audio.play('base');  break;
        case 'menu':     Audio.play('menu');  break;
        // foraging and raid set their own music
      }
    }

    // Update night overlay on base
    if (screenName === 'base') {
      Events.emit('map:changed');
      NightSky.update();
    }

    // Render world map when navigating to it
    // worldmap:render subscription in worldmap.js handles render on navigate
    // (emitted by base._onBuildingClick when map tile is tapped)

    // Refresh power panel when navigating to it
    if (screenName === 'power') {
      setTimeout(() => Events.emit('power:render'), 50);
    }

    // Render dynamo bike screen
    if (screenName === 'dynamo-bike') {
      setTimeout(() => Events.emit('dynamo_bike:render'), 50);
    }

    // Render individual generator screens
    if (screenName === 'gen-woodburner') {
      setTimeout(() => Events.emit('power:gen:render', { key: 'woodburner' }), 50);
    }
    if (screenName === 'gen-coal_plant') {
      setTimeout(() => Events.emit('power:gen:render', { key: 'coal' }), 50);
    }
    if (screenName === 'gen-solar_array') {
      setTimeout(() => Events.emit('power:gen:render', { key: 'solar' }), 50);
    }
    if (screenName === 'gen-battery_bank') {
      setTimeout(() => Events.emit('power:bat:render'), 50);
    }

    HUD.update();
  },

  // ── Refresh all UI after load/import ─────
  refreshAll() {
    HUD.update();
    this.goTo('base');
  },

  // ── New game setup ────────────────────────
  newGame() {
    State.init();
    State.data.meta.newGame = false;
    Audio.init();
    this.goTo('base');
    Audio.play('base');
    Utils.toast('🧟 Day 1. Survive.', 'warn', 4000);
    Player.startTick();
    Raids.startChecks();
    DayNight.start();
    NightSky.init();
    SaveSystem.startAutoSave(5);
    console.log('[Game] New game started');
  },

  // ── Load existing game ────────────────────
  loadGame() {
    if (SaveSystem.loadLocal()) {
      Audio.init();
      this.goTo('base');
      Audio.play('base');
      Player.startTick();
      Raids.startChecks();
      DayNight.start();
      NightSky.init();
      SaveSystem.startAutoSave(5);
      // Resume any build that was in-progress when the game was saved
      if (State.data.activeBuild) {
        Events.emit('crafting:resume-build');
        Utils.toast('🏗 Resuming build: ' + (State.data.activeBuild.upg?.name || 'building') + '…', 'info', 3000);
      }
      Utils.toast(`📂 Loaded. Day ${State.data.world.day}. Survive.`, 'info', 3000);
      console.log('[Game] Game loaded');
    } else {
      Utils.toast('❌ No save found!', 'bad');
    }
  },

  // ── Wire up all back buttons ──────────────
  _bindBackButtons() {
    // Static back buttons (always in DOM)
    const staticBackButtons = {
      'btn-back-from-map':     'base',
      'btn-back-from-shelter': 'base',
      'btn-back-from-fridge':  'base',
      'btn-back-from-well':    'base',
      'btn-back-from-power':   'base',
    };

    Object.entries(staticBackButtons).forEach(([btnId, dest]) => {
      document.getElementById(btnId)?.addEventListener('click', () => {
        this.goTo(dest);
      });
    });

    // Dynamic back buttons (rendered inside JS-built screens)
    // Use event delegation on document body
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[id^="btn-back-from-"]');
      if (!btn) return;
      const id = btn.id;
      if (id === 'btn-back-from-crafting') this.goTo('base');
    });

    // data-goto delegation: any element with data-goto="screen" navigates without
    // the rendering module needing to know about Game directly.
    // Optional data-crafting-tab="tabname" emits crafting:open-tab so main.js
    // doesn't need to call Crafting methods directly.
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-goto]');
      if (!btn) return;
      const dest = btn.dataset.goto;
      this.goTo(dest);
      const tab = btn.dataset.craftingTab;
      if (tab) Events.emit('crafting:open-tab', { tab });
    });
  },

  // ── Wire shelter buttons ──────────────────
  _bindShelter() {
    document.getElementById('shelter-sleep')
      ?.querySelector('button')
      ?.addEventListener('click', () => {
        Player.sleep(8);
      });

    document.getElementById('shelter-rest')
      ?.querySelector('button')
      ?.addEventListener('click', () => {
        Player.sleep(2);
      });
  },

  // ── Wire pause button ────────────────────
  _bindPause() {
    document.getElementById('btn-pause')
      ?.addEventListener('click', () => Base.togglePause());
  },

  // ── Wire audio controls ───────────────────
  _bindAudio() {
    document.getElementById('btn-audio-toggle')
      ?.addEventListener('click', () => {
        if (!Audio._ctx) Audio.init();
        Audio.toggleMute();
      });
  },

  // ── Wire well button ──────────────────────
  _bindWell() {
    document.getElementById('btn-draw-water')
      ?.addEventListener('click', () => {
        Player.drawWater();
        document.getElementById('well-water-count').textContent =
          State.data.inventory.water;
        HUD.update();
      });
  },

  // ── Wire main menu buttons ────────────────
  _bindMenu() {
    document.getElementById('btn-new-game')
      ?.addEventListener('click', () => this.newGame());

    document.getElementById('btn-load-game')
      ?.addEventListener('click', () => {
        if (SaveSystem.hasSave()) {
          this.loadGame();
        } else {
          Utils.toast('No save found. Start a new game!', 'warn');
        }
      });
  },

  // ── Init ─────────────────────────────────
  init() {
    console.log('[Game] Initializing Pedal or Die v0.48 — Decoupled Architecture');

    // Init audio (needs user gesture — handled via first click)
    document.body.addEventListener('click', () => {
      if (!Audio._ctx) Audio.init();
    }, { once: true });

    // Init state immediately so State.data is ready for any game:boot listeners
    State.init();

    // Show loading screen
    Utils.showScreen('loading');
    this._fakeLoad(() => {

      // Init remaining modules
      SaveSystem.initUI();
      Events.emit('base:init');

      // Wire UI
      this._bindMenu();
      this._bindBackButtons();
      this._bindShelter();
      this._bindWell();
      this._bindAudio();
      this._bindPause();

      // Init settings (loads saved prefs, applies brightness + volumes)
      Settings.init();

      // Init Bluetooth (loads saved device, attempts silent reconnect)
      if (typeof Bluetooth !== 'undefined') {
        Bluetooth.init();
        // Refresh settings panel on any connection state change
        ['bike:connected', 'bike:disconnected', 'bike:reconnecting', 'bike:renamed'].forEach(ev => {
          Events.on(ev, () => { if (Settings._visible) Settings._refresh(); });
        });

        // Open instrument config panel after new connection (skip if mapping already saved)
        Events.on('bike:connected', ({ hasMapping }) => {
          if (!hasMapping && typeof BikeConfig !== 'undefined') {
            // Brief delay so toast settles first
            setTimeout(() => BikeConfig.open(), 800);
          }
        });
      }

      // Show main menu + start menu music after first interaction
      Utils.showScreen('menu');

      // Update load button state
      const loadBtn = document.getElementById('btn-load-game');
      if (loadBtn) {
        loadBtn.disabled  = !SaveSystem.hasSave();
        loadBtn.style.opacity = SaveSystem.hasSave() ? '1' : '0.4';
      }

      console.log('[Game] Ready');
    });
  },

  // ── Fake loading sequence ─────────────────
  _fakeLoad(callback) {
    const bar   = document.getElementById('loading-bar');
    const text  = document.getElementById('loading-text');
    const steps = [
      [10,  'Scanning for survivors...'],
      [25,  'Checking bike tyres...'],
      [40,  'Loading mutant database...'],
      [60,  'Mapping the wasteland...'],
      [75,  'Sharpening sticks...'],
      [90,  'Checking base defences...'],
      [100, 'Survive or perish.']
    ];

    let i = 0;
    const next = () => {
      if (i >= steps.length) {
        setTimeout(callback, 400);
        return;
      }
      const [pct, msg] = steps[i++];
      if (bar)  bar.style.width  = `${pct}%`;
      if (text) text.textContent = msg;
      setTimeout(next, Utils.randInt(200, 500));
    };
    next();
  }

};

// ── Bootstrap ─────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Game.init();
  // Let each module boot itself — no direct module calls needed here
  Events.emit('game:boot');
});
