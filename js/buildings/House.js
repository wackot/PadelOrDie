// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/House.js
// Everything specific to the House / Shelter building:
//   • Registry entry (title, desc, action)
//   • Level names array (Hay Pile → Metal Fortress)
//   • SVG renderer — all 10 upgrade visual stages
//   • Navigation handler (updates screen title on open)
// ═══════════════════════════════════════════

const BuildingHouse = {

  // ── Registry ──────────────────────────────
  id:     'house',
  title:  'Shelter',
  desc:   'Sleep and restore energy here.',
  action: 'shelter',

  hitW: 120,
  hitH: 100,

  // ── Level names (index = level - 1) ───────
  levelNames: [
    '🏚️ HAY PILE',   '🛏️ MATTRESS',   '🌿 LEAN-TO',    '🏠 OPEN HUT',
    '🏚️ WOOD SHACK', '🏡 WOOD HOUSE',  '🪟 GLASS HOUSE',
    '🧱 BRICK HOUSE', '🏘️ FANCY HOUSE', '🏰 METAL FORTRESS',
  ],

  // ── Navigation handler ────────────────────
  onOpen() {
    const hLv    = State.data?.base?.buildings?.house?.level || 1;
    const titleEl = document.getElementById('shelter-screen-title');
    if (titleEl) titleEl.textContent = (this.levelNames[hLv - 1] || this.levelNames[0]) + '  Lv' + hLv;
    Game.goTo('shelter');
  },

  // ── SVG renderer ──────────────────────────
  svg(cx, cy, level, isNight, lightsOn) {
    const lv = Math.max(1, Math.min(10, level || 1));
    const sf = 'filter="url(#shadow)"';
    const gE = 'filter="url(#glow-electric)"';
    const winGlow = (isNight && lightsOn) ? 'filter="url(#glow-yellow)"' : '';
    const winFill = (isNight && lightsOn) ? '#ffd060' : '#4a7a9a';
    const winFillDim = (isNight && lightsOn) ? '#e0b030' : '#3a6a8a';

    const labelCol = lv === 10 ? '#ef5350'
                   : lv >= 8  ? '#9090b0'
                   : lv >= 6  ? '#c8a840'
                   : '#9a9a60';
    const labels = [
      'HAY PILE','MATTRESS','LEAN-TO','OPEN HUT',
      'WOOD SHACK','WOOD HOUSE','GLASS HOUSE',
      'BRICK HOUSE','FANCY HOUSE','METAL FORTRESS',
    ];

    let out = '';

    if (lv === 1) {
      // Golden hay pile — mound of straw with tufts
      out = `<g ${sf}>
        <ellipse cx="${cx}" cy="${cy+10}" rx="46" ry="15" fill="#b88a08" opacity="0.6"/>
        <ellipse cx="${cx}" cy="${cy+4}"  rx="40" ry="20" fill="#d4a020"/>
        <ellipse cx="${cx-6}" cy="${cy}"  rx="30" ry="17" fill="#e0b030"/>
        <ellipse cx="${cx+5}" cy="${cy-2}" rx="22" ry="13" fill="#ecc040"/>
        <line x1="${cx-26}" y1="${cy+8}"  x2="${cx-30}" y2="${cy-5}"  stroke="#f0d060" stroke-width="2"/>
        <line x1="${cx-14}" y1="${cy+3}"  x2="${cx-16}" y2="${cy-11}" stroke="#e8c840" stroke-width="2"/>
        <line x1="${cx+2}"  y1="${cy+1}"  x2="${cx+5}"  y2="${cy-13}" stroke="#f0d060" stroke-width="2"/>
        <line x1="${cx+18}" y1="${cy+5}"  x2="${cx+22}" y2="${cy-7}"  stroke="#e8c840" stroke-width="2"/>
        <line x1="${cx+28}" y1="${cy+10}" x2="${cx+32}" y2="${cy-3}"  stroke="#f0d060" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${cy+20}" rx="50" ry="7" fill="rgba(0,0,0,0.18)"/>
      </g>`;

    } else if (lv === 2) {
      // Mattress on the ground with pillow and blanket
      out = `<g ${sf}>
        <rect x="${cx-34}" y="${cy+3}"  width="68" height="15" fill="#2a3a5a" rx="3"/>
        <rect x="${cx-32}" y="${cy+5}"  width="64" height="11" fill="#3a4a72" rx="2"/>
        <line x1="${cx-22}" y1="${cy+5}" x2="${cx-22}" y2="${cy+16}" stroke="#2a3a62" stroke-width="2"/>
        <line x1="${cx}"    y1="${cy+5}" x2="${cx}"    y2="${cy+16}" stroke="#2a3a62" stroke-width="2"/>
        <line x1="${cx+22}" y1="${cy+5}" x2="${cx+22}" y2="${cy+16}" stroke="#2a3a62" stroke-width="2"/>
        <rect x="${cx-30}" y="${cy+1}"  width="24" height="13" fill="#c8b090" rx="4"/>
        <rect x="${cx-8}"  y="${cy+3}"  width="38" height="13" fill="#7a8a9a" rx="2" opacity="0.75"/>
        <ellipse cx="${cx}" cy="${cy+24}" rx="40" ry="5" fill="rgba(0,0,0,0.2)"/>
      </g>`;

    } else if (lv === 3) {
      // Mattress under a rough stick lean-to with leaf cover
      out = `<g ${sf}>
        <rect x="${cx-36}" y="${cy-26}" width="6" height="42" fill="#6a4a20" rx="1"/>
        <rect x="${cx+30}" y="${cy-16}" width="6" height="32" fill="#6a4a20" rx="1"/>
        <line x1="${cx-33}" y1="${cy-26}" x2="${cx+33}" y2="${cy-16}" stroke="#7a5a28" stroke-width="5"/>
        <line x1="${cx-22}" y1="${cy-24}" x2="${cx+22}" y2="${cy-15}" stroke="#6a4a20" stroke-width="3"/>
        <line x1="${cx-8}"  y1="${cy-22}" x2="${cx+10}" y2="${cy-15}" stroke="#7a5a28" stroke-width="3"/>
        <ellipse cx="${cx-12}" cy="${cy-20}" rx="18" ry="6" fill="#4a5a20" opacity="0.75"/>
        <ellipse cx="${cx+14}" cy="${cy-18}" rx="15" ry="5" fill="#3a4a18" opacity="0.75"/>
        <rect x="${cx-32}" y="${cy+3}"  width="64" height="13" fill="#2a3a5a" rx="2"/>
        <rect x="${cx-30}" y="${cy+5}"  width="60" height="9"  fill="#3a4a72" rx="2"/>
        <line x1="${cx-20}" y1="${cy+5}" x2="${cx-20}" y2="${cy+14}" stroke="#2a3a62" stroke-width="2"/>
        <line x1="${cx+2}"  y1="${cy+5}" x2="${cx+2}"  y2="${cy+14}" stroke="#2a3a62" stroke-width="2"/>
        <line x1="${cx+20}" y1="${cy+5}" x2="${cx+20}" y2="${cy+14}" stroke="#2a3a62" stroke-width="2"/>
        <rect x="${cx-28}" y="${cy+1}"  width="20" height="11" fill="#c8b090" rx="3"/>
        <ellipse cx="${cx}" cy="${cy+24}" rx="44" ry="5" fill="rgba(0,0,0,0.2)"/>
      </g>`;

    } else if (lv === 4) {
      // Open wooden frame hut — posts + roof beams only, mattress inside
      const w=74, h=50;
      out = `<g ${sf}>
        <rect x="${cx-w/2}"   y="${cy-h/2-10}" width="8"  height="${h+10}" fill="#6a4a20" rx="1"/>
        <rect x="${cx+w/2-8}" y="${cy-h/2-10}" width="8"  height="${h+10}" fill="#6a4a20" rx="1"/>
        <rect x="${cx-4}"     y="${cy-h/2-6}"  width="6"  height="${h+6}"  fill="#5a3a18" rx="1"/>
        <polygon points="${cx-w/2-5},${cy-h/2} ${cx+w/2+5},${cy-h/2} ${cx},${cy-h/2-32}"
          fill="#7a5a28" stroke="#5a3a18" stroke-width="2"/>
        <line x1="${cx-32}" y1="${cy-h/2-14}" x2="${cx+32}" y2="${cy-h/2-14}" stroke="#6a4a20" stroke-width="3"/>
        <rect x="${cx-w/2+4}" y="${cy+h/2-6}"  width="${w-8}" height="6" fill="#7a5a28" opacity="0.6"/>
        <rect x="${cx-24}" y="${cy+4}"  width="48" height="13" fill="#2a3a5a" rx="2"/>
        <rect x="${cx-22}" y="${cy+6}"  width="44" height="9"  fill="#3a4a72" rx="2"/>
        <rect x="${cx-20}" y="${cy+2}"  width="16" height="11" fill="#c8b090" rx="3"/>
        <ellipse cx="${cx}" cy="${cy+h/2+5}" rx="${w*0.5}" ry="5" fill="rgba(0,0,0,0.2)"/>
      </g>`;

    } else if (lv === 5) {
      // Closed wood shack — planks, square windows, plank door
      const w=82, h=56;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#7a5a30" rx="2"/>
        <line x1="${cx-30}" y1="${cy-h/2}" x2="${cx-30}" y2="${cy+h/2}" stroke="#5a3a18" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx-15}" y1="${cy-h/2}" x2="${cx-15}" y2="${cy+h/2}" stroke="#5a3a18" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx}"    y1="${cy-h/2}" x2="${cx}"    y2="${cy+h/2}" stroke="#5a3a18" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx+15}" y1="${cy-h/2}" x2="${cx+15}" y2="${cy+h/2}" stroke="#5a3a18" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx+30}" y1="${cy-h/2}" x2="${cx+30}" y2="${cy+h/2}" stroke="#5a3a18" stroke-width="1.5" opacity="0.5"/>
        <polygon points="${cx-w/2-6},${cy-h/2} ${cx+w/2+6},${cy-h/2} ${cx},${cy-h/2-33}" fill="#5a3a18"/>
        <polygon points="${cx},${cy-h/2-33} ${cx+w/2+6},${cy-h/2} ${cx+2},${cy-h/2-31}" fill="rgba(0,0,0,0.2)"/>
        <rect x="${cx-w/2+10}" y="${cy-h/2+12}" width="18" height="14" fill="#0d1215" rx="1" stroke="#4a3018" stroke-width="2"/>
        <rect x="${cx+w/2-28}" y="${cy-h/2+12}" width="18" height="14" fill="#0d1215" rx="1" stroke="#4a3018" stroke-width="2"/>
        <rect x="${cx-11}" y="${cy+h/2-27}" width="22" height="27" fill="#3a2010" rx="1"/>
        <line x1="${cx}"    y1="${cy+h/2-27}" x2="${cx}"    y2="${cy+h/2}"    stroke="#2a1808" stroke-width="2"/>
        <line x1="${cx-11}" y1="${cy+h/2-14}" x2="${cx+11}" y2="${cy+h/2-14}" stroke="#2a1808" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${cy+h/2+5}" rx="${w*0.52}" ry="5" fill="rgba(0,0,0,0.22)"/>
      </g>`;

    } else if (lv === 6) {
      // Wooden house: porch, shuttered windows, panel door, chimney
      const w=90, h=60;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#9a7040" rx="2"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+34}" x2="${cx+w/2}" y2="${cy-h/2+34}" stroke="#7a5028" stroke-width="1.5" opacity="0.4"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+46}" x2="${cx+w/2}" y2="${cy-h/2+46}" stroke="#7a5028" stroke-width="1.5" opacity="0.4"/>
        <polygon points="${cx-w/2-8},${cy-h/2} ${cx+w/2+8},${cy-h/2} ${cx},${cy-h/2-38}" fill="#6a3818"/>
        <polygon points="${cx},${cy-h/2-38} ${cx+w/2+8},${cy-h/2} ${cx+3},${cy-h/2-36}" fill="rgba(0,0,0,0.2)"/>
        <rect x="${cx+20}" y="${cy-h/2-28}" width="12" height="30" fill="#8a7040" rx="1"/>
        <rect x="${cx+18}" y="${cy-h/2-30}" width="16" height="5"  fill="#4a4030" rx="1"/>
        <rect x="${cx-w/2+10}" y="${cy-h/2+10}" width="20" height="16" fill="#1a2a3a" rx="1"/>
        <line x1="${cx-w/2+20}" y1="${cy-h/2+10}" x2="${cx-w/2+20}" y2="${cy-h/2+26}" stroke="#243040" stroke-width="1"/>
        <line x1="${cx-w/2+10}" y1="${cy-h/2+18}" x2="${cx-w/2+30}" y2="${cy-h/2+18}" stroke="#243040" stroke-width="1"/>
        <rect x="${cx-w/2+7}"  y="${cy-h/2+9}"  width="5" height="18" fill="#7a5028" rx="1"/>
        <rect x="${cx-w/2+30}" y="${cy-h/2+9}"  width="5" height="18" fill="#7a5028" rx="1"/>
        <rect x="${cx+w/2-30}" y="${cy-h/2+10}" width="20" height="16" fill="#1a2a3a" rx="1"/>
        <line x1="${cx+w/2-20}" y1="${cy-h/2+10}" x2="${cx+w/2-20}" y2="${cy-h/2+26}" stroke="#243040" stroke-width="1"/>
        <line x1="${cx+w/2-30}" y1="${cy-h/2+18}" x2="${cx+w/2-10}" y2="${cy-h/2+18}" stroke="#243040" stroke-width="1"/>
        <rect x="${cx+w/2-33}" y="${cy-h/2+9}"  width="5" height="18" fill="#7a5028" rx="1"/>
        <rect x="${cx+w/2-10}" y="${cx-h/2+9}"  width="5" height="18" fill="#7a5028" rx="1"/>
        <rect x="${cx-w/2-8}" y="${cy+h/2-6}"  width="${w+16}" height="10" fill="#8a6030" rx="2"/>
        <rect x="${cx-w/2+4}" y="${cy+h/2-26}" width="7"       height="30" fill="#9a7040" rx="1"/>
        <rect x="${cx+w/2-11}" y="${cy+h/2-26}" width="7"      height="30" fill="#9a7040" rx="1"/>
        <rect x="${cx-12}" y="${cy+h/2-30}" width="24" height="30" fill="#5a3010" rx="2"/>
        <rect x="${cx-10}" y="${cy+h/2-28}" width="9"  height="11" fill="#4a2808" rx="1"/>
        <rect x="${cx+1}"  y="${cy+h/2-28}" width="9"  height="11" fill="#4a2808" rx="1"/>
        <rect x="${cx-10}" y="${cy+h/2-15}" width="9"  height="11" fill="#4a2808" rx="1"/>
        <rect x="${cx+1}"  y="${cy+h/2-15}" width="9"  height="11" fill="#4a2808" rx="1"/>
        <circle cx="${cx+8}" cy="${cy+h/2-12}" r="2.5" fill="#c8a840"/>
        <ellipse cx="${cx}" cy="${cy+h/2+10}" rx="${w*0.55}" ry="5" fill="rgba(0,0,0,0.2)"/>
      </g>`;

    } else if (lv === 7) {
      // Glass windows (blue tint + glint), glass panel in door, nicer porch
      const w=94, h=62;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#a07848" rx="2"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+34}" x2="${cx+w/2}" y2="${cy-h/2+34}" stroke="#7a5828" stroke-width="1.5" opacity="0.35"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+48}" x2="${cx+w/2}" y2="${cy-h/2+48}" stroke="#7a5828" stroke-width="1.5" opacity="0.35"/>
        <polygon points="${cx-w/2-8},${cy-h/2} ${cx+w/2+8},${cy-h/2} ${cx},${cy-h/2-40}" fill="#6a3a18"/>
        <polygon points="${cx},${cy-h/2-40} ${cx+w/2+8},${cy-h/2} ${cx+3},${cy-h/2-38}" fill="rgba(0,0,0,0.2)"/>
        <rect x="${cx+22}" y="${cy-h/2-30}" width="12" height="32" fill="#8a7040" rx="1"/>
        <rect x="${cx+20}" y="${cy-h/2-32}" width="16" height="5"  fill="#4a4030" rx="1"/>
        <rect x="${cx-w/2+10}" y="${cy-h/2+10}" width="22" height="18" fill="${winFillDim}" rx="2" opacity="0.85" ${winGlow}/>
        <rect x="${cx-w/2+10}" y="${cy-h/2+10}" width="22" height="18" fill="none" stroke="#8a9090" stroke-width="2" rx="2"/>
        <line x1="${cx-w/2+21}" y1="${cy-h/2+10}" x2="${cx-w/2+21}" y2="${cy-h/2+28}" stroke="#6a8090" stroke-width="1.5"/>
        <line x1="${cx-w/2+10}" y1="${cy-h/2+19}" x2="${cx-w/2+32}" y2="${cy-h/2+19}" stroke="#6a8090" stroke-width="1.5"/>
        <line x1="${cx-w/2+12}" y1="${cy-h/2+12}" x2="${cx-w/2+18}" y2="${cy-h/2+15}" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
        <rect x="${cx+w/2-32}" y="${cy-h/2+10}" width="22" height="18" fill="${winFillDim}" rx="2" opacity="0.85" ${winGlow}/>
        <rect x="${cx+w/2-32}" y="${cy-h/2+10}" width="22" height="18" fill="none" stroke="#8a9090" stroke-width="2" rx="2"/>
        <line x1="${cx+w/2-21}" y1="${cy-h/2+10}" x2="${cx+w/2-21}" y2="${cy-h/2+28}" stroke="#6a8090" stroke-width="1.5"/>
        <line x1="${cx+w/2-32}" y1="${cy-h/2+19}" x2="${cx+w/2-10}" y2="${cy-h/2+19}" stroke="#6a8090" stroke-width="1.5"/>
        <line x1="${cx+w/2-30}" y1="${cy-h/2+12}" x2="${cx+w/2-24}" y2="${cy-h/2+15}" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
        <rect x="${cx-w/2-8}" y="${cy+h/2-6}"  width="${w+16}" height="10" fill="#8a6030" rx="2"/>
        <rect x="${cx-w/2+4}" y="${cy+h/2-26}" width="7"       height="32" fill="#a07848" rx="1"/>
        <rect x="${cx+w/2-11}" y="${cy+h/2-26}" width="7"      height="32" fill="#a07848" rx="1"/>
        <rect x="${cx-w/2+2}" y="${cy+h/2-28}" width="12" height="4"  fill="#c8a870" rx="1"/>
        <rect x="${cx+w/2-14}" y="${cy+h/2-28}" width="12" height="4" fill="#c8a870" rx="1"/>
        <rect x="${cx-13}" y="${cy+h/2-32}" width="26" height="32" fill="#5a3010" rx="2"/>
        <rect x="${cx-8}"  y="${cy+h/2-30}" width="16" height="10" fill="${winFillDim}" rx="1" opacity="0.85" ${winGlow}/>
        <rect x="${cx-8}"  y="${cy+h/2-30}" width="16" height="10" fill="none" stroke="#6a8090" stroke-width="1.5" rx="1"/>
        <line x1="${cx-6}" y1="${cy+h/2-28}" x2="${cx-2}" y2="${cy+h/2-25}" stroke="rgba(255,255,255,0.35)" stroke-width="1"/>
        <rect x="${cx-11}" y="${cy+h/2-18}" width="10" height="14" fill="#4a2808" rx="1"/>
        <rect x="${cx+1}"  y="${cy+h/2-18}" width="10" height="14" fill="#4a2808" rx="1"/>
        <circle cx="${cx+10}" cy="${cy+h/2-11}" r="2.5" fill="#d4b850"/>
        <ellipse cx="${cx}" cy="${cy+h/2+10}" rx="${w*0.55}" ry="5" fill="rgba(0,0,0,0.2)"/>
      </g>`;

    } else if (lv === 8) {
      // Brick house — tiled brick walls, slate roof, glass windows
      const w=98, h=66;
      let bricks = '';
      const bw=14, bh=8;
      for (let row=0; row<=Math.ceil(h/bh)+1; row++) {
        const offset = (row%2===0) ? 0 : bw/2;
        for (let col=-1; col<=Math.ceil(w/bw)+1; col++) {
          const bx = cx - w/2 + col*bw + offset;
          const by = cy - h/2 + row*bh;
          const shade = ((row+col)%3===0) ? '#8a5a40' : ((row+col)%3===1) ? '#7a4a30' : '#904a38';
          bricks += `<rect x="${bx+0.5}" y="${by+0.5}" width="${bw-1}" height="${bh-1}" fill="${shade}" rx="0.5"/>`;
        }
      }
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#7a4a30" rx="2"/>
        <clipPath id="brickClip8"><rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" rx="2"/></clipPath>
        <g clip-path="url(#brickClip8)" opacity="0.9">${bricks}</g>
        <polygon points="${cx-w/2-8},${cy-h/2} ${cx+w/2+8},${cy-h/2} ${cx},${cy-h/2-42}" fill="#4a4850"/>
        <polygon points="${cx},${cy-h/2-42} ${cx+w/2+8},${cy-h/2} ${cx+3},${cy-h/2-40}" fill="rgba(0,0,0,0.25)"/>
        <rect x="${cx+22}" y="${cy-h/2-34}" width="14" height="36" fill="#7a4a30" rx="1"/>
        <rect x="${cx+20}" y="${cy-h/2-36}" width="18" height="5"  fill="#4a4030" rx="1"/>
        <rect x="${cx-w/2+12}" y="${cy-h/2+12}" width="22" height="18" fill="${winFillDim}" rx="2" opacity="0.88" ${winGlow}/>
        <rect x="${cx-w/2+12}" y="${cy-h/2+12}" width="22" height="18" fill="none" stroke="#6a8090" stroke-width="2" rx="2"/>
        <line x1="${cx-w/2+23}" y1="${cy-h/2+12}" x2="${cx-w/2+23}" y2="${cy-h/2+30}" stroke="#5a7080" stroke-width="1.5"/>
        <line x1="${cx-w/2+12}" y1="${cy-h/2+21}" x2="${cx-w/2+34}" y2="${cy-h/2+21}" stroke="#5a7080" stroke-width="1.5"/>
        <line x1="${cx-w/2+14}" y1="${cy-h/2+14}" x2="${cx-w/2+20}" y2="${cy-h/2+17}" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
        <rect x="${cx+w/2-34}" y="${cy-h/2+12}" width="22" height="18" fill="${winFillDim}" rx="2" opacity="0.88" ${winGlow}/>
        <rect x="${cx+w/2-34}" y="${cy-h/2+12}" width="22" height="18" fill="none" stroke="#6a8090" stroke-width="2" rx="2"/>
        <line x1="${cx+w/2-23}" y1="${cy-h/2+12}" x2="${cx+w/2-23}" y2="${cy-h/2+30}" stroke="#5a7080" stroke-width="1.5"/>
        <line x1="${cx+w/2-34}" y1="${cy-h/2+21}" x2="${cx+w/2-12}" y2="${cy-h/2+21}" stroke="#5a7080" stroke-width="1.5"/>
        <line x1="${cx+w/2-32}" y1="${cy-h/2+14}" x2="${cx+w/2-26}" y2="${cy-h/2+17}" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
        <rect x="${cx-14}" y="${cy+h/2-34}" width="28" height="34" fill="#6a3818" rx="2"/>
        <rect x="${cx-12}" y="${cy+h/2-32}" width="11" height="15" fill="#4a2810" rx="1"/>
        <rect x="${cx+1}"  y="${cy+h/2-32}" width="11" height="15" fill="#4a2810" rx="1"/>
        <rect x="${cx-11}" y="${cy+h/2-15}" width="22" height="13" fill="#4a2810" rx="1"/>
        <circle cx="${cx+10}" cy="${cy+h/2-9}" r="2.5" fill="#d4b850"/>
        <rect x="${cx-18}" y="${cy+h/2-4}" width="36" height="6" fill="#6a4a28" rx="1"/>
        <ellipse cx="${cx}" cy="${cy+h/2+10}" rx="${w*0.55}" ry="5" fill="rgba(0,0,0,0.2)"/>
      </g>`;

    } else if (lv === 9) {
      // Fancy house — warm tone, arched windows, columns, flower patch
      const w=102, h=68;
      const flowers = [[-34,0,'#e53935'],[-22,-2,'#ffd600'],[-8,1,'#e53935'],[6,-1,'#ff8a00'],[20,0,'#ffd600'],[34,1,'#e53935']];
      const flowerSVG = flowers.map(([ox,oy,col]) =>
        `<line x1="${cx+ox}" y1="${cy+h/2+4+oy}" x2="${cx+ox}" y2="${cy+h/2+9+oy}" stroke="#4caf50" stroke-width="2"/>
         <circle cx="${cx+ox}" cy="${cy+h/2+oy}" r="5" fill="${col}" opacity="0.92"/>
         <circle cx="${cx+ox}" cy="${cy+h/2+oy}" r="2" fill="rgba(255,255,255,0.5)"/>`
      ).join('');
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#c8a870" rx="3"/>
        <rect x="${cx-w/2}" y="${cy-h/2+h*0.56}" width="${w}" height="5" fill="#e8dcc8" opacity="0.5"/>
        <polygon points="${cx-w/2-10},${cy-h/2} ${cx+w/2+10},${cy-h/2} ${cx},${cy-h/2-46}" fill="#5a3020"/>
        <polygon points="${cx},${cy-h/2-46} ${cx+w/2+10},${cy-h/2} ${cx+3},${cy-h/2-44}" fill="rgba(0,0,0,0.2)"/>
        <circle cx="${cx}" cy="${cy-h/2-46}" r="6" fill="#c8a030"/>
        <rect x="${cx-30}" y="${cy-h/2-28}" width="11" height="30" fill="#9a7848" rx="1"/>
        <rect x="${cx-32}" y="${cy-h/2-30}" width="15" height="5"  fill="#4a4030" rx="1"/>
        <rect x="${cx+22}" y="${cy-h/2-24}" width="11" height="26" fill="#9a7848" rx="1"/>
        <rect x="${cx+20}" y="${cy-h/2-26}" width="15" height="5"  fill="#4a4030" rx="1"/>
        <rect x="${cx-w/2+12}" y="${cy-h/2+10}" width="22" height="22" fill="#5a8aaa" rx="2" opacity="0.88"/>
        <path d="M${cx-w/2+12},${cy-h/2+21} Q${cx-w/2+23},${cy-h/2+8} ${cx-w/2+34},${cy-h/2+21}" fill="${winFill}" opacity="0.7" ${winGlow}/>
        <rect x="${cx-w/2+12}" y="${cy-h/2+10}" width="22" height="22" fill="none" stroke="#c8a870" stroke-width="2" rx="2"/>
        <line x1="${cx-w/2+14}" y1="${cy-h/2+12}" x2="${cx-w/2+20}" y2="${cy-h/2+16}" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
        <rect x="${cx+w/2-34}" y="${cy-h/2+10}" width="22" height="22" fill="#5a8aaa" rx="2" opacity="0.88"/>
        <path d="M${cx+w/2-34},${cy-h/2+21} Q${cx+w/2-23},${cy-h/2+8} ${cx+w/2-12},${cy-h/2+21}" fill="${winFill}" opacity="0.7" ${winGlow}/>
        <rect x="${cx+w/2-34}" y="${cy-h/2+10}" width="22" height="22" fill="none" stroke="#c8a870" stroke-width="2" rx="2"/>
        <line x1="${cx+w/2-32}" y1="${cy-h/2+12}" x2="${cx+w/2-26}" y2="${cy-h/2+16}" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
        <rect x="${cx-w/2-10}" y="${cy+h/2-8}"  width="${w+20}" height="10" fill="#b89060" rx="2"/>
        <rect x="${cx-w/2-10}" y="${cy+h/2-28}" width="${w+20}" height="4"  fill="#a07850"/>
        <rect x="${cx-w/2+4}"  y="${cy+h/2-30}" width="8" height="36" fill="#e0d0b0" rx="2"/>
        <rect x="${cx+w/2-12}" y="${cy+h/2-30}" width="8" height="36" fill="#e0d0b0" rx="2"/>
        <rect x="${cx-w/2+2}"  y="${cy+h/2-32}" width="12" height="4" fill="#c8b890" rx="1"/>
        <rect x="${cx+w/2-14}" y="${cy+h/2-32}" width="12" height="4" fill="#c8b890" rx="1"/>
        <rect x="${cx-13}" y="${cy+h/2-34}" width="26" height="34" fill="#5a3010" rx="3"/>
        <path d="M${cx-13},${cy+h/2-23} Q${cx},${cy+h/2-40} ${cx+13},${cy+h/2-23}" fill="#4a2808"/>
        <rect x="${cx-9}" y="${cy+h/2-32}" width="18" height="10" fill="${winFillDim}" rx="1" opacity="0.85" ${winGlow}/>
        <circle cx="${cx+9}" cy="${cy+h/2-18}" r="3" fill="#d4b850"/>
        <rect x="${cx-w/2}" y="${cy+h/2+2}" width="${w+20}" height="10" fill="#3a2810" rx="2" opacity="0.8"/>
        ${flowerSVG}
        <ellipse cx="${cx}" cy="${cy+h/2+20}" rx="${w*0.62}" ry="5" fill="rgba(0,0,0,0.2)"/>
      </g>`;

    } else {
      // lv === 10 — Metal Fortress: cameras, turrets, neon sign
      const w=112, h=74;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#3a3a4a" rx="2"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+h*0.34}" x2="${cx+w/2}" y2="${cy-h/2+h*0.34}" stroke="#2a2a3a" stroke-width="2" opacity="0.6"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+h*0.67}" x2="${cx+w/2}" y2="${cy-h/2+h*0.67}" stroke="#2a2a3a" stroke-width="2" opacity="0.6"/>
        <line x1="${cx-32}" y1="${cy-h/2}" x2="${cx-32}" y2="${cy+h/2}" stroke="#2a2a3a" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx}"    y1="${cy-h/2}" x2="${cx}"    y2="${cy+h/2}" stroke="#2a2a3a" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx+32}" y1="${cy-h/2}" x2="${cx+32}" y2="${cy+h/2}" stroke="#2a2a3a" stroke-width="1.5" opacity="0.5"/>
        <rect x="${cx-w/2-6}" y="${cy-h/2-10}" width="${w+12}" height="12" fill="#4a4a5a" rx="1"/>
        <rect x="${cx-42}" y="${cy-h/2-22}" width="10" height="12" fill="#4a4a5a" rx="1"/>
        <rect x="${cx-26}" y="${cy-h/2-22}" width="10" height="12" fill="#4a4a5a" rx="1"/>
        <rect x="${cx-10}" y="${cy-h/2-22}" width="10" height="12" fill="#4a4a5a" rx="1"/>
        <rect x="${cx+6}"  y="${cy-h/2-22}" width="10" height="12" fill="#4a4a5a" rx="1"/>
        <rect x="${cx+22}" y="${cy-h/2-22}" width="10" height="12" fill="#4a4a5a" rx="1"/>
        <rect x="${cx+38}" y="${cy-h/2-22}" width="10" height="12" fill="#4a4a5a" rx="1"/>
        <rect x="${cx-4}"  y="${cy-h/2-52}" width="8" height="42" fill="#3a3a4a" rx="1"/>
        <line x1="${cx-20}" y1="${cy-h/2-38}" x2="${cx+20}" y2="${cy-h/2-38}" stroke="#5a5a6a" stroke-width="2"/>
        <circle cx="${cx}" cy="${cy-h/2-52}" r="4" fill="#e53935" ${gE}/>
        <rect x="${cx-w/2+4}" y="${cy-h/2-8}" width="${w-8}" height="14" fill="#080814" rx="2" stroke="#29b6f6" stroke-width="1.5" ${gE}/>
        <text x="${cx}" y="${cy-h/2+2}"
          font-family="Press Start 2P" font-size="20"
          fill="#29b6f6" text-anchor="middle" ${gE}>THE END IS NEAR</text>
        <rect x="${cx-w/2+12}" y="${cy-h/2+18}" width="20" height="10" fill="#29b6f6" rx="1" opacity="0.7" ${gE}/>
        <rect x="${cx+w/2-32}" y="${cy-h/2+18}" width="20" height="10" fill="#29b6f6" rx="1" opacity="0.7" ${gE}/>
        <rect x="${cx-14}" y="${cy+h/2-36}" width="28" height="36" fill="#2a2a38" rx="2"/>
        <rect x="${cx-12}" y="${cy+h/2-34}" width="24" height="32" fill="#323244" rx="1" stroke="#4a4a5a" stroke-width="1"/>
        <rect x="${cx-6}"  y="${cy+h/2-24}" width="12" height="2" fill="#29b6f6" opacity="0.6" ${gE}/>
        <rect x="${cx-6}"  y="${cy+h/2-18}" width="12" height="2" fill="#29b6f6" opacity="0.6" ${gE}/>
        <circle cx="${cx}" cy="${cy+h/2-10}" r="4" fill="#4a4a5a" stroke="#606070" stroke-width="1.5"/>
        <rect x="${cx-w/2+2}" y="${cy-h/2+3}"  width="12" height="8" fill="#2a2a38" rx="1"/>
        <rect x="${cx-w/2+10}" y="${cy-h/2+4}" width="8"  height="6" fill="#1a1a28" rx="1"/>
        <circle cx="${cx-w/2+6}" cy="${cy-h/2+7}" r="3" fill="#0a0a18" stroke="#e53935" stroke-width="1" ${gE}/>
        <rect x="${cx+w/2-14}" y="${cy-h/2+3}"  width="12" height="8" fill="#2a2a38" rx="1"/>
        <rect x="${cx+w/2-18}" y="${cy-h/2+4}" width="8"  height="6" fill="#1a1a28" rx="1"/>
        <circle cx="${cx+w/2-9}" cy="${cy-h/2+7}" r="3" fill="#0a0a18" stroke="#e53935" stroke-width="1" ${gE}/>
        <rect x="${cx-w/2-4}" y="${cy-h/2-24}" width="16" height="12" fill="#2a2a38" rx="2"/>
        <rect x="${cx-w/2-6}" y="${cy-h/2-20}" width="6"  height="5"  fill="#1a1a28" rx="1"/>
        <line x1="${cx-w/2-2}" y1="${cy-h/2-17}" x2="${cx-w/2-16}" y2="${cy-h/2-28}" stroke="#606070" stroke-width="3"/>
        <circle cx="${cx-w/2+2}" cy="${cy-h/2-20}" r="4" fill="#1a1a28" stroke="#4a4a5a" stroke-width="1.5"/>
        <rect x="${cx+w/2-12}" y="${cy-h/2-24}" width="16" height="12" fill="#2a2a38" rx="2"/>
        <rect x="${cx+w/2}"    y="${cy-h/2-20}" width="6"  height="5"  fill="#1a1a28" rx="1"/>
        <line x1="${cx+w/2+4}" y1="${cy-h/2-17}" x2="${cx+w/2+18}" y2="${cy-h/2-28}" stroke="#606070" stroke-width="3"/>
        <circle cx="${cx+w/2-2}" cy="${cy-h/2-20}" r="4" fill="#1a1a28" stroke="#4a4a5a" stroke-width="1.5"/>
        <circle cx="${cx-w/2+8}" cy="${cy-h/2-22}" r="2" fill="#e53935" ${gE}/>
        <circle cx="${cx+w/2+2}" cy="${cy-h/2-22}" r="2" fill="#e53935" ${gE}/>
        <ellipse cx="${cx}" cy="${cy+h/2+8}" rx="${w*0.57}" ry="5" fill="rgba(0,0,0,0.25)"/>
      </g>`;
    }

    return `<g>
      ${out}
      <rect x="${cx-68}" y="${cy+48}" width="136" height="22" fill="#0d0d0d" rx="4" opacity="0.85"/>
      <text x="${cx}" y="${cy+64}"
        font-family="Press Start 2P" font-size="28"
        fill="${labelCol}" text-anchor="middle">Lv${lv} ${labels[lv-1]}</text>
    </g>`;
  },

};
