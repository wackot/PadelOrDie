// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/PowerHouse.js
// ═══════════════════════════════════════════

const BuildingPowerHouse = {
  id: 'powerhouse', title: 'Power House', desc: 'Manage your generators and battery bank.',
  action: 'power', hitW: 70, hitH: 80,

  onOpen() { Game.goTo('power'); Power.renderPanel(); },

  svg(cx, cy, lv, hasPower) {
    const w = 50 + lv * 2, h = 44 + lv * 2;
    // Colour tiers: brick→concrete→steel→industrial
    const wallCol = lv <= 2 ? '#5a4a3a' : lv <= 4 ? '#4a4a5a' : lv <= 6 ? '#3a4a5a' : lv <= 8 ? '#304050' : '#283848';
    const roofCol = lv <= 2 ? '#4a3a2a' : lv <= 4 ? '#3a3a4a' : lv <= 6 ? '#2a3a4a' : lv <= 8 ? '#203040' : '#182838';
    const glowCol = hasPower ? '#ffd600' : '#3a3a2a';
    const gf = hasPower ? 'filter="url(#glow-electric)"' : '';

    // Rooftop units — 1 at lv1, up to 6 at lv10
    const unitCount = Math.min(lv, 6);  // 1 per level, capped at 6
    let rooftop = '';
    for (let i = 0; i < unitCount; i++) {
      const gx = cx - w / 2 + 6 + i * ((w - 12) / Math.max(unitCount - 1, 1));
      const unitH = 6 + Math.floor(lv / 3);
      rooftop += `<rect x="${gx - 5}" y="${cy - h / 2 - unitH}" width="10" height="${unitH}" fill="#505060" rx="1"/>`;
      if (hasPower) rooftop += `<rect x="${gx - 3}" y="${cy - h / 2 - unitH + 2}" width="6" height="2" fill="#ffd600" ${gf}/>`;
    }
    // Exhaust stacks from lv4
    const stacks = lv >= 4 ? `<rect x="${cx-w/2+8}" y="${cy-h/2-18}" width="7" height="18" fill="#4a4a5a" rx="1"/>
      <circle cx="${cx-w/2+11}" cy="${cy-h/2-20}" r="${3+Math.floor(lv/3)}" fill="#606060" opacity="0.4"/>` : '';
    // Second stack lv7
    const stack2 = lv >= 7 ? `<rect x="${cx+w/2-15}" y="${cy-h/2-22}" width="7" height="22" fill="#4a4a5a" rx="1"/>
      <circle cx="${cx+w/2-12}" cy="${cy-h/2-24}" r="${4+Math.floor(lv/3)}" fill="#606060" opacity="0.4"/>` : '';
    // Antenna
    const antX = cx + w / 2 - 8;
    const antH = 14 + lv * 3;  // grows every level
    const arc = hasPower ? `<path d="M${cx-14},${cy-8} Q${cx},${cy-22} ${cx+14},${cy-8}" fill="none" stroke="#ffd600" stroke-width="2" opacity="0.8" ${gf}/>` : '';
    // Window rows — 1 row lv1-3, 2 rows lv4-7, 3 rows lv8+
    const winRows = lv <= 3 ? 1 : lv <= 7 ? 2 : 3;
    let windows = '';
    for (let r = 0; r < winRows; r++) {
      const winY = cy - h / 2 + 8 + r * 14;
      const winW = lv >= 6 ? 18 : 12;
      windows += `<rect x="${cx-w/2+6}" y="${winY}" width="${winW}" height="8" fill="${hasPower ? '#29b6f6' : '#1a2a3a'}" rx="1" ${hasPower ? gf : ''}/>`;
      if (lv >= 5) windows += `<rect x="${cx+w/2-6-winW}" y="${winY}" width="${winW}" height="8" fill="${hasPower ? '#29b6f6' : '#1a2a3a'}" rx="1" ${hasPower ? gf : ''}/>`;
    }
    // Solar panels on roof lv8+
    const solar = lv >= 8 ? `<rect x="${cx-w/2+4}" y="${cy-h/2-4}" width="${w-8}" height="5" fill="#1a3a5a" rx="1"/>` : '';
    // Force field ring lv10
    const field = lv >= 10 ? `<ellipse cx="${cx}" cy="${cy}" rx="${w/2+14}" ry="${h/2+10}" fill="none" stroke="rgba(255,214,0,0.2)" stroke-width="4"/>` : '';

    return `<g filter="url(#shadow)">
      ${field}${stacks}${stack2}
      <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="${wallCol}" rx="2"/>
      ${solar}
      <rect x="${cx-w/2-2}" y="${cy-h/2-4}" width="${w+4}" height="6" fill="${roofCol}" rx="1"/>
      ${rooftop}
      <line x1="${antX}" y1="${cy-h/2-4}" x2="${antX}" y2="${cy-h/2-antH}" stroke="#707080" stroke-width="2"/>
      <circle cx="${antX}" cy="${cy-h/2-antH}" r="${2+Math.floor(lv/4)}" fill="${hasPower ? '#ff4444' : '#444'}" ${hasPower ? gf : ''}/>
      ${windows}
      <rect x="${cx-8}" y="${cy+h/2-18}" width="16" height="18" fill="#2a2a38" rx="1"/>
      <circle cx="${cx+5}" cy="${cy+h/2-9}" r="2" fill="#8a8aaa"/>
      <rect x="${cx-w/2+8}" y="${cy-4}" width="${10+lv}" height="10" fill="${glowCol}" rx="1" ${gf}/>
      <rect x="${cx+w/2-18-lv}" y="${cy-4}" width="${10+lv}" height="10" fill="${glowCol}" rx="1" ${gf}/>
      ${arc}
      <ellipse cx="${cx}" cy="${cy+h/2+5}" rx="${w/2+4}" ry="5" fill="rgba(0,0,0,0.25)"/>
      <text x="${cx}" y="${cy+h/2+44}" font-family="Press Start 2P" font-size="22" fill="${hasPower ? '#ffd600' : '#7a7a7a'}" text-anchor="middle">${hasPower ? '⚡ POWER Lv' + lv : 'POWERLESS'}</text>
    </g>`;
  },
};

// ─────────────────────────────────────────────

const BuildingElecBench = {
  id: 'elecbench', title: 'Electric Bench', desc: 'Craft electrical components and advanced upgrades.',
  action: 'elecbench', hitW: 70, hitH: 70,

  svg(cx, cy, lv) {
    const w = 46 + lv * 3, h = 32 + lv * 2;  // grows every level
    const hasPwr = typeof Power !== 'undefined' ? Power.hasPowerForCrafting(1) : false;
    const gf = hasPwr ? 'filter="url(#glow-electric)"' : '';
    const screenCol = hasPwr ? '#29b6f6' : '#1a2a3a';
    const sparkCol  = hasPwr ? '#ffd600' : '#3a3a3a';
    // Body colour evolves per level
    const bodyCol = lv <= 2 ? '#3a3a4a' : lv <= 4 ? '#2a3a4a' : lv <= 6 ? '#2a2a4a' : lv <= 8 ? '#1a2a4a' : '#181828';

    // Screen count grows with level
    const screens = lv <= 1 ? 1 : lv <= 3 ? 2 : lv <= 6 ? 3 : 4;  // unique per-level breakpoints
    let screenHtml = '';
    const screenW = Math.floor((w - 8) / screens) - 3;
    for (let s = 0; s < screens; s++) {
      const sx = cx - w / 2 + 4 + s * (screenW + 3);
      screenHtml += `<rect x="${sx}" y="${cy-h/2+4}" width="${screenW}" height="${Math.floor(h*0.45)}" fill="${screenCol}" rx="1" ${hasPwr ? gf : ''}/>`;
    }
    // Cable count grows
    let cables = '';
    const cableCount = 2 + Math.floor(lv / 3);
    const colors = ['#29b6f6','#ffd600','#4caf50','#ff7043','#9c27b0'];
    for (let i = 0; i < cableCount; i++) {
      const kx = cx - w / 2 + 8 + i * ((w - 16) / Math.max(cableCount - 1, 1));
      cables += `<path d="M${kx},${cy+h/2} Q${kx+4},${cy+h/2+8} ${kx-4},${cy+h/2+14}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="1.5" opacity="0.6"/>`;
    }
    // Antenna spires grow with level
    const spireCount = Math.min(1 + Math.floor(lv / 2), 5);  // grows every 2 levels
    let spires = '';
    for (let i = 0; i < spireCount; i++) {
      const sx = cx - w / 2 + 4 + i * ((w - 8) / Math.max(spireCount - 1, 1));
      const sh2 = 6 + Math.floor(lv / 2) + i;
      spires += `<rect x="${sx-2}" y="${cy-h/2-sh2}" width="4" height="${sh2}" fill="#5a5a6a" rx="1"/>`;
      if (hasPwr) spires += `<circle cx="${sx}" cy="${cy-h/2-sh2}" r="2" fill="${sparkCol}" ${gf} opacity="0.9"/>`;
    }
    // Holographic emitter lv8+
    const holo = lv >= 8 ? `<ellipse cx="${cx}" cy="${cy-h/2-2}" rx="${w/2-4}" ry="3" fill="rgba(41,182,246,0.15)" ${gf}/>` : '';

    return `<g filter="url(#shadow)">
      <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="${bodyCol}" rx="2"/>
      ${screenHtml}
      ${holo}
      <rect x="${cx-w/2}" y="${cy-h/2-8}" width="${w}" height="10" fill="${lv >= 5 ? '#1a1a30' : '#2a2a38'}" rx="1"/>
      ${spires}
      ${hasPwr ? `<circle cx="${cx+w/2-6}" cy="${cy-h/2+6}" r="3" fill="#4caf50" ${gf}/>` : ''}
      ${cables}
      <ellipse cx="${cx}" cy="${cy+h/2+6}" rx="${w/2+2}" ry="5" fill="rgba(0,0,0,0.2)"/>
      <text x="${cx}" y="${cy+h/2+44}" font-family="Press Start 2P" font-size="22" fill="${hasPwr ? '#29b6f6' : '#7a7a7a'}" text-anchor="middle">⚡ BENCH Lv${lv}</text>
    </g>`;
  },
};
