// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — NodeMilCache.js
// 🎖️ Military chip + circuit_board nodes — hardened military compound
// Exclusive monster: WARLORD SENTINEL (armoured exo-trooper)
// ═══════════════════════════════════════════════════════════════

NodeRegistry.register({
  keys: ['military_chip'],

  exclusiveMonster: {
    id: 'warlord_sentinel',
    name: 'Warlord Sentinel',
    emoji: '💀',
    baseStrength: 70,
    strength: 70,
    loot: ['military_chip', 'electronics', 'circuit_board', 'medicine'],
    desc: 'A surviving soldier in jury-rigged powered armour. The hardest fight in the wasteland.',
  },

  sceneHTML(loc, isNight) {
    const sky = isNight ? '#01020a' : '#03040c';
    return `
      <div class="node-scene node-milcache" style="
        position:absolute;inset:0;overflow:hidden;
        background:linear-gradient(180deg,${sky} 0%,#03050a 55%,#020304 100%);">

        <!-- Bunker/compound wall -->
        ${_milWall(isNight)}

        <!-- Guard tower -->
        ${_milTower(isNight)}

        <!-- Barbed wire fence line -->
        ${_milBarbWire(isNight)}

        <!-- Warning lights (amber) -->
        ${_milWarningLights(isNight)}

        <!-- Military camo netting -->
        ${_milCamo(isNight)}

        <!-- Ground — cracked tarmac -->
        <div style="position:absolute;bottom:0;left:0;right:0;height:20%;
          background:#020304;border-top:1px solid #080b10;"></div>
        ${_milCracks(isNight)}

        ${isNight ? '<div style="position:absolute;inset:0;background:rgba(0,1,3,0.55);"></div>' : ''}
      </div>
      <style>
        @keyframes node-mil-warn {
          0%,100%{opacity:0.2;} 50%{opacity:0.9;}
        }
        @keyframes node-mil-sweep {
          0%{transform:rotate(-30deg);opacity:0.3;}
          50%{transform:rotate(30deg);opacity:0.6;}
          100%{transform:rotate(-30deg);opacity:0.3;}
        }
      </style>
    `;
  },

  arenaHTML(loc, animal, isNight) {
    return `
      <div style="position:absolute;inset:0;overflow:hidden;background:#020308;">
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          <!-- Bunker concrete walls -->
          <rect x="0" y="0" width="12%" height="100%" fill="#030508" opacity="0.95"/>
          <rect x="88%" y="0" width="12%" height="100%" fill="#030508" opacity="0.95"/>
          <!-- Ceiling reinforcement beams -->
          <rect x="0" y="0" width="100%" height="6%" fill="#040608" opacity="0.9"/>
          ${Array.from({length:5},(_,i)=>
            `<rect x="${i*22}%" y="0" width="3%" height="20%"
               fill="#030508" opacity="0.7"/>`
          ).join('')}
          <!-- Warning stripe floor -->
          <rect x="12%" y="85%" width="76%" height="4%"
            fill="rgba(180,100,0,0.08)"/>
          <!-- Spotlight cone -->
          <path d="M50%,0 L35%,50% L65%,50% Z"
            fill="rgba(200,180,100,0.04)"/>
          <!-- Ground reflection -->
          <ellipse cx="50%" cy="90%" rx="42%" ry="5%"
            fill="rgba(10,15,25,0.4)"/>
        </svg>
        <!-- Amber warning strobe -->
        <div style="position:absolute;top:4%;left:5%;
          width:8px;height:8px;border-radius:50%;
          background:rgba(200,120,0,0.7);
          box-shadow:0 0 12px rgba(220,140,0,0.5);
          animation:node-mil-warn 0.9s ease-in-out infinite;"></div>
        <div style="position:absolute;top:4%;right:5%;
          width:8px;height:8px;border-radius:50%;
          background:rgba(200,120,0,0.7);
          box-shadow:0 0 12px rgba(220,140,0,0.5);
          animation:node-mil-warn 0.9s ease-in-out infinite;
          animation-delay:0.45s;"></div>
      </div>
    `;
  },

  drawOverlay(ctx, x, y, w, h, seed) {
    const rng = _milRng(seed);
    // Dark camo blotches
    const cols = [
      'rgba(15,20,10,0.8)', 'rgba(20,25,12,0.7)', 'rgba(10,15,8,0.8)'
    ];
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = cols[i % cols.length];
      ctx.beginPath();
      ctx.arc(x + rng()*w, y + rng()*h, 3 + rng()*4, 0, Math.PI*2);
      ctx.fill();
    }
    // Barbed wire hint (horizontal scratch)
    ctx.strokeStyle = 'rgba(60,55,40,0.4)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y + h*0.5);
    ctx.lineTo(x + w, y + h*0.5);
    ctx.stroke();
    // Warning amber dot
    if (rng() > 0.7) {
      ctx.fillStyle = 'rgba(180,100,0,0.4)';
      ctx.beginPath();
      ctx.arc(x+rng()*w, y+rng()*h, 1.5, 0, Math.PI*2);
      ctx.fill();
    }
  },
});

function _milWall(isNight) {
  const c = isNight ? '#03050a' : '#04070c';
  return `
    <div style="position:absolute;top:10%;left:0;right:0;height:50%;
      background:${c};opacity:0.95;">
      <!-- Embrasures (shooting slits) -->
      ${Array.from({length:5},(_,i)=>`
        <div style="position:absolute;top:20%;left:${8+i*20}%;
          width:4px;height:14px;background:rgba(0,0,0,0.8);"></div>`).join('')}
    </div>`;
}

function _milTower(isNight) {
  const c = isNight ? '#020408' : '#030608';
  return `
    <div style="position:absolute;top:0%;right:10%;width:20px;height:65%;
      background:${c};opacity:0.9;">
      <!-- Platform -->
      <div style="position:absolute;top:-4px;left:-6px;right:-6px;height:8px;
        background:${c};"></div>
      <!-- Searchlight beam -->
      <div style="position:absolute;top:4px;left:2px;
        width:0;height:0;
        border-left:8px solid transparent;border-right:8px solid transparent;
        border-top:40px solid rgba(200,180,100,0.06);
        transform-origin:top center;
        animation:node-mil-sweep 5s ease-in-out infinite;"></div>
    </div>`;
}

function _milBarbWire(isNight) {
  return `
    <div style="position:absolute;bottom:22%;left:0;right:0;height:4px;
      background:repeating-linear-gradient(90deg,
        rgba(80,70,40,0.4) 0px,rgba(80,70,40,0.4) 4px,
        transparent 4px,transparent 8px);"></div>
    <div style="position:absolute;bottom:22%;left:0;right:0;height:2px;
      background:rgba(60,55,30,0.3);"></div>`;
}

function _milWarningLights(isNight) {
  return [15,45,75].map(l=>`
    <div style="position:absolute;top:8%;left:${l}%;
      width:8px;height:8px;border-radius:50%;
      background:rgba(180,${isNight?100:60},0,0.6);
      box-shadow:0 0 ${isNight?12:5}px rgba(200,120,0,0.4);
      animation:node-mil-warn ${0.8+l*0.01}s ease-in-out infinite;
      animation-delay:${l*0.04}s;"></div>`).join('');
}

function _milCamo(isNight) {
  return `
    <div style="position:absolute;top:10%;left:0;right:0;height:50%;
      background:repeating-linear-gradient(
        60deg,
        transparent 0px, transparent 8px,
        rgba(${isNight?'5,8,3':'8,12,5'},0.15) 8px,
        rgba(${isNight?'5,8,3':'8,12,5'},0.15) 10px
      );pointer-events:none;"></div>`;
}

function _milCracks(isNight) {
  return [[10,18],[35,17],[60,19],[80,18]].map(([l,b])=>`
    <div style="position:absolute;left:${l}%;bottom:${100-b}%;
      width:${12+l%5}px;height:1px;
      background:${isNight?'rgba(15,20,30,0.6)':'rgba(20,25,35,0.5)'};
      transform:rotate(${l%3*5-4}deg);"></div>`).join('');
}

function _milRng(s){ let r=(s|0)||59; return ()=>{r=(r*16807)%2147483647;return(r-1)/2147483646;}; }
