// ═══════════════════════════════════════════
// PEDAL OR DIE — buildings/Fence.js
// Everything specific to the Fence / Defences:
//   • Registry entry
//   • Map SVG renderer — 10 levels (rope → concrete fortress)
//   • Gate renderer (south opening)
//   • Yard renderer (dirt ground inside fence)
//   • Building screen visual + stats rows
//   • Navigation handler
// ═══════════════════════════════════════════

const BuildingFence = {

  // ── Registry ──────────────────────────────
  id:     'fence',
  title:  'Defences',
  desc:   'Protect your base from raids. Upgrade for better defence.',
  action: 'upgrades',

  hitW: 60,
  hitH: 60,

  // ── Navigation handler ────────────────────
  onOpen(setFn = null) {
    const s   = State.data;
    const bld = s.base.buildings;
    const lv        = bld.fence?.level || 1;
    const dr        = s.base.defenceRating || 0;
    const daysSince = s.world?.daysSinceLastRaid || 0;

    const visual = `<svg width="130" height="75" viewBox="0 0 130 75">
      ${[8,28,48,68,88,108].map(x=>`
        <rect x="${x}" y="8" width="14" height="50" fill="#4a3018" rx="2"/>
        <polygon points="${x},8 ${x+7},1 ${x+14},8" fill="#5a4020"/>
      `).join('')}
      <rect x="8" y="28" width="114" height="8" fill="#3a2410" rx="1"/>
      <rect x="8" y="42" width="114" height="8" fill="#3a2410" rx="1"/>
      ${lv >= 5 ? '<rect x="8" y="18" width="114" height="4" fill="#8a6a30" rx="1" opacity="0.7"/>' : ''}
      ${lv >= 9 ? '<rect x="8" y="18" width="114" height="4" fill="#ffd600" rx="1" opacity="0.3"/>' : ''}
    </svg>`;

    const statsRows = `
      <div class="bsc-row"><span>Level</span><span>${lv} / 10</span></div>
      <div class="bsc-row"><span>Defence rating</span><span>${dr}</span></div>
      <div class="bsc-row"><span>Days since last raid</span><span>${daysSince}</span></div>
      <div class="bsc-row"><span>Upgrade status</span><span>${lv>=9?'⚡ Electrified':lv>=5?'🪝 Spiked':lv>=3?'🔩 Reinforced':'Basic wood'}</span></div>`;

    setFn?.('🚧 DEFENCES', visual, statsRows);
    return { title: '🚧 DEFENCES', visual, statsRows, actionBtn: '' };
  },

  // ── Yard (dirt ground inside fence) ───────
  yard(fl, ft, fr, fb) {
    const cx = (fl+fr)/2, cy = (ft+fb)/2;
    const fw = fr-fl, fh = fb-ft;
    return `<g>
      <rect x="${fl+10}" y="${ft+10}" width="${fw-20}" height="${fh-20}"
            fill="#2a2214" opacity="0.30" rx="3"/>
      <rect x="${cx-10}" y="${ft+10}" width="20" height="${fh-20}" fill="#3a2e18" opacity="0.35" rx="2"/>
      <rect x="${fl+10}" y="${cy-8}"  width="${fw-20}" height="16"  fill="#3a2e18" opacity="0.35" rx="2"/>
    </g>`;
  },

  // ── Gate (south fence opening) ────────────
  gate(cx, fb, level) {
    const lv = Utils.clamp(level, 1, 10);

    const postCol = lv >= 10 ? '#5a5a5a'
                  : lv >= 9  ? '#3a5868'
                  : lv >= 7  ? '#484858'
                  : lv >= 4  ? '#5a3c18'
                  : '#7a6030';

    const topCol  = lv >= 10 ? '#4a4a4a'
                  : lv >= 9  ? '#29b6f6'
                  : lv >= 7  ? '#606070'
                  : lv >= 4  ? '#7a5228'
                  : '#8a7040';

    const gFilt = lv >= 9 ? 'filter="url(#glow-electric)"' : '';

    let leftPost='', rightPost='';
    const lx=cx-28, rx=cx+20, py=fb-32;

    if (lv >= 10) {
      leftPost  = `<rect x="${lx}" y="${py}" width="14" height="34" fill="${postCol}"/>
        <rect x="${lx-4}" y="${py-6}" width="22" height="8" fill="${topCol}"/>
        <rect x="${lx}" y="${py-14}" width="5" height="8" fill="${topCol}"/>
        <rect x="${lx+9}" y="${py-14}" width="5" height="8" fill="${topCol}"/>`;
      rightPost = `<rect x="${rx}" y="${py}" width="14" height="34" fill="${postCol}"/>
        <rect x="${rx-4}" y="${py-6}" width="22" height="8" fill="${topCol}"/>
        <rect x="${rx}" y="${py-14}" width="5" height="8" fill="${topCol}"/>
        <rect x="${rx+9}" y="${py-14}" width="5" height="8" fill="${topCol}"/>`;
    } else if (lv >= 7) {
      leftPost  = `<rect x="${lx+2}" y="${py}" width="10" height="34" fill="${postCol}" rx="1"/>
        <rect x="${lx}" y="${py-4}" width="14" height="6" fill="${topCol}" rx="1"/>
        <rect x="${lx}" y="${fb-4}" width="14" height="6" fill="${topCol}" rx="1"/>`;
      rightPost = `<rect x="${rx+2}" y="${py}" width="10" height="34" fill="${postCol}" rx="1"/>
        <rect x="${rx}" y="${py-4}" width="14" height="6" fill="${topCol}" rx="1"/>
        <rect x="${rx}" y="${fb-4}" width="14" height="6" fill="${topCol}" rx="1"/>`;
    } else if (lv >= 4) {
      leftPost  = `<rect x="${lx+2}" y="${py}" width="10" height="34" fill="${postCol}" rx="1"/>
        <polygon points="${lx+2},${py} ${lx+12},${py} ${lx+7},${py-12}" fill="${topCol}"/>`;
      rightPost = `<rect x="${rx+2}" y="${py}" width="10" height="34" fill="${postCol}" rx="1"/>
        <polygon points="${rx+2},${py} ${rx+12},${py} ${rx+7},${py-12}" fill="${topCol}"/>`;
    } else {
      leftPost  = `<rect x="${lx+3}" y="${py}" width="8" height="34" fill="${postCol}" rx="1"/>
        <rect x="${lx+2}" y="${py-4}" width="10" height="5" fill="${topCol}" rx="1"/>`;
      rightPost = `<rect x="${rx+3}" y="${py}" width="8" height="34" fill="${postCol}" rx="1"/>
        <rect x="${rx+2}" y="${py-4}" width="10" height="5" fill="${topCol}" rx="1"/>`;
    }

    const gateFill   = lv >= 7 ? '#3a3a4a' : lv >= 4 ? '#5a3c18' : 'transparent';
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

    const arc = lv >= 9
      ? `<path d="M${lx+14},${py} Q${cx},${py-18} ${rx},${py}" fill="none" stroke="${topCol}" stroke-width="2" ${gFilt} opacity="0.8"/>`
      : '';

    return `<g>${leftPost}${rightPost}${panels}${arc}</g>`;
  },

  // ── Map SVG renderer ──────────────────────
  svg(fl, ft, fr, fb, level, dr) {
    const pw     = State.data?.power;
    const hasPwr = level >= 9 && pw && (pw.stored > 0 ||
      (pw.generators?.bike?.level   > 0) ||
      (pw.generators?.woodburner?.level > 0) ||
      (pw.generators?.coal?.level   > 0) ||
      (pw.generators?.solar?.level  > 0));

    const lv = Utils.clamp(level, 1, 10);
    let fenceG = '';

    const spacing = 34;
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

    if (lv === 1) {
      fenceG = `<g opacity="0.4">
        <line x1="${fl}" y1="${ft}" x2="${fr}" y2="${ft}" stroke="#3a3020" stroke-width="1" stroke-dasharray="8,8"/>
        <line x1="${fr}" y1="${ft}" x2="${fr}" y2="${fb}" stroke="#3a3020" stroke-width="1" stroke-dasharray="8,8"/>
        <line x1="${fr}" y1="${fb}" x2="${fl}" y2="${fb}" stroke="#3a3020" stroke-width="1" stroke-dasharray="8,8"/>
        <line x1="${fl}" y1="${fb}" x2="${fl}" y2="${ft}" stroke="#3a3020" stroke-width="1" stroke-dasharray="8,8"/>
      </g>`;

    } else if (lv === 2) {
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
      let poleSVG = '', canSVG = '';
      allPosts(({x,y}) => {
        poleSVG += `<rect x="${x-3}" y="${y-16}" width="6" height="16" fill="#6a4a20" rx="1"/>
          <rect x="${x-4}" y="${y-18}" width="8" height="4" fill="#7a5a28" rx="1"/>`;
      });
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
      let plankSVG = '';
      const makeWoodSide = (x1,y1,x2,y2,horiz) => {
        const d = Math.hypot(x2-x1,y2-y1), n = Math.floor(d/9);
        for (let i=0;i<n;i++) {
          const t=(i+0.5)/n, px=x1+(x2-x1)*t, py=y1+(y2-y1)*t;
          const col=(i%2===0)?'#7a5a30':'#6a4a28';
          if (horiz) plankSVG+=`<rect x="${px-4.5}" y="${py-18}" width="8" height="18" fill="${col}" stroke="#4a3018" stroke-width="0.5"/>`;
          else       plankSVG+=`<rect x="${px-18}" y="${py-4.5}" width="18" height="8" fill="${col}" stroke="#4a3018" stroke-width="0.5" transform="rotate(90,${px},${py})"/>`;
        }
      };
      makeWoodSide(fl,ft,fr,ft,true); makeWoodSide(fr,ft,fr,fb,false);
      makeWoodSide(fr,fb,fl,fb,true); makeWoodSide(fl,fb,fl,ft,false);
      let postSVG = '';
      allPosts(({x,y}) => {
        postSVG+=`<rect x="${x-5}" y="${y-22}" width="10" height="22" fill="#5a3c18" rx="1"/>
          <polygon points="${x-5},${y-22} ${x+5},${y-22} ${x},${y-30}" fill="#7a5a28"/>`;
      });
      fenceG = `<g>${plankSVG}${postSVG}</g>`;

    } else if (lv === 5) {
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
      let plankSVG='', postSVG='', wireSVG='';
      const makeWS=(x1,y1,x2,y2,h2)=>{
        const d=Math.hypot(x2-x1,y2-y1),n=Math.floor(d/9);
        for(let i=0;i<n;i++){
          const t=(i+0.5)/n,px=x1+(x2-x1)*t,py=y1+(y2-y1)*t;
          const col=(i%2===0)?'#7a5a30':'#6a4a28';
          if(h2) plankSVG+=`<rect x="${px-4.5}" y="${py-18}" width="8" height="18" fill="${col}" stroke="#4a3018" stroke-width="0.5"/>`;
          else   plankSVG+=`<rect x="${px-18}" y="${py-4.5}" width="18" height="8" fill="${col}" stroke="#4a3018" stroke-width="0.5" transform="rotate(90,${px},${py})"/>`;
        }
      };
      makeWS(fl,ft,fr,ft,true); makeWS(fr,ft,fr,fb,false);
      makeWS(fr,fb,fl,fb,true); makeWS(fl,fb,fl,ft,false);
      allPosts(({x,y})=>{ postSVG+=`<rect x="${x-5}" y="${y-22}" width="10" height="22" fill="#5a3c18" rx="1"/><polygon points="${x-5},${y-22} ${x+5},${y-22} ${x},${y-30}" fill="#7a5a28"/>`;});
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
      let panelSVG='', postSVG='', topWire='';
      const mCol='#5a5a6a', mDark='#4a4a5a', mPost='#484858', bwCol='#707060';
      const makeMS=(x1,y1,x2,y2,h2)=>{
        const d=Math.hypot(x2-x1,y2-y1),n=Math.floor(d/36)+1;
        for(let i=0;i<n;i++){
          const t=i/n,t2=(i+1)/n,ax=x1+(x2-x1)*t,ay=y1+(y2-y1)*t,bx=x1+(x2-x1)*t2,by=y1+(y2-y1)*t2;
          if(h2){panelSVG+=`<rect x="${ax+1}" y="${ay-20}" width="${Math.abs(bx-ax)-2}" height="20" fill="${mCol}" stroke="${mDark}" stroke-width="1"/>
            <line x1="${ax+1}" y1="${ay-13}" x2="${bx-1}" y2="${ay-13}" stroke="${mDark}" stroke-width="1" opacity="0.5"/>`;
          } else {panelSVG+=`<rect x="${ax-20}" y="${ay+1}" width="20" height="${Math.abs(by-ay)-2}" fill="${mCol}" stroke="${mDark}" stroke-width="1"/>
            <line x1="${ax-13}" y1="${ay+1}" x2="${ax-13}" y2="${by-1}" stroke="${mDark}" stroke-width="1" opacity="0.5"/>`;
          }
        }
      };
      makeMS(fl,ft,fr,ft,true); makeMS(fr,ft,fr,fb,false);
      makeMS(fr,fb,fl,fb,true); makeMS(fl,fb,fl,ft,false);
      allPosts(({x,y})=>{ postSVG+=`<rect x="${x-4}" y="${y-24}" width="8" height="24" fill="${mPost}" rx="1"/><rect x="${x-6}" y="${y-26}" width="12" height="4" fill="#606070" rx="1"/>`;});
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
      const gFilt = hasPwr ? 'filter="url(#glow-electric)"' : '';
      const wireCol = hasPwr ? '#29b6f6' : '#4a6a7a';
      const mCol='#4a5a6a', mDark='#3a4a5a', mPost='#3a4858';
      let panelSVG='', postSVG='', elecSVG='';
      const makeES=(x1,y1,x2,y2,h2)=>{
        const d=Math.hypot(x2-x1,y2-y1),n=Math.floor(d/36)+1;
        for(let i=0;i<n;i++){
          const t=i/n,t2=(i+1)/n,ax=x1+(x2-x1)*t,ay=y1+(y2-y1)*t,bx=x1+(x2-x1)*t2,by=y1+(y2-y1)*t2;
          if(h2) panelSVG+=`<rect x="${ax+1}" y="${ay-22}" width="${Math.abs(bx-ax)-2}" height="22" fill="${mCol}" stroke="${mDark}" stroke-width="1" ${gFilt}/>`;
          else   panelSVG+=`<rect x="${ax-22}" y="${ay+1}" width="22" height="${Math.abs(by-ay)-2}" fill="${mCol}" stroke="${mDark}" stroke-width="1" ${gFilt}/>`;
        }
      };
      makeES(fl,ft,fr,ft,true); makeES(fr,ft,fr,fb,false);
      makeES(fr,fb,fl,fb,true); makeES(fl,fb,fl,ft,false);
      allPosts(({x,y})=>{
        postSVG+=`<rect x="${x-5}" y="${y-26}" width="10" height="26" fill="${mPost}" rx="1"/>
          <rect x="${x-7}" y="${y-28}" width="14" height="5" fill="#506070" rx="1"/>`;
      });
      elecSVG+=`<line x1="${fl}" y1="${ft-26}" x2="${fr}" y2="${ft-26}" stroke="${wireCol}" stroke-width="2.5" ${gFilt}/>
        <line x1="${fr}" y1="${ft-26}" x2="${fr}" y2="${fb-26}" stroke="${wireCol}" stroke-width="2.5" ${gFilt}/>`;
      if(hasPwr){
        [[fl+50,ft-26],[fl+150,ft-26],[fr-50,ft-26],[fr,ft+60],[fl,ft+80]].forEach(([sx,sy])=>{
          elecSVG+=`<text x="${sx}" y="${sy}" font-size="10" ${gFilt} opacity="0.85">⚡</text>`;
        });
      }
      fenceG=`<g>${panelSVG}${postSVG}${elecSVG}</g>`;

    } else {
      // lv 10 — Concrete wall + electrified wire + auto-gun turrets
      const gFilt='filter="url(#glow-electric)"';
      const concreteCol='#5a5a5a', darkCon='#3a3a3a', wireCol='#29b6f6', turretCol='#4a4a4a';
      let wallSVG='', wireSVG='', turretSVG='';
      wallSVG+=`
        <rect x="${fl}" y="${ft-24}" width="${fr-fl}" height="24" fill="${concreteCol}" stroke="${darkCon}" stroke-width="2"/>
        <rect x="${fr-24}" y="${ft}" width="24" height="${fb-ft}" fill="${concreteCol}" stroke="${darkCon}" stroke-width="2"/>
        <rect x="${fl}" y="${fb-24}" width="${fr-fl}" height="24" fill="${concreteCol}" stroke="${darkCon}" stroke-width="2" opacity="0.6"/>
        <rect x="${fl}" y="${ft}" width="24" height="${fb-ft}" fill="${concreteCol}" stroke="${darkCon}" stroke-width="2"/>`;
      for(let bx=fl+30;bx<fr;bx+=30){
        wallSVG+=`<line x1="${bx}" y1="${ft-24}" x2="${bx}" y2="${ft}" stroke="${darkCon}" stroke-width="1" opacity="0.4"/>`;
      }
      for(let bx=fl+8;bx<fr-4;bx+=16){
        wireSVG+=`<ellipse cx="${bx}" cy="${ft+6}" rx="8" ry="4" fill="none" stroke="${wireCol}" stroke-width="2" ${gFilt} opacity="0.8"/>`;
      }
      for(let by=ft+10;by<fb-6;by+=16){
        wireSVG+=`<ellipse cx="${fr+10}" cy="${by}" rx="4" ry="8" fill="none" stroke="${wireCol}" stroke-width="2" ${gFilt} opacity="0.8"/>
          <ellipse cx="${fl-10}" cy="${by}" rx="4" ry="8" fill="none" stroke="${wireCol}" stroke-width="2" ${gFilt} opacity="0.8"/>`;
      }
      [fl+60, fl+(fr-fl)/2, fr-60].forEach(tx=>{
        turretSVG+=`
          <rect x="${tx-12}" y="${ft-44}" width="24" height="18" fill="${turretCol}" rx="2"/>
          <rect x="${tx-8}"  y="${ft-52}" width="16" height="10" fill="#3a3a3a" rx="1"/>
          <line x1="${tx-4}" y1="${ft-46}" x2="${tx-18}" y2="${ft-54}" stroke="#606060" stroke-width="3"/>
          <circle cx="${tx}" cy="${ft-36}" r="5" fill="#2a2a2a" stroke="#555" stroke-width="1.5"/>
          <circle cx="${tx}" cy="${ft-36}" r="2" fill="#e53935" ${gFilt}/>`;
      });
      fenceG=`<g>${wallSVG}${turretSVG}${wireSVG}</g>`;
    }

    const labelNames = [
      'OPEN GROUND','ROPE & POLES','ALARM LINE',
      'WOOD FENCE','SPIKED FENCE','BARBED PERIMETER',
      'METAL FENCE','METAL+WIRE','ELECTRIFIED',
      'CONCRETE FORTRESS',
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

};
