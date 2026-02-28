// ═══════════════════════════════════════════
// PEDAL OR DIE — daynight.js
// Day/Night cycle engine
// Drives time progression, sky color, ambient sound
// and triggers night raids automatically
// ═══════════════════════════════════════════

const DayNight = {

  _timer:        null,
  _tickMs:       8000,   // 1 real second = ~1 game minute at this speed
                         // 8 sec = 1 game hour → full day = 3min 12sec real time
  _transitioning: false,

  // Sky palette per hour (H:color)
  _skyColors: {
    0:  '#050510',  // deep night
    4:  '#0a0a1a',  // pre-dawn
    5:  '#1a1025',  // dawn begins
    6:  '#3d2b1a',  // early sunrise orange
    7:  '#6b3a1f',  // sunrise
    8:  '#1a2a1a',  // morning green-grey
    10: '#1a2e1a',  // midday green
    12: '#152812',  // peak day
    14: '#1a2e1a',  // afternoon
    17: '#2a2a12',  // late afternoon
    18: '#3d2b1a',  // sunset begins
    19: '#2a1510',  // dusk orange-red
    20: '#150d1a',  // twilight purple
    21: '#0a0812',  // night falls
    23: '#050510'   // deep night
  },

  // Ambient emoji per time of day
  _ambientEmoji: {
    day:   ['☀️', '🌤️', '🌿'],
    dusk:  ['🌅', '🦅', '🌾'],
    night: ['🌙', '⭐', '🦇'],
    dawn:  ['🌄', '🐦', '🌫️']
  },

  // ── Start the clock ───────────────────────
  start() {
    clearInterval(this._timer);
    this._timer = setInterval(() => this._tick(), this._tickMs);
    this._applyHour(State.data.world.hour, false);
    console.log('[DayNight] Started at hour', State.data.world.hour);
  },

  stop() {
    clearInterval(this._timer);
  },

  // ── Advance one game hour ─────────────────
  _tick() {
    if (this._paused) return;
    State.advanceTime(1);
    const hour    = State.data.world.hour;
    const wasNight = State.data.world.isNight;

    this._applyHour(hour, true);
    HUD.update();

    // Transitions
    if (hour === 6 && wasNight) {
      this._onDawn();
    } else if (hour === 20 && !wasNight) {
    if (typeof PlayerStats !== 'undefined') PlayerStats.checkMilestones();
    if (typeof Achievements !== 'undefined') Achievements.check();
      this._onDusk();
    }

    // Hourly survival drain — reduced when actively pedalling
    // Being on an expedition (Foraging._active) and pedalling slows consumption.
    // ratio 0 (idle at base): full drain
    // ratio 1.0 (on target):  60% drain
    // ratio 1.5 (hammering):  35% drain
    const cpm    = Cadence.getCPM();
    const target = Cadence.getTargetCPM() || 60;
    const ratio  = Utils.clamp(cpm / target, 0, 1.5);
    const isForaging = typeof Foraging !== 'undefined' && Foraging._active;
    // Fitness: track pedalling time (each tick = 1 game-hour = ~_tickMs ms real time)
    if (cpm > 10) {
      const minPerTick = (this._tickMs || 6000) / 60000;
      State.data.stats.totalPedalMinutes = (State.data.stats.totalPedalMinutes || 0) + minPerTick;
    }
    // Drain multiplier: pedalling reduces hunger/thirst by up to 65%
    const drainMult = isForaging ? Utils.clamp(1.0 - ratio * 0.43, 0.35, 1.0) : 1.0;
    State.tickSurvival(0.5 * drainMult);
    Player.checkCritical();

    // Power system hourly tick
    if (typeof Power !== 'undefined' && State.data.power) {
      Power.hourlyTick();
    }

    // Night raid check (higher probability at night)
    if (State.data.world.isNight && !State.data.world.activeRaid) {
      // Don't raid while player is away from base
      const playerAway = (typeof Foraging !== 'undefined' && Foraging._active)
                      || (typeof WorldMap !== 'undefined' && WorldMap._travelling);
      const nightChance = 0.08;
      if (!playerAway && Math.random() < nightChance) {
        Raids.triggerRaid('night');
      }
    }
  },

  // ── Apply visual changes for hour ─────────
  _applyHour(hour, animate) {
    const color = this._interpolateSkyColor(hour);
    const body  = document.body;
    const base  = document.getElementById('screen-base');
    const world = document.getElementById('base-world');

    if (animate) {
      body.style.transition  = 'background 3s ease';
      if (base) base.style.transition = 'background 3s ease';
    }

    if (base) base.style.background = color;

    // Night overlay opacity based on hour
    const nightOverlay = document.getElementById('night-overlay');
    if (nightOverlay) {
      const opacity = this._nightOpacity(hour);
      nightOverlay.style.opacity = opacity;
      nightOverlay.classList.toggle('hidden', opacity === 0);
    }

    // Update ambient indicators in HUD
    this._updateAmbient(hour);

    // Canvas ground tint
    if (world) {
      const brightness = this._groundBrightness(hour);
      world.style.filter = `brightness(${brightness})`;
    }
  },

  // ── Interpolate sky color between hours ───
  _interpolateSkyColor(hour) {
    const hours = Object.keys(this._skyColors).map(Number).sort((a,b)=>a-b);
    let prevH = hours[0], nextH = hours[hours.length - 1];

    for (let i = 0; i < hours.length - 1; i++) {
      if (hour >= hours[i] && hour < hours[i+1]) {
        prevH = hours[i];
        nextH = hours[i+1];
        break;
      }
    }

    const t      = (hour - prevH) / (nextH - prevH || 1);
    const colA   = this._hexToRgb(this._skyColors[prevH]);
    const colB   = this._hexToRgb(this._skyColors[nextH] || this._skyColors[0]);
    const r = Math.round(colA.r + (colB.r - colA.r) * t);
    const g = Math.round(colA.g + (colB.g - colA.g) * t);
    const b = Math.round(colA.b + (colB.b - colA.b) * t);
    return `rgb(${r},${g},${b})`;
  },

  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  },

  // Night overlay opacity 0.0 - 0.7
  _nightOpacity(hour) {
    if (hour >= 6  && hour < 18) return 0;       // full day
    if (hour >= 18 && hour < 20) return (hour - 18) * 0.2;  // dusk
    if (hour >= 20 || hour < 5)  return 0.65;    // night
    if (hour >= 5  && hour < 6)  return 0.65 - ((hour - 5) * 0.65); // dawn
    return 0;
  },

  // Ground brightness 0.4 (night) - 1.0 (day)
  _groundBrightness(hour) {
    if (hour >= 8  && hour < 17) return 1.0;
    if (hour >= 17 && hour < 20) return Utils.lerp(1.0, 0.5, (hour-17)/3);
    if (hour >= 20 || hour < 5)  return 0.35;
    if (hour >= 5  && hour < 8)  return Utils.lerp(0.35, 1.0, (hour-5)/3);
    return 0.5;
  },

  // ── Update ambient HUD indicator ──────────
  _updateAmbient(hour) {
    const timeEl = document.getElementById('hud-time');
    if (!timeEl) return;

    let phase, icon;
    if (hour >= 6  && hour < 10) { phase = 'dawn';  icon = '🌄'; }
    else if (hour >= 10 && hour < 17) { phase = 'day';   icon = '☀️'; }
    else if (hour >= 17 && hour < 20) { phase = 'dusk';  icon = '🌅'; }
    else                              { phase = 'night'; icon = '🌙'; }

    timeEl.textContent = `${icon} ${Utils.pad(hour)}:00`;
    timeEl.dataset.phase = phase;

    // Color the time text
    const colors = { dawn:'#ffb347', day:'#ffe066', dusk:'#ff7043', night:'#7986cb' };
    timeEl.style.color = colors[phase] || '#d4d4a0';
  },

  // ── Dawn event — passive buildings produce ──
  _onDawn() {
    Utils.toast('🌄 Dawn breaks. Another day survived.', 'info', 4000);
    State.data.player.energy = Utils.clamp(State.data.player.energy + 5, 0, 100);

    const b = State.data.base;
    const pw = State.data.power;

    // Electric pump — auto-produces water each dawn when powered
    if (pw?.consumers?.waterPump && Power.hasPowerForCrafting(0.5)) {
      State.addResource('water', 5);
      Utils.toast('💧 Electric pump filled 5 water overnight.', 'info', 2500);
    }

    // Electric grow lights — bonus food each dawn
    if (pw?.consumers?.lights && b.passiveFood > 0 && Power.hasPowerForCrafting(0.5)) {
      State.addResource('food', 1); // bonus food from grow lights
    }

    // Greenhouse passive food + water
    if ((b.passiveFood || 0) > 0) {
      State.addResource('food', b.passiveFood);
      Utils.toast(`🌿 Greenhouse produced ${b.passiveFood} food!`, 'good', 3000);
    }
    if ((b.passiveWater || 0) > 0) {
      State.addResource('water', b.passiveWater);
      Utils.toast(`🌿 Greenhouse produced ${b.passiveWater} water!`, 'good', 3000);
    }

    // Advanced farming system — grow all plots by 1 day, alert when ready
    if (typeof Farming !== 'undefined') Farming.dailyTick();

    HUD.update();
    Base.updateNight();
  },

  // ── Dusk event ────────────────────────────
  _onDusk() {
    const hasLight = State.data.base.hasLight;
    Utils.toast(
      hasLight
        ? '🌙 Night falls. Bike light activated.'
        : '🌙 Night falls. Stay alert — they come in darkness.',
      'warn', 4000
    );
    Base.updateNight();
  },

  // ── Skip to morning (used by sleep) ───────
  skipToMorning() {
    State.data.world.hour   = 8;
    State.data.world.isNight = false;
    this._applyHour(8, true);
    Base.updateNight();
    HUD.update();
  },

  // ── Get current phase label ───────────────
  getPhase() {
    const h = State.data.world.hour;
    if (h >= 6  && h < 10) return 'dawn';
    if (h >= 10 && h < 17) return 'day';
    if (h >= 17 && h < 20) return 'dusk';
    return 'night';
  }

};
