// ═══════════════════════════════════════════
// PEDAL OR DIE — events.js
// Central event bus — pub/sub system
// Load FIRST: all other modules depend on this
// ═══════════════════════════════════════════

const Events = (() => {
  const _listeners = {};

  return {
    on(event, callback) {
      if (!_listeners[event]) _listeners[event] = [];
      _listeners[event].push(callback);
    },

    off(event, callback) {
      if (!_listeners[event]) return;
      _listeners[event] = _listeners[event].filter(cb => cb !== callback);
    },

    emit(event, data) {
      if (!_listeners[event]) return;
      _listeners[event].forEach(cb => {
        try { cb(data); }
        catch (e) { console.error(`[Events] Error in handler for "${event}":`, e); }
      });
    }
  };
})();
