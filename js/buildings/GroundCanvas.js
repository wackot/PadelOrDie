// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/GroundCanvas.js
// Canvas 2D ground painter — draws the base
// terrain layer (grass, paths, garden beds,
// pond, lighting) scaled to house level 1–10
// ═══════════════════════════════════════════

const BuildingGroundCanvas = {

  draw() {
    const canvas = document.getElementById('base-canvas');
    if (!canvas || typeof canvas.getContext !== 'function') return;
    canvas.width  = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 1000, H = 1000;

    const hLvl = Math.max(1, Math.min(10, State.data?.base?.buildings?.house?.level || 1));

    // ── Seeded noise helpers ──────────────────────────────────
    const noise  = (x, y) => { let n = Math.sin(x*127.1+y*311.7)*43758.5453; return n-Math.floor(n); };
    const noise2 = (x, y) => { let n = Math.sin(x*93.4+y*217.3)*31415.926;   return n-Math.floor(n); };

    // ── Base ground colour (gets better per level) ────────────
    const groundPalettes = [
      ['#111a07','#141f08','#0e1806','#121a06'],  // Lv1
      ['#151e09','#182209','#131c07','#162008'],  // Lv2
      ['#1a2a0b','#1e2e0d','#18280a','#1c2c0c'],  // Lv3
      ['#1e2f0e','#223410','#1c2d0c','#20320f'],  // Lv4
      ['#21330f','#253811','#1f300d','#233510'],  // Lv5
      ['#243712','#283c14','#213412','#263a13'],  // Lv6
      ['#273b13','#2b4015','#253913','#294014'],  // Lv7
      ['#2a3f15','#2e4417','#283d14','#2c4216'],  // Lv8
      ['#2d4317','#314818','#2b4116','#2f4618'],  // Lv9
      ['#304618','#35491a','#2e4417','#32471a'],  // Lv10
    ];
    const gPal = groundPalettes[hLvl - 1];
    const T = 24;

    // ── Ground tiles ──────────────────────────────────────────
    for (let y = 0; y < H; y += T) {
      for (let x = 0; x < W; x += T) {
        const n = noise(x/T, y/T);
        ctx.fillStyle = gPal[Math.floor(n * gPal.length)];
        ctx.fillRect(x, y, T, T);
        const mudChance = Math.max(0.01, 0.18 - hLvl * 0.016);
        if (noise(x/T+0.5, y/T+0.3) < mudChance) {
          ctx.fillStyle = hLvl >= 7 ? 'rgba(0,60,0,0.12)' : 'rgba(0,0,0,0.22)';
          ctx.fillRect(x+2, y+2, T-4, T-4);
        }
        const tuftChance = 0.04 + hLvl * 0.012;
        if (noise2(x/T+0.2, y/T+0.8) < tuftChance) {
          ctx.fillStyle = hLvl >= 6 ? '#3a5a18' : '#1e3010';
          ctx.fillRect(x+T*0.3, y+T*0.1, T*0.15, T*0.5);
          ctx.fillRect(x+T*0.55, y+T*0.05, T*0.12, T*0.6);
        }
      }
    }

    // ── Compound interior yard ────────────────────────────────
    const pad = 40;
    const yardW = 920, yardH = 920;
    const yardX = pad, yardY = pad;

    if (hLvl >= 2) {
      const yardFills = [
        null, '#2a1e10', '#2e2214', '#312516', '#3a2e1a',
        '#3e3220', '#444038', '#4a4640', '#52504c', '#5a5854',
      ];
      if (yardFills[hLvl - 1]) {
        const iy = yardX + 60, ix = yardY + 60, iw = yardW - 120, ih = yardH - 120;
        for (let y = ix; y < ix+ih; y += T) {
          for (let x = iy; x < iy+iw; x += T) {
            const n = noise(x/T+10, y/T+10);
            ctx.fillStyle = yardFills[hLvl - 1];
            ctx.fillRect(x, y, T, T);
            if (hLvl >= 8) {
              const jcol = hLvl >= 10 ? '#3a3835' : '#3e3c38';
              if (Math.round(x/T) % 3 === 0) { ctx.fillStyle = jcol; ctx.fillRect(x, y, 1, T); }
              if (Math.round(y/T) % 2 === 0) { ctx.fillStyle = jcol; ctx.fillRect(x, y, T, 1); }
            } else if (hLvl >= 6) {
              if (n < 0.3) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(x+2,y+2,T-4,T-4); }
              if (n > 0.7) { ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x+2,y+2,T-4,T-4); }
            }
          }
        }
      }
    }

    // ── Paths ─────────────────────────────────────────────────
    const cx = 500, cy = 500;
    const pathCols = [
      ['#2a1e0e','#251a0c'], ['#2e2210','#292010'], ['#32260f','#2e2210'],
      ['#36280e','#32260e'], ['#3c2c12','#382a10'], ['#484030','#403a28'],
      ['#504a3a','#484234'], ['#5a5448','#524e42'], ['#686260','#605c58'],
      ['#747068','#6c6860'],
    ];
    const [pc1, pc2] = pathCols[hLvl - 1];
    const pW = hLvl >= 7 ? 52 : hLvl >= 4 ? 44 : 36;

    // Vertical path
    for (let y = 0; y < H; y += T) {
      ctx.fillStyle = noise(55, y/T) < 0.5 ? pc1 : pc2;
      ctx.fillRect(cx - pW/2, y, pW, T);
      if (hLvl >= 6) {
        ctx.fillStyle = hLvl >= 9 ? '#3a3028' : '#302818';
        ctx.fillRect(cx - pW/2, y, 3, T);
        ctx.fillRect(cx + pW/2 - 3, y, 3, T);
      }
    }
    // Horizontal path
    const pathY = cy + 20;
    for (let x = 0; x < W; x += T) {
      ctx.fillStyle = noise(x/T, 77) < 0.5 ? pc1 : pc2;
      ctx.fillRect(x, pathY - pW*0.4, T, pW*0.8);
      if (hLvl >= 6) {
        ctx.fillStyle = hLvl >= 9 ? '#3a3028' : '#302818';
        ctx.fillRect(x, pathY - pW*0.4, T, 3);
        ctx.fillRect(x, pathY + pW*0.4 - 3, T, 3);
      }
    }

    // ── Garden beds (lv4+) ────────────────────────────────────
    if (hLvl >= 4) {
      const bedCount = Math.min(hLvl - 3, 4);
      const bedDefs = [
        { x: cx - 200, y: cy - 60, w: 70, h: 40 },
        { x: cx + 130, y: cy - 60, w: 70, h: 40 },
        { x: cx - 200, y: cy + 30, w: 70, h: 40 },
        { x: cx + 130, y: cy + 30, w: 70, h: 40 },
      ];
      const bedSoilCols = ['#2a1a08','#301e0a','#2e1c0a','#321e0c'];
      const plantCols   = ['#1a4a10','#1e5412','#224e14','#185016'];
      for (let b = 0; b < Math.min(bedCount, bedDefs.length); b++) {
        const bd = bedDefs[b];
        ctx.fillStyle = '#4a3820';
        ctx.fillRect(bd.x - 3, bd.y - 3, bd.w + 6, bd.h + 6);
        ctx.fillStyle = bedSoilCols[b % bedSoilCols.length];
        ctx.fillRect(bd.x, bd.y, bd.w, bd.h);
        const rows = hLvl >= 7 ? 3 : 2;
        for (let r = 0; r < rows; r++) {
          const py2 = bd.y + 6 + r * ((bd.h - 8) / rows);
          for (let p = 0; p < 5; p++) {
            const px2 = bd.x + 6 + p * ((bd.w - 8) / 5);
            ctx.fillStyle = plantCols[(b+r+p) % plantCols.length];
            ctx.beginPath();
            ctx.arc(px2, py2, hLvl >= 7 ? 4 : 3, 0, Math.PI*2);
            ctx.fill();
          }
        }
      }
    }

    // ── Flower borders (lv6+) ─────────────────────────────────
    if (hLvl >= 6) {
      const flowerCols = ['#ff6b6b','#ffd600','#ff9a3c','#a0e060','#60b0ff'];
      const fx0 = cx - 120, fy0 = cy - 60;
      for (let i = 0; i < 8; i++) {
        const fn = noise(i * 3.7, 42.1);
        ctx.fillStyle = flowerCols[Math.floor(fn * flowerCols.length)];
        const fxx = fx0 + i * 28 + noise(i*1.1, 5.5) * 12;
        const fyy = fy0 + noise(i*2.3, 8.8) * 10;
        ctx.beginPath(); ctx.arc(fxx, fyy, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1e3a0a';
        ctx.fillRect(fxx - 1, fyy + 3, 2, 8);
      }
    }

    // ── Small pond (lv7+) ─────────────────────────────────────
    if (hLvl >= 7) {
      const pdx = cx + 220, pdy = cy + 200;
      ctx.fillStyle = '#2a4030';
      ctx.beginPath(); ctx.ellipse(pdx, pdy, 38, 28, 0, 0, Math.PI*2); ctx.fill();
      const wGrad = ctx.createRadialGradient(pdx-5, pdy-5, 0, pdx, pdy, 34);
      wGrad.addColorStop(0, '#1a4a6a');
      wGrad.addColorStop(0.7, '#0e3050');
      wGrad.addColorStop(1, '#0a2038');
      ctx.fillStyle = wGrad;
      ctx.beginPath(); ctx.ellipse(pdx, pdy, 33, 24, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(100,180,220,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(pdx, pdy, 18, 10, 0, 0, Math.PI*2); ctx.stroke();
      ctx.fillStyle = '#2a6020';
      ctx.beginPath(); ctx.arc(pdx+8, pdy-4, 5, 0, Math.PI*2); ctx.fill();
    }

    // ── Stone/brick border walls (lv8+) ──────────────────────
    if (hLvl >= 8) {
      const brickH = 12, brickW = 28;
      const wallY = yardY + 45;
      const wallX = yardX + 45;
      const wallR = yardX + yardW - 45;
      ctx.fillStyle = '#5a5048';
      for (let x = wallX; x < wallR; x += brickW + 2) {
        const rowOff = Math.round(x / (brickW+2)) % 2 === 0 ? 0 : brickW/2;
        ctx.fillRect(x + rowOff, wallY, Math.min(brickW, wallR - x - rowOff), brickH);
        ctx.fillStyle = '#4a4040';
        ctx.fillRect(x + rowOff, wallY, Math.min(brickW, wallR - x - rowOff), 2);
        ctx.fillStyle = '#5a5048';
      }
    }

    // ── Lamp glow pools on ground (lv9+) ─────────────────────
    if (hLvl >= 9) {
      [
        { x: cx - 30, y: cy - 180 }, { x: cx + 30, y: cy - 180 },
        { x: cx - 180, y: cy + 18 }, { x: cx + 180, y: cy + 18 },
      ].forEach(lp => {
        const grd = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, 30);
        grd.addColorStop(0, 'rgba(255,220,100,0.22)');
        grd.addColorStop(1, 'rgba(255,220,100,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(lp.x, lp.y, 30, 0, Math.PI*2); ctx.fill();
      });
    }

    // ── Gate mosaic tile (lv10) ───────────────────────────────
    if (hLvl >= 10) {
      const mx = cx - 60, my = cy + 380;
      const mosaicCols = ['#7a6a5a','#6a5a4a','#8a7a6a','#5a4a3a'];
      for (let dy = 0; dy < 60; dy += 12) {
        for (let dx = 0; dx < 120; dx += 12) {
          const mn = noise(dx/12+50, dy/12+50);
          ctx.fillStyle = mosaicCols[Math.floor(mn * mosaicCols.length)];
          ctx.fillRect(mx + dx, my + dy, 11, 11);
        }
      }
    }
  },

};
