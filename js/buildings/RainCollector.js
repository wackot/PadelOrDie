// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/RainCollector.js
// ═══════════════════════════════════════════

const BuildingRainCollector = {

  id:     'rain_collector',
  title:  'Rain Collector',
  desc:   'Collect passive water daily. Higher levels never run dry.',
  action: 'upgrades',
  hitW: 80,
  hitH: 90,

  screen(lv) {
    if (!lv || lv === 0) return '<div style="font-size:3rem;text-align:center;padding:16px">🌧️</div>';
    const mapSvg = BuildingRainCollector.svg(60, 52, lv);
    return '<svg width="120" height="100" viewBox="0 0 120 100" style="overflow:visible">' +
           '<defs><filter id="s2"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/></filter>' +
           '<filter id="gb2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
           mapSvg.replace('filter="url(#shadow)"', 'filter="url(#s2)"')
                 .replace('filter="url(#glow-blue)"', 'filter="url(#gb2)"')
                 .replace('filter="url(#glow-yellow)"', '')
                 .replace(/font-size="22"/g, 'font-size="8"') +
           '</svg>';
  },

  svg(cx, cy, level) {
    const lv = Math.max(1, level || 1);
    let parts = [];

    if (lv <= 2) {
      const count = lv;
      const startX = lv === 1 ? cx : cx - 16;
      for (let i = 0; i < count; i++) {
        const bx = startX + i * 32;
        parts.push('<ellipse cx="' + bx + '" cy="' + (cy+26) + '" rx="13" ry="4" fill="rgba(0,0,0,0.28)"/>');
        parts.push('<rect x="' + (bx-11) + '" y="' + (cy-8) + '" width="22" height="34" fill="#6a4a1e" rx="3"/>');
        parts.push('<rect x="' + (bx-12) + '" y="' + (cy-1) + '" width="24" height="3" fill="#8a6a2e" rx="1"/>');
        parts.push('<rect x="' + (bx-12) + '" y="' + (cy+12) + '" width="24" height="3" fill="#8a6a2e" rx="1"/>');
        parts.push('<rect x="' + (bx-10) + '" y="' + (cy+10) + '" width="20" height="14" fill="#1a5a8a" rx="1" opacity="0.75"/>');
        parts.push('<polygon points="' + (bx-7) + ',' + (cy-8) + ' ' + (bx+7) + ',' + (cy-8) + ' ' + (bx+4) + ',' + (cy-20) + ' ' + (bx-4) + ',' + (cy-20) + '" fill="#5a5a5a"/>');
        parts.push('<rect x="' + (bx-9) + '" y="' + (cy-23) + '" width="18" height="4" fill="#7a7a7a" rx="1"/>');
      }
      if (lv === 2) {
        parts.push('<line x1="' + cx + '" y1="' + (cy+8) + '" x2="' + (cx+2) + '" y2="' + (cy+8) + '" stroke="#888" stroke-width="2"/>');
      }

    } else if (lv <= 4) {
      const barrels = lv === 3 ? 2 : 3;
      parts.push('<rect x="' + (cx-36) + '" y="' + (cy-30) + '" width="72" height="5" fill="#7a7a7a" rx="2"/>');
      parts.push('<rect x="' + (cx-2) + '" y="' + (cy-30) + '" width="4" height="12" fill="#888" rx="1"/>');
      const bStart = cx - (barrels - 1) * 22 / 2;
      for (let i = 0; i < barrels; i++) {
        const bx = bStart + i * 22;
        parts.push('<ellipse cx="' + bx + '" cy="' + (cy+24) + '" rx="11" ry="3" fill="rgba(0,0,0,0.22)"/>');
        parts.push('<rect x="' + (bx-10) + '" y="' + (cy-6) + '" width="20" height="30" fill="#5a3a18" rx="3"/>');
        parts.push('<rect x="' + (bx-11) + '" y="' + (cy-1) + '" width="22" height="3" fill="#7a5a28" rx="1"/>');
        parts.push('<rect x="' + (bx-11) + '" y="' + (cy+10) + '" width="22" height="3" fill="#7a5a28" rx="1"/>');
        parts.push('<rect x="' + (bx-9) + '" y="' + (cy+8) + '" width="18" height="14" fill="#1a5a8a" rx="1" opacity="0.8"/>');
        parts.push('<rect x="' + (bx-2) + '" y="' + (cy-25) + '" width="4" height="20" fill="#888" rx="1"/>');
      }
      if (lv === 4) {
        parts.push('<rect x="' + (cx-36) + '" y="' + (cy-4) + '" width="72" height="3" fill="#aaa" rx="1" opacity="0.6"/>');
      }

    } else if (lv <= 6) {
      const tw = lv >= 6 ? 26 : 22;
      const th = lv >= 6 ? 44 : 38;
      parts.push('<ellipse cx="' + (cx-20) + '" cy="' + (cy-th/2+5) + '" rx="' + (tw/2) + '" ry="5" fill="#4a6a8a"/>');
      parts.push('<rect x="' + (cx-20-tw/2) + '" y="' + (cy-th/2+5) + '" width="' + tw + '" height="' + (th-8) + '" fill="#3a5a7a" rx="3"/>');
      parts.push('<ellipse cx="' + (cx-20) + '" cy="' + (cy+th/2-3) + '" rx="' + (tw/2) + '" ry="5" fill="#2a4a6a"/>');
      parts.push('<rect x="' + (cx-20-tw/2+3) + '" y="' + (cy-th/2+9) + '" width="4" height="' + (th-16) + '" fill="rgba(255,255,255,0.07)" rx="2"/>');
      parts.push('<ellipse cx="' + (cx+20) + '" cy="' + (cy-th/2+5) + '" rx="' + (tw/2) + '" ry="5" fill="#4a6a8a"/>');
      parts.push('<rect x="' + (cx+20-tw/2) + '" y="' + (cy-th/2+5) + '" width="' + tw + '" height="' + (th-8) + '" fill="#3a5a7a" rx="3"/>');
      parts.push('<ellipse cx="' + (cx+20) + '" cy="' + (cy+th/2-3) + '" rx="' + (tw/2) + '" ry="5" fill="#2a4a6a"/>');
      parts.push('<line x1="' + (cx-20+tw/2) + '" y1="' + (cy+4) + '" x2="' + (cx+20-tw/2) + '" y2="' + (cy+4) + '" stroke="#888" stroke-width="4"/>');
      parts.push('<rect x="' + (cx-7) + '" y="' + (cy-6) + '" width="14" height="20" fill="#5a5a6a" rx="2"/>');
      parts.push('<rect x="' + (cx-4) + '" y="' + (cy-16) + '" width="8" height="12" fill="#4a4a5a" rx="2"/>');
      if (lv >= 6) {
        parts.push('<circle cx="' + cx + '" cy="' + (cy-18) + '" r="4" fill="#ffd600" opacity="0.7" filter="url(#glow-yellow)"/>');
      }

    } else if (lv <= 8) {
      const h = lv >= 8 ? 56 : 48;
      for (let i = 0; i < 4; i++) {
        const lx = cx - 22 + i * 14;
        const lean = (i < 2) ? 3 : -3;
        parts.push('<line x1="' + lx + '" y1="' + (cy+h/2) + '" x2="' + (lx+lean) + '" y2="' + (cy-h/2+16) + '" stroke="#555" stroke-width="4"/>');
      }
      parts.push('<line x1="' + (cx-22) + '" y1="' + (cy+4) + '" x2="' + (cx+22) + '" y2="' + (cy+4) + '" stroke="#4a4a5a" stroke-width="2"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy-h/2+10) + '" rx="28" ry="8" fill="#3a6a9a"/>');
      parts.push('<rect x="' + (cx-28) + '" y="' + (cy-h/2+10) + '" width="56" height="' + (h-24) + '" fill="#2a5a8a" rx="2"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+h/2-14) + '" rx="28" ry="8" fill="#1a4a7a"/>');
      parts.push('<rect x="' + (cx-22) + '" y="' + (cy-h/2+h-36) + '" width="44" height="16" fill="#29b6f6" rx="1" opacity="0.45"/>');
      parts.push('<rect x="' + (cx+28) + '" y="' + (cy-h/2+18) + '" width="6" height="18" fill="#888" rx="1"/>');
      if (lv >= 8) {
        parts.push('<circle cx="' + (cx-28) + '" cy="' + (cy-h/2+20) + '" r="4" fill="#ffd600" opacity="0.6" filter="url(#glow-yellow)"/>');
      }

    } else {
      // Lv9-10: pressurised water plant
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy-34) + '" rx="34" ry="10" fill="#2a6a9a"/>');
      parts.push('<rect x="' + (cx-34) + '" y="' + (cy-34) + '" width="68" height="52" fill="#1a5a8a" rx="3"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+18) + '" rx="34" ry="10" fill="#1a4a7a"/>');
      parts.push('<rect x="' + (cx-52) + '" y="' + (cy-22) + '" width="16" height="30" fill="#3a5a7a" rx="2"/>');
      parts.push('<ellipse cx="' + (cx-44) + '" cy="' + (cy-22) + '" rx="8" ry="5" fill="#4a6a8a"/>');
      parts.push('<circle cx="' + (cx+42) + '" cy="' + (cy-18) + '" r="8" fill="#3a4a5a" stroke="#aaa" stroke-width="2"/>');
      parts.push('<line x1="' + (cx+42) + '" y1="' + (cy-18) + '" x2="' + (cx+45) + '" y2="' + (cy-25) + '" stroke="#ffd600" stroke-width="2"/>');
      parts.push('<line x1="' + (cx-28) + '" y1="' + (cy+6) + '" x2="' + (cx-28) + '" y2="' + (cy+26) + '" stroke="#888" stroke-width="4"/>');
      parts.push('<line x1="' + (cx+28) + '" y1="' + (cy+6) + '" x2="' + (cx+28) + '" y2="' + (cy+26) + '" stroke="#888" stroke-width="4"/>');
      parts.push('<line x1="' + (cx-28) + '" y1="' + (cy+26) + '" x2="' + (cx+28) + '" y2="' + (cy+26) + '" stroke="#888" stroke-width="4"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy-10) + '" rx="30" ry="20" fill="#29b6f6" opacity="0.1" filter="url(#glow-blue)"/>');
      if (lv >= 10) {
        parts.push('<circle cx="' + cx + '" cy="' + (cy-48) + '" r="6" fill="#29b6f6" opacity="0.8" filter="url(#glow-blue)"/>');
      }
    }

    parts.push('<ellipse cx="' + cx + '" cy="' + (cy+30) + '" rx="36" ry="6" fill="rgba(0,0,0,0.25)"/>');
    const labelCol = lv >= 9 ? '#29b6f6' : lv >= 5 ? '#4a9abf' : '#6ab0d0';
    parts.push('<text x="' + cx + '" y="' + (cy+50) + '" font-family="Press Start 2P" font-size="22" fill="' + labelCol + '" text-anchor="middle">RAIN Lv' + lv + '</text>');
    return '<g filter="url(#shadow)">' + parts.join('') + '</g>';
  },

};

BuildingRainCollector.getScreenData = function(s) {
  const lv      = s.base.buildings.rain_collector?.level || 0;
  const pw      = s.base.passiveWater || 0;
  const noEmpty = s.base.waterNeverEmpty || false;
  const eCls    = noEmpty ? 'ok' : '';
  const eStr    = noEmpty ? '✓ Never runs dry' : 'Standard';
  const statsRows = lv === 0
    ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>'
    : '<div class="bsc-row"><span>Level</span><span>' + lv + ' / 10</span></div>' +
      '<div class="bsc-row ok"><span>Passive water / day</span><span>+' + pw + ' 💧</span></div>' +
      '<div class="bsc-row ' + eCls + '"><span>Water reserve</span><span>' + eStr + '</span></div>' +
      '<div class="bsc-row"><span>Current water</span><span>' + (s.inventory.water || 0) + ' 💧</span></div>';
  return { title: '🌧️ RAIN COLLECTOR', visual: BuildingRainCollector.screen(lv), statsRows, actionBtn: '' };
};
