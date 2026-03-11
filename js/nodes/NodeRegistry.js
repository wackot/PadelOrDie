// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — NodeRegistry.js
//
// Central registry for per-resource-node scenes.
// Each node file (NodeWoodland.js, NodeScrapYard.js, …) registers
// itself here. foraging.js calls NodeRegistry.get(locationId) to
// obtain scene overrides before rendering.
//
// CONTRACT:
//   Each node module calls NodeRegistry.register(def) where def is:
//   {
//     keys: ['node_wood_1','node_wood_2',…] | matchFn: (id)=>bool,
//
//     // Foraging scene (replaces generic emoji background)
//     sceneHTML(loc, isNight): string   — inner HTML for .foraging-scene
//
//     // Combat arena background (replaces generic bgColor lookup)
//     arenaHTML(loc, animal, isNight): string  — full arena override or null
//
//     // Exclusive monster definition (added to encounter pool when at this node)
//     exclusiveMonster: { id, name, emoji, strength, baseStrength, loot:[] } | null
//
//     // Worldmap overlay draw fn — called by worldmap._drawBiomeDetail()
//     drawOverlay(ctx, x, y, w, h, seed): void
//   }
//
// LOAD ORDER: must load BEFORE all NodeXxx.js files AND before foraging.js
// ═══════════════════════════════════════════════════════════════

const NodeRegistry = {
  _defs: [],

  // Called by each NodeXxx.js at file load time
  register(def) {
    this._defs.push(def);
  },

  // Returns the first matching def for a locationId, or null
  get(locationId) {
    if (!locationId) return null;
    for (const def of this._defs) {
      if (typeof def.matchFn === 'function') {
        if (def.matchFn(locationId)) return def;
      } else if (Array.isArray(def.keys)) {
        // Node harvest sessions use ids like "node_wood_<idx>"
        for (const k of def.keys) {
          if (locationId.startsWith('node_' + k) || locationId === k) return def;
        }
      }
    }
    return null;
  },

  // Convenience: get scene HTML for foraging._buildScreen()
  sceneHTML(locationId, loc, isNight) {
    const def = this.get(locationId);
    if (def?.sceneHTML) return def.sceneHTML(loc, isNight);
    return null; // foraging.js falls back to generic rendering
  },

  // Convenience: get arena HTML override for foraging._buildArenaHTML()
  arenaHTML(locationId, loc, animal, isNight) {
    const def = this.get(locationId);
    if (def?.arenaHTML) return def.arenaHTML(loc, animal, isNight);
    return null;
  },

  // Inject exclusive monster into animal pool for this node type
  exclusiveMonster(locationId) {
    const def = this.get(locationId);
    return def?.exclusiveMonster || null;
  },

  // Draw worldmap overlay for a fogged/revealed cell
  drawOverlay(locationId, ctx, x, y, w, h, seed) {
    const def = this.get(locationId);
    if (def?.drawOverlay) def.drawOverlay(ctx, x, y, w, h, seed);
  },
};
