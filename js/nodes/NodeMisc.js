// ═══════════════════════════════════════════════════════════════
// PEDAL OR DIE — NodeMisc.js
// Covers: 🪢 rope, 🧵 cloth, ⛽ gasoline — smaller resource nodes
// Each has a distinct but lightweight scene and exclusive monster.
// ═══════════════════════════════════════════════════════════════

// ── ROPE — Overgrown lot / hardware ruins ───────────────────────
NodeRegistry.register({
  keys: ['rope'],
  exclusiveMonster: {
    id: 'swarm_insect',
    name: 'Insect Swarm',
    emoji: '🪲',
    baseStrength: 14,
    strength: 14,
    loot: ['rope', 'wild_seeds'],
    desc: 'A seething cloud of mutant beetles — individually harmless, collectively terrifying.',
  },
  sceneHTML(loc, isNight) {
    const sky = isNight ? '#020501' : '#0a1004';
    return `
      <div class="node-scene node-rope" style="
        position:absolute;inset:0;overflow:hidden;
        background:linear-gradient(180deg,${sky} 0%,#0c1406 55%,#080e04 100%);">
        <!-- Overgrown fence posts with dangling rope -->
        ${[8,24,42,60,76,90].map((l,i)=>`
          <div style="position:absolute;bottom:18%;left:${l}%;
            width:5px;height:${35+i%3*10}%;
            background:${isNight?'#080d04':'#0e1808'};opacity:0.9;">
            <div style="position:absolute;top:40%;left:50%;
              width:1px;height:30%;
              background:rgba(${isNight?'60,50,20':'90,75,30'},0.5);
              transform:rotate(${(i%2)*8-4}deg);transform-origin:top;"></div>
          </div>`).join('')}
        <!-- Ground weeds -->
        ${Array.from({length:8},(_,i)=>`
          <div style="position:absolute;bottom:18%;left:${i*12+2}%;
            width:2px;height:${10+i%4*5}%;
            background:${isNight?'#0a1006':'#121e08'};
            transform:rotate(${(i%3-1)*6}deg);transform-origin:bottom;"></div>`).join('')}
        <div style="position:absolute;bottom:0;left:0;right:0;height:20%;
          background:#070c04;border-top:1px solid #111a07;"></div>
        ${isNight ? '<div style="position:absolute;inset:0;background:rgba(1,2,0,0.5);"></div>' : ''}
      </div>`;
  },
  arenaHTML(loc, animal, isNight) {
    return `
      <div style="position:absolute;inset:0;overflow:hidden;background:${isNight?'#01040a':'#080e04'};">
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          ${[10,30,65,85].map(x=>`
            <line x1="${x}%" y1="0" x2="${x+2}%" y2="100%"
              stroke="${isNight?'#080d04':'#0e1808'}" stroke-width="5" opacity="0.8"/>`).join('')}
          <ellipse cx="50%" cy="90%" rx="40%" ry="7%" fill="rgba(12,20,6,0.5)"/>
        </svg>
      </div>`;
  },
  drawOverlay(ctx, x, y, w, h, seed) {
    const rng = _miscRng(seed+1);
    ctx.strokeStyle = `rgba(${50+rng()*30|0},${70+rng()*30|0},${15+rng()*10|0},0.5)`;
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(x+rng()*w, y+h);
      ctx.bezierCurveTo(x+rng()*w,y+h*0.6,x+rng()*w,y+h*0.3,x+rng()*w,y);
      ctx.stroke();
    }
  },
});

// ── CLOTH — Textile mill ruins ──────────────────────────────────
NodeRegistry.register({
  keys: ['cloth'],
  exclusiveMonster: {
    id: 'wraith_thing',
    name: 'Cloth Wraith',
    emoji: '👻',
    baseStrength: 20,
    strength: 20,
    loot: ['cloth', 'rope', 'medicine'],
    desc: 'Strips of animated, infected fabric that tangle around victims and suffocate them.',
  },
  sceneHTML(loc, isNight) {
    const sky = isNight ? '#080204' : '#140408';
    return `
      <div class="node-scene node-cloth" style="
        position:absolute;inset:0;overflow:hidden;
        background:linear-gradient(180deg,${sky} 0%,#180608 55%,#100406 100%);">
        <!-- Textile mill chimneys -->
        ${[15,35,65].map(l=>`
          <div style="position:absolute;top:0;left:${l}%;
            width:12px;height:50%;background:${isNight?'#0e0406':'#140608'};opacity:0.9;"></div>`).join('')}
        <!-- Hanging fabric strips (unique visual) -->
        ${Array.from({length:8},(_,i)=>`
          <div style="position:absolute;top:10%;left:${5+i*12}%;
            width:6px;height:${25+i%3*10}%;
            background:${['rgba(80,20,20,0.3)','rgba(20,20,60,0.3)','rgba(60,50,10,0.3)'][i%3]};
            animation:node-cf-sway ${2+i*0.3}s ease-in-out infinite;
            animation-delay:${i*0.25}s;transform-origin:top;border-radius:0 0 3px 3px;"></div>`).join('')}
        <div style="position:absolute;bottom:0;left:0;right:0;height:20%;
          background:#0c0406;border-top:1px solid #1a0508;"></div>
        ${isNight ? '<div style="position:absolute;inset:0;background:rgba(3,1,2,0.5);"></div>' : ''}
      </div>`;
  },
  arenaHTML(loc, animal, isNight) {
    return `
      <div style="position:absolute;inset:0;overflow:hidden;background:${isNight?'#05020a':'#0e0408'};">
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          <!-- Hanging fabric strips framing -->
          ${[5,20,75,90].map((x,i)=>
            `<rect x="${x}%" y="0" width="${3+i%2}%" height="${30+i*10}%"
               fill="${['rgba(60,15,15,0.3)','rgba(15,15,50,0.3)','rgba(50,40,10,0.3)','rgba(30,10,30,0.3)'][i]}"
               rx="0" ry="2"/>`
          ).join('')}
          <ellipse cx="50%" cy="90%" rx="40%" ry="6%" fill="rgba(20,5,10,0.5)"/>
        </svg>
      </div>`;
  },
  drawOverlay(ctx, x, y, w, h, seed) {
    const rng = _miscRng(seed+2);
    // Purple-brown textile smear
    ctx.fillStyle = `rgba(${50+rng()*30|0},${10+rng()*15|0},${30+rng()*20|0},0.6)`;
    ctx.fillRect(x+rng()*w*0.3, y+rng()*h*0.3, w*0.5, h*0.5);
  },
});

// ── GASOLINE — Fuel depot ruins ─────────────────────────────────
NodeRegistry.register({
  keys: ['gasoline'],
  exclusiveMonster: {
    id: 'fire_breather',
    name: 'Fire Breather',
    emoji: '🔥',
    baseStrength: 38,
    strength: 38,
    loot: ['gasoline', 'chemicals', 'engine_parts'],
    desc: 'A survivor so soaked in fuel they spontaneously ignite — and they don\'t care.',
  },
  sceneHTML(loc, isNight) {
    const sky = isNight ? '#060200' : '#120500';
    return `
      <div class="node-scene node-gasoline" style="
        position:absolute;inset:0;overflow:hidden;
        background:linear-gradient(180deg,${sky} 0%,#160600 55%,#0e0400 100%);">
        <!-- Fuel storage tanks -->
        ${_gasTanks(isNight)}
        <!-- Fire/embers -->
        ${_gasEmbers(isNight)}
        <!-- Fuel spill glow -->
        ${_gasSpill(isNight)}
        <div style="position:absolute;bottom:0;left:0;right:0;height:20%;
          background:#0c0400;border-top:1px solid #1e0800;"></div>
        ${isNight ? '<div style="position:absolute;inset:0;background:rgba(4,1,0,0.5);"></div>' : ''}
      </div>
      <style>
        @keyframes node-gas-flicker {
          0%,100%{transform:scaleY(1) scaleX(1);opacity:0.7;}
          33%{transform:scaleY(1.2) scaleX(0.85);opacity:0.9;}
          66%{transform:scaleY(0.8) scaleX(1.1);opacity:0.6;}
        }
      </style>`;
  },
  arenaHTML(loc, animal, isNight) {
    return `
      <div style="position:absolute;inset:0;overflow:hidden;background:#0c0300;">
        <svg width="100%" height="100%" style="position:absolute;inset:0;">
          <!-- Tank silhouettes -->
          <ellipse cx="12%" cy="50%" rx="10%" ry="25%" fill="#100500" opacity="0.9"/>
          <ellipse cx="88%" cy="48%" rx="11%" ry="28%" fill="#100500" opacity="0.9"/>
          <!-- Fire glow on ground -->
          <ellipse cx="50%" cy="90%" rx="45%" ry="8%" fill="rgba(180,60,0,0.12)"/>
          <ellipse cx="30%" cy="85%" rx="15%" ry="4%" fill="rgba(200,80,0,0.1)"/>
        </svg>
        <!-- Flame embers -->
        ${Array.from({length:6},(_,i)=>`
          <div style="position:absolute;
            left:${12+i*14}%;bottom:${8+i%3*4}%;
            width:4px;height:${8+i%3*4}px;border-radius:50% 50% 20% 20%;
            background:linear-gradient(180deg,#ffaa00,#ff4400);
            animation:node-gas-flicker ${0.6+i*0.2}s ease-in-out infinite;
            animation-delay:${i*0.15}s;"></div>`).join('')}
      </div>`;
  },
  drawOverlay(ctx, x, y, w, h, seed) {
    const rng = _miscRng(seed+3);
    // Dark orange-brown fuel stain
    ctx.fillStyle = `rgba(${60+rng()*30|0},${20+rng()*15|0},${5+rng()*8|0},0.7)`;
    ctx.beginPath();
    ctx.ellipse(x+w*0.5, y+h*0.6, w*0.4, h*0.35, rng()*Math.PI, 0, Math.PI*2);
    ctx.fill();
    // Flame dot
    if (rng() > 0.6) {
      ctx.fillStyle = 'rgba(200,80,0,0.4)';
      ctx.beginPath(); ctx.arc(x+rng()*w, y+rng()*h, 1.5, 0, Math.PI*2); ctx.fill();
    }
  },
});

function _gasTanks(isNight) {
  const c = isNight ? '#0e0500' : '#160800';
  return [[5,30],[25,40],[60,35],[78,30]].map(([l,h])=>`
    <div style="position:absolute;bottom:18%;left:${l}%;
      width:20px;height:${h}%;
      background:${c};opacity:0.9;border-radius:3px 3px 0 0;">
      <div style="position:absolute;top:0;left:0;right:0;height:6px;
        border-radius:50%;background:${c};"></div>
    </div>`).join('');
}

function _gasEmbers(isNight) {
  return Array.from({length:5},(_,i)=>`
    <div style="position:absolute;
      left:${15+i*16}%;bottom:${20+i%3*3}%;
      width:3px;height:3px;border-radius:50%;
      background:#ff6600;box-shadow:0 0 6px #ff4400;
      animation:node-gas-flicker ${0.8+i*0.25}s ease-in-out infinite;
      animation-delay:${i*0.2}s;"></div>`).join('');
}

function _gasSpill(isNight) {
  return [[12,84],[45,86],[72,83]].map(([l,b])=>`
    <div style="position:absolute;left:${l}%;bottom:${100-b}%;
      width:35px;height:8px;border-radius:50%;
      background:rgba(${isNight?120:80},${isNight?40:25},0,0.2);
      box-shadow:0 0 ${isNight?8:3}px rgba(150,50,0,0.15);"></div>`).join('');
}

function _miscRng(s){ let r=(s|0)||23; return ()=>{r=(r*16807)%2147483647;return(r-1)/2147483646;}; }
