// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/SolarStation.js
// ═══════════════════════════════════════════

const BuildingSolarStation = {

  id:     'solar_station',
  title:  'Solar Station',
  desc:   'Boosts solar generator output and stores power overnight.',
  action: 'upgrades',
  hitW: 90,
  hitH: 80,

  screen(lv) {
    if (!lv || lv === 0) return '<div style="font-size:3rem;text-align:center;padding:16px">☀️</div>';
    const mapSvg = BuildingSolarStation.svg(60, 50, lv);
    return '<svg width="120" height="100" viewBox="0 0 120 100" style="overflow:visible">' +
           '<defs><filter id="s2"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/></filter>' +
           '<filter id="gy2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
           mapSvg.replace('filter="url(#shadow)"', 'filter="url(#s2)"')
                 .replace(/filter="url\(#glow-yellow\)"/g, 'filter="url(#gy2)"')
                 .replace(/font-size="22"/g, 'font-size="8"') +
           '</svg>';
  },

  svg(cx, cy, level) {
    const lv = Math.max(1, level || 1);
    let parts = [];
    const panelDark = '#1a3a6a';
    const panelMid  = '#1e4070';
    const sunYellow = '#ffd600';

    if (lv <= 2) {
      parts.push('<rect x="' + (cx-3) + '" y="' + (cy-2) + '" width="6" height="28" fill="#666" rx="2"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+28) + '" rx="7" ry="2.5" fill="rgba(0,0,0,0.3)"/>');
      parts.push('<g transform="rotate(-18 ' + cx + ' ' + cy + ')">');
      parts.push('<rect x="' + (cx-15) + '" y="' + (cy-26) + '" width="30" height="22" fill="' + panelDark + '" rx="2"/>');
      parts.push('<line x1="' + (cx-5) + '" y1="' + (cy-26) + '" x2="' + (cx-5) + '" y2="' + (cy-4) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<line x1="' + (cx+5) + '" y1="' + (cy-26) + '" x2="' + (cx+5) + '" y2="' + (cy-4) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<line x1="' + (cx-15) + '" y1="' + (cy-15) + '" x2="' + (cx+15) + '" y2="' + (cy-15) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<rect x="' + (cx-14) + '" y="' + (cy-25) + '" width="4" height="20" fill="rgba(255,255,255,0.08)" rx="1"/>');
      parts.push('</g>');
      if (lv >= 2) {
        parts.push('<circle cx="' + (cx+14) + '" cy="' + (cy-28) + '" r="5" fill="' + sunYellow + '" opacity="0.7" filter="url(#glow-yellow)"/>');
      }

    } else if (lv <= 4) {
      const pCount = 4, pW = 16, pH = 22, pGap = 4;
      const totalW = pCount * (pW + pGap) - pGap;
      const px0 = cx - totalW / 2;
      parts.push('<rect x="' + (px0-4) + '" y="' + (cy-2) + '" width="' + (totalW+8) + '" height="5" fill="#555" rx="2"/>');
      parts.push('<line x1="' + (px0+8) + '" y1="' + (cy+3) + '" x2="' + (px0-2) + '" y2="' + (cy+26) + '" stroke="#555" stroke-width="3"/>');
      parts.push('<line x1="' + (px0+totalW-8) + '" y1="' + (cy+3) + '" x2="' + (px0+totalW+2) + '" y2="' + (cy+26) + '" stroke="#555" stroke-width="3"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+28) + '" rx="' + (totalW/2+4) + '" ry="4" fill="rgba(0,0,0,0.25)"/>');
      for (let i = 0; i < pCount; i++) {
        const bx = px0 + i * (pW + pGap);
        parts.push('<rect x="' + bx + '" y="' + (cy-22) + '" width="' + pW + '" height="' + pH + '" fill="' + panelMid + '" rx="1"/>');
        parts.push('<line x1="' + (bx+pW/2) + '" y1="' + (cy-22) + '" x2="' + (bx+pW/2) + '" y2="' + (cy-22+pH) + '" stroke="#0d1a30" stroke-width="0.8"/>');
        parts.push('<line x1="' + bx + '" y1="' + (cy-22+pH/2) + '" x2="' + (bx+pW) + '" y2="' + (cy-22+pH/2) + '" stroke="#0d1a30" stroke-width="0.8"/>');
      }
      if (lv >= 4) {
        parts.push('<rect x="' + (cx-8) + '" y="' + (cy+2) + '" width="16" height="10" fill="#444" rx="2"/>');
        parts.push('<circle cx="' + cx + '" cy="' + (cy+7) + '" r="3" fill="#666"/>');
        parts.push('<circle cx="' + (cx+totalW/2+8) + '" cy="' + (cy-14) + '" r="6" fill="' + sunYellow + '" opacity="0.85" filter="url(#glow-yellow)"/>');
      }

    } else if (lv <= 6) {
      const cols = 4, rows = 2, pW = 14, pH = 10, pgX = 3, pgY = 4;
      const totalW = cols * (pW + pgX) - pgX;
      const totalH = rows * (pH + pgY) - pgY;
      const startX = cx - totalW / 2, startY = cy - totalH / 2 - 8;
      parts.push('<rect x="' + (startX-5) + '" y="' + (startY-4) + '" width="' + (totalW+10) + '" height="' + (totalH+8) + '" fill="#3a3a4a" rx="3" opacity="0.5"/>');
      parts.push('<line x1="' + (startX+8) + '" y1="' + (startY+totalH+4) + '" x2="' + (startX-4) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="4"/>');
      parts.push('<line x1="' + (startX+totalW-8) + '" y1="' + (startY+totalH+4) + '" x2="' + (startX+totalW+4) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="4"/>');
      parts.push('<line x1="' + (startX-4) + '" y1="' + (cy+28) + '" x2="' + (startX+totalW+4) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="3"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+30) + '" rx="' + (totalW/2+8) + '" ry="4" fill="rgba(0,0,0,0.25)"/>');
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = startX + c * (pW + pgX), by = startY + r * (pH + pgY);
          parts.push('<rect x="' + bx + '" y="' + by + '" width="' + pW + '" height="' + pH + '" fill="' + panelDark + '" rx="1"/>');
          parts.push('<line x1="' + (bx+pW/2) + '" y1="' + by + '" x2="' + (bx+pW/2) + '" y2="' + (by+pH) + '" stroke="#0d1a30" stroke-width="0.6"/>');
          parts.push('<line x1="' + bx + '" y1="' + (by+pH/2) + '" x2="' + (bx+pW) + '" y2="' + (by+pH/2) + '" stroke="#0d1a30" stroke-width="0.6"/>');
        }
      }
      if (lv >= 6) {
        parts.push('<ellipse cx="' + cx + '" cy="' + (startY+totalH/2) + '" rx="' + (totalW/2) + '" ry="' + (totalH/2) + '" fill="' + sunYellow + '" opacity="0.07" filter="url(#glow-yellow)"/>');
        parts.push('<circle cx="' + (startX+totalW+16) + '" cy="' + (startY-10) + '" r="7" fill="' + sunYellow + '" opacity="0.9" filter="url(#glow-yellow)"/>');
      }

    } else if (lv <= 8) {
      const cols = lv >= 8 ? 5 : 4, rows = 3, pW = 13, pH = 9, pgX = 3, pgY = 3;
      const totalW = cols * (pW + pgX) - pgX;
      const totalH = rows * (pH + pgY) - pgY;
      const startX = cx - totalW / 2, startY = cy - totalH / 2 - 6;
      parts.push('<line x1="' + (startX-6) + '" y1="' + (startY+totalH+4) + '" x2="' + (startX+8) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="4"/>');
      parts.push('<line x1="' + (startX+totalW+6) + '" y1="' + (startY+totalH+4) + '" x2="' + (startX+totalW-8) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="4"/>');
      parts.push('<line x1="' + (startX+8) + '" y1="' + (cy+28) + '" x2="' + (startX+totalW-8) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="4"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+30) + '" rx="' + (totalW/2+6) + '" ry="5" fill="rgba(0,0,0,0.25)"/>');
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = startX + c * (pW + pgX), by = startY + r * (pH + pgY);
          parts.push('<rect x="' + bx + '" y="' + by + '" width="' + pW + '" height="' + pH + '" fill="' + panelDark + '" rx="1"/>');
          parts.push('<line x1="' + (bx+pW/2) + '" y1="' + by + '" x2="' + (bx+pW/2) + '" y2="' + (by+pH) + '" stroke="#0d1a30" stroke-width="0.5"/>');
          parts.push('<line x1="' + bx + '" y1="' + (by+pH/2) + '" x2="' + (bx+pW) + '" y2="' + (by+pH/2) + '" stroke="#0d1a30" stroke-width="0.5"/>');
        }
      }
      parts.push('<circle cx="' + (startX+totalW+14) + '" cy="' + (startY-12) + '" r="8" fill="' + sunYellow + '" filter="url(#glow-yellow)"/>');
      if (lv >= 8) {
        parts.push('<ellipse cx="' + cx + '" cy="' + (startY+totalH/2) + '" rx="' + (totalW/2+4) + '" ry="' + (totalH/2+4) + '" fill="' + sunYellow + '" opacity="0.06" filter="url(#glow-yellow)"/>');
      }

    } else {
      // Lv9-10: parabolic concentrator
      parts.push('<path d="M' + (cx-44) + ',' + (cy+14) + ' Q' + cx + ',' + (cy-42) + ' ' + (cx+44) + ',' + (cy+14) + '" fill="none" stroke="#2a5a8a" stroke-width="4"/>');
      parts.push('<path d="M' + (cx-44) + ',' + (cy+14) + ' Q' + (cx-22) + ',' + (cy-14) + ' ' + cx + ',' + (cy-28) + ' L' + cx + ',' + (cy+14) + ' Z" fill="#1a3a5a" opacity="0.9"/>');
      parts.push('<path d="M' + cx + ',' + (cy+14) + ' L' + cx + ',' + (cy-28) + ' Q' + (cx+22) + ',' + (cy-14) + ' ' + (cx+44) + ',' + (cy+14) + ' Z" fill="#1e4468" opacity="0.9"/>');
      parts.push('<line x1="' + cx + '" y1="' + (cy-28) + '" x2="' + cx + '" y2="' + (cy-10) + '" stroke="#888" stroke-width="2"/>');
      parts.push('<circle cx="' + cx + '" cy="' + (cy-28) + '" r="7" fill="' + sunYellow + '" filter="url(#glow-yellow)"/>');
      parts.push('<circle cx="' + cx + '" cy="' + (cy-28) + '" r="3" fill="#fff" opacity="0.9"/>');
      parts.push('<rect x="' + (cx-66) + '" y="' + (cy-14) + '" width="18" height="24" fill="' + panelDark + '" rx="2"/>');
      parts.push('<line x1="' + (cx-57) + '" y1="' + (cy-14) + '" x2="' + (cx-57) + '" y2="' + (cy+10) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<line x1="' + (cx-66) + '" y1="' + (cy-2) + '" x2="' + (cx-48) + '" y2="' + (cy-2) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<rect x="' + (cx+48) + '" y="' + (cy-14) + '" width="18" height="24" fill="' + panelDark + '" rx="2"/>');
      parts.push('<line x1="' + (cx+57) + '" y1="' + (cy-14) + '" x2="' + (cx+57) + '" y2="' + (cy+10) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<line x1="' + (cx+48) + '" y1="' + (cy-2) + '" x2="' + (cx+66) + '" y2="' + (cy-2) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<rect x="' + (cx-10) + '" y="' + (cy+10) + '" width="20" height="18" fill="#2a3a4a" rx="2"/>');
      parts.push('<circle cx="' + cx + '" cy="' + (cy+14) + '" r="4" fill="' + sunYellow + '" opacity="0.75" filter="url(#glow-yellow)"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+30) + '" rx="50" ry="8" fill="rgba(0,0,0,0.28)"/>');
      if (lv >= 10) {
        parts.push('<ellipse cx="' + cx + '" cy="' + (cy-10) + '" rx="56" ry="38" fill="' + sunYellow + '" opacity="0.06" filter="url(#glow-yellow)"/>');
        parts.push('<text x="' + cx + '" y="' + (cy-52) + '" font-family="Press Start 2P" font-size="5" fill="' + sunYellow + '" text-anchor="middle">MICRO STATION</text>');
      }
    }

    if (lv < 9) {
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+30) + '" rx="38" ry="6" fill="rgba(0,0,0,0.25)"/>');
    }
    const labelCol = lv >= 9 ? '#ffd600' : lv >= 5 ? '#ffb300' : '#ffa000';
    parts.push('<text x="' + cx + '" y="' + (cy+50) + '" font-family="Press Start 2P" font-size="22" fill="' + labelCol + '" text-anchor="middle">SOLAR Lv' + lv + '</text>');
    return '<g filter="url(#shadow)">' + parts.join('') + '</g>';
  },

};

BuildingSolarStation.getScreenData = function(s) {
  const lv    = s.base.buildings.solar_station?.level || 0;
  const boost = s.base.solarBoost || 1.0;
  const nPwr  = s.base.solarNightPower || 0;
  const fPwr  = nPwr >= 6;
  const fCls  = fPwr ? 'ok' : 'locked';
  const fStr  = fPwr ? '⚡ Yes' : '🔒 Lv5+';
  const statsRows = lv === 0
    ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>'
    : '<div class="bsc-row"><span>Level</span><span>' + lv + ' / 10</span></div>' +
      '<div class="bsc-row ok"><span>Solar output boost</span><span>x' + boost.toFixed(2) + '</span></div>' +
      '<div class="bsc-row ok"><span>Stored overnight</span><span>+' + nPwr + ' Wh</span></div>' +
      '<div class="bsc-row ' + fCls + '"><span>Powers fence</span><span>' + fStr + '</span></div>';
  return { title: '☀️ SOLAR STATION', visual: BuildingSolarStation.screen(lv), statsRows, actionBtn: '' };
};
