// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/Well.js
// ═══════════════════════════════════════════

const BuildingWell = {
  id: 'well', title: 'Well', desc: 'Draw water from the well.', action: 'well',
  offsetX: -0.32, offsetY: 0.04,
  hitW: 70, hitH: 80,

  onOpen() {
    const el = document.getElementById('well-water-count');
    if (el) el.textContent = State.data.inventory.water;
    Game.goTo('well');
  },

  svg(cx, cy, lv = 1) {
    // 10 distinct tiers: colours, ring size, accessory additions per level
    const tier = Math.ceil(lv / 2) - 1; // 0-4
    const stoneA = ['#4a4a4a','#505060','#5a5070','#6a5878','#7a68a8'][tier];
    const stoneB = ['#3a3a3a','#404050','#4a4060','#5a4868','#6a5890'][tier];
    const waterCol = lv <= 2 ? '#0e2a40' : lv <= 4 ? '#1a4a6a' : lv <= 6 ? '#1a7aaa' : lv <= 8 ? '#20aadd' : '#40d0ff';
    const roofCol  = lv <= 2 ? '#7a3818' : lv <= 4 ? '#5a4820' : lv <= 6 ? '#5a5828' : lv <= 8 ? '#4a5848' : '#3a4858';
    const postCol  = lv <= 2 ? '#5a4020' : lv <= 4 ? '#6a5028' : lv <= 6 ? '#6a6030' : lv <= 8 ? '#686860' : '#606878';
    const rows = 3 + Math.floor((lv - 1) / 3); // 3,3,3,4,4,4,5,5,5,5
    const wellR = 20 + lv;
    const sw = 9, sh = 6;
    const cols = 8 + Math.floor(lv / 3);
    const topY = cy - rows * sh / 2 - 2;
    const postH = 34 + lv * 2;

    const stones = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offset = r % 2 === 0 ? 0 : sw / 2;
        const sx = cx - wellR + c * (sw + 1) + offset - sw / 2;
        const sy = cy - 6 + r * sh - rows * sh / 2;
        stones.push(`<rect x="${sx}" y="${sy}" width="${sw}" height="${sh - 1}" fill="${(r + c) % 2 === 0 ? stoneA : stoneB}" rx="1"/>`);
      }
    }

    const chain = lv >= 2 ? `<rect x="${cx-16}" y="${cy-32}" width="32" height="5" fill="${roofCol}" rx="2"/>
      <rect x="${cx-4}" y="${cy-34}" width="8" height="9" fill="#4a3820" rx="1"/>
      <line x1="${cx}" y1="${cy-28}" x2="${cx}" y2="${cy-12}" stroke="#8b7040" stroke-width="2" stroke-dasharray="4,2"/>
      <path d="M${cx-7} ${cy-20} L${cx-8} ${cy-10} L${cx+8} ${cy-10} L${cx+7} ${cy-20} Z" fill="#4a3a28"/>
      <rect x="${cx-5}" y="${cy-15}" width="10" height="4" fill="${waterCol}" rx="1"/>` : '';
    const pipe = lv >= 4 ? `<rect x="${cx+wellR}" y="${cy-14}" width="6" height="22" fill="#5a7a8a" rx="2"/>
      <ellipse cx="${cx+wellR+3}" cy="${cy+8}" rx="5" ry="3" fill="${waterCol}" opacity="0.7"/>` : '';
    const metalBand = lv >= 5 ? `<ellipse cx="${cx}" cy="${cy-2}" rx="${wellR+5}" ry="7" fill="none" stroke="#607080" stroke-width="3" opacity="0.6"/>` : '';
    const tank = lv >= 7 ? `<rect x="${cx-16}" y="${cy-78}" width="32" height="18" fill="#2a3a4a" rx="3"/>
      <rect x="${cx-14}" y="${cy-76}" width="28" height="14" fill="#1a5a7a" rx="2"/>
      <line x1="${cx}" y1="${cy-60}" x2="${cx}" y2="${cy-46}" stroke="#4a8aaa" stroke-width="2"/>` : '';
    const pump = lv >= 9 ? `<rect x="${cx+wellR+8}" y="${cy-56}" width="8" height="42" fill="#3a4a3a" rx="2"/>
      <circle cx="${cx+wellR+12}" cy="${cy-58}" r="6" fill="#2a6a2a"/>
      <text x="${cx+wellR+12}" y="${cy-55}" font-size="8" text-anchor="middle" fill="#80ff80">⚡</text>` : '';
    const runes = lv >= 10 ? `<ellipse cx="${cx}" cy="${cy-2}" rx="${wellR+12}" ry="${wellR*0.6}" fill="none" stroke="rgba(120,180,255,0.25)" stroke-width="4"/>` : '';

    return `<g filter="url(#shadow)">
      ${runes}${tank}${pump}
      <ellipse cx="${cx}" cy="${cy+8}" rx="${wellR+4}" ry="9" fill="#252525"/>
      ${stones.join('')}
      ${metalBand}
      <ellipse cx="${cx}" cy="${topY}" rx="${wellR+4}" ry="8" fill="${stoneA}"/>
      <ellipse cx="${cx}" cy="${topY}" rx="${wellR}" ry="6" fill="#1a3040"/>
      <ellipse cx="${cx}" cy="${topY}" rx="${wellR-4}" ry="5" fill="${waterCol}"/>
      <ellipse cx="${cx-4}" cy="${topY-1}" rx="5" ry="2" fill="rgba(100,200,255,0.35)"/>
      <rect x="${cx-wellR-2}" y="${cy-postH}" width="5" height="${postH}" fill="${postCol}" rx="1"/>
      <rect x="${cx+wellR-3}" y="${cy-postH}" width="5" height="${postH}" fill="${postCol}" rx="1"/>
      <polygon points="${cx-wellR-4},${cy-postH+2} ${cx+wellR+4},${cy-postH+2} ${cx},${cy-postH-18}" fill="${roofCol}"/>
      <polygon points="${cx},${cy-postH-18} ${cx+wellR+4},${cy-postH+2} ${cx+2},${cy-postH-16}" fill="rgba(0,0,0,0.22)"/>
      ${chain}${pipe}
      <ellipse cx="${cx}" cy="${cy+12}" rx="${wellR+6}" ry="5" fill="rgba(0,0,0,0.22)"/>
      <text x="${cx}" y="${cy+48}" font-family="Press Start 2P" font-size="22" fill="#9a9a60" text-anchor="middle">WELL Lv${lv}</text>
    </g>`;
  },
};

// ── Building screen data (for the bld-screen upgrade system) ──────────────
const BuildingWellScreen = {
  getScreenData(s) {
    const lv       = s.base.buildings.well?.level || 1;
    const inv      = s.inventory;
    const upg      = BuildingUpgrades.well;
    const def      = upg?.levels?.[lv - 1] || {};
    const waterPer = def.waterPerUse || 5;
    const passive  = def.passiveWater || 0;
    const elecPump = def.electricPump || false;
    const hasPump  = s.power?.consumers?.waterPump;
    const pumpNote = lv >= 8 ? (hasPump ? ' ⚡ pump active' : ' (needs power)') : '';

    const visual = `<svg width="120" height="100" viewBox="0 0 120 100">
      ${BuildingWell.svg(60, 65, lv)}
    </svg>`;
    const statsRows = `
      <div class="bsc-row"><span>Level</span><span>${lv}/10</span></div>
      <div class="bsc-row ok"><span>Water per draw</span><span>${waterPer}</span></div>
      ${passive > 0 ? `<div class="bsc-row ok"><span>Passive water/day</span><span>+${passive}${pumpNote}</span></div>` : ''}
      ${elecPump ? `<div class="bsc-row ${hasPump?'ok':''}"><span>Electric pump</span><span>${hasPump?'⚡ Running':'⚫ No power'}</span></div>` : ''}
      <div class="bsc-row"><span>Water stored</span><span>${inv.water || 0}</span></div>`;
    const actionBtn = `<button class="bsc-action-btn" onclick="Player.drawWater?.() || Utils.toast('Drew water!','good')">💧 DRAW WATER</button>`;
    return { title: '🪣 WELL', visual, statsRows, actionBtn };
  }
};
