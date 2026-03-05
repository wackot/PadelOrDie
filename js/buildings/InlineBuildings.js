// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/InlineBuildings.js
// Screen data for buildings whose map SVG is
// rendered elsewhere (Greenhouse, Field,
// Workshop, ElecBench).
// ═══════════════════════════════════════════

const BuildingGreenhouse = {
  id: 'greenhouse',

  // Map SVG renderer — 10 distinct visual stages
  svg(cx, cy, lv) {
    // Glass colour evolves: murky → bright → tinted → UV
    const glassCol = lv <= 2 ? '#a0d898' : lv <= 4 ? '#b8e8b0' : lv <= 6 ? '#c8f0c0' : lv <= 8 ? '#d0f8d0' : '#e0fff0';
    const frameCol = lv <= 2 ? '#5a6a30' : lv <= 4 ? '#4a7a30' : lv <= 6 ? '#3a8a30' : lv <= 8 ? '#2a9a40' : '#20b050';
    const w = 44 + lv * 5, h = 34 + lv * 4;
    // Number of internal dividers grows with level
    const dividers = Math.floor((lv - 1) / 2); // 0,0,1,1,2,2,3,3,4,4
    let divHtml = '';
    for (let d = 0; d < dividers; d++) {
      const dx = cx - w/2 + (w / (dividers + 1)) * (d + 1);
      divHtml += `<line x1="${dx}" y1="${cy-h/2+10}" x2="${dx}" y2="${cy+h/2+8}" stroke="${frameCol}" stroke-width="1.5" opacity="0.6"/>`;
    }
    // Horizontal ridge — from lv3
    const ridgeH = lv >= 3 ? `<line x1="${cx-w/2+3}" y1="${cy}" x2="${cx+w/2-3}" y2="${cy}" stroke="${frameCol}" stroke-width="1.5" opacity="0.5"/>` : '';
    // Roof vent from lv5
    const vent = lv >= 5 ? `<rect x="${cx-6}" y="${cy-h/2-12}" width="12" height="6" fill="${frameCol}" rx="1"/><rect x="${cx-4}" y="${cy-h/2-14}" width="8" height="4" fill="${glassCol}" opacity="0.6" rx="1"/>` : '';
    // Second tier / clerestory from lv7
    const clerestory = lv >= 7 ? `<polygon points="${cx-w/4},${cy-h/2+10} ${cx},${cy-h/2-28} ${cx+w/4},${cy-h/2+10}" fill="${frameCol}"/><polygon points="${cx-w/4+3},${cy-h/2+10} ${cx},${cy-h/2-24} ${cx+w/4-3},${cy-h/2+10}" fill="${glassCol}" opacity="0.5"/>` : '';
    // Hydroponic glow lv9+
    const hydroGlow = lv >= 9 ? `<rect x="${cx-w/2+4}" y="${cy}" width="${w-8}" height="${h/2-4}" fill="rgba(40,200,80,0.08)" rx="1"/>` : '';
    // UV grow lights lv10
    const uvLight = lv >= 10 ? `<rect x="${cx-w/2+6}" y="${cy-h/2+14}" width="${w-12}" height="4" fill="rgba(160,80,255,0.25)" rx="1" filter="url(#glow-blue)"/>` : '';
    return `<g filter="url(#shadow)">
      <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="${w/2+4}" ry="5" fill="rgba(0,0,0,0.25)"/>
      <rect x="${cx-w/2}" y="${cy-h/2+10}" width="${w}" height="${h}" fill="${frameCol}" rx="3"/>
      <polygon points="${cx-w/2},${cy-h/2+10} ${cx},${cy-h/2-14} ${cx+w/2},${cy-h/2+10}" fill="${frameCol}"/>
      <polygon points="${cx-w/2+3},${cy-h/2+10} ${cx},${cy-h/2-10} ${cx+w/2-3},${cy-h/2+10}" fill="${glassCol}" opacity="0.55"/>
      <rect x="${cx-w/2+3}" y="${cy-h/2+13}" width="${w-6}" height="${h-6}" fill="${glassCol}" opacity="0.4" rx="2"/>
      ${uvLight}${hydroGlow}${ridgeH}${divHtml}${clerestory}${vent}
      <text x="${cx}" y="${cy+h/2+26}" font-family="Press Start 2P" font-size="22" fill="#6ab060" text-anchor="middle">GH Lv${lv}</text>
    </g>`;
  },

  getScreenData(s) {
    const bld = s.base.buildings;
    const lv  = bld.greenhouse?.level || 0;
    const pf  = s.base.passiveFood || 0;
    const visual = `<svg width="120" height="90" viewBox="0 0 120 90">
      <polygon points="10,55 60,8 110,55" fill="rgba(80,180,80,0.12)" stroke="#3a7a3a" stroke-width="2"/>
      <line x1="60" y1="8" x2="60" y2="55" stroke="#3a7a3a" stroke-width="1" opacity="0.5"/>
      <line x1="10" y1="35" x2="110" y2="35" stroke="#3a7a3a" stroke-width="1" opacity="0.4"/>
      <rect x="15" y="55" width="90" height="25" fill="#2a2018" rx="2"/>
      ${lv > 0 ? Array.from({length:3},(_,i)=>`
        <rect x="${22+i*30}" y="58" width="18" height="18" fill="#1a4a1a" rx="1"/>
        <text x="${31+i*30}" y="${52}" font-size="14" text-anchor="middle">${['🌱','🌿','🌱'][i]}</text>
      `).join('') : '<text x="60" y="42" text-anchor="middle" font-size="11" fill="#555">— empty —</text>'}
    </svg>`;
    const statsRows = lv === 0
      ? `<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>`
      : `<div class="bsc-row"><span>Level</span><span>${lv} / 5</span></div>
         <div class="bsc-row ok"><span>Passive food per day</span><span>+${pf}</span></div>`;
    return { title: '🌿 GREENHOUSE', visual, statsRows, actionBtn: '' };
  },
};

// ─────────────────────────────────────────────

const BuildingField = {
  id: 'field',

  // Map SVG renderer — 10 distinct visual stages
  svg(cx, cy, lv) {
    // Plot count and crop variety grow with level
    const rows = Math.min(1 + Math.ceil(lv / 3), 5);
    const cols = Math.min(2 + Math.ceil(lv / 2), 7);
    const cellW = 13 + Math.floor(lv / 5);
    const cellH = 11 + Math.floor(lv / 5);
    const fw = cols * cellW + 8, fh = rows * cellH + 8;
    // Soil colour gets richer with level
    const soilCol = lv <= 2 ? '#1a0e04' : lv <= 5 ? '#2a1808' : lv <= 8 ? '#1e2808' : '#182a10';
    const borderCol = lv <= 3 ? '#4a3820' : lv <= 6 ? '#3a4820' : '#2a5020';
    const cropEmoji = ['🌾','🥕','🌽','🥬','🍅','🫑','🌿','🥦'];
    let crops = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const bx = cx - fw/2 + 4 + c * cellW;
        const by = cy - fh/2 + 6 + r * cellH;
        // Soil colour variation per plot
        const shade = (r + c) % 2 === 0 ? soilCol : soilCol.replace(/[0-9a-f]{2}/g, h => Math.min(parseInt(h,16)+8, 255).toString(16).padStart(2,'0'));
        crops += `<rect x="${bx}" y="${by}" width="${cellW-1}" height="${cellH-1}" fill="${shade}" rx="1"/>`;
        if (lv >= 2) crops += `<text x="${bx+cellW/2}" y="${by+cellH-1}" font-size="${6+Math.floor(lv/5)}" text-anchor="middle">${cropEmoji[(r*cols+c + lv)%cropEmoji.length]}</text>`;
      }
    }
    // Irrigation channels from lv4
    let irrigation = '';
    if (lv >= 4) {
      for (let c = 0; c <= cols; c++) {
        const ix = cx - fw/2 + 4 + c * cellW - 1;
        irrigation += `<line x1="${ix}" y1="${cy-fh/2+4}" x2="${ix}" y2="${cy+fh/2+2}" stroke="#1a5a7a" stroke-width="1" opacity="0.5"/>`;
      }
    }
    // Scarecrow from lv6
    const scarecrow = lv >= 6 ? `<line x1="${cx+fw/2+6}" y1="${cy-fh/4}" x2="${cx+fw/2+6}" y2="${cy+fh/4}" stroke="#6a4a20" stroke-width="3"/><line x1="${cx+fw/2-2}" y1="${cy-fh/4+8}" x2="${cx+fw/2+14}" y2="${cy-fh/4+8}" stroke="#6a4a20" stroke-width="2"/><text x="${cx+fw/2+6}" y="${cy-fh/4+4}" font-size="12" text-anchor="middle">🎃</text>` : '';
    // Greenhouse extension lv8+
    const ext = lv >= 8 ? `<rect x="${cx-fw/2-16}" y="${cy-fh/2}" width="14" height="${fh}" fill="#3a6a30" rx="2" opacity="0.7"/><rect x="${cx-fw/2-15}" y="${cy-fh/2+2}" width="12" height="${fh-4}" fill="rgba(180,240,180,0.2)" rx="1"/>` : '';
    return `<g filter="url(#shadow)">
      ${ext}
      <ellipse cx="${cx}" cy="${cy+fh/2+5}" rx="${fw/2+4}" ry="5" fill="rgba(0,0,0,0.25)"/>
      <rect x="${cx-fw/2-3}" y="${cy-fh/2-3}" width="${fw+6}" height="${fh+6}" fill="${borderCol}" rx="3"/>
      <rect x="${cx-fw/2}" y="${cy-fh/2}" width="${fw}" height="${fh}" fill="${soilCol}" rx="2"/>
      ${irrigation}${crops}${scarecrow}
      <text x="${cx}" y="${cy+fh/2+26}" font-family="Press Start 2P" font-size="22" fill="#8a9a40" text-anchor="middle">FIELD Lv${lv}</text>
    </g>`;
  },

  getScreenData(s) {
    const bld    = s.base.buildings;
    const lv     = bld.field?.level || 0;
    const plots  = typeof Farming !== 'undefined' ? Farming._plotsForLevel(lv) : lv * 2;
    const farming = s.farming;
    const ready  = farming ? farming.plots.filter(p=>p.state==='ready').length : 0;
    const growing= farming ? farming.plots.filter(p=>p.state==='growing').length : 0;
    const visual = `<svg width="120" height="80" viewBox="0 0 120 80">
      <rect x="5" y="48" width="110" height="22" fill="#2a1808" rx="2"/>
      <rect x="5" y="43" width="110" height="8" fill="#3a2010" rx="1"/>
      ${lv > 0 ? Array.from({length:Math.min(plots,8)},(_,i)=>`
        <line x1="${10+i*13}" y1="44" x2="${10+i*13}" y2="${26}" stroke="#5a8a20" stroke-width="2"/>
        <text x="${10+i*13}" y="${22}" font-size="11" text-anchor="middle">🌾</text>
      `).join('') : '<text x="60" y="36" text-anchor="middle" font-size="9" fill="#555">— not built —</text>'}
    </svg>`;
    const actionBtn = lv > 0 ? `<button class="bsc-action-btn" onclick="Farming.open()">🌾 MANAGE FARM</button>` : '';
    const statsRows = lv === 0
      ? `<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>`
      : `<div class="bsc-row"><span>Level</span><span>${lv} / 5</span></div>
         <div class="bsc-row ok"><span>Active plots</span><span>${plots} / 10</span></div>
         <div class="bsc-row ok"><span>Growing</span><span>${growing} plots</span></div>
         <div class="bsc-row ${ready>0?'ok':''}"><span>Ready to harvest</span><span>${ready>0?'✅ '+ready+' ready':'none'}</span></div>`;
    return { title: '🌾 CROP FIELD', visual, statsRows, actionBtn };
  },
};

// ─────────────────────────────────────────────

const BuildingWorkshop = {
  id: 'workshop',
  getScreenData(s) {
    const lv   = s.base.buildings.workshop?.level || 0;
    const disc = Math.round((1-(s.base.craftCostMult||1))*100);
    const beff = Math.round(((s.base.bikeEfficiency||1)-1)*100);
    const visual = `<svg width="120" height="90" viewBox="0 0 120 90">
      <rect x="10" y="28" width="100" height="52" fill="#2a2018" rx="3"/>
      <rect x="10" y="28" width="100" height="14" fill="#3a2820" rx="3"/>
      <rect x="20" y="48" width="22" height="24" fill="#1a1610"/>
      <rect x="52" y="52" width="16" height="12" fill="#3a2810" rx="1"/>
      <rect x="78" y="46" width="24" height="22" fill="#1a1610" rx="1"/>
      <text x="31" y="44" font-size="14" text-anchor="middle">🔧</text>
      <text x="90" y="44" font-size="14" text-anchor="middle">🪛</text>
      <text x="60" y="84" text-anchor="middle" font-size="9" fill="#888">${lv>0?'Lv'+lv:'Not built'}</text>
    </svg>`;
    const statsRows = lv === 0
      ? `<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>`
      : `<div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
         <div class="bsc-row ok"><span>Crafting discount</span><span>-${disc}%</span></div>
         <div class="bsc-row ok"><span>Bike efficiency</span><span>+${beff}%</span></div>`;
    return { title: '🔧 WORKSHOP', visual, statsRows, actionBtn: '' };
  },
};

// ─────────────────────────────────────────────

const BuildingElecBenchScreen = {
  id: 'elecbench',
  getScreenData(s) {
    const lv      = s.base.buildings.elecbench?.level || 0;
    const powered = typeof Power !== 'undefined' ? Power.hasPowerForCrafting?.(1) : false;
    const visual = `<svg width="120" height="90" viewBox="0 0 120 90">
      <rect x="10" y="38" width="100" height="42" fill="#1a1a2a" rx="3"/>
      <rect x="10" y="38" width="100" height="12" fill="#2a2a3a" rx="3"/>
      ${lv>0&&powered ? '<text x="60" y="34" text-anchor="middle" font-size="11" fill="#ffd600">⚡ POWERED ⚡</text>' : ''}
      <rect x="18" y="56" width="20" height="18" fill="#0d0d1a" rx="1"/>
      <rect x="50" y="52" width="28" height="22" fill="#0d0d1a" rx="1"/>
      <rect x="88" y="58" width="16" height="16" fill="#0d0d1a" rx="1"/>
      <text x="60" y="86" text-anchor="middle" font-size="9" fill="#888">${lv>0?'Lv'+lv:'Not built'}</text>
    </svg>`;
    const actionBtn = lv > 0
      ? `<button class="bsc-action-btn" data-goto="crafting" data-crafting-tab="electric">🔬 CRAFT ELECTRONICS</button>`
      : '';
    const statsRows = lv === 0
      ? `<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>`
      : `<div class="bsc-row"><span>Level</span><span>${lv} / 5</span></div>
         <div class="bsc-row ${powered?'ok':'locked'}"><span>Power supply</span><span>${powered?'⚡ Online':'❌ No power — build generator'}</span></div>`;
    return { title: '🔬 ELECTRIC BENCH', visual, statsRows, actionBtn };
  },
};
