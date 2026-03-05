// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/Storage.js
// Everything specific to the Storage Room:
//   • Registry entry
//   • Map SVG renderer — 10 levels (crates → apocalypse warehouse)
//   • Building screen visual + stats rows
//   • Navigation handler
// ═══════════════════════════════════════════

const BuildingStorage = {

  // ── Registry ──────────────────────────────
  id:     'storage',
  title:  'Storage Room',
  desc:   'Stores your resources. Upgrade to raise caps.',
  action: 'upgrades',

  hitW: 80,
  hitH: 80,

  // ── Navigation handler ────────────────────
  onOpen(renderBuildingScreenFn = null) {
    const s   = State.data;
    const bld = s.base.buildings;
    const lv   = bld.storage?.level || 1;
    const capA = s.base.storageCapA || 50;
    const capB = s.base.storageCapB || 0;
    const capC = s.base.storageCapC || 0;
    const capD = s.base.storageCapD || 0;

    const visual = `<svg width="110" height="90" viewBox="0 0 110 90">
      <rect x="10" y="10" width="90" height="65" fill="#2a2018" rx="3"/>
      <rect x="10" y="10" width="90" height="12" fill="#3a3028" rx="3"/>
      <rect x="15" y="26" width="80" height="10" fill="#332820" rx="1"/>
      <rect x="15" y="40" width="80" height="10" fill="#3a3028" rx="1"/>
      <rect x="15" y="54" width="80" height="10" fill="#332820" rx="1"/>
      <circle cx="55" cy="16" r="3" fill="#888"/>
      <text x="55" y="84" text-anchor="middle" font-size="10" fill="#888">Level ${lv}</text>
    </svg>`;

    const statsRows = `
      <div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
      <div class="bsc-row"><span>Basic resources cap</span><span>${capA} each</span></div>
      <div class="bsc-row ${capB>0?'ok':'locked'}"><span>Advanced cap</span><span>${capB > 0 ? capB+' each' : '🔒 Unlocks at Lv3'}</span></div>
      <div class="bsc-row ${capC>0?'ok':'locked'}"><span>Rare materials cap</span><span>${capC > 0 ? capC+' each' : '🔒 Unlocks at Lv5'}</span></div>
      <div class="bsc-row ${capD>0?'ok':'locked'}"><span>Tech parts cap</span><span>${capD > 0 ? capD+' each' : '🔒 Unlocks at Lv8'}</span></div>`;

    renderBuildingScreenFn?.('🗃️ STORAGE ROOM', visual, statsRows, 'storage');
    return { title: '🗃️ STORAGE ROOM', visual, statsRows, actionBtn: '' };
  },

  // ── Map SVG renderer ──────────────────────
  svg(cx, cy, level) {
    const lv = Math.max(1, Math.min(10, level || 1));
    const sf = 'filter="url(#shadow)"';
    const capLabels = ['50','100','150+B','200+B','300+C','400+C','500+C','750+D','1k+D','2000'];
    const labelCol  = lv >= 8 ? '#8080b0' : lv >= 5 ? '#7080a0' : lv >= 3 ? '#9a8060' : '#7a7a50';
    let out = '';

    if (lv === 1) {
      // Random pile of wooden crates and barrels outdoors
      out = `<g ${sf}>
        <rect x="${cx-22}" y="${cy}"   width="18" height="14" fill="#7a5a28" rx="1" stroke="#5a3a18" stroke-width="1"/>
        <rect x="${cx-4}"  y="${cy-4}" width="18" height="18" fill="#8a6a30" rx="1" stroke="#6a4a20" stroke-width="1"/>
        <rect x="${cx+14}" y="${cy+2}" width="14" height="12" fill="#7a5a28" rx="1" stroke="#5a3a18" stroke-width="1"/>
        <ellipse cx="${cx-10}" cy="${cy+14}" rx="8" ry="5" fill="#5a3a18" stroke="#4a2a10" stroke-width="1"/>
        <line x1="${cx-22}" y1="${cy+7}" x2="${cx-4}"  y2="${cy+7}"  stroke="#5a3a18" stroke-width="1"/>
        <line x1="${cx-4}"  y1="${cy+4}" x2="${cx+14}" y2="${cy+4}"  stroke="#6a4a20" stroke-width="1"/>
        <ellipse cx="${cx}" cy="${cy+20}" rx="30" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 2) {
      const w=46, h=36;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#7a5a30" rx="1"/>
        <polygon points="${cx-w/2-4},${cy-h/2} ${cx+w/2+4},${cy-h/2} ${cx+w/2-4},${cy-h/2-16} ${cx-w/2+4},${cy-h/2-16}" fill="#5a3a18"/>
        <rect x="${cx-w/2+2}" y="${cy-h/2+2}" width="${w-4}" height="${h-4}" fill="#3a2010" rx="1" opacity="0.3"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+12}" x2="${cx+w/2}" y2="${cy-h/2+12}" stroke="#5a3a18" stroke-width="1.5" opacity="0.5"/>
        <rect x="${cx-14}" y="${cy}" width="12" height="10" fill="#8a6a30" rx="1"/>
        <rect x="${cx+2}"  y="${cy+2}" width="12" height="8"  fill="#7a5a28" rx="1"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="28" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 3) {
      const w=48, h=40;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#8a6838" rx="1"/>
        <line x1="${cx-16}" y1="${cy-h/2}" x2="${cx-16}" y2="${cy+h/2}" stroke="#6a4a28" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx+0}"  y1="${cy-h/2}" x2="${cx+0}"  y2="${cy+h/2}" stroke="#6a4a28" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx+16}" y1="${cy-h/2}" x2="${cx+16}" y2="${cy+h/2}" stroke="#6a4a28" stroke-width="1.5" opacity="0.5"/>
        <polygon points="${cx-w/2-4},${cy-h/2} ${cx+w/2+4},${cy-h/2} ${cx+w/2},${cy-h/2-18} ${cx-w/2},${cy-h/2-18}" fill="#5a3818"/>
        <polygon points="${cx-w/2},${cy-h/2-18} ${cx+w/2},${cy-h/2-18} ${cx},${cy-h/2-30}" fill="#7a5028"/>
        <rect x="${cx-10}" y="${cy+h/2-22}" width="20" height="22" fill="#4a2e10" rx="1"/>
        <rect x="${cx-4}" y="${cy+h/2-14}" width="8" height="7" fill="#b0800a" rx="1"/>
        <path d="M${cx-3},${cy+h/2-14} Q${cx},${cy+h/2-20} ${cx+3},${cy+h/2-14}" fill="none" stroke="#c89a20" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="28" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 4) {
      const w=58, h=40;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="26" height="${h}" fill="#8a6838" rx="1"/>
        <rect x="${cx-w/2+28}" y="${cy-h/2+4}" width="28" height="${h-4}" fill="#7a5a30" rx="1"/>
        <polygon points="${cx-w/2-4},${cy-h/2} ${cx-w/2+29},${cy-h/2} ${cx-w/2+13},${cy-h/2-20}" fill="#5a3818"/>
        <polygon points="${cx-w/2+26},${cy-h/2+4} ${cx+w/2+4},${cy-h/2+4} ${cx},${cy-h/2-14}" fill="#4a3018"/>
        <rect x="${cx-w/2+4}" y="${cy+h/2-18}" width="16" height="18" fill="#3a2010" rx="1"/>
        <rect x="${cx-w/2+30}" y="${cy+h/2-16}" width="14" height="16" fill="#3a2010" rx="1"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="34" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 5) {
      const w=54, h=44;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#8a7040" rx="1"/>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="6" height="12" fill="#6a6060" rx="1"/>
        <rect x="${cx+w/2-6}" y="${cy-h/2}" width="6" height="12" fill="#6a6060" rx="1"/>
        <rect x="${cx-w/2}" y="${cy+h/2-12}" width="6" height="12" fill="#6a6060" rx="1"/>
        <rect x="${cx+w/2-6}" y="${cy+h/2-12}" width="6" height="12" fill="#6a6060" rx="1"/>
        <polygon points="${cx-w/2-4},${cy-h/2} ${cx+w/2+4},${cy-h/2} ${cx+w/2},${cy-h/2-18} ${cx-w/2},${cy-h/2-18}" fill="#6a5030"/>
        <polygon points="${cx-w/2},${cy-h/2-18} ${cx+w/2},${cy-h/2-18} ${cx},${cy-h/2-30}" fill="#8a6840"/>
        <rect x="${cx-w/2+8}" y="${cy-h/2+10}" width="14" height="10" fill="#1a2030" rx="1"/>
        <line x1="${cx-w/2+11}" y1="${cy-h/2+10}" x2="${cx-w/2+11}" y2="${cy-h/2+20}" stroke="#6a6060" stroke-width="1.5"/>
        <line x1="${cx-w/2+15}" y1="${cy-h/2+10}" x2="${cx-w/2+15}" y2="${cy-h/2+20}" stroke="#6a6060" stroke-width="1.5"/>
        <rect x="${cx-8}" y="${cy+h/2-22}" width="16" height="22" fill="#4a3010" rx="1"/>
        <rect x="${cx-6}" y="${cy+h/2-14}" width="6" height="5" fill="#8a7030" rx="1"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="32" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 6) {
      const w=62, h=48;
      let bricks = '';
      const bw=10, bh=6;
      for (let row=0; row<=Math.ceil(h/bh); row++) {
        const off = (row%2===0)?0:bw/2;
        for (let col=-1; col<=Math.ceil(w/bw); col++) {
          const bx = cx-w/2+col*bw+off;
          const by = cy-h/2+row*bh;
          const shade = ((row+col)%3===0)?'#7a5040':((row+col)%3===1)?'#6a4030':'#804030';
          bricks += `<rect x="${bx+0.5}" y="${by+0.5}" width="${bw-1}" height="${bh-1}" fill="${shade}" rx="0.5"/>`;
        }
      }
      out = `<g ${sf}>
        <clipPath id="storeClip6"><rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" rx="1"/></clipPath>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#6a4030" rx="1"/>
        <g clip-path="url(#storeClip6)">${bricks}</g>
        <rect x="${cx-w/2-4}" y="${cy-h/2-8}" width="${w+8}" height="10" fill="#5a5050" rx="1"/>
        <rect x="${cx-12}" y="${cy+h/2-24}" width="24" height="24" fill="#4a4040" rx="1"/>
        <line x1="${cx-12}" y1="${cy+h/2-18}" x2="${cx+12}" y2="${cy+h/2-18}" stroke="#3a3030" stroke-width="1.5"/>
        <line x1="${cx-12}" y1="${cy+h/2-12}" x2="${cx+12}" y2="${cy+h/2-12}" stroke="#3a3030" stroke-width="1.5"/>
        <line x1="${cx-12}" y1="${cy+h/2-6}"  x2="${cx+12}" y2="${cy+h/2-6}"  stroke="#3a3030" stroke-width="1.5"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="36" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 7) {
      const w=64, h=50;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#505060" rx="2"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+h*0.4}" x2="${cx+w/2}" y2="${cy-h/2+h*0.4}" stroke="#404050" stroke-width="2"/>
        <line x1="${cx-14}" y1="${cy-h/2}" x2="${cx-14}" y2="${cy+h/2}" stroke="#404050" stroke-width="1.5"/>
        <line x1="${cx+14}" y1="${cy-h/2}" x2="${cx+14}" y2="${cy+h/2}" stroke="#404050" stroke-width="1.5"/>
        <rect x="${cx-w/2-4}" y="${cy-h/2-8}" width="${w+8}" height="10" fill="#404050" rx="1"/>
        <rect x="${cx-10}" y="${cy-h/2-16}" width="20" height="10" fill="#3a3a4a" rx="1"/>
        <line x1="${cx-8}" y1="${cy-h/2-14}" x2="${cx+8}" y2="${cy-h/2-14}" stroke="#505060" stroke-width="2"/>
        <rect x="${cx-12}" y="${cy+h/2-28}" width="24" height="28" fill="#3a3a4a" rx="2"/>
        <circle cx="${cx}" cy="${cy+h/2-16}" r="8" fill="#4a4a5a" stroke="#606070" stroke-width="2"/>
        <line x1="${cx}" y1="${cy+h/2-24}" x2="${cx}" y2="${cy+h/2-8}"  stroke="#808090" stroke-width="2"/>
        <line x1="${cx-8}" y1="${cy+h/2-16}" x2="${cx+8}" y2="${cy+h/2-16}" stroke="#808090" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="36" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 8) {
      const w=72, h=54;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#484858" rx="2"/>
        <rect x="${cx-w/2-4}" y="${cy-h/2-10}" width="${w+8}" height="12" fill="#383848" rx="1"/>
        <line x1="${cx-24}" y1="${cy-h/2}" x2="${cx-24}" y2="${cy+h/2}" stroke="#383848" stroke-width="2"/>
        <line x1="${cx+10}" y1="${cy-h/2}" x2="${cx+10}" y2="${cy+h/2}" stroke="#383848" stroke-width="2"/>
        <rect x="${cx-8}" y="${cy+h/2-18}" width="18" height="18" fill="#2a2a38" rx="1"/>
        <rect x="${cx-8}" y="${cy+h/2-14}" width="18" height="2"  fill="#383848"/>
        <rect x="${cx-8}" y="${cy+h/2-10}" width="18" height="2"  fill="#383848"/>
        <rect x="${cx-8}" y="${cy+h/2-6}"  width="18" height="2"  fill="#383848"/>
        <rect x="${cx-w/2+6}" y="${cy-h/2+8}" width="16" height="12" fill="#1a2838" rx="1" stroke="#606070" stroke-width="1.5"/>
        <line x1="${cx-w/2+14}" y1="${cy-h/2+8}" x2="${cx-w/2+14}" y2="${cy-h/2+20}" stroke="#505060" stroke-width="1"/>
        <rect x="${cx+w/2+2}" y="${cy-4}" width="10" height="8" fill="#8a6830" rx="1"/>
        <rect x="${cx+w/2+2}" y="${cy-12}" width="10" height="8" fill="#7a5a28" rx="1"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="40" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 9) {
      const w=74, h=56;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#5a5a5a" rx="2"/>
        <line x1="${cx-w/2-2}" y1="${cy-h/2-4}" x2="${cx-w/2+10}" y2="${cy+h/2+4}" stroke="#4a4a4a" stroke-width="6"/>
        <line x1="${cx+w/2-8}" y1="${cy-h/2-4}" x2="${cx+w/2+4}" y2="${cy+h/2+4}" stroke="#4a4a4a" stroke-width="6"/>
        <rect x="${cx-w/2-6}" y="${cy-h/2-10}" width="${w+12}" height="12" fill="#4a4a4a" rx="1"/>
        <rect x="${cx-16}" y="${cy+h/2-32}" width="32" height="32" fill="#3a3a3a" rx="2"/>
        <rect x="${cx-14}" y="${cy+h/2-30}" width="28" height="28" fill="#424242" stroke="#4a4a4a" stroke-width="1.5" rx="1"/>
        <circle cx="${cx}" cy="${cy+h/2-16}" r="10" fill="#3a3a3a" stroke="#606060" stroke-width="2.5"/>
        <line x1="${cx}" y1="${cy+h/2-26}" x2="${cx}" y2="${cy+h/2-6}"  stroke="#707070" stroke-width="2"/>
        <line x1="${cx-10}" y1="${cy+h/2-16}" x2="${cx+10}" y2="${cy+h/2-16}" stroke="#707070" stroke-width="2"/>
        <line x1="${cx-7}" y1="${cy+h/2-23}" x2="${cx+7}" y2="${cy+h/2-9}" stroke="#707070" stroke-width="1.5"/>
        <line x1="${cx+7}" y1="${cy+h/2-23}" x2="${cx-7}" y2="${cy+h/2-9}" stroke="#707070" stroke-width="1.5"/>
        <rect x="${cx-w/2+6}" y="${cy-h/2+6}" width="18" height="10" fill="#383838" rx="1"/>
        <line x1="${cx-w/2+8}"  y1="${cy-h/2+6}" x2="${cx-w/2+8}"  y2="${cy-h/2+16}" stroke="#4a4a4a" stroke-width="2"/>
        <line x1="${cx-w/2+12}" y1="${cy-h/2+6}" x2="${cx-w/2+12}" y2="${cy-h/2+16}" stroke="#4a4a4a" stroke-width="2"/>
        <line x1="${cx-w/2+16}" y1="${cy-h/2+6}" x2="${cx-w/2+16}" y2="${cy-h/2+16}" stroke="#4a4a4a" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="42" ry="4" fill="rgba(0,0,0,0.25)"/>
      </g>`;
    } else {
      // lv 10 — Apocalypse warehouse
      const w=80, h=60;
      const gE = 'filter="url(#glow-electric)"';
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#3a3a4a" rx="2"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+h*0.35}" x2="${cx+w/2}" y2="${cy-h/2+h*0.35}" stroke="#2a2a3a" stroke-width="2"/>
        <line x1="${cx-28}" y1="${cy-h/2}" x2="${cx-28}" y2="${cy+h/2}" stroke="#2a2a3a" stroke-width="1.5"/>
        <line x1="${cx+8}"  y1="${cy-h/2}" x2="${cx+8}"  y2="${cy+h/2}" stroke="#2a2a3a" stroke-width="1.5"/>
        <rect x="${cx-w/2-6}" y="${cy-h/2-10}" width="${w+12}" height="12" fill="#2a2a3a" rx="1"/>
        <rect x="${cx-w/2+2}" y="${cy-h/2-8}" width="${w-4}" height="11" fill="#08080e" rx="1" stroke="#ffd600" stroke-width="1" ${gE}/>
        <text x="${cx}" y="${cy-h/2+1}"
          font-family="Press Start 2P" font-size="16"
          fill="#ffd600" text-anchor="middle" ${gE}>APOCALYPSE STORE</text>
        <rect x="${cx-w/2+4}" y="${cy+h/2-26}" width="20" height="26" fill="#2a2a38" rx="1" stroke="#ffd600" stroke-width="1" ${gE}/>
        <rect x="${cx+4}"     y="${cy+h/2-26}" width="20" height="26" fill="#2a2a38" rx="1" stroke="#ffd600" stroke-width="1" ${gE}/>
        <line x1="${cx-w/2+4}" y1="${cy+h/2-18}" x2="${cx-w/2+24}" y2="${cy+h/2-18}" stroke="#3a3a48" stroke-width="1.5"/>
        <line x1="${cx-w/2+4}" y1="${cy+h/2-10}" x2="${cx-w/2+24}" y2="${cy+h/2-10}" stroke="#3a3a48" stroke-width="1.5"/>
        <line x1="${cx+4}" y1="${cy+h/2-18}" x2="${cx+24}" y2="${cy+h/2-18}" stroke="#3a3a48" stroke-width="1.5"/>
        <line x1="${cx+4}" y1="${cy+h/2-10}" x2="${cx+24}" y2="${cy+h/2-10}" stroke="#3a3a48" stroke-width="1.5"/>
        <rect x="${cx+w/2-18}" y="${cy-6}" width="14" height="8" fill="#ffd600" rx="1" opacity="0.8" ${gE}/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="44" ry="4" fill="rgba(0,0,0,0.25)"/>
      </g>`;
    }

    return `<g>
      ${out}
      <text x="${cx}" y="${cy+52}"
        font-family="Press Start 2P" font-size="20"
        fill="${labelCol}" text-anchor="middle">Lv${lv} STORAGE [${capLabels[lv-1]}]</text>
    </g>`;
  },

};
