// ═══════════════════════════════════════════
// PEDAL OR DIE — utils.js
// Helper functions used across all modules
// ═══════════════════════════════════════════

const Utils = {

  // Random integer between min and max (inclusive)
  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  // Random float between min and max
  randFloat(min, max) {
    return Math.random() * (max - min) + min;
  },

  // Clamp a value between min and max
  clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  },

  // Linear interpolate
  lerp(a, b, t) {
    return a + (b - a) * t;
  },

  // Format a number with leading zeros
  pad(num, size = 2) {
    return String(num).padStart(size, '0');
  },

  // Show a toast notification
  // type: 'good' | 'bad' | 'warn' | 'info'
  toast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = message;
    container.appendChild(el);

    setTimeout(() => {
      el.remove();
    }, duration);
  },

  // Switch visible screen
  showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`screen-${screenId}`);
    if (target) target.classList.add('active');
  },

  // Toggle element visibility
  show(el) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (el) el.classList.remove('hidden');
  },

  hide(el) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (el) el.classList.add('hidden');
  },

  toggle(el) {
    if (typeof el === 'string') el = document.getElementById(el);
    if (el) el.classList.toggle('hidden');
  },

  // Deep clone an object
  clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  },

  // Format seconds as MM:SS
  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${this.pad(m)}:${this.pad(s)}`;
  },

  // Weighted random pick from array of {item, weight}
  weightedRandom(items) {
    const total = items.reduce((sum, i) => sum + i.weight, 0);
    let r = Math.random() * total;
    for (const item of items) {
      r -= item.weight;
      if (r <= 0) return item.item;
    }
    return items[items.length - 1].item;
  },

  // Debounce
  debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }

};

// ── Event Bus ──────────────────────────────────────────────────────────────
// Lightweight pub/sub so modules can signal each other without direct imports.
//
// Usage:
//   Events.on('map:changed', () => Base.updateNight());   // subscriber
//   Events.emit('map:changed');                            // anywhere else
//
// Known events:
//   'map:changed'    — base SVG needs redraw (was: Base.updateNight())
//   'hud:update'     — HUD bars/resources need refresh (was: HUD.update())
//
const Events = {
  _handlers: {},

  on(event, fn) {
    if (!this._handlers[event]) this._handlers[event] = [];
    this._handlers[event].push(fn);
  },

  off(event, fn) {
    if (!this._handlers[event]) return;
    this._handlers[event] = this._handlers[event].filter(f => f !== fn);
  },

  emit(event, data) {
    (this._handlers[event] || []).forEach(fn => {
      try { fn(data); } catch(e) { console.error(`[Events] ${event}:`, e); }
    });
  }
};

// ── Resource emoji lookup ──────────────────────────────────────────────────
// Shared by Crafting, Power, and any other module that displays resource names.
// Moved here so Power doesn't need to import Crafting just to show icons.
Utils.emojiMap = {
  wood:'🪵', metal:'🔩', gasoline:'⛽', food:'🥫', water:'💧',
  medicine:'💊', cloth:'🧶', electronics:'📟', rope:'🪢', chemicals:'🧪',
  spores:'🍄', wild_seeds:'🌱', engine_parts:'⚙️', scrap_wire:'🔌',
  circuit_board:'💾', antiseptic:'🧫', cave_crystal:'💎', military_chip:'🎖️',
  coal:'⛏', glass:'🪟',
  battery_cell:'🔋', copper_wire:'🔌', steel_casing:'🧊', capacitor:'💡', power_core:'⚡',
  solar_glass:'☀'
};
