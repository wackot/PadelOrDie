// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/UtilityBuildings.js
// Watchtower, CompostBin, Smokehouse,
// AlarmSystem, MedkitStation, Bunker
// All 10 levels with distinct visuals
// ═══════════════════════════════════════════

const BuildingWatchtower = {
  id:'watchtower', title:'Watchtower', desc:'Spot raiders earlier.', action:'upgrades',
  hitW:60, hitH:90,
  svg(cx, cy, lv) {
    const h = 32 + lv * 9;
    const woodCol  = lv <= 3 ? '#7a5a28' : lv <= 6 ? '#6a6030' : '#505870';
    const roofCol  = lv <= 3 ? '#5a3a18' : lv <= 6 ? '#4a5018' : '#384858';
    const flagCol  = lv <= 3 ? '#c04020' : lv <= 6 ? '#e08020' : '#20a0e0';
    const legSpread = 10 + lv * 1.4;
    const braces = Math.min(lv, 5);
    const parts = [];
    parts.push(`<ellipse cx="${cx}" cy="${cy+30}" rx="${12+lv*2}" ry="5" fill="rgba(0,0,0,0.3)"/>`);
    parts.push(`<line x1="${cx-legSpread}" y1="${cy+26}" x2="${cx-6}" y2="${cy-h+8}" stroke="${woodCol}" stroke-width="${3+Math.floor(lv/3)}" stroke-linecap="round"/>`);
    parts.push(`<line x1="${cx+legSpread}" y1="${cy+26}" x2="${cx+6}" y2="${cy-h+8}" stroke="${woodCol}" stroke-width="${3+Math.floor(lv/3)}" stroke-linecap="round"/>`);
    if (lv >= 4) {
      parts.push(`<line x1="${cx-legSpread*0.6}" y1="${cy+26}" x2="${cx-2}" y2="${cy-h+8}" stroke="${woodCol}" stroke-width="2.5" opacity="0.7"/>`);
      parts.push(`<line x1="${cx+legSpread*0.6}" y1="${cy+26}" x2="${cx+2}" y2="${cy-h+8}" stroke="${woodCol}" stroke-width="2.5" opacity="0.7"/>`);
    }
    for (let b = 0; b < braces; b++) {
      const by = cy + 18 - b * (h / braces);
      parts.push(`<line x1="${cx-legSpread*(1-b/braces*0.7)}" y1="${by}" x2="${cx+legSpread*(1-b/braces*0.7)}" y2="${by-6}" stroke="${woodCol}" stroke-width="2" opacity="0.6"/>`);
    }
    const platW = 16 + lv;
    parts.push(`<rect x="${cx-platW}" y="${cy-h}" width="${platW*2}" height="7" fill="${woodCol}" rx="1"/>`);
    parts.push(`<rect x="${cx-platW}" y="${cy-h-12}" width="${platW*2}" height="3" fill="${lv >= 6 ? '#607060' : '#5a4030'}" rx="1"/>`);
    parts.push(`<line x1="${cx-platW}" y1="${cy-h}" x2="${cx-platW}" y2="${cy-h-12}" stroke="${woodCol}" stroke-width="2"/>`);
    parts.push(`<line x1="${cx+platW}" y1="${cy-h}" x2="${cx+platW}" y2="${cy-h-12}" stroke="${woodCol}" stroke-width="2"/>`);
    parts.push(`<polygon points="${cx-platW-4},${cy-h-8} ${cx},${cy-h-32-lv} ${cx+platW+4},${cy-h-8}" fill="${roofCol}"/>`);
    parts.push(`<line x1="${cx}" y1="${cy-h-32-lv}" x2="${cx}" y2="${cy-h-52-lv}" stroke="#888" stroke-width="1.5"/>`);
    parts.push(`<polygon points="${cx},${cy-h-52-lv} ${cx+12+lv},${cy-h-46-lv} ${cx},${cy-h-40-lv}" fill="${flagCol}"/>`);
    parts.push(`<circle cx="${cx}" cy="${cy-h-4}" r="4" fill="#8a7060"/>`);
    parts.push(`<rect x="${cx-3}" y="${cy-h}" width="6" height="8" fill="#5a4030" rx="1"/>`);
    if (lv >= 5) parts.push(`<ellipse cx="${cx+platW+10}" cy="${cy-h+2}" rx="8" ry="5" fill="#ffe060" opacity="0.2" filter="url(#glow-yellow)"/><circle cx="${cx+platW+7}" cy="${cy-h+2}" r="4" fill="#ffe060" opacity="0.7" filter="url(#glow-yellow)"/>`);
    if (lv >= 7) parts.push(`<line x1="${cx-platW}" y1="${cy-h-8}" x2="${cx-platW-14}" y2="${cy-h-28}" stroke="#888" stroke-width="1.5"/><circle cx="${cx-platW-14}" cy="${cy-h-30}" r="3" fill="#ffd600" opacity="0.9" filter="url(#glow-yellow)"/>`);
    if (lv >= 9) parts.push(`<ellipse cx="${cx}" cy="${cy-h-14}" rx="${platW+12}" ry="20" fill="none" stroke="rgba(100,200,255,0.2)" stroke-width="3"/>`);
    parts.push(`<text x="${cx}" y="${cy+48}" font-family="Press Start 2P" font-size="20" fill="#a0b0a0" text-anchor="middle">WATCH Lv${lv}</text>`);
    return `<g filter="url(#shadow)">${parts.join('')}</g>`;
  },
};

// ─────────────────────────────────────────────

const BuildingCompostBin = {
  id:'compost_bin', title:'Compost Bin', desc:'Turns food waste into fertiliser.', action:'upgrades',
  hitW:60, hitH:60,
  svg(cx, cy, lv) {
    const bins = lv <= 2 ? 1 : lv <= 4 ? 2 : lv <= 7 ? 3 : 4;  // unique breakpoints
    const binW = 20 + lv * 2 + (lv % 2);  // odd levels get +1px variation
    const binH = 26 + lv * 2;
    const col    = lv <= 3 ? '#4a3018' : lv <= 6 ? '#3a4018' : '#2a5028';
    const lidCol = lv <= 3 ? '#5a4020' : lv <= 6 ? '#4a5020' : '#3a6030';
    const spacing = binW + 6;
    const totalW = bins * spacing - 6;
    const startX = cx - totalW / 2;
    const parts = [];
    parts.push(`<ellipse cx="${cx}" cy="${cy+20}" rx="${totalW/2+8}" ry="5" fill="rgba(0,0,0,0.25)"/>`);
    for (let b = 0; b < bins; b++) {
      const bx = startX + b * spacing;
      const bcx = bx + binW / 2;
      parts.push(`<rect x="${bx}" y="${cy-18}" width="${binW}" height="${binH}" fill="${col}" rx="3"/>`);
      parts.push(`<line x1="${bx+4}" y1="${cy-18}" x2="${bx+4}" y2="${cy-18+binH}" stroke="#2a1808" stroke-width="1.5" opacity="0.5"/>`);
      parts.push(`<line x1="${bx+binW-4}" y1="${cy-18}" x2="${bx+binW-4}" y2="${cy-18+binH}" stroke="#2a1808" stroke-width="1.5" opacity="0.5"/>`);
      parts.push(`<rect x="${bx}" y="${cy-5}" width="${binW}" height="3" fill="#6a6040" rx="1" opacity="0.7"/>`);
      parts.push(`<ellipse cx="${bcx}" cy="${cy-18}" rx="${binW/2+1}" ry="4" fill="${lidCol}"/>`);
      parts.push(`<ellipse cx="${bcx}" cy="${cy-17}" rx="${binW/2-3}" ry="3" fill="#3a5010"/>`);
      // Steam wisps — more at higher levels
      const wispCount = Math.min(lv, 3);
      for (let w = 0; w < wispCount; w++) {
        const wx = bcx - 4 + w * 4;
        parts.push(`<path d="M${wx},${cy-24} Q${wx-4},${cy-32} ${wx},${cy-40}" fill="none" stroke="#6a8a30" stroke-width="1.5" opacity="${0.5-w*0.1}" stroke-dasharray="3,2"/>`);
      }
    }
    if (lv >= 4) {
      for (let b = 0; b < bins - 1; b++) {
        const bx1 = startX + b * spacing + binW;
        const bx2 = startX + (b+1) * spacing;
        parts.push(`<rect x="${bx1}" y="${cy-7}" width="${bx2-bx1}" height="4" fill="#5a5040" rx="2"/>`);
      }
    }
    if (lv >= 7) parts.push(`<rect x="${cx+totalW/2}" y="${cy-2}" width="8" height="5" fill="#7a6030" rx="1"/><circle cx="${cx+totalW/2+12}" cy="${cy}" r="3" fill="#4a8a10" opacity="0.8"/>`);
    if (lv >= 9) parts.push(`<ellipse cx="${cx}" cy="${cy-50}" rx="18" ry="10" fill="rgba(80,160,40,0.2)" stroke="#5a9030" stroke-width="1.5"/><line x1="${cx}" y1="${cy-40}" x2="${cx}" y2="${cy-22}" stroke="#5a9030" stroke-width="2"/>`);
    parts.push(`<text x="${cx}" y="${cy+38}" font-family="Press Start 2P" font-size="20" fill="#6a8a30" text-anchor="middle">COMPOST Lv${lv}</text>`);
    return `<g filter="url(#shadow)">${parts.join('')}</g>`;
  },
};

// ─────────────────────────────────────────────

const BuildingSmokehouse = {
  id:'smokehouse', title:'Smokehouse', desc:'Preserve food for longer storage.', action:'upgrades',
  hitW:60, hitH:80,
  svg(cx, cy, lv) {
    const w = 40 + lv * 3;
    const wallH = 26 + lv * 3;
    const roofH = 20 + lv * 2;
    const wallCol = lv <= 3 ? '#6a5a48' : lv <= 6 ? '#5a4a3a' : '#404040';
    const roofCol = lv <= 3 ? '#4a3018' : lv <= 6 ? '#3a3028' : '#282838';
    const chmnH = 16 + lv * 4;
    const chmnCount = lv <= 3 ? 1 : lv <= 7 ? 2 : 3;
    const parts = [];
    parts.push(`<ellipse cx="${cx}" cy="${cy+28}" rx="${w/2+4}" ry="6" fill="rgba(0,0,0,0.3)"/>`);
    parts.push(`<rect x="${cx-w/2-2}" y="${cy+18}" width="${w+4}" height="8" fill="#3a2a18" rx="1"/>`);
    parts.push(`<rect x="${cx-w/2}" y="${cy-wallH+18}" width="${w}" height="${wallH}" fill="${wallCol}" rx="2"/>`);
    const plankCount = Math.min(lv, 6);
    for (let r = 1; r <= plankCount; r++) {
      const ry = cy - wallH + 18 + r * (wallH / (plankCount + 1));
      parts.push(`<line x1="${cx-w/2}" y1="${ry}" x2="${cx+w/2}" y2="${ry}" stroke="#2a1a08" stroke-width="1.5" opacity="0.4"/>`);
    }
    parts.push(`<rect x="${cx-8}" y="${cy+2}" width="16" height="20" fill="#2a1a08" rx="1"/>`);
    if (lv >= 3) parts.push(`<circle cx="${cx+5}" cy="${cy+12}" r="2" fill="#888"/>`);
    parts.push(`<polygon points="${cx-w/2-2},${cy-wallH+18} ${cx},${cy-wallH-roofH+18} ${cx+w/2+2},${cy-wallH+18}" fill="${roofCol}"/>`);
    const chmnXs = chmnCount === 1 ? [cx+8] : chmnCount === 2 ? [cx-8, cx+14] : [cx-12, cx+2, cx+16];
    chmnXs.forEach((chx, i) => {
      parts.push(`<rect x="${chx-4}" y="${cy-wallH-roofH-chmnH+18}" width="8" height="${chmnH}" fill="${lv >= 7 ? '#3a3040' : '#4a3a28'}" rx="1"/>`);
      const r1 = 4+lv+i, r2 = 6+lv+i, r3 = 8+lv+i;
      parts.push(`<circle cx="${chx}" cy="${cy-wallH-roofH-chmnH+14}" r="${r1}" fill="#888" opacity="0.45"/>`);
      parts.push(`<circle cx="${chx+3}" cy="${cy-wallH-roofH-chmnH+4}" r="${r2}" fill="#777" opacity="0.3"/>`);
      parts.push(`<circle cx="${chx-2}" cy="${cy-wallH-roofH-chmnH-8}" r="${r3}" fill="#666" opacity="0.18"/>`);
    });
    if (lv >= 4) {
      parts.push(`<rect x="${cx-w/2+5}" y="${cy-wallH+26}" width="8" height="5" fill="#0a0808" rx="1"/>`);
      parts.push(`<rect x="${cx+w/2-13}" y="${cy-wallH+26}" width="8" height="5" fill="#0a0808" rx="1"/>`);
    }
    if (lv >= 6) parts.push(`<rect x="${cx-w/2}" y="${cy-wallH+18+wallH*0.4}" width="${w}" height="3" fill="#5a6060" rx="1" opacity="0.6"/>`);
    if (lv >= 8) parts.push(`<rect x="${cx+w/2-16}" y="${cy-wallH+10}" width="14" height="8" fill="#2a3a5a" rx="2"/><circle cx="${cx+w/2-9}" cy="${cy-wallH+14}" r="2" fill="#4040ff" opacity="0.9" filter="url(#glow-blue)"/>`);
    if (lv >= 10) parts.push(`<ellipse cx="${cx}" cy="${cy+18}" rx="${w/2}" ry="3" fill="rgba(255,100,0,0.12)"/>`);
    parts.push(`<text x="${cx}" y="${cy+46}" font-family="Press Start 2P" font-size="20" fill="#9a7a5a" text-anchor="middle">SMOKE Lv${lv}</text>`);
    return `<g filter="url(#shadow)">${parts.join('')}</g>`;
  },
};

// ─────────────────────────────────────────────

const BuildingAlarmSystem = {
  id:'alarm_system', title:'Alarm System', desc:'Triggers on perimeter breach.', action:'upgrades',
  hitW:50, hitH:70,
  svg(cx, cy, lv) {
    const poleH = 36 + lv * 5;
    const bellCol = lv <= 2 ? '#c0a020' : lv <= 5 ? '#ffd700' : lv <= 8 ? '#ff8c00' : '#ff4444';
    const elCol   = lv <= 3 ? '#2a3a5a' : lv <= 6 ? '#1a2a6a' : '#1a1a8a';
    const bellW   = 11 + lv;
    const bellY   = cy - poleH + 10;
    const parts   = [];
    parts.push(`<ellipse cx="${cx}" cy="${cy+20}" rx="${12+lv*1.5}" ry="4" fill="rgba(0,0,0,0.25)"/>`);
    parts.push(`<rect x="${cx-3}" y="${cy-poleH+20}" width="6" height="${poleH}" fill="#5a5040" rx="2"/>`);
    parts.push(`<rect x="${cx-14}" y="${cy+14}" width="28" height="7" fill="#4a4030" rx="2"/>`);
    // Bell evolution by level tier
    if (lv <= 3) {
      // Simple brass bell
      parts.push(`<ellipse cx="${cx}" cy="${bellY}" rx="${bellW}" ry="${bellW*0.7}" fill="${bellCol}"/>`);
      parts.push(`<ellipse cx="${cx}" cy="${bellY-6}" rx="${bellW}" ry="${bellW*0.55}" fill="${bellCol}"/>`);
      parts.push(`<path d="M${cx-bellW},${bellY} Q${cx-bellW-3},${bellY+8} ${cx},${bellY+10} Q${cx+bellW+3},${bellY+8} ${cx+bellW},${bellY}" fill="${bellCol}"/>`);
      parts.push(`<circle cx="${cx}" cy="${bellY+10}" r="3" fill="#8a7010"/>`);
    } else if (lv <= 6) {
      // Electric siren box
      parts.push(`<rect x="${cx-bellW}" y="${bellY-8}" width="${bellW*2}" height="${bellW*1.4}" fill="${elCol}" rx="3"/>`);
      parts.push(`<ellipse cx="${cx}" cy="${bellY-2}" rx="${bellW-2}" ry="6" fill="${bellCol}" opacity="0.85"/>`);
      const nLights = 2 + lv;
      for (let i = 0; i < nLights; i++) {
        const ang = (i / nLights) * Math.PI * 2;
        parts.push(`<circle cx="${cx+Math.cos(ang)*(bellW-4)}" cy="${bellY-2+Math.sin(ang)*4}" r="2" fill="${i%2===0?'#ff4040':'#4040ff'}" opacity="0.9"/>`);
      }
    } else {
      // High-tech tower siren
      parts.push(`<rect x="${cx-bellW}" y="${bellY-10}" width="${bellW*2}" height="${bellW*1.6}" fill="${elCol}" rx="3"/>`);
      parts.push(`<rect x="${cx-bellW+2}" y="${bellY-8}" width="${bellW*2-4}" height="4" fill="#3a4a8a" rx="1"/>`);
      parts.push(`<ellipse cx="${cx}" cy="${bellY}" rx="${bellW-3}" ry="5" fill="${bellCol}" filter="url(#glow-yellow)"/>`);
      parts.push(`<circle cx="${cx-bellW+5}" cy="${bellY+4}" r="3" fill="#ff4040" opacity="0.9"/>`);
      parts.push(`<circle cx="${cx+bellW-5}" cy="${bellY+4}" r="3" fill="#4040ff" opacity="0.9"/>`);
      if (lv >= 9) {
        for (let row=0; row<3; row++) parts.push(`<line x1="${cx-bellW+4}" y1="${bellY-4+row*3}" x2="${cx+bellW-4}" y2="${bellY-4+row*3}" stroke="#5a6a9a" stroke-width="1"/>`);
      }
    }
    const boxH = 8 + Math.floor(lv/2)*2;
    parts.push(`<rect x="${cx-12}" y="${cy-16}" width="24" height="${boxH}" fill="${elCol}" rx="2"/>`);
    const dots = Math.min(lv, 6);
    for (let d=0; d<dots; d++) parts.push(`<circle cx="${cx-10+d*4}" cy="${cy-12}" r="1.5" fill="${d%2===0?'#4040ff':'#ff4040'}" opacity="0.8"/>`);
    const wires = Math.min(Math.ceil(lv/2), 5);
    for (let w=0; w<wires; w++) {
      const dist = 18+w*8, sign = w%2===0?-1:1;
      parts.push(`<line x1="${cx+sign*12}" y1="${cy+15}" x2="${cx+sign*dist}" y2="${cy+15}" stroke="${lv>=6?'#60c0a0':'#8a8060'}" stroke-width="1.5" stroke-dasharray="3,2"/>`);
    }
    parts.push(`<text x="${cx}" y="${cy+38}" font-family="Press Start 2P" font-size="20" fill="${bellCol}" text-anchor="middle">ALARM Lv${lv}</text>`);
    return `<g filter="url(#shadow)">${parts.join('')}</g>`;
  },
};

// ─────────────────────────────────────────────

const BuildingMedkitStation = {
  id:'medkit_station', title:'Medkit Station', desc:'Restores health faster.', action:'upgrades',
  hitW:70, hitH:80,
  svg(cx, cy, lv) {
    const tentW = 34 + lv * 4;
    const tentH = 26 + lv * 3;
    const tentCol = lv <= 3 ? '#d0d0d0' : lv <= 6 ? '#e0e8e0' : lv <= 8 ? '#c8e0f8' : '#b8d8ff';
    const crossCol = '#e53935';
    const parts = [];
    parts.push(`<ellipse cx="${cx}" cy="${cy+20}" rx="${tentW/2+4}" ry="5" fill="rgba(0,0,0,0.25)"/>`);
    parts.push(`<polygon points="${cx},${cy-tentH} ${cx-tentW/2},${cy+16} ${cx+tentW/2},${cy+16}" fill="${tentCol}"/>`);
    parts.push(`<line x1="${cx}" y1="${cy-tentH}" x2="${cx-tentW/4}" y2="${cy+16}" stroke="#a0a0a0" stroke-width="1.5" opacity="0.5"/>`);
    parts.push(`<line x1="${cx}" y1="${cy-tentH}" x2="${cx+tentW/4}" y2="${cy+16}" stroke="#a0a0a0" stroke-width="1.5" opacity="0.5"/>`);
    // Cross grows with level
    const cs = 4 + Math.floor(lv/2);
    parts.push(`<rect x="${cx-cs/2}" y="${cy-tentH/2-cs}" width="${cs}" height="${cs*2}" fill="${crossCol}" rx="1"/>`);
    parts.push(`<rect x="${cx-cs}" y="${cy-tentH/2-cs/2}" width="${cs*2}" height="${cs}" fill="${crossCol}" rx="1"/>`);
    parts.push(`<polygon points="${cx},${cy-8} ${cx-9},${cy+16} ${cx+9},${cy+16}" fill="#2a2a2a"/>`);
    parts.push(`<line x1="${cx}" y1="${cy-tentH}" x2="${cx}" y2="${cy-tentH-16}" stroke="#888" stroke-width="3"/>`);
    parts.push(`<circle cx="${cx}" cy="${cy-tentH-16}" r="${2+Math.floor(lv/3)}" fill="#c0c0c0"/>`);
    parts.push(`<line x1="${cx-tentW/2}" y1="${cy+16}" x2="${cx-tentW/2-10}" y2="${cy+24}" stroke="#888" stroke-width="2"/>`);
    parts.push(`<line x1="${cx+tentW/2}" y1="${cy+16}" x2="${cx+tentW/2+10}" y2="${cy+24}" stroke="#888" stroke-width="2"/>`);
    if (lv >= 3) parts.push(`<rect x="${cx-tentW/2-16}" y="${cy+2}" width="14" height="12" fill="#4a5a3a" rx="1"/><text x="${cx-tentW/2-9}" y="${cy+12}" font-size="9" text-anchor="middle" fill="${crossCol}">+</text>`);
    if (lv >= 5) parts.push(`<rect x="${cx+tentW/2+2}" y="${cy-2}" width="14" height="18" fill="#3a3a4a" rx="2"/><circle cx="${cx+tentW/2+9}" cy="${cy+8}" r="5" fill="#4a4a5a"/><text x="${cx+tentW/2+9}" y="${cy+12}" font-size="8" text-anchor="middle" fill="#ffd600">⚡</text>`);
    if (lv >= 7) {
      parts.push(`<line x1="${cx-14}" y1="${cy+16}" x2="${cx-14}" y2="${cy-22}" stroke="#888" stroke-width="2"/>`);
      parts.push(`<rect x="${cx-20}" y="${cy-24}" width="12" height="16" fill="#c0e8ff" rx="2" opacity="0.8"/>`);
    }
    if (lv >= 9) parts.push(`<circle cx="${cx}" cy="${cy-tentH+6}" r="8" fill="rgba(255,255,200,0.25)" filter="url(#glow-yellow)"/>`);
    if (lv >= 10) parts.push(`<polygon points="${cx+tentW/2},${cy-tentH/2} ${cx+tentW/2},${cy+16} ${cx+tentW/2+tentW*0.35},${cy+16}" fill="${tentCol}" opacity="0.6"/>`);
    parts.push(`<text x="${cx}" y="${cy+40}" font-family="Press Start 2P" font-size="20" fill="${crossCol}" text-anchor="middle">MEDKIT Lv${lv}</text>`);
    return `<g filter="url(#shadow)">${parts.join('')}</g>`;
  },
};

// ─────────────────────────────────────────────

const BuildingBunker = {
  id:'bunker', title:'Bunker', desc:'Hardened refuge during raids.', action:'upgrades',
  hitW:90, hitH:60,
  svg(cx, cy, lv) {
    const mW = 46 + lv * 5;
    const mH = 9 + Math.floor(lv/2);
    const metalCol = lv <= 3 ? '#5a5a60' : lv <= 6 ? '#4a5a6a' : lv <= 8 ? '#3a6a7a' : '#2a7a8a';
    const armorCol = lv <= 3 ? '#3a3830' : lv <= 6 ? '#3a4a50' : '#2a5060';
    const parts = [];
    parts.push(`<ellipse cx="${cx}" cy="${cy+18}" rx="${mW/2+6}" ry="6" fill="rgba(0,0,0,0.3)"/>`);
    parts.push(`<ellipse cx="${cx}" cy="${cy+8}" rx="${mW/2+8}" ry="${mH+4}" fill="#3a3830"/>`);
    parts.push(`<ellipse cx="${cx}" cy="${cy+4}" rx="${mW/2+4}" ry="${mH+2}" fill="${armorCol}"/>`);
    const rings = Math.min(lv, 6);
    for (let r = 0; r < rings; r++) {
      const rW = (mW/2+4) * (1-r*0.05);
      parts.push(`<ellipse cx="${cx}" cy="${cy+4+r*0.5}" rx="${rW}" ry="${mH+2-r*0.4}" fill="none" stroke="${metalCol}" stroke-width="${lv>=6?2.5:2}" opacity="${0.5-r*0.06}"/>`);
    }
    const hW = 20 + Math.floor(lv/2)*2;
    parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${hW/2+2}" ry="${hW/4+2}" fill="${metalCol}"/>`);
    parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${hW/2}" ry="${hW/4}" fill="#3a4050"/>`);
    parts.push(`<rect x="${cx-hW/2}" y="${cy-3}" width="6" height="6" fill="${metalCol}" rx="1"/>`);
    parts.push(`<rect x="${cx-4}" y="${cy-4}" width="8" height="8" fill="#7a7a80" rx="2"/>`);
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${2+Math.floor(lv/4)}" fill="#9a9aa0"/>`);
    const pipeCount = Math.min(Math.ceil(lv/2), 5);
    for (let p = 0; p < pipeCount; p++) {
      const px = cx - mW/2 + 10 + p * ((mW-20) / Math.max(pipeCount-1, 1));
      if (Math.abs(px-cx) < 14) continue;
      const pH = 8 + lv * 2;
      parts.push(`<rect x="${px-3}" y="${cy-pH}" width="6" height="${pH}" fill="${metalCol}" rx="2"/>`);
      parts.push(`<ellipse cx="${px}" cy="${cy-pH}" rx="5" ry="3" fill="${lv>=7?'#6a7a8a':'#6a6a70'}"/>`);
    }
    if (lv >= 4) {
      parts.push(`<line x1="${cx+mW/2-8}" y1="${cy+4}" x2="${cx+mW/2+2}" y2="${cy-22}" stroke="#888" stroke-width="2"/>`);
      parts.push(`<circle cx="${cx+mW/2+2}" cy="${cy-22}" r="${2+Math.floor(lv/3)}" fill="${lv>=7?'#ffd600':'#aaa'}" ${lv>=7?'filter="url(#glow-yellow)"':''} opacity="${lv>=7?0.9:0.6}"/>`);
    }
    if (lv >= 6) parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${hW/2+4}" ry="${hW/4+4}" fill="none" stroke="#5a8090" stroke-width="3"/>`);
    if (lv >= 8) {
      parts.push(`<rect x="${cx-mW/4-3}" y="${cy-22}" width="6" height="22" fill="#4a5a6a" rx="1"/>`);
      parts.push(`<rect x="${cx-mW/4-6}" y="${cy-24}" width="12" height="5" fill="#3a4a5a" rx="1"/>`);
      parts.push(`<circle cx="${cx-mW/4}" cy="${cy-21}" r="3" fill="#1a3a4a"/>`);
    }
    if (lv >= 10) parts.push(`<ellipse cx="${cx}" cy="${cy+4}" rx="${mW/2+14}" ry="${mH+14}" fill="none" stroke="rgba(100,200,255,0.25)" stroke-width="4"/>`);
    parts.push(`<text x="${cx}" y="${cy+36}" font-family="Press Start 2P" font-size="20" fill="${metalCol}" text-anchor="middle">BUNKER Lv${lv}</text>`);
    return `<g filter="url(#shadow)">${parts.join('')}</g>`;
  },
};

// ── Screen data ───────────────────────────────

BuildingWatchtower.getScreenData = (s) => {
  const lv = s.base.buildings.watchtower?.level || 0;
  const visual = lv > 0 ? `<svg width="100" height="120" viewBox="0 0 200 240" style="overflow:visible">${BuildingWatchtower.svg(100,160,lv)}</svg>` : '<div style="font-size:2.5rem;text-align:center;padding:16px">🗼</div>';
  const defBonus = [10,20,32,46,62,80,100,124,150,180][lv-1] || 0;
  const statsRows = lv === 0 ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not built</span></div>' :
    `<div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
     <div class="bsc-row ok"><span>Warning bonus</span><span>+${s.base.raidWarningBonus||0}s</span></div>
     <div class="bsc-row ok"><span>Defence bonus</span><span>+${defBonus}</span></div>
     ${lv>=5?'<div class="bsc-row ok"><span>Spotlight</span><span>✅ Active</span></div>':''}
     ${lv>=7?'<div class="bsc-row ok"><span>Radio link</span><span>✅ Active</span></div>':''}
     ${lv>=9?'<div class="bsc-row ok"><span>Energy scan</span><span>✅ Online</span></div>':''}`;
  return { title:'🗼 WATCHTOWER', visual, statsRows, actionBtn:'' };
};
BuildingCompostBin.getScreenData = (s) => {
  const lv = s.base.buildings.compost_bin?.level || 0;
  const visual = lv > 0 ? `<svg width="90" height="90" viewBox="0 0 180 180" style="overflow:visible">${BuildingCompostBin.svg(90,110,lv)}</svg>` : '<div style="font-size:2.5rem;text-align:center;padding:16px">♻️</div>';
  const statsRows = lv === 0 ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not built</span></div>' :
    `<div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
     <div class="bsc-row ok"><span>Passive food/day</span><span>+${s.base.passiveFood||0}</span></div>
     ${lv>=4?'<div class="bsc-row ok"><span>Pipe system</span><span>✅ Active</span></div>':''}
     ${lv>=7?'<div class="bsc-row ok"><span>Liquid fertiliser</span><span>✅ Draining</span></div>':''}
     ${lv>=9?'<div class="bsc-row ok"><span>Bio-gas collector</span><span>✅ Online</span></div>':''}`;
  return { title:'♻️ COMPOST BIN', visual, statsRows, actionBtn:'' };
};
BuildingSmokehouse.getScreenData = (s) => {
  const lv = s.base.buildings.smokehouse?.level || 0;
  const visual = lv > 0 ? `<svg width="90" height="100" viewBox="0 0 180 200" style="overflow:visible">${BuildingSmokehouse.svg(90,120,lv)}</svg>` : '<div style="font-size:2.5rem;text-align:center;padding:16px">🏭</div>';
  const preserve = ['1×','1.5×','2×','2.5×','3×','3.5×','4×','4.5×','5×','6×'][lv-1] || '1×';
  const statsRows = lv === 0 ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not built</span></div>' :
    `<div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
     <div class="bsc-row ok"><span>Food preservation</span><span>${preserve} longer</span></div>
     ${lv>=3?`<div class="bsc-row ok"><span>Passive food/day</span><span>+${Math.floor(lv/2)}</span></div>`:''}
     ${lv>=8?'<div class="bsc-row ok"><span>Electric smoker</span><span>✅ Installed</span></div>':''}`;
  return { title:'🏭 SMOKEHOUSE', visual, statsRows, actionBtn:'' };
};
BuildingAlarmSystem.getScreenData = (s) => {
  const lv = s.base.buildings.alarm_system?.level || 0;
  const visual = lv > 0 ? `<svg width="80" height="100" viewBox="0 0 160 200" style="overflow:visible">${BuildingAlarmSystem.svg(80,130,lv)}</svg>` : '<div style="font-size:2.5rem;text-align:center;padding:16px">🔔</div>';
  const dmgRed = Math.round((s.base.raidDamageReduction||0)*100);
  const statsRows = lv === 0 ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not built</span></div>' :
    `<div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
     <div class="bsc-row ok"><span>Raid damage reduction</span><span>-${dmgRed}%</span></div>
     ${lv>=4?'<div class="bsc-row ok"><span>Electric siren</span><span>✅ Active</span></div>':''}
     ${lv>=7?'<div class="bsc-row ok"><span>Auto activation</span><span>✅ Active</span></div>':''}
     ${lv>=9?'<div class="bsc-row ok"><span>Sensor network</span><span>✅ Online</span></div>':''}`;
  return { title:'🔔 ALARM SYSTEM', visual, statsRows, actionBtn:'' };
};
BuildingMedkitStation.getScreenData = (s) => {
  const lv = s.base.buildings.medkit_station?.level || 0;
  const visual = lv > 0 ? `<svg width="90" height="100" viewBox="0 0 180 200" style="overflow:visible">${BuildingMedkitStation.svg(90,120,lv)}</svg>` : '<div style="font-size:2.5rem;text-align:center;padding:16px">🏥</div>';
  const medEff = s.base.medEfficiency || 1.0;
  const statsRows = lv === 0 ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not built</span></div>' :
    `<div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
     <div class="bsc-row ok"><span>Medicine effectiveness</span><span>${medEff.toFixed(2)}×</span></div>
     ${lv>=2?'<div class="bsc-row ok"><span>Passive medicine/day</span><span>+1</span></div>':''}
     ${lv>=5?'<div class="bsc-row ok"><span>Generator</span><span>✅ Stable</span></div>':''}
     ${lv>=7?'<div class="bsc-row ok"><span>IV drip station</span><span>✅ Active</span></div>':''}
     ${lv>=3?`<div class="bsc-row ok"><span>Passive energy heal</span><span>+${Math.floor(lv/3)}/hr</span></div>`:''}`;
  return { title:'🏥 MEDICAL STATION', visual, statsRows, actionBtn:'' };
};
BuildingBunker.getScreenData = (s) => {
  const lv = s.base.buildings.bunker?.level || 0;
  const visual = lv > 0 ? `<svg width="120" height="80" viewBox="0 0 240 160" style="overflow:visible">${BuildingBunker.svg(120,90,lv)}</svg>` : '<div style="font-size:2.5rem;text-align:center;padding:16px">🏗️</div>';
  const defBonus = [50,80,115,155,200,250,305,370,440,520][lv-1] || 0;
  const dmgRed = Math.round((s.base.raidDamageReduction||0)*100);
  const statsRows = lv === 0 ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not built</span></div>' :
    `<div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
     <div class="bsc-row ok"><span>Defence bonus</span><span>+${defBonus}</span></div>
     <div class="bsc-row ok"><span>Raid damage reduction</span><span>-${dmgRed}%</span></div>
     ${lv>=4?'<div class="bsc-row ok"><span>Radio antenna</span><span>✅ Active</span></div>':''}
     ${lv>=6?'<div class="bsc-row ok"><span>Blast-proof door</span><span>✅ Installed</span></div>':''}
     ${lv>=8?'<div class="bsc-row ok"><span>Periscope</span><span>✅ Operational</span></div>':''}
     ${lv>=10?'<div class="bsc-row ok"><span>Energy shield</span><span>⚡ Active</span></div>':''}`;
  return { title:'🏗️ BUNKER', visual, statsRows, actionBtn:'' };
};
