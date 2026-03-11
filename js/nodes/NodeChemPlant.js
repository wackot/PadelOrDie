// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — NodeChemPlant.js
// ⚗️ Chemicals resource node — derelict toxic processing plant
// Exclusive monster: ACID DREG (dissolved-flesh zombie)
// ═══════════════════════════════════════════════════════════════

NodeRegistry.register({
  keys: ['chemicals'],

  exclusiveMonster: {
    id: 'acid_dreg',
    name: 'Acid Dreg',
    emoji: '☣️',
    baseStrength: 40,
    strength: 40,
    loot: ['chemicals', 'medicine', 'circuit_board'],
    desc: 'A human corroded by chemical exposure — touch it and you burn.',
  },

  sceneHTML(loc, isNight) {
    const sky = isNight ? '#030408' : '#080d12';
    return `
      <div class="node-scene node-chemplant" style="
        position:absolute;inset:0;overflow:hidden;
        background:linear-gradient(180deg,${sky} 0%,#060810 55%,#040508 100%);">

        <!-- Cooling towers silhouette -->
        ${_cpTowers(isNight)}

        <!-- Pipe network -->
        ${_cpPipes(isNight)}

        <!-- Toxic gas clouds venting -->
        ${_cpSmoke(isNight)}

        <!-- Warning chevrons on floor -->
        ${_cpChevrons()}

        <!-- Glowing chemical spill pools -->
        ${_cpSpills(isNight)}

        <!-- Ground -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:20%;
          background:#040508;border-top:1px solid #0d1018;"></div>

        ${isNight ? '<div style="position:absolute;inset:0;background:rgba(1,2,5,0.5);"></div>' : ''}
      </div>
      <style>
        @keyframes node-cp-smoke {
          0%{opacity:0;transform:translateY(0) scaleX(1);}
          30%{opacity:0.5;}
          100%{opacity:0;transform:translateY(-40px) scaleX(1.6);}
        }
        @keyframes node-cp-spill-pulse {
          0%,100%{opacity:0.3;} 50%{opacity:0.6;}
        }
      </style>
    `;
  },

  arenaHTML(loc, animal, isNight) {
    return `
      <div style="position:absolute;inset:0;overflow:hidden;background:#040508;">
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          <!-- Tank silhouettes -->
          <ellipse cx="12%" cy="45%" rx="8%" ry="20%" fill="#060810" opacity="0.9"/>
          <ellipse cx="88%" cy="48%" rx="9%" ry="22%" fill="#060810" opacity="0.9"/>
          <!-- Horizontal pipes -->
          <rect x="20%" y="42%" width="60%" height="3%" fill="#050710" opacity="0.8"/>
          <rect x="15%" y="55%" width="70%" height="2%" fill="#050710" opacity="0.6"/>
          <!-- Acid puddle glow on ground -->
          <ellipse cx="50%" cy="89%" rx="42%" ry="7%"
            fill="rgba(20,180,20,0.08)"/>
          <ellipse cx="30%" cy="87%" rx="12%" ry="3%"
            fill="rgba(40,200,10,0.1)"/>
        </svg>
        <!-- Dripping acid strands -->
        ${Array.from({length:5},(_,i)=>`
          <div style="position:absolute;top:0;left:${18+i*16}%;
            width:2px;height:${15+i*5}%;
            background:linear-gradient(180deg,transparent,rgba(40,180,20,0.4),transparent);
            animation:node-cp-smoke ${2+i*0.3}s ease-in-out infinite;
            animation-delay:${i*0.4}s;"></div>`).join('')}
      </div>
    `;
  },

  drawOverlay(ctx, x, y, w, h, seed) {
    const rng = _cpRng(seed);
    // Dark blue-grey industrial blocks
    ctx.fillStyle = `rgba(${10+rng()*10|0},${12+rng()*10|0},${20+rng()*15|0},0.8)`;
    ctx.fillRect(x + rng()*w*0.2, y + rng()*h*0.2, w*0.6, h*0.6);
    // Toxic spill dot
    if (rng() > 0.4) {
      ctx.fillStyle = `rgba(20,${120+rng()*80|0},10,0.3)`;
      ctx.beginPath();
      ctx.arc(x + rng()*w, y + rng()*h, 2 + rng()*3, 0, Math.PI*2);
      ctx.fill();
    }
  },
});

function _cpTowers(isNight) {
  const col = isNight ? '#04060c' : '#06090e';
  return `
    <div style="position:absolute;top:2%;left:5%;width:30px;height:60%;
      background:${col};border-radius:4px 4px 0 0;opacity:0.9;">
      <div style="position:absolute;top:0;left:0;right:0;height:20px;
        border-radius:50% 50% 0 0;background:${col};"></div>
    </div>
    <div style="position:absolute;top:5%;left:12%;width:22px;height:50%;
      background:${col};border-radius:4px 4px 0 0;opacity:0.85;"></div>
    <div style="position:absolute;top:0%;right:8%;width:28px;height:65%;
      background:${col};border-radius:4px 4px 0 0;opacity:0.9;"></div>`;
}

function _cpPipes(isNight) {
  const col = isNight ? '#050810' : '#080c14';
  return `
    <div style="position:absolute;top:35%;left:0;right:0;height:4px;background:${col};opacity:0.8;"></div>
    <div style="position:absolute;top:50%;left:10%;right:15%;height:3px;background:${col};opacity:0.7;"></div>
    <div style="position:absolute;top:30%;left:20%;width:3px;height:25%;background:${col};opacity:0.75;"></div>
    <div style="position:absolute;top:28%;right:20%;width:3px;height:28%;background:${col};opacity:0.75;"></div>`;
}

function _cpSmoke(isNight) {
  return [[8,0],[14,2],[88,0],[38,1]].map(([l,delay],i)=>`
    <div style="position:absolute;top:2%;left:${l}%;
      width:${14+i*4}px;height:${18+i*6}px;border-radius:50%;
      background:rgba(${isNight?'15,20,30':'20,28,40'},0.5);
      filter:blur(4px);
      animation:node-cp-smoke ${2.5+i*0.4}s ease-out infinite;
      animation-delay:${delay+i*0.5}s;"></div>`).join('');
}

function _cpChevrons() {
  return Array.from({length:4},(_,i)=>`
    <div style="position:absolute;bottom:18%;left:${10+i*22}%;
      width:16px;height:10px;
      background:repeating-linear-gradient(
        45deg,rgba(180,120,0,0.15) 0px,rgba(180,120,0,0.15) 3px,
        transparent 3px,transparent 6px);
      border:1px solid rgba(180,120,0,0.1);"></div>`).join('');
}

function _cpSpills(isNight) {
  return [[20,85],[55,87],[78,84]].map(([l,b])=>`
    <div style="position:absolute;left:${l}%;bottom:${100-b}%;
      width:30px;height:8px;border-radius:50%;
      background:rgba(20,${isNight?160:100},10,0.2);
      box-shadow:0 0 ${isNight?10:4}px rgba(20,180,10,0.2);
      animation:node-cp-spill-pulse 3s ease-in-out infinite;
      animation-delay:${l*0.04}s;"></div>`).join('');
}

function _cpRng(s){ let r=(s|0)||53; return ()=>{r=(r*16807)%2147483647;return(r-1)/2147483646;}; }
