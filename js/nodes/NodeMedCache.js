// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — NodeMedCache.js
// 💊 Medicine resource node — ruined hospital / pharmacy
// Exclusive monster: INFECTED ORDERLY (raging infected survivor)
// ═══════════════════════════════════════════════════════════════

NodeRegistry.register({
  keys: ['medicine'],

  exclusiveMonster: {
    id: 'infected_orderly',
    name: 'Infected Orderly',
    emoji: '🧟',
    baseStrength: 28,
    strength: 28,
    loot: ['medicine', 'cloth', 'antiseptic'],
    desc: 'Once a caregiver — now a screaming plague vector in a rotting coat.',
  },

  sceneHTML(loc, isNight) {
    const sky = isNight ? '#04020a' : '#0d0814';
    return `
      <div class="node-scene node-medcache" style="
        position:absolute;inset:0;overflow:hidden;
        background:linear-gradient(180deg,${sky} 0%,#0a0610 55%,#060408 100%);">

        <!-- Hospital building silhouette -->
        ${_mcBuilding(isNight)}

        <!-- Broken red cross signs -->
        ${_mcCrosses(isNight)}

        <!-- Scattered pill bottles on ground -->
        ${_mcPills(isNight)}

        <!-- Emergency light strobing (red) -->
        <div style="position:absolute;top:8%;right:12%;
          width:10px;height:10px;border-radius:50%;
          background:${isNight?'rgba(200,20,20,0.6)':'rgba(180,10,10,0.3)'};
          box-shadow:0 0 ${isNight?16:6}px rgba(200,0,0,0.4);
          animation:node-mc-strobe 1.8s ease-in-out infinite;"></div>

        <!-- Ground cracked tiles -->
        ${_mcTiles(isNight)}

        <div style="position:absolute;bottom:0;left:0;right:0;height:20%;
          background:#060408;border-top:1px solid #120810;"></div>

        ${isNight ? '<div style="position:absolute;inset:0;background:rgba(2,1,4,0.5);"></div>' : ''}
      </div>
      <style>
        @keyframes node-mc-strobe {
          0%,100%{opacity:0.4;} 50%{opacity:1;}
        }
        @keyframes node-mc-pill-roll {
          0%,100%{transform:rotate(0deg);} 50%{transform:rotate(10deg);}
        }
      </style>
    `;
  },

  arenaHTML(loc, animal, isNight) {
    return `
      <div style="position:absolute;inset:0;overflow:hidden;background:#060408;">
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          <!-- Hospital corridor walls -->
          <rect x="0" y="0" width="8%" height="100%" fill="#08060c" opacity="0.9"/>
          <rect x="92%" y="0" width="8%" height="100%" fill="#08060c" opacity="0.9"/>
          <!-- Ceiling fluorescent tubes (flickering implied) -->
          <rect x="10%" y="2%" width="35%" height="2%" fill="rgba(200,180,255,0.04)" rx="1"/>
          <rect x="55%" y="2%" width="35%" height="2%" fill="rgba(200,180,255,0.04)" rx="1"/>
          <!-- Blood stain on floor -->
          <ellipse cx="35%" cy="88%" rx="10%" ry="4%"
            fill="rgba(120,10,10,0.15)"/>
          <!-- Shattered glass reflection -->
          <ellipse cx="50%" cy="90%" rx="38%" ry="6%"
            fill="rgba(30,10,40,0.2)"/>
          <!-- Red cross motif -->
          <rect x="47%" y="10%" width="6%" height="18%" fill="rgba(160,0,0,0.1)"/>
          <rect x="40%" y="16%" width="20%" height="6%" fill="rgba(160,0,0,0.1)"/>
        </svg>
      </div>
    `;
  },

  drawOverlay(ctx, x, y, w, h, seed) {
    const rng = _mcRng(seed);
    // White tile grid (hospital floor) with dark grout
    ctx.fillStyle = `rgba(${10+rng()*8|0},${8+rng()*6|0},${14+rng()*8|0},0.75)`;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(20,14,28,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x+w/2,y); ctx.lineTo(x+w/2,y+h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x,y+h/2); ctx.lineTo(x+w,y+h/2); ctx.stroke();
    // Red cross hint
    if (rng() > 0.6) {
      ctx.fillStyle = 'rgba(140,10,10,0.35)';
      ctx.fillRect(x+w*0.4, y+h*0.1, w*0.2, h*0.8);
      ctx.fillRect(x+w*0.1, y+h*0.35, w*0.8, h*0.3);
    }
  },
});

function _mcBuilding(isNight) {
  const c = isNight ? '#060408' : '#0a060e';
  return `
    <div style="position:absolute;top:5%;left:8%;width:55%;height:60%;
      background:${c};opacity:0.92;">
      <!-- Windows grid -->
      ${Array.from({length:6},(_,i)=>`
        <div style="position:absolute;
          left:${8+i%3*30}%;top:${10+Math.floor(i/3)*40}%;
          width:18%;height:22%;
          background:${isNight?'rgba(180,0,0,0.08)':'rgba(100,60,120,0.06)'};
          border:1px solid rgba(60,40,80,0.2);"></div>`).join('')}
      <!-- Roof cross -->
      <div style="position:absolute;top:-8px;left:40%;width:4px;height:20px;background:${isNight?'rgba(200,20,20,0.4)':'rgba(160,10,10,0.25)'};"></div>
      <div style="position:absolute;top:-2px;left:34%;width:16px;height:4px;background:${isNight?'rgba(200,20,20,0.4)':'rgba(160,10,10,0.25)'};"></div>
    </div>`;
}

function _mcCrosses(isNight) {
  return [[68,15],[80,20]].map(([l,t])=>`
    <div style="position:absolute;left:${l}%;top:${t}%;opacity:${isNight?0.4:0.2};">
      <div style="width:3px;height:14px;background:#cc0000;margin:0 auto;"></div>
      <div style="width:10px;height:3px;background:#cc0000;margin-top:-10px;"></div>
    </div>`).join('');
}

function _mcPills(isNight) {
  return [[10,84],[30,86],[58,83],[74,85],[88,84]].map(([l,b])=>`
    <div style="position:absolute;left:${l}%;bottom:${100-b}%;
      width:8px;height:5px;border-radius:40%;
      background:${isNight?'rgba(160,140,200,0.5)':'rgba(120,100,160,0.4)'};
      animation:node-mc-pill-roll 4s ease-in-out infinite;
      animation-delay:${l*0.04}s;"></div>`).join('');
}

function _mcTiles(isNight) {
  return Array.from({length:8},(_,i)=>`
    <div style="position:absolute;bottom:18%;left:${i*12+2}%;
      width:${8+i%3}px;height:${6+i%2}px;
      background:${isNight?'rgba(10,6,14,0.6)':'rgba(14,10,18,0.5)'};
      border:1px solid rgba(30,20,40,0.3);"></div>`).join('');
}

function _mcRng(s){ let r=(s|0)||11; return ()=>{r=(r*16807)%2147483647;return(r-1)/2147483646;}; }
