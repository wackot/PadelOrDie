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
    elecbench:  { id:'elecbench',   title:'Electric Bench', desc:'Craft electrical components and advanced upgrades.',    action:'elecbench'  },
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
    // Fixed world size — container scrolls around it
    canvas.width  = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = 1000, H = 1000;
    const T = 28;

    // Seeded noise so tiles don't flicker on resize
    const noise = (x, y) => {
      let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };

    // Grass tiles
    const grasses = ['#1e2a0e','#243210','#202e0c','#1a2808','#263410'];
    for (let y = 0; y < H; y += T) {
      for (let x = 0; x < W; x += T) {
        ctx.fillStyle = grasses[Math.floor(noise(x/T, y/T) * grasses.length)];
        ctx.fillRect(x, y, T, T);
        // Occasional darker patch
        if (noise(x/T + 0.5, y/T + 0.3) < 0.12) {
          ctx.fillStyle = 'rgba(0,0,0,0.18)';
          ctx.fillRect(x+2, y+2, T-4, T-4);
        }
      }
    }

    // Dirt paths (cross shape through base area)
    const px = W * 0.48, py = H * 0.55;
    ctx.fillStyle = '#3a2e18';
    // Vertical path
    for (let y = 0; y < H; y += T) {
      ctx.fillStyle = noise(99, y/T) < 0.5 ? '#3a2e18' : '#332812';
      ctx.fillRect(px - T, y, T*2, T);
    }
    // Horizontal path
    for (let x = 0; x < W; x += T) {
      ctx.fillStyle = noise(x/T, 88) < 0.5 ? '#3a2e18' : '#332812';
      ctx.fillRect(x, py - T*0.5, T, T*1.5);
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
    const dr     = State.data?.base?.defenceRating || 0;
    const hasPwr= phLvl > 0 && (State.data?.power?.generators?.bike?.level > 0
                              || State.data?.power?.generators?.woodburner?.level > 0
                              || State.data?.power?.generators?.coal?.level > 0
                              || State.data?.power?.generators?.solar?.level > 0);

    svg.setAttribute('viewBox', `0 0 1000 1000`);
    svg.setAttribute('width', '1000');
    svg.setAttribute('height', '1000');

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
      ${this._svgHouse(cx, cy - fh*0.22, hLvl)}
      ${this._svgBarn(cx + fw*0.32, cy + fh*0.04)}
      ${this._svgWell(cx - fw*0.32, cy + fh*0.04, wlLvl)}
      ${this._svgWorkbench(cx + fw*0.12, cy + fh*0.30, wsLvl)}
      ${this._svgMapBoard(cx - fw*0.30, cy - fh*0.30)}
      ${this._svgGate(cx, fb, fLvl)}

      <!-- Conditional: greenhouse and field when built -->
      ${ghLvl > 0 ? this._svgGreenhouse(cx - fw*0.08, cy + fh*0.32, ghLvl) : this._svgBuildPrompt(cx - fw*0.08, cy + fh*0.32, 'greenhouse')}
      ${fiLvl > 0 ? this._svgField(cx + fw*0.34, cy - fh*0.20, fiLvl)       : this._svgBuildPrompt(cx + fw*0.34, cy - fh*0.20, 'field')}

      <!-- Power house + electric bench -->
      ${phLvl > 0 ? this._svgPowerHouse(cx - fw*0.32, cy - fh*0.18, phLvl, hasPwr) : this._svgBuildPrompt(cx - fw*0.32, cy - fh*0.18, 'powerhouse')}
      ${ebLvl > 0 ? this._svgElecBench(cx + fw*0.32, cy - fh*0.28, ebLvl)           : this._svgBuildPrompt(cx + fw*0.32, cy - fh*0.28, 'elecbench')}

      <!-- Storage room — lower-left -->
      ${this._svgStorage(cx - fw*0.20, cy + fh*0.32, stLvl)}

      <!-- Bike rack — lower-right corner -->
      ${this._svgBike(cx + fw*0.44, cy + fh*0.36, bkLvl)}

      <!-- Hit zones — transparent large tap areas -->
      ${this._hitZone('house',       cx,              cy - fh*0.22,  90, 100, 'SHELTER')}
      ${this._hitZone('fridge',      cx + fw*0.32,    cy + fh*0.04,  70, 80,  'FOOD STORE')}
      ${this._hitZone('well',        cx - fw*0.32,    cy + fh*0.04,  70, 80,  'WELL')}
      ${this._hitZone('table',       cx + fw*0.12,    cy + fh*0.30,  70, 70,  'CRAFTING')}
      ${this._hitZone('map',         cx - fw*0.30,    cy - fh*0.30,  70, 70,  'WORLD MAP')}
      ${this._hitZone('fence',       cx,              ft + 10,       120, 36, 'DEFENCES (' + dr + ')')}
      ${this._hitZone('greenhouse',  cx - fw*0.08,    cy + fh*0.32,  70, 80, 'GREENHOUSE')}
      ${this._hitZone('field',       cx + fw*0.34,    cy - fh*0.20,  80, 70, 'CROP FIELD')}
      ${this._hitZone('powerhouse',  cx - fw*0.32,    cy - fh*0.18,  70, 80, '⚡ POWER HOUSE')}
      ${this._hitZone('elecbench',   cx + fw*0.32,    cy - fh*0.28,  70, 70, '🔬 ELEC BENCH')}
      ${this._hitZone('storage',     cx - fw*0.20,    cy + fh*0.32,  80, 80, '🗃️ STORAGE Lv' + stLvl)}
      ${this._hitZone('bike',        cx + fw*0.44,    cy + fh*0.36,  70, 80, '🚴 BIKE Lv' + bkLvl)}
    `;

    // Bind touch + click on hit zones
    svg.querySelectorAll('[data-bid]').forEach(el => {
      const id = el.dataset.bid;
      const handler = (e) => { e.preventDefault(); e.stopPropagation(); this._onBuildingClick(id); };
      el.addEventListener('click',    handler);
      el.addEventListener('touchend', handler, { passive: false });
    });
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

  // ── Building tapped ───────────────────────
  _onBuildingClick(id) {
    const b = this.buildings[id];
    if (!b) return;

    // Dynamic descriptions for upgradeable buildings
    if (id === 'fence') {
      b.desc = `Defence: ${State.data.base.defenceRating}. Upgrade in Crafting → Upgrades.`;
    } else if (id === 'storage') {
      const stLvl  = State.data.base.buildings?.storage?.level || 1;
      const capA   = State.data.base.storageCapA || 50;
      const capB   = State.data.base.storageCapB || 0;
      const capC   = State.data.base.storageCapC || 0;
      const capD   = State.data.base.storageCapD || 0;
      const tierBStr = capB > 0 ? ` | Tier B: ${capB}` : ' | Tier B: LOCKED (Lv3)';
      const tierCStr = capC > 0 ? ` | Tier C: ${capC}` : ' | Tier C: LOCKED (Lv5)';
      const tierDStr = capD > 0 ? ` | Tier D: ${capD}` : ' | Tier D: LOCKED (Lv8)';
      b.desc = `Lv${stLvl} — Max per resource: Basics: ${capA}${tierBStr}${tierCStr}${tierDStr}. Upgrade in Crafting.`;
    } else if (id === 'bike') {
      const bkLvl   = State.data.base.buildings?.bike?.level || 1;
      const carry   = 20 + bkLvl * 13;
      const hasLt   = State.data.base.bikeHasLight ? '💡 Light mounted' : '🌑 No light (Lv3 unlocks)';
      const nMult   = State.data.base.bikeNightMult || 1.0;
      const nightStr= State.data.base.bikeHasLight ? ` Night rewards ×${nMult.toFixed(1)}` : '';
      b.desc = `Lv${bkLvl} — Carry cap: ${carry}. ${hasLt}.${nightStr} Upgrade in Crafting.`;
    } else if (id === 'powerhouse') {
      const phLvl = State.data.base.buildings.powerhouse?.level || 0;
      if (phLvl === 0) {
        b.desc = 'No power house yet. Build it in Crafting → Upgrades.';
      } else {
        const gen = Power.getGenerationRate();
        const stor = Math.round(Power.getStored());
        const max  = Power.getMaxStorage();
        b.desc = `⚡ ${gen}W generating. 🔋 ${stor}/${max} Wh stored. Tap to manage.`;
      }
    } else if (id === 'elecbench') {
      const ebLvl = State.data.base.buildings.elecbench?.level || 0;
      b.desc = ebLvl === 0
        ? 'Not built. Craft the Electric Bench at the Crafting Table.'
        : Power.hasPowerForCrafting(1)
          ? '⚡ Powered! Craft electrical components and upgrades.'
          : '🔌 No power. Build a generator first.';
    } else if (id === 'well') {
      const wlLvl = State.data.base.buildings.well?.level || 1;
      const wpd   = State.data.base.waterPerDraw || 5;
      const pw    = State.data.base.wellPassiveWater || 0;
      const passStr = pw > 0 ? ` +${pw} water/day passively.` : '';
      b.desc = `Lv${wlLvl} — Draws ${wpd} water per use.${passStr} Upgrade in Crafting → Upgrades.`;
    } else if (id === 'workshop') {
      const wsLvl = State.data.base.buildings.workshop?.level || 0;
      if (wsLvl === 0) {
        b.desc = 'Not built. Unlock at Shelter Lv5, then build in Crafting → Upgrades.';
      } else {
        const disc  = Math.round((1 - (State.data.base.craftCostMult || 1)) * 100);
        const bike  = Math.round(((State.data.base.bikeEfficiency || 1) - 1) * 100);
        b.desc = `Lv${wsLvl} — Crafting costs -${disc}%. Bike efficiency +${bike}%. Upgrade in Crafting.`;
      }
    }

    document.getElementById('tooltip-title').textContent = b.title;
    document.getElementById('tooltip-desc').textContent  = b.desc;
    const btn = document.getElementById('tooltip-action');
    btn.textContent = 'ENTER';
    btn.onclick = () => this._enterBuilding(b.action);
    Utils.show('building-tooltip');
  },

  _bindTooltip() {
    document.getElementById('base-world')?.addEventListener('click', e => {
      if (!e.target.closest('[data-bid]') && !e.target.closest('#building-tooltip')) {
        Utils.hide('building-tooltip');
      }
    });
  },

  _enterBuilding(action) {
    Utils.hide('building-tooltip');
    switch (action) {
      case 'shelter':   Game.goTo('shelter'); break;
      case 'fridge':    Player.renderFridge(); Game.goTo('fridge'); break;
      case 'well':
        document.getElementById('well-water-count').textContent = State.data.inventory.water;
        Game.goTo('well'); break;
      case 'crafting':  Game.goTo('crafting'); Crafting.render(); break;
      case 'map':       Game.goTo('map'); WorldMap.render(); break;
      case 'defence':
      case 'upgrades':  Game.goTo('crafting'); Crafting.render();
        setTimeout(() => Crafting._switchTab?.('upgrades'), 120); break;
      case 'power':
        Game.goTo('power');
        Power.renderPanel();
        break;
      case 'elecbench':
        // If not built, go to upgrades. If built, go to electric crafting.
        if ((State.data.base.buildings.elecbench?.level || 0) === 0) {
          Game.goTo('crafting'); Crafting.render();
          setTimeout(() => Crafting._switchTab?.('craft'), 120);
          Utils.toast('🔬 Build the Electric Bench first! Crafting → Base → Electric Bench', 'warn', 4000);
        } else {
          Game.goTo('crafting'); Crafting.render();
          setTimeout(() => { Crafting._selectCat?.('electric'); Crafting._switchTab?.('craft'); }, 120);
        }
        break;
    }
  },

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
    const w = 60, h = 40;
    const rows = level >= 2 ? 3 : 2;
    let crops = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 5; c++) {
        const px = cx - w/2 + 6 + c * 12;
        const py = cy - h/2 + 10 + r * 12;
        const tall = level >= 3 ? 14 : level >= 2 ? 10 : 7;
        crops += '<rect x="' + (px-1.5) + '" y="' + (py-tall) + '" width="3" height="' + tall + '" fill="#5a8a20" rx="1"/>';
        crops += '<ellipse cx="' + px + '" cy="' + (py-tall) + '" rx="4" ry="3" fill="' + (level>=3 ? '#ffd600':'#8aba30') + '"/>';
      }
    }
    return '<g filter="url(#shadow)">' +
      '<rect x="' + (cx-w/2) + '" y="' + (cy-h/2+8) + '" width="' + w + '" height="' + (h-8) + '" fill="#3a2810" rx="2" opacity="0.6"/>' +
      // Furrows
      [0,1,2,3].map(i => '<line x1="' + (cx-w/2+2) + '" y1="' + (cy-h/2+12+i*8) + '" x2="' + (cx+w/2-2) + '" y2="' + (cy-h/2+12+i*8) + '" stroke="#2a1808" stroke-width="2" opacity="0.7"/>').join('') +
      crops +
      '<ellipse cx="' + cx + '" cy="' + (cy+h/2+4) + '" rx="32" ry="5" fill="rgba(0,0,0,0.2)"/>' +
      '<text x="' + cx + '" y="' + (cy+h/2+42) + '" font-family="Press Start 2P" font-size="22" fill="#9a9a60" text-anchor="middle">Lv' + level + ' CROP FIELD</text>' +
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
      greenhouse: { w:52, h:44, label:'🌿 BUILD', sub:'GREENHOUSE' },
      field:      { w:60, h:40, label:'🌾 BUILD',  sub:'CROP FIELD' },
      powerhouse: { w:58, h:60, label:'⚡ BUILD',  sub:'POWER HOUSE' },
      elecbench:  { w:54, h:50, label:'🔬 BUILD',  sub:'ELEC BENCH' },
    };
    const { w, h, label, sub } = configs[type] || configs.greenhouse;
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
  }
};

// ── PATCH: Power buildings support ────────
// Called by _buildSVG to inject power buildings
// and by _onBuildingClick for powerhouse/elecbench

