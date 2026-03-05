// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/RadioTower.js
// ═══════════════════════════════════════════

const BuildingRadioTower = {

  id:     'radio_tower',
  title:  'Radio Tower',
  desc:   'Detect raids early and unlock world map missions.',
  action: 'upgrades',
  hitW: 90,
  hitH: 100,

  onOpen(setFn) {
    // Delegated to renderBuildingScreen via standard route
    Base.renderBuildingScreen('radio_tower');
    Game.goTo('bld-radio_tower');
  },

  // Screen mini-SVG
  screen(lv) {
    if (!lv || lv === 0) return '<div style="font-size:3rem;text-align:center;padding:16px">📡</div>';
    const mapSvg = BuildingRadioTower.svg(65, 58, lv);
    return '<svg width="130" height="116" viewBox="0 0 130 116" style="overflow:visible">' +
           '<defs>' +
           '<filter id="s3"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/></filter>' +
           '<filter id="gy3"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
           '</defs>' +
           mapSvg.replace('filter="url(#shadow)"','filter="url(#s3)"')
                 .replace(/filter="url\(#glow-yellow\)"/g,'filter="url(#gy3)"')
                 .replace(/font-size="22"/g,'font-size="8"') +
           '</svg>';
  },

  // Map SVG renderer — 10 levels
  svg(cx, cy, level) {
    const lv = Math.max(1, level || 1);
    let parts = [];

    parts.push('<ellipse cx="' + cx + '" cy="' + (cy+40) + '" rx="24" ry="5" fill="rgba(0,0,0,0.3)"/>');

    if (lv <= 2) {
      parts.push('<rect x="' + (cx-8) + '" y="' + (cy+24) + '" width="16" height="16" fill="#4a3a20" rx="2"/>');
      parts.push('<rect x="' + (cx-6) + '" y="' + (cy+22) + '" width="12" height="4" fill="#5a4a28" rx="1"/>');
      parts.push('<rect x="' + (cx-3) + '" y="' + (cy-28) + '" width="6" height="52" fill="#7a6a40" rx="2"/>');
      parts.push('<line x1="' + (cx-20) + '" y1="' + (cy-24) + '" x2="' + (cx+20) + '" y2="' + (cy-24) + '" stroke="#aaa" stroke-width="2"/>');
      parts.push('<line x1="' + (cx-14) + '" y1="' + (cy-18) + '" x2="' + (cx+14) + '" y2="' + (cy-18) + '" stroke="#aaa" stroke-width="1.5"/>');
      if (lv >= 2) {
        parts.push('<ellipse cx="' + (cx+14) + '" cy="' + (cy-10) + '" rx="10" ry="7" fill="none" stroke="#aaa" stroke-width="2"/>');
        parts.push('<line x1="' + (cx+4) + '" y1="' + (cy-10) + '" x2="' + (cx+14) + '" y2="' + (cy-10) + '" stroke="#888" stroke-width="2"/>');
        parts.push('<circle cx="' + (cx+6) + '" cy="' + (cy-28) + '" r="3" fill="#ffd600" opacity="0.6" filter="url(#glow-yellow)"/>');
      }

    } else if (lv <= 4) {
      const h = lv >= 4 ? 72 : 62;
      parts.push('<line x1="' + (cx-10) + '" y1="' + (cy+24) + '" x2="' + (cx-4) + '" y2="' + (cy-h+14) + '" stroke="#8a8a8a" stroke-width="3"/>');
      parts.push('<line x1="' + (cx+10) + '" y1="' + (cy+24) + '" x2="' + (cx+4) + '" y2="' + (cy-h+14) + '" stroke="#8a8a8a" stroke-width="3"/>');
      for (let i = 0; i < 3; i++) {
        const t = (i + 0.5) / 3.5;
        const by = cy + 24 - t * (h + 14);
        const bw = 10 * (1 - t * 0.7);
        parts.push('<line x1="' + (cx-bw) + '" y1="' + by + '" x2="' + (cx+bw) + '" y2="' + by + '" stroke="#666" stroke-width="1.5"/>');
      }
      parts.push('<rect x="' + (cx-2) + '" y="' + (cy-h-14) + '" width="4" height="28" fill="#9a9a9a" rx="1"/>');
      const dx = cx + (lv >= 4 ? 18 : 14);
      const dy = cy - h * 0.4;
      parts.push('<path d="M' + dx + ',' + (dy-10) + ' Q' + (dx+16) + ',' + dy + ' ' + dx + ',' + (dy+10) + '" fill="none" stroke="#c0c0c0" stroke-width="2.5"/>');
      parts.push('<line x1="' + (cx+4) + '" y1="' + dy + '" x2="' + dx + '" y2="' + dy + '" stroke="#888" stroke-width="2"/>');
      parts.push('<circle cx="' + cx + '" cy="' + (cy-h-16) + '" r="4" fill="#ff4444" opacity="0.8" filter="url(#glow-yellow)"/>');
      if (lv >= 4) {
        parts.push('<line x1="' + cx + '" y1="' + (cy-h-14) + '" x2="' + (cx-16) + '" y2="' + (cy-h-28) + '" stroke="#aaa" stroke-width="1.5"/>');
        parts.push('<circle cx="' + (cx-16) + '" cy="' + (cy-h-28) + '" r="3" fill="#ffd600" opacity="0.7" filter="url(#glow-yellow)"/>');
      }

    } else if (lv <= 6) {
      const h = lv >= 6 ? 88 : 76;
      const guyY = cy + 20;
      parts.push('<line x1="' + (cx-32) + '" y1="' + guyY + '" x2="' + cx + '" y2="' + (cy-h+10) + '" stroke="#666" stroke-width="1.5" stroke-dasharray="3,2"/>');
      parts.push('<line x1="' + (cx+32) + '" y1="' + guyY + '" x2="' + cx + '" y2="' + (cy-h+10) + '" stroke="#666" stroke-width="1.5" stroke-dasharray="3,2"/>');
      parts.push('<rect x="' + (cx-35) + '" y="' + (guyY-2) + '" width="8" height="6" fill="#555" rx="1"/>');
      parts.push('<rect x="' + (cx+27) + '" y="' + (guyY-2) + '" width="8" height="6" fill="#555" rx="1"/>');
      parts.push('<rect x="' + (cx-4) + '" y="' + (cy-h) + '" width="8" height="' + (h+20) + '" fill="#6a6a7a" rx="3"/>');
      parts.push('<rect x="' + (cx-3) + '" y="' + (cy-h) + '" width="3" height="' + (h+20) + '" fill="rgba(255,255,255,0.06)" rx="1"/>');
      const armLen = lv >= 6 ? 22 : 18;
      parts.push('<line x1="' + (cx-armLen) + '" y1="' + (cy-h*0.5) + '" x2="' + (cx+armLen) + '" y2="' + (cy-h*0.5) + '" stroke="#c0c0c0" stroke-width="3"/>');
      parts.push('<path d="M' + (cx-armLen) + ',' + (cy-h*0.5-8) + ' Q' + (cx-armLen-10) + ',' + (cy-h*0.5) + ' ' + (cx-armLen) + ',' + (cy-h*0.5+8) + '" fill="none" stroke="#ddd" stroke-width="2.5"/>');
      parts.push('<path d="M' + (cx+armLen) + ',' + (cy-h*0.5+8) + ' Q' + (cx+armLen+10) + ',' + (cy-h*0.5) + ' ' + (cx+armLen) + ',' + (cy-h*0.5-8) + '" fill="none" stroke="#ddd" stroke-width="2.5"/>');
      parts.push('<line x1="' + cx + '" y1="' + (cy-h) + '" x2="' + cx + '" y2="' + (cy-h-18) + '" stroke="#aaa" stroke-width="2"/>');
      parts.push('<circle cx="' + cx + '" cy="' + (cy-h-20) + '" r="5" fill="#ff4444" opacity="0.9" filter="url(#glow-yellow)"/>');
      if (lv >= 6) {
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-20) + '" r="10" fill="none" stroke="#ff4444" stroke-width="1.5" opacity="0.4"/>');
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-20) + '" r="16" fill="none" stroke="#ff4444" stroke-width="1" opacity="0.2"/>');
      }

    } else if (lv <= 8) {
      const h = lv >= 8 ? 100 : 90;
      parts.push('<rect x="' + (cx-14) + '" y="' + (cy+12) + '" width="28" height="20" fill="#3a4a3a" rx="2"/>');
      parts.push('<rect x="' + (cx-10) + '" y="' + (cy+6) + '" width="20" height="8" fill="#4a5a4a" rx="1"/>');
      for (let i = 0; i < 4; i++) {
        const lx = cx + (i < 2 ? -(i === 0 ? 12 : 6) : (i === 2 ? 6 : 12));
        const lean = i < 2 ? -(12-i*6) : (i-2)*6;
        parts.push('<line x1="' + lx + '" y1="' + (cy+12) + '" x2="' + (lx+lean) + '" y2="' + (cy-h+20) + '" stroke="#5a6a5a" stroke-width="3"/>');
      }
      for (let i = 0; i < 4; i++) {
        const by = cy + 12 - (i+1) * h / 5;
        const bw = 12 - i * 2;
        parts.push('<line x1="' + (cx-bw) + '" y1="' + by + '" x2="' + (cx+bw) + '" y2="' + by + '" stroke="#5a6a5a" stroke-width="2"/>');
      }
      parts.push('<rect x="' + (cx-3) + '" y="' + (cy-h+20) + '" width="6" height="' + (h-10) + '" fill="#7a8a7a" rx="2"/>');
      const dh = cy - h * 0.55;
      parts.push('<line x1="' + (cx-28) + '" y1="' + dh + '" x2="' + (cx+28) + '" y2="' + dh + '" stroke="#9aaa9a" stroke-width="2.5"/>');
      parts.push('<path d="M' + (cx-28) + ',' + (dh-12) + ' Q' + (cx-40) + ',' + dh + ' ' + (cx-28) + ',' + (dh+12) + '" fill="none" stroke="#c0d0c0" stroke-width="2.5"/>');
      parts.push('<path d="M' + (cx+28) + ',' + (dh+12) + ' Q' + (cx+40) + ',' + dh + ' ' + (cx+28) + ',' + (dh-12) + '" fill="none" stroke="#c0d0c0" stroke-width="2.5"/>');
      parts.push('<line x1="' + cx + '" y1="' + (cy-h+20) + '" x2="' + cx + '" y2="' + (cy-h-10) + '" stroke="#9a9a9a" stroke-width="3"/>');
      parts.push('<line x1="' + (cx-8) + '" y1="' + (cy-h+20) + '" x2="' + (cx-8) + '" y2="' + (cy-h+4) + '" stroke="#888" stroke-width="2"/>');
      parts.push('<line x1="' + (cx+8) + '" y1="' + (cy-h+20) + '" x2="' + (cx+8) + '" y2="' + (cy-h+4) + '" stroke="#888" stroke-width="2"/>');
      parts.push('<circle cx="' + cx + '" cy="' + (cy-h-12) + '" r="6" fill="#ff4444" opacity="0.95" filter="url(#glow-yellow)"/>');
      for (let i = 0; i < 3; i++) {
        const wy = cy - h*0.2 - i*20;
        parts.push('<rect x="' + (cx-3) + '" y="' + wy + '" width="6" height="5" fill="#ff8800" opacity="0.7"/>');
      }
      if (lv >= 8) {
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-12) + '" r="12" fill="none" stroke="#ff4444" stroke-width="1.5" opacity="0.5"/>');
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-12) + '" r="20" fill="none" stroke="#ff4444" stroke-width="1" opacity="0.3"/>');
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-12) + '" r="30" fill="none" stroke="#ff4444" stroke-width="1" opacity="0.15"/>');
      }

    } else {
      // Lv9-10: global array
      const h = lv >= 10 ? 110 : 100;
      parts.push('<rect x="' + (cx-20) + '" y="' + (cy+14) + '" width="40" height="24" fill="#2a3a2a" rx="3"/>');
      parts.push('<rect x="' + (cx-16) + '" y="' + (cy+10) + '" width="32" height="6" fill="#3a4a3a" rx="2"/>');
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 - Math.PI/6;
        const lx = cx + Math.cos(ang) * 18;
        const ly = cy + Math.sin(ang) * 6 + 22;
        parts.push('<line x1="' + lx + '" y1="' + ly + '" x2="' + (cx + Math.cos(ang) * 4) + '" y2="' + (cy-h+30) + '" stroke="#4a6a4a" stroke-width="2"/>');
      }
      parts.push('<rect x="' + (cx-5) + '" y="' + (cy-h+30) + '" width="10" height="' + (h-20) + '" fill="#5a7a5a" rx="3"/>');
      parts.push('<rect x="' + (cx-4) + '" y="' + (cy-h+30) + '" width="4" height="' + (h-20) + '" fill="rgba(255,255,255,0.06)" rx="1"/>');
      for (let i = 0; i < 5; i++) {
        const by = cy + 20 - i * (h+10) / 5.5;
        const bw = 16 - i * 2.5;
        parts.push('<line x1="' + (cx-bw) + '" y1="' + by + '" x2="' + (cx+bw) + '" y2="' + by + '" stroke="#5a6a5a" stroke-width="2"/>');
        if (i % 2 === 0) {
          parts.push('<line x1="' + (cx-bw) + '" y1="' + by + '" x2="' + cx + '" y2="' + (by - (h/5.5)) + '" stroke="#4a5a4a" stroke-width="1.5"/>');
          parts.push('<line x1="' + (cx+bw) + '" y1="' + by + '" x2="' + cx + '" y2="' + (by - (h/5.5)) + '" stroke="#4a5a4a" stroke-width="1.5"/>');
        }
      }
      const aDist = 32, aH = cy - h * 0.5;
      for (let i = 0; i < 4; i++) {
        const ang = i * Math.PI / 2;
        const ax = cx + Math.cos(ang) * aDist;
        const ay = aH + Math.sin(ang) * 8;
        parts.push('<line x1="' + cx + '" y1="' + aH + '" x2="' + ax + '" y2="' + ay + '" stroke="#8aaa8a" stroke-width="2"/>');
        parts.push('<ellipse cx="' + ax + '" cy="' + ay + '" rx="9" ry="7" fill="none" stroke="#a0c0a0" stroke-width="2" transform="rotate(' + (ang*180/Math.PI) + ' ' + ax + ' ' + ay + ')"/>');
      }
      parts.push('<line x1="' + cx + '" y1="' + (cy-h+30) + '" x2="' + cx + '" y2="' + (cy-h-14) + '" stroke="#a0c0a0" stroke-width="3"/>');
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        parts.push('<line x1="' + cx + '" y1="' + (cy-h+8) + '" x2="' + (cx + Math.cos(ang) * 16) + '" y2="' + (cy-h+8 + Math.sin(ang)*10) + '" stroke="#8aaa8a" stroke-width="1.5"/>');
        parts.push('<circle cx="' + (cx + Math.cos(ang) * 16) + '" cy="' + (cy-h+8 + Math.sin(ang)*10) + '" r="3" fill="#4caf50" opacity="0.9" filter="url(#glow-yellow)"/>');
      }
      parts.push('<circle cx="' + cx + '" cy="' + (cy-h-16) + '" r="7" fill="#ff4444" opacity="1.0" filter="url(#glow-yellow)"/>');
      for (let i = 1; i <= 4; i++) {
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-16) + '" r="' + (i*12) + '" fill="none" stroke="#4caf50" stroke-width="1" opacity="' + (0.5 - i*0.1) + '"/>');
      }
      if (lv >= 10) {
        parts.push('<text x="' + cx + '" y="' + (cy-h-42) + '" font-family="Press Start 2P" font-size="5" fill="#4caf50" text-anchor="middle">GLOBAL</text>');
        parts.push('<ellipse cx="' + cx + '" cy="' + (cy-h*0.4) + '" rx="55" ry="' + (h*0.55) + '" fill="#4caf50" opacity="0.04" filter="url(#glow-yellow)"/>');
      }
    }

    const labelCol = lv >= 9 ? '#4caf50' : lv >= 7 ? '#66bb6a' : lv >= 5 ? '#ff8800' : lv >= 3 ? '#aaa' : '#8a8a6a';
    parts.push('<text x="' + cx + '" y="' + (cy+58) + '" font-family="Press Start 2P" font-size="22" fill="' + labelCol + '" text-anchor="middle">RADIO Lv' + lv + '</text>');
    return '<g filter="url(#shadow)">' + parts.join('') + '</g>';
  },

};

// Extend with screen data method
BuildingRadioTower.getScreenData = function(s) {
  const bld  = s.base.buildings;
  const inv  = s.inventory;
  const lv   = bld.radio_tower?.level || 0;
  const rr   = s.base.raidChanceReduction || 0;
  const missions = s.world.unlockedMissions || [];
  const sigRange = s.base.radioSignalRange || 0;
  const mNames = { signal_drop:'Signal Drop', rescue_beacon:'Rescue Beacon', black_market:'Black Market', command_bunker:'Command Bunker', endgame_transmission:'Endgame Transmission' };
  const missionHtml = ['signal_drop','rescue_beacon','black_market','command_bunker','endgame_transmission'].map(mk => {
    const got = missions.includes(mk);
    return '<div class="bsc-row ' + (got?'ok':'locked') + '"><span>' + (got?'✓':'🔒') + ' ' + mNames[mk] + '</span><span>' + (got?'UNLOCKED':'...') + '</span></div>';
  }).join('');
  const actionBtn = lv > 0 ? '<button class="bsc-action-btn" onclick="WorldMap.render();window.Game.goTo(String.fromCharCode(109,97,112))">🌍 WORLD MAP</button>' : '';
  const statsRows = lv === 0
    ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>'
    : '<div class="bsc-row"><span>Level</span><span>' + lv + ' / 10</span></div>' +
      '<div class="bsc-row ok"><span>Raid chance reduced</span><span>' + Math.round(rr*100) + '%</span></div>' +
      '<div class="bsc-row"><span>Signal range</span><span>' + sigRange + ' / 10</span></div>' +
      '<div class="bsc-row"><span>Missions unlocked</span><span>' + missions.length + ' / 5</span></div>' +
      missionHtml;
  return { title: '📡 RADIO TOWER', visual: BuildingRadioTower.screen(lv), statsRows, actionBtn };
};
