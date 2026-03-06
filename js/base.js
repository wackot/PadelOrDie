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
    dynamo_bike:{ id:'dynamo_bike', title:'Dynamo Bike',    desc:'Pedal to generate electricity and charge your battery.', action:'dynamo_bike' },
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
    BuildingGroundCanvas.draw();
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
    let tapStart  = null;   // { x, y, time } — track tap vs drag
    const TAP_SLOP = 6;     // px movement threshold for tap detection

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
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      const mid = getMidpoint();
      panStart = { panX: this._panX, panY: this._panY, midX: mid.x, midY: mid.y };
      lastPinchDist = getPinchDist();
      // Track tap start for click-vs-drag detection (single pointer only)
      if (Object.keys(ptrs).length === 1) {
        tapStart = { x: e.clientX, y: e.clientY };
      } else {
        tapStart = null;
      }
      // Only prevent default if multi-touch (to allow click events on single touch/mouse)
      if (Object.keys(ptrs).length > 1) e.preventDefault();
    }, { passive: false });

    world.addEventListener('pointermove', e => {
      if (!ptrs[e.pointerId]) return;
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };

      // If single pointer moved beyond slop, cancel tap detection
      if (tapStart && Object.keys(ptrs).length === 1) {
        const dx = e.clientX - tapStart.x, dy = e.clientY - tapStart.y;
        if (Math.sqrt(dx*dx + dy*dy) > TAP_SLOP) tapStart = null;
      }

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
        e.preventDefault();
      } else if (panStart && !tapStart) {
        // Only pan if tap was cancelled (user dragged)
        const mid = getMidpoint();
        this._panX = panStart.panX + (mid.x - panStart.midX);
        this._panY = panStart.panY + (mid.y - panStart.midY);
        e.preventDefault();
      } else if (panStart) {
        // Tap still valid — update pan state silently so we can pan if they hold longer
        const mid = getMidpoint();
        this._panX = panStart.panX + (mid.x - panStart.midX);
        this._panY = panStart.panY + (mid.y - panStart.midY);
      }
      this._applyTransform(inner);
    }, { passive: false });

    const endPtr = e => {
      // If this was a clean tap (no drag), fire click on element under pointer
      if (tapStart && Object.keys(ptrs).length === 1) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const hit = el && (el.closest('[data-bid]') || (el.dataset && el.dataset.bid ? el : null));
        if (hit) {
          const bid = hit.dataset.bid || hit.closest('[data-bid]')?.dataset.bid;
          if (bid) this._onBuildingClick(bid);
        }
      }
      delete ptrs[e.pointerId];
      if (Object.keys(ptrs).length === 0) tapStart = null;
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
    const dbLvl  = State.data?.base?.buildings?.dynamo_bike?.level    || 0;
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

    // Dynamo bike — beside the powerhouse, lower-left
    const dbX    = cx - fw * 0.44;
    const dbY    = cy + fh * 0.10;

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

      ${BuildingFence.svg(fl, ft, fr, fb, fLvl, dr)}
      ${BuildingFence.yard(fl, ft, fr, fb)}

      ${BuildingGroundDecor.svg(cx, cy, fw, fh, hLvl)}

      ${BuildingHouse.svg(houseX, houseY, hLvl)}
      ${BuildingBarn.svg(barnX, barnY)}
      ${BuildingWell.svg(wellX, wellY, wlLvl)}
      ${BuildingWorkbench.svg(wsX, wsY, wsLvl)}
      ${BuildingMapBoard.svg(mapX, mapY)}
      ${BuildingFence.gate(cx, fb, fLvl)}

      <!-- Conditional: greenhouse and field when built -->
      ${ghLvl > 0 ? BuildingGreenhouse.svg(ghX, ghY, ghLvl) : BuildingBuildPrompt.svg(ghX, ghY, 'greenhouse')}
      ${fiLvl > 0 ? BuildingField.svg(fiX, fiY, fiLvl)       : BuildingBuildPrompt.svg(fiX, fiY, 'field')}

      <!-- Power house + electric bench -->
      ${phLvl > 0 ? BuildingPowerHouse.svg(phX, phY, phLvl, hasPwr) : BuildingBuildPrompt.svg(phX, phY, 'powerhouse')}
      ${ebLvl > 0 ? BuildingElecBench.svg(ebX, ebY, ebLvl)           : BuildingBuildPrompt.svg(ebX, ebY, 'elecbench')}

      <!-- Storage room -->
      ${BuildingStorage.svg(stX, stY, stLvl)}

      <!-- Bike rack -->
      ${BuildingBike.svg(bkX, bkY, bkLvl)}

      <!-- Radio tower -->
      ${rtLvl > 0 ? BuildingRadioTower.svg(rtX, rtY, rtLvl) : BuildingBuildPrompt.svg(rtX, rtY, 'radio_tower')}

      <!-- Rain collector and solar station -->
      ${rcLvl > 0 ? BuildingRainCollector.svg(rcX, rcY, rcLvl) : BuildingBuildPrompt.svg(rcX, rcY, 'rain_collector')}
      ${ssLvl > 0 ? BuildingSolarStation.svg(ssX, ssY, ssLvl)  : BuildingBuildPrompt.svg(ssX, ssY, 'solar_station')}

      <!-- Watchtower, compost, smokehouse, alarm, medkit, bunker -->
      ${wtLvl > 0 ? BuildingWatchtower.svg(wtX, wtY, wtLvl)        : BuildingBuildPrompt.svg(wtX, wtY, 'watchtower')}
      ${cbLvl > 0 ? BuildingCompostBin.svg(cbX, cbY, cbLvl)        : BuildingBuildPrompt.svg(cbX, cbY, 'compost_bin')}
      ${shLvl > 0 ? BuildingSmokehouse.svg(shX, shY, shLvl)        : BuildingBuildPrompt.svg(shX, shY, 'smokehouse')}
      ${alLvl > 0 ? BuildingAlarmSystem.svg(alX, alY, alLvl)       : BuildingBuildPrompt.svg(alX, alY, 'alarm_system')}
      ${mkLvl > 0 ? BuildingMedkitStation.svg(mkX, mkY, mkLvl)     : BuildingBuildPrompt.svg(mkX, mkY, 'medkit_station')}
      ${bnLvl > 0 ? BuildingBunker.svg(bnX, bnY, bnLvl)            : BuildingBuildPrompt.svg(bnX, bnY, 'bunker')}

      <!-- Dynamo bike -->
      ${dbLvl > 0 ? DynamoBike.svg(dbX, dbY, dbLvl) : BuildingBuildPrompt.svg(dbX, dbY, 'dynamo_bike')}

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
      ${this._hitZone('dynamo_bike',    dbX,    dbY,    80,  80,  '⚡🚴 DYNAMO Lv' + dbLvl)}
    `;

    // Building clicks handled by pointerup tap detection above
    // (tap = pointerdown + pointerup with <6px movement)
  },

  // ── Ground decorations — evolve per house level ─────────────────────
  // Trees, rocks, path lights, flower borders, fountain
  _hitZone(id, cx, cy, w, h, label) {
    return `<g data-bid="${id}" style="cursor:pointer" aria-label="${label}">
      <rect x="${cx-w/2-10}" y="${cy-h/2-10}" width="${w+20}" height="${h+20}" fill="transparent"/>
    </g>`;
  },

  _onBuildingClick(id) {
    this.goToBuilding(id);
  },

  goToBuilding(id) {
    switch (id) {
      case 'house':       BuildingHouse.onOpen();                                                      break;
      case 'fridge':      BuildingBarn.onOpen();                                                       break;
      case 'well':        BuildingWell.onOpen();                                                       break;
      case 'powerhouse':  Events.emit('navigate', { screen: 'power' }); Events.emit('power:render');   break;
      case 'dynamo_bike': Events.emit('navigate', { screen: 'dynamo-bike' }); Events.emit('dynamo_bike:render'); break;
      case 'table':       Events.emit('navigate', { screen: 'crafting' }); Events.emit('crafting:render'); break;
      case 'map':         Events.emit('navigate', { screen: 'map' }); Events.emit('worldmap:render');  break;
      case 'radio_tower':
      case 'rain_collector':
      case 'solar_station':
        this.renderBuildingScreen(id);
        Events.emit('navigate', { screen: 'bld-' + id });
        break;
      case 'field':
        Events.emit('farming:open');
        break;
      default:
        if (document.getElementById('screen-bld-' + id)) {
          this.renderBuildingScreen(id);
          Events.emit('navigate', { screen: 'bld-' + id });
        }
        break;
    }
  },

  renderBuildingScreen(id) {
    const el = document.getElementById('bld-' + id + '-content');
    if (!el) return;

    const s   = State.data;
    const bld = s.base.buildings;

    // Building-specific screen data — delegated to each building module
    const screenMap = {
      storage:        () => BuildingStorage.onOpen(),
      bike:           () => BuildingBike.onOpen(),
      fence:          () => BuildingFence.onOpen(),
      greenhouse:     () => BuildingGreenhouse.getScreenData(s),
      field:          () => BuildingField.getScreenData(s),
      workshop:       () => BuildingWorkshop.getScreenData(s),
      elecbench:      () => BuildingElecBenchScreen.getScreenData(s),
      radio_tower:    () => BuildingRadioTower.getScreenData(s),
      rain_collector: () => BuildingRainCollector.getScreenData(s),
      solar_station:  () => BuildingSolarStation.getScreenData(s),
      watchtower:     () => BuildingWatchtower.getScreenData(s),
      compost_bin:    () => BuildingCompostBin.getScreenData(s),
      smokehouse:     () => BuildingSmokehouse.getScreenData(s),
      alarm_system:   () => BuildingAlarmSystem.getScreenData(s),
      medkit_station: () => BuildingMedkitStation.getScreenData(s),
      bunker:         () => BuildingBunker.getScreenData(s),
    };

    const fn = screenMap[id];
    if (!fn) return;

    let title = '', visual = '', statsRows = '', actionBtn = '';
    const result = fn();
    if (result) { ({ title, visual, statsRows, actionBtn = '' } = result); }

    const upgKey = id;
    const upg    = BuildingUpgrades?.[upgKey];
    let upgradeSection = '';

    if (upg) {
      const shelterLv = bld.house?.level || 1;
      const reqLv     = upg.unlockReq || 0;
      const isLocked  = reqLv > shelterLv;
      const stKey     = upgKey === 'shelter' ? 'house' : upgKey;
      const curLv     = bld[stKey]?.level || 0;
      const isMax     = curLv >= upg.maxLevel;
      const ab        = s.activeBuild;
      const isBuilding= ab && ab.key === upgKey;
      const otherBld  = ab && ab.key !== upgKey;
      const nextDef   = (!isMax && !isLocked) ? upg.levels[curLv] : null;
      const canAfford = nextDef ? State.canAfford(nextDef.cost) : false;

      const pips = Array.from({length: upg.maxLevel}, (_,i) =>
        `<span class="bsc-pip ${i<curLv?'filled':''}"></span>`).join('');

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
          <button class="bsc-upgrade-btn${canAfford?'':' disabled'}"
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
      <button class="btn-pixel btn-secondary bsc-back" data-goto="base">← BACK TO BASE</button>
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

  showUpgradeConfirm(screenId, upgKey) {
    const upg   = BuildingUpgrades?.[upgKey];
    if (!upg) return;
    const curLv = State.data.base.buildings[upgKey]?.level || 0;
    const next  = upg.levels[curLv];
    if (!next) return;

    const costRows = Object.entries(next.cost)
      .filter(([,v])=>v>0)
      .map(([r,v]) => {
        const have = State.data.inventory[r] || 0;
        const ok   = have >= v;
        const em   = Utils.emojiMap?.[r] || '📦';
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
    Events.emit('crafting:upgrade-building', { upgKey });
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
    BuildingGroundCanvas.draw();
    this._buildSVG();
  },
};// ── PATCH: Power buildings support ────────
// Called by _buildSVG to inject power buildings
// and by _onBuildingClick for powerhouse/elecbench


// Subscribe: any module can emit 'map:changed' instead of calling Base.updateNight() directly
Events.on('map:changed', () => Base.updateNight());

// Subscribe: main.js emits at startup instead of calling Base.init() directly
Events.on('base:init', () => Base.init());
