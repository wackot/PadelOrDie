// ═══════════════════════════════════════════
// PEDAL OR DIE — base.js
// SVG farmstead base, pause system,
// well screen, building interactions
// ═══════════════════════════════════════════

const Base = {

  _paused: false,
  _pausedTimers: [],

  buildings: {
    house:      { id:'house',       title:'Shelter',        desc:'Sleep and restore energy here.',                        action:'shelter'    },
    fridge:     { id:'fridge',      title:'Food Store',     desc:'Eat food and manage supplies.',                         action:'fridge'     },
    well:       { id:'well',        title:'Well',           desc:'Draw water from the well.',                             action:'well'       },
    table:      { id:'table',       title:'Crafting Table', desc:'Craft tools, weapons and upgrades.',                    action:'crafting'   },
    fence:      { id:'fence',       title:'Defences',       desc:'Your perimeter fence.',                                 action:'defence'    },
    map:        { id:'map',         title:'World Map',      desc:'Choose your next expedition.',                          action:'map'        },
    storage:    { id:'storage',     title:'Storage Room',   desc:'Stores your resources. Upgrade to raise caps.',         action:'upgrades'   },
    bike:       { id:'bike',        title:'Your Bike',      desc:'Upgrade to carry more and ride at night.',              action:'upgrades'   },
    greenhouse: { id:'greenhouse',  title:'Greenhouse',     desc:'Passive food production. Upgrade in Crafting.',         action:'upgrades'   },
    field:      { id:'field',       title:'Crop Field',     desc:'Daily crop harvest. Upgrade in Crafting.',              action:'upgrades'   },
    powerhouse: { id:'powerhouse',  title:'Power House',    desc:'Manage your generators and battery bank.',              action:'power'      },
    elecbench:      { id:'elecbench',      title:'Electric Bench',   desc:'Craft electrical components and advanced upgrades.',  action:'elecbench'  },
    radio_tower:    { id:'radio_tower',    title:'Radio Tower',    desc:'Intercept raids. Unlock special world missions.',      action:'upgrades'   },
    rain_collector: { id:'rain_collector', title:'Rain Collector',   desc:'Passively collects rainwater every day.',              action:'upgrades'   },
    solar_station:  { id:'solar_station',  title:'Solar Station',    desc:'Boosts solar power output and stores overnight.',      action:'upgrades'   },
  },

  // ── Init ──────────────────────────────────
  init() {
    this._renderBase();
    this._bindTooltip();
    window.addEventListener('resize', () => this._renderBase());
  },

  // ── Pan/zoom state ────────────────────────
  _panX: 0, _panY: 0, _zoom: 1,

  // ── Main render: canvas + SVG overlay ─────
  _renderBase() {
    this._drawCanvas();
    this._buildSVG();
    this._initPanZoom();
  },

  // ── Centre map and bind pan/zoom gestures ─
  _initPanZoom() {
    const world  = document.getElementById('base-world');
    const inner  = document.getElementById('base-world-inner');
    if (!world || !inner) return;

    const WORLD_W = 1000, WORLD_H = 1000;

    // Fit world to viewport on first load
    const vw = world.clientWidth  || window.innerWidth;
    const vh = world.clientHeight || (window.innerHeight - 52);
    const fitScale = Math.min(vw / WORLD_W, vh / WORLD_H) * 0.92;
    this._zoom = fitScale;
    this._panX = (vw - WORLD_W * fitScale) / 2;
    this._panY = (vh - WORLD_H * fitScale) / 2;
    this._applyTransform(inner);

    // ── Pointer events (works for mouse + touch) ──
    let ptrs = {};          // active pointers
    let lastPinchDist = 0;
    let panStart = null;    // { panX, panY, midX, midY }

    const getPinchDist = () => {
      const pts = Object.values(ptrs);
      if (pts.length < 2) return 0;
      const dx = pts[0].x - pts[1].x, dy = pts[0].y - pts[1].y;
      return Math.sqrt(dx*dx + dy*dy);
    };
    const getMidpoint = () => {
      const pts = Object.values(ptrs);
      if (pts.length < 2) return { x: pts[0].x, y: pts[0].y };
      return { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
    };

    world.addEventListener('pointerdown', e => {
      world.setPointerCapture(e.pointerId);
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      const mid = getMidpoint();
      panStart = { panX: this._panX, panY: this._panY, midX: mid.x, midY: mid.y };
      lastPinchDist = getPinchDist();
      e.preventDefault();
    }, { passive: false });

    world.addEventListener('pointermove', e => {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };

      if (Object.keys(ptrs).length === 2) {
        // Pinch zoom
        const dist = getPinchDist();
        if (lastPinchDist > 0) {
          const ratio    = dist / lastPinchDist;
          const mid      = getMidpoint();
          const newZoom  = Utils.clamp(this._zoom * ratio, 0.25, 3.0);
          // Zoom towards pinch midpoint
          this._panX = mid.x - (mid.x - this._panX) * (newZoom / this._zoom);
          this._panY = mid.y - (mid.y - this._panY) * (newZoom / this._zoom);
          this._zoom = newZoom;
        }
        lastPinchDist = dist;
      } else if (panStart) {
        // Single-finger pan
        const mid = getMidpoint();
        this._panX = panStart.panX + (mid.x - panStart.midX);
        this._panY = panStart.panY + (mid.y - panStart.midY);
      }
      this._applyTransform(inner);
      e.preventDefault();
    }, { passive: false });

    const endPtr = e => {
      delete ptrs[e.pointerId];
      const mid = getMidpoint();
      panStart = { panX: this._panX, panY: this._panY, midX: mid.x, midY: mid.y };
      lastPinchDist = getPinchDist();
    };
    world.addEventListener('pointerup',     endPtr);
    world.addEventListener('pointercancel', endPtr);

    // Mouse wheel zoom
    world.addEventListener('wheel', e => {
      e.preventDefault();
      const factor  = e.deltaY > 0 ? 0.88 : 1.14;
      const newZoom = Utils.clamp(this._zoom * factor, 0.25, 3.0);
      // Zoom towards cursor
      this._panX = e.offsetX - (e.offsetX - this._panX) * (newZoom / this._zoom);
      this._panY = e.offsetY - (e.offsetY - this._panY) * (newZoom / this._zoom);
      this._zoom = newZoom;
      this._applyTransform(inner);
    }, { passive: false });
    // Zoom buttons
    const zoomBy = factor => {
      const vw2 = world.clientWidth  || window.innerWidth;
      const vh2 = world.clientHeight || (window.innerHeight - 52);
      const cx  = vw2 / 2, cy = vh2 / 2;
      const newZoom = Utils.clamp(this._zoom * factor, 0.25, 3.0);
      this._panX = cx - (cx - this._panX) * (newZoom / this._zoom);
      this._panY = cy - (cy - this._panY) * (newZoom / this._zoom);
      this._zoom = newZoom;
      this._applyTransform(inner);
    };
    document.getElementById('base-zoom-in') ?.addEventListener('click', () => zoomBy(1.3));
    document.getElementById('base-zoom-out')?.addEventListener('click', () => zoomBy(0.77));
    document.getElementById('base-zoom-fit')?.addEventListener('click', () => {
      const vw3 = world.clientWidth  || window.innerWidth;
      const vh3 = world.clientHeight || (window.innerHeight - 52);
      const fs  = Math.min(vw3 / WORLD_W, vh3 / WORLD_H) * 0.92;
      this._zoom = fs;
      this._panX = (vw3 - WORLD_W * fs) / 2;
      this._panY = (vh3 - WORLD_H * fs) / 2;
      this._applyTransform(inner);
    });
  },

  _applyTransform(inner) {
    if (inner) inner.style.transform = `translate(${this._panX}px, ${this._panY}px) scale(${this._zoom})`;
  },

  // ── Tiled grass + dirt paths on canvas ────
  _drawCanvas() {
    const canvas = document.getElementById('base-canvas');
    if (!canvas || typeof canvas.getContext !== 'function') return;
    canvas.width  = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 1000, H = 1000;

    const hLvl = Math.max(1, Math.min(10, State.data?.base?.buildings?.house?.level || 1));

    // ── Seeded noise helpers ──────────────────────────────────────────────
    const noise  = (x, y) => { let n = Math.sin(x*127.1+y*311.7)*43758.5453; return n-Math.floor(n); };
    const noise2 = (x, y) => { let n = Math.sin(x*93.4+y*217.3)*31415.926; return n-Math.floor(n); };

    // ── Base ground colour (gets better per level) ───────────────────────
    const groundPalettes = [
      ['#111a07','#141f08','#0e1806','#121a06'],  // Lv1 — scraggly dark wasteland
      ['#151e09','#182209','#131c07','#162008'],  // Lv2
      ['#1a2a0b','#1e2e0d','#18280a','#1c2c0c'],  // Lv3
      ['#1e2f0e','#223410','#1c2d0c','#20320f'],  // Lv4
      ['#21330f','#253811','#1f300d','#233510'],  // Lv5
      ['#243712','#283c14','#213412','#263a13'],  // Lv6 — lush green
      ['#273b13','#2b4015','#253913','#294014'],  // Lv7
      ['#2a3f15','#2e4417','#283d14','#2c4216'],  // Lv8
      ['#2d4317','#314818','#2b4116','#2f4618'],  // Lv9
      ['#304618','#35491a','#2e4417','#32471a'],  // Lv10 — vivid green lawn
    ];
    const gPal = groundPalettes[hLvl - 1];
    const T = 24;

    // ── Ground tiles ──────────────────────────────────────────────────────
    for (let y = 0; y < H; y += T) {
      for (let x = 0; x < W; x += T) {
        const n = noise(x/T, y/T);
        ctx.fillStyle = gPal[Math.floor(n * gPal.length)];
        ctx.fillRect(x, y, T, T);
        // Dark mud patches (fewer at higher levels)
        const mudChance = Math.max(0.01, 0.18 - hLvl * 0.016);
        if (noise(x/T+0.5, y/T+0.3) < mudChance) {
          ctx.fillStyle = hLvl >= 7 ? 'rgba(0,60,0,0.12)' : 'rgba(0,0,0,0.22)';
          ctx.fillRect(x+2, y+2, T-4, T-4);
        }
        // Bright grass tufts (more at higher levels)
        const tuftChance = 0.04 + hLvl * 0.012;
        if (noise2(x/T+0.2, y/T+0.8) < tuftChance) {
          ctx.fillStyle = hLvl >= 6 ? '#3a5a18' : '#1e3010';
          ctx.fillRect(x+T*0.3, y+T*0.1, T*0.15, T*0.5);
          ctx.fillRect(x+T*0.55, y+T*0.05, T*0.12, T*0.6);
        }
      }
    }

    // ── Compound interior yard (gets paved/gravel per level) ─────────────
    const pad = 40;
    const yl  = 500;  // yard left edge (world centre - 460)
    const yt  = 500;
    const yardW = 920, yardH = 920;
    const yardX = pad, yardY = pad;

    // Inner courtyard — dirt then gravel then paving stones
    if (hLvl >= 2) {
      // Yard fills
      const yardFills = [
        null,              // 1 — just raw ground
        '#2a1e10',         // 2 — bare dirt
        '#2e2214',         // 3 — worn dirt
        '#312516',         // 4 — packed earth
        '#3a2e1a',         // 5 — gravel mix
        '#3e3220',         // 6 — fine gravel
        '#444038',         // 7 — grey gravel
        '#4a4640',         // 8 — pea gravel
        '#52504c',         // 9 — flagstone
        '#5a5854',         // 10 — proper courtyard paving
      ];
      if (yardFills[hLvl - 1]) {
        // Draw inner yard
        const iy = yardX + 60, ix = yardY + 60, iw = yardW - 120, ih = yardH - 120;
        for (let y = ix; y < ix+ih; y += T) {
          for (let x = iy; x < iy+iw; x += T) {
            const n = noise(x/T+10, y/T+10);
            ctx.fillStyle = yardFills[hLvl - 1];
            ctx.fillRect(x, y, T, T);
            // Stone joints at high levels
            if (hLvl >= 8) {
              const jcol = hLvl >= 10 ? '#3a3835' : '#3e3c38';
              if (Math.round(x/T) % 3 === 0) { ctx.fillStyle = jcol; ctx.fillRect(x, y, 1, T); }
              if (Math.round(y/T) % 2 === 0) { ctx.fillStyle = jcol; ctx.fillRect(x, y, T, 1); }
            } else if (hLvl >= 6) {
              // Gravel variation
              if (n < 0.3) { ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(x+2,y+2,T-4,T-4); }
              if (n > 0.7) { ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x+2,y+2,T-4,T-4); }
            }
          }
        }
      }
    }

    // ── Paths (upgrade from muddy dirt → cobblestone → lit path) ─────────
    const cx = 500, cy = 500;
    // Path colours per level
    const pathCols = [
      ['#2a1e0e','#251a0c'],   // 1 dirt
      ['#2e2210','#292010'],   // 2
      ['#32260f','#2e2210'],   // 3
      ['#36280e','#32260e'],   // 4 darker packed
      ['#3c2c12','#382a10'],   // 5 earthy
      ['#484030','#403a28'],   // 6 light gravel
      ['#504a3a','#484234'],   // 7 gravel
      ['#5a5448','#524e42'],   // 8 pale stone
      ['#686260','#605c58'],   // 9 flagstone
      ['#747068','#6c6860'],   // 10 cobblestone
    ];
    const [pc1, pc2] = pathCols[hLvl - 1];
    const pW = hLvl >= 7 ? 52 : hLvl >= 4 ? 44 : 36;

    // Main vertical path — house to gate
    for (let y = 0; y < H; y += T) {
      ctx.fillStyle = noise(55, y/T) < 0.5 ? pc1 : pc2;
      ctx.fillRect(cx - pW/2, y, pW, T);
      // Path edge stones at higher levels
      if (hLvl >= 6) {
        ctx.fillStyle = hLvl >= 9 ? '#3a3028' : '#302818';
        ctx.fillRect(cx - pW/2, y, 3, T);
        ctx.fillRect(cx + pW/2 - 3, y, 3, T);
      }
    }
    // Horizontal path — well to barn
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

    // ── Garden beds (appear at lv4+, grow per level) ─────────────────────
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
        // Bed border
        ctx.fillStyle = '#4a3820';
        ctx.fillRect(bd.x - 3, bd.y - 3, bd.w + 6, bd.h + 6);
        // Soil
        ctx.fillStyle = bedSoilCols[b % bedSoilCols.length];
        ctx.fillRect(bd.x, bd.y, bd.w, bd.h);
        // Rows of crops / plants
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

    // ── Decorative flower borders (lv6+) ──────────────────────────────────
    if (hLvl >= 6) {
      const flowerSpacing = 28;
      const flowerCols = ['#ff6b6b','#ffd600','#ff9a3c','#a0e060','#60b0ff'];
      // Around the house front area
      const fx0 = cx - 120, fy0 = cy - 60;
      for (let i = 0; i < 8; i++) {
        const fn = noise(i * 3.7, 42.1);
        ctx.fillStyle = flowerCols[Math.floor(fn * flowerCols.length)];
        const fxx = fx0 + i * flowerSpacing + noise(i*1.1, 5.5) * 12;
        const fyy = fy0 + noise(i*2.3, 8.8) * 10;
        ctx.beginPath(); ctx.arc(fxx, fyy, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1e3a0a';
        ctx.fillRect(fxx - 1, fyy + 3, 2, 8);
      }
    }

    // ── Small pond (lv7+) ─────────────────────────────────────────────────
    if (hLvl >= 7) {
      const pdx = cx + 220, pdy = cy + 200;
      // Pond edge
      ctx.fillStyle = '#2a4030';
      ctx.beginPath(); ctx.ellipse(pdx, pdy, 38, 28, 0, 0, Math.PI*2); ctx.fill();
      // Water
      const wGrad = ctx.createRadialGradient(pdx-5, pdy-5, 0, pdx, pdy, 34);
      wGrad.addColorStop(0, '#1a4a6a');
      wGrad.addColorStop(0.7, '#0e3050');
      wGrad.addColorStop(1, '#0a2038');
      ctx.fillStyle = wGrad;
      ctx.beginPath(); ctx.ellipse(pdx, pdy, 33, 24, 0, 0, Math.PI*2); ctx.fill();
      // Ripple
      ctx.strokeStyle = 'rgba(100,180,220,0.25)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.ellipse(pdx, pdy, 18, 10, 0, 0, Math.PI*2); ctx.stroke();
      // Lily pad
      ctx.fillStyle = '#2a6020';
      ctx.beginPath(); ctx.arc(pdx+8, pdy-4, 5, 0, Math.PI*2); ctx.fill();
    }

    // ── Stone / brick border walls (lv8+) ─────────────────────────────────
    if (hLvl >= 8) {
      const brickH = 12, brickW = 28;
      const wallY = yardY + 45;
      const wallX = yardX + 45;
      const wallR = yardX + yardW - 45;
      const wallB = yardY + yardH - 45;
      // Top wall section
      ctx.fillStyle = '#5a5048';
      for (let x = wallX; x < wallR; x += brickW + 2) {
        const rowOff = Math.round(x / (brickW+2)) % 2 === 0 ? 0 : brickW/2;
        ctx.fillRect(x + rowOff, wallY, Math.min(brickW, wallR - x - rowOff), brickH);
        ctx.fillStyle = '#4a4040';
        ctx.fillRect(x + rowOff, wallY, Math.min(brickW, wallR - x - rowOff), 2);
        ctx.fillStyle = '#5a5048';
      }
    }

    // ── Path lamps / lighting posts (lv9+) ────────────────────────────────
    if (hLvl >= 9) {
      const lampPositions = [
        { x: cx - 30, y: cy - 180 }, { x: cx + 30, y: cy - 180 },
        { x: cx - 180, y: cy + 18 }, { x: cx + 180, y: cy + 18 },
      ];
      lampPositions.forEach(lp => {
        // Glow pool on ground
        const grd = ctx.createRadialGradient(lp.x, lp.y, 0, lp.x, lp.y, 30);
        grd.addColorStop(0, 'rgba(255,220,100,0.22)');
        grd.addColorStop(1, 'rgba(255,220,100,0)');
        ctx.fillStyle = grd;
        ctx.beginPath(); ctx.arc(lp.x, lp.y, 30, 0, Math.PI*2); ctx.fill();
      });
    }

    // ── Lv10: decorative tile mosaic in front of gate ─────────────────────
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

  // ── SVG farmstead scene ───────────────────
  _buildSVG() {
    const svg = document.getElementById('base-svg');
    if (!svg) return;

    // Fixed world size — matches canvas, scrollable container
    const W = 1000;
    const H = 1000;
    // Fence boundary: generous margins on all sides
    const pad  = 40;
    const fw   = W - pad * 2;   // 920
    const fh   = H - pad * 2;   // 920
    const fl   = pad;
    const ft   = pad;
    const fr   = fl + fw;
    const fb   = ft + fh;
    const cx   = fl + fw / 2;   // 500
    const cy   = ft + fh / 2;   // 500

    const fLvl   = State.data?.base?.buildings?.fence?.level       || 1;
    const hLvl   = State.data?.base?.buildings?.house?.level       || 1;
    const ghLvl  = State.data?.base?.buildings?.greenhouse?.level  || 0;
    const fiLvl  = State.data?.base?.buildings?.field?.level       || 0;
    const phLvl  = State.data?.base?.buildings?.powerhouse?.level  || 0;
    const ebLvl  = State.data?.base?.buildings?.elecbench?.level   || 0;
    const stLvl  = State.data?.base?.buildings?.storage?.level     || 1;
    const bkLvl  = State.data?.base?.buildings?.bike?.level        || 1;
    const wlLvl  = State.data?.base?.buildings?.well?.level        || 1;
    const wsLvl  = State.data?.base?.buildings?.workshop?.level    || 0;
    const wtLvl  = State.data?.base?.buildings?.watchtower?.level   || 0;
    const cbLvl  = State.data?.base?.buildings?.compost_bin?.level  || 0;
    const shLvl  = State.data?.base?.buildings?.smokehouse?.level   || 0;
    const alLvl  = State.data?.base?.buildings?.alarm_system?.level || 0;
    const mkLvl  = State.data?.base?.buildings?.medkit_station?.level || 0;
    const bnLvl  = State.data?.base?.buildings?.bunker?.level       || 0;
    const rcLvl  = State.data?.base?.buildings?.rain_collector?.level || 0;
    const rtLvl  = State.data?.base?.buildings?.radio_tower?.level    || 0;
    const ssLvl  = State.data?.base?.buildings?.solar_station?.level  || 0;
    const dr     = State.data?.base?.defenceRating || 0;
    const hasPwr= phLvl > 0 && (State.data?.power?.generators?.bike?.level > 0
                              || State.data?.power?.generators?.woodburner?.level > 0
                              || State.data?.power?.generators?.coal?.level > 0
                              || State.data?.power?.generators?.solar?.level > 0);

    svg.setAttribute('viewBox', `0 0 1000 1000`);
    svg.setAttribute('width', '1000');
    svg.setAttribute('height', '1000');

    // ── Per-level layout offsets ─────────────────────────────────────────
    // House level progressively spaces and repositions buildings
    // giving the base a "growing settlement" feel
    const houseX = cx;
    const houseY = cy - fh * (hLvl >= 6 ? 0.26 : 0.22);

    // Barn/food-store — starts right-centre, moves upper-right at high lv
    const barnX  = cx + fw * (hLvl >= 7 ? 0.30 : 0.32);
    const barnY  = cy + fh * (hLvl >= 7 ? -0.02 : 0.04);

    // Well — starts left-centre, stays roughly same
    const wellX  = cx - fw * 0.32;
    const wellY  = cy + fh * 0.04;

    // Workshop/crafting — moves to dedicated corner at high lv
    const wsX    = cx + fw * (hLvl >= 5 ? 0.16 : 0.12);
    const wsY    = cy + fh * (hLvl >= 5 ? 0.34 : 0.30);

    // Map board — upper-left
    const mapX   = cx - fw * (hLvl >= 4 ? 0.26 : 0.30);
    const mapY   = cy - fh * (hLvl >= 4 ? 0.26 : 0.30);

    // Storage — lower left, expands outward with level
    const stX    = cx - fw * (hLvl >= 5 ? 0.24 : 0.20);
    const stY    = cy + fh * 0.32;

    // Bike — lower right corner
    const bkX    = cx + fw * 0.44;
    const bkY    = cy + fh * 0.36;

    // Greenhouse — lower-centre, shifts right at high lv
    const ghX    = cx - fw * (hLvl >= 6 ? 0.04 : 0.08);
    const ghY    = cy + fh * 0.32;

    // Field — upper right
    const fiX    = cx + fw * 0.34;
    const fiY    = cy - fh * (hLvl >= 6 ? 0.24 : 0.20);

    // Power house — left side
    const phX    = cx - fw * 0.32;
    const phY    = cy - fh * (hLvl >= 5 ? 0.22 : 0.18);

    // Electric bench — upper right inner
    const ebX    = cx + fw * 0.32;
    const ebY    = cy - fh * 0.28;

    // Radio tower — far upper left
    const rtX    = cx - fw * (hLvl >= 5 ? 0.36 : 0.40);
    const rtY    = cy - fh * 0.38;

    // Rain collector — left mid
    const rcX    = cx - fw * 0.44;
    const rcY    = cy - fh * 0.12;

    // Solar station — upper right
    const ssX    = cx + fw * (hLvl >= 5 ? 0.16 : 0.20);
    const ssY    = cy - fh * (hLvl >= 5 ? 0.40 : 0.38);

    // Watchtower — upper left inner (distinct from radio tower far-left)
    const wtX    = cx - fw * 0.14;
    const wtY    = cy - fh * 0.40;

    // Compost bin — right of greenhouse, lower centre
    const cbX    = cx + fw * 0.06;
    const cbY    = cy + fh * 0.44;

    // Smokehouse — right of barn, lower right
    const shX    = cx + fw * 0.44;
    const shY    = cy + fh * 0.14;

    // Alarm system — near fence top, upper centre-right
    const alX    = cx + fw * 0.28;
    const alY    = cy - fh * 0.44;

    // Medkit station — lower left, near storage
    const mkX    = cx - fw * 0.42;
    const mkY    = cy + fh * 0.28;

    // Bunker — lower centre (underground hatch)
    const bnX    = cx;
    const bnY    = cy + fh * 0.44;

    svg.innerHTML = `
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
        <filter id="glow-yellow">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-blue">
          <feGaussianBlur stdDeviation="4" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="glow-electric">
          <feGaussianBlur stdDeviation="3" result="b"/>
          <feColorMatrix in="b" type="matrix" values="1 1 0 0 0 1 1 0 0 0 0 0 1 0 0 0 0 0 18 -7" result="c"/>
          <feMerge><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      ${this._svgFence(fl, ft, fr, fb, fLvl, dr)}
      ${this._svgYard(fl, ft, fr, fb)}

      ${this._svgGroundDecor(cx, cy, fw, fh, hLvl)}

      ${this._svgHouse(houseX, houseY, hLvl)}
      ${this._svgBarn(barnX, barnY)}
      ${this._svgWell(wellX, wellY, wlLvl)}
      ${this._svgWorkbench(wsX, wsY, wsLvl)}
      ${this._svgMapBoard(mapX, mapY)}
      ${this._svgGate(cx, fb, fLvl)}

      <!-- Conditional: greenhouse and field when built -->
      ${ghLvl > 0 ? this._svgGreenhouse(ghX, ghY, ghLvl) : this._svgBuildPrompt(ghX, ghY, 'greenhouse')}
      ${fiLvl > 0 ? this._svgField(fiX, fiY, fiLvl)       : this._svgBuildPrompt(fiX, fiY, 'field')}

      <!-- Power house + electric bench -->
      ${phLvl > 0 ? this._svgPowerHouse(phX, phY, phLvl, hasPwr) : this._svgBuildPrompt(phX, phY, 'powerhouse')}
      ${ebLvl > 0 ? this._svgElecBench(ebX, ebY, ebLvl)           : this._svgBuildPrompt(ebX, ebY, 'elecbench')}

      <!-- Storage room -->
      ${this._svgStorage(stX, stY, stLvl)}

      <!-- Bike rack -->
      ${this._svgBike(bkX, bkY, bkLvl)}

      <!-- Radio tower -->
      ${rtLvl > 0 ? this._svgRadioTower(rtX, rtY, rtLvl) : this._svgBuildPrompt(rtX, rtY, 'radio_tower')}

      <!-- Rain collector and solar station -->
      ${rcLvl > 0 ? this._svgRainCollector(rcX, rcY, rcLvl) : this._svgBuildPrompt(rcX, rcY, 'rain_collector')}
      ${ssLvl > 0 ? this._svgSolarStation(ssX, ssY, ssLvl)  : this._svgBuildPrompt(ssX, ssY, 'solar_station')}

      <!-- Watchtower, compost, smokehouse, alarm, medkit, bunker -->
      ${wtLvl > 0 ? this._svgWatchtower(wtX, wtY, wtLvl)        : this._svgBuildPrompt(wtX, wtY, 'watchtower')}
      ${cbLvl > 0 ? this._svgCompostBin(cbX, cbY, cbLvl)        : this._svgBuildPrompt(cbX, cbY, 'compost_bin')}
      ${shLvl > 0 ? this._svgSmokehouse(shX, shY, shLvl)        : this._svgBuildPrompt(shX, shY, 'smokehouse')}
      ${alLvl > 0 ? this._svgAlarmSystem(alX, alY, alLvl)       : this._svgBuildPrompt(alX, alY, 'alarm_system')}
      ${mkLvl > 0 ? this._svgMedkitStation(mkX, mkY, mkLvl)     : this._svgBuildPrompt(mkX, mkY, 'medkit_station')}
      ${bnLvl > 0 ? this._svgBunker(bnX, bnY, bnLvl)            : this._svgBuildPrompt(bnX, bnY, 'bunker')}

      <!-- Hit zones -->
      ${this._hitZone('house',          houseX, houseY, 90,  100, 'SHELTER')}
      ${this._hitZone('fridge',         barnX,  barnY,  70,  80,  'FOOD STORE')}
      ${this._hitZone('well',           wellX,  wellY,  70,  80,  'WELL')}
      ${this._hitZone('table',          wsX,    wsY,    70,  70,  'CRAFTING')}
      ${this._hitZone('map',            mapX,   mapY,   70,  70,  'WORLD MAP')}
      ${this._hitZone('fence',          cx,     ft+10,  120, 36,  'DEFENCES (' + dr + ')')}
      ${this._hitZone('greenhouse',     ghX,    ghY,    70,  80,  'GREENHOUSE')}
      ${this._hitZone('field',          fiX,    fiY,    80,  70,  'CROP FIELD')}
      ${this._hitZone('powerhouse',     phX,    phY,    70,  80,  '⚡ POWER HOUSE')}
      ${this._hitZone('elecbench',      ebX,    ebY,    70,  70,  '🔬 ELEC BENCH')}
      ${this._hitZone('storage',        stX,    stY,    80,  80,  '🗃️ STORAGE Lv' + stLvl)}
      ${this._hitZone('bike',           bkX,    bkY,    70,  80,  '🚴 BIKE Lv' + bkLvl)}
      ${this._hitZone('radio_tower',    rtX,    rtY,    90,  100, '📡 RADIO Lv' + rtLvl)}
      ${this._hitZone('rain_collector', rcX,    rcY,    80,  90,  '🌧️ RAIN Lv' + rcLvl)}
      ${this._hitZone('solar_station',  ssX,    ssY,    90,  80,  '☀️ SOLAR Lv' + ssLvl)}
      ${this._hitZone('watchtower',     wtX,    wtY,    70,  100, '🗼 WATCH Lv' + wtLvl)}
      ${this._hitZone('compost_bin',    cbX,    cbY,    60,  60,  '♻️ COMPOST Lv' + cbLvl)}
      ${this._hitZone('smokehouse',     shX,    shY,    80,  70,  '🏭 SMOKE Lv' + shLvl)}
      ${this._hitZone('alarm_system',   alX,    alY,    70,  60,  '🔔 ALARM Lv' + alLvl)}
      ${this._hitZone('medkit_station', mkX,    mkY,    80,  70,  '🏥 MEDKIT Lv' + mkLvl)}
      ${this._hitZone('bunker',         bnX,    bnY,    90,  60,  '🏗️ BUNKER Lv' + bnLvl)}
    `;

    // Bind touch + click on hit zones
    svg.querySelectorAll('[data-bid]').forEach(el => {
      const id = el.dataset.bid;
      const handler = (e) => { e.preventDefault(); e.stopPropagation(); this._onBuildingClick(id); };
      el.addEventListener('click',    handler);
      el.addEventListener('touchend', handler, { passive: false });
    });
  },

  // ── Ground decorations — evolve per house level ─────────────────────
  // Trees, rocks, path lights, flower borders, fountain
  // Uses string concatenation — no nested template literals
  _svgGroundDecor(cx, cy, fw, fh, hLvl) {
    const parts = [];
    const lv = Math.max(1, hLvl || 1);

    // ── Helper: pixel tree ──────────────────────────────────────────────
    const tree = (x, y, h, trunkCol, leafCol, leafR) => {
      parts.push('<rect x="' + (x-3) + '" y="' + (y-h*0.3) + '" width="6" height="' + (h*0.35) + '" fill="' + trunkCol + '" rx="2"/>');
      parts.push('<circle cx="' + x + '" cy="' + (y-h*0.3) + '" r="' + leafR + '" fill="' + leafCol + '"/>');
    };

    // ── Helper: rock cluster ────────────────────────────────────────────
    const rock = (x, y, r, col) => {
      parts.push('<ellipse cx="' + x + '" cy="' + y + '" rx="' + (r*1.4) + '" ry="' + (r*0.7) + '" fill="' + col + '" opacity="0.85"/>');
    };

    // ── Helper: lamp post ───────────────────────────────────────────────
    const lamp = (x, y) => {
      parts.push('<rect x="' + (x-2) + '" y="' + (y-40) + '" width="4" height="42" fill="#5a5060" rx="2"/>');
      parts.push('<rect x="' + (x-8) + '" y="' + (y-44) + '" width="16" height="6" fill="#4a4058" rx="2"/>');
      parts.push('<circle cx="' + x + '" cy="' + (y-47) + '" r="7" fill="#ffd600" opacity="0.9" filter="url(#glow-yellow)"/>');
      parts.push('<circle cx="' + x + '" cy="' + (y-47) + '" r="14" fill="rgba(255,214,0,0.12)" filter="url(#glow-yellow)"/>');
    };

    // ── Helper: decorative bush ─────────────────────────────────────────
    const bush = (x, y, col) => {
      parts.push('<circle cx="' + (x-7) + '" cy="' + y + '" r="8" fill="' + col + '"/>');
      parts.push('<circle cx="' + (x+7) + '" cy="' + y + '" r="8" fill="' + col + '"/>');
      parts.push('<circle cx="' + x + '" cy="' + (y-5) + '" r="9" fill="' + col + '"/>');
    };

    // ── Helper: flower ──────────────────────────────────────────────────
    const flower = (x, y, col) => {
      parts.push('<circle cx="' + x + '" cy="' + y + '" r="4" fill="' + col + '" opacity="0.9"/>');
      parts.push('<circle cx="' + x + '" cy="' + (y+1) + '" r="2" fill="#ffd600" opacity="0.8"/>');
      parts.push('<line x1="' + x + '" y1="' + (y+4) + '" x2="' + x + '" y2="' + (y+14) + '" stroke="#2a5010" stroke-width="1.5"/>');
    };

    // ─────────────────────────────────────────────────────────────────────
    // LV1: bare wasteland — just a couple of dead trees and rocks
    // ─────────────────────────────────────────────────────────────────────
    if (lv >= 1) {
      // Dead trees in corners
      tree(cx - fw*0.42, cy - fh*0.44, 50, '#3a2a10', '#2a2010', 14);
      tree(cx + fw*0.42, cy - fh*0.44, 46, '#3a2a10', '#252010', 12);
      // Rocks scattered
      rock(cx - fw*0.38, cy + fh*0.40, 10, '#3a3830');
      rock(cx + fw*0.38, cy + fh*0.38, 8,  '#353432');
      rock(cx - fw*0.10, cy + fh*0.44, 7,  '#302e2c');
    }

    // ─────────────────────────────────────────────────────────────────────
    // LV2+: small bushes appear near house
    // ─────────────────────────────────────────────────────────────────────
    if (lv >= 2) {
      bush(cx - fw*0.14, cy - fh*0.08, '#1e4010');
      bush(cx + fw*0.14, cy - fh*0.08, '#1e3a0e');
      // Rocks become smaller / more placed
      rock(cx + fw*0.20, cy + fh*0.44, 9, '#3a3830');
    }

    // ─────────────────────────────────────────────────────────────────────
    // LV3+: live trees start appearing, paths more defined
    // ─────────────────────────────────────────────────────────────────────
    if (lv >= 3) {
      tree(cx - fw*0.44, cy + fh*0.28, 52, '#5a3a18', '#1e4010', 18);
      tree(cx + fw*0.44, cy + fh*0.22, 48, '#5a3a18', '#244a12', 16);
      // Small stone markers along path
      parts.push('<rect x="' + (cx-fw*0.06) + '" y="' + (cy+fh*0.42) + '" width="8" height="6" fill="#4a4238" rx="1"/>');
      parts.push('<rect x="' + (cx+fw*0.06) + '" y="' + (cy+fh*0.42) + '" width="8" height="6" fill="#4a4238" rx="1"/>');
    }

    // ─────────────────────────────────────────────────────────────────────
    // LV4+: more trees, start of garden corner
    // ─────────────────────────────────────────────────────────────────────
    if (lv >= 4) {
      tree(cx - fw*0.42, cy - fh*0.14, 60, '#5a3a18', '#1e4a0e', 20);
      tree(cx + fw*0.42, cy - fh*0.14, 56, '#5a3a18', '#234e10', 18);
      // Corner flower patches
      flower(cx - fw*0.18, cy + fh*0.28, '#ff8a80');
      flower(cx - fw*0.14, cy + fh*0.28, '#ff6b6b');
      flower(cx + fw*0.16, cy + fh*0.28, '#ffd600');
      // Low stone border along fence inside
      for (let sx = 80; sx < 900; sx += 30) {
        parts.push('<rect x="' + (sx+2) + '" y="' + (cy + fh*0.44+2) + '" width="18" height="6" fill="#4a4038" rx="1" opacity="0.7"/>');
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // LV5+: symmetrical tree line either side of front path
    // ─────────────────────────────────────────────────────────────────────
    if (lv >= 5) {
      // Tree avenue flanking main path
      const treePositions = [
        { x: cx - 68, y: cy + fh*0.14 },
        { x: cx + 68, y: cy + fh*0.14 },
        { x: cx - 68, y: cy + fh*0.26 },
        { x: cx + 68, y: cy + fh*0.26 },
      ];
      treePositions.forEach(tp => {
        tree(tp.x, tp.y, 58, '#5a3a18', '#1e5010', 20);
      });
      // More pronounced bushes framing house
      bush(cx - fw*0.18, cy - fh*0.34, '#1a4a0c');
      bush(cx + fw*0.18, cy - fh*0.34, '#1a4a0c');
    }

    // ─────────────────────────────────────────────────────────────────────
    // LV6+: rich garden — flowers, taller trees, tended borders
    // ─────────────────────────────────────────────────────────────────────
    if (lv >= 6) {
      // Flower borders along central path
      const flowerCols = ['#ff6b6b','#ffd600','#ff9a3c','#a0e060','#80c0ff','#f080ff'];
      for (let i = 0; i < 6; i++) {
        flower(cx - 80 + i * 28, cy + fh*0.38, flowerCols[i % flowerCols.length]);
        flower(cx + 80 - i * 28, cy + fh*0.38, flowerCols[(i+2) % flowerCols.length]);
      }
      // Taller trees in back corners
      tree(cx - fw*0.42, cy - fh*0.40, 74, '#5a3a18', '#1a5c0e', 26);
      tree(cx + fw*0.42, cy - fh*0.40, 70, '#5a3a18', '#1e5c10', 24);
      // Hedge-style bushes along fence
      for (let bx = fl + 80; bx < fr - 80; bx += 48) {
        if (Math.abs(bx - cx) > 60) { // gap at gate
          bush(bx, fb - 28, '#1e4a10');
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // LV7+: lamp posts appear, pond SVG layer, more decor
    // ─────────────────────────────────────────────────────────────────────
    if (lv >= 7) {
      // Path lamps
      lamp(cx - 36, cy + fh*0.08);
      lamp(cx + 36, cy + fh*0.08);
      lamp(cx - 36, cy + fh*0.28);
      lamp(cx + 36, cy + fh*0.28);
      // Ornamental pond (SVG layer — drawn on top of canvas pond for details)
      const pdx = cx + 222, pdy = cy + 200;
      parts.push('<ellipse cx="' + pdx + '" cy="' + pdy + '" rx="36" ry="26" fill="none" stroke="#3a7a50" stroke-width="4"/>');
      parts.push('<ellipse cx="' + pdx + '" cy="' + pdy + '" rx="26" ry="16" fill="rgba(30,80,110,0.5)"/>');
      // Lily pads
      parts.push('<circle cx="' + (pdx+10) + '" cy="' + (pdy-5) + '" r="6" fill="#2a6020" opacity="0.9"/>');
      parts.push('<circle cx="' + (pdx-10) + '" cy="' + (pdy+4) + '" r="5" fill="#2a6020" opacity="0.8"/>');
      parts.push('<circle cx="' + (pdx+10) + '" cy="' + (pdy-5) + '" r="2" fill="#ff6060" opacity="0.8"/>');
    }

    // ─────────────────────────────────────────────────────────────────────
    // LV8+: more elaborate — sculpted hedges, flower rings, extra lamps
    // ─────────────────────────────────────────────────────────────────────
    if (lv >= 8) {
      // Corner hedge squares
      const hedgeCorners = [
        { x: fl + 68, y: ft + 68 },
        { x: fr - 68, y: ft + 68 },
        { x: fl + 68, y: fb - 68 },
        { x: fr - 68, y: fb - 68 },
      ];
      hedgeCorners.forEach(hc => {
        parts.push('<rect x="' + (hc.x-16) + '" y="' + (hc.y-16) + '" width="32" height="32" fill="#1a4a0c" rx="4"/>');
        parts.push('<rect x="' + (hc.x-12) + '" y="' + (hc.y-12) + '" width="24" height="24" fill="#244e10" rx="3"/>');
        parts.push('<circle cx="' + hc.x + '" cy="' + hc.y + '" r="8" fill="#2a5810"/>');
      });
      // Flower ring around house base
      const ringCount = 12;
      for (let i = 0; i < ringCount; i++) {
        const ang = (i / ringCount) * Math.PI * 2;
        const houseX2 = cx;
        const houseY2 = cy - fh * 0.26;
        const rx = houseX2 + Math.cos(ang) * 80;
        const ry = houseY2 + Math.sin(ang) * 60;
        const fcol = ['#ff6b6b','#ffd600','#ff9a3c','#f080ff'][i % 4];
        flower(rx, ry, fcol);
      }
      // Extra lamps
      lamp(cx - fw*0.26, cy - fh*0.06);
      lamp(cx + fw*0.26, cy - fh*0.06);
    }

    // ─────────────────────────────────────────────────────────────────────
    // LV9+: fountain in courtyard centre, shaped tree line
    // ─────────────────────────────────────────────────────────────────────
    if (lv >= 9) {
      // Courtyard fountain
      const fnx = cx, fny = cy + fh*0.14;
      parts.push('<circle cx="' + fnx + '" cy="' + fny + '" r="24" fill="#2a4a3a" opacity="0.8"/>');
      parts.push('<circle cx="' + fnx + '" cy="' + fny + '" r="18" fill="rgba(30,80,110,0.7)"/>');
      parts.push('<circle cx="' + fnx + '" cy="' + fny + '" r="6" fill="#4a8a8a"/>');
      // Water jets
      for (let i = 0; i < 4; i++) {
        const ang = i * Math.PI/2 + Math.PI/4;
        const jx = fnx + Math.cos(ang) * 10;
        const jy = fny + Math.sin(ang) * 10;
        parts.push('<line x1="' + jx + '" y1="' + jy + '" x2="' + (jx + Math.cos(ang)*6) + '" y2="' + (jy - 10) + '" stroke="#80c0e0" stroke-width="2" opacity="0.8"/>');
        parts.push('<circle cx="' + (jx + Math.cos(ang)*6) + '" cy="' + (jy-10) + '" r="2" fill="#a0d0f0" opacity="0.7" filter="url(#glow-blue)"/>');
      }
      // Radial tree pattern around fountain
      const rTrees = [
        { x: fnx - 60, y: fny }, { x: fnx + 60, y: fny },
        { x: fnx, y: fny - 50 }, { x: fnx, y: fny + 50 },
      ];
      rTrees.forEach(rt => tree(rt.x, rt.y, 42, '#4a3014', '#1e5c10', 14));
    }

    // ─────────────────────────────────────────────────────────────────────
    // LV10: ultimate estate — elaborate fountain, neon trim, full gardens
    // ─────────────────────────────────────────────────────────────────────
    if (lv >= 10) {
      // Enhanced fountain with outer ring
      const fnx = cx, fny = cy + fh*0.14;
      parts.push('<circle cx="' + fnx + '" cy="' + fny + '" r="32" fill="none" stroke="#4a7a6a" stroke-width="3"/>');
      parts.push('<circle cx="' + fnx + '" cy="' + fny + '" r="8" fill="#60a0a0" filter="url(#glow-blue)"/>');
      // Electric blue trim lines along inner path edges
      parts.push('<line x1="' + (cx - 28) + '" y1="' + (cy - fh*0.44) + '" x2="' + (cx - 28) + '" y2="' + (cy + fh*0.44) + '" stroke="rgba(100,200,255,0.18)" stroke-width="3"/>');
      parts.push('<line x1="' + (cx + 28) + '" y1="' + (cy - fh*0.44) + '" x2="' + (cx + 28) + '" y2="' + (cy + fh*0.44) + '" stroke="rgba(100,200,255,0.18)" stroke-width="3"/>');
      // Majestic tall trees at compound corners
      [
        { x: fl+70, y: ft+70 }, { x: fr-70, y: ft+70 },
        { x: fl+70, y: fb-70 }, { x: fr-70, y: fb-70 },
      ].forEach(ct => tree(ct.x, ct.y, 80, '#4a3014', '#1a6010', 30));
      // Full flower strip across the back
      for (let i = 0; i < 20; i++) {
        const fcol = ['#ff6b6b','#ffd600','#f080ff','#80c0ff','#ff9a3c'][i%5];
        flower(fl + 80 + i * 40, cy - fh*0.46, fcol);
      }
    }

    return '<g>' + parts.join('') + '</g>';
  },

  // ── Fence perimeter — 10 levels ─────────────────
  //
  // Lv1  — nothing (open ground)
  // Lv2  — rope between wooden poles
  // Lv3  — rope + tin cans as alarm
  // Lv4  — solid wooden fence
  // Lv5  — wooden fence + forward-leaning spikes
  // Lv6  — wooden fence + barbed wire coils in front
  // Lv7  — metal fence panels
  // Lv8  — metal fence + barbed wire coiled on top
  // Lv9  — electrified metal fence (sparks, blue glow) — needs power for full bonus
  // Lv10 — concrete wall + elec wire + auto-gun turrets
  //
  _svgFence(fl, ft, fr, fb, level, dr) {
    const pw     = State.data?.power;
    const hasPwr = level >= 9 && pw && (pw.stored > 0 ||
      (pw.generators?.bike?.level   > 0) ||
      (pw.generators?.woodburner?.level > 0) ||
      (pw.generators?.coal?.level   > 0) ||
      (pw.generators?.solar?.level  > 0));

    const lv = Utils.clamp(level, 1, 10);
    let fenceG = '';

    // ── Shared helpers ──────────────────────
    const spacing = 34;

    // Generate evenly-spaced positions along one side
    const sidePositions = (x1,y1,x2,y2) => {
      const d = Math.hypot(x2-x1,y2-y1);
      const n = Math.max(2, Math.floor(d/spacing));
      const pts = [];
      for (let i=0;i<=n;i++) { const t=i/n; pts.push({x:x1+(x2-x1)*t, y:y1+(y2-y1)*t}); }
      return pts;
    };

    const allPosts = (fn) => {
      sidePositions(fl,ft,fr,ft).forEach(fn);
      sidePositions(fr,ft,fr,fb).forEach(fn);
      sidePositions(fr,fb,fl,fb).forEach(fn);
      sidePositions(fl,fb,fl,ft).forEach(fn);
    };

    // ── Level-specific SVG ──────────────────
    if (lv === 1) {
      // Nothing — just corner marker stakes
      fenceG = `<g opacity="0.4">
        <line x1="${fl}" y1="${ft}" x2="${fr}" y2="${ft}" stroke="#3a3020" stroke-width="1" stroke-dasharray="8,8"/>
        <line x1="${fr}" y1="${ft}" x2="${fr}" y2="${fb}" stroke="#3a3020" stroke-width="1" stroke-dasharray="8,8"/>
        <line x1="${fr}" y1="${fb}" x2="${fl}" y2="${fb}" stroke="#3a3020" stroke-width="1" stroke-dasharray="8,8"/>
        <line x1="${fl}" y1="${fb}" x2="${fl}" y2="${ft}" stroke="#3a3020" stroke-width="1" stroke-dasharray="8,8"/>
      </g>`;

    } else if (lv === 2) {
      // Rope between rough wooden poles
      let poleSVG = '';
      allPosts(({x,y}) => {
        poleSVG += `<rect x="${x-3}" y="${y-14}" width="6" height="14" fill="#6a4a20" rx="1"/>
          <rect x="${x-4}" y="${y-16}" width="8" height="4" fill="#8a6a30" rx="1"/>`;
      });
      fenceG = `<g>
        ${poleSVG}
        <line x1="${fl}" y1="${ft-8}" x2="${fr}" y2="${ft-8}" stroke="#8a6a40" stroke-width="2" stroke-dasharray="6,3" opacity="0.9"/>
        <line x1="${fr}" y1="${ft}"   x2="${fr}" y2="${fb}"   stroke="#8a6a40" stroke-width="2" stroke-dasharray="6,3" opacity="0.9"/>
        <line x1="${fr}" y1="${fb-8}" x2="${fl}" y2="${fb-8}" stroke="#8a6a40" stroke-width="2" stroke-dasharray="6,3" opacity="0.9"/>
        <line x1="${fl}" y1="${ft}"   x2="${fl}" y2="${fb}"   stroke="#8a6a40" stroke-width="2" stroke-dasharray="6,3" opacity="0.9"/>
      </g>`;

    } else if (lv === 3) {
      // Rope + tin cans dangling from rope as alarm
      let poleSVG = '', canSVG = '';
      allPosts(({x,y}) => {
        poleSVG += `<rect x="${x-3}" y="${y-16}" width="6" height="16" fill="#6a4a20" rx="1"/>
          <rect x="${x-4}" y="${y-18}" width="8" height="4" fill="#7a5a28" rx="1"/>`;
      });
      // Cans along top rail
      for (let cx2=fl+20; cx2<fr-10; cx2+=28) {
        canSVG += `<rect x="${cx2-3}" y="${ft-14}" width="6" height="8" fill="#8a8060" rx="1" opacity="0.9"/>
          <line x1="${cx2}" y1="${ft-6}" x2="${cx2}" y2="${ft-10}" stroke="#8a8060" stroke-width="1"/>`;
      }
      for (let cy2=ft+20; cy2<fb-10; cy2+=28) {
        canSVG += `<rect x="${fl-7}" y="${cy2-4}" width="6" height="8" fill="#8a8060" rx="1" opacity="0.9"/>
          <rect x="${fr+1}" y="${cy2-4}" width="6" height="8" fill="#8a8060" rx="1" opacity="0.9"/>`;
      }
      fenceG = `<g>
        ${poleSVG}
        <line x1="${fl}" y1="${ft-8}" x2="${fr}" y2="${ft-8}" stroke="#8a6a40" stroke-width="2"/>
        <line x1="${fr}" y1="${ft}"   x2="${fr}" y2="${fb}"   stroke="#8a6a40" stroke-width="2"/>
        <line x1="${fr}" y1="${fb-8}" x2="${fl}" y2="${fb-8}" stroke="#8a6a40" stroke-width="2"/>
        <line x1="${fl}" y1="${ft}"   x2="${fl}" y2="${fb}"   stroke="#8a6a40" stroke-width="2"/>
        ${canSVG}
      </g>`;

    } else if (lv === 4) {
      // Solid wooden fence — vertical planks between posts
      let plankSVG = '';
      const makeWoodSide = (x1,y1,x2,y2,horiz) => {
        const d = Math.hypot(x2-x1,y2-y1);
        const n = Math.floor(d/9);
        for (let i=0;i<n;i++) {
          const t = (i+0.5)/n;
          const px = x1+(x2-x1)*t, py = y1+(y2-y1)*t;
          const col = (i%2===0)?'#7a5a30':'#6a4a28';
          if (horiz) plankSVG += `<rect x="${px-4.5}" y="${py-18}" width="8" height="18" fill="${col}" stroke="#4a3018" stroke-width="0.5"/>`;
          else       plankSVG += `<rect x="${px-18}" y="${py-4.5}" width="18" height="8" fill="${col}" stroke="#4a3018" stroke-width="0.5" transform="rotate(90,${px},${py})"/>`;
        }
      };
      makeWoodSide(fl,ft,fr,ft,true);
      makeWoodSide(fr,ft,fr,fb,false);
      makeWoodSide(fr,fb,fl,fb,true);
      makeWoodSide(fl,fb,fl,ft,false);
      let postSVG = '';
      allPosts(({x,y}) => {
        postSVG += `<rect x="${x-5}" y="${y-22}" width="10" height="22" fill="#5a3c18" rx="1"/>
          <polygon points="${x-5},${y-22} ${x+5},${y-22} ${x},${y-30}" fill="#7a5a28"/>`;
      });
      fenceG = `<g>${plankSVG}${postSVG}</g>`;

    } else if (lv === 5) {
      // Wooden fence + forward-leaning spikes in front
      let plankSVG='', postSVG='', spikeSVG='';
      const makeWoodSide2 = (x1,y1,x2,y2,horiz) => {
        const d=Math.hypot(x2-x1,y2-y1), n=Math.floor(d/9);
        for(let i=0;i<n;i++){
          const t=(i+0.5)/n, px=x1+(x2-x1)*t, py=y1+(y2-y1)*t;
          const col=(i%2===0)?'#7a5a30':'#6a4a28';
          if(horiz) plankSVG+=`<rect x="${px-4.5}" y="${py-18}" width="8" height="18" fill="${col}" stroke="#4a3018" stroke-width="0.5"/>`;
          else      plankSVG+=`<rect x="${px-18}" y="${py-4.5}" width="18" height="8" fill="${col}" stroke="#4a3018" stroke-width="0.5" transform="rotate(90,${px},${py})"/>`;
        }
      };
      makeWoodSide2(fl,ft,fr,ft,true); makeWoodSide2(fr,ft,fr,fb,false);
      makeWoodSide2(fr,fb,fl,fb,true); makeWoodSide2(fl,fb,fl,ft,false);
      allPosts(({x,y}) => {
        postSVG+=`<rect x="${x-5}" y="${y-22}" width="10" height="22" fill="#5a3c18" rx="1"/>
          <polygon points="${x-5},${y-22} ${x+5},${y-22} ${x},${y-30}" fill="#7a5a28"/>`;
      });
      // Spikes leaning outward from top fence rail
      for(let sx=fl+10; sx<fr-6; sx+=14){
        spikeSVG+=`<line x1="${sx}" y1="${ft}" x2="${sx-6}" y2="${ft-20}" stroke="#8a5a20" stroke-width="3"/>
          <polygon points="${sx-6},${ft-20} ${sx-2},${ft-26} ${sx+2},${ft-14}" fill="#a06020"/>`;
      }
      for(let sy=ft+10; sy<fb-6; sy+=14){
        spikeSVG+=`<line x1="${fr}" y1="${sy}" x2="${fr+6}" y2="${sy-6}" stroke="#8a5a20" stroke-width="3"/>
          <polygon points="${fr+6},${sy-6} ${fr+12},${sy-2} ${fr+2},${sy+2}" fill="#a06020"/>
          <line x1="${fl}" y1="${sy}" x2="${fl-6}" y2="${sy-6}" stroke="#8a5a20" stroke-width="3"/>
          <polygon points="${fl-6},${sy-6} ${fl-12},${sy-2} ${fl-2},${sy+2}" fill="#a06020"/>`;
      }
      for(let sx=fl+10; sx<fr-6; sx+=14){
        spikeSVG+=`<line x1="${sx}" y1="${fb}" x2="${sx-6}" y2="${fb+8}" stroke="#8a5a20" stroke-width="3"/>
          <polygon points="${sx-6},${fb+8} ${sx-2},${fb+14} ${sx+2},${fb+2}" fill="#a06020"/>`;
      }
      fenceG = `<g>${plankSVG}${postSVG}${spikeSVG}</g>`;

    } else if (lv === 6) {
      // Wooden fence + barbed wire coils in front
      let plankSVG='', postSVG='', wireSVG='';
      const makeWS=(x1,y1,x2,y2,h2)=>{const d=Math.hypot(x2-x1,y2-y1),n=Math.floor(d/9);for(let i=0;i<n;i++){const t=(i+0.5)/n,px=x1+(x2-x1)*t,py=y1+(y2-y1)*t;const col=(i%2===0)?'#7a5a30':'#6a4a28';if(h2)plankSVG+=`<rect x="${px-4.5}" y="${py-18}" width="8" height="18" fill="${col}" stroke="#4a3018" stroke-width="0.5"/>`;else plankSVG+=`<rect x="${px-18}" y="${py-4.5}" width="18" height="8" fill="${col}" stroke="#4a3018" stroke-width="0.5" transform="rotate(90,${px},${py})"/>`;} };
      makeWS(fl,ft,fr,ft,true); makeWS(fr,ft,fr,fb,false); makeWS(fr,fb,fl,fb,true); makeWS(fl,fb,fl,ft,false);
      allPosts(({x,y})=>{ postSVG+=`<rect x="${x-5}" y="${y-22}" width="10" height="22" fill="#5a3c18" rx="1"/><polygon points="${x-5},${y-22} ${x+5},${y-22} ${x},${y-30}" fill="#7a5a28"/>`;});
      // Barbed wire coils as ellipses in front of fence
      const bwCol='#707060';
      for(let bx=fl+8; bx<fr-4; bx+=20){
        wireSVG+=`<ellipse cx="${bx}" cy="${ft+6}" rx="10" ry="5" fill="none" stroke="${bwCol}" stroke-width="2" opacity="0.85"/>
          <line x1="${bx-8}" y1="${ft+4}" x2="${bx+8}" y2="${ft+8}" stroke="${bwCol}" stroke-width="1.5" opacity="0.7"/>`;
      }
      for(let by=ft+10; by<fb-6; by+=20){
        wireSVG+=`<ellipse cx="${fl-8}" cy="${by}" rx="5" ry="10" fill="none" stroke="${bwCol}" stroke-width="2" opacity="0.85"/>
          <ellipse cx="${fr+8}" cy="${by}" rx="5" ry="10" fill="none" stroke="${bwCol}" stroke-width="2" opacity="0.85"/>`;
      }
      fenceG=`<g>${plankSVG}${postSVG}${wireSVG}</g>`;

    } else if (lv === 7) {
      // Metal fence — rectangular steel panels between I-beam posts
      let panelSVG='', postSVG='';
      const mCol='#5a5a6a', mDark='#4a4a5a', mPost='#484858';
      const makeMetalSide=(x1,y1,x2,y2,horiz)=>{
        const d=Math.hypot(x2-x1,y2-y1), n=Math.floor(d/36)+1;
        for(let i=0;i<n;i++){
          const t=i/n, t2=(i+1)/n;
          const ax=x1+(x2-x1)*t, ay=y1+(y2-y1)*t;
          const bx=x1+(x2-x1)*t2, by=y1+(y2-y1)*t2;
          if(horiz){
            panelSVG+=`<rect x="${ax+1}" y="${ay-20}" width="${Math.abs(bx-ax)-2}" height="20" fill="${mCol}" stroke="${mDark}" stroke-width="1"/>
              <line x1="${ax+1}" y1="${ay-13}" x2="${bx-1}" y2="${ay-13}" stroke="${mDark}" stroke-width="1" opacity="0.5"/>`;
          } else {
            panelSVG+=`<rect x="${ax-20}" y="${ay+1}" width="20" height="${Math.abs(by-ay)-2}" fill="${mCol}" stroke="${mDark}" stroke-width="1"/>
              <line x1="${ax-13}" y1="${ay+1}" x2="${ax-13}" y2="${by-1}" stroke="${mDark}" stroke-width="1" opacity="0.5"/>`;
          }
        }
      };
      makeMetalSide(fl,ft,fr,ft,true); makeMetalSide(fr,ft,fr,fb,false);
      makeMetalSide(fr,fb,fl,fb,true); makeMetalSide(fl,fb,fl,ft,false);
      allPosts(({x,y})=>{postSVG+=`<rect x="${x-4}" y="${y-24}" width="8" height="24" fill="${mPost}" rx="1"/><rect x="${x-6}" y="${y-26}" width="12" height="4" fill="#606070" rx="1"/>`;});
      fenceG=`<g>${panelSVG}${postSVG}</g>`;

    } else if (lv === 8) {
      // Metal fence + barbed wire coiled along the top
      let panelSVG='', postSVG='', topWire='';
      const mCol='#5a5a6a', mDark='#4a4a5a', mPost='#484858', bwCol='#707060';
      const makeMS=(x1,y1,x2,y2,h2)=>{
        const d=Math.hypot(x2-x1,y2-y1),n=Math.floor(d/36)+1;
        for(let i=0;i<n;i++){
          const t=i/n,t2=(i+1)/n,ax=x1+(x2-x1)*t,ay=y1+(y2-y1)*t,bx=x1+(x2-x1)*t2,by=y1+(y2-y1)*t2;
          if(h2){panelSVG+=`<rect x="${ax+1}" y="${ay-20}" width="${Math.abs(bx-ax)-2}" height="20" fill="${mCol}" stroke="${mDark}" stroke-width="1"/>
            <line x1="${ax+1}" y1="${ay-13}" x2="${bx-1}" y2="${ay-13}" stroke="${mDark}" stroke-width="1" opacity="0.5"/>`;}
          else{panelSVG+=`<rect x="${ax-20}" y="${ay+1}" width="20" height="${Math.abs(by-ay)-2}" fill="${mCol}" stroke="${mDark}" stroke-width="1"/>
            <line x1="${ax-13}" y1="${ay+1}" x2="${ax-13}" y2="${by-1}" stroke="${mDark}" stroke-width="1" opacity="0.5"/>`;}
        }
      };
      makeMS(fl,ft,fr,ft,true); makeMS(fr,ft,fr,fb,false); makeMS(fr,fb,fl,fb,true); makeMS(fl,fb,fl,ft,false);
      allPosts(({x,y})=>{ postSVG+=`<rect x="${x-4}" y="${y-24}" width="8" height="24" fill="${mPost}" rx="1"/><rect x="${x-6}" y="${y-26}" width="12" height="4" fill="#606070" rx="1"/>`;});
      // Barbed wire coils on top
      for(let bx=fl+10;bx<fr-6;bx+=18){
        topWire+=`<ellipse cx="${bx}" cy="${ft-24}" rx="9" ry="4" fill="none" stroke="${bwCol}" stroke-width="2.5"/>
          <line x1="${bx-7}" y1="${ft-22}" x2="${bx+7}" y2="${ft-26}" stroke="${bwCol}" stroke-width="1.5"/>`;
      }
      for(let by=ft+10;by<fb-6;by+=18){
        topWire+=`<ellipse cx="${fr+8}" cy="${by}" rx="4" ry="9" fill="none" stroke="${bwCol}" stroke-width="2.5"/>
          <ellipse cx="${fl-8}" cy="${by}" rx="4" ry="9" fill="none" stroke="${bwCol}" stroke-width="2.5"/>`;
      }
      fenceG=`<g>${panelSVG}${postSVG}${topWire}</g>`;

    } else if (lv === 9) {
      // Electrified metal fence — blue glow when powered, sparks
      const gFilt = hasPwr ? 'filter="url(#glow-electric)"' : '';
      const wireCol = hasPwr ? '#29b6f6' : '#4a6a7a';
      const sparkCol= hasPwr ? '#ffd600' : '#4a5a5a';
      const mCol='#4a5a6a', mDark='#3a4a5a', mPost='#3a4858';
      let panelSVG='', postSVG='', elecSVG='';
      const makeES=(x1,y1,x2,y2,h2)=>{
        const d=Math.hypot(x2-x1,y2-y1),n=Math.floor(d/36)+1;
        for(let i=0;i<n;i++){
          const t=i/n,t2=(i+1)/n,ax=x1+(x2-x1)*t,ay=y1+(y2-y1)*t,bx=x1+(x2-x1)*t2,by=y1+(y2-y1)*t2;
          if(h2){panelSVG+=`<rect x="${ax+1}" y="${ay-22}" width="${Math.abs(bx-ax)-2}" height="22" fill="${mCol}" stroke="${mDark}" stroke-width="1" ${gFilt}/>`;}
          else{panelSVG+=`<rect x="${ax-22}" y="${ay+1}" width="22" height="${Math.abs(by-ay)-2}" fill="${mCol}" stroke="${mDark}" stroke-width="1" ${gFilt}/>`;}
        }
      };
      makeES(fl,ft,fr,ft,true); makeES(fr,ft,fr,fb,false); makeES(fr,fb,fl,fb,true); makeES(fl,fb,fl,ft,false);
      allPosts(({x,y})=>{
        postSVG+=`<rect x="${x-5}" y="${y-26}" width="10" height="26" fill="${mPost}" rx="1"/>
          <rect x="${x-7}" y="${y-28}" width="14" height="5" fill="#506070" rx="1"/>`;
      });
      // Electric wire on top with insulators
      elecSVG+=`<line x1="${fl}" y1="${ft-26}" x2="${fr}" y2="${ft-26}" stroke="${wireCol}" stroke-width="2.5" ${gFilt}/>
        <line x1="${fr}" y1="${ft-26}" x2="${fr}" y2="${fb-26}" stroke="${wireCol}" stroke-width="2.5" ${gFilt}/>`;
      // Sparks when powered
      if(hasPwr){
        const sparkPositions=[[fl+50,ft-26],[fl+150,ft-26],[fr-50,ft-26],[fr,ft+60],[fl,ft+80]];
        sparkPositions.forEach(([sx,sy])=>{
          elecSVG+=`<text x="${sx}" y="${sy}" font-size="10" ${gFilt} opacity="0.85">⚡</text>`;
        });
      }
      fenceG=`<g>${panelSVG}${postSVG}${elecSVG}</g>`;

    } else {
      // lv === 10 — Concrete wall + electrified barbed wire + auto-gun turrets
      const gFilt='filter="url(#glow-electric)"';
      const concreteCol='#5a5a5a', darkCon='#3a3a3a', wireCol='#29b6f6', turretCol='#4a4a4a';
      let wallSVG='', wireSVG='', turretSVG='';
      // Thick concrete walls
      wallSVG+=`
        <rect x="${fl}" y="${ft-24}" width="${fr-fl}" height="24" fill="${concreteCol}" stroke="${darkCon}" stroke-width="2"/>
        <rect x="${fr-24}" y="${ft}" width="24" height="${fb-ft}" fill="${concreteCol}" stroke="${darkCon}" stroke-width="2"/>
        <rect x="${fl}" y="${fb-24}" width="${fr-fl}" height="24" fill="${concreteCol}" stroke="${darkCon}" stroke-width="2" opacity="0.6"/>
        <rect x="${fl}" y="${ft}" width="24" height="${fb-ft}" fill="${concreteCol}" stroke="${darkCon}" stroke-width="2"/>`;
      // Concrete texture lines
      for(let bx=fl+30;bx<fr;bx+=30){
        wallSVG+=`<line x1="${bx}" y1="${ft-24}" x2="${bx}" y2="${ft}" stroke="${darkCon}" stroke-width="1" opacity="0.4"/>`;
      }
      // Electrified barbed wire in front of concrete
      for(let bx=fl+8;bx<fr-4;bx+=16){
        wireSVG+=`<ellipse cx="${bx}" cy="${ft+6}" rx="8" ry="4" fill="none" stroke="${wireCol}" stroke-width="2" ${gFilt} opacity="0.8"/>`;
      }
      for(let by=ft+10;by<fb-6;by+=16){
        wireSVG+=`<ellipse cx="${fr+10}" cy="${by}" rx="4" ry="8" fill="none" stroke="${wireCol}" stroke-width="2" ${gFilt} opacity="0.8"/>
          <ellipse cx="${fl-10}" cy="${by}" rx="4" ry="8" fill="none" stroke="${wireCol}" stroke-width="2" ${gFilt} opacity="0.8"/>`;
      }
      // Auto-gun turrets on top of wall
      const turretPositions = [fl+60, fl+(fr-fl)/2, fr-60];
      turretPositions.forEach(tx=>{
        turretSVG+=`
          <rect x="${tx-12}" y="${ft-44}" width="24" height="18" fill="${turretCol}" rx="2"/>
          <rect x="${tx-8}"  y="${ft-52}" width="16" height="10" fill="#3a3a3a" rx="1"/>
          <line x1="${tx-4}" y1="${ft-46}" x2="${tx-18}" y2="${ft-54}" stroke="#606060" stroke-width="3"/>
          <circle cx="${tx}" cy="${ft-36}" r="5" fill="#2a2a2a" stroke="#555" stroke-width="1.5"/>
          <circle cx="${tx}" cy="${ft-36}" r="2" fill="#e53935" ${gFilt}/>`;
      });
      fenceG=`<g>${wallSVG}${turretSVG}${wireSVG}</g>`;
    }

    // ── Level label ──────────────────────────
    const labelNames = [
      'OPEN GROUND','ROPE & POLES','ALARM LINE',
      'WOOD FENCE','SPIKED FENCE','BARBED PERIMETER',
      'METAL FENCE','METAL+WIRE','ELECTRIFIED',
      'CONCRETE FORTRESS'
    ];
    const labelCol = lv >= 9 ? (hasPwr ? '#29b6f6' : '#7a9aaa')
                   : lv >= 7 ? '#8a9090'
                   : lv >= 4 ? '#9a8a60'
                   : '#7a6a50';
    const cx = fl + (fr-fl)/2;
    const pwrNote = (lv === 9 && !hasPwr) ? ' (needs power)' : (lv === 9 && hasPwr) ? ' ⚡' : '';
    const label = `${labelNames[lv-1]} — Lv${lv} — DEF ${dr}${pwrNote}`;

    return `<g>
      ${fenceG}
      <rect x="${cx-72}" y="${ft-2}" width="144" height="16" fill="#0d0d0d" rx="3" opacity="0.85"/>
      <text x="${cx}" y="${ft+10}"
        font-family="Press Start 2P" font-size="22"
        fill="${labelCol}" text-anchor="middle">${label}</text>
    </g>`;
  },

  // ── Gate (south fence opening) — matches fence level ──
  _svgGate(cx, fb, level) {
    const lv = Utils.clamp(level, 1, 10);

    // Post colours by level tier
    const postCol = lv >= 10 ? '#5a5a5a'  // concrete
                  : lv >= 9  ? '#3a5868'   // electrified metal
                  : lv >= 7  ? '#484858'   // metal
                  : lv >= 4  ? '#5a3c18'   // wood
                  : '#7a6030';             // rope/pole

    const topCol  = lv >= 10 ? '#4a4a4a'
                  : lv >= 9  ? '#29b6f6'
                  : lv >= 7  ? '#606070'
                  : lv >= 4  ? '#7a5228'
                  : '#8a7040';

    const gFilt = lv >= 9 ? 'filter="url(#glow-electric)"' : '';

    // Post shape — wooden posts get pointed tops, metal gets flat, concrete gets battlements
    let leftPost='', rightPost='';
    const lx=cx-28, rx=cx+20, py=fb-32;

    if (lv >= 10) {
      // Concrete pillars with parapet
      leftPost  = `<rect x="${lx}" y="${py}" width="14" height="34" fill="${postCol}"/>
        <rect x="${lx-4}" y="${py-6}" width="22" height="8" fill="${topCol}"/>
        <rect x="${lx}" y="${py-14}" width="5" height="8" fill="${topCol}"/>
        <rect x="${lx+9}" y="${py-14}" width="5" height="8" fill="${topCol}"/>`;
      rightPost = `<rect x="${rx}" y="${py}" width="14" height="34" fill="${postCol}"/>
        <rect x="${rx-4}" y="${py-6}" width="22" height="8" fill="${topCol}"/>
        <rect x="${rx}" y="${py-14}" width="5" height="8" fill="${topCol}"/>
        <rect x="${rx+9}" y="${py-14}" width="5" height="8" fill="${topCol}"/>`;
    } else if (lv >= 7) {
      // I-beam metal posts
      leftPost  = `<rect x="${lx+2}" y="${py}" width="10" height="34" fill="${postCol}" rx="1"/>
        <rect x="${lx}" y="${py-4}" width="14" height="6" fill="${topCol}" rx="1"/>
        <rect x="${lx}" y="${fb-4}" width="14" height="6" fill="${topCol}" rx="1"/>`;
      rightPost = `<rect x="${rx+2}" y="${py}" width="10" height="34" fill="${postCol}" rx="1"/>
        <rect x="${rx}" y="${py-4}" width="14" height="6" fill="${topCol}" rx="1"/>
        <rect x="${rx}" y="${fb-4}" width="14" height="6" fill="${topCol}" rx="1"/>`;
    } else if (lv >= 4) {
      // Wooden posts with pointed tops
      leftPost  = `<rect x="${lx+2}" y="${py}" width="10" height="34" fill="${postCol}" rx="1"/>
        <polygon points="${lx+2},${py} ${lx+12},${py} ${lx+7},${py-12}" fill="${topCol}"/>`;
      rightPost = `<rect x="${rx+2}" y="${py}" width="10" height="34" fill="${postCol}" rx="1"/>
        <polygon points="${rx+2},${py} ${rx+12},${py} ${rx+7},${py-12}" fill="${topCol}"/>`;
    } else {
      // Rough poles
      leftPost  = `<rect x="${lx+3}" y="${py}" width="8" height="34" fill="${postCol}" rx="1"/>
        <rect x="${lx+2}" y="${py-4}" width="10" height="5" fill="${topCol}" rx="1"/>`;
      rightPost = `<rect x="${rx+3}" y="${py}" width="8" height="34" fill="${postCol}" rx="1"/>
        <rect x="${rx+2}" y="${py-4}" width="10" height="5" fill="${topCol}" rx="1"/>`;
    }

    // Gate panels (open gate — two panels pulled to sides)
    const gateFill = lv >= 7 ? '#3a3a4a' : lv >= 4 ? '#5a3c18' : 'transparent';
    const gateStroke = topCol;
    const panels = lv >= 4 ? `
      <rect x="${lx+14}" y="${py+2}" width="12" height="5" fill="${gateFill}" stroke="${gateStroke}" stroke-width="1" rx="1" opacity="0.8"/>
      <rect x="${rx-12}" y="${py+2}" width="12" height="5" fill="${gateFill}" stroke="${gateStroke}" stroke-width="1" rx="1" opacity="0.8"/>
      <rect x="${lx+14}" y="${py+12}" width="12" height="5" fill="${gateFill}" stroke="${gateStroke}" stroke-width="1" rx="1" opacity="0.8"/>
      <rect x="${rx-12}" y="${py+12}" width="12" height="5" fill="${gateFill}" stroke="${gateStroke}" stroke-width="1" rx="1" opacity="0.8"/>
    ` : `
      <line x1="${cx-14}" y1="${py+4}" x2="${lx+14}" y2="${py+4}" stroke="${gateStroke}" stroke-width="2" opacity="0.7"/>
      <line x1="${cx+14}" y1="${py+4}" x2="${rx-12}" y2="${py+4}" stroke="${gateStroke}" stroke-width="2" opacity="0.7"/>
    `;

    // Electric arc over gate opening for lv9+
    const arc = lv >= 9 ? `<path d="M${lx+14},${py} Q${cx},${py-18} ${rx},${py}" fill="none" stroke="${topCol}" stroke-width="2" ${gFilt} opacity="0.8"/>` : '';

    return `<g>
      ${leftPost}${rightPost}${panels}${arc}
    </g>`;
  },

  // ── Yard (dirt inside fence) ──────────────
  _svgYard(fl, ft, fr, fb) {
    const cx = (fl+fr)/2, cy = (ft+fb)/2;
    const fw = fr-fl, fh = fb-ft;
    return `<g>
      <rect x="${fl+10}" y="${ft+10}" width="${fw-20}" height="${fh-20}"
            fill="#2a2214" opacity="0.30" rx="3"/>
      <!-- Dirt paths inside -->
      <rect x="${cx-10}" y="${ft+10}" width="20" height="${fh-20}" fill="#3a2e18" opacity="0.35" rx="2"/>
      <rect x="${fl+10}" y="${cy-8}"  width="${fw-20}" height="16"  fill="#3a2e18" opacity="0.35" rx="2"/>
    </g>`;
  },

  // ── House — 10 levels ────────────────────────
  //  Lv1  hay pile  →  Lv10  metal fortress + neon sign
  _svgHouse(cx, cy, level) {
    const lv = Math.max(1, Math.min(10, level || 1));
    const sf = 'filter="url(#shadow)"';
    const gY = 'filter="url(#glow-yellow)"';
    const gE = 'filter="url(#glow-electric)"';

    const labels = [
      'HAY PILE','MATTRESS','LEAN-TO','OPEN HUT',
      'WOOD SHACK','WOOD HOUSE','GLASS HOUSE',
      'BRICK HOUSE','FANCY HOUSE','METAL FORTRESS'
    ];
    const labelCol = lv===10 ? '#ef5350'
                   : lv>=8  ? '#9090b0'
                   : lv>=6  ? '#c8a840'
                   : '#9a9a60';
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
      // Closed wood shack — planks nailed on, square hole windows, plank door
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
      // Glass windows (blue tint + glint), small glass panel in door, nicer porch
      const w=94, h=62;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#a07848" rx="2"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+34}" x2="${cx+w/2}" y2="${cy-h/2+34}" stroke="#7a5828" stroke-width="1.5" opacity="0.35"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+48}" x2="${cx+w/2}" y2="${cy-h/2+48}" stroke="#7a5828" stroke-width="1.5" opacity="0.35"/>
        <polygon points="${cx-w/2-8},${cy-h/2} ${cx+w/2+8},${cy-h/2} ${cx},${cy-h/2-40}" fill="#6a3a18"/>
        <polygon points="${cx},${cy-h/2-40} ${cx+w/2+8},${cy-h/2} ${cx+3},${cy-h/2-38}" fill="rgba(0,0,0,0.2)"/>
        <rect x="${cx+22}" y="${cy-h/2-30}" width="12" height="32" fill="#8a7040" rx="1"/>
        <rect x="${cx+20}" y="${cy-h/2-32}" width="16" height="5"  fill="#4a4030" rx="1"/>
        <rect x="${cx-w/2+10}" y="${cy-h/2+10}" width="22" height="18" fill="#3a6a8a" rx="2" opacity="0.85"/>
        <rect x="${cx-w/2+10}" y="${cy-h/2+10}" width="22" height="18" fill="none" stroke="#8a9090" stroke-width="2" rx="2"/>
        <line x1="${cx-w/2+21}" y1="${cy-h/2+10}" x2="${cx-w/2+21}" y2="${cy-h/2+28}" stroke="#6a8090" stroke-width="1.5"/>
        <line x1="${cx-w/2+10}" y1="${cy-h/2+19}" x2="${cx-w/2+32}" y2="${cy-h/2+19}" stroke="#6a8090" stroke-width="1.5"/>
        <line x1="${cx-w/2+12}" y1="${cy-h/2+12}" x2="${cx-w/2+18}" y2="${cy-h/2+15}" stroke="rgba(255,255,255,0.45)" stroke-width="1.5"/>
        <rect x="${cx+w/2-32}" y="${cy-h/2+10}" width="22" height="18" fill="#3a6a8a" rx="2" opacity="0.85"/>
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
        <rect x="${cx-8}"  y="${cy+h/2-30}" width="16" height="10" fill="#3a6a8a" rx="1" opacity="0.85"/>
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
        <clipPath id="brickClip${lv}"><rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" rx="2"/></clipPath>
        <g clip-path="url(#brickClip${lv})" opacity="0.9">${bricks}</g>
        <polygon points="${cx-w/2-8},${cy-h/2} ${cx+w/2+8},${cy-h/2} ${cx},${cy-h/2-42}" fill="#4a4850"/>
        <polygon points="${cx},${cy-h/2-42} ${cx+w/2+8},${cy-h/2} ${cx+3},${cy-h/2-40}" fill="rgba(0,0,0,0.25)"/>
        <rect x="${cx+22}" y="${cy-h/2-34}" width="14" height="36" fill="#7a4a30" rx="1"/>
        <rect x="${cx+20}" y="${cy-h/2-36}" width="18" height="5"  fill="#4a4030" rx="1"/>
        <rect x="${cx-w/2+12}" y="${cy-h/2+12}" width="22" height="18" fill="#3a6a8a" rx="2" opacity="0.88"/>
        <rect x="${cx-w/2+12}" y="${cy-h/2+12}" width="22" height="18" fill="none" stroke="#6a8090" stroke-width="2" rx="2"/>
        <line x1="${cx-w/2+23}" y1="${cy-h/2+12}" x2="${cx-w/2+23}" y2="${cy-h/2+30}" stroke="#5a7080" stroke-width="1.5"/>
        <line x1="${cx-w/2+12}" y1="${cy-h/2+21}" x2="${cx-w/2+34}" y2="${cy-h/2+21}" stroke="#5a7080" stroke-width="1.5"/>
        <line x1="${cx-w/2+14}" y1="${cy-h/2+14}" x2="${cx-w/2+20}" y2="${cy-h/2+17}" stroke="rgba(255,255,255,0.35)" stroke-width="1.5"/>
        <rect x="${cx+w/2-34}" y="${cy-h/2+12}" width="22" height="18" fill="#3a6a8a" rx="2" opacity="0.88"/>
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
      // Fancy/pretty house — warm tone, arched windows, columns, flower patch
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
        <path d="M${cx-w/2+12},${cy-h/2+21} Q${cx-w/2+23},${cy-h/2+8} ${cx-w/2+34},${cy-h/2+21}" fill="#4a7a9a" opacity="0.7"/>
        <rect x="${cx-w/2+12}" y="${cy-h/2+10}" width="22" height="22" fill="none" stroke="#c8a870" stroke-width="2" rx="2"/>
        <line x1="${cx-w/2+14}" y1="${cy-h/2+12}" x2="${cx-w/2+20}" y2="${cy-h/2+16}" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
        <rect x="${cx+w/2-34}" y="${cy-h/2+10}" width="22" height="22" fill="#5a8aaa" rx="2" opacity="0.88"/>
        <path d="M${cx+w/2-34},${cy-h/2+21} Q${cx+w/2-23},${cy-h/2+8} ${cx+w/2-12},${cy-h/2+21}" fill="#4a7a9a" opacity="0.7"/>
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
        <rect x="${cx-9}" y="${cy+h/2-32}" width="18" height="10" fill="#3a6a8a" rx="1" opacity="0.85"/>
        <circle cx="${cx+9}" cy="${cy+h/2-18}" r="3" fill="#d4b850"/>
        <rect x="${cx-w/2}" y="${cy+h/2+2}" width="${w+20}" height="10" fill="#3a2810" rx="2" opacity="0.8"/>
        ${flowerSVG}
        <ellipse cx="${cx}" cy="${cy+h/2+20}" rx="${w*0.62}" ry="5" fill="rgba(0,0,0,0.2)"/>
      </g>`;

    } else {
      // lv === 10 — Metal fortress: cameras, turrets, neon sign "THE END IS NEAR"
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
      <text x="${cx}" y="${cy+62}"
        font-family="Press Start 2P" font-size="22"
        fill="${labelCol}" text-anchor="middle">Lv${lv} ${labels[lv-1]}</text>
    </g>`;
  },

  // ── Barn / Food store ─────────────────────
  _svgBarn(cx, cy) {
    const w = 58, h = 46;
    return `<g filter="url(#shadow)">
      <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#6a3818" rx="2"/>
      <!-- Gambrel roof -->
      <polygon points="${cx-w/2-4},${cy-h/2} ${cx+w/2+4},${cy-h/2} ${cx+w/2},${cy-h/2-16} ${cx-w/2},${cy-h/2-16}" fill="#4e2410"/>
      <polygon points="${cx-w/2},${cy-h/2-16} ${cx+w/2},${cy-h/2-16} ${cx},${cy-h/2-32}" fill="#7a3a18"/>
      <polygon points="${cx},${cy-h/2-32} ${cx+w/2},${cy-h/2-16} ${cx+2},${cy-h/2-30}" fill="rgba(0,0,0,0.2)"/>
      <!-- Barn door -->
      <rect x="${cx-12}" y="${cy-h/2+16}" width="24" height="${h/2+2}" fill="#2a1206" rx="1"/>
      <line x1="${cx-12}" y1="${cy-h/2+16}" x2="${cx+12}" y2="${cy+h/2}" stroke="#4a2010" stroke-width="2"/>
      <line x1="${cx+12}" y1="${cy-h/2+16}" x2="${cx-12}" y2="${cy+h/2}" stroke="#4a2010" stroke-width="2"/>
      <!-- Loft window (round) -->
      <circle cx="${cx}" cy="${cy-h/2+8}" r="7" fill="#1a1a2a" stroke="#5a3018" stroke-width="2"/>
      <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="32" ry="5" fill="rgba(0,0,0,0.2)"/>
      <text x="${cx}" y="${cy+h/2+18}"
        font-family="Press Start 2P" font-size="22" fill="#9a9a60" text-anchor="middle">FOOD STORE</text>
    </g>`;
  },

  // ── Well (10 levels) ──────────────────────
  _svgWell(cx, cy, lvl = 1) {
    const stoneA = lvl < 4 ? '#4a4a4a' : lvl < 7 ? '#5a5060' : '#6a5878';
    const stoneB = lvl < 4 ? '#3a3a3a' : lvl < 7 ? '#4a4050' : '#5a4868';
    const rows = lvl < 5 ? 4 : 5, cols = 8;
    const sw = 10, sh = 6, wellR = 22;
    const stones = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offset = r % 2 === 0 ? 0 : sw/2;
        const sx = cx - wellR + c * sw + offset - sw/2;
        const sy = cy - 6 + r * sh - rows*sh/2;
        stones.push(`<rect x="${sx}" y="${sy}" width="${sw-1}" height="${sh-1}" fill="${(r+c)%2===0?stoneA:stoneB}" rx="1"/>`);
      }
    }
    const waterCol = lvl < 5 ? '#1a4a6a' : lvl < 8 ? '#1a6a9a' : '#20aadd';
    const roofCol  = lvl < 4 ? '#7a3818' : lvl < 7 ? '#5a5828' : '#4a4a4a';
    const postCol  = lvl < 4 ? '#5a4020' : lvl < 7 ? '#6a6030' : '#707070';
    const topY     = cy - rows*6/2 - 2;

    const tankExtra = lvl >= 8 ? `
      <rect x="${cx-14}" y="${cy-72}" width="28" height="16" fill="#2a3a4a" rx="3"/>
      <rect x="${cx-12}" y="${cy-70}" width="24" height="12" fill="#1a5a7a" rx="2"/>
      <line x1="${cx}" y1="${cy-56}" x2="${cx}" y2="${cy-44}" stroke="#4a8aaa" stroke-width="2"/>` : '';

    const powerExtra = lvl >= 9 ? `
      <rect x="${cx+14}" y="${cy-50}" width="6" height="36" fill="#3a4a3a" rx="2"/>
      <circle cx="${cx+17}" cy="${cy-52}" r="5" fill="#2a6a2a"/>
      <text x="${cx+17}" y="${cy-49}" font-size="7" text-anchor="middle" fill="#80ff80">⚡</text>` : '';

    return `<g filter="url(#shadow)">
      ${tankExtra}${powerExtra}
      <ellipse cx="${cx}" cy="${cy+8}" rx="26" ry="9" fill="#252525"/>
      ${stones.join('')}
      <ellipse cx="${cx}" cy="${topY}" rx="26" ry="8" fill="${stoneA}"/>
      <ellipse cx="${cx}" cy="${topY}" rx="22" ry="6" fill="#1a3040"/>
      <ellipse cx="${cx}" cy="${topY}" rx="18" ry="5" fill="${waterCol}"/>
      <ellipse cx="${cx-4}" cy="${topY-1}" rx="5" ry="2" fill="rgba(100,200,255,0.35)"/>
      <rect x="${cx-22}" y="${cy-44}" width="5" height="${36+(rows-4)*6}" fill="${postCol}" rx="1"/>
      <rect x="${cx+17}" y="${cy-44}" width="5" height="${36+(rows-4)*6}" fill="${postCol}" rx="1"/>
      <polygon points="${cx-26},${cy-42} ${cx+26},${cy-42} ${cx},${cy-62}" fill="${roofCol}"/>
      <polygon points="${cx},${cy-62} ${cx+26},${cy-42} ${cx+2},${cy-60}" fill="rgba(0,0,0,0.22)"/>
      <rect x="${cx-16}" y="${cy-30}" width="32" height="5" fill="#6a5030" rx="2"/>
      <rect x="${cx-4}"  y="${cy-32}" width="8"  height="9" fill="#4a3820" rx="1"/>
      <line x1="${cx}" y1="${cy-26}" x2="${cx}" y2="${cy-10}" stroke="#8b7040" stroke-width="2" stroke-dasharray="4,2"/>
      <path d="M${cx-7} ${cy-18} L${cx-8} ${cy-8} L${cx+8} ${cy-8} L${cx+7} ${cy-18} Z" fill="#4a3a28"/>
      <rect x="${cx-5}" y="${cy-13}" width="10" height="4" fill="${waterCol}" rx="1"/>
      <ellipse cx="${cx}" cy="${cy+12}" rx="28" ry="5" fill="rgba(0,0,0,0.22)"/>
      <text x="${cx}" y="${cy+48}" font-family="Press Start 2P" font-size="22" fill="#9a9a60" text-anchor="middle">WELL Lv${lvl}</text>
    </g>`;
  },

  // ── Workbench / Workshop (10 levels) ──────
  _svgWorkbench(cx, cy, lvl = 0) {
    const tableCol = lvl < 3 ? '#6a5030' : lvl < 6 ? '#5a5840' : '#484858';
    const legCol   = lvl < 3 ? '#5a4020' : lvl < 6 ? '#505040' : '#404050';
    const topCol   = lvl < 3 ? '#7a6040' : lvl < 6 ? '#6a6850' : '#585868';

    const drillPress = lvl >= 4 ? `
      <rect x="${cx+12}" y="${cy-38}" width="6" height="28" fill="#484848" rx="2"/>
      <rect x="${cx+8}"  y="${cy-42}" width="14" height="8"  fill="#383838" rx="2"/>
      <circle cx="${cx+15}" cy="${cy-12}" r="5" fill="#606060"/>
      <circle cx="${cx+15}" cy="${cy-12}" r="2" fill="#303030"/>` : '';

    const forge = lvl >= 6 ? `
      <rect x="${cx-44}" y="${cy-28}" width="18" height="30" fill="#3a2a1a" rx="2"/>
      <rect x="${cx-42}" y="${cy-24}" width="14" height="18" fill="#1a0a00" rx="1"/>
      <rect x="${cx-42}" y="${cy-10}" width="14" height="4"  fill="#ff6a00" rx="1" opacity="0.8"/>
      <text x="${cx-35}" y="${cy-28}" font-size="7" text-anchor="middle" fill="#ff9a00">🔥</text>` : '';

    const extTable = lvl >= 8 ? `
      <rect x="${cx+26}" y="${cy-10}" width="22" height="10" fill="${tableCol}" rx="2"/>
      <rect x="${cx+28}" y="${cy-12}" width="18" height="4"  fill="${topCol}" rx="1"/>
      <rect x="${cx+28}" y="${cy}"    width="5"  height="18" fill="${legCol}" rx="1"/>
      <rect x="${cx+38}" y="${cy}"    width="5"  height="18" fill="${legCol}" rx="1"/>
      <text x="${cx+32}" y="${cy-14}" font-size="8" text-anchor="middle">💡</text>` : '';

    const masterAura = lvl >= 10 ? `
      <ellipse cx="${cx}" cy="${cy+20}" rx="45" ry="8" fill="rgba(255,150,0,0.12)"/>
      <text x="${cx}" y="${cy-52}" font-family="Press Start 2P" font-size="5" fill="#ffaa40" text-anchor="middle">MASTER FORGE</text>` : '';

    const labelText = lvl === 0 ? 'CRAFTING' : `WORKSHOP Lv${lvl}`;
    return `<g filter="url(#shadow)">
      ${forge}
      ${extTable}
      <rect x="${cx-30}" y="${cy-10}" width="60" height="10" fill="${tableCol}" rx="2"/>
      <rect x="${cx-28}" y="${cy-12}" width="56" height="4"  fill="${topCol}" rx="1"/>
      <rect x="${cx-26}" y="${cy}"    width="6"  height="18" fill="${legCol}" rx="1"/>
      <rect x="${cx+20}" y="${cy}"    width="6"  height="18" fill="${legCol}" rx="1"/>
      <rect x="${cx-20}" y="${cy-24}" width="4"  height="14" fill="#8a7050" rx="1"/>
      <rect x="${cx-23}" y="${cy-28}" width="10" height="6"  fill="#484848" rx="1"/>
      <rect x="${cx-6}"  y="${cy-20}" width="24" height="3"  fill="#7a6040" rx="1"/>
      <polyline points="${cx-6},${cy-17} ${cx-2},${cy-13} ${cx+2},${cy-17} ${cx+6},${cy-13} ${cx+10},${cy-17} ${cx+14},${cy-13} ${cx+18},${cy-17}"
        fill="none" stroke="#b0b0b0" stroke-width="1.5"/>
      <rect x="${cx-28}" y="${cy+4}"  width="56" height="6"  fill="#5a3a18" rx="1" opacity="0.7"/>
      ${drillPress}
      ${masterAura}
      <ellipse cx="${cx}" cy="${cy+20}" rx="32" ry="5" fill="rgba(0,0,0,0.2)"/>
      <text x="${cx}" y="${cy+56}" font-family="Press Start 2P" font-size="22" fill="#9a9a60" text-anchor="middle">${labelText}</text>
    </g>`;
  },

  // ── Map board ─────────────────────────────
  _svgMapBoard(cx, cy) {
    return `<g filter="url(#shadow)">
      <!-- Post -->
      <rect x="${cx-3}" y="${cy+4}" width="6" height="36" fill="#5a4020" rx="1"/>
      <!-- Board -->
      <rect x="${cx-26}" y="${cy-28}" width="52" height="40" fill="#6a5030" rx="3"/>
      <rect x="${cx-23}" y="${cy-25}" width="46" height="34" fill="#1e1208" rx="2"/>
      <!-- Map lines -->
      <line x1="${cx-18}" y1="${cy-18}" x2="${cx+14}" y2="${cy-18}" stroke="#3a3020" stroke-width="1"/>
      <line x1="${cx-18}" y1="${cy-10}" x2="${cx+14}" y2="${cy-10}" stroke="#3a3020" stroke-width="1"/>
      <line x1="${cx-18}" y1="${cy-2}"  x2="${cx+14}" y2="${cy-2}"  stroke="#3a3020" stroke-width="1"/>
      <line x1="${cx-8}"  y1="${cy-25}" x2="${cx-8}"  y2="${cy+9}"  stroke="#3a3020" stroke-width="1"/>
      <!-- Marked locations -->
      <circle cx="${cx-12}" cy="${cy-14}" r="3" fill="none" stroke="#ffd600" stroke-width="1.5"/>
      <polygon points="${cx-12},${cy-17} ${cx-9},${cy-11} ${cx-15},${cy-11}" fill="#ffd600" opacity="0.8"/>
      <circle cx="${cx+8}" cy="${cy-6}"  r="3" fill="none" stroke="#e53935" stroke-width="1.5"/>
      <line x1="${cx-12}" y1="${cy-14}" x2="${cx+8}" y2="${cy-6}" stroke="#7a7050" stroke-width="1" stroke-dasharray="3,2"/>
      <!-- Corner tacks -->
      <circle cx="${cx-22}" cy="${cy-24}" r="2" fill="#c8a840"/>
      <circle cx="${cx+22}" cy="${cy-24}" r="2" fill="#c8a840"/>
      <ellipse cx="${cx}" cy="${cy+40}" rx="24" ry="4" fill="rgba(0,0,0,0.2)"/>
      <text x="${cx}" y="${cy+70}"
        font-family="Press Start 2P" font-size="22" fill="#9a9a60" text-anchor="middle">WORLD MAP</text>
    </g>`;
  },

  // ── Gate in fence (bottom centre) ─────────
  _svgGate(cx, fb, level) {
    const postCol = ['#7a6030','#8a7040','#808070','#4a8aaa'][Math.min(level-1,3)];
    return `<g>
      <rect x="${cx-26}" y="${fb-30}" width="8"  height="32" fill="${postCol}" rx="1"/>
      <rect x="${cx+18}" y="${fb-30}" width="8"  height="32" fill="${postCol}" rx="1"/>
      <!-- Caps -->
      <polygon points="${cx-26},${fb-30} ${cx-18},${fb-30} ${cx-22},${fb-42}" fill="${postCol}"/>
      <polygon points="${cx+18},${fb-30} ${cx+26},${fb-30} ${cx+22},${fb-42}" fill="${postCol}"/>
      <!-- Open gate panels -->
      <rect x="${cx-18}" y="${fb-26}" width="14" height="5" fill="${postCol}" rx="1" opacity="0.8"/>
      <rect x="${cx+4}"  y="${fb-26}" width="14" height="5" fill="${postCol}" rx="1" opacity="0.8"/>
      <rect x="${cx-18}" y="${fb-16}" width="14" height="5" fill="${postCol}" rx="1" opacity="0.8"/>
      <rect x="${cx+4}"  y="${fb-16}" width="14" height="5" fill="${postCol}" rx="1" opacity="0.8"/>
    </g>`;
  },

  // ── Hit zone (transparent tap area) ───────
  _hitZone(id, cx, cy, w, h, label) {
    return `<g data-bid="${id}" style="cursor:pointer" aria-label="${label}">
      <!-- Invisible tap area (larger for mobile) -->
      <rect x="${cx-w/2-10}" y="${cy-h/2-10}" width="${w+20}" height="${h+20}" fill="transparent"/>
    </g>`;
  },


  // ── Building window ───────────────────────
  // Direct tap → open dedicated window, no tooltip step
  // ═══════════════════════════════════════════
  // BUILDING SCREENS
  // Click any building → go directly to its
  // own full screen. No tooltip confirm step.
  // ═══════════════════════════════════════════

  _onBuildingClick(id) {
    this.goToBuilding(id);
  },

  goToBuilding(id) {
    switch (id) {
      case 'house':       Game.goTo('shelter');                                                         break;
      case 'fridge':      Player.renderFridge(); Game.goTo('fridge');                                  break;
      case 'well':        document.getElementById('well-water-count').textContent = State.data.inventory.water; Game.goTo('well'); break;
      case 'powerhouse':  Game.goTo('power'); Power.renderPanel();                                     break;
      case 'table':       Game.goTo('crafting'); Crafting.render();                                    break;
      case 'map':         Game.goTo('map'); WorldMap.render();                                         break;
      case 'radio_tower':
      case 'rain_collector':
      case 'solar_station':
        this.renderBuildingScreen(id);
        Game.goTo('bld-' + id);
        break;

      case 'field':
        if (typeof Farming !== 'undefined') { Farming.open(); }
        else { this.renderBuildingScreen('field'); Game.goTo('bld-field'); }
        break;

      default:
        if (document.getElementById('screen-bld-' + id)) {
          this.renderBuildingScreen(id);
          Game.goTo('bld-' + id);
        }
        break;
    }
  },

  // ── Render a building's dedicated screen ───
  renderBuildingScreen(id) {
    const el = document.getElementById('bld-' + id + '-content');
    if (!el) return;

    const s   = State.data;
    const bld = s.base.buildings;
    const inv = s.inventory;

    let visual = '', title = '', statsRows = '', actionBtn = '';

    switch (id) {
      case 'storage': {
        const lv   = bld.storage?.level || 1;
        const capA = s.base.storageCapA || 50;
        const capB = s.base.storageCapB || 0;
        const capC = s.base.storageCapC || 0;
        const capD = s.base.storageCapD || 0;
        title  = '🗃️ STORAGE ROOM';
        visual = `<svg width="110" height="90" viewBox="0 0 110 90">
          <rect x="10" y="10" width="90" height="65" fill="#2a2018" rx="3"/>
          <rect x="10" y="10" width="90" height="12" fill="#3a3028" rx="3"/>
          <rect x="15" y="26" width="80" height="10" fill="#332820" rx="1"/>
          <rect x="15" y="40" width="80" height="10" fill="#3a3028" rx="1"/>
          <rect x="15" y="54" width="80" height="10" fill="#332820" rx="1"/>
          <circle cx="55" cy="16" r="3" fill="#888"/>
          <text x="55" y="84" text-anchor="middle" font-size="10" fill="#888">Level ${lv}</text>
        </svg>`;
        statsRows = `
          <div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
          <div class="bsc-row"><span>Basic resources cap</span><span>${capA} each</span></div>
          <div class="bsc-row ${capB>0?'ok':'locked'}"><span>Advanced cap</span><span>${capB > 0 ? capB+' each' : '🔒 Unlocks at Lv3'}</span></div>
          <div class="bsc-row ${capC>0?'ok':'locked'}"><span>Rare materials cap</span><span>${capC > 0 ? capC+' each' : '🔒 Unlocks at Lv5'}</span></div>
          <div class="bsc-row ${capD>0?'ok':'locked'}"><span>Tech parts cap</span><span>${capD > 0 ? capD+' each' : '🔒 Unlocks at Lv8'}</span></div>`;
        break;
      }
      case 'bike': {
        const lv    = bld.bike?.level || 1;
        const carry = 20 + lv * 13;
        const light = s.base.bikeHasLight;
        const nMult = s.base.bikeNightMult || 1.0;
        const eff   = Math.round(((s.base.bikeEfficiency||1)-1)*100);
        title  = '🚴 YOUR BIKE';
        visual = `<svg width="140" height="90" viewBox="0 0 140 90">
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
        statsRows = `
          <div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
          <div class="bsc-row"><span>Carry capacity</span><span>${carry} items</span></div>
          <div class="bsc-row"><span>Headlight</span><span>${light ? '💡 Mounted' : '🌑 None (unlocks Lv3)'}</span></div>
          <div class="bsc-row"><span>Night loot bonus</span><span>${light ? '×'+nMult.toFixed(1) : 'N/A'}</span></div>
          <div class="bsc-row"><span>Efficiency bonus</span><span>+${eff}%</span></div>`;
        break;
      }
      case 'fence': {
        const lv        = bld.fence?.level || 1;
        const dr        = s.base.defenceRating || 0;
        const daysSince = s.world?.daysSinceLastRaid || 0;
        title  = '🚧 DEFENCES';
        visual = `<svg width="130" height="75" viewBox="0 0 130 75">
          ${[8,28,48,68,88,108].map(x=>`
            <rect x="${x}" y="8" width="14" height="50" fill="#4a3018" rx="2"/>
            <polygon points="${x},8 ${x+7},1 ${x+14},8" fill="#5a4020"/>
          `).join('')}
          <rect x="8" y="28" width="114" height="8" fill="#3a2410" rx="1"/>
          <rect x="8" y="42" width="114" height="8" fill="#3a2410" rx="1"/>
          ${lv >= 5 ? '<rect x="8" y="18" width="114" height="4" fill="#8a6a30" rx="1" opacity="0.7"/>' : ''}
          ${lv >= 9 ? '<rect x="8" y="18" width="114" height="4" fill="#ffd600" rx="1" opacity="0.3"/>' : ''}
        </svg>`;
        statsRows = `
          <div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
          <div class="bsc-row"><span>Defence rating</span><span>${dr}</span></div>
          <div class="bsc-row"><span>Days since last raid</span><span>${daysSince}</span></div>
          <div class="bsc-row"><span>Upgrade status</span><span>${lv>=9?'⚡ Electrified':lv>=5?'🪝 Spiked':lv>=3?'🔩 Reinforced':'Basic wood'}</span></div>`;
        break;
      }
      case 'greenhouse': {
        const lv = bld.greenhouse?.level || 0;
        const pf = s.base.passiveFood || 0;
        title  = '🌿 GREENHOUSE';
        visual = `<svg width="120" height="90" viewBox="0 0 120 90">
          <polygon points="10,55 60,8 110,55" fill="rgba(80,180,80,0.12)" stroke="#3a7a3a" stroke-width="2"/>
          <line x1="60" y1="8" x2="60" y2="55" stroke="#3a7a3a" stroke-width="1" opacity="0.5"/>
          <line x1="10" y1="35" x2="110" y2="35" stroke="#3a7a3a" stroke-width="1" opacity="0.4"/>
          <rect x="15" y="55" width="90" height="25" fill="#2a2018" rx="2"/>
          ${lv>0 ? Array.from({length:3},(_,i)=>`
            <rect x="${22+i*30}" y="58" width="18" height="18" fill="#1a4a1a" rx="1"/>
            <text x="${31+i*30}" y="${52}" font-size="14" text-anchor="middle">${['🌱','🌿','🌱'][i]}</text>
          `).join('') : '<text x="60" y="42" text-anchor="middle" font-size="11" fill="#555">— empty —</text>'}
        </svg>`;
        statsRows = lv === 0
          ? `<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>`
          : `<div class="bsc-row"><span>Level</span><span>${lv} / 5</span></div>
             <div class="bsc-row ok"><span>Passive food per day</span><span>+${pf}</span></div>`;
        break;
      }
      case 'field': {
        const lv    = bld.field?.level || 0;
        const plots = typeof Farming !== 'undefined' ? Farming._plotsForLevel(lv) : lv * 2;
        const farming = State.data.farming;
        const ready  = farming ? farming.plots.filter(p=>p.state==='ready').length : 0;
        const growing= farming ? farming.plots.filter(p=>p.state==='growing').length : 0;
        title  = '🌾 CROP FIELD';
        visual = `<svg width="120" height="80" viewBox="0 0 120 80">
          <rect x="5" y="48" width="110" height="22" fill="#2a1808" rx="2"/>
          <rect x="5" y="43" width="110" height="8" fill="#3a2010" rx="1"/>
          ${lv>0 ? Array.from({length:Math.min(plots,8)},(_,i)=>`
            <line x1="${10+i*13}" y1="44" x2="${10+i*13}" y2="${26}" stroke="#5a8a20" stroke-width="2"/>
            <text x="${10+i*13}" y="${22}" font-size="11" text-anchor="middle">🌾</text>
          `).join('') : '<text x="60" y="36" text-anchor="middle" font-size="9" fill="#555">— not built —</text>'}
        </svg>`;
        statsRows = lv === 0
          ? `<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>`
          : `<div class="bsc-row"><span>Level</span><span>${lv} / 5</span></div>
             <div class="bsc-row ok"><span>Active plots</span><span>${plots} / 10</span></div>
             <div class="bsc-row ok"><span>Growing</span><span>${growing} plots</span></div>
             <div class="bsc-row ${ready>0?'ok':''}" ><span>Ready to harvest</span><span>${ready>0?'✅ '+ready+' ready':'none'}</span></div>`;
        actionBtn = lv > 0 ? `<button class="bsc-action-btn" onclick="Farming.open()">🌾 MANAGE FARM</button>` : '';
        break;
      }
      case 'workshop': {
        const lv   = bld.workshop?.level || 0;
        const disc = Math.round((1-(s.base.craftCostMult||1))*100);
        const beff = Math.round(((s.base.bikeEfficiency||1)-1)*100);
        title  = '🔧 WORKSHOP';
        visual = `<svg width="120" height="90" viewBox="0 0 120 90">
          <rect x="10" y="28" width="100" height="52" fill="#2a2018" rx="3"/>
          <rect x="10" y="28" width="100" height="14" fill="#3a2820" rx="3"/>
          <rect x="20" y="48" width="22" height="24" fill="#1a1610"/>
          <rect x="52" y="52" width="16" height="12" fill="#3a2810" rx="1"/>
          <rect x="78" y="46" width="24" height="22" fill="#1a1610" rx="1"/>
          <text x="31" y="44" font-size="14" text-anchor="middle">🔧</text>
          <text x="90" y="44" font-size="14" text-anchor="middle">🪛</text>
          <text x="60" y="84" text-anchor="middle" font-size="9" fill="#888">${lv>0?'Lv'+lv:'Not built'}</text>
        </svg>`;
        statsRows = lv === 0
          ? `<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>`
          : `<div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
             <div class="bsc-row ok"><span>Crafting discount</span><span>-${disc}%</span></div>
             <div class="bsc-row ok"><span>Bike efficiency</span><span>+${beff}%</span></div>`;
        break;
      }
      case 'elecbench': {
        const lv      = bld.elecbench?.level || 0;
        const powered = Power.hasPowerForCrafting?.(1);
        title  = '🔬 ELECTRIC BENCH';
        visual = `<svg width="120" height="90" viewBox="0 0 120 90">
          <rect x="10" y="38" width="100" height="42" fill="#1a1a2a" rx="3"/>
          <rect x="10" y="38" width="100" height="12" fill="#2a2a3a" rx="3"/>
          ${lv>0&&powered ? '<text x="60" y="34" text-anchor="middle" font-size="11" fill="#ffd600">⚡ POWERED ⚡</text>' : ''}
          <rect x="18" y="56" width="20" height="18" fill="#0d0d1a" rx="1"/>
          <rect x="50" y="52" width="28" height="22" fill="#0d0d1a" rx="1"/>
          <rect x="88" y="58" width="16" height="16" fill="#0d0d1a" rx="1"/>
          <text x="60" y="86" text-anchor="middle" font-size="9" fill="#888">${lv>0?'Lv'+lv:'Not built'}</text>
        </svg>`;
        statsRows = lv === 0
          ? `<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>`
          : `<div class="bsc-row"><span>Level</span><span>${lv} / 5</span></div>
             <div class="bsc-row ${powered?'ok':'locked'}"><span>Power supply</span><span>${powered?'⚡ Online':'❌ No power — build generator'}</span></div>`;
        if (lv > 0) actionBtn = `<button class="bsc-action-btn" onclick="Game.goTo('crafting'); Crafting.render(); setTimeout(()=>{Crafting._selectCat?.('electric');Crafting._switchTab?.('craft');},120)">🔬 CRAFT ELECTRONICS</button>`;
        break;
      }

      case 'radio_tower': {
        const lv       = bld.radio_tower?.level || 0;
        const rr       = s.base.raidChanceReduction || 0;
        const missions = (s.world.unlockedMissions || []);
        const sigRange = s.base.radioSignalRange || 0;
        const mNames   = { signal_drop:'Signal Drop', rescue_beacon:'Rescue Beacon', black_market:'Black Market', command_bunker:'Command Bunker', endgame_transmission:'Endgame Transmission' };
        const missionHtml = ['signal_drop','rescue_beacon','black_market','command_bunker','endgame_transmission'].map(mk => {
          const got = missions.includes(mk);
          return '<div class="bsc-row ' + (got ? 'ok' : 'locked') + '"><span>' + (got ? '✓' : '🔒') + ' ' + mNames[mk] + '</span><span>' + (got ? 'UNLOCKED' : '...') + '</span></div>';
        }).join('');
        title = '📡 RADIO TOWER';
        visual = this._svgRadioTowerScreen(lv);
        statsRows = lv === 0
          ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>'
          : '<div class="bsc-row"><span>Level</span><span>' + lv + ' / 10</span></div>' +
            '<div class="bsc-row ok"><span>Raid chance reduced</span><span>' + Math.round(rr*100) + '%</span></div>' +
            '<div class="bsc-row"><span>Signal range</span><span>' + sigRange + ' / 10</span></div>' +
            '<div class="bsc-row"><span>Missions unlocked</span><span>' + missions.length + ' / 5</span></div>' +
            missionHtml;
        if (lv > 0) actionBtn = '<button class="bsc-action-btn" onclick="WorldMap.render();window.Game.goTo(String.fromCharCode(109,97,112))">🌍 WORLD MAP</button>';
        break;
      }

      case 'rain_collector': {
        const lv      = bld.rain_collector?.level || 0;
        const pw      = s.base.passiveWater || 0;
        const noEmpty = s.base.waterNeverEmpty || false;
        title = '\u{1F327}\uFE0F RAIN COLLECTOR';
        visual = this._svgRainCollectorScreen(lv);
        const eCls = noEmpty ? 'ok' : '';
        const eStr = noEmpty ? '\u2713 Never runs dry' : 'Standard';
        statsRows = lv === 0
          ? '<div class="bsc-row locked"><span>Status</span><span>\uD83D\uDD12 Not yet built</span></div>'
          : '<div class="bsc-row"><span>Level</span><span>' + lv + ' / 10</span></div>' +
            '<div class="bsc-row ok"><span>Passive water / day</span><span>+' + pw + ' \uD83D\uDCA7</span></div>' +
            '<div class="bsc-row ' + eCls + '"><span>Water reserve</span><span>' + eStr + '</span></div>' +
            '<div class="bsc-row"><span>Current water</span><span>' + (inv.water || 0) + ' \uD83D\uDCA7</span></div>';
        break;
      }

      case 'solar_station': {
        const lv      = bld.solar_station?.level || 0;
        const boost   = s.base.solarBoost || 1.0;
        const nPwr    = s.base.solarNightPower || 0;
        const fPwr    = s.base.solarNightPower >= 6;
        title = '\u2600\uFE0F SOLAR STATION';
        visual = this._svgSolarStationScreen(lv);
        const fCls = fPwr ? 'ok' : 'locked';
        const fStr = fPwr ? '\u26A1 Yes' : '\uD83D\uDD12 Lv5+';
        statsRows = lv === 0
          ? '<div class="bsc-row locked"><span>Status</span><span>\uD83D\uDD12 Not yet built</span></div>'
          : '<div class="bsc-row"><span>Level</span><span>' + lv + ' / 10</span></div>' +
            '<div class="bsc-row ok"><span>Solar output boost</span><span>x' + boost.toFixed(2) + '</span></div>' +
            '<div class="bsc-row ok"><span>Stored overnight</span><span>+' + nPwr + ' Wh</span></div>' +
            '<div class="bsc-row ' + fCls + '"><span>Powers fence</span><span>' + fStr + '</span></div>';
        break;
      }

      case 'watchtower': {
        const lv = bld.watchtower?.level || 0;
        title = '🗼 WATCHTOWER';
        visual = lv > 0
          ? '<svg width="100" height="120" viewBox="0 0 200 240" style="overflow:visible">' + this._svgWatchtower(100, 160, lv) + '</svg>'
          : '<div style="font-size:2.5rem;text-align:center;padding:16px">🗼</div>';
        const warnBonus = (bld.watchtower?.level||0) > 0 ? (s.base.raidWarningBonus || 0) : 0;
        statsRows = lv === 0
          ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>'
          : `<div class="bsc-row"><span>Level</span><span>${lv} / 3</span></div>
             <div class="bsc-row ok"><span>Raid warning bonus</span><span>+${warnBonus}s earlier</span></div>
             <div class="bsc-row ok"><span>Defence bonus</span><span>+${[10,20,35][lv-1]||0}</span></div>`;
        break;
      }

      case 'compost_bin': {
        const lv = bld.compost_bin?.level || 0;
        title = '♻️ COMPOST BIN';
        visual = lv > 0
          ? '<svg width="90" height="90" viewBox="0 0 180 180" style="overflow:visible">' + this._svgCompostBin(90, 110, lv) + '</svg>'
          : '<div style="font-size:2.5rem;text-align:center;padding:16px">♻️</div>';
        const passFood = s.base.passiveFood || 0;
        statsRows = lv === 0
          ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>'
          : `<div class="bsc-row"><span>Level</span><span>${lv} / 2</span></div>
             <div class="bsc-row ok"><span>Passive food/day</span><span>+${passFood}</span></div>`;
        break;
      }

      case 'smokehouse': {
        const lv = bld.smokehouse?.level || 0;
        title = '🏭 SMOKEHOUSE';
        visual = lv > 0
          ? '<svg width="90" height="100" viewBox="0 0 180 200" style="overflow:visible">' + this._svgSmokehouse(90, 120, lv) + '</svg>'
          : '<div style="font-size:2.5rem;text-align:center;padding:16px">🏭</div>';
        statsRows = lv === 0
          ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>'
          : `<div class="bsc-row"><span>Level</span><span>${lv} / 2</span></div>
             <div class="bsc-row ok"><span>Food preservation</span><span>${lv >= 2 ? '3×' : '2×'} longer</span></div>
             ${lv >= 2 ? '<div class="bsc-row ok"><span>Passive food/day</span><span>+2</span></div>' : ''}`;
        break;
      }

      case 'alarm_system': {
        const lv = bld.alarm_system?.level || 0;
        title = '🔔 ALARM SYSTEM';
        visual = lv > 0
          ? '<svg width="80" height="100" viewBox="0 0 160 200" style="overflow:visible">' + this._svgAlarmSystem(80, 130, lv) + '</svg>'
          : '<div style="font-size:2.5rem;text-align:center;padding:16px">🔔</div>';
        const dmgRed = Math.round((s.base.raidDamageReduction || 0) * 100);
        statsRows = lv === 0
          ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>'
          : `<div class="bsc-row"><span>Level</span><span>${lv} / 2</span></div>
             <div class="bsc-row ok"><span>Raid damage reduction</span><span>-${dmgRed}%</span></div>
             ${lv >= 2 ? '<div class="bsc-row ok"><span>Auto fence activation</span><span>✅ Active</span></div>' : ''}`;
        break;
      }

      case 'medkit_station': {
        const lv = bld.medkit_station?.level || 0;
        title = '🏥 MEDICAL STATION';
        visual = lv > 0
          ? '<svg width="90" height="100" viewBox="0 0 180 200" style="overflow:visible">' + this._svgMedkitStation(90, 120, lv) + '</svg>'
          : '<div style="font-size:2.5rem;text-align:center;padding:16px">🏥</div>';
        const medEff = s.base.medEfficiency || 1.0;
        statsRows = lv === 0
          ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>'
          : `<div class="bsc-row"><span>Level</span><span>${lv} / 3</span></div>
             <div class="bsc-row ok"><span>Medicine effectiveness</span><span>${medEff.toFixed(2)}×</span></div>
             ${lv >= 2 ? '<div class="bsc-row ok"><span>Passive medicine/day</span><span>+1</span></div>' : ''}
             ${lv >= 3 ? '<div class="bsc-row ok"><span>Passive energy heal</span><span>+1/hr</span></div>' : ''}`;
        break;
      }

      case 'bunker': {
        const lv = bld.bunker?.level || 0;
        title = '🏗️ BUNKER';
        visual = lv > 0
          ? '<svg width="120" height="80" viewBox="0 0 240 160" style="overflow:visible">' + this._svgBunker(120, 90, lv) + '</svg>'
          : '<div style="font-size:2.5rem;text-align:center;padding:16px">🏗️</div>';
        const defBonus = (lv >= 1 ? [50, 80][lv-1] || 0 : 0);
        const dmgRed2  = Math.round((s.base.raidDamageReduction || 0) * 100);
        statsRows = lv === 0
          ? '<div class="bsc-row locked"><span>Status</span><span>🔒 Not yet built</span></div>'
          : `<div class="bsc-row"><span>Level</span><span>${lv} / 2</span></div>
             <div class="bsc-row ok"><span>Defence bonus</span><span>+${defBonus}</span></div>
             <div class="bsc-row ok"><span>Raid damage reduction</span><span>-${dmgRed2}%</span></div>
             ${lv >= 2 ? '<div class="bsc-row ok"><span>Raid chance reduction</span><span>-20%</span></div>' : ''}`;
        break;
      }
    }

    // ── Upgrade section ───────────────────────
    const upgKey = id;   // keys match except no remapping needed here
    const upg    = Crafting.baseUpgrades?.[upgKey];
    let upgradeSection = '';

    if (upg) {
      const shelterLv = bld.house?.level || 1;
      const reqLv     = upg.unlockReq || 0;
      const isLocked  = reqLv > shelterLv;
      const stKey     = upgKey;
      const curLv     = bld[stKey]?.level || 0;
      const isMax     = curLv >= upg.maxLevel;
      const ab        = s.activeBuild;
      const isBuilding= ab && ab.key === upgKey;
      const otherBld  = ab && ab.key !== upgKey;
      const nextDef   = (!isMax && !isLocked) ? upg.levels[curLv] : null;
      const canAfford = nextDef ? Crafting._canAffordUpgrade(nextDef.cost) : false;

      const pips = Array.from({length: upg.maxLevel}, (_,i) =>
        `<span class="bsc-pip ${i<curLv?'filled':''}" ></span>`).join('');

      let upgradeBody = '';
      if (isMax) {
        upgradeBody = '<div class="bsc-upgrade-status maxed">✅ MAXIMUM LEVEL REACHED</div>';
      } else if (isLocked) {
        upgradeBody = `<div class="bsc-upgrade-status locked">🔒 Requires Shelter Lv${reqLv}</div>`;
      } else if (isBuilding) {
        const pct = Math.round(((ab.secsTotal - ab.secsLeft) / ab.secsTotal) * 100);
        upgradeBody = `
          <div class="bsc-build-progress">
            <div class="bsc-build-label">🏗 BUILDING… ${Math.ceil(ab.secsLeft)}s remaining</div>
            <div class="bsc-bar-wrap"><div class="bsc-bar" id="bsc-bar-${id}" style="width:${pct}%"></div></div>
            <div class="bsc-build-sub">🚴 Pedal faster to reduce build time</div>
          </div>`;
      } else if (otherBld) {
        upgradeBody = `<div class="bsc-upgrade-status locked">🚧 Busy building: ${ab.upg.name}</div>`;
      } else {
        const nextDesc = nextDef?.desc || '';
        upgradeBody = `
          <div class="bsc-next-effect">→ ${nextDesc}</div>
          <button class="bsc-upgrade-btn ${canAfford?'':' disabled'}"
            onclick="Base.showUpgradeConfirm('${id}','${upgKey}')"
            ${canAfford ? '' : 'disabled'}>
            ${curLv===0 ? '🔨 BUILD THIS' : '▲ UPGRADE TO LV'+(curLv+1)}
          </button>
          ${!canAfford ? '<div class="bsc-cant-afford">❌ Not enough resources</div>' : ''}`;
      }

      upgradeSection = `
        <div class="bsc-upgrade-section">
          <div class="bsc-upgrade-title">UPGRADES <span class="bsc-lv-badge">LV ${curLv} / ${upg.maxLevel}</span></div>
          <div class="bsc-pips">${pips}</div>
          ${upgradeBody}
        </div>`;
    }

    el.innerHTML = `
      <h2 class="screen-title">${title}</h2>
      <div class="bsc-visual">${visual}</div>
      <div class="bsc-stats">${statsRows}</div>
      ${actionBtn ? `<div class="bsc-actions">${actionBtn}</div>` : ''}
      ${upgradeSection}
      <button class="btn-pixel btn-secondary bsc-back" onclick="Game.goTo('base')">← BACK TO BASE</button>
    `;

    this._startScreenRefresh(id, upgKey);
  },

  _screenRefreshTimer: null,

  _startScreenRefresh(screenId, upgKey) {
    clearInterval(this._screenRefreshTimer);
    const ab = State.data.activeBuild;
    if (!ab || ab.key !== upgKey) return;
    this._screenRefreshTimer = setInterval(() => {
      const cur = State.data.activeBuild;
      const bar = document.getElementById('bsc-bar-' + screenId);
      const lbl = document.querySelector('.bsc-build-label');
      if (cur && cur.key === upgKey) {
        const pct = Math.round(((cur.secsTotal-cur.secsLeft)/cur.secsTotal)*100);
        if (bar) bar.style.width = pct + '%';
        if (lbl) lbl.textContent = `🏗 BUILDING… ${Math.ceil(cur.secsLeft)}s remaining`;
      } else {
        clearInterval(this._screenRefreshTimer);
        this._screenRefreshTimer = null;
        this.renderBuildingScreen(screenId);
      }
    }, 500);
  },

  // ── Upgrade confirm popup ─────────────────
  showUpgradeConfirm(screenId, upgKey) {
    const upg   = Crafting.baseUpgrades?.[upgKey];
    if (!upg) return;
    const curLv = State.data.base.buildings[upgKey]?.level || 0;
    const next  = upg.levels[curLv];
    if (!next) return;

    const costRows = Object.entries(next.cost)
      .filter(([,v])=>v>0)
      .map(([r,v]) => {
        const have = State.data.inventory[r] || 0;
        const ok   = have >= v;
        const em   = Crafting.emojiMap?.[r] || '📦';
        return `<div class="ucm-cost-row ${ok?'ok':'short'}">
          <span>${em} ${r}</span><span>${have} / ${v} ${ok?'✓':'✗'}</span></div>`;
      }).join('') || '<div class="ucm-cost-row ok"><span>Free!</span><span>✓</span></div>';

    document.getElementById('upgrade-confirm-content').innerHTML = `
      <div class="ucm-title">${upg.icon} ${curLv===0?'BUILD':'UPGRADE'} ${upg.name.toUpperCase()} TO LV${curLv+1}</div>
      <div class="ucm-effect">${next.desc}</div>
      <div class="ucm-section-label">RESOURCES NEEDED</div>
      <div class="ucm-costs">${costRows}</div>
      <div class="ucm-section-label">BUILD TIME</div>
      <div class="ucm-time">⏱ 10 seconds &nbsp;&nbsp; 🚴 Pedal to speed up</div>
      <div class="ucm-buttons">
        <button class="ucm-yes" onclick="Base.confirmUpgrade('${screenId}','${upgKey}')">✓ YES, BUILD IT</button>
        <button class="ucm-no"  onclick="Base.closeUpgradeConfirm()">✕ CANCEL</button>
      </div>`;

    document.getElementById('upgrade-confirm-backdrop').classList.remove('hidden');
    document.getElementById('upgrade-confirm-modal').classList.remove('hidden');
  },

  confirmUpgrade(screenId, upgKey) {
    this.closeUpgradeConfirm();
    Crafting._upgradeBuilding(upgKey);
    setTimeout(() => this.renderBuildingScreen(screenId), 60);
  },

  closeUpgradeConfirm() {
    document.getElementById('upgrade-confirm-backdrop')?.classList.add('hidden');
    document.getElementById('upgrade-confirm-modal')?.classList.add('hidden');
  },

  _bindTooltip() { /* no-op: old tooltip replaced by building screens */ },

  updateNight() {
    const overlay = document.getElementById('night-overlay');
    if (overlay) overlay.classList.toggle('hidden', !State.data.world.isNight);
    this._buildSVG(); // Rebuild so fence/house reflect upgrade levels
  },

  // ═══════════════════════════════════════════
  // PAUSE
  // ═══════════════════════════════════════════
  togglePause() {
    this._paused ? this._unpause() : this._doPause();
  },

  _doPause() {
    this._paused = true;
    // Stop game timers
    DayNight._paused = true;
    Player._tickPaused = true;
    Raids._checkPaused = true;

    const el = document.createElement('div');
    el.id = 'pause-overlay';
    el.className = 'pause-overlay';
    el.innerHTML = `
      <div class="pause-title">⏸ PAUSED</div>
      <div class="pause-buttons">
        <button class="btn-pixel btn-primary"  id="btn-p-resume">▶ RESUME</button>
        <button class="btn-pixel btn-secondary" id="btn-p-save">💾 SAVE GAME</button>
        <button class="btn-pixel btn-secondary" id="btn-p-audio">🔊 TOGGLE AUDIO</button>
        <button class="btn-pixel btn-danger"    id="btn-p-quit">✕ QUIT TO MENU</button>
      </div>
    `;
    document.body.appendChild(el);
    el.querySelector('#btn-p-resume').onclick = () => this._unpause();
    el.querySelector('#btn-p-save').onclick   = () => { SaveSystem.saveLocal(); Utils.toast('💾 Saved!','good'); };
    el.querySelector('#btn-p-audio').onclick  = () => Audio.toggleMute?.();
    el.querySelector('#btn-p-quit').onclick   = () => { this._unpause(); Audio.stop?.(); Game.goTo('menu'); };
  },

  _unpause() {
    this._paused = false;
    DayNight._paused = false;
    Player._tickPaused = false;
    Raids._checkPaused = false;
    document.getElementById('pause-overlay')?.remove();
  },

  isPaused() { return this._paused; },

  // ── SVG: Greenhouse ────────────────────────
  _svgGreenhouse(cx, cy, level) {
    const w = 52, h = 44;
    const glassCol = level >= 3 ? '#90e0ef' : '#b8d8e8';
    const frameCol = level >= 2 ? '#5a8a40' : '#4a7a30';
    const label = ['🌿 Lv1','🌿 Lv2','🌿 Lv3'][level-1] || '🌿';
    const plants = level >= 2 ?
      '<rect x="' + (cx-16) + '" y="' + (cy-h/2+18) + '" width="6" height="14" fill="#2a7a20" rx="1"/>' +
      '<ellipse cx="' + (cx-13) + '" cy="' + (cy-h/2+16) + '" rx="5" ry="4" fill="#3a9a30"/>' +
      '<rect x="' + (cx+4) + '"  y="' + (cy-h/2+16) + '" width="6" height="16" fill="#2a7a20" rx="1"/>' +
      '<ellipse cx="' + (cx+7) + '"  cy="' + (cy-h/2+13) + '" rx="6" ry="5" fill="#4caf50"/>'
      : '<rect x="' + (cx-8) + '" y="' + (cy-h/2+20) + '" width="5" height="10" fill="#2a6a18" rx="1"/>' +
        '<ellipse cx="' + (cx-5) + '" cy="' + (cy-h/2+18) + '" rx="4" ry="3" fill="#3a8a28"/>';
    return '<g filter="url(#shadow)">' +
      '<rect x="' + (cx-w/2) + '" y="' + (cy-h/2) + '" width="' + w + '" height="' + h + '" fill="' + glassCol + '" opacity="0.3" rx="2"/>' +
      '<rect x="' + (cx-w/2) + '" y="' + (cy-h/2) + '" width="' + w + '" height="' + h + '" fill="none" stroke="' + frameCol + '" stroke-width="3" rx="2"/>' +
      '<polygon points="' + (cx-w/2-4) + ',' + (cy-h/2) + ' ' + (cx+w/2+4) + ',' + (cy-h/2) + ' ' + cx + ',' + (cy-h/2-20) + '" fill="none" stroke="' + frameCol + '" stroke-width="3"/>' +
      '<line x1="' + cx + '" y1="' + (cy-h/2-20) + '" x2="' + cx + '" y2="' + (cy-h/2) + '" stroke="' + frameCol + '" stroke-width="2"/>' +
      '<line x1="' + (cx-w/2) + '" y1="' + (cy-h/2+h*0.4) + '" x2="' + (cx+w/2) + '" y2="' + (cy-h/2+h*0.4) + '" stroke="' + frameCol + '" stroke-width="1.5" opacity="0.5"/>' +
      plants +
      '<ellipse cx="' + cx + '" cy="' + (cy+h/2+4) + '" rx="28" ry="5" fill="rgba(0,0,0,0.2)"/>' +
      '<text x="' + cx + '" y="' + (cy+h/2+42) + '" font-family="Press Start 2P" font-size="22" fill="#9a9a60" text-anchor="middle">' + label + ' GREENHOUSE</text>' +
    '</g>';
  },

  // ── SVG: Crop field ────────────────────────
  _svgField(cx, cy, level) {
    const w = 70, h = 48;
    const plots = typeof Farming !== 'undefined' ? Farming._plotsForLevel(level) : level * 2;
    const fdata = State.data?.farming?.plots || [];
    // Count growing/ready for display
    const readyCnt  = fdata.filter(p=>p.state==='ready').length;
    const growCnt   = fdata.filter(p=>p.state==='growing').length;
    // Show rows based on plot count
    const cols = 5, rows = Math.ceil(Math.min(plots, 10) / cols) || 1;
    let crops = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (idx >= Math.min(plots, 10)) break;
        const px = cx - w/2 + 7 + c * 13;
        const py = cy - h/2 + 10 + r * 16;
        const plot = fdata[idx];
        const isReady   = plot && plot.state === 'ready';
        const isGrowing = plot && plot.state === 'growing';
        const tall = isReady ? 14 : isGrowing ? 10 : 7;
        const col  = isReady ? '#ffd600' : isGrowing ? '#8aba30' : '#5a8a20';
        crops += '<rect x="' + (px-1.5) + '" y="' + (py-tall) + '" width="3" height="' + tall + '" fill="#5a8a20" rx="1"/>';
        crops += '<ellipse cx="' + px + '" cy="' + (py-tall) + '" rx="4" ry="3" fill="' + col + '"/>';
      }
    }
    let badge = '';
    if (readyCnt > 0) badge = '<text x="' + cx + '" y="' + (cy-h/2+7) + '" font-size="16" text-anchor="middle">✨</text>';
    return '<g filter="url(#shadow)">' +
      '<rect x="' + (cx-w/2) + '" y="' + (cy-h/2+6) + '" width="' + w + '" height="' + (h-6) + '" fill="#3a2810" rx="2" opacity="0.7"/>' +
      [0,1,2,3].map(i => '<line x1="' + (cx-w/2+2) + '" y1="' + (cy-h/2+10+i*10) + '" x2="' + (cx+w/2-2) + '" y2="' + (cy-h/2+10+i*10) + '" stroke="#2a1808" stroke-width="1.5" opacity="0.7"/>').join('') +
      crops + badge +
      '<ellipse cx="' + cx + '" cy="' + (cy+h/2+4) + '" rx="36" ry="5" fill="rgba(0,0,0,0.2)"/>' +
      '<text x="' + cx + '" y="' + (cy+h/2+42) + '" font-family="Press Start 2P" font-size="20" fill="#9a9a60" text-anchor="middle">Lv' + level + ' FIELD</text>' +
    '</g>';
  },

  // ── SVG: Build prompt (dashed outline) ───────
  // ── Storage Room — 10 levels ─────────────
  //
  // Lv1  crate pile     Lv6  reinforced brick shed
  // Lv2  wooden lean-to Lv7  climate vault
  // Lv3  locked shed    Lv8  industrial complex
  // Lv4  double shed    Lv9  hardened bunker store
  // Lv5  reinforced shed Lv10 apocalypse warehouse
  //
  _svgStorage(cx, cy, level) {
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
      // Wooden lean-to shed with open front
      const w=46, h=36;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#7a5a30" rx="1"/>
        <polygon points="${cx-w/2-4},${cy-h/2} ${cx+w/2+4},${cy-h/2} ${cx+w/2-4},${cy-h/2-16} ${cx-w/2+4},${cy-h/2-16}" fill="#5a3a18"/>
        <rect x="${cx-w/2+2}" y="${cy-h/2+2}" width="${w-4}" height="${h-4}" fill="#3a2010" rx="1" opacity="0.3"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+12}" x2="${cx+w/2}" y2="${cy-h/2+12}" stroke="#5a3a18" stroke-width="1.5" opacity="0.5"/>
        <!-- Crates visible inside -->
        <rect x="${cx-14}" y="${cy}" width="12" height="10" fill="#8a6a30" rx="1"/>
        <rect x="${cx+2}"  y="${cy+2}" width="12" height="8"  fill="#7a5a28" rx="1"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="28" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 3) {
      // Locked wooden shed with padlock on door
      const w=48, h=40;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#8a6838" rx="1"/>
        <line x1="${cx-16}" y1="${cy-h/2}" x2="${cx-16}" y2="${cy+h/2}" stroke="#6a4a28" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx+0}"  y1="${cy-h/2}" x2="${cx+0}"  y2="${cy+h/2}" stroke="#6a4a28" stroke-width="1.5" opacity="0.5"/>
        <line x1="${cx+16}" y1="${cy-h/2}" x2="${cx+16}" y2="${cy+h/2}" stroke="#6a4a28" stroke-width="1.5" opacity="0.5"/>
        <polygon points="${cx-w/2-4},${cy-h/2} ${cx+w/2+4},${cy-h/2} ${cx+w/2},${cy-h/2-18} ${cx-w/2},${cy-h/2-18}" fill="#5a3818"/>
        <polygon points="${cx-w/2},${cy-h/2-18} ${cx+w/2},${cy-h/2-18} ${cx},${cy-h/2-30}" fill="#7a5028"/>
        <!-- Door -->
        <rect x="${cx-10}" y="${cy+h/2-22}" width="20" height="22" fill="#4a2e10" rx="1"/>
        <!-- Padlock -->
        <rect x="${cx-4}" y="${cy+h/2-14}" width="8" height="7" fill="#b0800a" rx="1"/>
        <path d="M${cx-3},${cy+h/2-14} Q${cx},${cy+h/2-20} ${cx+3},${cy+h/2-14}" fill="none" stroke="#c89a20" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="28" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 4) {
      // Two connected sheds
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
      // Reinforced shed — metal corners + barred window
      const w=54, h=44;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#8a7040" rx="1"/>
        <!-- Metal corner reinforcements -->
        <rect x="${cx-w/2}" y="${cy-h/2}" width="6" height="12" fill="#6a6060" rx="1"/>
        <rect x="${cx+w/2-6}" y="${cy-h/2}" width="6" height="12" fill="#6a6060" rx="1"/>
        <rect x="${cx-w/2}" y="${cy+h/2-12}" width="6" height="12" fill="#6a6060" rx="1"/>
        <rect x="${cx+w/2-6}" y="${cy+h/2-12}" width="6" height="12" fill="#6a6060" rx="1"/>
        <polygon points="${cx-w/2-4},${cy-h/2} ${cx+w/2+4},${cy-h/2} ${cx+w/2},${cy-h/2-18} ${cx-w/2},${cy-h/2-18}" fill="#6a5030"/>
        <polygon points="${cx-w/2},${cy-h/2-18} ${cx+w/2},${cy-h/2-18} ${cx},${cy-h/2-30}" fill="#8a6840"/>
        <!-- Barred window -->
        <rect x="${cx-w/2+8}" y="${cy-h/2+10}" width="14" height="10" fill="#1a2030" rx="1"/>
        <line x1="${cx-w/2+11}" y1="${cy-h/2+10}" x2="${cx-w/2+11}" y2="${cy-h/2+20}" stroke="#6a6060" stroke-width="1.5"/>
        <line x1="${cx-w/2+15}" y1="${cy-h/2+10}" x2="${cx-w/2+15}" y2="${cy-h/2+20}" stroke="#6a6060" stroke-width="1.5"/>
        <!-- Door -->
        <rect x="${cx-8}" y="${cy+h/2-22}" width="16" height="22" fill="#4a3010" rx="1"/>
        <rect x="${cx-6}" y="${cy+h/2-14}" width="6" height="5" fill="#8a7030" rx="1"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="32" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 6) {
      // Brick storage shed — looks like a small warehouse
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
        <!-- Roll-up door -->
        <rect x="${cx-12}" y="${cy+h/2-24}" width="24" height="24" fill="#4a4040" rx="1"/>
        <line x1="${cx-12}" y1="${cy+h/2-18}" x2="${cx+12}" y2="${cy+h/2-18}" stroke="#3a3030" stroke-width="1.5"/>
        <line x1="${cx-12}" y1="${cy+h/2-12}" x2="${cx+12}" y2="${cy+h/2-12}" stroke="#3a3030" stroke-width="1.5"/>
        <line x1="${cx-12}" y1="${cy+h/2-6}"  x2="${cx+12}" y2="${cy+h/2-6}"  stroke="#3a3030" stroke-width="1.5"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="36" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 7) {
      // Climate-controlled vault — steel panels, ventilation units
      const w=64, h=50;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#505060" rx="2"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+h*0.4}" x2="${cx+w/2}" y2="${cy-h/2+h*0.4}" stroke="#404050" stroke-width="2"/>
        <line x1="${cx-14}" y1="${cy-h/2}" x2="${cx-14}" y2="${cy+h/2}" stroke="#404050" stroke-width="1.5"/>
        <line x1="${cx+14}" y1="${cy-h/2}" x2="${cx+14}" y2="${cy+h/2}" stroke="#404050" stroke-width="1.5"/>
        <!-- Flat roof with ventilation box -->
        <rect x="${cx-w/2-4}" y="${cy-h/2-8}" width="${w+8}" height="10" fill="#404050" rx="1"/>
        <rect x="${cx-10}" y="${cy-h/2-16}" width="20" height="10" fill="#3a3a4a" rx="1"/>
        <line x1="${cx-8}" y1="${cy-h/2-14}" x2="${cx+8}" y2="${cy-h/2-14}" stroke="#505060" stroke-width="2"/>
        <!-- Vault door -->
        <rect x="${cx-12}" y="${cy+h/2-28}" width="24" height="28" fill="#3a3a4a" rx="2"/>
        <circle cx="${cx}" cy="${cy+h/2-16}" r="8" fill="#4a4a5a" stroke="#606070" stroke-width="2"/>
        <line x1="${cx}" y1="${cy+h/2-24}" x2="${cx}" y2="${cy+h/2-8}"  stroke="#808090" stroke-width="2"/>
        <line x1="${cx-8}" y1="${cy+h/2-16}" x2="${cx+8}" y2="${cy+h/2-16}" stroke="#808090" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="36" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 8) {
      // Industrial complex — large building, loading dock, pallet stacks
      const w=72, h=54;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#484858" rx="2"/>
        <rect x="${cx-w/2-4}" y="${cy-h/2-10}" width="${w+8}" height="12" fill="#383848" rx="1"/>
        <line x1="${cx-24}" y1="${cy-h/2}" x2="${cx-24}" y2="${cy+h/2}" stroke="#383848" stroke-width="2"/>
        <line x1="${cx+10}" y1="${cy-h/2}" x2="${cx+10}" y2="${cy+h/2}" stroke="#383848" stroke-width="2"/>
        <!-- Loading dock -->
        <rect x="${cx-8}" y="${cy+h/2-18}" width="18" height="18" fill="#2a2a38" rx="1"/>
        <rect x="${cx-8}" y="${cy+h/2-14}" width="18" height="2"  fill="#383848" stroke-width="0"/>
        <rect x="${cx-8}" y="${cy+h/2-10}" width="18" height="2"  fill="#383848"/>
        <rect x="${cx-8}" y="${cy+h/2-6}"  width="18" height="2"  fill="#383848"/>
        <!-- Large window -->
        <rect x="${cx-w/2+6}" y="${cy-h/2+8}" width="16" height="12" fill="#1a2838" rx="1" stroke="#606070" stroke-width="1.5"/>
        <line x1="${cx-w/2+14}" y1="${cy-h/2+8}" x2="${cx-w/2+14}" y2="${cy-h/2+20}" stroke="#505060" stroke-width="1"/>
        <!-- Pallet stacks beside building -->
        <rect x="${cx+w/2+2}" y="${cy-4}" width="10" height="8" fill="#8a6830" rx="1"/>
        <rect x="${cx+w/2+2}" y="${cy-12}" width="10" height="8" fill="#7a5a28" rx="1"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="40" ry="4" fill="rgba(0,0,0,0.2)"/>
      </g>`;
    } else if (lv === 9) {
      // Hardened bunker store — thick concrete, blast door
      const w=74, h=56;
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#5a5a5a" rx="2"/>
        <!-- Angled reinforcement fins -->
        <line x1="${cx-w/2-2}" y1="${cy-h/2-4}" x2="${cx-w/2+10}" y2="${cy+h/2+4}" stroke="#4a4a4a" stroke-width="6"/>
        <line x1="${cx+w/2-8}" y1="${cy-h/2-4}" x2="${cx+w/2+4}" y2="${cy+h/2+4}" stroke="#4a4a4a" stroke-width="6"/>
        <!-- Flat bunker roof -->
        <rect x="${cx-w/2-6}" y="${cy-h/2-10}" width="${w+12}" height="12" fill="#4a4a4a" rx="1"/>
        <!-- Blast door -->
        <rect x="${cx-16}" y="${cy+h/2-32}" width="32" height="32" fill="#3a3a3a" rx="2"/>
        <rect x="${cx-14}" y="${cy+h/2-30}" width="28" height="28" fill="#424242" stroke="#4a4a4a" stroke-width="1.5" rx="1"/>
        <!-- Door wheel lock -->
        <circle cx="${cx}" cy="${cy+h/2-16}" r="10" fill="#3a3a3a" stroke="#606060" stroke-width="2.5"/>
        <line x1="${cx}" y1="${cy+h/2-26}" x2="${cx}" y2="${cy+h/2-6}"  stroke="#707070" stroke-width="2"/>
        <line x1="${cx-10}" y1="${cy+h/2-16}" x2="${cx+10}" y2="${cy+h/2-16}" stroke="#707070" stroke-width="2"/>
        <line x1="${cx-7}" y1="${cy+h/2-23}" x2="${cx+7}" y2="${cy+h/2-9}" stroke="#707070" stroke-width="1.5"/>
        <line x1="${cx+7}" y1="${cy+h/2-23}" x2="${cx-7}" y2="${cy+h/2-9}" stroke="#707070" stroke-width="1.5"/>
        <!-- Air vent -->
        <rect x="${cx-w/2+6}" y="${cy-h/2+6}" width="18" height="10" fill="#383838" rx="1"/>
        <line x1="${cx-w/2+8}"  y1="${cy-h/2+6}" x2="${cx-w/2+8}"  y2="${cy-h/2+16}" stroke="#4a4a4a" stroke-width="2"/>
        <line x1="${cx-w/2+12}" y1="${cy-h/2+6}" x2="${cx-w/2+12}" y2="${cy-h/2+16}" stroke="#4a4a4a" stroke-width="2"/>
        <line x1="${cx-w/2+16}" y1="${cy-h/2+6}" x2="${cx-w/2+16}" y2="${cy-h/2+16}" stroke="#4a4a4a" stroke-width="2"/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="42" ry="4" fill="rgba(0,0,0,0.25)"/>
      </g>`;
    } else {
      // lv 10 — Apocalypse warehouse — massive, glowing, signage
      const w=80, h=60;
      const gE = 'filter="url(#glow-electric)"';
      out = `<g ${sf}>
        <rect x="${cx-w/2}" y="${cy-h/2}" width="${w}" height="${h}" fill="#3a3a4a" rx="2"/>
        <line x1="${cx-w/2}" y1="${cy-h/2+h*0.35}" x2="${cx+w/2}" y2="${cy-h/2+h*0.35}" stroke="#2a2a3a" stroke-width="2"/>
        <line x1="${cx-28}" y1="${cy-h/2}" x2="${cx-28}" y2="${cy+h/2}" stroke="#2a2a3a" stroke-width="1.5"/>
        <line x1="${cx+8}"  y1="${cy-h/2}" x2="${cx+8}"  y2="${cy+h/2}" stroke="#2a2a3a" stroke-width="1.5"/>
        <rect x="${cx-w/2-6}" y="${cy-h/2-10}" width="${w+12}" height="12" fill="#2a2a3a" rx="1"/>
        <!-- Neon sign -->
        <rect x="${cx-w/2+2}" y="${cy-h/2-8}" width="${w-4}" height="11" fill="#08080e" rx="1" stroke="#ffd600" stroke-width="1" ${gE}/>
        <text x="${cx}" y="${cy-h/2+1}"
          font-family="Press Start 2P" font-size="16"
          fill="#ffd600" text-anchor="middle" ${gE}>APOCALYPSE STORE</text>
        <!-- Glowing loading bays -->
        <rect x="${cx-w/2+4}" y="${cy+h/2-26}" width="20" height="26" fill="#2a2a38" rx="1" stroke="#ffd600" stroke-width="1" ${gE}/>
        <rect x="${cx+4}"     y="${cy+h/2-26}" width="20" height="26" fill="#2a2a38" rx="1" stroke="#ffd600" stroke-width="1" ${gE}/>
        <line x1="${cx-w/2+4}" y1="${cy+h/2-18}" x2="${cx-w/2+24}" y2="${cy+h/2-18}" stroke="#3a3a48" stroke-width="1.5"/>
        <line x1="${cx-w/2+4}" y1="${cy+h/2-10}" x2="${cx-w/2+24}" y2="${cy+h/2-10}" stroke="#3a3a48" stroke-width="1.5"/>
        <line x1="${cx+4}" y1="${cy+h/2-18}" x2="${cx+24}" y2="${cy+h/2-18}" stroke="#3a3a48" stroke-width="1.5"/>
        <line x1="${cx+4}" y1="${cy+h/2-10}" x2="${cx+24}" y2="${cy+h/2-10}" stroke="#3a3a48" stroke-width="1.5"/>
        <!-- Forklift symbol (tiny) -->
        <rect x="${cx+w/2-18}" y="${cy-6}" width="14" height="8" fill="#ffd600" rx="1" opacity="0.8" ${gE}/>
        <ellipse cx="${cx}" cy="${cy+h/2+4}" rx="44" ry="4" fill="rgba(0,0,0,0.25)"/>
      </g>`;
    }

    const storeLv = State.data?.base?.buildings?.storage?.level || 1;
    return `<g>
      ${out}
      <text x="${cx}" y="${cy+52}"
        font-family="Press Start 2P" font-size="20"
        fill="${labelCol}" text-anchor="middle">Lv${lv} STORAGE [${capLabels[lv-1]}]</text>
    </g>`;
  },

  // ── Bike — 10 levels ─────────────────────────
  //
  // Lv1  basic frame     Lv6  full panniers + lights
  // Lv2  tires+panniers  Lv7  heavy-duty trailer
  // Lv3  front light     Lv8  night vision lights
  // Lv4  rack + bags     Lv9  armoured crates
  // Lv5  cargo trailer   Lv10 military cargo beast
  //
  _svgBike(cx, cy, level) {
    const lv = Math.max(1, Math.min(10, level || 1));
    const sf = 'filter="url(#shadow)"';
    const gY = 'filter="url(#glow-yellow)"';

    // Frame colour tiers
    const frameCol = lv >= 9 ? '#4a4a5a'  // military dark
                   : lv >= 7 ? '#5a5a6a'  // steel grey
                   : lv >= 5 ? '#3a6a3a'  // dark green
                   : lv >= 3 ? '#3a4a7a'  // blue
                   : '#6a4a28';            // rusty brown

    const wheelCol  = lv >= 7 ? '#5a5a5a' : '#3a3a3a';
    const spokeCol  = lv >= 5 ? '#707070' : '#505050';
    const hasLight  = lv >= 3;
    const hasTrailer= lv >= 5;
    const hasBigTrailer = lv >= 7;
    const nightVision = lv >= 8;
    const lightCol  = nightVision ? '#7fffff' : '#ffd600';
    const lightFilt = nightVision ? 'filter="url(#glow-blue)"' : gY;

    let out = `<g ${sf}>`;

    // Trailer (large box behind bike for lv5+)
    if (hasBigTrailer) {
      const tw = lv >= 9 ? 36 : 28, th = lv >= 9 ? 20 : 16;
      const tx = cx - 36 - tw/2;
      const col = lv >= 9 ? '#3a3a4a' : '#5a5a6a';
      out += `<rect x="${tx-tw/2}" y="${cy-th/2}" width="${tw}" height="${th}" fill="${col}" rx="2" stroke="#4a4a5a" stroke-width="1.5"/>`;
      if (lv === 10) {
        out += `<text x="${tx}" y="${cy+4}" font-family="Press Start 2P" font-size="14" fill="#ffd600" text-anchor="middle" ${gY}>CARGO</text>`;
      }
      // Trailer hitch
      out += `<line x1="${tx+tw/2}" y1="${cy}" x2="${cx-22}" y2="${cy}" stroke="#5a5a5a" stroke-width="2"/>`;
      // Trailer wheels
      out += `<circle cx="${tx-tw/2+8}" cy="${cy+th/2+6}" r="6" fill="${wheelCol}" stroke="${spokeCol}" stroke-width="2"/>`;
      out += `<circle cx="${tx+tw/2-8}" cy="${cy+th/2+6}" r="6" fill="${wheelCol}" stroke="${spokeCol}" stroke-width="2"/>`;
    } else if (lv >= 5) {
      // Small trailer
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

    // Main bike frame — stylised side view
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
        // Night vision beam
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

  _svgBuildPrompt(cx, cy, type) {
    const configs = {
      greenhouse:    { w:52, h:44, label:'🌿 BUILD', sub:'GREENHOUSE' },
      field:         { w:60, h:40, label:'🌾 BUILD',  sub:'CROP FIELD' },
      powerhouse:    { w:58, h:60, label:'⚡ BUILD',  sub:'POWER HOUSE' },
      elecbench:     { w:54, h:50, label:'🔬 BUILD',  sub:'ELEC BENCH' },
      radio_tower:   { w:44, h:80, label:'📡 BUILD',  sub:'RADIO TOWER' },
      rain_collector:{ w:50, h:50, label:'🌧️ BUILD',  sub:'RAIN COLL.' },
      solar_station: { w:70, h:44, label:'☀️ BUILD',  sub:'SOLAR STN' },
      watchtower:    { w:36, h:90, label:'🗼 BUILD',  sub:'WATCHTOWER' },
      compost_bin:   { w:44, h:50, label:'♻️ BUILD',  sub:'COMPOST BIN' },
      smokehouse:    { w:56, h:60, label:'🏭 BUILD',  sub:'SMOKEHOUSE' },
      alarm_system:  { w:36, h:60, label:'🔔 BUILD',  sub:'ALARM SYS' },
      medkit_station:{ w:54, h:54, label:'🏥 BUILD',  sub:'MED STATION' },
      bunker:        { w:70, h:40, label:'🏗️ BUILD',  sub:'BUNKER' },
    };
    const cfg = configs[type] || { w:50, h:50, label:'🔨 BUILD', sub: type.replace(/_/g,' ').toUpperCase() };
    const { w, h, label, sub } = cfg;
    return '<g opacity="0.45">' +
      '<rect x="' + (cx-w/2) + '" y="' + (cy-h/2) + '" width="' + w + '" height="' + h +
        '" fill="transparent" stroke="#4a4a2a" stroke-width="2" stroke-dasharray="6,4" rx="3"/>' +
      '<text x="' + cx + '" y="' + cy + '" font-family="Press Start 2P" font-size="22" fill="#4a4a2a" text-anchor="middle">' + label + '</text>' +
      '<text x="' + cx + '" y="' + (cy+10) + '" font-family="Press Start 2P" font-size="5" fill="#3a3a1a" text-anchor="middle">' + sub + '</text>' +
    '</g>';
  },

  // ── SVG: Power House ───────────────────────
  // A squat industrial building with chimney, antenna, glowing windows
  _svgPowerHouse(cx, cy, level, hasPower) {
    const w = 56, h = 50;
    const wallCol  = '#4a4a5a';
    const roofCol  = '#3a3a4a';
    const glowCol  = hasPower ? '#ffd600' : '#3a3a2a';
    const glowFilt = hasPower ? 'filter="url(#glow-electric)"' : '';
    // Generators shown as small boxes on the roof, one per level tier
    const genCount  = Math.min(level, 4);
    let rooftop = '';
    for (let i = 0; i < genCount; i++) {
      const gx = cx - w/2 + 8 + i * 14;
      const gy = cy - h/2 - 6;
      rooftop += '<rect x="' + gx + '" y="' + gy + '" width="10" height="8" fill="#5a5a6a" rx="1"/>';
      if (hasPower) rooftop += '<rect x="' + (gx+3) + '" y="' + (gy+2) + '" width="4" height="2" fill="#ffd600" ' + glowFilt + '/>';
    }
    // Antenna on top right
    const antX = cx + w/2 - 8;
    // Power indicator arc
    const arc = hasPower
      ? '<path d="M' + (cx-12) + ',' + (cy-8) + ' Q' + cx + ',' + (cy-22) + ' ' + (cx+12) + ',' + (cy-8) + '" fill="none" stroke="#ffd600" stroke-width="2" opacity="0.8" ' + glowFilt + '/>'
      : '';
    return '<g filter="url(#shadow)">' +
      // Building body
      '<rect x="' + (cx-w/2) + '" y="' + (cy-h/2) + '" width="' + w + '" height="' + h + '" fill="' + wallCol + '" rx="2"/>' +
      // Flat roof lip
      '<rect x="' + (cx-w/2-2) + '" y="' + (cy-h/2-4) + '" width="' + (w+4) + '" height="6" fill="' + roofCol + '" rx="1"/>' +
      rooftop +
      // Antenna
      '<line x1="' + antX + '" y1="' + (cy-h/2-4) + '" x2="' + antX + '" y2="' + (cy-h/2-22) + '" stroke="#707080" stroke-width="2"/>' +
      '<circle cx="' + antX + '" cy="' + (cy-h/2-22) + '" r="3" fill="' + (hasPower ? '#ff4444' : '#444') + '" ' + (hasPower ? glowFilt : '') + '/>' +
      // Windows (glowing when powered)
      '<rect x="' + (cx-w/2+8) + '"  y="' + (cy-4) + '" width="14" height="10" fill="' + glowCol + '" rx="1" ' + glowFilt + '/>' +
      '<rect x="' + (cx+w/2-22) + '" y="' + (cy-4) + '" width="14" height="10" fill="' + glowCol + '" rx="1" ' + glowFilt + '/>' +
      // Door
      '<rect x="' + (cx-8) + '" y="' + (cy+h/2-18) + '" width="16" height="18" fill="#2a2a38" rx="1"/>' +
      '<circle cx="' + (cx+5) + '" cy="' + (cy+h/2-9) + '" r="2" fill="#8a8aaa"/>' +
      arc +
      // Level label
      '<ellipse cx="' + cx + '" cy="' + (cy+h/2+5) + '" rx="30" ry="5" fill="rgba(0,0,0,0.25)"/>' +
      '<text x="' + cx + '" y="' + (cy+h/2+44) + '" font-family="Press Start 2P" font-size="22" fill="' + (hasPower ? '#ffd600' : '#7a7a7a') + '" text-anchor="middle">' + (hasPower ? '⚡ POWER Lv' + level : 'NO POWER') + '</text>' +
    '</g>';
  },

  // ── SVG: Electric Bench ────────────────────
  // L-shaped workbench with screens, sparks when powered
  _svgElecBench(cx, cy, level) {
    const w = 52, h = 38;
    const hasPwr = Power.hasPowerForCrafting(1);
    const glowFilt = hasPwr ? 'filter="url(#glow-electric)"' : '';
    const screenCol = hasPwr ? '#29b6f6' : '#1a2a3a';
    const sparkCol  = hasPwr ? '#ffd600' : '#3a3a3a';
    // Cables on floor
    let cables = '';
    for (let i = 0; i < 3; i++) {
      const kx = cx - 14 + i * 14;
      cables += '<path d="M' + kx + ',' + (cy+h/2) + ' Q' + (kx+4) + ',' + (cy+h/2+8) + ' ' + (kx-4) + ',' + (cy+h/2+14) + '" fill="none" stroke="#' + ['29b6f6','ffd600','4caf50'][i] + '" stroke-width="1.5" opacity="0.6"/>';
    }
    return '<g filter="url(#shadow)">' +
      // Bench surface
      '<rect x="' + (cx-w/2) + '" y="' + (cy-h/2) + '" width="' + w + '" height="' + h + '" fill="#3a3a4a" rx="2"/>' +
      // Monitor/screens
      '<rect x="' + (cx-w/2+4) + '" y="' + (cy-h/2+4) + '" width="18" height="14" fill="' + screenCol + '" rx="1" ' + glowFilt + '/>' +
      '<rect x="' + (cx-w/2+25) + '" y="' + (cy-h/2+4) + '" width="12" height="10" fill="' + screenCol + '" rx="1" opacity="0.7" ' + glowFilt + '/>' +
      // Sparks / activity indicators when powered
      (hasPwr ? (
        '<circle cx="' + (cx-w/2+22) + '" cy="' + (cy-h/2+8) + '" r="3" fill="' + sparkCol + '" ' + glowFilt + '/>' +
        '<circle cx="' + (cx+w/2-6) + '" cy="' + (cy-h/2+6) + '" r="2" fill="#4caf50" ' + glowFilt + '/>'
      ) : '') +
      // Tool rack on back wall
      '<rect x="' + (cx-w/2) + '" y="' + (cy-h/2-6) + '" width="' + w + '" height="8" fill="#2a2a38" rx="1"/>' +
      '<rect x="' + (cx-w/2+6) + '"  y="' + (cy-h/2-10) + '" width="4" height="8" fill="#5a5a6a" rx="1"/>' +
      '<rect x="' + (cx-w/2+14) + '" y="' + (cy-h/2-12) + '" width="4" height="10" fill="#5a5a6a" rx="1"/>' +
      '<rect x="' + (cx-w/2+22) + '" y="' + (cy-h/2-9) + '" width="3" height="7" fill="#5a5a6a" rx="1"/>' +
      cables +
      '<ellipse cx="' + cx + '" cy="' + (cy+h/2+6) + '" rx="28" ry="5" fill="rgba(0,0,0,0.2)"/>' +
      '<text x="' + cx + '" y="' + (cy+h/2+44) + '" font-family="Press Start 2P" font-size="22" fill="' + (hasPwr ? '#29b6f6' : '#7a7a7a') + '" text-anchor="middle">⚡ BENCH Lv' + level + '</text>' +
    '</g>';
  },

  // ══════════════════════════════════════════════════════
  // RADIO TOWER — 10 level skins (string concat, no
  // nested template literals)
  //
  // Lv1-2  : Wooden pole + small antenna
  // Lv3-4  : Lattice mast with dish
  // Lv5-6  : Tall guyed mast, rotating array
  // Lv7-8  : Military-grade broadcast tower
  // Lv9-10 : Global array / quantum antenna
  // ══════════════════════════════════════════════════════
  _svgRadioTower(cx, cy, level) {
    const lv = Math.max(1, level || 1);
    let parts = [];

    // Ground shadow always
    parts.push('<ellipse cx="' + cx + '" cy="' + (cy+40) + '" rx="24" ry="5" fill="rgba(0,0,0,0.3)"/>');

    if (lv <= 2) {
      // Lv1: wooden pole, small dipole antenna
      // Base mount
      parts.push('<rect x="' + (cx-8) + '" y="' + (cy+24) + '" width="16" height="16" fill="#4a3a20" rx="2"/>');
      parts.push('<rect x="' + (cx-6) + '" y="' + (cy+22) + '" width="12" height="4" fill="#5a4a28" rx="1"/>');
      // Pole
      parts.push('<rect x="' + (cx-3) + '" y="' + (cy-28) + '" width="6" height="52" fill="#7a6a40" rx="2"/>');
      // Dipole arms
      parts.push('<line x1="' + (cx-20) + '" y1="' + (cy-24) + '" x2="' + (cx+20) + '" y2="' + (cy-24) + '" stroke="#aaa" stroke-width="2"/>');
      parts.push('<line x1="' + (cx-14) + '" y1="' + (cy-18) + '" x2="' + (cx+14) + '" y2="' + (cy-18) + '" stroke="#aaa" stroke-width="1.5"/>');
      // Lv2: add small dish
      if (lv >= 2) {
        parts.push('<ellipse cx="' + (cx+14) + '" cy="' + (cy-10) + '" rx="10" ry="7" fill="none" stroke="#aaa" stroke-width="2"/>');
        parts.push('<line x1="' + (cx+4) + '" y1="' + (cy-10) + '" x2="' + (cx+14) + '" y2="' + (cy-10) + '" stroke="#888" stroke-width="2"/>');
        parts.push('<circle cx="' + (cx+6) + '" cy="' + (cy-28) + '" r="3" fill="#ffd600" opacity="0.6" filter="url(#glow-yellow)"/>');
      }
    } else if (lv <= 4) {
      // Lv3-4: lattice mast + dish
      const h = lv >= 4 ? 72 : 62;
      // Base legs (triangle lattice)
      parts.push('<line x1="' + (cx-10) + '" y1="' + (cy+24) + '" x2="' + (cx-4) + '" y2="' + (cy-h+14) + '" stroke="#8a8a8a" stroke-width="3"/>');
      parts.push('<line x1="' + (cx+10) + '" y1="' + (cy+24) + '" x2="' + (cx+4) + '" y2="' + (cy-h+14) + '" stroke="#8a8a8a" stroke-width="3"/>');
      // Cross braces
      const braceCount = 3;
      for (let i = 0; i < braceCount; i++) {
        const t = (i + 0.5) / (braceCount + 0.5);
        const by = cy + 24 - t * (h + 14);
        const bw = 10 * (1 - t * 0.7);
        parts.push('<line x1="' + (cx-bw) + '" y1="' + by + '" x2="' + (cx+bw) + '" y2="' + by + '" stroke="#666" stroke-width="1.5"/>');
      }
      // Top mast
      parts.push('<rect x="' + (cx-2) + '" y="' + (cy-h-14) + '" width="4" height="28" fill="#9a9a9a" rx="1"/>');
      // Dish
      const dx = cx + (lv >= 4 ? 18 : 14);
      const dy = cy - h * 0.4;
      parts.push('<path d="M' + dx + ',' + (dy-10) + ' Q' + (dx+16) + ',' + dy + ' ' + dx + ',' + (dy+10) + '" fill="none" stroke="#c0c0c0" stroke-width="2.5"/>');
      parts.push('<line x1="' + (cx+4) + '" y1="' + dy + '" x2="' + dx + '" y2="' + dy + '" stroke="#888" stroke-width="2"/>');
      // Signal LED
      parts.push('<circle cx="' + cx + '" cy="' + (cy-h-16) + '" r="4" fill="#ff4444" opacity="0.8" filter="url(#glow-yellow)"/>');
      if (lv >= 4) {
        // Extra side antenna
        parts.push('<line x1="' + cx + '" y1="' + (cy-h-14) + '" x2="' + (cx-16) + '" y2="' + (cy-h-28) + '" stroke="#aaa" stroke-width="1.5"/>');
        parts.push('<circle cx="' + (cx-16) + '" cy="' + (cy-h-28) + '" r="3" fill="#ffd600" opacity="0.7" filter="url(#glow-yellow)"/>');
      }
    } else if (lv <= 6) {
      // Lv5-6: tall guyed mast with rotating array
      const h = lv >= 6 ? 88 : 76;
      // Guy wires
      const guyY = cy + 20;
      parts.push('<line x1="' + (cx-32) + '" y1="' + guyY + '" x2="' + cx + '" y2="' + (cy-h+10) + '" stroke="#666" stroke-width="1.5" stroke-dasharray="3,2"/>');
      parts.push('<line x1="' + (cx+32) + '" y1="' + guyY + '" x2="' + cx + '" y2="' + (cy-h+10) + '" stroke="#666" stroke-width="1.5" stroke-dasharray="3,2"/>');
      // Guy wire anchors
      parts.push('<rect x="' + (cx-35) + '" y="' + (guyY-2) + '" width="8" height="6" fill="#555" rx="1"/>');
      parts.push('<rect x="' + (cx+27) + '" y="' + (guyY-2) + '" width="8" height="6" fill="#555" rx="1"/>');
      // Central tubular mast
      parts.push('<rect x="' + (cx-4) + '" y="' + (cy-h) + '" width="8" height="' + (h+20) + '" fill="#6a6a7a" rx="3"/>');
      parts.push('<rect x="' + (cx-3) + '" y="' + (cy-h) + '" width="3" height="' + (h+20) + '" fill="rgba(255,255,255,0.06)" rx="1"/>');
      // Rotating dish array (2 opposing arms)
      const armLen = lv >= 6 ? 22 : 18;
      parts.push('<line x1="' + (cx-armLen) + '" y1="' + (cy-h*0.5) + '" x2="' + (cx+armLen) + '" y2="' + (cy-h*0.5) + '" stroke="#c0c0c0" stroke-width="3"/>');
      parts.push('<path d="M' + (cx-armLen) + ',' + (cy-h*0.5-8) + ' Q' + (cx-armLen-10) + ',' + (cy-h*0.5) + ' ' + (cx-armLen) + ',' + (cy-h*0.5+8) + '" fill="none" stroke="#ddd" stroke-width="2.5"/>');
      parts.push('<path d="M' + (cx+armLen) + ',' + (cy-h*0.5+8) + ' Q' + (cx+armLen+10) + ',' + (cy-h*0.5) + ' ' + (cx+armLen) + ',' + (cy-h*0.5-8) + '" fill="none" stroke="#ddd" stroke-width="2.5"/>');
      // Top spike
      parts.push('<line x1="' + cx + '" y1="' + (cy-h) + '" x2="' + cx + '" y2="' + (cy-h-18) + '" stroke="#aaa" stroke-width="2"/>');
      parts.push('<circle cx="' + cx + '" cy="' + (cy-h-20) + '" r="5" fill="#ff4444" opacity="0.9" filter="url(#glow-yellow)"/>');
      // Signal rings at lv6
      if (lv >= 6) {
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-20) + '" r="10" fill="none" stroke="#ff4444" stroke-width="1.5" opacity="0.4"/>');
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-20) + '" r="16" fill="none" stroke="#ff4444" stroke-width="1" opacity="0.2"/>');
      }
    } else if (lv <= 8) {
      // Lv7-8: military-grade broadcast tower
      const h = lv >= 8 ? 100 : 90;
      // Wide base structure
      parts.push('<rect x="' + (cx-14) + '" y="' + (cy+12) + '" width="28" height="20" fill="#3a4a3a" rx="2"/>');
      parts.push('<rect x="' + (cx-10) + '" y="' + (cy+6) + '" width="20" height="8" fill="#4a5a4a" rx="1"/>');
      // Main tower legs
      for (let i = 0; i < 4; i++) {
        const lx = cx + (i < 2 ? -(i === 0 ? 12 : 6) : (i === 2 ? 6 : 12));
        const lean = i < 2 ? -(12-i*6) : (i-2)*6;
        parts.push('<line x1="' + lx + '" y1="' + (cy+12) + '" x2="' + (lx+lean) + '" y2="' + (cy-h+20) + '" stroke="#5a6a5a" stroke-width="3"/>');
      }
      // Cross braces (4 levels)
      for (let i = 0; i < 4; i++) {
        const by = cy + 12 - (i+1) * h / 5;
        const bw = 12 - i * 2;
        parts.push('<line x1="' + (cx-bw) + '" y1="' + by + '" x2="' + (cx+bw) + '" y2="' + by + '" stroke="#5a6a5a" stroke-width="2"/>');
      }
      // Central spine
      parts.push('<rect x="' + (cx-3) + '" y="' + (cy-h+20) + '" width="6" height="' + (h-10) + '" fill="#7a8a7a" rx="2"/>');
      // Dish array — 2 opposing
      const dh = cy - h * 0.55;
      parts.push('<line x1="' + (cx-28) + '" y1="' + dh + '" x2="' + (cx+28) + '" y2="' + dh + '" stroke="#9aaa9a" stroke-width="2.5"/>');
      parts.push('<path d="M' + (cx-28) + ',' + (dh-12) + ' Q' + (cx-40) + ',' + dh + ' ' + (cx-28) + ',' + (dh+12) + '" fill="none" stroke="#c0d0c0" stroke-width="2.5"/>');
      parts.push('<path d="M' + (cx+28) + ',' + (dh+12) + ' Q' + (cx+40) + ',' + dh + ' ' + (cx+28) + ',' + (dh-12) + '" fill="none" stroke="#c0d0c0" stroke-width="2.5"/>');
      // Top antenna bundle
      parts.push('<line x1="' + cx + '" y1="' + (cy-h+20) + '" x2="' + cx + '" y2="' + (cy-h-10) + '" stroke="#9a9a9a" stroke-width="3"/>');
      parts.push('<line x1="' + (cx-8) + '" y1="' + (cy-h+20) + '" x2="' + (cx-8) + '" y2="' + (cy-h+4) + '" stroke="#888" stroke-width="2"/>');
      parts.push('<line x1="' + (cx+8) + '" y1="' + (cy-h+20) + '" x2="' + (cx+8) + '" y2="' + (cy-h+4) + '" stroke="#888" stroke-width="2"/>');
      // Beacon top
      parts.push('<circle cx="' + cx + '" cy="' + (cy-h-12) + '" r="6" fill="#ff4444" opacity="0.95" filter="url(#glow-yellow)"/>');
      // Warning stripes on mast
      for (let i = 0; i < 3; i++) {
        const wy = cy - h*0.2 - i*20;
        parts.push('<rect x="' + (cx-3) + '" y="' + wy + '" width="6" height="5" fill="#ff8800" opacity="0.7"/>');
      }
      if (lv >= 8) {
        // Extra signal rings
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-12) + '" r="12" fill="none" stroke="#ff4444" stroke-width="1.5" opacity="0.5"/>');
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-12) + '" r="20" fill="none" stroke="#ff4444" stroke-width="1" opacity="0.3"/>');
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-12) + '" r="30" fill="none" stroke="#ff4444" stroke-width="1" opacity="0.15"/>');
      }
    } else {
      // Lv9-10: global array / quantum antenna
      const h = lv >= 10 ? 110 : 100;
      // Massive base platform
      parts.push('<rect x="' + (cx-20) + '" y="' + (cy+14) + '" width="40" height="24" fill="#2a3a2a" rx="3"/>');
      parts.push('<rect x="' + (cx-16) + '" y="' + (cy+10) + '" width="32" height="6" fill="#3a4a3a" rx="2"/>');
      // 6 outer legs
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2 - Math.PI/6;
        const lx = cx + Math.cos(ang) * 18;
        const ly = cy + Math.sin(ang) * 6 + 22;
        parts.push('<line x1="' + lx + '" y1="' + ly + '" x2="' + (cx + Math.cos(ang) * 4) + '" y2="' + (cy-h+30) + '" stroke="#4a6a4a" stroke-width="2"/>');
      }
      // Reinforced central column
      parts.push('<rect x="' + (cx-5) + '" y="' + (cy-h+30) + '" width="10" height="' + (h-20) + '" fill="#5a7a5a" rx="3"/>');
      parts.push('<rect x="' + (cx-4) + '" y="' + (cy-h+30) + '" width="4" height="' + (h-20) + '" fill="rgba(255,255,255,0.06)" rx="1"/>');
      // Cross braces (5 levels)
      for (let i = 0; i < 5; i++) {
        const by = cy + 20 - i * (h+10) / 5.5;
        const bw = 16 - i * 2.5;
        parts.push('<line x1="' + (cx-bw) + '" y1="' + by + '" x2="' + (cx+bw) + '" y2="' + by + '" stroke="#5a6a5a" stroke-width="2"/>');
        if (i % 2 === 0) {
          parts.push('<line x1="' + (cx-bw) + '" y1="' + by + '" x2="' + cx + '" y2="' + (by - (h/5.5)) + '" stroke="#4a5a4a" stroke-width="1.5"/>');
          parts.push('<line x1="' + (cx+bw) + '" y1="' + by + '" x2="' + cx + '" y2="' + (by - (h/5.5)) + '" stroke="#4a5a4a" stroke-width="1.5"/>');
        }
      }
      // Omnidirectional 4-array dishes
      const aDist = 32;
      const aH = cy - h * 0.5;
      for (let i = 0; i < 4; i++) {
        const ang = i * Math.PI / 2;
        const ax = cx + Math.cos(ang) * aDist;
        const ay = aH + Math.sin(ang) * 8;
        parts.push('<line x1="' + cx + '" y1="' + aH + '" x2="' + ax + '" y2="' + ay + '" stroke="#8aaa8a" stroke-width="2"/>');
        parts.push('<ellipse cx="' + ax + '" cy="' + ay + '" rx="9" ry="7" fill="none" stroke="#a0c0a0" stroke-width="2" transform="rotate(' + (ang*180/Math.PI) + ' ' + ax + ' ' + ay + ')"/>');
      }
      // Top quantum array
      parts.push('<line x1="' + cx + '" y1="' + (cy-h+30) + '" x2="' + cx + '" y2="' + (cy-h-14) + '" stroke="#a0c0a0" stroke-width="3"/>');
      // 3 side spikes at top
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * Math.PI * 2;
        parts.push('<line x1="' + cx + '" y1="' + (cy-h+8) + '" x2="' + (cx + Math.cos(ang) * 16) + '" y2="' + (cy-h+8 + Math.sin(ang)*10) + '" stroke="#8aaa8a" stroke-width="1.5"/>');
        parts.push('<circle cx="' + (cx + Math.cos(ang) * 16) + '" cy="' + (cy-h+8 + Math.sin(ang)*10) + '" r="3" fill="#4caf50" opacity="0.9" filter="url(#glow-yellow)"/>');
      }
      // Main beacon
      parts.push('<circle cx="' + cx + '" cy="' + (cy-h-16) + '" r="7" fill="#ff4444" opacity="1.0" filter="url(#glow-yellow)"/>');
      // Radiating waves
      for (let i = 1; i <= 4; i++) {
        parts.push('<circle cx="' + cx + '" cy="' + (cy-h-16) + '" r="' + (i*12) + '" fill="none" stroke="#4caf50" stroke-width="1" opacity="' + (0.5 - i*0.1) + '"/>');
      }
      if (lv >= 10) {
        // GLOBAL label
        parts.push('<text x="' + cx + '" y="' + (cy-h-42) + '" font-family="Press Start 2P" font-size="5" fill="#4caf50" text-anchor="middle">GLOBAL</text>');
        // Extra outer glow
        parts.push('<ellipse cx="' + cx + '" cy="' + (cy-h*0.4) + '" rx="55" ry="' + (h*0.55) + '" fill="#4caf50" opacity="0.04" filter="url(#glow-yellow)"/>');
      }
    }

    const labelCol = lv >= 9 ? '#4caf50' : lv >= 7 ? '#66bb6a' : lv >= 5 ? '#ff8800' : lv >= 3 ? '#aaa' : '#8a8a6a';
    parts.push('<text x="' + cx + '" y="' + (cy+58) + '" font-family="Press Start 2P" font-size="22" fill="' + labelCol + '" text-anchor="middle">RADIO Lv' + lv + '</text>');
    return '<g filter="url(#shadow)">' + parts.join('') + '</g>';
  },

  _svgRadioTowerScreen(lv) {
    if (!lv || lv === 0) return '<div style="font-size:3rem;text-align:center;padding:16px">📡</div>';
    const mapSvg = this._svgRadioTower(65, 58, lv);
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

  // ══════════════════════════════════════════════════════
  // RAIN COLLECTOR  — 10 level skins
  // Uses string concat (not template literals) to avoid
  // JS parser issues with nested template expressions.
  //
  // Lv1-2  : Wooden barrel(s) with funnel
  // Lv3-4  : Barrel row with roof gutter
  // Lv5-6  : Metal tanks with pump
  // Lv7-8  : Elevated cistern tower
  // Lv9-10 : Full pressurised water plant
  // ══════════════════════════════════════════════════════
  _svgRainCollector(cx, cy, level) {
    const lv = Math.max(1, level || 1);
    let parts = [];

    if (lv <= 2) {
      // Lv1: single barrel  |  Lv2: two barrels
      const count = lv;
      const startX = lv === 1 ? cx : cx - 16;
      for (let i = 0; i < count; i++) {
        const bx = startX + i * 32;
        // shadow
        parts.push('<ellipse cx="' + bx + '" cy="' + (cy+26) + '" rx="13" ry="4" fill="rgba(0,0,0,0.28)"/>');
        // barrel body
        parts.push('<rect x="' + (bx-11) + '" y="' + (cy-8) + '" width="22" height="34" fill="#6a4a1e" rx="3"/>');
        // hoops
        parts.push('<rect x="' + (bx-12) + '" y="' + (cy-1) + '" width="24" height="3" fill="#8a6a2e" rx="1"/>');
        parts.push('<rect x="' + (bx-12) + '" y="' + (cy+12) + '" width="24" height="3" fill="#8a6a2e" rx="1"/>');
        // water fill
        parts.push('<rect x="' + (bx-10) + '" y="' + (cy+10) + '" width="20" height="14" fill="#1a5a8a" rx="1" opacity="0.75"/>');
        // funnel
        parts.push('<polygon points="' + (bx-7) + ',' + (cy-8) + ' ' + (bx+7) + ',' + (cy-8) + ' ' + (bx+4) + ',' + (cy-20) + ' ' + (bx-4) + ',' + (cy-20) + '" fill="#5a5a5a"/>');
        parts.push('<rect x="' + (bx-9) + '" y="' + (cy-23) + '" width="18" height="4" fill="#7a7a7a" rx="1"/>');
      }
      if (lv === 2) {
        // connecting pipe between barrels
        parts.push('<line x1="' + cx + '" y1="' + (cy+8) + '" x2="' + (cx+2) + '" y2="' + (cy+8) + '" stroke="#888" stroke-width="2"/>');
      }
    } else if (lv <= 4) {
      // Lv3-4: barrel row with roof gutter
      const barrels = lv === 3 ? 2 : 3;
      // roof gutter
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
        // downspout from gutter
        parts.push('<rect x="' + (bx-2) + '" y="' + (cy-25) + '" width="4" height="20" fill="#888" rx="1"/>');
      }
      if (lv === 4) {
        // metal band reinforcement
        parts.push('<rect x="' + (cx-36) + '" y="' + (cy-4) + '" width="72" height="3" fill="#aaa" rx="1" opacity="0.6"/>');
      }
    } else if (lv <= 6) {
      // Lv5-6: two metal tanks with pump
      const tw = lv >= 6 ? 26 : 22;
      const th = lv >= 6 ? 44 : 38;
      // left tank
      parts.push('<ellipse cx="' + (cx-20) + '" cy="' + (cy-th/2+5) + '" rx="' + (tw/2) + '" ry="5" fill="#4a6a8a"/>');
      parts.push('<rect x="' + (cx-20-tw/2) + '" y="' + (cy-th/2+5) + '" width="' + tw + '" height="' + (th-8) + '" fill="#3a5a7a" rx="3"/>');
      parts.push('<ellipse cx="' + (cx-20) + '" cy="' + (cy+th/2-3) + '" rx="' + (tw/2) + '" ry="5" fill="#2a4a6a"/>');
      parts.push('<rect x="' + (cx-20-tw/2+3) + '" y="' + (cy-th/2+9) + '" width="4" height="' + (th-16) + '" fill="rgba(255,255,255,0.07)" rx="2"/>');
      // right tank
      parts.push('<ellipse cx="' + (cx+20) + '" cy="' + (cy-th/2+5) + '" rx="' + (tw/2) + '" ry="5" fill="#4a6a8a"/>');
      parts.push('<rect x="' + (cx+20-tw/2) + '" y="' + (cy-th/2+5) + '" width="' + tw + '" height="' + (th-8) + '" fill="#3a5a7a" rx="3"/>');
      parts.push('<ellipse cx="' + (cx+20) + '" cy="' + (cy+th/2-3) + '" rx="' + (tw/2) + '" ry="5" fill="#2a4a6a"/>');
      // connecting pipe
      parts.push('<line x1="' + (cx-20+tw/2) + '" y1="' + (cy+4) + '" x2="' + (cx+20-tw/2) + '" y2="' + (cy+4) + '" stroke="#888" stroke-width="4"/>');
      // centre pump
      parts.push('<rect x="' + (cx-7) + '" y="' + (cy-6) + '" width="14" height="20" fill="#5a5a6a" rx="2"/>');
      parts.push('<rect x="' + (cx-4) + '" y="' + (cy-16) + '" width="8" height="12" fill="#4a4a5a" rx="2"/>');
      if (lv >= 6) {
        parts.push('<circle cx="' + cx + '" cy="' + (cy-18) + '" r="4" fill="#ffd600" opacity="0.7" filter="url(#glow-yellow)"/>');
      }
    } else if (lv <= 8) {
      // Lv7-8: elevated cistern tower
      const h = lv >= 8 ? 56 : 48;
      // four legs
      for (let i = 0; i < 4; i++) {
        const lx = cx - 22 + i * 14;
        const lean = (i < 2) ? 3 : -3;
        parts.push('<line x1="' + lx + '" y1="' + (cy+h/2) + '" x2="' + (lx+lean) + '" y2="' + (cy-h/2+16) + '" stroke="#555" stroke-width="4"/>');
      }
      // cross brace
      parts.push('<line x1="' + (cx-22) + '" y1="' + (cy+4) + '" x2="' + (cx+22) + '" y2="' + (cy+4) + '" stroke="#4a4a5a" stroke-width="2"/>');
      // cistern
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy-h/2+10) + '" rx="28" ry="8" fill="#3a6a9a"/>');
      parts.push('<rect x="' + (cx-28) + '" y="' + (cy-h/2+10) + '" width="56" height="' + (h-24) + '" fill="#2a5a8a" rx="2"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+h/2-14) + '" rx="28" ry="8" fill="#1a4a7a"/>');
      // water level window
      parts.push('<rect x="' + (cx-22) + '" y="' + (cy-h/2+h-36) + '" width="44" height="16" fill="#29b6f6" rx="1" opacity="0.45"/>');
      // overflow pipe
      parts.push('<rect x="' + (cx+28) + '" y="' + (cy-h/2+18) + '" width="6" height="18" fill="#888" rx="1"/>');
      if (lv >= 8) {
        parts.push('<circle cx="' + (cx-28) + '" cy="' + (cy-h/2+20) + '" r="4" fill="#ffd600" opacity="0.6" filter="url(#glow-yellow)"/>');
      }
    } else {
      // Lv9-10: pressurised water plant
      // main large tank
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy-34) + '" rx="34" ry="10" fill="#2a6a9a"/>');
      parts.push('<rect x="' + (cx-34) + '" y="' + (cy-34) + '" width="68" height="52" fill="#1a5a8a" rx="3"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+18) + '" rx="34" ry="10" fill="#1a4a7a"/>');
      // filter tower left
      parts.push('<rect x="' + (cx-52) + '" y="' + (cy-22) + '" width="16" height="30" fill="#3a5a7a" rx="2"/>');
      parts.push('<ellipse cx="' + (cx-44) + '" cy="' + (cy-22) + '" rx="8" ry="5" fill="#4a6a8a"/>');
      // pressure gauge right
      parts.push('<circle cx="' + (cx+42) + '" cy="' + (cy-18) + '" r="8" fill="#3a4a5a" stroke="#aaa" stroke-width="2"/>');
      parts.push('<line x1="' + (cx+42) + '" y1="' + (cy-18) + '" x2="' + (cx+45) + '" y2="' + (cy-25) + '" stroke="#ffd600" stroke-width="2"/>');
      // pipes at bottom
      parts.push('<line x1="' + (cx-28) + '" y1="' + (cy+6) + '" x2="' + (cx-28) + '" y2="' + (cy+26) + '" stroke="#888" stroke-width="4"/>');
      parts.push('<line x1="' + (cx+28) + '" y1="' + (cy+6) + '" x2="' + (cx+28) + '" y2="' + (cy+26) + '" stroke="#888" stroke-width="4"/>');
      parts.push('<line x1="' + (cx-28) + '" y1="' + (cy+26) + '" x2="' + (cx+28) + '" y2="' + (cy+26) + '" stroke="#888" stroke-width="4"/>');
      // water glow
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy-10) + '" rx="30" ry="20" fill="#29b6f6" opacity="0.1" filter="url(#glow-blue)"/>');
      if (lv >= 10) {
        parts.push('<circle cx="' + cx + '" cy="' + (cy-48) + '" r="6" fill="#29b6f6" opacity="0.8" filter="url(#glow-blue)"/>');
      }
    }

    // ground shadow
    parts.push('<ellipse cx="' + cx + '" cy="' + (cy+30) + '" rx="36" ry="6" fill="rgba(0,0,0,0.25)"/>');
    const labelCol = lv >= 9 ? '#29b6f6' : lv >= 5 ? '#4a9abf' : '#6ab0d0';
    parts.push('<text x="' + cx + '" y="' + (cy+50) + '" font-family="Press Start 2P" font-size="22" fill="' + labelCol + '" text-anchor="middle">RAIN Lv' + lv + '</text>');
    return '<g filter="url(#shadow)">' + parts.join('') + '</g>';
  },

  // Small version used in building info screen
  _svgRainCollectorScreen(lv) {
    if (!lv || lv === 0) return '<div style="font-size:3rem;text-align:center;padding:16px">🌧️</div>';
    // Build a scaled-down standalone SVG by calling the map function at a small scale
    const mapSvg = this._svgRainCollector(60, 52, lv);
    return '<svg width="120" height="100" viewBox="0 0 120 100" style="overflow:visible">' +
           '<defs><filter id="s2"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/></filter>' +
           '<filter id="gb2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
           mapSvg.replace('filter="url(#shadow)"', 'filter="url(#s2)"')
                 .replace('filter="url(#glow-blue)"', 'filter="url(#gb2)"')
                 .replace('filter="url(#glow-yellow)"', '')
                 .replace(/font-size="22"/g, 'font-size="8"') +
           '</svg>';
  },

  // ══════════════════════════════════════════════════════
  // SOLAR STATION  — 10 level skins
  //
  // Lv1-2  : Single/double panel on post
  // Lv3-4  : 4-panel array on frame
  // Lv5-6  : Wide tracking array (8 panels)
  // Lv7-8  : Tilt-mounted grid (4x3 panels)
  // Lv9-10 : Full concentrator / micro station
  // ══════════════════════════════════════════════════════
  _svgSolarStation(cx, cy, level) {
    const lv = Math.max(1, level || 1);
    let parts = [];
    const panelDark = '#1a3a6a';
    const panelMid  = '#1e4070';
    const sunYellow = '#ffd600';

    if (lv <= 2) {
      // single tilted panel on a pole
      // pole
      parts.push('<rect x="' + (cx-3) + '" y="' + (cy-2) + '" width="6" height="28" fill="#666" rx="2"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+28) + '" rx="7" ry="2.5" fill="rgba(0,0,0,0.3)"/>');
      // panel (tilted via rotate transform)
      parts.push('<g transform="rotate(-18 ' + cx + ' ' + cy + ')">');
      parts.push('<rect x="' + (cx-15) + '" y="' + (cy-26) + '" width="30" height="22" fill="' + panelDark + '" rx="2"/>');
      // grid lines
      parts.push('<line x1="' + (cx-5) + '" y1="' + (cy-26) + '" x2="' + (cx-5) + '" y2="' + (cy-4) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<line x1="' + (cx+5) + '" y1="' + (cy-26) + '" x2="' + (cx+5) + '" y2="' + (cy-4) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<line x1="' + (cx-15) + '" y1="' + (cy-15) + '" x2="' + (cx+15) + '" y2="' + (cy-15) + '" stroke="#0d1a30" stroke-width="1"/>');
      // reflective sheen
      parts.push('<rect x="' + (cx-14) + '" y="' + (cy-25) + '" width="4" height="20" fill="rgba(255,255,255,0.08)" rx="1"/>');
      parts.push('</g>');
      if (lv >= 2) {
        parts.push('<circle cx="' + (cx+14) + '" cy="' + (cy-28) + '" r="5" fill="' + sunYellow + '" opacity="0.7" filter="url(#glow-yellow)"/>');
      }
    } else if (lv <= 4) {
      // Lv3: 4 panels  |  Lv4: 4 panels + tracker motor
      const pCount = 4;
      const pW = 16, pH = 22, pGap = 4;
      const totalW = pCount * (pW + pGap) - pGap;
      const px0 = cx - totalW / 2;
      // frame bar
      parts.push('<rect x="' + (px0-4) + '" y="' + (cy-2) + '" width="' + (totalW+8) + '" height="5" fill="#555" rx="2"/>');
      // support legs
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
        // tracker motor box
        parts.push('<rect x="' + (cx-8) + '" y="' + (cy+2) + '" width="16" height="10" fill="#444" rx="2"/>');
        parts.push('<circle cx="' + cx + '" cy="' + (cy+7) + '" r="3" fill="#666"/>');
        parts.push('<circle cx="' + (cx+totalW/2+8) + '" cy="' + (cy-14) + '" r="6" fill="' + sunYellow + '" opacity="0.85" filter="url(#glow-yellow)"/>');
      }
    } else if (lv <= 6) {
      // Lv5-6: wide tracking array (8 panels, 2 rows)
      const cols = 4, rows = 2;
      const pW = 14, pH = 10, pgX = 3, pgY = 4;
      const totalW = cols * (pW + pgX) - pgX;
      const totalH = rows * (pH + pgY) - pgY;
      const startX = cx - totalW / 2;
      const startY = cy - totalH / 2 - 8;
      // frame
      parts.push('<rect x="' + (startX-5) + '" y="' + (startY-4) + '" width="' + (totalW+10) + '" height="' + (totalH+8) + '" fill="#3a3a4a" rx="3" opacity="0.5"/>');
      // support posts
      parts.push('<line x1="' + (startX+8) + '" y1="' + (startY+totalH+4) + '" x2="' + (startX-4) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="4"/>');
      parts.push('<line x1="' + (startX+totalW-8) + '" y1="' + (startY+totalH+4) + '" x2="' + (startX+totalW+4) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="4"/>');
      parts.push('<line x1="' + (startX-4) + '" y1="' + (cy+28) + '" x2="' + (startX+totalW+4) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="3"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+30) + '" rx="' + (totalW/2+8) + '" ry="4" fill="rgba(0,0,0,0.25)"/>');
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = startX + c * (pW + pgX);
          const by = startY + r * (pH + pgY);
          parts.push('<rect x="' + bx + '" y="' + by + '" width="' + pW + '" height="' + pH + '" fill="' + panelDark + '" rx="1"/>');
          parts.push('<line x1="' + (bx+pW/2) + '" y1="' + by + '" x2="' + (bx+pW/2) + '" y2="' + (by+pH) + '" stroke="#0d1a30" stroke-width="0.6"/>');
          parts.push('<line x1="' + bx + '" y1="' + (by+pH/2) + '" x2="' + (bx+pW) + '" y2="' + (by+pH/2) + '" stroke="#0d1a30" stroke-width="0.6"/>');
        }
      }
      // glow at lv6
      if (lv >= 6) {
        parts.push('<ellipse cx="' + cx + '" cy="' + (startY+totalH/2) + '" rx="' + (totalW/2) + '" ry="' + (totalH/2) + '" fill="' + sunYellow + '" opacity="0.07" filter="url(#glow-yellow)"/>');
        parts.push('<circle cx="' + (startX+totalW+16) + '" cy="' + (startY-10) + '" r="7" fill="' + sunYellow + '" opacity="0.9" filter="url(#glow-yellow)"/>');
      }
    } else if (lv <= 8) {
      // Lv7-8: large tilt-mounted grid (5 cols x 3 rows)
      const cols = lv >= 8 ? 5 : 4;
      const rows = 3;
      const pW = 13, pH = 9, pgX = 3, pgY = 3;
      const totalW = cols * (pW + pgX) - pgX;
      const totalH = rows * (pH + pgY) - pgY;
      const startX = cx - totalW / 2;
      const startY = cy - totalH / 2 - 6;
      // angled support structure
      parts.push('<line x1="' + (startX-6) + '" y1="' + (startY+totalH+4) + '" x2="' + (startX+8) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="4"/>');
      parts.push('<line x1="' + (startX+totalW+6) + '" y1="' + (startY+totalH+4) + '" x2="' + (startX+totalW-8) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="4"/>');
      parts.push('<line x1="' + (startX+8) + '" y1="' + (cy+28) + '" x2="' + (startX+totalW-8) + '" y2="' + (cy+28) + '" stroke="#555" stroke-width="4"/>');
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+30) + '" rx="' + (totalW/2+6) + '" ry="5" fill="rgba(0,0,0,0.25)"/>');
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bx = startX + c * (pW + pgX);
          const by = startY + r * (pH + pgY);
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
      // Lv9-10: full solar concentrator / micro power station
      // parabolic dish
      parts.push('<path d="M' + (cx-44) + ',' + (cy+14) + ' Q' + cx + ',' + (cy-42) + ' ' + (cx+44) + ',' + (cy+14) + '" fill="none" stroke="#2a5a8a" stroke-width="4"/>');
      // dish fill sections
      parts.push('<path d="M' + (cx-44) + ',' + (cy+14) + ' Q' + (cx-22) + ',' + (cy-14) + ' ' + cx + ',' + (cy-28) + ' L' + cx + ',' + (cy+14) + ' Z" fill="#1a3a5a" opacity="0.9"/>');
      parts.push('<path d="M' + cx + ',' + (cy+14) + ' L' + cx + ',' + (cy-28) + ' Q' + (cx+22) + ',' + (cy-14) + ' ' + (cx+44) + ',' + (cy+14) + ' Z" fill="#1e4468" opacity="0.9"/>');
      // focal receiver
      parts.push('<line x1="' + cx + '" y1="' + (cy-28) + '" x2="' + cx + '" y2="' + (cy-10) + '" stroke="#888" stroke-width="2"/>');
      parts.push('<circle cx="' + cx + '" cy="' + (cy-28) + '" r="7" fill="' + sunYellow + '" filter="url(#glow-yellow)"/>');
      parts.push('<circle cx="' + cx + '" cy="' + (cy-28) + '" r="3" fill="#fff" opacity="0.9"/>');
      // side panel arrays
      parts.push('<rect x="' + (cx-66) + '" y="' + (cy-14) + '" width="18" height="24" fill="' + panelDark + '" rx="2"/>');
      parts.push('<line x1="' + (cx-57) + '" y1="' + (cy-14) + '" x2="' + (cx-57) + '" y2="' + (cy+10) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<line x1="' + (cx-66) + '" y1="' + (cy-2) + '" x2="' + (cx-48) + '" y2="' + (cy-2) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<rect x="' + (cx+48) + '" y="' + (cy-14) + '" width="18" height="24" fill="' + panelDark + '" rx="2"/>');
      parts.push('<line x1="' + (cx+57) + '" y1="' + (cy-14) + '" x2="' + (cx+57) + '" y2="' + (cy+10) + '" stroke="#0d1a30" stroke-width="1"/>');
      parts.push('<line x1="' + (cx+48) + '" y1="' + (cy-2) + '" x2="' + (cx+66) + '" y2="' + (cy-2) + '" stroke="#0d1a30" stroke-width="1"/>');
      // base control unit
      parts.push('<rect x="' + (cx-10) + '" y="' + (cy+10) + '" width="20" height="18" fill="#2a3a4a" rx="2"/>');
      parts.push('<circle cx="' + cx + '" cy="' + (cy+14) + '" r="4" fill="' + sunYellow + '" opacity="0.75" filter="url(#glow-yellow)"/>');
      // ground shadow + field glow
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+30) + '" rx="50" ry="8" fill="rgba(0,0,0,0.28)"/>');
      if (lv >= 10) {
        parts.push('<ellipse cx="' + cx + '" cy="' + (cy-10) + '" rx="56" ry="38" fill="' + sunYellow + '" opacity="0.06" filter="url(#glow-yellow)"/>');
        parts.push('<text x="' + cx + '" y="' + (cy-52) + '" font-family="Press Start 2P" font-size="5" fill="' + sunYellow + '" text-anchor="middle">MICRO STATION</text>');
      }
    }

    // ground shadow
    if (lv < 9) {
      parts.push('<ellipse cx="' + cx + '" cy="' + (cy+30) + '" rx="38" ry="6" fill="rgba(0,0,0,0.25)"/>');
    }
    const labelCol = lv >= 9 ? '#ffd600' : lv >= 5 ? '#ffb300' : '#ffa000';
    parts.push('<text x="' + cx + '" y="' + (cy+50) + '" font-family="Press Start 2P" font-size="22" fill="' + labelCol + '" text-anchor="middle">SOLAR Lv' + lv + '</text>');
    return '<g filter="url(#shadow)">' + parts.join('') + '</g>';
  },

  // Small version for building info screen
  _svgSolarStationScreen(lv) {
    if (!lv || lv === 0) return '<div style="font-size:3rem;text-align:center;padding:16px">☀️</div>';
    const mapSvg = this._svgSolarStation(60, 50, lv);
    return '<svg width="120" height="100" viewBox="0 0 120 100" style="overflow:visible">' +
           '<defs><filter id="s2"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/></filter>' +
           '<filter id="gy2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>' +
           mapSvg.replace('filter="url(#shadow)"', 'filter="url(#s2)"')
                 .replace(/filter="url\(#glow-yellow\)"/g, 'filter="url(#gy2)"')
                 .replace(/font-size="22"/g, 'font-size="8"') +
           '</svg>';
  },

  // ══════════════════════════════════════════════════════════
  //  NEW BUILDING SVGs — Watchtower, Compost, Smokehouse,
  //  Alarm System, Medkit Station, Bunker
  // ══════════════════════════════════════════════════════════

  // ── Watchtower ─────────────────────────────────────────────
  _svgWatchtower(cx, cy, lv) {
    const h = 35 + lv * 12;   // taller each level
    const col = lv >= 3 ? '#6a7a80' : lv >= 2 ? '#7a6a40' : '#7a5a28';
    const roofCol = lv >= 3 ? '#4a5a60' : '#5a4020';
    return '<g filter="url(#shadow)">' +
      // Shadow
      '<ellipse cx="' + cx + '" cy="' + (cy+28) + '" rx="22" ry="5" fill="rgba(0,0,0,0.3)"/>' +
      // Main tower legs (A-frame legs)
      '<line x1="' + (cx-14) + '" y1="' + (cy+24) + '" x2="' + (cx-6) + '" y2="' + (cy-h+8) + '" stroke="#5a4020" stroke-width="6" stroke-linecap="round"/>' +
      '<line x1="' + (cx+14) + '" y1="' + (cy+24) + '" x2="' + (cx+6) + '" y2="' + (cy-h+8) + '" stroke="#5a4020" stroke-width="6" stroke-linecap="round"/>' +
      // Cross-braces
      '<line x1="' + (cx-13) + '" y1="' + (cy+4)  + '" x2="' + (cx+13) + '" y2="' + (cy-4)  + '" stroke="#4a3018" stroke-width="3"/>' +
      '<line x1="' + (cx-10) + '" y1="' + (cy-h+18) + '" x2="' + (cx+10) + '" y2="' + (cy-h+10) + '" stroke="#4a3018" stroke-width="2"/>' +
      // Platform floor
      '<rect x="' + (cx-16) + '" y="' + (cy-h) + '" width="32" height="8" fill="' + col + '" rx="1"/>' +
      // Railing posts
      '<line x1="' + (cx-14) + '" y1="' + (cy-h) + '" x2="' + (cx-14) + '" y2="' + (cy-h-14) + '" stroke="' + col + '" stroke-width="2"/>' +
      '<line x1="' + (cx+14) + '" y1="' + (cy-h) + '" x2="' + (cx+14) + '" y2="' + (cy-h-14) + '" stroke="' + col + '" stroke-width="2"/>' +
      '<line x1="' + (cx-14) + '" y1="' + (cy-h-14) + '" x2="' + (cx+14) + '" y2="' + (cy-h-14) + '" stroke="' + col + '" stroke-width="2"/>' +
      // Roof
      '<polygon points="' + (cx-18) + ',' + (cy-h-10) + ' ' + cx + ',' + (cy-h-32) + ' ' + (cx+18) + ',' + (cy-h-10) + '" fill="' + roofCol + '"/>' +
      // Flag on top
      '<line x1="' + cx + '" y1="' + (cy-h-32) + '" x2="' + cx + '" y2="' + (cy-h-48) + '" stroke="#888" stroke-width="1.5"/>' +
      '<polygon points="' + cx + ',' + (cy-h-48) + ' ' + (cx+12) + ',' + (cy-h-43) + ' ' + cx + ',' + (cy-h-38) + '" fill="#c04020"/>' +
      // Watcher figure (small person on platform)
      (lv >= 1 ? '<circle cx="' + cx + '" cy="' + (cy-h-6) + '" r="4" fill="#8a7060"/>' +
                 '<rect x="' + (cx-3) + '" y="' + (cy-h-2) + '" width="6" height="8" fill="#5a4030" rx="1"/>' : '') +
      // Level label
      '<text x="' + cx + '" y="' + (cy+44) + '" font-family="Press Start 2P" font-size="20" fill="#a0b0a0" text-anchor="middle">Lv' + lv + ' WATCH</text>' +
    '</g>';
  },

  // ── Compost Bin ────────────────────────────────────────────
  _svgCompostBin(cx, cy, lv) {
    const w = 28 + lv * 6;
    return '<g filter="url(#shadow)">' +
      '<ellipse cx="' + cx + '" cy="' + (cy+20) + '" rx="' + (w/2+4) + '" ry="5" fill="rgba(0,0,0,0.25)"/>' +
      // Main barrel body
      '<rect x="' + (cx-w/2) + '" y="' + (cy-20) + '" width="' + w + '" height="36" fill="#4a3018" rx="4"/>' +
      // Wooden slat lines
      '<line x1="' + (cx-w/2+5) + '" y1="' + (cy-20) + '" x2="' + (cx-w/2+5) + '" y2="' + (cy+16) + '" stroke="#3a2210" stroke-width="2" opacity="0.6"/>' +
      '<line x1="' + (cx+w/2-5) + '" y1="' + (cy-20) + '" x2="' + (cx+w/2-5) + '" y2="' + (cy+16) + '" stroke="#3a2210" stroke-width="2" opacity="0.6"/>' +
      // Metal hoops
      '<rect x="' + (cx-w/2) + '" y="' + (cy-16) + '" width="' + w + '" height="4" fill="#5a5040" rx="1"/>' +
      '<rect x="' + (cx-w/2) + '" y="' + (cy+8) + '" width="' + w + '" height="4" fill="#5a5040" rx="1"/>' +
      // Lid (open slightly, showing compost)
      '<ellipse cx="' + cx + '" cy="' + (cy-20) + '" rx="' + (w/2) + '" ry="5" fill="#5a4020"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy-18) + '" rx="' + (w/2-3) + '" ry="4" fill="#3a5010"/>' +
      // Steam/smell lines
      '<path d="M' + (cx-4) + ',' + (cy-24) + ' Q' + (cx-8) + ',' + (cy-32) + ' ' + (cx-4) + ',' + (cy-38) + '" fill="none" stroke="#6a8a30" stroke-width="1.5" opacity="0.6" stroke-dasharray="3,2"/>' +
      '<path d="M' + (cx+4) + ',' + (cy-26) + ' Q' + (cx+8) + ',' + (cy-34) + ' ' + (cx+4) + ',' + (cy-40) + '" fill="none" stroke="#6a8a30" stroke-width="1.5" opacity="0.5" stroke-dasharray="3,2"/>' +
      // Level label
      '<text x="' + cx + '" y="' + (cy+38) + '" font-family="Press Start 2P" font-size="20" fill="#6a8a30" text-anchor="middle">COMPOST' + (lv===2?' Lv2':'') + '</text>' +
    '</g>';
  },

  // ── Smokehouse ─────────────────────────────────────────────
  _svgSmokehouse(cx, cy, lv) {
    const roofH = 22 + lv * 4;
    const wallH = 28 + lv * 4;
    const col   = lv >= 2 ? '#5a4a3a' : '#6a5a48';
    return '<g filter="url(#shadow)">' +
      '<ellipse cx="' + cx + '" cy="' + (cy+26) + '" rx="30" ry="6" fill="rgba(0,0,0,0.3)"/>' +
      // Foundation
      '<rect x="' + (cx-26) + '" y="' + (cy+18) + '" width="52" height="6" fill="#3a2a18" rx="1"/>' +
      // Walls
      '<rect x="' + (cx-24) + '" y="' + (cy-wallH+18) + '" width="48" height="' + wallH + '" fill="' + col + '" rx="2"/>' +
      // Dark wood planks
      '<line x1="' + (cx-24) + '" y1="' + (cy-wallH+28) + '" x2="' + (cx+24) + '" y2="' + (cy-wallH+28) + '" stroke="#3a2a18" stroke-width="2" opacity="0.5"/>' +
      '<line x1="' + (cx-24) + '" y1="' + (cy-wallH+38) + '" x2="' + (cx+24) + '" y2="' + (cy-wallH+38) + '" stroke="#3a2a18" stroke-width="2" opacity="0.5"/>' +
      // Door (small, dark)
      '<rect x="' + (cx-7) + '" y="' + (cy-2+18) + '" width="14" height="20" fill="#2a1a08" rx="1"/>' +
      '<circle cx="' + (cx+4) + '" cy="' + (cy+8+18) + '" r="2" fill="#888"/>' +
      // Roof (peaked)
      '<polygon points="' + (cx-28) + ',' + (cy-wallH+18) + ' ' + cx + ',' + (cy-wallH-roofH+18) + ' ' + (cx+28) + ',' + (cy-wallH+18) + '" fill="#3a2a18"/>' +
      // Chimney
      '<rect x="' + (cx+8) + '" y="' + (cy-wallH-roofH-20+18) + '" width="10" height="' + (roofH+20) + '" fill="#4a3a28" rx="1"/>' +
      // Smoke puffs
      '<circle cx="' + (cx+13) + '" cy="' + (cy-wallH-roofH-24+18) + '" r="5" fill="#888" opacity="0.5"/>' +
      '<circle cx="' + (cx+16) + '" cy="' + (cy-wallH-roofH-34+18) + '" r="7" fill="#777" opacity="0.35"/>' +
      '<circle cx="' + (cx+12) + '" cy="' + (cy-wallH-roofH-46+18) + '" r="9" fill="#666" opacity="0.2"/>' +
      // Level label
      '<text x="' + cx + '" y="' + (cy+46) + '" font-family="Press Start 2P" font-size="20" fill="#9a7a5a" text-anchor="middle">SMOKE Lv' + lv + '</text>' +
    '</g>';
  },

  // ── Alarm System ───────────────────────────────────────────
  _svgAlarmSystem(cx, cy, lv) {
    const active = lv >= 2;  // Lv2 has electric alert system
    const bellCol = active ? '#ffd700' : '#c0a020';
    return '<g filter="url(#shadow)">' +
      '<ellipse cx="' + cx + '" cy="' + (cy+18) + '" rx="18" ry="4" fill="rgba(0,0,0,0.25)"/>' +
      // Post
      '<rect x="' + (cx-3) + '" y="' + (cy-40) + '" width="6" height="56" fill="#5a5040" rx="2"/>' +
      // Base plate
      '<rect x="' + (cx-12) + '" y="' + (cy+14) + '" width="24" height="6" fill="#4a4030" rx="2"/>' +
      // Bell housing
      '<ellipse cx="' + cx + '" cy="' + (cy-30) + '" rx="14" ry="10" fill="' + bellCol + '"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy-36) + '" rx="14" ry="8" fill="' + bellCol + '"/>' +
      '<path d="M' + (cx-14) + ',' + (cy-30) + ' Q' + (cx-18) + ',' + (cy-22) + ' ' + (cx-10) + ',' + (cy-20) + ' Q' + cx + ',' + (cy-18) + ' Q' + (cx+10) + ',' + (cy-20) + ' Q' + (cx+18) + ',' + (cy-22) + ' ' + (cx+14) + ',' + (cy-30) + '" fill="' + bellCol + '"/>' +
      // Bell clapper
      '<circle cx="' + cx + '" cy="' + (cy-20) + '" r="3" fill="#8a7010"/>' +
      // Electric elements (Lv2+)
      (active ?
        '<rect x="' + (cx-10) + '" y="' + (cy-16) + '" width="20" height="10" fill="#2a3a5a" rx="2"/>' +
        '<circle cx="' + (cx-5) + '" cy="' + (cy-11) + '" r="2" fill="#4040ff" opacity="0.8"/>' +
        '<circle cx="' + (cx+5) + '" cy="' + (cy-11) + '" r="2" fill="#ff4040" opacity="0.8"/>' +
        '<text x="' + cx + '" y="' + (cy-3) + '" font-size="8" text-anchor="middle" fill="#ffd700">⚡</text>' : '') +
      // Trip wires on ground (Lv1+)
      '<line x1="' + (cx-12) + '" y1="' + (cy+15) + '" x2="' + (cx-24) + '" y2="' + (cy+15) + '" stroke="#8a8060" stroke-width="1.5" stroke-dasharray="3,2"/>' +
      '<line x1="' + (cx+12) + '" y1="' + (cy+15) + '" x2="' + (cx+24) + '" y2="' + (cy+15) + '" stroke="#8a8060" stroke-width="1.5" stroke-dasharray="3,2"/>' +
      // Level label
      '<text x="' + cx + '" y="' + (cy+36) + '" font-family="Press Start 2P" font-size="20" fill="' + bellCol + '" text-anchor="middle">ALARM Lv' + lv + '</text>' +
    '</g>';
  },

  // ── Medkit Station ─────────────────────────────────────────
  _svgMedkitStation(cx, cy, lv) {
    const tentW = 40 + lv * 6;
    const tentH = 30 + lv * 4;
    const tentCol = lv >= 3 ? '#e8e8e8' : '#d0d0d0';
    return '<g filter="url(#shadow)">' +
      '<ellipse cx="' + cx + '" cy="' + (cy+18) + '" rx="' + (tentW/2+4) + '" ry="5" fill="rgba(0,0,0,0.25)"/>' +
      // Tent body
      '<polygon points="' + cx + ',' + (cy-tentH) + ' ' + (cx-tentW/2) + ',' + (cy+16) + ' ' + (cx+tentW/2) + ',' + (cy+16) + '" fill="' + tentCol + '"/>' +
      // Tent fabric fold lines
      '<line x1="' + cx + '" y1="' + (cy-tentH) + '" x2="' + (cx-tentW/4) + '" y2="' + (cy+16) + '" stroke="#b0b0b0" stroke-width="1.5" opacity="0.5"/>' +
      '<line x1="' + cx + '" y1="' + (cy-tentH) + '" x2="' + (cx+tentW/4) + '" y2="' + (cy+16) + '" stroke="#b0b0b0" stroke-width="1.5" opacity="0.5"/>' +
      // Red cross on front
      '<rect x="' + (cx-5) + '" y="' + (cy-tentH/2-6) + '" width="10" height="18" fill="#e53935" rx="1"/>' +
      '<rect x="' + (cx-9) + '" y="' + (cy-tentH/2-2) + '" width="18" height="10" fill="#e53935" rx="1"/>' +
      // Tent opening
      '<polygon points="' + cx + ',' + (cy-8) + ' ' + (cx-8) + ',' + (cy+16) + ' ' + (cx+8) + ',' + (cy+16) + '" fill="#2a2a2a"/>' +
      // Tent pole
      '<line x1="' + cx + '" y1="' + (cy-tentH) + '" x2="' + cx + '" y2="' + (cy-tentH-14) + '" stroke="#888" stroke-width="3"/>' +
      '<circle cx="' + cx + '" cy="' + (cy-tentH-14) + '" r="3" fill="#c0c0c0"/>' +
      // Stakes
      '<line x1="' + (cx-tentW/2) + '" y1="' + (cy+16) + '" x2="' + (cx-tentW/2-8) + '" y2="' + (cy+22) + '" stroke="#888" stroke-width="2"/>' +
      '<line x1="' + (cx+tentW/2) + '" y1="' + (cy+16) + '" x2="' + (cx+tentW/2+8) + '" y2="' + (cy+22) + '" stroke="#888" stroke-width="2"/>' +
      // Level label
      '<text x="' + cx + '" y="' + (cy+40) + '" font-family="Press Start 2P" font-size="20" fill="#e53935" text-anchor="middle">MEDKIT Lv' + lv + '</text>' +
    '</g>';
  },

  // ── Bunker ─────────────────────────────────────────────────
  _svgBunker(cx, cy, lv) {
    const w = 52 + lv * 8;
    const armoured = lv >= 2;
    const metalCol = armoured ? '#4a5a6a' : '#5a5a60';
    return '<g filter="url(#shadow)">' +
      '<ellipse cx="' + cx + '" cy="' + (cy+16) + '" rx="' + (w/2+6) + '" ry="6" fill="rgba(0,0,0,0.3)"/>' +
      // Concrete mound
      '<ellipse cx="' + cx + '" cy="' + (cy+8) + '" rx="' + (w/2+8) + '" ry="14" fill="#3a3830"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="' + (w/2+4) + '" ry="12" fill="#454038"/>' +
      // Reinforcement bands
      (armoured ?
        '<ellipse cx="' + cx + '" cy="' + (cy+4) + '" rx="' + (w/2+4) + '" ry="12" fill="none" stroke="#5a6070" stroke-width="3"/>' +
        '<line x1="' + (cx-w/2-4) + '" y1="' + (cy+4) + '" x2="' + (cx+w/2+4) + '" y2="' + (cy+4) + '" stroke="#5a6070" stroke-width="2" opacity="0.5"/>' : '') +
      // Hatch door (the key visual)
      '<ellipse cx="' + cx + '" cy="' + (cy-2) + '" rx="' + (w/2) + '" ry="10" fill="' + metalCol + '"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy-2) + '" rx="' + (w/2-4) + '" ry="7" fill="#3a4050"/>' +
      // Hatch handle
      '<rect x="' + (cx-8) + '" y="' + (cy-6) + '" width="16" height="6" fill="' + metalCol + '" rx="3"/>' +
      '<circle cx="' + cx + '" cy="' + (cy-3) + '" r="3" fill="#7a7a80"/>' +
      // Hatch hinges
      '<rect x="' + (cx-w/2+2) + '" y="' + (cy-5) + '" width="6" height="4" fill="#7a7a80" rx="1"/>' +
      '<rect x="' + (cx+w/2-8) + '" y="' + (cy-5) + '" width="6" height="4" fill="#7a7a80" rx="1"/>' +
      // Ventilation pipes
      '<rect x="' + (cx-w/2+8) + '" y="' + (cy-16) + '" width="6" height="16" fill="#5a5a60" rx="2"/>' +
      '<ellipse cx="' + (cx-w/2+11) + '" cy="' + (cy-16) + '" rx="5" ry="3" fill="#6a6a70"/>' +
      // Armoured version gets extra pipe + antenna
      (armoured ?
        '<rect x="' + (cx+w/2-14) + '" y="' + (cy-20) + '" width="6" height="20" fill="#5a5a60" rx="2"/>' +
        '<ellipse cx="' + (cx+w/2-11) + '" cy="' + (cy-20) + '" rx="5" ry="3" fill="#6a6a70"/>' +
        '<line x1="' + cx + '" y1="' + (cy-10) + '" x2="' + cx + '" y2="' + (cy-30) + '" stroke="#888" stroke-width="2"/>' +
        '<circle cx="' + cx + '" cy="' + (cy-30) + '" r="3" fill="#aaa"/>' : '') +
      // Level label
      '<text x="' + cx + '" y="' + (cy+36) + '" font-family="Press Start 2P" font-size="20" fill="' + metalCol + '" text-anchor="middle">BUNKER Lv' + lv + '</text>' +
    '</g>';
  },


};

// ── PATCH: Power buildings support ────────
// Called by _buildSVG to inject power buildings
// and by _onBuildingClick for powerhouse/elecbench

