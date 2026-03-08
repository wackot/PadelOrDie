// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/BaseLights.js
// Standalone Base Lighting building.
// Lv1-10 places physical light fixtures at
// different positions across the base map.
// Night glow spheres drawn on GroundCanvas.
// ═══════════════════════════════════════════

const BuildingBaseLights = {

  id: 'baselights', title: 'Base Lighting', action: 'baselights',
  hitW: 50, hitH: 50,

  // ── Fixture positions per level ─────────────────────────────────────────
  // cx/cy = world centre (750,750), fw/fh = fence interior (1380)
  // Returns array of {x, y, type} for all fixtures at a given level
  getFixtures(hLvl, cx, cy, fw, fh) {
    const hw = fw / 2, hh = fh / 2;
    const all = [];

    // Lv1 — 2 gate torches at entrance
    all.push({ x: cx - 55, y: cy + hh * 0.88, type: 'torch', minLv: 1 });
    all.push({ x: cx + 55, y: cy + hh * 0.88, type: 'torch', minLv: 1 });

    // Lv2 — 2 more path lanterns
    all.push({ x: cx - 25, y: cy + hh * 0.62, type: 'lantern', minLv: 2 });
    all.push({ x: cx + 25, y: cy + hh * 0.62, type: 'lantern', minLv: 2 });

    // Lv3 — 2 pole lamps beside path
    all.push({ x: cx - hw * 0.18, y: cy + hh * 0.40, type: 'pole', minLv: 3 });
    all.push({ x: cx + hw * 0.18, y: cy + hh * 0.40, type: 'pole', minLv: 3 });

    // Lv4 — 2 fence corner torches
    all.push({ x: cx - hw * 0.72, y: cy + hh * 0.72, type: 'torch', minLv: 4 });
    all.push({ x: cx + hw * 0.72, y: cy + hh * 0.72, type: 'torch', minLv: 4 });

    // Lv5 — 2 wall lamps near buildings
    all.push({ x: cx - hw * 0.55, y: cy - hh * 0.05, type: 'wall', minLv: 5 });
    all.push({ x: cx + hw * 0.55, y: cy - hh * 0.05, type: 'wall', minLv: 5 });

    // Lv6 — 2 floodlights upper corners
    all.push({ x: cx - hw * 0.72, y: cy - hh * 0.55, type: 'flood', minLv: 6 });
    all.push({ x: cx + hw * 0.72, y: cy - hh * 0.55, type: 'flood', minLv: 6 });

    // Lv7 — 2 high-mast upper sides
    all.push({ x: cx - hw * 0.72, y: cy + hh * 0.25, type: 'mast', minLv: 7 });
    all.push({ x: cx + hw * 0.72, y: cy + hh * 0.25, type: 'mast', minLv: 7 });

    // Lv8 — 2 stadium lights upper centre
    all.push({ x: cx - hw * 0.20, y: cy - hh * 0.72, type: 'stadium', minLv: 8 });
    all.push({ x: cx + hw * 0.20, y: cy - hh * 0.72, type: 'stadium', minLv: 8 });

    // Lv9 — 2 arc lamps mid centre
    all.push({ x: cx - hw * 0.38, y: cy - hh * 0.35, type: 'arc', minLv: 9 });
    all.push({ x: cx + hw * 0.38, y: cy - hh * 0.35, type: 'arc', minLv: 9 });

    // Lv10 — 2 grand solar arc towers
    all.push({ x: cx - hw * 0.55, y: cy - hh * 0.70, type: 'solar', minLv: 10 });
    all.push({ x: cx + hw * 0.55, y: cy - hh * 0.70, type: 'solar', minLv: 10 });

    return all.filter(f => f.minLv <= hLvl);
  },

  // ── SVG for a single fixture ────────────────────────────────────────────
  fixtureSVG(x, y, type, lit) {
    // Unlit: visible dim warm grey so fixtures are always seen when built
    const col  = lit ? '#ffd060' : '#5a5040';
    const glow = lit ? 'filter="url(#glow-yellow)"' : '';
    const gloW = lit ? 'filter="url(#glow-yellow)"' : '';

    if (type === 'torch') {
      return `<g>
        <rect x="${x-2}" y="${y-20}" width="4" height="20" fill="#5a3a18" rx="1"/>
        <circle cx="${x}" cy="${y-22}" r="5" fill="${col}" ${glow}/>
        ${lit ? `<circle cx="${x}" cy="${y-22}" r="3" fill="#fff8c0" opacity="0.9"/>` : ''}
      </g>`;
    }
    if (type === 'lantern') {
      return `<g>
        <rect x="${x-2}" y="${y-28}" width="4" height="24" fill="#6a5a30" rx="1"/>
        <rect x="${x-6}" y="${y-32}" width="12" height="10" fill="${lit?'#ffd060':'#2a2a3a'}" rx="2" ${glow}/>
        <rect x="${x-4}" y="${y-30}" width="8" height="6" fill="${lit?'#fff8c0':'#1a1a28'}" rx="1" opacity="${lit?0.9:1}"/>
      </g>`;
    }
    if (type === 'pole') {
      return `<g>
        <rect x="${x-2}" y="${y-40}" width="4" height="40" fill="#4a4a5a" rx="1"/>
        <rect x="${x-8}" y="${y-46}" width="16" height="8" fill="${col}" rx="2" ${glow}/>
        ${lit ? `<rect x="${x-6}" y="${y-44}" width="12" height="4" fill="#fff8c0" rx="1" opacity="0.85"/>` : ''}
      </g>`;
    }
    if (type === 'wall') {
      return `<g>
        <rect x="${x-4}" y="${y-8}" width="8" height="8" fill="#3a3a4a" rx="1"/>
        <rect x="${x-8}" y="${y-14}" width="16" height="8" fill="${col}" rx="2" ${glow}/>
        ${lit ? `<rect x="${x-6}" y="${y-12}" width="12" height="4" fill="#fff8c0" rx="1" opacity="0.85"/>` : ''}
      </g>`;
    }
    if (type === 'flood') {
      return `<g>
        <rect x="${x-2}" y="${y-32}" width="4" height="32" fill="#4a4a5a" rx="1"/>
        <rect x="${x-12}" y="${y-38}" width="24" height="10" fill="${col}" rx="2" ${glow}/>
        <rect x="${x-14}" y="${y-36}" width="28" height="6" fill="${lit?'rgba(255,240,120,0.4)':'none'}" rx="1"/>
      </g>`;
    }
    if (type === 'mast') {
      return `<g>
        <rect x="${x-3}" y="${y-52}" width="6" height="52" fill="#5a5a6a" rx="1"/>
        <rect x="${x-14}" y="${y-58}" width="28" height="10" fill="${col}" rx="2" ${glow}/>
        ${lit ? `<rect x="${x-12}" y="${y-56}" width="24" height="6" fill="#fff8c0" rx="1" opacity="0.8"/>` : ''}
      </g>`;
    }
    if (type === 'stadium') {
      return `<g>
        <rect x="${x-3}" y="${y-58}" width="6" height="58" fill="#4a4a5a" rx="1"/>
        <rect x="${x-18}" y="${y-66}" width="36" height="12" fill="${col}" rx="2" ${glow}/>
        ${lit ? `<rect x="${x-16}" y="${y-64}" width="32" height="8" fill="#fff8e0" rx="1" opacity="0.85"/>` : ''}
        <line x1="${x-10}" y1="${y-58}" x2="${x-18}" y2="${y-66}" stroke="#5a5a6a" stroke-width="2"/>
        <line x1="${x+10}" y1="${y-58}" x2="${x+18}" y2="${y-66}" stroke="#5a5a6a" stroke-width="2"/>
      </g>`;
    }
    if (type === 'arc') {
      return `<g>
        <rect x="${x-3}" y="${y-60}" width="6" height="60" fill="#6a6a7a" rx="1"/>
        <circle cx="${x}" cy="${y-62}" r="10" fill="${col}" ${glow}/>
        ${lit ? `<circle cx="${x}" cy="${y-62}" r="6" fill="#ffffff" opacity="0.9"/>` : ''}
      </g>`;
    }
    if (type === 'solar') {
      return `<g>
        <rect x="${x-3}" y="${y-70}" width="6" height="70" fill="#5a7a5a" rx="1"/>
        <rect x="${x-16}" y="${y-78}" width="32" height="12" fill="${lit?'#ffd060':'#2a4a2a'}" rx="2" ${glow}/>
        <rect x="${x-14}" y="${y-76}" width="28" height="3" fill="${lit?'#fff8c0':'#1a3a1a'}" rx="1"/>
        <rect x="${x-14}" y="${y-71}" width="28" height="3" fill="${lit?'#fff8c0':'#1a3a1a'}" rx="1"/>
        ${lit ? `<circle cx="${x}" cy="${y-62}" r="5" fill="#ffd060" opacity="0.5" ${glow}/>` : ''}
      </g>`;
    }
    return '';
  },

  // ── Render all fixtures as SVG ─────────────────────────────────────────
  svg(blLvl, cx, cy, fw, fh, lit) {
    if (blLvl < 1) return '';
    const fixtures = this.getFixtures(blLvl, cx, cy, fw, fh);
    return fixtures.map(f => this.fixtureSVG(f.x, f.y, f.type, lit)).join('');
  },

  // ── Canvas glow pools under lit fixtures ───────────────────────────────
  drawGlowPools(ctx, blLvl, cx, cy, fw, fh) {
    if (blLvl < 1) return;
    const fixtures = this.getFixtures(blLvl, cx, cy, fw, fh);

    // Glow radius scales significantly with fixture type AND level
    const baseRadii = { torch:50, lantern:70, pole:90, wall:80, flood:120, mast:160, stadium:200, arc:260, solar:320 };
    const lvMult    = 0.7 + blLvl * 0.08;  // Lv1=0.78x, Lv10=1.5x

    fixtures.forEach(f => {
      const r = (baseRadii[f.type] || 70) * lvMult;

      // High-level lights wash out nearly to daylight (warm white centre)
      const isHighLevel = blLvl >= 7;
      const innerCol  = isHighLevel ? 'rgba(255,250,220,0.80)' : 'rgba(255,230,100,0.55)';
      const midCol    = isHighLevel ? 'rgba(255,240,160,0.45)' : 'rgba(255,220,80,0.28)';
      const outerCol  = isHighLevel ? 'rgba(255,235,140,0.18)' : 'rgba(255,220,60,0.08)';

      const grd = ctx.createRadialGradient(f.x, f.y - 10, 0, f.x, f.y, r);
      grd.addColorStop(0,   innerCol);
      grd.addColorStop(0.3, midCol);
      grd.addColorStop(0.7, outerCol);
      grd.addColorStop(1,   'rgba(255,220,80,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.fill();

      // Extra "hot centre" for high-level lights (stadium+ looks almost daylit)
      if (blLvl >= 6) {
        const hotR = r * 0.25;
        const hot  = ctx.createRadialGradient(f.x, f.y - 8, 0, f.x, f.y, hotR);
        hot.addColorStop(0, `rgba(255,255,240,${0.3 + (blLvl-6)*0.08})`);
        hot.addColorStop(1, 'rgba(255,255,240,0)');
        ctx.fillStyle = hot;
        ctx.beginPath();
        ctx.arc(f.x, f.y, hotR, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  },

  // ── Building screen data ───────────────────────────────────────────────
  getScreenData(s) {
    const lv      = s.base.buildings.baselights?.level || 0;
    const on      = s.power?.consumers?.lights;
    const pwr     = typeof Power !== 'undefined';
    const upg     = typeof BuildingUpgrades !== 'undefined' ? BuildingUpgrades.baselights : null;
    const drainW  = upg?.levels?.[lv - 1]?.drainW || s.power?._lightsDrainW || 0;
    const fixtures = lv > 0 ? this.getFixtures(lv, 750, 750, 1380, 1380).length : 0;

    const visual = `<div style="font-size:2.8em;text-align:center;padding:16px 12px 8px">
      ${lv === 0 ? '🔦' : lv < 4 ? '🕯️' : lv < 7 ? '💡' : '🔆'}
    </div>`;

    const statsRows = lv === 0
      ? `<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>`
      : `<div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
         <div class="bsc-row ok"><span>Fixtures installed</span><span>${fixtures}</span></div>
         <div class="bsc-row"><span>Power draw</span><span>${drainW}W/hr</span></div>
         <div class="bsc-row ${on ? 'ok' : ''}"><span>Status</span><span>${on ? '💡 ON — lighting base' : '⚫ OFF'}</span></div>`;

    const actionBtn = lv > 0 && pwr
      ? `<button class="btn-pixel ${on ? 'btn-secondary' : 'btn-primary'}" onclick="Power.toggleConsumer('lights');Base.renderBuildingScreen('baselights')">
           ${on ? '⚫ TURN OFF' : '💡 TURN ON'}
         </button>` : '';
    return { title: '💡 BASE LIGHTING', visual, statsRows, actionBtn };
  },
};
