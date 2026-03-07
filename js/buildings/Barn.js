// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/Barn.js
// Everything specific to the Barn / Food Store:
//   • Registry entry (title, desc, action)
//   • SVG renderer (static — no upgrade levels)
//   • Navigation handler (opens fridge screen)
// ═══════════════════════════════════════════

const BuildingBarn = {

  // ── Registry ──────────────────────────────
  id:     'fridge',
  title:  'Food Store',
  desc:   'Eat food and manage supplies.',
  action: 'fridge',

  hitW: 70,
  hitH: 80,

  // ── Navigation handler ────────────────────
  onOpen() {
    Player.renderFridge();
    Game.goTo('fridge');
  },

  // ── SVG renderer ──────────────────────────
  svg(cx, cy) {
    const w = 58, h = 46;
    return `<g filter="url(#shadow)">
      <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#6a3818" rx="2"/>
      <!-- Gambrel roof -->
      <polygon points="${cx-w/2-4},${cy-h/2} ${cx+w/2+4},${cy-h/2} ${cx+w/2},${cy-h/2-16} ${cx-w/2},${cy-h/2-16}" fill="#4e2410"/>
      <polygon points="${cx-w/2},${cy-h/2-16} ${cx+w/2},${cy-h/2-16} ${cx},${cy-h/2-32}" fill="#7a3a18"/>
      <polygon points="${cx},${cy-h/2-32} ${cx+w/2},${cy-h/2-16} ${cx+2},${cy-h/2-30}" fill="rgba(0,0,0,0.2)"/>
      <!-- Barn door -->
      <rect x="${cx-12}" y="${cy-h/2+16}" width="24" height="${h/2+2}" fill="#2a1206" rx="1"/>
      <line x1="${cx-12}" y1="${cy-h/2+16}" x2="${cx+12}" y2="${cy+h/2}" stroke="#4a2010" stroke-width="2"/>
      <line x1="${cx+12}" y1="${cy-h/2+16}" x2="${cx-12}" y2="${cy+h/2}" stroke="#4a2010" stroke-width="2"/>
      <!-- Loft window (round) -->
      <circle cx="${cx}" cy="${cy-h/2+8}" r="7" fill="#1a1a2a" stroke="#5a3018" stroke-width="2"/>
      <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="32" ry="5" fill="rgba(0,0,0,0.2)"/>
      <text x="${cx}" y="${cy+h/2+18}"
        font-family="Press Start 2P" font-size="22" fill="#9a9a60" text-anchor="middle">FOOD STORE</text>
    </g>`;
  },

};

// ── Building screen data (for the bld-screen upgrade system) ──────────────
const BuildingFridgeScreen = {
  getScreenData(s) {
    const inv  = s.inventory;
    const food = inv.food || 0;
    const foodCap = s.base.buildings.storage?.level >= 1
      ? (State.data?.base?.maxFood || 100) : 100;
    const visual = `<svg width="120" height="90" viewBox="0 0 120 90">
      <rect x="30" y="18" width="60" height="58" fill="#2a1810" rx="3"/>
      <rect x="30" y="18" width="60" height="14" fill="#3a2010" rx="3"/>
      <rect x="38" y="38" width="18" height="16" fill="#1a1008" rx="1"/>
      <rect x="64" y="38" width="18" height="16" fill="#1a1008" rx="1"/>
      <text x="47" y="34" font-size="13" text-anchor="middle">🍖</text>
      <text x="73" y="34" font-size="13" text-anchor="middle">🥫</text>
      <text x="60" y="75" text-anchor="middle" font-size="9" fill="#888">${food}/${foodCap} food</text>
    </svg>`;
    const statsRows = `
      <div class="bsc-row ok"><span>Food stored</span><span>${food}</span></div>
      <div class="bsc-row"><span>Hunger rate</span><span>${Math.round((s.base?.hungerRate||0.5)*10)/10}/hr</span></div>`;
    const actionBtn = `<button class="bsc-action-btn" onclick="Player.eat?.()">🍖 EAT</button>`;
    return { title: '🥫 FOOD STORE', visual, statsRows, actionBtn };
  }
};
