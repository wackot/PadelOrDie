// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/Workbench.js
// Crafting Table / Workshop building
// Also owns the Map Board (world map pin board)
// which sits beside the workbench on the base map.
// ═══════════════════════════════════════════

const BuildingWorkbench = {

  // ── Registry ──────────────────────────────
  id:     'table',
  title:  'Crafting Table',
  desc:   'Craft tools, weapons and upgrades.',
  action: 'crafting',

  hitW: 70,
  hitH: 70,

  // ── Navigation handler ────────────────────
  onOpen() {
    Game.goTo('crafting');
    Crafting.render();
  },

  svg(cx, cy, lvl = 0) {
    // 10 distinct tiers: colour, size, and attachments per level pair
    const tableCol = lvl <= 2 ? '#6a5030' : lvl <= 4 ? '#5a5840' : lvl <= 6 ? '#484858' : lvl <= 8 ? '#3a4868' : '#2a3878';
    const legCol   = lvl <= 2 ? '#5a4020' : lvl <= 4 ? '#505040' : lvl <= 6 ? '#404050' : lvl <= 8 ? '#303060' : '#202070';
    const topCol   = lvl <= 2 ? '#7a6040' : lvl <= 4 ? '#6a6850' : lvl <= 6 ? '#585868' : lvl <= 8 ? '#486878' : '#386888';
    // Table grows wider with level
    const tw = 52 + lvl * 3;

    const vise = lvl >= 2 ? `
      <rect x="${cx - 28}" y="${cy - 28}" width="4" height="14" fill="#8a7050" rx="1"/>
      <rect x="${cx - 31}" y="${cy - 30}" width="10" height="6" fill="#484848" rx="1"/>` : '';

    const drillPress = lvl >= 4 ? `
      <rect x="${cx + tw/2 - 4}" y="${cy - 42}" width="6" height="32" fill="#484848" rx="2"/>
      <rect x="${cx + tw/2 - 8}" y="${cy - 46}" width="14" height="8" fill="#383838" rx="2"/>
      <circle cx="${cx + tw/2 + 1}" cy="${cy - 12}" r="${3 + Math.floor(lvl/4)}" fill="#606060"/>
      <circle cx="${cx + tw/2 + 1}" cy="${cy - 12}" r="2" fill="#303030"/>` : '';

    const forge = lvl >= 6 ? `
      <rect x="${cx - tw/2 - 16}" y="${cy - 30}" width="18" height="32" fill="#3a2a1a" rx="2"/>
      <rect x="${cx - tw/2 - 14}" y="${cy - 26}" width="14" height="20" fill="#1a0a00" rx="1"/>
      <rect x="${cx - tw/2 - 14}" y="${cy - 10}" width="14" height="4"  fill="#ff6a00" rx="1" opacity="0.8"/>
      <text x="${cx - tw/2 - 7}" y="${cy - 28}" font-size="9" text-anchor="middle" fill="#ff9a00">🔥</text>` : '';

    const extTable = lvl >= 8 ? `
      <rect x="${cx + tw/2 + 6}" y="${cy - 10}" width="24" height="10" fill="${tableCol}" rx="2"/>
      <rect x="${cx + tw/2 + 8}" y="${cy - 13}" width="20" height="4" fill="${topCol}" rx="1"/>
      <rect x="${cx + tw/2 + 8}" y="${cy}" width="5" height="18" fill="${legCol}" rx="1"/>
      <rect x="${cx + tw/2 + 19}" y="${cy}" width="5" height="18" fill="${legCol}" rx="1"/>
      <text x="${cx + tw/2 + 14}" y="${cy - 15}" font-size="9" text-anchor="middle">🔬</text>` : '';

    const energyField = lvl >= 9 ? `
      <ellipse cx="${cx}" cy="${cy + 20}" rx="${tw/2 + 14}" ry="8" fill="rgba(100,140,255,0.1)" stroke="rgba(100,140,255,0.3)" stroke-width="1.5"/>` : '';
    const masterAura = lvl >= 10 ? `
      <ellipse cx="${cx}" cy="${cy + 20}" rx="${tw/2 + 18}" ry="9" fill="rgba(255,150,0,0.08)"/>
      <text x="${cx}" y="${cy - 54}" font-family="Press Start 2P" font-size="5" fill="#ffaa40" text-anchor="middle">MASTER FORGE</text>` : '';

    const sawBench = lvl >= 3 ? `
      <rect x="${cx - 8}" y="${cy - 24}" width="28" height="3" fill="#7a6040" rx="1"/>
      <polyline points="${cx - 8},${cy - 21} ${cx - 4},${cy - 17} ${cx},${cy - 21} ${cx + 4},${cy - 17} ${cx + 8},${cy - 21} ${cx + 12},${cy - 17} ${cx + 16},${cy - 21}" fill="none" stroke="#c0c0c0" stroke-width="1.5"/>` : '';

    const labelText = lvl === 0 ? 'CRAFTING' : `WORKSHOP Lv${lvl}`;
    return `<g filter="url(#shadow)">
      ${energyField}${masterAura}${forge}${extTable}
      <rect x="${cx - tw/2}" y="${cy - 10}" width="${tw}" height="10" fill="${tableCol}" rx="2"/>
      <rect x="${cx - tw/2 + 2}" y="${cy - 14}" width="${tw - 4}" height="5" fill="${topCol}" rx="1"/>
      <rect x="${cx - tw/2 + 4}" y="${cy}" width="6" height="18" fill="${legCol}" rx="1"/>
      <rect x="${cx + tw/2 - 10}" y="${cy}" width="6" height="18" fill="${legCol}" rx="1"/>
      ${vise}${sawBench}${drillPress}
      <rect x="${cx - tw/2}" y="${cy + 4}" width="${tw}" height="6" fill="#5a3a18" rx="1" opacity="0.6"/>
      <ellipse cx="${cx}" cy="${cy + 20}" rx="${tw/2 + 4}" ry="5" fill="rgba(0,0,0,0.2)"/>
      <text x="${cx}" y="${cy + 56}" font-family="Press Start 2P" font-size="22" fill="#9a9a60" text-anchor="middle">${labelText}</text>
    </g>`;
  },

};

// ─────────────────────────────────────────────
// Map Board — the pin-board next to the workbench
// Not an upgradeable building; static decoration
// that opens the World Map screen.
// ─────────────────────────────────────────────

const BuildingMapBoard = {

  id:     'map',
  title:  'World Map',
  desc:   'Choose your next expedition.',
  action: 'map',

  hitW: 70,
  hitH: 70,

  onOpen() {
    Game.goTo('map');
    WorldMap.render();
  },

  svg(cx, cy) {
    return `<g filter="url(#shadow)">
      <!-- Post -->
      <rect x="${cx - 3}" y="${cy + 4}" width="6" height="36" fill="#5a4020" rx="1"/>
      <!-- Board -->
      <rect x="${cx - 26}" y="${cy - 28}" width="52" height="40" fill="#6a5030" rx="3"/>
      <rect x="${cx - 23}" y="${cy - 25}" width="46" height="34" fill="#1e1208" rx="2"/>
      <!-- Map lines -->
      <line x1="${cx - 18}" y1="${cy - 18}" x2="${cx + 14}" y2="${cy - 18}" stroke="#3a3020" stroke-width="1"/>
      <line x1="${cx - 18}" y1="${cy - 10}" x2="${cx + 14}" y2="${cy - 10}" stroke="#3a3020" stroke-width="1"/>
      <line x1="${cx - 18}" y1="${cy - 2}"  x2="${cx + 14}" y2="${cy - 2}"  stroke="#3a3020" stroke-width="1"/>
      <line x1="${cx - 8}"  y1="${cy - 25}" x2="${cx - 8}"  y2="${cy + 9}"  stroke="#3a3020" stroke-width="1"/>
      <!-- Marked locations -->
      <circle cx="${cx - 12}" cy="${cy - 14}" r="3" fill="none" stroke="#ffd600" stroke-width="1.5"/>
      <polygon points="${cx - 12},${cy - 17} ${cx - 9},${cy - 11} ${cx - 15},${cy - 11}" fill="#ffd600" opacity="0.8"/>
      <circle cx="${cx + 8}" cy="${cy - 6}"  r="3" fill="none" stroke="#e53935" stroke-width="1.5"/>
      <line x1="${cx - 12}" y1="${cy - 14}" x2="${cx + 8}" y2="${cy - 6}" stroke="#7a7050" stroke-width="1" stroke-dasharray="3,2"/>
      <!-- Corner tacks -->
      <circle cx="${cx - 22}" cy="${cy - 24}" r="2" fill="#c8a840"/>
      <circle cx="${cx + 22}" cy="${cy - 24}" r="2" fill="#c8a840"/>
      <ellipse cx="${cx}" cy="${cy + 40}" rx="24" ry="4" fill="rgba(0,0,0,0.2)"/>
      <text x="${cx}" y="${cy + 70}"
        font-family="Press Start 2P" font-size="22" fill="#9a9a60" text-anchor="middle">WORLD MAP</text>
    </g>`;
  },

};
