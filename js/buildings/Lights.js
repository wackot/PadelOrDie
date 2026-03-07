// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/Lights.js
// Base lighting system: lamp posts that unlock
// progressively as shelter upgrades (lv2-10).
// When lights consumer is ON+powered, they glow.
// ═══════════════════════════════════════════

const BuildingLights = {

  // Returns array of lamp positions for a given house level + world dimensions
  // cx/cy = world centre, fw/fh = fence interior width/height
  getLampPositions(hLvl, cx, cy, fw, fh) {
    const lamps = [];
    const hw = fw / 2, hh = fh / 2;

    // Lv2 — 2 gate lamps (either side of entrance at bottom centre)
    if (hLvl >= 2) {
      lamps.push({ x: cx - 40, y: cy + hh * 0.85, id:'gl' });
      lamps.push({ x: cx + 40, y: cy + hh * 0.85, id:'gr' });
    }
    // Lv3 — 2 path lamps along front path
    if (hLvl >= 3) {
      lamps.push({ x: cx - 20, y: cy + hh * 0.55, id:'p1' });
      lamps.push({ x: cx + 20, y: cy + hh * 0.55, id:'p2' });
    }
    // Lv5 — 2 corner lamps (front corners)
    if (hLvl >= 5) {
      lamps.push({ x: cx - hw * 0.75, y: cy + hh * 0.65, id:'cl' });
      lamps.push({ x: cx + hw * 0.75, y: cy + hh * 0.65, id:'cr' });
    }
    // Lv6 — 2 yard lamps (mid sides)
    if (hLvl >= 6) {
      lamps.push({ x: cx - hw * 0.80, y: cy,              id:'sl' });
      lamps.push({ x: cx + hw * 0.80, y: cy,              id:'sr' });
    }
    // Lv7 — 2 upper corner lamps
    if (hLvl >= 7) {
      lamps.push({ x: cx - hw * 0.75, y: cy - hh * 0.60, id:'ul' });
      lamps.push({ x: cx + hw * 0.75, y: cy - hh * 0.60, id:'ur' });
    }
    // Lv8 — 2 rear lamps
    if (hLvl >= 8) {
      lamps.push({ x: cx - 40, y: cy - hh * 0.80, id:'rl' });
      lamps.push({ x: cx + 40, y: cy - hh * 0.80, id:'rr' });
    }
    // Lv9 — 4 inner courtyard lamps
    if (hLvl >= 9) {
      lamps.push({ x: cx - hw * 0.35, y: cy + hh * 0.20, id:'il' });
      lamps.push({ x: cx + hw * 0.35, y: cy + hh * 0.20, id:'ir' });
      lamps.push({ x: cx - hw * 0.35, y: cy - hh * 0.20, id:'ilu' });
      lamps.push({ x: cx + hw * 0.35, y: cy - hh * 0.20, id:'iru' });
    }
    // Lv10 — 2 grand entrance pillars
    if (hLvl >= 10) {
      lamps.push({ x: cx - 80, y: cy + hh * 0.90, id:'ep1' });
      lamps.push({ x: cx + 80, y: cy + hh * 0.90, id:'ep2' });
    }
    return lamps;
  },

  // SVG lamp post element. lit=true when powered at night
  lampSVG(x, y, lit, grand = false) {
    const postH  = grand ? 60 : 44;
    const headR  = grand ? 8  : 5;
    const postW  = grand ? 4  : 3;
    const postCol = lit ? '#d4c880' : '#5a5a6a';
    const headCol = lit ? '#ffd060' : '#3a3a4a';
    const glowFilter = lit ? 'filter="url(#glow-yellow)"' : '';
    const haloR  = grand ? 48 : 32;
    const halo   = lit
      ? `<circle cx="${x}" cy="${y - postH + headR}" r="${haloR}" fill="rgba(255,220,80,0.13)" ${glowFilter}/>`
      : '';
    return `<g>
      ${halo}
      <rect x="${x - postW/2}" y="${y - postH}" width="${postW}" height="${postH}" fill="${postCol}" rx="1"/>
      <circle cx="${x}" cy="${y - postH + headR}" r="${headR}" fill="${headCol}" ${lit ? glowFilter : ''}/>
      ${lit ? `<circle cx="${x}" cy="${y - postH + headR}" r="${headR - 2}" fill="#fff8c0" opacity="0.8"/>` : ''}
      ${grand ? `<rect x="${x - 10}" y="${y - postH - 4}" width="20" height="6" fill="${postCol}" rx="2"/>` : ''}
    </g>`;
  },

  // Renders all lamps as SVG (called from _buildSVG in base.js)
  svg(hLvl, cx, cy, fw, fh, lit) {
    const lamps = this.getLampPositions(hLvl, cx, cy, fw, fh);
    return lamps.map(l => {
      const grand = l.id.startsWith('ep');
      return this.lampSVG(l.x, l.y, lit, grand);
    }).join('');
  },

  // Canvas glow pools under each lit lamp (called from GroundCanvas)
  drawGlowPools(ctx, hLvl, cx, cy, fw, fh) {
    const lamps = this.getLampPositions(hLvl, cx, cy, fw, fh);
    lamps.forEach(l => {
      const r = l.id.startsWith('ep') ? 55 : 38;
      const grd = ctx.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
      grd.addColorStop(0, 'rgba(255,220,100,0.25)');
      grd.addColorStop(1, 'rgba(255,220,100,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(l.x, l.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
  },
};
