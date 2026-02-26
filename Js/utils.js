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
