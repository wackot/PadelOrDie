// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/SceneryCanvas.js
// Draws the world AROUND the base fence:
// dense forest, ruins, mountains, roads.
// Canvas is 2200×2200, base fence is centred
// at (1450,1450) within it (350px offset each side).
// ═══════════════════════════════════════════

const SceneryCanvas = {

  // Offset so the 1500×1500 base lines up in the middle of our 2200×2200 canvas
  BASE_OFF: 350,

  draw() {
    const canvas = document.getElementById('scenery-canvas');
    if (!canvas || typeof canvas.getContext !== 'function') return;
    const SW = 2200, SH = 2200;
    canvas.width  = SW;
    canvas.height = SH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const hLvl = Math.max(1, Math.min(10, State.data?.base?.buildings?.house?.level || 1));
    const off  = this.BASE_OFF;  // offset to reach base-canvas origin

    // ── Noise helpers (seeded) ────────────────
    const noise  = (x, y) => { let n = Math.sin(x*127.1+y*311.7)*43758.5453; return n-Math.floor(n); };
    const noise2 = (x, y) => { let n = Math.sin(x*93.4+y*217.3)*31415.926;   return n-Math.floor(n); };

    // ── 1. Far background — dark foreboding sky/ground ───────────────────
    const bgGrad = ctx.createRadialGradient(SW/2, SH/2, 200, SW/2, SH/2, SW*0.8);
    bgGrad.addColorStop(0, '#1a2a0a');
    bgGrad.addColorStop(0.5, '#111a06');
    bgGrad.addColorStop(1, '#080e04');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, SW, SH);

    // ── 2. Distant mountains (silhouette, very far back) ─────────────────
    this._drawMountains(ctx, SW, SH);

    // ── 3. Dense forest — fills all area outside the base fence ──────────
    this._drawForest(ctx, SW, SH, off, hLvl, noise, noise2);

    // ── 4. Abandoned road leading to base gate ────────────────────────────
    this._drawAbandonedRoad(ctx, SW, SH, off);

    // ── 5. Ruins and wreckage scattered in forest ─────────────────────────
    this._drawRuins(ctx, SW, SH, off, hLvl, noise);

    // ── 6. Border vignette — darkens extreme edges ────────────────────────
    const vignette = ctx.createRadialGradient(SW/2, SH/2, SW*0.3, SW/2, SH/2, SW*0.75);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.65)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, SW, SH);
  },

  _drawMountains(ctx, SW, SH) {
    // Far mountains — left and right skyline
    const peaks = [
      { x: 100,  h: 320, w: 280 },
      { x: 320,  h: 240, w: 200 },
      { x: 500,  h: 290, w: 220 },
      { x: 750,  h: 200, w: 180 },
      { x: 1600, h: 280, w: 260 },
      { x: 1780, h: 350, w: 300 },
      { x: 1950, h: 220, w: 180 },
      { x: 50,   h: 180, w: 160 },
    ];
    peaks.forEach(p => {
      // Snow cap
      const grad = ctx.createLinearGradient(p.x, SH * 0.05, p.x, SH * 0.05 + p.h);
      grad.addColorStop(0, '#2a3520');
      grad.addColorStop(0.4, '#1a2510');
      grad.addColorStop(1, '#111a08');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(p.x - p.w/2, SH * 0.05 + p.h);
      ctx.lineTo(p.x, SH * 0.05);
      ctx.lineTo(p.x + p.w/2, SH * 0.05 + p.h);
      ctx.closePath();
      ctx.fill();
      // Slight highlight edge
      ctx.strokeStyle = 'rgba(80,100,60,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  },

  _drawForest(ctx, SW, SH, off, hLvl, noise, noise2) {
    // The base fence occupies off..off+1500 in both axes
    const fL = off, fR = off + 1500, fT = off, fB = off + 1500;

    // Ground cover colour for the forest floor
    const forestFloor = ['#0c1506','#0e1808','#101a08','#101808'];

    // Paint forest floor across entire canvas, skip base rect
    const T = 20;
    for (let y = 0; y < SH; y += T) {
      for (let x = 0; x < SW; x += T) {
        // Skip the base area
        if (x >= fL - T && x <= fR && y >= fT - T && y <= fB) continue;
        const n = noise(x/T + 3, y/T + 3);
        ctx.fillStyle = forestFloor[Math.floor(n * forestFloor.length)];
        ctx.fillRect(x, y, T, T);
        // Leaf litter
        if (noise2(x/T + 0.5, y/T + 0.5) < 0.15) {
          ctx.fillStyle = 'rgba(20,35,8,0.6)';
          ctx.fillRect(x + 2, y + 2, T - 4, T - 4);
        }
      }
    }

    // Tree clusters — dense rings around the base
    const treeZones = [];
    const rings = 3;
    const treesPerRing = [60, 80, 100];
    for (let r = 0; r < rings; r++) {
      const radiusMin = 800 + r * 180;
      const radiusMax = radiusMin + 200;
      for (let i = 0; i < treesPerRing[r]; i++) {
        const angle = (i / treesPerRing[r]) * Math.PI * 2 + r * 0.3;
        const radius = radiusMin + noise(i * 3.7 + r * 11, r * 5.1) * (radiusMax - radiusMin);
        const tx = SW / 2 + Math.cos(angle) * radius;
        const ty = SH / 2 + Math.sin(angle) * radius * 0.9;
        // Don't draw trees too close to base fence
        const dx = tx - (fL + 750), dy = ty - (fT + 750);
        if (Math.abs(dx) < 820 && Math.abs(dy) < 820) continue;
        treeZones.push({ x: tx, y: ty, s: 0.7 + noise(i * 1.3, r * 7.3) * 0.6 });
      }
    }
    // Extra dense forest in corners
    for (let i = 0; i < 120; i++) {
      const n1 = noise(i * 4.1, 88.4);
      const n2 = noise(i * 2.7, 33.1);
      // Place in corners only
      const cx2 = n1 < 0.5 ? n1 * 600 : SW - n1 * 600;
      const cy2 = n2 < 0.5 ? n2 * 600 : SH - n2 * 600;
      treeZones.push({ x: cx2, y: cy2, s: 0.8 + n1 * 0.5 });
    }

    // Sort by y for painter's algorithm
    treeZones.sort((a, b) => a.y - b.y);
    treeZones.forEach(t => this._drawTree(ctx, t.x, t.y, t.s, noise));
  },

  _drawTree(ctx, x, y, scale, noise) {
    const h = (55 + noise(x * 0.01, y * 0.01) * 30) * scale;
    const w = (28 + noise(x * 0.02, y * 0.02) * 14) * scale;
    // Trunk
    ctx.fillStyle = '#2a1e0e';
    ctx.fillRect(x - 3 * scale, y - h * 0.3, 6 * scale, h * 0.35);
    // Canopy layers
    const canopyCols = ['#1a3a0a','#1e4010','#163208','#20440e','#122e06'];
    const col = canopyCols[Math.floor(noise(x * 0.03, y * 0.03) * canopyCols.length)];
    ctx.fillStyle = col;
    // Bottom layer
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.35, w, h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    // Mid layer
    ctx.fillStyle = '#1a3808';
    ctx.beginPath();
    ctx.ellipse(x, y - h * 0.58, w * 0.75, h * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    // Top spike
    ctx.fillStyle = '#142e06';
    ctx.beginPath();
    ctx.moveTo(x - w * 0.3, y - h * 0.65);
    ctx.lineTo(x, y - h);
    ctx.lineTo(x + w * 0.3, y - h * 0.65);
    ctx.closePath();
    ctx.fill();
  },

  _drawAbandonedRoad(ctx, SW, SH, off) {
    // Road comes from the south (bottom), leads to the base gate at centre-bottom
    const gateCX = SW / 2;
    const gateY  = off + 1500;  // bottom fence edge
    const roadW  = 55;

    // Broken tarmac colour
    const roadGrad = ctx.createLinearGradient(gateCX - roadW, SH, gateCX + roadW, SH);
    roadGrad.addColorStop(0, '#1e1c18');
    roadGrad.addColorStop(0.5, '#252320');
    roadGrad.addColorStop(1, '#1e1c18');
    ctx.fillStyle = roadGrad;
    ctx.beginPath();
    ctx.moveTo(gateCX - roadW, SH);
    ctx.lineTo(gateCX - roadW * 0.7, gateY);
    ctx.lineTo(gateCX + roadW * 0.7, gateY);
    ctx.lineTo(gateCX + roadW, SH);
    ctx.closePath();
    ctx.fill();

    // Cracked road markings
    ctx.strokeStyle = 'rgba(80,75,60,0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([18, 24]);
    ctx.beginPath();
    ctx.moveTo(gateCX, SH);
    ctx.lineTo(gateCX, gateY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Broken kerb lines
    ctx.strokeStyle = 'rgba(100,95,80,0.3)';
    ctx.lineWidth = 3;
    [-1, 1].forEach(side => {
      ctx.beginPath();
      ctx.moveTo(gateCX + side * roadW, SH);
      ctx.lineTo(gateCX + side * roadW * 0.7, gateY);
      ctx.stroke();
    });

    // Road cracks
    for (let i = 0; i < 8; i++) {
      const cy2 = gateY + i * ((SH - gateY) / 8) + 20;
      const cx2 = gateCX + (Math.sin(i * 2.3) * 15);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx2 - 8, cy2);
      ctx.lineTo(cx2 + 10, cy2 + 12);
      ctx.lineTo(cx2 + 4, cy2 + 20);
      ctx.stroke();
    }

    // Road shoulder debris
    [[gateCX - roadW - 15, SH - 80], [gateCX + roadW + 10, SH - 140],
     [gateCX - roadW - 25, SH - 200], [gateCX + roadW + 20, SH - 60]].forEach(([rx, ry]) => {
      ctx.fillStyle = '#1a1814';
      ctx.beginPath(); ctx.ellipse(rx, ry, 12, 7, 0.3, 0, Math.PI * 2); ctx.fill();
    });
  },

  _drawRuins(ctx, SW, SH, off, hLvl, noise) {
    // Collapsed buildings and wreckage in the forest
    const ruinSites = [
      { x: off - 200, y: off + 300,  type: 'house'   },
      { x: off - 260, y: off + 900,  type: 'wall'    },
      { x: off + 1700,y: off + 200,  type: 'house'   },
      { x: off + 1650,y: off + 750,  type: 'wall'    },
      { x: off + 300, y: off - 200,  type: 'wall'    },
      { x: off + 1100,y: off - 240,  type: 'house'   },
      { x: off + 500, y: off + 1720, type: 'vehicle' },
      { x: off + 1200,y: off + 1680, type: 'vehicle' },
      { x: off - 220, y: off - 220,  type: 'house'   },
      { x: off + 1700,y: off + 1700, type: 'wall'    },
    ];

    ruinSites.forEach((r, i) => {
      const n = noise(r.x * 0.01, r.y * 0.01);
      if (r.type === 'house')   this._drawRuinHouse(ctx, r.x, r.y, n);
      if (r.type === 'wall')    this._drawRuinWall(ctx, r.x, r.y, n);
      if (r.type === 'vehicle') this._drawAbandonedVehicle(ctx, r.x, r.y, n);
    });
  },

  _drawRuinHouse(ctx, x, y, n) {
    const w = 60 + n * 30, h = 45 + n * 20;
    // Fallen walls
    ctx.fillStyle = '#2a2420';
    ctx.fillRect(x - w/2, y - h/2, w, 8);  // north wall
    ctx.fillRect(x - w/2, y - h/2, 8, h);  // west wall
    ctx.fillStyle = '#222018';
    ctx.fillRect(x + w/2 - 8, y - h/2, 8, h * 0.6);  // partial east
    // Rubble pile
    ctx.fillStyle = '#1e1c18';
    ctx.beginPath(); ctx.ellipse(x, y + 5, w * 0.35, h * 0.25, 0, 0, Math.PI * 2); ctx.fill();
    // Overgrown grass
    ctx.fillStyle = 'rgba(20,50,10,0.5)';
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.4, h * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  },

  _drawRuinWall(ctx, x, y, n) {
    // Crumbling concrete wall section
    const sections = Math.floor(3 + n * 3);
    for (let i = 0; i < sections; i++) {
      const h = 20 + n * 15 + i * 8;
      const wx = x + i * 22 - sections * 11;
      ctx.fillStyle = i % 2 === 0 ? '#2a2820' : '#222018';
      ctx.fillRect(wx, y - h, 18, h);
      // Crack lines
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(wx + 6, y - h);
      ctx.lineTo(wx + 9, y - h * 0.4);
      ctx.stroke();
    }
  },

  _drawAbandonedVehicle(ctx, x, y, n) {
    // Rusted car hulk
    const body = { w: 60, h: 28 };
    ctx.fillStyle = '#2a1a10';  // rusted body
    ctx.fillRect(x - body.w/2, y - body.h/2, body.w, body.h);
    // Windows (smashed)
    ctx.fillStyle = '#1a1a18';
    ctx.fillRect(x - body.w/2 + 8, y - body.h/2 + 4, 18, 12);
    ctx.fillRect(x + 4,             y - body.h/2 + 4, 18, 12);
    // Wheels (flat)
    [[-22, 14], [22, 14], [-22, -14], [22, -14]].forEach(([wx, wy]) => {
      ctx.fillStyle = '#111010';
      ctx.beginPath(); ctx.ellipse(x + wx, y + wy, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    });
    // Rust patches
    ctx.fillStyle = 'rgba(80,30,10,0.5)';
    ctx.beginPath(); ctx.ellipse(x - 10, y - 5, 12, 7, 0.4, 0, Math.PI * 2); ctx.fill();
    // Overgrowth
    ctx.fillStyle = 'rgba(20,50,10,0.55)';
    ctx.beginPath(); ctx.ellipse(x, y + body.h/2, body.w * 0.6, 10, 0, 0, Math.PI * 2); ctx.fill();
  },
};
