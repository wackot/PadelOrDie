// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/Bike.js
// Everything specific to the Bike building:
//   • Registry entry
//   • Map SVG renderer — 10 levels
//   • Building screen visual + stats rows
//   • Navigation handler
// ═══════════════════════════════════════════

const BuildingBike = {

  // ── Registry ──────────────────────────────
  id:     'bike',
  title:  'Your Bike',
  desc:   'Your trusty ride. Upgrade for more cargo and speed.',
  action: 'upgrades',

  hitW: 90,
  hitH: 70,

  // ── Navigation handler ────────────────────
  onOpen(setFn = null) {
    const s   = State.data;
    const bld = s.base.buildings;
    const lv    = bld.bike?.level || 1;
    const carry = 20 + lv * 13;
    const light = s.base.bikeHasLight;
    const nMult = s.base.bikeNightMult || 1.0;
    const eff   = Math.round(((s.base.bikeEfficiency||1)-1)*100);

    const visual = `<svg width="140" height="90" viewBox="0 0 140 90">
      <circle cx="30" cy="65" r="22" fill="none" stroke="#555" stroke-width="5"/>
      <circle cx="110" cy="65" r="22" fill="none" stroke="#555" stroke-width="5"/>
      <circle cx="30" cy="65" r="7" fill="#444"/>
      <circle cx="110" cy="65" r="7" fill="#444"/>
      <line x1="30" y1="65" x2="70" y2="32" stroke="#666" stroke-width="3"/>
      <line x1="70" y1="32" x2="110" y2="65" stroke="#666" stroke-width="3"/>
      <line x1="70" y1="32" x2="70" y2="55" stroke="#666" stroke-width="3"/>
      <ellipse cx="70" cy="57" rx="9" ry="4" fill="#555"/>
      <line x1="58" y1="32" x2="82" y2="32" stroke="#777" stroke-width="4"/>
      <rect x="64" y="22" width="12" height="12" fill="#444" rx="2"/>
      ${light ? '<ellipse cx="22" cy="58" rx="7" ry="5" fill="#ffd600" opacity="0.7"/>' : ''}
    </svg>`;

    const statsRows = `
      <div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
      <div class="bsc-row"><span>Carry capacity</span><span>${carry} items</span></div>
      <div class="bsc-row"><span>Headlight</span><span>${light ? '💡 Mounted' : '🌑 None (unlocks Lv3)'}</span></div>
      <div class="bsc-row"><span>Night loot bonus</span><span>${light ? '×'+nMult.toFixed(1) : 'N/A'}</span></div>
      <div class="bsc-row"><span>Efficiency bonus</span><span>+${eff}%</span></div>`;

    setFn?.('🚴 YOUR BIKE', visual, statsRows);
    return { title: '🚴 YOUR BIKE', visual, statsRows, actionBtn: '' };
  },

  // ── Map SVG renderer ──────────────────────
  svg(cx, cy, level) {
    const lv = Math.max(1, Math.min(10, level || 1));
    const sf = 'filter="url(#shadow)"';
    const gY = 'filter="url(#glow-yellow)"';

    const frameCol = lv >= 9 ? '#4a4a5a'
                   : lv >= 7 ? '#5a5a6a'
                   : lv >= 5 ? '#3a6a3a'
                   : lv >= 3 ? '#3a4a7a'
                   : '#6a4a28';

    const wheelCol  = lv >= 7 ? '#5a5a5a' : '#3a3a3a';
    const spokeCol  = lv >= 5 ? '#707070' : '#505050';
    const hasLight  = lv >= 3;
    const hasBigTrailer = lv >= 7;
    const nightVision = lv >= 8;
    const lightCol  = nightVision ? '#7fffff' : '#ffd600';
    const lightFilt = nightVision ? 'filter="url(#glow-blue)"' : gY;

    let out = `<g ${sf}>`;

    // Trailer
    if (hasBigTrailer) {
      const tw = lv >= 9 ? 36 : 28, th = lv >= 9 ? 20 : 16;
      const tx = cx - 36 - tw/2;
      const col = lv >= 9 ? '#3a3a4a' : '#5a5a6a';
      out += `<rect x="${tx-tw/2}" y="${cy-th/2}" width="${tw}" height="${th}" fill="${col}" rx="2" stroke="#4a4a5a" stroke-width="1.5"/>`;
      if (lv === 10) {
        out += `<text x="${tx}" y="${cy+4}" font-family="Press Start 2P" font-size="14" fill="#ffd600" text-anchor="middle" ${gY}>CARGO</text>`;
      }
      out += `<line x1="${tx+tw/2}" y1="${cy}" x2="${cx-22}" y2="${cy}" stroke="#5a5a5a" stroke-width="2"/>`;
      out += `<circle cx="${tx-tw/2+8}" cy="${cy+th/2+6}" r="6" fill="${wheelCol}" stroke="${spokeCol}" stroke-width="2"/>`;
      out += `<circle cx="${tx+tw/2-8}" cy="${cy+th/2+6}" r="6" fill="${wheelCol}" stroke="${spokeCol}" stroke-width="2"/>`;
    } else if (lv >= 5) {
      out += `<rect x="${cx-46}" y="${cy-8}" width="18" height="14" fill="#5a7a3a" rx="1" stroke="#4a6a2a" stroke-width="1.5"/>`;
      out += `<line x1="${cx-28}" y1="${cy}" x2="${cx-22}" y2="${cy}" stroke="#5a5a5a" stroke-width="2"/>`;
      out += `<circle cx="${cx-42}" cy="${cy+12}" r="5" fill="${wheelCol}" stroke="${spokeCol}" stroke-width="2"/>`;
    }

    // Rear cargo rack / panniers
    if (lv >= 2) {
      const bagCol = lv >= 6 ? '#4a4a5a' : lv >= 4 ? '#5a5a6a' : '#7a5a30';
      out += `<rect x="${cx+6}" y="${cy-10}" width="12" height="16" fill="${bagCol}" rx="1" stroke="#3a3a4a" stroke-width="1"/>`;
      if (lv >= 4) {
        out += `<rect x="${cx+6}" y="${cy+6}" width="12" height="12" fill="${bagCol}" rx="1" stroke="#3a3a4a" stroke-width="1"/>`;
      }
    }

    // Wheels
    const wr = lv >= 7 ? 14 : 12;
    out += `<circle cx="${cx-18}" cy="${cy+14}" r="${wr}" fill="${wheelCol}" stroke="${spokeCol}" stroke-width="2.5"/>`;
    out += `<circle cx="${cx+18}" cy="${cy+14}" r="${wr}" fill="${wheelCol}" stroke="${spokeCol}" stroke-width="2.5"/>`;
    // Spokes
    out += `<line x1="${cx-18}" y1="${cy+2}"  x2="${cx-18}" y2="${cy+26}"  stroke="${spokeCol}" stroke-width="1" opacity="0.6"/>`;
    out += `<line x1="${cx-6}"  y1="${cy+14}" x2="${cx-30}" y2="${cy+14}"  stroke="${spokeCol}" stroke-width="1" opacity="0.6"/>`;
    out += `<line x1="${cx+18}" y1="${cy+2}"  x2="${cx+18}" y2="${cy+26}"  stroke="${spokeCol}" stroke-width="1" opacity="0.6"/>`;
    out += `<line x1="${cx+6}"  y1="${cy+14}" x2="${cx+30}" y2="${cy+14}"  stroke="${spokeCol}" stroke-width="1" opacity="0.6"/>`;

    // Frame tubes
    out += `<line x1="${cx-18}" y1="${cy+14}" x2="${cx}"    y2="${cy-4}"   stroke="${frameCol}" stroke-width="3" stroke-linecap="round"/>`;
    out += `<line x1="${cx-18}" y1="${cy+14}" x2="${cx+4}"  y2="${cy+14}"  stroke="${frameCol}" stroke-width="3" stroke-linecap="round"/>`;
    out += `<line x1="${cx+18}" y1="${cy+14}" x2="${cx}"    y2="${cy-4}"   stroke="${frameCol}" stroke-width="3" stroke-linecap="round"/>`;
    out += `<line x1="${cx}"    y1="${cy-4}"  x2="${cx+4}"  y2="${cy+14}"  stroke="${frameCol}" stroke-width="2.5" stroke-linecap="round"/>`;
    // Seat post + seat
    out += `<line x1="${cx-4}" y1="${cy-4}" x2="${cx-4}" y2="${cy-14}" stroke="${frameCol}" stroke-width="2.5"/>`;
    out += `<rect x="${cx-12}" y="${cy-16}" width="16" height="4" fill="${frameCol}" rx="2"/>`;
    // Handlebars
    out += `<line x1="${cx+12}" y1="${cy-4}"  x2="${cx+12}" y2="${cy-14}" stroke="${frameCol}" stroke-width="2.5"/>`;
    out += `<line x1="${cx+8}"  y1="${cy-14}" x2="${cx+16}" y2="${cy-14}" stroke="${frameCol}" stroke-width="3" stroke-linecap="round"/>`;

    // Headlight
    if (hasLight) {
      const lx = cx + 20;
      out += `<rect x="${lx}" y="${cy-12}" width="8" height="6" fill="${lightCol}" rx="1" ${lightFilt} opacity="0.9"/>`;
      if (nightVision) {
        out += `<polygon points="${lx+8},${cy-12} ${lx+8},${cy-6} ${lx+24},${cy-2} ${lx+24},${cy-16}" fill="${lightCol}" opacity="0.15" ${lightFilt}/>`;
      } else {
        out += `<polygon points="${lx+8},${cy-11} ${lx+8},${cy-7} ${lx+20},${cy-5} ${lx+20},${cy-13}" fill="${lightCol}" opacity="0.2" ${lightFilt}/>`;
      }
    }

    // Pedals
    out += `<circle cx="${cx+4}" cy="${cy+14}" r="4" fill="${frameCol}" stroke="${spokeCol}" stroke-width="1.5"/>`;
    out += `<line x1="${cx}"    y1="${cy+14}" x2="${cx+8}" y2="${cy+22}" stroke="${spokeCol}" stroke-width="2" stroke-linecap="round"/>`;
    out += `<line x1="${cx+8}" y1="${cy+14}" x2="${cx}"   y2="${cy+22}" stroke="${spokeCol}" stroke-width="2" stroke-linecap="round"/>`;

    out += `</g>`;

    const bikeLabels = ['BASIC BIKE','PANNIERS','HEADLIGHT','CARGO RACK','TRAILER','FULL CARGO','HEAVY HAUL','NIGHT VIS.','ARMOURED','MIL BEAST'];
    const labelCol   = lv >= 8 ? '#7fffff' : lv >= 5 ? '#80c070' : lv >= 3 ? '#8090c0' : '#9a9a60';

    return `<g>
      ${out}
      <text x="${cx}" y="${cy+52}"
        font-family="Press Start 2P" font-size="20"
        fill="${labelCol}" text-anchor="middle">Lv${lv} ${bikeLabels[lv-1]}</text>
    </g>`;
  },

};
