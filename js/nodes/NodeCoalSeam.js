// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — NodeCoalSeam.js
// ⛏️ Coal resource node — deep underground seam with toxic gas
// Exclusive monster: CAVE STALKER (eyeless mutant bat-thing)
// ═══════════════════════════════════════════════════════════════

NodeRegistry.register({
  keys: ['coal'],

  exclusiveMonster: {
    id: 'cave_stalker',
    name: 'Cave Stalker',
    emoji: '🦇',
    baseStrength: 30,
    strength: 30,
    loot: ['coal', 'cave_crystal', 'chemicals'],
    desc: 'Blind, shrieking and wickedly fast — evolved to hunt in total darkness.',
  },

  sceneHTML(loc, isNight) {
    return `
      <div class="node-scene node-coalseam" style="
        position:absolute;inset:0;overflow:hidden;
        background:linear-gradient(180deg,#020204 0%,#040408 50%,#010102 100%);">

        <!-- Stalactite ceiling -->
        ${_csStalagtites()}

        <!-- Coal vein glints on walls -->
        ${_csCoalVeins()}

        <!-- Crystal glow pockets (cave_crystal) -->
        ${_csCrystals()}

        <!-- Toxic gas wisps -->
        ${_csGasWisps()}

        <!-- Ground rubble -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:18%;
          background:#020202;border-top:1px solid #0d0d10;"></div>
        ${_csRubble()}

        <!-- Headlamp beam (player riding in) -->
        <div style="position:absolute;bottom:25%;left:38%;
          width:0;height:0;
          border-left:40px solid transparent;
          border-right:40px solid transparent;
          border-bottom:80px solid rgba(220,200,120,0.07);
          transform:rotate(180deg);"></div>
      </div>
      <style>
        @keyframes node-cs-crystal-pulse {
          0%,100%{opacity:0.5;} 50%{opacity:0.9;}
        }
        @keyframes node-cs-gas-drift {
          0%{opacity:0;transform:translate(0,0);}
          30%{opacity:0.4;}
          100%{opacity:0;transform:translate(20px,-30px);}
        }
        @keyframes node-cs-drip {
          0%{transform:scaleY(0);opacity:1;}
          80%{transform:scaleY(1);opacity:0.8;}
          100%{transform:scaleY(1);opacity:0;}
        }
      </style>
    `;
  },

  arenaHTML(loc, animal, isNight) {
    return `
      <div style="position:absolute;inset:0;overflow:hidden;background:#010103;">
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          <!-- Cave ceiling arc -->
          <path d="M0,35% Q50%,-5% 100%,35%" fill="#020204" opacity="0.95"/>
          <!-- Hanging stalactites in arena -->
          ${[10,25,50,70,88].map(x=>`
            <polygon points="${x}%,0 ${x+3}%,0 ${x+1.5}%,${15+Math.sin(x)*5}%"
              fill="#030306" opacity="0.9"/>
          `).join('')}
          <!-- Crystal glints -->
          ${[20,60,82].map(x=>`
            <circle cx="${x}%" cy="${20+Math.cos(x)*5}%" r="3"
              fill="rgba(100,80,200,0.3)"/>
          `).join('')}
          <!-- Ground crack -->
          <path d="M30%,88% Q50%,84% 70%,88%" fill="none"
            stroke="rgba(80,60,180,0.2)" stroke-width="2"/>
          <!-- Gas glow -->
          <ellipse cx="50%" cy="87%" rx="35%" ry="6%"
            fill="rgba(40,30,80,0.18)"/>
        </svg>
      </div>
    `;
  },

  drawOverlay(ctx, x, y, w, h, seed) {
    const rng = _csRng(seed);
    // Dark coal blocks with shimmer
    ctx.fillStyle = `rgba(8,8,12,0.85)`;
    ctx.fillRect(x + rng()*w*0.3, y + rng()*h*0.3, w*0.4 + rng()*w*0.3, h*0.4 + rng()*h*0.3);
    // Crystal glint
    if (rng() > 0.5) {
      ctx.fillStyle = `rgba(${60+rng()*60|0},${50+rng()*40|0},${150+rng()*80|0},0.5)`;
      ctx.beginPath();
      ctx.arc(x + rng()*w, y + rng()*h, 1.5 + rng()*2, 0, Math.PI*2);
      ctx.fill();
    }
  },
});

function _csStalagtites() {
  return Array.from({length:10},(_,i)=>{
    const left = i*10 + Math.sin(i*1.8)*4;
    const len  = 15 + Math.cos(i*2.1)*8;
    return `<div style="position:absolute;top:0;left:${left}%;
      width:${6+i%3*2}px;height:${len}%;
      background:#030308;
      clip-path:polygon(0 0,100% 0,50% 100%);opacity:0.95;"></div>
    ${(i%3===0)?`<div style="position:absolute;top:${len-1}%;left:${left+0.5}%;
      width:2px;height:3%;background:rgba(0,0,0,0.8);
      animation:node-cs-drip 4s ease-in infinite;animation-delay:${i*0.8}s;"></div>`:''}`;
  }).join('');
}

function _csCoalVeins() {
  return [[0,30,60],[2,55,70],[95,20,65],[92,50,55]].map(([left,top,h])=>`
    <div style="position:absolute;left:${left}%;top:${top}%;
      width:8px;height:${h}px;
      background:linear-gradient(180deg,#020204,#060610,#020204);
      opacity:0.9;"></div>`).join('');
}

function _csCrystals() {
  return [[15,35],[40,28],[68,32],[85,38]].map(([l,t])=>`
    <div style="position:absolute;left:${l}%;top:${t}%;
      width:6px;height:10px;
      background:rgba(80,60,160,0.4);
      clip-path:polygon(50% 0%,100% 60%,50% 100%,0% 60%);
      box-shadow:0 0 8px rgba(100,80,200,0.5);
      animation:node-cs-crystal-pulse ${2+l*0.03}s ease-in-out infinite;
      animation-delay:${l*0.05}s;"></div>`).join('');
}

function _csGasWisps() {
  return Array.from({length:5},(_,i)=>`
    <div style="position:absolute;
      left:${10+i*18}%;bottom:${15+i%3*5}%;
      width:12px;height:12px;border-radius:50%;
      background:rgba(30,20,60,0.35);
      filter:blur(3px);
      animation:node-cs-gas-drift ${3+i*0.5}s ease-out infinite;
      animation-delay:${i*0.7}s;"></div>`).join('');
}

function _csRubble() {
  return [[5,16],[22,17],[50,15],[70,17],[88,16]].map(([l,b])=>`
    <div style="position:absolute;left:${l}%;bottom:${100-b}%;
      width:${8+l%5}px;height:${4+l%3}px;
      background:#030306;border-radius:2px;opacity:0.9;"></div>`).join('');
}

function _csRng(s){ let r=(s|0)||31; return ()=>{r=(r*16807)%2147483647;return(r-1)/2147483646;}; }
